import { ErrorType } from "@xlr8-nest/core/types";

export const AuthError: Record<string, ErrorType> = {
  EmailAlreadyExists: {
    code: "AUTH-EMAIL_ALREADY_EXISTS",
    message: "A user with this email already exists.",
  },
  InvalidCredentials: {
    code: "AUTH-INVALID_CREDENTIALS",
    message: "The provided credentials are invalid.",
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
};
