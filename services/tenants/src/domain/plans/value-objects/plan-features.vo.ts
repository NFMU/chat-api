import { StatusCode } from "@xlr8-nest/core/constants";
import { ValueObject } from "@xlr8-nest/core/ddd";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

export interface PlanFeaturesProps {
  guestAccess?: boolean;
  customBranding?: boolean;
  sso?: boolean;
  auditLog?: boolean;
}

export class PlanFeatures extends ValueObject {
  public readonly guestAccess: boolean;
  public readonly customBranding: boolean;
  public readonly sso: boolean;
  public readonly auditLog: boolean;

  constructor(props: PlanFeaturesProps = {}) {
    super();
    this.validate(props);
    this.guestAccess = props.guestAccess ?? false;
    this.customBranding = props.customBranding ?? false;
    this.sso = props.sso ?? false;
    this.auditLog = props.auditLog ?? false;
  }

  private validate(props: PlanFeaturesProps): void {
    const flags: (keyof PlanFeaturesProps)[] = [
      "guestAccess",
      "customBranding",
      "sso",
      "auditLog",
    ];
    for (const key of flags) {
      const value = props[key];
      if (value !== undefined && typeof value !== "boolean") {
        throw new BusinessException(
          StatusCode.BAD_REQUEST,
          TenantErrors.INVALID_PLAN_FEATURES
        );
      }
    }
  }

  equals(other: this): boolean {
    return (
      this.guestAccess === other.guestAccess &&
      this.customBranding === other.customBranding &&
      this.sso === other.sso &&
      this.auditLog === other.auditLog
    );
  }
}
