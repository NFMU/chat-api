import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { UUID } from "crypto";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { ITenantRepository } from "src/domain/tenants/repositories/tenant.repository";
import { TenantSlug } from "src/domain/tenants/value-objects/tenant-slug.vo";
import { TenantAdapter } from "../database/adapters/tenant.adapter";
import { TenantSubscriptionAdapter } from "../database/adapters/tenant-subscription.adapter";
import { TenantOrm } from "../database/orms/tenant.orm";
import { TenantSubscriptionOrm } from "../database/orms/tenant-subscription.orm";
import { SubscriptionStatus } from "src/shared/enums";

@Injectable()
export class TenantRepository implements ITenantRepository {
  private readonly tenants: Repository<TenantOrm>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly tenantAdapter: TenantAdapter,
    private readonly subscriptionAdapter: TenantSubscriptionAdapter
  ) {
    this.tenants = dataSource.getRepository(TenantOrm);
  }

  async create(tenant: Tenant): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      // INSERT — the tenant PK does not yet exist in the database.
      await em.insert(TenantOrm, this.tenantAdapter.toOrm(tenant));
      for (const sub of tenant.pullSubscriptionChanges()) {
        await em.insert(TenantSubscriptionOrm, this.subscriptionAdapter.toOrm(sub));
      }
    });
  }

  async save(tenant: Tenant): Promise<void> {
    await this.dataSource.transaction(async (em) => {
      // UPSERT — updates an existing tenant and persists any subscription changes.
      await em.save(TenantOrm, this.tenantAdapter.toOrm(tenant));
      for (const sub of tenant.pullSubscriptionChanges()) {
        await em.save(TenantSubscriptionOrm, this.subscriptionAdapter.toOrm(sub));
      }
    });
  }

  async findById(id: UUID): Promise<Tenant | null> {
    const orm = await this.tenants.findOne({
      where: { uuid: id },
      relations: { subscriptions: true },
    });
    if (!orm) return null;
    orm.subscriptions = (orm.subscriptions ?? []).filter(
      (s: TenantSubscriptionOrm) => s.status === SubscriptionStatus.ACTIVE
    );
    return this.tenantAdapter.toDomain(orm);
  }

  async findBySlug(slug: TenantSlug): Promise<Tenant | null> {
    const orm = await this.tenants.findOne({
      where: { slug: slug.value },
      relations: { subscriptions: true },
    });
    if (!orm) return null;
    orm.subscriptions = (orm.subscriptions ?? []).filter(
      (s: TenantSubscriptionOrm) => s.status === SubscriptionStatus.ACTIVE
    );
    return this.tenantAdapter.toDomain(orm);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.tenants.existsBy({ slug });
  }
}
