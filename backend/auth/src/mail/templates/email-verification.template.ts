import { MailMessage } from '../types/MailMessage';

export function buildEmailVerificationMessage(
  to: string,
  verifyUrl: string,
  expiryHours: number,
  productName: string,
): MailMessage {
  return {
    to,
    subject: `Verify your ${productName} account`,
    html: `
      <p>Welcome to ${productName}! Confirm this address to finish setting up your account.</p>
      <p><a href="${verifyUrl}">Verify my account</a></p>
      <p>This link expires in ${expiryHours} hours. You won't be able to sign in until it's used.</p>
      <p>If you didn't create this account, you can ignore this email.</p>
    `,
    text: `Welcome to ${productName}! Confirm this address to finish setting up your account.

Verify my account: ${verifyUrl}

This link expires in ${expiryHours} hours. You won't be able to sign in until it's used.

If you didn't create this account, you can ignore this email.`,
  };
}
