import { UUID } from "crypto";
import { Tenant } from "../aggregates/tenant.aggregate";
import { TenantSlug } from "../value-objects/tenant-slug.vo";

export const TenantRepositoryToken = Symbol("TenantRepository");

export interface ITenantRepository {
  create(tenant: Tenant): Promise<void>;
  save(tenant: Tenant): Promise<void>;
  findById(id: UUID): Promise<Tenant | null>;
  findBySlug(slug: TenantSlug): Promise<Tenant | null>;
  existsBySlug(slug: string): Promise<boolean>;
}
