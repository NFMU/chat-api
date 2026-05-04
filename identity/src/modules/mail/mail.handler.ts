import { EventHandler } from "@xlr8-nest/core";
import { UserCreatedEvent } from "../auth/events/user-created.event";
import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailHandler {
  constructor(
    private readonly mailService: MailerService
  ){}

  @EventHandler(UserCreatedEvent)
  async handleUserCreated(event: UserCreatedEvent) {
    await this.mailService.sendMail({
      to: event.email,
      subject: 'Welcome to Our Service',
      text: `Hello ${event.displayName},\n\nThank you for signing up! We're excited to have you on board.\n\nBest regards,\nThe Team`,
    });
  }
}
