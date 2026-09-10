import { registerAs } from '@nestjs/config';

export interface MailConfig {
  apiKey: string;
  from: string;
  enabled: boolean;
}

export default registerAs<MailConfig>('mail', () => ({
  apiKey: process.env.RESEND_API_KEY || '',
  // Resend's shared sender works until a domain is verified, at which point
  // MAIL_FROM should move to an address on that domain.
  from: process.env.MAIL_FROM || 'onboarding@resend.dev',
  // Requires an explicit opt-out *and* a key, so an unconfigured environment
  // (local, CI, test) can never reach the network by accident.
  enabled: process.env.MAIL_ENABLED !== 'false' && !!process.env.RESEND_API_KEY,
}));
