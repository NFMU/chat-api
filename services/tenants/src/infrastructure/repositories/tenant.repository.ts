import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { ITenantRepository } from "src/domain/tenants/repositories/tenant.repository";

export class TenantRepository implements ITenantRepository{
  async create(tenant: Tenant): Promise<void> {
    // Implement the logic to save the tenant to the database
    // This is a placeholder implementation and should be replaced with actual database logic
    console.log("Creating tenant:", tenant);
  }

}