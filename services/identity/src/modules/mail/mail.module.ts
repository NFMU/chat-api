import { Module } from '@nestjs/common';
import { MailHandler } from './mail.handler';


@Module({
  controllers: [],
  providers: [MailHandler],
})
export class MailModule {}