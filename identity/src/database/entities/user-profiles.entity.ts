import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Location } from "./location.entity";
import { User } from "./user.entity";

@Entity({ name: "user_profiles" })
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("uq_user_profiles_user_id", { unique: true })
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({
    name: "display_name",
    type: "varchar",
    length: 120,
    nullable: true,
  })
  displayName?: string | null;

  @Column({ name: "first_name", type: "varchar", length: 120, nullable: true })
  firstName?: string | null;

  @Column({ name: "last_name", type: "varchar", length: 120, nullable: true })
  lastName?: string | null;

  @Column({ name: "phone_number", type: "varchar", length: 32, nullable: true })
  phoneNumber?: string | null;

  @Column({ name: "job_title", type: "varchar", length: 120, nullable: true })
  jobTitle?: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  company?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  website?: string | null;

  @Index("idx_user_profiles_location_id")
  @Column({ name: "location_id", type: "integer", nullable: true })
  locationId?: number | null;

  @Column({ name: "avatar_url", type: "varchar", length: 500, nullable: true })
  avatarUrl?: string | null;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth?: string | null;

  @Column({ type: "text", nullable: true })
  bio?: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.profile, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Location, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "location_id" })
  location?: Location | null;
}
