import { ApiProperty } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { TenantBrandingJson, TenantSettingsJson } from 'src/shared';
import { z } from 'zod';

export const CreateTenantInputSchema = z.object({
  planCode: z.string(),
  ownerUserId: z.uuid(),
  name: z.string(),
  slug: z.string().optional(),
  domain: z.string().optional().nullable(),
  timezoneId: z.uuid(),
  languageId: z.uuid(),
});

export class CreateTenantInput {
  @ApiProperty({
    example: 'plan_premium',
    description: 'The code of the plan to which the tenant will be subscribed.',
  })
  planCode: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000', //uuid,
    description: 'The ID of the user who will be the owner of the tenant.',
  })
  ownerUserId: UUID;

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
    example: {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#ff0000',
      theme: 'light',
    },
    description: 'Branding information for the tenant. Optional.',
  })
  branding?: TenantBrandingJson; // You can define a more specific type based on your branding structure

  @ApiProperty({
    example: {
      

    },
    description: 'Tenant-specific settings. Optional.',
  })
  tenantSetting?: TenantSettingsJson; // You can define a more specific type based on your tenant settings structure

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000', //uuid,
    description: 'The timezone ID for the tenant.',
  })
  timezoneId: UUID;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000', //uuid,
    description: 'The language ID for the tenant.',
  })
  languageId: UUID;
}