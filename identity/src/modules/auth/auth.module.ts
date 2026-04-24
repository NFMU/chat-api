import { Module } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.services';

@Module({
  imports: [],
  controllers: [],
  providers: [
    AuthRepository,
    AuthService
  ],
  exports: [],
})
export class AuthModule {}
