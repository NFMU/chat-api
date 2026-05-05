import { ApiBearerAuth } from "@nestjs/swagger"

export const BearerAuth = () => ApiBearerAuth('JWT-auth');