import { AggregateRoot } from "@xlr8-nest/core";
import { UUID } from "crypto";

export class Tenant extends AggregateRoot<UUID> {
  _plan: any; // This should be typed properly based on your Plan entity
  _ownerUserId: string;
  _name: string;
  _slug: string;
  _domain: string;
  _status: string;
  _timezoneId: string;
  _languageId: string;
  _brandingJson: Record<string, any>;
  _settingsJson: Record<string, any>;
  _activatedAt?: Date | null
  _suspendedAt?: Date | null;
  _createdAt: Date;
  _updatedAt: Date;
  _invitations: any[]; // This should be typed properly based on your Invitation entity
  
  constructor(
    id: UUID,
  ){
    super(id);
  }
}