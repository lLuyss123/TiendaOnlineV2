import { createHash, randomBytes } from "crypto";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Permission, Role } from "@prisma/client";

import { env } from "../config/env";

export type JwtPayload = {
  userId: string;
  role: Role;
  permissions: Permission[];
};

export const hashPassword = async (password: string) => bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signAuthToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as Parameters<typeof jwt.sign>[2] extends infer T
      ? T extends { expiresIn?: infer E }
        ? E
        : never
      : never
  });

export const verifyAuthToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const generateSecureToken = (bytes = 32) => randomBytes(bytes).toString("hex");

export const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");
