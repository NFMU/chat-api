import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface AuthContext {
  userId: string;
  sessionId: string;
  type: "access";
}

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.auth;
  },
);

