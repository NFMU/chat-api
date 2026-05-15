import { CommandHandler, EventBus, ICommandHandler } from "@xlr8-nest/core";
import { CreateTenantCommand } from "../commands/create-tenant.command";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { ITenantRepository, TenantRepositoryToken } from "src/domain/tenants/repositories/tenant.repository";
import { Inject } from "@nestjs/common";
import { PlanCode } from "src/domain/plans/value-objects/plan-code.vo";
import { TenantSlug } from "src/domain/tenants/value-objects/tenant-slug.vo";
import { TenantDomain } from "src/domain/tenants/value-objects/tenant-domain.vo";
import { TenantBranding } from "src/domain/tenants/value-objects/tenant-branding.vo";
import { TenantSetting } from "src/domain/tenants/value-objects/tenant-setting.vo";
import { pushDomainEvents } from "src/shared/utils/event.util";

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand>{
  constructor(
    @Inject(TenantRepositoryToken)
    private readonly tenantRepo: ITenantRepository,
    private readonly eventBus: EventBus
  ) {}
  async execute(command: CreateTenantCommand): Promise<void> {
    const { input } = command;
    const tenant = Tenant.create({
      name: input.name,
      planCode: new PlanCode(input.planCode),
      ownerUserId: input.ownerUserId,
      slug: new TenantSlug(input.slug),
      domain: new TenantDomain(input.domain),
      branding: new TenantBranding(input.branding),
      settings: new TenantSetting(input.tenantSetting),
      timezoneId: input.timezoneId,
      languageId: input.languageId,
    });
    await this.tenantRepo.create(tenant);
    pushDomainEvents(this.eventBus, tenant);
  }
}