import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const passwordResetConfirmInputSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export class PasswordResetConfirmInput {
  @ApiProperty({
    description: "Password reset token from the reset email",
    example: "A8M3fW8T1kXfJ2ZpQ0nK...",
  })
  token: string;

  @ApiProperty({
    description: "New password",
    example: "password123",
  })
  password: string;

  @ApiProperty({
    description: "New password confirmation",
    example: "password123",
  })
  confirmPassword: string;
}

