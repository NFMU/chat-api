import { Injectable } from "@nestjs/common";
import { AuthRepository } from "./auth.repository";
import { LoginInput, SignupInput } from "./inputs";
import { comparePassword } from "src/core/utils";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedError } from "@xlr8-nest/core";
import { AuthError } from "src/core/errors/auth.error";

@Injectable()
export class AuthService{
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService
  ){}

  async login(
    input: LoginInput
  ){
    const { email, password } = input;
    const user = await this.authRepository.getUserByEmail(email);
    
    const isPasswordValid = comparePassword(password, user.passwordHash);
    if(!isPasswordValid){
      throw new UnauthorizedError(AuthError.InvalidCredentials)
    }

    const token = await this.jwtService.sign({ userId: user.id });

    return { token };
  }

  signup(
    input: SignupInput
  ){}
}