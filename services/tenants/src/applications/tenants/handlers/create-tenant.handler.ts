import { CommandHandler, ICommandHandler } from "@xlr8-nest/core";
import { CreateTenantCommand } from "../commands/create-tenant.command";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";
import { ITenantRepository, TenantRepositoryToken } from "src/domain/tenants/repositories/tenant.repository";
import { Inject } from "@nestjs/common";

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand>{
  constructor(
    @Inject(TenantRepositoryToken)
    private readonly tenantRepo: ITenantRepository
  ) {}
  async execute(command: CreateTenantCommand): Promise<void> {
    const { input } = command;
    
  }
}