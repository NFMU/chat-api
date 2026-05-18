import { ErrorType } from "@xlr8-nest/core/types";

export const TenantErrors: Record<string, ErrorType> = {
  TENANT_NOT_FOUND: {
    code: "TENANT_NOT_FOUND",
    message: "Tenant not found",
  },
  TENANT_ALREADY_EXISTS: {
    code: "TENANT_ALREADY_EXISTS",
    message: "Tenant already exists",
  },
  INVALID_PLAN_CODE: {
    code: "INVALID_PLAN_CODE",
    message: "Invalid plan code",
  },
  INVALID_PLAN_FEATURES: {
    code: "INVALID_PLAN_FEATURES",
    message: "Invalid plan features",
  },
  INVALID_TENANT_BRANDING: {
    code: "INVALID_TENANT_BRANDING",
    message: "Invalid tenant branding",
  },
  INVALID_TENANT_SETTING: {
    code: "INVALID_TENANT_SETTING",
    message: "Invalid tenant setting",
  },
  INVALID_TENANT_SLUG: {
    code: "INVALID_TENANT_SLUG",
    message: "Invalid tenant slug",
  },
  INVALID_TENANT_DOMAIN: {
    code: "INVALID_TENANT_DOMAIN",
    message: "Invalid tenant domain",
  },
  TENANT_NOT_ACTIVE: {
    code: "TENANT_NOT_ACTIVE",
    message: "Tenant is not active",
  },
  TENANT_ALREADY_ACTIVE: {
    code: "TENANT_ALREADY_ACTIVE",
    message: "Tenant is already active",
  },
  TENANT_DELETED: {
    code: "TENANT_DELETED",
    message: "Tenant has been deleted",
  },
  INVALID_EMAIL: {
    code: "INVALID_EMAIL",
    message: "Invalid email address",
  },
  INVALID_INVITATION_TOKEN: {
    code: "INVALID_INVITATION_TOKEN",
    message: "Invalid invitation token",
  },
  INVITATION_NOT_PENDING: {
    code: "INVITATION_NOT_PENDING",
    message: "Invitation is no longer pending",
  },
  INVITATION_EXPIRED: {
    code: "INVITATION_EXPIRED",
    message: "Invitation has expired",
  },
  PLAN_NOT_AVAILABLE: {
    code: "PLAN_NOT_AVAILABLE",
    message: "Plan is not available for new subscriptions",
  },
  PLAN_VERSION_NOT_DRAFT: {
    code: "PLAN_VERSION_NOT_DRAFT",
    message: "Plan version must be in draft status",
  },
  PLAN_VERSION_NOT_PUBLISHED: {
    code: "PLAN_VERSION_NOT_PUBLISHED",
    message: "Plan version must be published to perform this operation",
  },
  SUBSCRIPTION_NOT_ACTIVE: {
    code: "SUBSCRIPTION_NOT_ACTIVE",
    message: "Subscription is not active",
  },
};
