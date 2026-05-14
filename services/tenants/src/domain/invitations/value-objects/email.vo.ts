import { StatusCode, ValueObject } from "@xlr8-nest/core";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email extends ValueObject {
  public readonly value: string;

  constructor(value: string) {
    super();
    const normalized = (value ?? "").trim().toLowerCase();
    this.validate(normalized);
    this.value = normalized;
  }

  private validate(value: string): void {
    if (!value || !EMAIL_REGEX.test(value) || value.length > 254) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_EMAIL
      );
    }
  }

  equals(other: this): boolean {
    return this.value === other.value;
  }
}
