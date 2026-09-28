import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAvatarEntity } from './user-avatar.entity';
import { AvatarMimeType } from './validation/avatar.validation';

@Injectable()
export class AvatarsService {
  constructor(
    @InjectRepository(UserAvatarEntity)
    private avatarsRepository: Repository<UserAvatarEntity>,
  ) {}

  async upsert(
    userId: string,
    mimeType: AvatarMimeType,
    data: Buffer,
  ): Promise<UserAvatarEntity> {
    return this.avatarsRepository.save({ userId, mimeType, data });
  }

  async findOneByUserId(userId: string): Promise<UserAvatarEntity | null> {
    return this.avatarsRepository.findOne({ where: { userId } });
  }

  async remove(userId: string): Promise<boolean> {
    const result = await this.avatarsRepository.delete({ userId });
    return (result.affected ?? 0) > 0;
  }
}
