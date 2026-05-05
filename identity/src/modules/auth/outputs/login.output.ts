import { ApiProperty } from "@nestjs/swagger";

export class LoginOutput {
  @ApiProperty({
    description: "Short-lived JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  access_token: string;

  @ApiProperty({
    description: "Opaque refresh token",
    example: "A8M3fW8T1kXfJ2ZpQ0nK...",
  })
  refresh_token: string;

  @ApiProperty({
    description: "Token type",
    example: "Bearer",
  })
  token_type: "Bearer";

  @ApiProperty({
    description: "Access token lifetime in seconds",
    example: 900,
  })
  expires_in: number;

  @ApiProperty({
    description: "User session id",
    example: "57362fa5-91e8-4a91-a3db-945cf498cb75",
  })
  session_id: string;
}
