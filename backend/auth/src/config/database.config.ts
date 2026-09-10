import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  type: 'postgres';
  url?: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: string[];
  synchronize: boolean;
  logging: boolean;
  migrationsRun: boolean;
  ssl: boolean;
}

export default registerAs<DatabaseConfig>('database', () => ({
  type: 'postgres',
  // A connection URL (e.g. injected by the Vercel/Neon integration) takes
  // precedence over the discrete DB_* vars and implies a TLS connection.
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'pokedex_user',
  password: process.env.DB_PASSWORD || 'pokedex_password',
  database: process.env.DB_DATABASE || 'pokedex',
  entities: [`${__dirname}/../**/*.entity{.ts,.js}`],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  migrationsRun:
    process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1',
  ssl: process.env.DB_SSL === 'true' || !!process.env.DATABASE_URL,
}));
