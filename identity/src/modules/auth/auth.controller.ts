import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { ApiSuccess } from "@xlr8-nest/core/response";
import { ApiPost } from "@xlr8-nest/core/openapi";
import { Validate } from "@xlr8-nest/core/validator";
import { BearerAuth } from "src/core/decorators/bearer-auth.decorator";
import { buildSuccessResponseProxy, getRequestMetadata } from "src/core/utils";
import { AuthContext, CurrentAuth } from "./auth-context.decorator";
import { AuthService } from "./auth.services";
import {
  LoginInput,
  loginInputSchema,
  RefreshTokenInput,
  refreshTokenInputSchema,
  SignupInput,
  signupInputSchema,
} from "./inputs";
import { LogoutOutput, LoginOutput } from "./outputs";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @Validate(loginInputSchema)
  @ApiPost(LoginOutput, {
    description: "Login a user and return access and refresh tokens",
    summary: "User Login",
  })
  async login(
    @Body() input: LoginInput,
    @Req() request: any,
  ): Promise<ApiSuccess<LoginOutput>> {
    const loginResult = await this.authService.login(
      input,
      getRequestMetadata(request),
    );
    return buildSuccessResponseProxy(loginResult);
  }

  @Post("signup")
  @Validate(signupInputSchema)
  @ApiPost(null, {
    description: "Register a new user and send an email verification link",
    summary: "User Signup",
  })
  async signup(@Body() input: SignupInput): Promise<ApiSuccess<null>> {
    const result = await this.authService.signup(input);
    return buildSuccessResponseProxy(result);
  }

  @Post("refresh")
  @Validate(refreshTokenInputSchema)
  @ApiPost(LoginOutput, {
    description: "Rotate a refresh token and return a new token pair",
    summary: "Refresh Tokens",
  })
  async refresh(
    @Body() input: RefreshTokenInput,
  ): Promise<ApiSuccess<LoginOutput>> {
    const result = await this.authService.refresh(input);
    return buildSuccessResponseProxy(result);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @BearerAuth()
  @ApiPost(LogoutOutput, {
    description: "Revoke the current authenticated session",
    summary: "Logout",
  })
  async logout(
    @CurrentAuth() auth: AuthContext,
  ): Promise<ApiSuccess<LogoutOutput>> {
    const result = await this.authService.logout(auth.userId, auth.sessionId);
    return buildSuccessResponseProxy(result);
  }
}
