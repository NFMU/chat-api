import { ApiProperty } from "@nestjs/swagger";

export class SessionOutput {
  @ApiProperty({ example: "57362fa5-91e8-4a91-a3db-945cf498cb75" })
  id: string;

  @ApiProperty({
    example: "Chrome on Windows",
    required: false,
    nullable: true,
  })
  device_name?: string | null;

  @ApiProperty({ example: "203.0.113.10", required: false, nullable: true })
  ip_address?: string | null;

  @ApiProperty({ example: "Mozilla/5.0", required: false, nullable: true })
  user_agent?: string | null;

  @ApiProperty({ example: "2026-05-05T08:00:00.000Z", nullable: true })
  last_used_at?: string | null;

  @ApiProperty({ example: "2026-06-04T08:00:00.000Z" })
  expires_at: string;

  @ApiProperty({ example: null, nullable: true })
  revoked_at?: string | null;

  @ApiProperty({ example: "2026-05-05T08:00:00.000Z" })
  created_at: string;
}

export class SessionListOutput {
  @ApiProperty({ type: [SessionOutput] })
  items: SessionOutput[];
}
