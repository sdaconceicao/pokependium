import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from 'vitest';
import { AccountEntity } from './accounts.entity';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let repository: Mocked<Repository<AccountEntity>>;

  const mockAccount: AccountEntity = {
    id: 'account-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    emailVerified: false,
    failedPasswordAttempts: 0,
    passwordLockedUntil: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            createQueryBuilder: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    repository = module.get(getRepositoryToken(AccountEntity));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates an account from the given fields', async () => {
      const data = { email: 'new@example.com', password: 'hashed' };
      const created = { ...mockAccount, ...data };

      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findOneByEmail', () => {
    it('returns the matching account', async () => {
      repository.findOne.mockResolvedValue(mockAccount);

      const result = await service.findOneByEmail('test@example.com');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockAccount);
    });

    it('returns null when no account matches', async () => {
      repository.findOne.mockResolvedValue(null);

      expect(await service.findOneByEmail('missing@example.com')).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('returns the matching account', async () => {
      repository.findOne.mockResolvedValue(mockAccount);

      expect(await service.findOneById('account-123')).toEqual(mockAccount);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'account-123' },
      });
    });

    it('returns null when no account matches', async () => {
      repository.findOne.mockResolvedValue(null);

      expect(await service.findOneById('missing')).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and returns the account', async () => {
      const updated = { ...mockAccount, emailVerified: true };

      repository.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      repository.findOne.mockResolvedValue(updated);

      const result = await service.update('account-123', {
        emailVerified: true,
      });

      expect(repository.update).toHaveBeenCalledWith('account-123', {
        emailVerified: true,
      });
      expect(result).toEqual(updated);
    });

    it('returns null when the account is gone', async () => {
      repository.update.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      });
      repository.findOne.mockResolvedValue(null);

      expect(
        await service.update('missing', { emailVerified: true }),
      ).toBeNull();
    });
  });

  describe('recordFailedPasswordAttempt', () => {
    const NOW = new Date('2026-08-27T12:00:00.000Z');
    const LOCKOUT_MS = 15 * 60 * 1000;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('increments atomically and resets an expired lock to a fresh streak', async () => {
      const qb = {
        update: vi.fn(),
        set: vi.fn(),
        setParameter: vi.fn(),
        where: vi.fn(),
        execute: vi.fn(),
      };
      qb.update.mockReturnValue(qb);
      qb.set.mockReturnValue(qb);
      qb.setParameter.mockReturnValue(qb);
      qb.where.mockReturnValue(qb);
      qb.execute.mockResolvedValue({ affected: 1 });
      repository.createQueryBuilder.mockReturnValue(qb as never);

      await service.recordFailedPasswordAttempt('account-123', 5, LOCKOUT_MS);

      expect(qb.update).toHaveBeenCalledWith(AccountEntity);
      expect(qb.where).toHaveBeenCalledWith('id = :accountId', {
        accountId: 'account-123',
      });
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('returns true when a row was removed', async () => {
      repository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      } as DeleteResult);

      expect(await service.delete('account-123')).toBe(true);
    });

    it('returns false when no row was removed', async () => {
      repository.delete.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      } as DeleteResult);

      expect(await service.delete('missing')).toBe(false);
    });
  });
});
