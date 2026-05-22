import { CreatePlanInput } from "../dtos/create-plan.input";

export class CreatePlanCommand {
  constructor(public input: CreatePlanInput) {}
}