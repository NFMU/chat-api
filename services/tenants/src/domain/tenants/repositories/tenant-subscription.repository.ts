import { UUID } from "crypto";
import { TenantSubscription } from "../entities/tenant-subscription.entity";

export const TenantSubscriptionRepositoryToken = Symbol("TenantSubscriptionRepository");

export interface ITenantSubscriptionRepository {
  save(subscription: TenantSubscription): Promise<void>;
  findActiveByTenantId(tenantId: UUID): Promise<TenantSubscription | null>;
  findAllByTenantId(tenantId: UUID): Promise<TenantSubscription[]>;
}
