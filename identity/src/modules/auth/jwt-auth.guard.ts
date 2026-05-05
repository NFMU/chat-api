import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedError } from "@xlr8-nest/core/errors";
import { AuthError } from "src/core/errors/auth.error";
import { AuthContext } from "./auth-context.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedError(AuthError.InvalidCredentials);
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthContext>(token);
      if (
        payload.type !== "access" ||
        typeof payload.userId !== "string" ||
        typeof payload.sessionId !== "string"
      ) {
        throw new UnauthorizedError(AuthError.InvalidCredentials);
      }

      request.auth = {
        userId: payload.userId,
        sessionId: payload.sessionId,
        type: "access",
      } satisfies AuthContext;
      return true;
    } catch {
      throw new UnauthorizedError(AuthError.InvalidCredentials);
    }
  }

  private extractTokenFromRequest(request: any): string | null {
    const authHeader = request.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.slice(7);
    }
    return null;
  }
}

