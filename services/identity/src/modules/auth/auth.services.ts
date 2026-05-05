import { Injectable } from "@nestjs/common";
import { RequestMetadata } from "src/core/utils";
import {
  ChangePasswordInput,
  LoginInput,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
  RefreshTokenInput,
  SignupInput,
  VerifyEmailInput,
} from "./inputs";
import {
  AcceptedOutput,
  EmailVerificationOutput,
  LoginOutput,
  LogoutOutput,
  SessionListOutput,
} from "./outputs";
import { PasswordService, SessionService, SignupService } from "./services";

@Injectable()
export class AuthService {
  constructor(
    private readonly signupService: SignupService,
    private readonly sessionService: SessionService,
    private readonly passwordService: PasswordService,
  ) {}

  login(
    input: LoginInput,
    metadata: RequestMetadata = {},
  ): Promise<LoginOutput> {
    return this.sessionService.login(input, metadata);
  }

  signup(input: SignupInput): Promise<null> {
    return this.signupService.signup(input);
  }

  verifyEmail(input: VerifyEmailInput): Promise<EmailVerificationOutput> {
    return this.signupService.verifyEmail(input);
  }

  refresh(input: RefreshTokenInput): Promise<LoginOutput> {
    return this.sessionService.refresh(input);
  }

  logout(userId: string, sessionId: string): Promise<LogoutOutput> {
    return this.sessionService.logout(userId, sessionId);
  }

  listSessions(userId: string): Promise<SessionListOutput> {
    return this.sessionService.listSessions(userId);
  }

  revokeSession(userId: string, sessionId: string): Promise<LogoutOutput> {
    return this.sessionService.revokeSession(userId, sessionId);
  }

  requestPasswordReset(
    input: PasswordResetRequestInput,
    metadata: RequestMetadata = {},
  ): Promise<AcceptedOutput> {
    return this.passwordService.requestPasswordReset(input, metadata);
  }

  confirmPasswordReset(
    input: PasswordResetConfirmInput,
  ): Promise<AcceptedOutput> {
    return this.passwordService.confirmPasswordReset(input);
  }

  changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
  ): Promise<AcceptedOutput> {
    return this.passwordService.changePassword(userId, sessionId, input);
  }
}
