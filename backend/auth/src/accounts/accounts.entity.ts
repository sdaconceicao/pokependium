import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts', { schema: 'auth' })
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  // Wrong-password streak; reset on success. Lockout window is passwordLockedUntil.
  @Column({ type: 'smallint', default: 0 })
  failedPasswordAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  passwordLockedUntil: Date | null;
}
