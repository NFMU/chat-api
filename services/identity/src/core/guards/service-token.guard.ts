import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedError } from "@xlr8-nest/core/errors";
import { ReferenceError } from "src/core/errors/reference.error";

const SERVICE_TOKEN_HEADER = "x-service-token";

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = this.extractToken(request);
    const expected = this.configService.get<string>("INTERNAL_SERVICE_TOKEN");

    if (!provided || !expected || provided !== expected) {
      throw new UnauthorizedError(ReferenceError.ServiceTokenInvalid);
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const value = request.headers?.[SERVICE_TOKEN_HEADER];
    if (Array.isArray(value)) {
      return value[0] ?? null;
    }
    return typeof value === "string" && value.length > 0 ? value : null;
  }
}
