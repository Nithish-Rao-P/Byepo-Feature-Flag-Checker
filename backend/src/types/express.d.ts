export type AuthRole = "super_admin" | "org_admin" | "end_user";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
  organizationId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
