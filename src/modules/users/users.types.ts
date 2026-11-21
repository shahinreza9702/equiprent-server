
export const USER_ROLES = [
  "customer",
  "owner",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = [
  "active",
  "blocked",
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  status: UserStatus;
}
