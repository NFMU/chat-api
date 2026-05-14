import { CommandHandler, ICommandHandler } from "@xlr8-nest/core";
import { CreateTenantCommand } from "../commands/create-tenant.command";
import { Tenant } from "src/domain/tenants/aggregates/tenant.aggregate";

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand>{
  async execute(command: CreateTenantCommand): Promise<void> {
    const { input } = command;
    
  }
}