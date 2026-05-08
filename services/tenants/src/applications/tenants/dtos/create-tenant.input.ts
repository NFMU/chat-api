import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateTenantInputSchema = z.object({
  planId: z.number(),
  ownerUserId: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  domain: z.string().optional().nullable(),
  timezoneId: z.uuidv4(),
  languageId: z.uuidv4(),
});

export class CreateTenantInput {
  @ApiProperty({
    example: 1,
    description: 'The ID of the plan to which the tenant will be subscribed.',
  })
  planId: number;

  @ApiProperty({
    example: 'user-123',
    description: 'The ID of the user who will be the owner of the tenant.',
  })
  ownerUserId: string;

  @ApiProperty({
    example: 'Acme Corporation',
    description: 'The name of the tenant.',
  })
  name: string;

  @ApiProperty({
    example: 'acme-corp',
    description: 'The slug for the tenant, used in URLs. Optional.',
    nullable: true,
  })
  slug?: string;

  @ApiProperty({
    example: 'acme-corp.com',
    description: 'The domain for the tenant. Optional.',
    nullable: true,
  })
  domain?: string | null;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000', //uuid,
    description: 'The timezone ID for the tenant.',
  })
  timezoneId: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000', //uuid,
    description: 'The language ID for the tenant.',
  })
  languageId: string;
}