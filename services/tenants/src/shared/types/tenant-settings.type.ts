/**
 * Operational policies stored in `tenants.settings_json`.
 * All fields are optional — an empty object is a valid default.
 */
export interface TenantSettingsJson {
  /** How long messages are retained before deletion. `null` means indefinite. */
  messageRetentionDays?: number | null;

  /** Whether external guest accounts can be invited. */
  guestAccess?: boolean;

  /** Whether members may share files in channels. */
  fileSharingEnabled?: boolean;

  /** SSO provider key, e.g. "okta", "azure-ad". `null` means no SSO. */
  ssoProvider?: string | null;
}
