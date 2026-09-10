import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from 'vitest';
import { UserEntity } from './users.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Mocked<Repository<UserEntity>>;

  const mockUser: UserEntity = {
    id: 'user-123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            findOne: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(UserEntity));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneById', () => {
    it('returns the matching profile', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      expect(await service.findOneById('user-123')).toEqual(mockUser);
    });

    it('returns null when no profile matches', async () => {
      repository.findOne.mockResolvedValue(null);

      expect(await service.findOneById('missing')).toBeNull();
    });
  });

  describe('ensureProfile', () => {
    it('returns the existing profile without writing', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.ensureProfile('user-123', 'ash@pallet.town');

      expect(result).toEqual(mockUser);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('creates a profile keyed by the auth userId when none exists', async () => {
      const created = {
        id: 'user-123',
        username: 'ash@pallet.town',
        firstName: '',
        lastName: '',
      };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.ensureProfile('user-123', 'ash@pallet.town');

      expect(repository.create).toHaveBeenCalledWith({
        id: 'user-123',
        username: 'ash@pallet.town',
        firstName: '',
        lastName: '',
      });
      expect(result).toEqual(created);
    });
  });
});
