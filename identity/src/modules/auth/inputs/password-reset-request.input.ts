import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const passwordResetRequestInputSchema = z.object({
  email: z.email(),
});

export class PasswordResetRequestInput {
  @ApiProperty({
    description: "Email address for password reset",
    example: "user@example.com",
  })
  email: string;
}

