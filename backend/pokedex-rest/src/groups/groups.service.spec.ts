import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, DeleteResult, Repository } from 'typeorm';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from 'vitest';
import { GroupPokemonEntity } from './group-pokemon.entity';
import { GroupEntity } from './groups.entity';
import { GroupsService } from './groups.service';

describe('GroupsService', () => {
  let service: GroupsService;
  let groupsRepository: Mocked<Repository<GroupEntity>>;
  let groupPokemonRepository: Mocked<Repository<GroupPokemonEntity>>;
  let managerMock: {
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findOneOrFail: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let dataSource: { transaction: ReturnType<typeof vi.fn> };

  const userId = 'user-1';
  const otherUserId = 'user-2';

  const mockGroup: GroupEntity = {
    id: 'group-1',
    userId,
    name: 'My Team',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    pokemon: [],
  };

  beforeEach(async () => {
    managerMock = {
      count: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      findOneOrFail: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    dataSource = {
      transaction: vi.fn(async (cb) => cb(managerMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: getRepositoryToken(GroupEntity),
          useValue: {
            findOne: vi.fn(),
            createQueryBuilder: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(GroupPokemonEntity),
          useValue: {
            findOne: vi.fn(),
            find: vi.fn(),
            delete: vi.fn(),
            createQueryBuilder: vi.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    groupsRepository = module.get(getRepositoryToken(GroupEntity));
    groupPokemonRepository = module.get(getRepositoryToken(GroupPokemonEntity));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllForUser', () => {
    it('scopes by user, maps the pokemon count, and orders alphabetically by name', async () => {
      const groupA = { ...mockGroup, id: 'group-1' } as GroupEntity;
      const groupB = { ...mockGroup, id: 'group-2' } as GroupEntity;
      const getRawAndEntities = vi.fn().mockResolvedValue({
        entities: [groupA, groupB],
        raw: [{ pokemonCount: '3' }, { pokemonCount: '0' }],
      });
      const qb = {
        leftJoin: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getRawAndEntities,
      };
      groupsRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findAllForUser(userId);

      expect(groupsRepository.createQueryBuilder).toHaveBeenCalledWith('group');
      expect(qb.leftJoin).toHaveBeenCalledWith('group.pokemon', 'pokemon');
      expect(qb.addSelect).toHaveBeenCalledWith(
        'COUNT(pokemon.id)',
        'pokemonCount',
      );
      expect(qb.where).toHaveBeenCalledWith('group.userId = :userId', {
        userId,
      });
      expect(qb.groupBy).toHaveBeenCalledWith('group.id');
      expect(qb.orderBy).toHaveBeenCalledWith('group.name', 'ASC');
      // Alphabetical only now -- the default is identified by its flag,
      // not by sorting first, so there's no secondary order-by.
      expect(qb.addOrderBy).not.toHaveBeenCalled();
      expect(result).toEqual([
        { ...groupA, pokemonCount: 3 },
        { ...groupB, pokemonCount: 0 },
      ]);
    });
  });

  describe('findOneForUser', () => {
    it('returns the group when owned by the user', async () => {
      groupsRepository.findOne.mockResolvedValue(mockGroup);

      const result = await service.findOneForUser(userId, mockGroup.id);

      expect(groupsRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockGroup.id, userId },
      });
      expect(result).toEqual(mockGroup);
    });

    it('throws NotFoundException for a group owned by another user', async () => {
      groupsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneForUser(otherUserId, mockGroup.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('forces the first group to be the default', async () => {
      managerMock.count.mockResolvedValue(0);
      managerMock.create.mockReturnValue({ ...mockGroup, isDefault: true });
      managerMock.save.mockResolvedValue({ ...mockGroup, isDefault: true });

      const result = await service.create(userId, { name: 'My Team' });

      expect(managerMock.count).toHaveBeenCalledWith(GroupEntity, {
        where: { userId },
      });
      expect(managerMock.update).toHaveBeenCalledWith(
        GroupEntity,
        { userId },
        { isDefault: false },
      );
      expect(managerMock.create).toHaveBeenCalledWith(GroupEntity, {
        userId,
        name: 'My Team',
        isDefault: true,
      });
      expect(result.isDefault).toBe(true);
    });

    it('does not default a second group unless explicitly requested', async () => {
      managerMock.count.mockResolvedValue(1);
      managerMock.create.mockReturnValue({ ...mockGroup, isDefault: false });
      managerMock.save.mockResolvedValue({ ...mockGroup, isDefault: false });

      await service.create(userId, { name: 'Second Team' });

      expect(managerMock.update).not.toHaveBeenCalled();
      expect(managerMock.create).toHaveBeenCalledWith(GroupEntity, {
        userId,
        name: 'Second Team',
        isDefault: false,
      });
    });

    it('clears the previous default when isDefault is explicitly requested', async () => {
      managerMock.count.mockResolvedValue(1);
      managerMock.create.mockReturnValue({ ...mockGroup, isDefault: true });
      managerMock.save.mockResolvedValue({ ...mockGroup, isDefault: true });

      await service.create(userId, { name: 'New Default', isDefault: true });

      expect(managerMock.update).toHaveBeenCalledWith(
        GroupEntity,
        { userId },
        { isDefault: false },
      );
    });

    it('maps a unique violation to ConflictException', async () => {
      managerMock.count.mockResolvedValue(1);
      managerMock.create.mockReturnValue(mockGroup);
      managerMock.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(userId, { name: 'My Team' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('rethrows unrelated errors', async () => {
      managerMock.count.mockResolvedValue(1);
      managerMock.create.mockReturnValue(mockGroup);
      managerMock.save.mockRejectedValue(new Error('boom'));

      await expect(service.create(userId, { name: 'My Team' })).rejects.toThrow(
        'boom',
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException for a group owned by another user', async () => {
      managerMock.findOne.mockResolvedValue(null);

      await expect(
        service.update(otherUserId, mockGroup.id, { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('renames the group', async () => {
      managerMock.findOne.mockResolvedValue({
        ...mockGroup,
        isDefault: false,
      });
      managerMock.findOneOrFail.mockResolvedValue({
        ...mockGroup,
        name: 'Renamed',
      });

      const result = await service.update(userId, mockGroup.id, {
        name: 'Renamed',
      });

      expect(managerMock.update).toHaveBeenCalledWith(
        GroupEntity,
        { id: mockGroup.id },
        { name: 'Renamed' },
      );
      expect(result.name).toBe('Renamed');
    });

    it('clears other defaults before setting isDefault', async () => {
      managerMock.findOne.mockResolvedValue({
        ...mockGroup,
        isDefault: false,
      });
      managerMock.findOneOrFail.mockResolvedValue({
        ...mockGroup,
        isDefault: true,
      });

      await service.update(userId, mockGroup.id, { isDefault: true });

      expect(managerMock.update).toHaveBeenNthCalledWith(
        1,
        GroupEntity,
        { userId },
        { isDefault: false },
      );
      expect(managerMock.update).toHaveBeenNthCalledWith(
        2,
        GroupEntity,
        { id: mockGroup.id },
        { isDefault: true },
      );
    });

    it('ignores isDefault: false', async () => {
      managerMock.findOne.mockResolvedValue({
        ...mockGroup,
        isDefault: true,
      });
      managerMock.findOneOrFail.mockResolvedValue(mockGroup);

      await service.update(userId, mockGroup.id, { isDefault: false });

      expect(managerMock.update).not.toHaveBeenCalled();
    });

    it('maps a unique violation on rename to ConflictException', async () => {
      managerMock.findOne.mockResolvedValue({
        ...mockGroup,
        isDefault: false,
      });
      managerMock.update.mockRejectedValue({ code: '23505' });

      await expect(
        service.update(userId, mockGroup.id, { name: 'Taken' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unrelated errors on rename', async () => {
      managerMock.findOne.mockResolvedValue({
        ...mockGroup,
        isDefault: false,
      });
      managerMock.update.mockRejectedValue(new Error('boom'));

      await expect(
        service.update(userId, mockGroup.id, { name: 'Taken' }),
      ).rejects.toThrow('boom');
    });

    it('does nothing when neither name nor isDefault change', async () => {
      managerMock.findOne.mockResolvedValue({
        ...mockGroup,
        isDefault: false,
      });
      managerMock.findOneOrFail.mockResolvedValue(mockGroup);

      await service.update(userId, mockGroup.id, {});

      expect(managerMock.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws NotFoundException for a group owned by another user', async () => {
      managerMock.findOne.mockResolvedValue(null);

      await expect(service.remove(otherUserId, mockGroup.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes a non-default group without promoting another', async () => {
      managerMock.findOne.mockResolvedValue({
        ...mockGroup,
        isDefault: false,
      });

      await service.remove(userId, mockGroup.id);

      expect(managerMock.delete).toHaveBeenCalledWith(GroupEntity, {
        id: mockGroup.id,
      });
      expect(managerMock.findOne).toHaveBeenCalledTimes(1);
      expect(managerMock.update).not.toHaveBeenCalled();
    });

    it('promotes the oldest remaining group when the default is deleted', async () => {
      const oldest = { ...mockGroup, id: 'group-2', isDefault: false };
      managerMock.findOne
        .mockResolvedValueOnce({ ...mockGroup, isDefault: true })
        .mockResolvedValueOnce(oldest);

      await service.remove(userId, mockGroup.id);

      expect(managerMock.findOne).toHaveBeenNthCalledWith(2, GroupEntity, {
        where: { userId },
        order: { createdAt: 'ASC' },
      });
      expect(managerMock.update).toHaveBeenCalledWith(
        GroupEntity,
        { id: oldest.id },
        { isDefault: true },
      );
    });

    it('does not promote when no groups remain', async () => {
      managerMock.findOne
        .mockResolvedValueOnce({ ...mockGroup, isDefault: true })
        .mockResolvedValueOnce(null);

      await service.remove(userId, mockGroup.id);

      expect(managerMock.update).not.toHaveBeenCalled();
    });
  });

  describe('addPokemon', () => {
    const dto = { pokemonId: '25', speciesId: '25' };

    it('throws NotFoundException for a group owned by another user', async () => {
      groupsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addPokemon(otherUserId, mockGroup.id, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('inserts and returns the row', async () => {
      groupsRepository.findOne.mockResolvedValue(mockGroup);
      const execute = vi.fn().mockResolvedValue({});
      const qb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        orIgnore: vi.fn().mockReturnThis(),
        execute,
      };
      groupPokemonRepository.createQueryBuilder.mockReturnValue(qb as any);
      const savedRow: GroupPokemonEntity = {
        id: 'gp-1',
        groupId: mockGroup.id,
        pokemonId: '25',
        speciesId: '25',
        createdAt: new Date(),
        group: mockGroup,
      };
      groupPokemonRepository.findOne.mockResolvedValue(savedRow);

      const result = await service.addPokemon(userId, mockGroup.id, dto);

      expect(qb.values).toHaveBeenCalledWith({
        groupId: mockGroup.id,
        pokemonId: '25',
        speciesId: '25',
      });
      expect(qb.orIgnore).toHaveBeenCalled();
      expect(result).toEqual(savedRow);
    });

    it('is idempotent on re-add', async () => {
      groupsRepository.findOne.mockResolvedValue(mockGroup);
      const execute = vi.fn().mockResolvedValue({});
      const qb = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        orIgnore: vi.fn().mockReturnThis(),
        execute,
      };
      groupPokemonRepository.createQueryBuilder.mockReturnValue(qb as any);
      const existingRow: GroupPokemonEntity = {
        id: 'gp-1',
        groupId: mockGroup.id,
        pokemonId: '25',
        speciesId: '25',
        createdAt: new Date(),
        group: mockGroup,
      };
      groupPokemonRepository.findOne.mockResolvedValue(existingRow);

      await service.addPokemon(userId, mockGroup.id, dto);
      const result = await service.addPokemon(userId, mockGroup.id, dto);

      expect(execute).toHaveBeenCalledTimes(2);
      expect(result).toEqual(existingRow);
    });
  });

  describe('removePokemon', () => {
    it('throws NotFoundException for a group owned by another user', async () => {
      groupsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removePokemon(otherUserId, mockGroup.id, '25'),
      ).rejects.toThrow(NotFoundException);
    });

    it('does not throw when the pokemon is not a member', async () => {
      groupsRepository.findOne.mockResolvedValue(mockGroup);
      groupPokemonRepository.delete.mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: [],
      } as DeleteResult);

      await expect(
        service.removePokemon(userId, mockGroup.id, 'not-a-member'),
      ).resolves.toBeUndefined();
      expect(groupPokemonRepository.delete).toHaveBeenCalledWith({
        groupId: mockGroup.id,
        pokemonId: 'not-a-member',
      });
    });
  });

  describe('findPokemonForGroup', () => {
    it('throws NotFoundException for a group owned by another user', async () => {
      groupsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findPokemonForGroup(otherUserId, mockGroup.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns members ordered by creation', async () => {
      groupsRepository.findOne.mockResolvedValue(mockGroup);
      const rows: GroupPokemonEntity[] = [];
      groupPokemonRepository.find.mockResolvedValue(rows);

      const result = await service.findPokemonForGroup(userId, mockGroup.id);

      expect(groupPokemonRepository.find).toHaveBeenCalledWith({
        where: { groupId: mockGroup.id },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(rows);
    });
  });

  describe('findAllMembershipsForUser', () => {
    it('scopes the query to the user via an inner join on the group', async () => {
      const rows: GroupPokemonEntity[] = [
        {
          id: 'gp-1',
          groupId: mockGroup.id,
          pokemonId: '25',
          speciesId: '25',
          createdAt: new Date('2024-01-01'),
          group: mockGroup,
        },
      ];
      const qb = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(rows),
      };
      groupPokemonRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findAllMembershipsForUser(userId);

      expect(groupPokemonRepository.createQueryBuilder).toHaveBeenCalledWith(
        'group_pokemon',
      );
      expect(qb.innerJoin).toHaveBeenCalledWith('group_pokemon.group', 'group');
      expect(qb.where).toHaveBeenCalledWith('group.userId = :userId', {
        userId,
      });
      expect(qb.select).toHaveBeenCalledWith([
        'group_pokemon.id',
        'group_pokemon.groupId',
        'group_pokemon.pokemonId',
      ]);
      expect(qb.orderBy).toHaveBeenCalledWith('group_pokemon.createdAt', 'ASC');
      expect(result).toEqual(rows);
    });

    it('returns an empty array when the user has no memberships', async () => {
      const qb = {
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };
      groupPokemonRepository.createQueryBuilder.mockReturnValue(qb as any);

      const result = await service.findAllMembershipsForUser(otherUserId);

      expect(qb.where).toHaveBeenCalledWith('group.userId = :userId', {
        userId: otherUserId,
      });
      expect(result).toEqual([]);
    });
  });
});
