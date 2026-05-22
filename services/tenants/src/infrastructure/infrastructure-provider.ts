import { Provider } from "@nestjs/common";
import { repositories } from "./repositories";
import { PlanAdapter } from "./database/adapters/plan.adapter";
import { PlanVersionAdapter } from "./database/adapters/plan-version.adapter";
import { TenantAdapter } from "./database/adapters/tenant.adapter";
import { TenantSubscriptionAdapter } from "./database/adapters/tenant-subscription.adapter";
import { InvitationAdapter } from "./database/adapters/invitation.adapter";

/**
 * Service-specific infrastructure providers. The library handles:
 *  - UnitOfWork (TypeOrmClient + IUnitOfWorkToken) — registered by DatabaseExtensionModule
 *  - Outbox + worker + message publisher — registered by MessagingModule
 *  - BaseOrm — re-exported by @xlr8-nest/core/database
 */
export const InfrastructureProvider: Provider[] = [
  ...repositories,
  PlanAdapter,
  PlanVersionAdapter,
  TenantAdapter,
  TenantSubscriptionAdapter,
  InvitationAdapter,
];
