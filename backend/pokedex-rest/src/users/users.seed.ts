import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { UserEntity } from './users.entity';

/** Shared with backend/auth AccountSeeder so e2e can sign in as this profile. */
export const TEST_ACCOUNT_ID = '11111111-1111-4111-8111-111111111111';

export default class UserSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UserEntity);

    const existingUser = await repository.findOne({
      where: { id: TEST_ACCOUNT_ID },
    });

    if (!existingUser) {
      await repository.insert({
        id: TEST_ACCOUNT_ID,
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      });
      console.log('Test profile created successfully');
      return;
    }

    console.log('Test profile already exists');
  }
}
