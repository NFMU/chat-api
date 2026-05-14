import { ErrorType } from "@xlr8-nest/core";
import { StatusCode } from "@xlr8-nest/core/constants";
import { BaseError } from "@xlr8-nest/core/errors";

export class BusinessException extends BaseError {
  constructor(statusCode: StatusCode, error: ErrorType) {
    super(statusCode, error);
  }
}