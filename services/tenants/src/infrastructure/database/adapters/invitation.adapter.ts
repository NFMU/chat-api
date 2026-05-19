import { Injectable } from "@nestjs/common";
import { UUID } from "crypto";
import { Invitation } from "src/domain/invitations/aggregates/invitation.aggregate";
import { Email } from "src/domain/invitations/value-objects/email.vo";
import { InvitationToken } from "src/domain/invitations/value-objects/invitation-token.vo";
import { InvitationOrm } from "../orms/invitation.orm";

@Injectable()
export class InvitationAdapter {
  toDomain(orm: InvitationOrm): Invitation {
    return Invitation.reconstitute({
      uuid: orm.uuid as UUID,
      tenantId: orm.tenantId as UUID,
      channelId: orm.channelId ?? null,
      email: new Email(orm.email),
      inviteType: orm.inviteType,
      token: new InvitationToken(orm.token),
      roleScope: orm.roleScope,
      roleCode: orm.roleCode,
      invitedBy: orm.invitedBy as UUID,
      status: orm.status,
      expiresAt: orm.expiresAt,
      acceptedAt: orm.acceptedAt ?? null,
      acceptedByUserId: (orm.acceptedByUserId as UUID) ?? null,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  toOrm(domain: Invitation): InvitationOrm {
    return new InvitationOrm({
      uuid: domain.getId() as UUID,
      tenantId: domain.getTenantId(),
      channelId: domain.getChannelId(),
      email: domain.getEmail().value,
      inviteType: domain.getInviteType(),
      token: domain.getToken().value,
      roleScope: domain.getRoleScope(),
      roleCode: domain.getRoleCode(),
      invitedBy: domain.getInvitedBy(),
      status: domain.getStatus(),
      expiresAt: domain.getExpiresAt(),
      acceptedAt: domain.getAcceptedAt(),
      acceptedByUserId: domain.getAcceptedByUserId(),
    });
  }
}
