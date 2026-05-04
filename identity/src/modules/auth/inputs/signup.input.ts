import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export const signupInputSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    firstName: z.string().min(1).max(120),
    lastName: z.string().min(1).max(120),
    displayName: z.string().max(120).optional(),
    phoneNumber: z.string().max(32).optional(),
    jobTitle: z.string().max(120).optional(),
    company: z.string().max(120).optional(),
    website: z.url().max(500).optional(),
    location_id: z.number().int().positive().optional(),
    bio: z.string().optional(),
    language_id: z.number().int().positive().optional(),
    timezone_id: z.number().int().positive().optional(),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export class SignupInput {
  @ApiProperty({
    description: "The email address of the user",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({
    description: "The password of the user",
    example: "password123",
  })
  password: string;

  @ApiProperty({
    description: "The confirmation password of the user",
    example: "password123",
  })
  confirmPassword: string;

  @ApiProperty({
    description: "The first name of the user",
    example: "John",
  })
  firstName: string;

  @ApiProperty({
    description: "The last name of the user",
    example: "Doe",
  })
  lastName: string;

  @ApiProperty({
    description: "The display name of the user",
    example: "John Doe",
  })
  displayName?: string;

  @ApiProperty({
    description: "The phone number of the user",
    example: "+1234567890",
  })
  phoneNumber?: string;

  @ApiProperty({
    description: "The job title of the user",
    example: "Software Engineer",
  })
  jobTitle?: string;

  @ApiProperty({
    description: "The company of the user",
    example: "Acme Inc.",
  })
  company?: string;

  @ApiProperty({
    description: "The website of the user",
    example: "https://www.example.com",
  })
  website?: string;

  @ApiProperty({
    description: "The location id of the user",
    example: 1,
  })
  location_id?: number;

  @ApiProperty({
    description: "The bio of the user",
    example: "I am a software engineer with 10 years of experience.",
  })
  bio?: string;

  @ApiProperty({
    description: "The language id of the user",
    example: 1,
  })
  language_id?: number;

  @ApiProperty({
    description: "The timezone id of the user",
    example: 1,
  })
  timezone_id?: number;
}
