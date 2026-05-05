import { ApiProperty } from "@nestjs/swagger";

export class LogoutOutput {
  @ApiProperty({ example: true })
  revoked: boolean;
}
