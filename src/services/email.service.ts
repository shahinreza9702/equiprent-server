
import nodemailer from "nodemailer";

import { env } from "../config/env.js";

// Create reusable SMTP transporter
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

const verifyEmailConnection = async (): Promise<boolean> => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    return false;
  }

  await transporter.verify();

  return true;
};

// Send email
interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<void> => {
  if (
    !env.SMTP_HOST ||
    !env.SMTP_USER ||
    !env.SMTP_PASSWORD ||
    !env.EMAIL_FROM
  ) {
    throw new Error("Email service is not configured");
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
  });
};

export const emailService = {
  sendEmail,
  verifyEmailConnection,
};
