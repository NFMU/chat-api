import { CommandHandler, ICommandHandler } from "@xlr8-nest/core";
import { CreatePlanCommand } from "../commands/create-plan.command";

@CommandHandler(CreatePlanCommand)
export class CreatePlanHandler implements ICommandHandler<CreatePlanCommand> {
  constructor() {}

  async execute(command: CreatePlanCommand): Promise<void> {
    const { input } = command;
    
  }
}