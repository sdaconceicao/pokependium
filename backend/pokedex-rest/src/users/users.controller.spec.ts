import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { AvatarsService } from './avatars.service';
import { UsersController } from './users.controller';
import { UserEntity } from './users.entity';
import { UsersService } from './users.service';

type ControllerRequest = Parameters<UsersController['getUser']>[0];

const USER_ID = 'user-123';

const mockUser: UserEntity = {
  id: USER_ID,
  username: 'ash@pallet.town',
  email: 'ash@pallet.town',
  password: 'hashed',
  firstName: '',
  lastName: '',
  emailVerified: true,
  failedPasswordAttempts: 0,
  passwordLockedUntil: null,
};

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);

/** A request carrying the JWT payload, plus an optional multipart part. */
const request = (file?: () => Promise<unknown>): ControllerRequest =>
  ({
    user: { userId: USER_ID, email: mockUser.email, iat: 1, exp: 2 },
    file,
  }) as unknown as ControllerRequest;

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: Mocked<UsersService>;
  let avatarsService: Mocked<AvatarsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: { findOneById: vi.fn() },
        },
        {
          provide: AvatarsService,
          useValue: {
            upsert: vi.fn(),
            findOneByUserId: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    usersService = module.get(UsersService);
    avatarsService = module.get(AvatarsService);
  });

  describe('getUser', () => {
    it('returns the profile with the token timestamps', async () => {
      usersService.findOneById.mockResolvedValue(mockUser);

      const result = await controller.getUser(request());

      expect(result).toEqual({
        id: USER_ID,
        username: mockUser.username,
        email: mockUser.email,
        firstName: '',
        lastName: '',
        iat: 1,
        exp: 2,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('throws when the token names a user who no longer exists', async () => {
      usersService.findOneById.mockResolvedValue(null);

      await expect(controller.getUser(request())).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('uploadAvatar', () => {
    it('stores a PNG and reports success', async () => {
      const req = request(() =>
        Promise.resolve({ toBuffer: () => Promise.resolve(PNG) }),
      );

      const result = await controller.uploadAvatar(req);

      expect(avatarsService.upsert).toHaveBeenCalledWith(
        USER_ID,
        'image/png',
        PNG,
      );
      expect(result).toEqual({ message: 'Avatar updated' });
    });

    it('ignores the declared mimetype and trusts the bytes', async () => {
      const req = request(() =>
        Promise.resolve({
          mimetype: 'image/svg+xml',
          toBuffer: () => Promise.resolve(PNG),
        }),
      );

      await controller.uploadAvatar(req);

      expect(avatarsService.upsert).toHaveBeenCalledWith(
        USER_ID,
        'image/png',
        PNG,
      );
    });

    it('rejects a request with no file part', async () => {
      const req = request(() => Promise.resolve(undefined));

      await expect(controller.uploadAvatar(req)).rejects.toThrow(
        BadRequestException,
      );
      expect(avatarsService.upsert).not.toHaveBeenCalled();
    });

    it('reports 413 when the stream passes the size ceiling', async () => {
      const req = request(() =>
        Promise.resolve({
          toBuffer: () => Promise.reject(new Error('request file too large')),
        }),
      );

      await expect(controller.uploadAvatar(req)).rejects.toThrow(
        PayloadTooLargeException,
      );
      expect(avatarsService.upsert).not.toHaveBeenCalled();
    });

    it('rejects an empty file', async () => {
      const req = request(() =>
        Promise.resolve({ toBuffer: () => Promise.resolve(Buffer.alloc(0)) }),
      );

      await expect(controller.uploadAvatar(req)).rejects.toThrow(
        BadRequestException,
      );
      expect(avatarsService.upsert).not.toHaveBeenCalled();
    });

    it('rejects an SVG, which is stored XSS if ever served back', async () => {
      const svg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        'utf8',
      );
      const req = request(() =>
        Promise.resolve({ toBuffer: () => Promise.resolve(svg) }),
      );

      await expect(controller.uploadAvatar(req)).rejects.toThrow(
        'Avatar must be a PNG, JPEG, or WebP image',
      );
      expect(avatarsService.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getAvatar', () => {
    it('returns the avatar as a data URI', async () => {
      avatarsService.findOneByUserId.mockResolvedValue({
        userId: USER_ID,
        mimeType: 'image/png',
        data: PNG,
        createdAt: new Date('2026-08-27T00:00:00.000Z'),
        updatedAt: new Date('2026-08-27T00:00:00.000Z'),
      });

      const result = await controller.getAvatar(request());

      expect(result.image).toBe(
        `data:image/png;base64,${PNG.toString('base64')}`,
      );
    });

    it('returns null when the account has no avatar', async () => {
      avatarsService.findOneByUserId.mockResolvedValue(null);

      expect(await controller.getAvatar(request())).toEqual({ image: null });
    });
  });

  describe('deleteAvatar', () => {
    it('removes the avatar', async () => {
      avatarsService.remove.mockResolvedValue(true);

      const result = await controller.deleteAvatar(request());

      expect(avatarsService.remove).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual({ message: 'Avatar removed' });
    });

    it('reports the same message when there was nothing to remove', async () => {
      avatarsService.remove.mockResolvedValue(false);

      expect(await controller.deleteAvatar(request())).toEqual({
        message: 'Avatar removed',
      });
    });
  });
});
