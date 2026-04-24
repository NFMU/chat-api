import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_profiles' })
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('uq_user_profiles_user_id', { unique: true })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'display_name', type: 'varchar', length: 120, nullable: true })
  displayName?: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 120, nullable: true })
  firstName?: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 120, nullable: true })
  lastName?: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 32, nullable: true })
  phoneNumber?: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
