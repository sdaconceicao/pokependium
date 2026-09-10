import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from 'vitest';
import { MailService } from './mail.service';
import { MailMessage } from './types/MailMessage';

describe('MailService', () => {
  let service: MailService;
  let configService: Mocked<ConfigService>;

  const mockMessage: MailMessage = {
    to: 'trainer@example.com',
    subject: 'Verify your account',
    html: '<p>Verify</p>',
  };

  // Values the service reads; overridden per-test via mockConfig().
  const mockConfig = (overrides: Record<string, unknown> = {}) => {
    const values: Record<string, unknown> = {
      'mail.enabled': true,
      'mail.apiKey': 'test-key',
      'mail.from': 'noreply@example.com',
      ...overrides,
    };
    configService.get.mockImplementation((key: string) => values[key]);
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: { get: vi.fn() } },
      ],
    }).compile();

    service = module.get(MailService);
    configService = module.get(ConfigService);
    // Stubbed rather than spied: an unstubbed fetch would hit the real API.
    vi.stubGlobal('fetch', vi.fn());
    mockConfig();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('short-circuits without calling the API when mail is disabled', async () => {
    mockConfig({ 'mail.enabled': false });

    const result = await service.send(mockMessage);

    expect(result).toEqual({ ok: false, error: 'mail disabled' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts the message and returns the provider id on success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'resend-123' }), { status: 200 }),
    );

    const result = await service.send(mockMessage);

    expect(result).toEqual({ ok: true, id: 'resend-123' });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
    // `text` was not supplied, so it must be absent rather than empty.
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string);
    expect(body).toEqual({
      from: 'noreply@example.com',
      to: 'trainer@example.com',
      subject: 'Verify your account',
      html: '<p>Verify</p>',
    });
  });

  it('returns a coarse error and logs the body when Resend rejects', async () => {
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValue(
      new Response('{"message":"domain not verified"}', { status: 403 }),
    );

    const result = await service.send(mockMessage);

    expect(result).toEqual({ ok: false, error: 'resend responded 403' });
    // Actionable detail belongs in the log, not the returned error.
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('domain not verified'),
    );
  });

  it('does not throw when the transport fails', async () => {
    const logError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNRESET'));

    const result = await service.send(mockMessage);

    expect(result).toEqual({ ok: false, error: 'mail transport failed' });
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('ECONNRESET'),
    );
  });
});
