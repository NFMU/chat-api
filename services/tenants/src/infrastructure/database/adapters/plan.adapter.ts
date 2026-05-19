import { Injectable } from "@nestjs/common";
import { Plan } from "src/domain/plans/aggregates/plan.aggregate";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { PlanOrm } from "../orms/plan.orm";
import { PlanVersionAdapter } from "./plan-version.adapter";

@Injectable()
export class PlanAdapter {
  constructor(private readonly versionAdapter: PlanVersionAdapter) {}

  toDomain(orm: PlanOrm): Plan {
    const versions = (orm.versions ?? []).map((v) => this.versionAdapter.toDomain(v));
    return Plan.reconstitute({
      code: new PlanCode(orm.code),
      name: orm.name,
      description: orm.description ?? "",
      status: orm.status,
      versions,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toOrm(domain: Plan): PlanOrm {
    return new PlanOrm({
      code: domain.code.value,
      name: domain.getName(),
      description: domain.getDescription(),
      status: domain.getStatus(),
    });
  }
}
