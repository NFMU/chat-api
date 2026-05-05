import { Seeder } from "@xlr8-nest/core/database";
import { DataSource } from "typeorm";
import { Location } from "../entities/location.entity";
import { locationData } from "../factories/datas/location.data";

export class LocationSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    const locationRepository = this.dataSource.getRepository(Location);
    const existingCodes = new Set(
      (await locationRepository.find({ select: { code: true } })).map(
        (location) => location.code,
      ),
    );

    for (const location of locationData) {
      if (existingCodes.has(location.code)) {
        continue;
      }

      await locationRepository.insert(location);
      existingCodes.add(location.code);
    }
  }
}
