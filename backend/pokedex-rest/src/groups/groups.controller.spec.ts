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
import { AccessTokenPayload } from '../auth/types/AccessTokenPayload';
import { GroupPokemonEntity } from './group-pokemon.entity';
import { GroupsController } from './groups.controller';
import { GroupEntity } from './groups.entity';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let controller: GroupsController;
  let groupsService: Mocked<GroupsService>;

  const user: AccessTokenPayload = {
    userId: 'user-1' as never,
    email: 'ash@pallet.town',
  };

  const mockGroup: GroupEntity = {
    id: 'group-1',
    userId: user.userId,
    name: 'My Team',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    pokemon: [],
  };

  const mockGroupPokemon: GroupPokemonEntity = {
    id: 'gp-1',
    groupId: mockGroup.id,
    pokemonId: '25',
    speciesId: '25',
    createdAt: new Date('2024-01-01'),
    group: mockGroup,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: {
            findAllForUser: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
            findPokemonForGroup: vi.fn(),
            addPokemon: vi.fn(),
            removePokemon: vi.fn(),
            findAllMembershipsForUser: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    groupsService = module.get(GroupsService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('maps groups to response DTOs, including the loaded pokemon count', async () => {
      groupsService.findAllForUser.mockResolvedValue([
        { ...mockGroup, pokemonCount: 3 },
      ]);

      const result = await controller.findAll(user);

      expect(groupsService.findAllForUser).toHaveBeenCalledWith(user.userId);
      expect(result).toEqual([
        {
          id: mockGroup.id,
          name: mockGroup.name,
          isDefault: mockGroup.isDefault,
          pokemonCount: 3,
        },
      ]);
    });
  });

  describe('create', () => {
    it('defaults pokemonCount to 0 for a freshly created group', async () => {
      groupsService.create.mockResolvedValue(mockGroup);

      const result = await controller.create(user, { name: 'My Team' });

      expect(groupsService.create).toHaveBeenCalledWith(user.userId, {
        name: 'My Team',
      });
      expect(result).toEqual({
        id: mockGroup.id,
        name: mockGroup.name,
        isDefault: mockGroup.isDefault,
        pokemonCount: 0,
      });
    });
  });

  describe('update', () => {
    it('maps the reloaded group to a response DTO', async () => {
      groupsService.update.mockResolvedValue({
        ...mockGroup,
        name: 'Renamed',
      });

      const result = await controller.update(user, mockGroup.id, {
        name: 'Renamed',
      });

      expect(groupsService.update).toHaveBeenCalledWith(
        user.userId,
        mockGroup.id,
        { name: 'Renamed' },
      );
      expect(result.name).toBe('Renamed');
      expect(result.pokemonCount).toBe(0);
    });
  });

  describe('remove', () => {
    it('delegates to the service and returns nothing', async () => {
      groupsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(user, mockGroup.id);

      expect(groupsService.remove).toHaveBeenCalledWith(
        user.userId,
        mockGroup.id,
      );
      expect(result).toBeUndefined();
    });
  });

  describe('findPokemon', () => {
    it('maps group pokemon to response DTOs', async () => {
      groupsService.findPokemonForGroup.mockResolvedValue([mockGroupPokemon]);

      const result = await controller.findPokemon(user, mockGroup.id);

      expect(groupsService.findPokemonForGroup).toHaveBeenCalledWith(
        user.userId,
        mockGroup.id,
      );
      expect(result).toEqual([{ pokemonId: '25', speciesId: '25' }]);
    });
  });

  describe('addPokemon', () => {
    it('maps the created row to a response DTO', async () => {
      groupsService.addPokemon.mockResolvedValue(mockGroupPokemon);
      const dto = { pokemonId: '25', speciesId: '25' };

      const result = await controller.addPokemon(user, mockGroup.id, dto);

      expect(groupsService.addPokemon).toHaveBeenCalledWith(
        user.userId,
        mockGroup.id,
        dto,
      );
      expect(result).toEqual({ pokemonId: '25', speciesId: '25' });
    });
  });

  describe('removePokemon', () => {
    it('delegates to the service and returns nothing', async () => {
      groupsService.removePokemon.mockResolvedValue(undefined);

      const result = await controller.removePokemon(user, mockGroup.id, '25');

      expect(groupsService.removePokemon).toHaveBeenCalledWith(
        user.userId,
        mockGroup.id,
        '25',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('findAllMemberships', () => {
    it('maps memberships to response DTOs, scoped to the user', async () => {
      groupsService.findAllMembershipsForUser.mockResolvedValue([
        mockGroupPokemon,
      ]);

      const result = await controller.findAllMemberships(user);

      expect(groupsService.findAllMembershipsForUser).toHaveBeenCalledWith(
        user.userId,
      );
      expect(result).toEqual([{ groupId: mockGroup.id, pokemonId: '25' }]);
    });

    it('returns an empty array when the user has no memberships', async () => {
      groupsService.findAllMembershipsForUser.mockResolvedValue([]);

      const result = await controller.findAllMemberships(user);

      expect(result).toEqual([]);
    });
  });
});
