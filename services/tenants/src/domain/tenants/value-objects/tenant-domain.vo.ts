import { StatusCode } from "@xlr8-nest/core/constants";
import { ValueObject } from "@xlr8-nest/core/ddd";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

const DOMAIN_REGEX =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export class TenantDomain extends ValueObject {
  public readonly value: string;

  constructor(value: string) {
    super();
    const normalized = (value ?? "").trim().toLowerCase();
    this.validate(normalized);
    this.value = normalized;
  }

  private validate(value: string): void {
    if (!value || !DOMAIN_REGEX.test(value)) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_TENANT_DOMAIN
      );
    }
  }

  equals(other: this): boolean {
    return this.value === other.value;
  }
}
