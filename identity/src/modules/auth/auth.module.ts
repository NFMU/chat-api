import { Module } from "@nestjs/common";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.services";
import { AuthController } from "./auth.controller";
import { EmailVerificationController } from "./email-verification.controller";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PasswordController } from "./password.controller";
import { SessionController } from "./session.controller";
import {
  AuthTokenService,
  PasswordService,
  SessionService,
  SignupService,
} from "./services";

@Module({
  imports: [],
  controllers: [
    AuthController,
    EmailVerificationController,
    PasswordController,
    SessionController,
  ],
  providers: [
    AuthRepository,
    AuthService,
    AuthTokenService,
    PasswordService,
    SessionService,
    SignupService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
