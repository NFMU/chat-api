import { EventHandler } from "@xlr8-nest/core/ddd";
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { ConfigService } from "@nestjs/config";
import { EmailVerificationRequestedEvent } from "../auth/events/email-verification-requested.event";
import { PasswordResetRequestedEvent } from "../auth/events/password-reset-requested.event";

@Injectable()
export class MailHandler {
  constructor(
    private readonly mailService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  @EventHandler(EmailVerificationRequestedEvent)
  async handleEmailVerificationRequested(
    event: EmailVerificationRequestedEvent,
  ) {
    try {
      const verificationUrl = this.buildFrontendUrl(
        "FRONTEND_EMAIL_VERIFY_URL",
        "/verify-email",
        event.token,
      );

      await this.mailService.sendMail({
        to: event.email,
        subject: "Verify your email address",
        text: `Hello ${event.displayName},\n\nPlease verify your email address by opening this link:\n${verificationUrl}\n\nThis link expires in 1 hour.\n\nBest regards,\nThe Team`,
      });
    } catch (error) {
      console.error("Error sending email verification:", error);
    }
  }

  @EventHandler(PasswordResetRequestedEvent)
  async handlePasswordResetRequested(event: PasswordResetRequestedEvent) {
    try {
      const resetUrl = this.buildFrontendUrl(
        "FRONTEND_PASSWORD_RESET_URL",
        "/reset-password",
        event.token,
      );

      await this.mailService.sendMail({
        to: event.email,
        subject: "Reset your password",
        text: `Hello ${event.displayName},\n\nReset your password by opening this link:\n${resetUrl}\n\nBest regards,\nThe Team`,
      });
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  }

  private buildFrontendUrl(
    templateKey: string,
    fallbackPath: string,
    token: string,
  ): string {
    try {
      const template = this.configService.get<string>(templateKey);
      if (template) {
        return template.replace("{token}", encodeURIComponent(token));
      }

      const appUrl = this.configService.get<string>("FRONTEND_APP_URL") ?? "";
      const normalizedAppUrl = appUrl.replace(/\/$/g, "");
      return `${normalizedAppUrl}${fallbackPath}?token=${encodeURIComponent(token)}`;
    } catch (error) {
      console.error("Error building frontend URL:", error);
    }
  }
}
