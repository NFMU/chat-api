import { TenantRepositoryToken } from "src/domain/tenants/repositories/tenant.repository";
import { TenantRepository } from "./tenant.repository";

export const repositories = [
  {
    provide:  TenantRepositoryToken,
    useClass: TenantRepository,
  },
];