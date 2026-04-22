import { CanActivate, ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      //throw
    }

    try {
      const payload = this.jwtService.verifyAsync(token);
    }catch{

    }

    return !!token; 
  }
  extractTokenFromRequest(request: any): string | null { 
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7); // Remove 'Bearer ' prefix
    }
    return null;
  }
}