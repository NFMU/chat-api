/**
 * Operational policies stored in `tenants.settings_json`.
 * All fields are optional — an empty object is a valid default.
 */
export interface TenantSettingsJson {
  /** How long messages are retained before deletion. `null` means indefinite. */
  message_retention_days?: number | null;

  /** Whether external guest accounts can be invited. */
  guest_access?: boolean;

  /** Whether members may share files in channels. */
  file_sharing_enabled?: boolean;

  /** SSO provider key, e.g. "okta", "azure-ad". `null` means no SSO. */
  sso_provider?: string | null;
}
