
export const EQUIPMENT_RENTAL_TYPES = [
  "daily",
  "weekly",
  "monthly",
] as const;

export type EquipmentRentalType =
  (typeof EQUIPMENT_RENTAL_TYPES)[number];

export const EQUIPMENT_STATUSES = [
  "available",
  "unavailable",
] as const;

export type EquipmentStatus =
  (typeof EQUIPMENT_STATUSES)[number];

export const EQUIPMENT_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type EquipmentApprovalStatus =
  (typeof EQUIPMENT_APPROVAL_STATUSES)[number];

export interface IEquipment {
  name: string;
  description: string;
  category: string;
  rentalPrice: number;
  rentalType: EquipmentRentalType;
  location: string;
  availableQuantity: number;
  condition: string;
  brand: string;
  model: string;
  image: string;
  owner: import("mongoose").Types.ObjectId;
  rentalTerms: string;
  status: EquipmentStatus;
  approvalStatus: EquipmentApprovalStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
