import { UnauthorizedError } from "@xlr8-nest/core/errors";
import { AuthError } from "src/core/errors/auth.error";
import {
  activeVerifiedUser,
  makeAuthRepositoryMock,
  makeEventBusMock,
} from "../testing/auth-service-test.util";
import { PasswordService } from "./password.service";

const makeService = () => {
  const authRepository = makeAuthRepositoryMock();
  const eventBus = makeEventBusMock();
  const service = new PasswordService(authRepository as any, eventBus as any);

  return { service, authRepository, eventBus };
};

describe("PasswordService", () => {
  it("always accepts reset requests for missing email addresses", async () => {
    const { service, authRepository, eventBus } = makeService();
    authRepository.getUserByEmail.mockResolvedValue(null);

    await expect(
      service.requestPasswordReset({ email: "missing@example.com" }),
    ).resolves.toEqual({ accepted: true });

    expect(authRepository.createPasswordReset).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it("creates a password reset token and event for known users", async () => {
    const { service, authRepository, eventBus } = makeService();
    authRepository.getUserByEmail.mockResolvedValue(activeVerifiedUser);
    authRepository.createPasswordReset.mockResolvedValue({ id: "reset-1" });

    await expect(
      service.requestPasswordReset(
        { email: "user@example.com" },
        { ipAddress: "203.0.113.10", userAgent: "Jest" },
      ),
    ).resolves.toEqual({ accepted: true });

    expect(authRepository.createPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        tokenHash: expect.any(String),
        requestedIp: "203.0.113.10",
        requestedUserAgent: "Jest",
        expiresAt: expect.any(Date),
      }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        email: "user@example.com",
        token: expect.any(String),
      }),
    );
  });

  it("confirms password resets and revokes sessions", async () => {
    const { service, authRepository } = makeService();
    authRepository.getPasswordResetByTokenHash.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: activeVerifiedUser,
    });

    await expect(
      service.confirmPasswordReset({
        token: "reset-token",
        password: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    ).resolves.toEqual({ accepted: true });

    expect(authRepository.updateUserPassword).toHaveBeenCalledWith(
      "user-1",
      expect.any(String),
    );
    expect(authRepository.markPasswordResetUsed).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Date),
    );
    expect(authRepository.revokeUserSessions).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date),
    );
  });

  it("rejects used password reset tokens", async () => {
    const { service, authRepository } = makeService();
    authRepository.getPasswordResetByTokenHash.mockResolvedValue({
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: activeVerifiedUser,
    });

    await expect(
      service.confirmPasswordReset({
        token: "reset-token",
        password: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    ).rejects.toMatchObject({
      code: AuthError.PasswordResetUsed.code,
    });
  });

  it("changes passwords and revokes other sessions", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserById.mockResolvedValue(activeVerifiedUser);

    await expect(
      service.changePassword("user-1", "session-1", {
        currentPassword: "password123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    ).resolves.toEqual({ accepted: true });

    expect(authRepository.updateUserPassword).toHaveBeenCalledWith(
      "user-1",
      expect.any(String),
    );
    expect(authRepository.revokeUserSessions).toHaveBeenCalledWith(
      "user-1",
      expect.any(Date),
      "session-1",
    );
  });

  it("rejects invalid current passwords", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserById.mockResolvedValue(activeVerifiedUser);

    await expect(
      service.changePassword("user-1", "session-1", {
        currentPassword: "wrongpassword",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
