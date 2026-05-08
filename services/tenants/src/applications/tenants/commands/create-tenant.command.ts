import { CreateTenantInput } from "../dtos/create-tenant.input";

export class CreateTenantCommand {
  constructor(
    public readonly input: CreateTenantInput
  ) {}
}