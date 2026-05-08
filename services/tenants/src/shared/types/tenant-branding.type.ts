/**
 * Visual identity overrides stored in `tenants.branding_json`.
 * All fields are optional — an empty object is a valid default.
 */
export interface TenantBrandingJson {
  /** CDN URL of the tenant logo. */
  logo_url?: string;

  /** Primary brand color, hex string e.g. "#1a73e8". */
  color?: string;

  /** UI theme preset. */
  theme?: "light" | "dark";
}
