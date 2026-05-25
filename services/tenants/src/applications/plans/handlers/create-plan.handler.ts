import { CommandHandler, EventBus, ICommandHandler } from "@xlr8-nest/core";
import { Inject } from "@nestjs/common";
import { StatusCode } from "@xlr8-nest/core";
import { IUnitOfWork, IUnitOfWorkToken } from "@xlr8-nest/core/database";
import { OutboxPublisher } from "@xlr8-nest/core/messaging";
import { CreatePlanCommand } from "../commands/create-plan.command";
import { IPlanRepository, PlanRepositoryToken } from "src/domain/plans/repositories/plan.repository";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { PlanLimit } from "src/domain/plans/value-objects/plan-limit.vo";
import { PlanFeatures } from "src/domain/plans/value-objects/plan-features.vo";
import { PlanCreationService } from "src/domain/services/plan-creation.service";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

@CommandHandler(CreatePlanCommand)
export class CreatePlanHandler implements ICommandHandler<CreatePlanCommand> {
  constructor(
    @Inject(PlanRepositoryToken)
    private readonly planRepo: IPlanRepository,
    @Inject(IUnitOfWorkToken)
    private readonly uow: IUnitOfWork,
    private readonly planCreationService: PlanCreationService,
    private readonly outbox: OutboxPublisher,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreatePlanCommand): Promise<void> {
    const { input } = command;

    // 1. Construct value objects — validation errors surface here.
    const planCode = new PlanCode(input.code);
    const limit = new PlanLimit(input.limit ?? {});
    const features = new PlanFeatures(input.features ?? {});

    // 2. Uniqueness guard — plan codes are service-wide identifiers.
    const existing = await this.planRepo.findByCode(planCode);
    if (existing) {
      throw new BusinessException(StatusCode.CONFLICT, TenantErrors.PLAN_ALREADY_EXISTS);
    }

    // 3. Domain service: creates Plan + auto-drafts initial PlanVersion.
    const plan = this.planCreationService.createPlan({
      code: planCode,
      name: input.name,
      description: input.description,
      limit,
      features,
    });

    // 4. Atomic transaction: persist plan + initial version + any outbox events.
    const domainEvents = await this.uow.transaction(async () => {
      await this.planRepo.save(plan);
      return this.outbox.publishFrom(plan);
    });

    // 5. Dispatch domain events in-process after commit.
    for (const event of domainEvents) {
      this.eventBus.publish(event);
    }
  }
}
