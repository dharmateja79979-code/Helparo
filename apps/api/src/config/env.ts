import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(8080),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STORAGE_BOOKING_BUCKET: z.string().default("booking-media"),
  DEFAULT_COUNTRY: z.string().default("India"),
  FALLBACK_CITY: z.string().default("Bangalore"),
  CASHFREE_ENABLED: z.coerce.boolean().default(false),
  CASHFREE_BASE_URL: z.string().url().default("https://sandbox.cashfree.com/pg"),
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_RETURN_URL: z.string().url().optional(),
  FCM_ENABLED: z.coerce.boolean().default(false),
  APP_JWT_SECRET: z.string().min(16).default("change-this-app-jwt-secret"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
