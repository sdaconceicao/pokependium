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

  async findOneByUsername(username: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    userData: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    await this.usersRepository.update(id, userData);
    return this.findOneById(id);
  }

  /**
   * Atomically increments the failed-password counter. If the lock window has
   * expired, the streak resets to 1 instead of continuing from the old count.
   */
  async recordFailedPasswordAttempt(
    userId: string,
    maxAttempts: number,
    lockoutMs: number,
  ): Promise<void> {
    const lockedUntil = new Date(Date.now() + lockoutMs);

    await this.usersRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        failedPasswordAttempts: () =>
          `CASE WHEN "passwordLockedUntil" IS NOT NULL AND "passwordLockedUntil" <= NOW() THEN 1 ELSE "failedPasswordAttempts" + 1 END`,
        passwordLockedUntil: () =>
          `CASE WHEN (CASE WHEN "passwordLockedUntil" IS NOT NULL AND "passwordLockedUntil" <= NOW() THEN 1 ELSE "failedPasswordAttempts" + 1 END) >= :maxAttempts THEN :lockedUntil ELSE NULL END`,
      })
      .setParameter('maxAttempts', maxAttempts)
      .setParameter('lockedUntil', lockedUntil)
      .where('id = :userId', { userId })
      .execute();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.usersRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
