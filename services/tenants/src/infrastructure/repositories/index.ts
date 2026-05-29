import { Provider } from "@nestjs/common";
import { TenantRepositoryToken } from "src/domain/tenants/repositories/tenant.repository";
import { PlanRepositoryToken } from "src/domain/plans/repositories/plan.repository";
import { TenantRepository } from "./tenant.repository";
import { PlanRepository } from "./plan.repository";

export const repositories: Provider[] = [
  {
    provide: TenantRepositoryToken,
    useClass: TenantRepository,
  },
  {
    provide: PlanRepositoryToken,
    useClass: PlanRepository,
  },
];
