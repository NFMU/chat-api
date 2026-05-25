import { Provider } from "@nestjs/common";
import { TenantHandlers } from "./tenants/handlers";
import { PlanHandlers } from "./plans/handlers";

/**
 * Application-layer providers: command handlers only.
 * Domain services live in DomainProvider; infrastructure in InfrastructureProvider.
 * TenantEventTranslator is registered via MessagingModule.forRoot() in app.module.ts.
 */
export const ApplicationProvider: Provider[] = [
  ...TenantHandlers,
  ...PlanHandlers,
];
