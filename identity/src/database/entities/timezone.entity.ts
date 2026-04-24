import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('timezones')
export class Timezone{
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  utc_offset: string;
}