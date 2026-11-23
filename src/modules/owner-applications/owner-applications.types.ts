export const OWNER_APPLICATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export type OwnerApplicationStatus =
  (typeof OWNER_APPLICATION_STATUSES)[number];

export interface IOwnerApplication {
  userId: string;
  businessName: string;
  contactNumber: string;
  address: string;
  status: OwnerApplicationStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}