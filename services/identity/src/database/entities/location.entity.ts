import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("locations")
export class Location {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 2, unique: true })
  code: string;

  @Column({ type: "varchar", length: 120, unique: true })
  name: string;
}
