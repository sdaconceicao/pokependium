import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvatarsService } from './avatars.service';
import { UserAvatarEntity } from './user-avatar.entity';
import { UsersController } from './users.controller';
import { UserEntity } from './users.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserAvatarEntity])],
  controllers: [UsersController],
  providers: [UsersService, AvatarsService],
  exports: [UsersService, AvatarsService],
})
export class UsersModule {}
