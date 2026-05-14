import { Tenant } from "../aggregates/tenant.aggregate";

export const TenantRepositoryToken = Symbol('TenantRepository');

export interface ITenantRepository {
  create(tenant: Tenant): Promise<void>;
  // findById(id: string): Promise<Tenant | null>;
  // update(tenant: Tenant): Promise<void>;
  // delete(id: string): Promise<void>;
}