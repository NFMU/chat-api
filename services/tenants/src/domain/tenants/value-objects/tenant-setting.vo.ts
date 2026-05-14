import { StatusCode, ValueObject } from "@xlr8-nest/core";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

export interface TenantSettingProps {
  messageRetentionDays?: number | null;
  guestAccess?: boolean;
  fileSharingEnabled?: boolean;
  ssoProvider?: string | null;
}

export class TenantSetting extends ValueObject {
  public readonly messageRetentionDays: number | null;
  public readonly guestAccess: boolean;
  public readonly fileSharingEnabled: boolean;
  public readonly ssoProvider: string | null;

  constructor(props: TenantSettingProps = {}) {
    super();
    this.validate(props);
    this.messageRetentionDays = props.messageRetentionDays ?? null;
    this.guestAccess = props.guestAccess ?? false;
    this.fileSharingEnabled = props.fileSharingEnabled ?? true;
    this.ssoProvider = props.ssoProvider ?? null;
  }

  private validate(props: TenantSettingProps): void {
    if (
      props.messageRetentionDays !== undefined &&
      props.messageRetentionDays !== null
    ) {
      if (
        !Number.isInteger(props.messageRetentionDays) ||
        props.messageRetentionDays < 0
      ) {
        throw new BusinessException(
          StatusCode.BAD_REQUEST,
          TenantErrors.INVALID_TENANT_SETTING
        );
      }
    }
    if (
      props.guestAccess !== undefined &&
      typeof props.guestAccess !== "boolean"
    ) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_TENANT_SETTING
      );
    }
    if (
      props.fileSharingEnabled !== undefined &&
      typeof props.fileSharingEnabled !== "boolean"
    ) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_TENANT_SETTING
      );
    }
    if (
      props.ssoProvider !== undefined &&
      props.ssoProvider !== null &&
      (typeof props.ssoProvider !== "string" || props.ssoProvider.trim() === "")
    ) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_TENANT_SETTING
      );
    }
  }

  equals(other: this): boolean {
    return (
      this.messageRetentionDays === other.messageRetentionDays &&
      this.guestAccess === other.guestAccess &&
      this.fileSharingEnabled === other.fileSharingEnabled &&
      this.ssoProvider === other.ssoProvider
    );
  }
}
