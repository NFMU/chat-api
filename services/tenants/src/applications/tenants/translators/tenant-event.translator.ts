import { Injectable } from "@nestjs/common";
import { DomainEvent } from "@xlr8-nest/core/ddd";
import { IDomainEventTranslator, IntegrationEvent } from "@xlr8-nest/core/messaging";
import { TenantCreatedEvent } from "src/domain/tenants/events/tenant-created.event";
import { TenantActivatedEvent } from "src/domain/tenants/events/tenant-activated.event";
import { TenantSuspendedEvent } from "src/domain/tenants/events/tenant-suspended.event";
import { TenantPlanChangedEvent } from "src/domain/tenants/events/tenant-plan-changed.event";
import { TenantProvisionedIntegrationEvent } from "../integration-events/tenant-provisioned.event";
import { TenantActivatedIntegrationEvent } from "../integration-events/tenant-activated.event";
import { TenantSuspendedIntegrationEvent } from "../integration-events/tenant-suspended.event";
import { TenantPlanChangedIntegrationEvent } from "../integration-events/tenant-plan-changed.event";

/**
 * Maps tenant aggregate domain events to the cross-service integration contracts.
 * This is where domain language ("tenant.created") is translated to broker language
 * ("tenant.provisioned.v1") so consumers depend on a stable contract.
 */
@Injectable()
export class TenantEventTranslator implements IDomainEventTranslator {
  private static readonly SUPPORTED = new Set<string>([
    "tenant.created",
    "tenant.activated",
    "tenant.suspended",
    "tenant.plan_changed",
  ]);

  supports(eventName: string): boolean {
    return TenantEventTranslator.SUPPORTED.has(eventName);
  }

  translate(event: DomainEvent): IntegrationEvent[] {
    if (event instanceof TenantCreatedEvent) {
      return [
        new TenantProvisionedIntegrationEvent(
          event.tenantId,
          event.ownerUserId,
          event.planCode.value,
          event.planVersionId,
          event.slug
        ),
      ];
    }
    if (event instanceof TenantActivatedEvent) {
      return [new TenantActivatedIntegrationEvent(event.tenantId)];
    }
    if (event instanceof TenantSuspendedEvent) {
      return [new TenantSuspendedIntegrationEvent(event.tenantId, event.reason)];
    }
    if (event instanceof TenantPlanChangedEvent) {
      return [
        new TenantPlanChangedIntegrationEvent(
          event.tenantId,
          event.previousPlanCode.value,
          event.newPlanCode.value,
          event.newPlanVersionId
        ),
      ];
    }
    return [];
  }
}
