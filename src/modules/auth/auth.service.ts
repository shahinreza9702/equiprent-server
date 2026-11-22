import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "../users/users.model.js";
import RefreshToken from "./refresh-token.model.js";

import ApiError from "../../utils/api-error.js";
import HTTP_STATUS from "../../constants/http-status.js";
import PasswordResetToken from "./password-reset-token.model.js";

import { emailService } from "../../services/email.service.js";

import { passwordResetEmailTemplate } from "./password-reset-email.template.js";
import { env } from "../../config/env.js";

import {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    getRefreshTokenExpiry,
    verifyRefreshToken,
    generatePasswordResetToken,
    hashPasswordResetToken,
    getPasswordResetTokenExpiry,
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


interface ForgotPasswordInput {
    email: string;
}

const forgotPassword = async (
    payload: ForgotPasswordInput,
): Promise<void> => {
    // Find an active account using the normalized email
    const user = await User.findOne({
        email: payload.email,
        status: "active",
    });

    // Do not reveal whether the account exists
    if (!user) {
        return;
    }

    // Invalidate previous unused reset tokens
    await PasswordResetToken.updateMany(
        {
            user: user._id,
            usedAt: null,
        },
        {
            $set: { usedAt: new Date() },
        },
    );

    // Generate a new raw token
    const rawToken = generatePasswordResetToken();

    // Store only the token hash
    await PasswordResetToken.create({
        user: user._id,
        tokenHash: hashPasswordResetToken(rawToken),
        expiresAt: getPasswordResetTokenExpiry(),
    });

    // Build the frontend reset URL
    const resetUrl =
        `${env.CLIENT_URL.replace(/\/+$/, "")}/reset-password` +
        `?token=${encodeURIComponent(rawToken)}`;

    const emailContent = passwordResetEmailTemplate({
        resetUrl,
        expiresInMinutes: 15,
    });

    try {
        await emailService.sendEmail({
            to: user.email,
            subject: "Reset Your EquipRent Password",
            html: emailContent.html,
            text: emailContent.text,
        });
    } catch (error) {
        // Invalidate the token if email delivery fails
        await PasswordResetToken.updateOne(
            {
                user: user._id,
                tokenHash: hashPasswordResetToken(rawToken),
                usedAt: null,
            },
            {
                $set: { usedAt: new Date() },
            },
        );

        // Never log the raw token or reset URL
        console.error("Password reset email delivery failed");
        console.error(
            error instanceof Error ? error.message : "Unknown email error",
        );
    }
};


const logoutUser = async (rawRefreshToken?: string) => {
    // Revoke only the current device's refresh-token session
    if (rawRefreshToken) {
        const tokenHash = hashRefreshToken(rawRefreshToken);

        await RefreshToken.updateOne(
            {
                tokenHash,
                revokedAt: null,
            },
            {
                $set: { revokedAt: new Date() },
            },
        );
    }
};


interface ResetPasswordInput {
    token: string;
    newPassword: string;
}

const resetPassword = async (
    payload: ResetPasswordInput,
): Promise<void> => {
    const tokenHash = hashPasswordResetToken(payload.token);
    const now = new Date();

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            // Find and atomically consume a valid reset token
            const resetToken =
                await PasswordResetToken.findOneAndUpdate(
                    {
                        tokenHash,
                        usedAt: null,
                        expiresAt: { $gt: now },
                    },
                    {
                        $set: { usedAt: now },
                    },
                    {
                        returnDocument: "after",
                        session,
                    },
                );

            if (!resetToken) {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST,
                    "Invalid or expired password reset token",
                );
            }

            // Verify that the account is still active
            const user = await User.findById(
                resetToken.user,
            ).session(session);

            if (!user || user.status !== "active") {
                throw new ApiError(
                    HTTP_STATUS.BAD_REQUEST,
                    "Unable to reset password for this account",
                );
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(
                payload.newPassword,
                12,
            );

            // Update the user's password
            await User.updateOne(
                { _id: user._id },
                {
                    $set: { password: hashedPassword },
                },
                { session },
            );

            // Revoke all active refresh-token sessions
            await RefreshToken.updateMany(
                {
                    user: user._id,
                    revokedAt: null,
                },
                {
                    $set: { revokedAt: now },
                },
                { session },
            );

            // Invalidate all other unused reset tokens
            await PasswordResetToken.updateMany(
                {
                    user: user._id,
                    _id: { $ne: resetToken._id },
                    usedAt: null,
                },
                {
                    $set: { usedAt: now },
                },
                { session },
            );
        });
    } finally {
        await session.endSession();
    }
};


export const authService = {
    loginUser,
    refreshAccessToken,
    logoutUser,
    forgotPassword,
    resetPassword,
};
