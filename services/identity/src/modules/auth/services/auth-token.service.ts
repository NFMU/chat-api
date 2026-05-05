import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedError } from "@xlr8-nest/core/errors";
import { AuthError } from "src/core/errors/auth.error";
import { User, UserStatus } from "src/database/entities/user.entity";
import { ACCESS_TOKEN_EXPIRES_IN_SECONDS } from "../auth.constants";
import { LoginOutput } from "../outputs";

@Injectable()
export class AuthTokenService {
  constructor(private readonly jwtService: JwtService) {}

  async buildTokenOutput(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<LoginOutput> {
    const accessToken = await this.jwtService.signAsync(
      {
        userId,
        sessionId,
        type: "access",
      },
      {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      session_id: sessionId,
    };
  }

  assertUserCanAuthenticate(user: User): void {
    if (!user.isEmailVerified) {
      throw new UnauthorizedError(AuthError.EmailNotVerified);
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(AuthError.AccountNotActive);
    }
  }
}
