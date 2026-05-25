import { ApiProperty } from "@nestjs/swagger";
import { PlanFeaturesProps } from "src/domain/plans/value-objects/plan-features.vo";
import { PlanLimitProps } from "src/domain/plans/value-objects/plan-limit.vo";
import { z } from "zod";

export const CreatePlanInputSchema = z.object({
  code: z.string().regex(/^PLAN-[A-Z0-9]+$/, "Plan code must follow the format PLAN-<ALPHANUMERIC>"),
  name: z.string(),
  description: z.string(),
  features: z.object({
    guestAccess: z.boolean().optional(),
    customBranding: z.boolean().optional(),
    sso: z.boolean().optional(),
    auditLog: z.boolean().optional(),
  }).optional(),
  limit: z.object({
    maxMembers: z.number().int().nonnegative().optional(),
    maxChannels: z.number().int().nonnegative().optional(),
    maxStorageGb: z.string().optional(), // Using string to accommodate large numbers
  }).optional(),
});

export class CreatePlanInput {
  @ApiProperty({
    example: 'PLAN-PREMIUM',
    description: 'Unique code for the plan. Must follow the format PLAN-<ALPHANUMERIC> (e.g. PLAN-FREE, PLAN-PREMIUM).',
  })
  code: string;

  @ApiProperty({
    example: 'Premium Plan',
    description: 'Human-readable name of the plan.',
  })
  name: string;

  @ApiProperty({
    example: 'The Premium Plan offers advanced features and higher limits.',
    description: 'A detailed description of the plan.',
  })
  description: string;

  @ApiProperty({
    example: {
      guestAccess: true,
      customBranding: true,
      sso: true,
      auditLog: true,
    },
    description: 'Feature flags for the plan. Optional.',
  })
  features: PlanFeaturesProps;

  @ApiProperty({
    example: {
      maxMembers: 100,
      maxChannels: 10,
      maxStorageGb: "1024",
    },
    description: 'Limits for the plan. Optional.',
  })
  limit: PlanLimitProps;
}
