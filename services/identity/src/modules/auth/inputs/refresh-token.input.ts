import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const refreshTokenInputSchema = z.object({
  refresh_token: z.string().min(1),
});

export class RefreshTokenInput {
  @ApiProperty({
    description: "Opaque refresh token issued by login or refresh",
    example: "A8M3fW8T1kXfJ2ZpQ0nK...",
  })
  refresh_token: string;
}

