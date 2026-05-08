import { Module } from "@nestjs/common";
import { ServiceTokenGuard } from "src/core/guards/service-token.guard";
import { InternalReferenceController } from "./internal-reference.controller";
import { ReferenceController } from "./reference.controller";
import { ReferenceRepository } from "./reference.repository";
import { ReferenceService } from "./reference.service";

@Module({
  imports: [],
  controllers: [ReferenceController, InternalReferenceController],
  providers: [ReferenceRepository, ReferenceService, ServiceTokenGuard],
  exports: [ReferenceService],
})
export class ReferenceModule {}
