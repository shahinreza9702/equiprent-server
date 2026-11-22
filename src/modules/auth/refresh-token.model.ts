
import mongoose, { Schema } from "mongoose";

export interface IRefreshToken {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "refreshTokens",
  },
);

const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  refreshTokenSchema,
);

export default RefreshToken;
