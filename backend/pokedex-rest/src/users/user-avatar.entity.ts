import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_avatars', { schema: 'users' })
export class UserAvatarEntity {
  // PK is the FK; no relation decorator, matching GroupEntity.
  @PrimaryColumn({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 32 })
  mimeType: string;

  @Column({ type: 'bytea' })
  data: Buffer;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
