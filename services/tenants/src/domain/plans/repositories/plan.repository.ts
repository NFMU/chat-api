import { Plan } from "../aggregates/plan.aggregate";
import { PlanCode } from "../value-objects/plan-code.vo";

export const PlanRepositoryToken = Symbol("PlanRepository");

export interface IPlanRepository {
  /**
   * Persists the plan and drains plan.pullVersionChanges() atomically.
   */
  save(plan: Plan): Promise<void>;
  /**
   * Loads the plan together with all its PlanVersion entities.
   * Returns null if not found.
   */
  findByCode(code: PlanCode): Promise<Plan | null>;
}
