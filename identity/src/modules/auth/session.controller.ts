import { Controller, Delete, Get, Param, UseGuards } from "@nestjs/common";
import { ApiSuccess } from "@xlr8-nest/core/response";
import { ApiDelete, ApiGet } from "@xlr8-nest/core/openapi";
import { BearerAuth } from "src/core/decorators/bearer-auth.decorator";
import { buildSuccessResponseProxy } from "src/core/utils";
import { AuthContext, CurrentAuth } from "./auth-context.decorator";
import { AuthService } from "./auth.services";
import { LogoutOutput, SessionListOutput } from "./outputs";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("me/sessions")
@UseGuards(JwtAuthGuard)
@BearerAuth()
export class SessionController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiGet(SessionListOutput, {
    description: "List the current user's sessions",
    summary: "List Sessions",
  })
  async listSessions(
    @CurrentAuth() auth: AuthContext,
  ): Promise<ApiSuccess<SessionListOutput>> {
    const result = await this.authService.listSessions(auth.userId);
    return buildSuccessResponseProxy(result);
  }

  @Delete(":sessionId")
  @ApiDelete(LogoutOutput, {
    description: "Revoke a session owned by the current user",
    summary: "Revoke Session",
  })
  async revokeSession(
    @CurrentAuth() auth: AuthContext,
    @Param("sessionId") sessionId: string,
  ): Promise<ApiSuccess<LogoutOutput>> {
    const result = await this.authService.revokeSession(auth.userId, sessionId);
    return buildSuccessResponseProxy(result);
  }
}
