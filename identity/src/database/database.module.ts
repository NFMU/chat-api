import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DatabaseExtensionModule,
  DatabaseModuleConfig,
  DatabaseType,
} from "@xlr8-nest/core/database";
import * as path from "path";
import { databaseSeeders } from "./seeders";

@Global()
@Module({
  imports: [
    DatabaseExtensionModule.registerAsync({
      inject: [ConfigService],
      useFactory: ((configService: ConfigService) => {
        return {
          connection: {
            type: DatabaseType.POSTGRES,
            host: configService.get("DB_HOST"),
            port: configService.get("DB_PORT"),
            username: configService.get("DB_USERNAME"),
            password: configService.get("DB_PASSWORD"),
            database: configService.get("DB_NAME"),
            synchronize: false,
            logging: true,
          },
          entities: [path.join(__dirname, "entities/**/*.entity.{ts,js}")],
          migration: {
            enabled: true,
            migrationsPath: path.join(__dirname, "migrations"),
            tableName: "migrations",
            autoRun: configService.get("AUTO_RUN_MIGRATIONS") === "true",
          },
          seeder: {
            enabled: configService.get("NODE_ENV") !== "production",
            seeds: databaseSeeders,
            autoRun: configService.get("AUTO_RUN_SEEDS") === "true",
          },
        };
      }) as (...args: unknown[]) => DatabaseModuleConfig | Promise<DatabaseModuleConfig>,
      global: true,
    }) ,
  ],
  exports: [DatabaseExtensionModule],
})
export class DatabaseModule {}
