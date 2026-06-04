import { Injectable, Inject } from "@nestjs/common";
import { StatusCode } from "@xlr8-nest/core/constants";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { IPlanRepository, PlanRepositoryToken } from "src/domain/plans/repositories/plan.repository";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

@Injectable()
export class PlanSubscriptionService {
  constructor(
    @Inject(PlanRepositoryToken)
    private readonly planRepo: IPlanRepository
  ) {}

  /**
   * Loads the target plan (with all its versions), resolves the latest published
   * version, infers upgrade vs downgrade direction, and delegates the state change
   * to the Tenant aggregate — which owns the subscription lifecycle internally.
   *
   * The caller is responsible for persisting the tenant afterward
   * (including draining tenant.pullSubscriptionChanges()).
   */
  async changePlan(tenant: Tenant, newPlanCode: PlanCode, reason?: string): Promise<void> {
    const plan = await this.planRepo.findByCode(newPlanCode);
    if (!plan || !plan.isAvailable()) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_NOT_AVAILABLE);
    }

    const planVersion = plan.getLatestPublishedVersion();
    if (!planVersion) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_VERSION_NOT_FOUND);
    }

    const direction = this.inferDirection(tenant.getPlanCode(), newPlanCode);
    tenant.changePlan(newPlanCode, planVersion.getId(), direction, reason);
  }

  /**
   * Variant for callers that know the direction explicitly
   * (e.g. billing-driven forced downgrade).
   */
  async changePlanExplicit(
    tenant: Tenant,
    newPlanCode: PlanCode,
    direction: "upgrade" | "downgrade",
    reason?: string
  ): Promise<void> {
    const plan = await this.planRepo.findByCode(newPlanCode);
    if (!plan || !plan.isAvailable()) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_NOT_AVAILABLE);
    }

    const planVersion = plan.getLatestPublishedVersion();
    if (!planVersion) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_VERSION_NOT_FOUND);
    }

    tenant.changePlan(newPlanCode, planVersion.getId(), direction, reason);
  }

  private inferDirection(currentCode: PlanCode, newCode: PlanCode): "upgrade" | "downgrade" {
    // Placeholder: real implementation compares plan tier/rank values.
    return newCode.value > currentCode.value ? "upgrade" : "downgrade";
  }
}
