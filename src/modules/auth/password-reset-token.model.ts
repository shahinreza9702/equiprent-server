
import mongoose, { Schema } from "mongoose";

export interface IPasswordResetToken {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
}

const passwordResetTokenSchema =
  new Schema<IPasswordResetToken>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      tokenHash: {
        type: String,
        required: true,
      },
      expiresAt: {
        type: Date,
        required: true,
      },
      usedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
      collection: "passwordResetTokens",
    },
  );

const PasswordResetToken =
  mongoose.model<IPasswordResetToken>(
    "PasswordResetToken",
    passwordResetTokenSchema,
  );

export default PasswordResetToken;
