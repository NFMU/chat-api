import { Controller, Delete, Get, Patch, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@xlr8-nest/core/ddd";

@Controller("plans")
export class PlansController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Get()
  findAll() {
  }

  @Get(":id")
  findOne() {
  }

  @Post()
  create() {
  }

  @Patch(":id")
  update() {
  }

  @Delete(":id")
  deprecate() {
  }
}