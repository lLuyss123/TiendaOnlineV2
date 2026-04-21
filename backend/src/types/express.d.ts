import type { Permission, Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        userId: string;
        email: string;
        role: Role;
        active: boolean;
        permissions: Permission[];
      };
      rawBody?: Buffer;
    }
  }
}

export {};
