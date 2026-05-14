import { StatusCode, ValueObject } from "@xlr8-nest/core";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

export class PlanCode extends ValueObject {
  constructor(public readonly value: string) {
    super();
    this.validate(value);
  }

  private validate(value: string): void {
    if (!value || value.trim() === "") {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_PLAN_CODE
      );
    }
    if (!/^PLAN-[A-Z0-9]+$/.test(value)) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_PLAN_CODE
      );
    }
  }

  static generate(suffix: string): PlanCode {
    return new PlanCode(`PLAN-${suffix.toUpperCase()}`);
  }

  equals(other: this): boolean {
    return this.value === other.value;
  }
}
