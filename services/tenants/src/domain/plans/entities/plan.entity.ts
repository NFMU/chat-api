import { Entity } from "@xlr8-nest/core/ddd";
import { PlanStatus } from "src/shared/enums";
import { PlanCode } from "../value-objects/plan-code.vo";
import { PlanFeatures } from "../value-objects/plan-features.vo";

export interface PlanLimits {
  maxMembers?: number | null;
  maxChannels?: number | null;
  maxStorageGb?: string | null;
}

export interface PlanProps {
  idSeq?: number;
  code: PlanCode;
  name: string;
  description: string;
  features: PlanFeatures;
  status: PlanStatus;
  limits?: PlanLimits;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Plan extends Entity<PlanCode> {
  private _idSeq?: number;
  private _name: string;
  private _description: string;
  private _maxMembers: number | null;
  private _maxChannels: number | null;
  private _maxStorageGb: string | null;
  private _features: PlanFeatures;
  private _status: PlanStatus;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PlanProps) {
    super(props.code);
    this._idSeq = props.idSeq;
    this._name = props.name;
    this._description = props.description;
    this._features = props.features;
    this._status = props.status;
    this._maxMembers = props.limits?.maxMembers ?? null;
    this._maxChannels = props.limits?.maxChannels ?? null;
    this._maxStorageGb = props.limits?.maxStorageGb ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? this._createdAt;
  }

  static create(
    props: Omit<PlanProps, "idSeq" | "createdAt" | "updatedAt">
  ): Plan {
    return new Plan(props);
  }

  static reconstitute(props: PlanProps): Plan {
    return new Plan(props);
  }

  get code(): PlanCode {
    return this._id;
  }

  getIdSeq(): number | undefined {
    return this._idSeq;
  }
  getName(): string {
    return this._name;
  }
  getDescription(): string {
    return this._description;
  }
  getMaxMembers(): number | null {
    return this._maxMembers;
  }
  getMaxChannels(): number | null {
    return this._maxChannels;
  }
  getMaxStorageGb(): string | null {
    return this._maxStorageGb;
  }
  getFeatures(): PlanFeatures {
    return this._features;
  }
  getStatus(): PlanStatus {
    return this._status;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }

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

  updateLimits(limits: PlanLimits): void {
    if (limits.maxMembers !== undefined) this._maxMembers = limits.maxMembers;
    if (limits.maxChannels !== undefined)
      this._maxChannels = limits.maxChannels;
    if (limits.maxStorageGb !== undefined)
      this._maxStorageGb = limits.maxStorageGb;
    this.touch();
  }

  updateFeatures(features: PlanFeatures): void {
    this._features = features;
    this.touch();
  }

  changeStatus(status: PlanStatus): void {
    this._status = status;
    this.touch();
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
