import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from './accounts.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private accountsRepository: Repository<AccountEntity>,
  ) {}

  async create(accountData: Partial<AccountEntity>): Promise<AccountEntity> {
    const account = this.accountsRepository.create(accountData);
    return this.accountsRepository.save(account);
  }

  async findOneByEmail(email: string): Promise<AccountEntity | null> {
    return this.accountsRepository.findOne({ where: { email } });
  }

  async findOneById(id: string): Promise<AccountEntity | null> {
    return this.accountsRepository.findOne({ where: { id } });
  }

  async update(
    id: string,
    accountData: Partial<AccountEntity>,
  ): Promise<AccountEntity | null> {
    await this.accountsRepository.update(id, accountData);
    return this.findOneById(id);
  }

  /**
   * Atomically increments the failed-password counter. If the lock window has
   * expired, the streak resets to 1 instead of continuing from the old count.
   */
  async recordFailedPasswordAttempt(
    accountId: string,
    maxAttempts: number,
    lockoutMs: number,
  ): Promise<void> {
    const lockedUntil = new Date(Date.now() + lockoutMs);

    await this.accountsRepository
      .createQueryBuilder()
      .update(AccountEntity)
      .set({
        failedPasswordAttempts: () =>
          `CASE WHEN "passwordLockedUntil" IS NOT NULL AND "passwordLockedUntil" <= NOW() THEN 1 ELSE "failedPasswordAttempts" + 1 END`,
        passwordLockedUntil: () =>
          `CASE WHEN (CASE WHEN "passwordLockedUntil" IS NOT NULL AND "passwordLockedUntil" <= NOW() THEN 1 ELSE "failedPasswordAttempts" + 1 END) >= :maxAttempts THEN :lockedUntil ELSE NULL END`,
      })
      .setParameter('maxAttempts', maxAttempts)
      .setParameter('lockedUntil', lockedUntil)
      .where('id = :accountId', { accountId })
      .execute();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.accountsRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
