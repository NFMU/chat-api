import { StatusCode, ValueObject } from "@xlr8-nest/core";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

const TOKEN_REGEX = /^[A-Za-z0-9_-]{32,128}$/;

export class InvitationToken extends ValueObject {
  public readonly value: string;

  constructor(value: string) {
    super();
    this.validate(value);
    this.value = value;
  }

  private validate(value: string): void {
    if (!value || !TOKEN_REGEX.test(value)) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_INVITATION_TOKEN
      );
    }
  }

  equals(other: this): boolean {
    return this.value === other.value;
  }
}
