import { z } from 'zod';

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export class LoginInput{
  email: string;
  password: string;
}
