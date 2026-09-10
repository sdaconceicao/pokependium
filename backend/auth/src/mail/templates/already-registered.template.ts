import { MailMessage } from '../types/MailMessage';

export function buildAlreadyRegisteredMessage(
  to: string,
  productName: string,
): MailMessage {
  return {
    to,
    subject: `You already have a ${productName} account`,
    html: `
      <p>Someone just tried to sign up for a ${productName} account with this email address — but you already have one.</p>
      <p>If that was you, sign in as usual. If you've forgotten your password, request a reset from the sign-in screen.</p>
      <p>If it wasn't you, no action is needed. Your account is unchanged.</p>
    `,
    text: `Someone just tried to sign up for a ${productName} account with this email address — but you already have one.

If that was you, sign in as usual. If you've forgotten your password, request a reset from the sign-in screen.

If it wasn't you, no action is needed. Your account is unchanged.`,
  };
}
