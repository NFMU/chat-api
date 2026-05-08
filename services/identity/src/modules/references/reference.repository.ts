import { Injectable } from "@nestjs/common";
import { TypeOrmClient } from "@xlr8-nest/core/database";
import { Language } from "src/database/entities/language.entity";
import { Location } from "src/database/entities/location.entity";
import { Timezone } from "src/database/entities/timezone.entity";

@Injectable()
export class ReferenceRepository {
  constructor(private readonly typeOrmClient: TypeOrmClient) {}

  private get languageModel() {
    return this.typeOrmClient.client.getRepository(Language);
  }

  private get timezoneModel() {
    return this.typeOrmClient.client.getRepository(Timezone);
  }

  private get locationModel() {
    return this.typeOrmClient.client.getRepository(Location);
  }

  // ----- Languages -----

  listLanguages(): Promise<Language[]> {
    return this.languageModel.find({ order: { id: "ASC" } });
  }

  getLanguageByUuid(uuid: string): Promise<Language | null> {
    return this.languageModel.findOne({ where: { uuid } });
  }

  /**
   * Internal use only — for same-service foreign keys such as user_settings.language_id.
   * Cross-service consumers must use getLanguageByUuid().
   */
  getLanguageById(id: number): Promise<Language | null> {
    return this.languageModel.findOne({ where: { id } });
  }

  // ----- Timezones -----

  listTimezones(): Promise<Timezone[]> {
    return this.timezoneModel.find({ order: { id: "ASC" } });
  }

  getTimezoneByUuid(uuid: string): Promise<Timezone | null> {
    return this.timezoneModel.findOne({ where: { uuid } });
  }

  /**
   * Internal use only — for same-service foreign keys such as user_settings.timezone_id.
   * Cross-service consumers must use getTimezoneByUuid().
   */
  getTimezoneById(id: number): Promise<Timezone | null> {
    return this.timezoneModel.findOne({ where: { id } });
  }

  // ----- Locations -----

  listLocations(): Promise<Location[]> {
    return this.locationModel.find({ order: { id: "ASC" } });
  }

  getLocationByUuid(uuid: string): Promise<Location | null> {
    return this.locationModel.findOne({ where: { uuid } });
  }

  /**
   * Internal use only — for same-service foreign keys such as user_profiles.location_id.
   * Cross-service consumers must use getLocationByUuid().
   */
  getLocationById(id: number): Promise<Location | null> {
    return this.locationModel.findOne({ where: { id } });
  }
}
