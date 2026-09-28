import { Test, TestingModule } from '@nestjs/testing';
import { FastifyRequest } from 'fastify';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from 'vitest';
import { UserEntity } from '../users/users.entity';
import { AuthController, AuthenticatedRequest } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetConfirmRequestDto } from './dtos/password-reset-confirm-request.dto';
import { PasswordResetRequestDto } from './dtos/password-reset-request.dto';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { AccessToken } from './types/AccessToken';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Mocked<AuthService>;

  const mockUser: UserEntity = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword123',
    firstName: 'Test',
    lastName: 'User',
    emailVerified: false,
    failedPasswordAttempts: 0,
    passwordLockedUntil: null,
  };

  const mockRegisterDto: RegisterRequestDto = {
    email: 'john@example.com',
    password: 'password123',
  };

  const mockAccessToken: AccessToken = {
    access_token: 'jwt-token-123',
  };

  const mockRegisterResponse = {
    message: 'Check your email for a link to verify your account',
  };

  const mockRequest = {
    user: mockUser,
  };

  const PREVIEW_ORIGIN = 'https://pokedex-frontend-abc123-code-x.vercel.app';

  const requestFrom = (origin?: string) =>
    ({ headers: { origin } }) as FastifyRequest;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: vi.fn(),
            register: vi.fn(),
            requestPasswordReset: vi.fn(),
            confirmPasswordReset: vi.fn(),
            confirmEmailVerification: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login with user from request', async () => {
      authService.login.mockResolvedValue(mockAccessToken);

      const result = await controller.login(
        mockRequest as AuthenticatedRequest,
      );

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAccessToken);
    });

    it('should return the result from authService.login', async () => {
      const customToken: AccessToken = { access_token: 'custom-token' };
      authService.login.mockResolvedValue(customToken);

      const result = await controller.login(
        mockRequest as AuthenticatedRequest,
      );

      expect(result).toEqual(customToken);
    });
  });

  describe('register', () => {
    it('should call authService.register with register body', async () => {
      authService.register.mockResolvedValue(mockRegisterResponse);

      const result = await controller.register(
        mockRegisterDto,
        requestFrom(PREVIEW_ORIGIN),
      );

      // Origin travels with the body so the verification link can point back
      // at the deployment the request came from.
      expect(authService.register).toHaveBeenCalledWith(
        mockRegisterDto,
        PREVIEW_ORIGIN,
      );
      // No access_token: registration no longer authenticates.
      expect(result).toEqual(mockRegisterResponse);
    });

    it('passes undefined when the caller sends no Origin', async () => {
      authService.register.mockResolvedValue(mockRegisterResponse);

      await controller.register(mockRegisterDto, requestFrom());

      expect(authService.register).toHaveBeenCalledWith(
        mockRegisterDto,
        undefined,
      );
    });

    it('should return the result from authService.register', async () => {
      const custom = { message: 'a different message' };
      authService.register.mockResolvedValue(custom);

      const result = await controller.register(mockRegisterDto, requestFrom());

      expect(result).toEqual(custom);
    });

    it('should handle async/await properly', async () => {
      authService.register.mockResolvedValue(mockRegisterResponse);

      const result = await controller.register(mockRegisterDto, requestFrom());

      expect(result).toEqual(mockRegisterResponse);
    });
  });

  describe('requestPasswordReset', () => {
    it('passes the email through and returns the generic message', async () => {
      const body: PasswordResetRequestDto = { email: 'ash@pallet.town' };
      const response = {
        message:
          'If an account exists for that address, a reset link has been sent',
      };
      authService.requestPasswordReset.mockResolvedValue(response);

      const result = await controller.requestPasswordReset(
        body,
        requestFrom(PREVIEW_ORIGIN),
      );

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(
        'ash@pallet.town',
        PREVIEW_ORIGIN,
      );
      expect(result).toEqual(response);
    });

    it('passes undefined when the caller sends no Origin', async () => {
      authService.requestPasswordReset.mockResolvedValue({ message: 'sent' });

      await controller.requestPasswordReset(
        { email: 'ash@pallet.town' },
        requestFrom(),
      );

      expect(authService.requestPasswordReset).toHaveBeenCalledWith(
        'ash@pallet.town',
        undefined,
      );
    });
  });

  describe('confirmPasswordReset', () => {
    it('unpacks token and password, and returns the access token', async () => {
      const body: PasswordResetConfirmRequestDto = {
        token: 'reset-token-123',
        password: 'Pikachu123!',
      };
      authService.confirmPasswordReset.mockResolvedValue(mockAccessToken);

      const result = await controller.confirmPasswordReset(body);

      expect(authService.confirmPasswordReset).toHaveBeenCalledWith(
        'reset-token-123',
        'Pikachu123!',
      );
      expect(result).toEqual(mockAccessToken);
    });
  });

  describe('confirmEmailVerification', () => {
    it('unpacks the token and returns the access token', async () => {
      authService.confirmEmailVerification.mockResolvedValue(mockAccessToken);

      const result = await controller.confirmEmailVerification({
        token: 'verify-token-123',
      });

      expect(authService.confirmEmailVerification).toHaveBeenCalledWith(
        'verify-token-123',
      );
      expect(result).toEqual(mockAccessToken);
    });
  });
});
