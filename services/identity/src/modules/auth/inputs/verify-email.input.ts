import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const verifyEmailInputSchema = z.object({
  token: z.string().min(1),
});

export class VerifyEmailInput {
  @ApiProperty({
    description: "Email verification token from the frontend verification link",
    example: "A8M3fW8T1kXfJ2ZpQ0nK...",
  })
  token: string;
}

