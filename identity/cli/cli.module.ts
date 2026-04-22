import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Command, CommandRunner } from 'nest-commander';
import { DatabaseModule } from 'src/database/database.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule
  ],
})
export class CliModule {}
