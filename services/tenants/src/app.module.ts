import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@xlr8-nest/core/ddd';
import { MessagingModule } from '@xlr8-nest/core/messaging';
import { DatabaseModule } from './infrastructure/database/database.module';
import { DomainProvider } from './domain/domain-provider';
import { ApplicationProvider } from './applications/application-provider';
import { InfrastructureProvider } from './infrastructure/infrastructure-provider';
import { TenantsController } from './presentation/http/tenants/tenants.controller';
import { PlansController } from './presentation/http/plans/plans.controller';
import { TenantEventTranslator } from './applications/tenants/translators/tenant-event.translator';

@Module({
  imports: [
    CqrsModule.forRoot({
      maxListeners: 100,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MessagingModule.forRoot({
      translators: [TenantEventTranslator],
    }),
  ],
  controllers: [TenantsController, PlansController],
  providers: [
    ...DomainProvider,
    ...ApplicationProvider,
    ...InfrastructureProvider,
  ],
})
export class AppModule {}
