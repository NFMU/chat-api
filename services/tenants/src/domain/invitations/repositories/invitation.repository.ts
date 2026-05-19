import { UUID } from "crypto";
import { Invitation } from "../aggregates/invitation.aggregate";
import { Email } from "../value-objects/email.vo";
import { InvitationToken } from "../value-objects/invitation-token.vo";

export const InvitationRepositoryToken = Symbol("InvitationRepository");

export interface IInvitationRepository {
  save(invitation: Invitation): Promise<void>;
  findById(id: UUID): Promise<Invitation | null>;
  findByToken(token: InvitationToken): Promise<Invitation | null>;
  findPendingByTenantAndEmail(tenantId: UUID, email: Email): Promise<Invitation | null>;
}
