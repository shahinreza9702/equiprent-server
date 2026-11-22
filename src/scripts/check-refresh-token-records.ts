
import mongoose from "mongoose";

import { env } from "../config/env.js";

const checkRefreshTokenRecords = async (): Promise<void> => {
    try {
        await mongoose.connect(env.DATABASE_URL, {
            autoIndex: false,
            autoCreate: false,
        });

        const db = mongoose.connection.db;

        if (!db) {
            throw new Error("Database connection is not available");
        }

        // Verify collection exists before inspection
        const collections = await db
            .listCollections({ name: "refreshTokens" })
            .toArray();

        if (collections.length === 0) {
            throw new Error("refreshTokens collection does not exist");
        }

        const collection = db.collection("refreshTokens");

        const userTokenStats = await collection
            .aggregate([
                {
                    $group: {
                        _id: "$user",
                        total: { $sum: 1 },
                        active: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$revokedAt", null] },
                                    1,
                                    0,
                                ],
                            },
                        },
                        revoked: {
                            $sum: {
                                $cond: [
                                    { $type: "$revokedAt" },
                                    1,
                                    0,
                                ],
                            },
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        total: 1,
                        active: 1,
                        revoked: 1,
                    },
                },
            ])
            .toArray();

        console.log("User-wise refresh token statistics:");
        userTokenStats.forEach((stats, index) => {
            console.log(`User group ${index + 1}:`, stats);
        });

        const totalRecords = await collection.countDocuments();
        const activeRecords = await collection.countDocuments({
            revokedAt: null,
        });
        const revokedRecords = await collection.countDocuments({
            revokedAt: { $type: "date" },
        });

        console.log(`Total refresh token records: ${totalRecords}`);
        console.log(`Active refresh tokens: ${activeRecords}`);
        console.log(`Revoked refresh tokens: ${revokedRecords}`);

        const latestRecord = await collection.findOne(
            {},
            {
                sort: { createdAt: -1 },
                projection: {
                    tokenHash: 1,
                    expiresAt: 1,
                    revokedAt: 1,
                },
            },
        );

        if (latestRecord) {
            const tokenHash =
                typeof latestRecord.tokenHash === "string"
                    ? latestRecord.tokenHash
                    : "";

            console.log("Latest record found:", true);
            console.log(
                "SHA-256 hash format:",
                /^[a-f0-9]{64}$/.test(tokenHash),
            );
            console.log(
                "Expiry date exists:",
                latestRecord.expiresAt instanceof Date,
            );
            console.log(
                "Latest record revoked:",
                latestRecord.revokedAt instanceof Date,
            );
        } else {
            console.log("Latest record found:", false);
        }
    } catch (error) {
        console.error("Refresh token verification failed:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

void checkRefreshTokenRecords();
