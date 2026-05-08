import { ApiProperty } from "@nestjs/swagger";

export class TimezoneOutput {
  @ApiProperty({
    example: "57362fa5-91e8-4a91-a3db-945cf498cb75",
    description:
      "Stable cross-service identifier. Use this when referencing a timezone from another service.",
  })
  uuid: string;

  @ApiProperty({
    example: 1,
    description:
      "Internal integer id. Used by identity-service intra-DB foreign keys (e.g. user_settings.timezone_id). Not for cross-service use.",
  })
  id: number;

  @ApiProperty({ example: "Asia/Ho_Chi_Minh", description: "IANA timezone name" })
  name: string;

  @ApiProperty({ example: "+07:00", description: "Display-only UTC offset" })
  utc_offset: string;
}

export class TimezoneListOutput {
  @ApiProperty({ type: [TimezoneOutput] })
  items: TimezoneOutput[];
}
