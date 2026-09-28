import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { AvatarsService } from './avatars.service';
import { UserAvatarEntity } from './user-avatar.entity';

describe('AvatarsService', () => {
  let service: AvatarsService;
  let repository: Mocked<Repository<UserAvatarEntity>>;

  const USER_ID = 'user-123';
  const DATA = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

  const mockAvatar: UserAvatarEntity = {
    userId: USER_ID,
    mimeType: 'image/png',
    data: DATA,
    createdAt: new Date('2026-08-27T00:00:00.000Z'),
    updatedAt: new Date('2026-08-27T00:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarsService,
        {
          provide: getRepositoryToken(UserAvatarEntity),
          useValue: {
            save: vi.fn(),
            findOne: vi.fn(),
            delete: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AvatarsService);
    repository = module.get(getRepositoryToken(UserAvatarEntity));
  });

  describe('upsert', () => {
    it('saves the row keyed by userId', async () => {
      repository.save.mockResolvedValue(mockAvatar as never);

      const result = await service.upsert(USER_ID, 'image/png', DATA);

      expect(repository.save).toHaveBeenCalledWith({
        userId: USER_ID,
        mimeType: 'image/png',
        data: DATA,
      });
      expect(result).toEqual(mockAvatar);
    });

    it('replaces an existing avatar without reading it first', async () => {
      repository.save.mockResolvedValue(mockAvatar as never);

      await service.upsert(USER_ID, 'image/webp', DATA);

      expect(repository.findOne).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOneByUserId', () => {
    it('returns the stored avatar', async () => {
      repository.findOne.mockResolvedValue(mockAvatar);

      const result = await service.findOneByUserId(USER_ID);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: USER_ID },
      });
      expect(result).toEqual(mockAvatar);
    });

    it('returns null when the user has no avatar', async () => {
      repository.findOne.mockResolvedValue(null);

      expect(await service.findOneByUserId(USER_ID)).toBeNull();
    });
  });

  describe('remove', () => {
    it('reports true when a row was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 1 } as DeleteResult);

      expect(await service.remove(USER_ID)).toBe(true);
      expect(repository.delete).toHaveBeenCalledWith({ userId: USER_ID });
    });

    it('reports false when there was nothing to delete', async () => {
      repository.delete.mockResolvedValue({ affected: 0 } as DeleteResult);

      expect(await service.remove(USER_ID)).toBe(false);
    });

    it('reports false when the driver omits an affected count', async () => {
      repository.delete.mockResolvedValue({} as DeleteResult);

      expect(await service.remove(USER_ID)).toBe(false);
    });
  });
});
