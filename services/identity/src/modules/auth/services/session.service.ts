import { Injectable } from "@nestjs/common";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@xlr8-nest/core/errors";
import { AuthError } from "src/core/errors/auth.error";
import {
  addDays,
  comparePassword,
  generateOpaqueToken,
  hashToken,
  RequestMetadata,
} from "src/core/utils";
import { UserSession } from "src/database/entities/user-sessions.entity";
import { AuthRepository } from "../auth.repository";
import { REFRESH_TOKEN_EXPIRES_IN_DAYS } from "../auth.constants";
import { LoginInput, RefreshTokenInput } from "../inputs";
import { LoginOutput, LogoutOutput, SessionListOutput } from "../outputs";
import { AuthTokenService } from "./auth-token.service";

@Injectable()
export class SessionService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async login(
    input: LoginInput,
    metadata: RequestMetadata = {},
  ): Promise<LoginOutput> {
    const user = await this.authRepository.getUserByEmail(
      input.email.toLowerCase(),
    );

    const isPasswordValid = user
      ? comparePassword(input.password, user.passwordHash)
      : false;
    if (!user || !isPasswordValid) {
      throw new UnauthorizedError(AuthError.InvalidCredentials);
    }

    this.authTokenService.assertUserCanAuthenticate(user);

    const refreshToken = generateOpaqueToken();
    const now = new Date();
    const session = await this.authRepository.createUserSession({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      deviceName: metadata.deviceName,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      lastUsedAt: now,
      expiresAt: addDays(now, REFRESH_TOKEN_EXPIRES_IN_DAYS),
    });

    await this.authRepository.updateUserLastLogin(user.id, now);

    return this.authTokenService.buildTokenOutput(
      user.id,
      session.id,
      refreshToken,
    );
  }

  async refresh(input: RefreshTokenInput): Promise<LoginOutput> {
    const session = await this.authRepository.getUserSessionByRefreshTokenHash(
      hashToken(input.refresh_token),
    );

    if (!session || !session.user || session.revokedAt) {
      throw new UnauthorizedError(AuthError.RefreshTokenInvalid);
    }

    if (session.expiresAt <= new Date()) {
      throw new UnauthorizedError(AuthError.RefreshTokenInvalid);
    }

    this.authTokenService.assertUserCanAuthenticate(session.user);

    const refreshToken = generateOpaqueToken();
    const now = new Date();
    const rotatedSession =
      await this.authRepository.rotateUserSessionRefreshToken(
        session,
        hashToken(refreshToken),
        addDays(now, REFRESH_TOKEN_EXPIRES_IN_DAYS),
        now,
      );

    return this.authTokenService.buildTokenOutput(
      session.user.id,
      rotatedSession.id,
      refreshToken,
    );
  }

  async logout(userId: string, sessionId: string): Promise<LogoutOutput> {
    const session = await this.getOwnedSession(userId, sessionId);
    if (session.revokedAt) {
      throw new ConflictError(AuthError.SessionAlreadyRevoked);
    }

    await this.authRepository.revokeUserSession(session, new Date());
    return { revoked: true };
  }

  async listSessions(userId: string): Promise<SessionListOutput> {
    const sessions = await this.authRepository.listUserSessions(userId);
    return {
      items: sessions.map((session) => ({
        id: session.id,
        device_name: session.deviceName,
        ip_address: session.ipAddress,
        user_agent: session.userAgent,
        last_used_at: session.lastUsedAt?.toISOString() ?? null,
        expires_at: session.expiresAt.toISOString(),
        revoked_at: session.revokedAt?.toISOString() ?? null,
        created_at: session.createdAt.toISOString(),
      })),
    };
  }

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<LogoutOutput> {
    const session = await this.getOwnedSession(userId, sessionId);
    if (session.revokedAt) {
      throw new ConflictError(AuthError.SessionAlreadyRevoked);
    }

    await this.authRepository.revokeUserSession(session, new Date());
    return { revoked: true };
  }

  private async getOwnedSession(
    userId: string,
    sessionId: string,
  ): Promise<UserSession> {
    const session = await this.authRepository.getUserSessionById(sessionId);

    if (!session || session.userId !== userId) {
      throw new NotFoundError(AuthError.SessionNotFound);
    }

    return session;
  }
}
