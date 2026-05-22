import { Injectable, Inject } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { UUID } from "crypto";
import { IUnitOfWorkToken, TypeOrmClient } from "@xlr8-nest/core/database";
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
    @Inject(IUnitOfWorkToken)
    private readonly uow: TypeOrmClient,
    private readonly tenantAdapter: TenantAdapter,
    private readonly subscriptionAdapter: TenantSubscriptionAdapter
  ) {
    this.tenants = dataSource.getRepository(TenantOrm);
  }

  async create(tenant: Tenant): Promise<void> {
    // Uses the active transaction's EntityManager when called inside uow.transaction(),
    // otherwise falls back to the default (non-transactional) manager.
    const em = this.uow.client;
    await em.insert(TenantOrm, this.tenantAdapter.toOrm(tenant));
    for (const sub of tenant.pullSubscriptionChanges()) {
      await em.insert(TenantSubscriptionOrm, this.subscriptionAdapter.toOrm(sub));
    }
  }

  async save(tenant: Tenant): Promise<void> {
    const em = this.uow.client;
    await em.save(TenantOrm, this.tenantAdapter.toOrm(tenant));
    for (const sub of tenant.pullSubscriptionChanges()) {
      await em.save(TenantSubscriptionOrm, this.subscriptionAdapter.toOrm(sub));
    }
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
