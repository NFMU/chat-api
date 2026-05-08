import {
  Column,
  Entity,
  Generated,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("timezones")
export class Timezone {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Index("uq_timezones_uuid", { unique: true })
  @Column({ type: "uuid" })
  @Generated("uuid")
  uuid: string;

  @Column({ type: "varchar", length: 100, unique: true })
  name: string;

  @Column({ type: "varchar", length: 10 })
  utc_offset: string;
}
