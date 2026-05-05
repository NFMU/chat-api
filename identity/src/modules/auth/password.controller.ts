import { Body, Controller, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiPatch, ApiPost } from "@xlr8-nest/core/openapi";
import { ApiSuccess } from "@xlr8-nest/core/response";
import { Validate } from "@xlr8-nest/core/validator";
import { BearerAuth } from "src/core/decorators/bearer-auth.decorator";
import { buildSuccessResponseProxy, getRequestMetadata } from "src/core/utils";
import { AuthContext, CurrentAuth } from "./auth-context.decorator";
import { AuthService } from "./auth.services";
import {
  ChangePasswordInput,
  changePasswordInputSchema,
  PasswordResetConfirmInput,
  passwordResetConfirmInputSchema,
  PasswordResetRequestInput,
  passwordResetRequestInputSchema,
} from "./inputs";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AcceptedOutput } from "./outputs";

@Controller("auth")
export class PasswordController {
  constructor(private readonly authService: AuthService) {}

  @Post("password-reset/request")
  @Validate(passwordResetRequestInputSchema)
  @ApiPost(AcceptedOutput, {
    description: "Request a password reset email",
    summary: "Request Password Reset",
  })
  async requestPasswordReset(
    @Body() input: PasswordResetRequestInput,
    @Req() request: any,
  ): Promise<ApiSuccess<AcceptedOutput>> {
    const result = await this.authService.requestPasswordReset(
      input,
      getRequestMetadata(request),
    );
    return buildSuccessResponseProxy(result);
  }

  @Post("password-reset/confirm")
  @Validate(passwordResetConfirmInputSchema)
  @ApiPost(AcceptedOutput, {
    description: "Confirm password reset with a reset token",
    summary: "Confirm Password Reset",
  })
  async confirmPasswordReset(
    @Body() input: PasswordResetConfirmInput,
  ): Promise<ApiSuccess<AcceptedOutput>> {
    const result = await this.authService.confirmPasswordReset(input);
    return buildSuccessResponseProxy(result);
  }

  @Patch("password")
  @UseGuards(JwtAuthGuard)
  @BearerAuth()
  @Validate(changePasswordInputSchema)
  @ApiPatch(AcceptedOutput, {
    description: "Change the current authenticated user's password",
    summary: "Change Password",
  })
  async changePassword(
    @CurrentAuth() auth: AuthContext,
    @Body() input: ChangePasswordInput,
  ): Promise<ApiSuccess<AcceptedOutput>> {
    const result = await this.authService.changePassword(
      auth.userId,
      auth.sessionId,
      input,
    );
    return buildSuccessResponseProxy(result);
  }
}
