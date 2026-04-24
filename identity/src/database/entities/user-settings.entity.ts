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
import { Language } from "./language.entity";
import { Timezone } from "./timezone.entity";
import { User } from "./user.entity";

export enum UserTheme {
  SYSTEM = "system",
  LIGHT = "light",
  DARK = "dark",
}

@Entity({ name: "user_settings" })
export class UserSettings {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("uq_user_settings_user_id", { unique: true })
  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "language_id", type: "integer", default: 1 })
  languageId: number;

  @Column({ name: "timezone_id", type: "integer", default: 1 })
  timezoneId: number;

  @Column({
    type: "enum",
    enum: UserTheme,
    default: UserTheme.SYSTEM,
  })
  theme: UserTheme;

  @Column({ name: "two_factor_enabled", type: "boolean", default: false })
  twoFactorEnabled: boolean;

  @Column({
    name: "marketing_emails_enabled",
    type: "boolean",
    default: false,
  })
  marketingEmailsEnabled: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToOne(() => User, (user) => user.settings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Language, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "language_id" })
  language: Language;

  @ManyToOne(() => Timezone, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "timezone_id" })
  timezone: Timezone;
}
