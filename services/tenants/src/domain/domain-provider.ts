import { Provider } from "@nestjs/common";
import { PlanCreationService } from "./services/plan-creation.service";
import { PlanSubscriptionService } from "./services/plan-subscription.service";
import { TenantSlugGeneratorService } from "./services/tenant-slug-generator.service";
import { InvitationDomainService } from "./services/invitation-domain.service";

/**
 * Domain-layer services: coordinate domain objects and enforce cross-aggregate
 * invariants. No command handlers here — those belong in ApplicationProvider.
 * Dependencies on repository interfaces are resolved by InfrastructureProvider.
 */
export const DomainProvider: Provider[] = [
  PlanCreationService,
  PlanSubscriptionService,
  TenantSlugGeneratorService,
  InvitationDomainService,
];
