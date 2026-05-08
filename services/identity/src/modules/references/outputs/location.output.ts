import { ApiProperty } from "@nestjs/swagger";

export class LocationOutput {
  @ApiProperty({
    example: "8d5b6e1c-3c34-4a2c-9b6f-1f0a2d4b5c6d",
    description:
      "Stable cross-service identifier. Use this when referencing a location from another service.",
  })
  uuid: string;

  @ApiProperty({
    example: 1,
    description:
      "Internal integer id. Used by identity-service intra-DB foreign keys (e.g. user_profiles.location_id). Not for cross-service use.",
  })
  id: number;

  @ApiProperty({ example: "VN", description: "ISO 3166-1 alpha-2 country code" })
  code: string;

  @ApiProperty({ example: "Vietnam", description: "Display name in English" })
  name: string;
}

export class LocationListOutput {
  @ApiProperty({ type: [LocationOutput] })
  items: LocationOutput[];
}
