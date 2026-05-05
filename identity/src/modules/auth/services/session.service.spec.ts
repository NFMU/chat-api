import { AuthError } from "src/core/errors/auth.error";
import { hashToken } from "src/core/utils";
import { UserStatus } from "src/database/entities/user.entity";
import {
  activeVerifiedUser,
  makeAuthRepositoryMock,
  makeJwtServiceMock,
} from "../testing/auth-service-test.util";
import { AuthTokenService } from "./auth-token.service";
import { SessionService } from "./session.service";

const makeService = () => {
  const authRepository = makeAuthRepositoryMock();
  const jwtService = makeJwtServiceMock();
  const authTokenService = new AuthTokenService(jwtService as any);
  const service = new SessionService(authRepository as any, authTokenService);

  return { service, authRepository, jwtService };
};

describe("SessionService", () => {
  it("rejects invalid login credentials", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: "user@example.com", password: "password123" }),
    ).rejects.toMatchObject({
      code: AuthError.InvalidCredentials.code,
    });
  });

  it("rejects unverified accounts", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserByEmail.mockResolvedValue({
      ...activeVerifiedUser,
      isEmailVerified: false,
    });

    await expect(
      service.login({ email: "user@example.com", password: "password123" }),
    ).rejects.toMatchObject({
      code: AuthError.EmailNotVerified.code,
    });
  });

  it("rejects inactive accounts", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserByEmail.mockResolvedValue({
      ...activeVerifiedUser,
      status: UserStatus.BLOCKED,
    });

    await expect(
      service.login({ email: "user@example.com", password: "password123" }),
    ).rejects.toMatchObject({
      code: AuthError.AccountNotActive.code,
    });
  });

  it("creates a session and returns an OAuth-like token response", async () => {
    const { service, authRepository, jwtService } = makeService();
    authRepository.getUserByEmail.mockResolvedValue(activeVerifiedUser);
    authRepository.createUserSession.mockResolvedValue({ id: "session-1" });
    authRepository.updateUserLastLogin.mockResolvedValue(undefined);

    const result = await service.login(
      { email: "user@example.com", password: "password123" },
      { ipAddress: "203.0.113.10", userAgent: "Jest" },
    );

    expect(authRepository.createUserSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        refreshTokenHash: expect.any(String),
        ipAddress: "203.0.113.10",
        userAgent: "Jest",
        expiresAt: expect.any(Date),
      }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      { userId: "user-1", sessionId: "session-1", type: "access" },
      { expiresIn: 900 },
    );
    expect(result).toMatchObject({
      access_token: "access-jwt",
      refresh_token: expect.any(String),
      token_type: "Bearer",
      expires_in: 900,
      session_id: "session-1",
    });
  });

  it("rotates refresh tokens", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserSessionByRefreshTokenHash.mockResolvedValue({
      id: "session-1",
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: activeVerifiedUser,
    });
    authRepository.rotateUserSessionRefreshToken.mockResolvedValue({
      id: "session-1",
    });

    const result = await service.refresh({ refresh_token: "refresh-token" });

    expect(
      authRepository.getUserSessionByRefreshTokenHash,
    ).toHaveBeenCalledWith(hashToken("refresh-token"));
    expect(authRepository.rotateUserSessionRefreshToken).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(String),
      expect.any(Date),
      expect.any(Date),
    );
    expect(result.session_id).toBe("session-1");
  });

  it("rejects revoked refresh tokens", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserSessionByRefreshTokenHash.mockResolvedValue({
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: activeVerifiedUser,
    });

    await expect(
      service.refresh({ refresh_token: "refresh-token" }),
    ).rejects.toMatchObject({
      code: AuthError.RefreshTokenInvalid.code,
    });
  });

  it("lists caller sessions without token hashes", async () => {
    const { service, authRepository } = makeService();
    authRepository.listUserSessions.mockResolvedValue([
      {
        id: "session-1",
        deviceName: "Chrome on Windows",
        ipAddress: "203.0.113.10",
        userAgent: "Jest",
        lastUsedAt: new Date("2026-05-05T08:00:00.000Z"),
        expiresAt: new Date("2026-06-04T08:00:00.000Z"),
        revokedAt: null,
        createdAt: new Date("2026-05-05T08:00:00.000Z"),
        refreshTokenHash: "hidden",
      },
    ]);

    const result = await service.listSessions("user-1");

    expect(result).toEqual({
      items: [
        {
          id: "session-1",
          device_name: "Chrome on Windows",
          ip_address: "203.0.113.10",
          user_agent: "Jest",
          last_used_at: "2026-05-05T08:00:00.000Z",
          expires_at: "2026-06-04T08:00:00.000Z",
          revoked_at: null,
          created_at: "2026-05-05T08:00:00.000Z",
        },
      ],
    });
  });

  it("rejects session revocation for another user's session", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserSessionById.mockResolvedValue({
      id: "session-1",
      userId: "other-user",
    });

    await expect(
      service.revokeSession("user-1", "session-1"),
    ).rejects.toMatchObject({
      code: AuthError.SessionNotFound.code,
    });
  });
});
