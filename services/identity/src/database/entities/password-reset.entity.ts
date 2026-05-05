import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'password_resets' })
@Index('idx_password_resets_user_id', ['userId'])
@Index('uq_password_resets_token_hash', ['tokenHash'], { unique: true })
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ name: 'requested_ip', type: 'varchar', length: 45, nullable: true })
  requestedIp?: string | null;

  @Column({ name: 'requested_user_agent', type: 'text', nullable: true })
  requestedUserAgent?: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.passwordResets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
