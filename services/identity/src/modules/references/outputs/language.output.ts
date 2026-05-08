import { ApiProperty } from "@nestjs/swagger";

export class LanguageOutput {
  @ApiProperty({
    example: "f15e9a5b-57f2-4a0b-85b4-bce74a4c9b01",
    description:
      "Stable cross-service identifier. Use this when referencing a language from another service.",
  })
  uuid: string;

  @ApiProperty({
    example: 1,
    description:
      "Internal integer id. Used by identity-service intra-DB foreign keys (e.g. user_settings.language_id). Not for cross-service use.",
  })
  id: number;

  @ApiProperty({ example: "en", description: "BCP 47 language tag" })
  code: string;

  @ApiProperty({ example: "en-US", description: "Full locale identifier" })
  locale: string;

  @ApiProperty({ example: "English", description: "Display name in English" })
  name: string;
}

export class LanguageListOutput {
  @ApiProperty({ type: [LanguageOutput] })
  items: LanguageOutput[];
}
