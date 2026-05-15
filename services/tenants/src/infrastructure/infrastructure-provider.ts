import { Provider } from "@nestjs/common";
import { repositories } from "./repositories";

export const InfrastructureProvider: Provider[] = [
  ...repositories
]