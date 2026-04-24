import { ErrorType } from "@xlr8-nest/core/types"

export const AuthError : Record<string, ErrorType> = {
  InvalidCredentials: {
    code: "AUTH-INVALID_CREDENTIALS",
    message: "The provided credentials are invalid.",
  }
}