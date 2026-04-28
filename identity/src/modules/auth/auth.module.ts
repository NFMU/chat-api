import { Module } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.services';
import { AuthController } from './auth.controller';

@Module({
  imports: [],
  controllers: [
    AuthController
  ],
  providers: [
    AuthRepository,
    AuthService
  ],
})
export class AuthModule {}
