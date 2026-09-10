import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {}

  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findOneById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * First authenticated request for an auth account creates a local profile.
   * Auth never calls this service — the JWT `userId` is the shared key.
   */
  async ensureProfile(userId: string, email: string): Promise<UserEntity> {
    const existing = await this.findOneById(userId);
    if (existing) {
      return existing;
    }

    return this.create({
      id: userId,
      username: email,
      firstName: '',
      lastName: '',
    });
  }
}
