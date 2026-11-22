
interface PasswordResetEmailInput {
  resetUrl: string;
  expiresInMinutes: number;
}

export const passwordResetEmailTemplate = ({
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailInput) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Your EquipRent Password</title>
      </head>
      <body style="margin:0;padding:24px;background-color:#f4f5f7;font-family:Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:32px;background-color:#ffffff;border-radius:12px;">
          <h1 style="color:#111827;font-size:24px;">
            Reset Your Password
          </h1>

          <p style="color:#4b5563;line-height:1.7;">
            We received a request to reset your EquipRent account password.
          </p>

          <p style="color:#4b5563;line-height:1.7;">
            Click the button below to choose a new password.
          </p>

          <div style="margin:28px 0;">
            <a
              href="${resetUrl}"
              style="display:inline-block;padding:14px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;"
            >
              Reset Password
            </a>
          </div>

          <p style="color:#6b7280;line-height:1.7;">
            This link will expire in ${expiresInMinutes} minutes.
          </p>

          <p style="color:#6b7280;line-height:1.7;">
            If you did not request a password reset, you can safely ignore this email.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

          <p style="color:#9ca3af;font-size:12px;">
            EquipRent Security Team
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Reset Your EquipRent Password

We received a request to reset your EquipRent account password.

Open this link to choose a new password:
${resetUrl}

This link will expire in ${expiresInMinutes} minutes.

If you did not request a password reset, you can safely ignore this email.

EquipRent Security Team
  `.trim();

  return {
    html,
    text,
  };
};
