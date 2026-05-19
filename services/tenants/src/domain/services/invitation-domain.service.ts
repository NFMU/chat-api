import { Injectable, Inject } from "@nestjs/common";
import { StatusCode } from "@xlr8-nest/core";
import { UUID } from "crypto";
import {
  IInvitationRepository,
  InvitationRepositoryToken,
} from "src/domain/invitations/repositories/invitation.repository";
import { Email } from "src/domain/invitations/value-objects/email.vo";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";

@Injectable()
export class InvitationDomainService {
  constructor(
    @Inject(InvitationRepositoryToken)
    private readonly invitationRepo: IInvitationRepository
  ) {}

  /**
   * Enforces the rule that only one PENDING invitation per (tenantId, email) may exist.
   * The IInvitationRepository must expose findPendingByTenantAndEmail for this to work.
   */
  async assertNoDuplicatePendingInvitation(
    tenantId: UUID,
    email: Email
  ): Promise<void> {
    const existing = await this.invitationRepo.findPendingByTenantAndEmail(
      tenantId,
      email
    );
    if (existing) {
      throw new BusinessException(
        StatusCode.CONFLICT,
        TenantErrors.INVITATION_ALREADY_PENDING
      );
    }
  }
}
