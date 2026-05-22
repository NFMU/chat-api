import { ApiProperty } from '@nestjs/swagger';
import { UUID } from 'crypto';
import { TenantBrandingProps } from 'src/domain/tenants/value-objects/tenant-branding.vo';
import { TenantSettingProps } from 'src/domain/tenants/value-objects/tenant-setting.vo';
import { z } from 'zod';

export const CreateTenantInputSchema = z.object({
  planCode: z.string(),
  ownerUserId: z.uuid(),
  name: z.string(),
  slug: z.string().optional(),
  domain: z.string().optional().nullable(),
  timezoneId: z.uuid(),
  languageId: z.uuid(),
  branding: z.object({
    logoUrl: z.string().optional(),
    color: z.string().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  }).optional(),
  tenantSetting: z.object({
    messageRetentionDays: z.number().int().nonnegative().optional().nullable(),
    guestAccess: z.boolean().optional(),
    fileSharingEnabled: z.boolean().optional(),
    ssoProvider: z.string().optional().nullable(),
  }).optional(),
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
  branding?: TenantBrandingProps;

  @ApiProperty({
    example: {
      messageRetentionDays: 30,
      guestAccess: true,
      fileSharingEnabled: false,
      // ssoProvider: 'azure-ad',
    },
    description: 'Tenant-specific settings. Optional.',
  })
  tenantSetting?: TenantSettingProps;

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