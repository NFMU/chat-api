import { Body, Controller, Post } from "@nestjs/common";
import { Validate } from "@xlr8-nest/core/validator";
import { LoginInput, loginInputSchema, SignupInput } from "./inputs";
import { AuthService } from "./auth.services";
import { ApiSuccess } from "@xlr8-nest/core/response";
import { ApiPost } from "@xlr8-nest/core/openapi";
import { LoginOutput } from "./outputs/login.output";
import { buildSuccessResponseProxy } from "src/core/utils/response.util";

@Controller("auth")
export class AuthController{
  constructor(
    private readonly authService: AuthService
  ) {}

  @Post("login")
  @Validate(loginInputSchema)
  @ApiPost(LoginOutput,{
    description: "Login a user and return an access token",
    summary: "User Login",

  })
  async login(@Body() input: LoginInput): Promise<ApiSuccess<LoginOutput>> {
    const loginResult = await this.authService.login(input);
    return buildSuccessResponseProxy(loginResult);
  }

  @Post("signup")
  @ApiPost(null,{
    description: "Register a new user",
    summary: "User Signup",
  })
  async signup(@Body() input: SignupInput): Promise<ApiSuccess<void>> {
    const result = await this.authService.signup(input);
    return buildSuccessResponseProxy(result);
  }
}
