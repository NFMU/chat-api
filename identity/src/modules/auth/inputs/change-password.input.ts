import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const changePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export class ChangePasswordInput {
  @ApiProperty({
    description: "Current password",
    example: "oldpassword123",
  })
  currentPassword: string;

  @ApiProperty({
    description: "New password",
    example: "newpassword123",
  })
  newPassword: string;

  @ApiProperty({
    description: "New password confirmation",
    example: "newpassword123",
  })
  confirmPassword: string;
}

