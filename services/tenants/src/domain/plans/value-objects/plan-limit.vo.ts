import { StatusCode, ValueObject } from "@xlr8-nest/core";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

export interface PlanLimitProps {
  maxMembers?: number | null;
  maxChannels?: number | null;
  maxStorageGb?: string | null;
}

export class PlanLimit extends ValueObject {
  public readonly maxMembers: number | null;
  public readonly maxChannels: number | null;
  /** Stored as a decimal string to preserve precision from the DB DECIMAL column. */
  public readonly maxStorageGb: string | null;

  constructor(props: PlanLimitProps = {}) {
    super();
    this.validate(props);
    this.maxMembers = props.maxMembers ?? null;
    this.maxChannels = props.maxChannels ?? null;
    this.maxStorageGb = props.maxStorageGb ?? null;
  }

  /** Represents a plan with no enforced limits on any dimension. */
  static unlimited(): PlanLimit {
    return new PlanLimit({});
  }

  isUnlimited(): boolean {
    return (
      this.maxMembers === null &&
      this.maxChannels === null &&
      this.maxStorageGb === null
    );
  }

  private validate(props: PlanLimitProps): void {
    if (props.maxMembers !== null && props.maxMembers !== undefined) {
      if (!Number.isInteger(props.maxMembers) || props.maxMembers < 1) {
        throw new BusinessException(
          StatusCode.BAD_REQUEST,
          TenantErrors.INVALID_PLAN_LIMIT
        );
      }
    }
    if (props.maxChannels !== null && props.maxChannels !== undefined) {
      if (!Number.isInteger(props.maxChannels) || props.maxChannels < 1) {
        throw new BusinessException(
          StatusCode.BAD_REQUEST,
          TenantErrors.INVALID_PLAN_LIMIT
        );
      }
    }
    if (props.maxStorageGb !== null && props.maxStorageGb !== undefined) {
      const gb = parseFloat(props.maxStorageGb);
      if (isNaN(gb) || gb < 0) {
        throw new BusinessException(
          StatusCode.BAD_REQUEST,
          TenantErrors.INVALID_PLAN_LIMIT
        );
      }
    }
  }

  equals(other: this): boolean {
    return (
      this.maxMembers === other.maxMembers &&
      this.maxChannels === other.maxChannels &&
      this.maxStorageGb === other.maxStorageGb
    );
  }
}
