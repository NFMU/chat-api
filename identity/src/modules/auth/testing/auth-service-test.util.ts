import { hashPassword } from "src/core/utils";
import { UserStatus } from "src/database/entities/user.entity";

export const makeAuthRepositoryMock = () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
  createSignupUser: jest.fn(),
  languageExists: jest.fn(),
  timezoneExists: jest.fn(),
  locationExists: jest.fn(),
  getEmailVerificationByTokenHash: jest.fn(),
  markEmailVerificationUsed: jest.fn(),
  createUserSession: jest.fn(),
  getUserSessionByRefreshTokenHash: jest.fn(),
  rotateUserSessionRefreshToken: jest.fn(),
  getUserSessionById: jest.fn(),
  revokeUserSession: jest.fn(),
  revokeUserSessions: jest.fn(),
  listUserSessions: jest.fn(),
  updateUserLastLogin: jest.fn(),
  updateUserPassword: jest.fn(),
  createPasswordReset: jest.fn(),
  getPasswordResetByTokenHash: jest.fn(),
  markPasswordResetUsed: jest.fn(),
});

export const makeEventBusMock = () => ({
  publish: jest.fn(),
});

export const makeJwtServiceMock = () => ({
  signAsync: jest.fn().mockResolvedValue("access-jwt"),
});

export const activeVerifiedUser = {
  id: "user-1",
  email: "user@example.com",
  passwordHash: hashPassword("password123"),
  isEmailVerified: true,
  status: UserStatus.ACTIVE,
};

export const signupInput = {
  email: "New@Example.com",
  password: "password123",
  confirmPassword: "password123",
  firstName: "New",
  lastName: "User",
};
