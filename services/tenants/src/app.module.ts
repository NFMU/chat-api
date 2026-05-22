import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@xlr8-nest/core';
import { MessagingModule } from '@xlr8-nest/core/messaging';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ApplicationProvider } from './applications/tenants/application-provider';
import { InfrastructureProvider } from './infrastructure/infrastructure-provider';
import { TenantsController } from './presentation/http/tenants/tenants.controller';
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
      // Register translators here as new bounded contexts add them.
      // The library wires the OutboxPublisher, repository, worker, and
      // default ConsoleMessagePublisher automatically.
      translators: [TenantEventTranslator],
    }),
  ],
  controllers: [TenantsController],
  providers: [
    ...ApplicationProvider,
    ...InfrastructureProvider,
  ],
})
export class AppModule {}
