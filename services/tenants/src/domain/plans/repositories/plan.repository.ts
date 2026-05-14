import { Plan } from "../entities/plan.entity";
import { PlanCode } from "../value-objects/plan-code.vo";

export const PlanRepositoryToken = Symbol("PlanRepository");

export interface IPlanRepository {
  save(plan: Plan): Promise<void>;
  findByCode(code: PlanCode): Promise<Plan | null>;
}
