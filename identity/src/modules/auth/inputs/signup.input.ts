import { z } from "zod";
export const signupInputSchema = z.object({});
export class SignupInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  phoneNumber?: string;
  language_id?: number;
  timezone_id?: number;
}
