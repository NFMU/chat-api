import {
  Column,
  Entity,
  Generated,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("locations")
export class Location {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Index("uq_locations_uuid", { unique: true })
  @Column({ type: "uuid" })
  @Generated("uuid")
  uuid: string;

  @Column({ type: "varchar", length: 2, unique: true })
  code: string;

  @Column({ type: "varchar", length: 120, unique: true })
  name: string;
}
