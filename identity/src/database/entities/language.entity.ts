import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("languages")
export class Language {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 10, unique: true })
  code: string;

  @Column({ type: "varchar", length: 100, unique: true })
  locale: string;

  @Column({ type: "varchar", length: 120, unique: true })
  name: string;
}
