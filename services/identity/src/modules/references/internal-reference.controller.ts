import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { ApiSuccess } from "@xlr8-nest/core/response";
import { ApiGet } from "@xlr8-nest/core/openapi";
import { ServiceAuth } from "src/core/decorators/service-auth.decorator";
import { ServiceTokenGuard } from "src/core/guards/service-token.guard";
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

@Controller("internal/reference")
// @UseGuards(ServiceTokenGuard)
// @ServiceAuth()
export class InternalReferenceController {
  constructor(private readonly referenceService: ReferenceService) {}

  @Get("languages")
  @ApiGet(LanguageListOutput, {
    description:
      "Inter-service: list all languages. Cache locally with periodic refresh.",
    summary: "Internal List Languages",
  })
  async listLanguages(): Promise<ApiSuccess<LanguageListOutput>> {
    const result = await this.referenceService.listLanguages();
    return buildSuccessResponseProxy(result);
  }

  @Get("languages/:uuid")
  @ApiGet(LanguageOutput, {
    description:
      "Inter-service: validate / fetch a language by uuid. Returns 404 if not found.",
    summary: "Internal Get Language",
  })
  async getLanguage(
    @Param("uuid", ParseUUIDPipe) uuid: string,
  ): Promise<ApiSuccess<LanguageOutput>> {
    const result = await this.referenceService.getLanguageByUuid(uuid);
    return buildSuccessResponseProxy(result);
  }

  @Get("timezones")
  @ApiGet(TimezoneListOutput, {
    description:
      "Inter-service: list all timezones. Cache locally with periodic refresh.",
    summary: "Internal List Timezones",
  })
  async listTimezones(): Promise<ApiSuccess<TimezoneListOutput>> {
    const result = await this.referenceService.listTimezones();
    return buildSuccessResponseProxy(result);
  }

  @Get("timezones/:uuid")
  @ApiGet(TimezoneOutput, {
    description:
      "Inter-service: validate / fetch a timezone by uuid. Returns 404 if not found.",
    summary: "Internal Get Timezone",
  })
  async getTimezone(
    @Param("uuid", ParseUUIDPipe) uuid: string,
  ): Promise<ApiSuccess<TimezoneOutput>> {
    const result = await this.referenceService.getTimezoneByUuid(uuid);
    return buildSuccessResponseProxy(result);
  }

  @Get("locations")
  @ApiGet(LocationListOutput, {
    description:
      "Inter-service: list all locations. Cache locally with periodic refresh.",
    summary: "Internal List Locations",
  })
  async listLocations(): Promise<ApiSuccess<LocationListOutput>> {
    const result = await this.referenceService.listLocations();
    return buildSuccessResponseProxy(result);
  }

  @Get("locations/:uuid")
  @ApiGet(LocationOutput, {
    description:
      "Inter-service: validate / fetch a location by uuid. Returns 404 if not found.",
    summary: "Internal Get Location",
  })
  async getLocation(
    @Param("uuid", ParseUUIDPipe) uuid: string,
  ): Promise<ApiSuccess<LocationOutput>> {
    const result = await this.referenceService.getLocationByUuid(uuid);
    return buildSuccessResponseProxy(result);
  }
}
