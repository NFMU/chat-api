import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";
import { IMessagePublisher, OutboxEventRecord } from "@xlr8-nest/core/messaging";

export class RabbitMQPublisher implements IMessagePublisher { 
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async publish(record: OutboxEventRecord): Promise<void>{
    await this.amqpConnection.publish(
      'tenants-exchange', //-- This should be the name of the exchange you have configured
      'tenant.routing.key', //-- This should be determined based on the event type
      record.payload,
      {
        persistent: true, // Ensure messages are persisted to disk
      }
    );
  }
}