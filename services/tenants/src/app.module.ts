import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@xlr8-nest/core';
import { DatabaseModule } from './infrastructure/database/database.module';

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
  controllers: [],
  providers: [],
})
export class AppModule {}
