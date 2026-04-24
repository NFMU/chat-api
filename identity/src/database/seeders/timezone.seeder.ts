import { Seeder } from "@xlr8-nest/core/database";
import { DataSource } from "typeorm";
import { Timezone } from "../entities/timezone.entity";
import { timezoneData } from "../factories/datas/timezone.data";

export class TimezoneSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    const timezoneRepository = this.dataSource.getRepository(Timezone);
    const existingNames = new Set(
      (await timezoneRepository.find({ select: { name: true } })).map(
        (timezone) => timezone.name,
      ),
    );

    for (const timezone of timezoneData) {
      if (existingNames.has(timezone.name)) {
        continue;
      }

      await timezoneRepository.insert(timezone);
      existingNames.add(timezone.name);
    }
  }
}
