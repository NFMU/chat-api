import { StatusCode } from "@xlr8-nest/core/constants";
import { ValueObject } from "@xlr8-nest/core/ddd";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

export type TenantBrandingTheme = "light" | "dark";

export interface TenantBrandingProps {
  logoUrl?: string;
  color?: string;
  theme?: TenantBrandingTheme;
}

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DEFAULT_COLOR = "#1a73e8";
const DEFAULT_THEME: TenantBrandingTheme = "light";

export class TenantBranding extends ValueObject {
  public readonly logoUrl: string;
  public readonly color: string;
  public readonly theme: TenantBrandingTheme;

  constructor(props: TenantBrandingProps = {}) {
    super();
    this.validate(props);
    this.logoUrl = props.logoUrl ?? "";
    this.color = props.color ?? DEFAULT_COLOR;
    this.theme = props.theme ?? DEFAULT_THEME;
  }

  private validate(props: TenantBrandingProps): void {
    if (props.logoUrl !== undefined && props.logoUrl !== "") {
      try {
        // Reject anything that isn't a parseable absolute URL.
        new URL(props.logoUrl);
      } catch {
        throw new BusinessException(
          StatusCode.BAD_REQUEST,
          TenantErrors.INVALID_TENANT_BRANDING
        );
      }
    }
    if (props.color !== undefined && !HEX_COLOR.test(props.color)) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_TENANT_BRANDING
      );
    }
    if (
      props.theme !== undefined &&
      props.theme !== "light" &&
      props.theme !== "dark"
    ) {
      throw new BusinessException(
        StatusCode.BAD_REQUEST,
        TenantErrors.INVALID_TENANT_BRANDING
      );
    }
  }

  equals(other: this): boolean {
    return (
      this.logoUrl === other.logoUrl &&
      this.color === other.color &&
      this.theme === other.theme
    );
  }
}
