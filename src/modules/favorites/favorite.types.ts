import type { Types } from "mongoose";

export interface IFavorite {
  customer: Types.ObjectId;
  equipment: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IFavoriteEquipment {
  _id: Types.ObjectId;
  name: string;
  category: string;
  location: string;
  rentalPrice: number;
  rentalType: "daily" | "weekly" | "monthly";
  image: string;
  status: "available" | "unavailable";
  approvalStatus: "pending" | "approved" | "rejected";
  availableQuantity: number;
}

export interface IFavoriteWithEquipment {
  _id: Types.ObjectId;
  equipment: IFavoriteEquipment | null;
  createdAt: Date;
}