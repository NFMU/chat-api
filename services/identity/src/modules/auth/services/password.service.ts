import { Injectable } from "@nestjs/common";
import { EventBus } from "@xlr8-nest/core/ddd";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@xlr8-nest/core/errors";
import { AuthError } from "src/core/errors/auth.error";
import {
  addMinutes,
  comparePassword,
  generateOpaqueToken,
  hashPassword,
  hashToken,
  RequestMetadata,
} from "src/core/utils";
import { AuthRepository } from "../auth.repository";
import { PASSWORD_RESET_EXPIRES_IN_MINUTES } from "../auth.constants";
import { PasswordResetRequestedEvent } from "../events/password-reset-requested.event";
import {
  ChangePasswordInput,
  PasswordResetConfirmInput,
  PasswordResetRequestInput,
} from "../inputs";
import { AcceptedOutput } from "../outputs";

@Injectable()
export class PasswordService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly eventBus: EventBus,
  ) {}

  async requestPasswordReset(
    input: PasswordResetRequestInput,
    metadata: RequestMetadata = {},
  ): Promise<AcceptedOutput> {
    const user = await this.authRepository.getUserByEmail(
      input.email.toLowerCase(),
    );

    if (!user) {
      return { accepted: true };
    }

    const resetToken = generateOpaqueToken();
    const now = new Date();
    await this.authRepository.createPasswordReset({
      userId: user.id,
      tokenHash: hashToken(resetToken),
      requestedIp: metadata.ipAddress,
      requestedUserAgent: metadata.userAgent,
      expiresAt: addMinutes(now, PASSWORD_RESET_EXPIRES_IN_MINUTES),
    });

    this.eventBus.publish(
      new PasswordResetRequestedEvent(
        user.id,
        user.email,
        user.email,
        resetToken,
      ),
    );

    return { accepted: true };
  }

  async confirmPasswordReset(
    input: PasswordResetConfirmInput,
  ): Promise<AcceptedOutput> {
    if (input.password !== input.confirmPassword) {
      throw new BadRequestError(AuthError.PasswordMismatch);
    }

    const passwordReset = await this.authRepository.getPasswordResetByTokenHash(
      hashToken(input.token),
    );

    if (!passwordReset) {
      throw new BadRequestError(AuthError.PasswordResetInvalid);
    }

    if (!passwordReset.user) {
      throw new NotFoundError(AuthError.UserNotFound);
    }

    if (passwordReset.usedAt) {
      throw new ConflictError(AuthError.PasswordResetUsed);
    }

    if (passwordReset.expiresAt <= new Date()) {
      throw new BadRequestError(AuthError.PasswordResetExpired);
    }

    const now = new Date();
    await this.authRepository.updateUserPassword(
      passwordReset.user.id,
      hashPassword(input.password),
    );
    await this.authRepository.markPasswordResetUsed(passwordReset, now);
    await this.authRepository.revokeUserSessions(passwordReset.user.id, now);

    return { accepted: true };
  }

  async changePassword(
    userId: string,
    sessionId: string,
    input: ChangePasswordInput,
  ): Promise<AcceptedOutput> {
    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestError(AuthError.PasswordMismatch);
    }

    const user = await this.authRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError(AuthError.UserNotFound);
    }

    if (!comparePassword(input.currentPassword, user.passwordHash)) {
      throw new UnauthorizedError(AuthError.InvalidCredentials);
    }

    const now = new Date();
    await this.authRepository.updateUserPassword(
      user.id,
      hashPassword(input.newPassword),
    );
    await this.authRepository.revokeUserSessions(user.id, now, sessionId);

    return { accepted: true };
  }
}
