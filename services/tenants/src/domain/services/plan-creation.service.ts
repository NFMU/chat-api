import { Injectable } from "@nestjs/common";
import { Plan } from "src/domain/plans/aggregates/plan.aggregate";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { PlanFeatures } from "src/domain/plans/value-objects/plan-features.vo";
import { PlanLimit } from "src/domain/plans/value-objects/plan-limit.vo";
import { PlanStatus } from "src/shared/enums";

export interface PlanCreationProps {
  code: PlanCode;
  name: string;
  description: string;
  limit: PlanLimit;
  features: PlanFeatures;
}

@Injectable()
export class PlanCreationService {
  /**
   * Creates a new Plan in ACTIVE status and auto-drafts its initial PlanVersion.
   * Policy decisions (uniqueness checks, status defaulting) are the caller's concern.
   */
  createPlan(props: PlanCreationProps): Plan {
    const plan = Plan.create({
      code: props.code,
      name: props.name,
      description: props.description,
      status: PlanStatus.ACTIVE,
    });
    plan.draftNewVersion(props.limit, props.features);
    return plan;
  }
}
