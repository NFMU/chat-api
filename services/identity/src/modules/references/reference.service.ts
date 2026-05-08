import { Injectable } from "@nestjs/common";
import { NotFoundError } from "@xlr8-nest/core/errors";
import { ReferenceError } from "src/core/errors/reference.error";
import {
  LanguageListOutput,
  LanguageOutput,
  LocationListOutput,
  LocationOutput,
  TimezoneListOutput,
  TimezoneOutput,
} from "./outputs";
import { ReferenceRepository } from "./reference.repository";

@Injectable()
export class ReferenceService {
  constructor(private readonly referenceRepository: ReferenceRepository) {}

  // ----- Languages -----

  async listLanguages(): Promise<LanguageListOutput> {
    const rows = await this.referenceRepository.listLanguages();
    return { items: rows.map((row) => this.toLanguageOutput(row)) };
  }

  async getLanguageByUuid(uuid: string): Promise<LanguageOutput> {
    const row = await this.referenceRepository.getLanguageByUuid(uuid);
    if (!row) {
      throw new NotFoundError(ReferenceError.LanguageNotFound);
    }
    return this.toLanguageOutput(row);
  }

  // ----- Timezones -----

  async listTimezones(): Promise<TimezoneListOutput> {
    const rows = await this.referenceRepository.listTimezones();
    return { items: rows.map((row) => this.toTimezoneOutput(row)) };
  }

  async getTimezoneByUuid(uuid: string): Promise<TimezoneOutput> {
    const row = await this.referenceRepository.getTimezoneByUuid(uuid);
    if (!row) {
      throw new NotFoundError(ReferenceError.TimezoneNotFound);
    }
    return this.toTimezoneOutput(row);
  }

  // ----- Locations -----

  async listLocations(): Promise<LocationListOutput> {
    const rows = await this.referenceRepository.listLocations();
    return { items: rows.map((row) => this.toLocationOutput(row)) };
  }

  async getLocationByUuid(uuid: string): Promise<LocationOutput> {
    const row = await this.referenceRepository.getLocationByUuid(uuid);
    if (!row) {
      throw new NotFoundError(ReferenceError.LocationNotFound);
    }
    return this.toLocationOutput(row);
  }

  private toLanguageOutput(row: {
    id: number;
    uuid: string;
    code: string;
    locale: string;
    name: string;
  }): LanguageOutput {
    return {
      uuid: row.uuid,
      id: row.id,
      code: row.code,
      locale: row.locale,
      name: row.name,
    };
  }

  private toTimezoneOutput(row: {
    id: number;
    uuid: string;
    name: string;
    utc_offset: string;
  }): TimezoneOutput {
    return {
      uuid: row.uuid,
      id: row.id,
      name: row.name,
      utc_offset: row.utc_offset,
    };
  }

  private toLocationOutput(row: {
    id: number;
    uuid: string;
    code: string;
    name: string;
  }): LocationOutput {
    return {
      uuid: row.uuid,
      id: row.id,
      code: row.code,
      name: row.name,
    };
  }
}
