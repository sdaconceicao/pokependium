import { MailMessage } from '../types/MailMessage';

export function buildPasswordResetMessage(
  to: string,
  resetUrl: string,
  expiryMinutes: number,
  productName: string,
): MailMessage {
  return {
    to,
    subject: `Reset your ${productName} password`,
    html: `
      <p>We received a request to reset your ${productName} password.</p>
      <p><a href="${resetUrl}">Choose a new password</a></p>
      <p>This link expires in ${expiryMinutes} minutes and can only be used once.</p>
      <p>If you didn't request this, no action is needed — your password is unchanged.</p>
    `,
    text: `We received a request to reset your ${productName} password.

Choose a new password: ${resetUrl}

This link expires in ${expiryMinutes} minutes and can only be used once.

If you didn't request this, no action is needed — your password is unchanged.`,
  };
}
