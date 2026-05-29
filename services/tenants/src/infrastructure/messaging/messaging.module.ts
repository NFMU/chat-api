import { Global, Module } from "@nestjs/common";
import { MessagingModule as MessagingLib } from "@xlr8-nest/core/messaging";
import { TenantEventTranslator } from "src/applications/tenants/translators/tenant-event.translator";
import { RabbitMQPublisher } from "./publishers/rabbitmq.publisher";
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq";

@Global()
@Module({
  imports: [
    RabbitMQModule.forRoot({
      exchanges: [
        {
          name: 'tenants-exchange',
        }
      ],
      uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
    }),
    MessagingLib.forRoot({
      global: true,
      cli: true,
      translators: [
        TenantEventTranslator
      ],
      messagePublisher: RabbitMQPublisher
    })
  ]
})
export class MessagingModule {}