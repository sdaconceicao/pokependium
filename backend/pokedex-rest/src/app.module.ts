import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';

import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtGuard } from './auth/guards/jwt.guard';
import { JwtStrategy } from './auth/strategy/jwt.strategy';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';
import { postgresDriver } from './config/postgres-driver';
import { GroupsModule } from './groups/groups.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [databaseConfig],
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): PostgresDataSourceOptions => {
        const url = configService.get<string>('database.url');
        return {
          type: 'postgres',
          driver: postgresDriver,
          ...(url
            ? { url }
            : {
                host: configService.get('database.host')!,
                port: configService.get('database.port')!,
                username: configService.get('database.username')!,
                password: configService.get('database.password')!,
                database: configService.get('database.database')!,
              }),
          ssl: configService.get('database.ssl')!,
          schema: 'public',
          entities: [`${__dirname}/**/*.entity{.ts,.js}`],
          synchronize: false,
          logging: configService.get('database.logging')!,
          migrations: [`${__dirname}/migrations/*{.ts,.js}`],
          migrationsRun: configService.get('database.migrationsRun')!,
          migrationsTableName: 'migrations',
        };
      },
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    UsersModule,
    GroupsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
    JwtStrategy,
  ],
})
export class AppModule {}
