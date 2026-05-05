import { AuthError } from "src/core/errors/auth.error";
import { hashToken } from "src/core/utils";
import {
  activeVerifiedUser,
  makeAuthRepositoryMock,
  makeEventBusMock,
  signupInput,
} from "../testing/auth-service-test.util";
import { SignupService } from "./signup.service";

const makeService = () => {
  const authRepository = makeAuthRepositoryMock();
  const eventBus = makeEventBusMock();
  const service = new SignupService(authRepository as any, eventBus as any);

  return { service, authRepository, eventBus };
};

describe("SignupService", () => {
  it("creates a user, verification token, and email event", async () => {
    const { service, authRepository, eventBus } = makeService();
    authRepository.getUserByEmail.mockResolvedValue(null);
    authRepository.languageExists.mockResolvedValue(true);
    authRepository.timezoneExists.mockResolvedValue(true);
    authRepository.locationExists.mockResolvedValue(true);
    authRepository.createSignupUser.mockImplementation(async (userData) => ({
      id: "user-1",
      email: userData.email,
    }));

    await expect(service.signup(signupInput)).resolves.toBeNull();

    expect(authRepository.createSignupUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        isEmailVerified: false,
        passwordHash: expect.any(String),
      }),
      expect.objectContaining({
        displayName: "New User",
        firstName: "New",
        lastName: "User",
      }),
      expect.objectContaining({
        languageId: 1,
        timezoneId: 1,
      }),
      expect.objectContaining({
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        email: "new@example.com",
        displayName: "New User",
        token: expect.any(String),
      }),
    );
  });

  it("rejects duplicate email addresses", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserByEmail.mockResolvedValue(activeVerifiedUser);

    await expect(service.signup(signupInput)).rejects.toMatchObject({
      code: AuthError.EmailAlreadyExists.code,
    });
  });

  it("rejects invalid reference ids", async () => {
    const { service, authRepository } = makeService();
    authRepository.getUserByEmail.mockResolvedValue(null);
    authRepository.languageExists.mockResolvedValue(false);
    authRepository.timezoneExists.mockResolvedValue(true);
    authRepository.locationExists.mockResolvedValue(true);

    await expect(
      service.signup({ ...signupInput, language_id: 404 }),
    ).rejects.toMatchObject({
      code: AuthError.InvalidLanguage.code,
    });
  });

  it("marks a valid email verification token used", async () => {
    const { service, authRepository } = makeService();
    authRepository.getEmailVerificationByTokenHash.mockResolvedValue({
      id: "verification-1",
      userId: "user-1",
      tokenHash: hashToken("verify-token"),
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      user: { ...activeVerifiedUser, isEmailVerified: false },
    });

    const result = await service.verifyEmail({ token: "verify-token" });

    expect(authRepository.getEmailVerificationByTokenHash).toHaveBeenCalledWith(
      hashToken("verify-token"),
    );
    expect(authRepository.markEmailVerificationUsed).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Date),
    );
    expect(result).toEqual({
      verified: true,
      user_id: "user-1",
      email: "user@example.com",
    });
  });

  it("rejects expired email verification tokens", async () => {
    const { service, authRepository } = makeService();
    authRepository.getEmailVerificationByTokenHash.mockResolvedValue({
      expiresAt: new Date(Date.now() - 60_000),
      usedAt: null,
      user: { ...activeVerifiedUser, isEmailVerified: false },
    });

    await expect(
      service.verifyEmail({ token: "expired-token" }),
    ).rejects.toMatchObject({
      code: AuthError.EmailVerificationExpired.code,
    });
  });

  it("rejects already verified email tokens", async () => {
    const { service, authRepository } = makeService();
    authRepository.getEmailVerificationByTokenHash.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      user: activeVerifiedUser,
    });

    await expect(
      service.verifyEmail({ token: "used-token" }),
    ).rejects.toMatchObject({
      code: AuthError.EmailAlreadyVerified.code,
    });
  });
});
