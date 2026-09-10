import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AccountEntity } from './accounts/accounts.entity';
import { postgresDriver } from './config/postgres-driver';

config();

async function runMigrations() {
  // Use the unpooled URL for migrations — DDL should not go through PgBouncer.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const dataSource = new DataSource({
    type: 'postgres',
    driver: postgresDriver,
    ...(url
      ? { url }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5433', 10),
          username: process.env.DB_USERNAME || 'pokedex_user',
          password: process.env.DB_PASSWORD || 'pokedex_password',
          database: process.env.DB_DATABASE || 'pokedex',
        }),
    ssl: process.env.DB_SSL === 'true' || !!url,
    schema: 'public',
    entities: [AccountEntity],
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
    migrationsTableName: 'auth_migrations',
  });

  await dataSource.initialize();
  const migrations = await dataSource.runMigrations();
  console.log(
    `Ran ${migrations.length} migration(s):`,
    migrations.map((m) => m.name),
  );
  await dataSource.destroy();
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
