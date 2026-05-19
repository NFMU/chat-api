import { Provider } from "@nestjs/common";
import { TenantHandlers } from "./handlers";

export const ApplicationProvider: Provider[] = [
  ...TenantHandlers,
];
