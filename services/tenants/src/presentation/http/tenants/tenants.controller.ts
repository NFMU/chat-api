import { Body, Controller, Patch, Post } from "@nestjs/common";
import { ApiPost, CommandBus, Validate } from "@xlr8-nest/core";
import { CreateTenantCommand } from "src/applications/tenants/commands/create-tenant.command";
import { CreateTenantInput, CreateTenantInputSchema } from "src/applications/tenants/dtos/create-tenant.input";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @Validate(CreateTenantInputSchema)
  @ApiPost(null, {
    description: "Create a new tenant",
    summary: "Create Tenant",
  })
  async create(@Body() input: CreateTenantInput) {
    const result = await this.commandBus.execute(new CreateTenantCommand(input));
    return result;
  }
}