import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../users/users.model.js";
import RefreshToken from "./refresh-token.model.js";

import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";

import {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    getRefreshTokenExpiry,
    verifyRefreshToken,
} from "./auth.utils.js";

interface LoginInput {
    email: string;
    password: string;
}

const loginUser = async (payload: LoginInput) => {
    // Find user by email and explicitly include password
    const user = await User.findOne({
        email: payload.email,
    }).select("+password");

    // Reject invalid credentials
    if (!user) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Invalid email or password",
        );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
        payload.password,
        user.password,
    );

    if (!isPasswordValid) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Invalid email or password",
        );
    }

    // Reject blocked accounts
    if (user.status !== "active") {
        throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            "Your account has been blocked",
        );
    }

    // Prepare JWT payload
    const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    };

    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const refreshTokenExpiresAt =
        getRefreshTokenExpiry(refreshToken);

    // Store hashed refresh token
    await RefreshToken.create({
        user: user._id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
    });

    // Return authentication data
    return {
        user,
        accessToken,
        refreshToken,
    };
};



const refreshAccessToken = async (rawRefreshToken: string) => {
    if (!rawRefreshToken) {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Refresh token is required",
        );
    }

    // Verify refresh token signature and expiration
    let payload;

    try {
        payload = verifyRefreshToken(rawRefreshToken);
    } catch {
        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Invalid or expired refresh token",
        );
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const session = await mongoose.startSession();

    let transactionResult:
        | {
            type: "reuse";
            userId: mongoose.Types.ObjectId;
        }
        | {
            type: "rotated";
            tokens: {
                accessToken: string;
                refreshToken: string;
            };
        }
        | undefined;

    try {
        transactionResult = await session.withTransaction(async () => {
            const storedToken = await RefreshToken.findOne({
                tokenHash,
            }).session(session);

            if (!storedToken) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    "Invalid refresh token",
                );
            }

            // Verify token ownership
            if (storedToken.user.toString() !== payload.userId) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    "Invalid refresh token",
                );
            }

            // Detect refresh token reuse
            if (storedToken.revokedAt) {
                return {
                    type: "reuse" as const,
                    userId: storedToken.user,
                };
            }

            // Check stored token expiration
            if (storedToken.expiresAt.getTime() <= Date.now()) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    "Refresh token has expired",
                );
            }

            const user = await User.findById(
                payload.userId,
            ).session(session);

            if (!user || user.status !== "active") {
                throw new ApiError(
                    HTTP_STATUS.FORBIDDEN,
                    "Account is unavailable",
                );
            }

            // Atomically revoke the current refresh token
            const revokedToken = await RefreshToken.findOneAndUpdate(
                {
                    _id: storedToken._id,
                    revokedAt: null,
                },
                {
                    $set: { revokedAt: new Date() },
                },
                {
                    returnDocument: "after",
                    session,
                },
            );

            if (!revokedToken) {
                throw new ApiError(
                    HTTP_STATUS.UNAUTHORIZED,
                    "Refresh token has already been used",
                );
            }

            const tokenPayload = {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
            };

            const accessToken = generateAccessToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            // Store the newly generated refresh token
            await RefreshToken.create(
                [
                    {
                        user: user._id,
                        tokenHash: hashRefreshToken(refreshToken),
                        expiresAt: getRefreshTokenExpiry(refreshToken),
                    },
                ],
                { session },
            );

            return {
                type: "rotated" as const,
                tokens: {
                    accessToken,
                    refreshToken,
                },
            };
        });
    } finally {
        await session.endSession();
    }

    if (!transactionResult) {
        throw new ApiError(
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
            "Unable to refresh authentication tokens",
        );
    }


    // Revoke all active sessions OUTSIDE the transaction
    if (transactionResult.type === "reuse") {
        const revocationResult = await RefreshToken.updateMany(
            {
                user: transactionResult.userId,
                revokedAt: null,
            },
            {
                $set: { revokedAt: new Date() },
            },
        );

        console.log("Refresh token reuse detected");
        console.log("Matched active sessions:", revocationResult.matchedCount);
        console.log("Revoked active sessions:", revocationResult.modifiedCount);

        throw new ApiError(
            HTTP_STATUS.UNAUTHORIZED,
            "Refresh token reuse detected. Please log in again",
        );
    }


    return transactionResult.tokens;
};


export const authService = {
    loginUser,
    refreshAccessToken,
};
