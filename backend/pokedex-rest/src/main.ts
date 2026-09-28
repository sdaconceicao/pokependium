import multipart from '@fastify/multipart';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { DataSource, DataSourceOptions } from 'typeorm';
import { runSeeders, SeederOptions } from 'typeorm-extension';
import { AppModule } from './app.module';
import { parseAllowedOrigins } from './config/allowed-origins';
import { createWinstonLogger } from './config/logging.config';
import { postgresDriver } from './config/postgres-driver';
import { GroupPokemonEntity } from './groups/group-pokemon.entity';
import { GroupEntity } from './groups/groups.entity';
import { UserEntity } from './users/users.entity';
import { AVATAR_MAX_BYTES } from './users/validation/avatar.validation';

async function bootstrap() {
  const winstonLogger = createWinstonLogger({
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIRECTORY || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    maxFiles: process.env.LOG_MAX_FILES || '14d',
    filename: process.env.LOG_FILENAME || 'application-%DATE%.log',
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: WinstonModule.createLogger({
        instance: winstonLogger,
      }),
    },
  );

  // The same allow-list gates CORS and the origins emailed links may point at
  // (see AuthService.resolveFrontendBaseUrl).
  app.enableCors({
    origin: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Size cap at the transport layer so an oversized body is cut off mid-stream.
  // `fields: 0` because the file is the entire payload.
  await app.register(multipart, {
    limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0 },
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pokedex REST API')
    .setDescription('Authentication and user management API for the Pokedex')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // Serve the swagger-ui assets from a CDN to work with serverless bundlers like Vercel.
  const swaggerUiCdn = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.32.8';
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customCssUrl: `${swaggerUiCdn}/swagger-ui.css`,
    customJs: [
      `${swaggerUiCdn}/swagger-ui-bundle.js`,
      `${swaggerUiCdn}/swagger-ui-standalone-preset.js`,
    ],
    customfavIcon: `${swaggerUiCdn}/favicon-32x32.png`,
  });

  if (process.env.NODE_ENV === 'test') {
    try {
      const configService = app.get(ConfigService);

      const dataSource = new DataSource({
        type: 'postgres',
        driver: postgresDriver,
        host: configService.get<string>('database.host')!,
        port: configService.get<number>('database.port')!,
        username: configService.get<string>('database.username')!,
        password: configService.get<string>('database.password')!,
        database: configService.get<string>('database.database')!,
        schema: configService.get<string>('database.schema')!,
        entities: [UserEntity, GroupEntity, GroupPokemonEntity],
        seeds: ['src/**/*.seed{.ts,.js}'],
        seedTracking: false,
      } as DataSourceOptions & SeederOptions);

      await dataSource.initialize();
      await runSeeders(dataSource);
      Logger.log('Database seeded successfully for test environment');
      await dataSource.destroy();
    } catch (error) {
      Logger.error('Error seeding database:', error);
    }
  }

  await app.listen(process.env.PORT ?? 3002, '0.0.0.0');
}
void bootstrap();
