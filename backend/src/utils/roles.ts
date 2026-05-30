import { UserRole } from "@prisma/client";
import type { AuthRole } from "../types/express.js";

export const toAuthRole = (role: UserRole): AuthRole => {
  if (role === UserRole.ORG_ADMIN) {
    return "org_admin";
  }

  return "end_user";
};

export const toDbRole = (role: "org_admin" | "end_user") => {
  if (role === "org_admin") {
    return UserRole.ORG_ADMIN;
  }

  return UserRole.END_USER;
};
