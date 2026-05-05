import { ErrorType } from "@xlr8-nest/core/types";

export const AuthError: Record<string, ErrorType> = {
  UserNotFound: {
    code: "USER-NOT_FOUND",
    message: "User was not found.",
  },
  EmailAlreadyExists: {
    code: "AUTH-EMAIL_ALREADY_EXISTS",
    message: "A user with this email already exists.",
  },
  InvalidCredentials: {
    code: "AUTH-INVALID_CREDENTIALS",
    message: "The provided credentials are invalid.",
  },
  AccountNotActive: {
    code: "AUTH-ACCOUNT_NOT_ACTIVE",
    message: "The account is not active.",
  },
  EmailNotVerified: {
    code: "AUTH-EMAIL_NOT_VERIFIED",
    message: "The email address has not been verified.",
  },
  EmailAlreadyVerified: {
    code: "AUTH-EMAIL_ALREADY_VERIFIED",
    message: "The email address is already verified.",
  },
  EmailVerificationInvalid: {
    code: "AUTH-EMAIL_VERIFICATION_INVALID",
    message: "Verification token is invalid.",
  },
  EmailVerificationExpired: {
    code: "AUTH-EMAIL_VERIFICATION_EXPIRED",
    message: "Verification token has expired.",
  },
  InvalidLanguage: {
    code: "AUTH-INVALID_LANGUAGE",
    message: "The selected language does not exist.",
  },
  InvalidLocation: {
    code: "AUTH-INVALID_LOCATION",
    message: "The selected location does not exist.",
  },
  InvalidTimezone: {
    code: "AUTH-INVALID_TIMEZONE",
    message: "The selected timezone does not exist.",
  },
  PasswordMismatch: {
    code: "AUTH-PASSWORD_MISMATCH",
    message: "Password and confirmation password do not match.",
  },
  PasswordResetInvalid: {
    code: "AUTH-PASSWORD_RESET_INVALID",
    message: "Reset token is invalid.",
  },
  PasswordResetExpired: {
    code: "AUTH-PASSWORD_RESET_EXPIRED",
    message: "Reset token has expired.",
  },
  PasswordResetUsed: {
    code: "AUTH-PASSWORD_RESET_USED",
    message: "Reset token has already been used.",
  },
  RefreshTokenInvalid: {
    code: "AUTH-REFRESH_TOKEN_INVALID",
    message: "Refresh token is invalid.",
  },
  SessionNotFound: {
    code: "AUTH-SESSION_NOT_FOUND",
    message: "Session was not found.",
  },
  SessionAlreadyRevoked: {
    code: "AUTH-SESSION_ALREADY_REVOKED",
    message: "Session is already revoked.",
  },
};
