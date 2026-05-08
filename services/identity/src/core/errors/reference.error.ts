import { ErrorType } from "@xlr8-nest/core/types";

export const ReferenceError: Record<string, ErrorType> = {
  LanguageNotFound: {
    code: "REFERENCE-LANGUAGE_NOT_FOUND",
    message: "The requested language does not exist.",
  },
  TimezoneNotFound: {
    code: "REFERENCE-TIMEZONE_NOT_FOUND",
    message: "The requested timezone does not exist.",
  },
  LocationNotFound: {
    code: "REFERENCE-LOCATION_NOT_FOUND",
    message: "The requested location does not exist.",
  },
  ServiceTokenInvalid: {
    code: "REFERENCE-SERVICE_TOKEN_INVALID",
    message: "Missing or invalid service token.",
  },
};
