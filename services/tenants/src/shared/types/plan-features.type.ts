/**
 * Capability flags stored in `plans.features_json`. Indexable so new
 * feature toggles can be added without changing the type signature,
 * but well-known flags are documented here.
 */
export interface PlanFeaturesJson {
  /** Whether external guest accounts are allowed on this plan. */
  guest_access?: boolean;

  /** Whether SSO providers may be configured. */
  sso?: boolean;

  /** Whether tenant audit logs are enabled. */
  audit_log?: boolean;

  /** Whether custom branding is allowed. */
  custom_branding?: boolean;

  /** Open for plan-specific extension flags. */
  [key: string]: boolean | string | number | null | undefined;
}
