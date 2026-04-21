import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/postgres"),
  DIRECT_URL: z
    .string()
    .default("postgresql://postgres:postgres@localhost:5432/postgres"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32).default("dev-secret-key-with-at-least-32-characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("SportStore <no-reply@sportstore.com>"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  BOLD_IDENTITY_KEY: z.string().optional(),
  BOLD_SECRET_KEY: z.string().optional(),
  BOLD_WEBHOOK_SIGNATURE: z.string().optional()
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === "production";
