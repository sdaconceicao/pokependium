import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
import { MailService } from '../mail/mail.service';
import { UserEntity } from '../users/users.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RegisterRequestDto } from './dtos/register-request.dto';

// Mock bcrypt module
vi.mock('bcrypt', () => ({
  compareSync: vi.fn(),
  hash: vi.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: Mocked<UsersService>;
  let jwtService: Mocked<JwtService>;
  let configService: Mocked<ConfigService>;
  let mailService: Mocked<MailService>;

  const mockUser: UserEntity = {
    id: 'user-123',
    username: 'test@example.com',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: '',
    lastName: '',
    emailVerified: true,
    failedPasswordAttempts: 0,
    passwordLockedUntil: null,
  };

  const SUBMITTED = {
    message: 'Check your email — we have sent you a message with next steps',
  };

  const mockRegisterDto: RegisterRequestDto = {
    email: 'john@example.com',
    password: 'password123',
  };

  const ALLOWED_ORIGINS =
    'http://localhost:3010,https://pokedex-frontend-*.vercel.app';
  const PREVIEW_ORIGIN =
    'https://pokedex-frontend-git-feat-password-reset-code-x.vercel.app';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOneByEmail: vi.fn(),
            create: vi.fn(),
            findOneById: vi.fn(),
            update: vi.fn(),
            recordFailedPasswordAttempt: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
            verifyAsync: vi.fn(),
            decode: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn(),
            get: vi.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            send: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    mailService = module.get(MailService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * ALLOWED_ORIGINS is read through the same get() as the token TTLs, so the
   * mock has to answer per key rather than returning one value for all of them.
   */
  const mockConfigGet = (ttl: string | undefined) =>
    configService.get.mockImplementation(
      (key: string) =>
        (key === 'ALLOWED_ORIGINS' ? ALLOWED_ORIGINS : ttl) as never,
    );

  describe('validateUser', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('lockout', () => {
      const NOW = new Date('2026-08-27T12:00:00.000Z');

      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('refuses a locked account without checking the password', async () => {
        usersService.findOneByEmail.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 5,
          passwordLockedUntil: new Date(NOW.getTime() + 60_000),
        });

        await expect(
          service.validateUser(mockUser.email, 'password123'),
        ).rejects.toMatchObject({
          status: HttpStatus.TOO_MANY_REQUESTS,
        });

        expect(bcrypt.compareSync).not.toHaveBeenCalled();
        expect(usersService.update).not.toHaveBeenCalled();
      });

      it('counts a wrong password on the login path too', async () => {
        usersService.findOneByEmail.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 2,
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(false);

        await expect(
          service.validateUser(mockUser.email, 'wrong'),
        ).rejects.toThrow(new BadRequestException('Password does not match'));

        expect(usersService.recordFailedPasswordAttempt).toHaveBeenCalledWith(
          mockUser.id,
          5,
          15 * 60 * 1000,
        );
      });

      it('starts a fresh streak after the lock window expires on a wrong password', async () => {
        usersService.findOneByEmail.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 5,
          passwordLockedUntil: new Date(NOW.getTime() - 1),
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(false);

        await expect(
          service.validateUser(mockUser.email, 'wrong'),
        ).rejects.toThrow(new BadRequestException('Password does not match'));

        expect(usersService.recordFailedPasswordAttempt).toHaveBeenCalledWith(
          mockUser.id,
          5,
          15 * 60 * 1000,
        );
        expect(usersService.update).not.toHaveBeenCalled();
      });

      it('clears an accumulated streak on a successful login', async () => {
        usersService.findOneByEmail.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 3,
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(true);

        await service.validateUser(mockUser.email, 'password123');

        expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
          failedPasswordAttempts: 0,
          passwordLockedUntil: null,
        });
      });

      it('writes nothing when a successful login had no streak to clear', async () => {
        usersService.findOneByEmail.mockResolvedValue(mockUser);
        vi.mocked(bcrypt.compareSync).mockReturnValue(true);

        await service.validateUser(mockUser.email, 'password123');

        expect(usersService.update).not.toHaveBeenCalled();
      });

      it('lets a login through once the window has passed', async () => {
        usersService.findOneByEmail.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 5,
          passwordLockedUntil: new Date(NOW.getTime() - 1),
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(true);

        const result = await service.validateUser(
          mockUser.email,
          'password123',
        );

        expect(result.email).toBe(mockUser.email);
      });
    });

    it('should validate user successfully with correct credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      usersService.findOneByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compareSync).mockReturnValue(true);

      const result = await service.validateUser(email, password);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        password,
        mockUser.password,
      );
      expect(result).toEqual(mockUser);
    });

    it('rejects a verified-credentials login when the email is unverified', async () => {
      usersService.findOneByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      vi.mocked(bcrypt.compareSync).mockReturnValue(true);

      await expect(
        service.validateUser('test@example.com', 'password123'),
      ).rejects.toThrow(new BadRequestException('Email address not verified'));
    });

    it('reports a password failure before an unverified failure', async () => {
      usersService.findOneByEmail.mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      vi.mocked(bcrypt.compareSync).mockReturnValue(false);

      // Order matters: leading with "not verified" would confirm the address
      // is registered to anyone guessing passwords.
      await expect(
        service.validateUser('test@example.com', 'wrong'),
      ).rejects.toThrow(new BadRequestException('Password does not match'));
    });

    it('should throw BadRequestException when user not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'password123';

      usersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        new BadRequestException('User not found'),
      );

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw BadRequestException when password does not match', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      usersService.findOneByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compareSync).mockReturnValue(false);

      await expect(service.validateUser(email, password)).rejects.toThrow(
        new BadRequestException('Password does not match'),
      );

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        password,
        mockUser.password,
      );
    });
  });

  describe('login', () => {
    it('should generate access token for valid user', async () => {
      const mockToken = 'jwt-token-123';
      const expectedPayload = { email: mockUser.email, userId: mockUser.id };

      jwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.login(mockUser);

      expect(jwtService.signAsync).toHaveBeenCalledWith(expectedPayload);
      expect(result).toEqual({ access_token: mockToken });
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        ...mockUser,
        ...mockRegisterDto,
        password: hashedPassword,
        emailVerified: false,
      };

      usersService.findOneByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);
      usersService.create.mockResolvedValue(createdUser);
      jwtService.signAsync.mockResolvedValue('verify-token-123');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });
      configService.getOrThrow.mockImplementation(
        (key: string) =>
          ({
            JWT_SECRET: 'test-secret',
            FRONTEND_BASE_URL: 'http://localhost:3010',
          })[key] as never,
      );
      mockConfigGet('86400');

      const result = await service.register(mockRegisterDto);

      expect(usersService.findOneByEmail).toHaveBeenCalledWith(
        mockRegisterDto.email,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(mockRegisterDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        ...mockRegisterDto,
        username: mockRegisterDto.email,
        firstName: '',
        lastName: '',
        password: hashedPassword,
      });
      // Keyed on email + the row's unverified state, so using the link
      // invalidates it.
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { userId: createdUser.id },
        {
          secret: `test-secret${createdUser.email}false`,
          expiresIn: 86400,
        },
      );
      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: createdUser.email,
          html: expect.stringContaining(
            'http://localhost:3010/verify-email?token=verify-token-123',
          ),
        }),
      );
      // No token: the account cannot sign in yet.
      expect(result).toEqual(SUBMITTED);
    });

    it('mails an already-registered notice and replies identically', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);

      const result = await service.register(mockRegisterDto);

      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: 'You already have a Pokédex account',
        }),
      );
      // The notice must not carry a reset token: the request came from an
      // unauthenticated stranger.
      const sent = mailService.send.mock.calls[0][0];
      expect(sent.html).not.toContain('reset-password?token=');
      expect(usersService.create).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(result).toEqual(SUBMITTED);
    });
  });

  describe('requestPasswordReset', () => {
    const GENERIC_MESSAGE = {
      message:
        'If an account exists for that address, a reset link has been sent',
    };

    beforeEach(() => {
      configService.getOrThrow.mockImplementation(
        (key: string) =>
          ({
            JWT_SECRET: 'test-secret',
            FRONTEND_BASE_URL: 'http://localhost:3010',
          })[key] as never,
      );
      mockConfigGet('900');
    });

    it('falls back to a 15 minute expiry when the TTL is unset', async () => {
      mockConfigGet(undefined);
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('reset-token-123');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      const result = await service.requestPasswordReset(mockUser.email);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { userId: mockUser.id },
        { secret: `test-secret${mockUser.password}`, expiresIn: 900 },
      );
      expect(result).toEqual(GENERIC_MESSAGE);
    });

    it('signs a token against the current hash and mails the link', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('reset-token-123');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      const result = await service.requestPasswordReset(mockUser.email);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { userId: mockUser.id },
        { secret: `test-secret${mockUser.password}`, expiresIn: 900 },
      );
      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          html: expect.stringContaining(
            'http://localhost:3010/reset-password?token=reset-token-123',
          ),
        }),
      );
      expect(result).toEqual(GENERIC_MESSAGE);
    });

    it('builds the link from an allow-listed preview origin', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('reset-token-123');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      // Preview deployments have no stable URL, so the configured
      // FRONTEND_BASE_URL would send the user to the wrong deployment.
      await service.requestPasswordReset(mockUser.email, PREVIEW_ORIGIN);

      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            `${PREVIEW_ORIGIN}/reset-password?token=reset-token-123`,
          ),
        }),
      );
    });

    it('needs no FRONTEND_BASE_URL once the origin is allow-listed', async () => {
      configService.getOrThrow.mockImplementation((key: string) => {
        if (key === 'FRONTEND_BASE_URL') {
          throw new Error('FRONTEND_BASE_URL is unset');
        }
        return 'test-secret' as never;
      });
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('reset-token-123');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      await expect(
        service.requestPasswordReset(mockUser.email, PREVIEW_ORIGIN),
      ).resolves.toEqual(GENERIC_MESSAGE);
    });

    it('ignores an origin that is not allow-listed', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('reset-token-123');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      await service.requestPasswordReset(
        mockUser.email,
        'https://pokedex-frontend-evil.attacker.example',
      );

      // An unchecked Origin would mail the address owner a genuine reset link
      // pointing at a host the attacker controls.
      const sent = mailService.send.mock.calls[0][0];
      expect(sent.html).toContain(
        'http://localhost:3010/reset-password?token=reset-token-123',
      );
      expect(sent.html).not.toContain('attacker.example');
      expect(sent.text).not.toContain('attacker.example');
    });

    it('returns the same message and sends nothing for an unknown address', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nobody@example.com');

      expect(mailService.send).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(result).toEqual(GENERIC_MESSAGE);
    });

    it('returns the same message when the send fails', async () => {
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('reset-token-123');
      mailService.send.mockResolvedValue({ ok: false, error: 'mail disabled' });

      const result = await service.requestPasswordReset(mockUser.email);

      expect(result).toEqual(GENERIC_MESSAGE);
    });
  });

  describe('confirmPasswordReset', () => {
    const INVALID_TOKEN = new BadRequestException(
      'Invalid or expired reset token',
    );

    beforeEach(() => {
      configService.getOrThrow.mockReturnValue('test-secret' as never);
    });

    it('verifies against the current hash, then rotates the password', async () => {
      jwtService.decode.mockReturnValue({ userId: mockUser.id });
      usersService.findOneById.mockResolvedValue(mockUser);
      jwtService.verifyAsync.mockResolvedValue({ userId: mockUser.id });
      vi.mocked(bcrypt.hash).mockResolvedValue('newHash' as never);
      usersService.update.mockResolvedValue({
        ...mockUser,
        password: 'newHash',
      });
      jwtService.signAsync.mockResolvedValue('access-token-123');

      const result = await service.confirmPasswordReset(
        'reset-token-123',
        'Pikachu123!',
      );

      // Secret is built from the hash as it was *before* the rotation.
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('reset-token-123', {
        secret: `test-secret${mockUser.password}`,
      });
      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'newHash',
        emailVerified: true,
        failedPasswordAttempts: 0,
        passwordLockedUntil: null,
      });
      expect(result).toEqual({ access_token: 'access-token-123' });
    });

    it('rejects a malformed token without touching the database', async () => {
      jwtService.decode.mockReturnValue(null);

      await expect(
        service.confirmPasswordReset('garbage', 'Pikachu123!'),
      ).rejects.toThrow(INVALID_TOKEN);
      expect(usersService.findOneById).not.toHaveBeenCalled();
    });

    it('rejects a token naming an unknown user with the same error', async () => {
      jwtService.decode.mockReturnValue({ userId: 'ghost-123' });
      usersService.findOneById.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset('reset-token-123', 'Pikachu123!'),
      ).rejects.toThrow(INVALID_TOKEN);
    });

    it('rejects an expired, tampered, or already-spent token', async () => {
      jwtService.decode.mockReturnValue({ userId: mockUser.id });
      usersService.findOneById.mockResolvedValue(mockUser);
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(
        service.confirmPasswordReset('reset-token-123', 'Pikachu123!'),
      ).rejects.toThrow(INVALID_TOKEN);
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('rejects when the password write reports no row updated', async () => {
      jwtService.decode.mockReturnValue({ userId: mockUser.id });
      usersService.findOneById.mockResolvedValue(mockUser);
      jwtService.verifyAsync.mockResolvedValue({ userId: mockUser.id });
      vi.mocked(bcrypt.hash).mockResolvedValue('newHash' as never);
      usersService.update.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset('reset-token-123', 'Pikachu123!'),
      ).rejects.toThrow(INVALID_TOKEN);
    });
  });

  describe('confirmEmailVerification', () => {
    const INVALID_LINK = new BadRequestException(
      'Invalid or expired verification link',
    );
    const unverified = { ...mockUser, emailVerified: false };

    beforeEach(() => {
      configService.getOrThrow.mockReturnValue('test-secret' as never);
    });

    it('flips the flag against the unverified key, then signs the user in', async () => {
      jwtService.decode.mockReturnValue({ userId: unverified.id });
      usersService.findOneById.mockResolvedValue(unverified);
      jwtService.verifyAsync.mockResolvedValue({ userId: unverified.id });
      usersService.update.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('access-token-123');

      const result = await service.confirmEmailVerification('verify-token-123');

      // Key embeds the pre-verification state, which is why reuse fails.
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('verify-token-123', {
        secret: `test-secret${unverified.email}false`,
      });
      expect(usersService.update).toHaveBeenCalledWith(unverified.id, {
        emailVerified: true,
      });
      expect(result).toEqual({ access_token: 'access-token-123' });
    });

    it('rejects a malformed link without touching the database', async () => {
      jwtService.decode.mockReturnValue(null);

      await expect(service.confirmEmailVerification('garbage')).rejects.toThrow(
        INVALID_LINK,
      );
      expect(usersService.findOneById).not.toHaveBeenCalled();
    });

    it('rejects a reused link with the same error', async () => {
      // Already verified, so the key no longer matches what signed the token.
      jwtService.decode.mockReturnValue({ userId: mockUser.id });
      usersService.findOneById.mockResolvedValue(mockUser);
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid signature'));

      await expect(
        service.confirmEmailVerification('verify-token-123'),
      ).rejects.toThrow(INVALID_LINK);
      expect(usersService.update).not.toHaveBeenCalled();
    });
  });

  describe('register (existing unverified account)', () => {
    const unverified = { ...mockUser, emailVerified: false };

    beforeEach(() => {
      configService.getOrThrow.mockImplementation(
        (key: string) =>
          ({
            JWT_SECRET: 'test-secret',
            FRONTEND_BASE_URL: 'http://localhost:3010',
          })[key] as never,
      );
      mockConfigGet('86400');
    });

    it('resends the link instead of erroring, leaving the password alone', async () => {
      usersService.findOneByEmail.mockResolvedValue(unverified);
      jwtService.signAsync.mockResolvedValue('verify-token-789');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      const result = await service.register(mockRegisterDto);

      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: unverified.email,
          html: expect.stringContaining(
            'http://localhost:3010/verify-email?token=verify-token-789',
          ),
        }),
      );
      // Neither a new row nor a password write: honouring the submitted
      // password would let a guesser overwrite the real owner's credentials.
      expect(usersService.create).not.toHaveBeenCalled();
      expect(usersService.update).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(result).toEqual(SUBMITTED);
    });

    it('builds the verification link from an allow-listed preview origin', async () => {
      usersService.findOneByEmail.mockResolvedValue(unverified);
      jwtService.signAsync.mockResolvedValue('verify-token-789');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      await service.register(mockRegisterDto, PREVIEW_ORIGIN);

      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            `${PREVIEW_ORIGIN}/verify-email?token=verify-token-789`,
          ),
        }),
      );
    });

    it('ignores an origin that is not allow-listed', async () => {
      usersService.findOneByEmail.mockResolvedValue(unverified);
      jwtService.signAsync.mockResolvedValue('verify-token-789');
      mailService.send.mockResolvedValue({ ok: true, id: 'resend-1' });

      await service.register(mockRegisterDto, 'https://attacker.example');

      const sent = mailService.send.mock.calls[0][0];
      expect(sent.html).toContain(
        'http://localhost:3010/verify-email?token=verify-token-789',
      );
      expect(sent.html).not.toContain('attacker.example');
    });

    it('replies the same for unverified, verified, and unknown addresses', async () => {
      usersService.findOneByEmail.mockResolvedValue(unverified);
      const unverifiedReply = await service.register(mockRegisterDto);

      usersService.findOneByEmail.mockResolvedValue(mockUser);
      const verifiedReply = await service.register(mockRegisterDto);

      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser);
      const newReply = await service.register(mockRegisterDto);

      // Three different emails, one indistinguishable response.
      expect(unverifiedReply).toEqual(verifiedReply);
      expect(verifiedReply).toEqual(newReply);
    });
  });

  describe('changePassword', () => {
    const UNABLE = new BadRequestException('Unable to change password');

    it('verifies the current password, then rotates the hash', async () => {
      usersService.findOneById.mockResolvedValue(mockUser);
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compareSync).mockReturnValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('newHash' as never);
      usersService.update.mockResolvedValue({
        ...mockUser,
        password: 'newHash',
      });

      const result = await service.changePassword(
        mockUser.id,
        'OldPikachu123!',
        'NewPikachu123!',
      );

      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        'OldPikachu123!',
        mockUser.password,
      );
      // Unlike a reset, this does not set emailVerified.
      expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'newHash',
        failedPasswordAttempts: 0,
        passwordLockedUntil: null,
      });
      expect(result).toEqual({ message: 'Password updated' });
    });

    it('rejects a token naming a user who no longer exists', async () => {
      usersService.findOneById.mockResolvedValue(null);

      await expect(
        service.changePassword('ghost-123', 'OldPikachu123!', 'NewPikachu123!'),
      ).rejects.toThrow(UNABLE);
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it('rejects a wrong current password and counts the attempt', async () => {
      usersService.findOneById.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compareSync).mockReturnValue(false as never);

      await expect(
        service.changePassword(mockUser.id, 'wrong', 'NewPikachu123!'),
      ).rejects.toThrow(new BadRequestException('Password does not match'));

      expect(usersService.recordFailedPasswordAttempt).toHaveBeenCalledWith(
        mockUser.id,
        5,
        15 * 60 * 1000,
      );
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('rejects when the password write reports no row updated', async () => {
      usersService.findOneById.mockResolvedValue(mockUser);
      usersService.findOneByEmail.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compareSync).mockReturnValue(true as never);
      vi.mocked(bcrypt.hash).mockResolvedValue('newHash' as never);
      usersService.update.mockResolvedValue(null);

      await expect(
        service.changePassword(mockUser.id, 'OldPikachu123!', 'NewPikachu123!'),
      ).rejects.toThrow(UNABLE);
    });

    describe('lockout', () => {
      const NOW = new Date('2026-08-27T12:00:00.000Z');

      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('arms a 15-minute window on the fifth consecutive wrong guess', async () => {
        usersService.findOneById.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 4,
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(false as never);

        await expect(
          service.changePassword(mockUser.id, 'wrong', 'NewPikachu123!'),
        ).rejects.toThrow(BadRequestException);

        expect(usersService.recordFailedPasswordAttempt).toHaveBeenCalledWith(
          mockUser.id,
          5,
          15 * 60 * 1000,
        );
      });

      it('leaves the window unarmed below the threshold', async () => {
        usersService.findOneById.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 3,
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(false as never);

        await expect(
          service.changePassword(mockUser.id, 'wrong', 'NewPikachu123!'),
        ).rejects.toThrow(BadRequestException);

        expect(usersService.recordFailedPasswordAttempt).toHaveBeenCalledWith(
          mockUser.id,
          5,
          15 * 60 * 1000,
        );
      });

      it('refuses while locked, without checking the password at all', async () => {
        usersService.findOneById.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 5,
          passwordLockedUntil: new Date(NOW.getTime() + 60_000),
        });

        await expect(
          service.changePassword(
            mockUser.id,
            'OldPikachu123!',
            'NewPikachu123!',
          ),
        ).rejects.toMatchObject({
          status: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many incorrect attempts. Try again later',
        });

        expect(bcrypt.compareSync).not.toHaveBeenCalled();
        expect(usersService.update).not.toHaveBeenCalled();
      });

      it('starts a fresh streak after the lock window expires on a wrong password', async () => {
        usersService.findOneById.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 5,
          passwordLockedUntil: new Date(NOW.getTime() - 1),
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(false as never);

        await expect(
          service.changePassword(mockUser.id, 'wrong', 'NewPikachu123!'),
        ).rejects.toThrow(BadRequestException);

        expect(usersService.recordFailedPasswordAttempt).toHaveBeenCalledWith(
          mockUser.id,
          5,
          15 * 60 * 1000,
        );
        expect(usersService.update).not.toHaveBeenCalled();
      });

      it('lets the correct password through once the window has passed', async () => {
        usersService.findOneById.mockResolvedValue({
          ...mockUser,
          failedPasswordAttempts: 5,
          passwordLockedUntil: new Date(NOW.getTime() - 1),
        });
        vi.mocked(bcrypt.compareSync).mockReturnValue(true as never);
        vi.mocked(bcrypt.hash).mockResolvedValue('newHash' as never);
        usersService.update.mockResolvedValue(mockUser);

        const result = await service.changePassword(
          mockUser.id,
          'OldPikachu123!',
          'NewPikachu123!',
        );

        expect(result).toEqual({ message: 'Password updated' });
        expect(usersService.update).toHaveBeenCalledWith(mockUser.id, {
          password: 'newHash',
          failedPasswordAttempts: 0,
          passwordLockedUntil: null,
        });
      });
    });
  });
});
