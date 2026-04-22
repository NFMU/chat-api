import { Body, Controller, Post } from "@nestjs/common";
import { Validate } from "@xlr8-nest/core/validator";
import { LoginInput, loginInputSchema } from "./inputs";
import { AuthService } from "./auth.services";

@Controller("auth")
export class AuthController{
  constructor(
    private readonly authService: AuthService
  ) {}

  @Post("login")
  @Validate(loginInputSchema)
  async login(@Body() loginDto: LoginInput) {
    // Implement login logic here
  }
}
