import { Seeder } from "@xlr8-nest/core/database";
import { DataSource } from "typeorm";
import { Language } from "../entities/language.entity";
import { languageData } from "../factories/datas/language.data";

export class LanguageSeeder extends Seeder {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  async run(): Promise<void> {
    const languageRepository = this.dataSource.getRepository(Language);
    const existingCodes = new Set(
      (await languageRepository.find({ select: { code: true } })).map(
        (language) => language.code,
      ),
    );

    for (const language of languageData) {
      if (existingCodes.has(language.code)) {
        continue;
      }

      await languageRepository.insert(language);
      existingCodes.add(language.code);
    }
  }
}
