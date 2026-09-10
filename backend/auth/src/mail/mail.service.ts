import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailMessage } from './types/MailMessage';
import { MailResult } from './types/MailResult';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Sends a transactional email. Never throws — transport failures are logged
   * here and returned as `{ ok: false, error }`, so callers can keep their
   * response shape stable (password reset must not reveal whether an account
   * exists).
   */
  async send(message: MailMessage): Promise<MailResult> {
    if (!this.configService.get<boolean>('mail.enabled')) {
      this.logger.warn(
        `Mail disabled; skipping "${message.subject}" to ${message.to}`,
      );
      return { ok: false, error: 'mail disabled' };
    }

    try {
      const response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('mail.apiKey')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.configService.get<string>('mail.from'),
          to: message.to,
          subject: message.subject,
          html: message.html,
          ...(message.text ? { text: message.text } : {}),
        }),
      });

      const body = await response.text();
      if (!response.ok) {
        // Body, not just status: Resend returns the actionable reason
        // (unverified domain, invalid recipient) only in the payload.
        this.logger.error(
          `Resend rejected mail to ${message.to}: ${response.status} ${body}`,
        );
        return { ok: false, error: `resend responded ${response.status}` };
      }

      return { ok: true, id: (JSON.parse(body) as { id?: string }).id };
    } catch (error) {
      // Network-level failure or malformed success body. Callers must not be
      // able to distinguish these from a delivered send.
      this.logger.error(
        `Mail transport failed for ${message.to}: ${(error as Error).message}`,
      );
      return { ok: false, error: 'mail transport failed' };
    }
  }
}
