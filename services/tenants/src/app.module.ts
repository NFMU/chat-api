import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@xlr8-nest/core';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ApplicatinonProvider } from './applications/tenants/application-provider';
import { InfrastructureProvider } from './infrastructure/infrastructure-provider';
import { TenantsController } from './presentation/http/tenants/tenants.controller';

@Module({
  imports: [
    CqrsModule.forRoot({
      maxListeners: 100,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule
  ],
  controllers: [
    TenantsController
  ],
  providers: [
    ...ApplicatinonProvider,
    ...InfrastructureProvider
  ],
})
export class AppModule {}
