import { Provider } from "@nestjs/common";
import { TenantHandlers } from "./handlers";
import { TenantSlugGeneratorService } from "src/domain/services/tenant-slug-generator.service";

/**
 * Application-layer providers specific to the tenants context.
 * Note: TenantEventTranslator is registered via MessagingModule.forRoot()
 * in app.module.ts — the library wires it into the translator registry.
 */
export const ApplicationProvider: Provider[] = [
  ...TenantHandlers,
  TenantSlugGeneratorService,
];
