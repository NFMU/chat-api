import { Provider } from "@nestjs/common";
import { TenantRepositoryToken } from "src/domain/tenants/repositories/tenant.repository";
import { TenantRepository } from "./tenant.repository";

export const repositories: Provider[] = [
  {
    provide: TenantRepositoryToken,
    useClass: TenantRepository,
  },
];
