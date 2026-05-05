import { ApiProperty } from "@nestjs/swagger";

export class AcceptedOutput {
  @ApiProperty({ example: true })
  accepted: boolean;
}
