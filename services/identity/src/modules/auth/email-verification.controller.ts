import { Body, Controller, Post } from "@nestjs/common";
import { ApiPost } from "@xlr8-nest/core/openapi";
import { ApiSuccess } from "@xlr8-nest/core/response";
import { Validate } from "@xlr8-nest/core/validator";
import { buildSuccessResponseProxy } from "src/core/utils";
import { AuthService } from "./auth.services";
import { VerifyEmailInput, verifyEmailInputSchema } from "./inputs";
import { EmailVerificationOutput } from "./outputs";

@Controller("auth/email-verification")
export class EmailVerificationController {
  constructor(private readonly authService: AuthService) {}

  @Post("verify")
  @Validate(verifyEmailInputSchema)
  @ApiPost(EmailVerificationOutput, {
    description: "Verify an email verification token",
    summary: "Verify Email",
  })
  async verifyEmail(
    @Body() input: VerifyEmailInput,
  ): Promise<ApiSuccess<EmailVerificationOutput>> {
    const result = await this.authService.verifyEmail(input);
    return buildSuccessResponseProxy(result);
  }
}
