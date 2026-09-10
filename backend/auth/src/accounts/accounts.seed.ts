import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { AccountEntity } from './accounts.entity';

export default class AccountSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(AccountEntity);

    const existing = await repository.findOne({
      where: { email: 'test@test.com' },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash('Test@Password123', 10);

      await repository.insert({
        // Same id as pokedex-rest UserSeeder so the e2e fixture profile matches.
        id: '11111111-1111-4111-8111-111111111111',
        email: 'test@test.com',
        password: hashedPassword,
        emailVerified: true,
      });
      console.log('Test account created successfully');
      return;
    }

    if (!existing.emailVerified) {
      await repository.update(existing.id, { emailVerified: true });
      console.log('Test account marked email-verified');
      return;
    }

    console.log('Test account already exists');
  }
}
