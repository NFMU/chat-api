import { StatusCode } from "@xlr8-nest/core/constants";
import { ValueObject } from "@xlr8-nest/core/ddd";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { TenantDomain } from "./tenant-domain.vo";

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,98}[a-z0-9])?$/;

export class TenantSlug extends ValueObject {
  public readonly value: string;

  constructor(value: string) {
    super();
    const normalized = (value ?? "").trim().toLowerCase();
    this.validate(normalized);
    this.value = normalized;
  }

  private validate(value: string): void {
    if (!value || !SLUG_REGEX.test(value)) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_TENANT_SLUG
      );
    }
  }

  equals(other: this): boolean {
    return this.value === other.value;
  }
}
