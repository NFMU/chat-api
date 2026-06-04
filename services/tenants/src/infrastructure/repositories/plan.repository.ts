import { Injectable } from "@nestjs/common";
import { EntityManager } from "typeorm";
import { OptimisticLockVersionMismatchError } from "typeorm";
import { StatusCode } from "@xlr8-nest/core/constants";
import { TypeOrmClient } from "@xlr8-nest/core/database";
import { Plan } from "src/domain/plans/aggregates/plan.aggregate";
import { IPlanRepository } from "src/domain/plans/repositories/plan.repository";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { PlanVersionStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { PlanAdapter } from "../database/adapters/plan.adapter";
import { PlanVersionAdapter } from "../database/adapters/plan-version.adapter";
import { PlanOrm } from "../database/orms/plan.orm";
import { PlanVersionOrm } from "../database/orms/plan-version.orm";

@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(
    private readonly typeOrmClient: TypeOrmClient,
    private readonly planAdapter: PlanAdapter,
    private readonly versionAdapter: PlanVersionAdapter,
  ) {}

  get client(): EntityManager {
    return this.typeOrmClient.client;
  }

  async save(plan: Plan): Promise<void> {
    try {
      await this.client.save(PlanOrm, this.planAdapter.toOrm(plan));
    } catch (err) {
      if (err instanceof OptimisticLockVersionMismatchError) {
        throw new BusinessException(
          StatusCode.CONFLICT,
          TenantErrors.PLAN_CONCURRENT_MODIFICATION,
        );
      }
      throw err;
    }
    for (const version of plan.pullVersionChanges()) {
      await this.client.save(PlanVersionOrm, this.versionAdapter.toOrm(version));
    }
  }

  async findByCode(code: PlanCode): Promise<Plan | null> {
    const orm = await this.typeOrmClient.client.getRepository(PlanOrm).findOne({
      where: { code: code.value },
      relations: { versions: true },
    });
    if (!orm) return null;
    // Exclude deprecated versions — the aggregate only operates on active ones.
    // _latestVersionNumber on the Plan row tracks the true highest number assigned,
    // so draftNewVersion() is not affected by this filter.
    orm.versions = (orm.versions ?? []).filter(
      (v) => v.status !== PlanVersionStatus.DEPRECATED,
    );
    return this.planAdapter.toDomain(orm);
  }
}
