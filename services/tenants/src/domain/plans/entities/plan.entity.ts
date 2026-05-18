import { Entity } from "@xlr8-nest/core/ddd";
import { StatusCode } from "@xlr8-nest/core";
import { PlanStatus } from "src/shared/enums";
import { TenantErrors } from "src/shared/errors/tenant.error";
import { BusinessException } from "src/shared/exceptions/business.exception";
import { PlanCode } from "../value-objects/plan-code.vo";

export interface PlanLimits {
  maxMembers?: number | null;
  maxChannels?: number | null;
  maxStorageGb?: string | null;
}

export interface PlanProps {
  code: PlanCode;
  name: string;
  description: string;
  status: PlanStatus;
  nextVersion?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Plan extends Entity<PlanCode> {
  private _name: string;
  private _description: string;
  private _status: PlanStatus;
  private _nextVersion: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PlanProps) {
    super(props.code);
    this._name = props.name;
    this._description = props.description;
    this._status = props.status;
    this._nextVersion = props.nextVersion ?? 1;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static create(props: Omit<PlanProps, "createdAt" | "updatedAt" | "nextVersion">): Plan {
    return new Plan(props);
  }

  static reconstitute(props: PlanProps): Plan {
    return new Plan(props);
  }

  // --- Business operations ---

  isAvailable(): boolean {
    return this._status === PlanStatus.ACTIVE;
  }

  rename(name: string): void {
    this._name = name;
    this.touch();
  }

  updateDescription(description: string): void {
    this._description = description;
    this.touch();
  }

  changeStatus(status: PlanStatus): void {
    this._status = status;
    this.touch();
  }

  /**
   * Reserves the next version number for a new PlanVersion and advances the counter.
   * The caller is responsible for creating the PlanVersion with the returned number
   * and saving both the PlanVersion and this Plan in the same transaction.
   */
  useNextVersion(): number {
    if (!this.isAvailable()) {
      throw new BusinessException(StatusCode.BAD_REQUEST, TenantErrors.PLAN_NOT_AVAILABLE);
    }
    const version = this._nextVersion++;
    this.touch();
    return version;
  }

  // --- Private helpers ---

  private touch(): void {
    this._updatedAt = new Date();
  }

  // --- Getters ---

  get code(): PlanCode {
    return this._id;
  }

  getName(): string {
    return this._name;
  }
  getDescription(): string {
    return this._description;
  }
  getStatus(): PlanStatus {
    return this._status;
  }
  getNextVersion(): number {
    return this._nextVersion;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
