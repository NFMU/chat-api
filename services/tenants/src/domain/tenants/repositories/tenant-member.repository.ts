import { UUID } from "crypto";
import { TenantMember } from "../entities/tenant-member.entity";

export const TenantMemberRepositoryToken = Symbol("TenantMemberRepository");

export interface ITenantMemberRepository {
  save(member: TenantMember): Promise<void>;
  findByTenantAndUser(tenantId: UUID, userId: UUID): Promise<TenantMember | null>;
  findActiveMembersByTenant(tenantId: UUID): Promise<TenantMember[]>;
  existsActiveByTenantAndUser(tenantId: UUID, userId: UUID): Promise<boolean>;
}
