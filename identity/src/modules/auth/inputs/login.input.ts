import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export class LoginInput{
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com'
  })
  email: string;
  
  @ApiProperty({
    description: 'The password of the user',
    example: 'password123'
  })
  password: string;
}
