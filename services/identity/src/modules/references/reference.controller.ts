import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiSuccess } from "@xlr8-nest/core/response";
import { ApiGet } from "@xlr8-nest/core/openapi";
import { buildSuccessResponseProxy } from "src/core/utils";
import {
  LanguageListOutput,
  LanguageOutput,
  LocationListOutput,
  LocationOutput,
  TimezoneListOutput,
  TimezoneOutput,
} from "./outputs";
import { ReferenceService } from "./reference.service";

@Controller("reference")
export class ReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get("languages")
  @ApiGet(LanguageListOutput, {
    description: "List all supported UI languages",
    summary: "List Languages",
  })
  async listLanguages(): Promise<ApiSuccess<LanguageListOutput>> {
    const result = await this.referenceService.listLanguages();
    return buildSuccessResponseProxy(result);
  }

  @Get("languages/:uuid")
  @ApiGet(LanguageOutput, {
    description: "Get a single language by uuid",
    summary: "Get Language",
  })
  async getLanguage(
    @Param("uuid", ParseUUIDPipe) uuid: string,
  ): Promise<ApiSuccess<LanguageOutput>> {
    const result = await this.referenceService.getLanguageByUuid(uuid);
    return buildSuccessResponseProxy(result);
  }

  @Get("timezones")
  @ApiGet(TimezoneListOutput, {
    description: "List all supported timezones",
    summary: "List Timezones",
  })
  async listTimezones(): Promise<ApiSuccess<TimezoneListOutput>> {
    const result = await this.referenceService.listTimezones();
    return buildSuccessResponseProxy(result);
  }

  @Get("timezones/:uuid")
  @ApiGet(TimezoneOutput, {
    description: "Get a single timezone by uuid",
    summary: "Get Timezone",
  })
  async getTimezone(
    @Param("uuid", ParseUUIDPipe) uuid: string,
  ): Promise<ApiSuccess<TimezoneOutput>> {
    const result = await this.referenceService.getTimezoneByUuid(uuid);
    return buildSuccessResponseProxy(result);
  }

  @Get("locations")
  @ApiGet(LocationListOutput, {
    description: "List all supported countries / regions",
    summary: "List Locations",
  })
  async listLocations(): Promise<ApiSuccess<LocationListOutput>> {
    const result = await this.referenceService.listLocations();
    return buildSuccessResponseProxy(result);
  }

  @Get("locations/:uuid")
  @ApiGet(LocationOutput, {
    description: "Get a single location by uuid",
    summary: "Get Location",
  })
  async getLocation(
    @Param("uuid", ParseUUIDPipe) uuid: string,
  ): Promise<ApiSuccess<LocationOutput>> {
    const result = await this.referenceService.getLocationByUuid(uuid);
    return buildSuccessResponseProxy(result);
  }
}
