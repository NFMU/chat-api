import { ApiProperty } from "@nestjs/swagger";

export class EmailVerificationOutput {
  @ApiProperty({ example: true })
  verified: boolean;

  @ApiProperty({ example: "f15e9a5b-57f2-4a0b-85b4-bce74a4c9b01" })
  user_id: string;

  @ApiProperty({ example: "user@example.com" })
  email: string;
}
