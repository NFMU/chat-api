import { CommandHandler, EventBus, ICommandHandler } from "@xlr8-nest/core/ddd";
import { Inject } from "@nestjs/common";
import { StatusCode } from "@xlr8-nest/core/constants";
import { IUnitOfWork, IUnitOfWorkToken } from "@xlr8-nest/core/database";
import { OutboxPublisher } from "@xlr8-nest/core/messaging";
import { CreateTenantCommand } from "../commands/create-tenant.command";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { ITenantRepository, TenantRepositoryToken } from "src/domain/tenants/repositories/tenant.repository";
import { IPlanRepository, PlanRepositoryToken } from "src/domain/plans/repositories/plan.repository";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantSlug } from "src/domain/tenants/value-objects/tenant-slug.vo";
import { TenantDomain } from "src/domain/tenants/value-objects/tenant-domain.vo";
import { TenantBranding } from "src/domain/tenants/value-objects/tenant-branding.vo";
import { TenantSetting } from "src/domain/tenants/value-objects/tenant-setting.vo";
import { TenantSlugGeneratorService } from "src/domain/services/tenant-slug-generator.service";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(
    @Inject(TenantRepositoryToken)
    private readonly tenantRepo: ITenantRepository,
    @Inject(PlanRepositoryToken)
    private readonly planRepo: IPlanRepository,
    @Inject(IUnitOfWorkToken)
    private readonly uow: IUnitOfWork,
    private readonly slugGenerator: TenantSlugGeneratorService,
    private readonly outbox: OutboxPublisher,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateTenantCommand): Promise<void> {
    const { input } = command;

    // 1. Load plan with all its versions via the aggregate.
    const planCode = new PlanCode(input.planCode);
    const plan = await this.planRepo.findByCode(planCode);
    if (!plan || !plan.isAvailable()) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_NOT_AVAILABLE);
    }

    // 2. Ask the Plan aggregate for the correct version — no separate repository call.
    const planVersion = plan.getLatestPublishedVersion();
    if (!planVersion) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_VERSION_NOT_FOUND);
    }

    // 3. Resolve slug — generate a unique one from the name when not supplied.
    const slug = input.slug
      ? new TenantSlug(input.slug)
      : await this.slugGenerator.generateUnique(input.name);

    // 4. Null-guard optional fields.
    const domain = input.domain ? new TenantDomain(input.domain) : null;
    const branding = new TenantBranding(input.branding ?? {});
    const settings = new TenantSetting(input.tenantSetting ?? {});

    // 5. Create Tenant aggregate (opens initial TenantSubscription internally).
    const tenant = Tenant.create({
      name: input.name,
      planCode,
      currentPlanVersionId: planVersion.getId(),
      ownerUserId: input.ownerUserId,
      slug,
      domain,
      branding,
      settings,
      timezoneId: input.timezoneId,
      languageId: input.languageId,
    });

    // 6. Atomic transaction: all four writes share the same EntityManager and
    //    commit together — no crash window between the DB write and dispatch.
    //    Domain events fire first (internal notification), then integration
    //    events are written to the outbox (external notification).
    await this.uow.transaction(async () => {
      await this.tenantRepo.create(tenant);
      const domainEvents = tenant.pullEvents();
      await this.eventBus.publishAll(domainEvents);
      await this.outbox.publishEvents(domainEvents);
    });
  }
}
