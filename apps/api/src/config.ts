import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  PUBLIC_BASE_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 30),

  EMAIL_VERIFICATION_SECRET: z.string().min(32),
  EMAIL_FROM: z.string().email(),
  SMTP_URL: z.string().min(1),

  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1).default("dalkong-videos"),
  MINIO_PUBLIC_BASE_URL: z.string().url().optional(),

  TURN_REALM: z.string().min(1),
  TURN_SHARED_SECRET: z.string().min(32),
  TURN_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24),
  TURN_URLS: z.string().min(1),
  STUN_URLS: z.string().min(1),

  FCM_SERVICE_ACCOUNT_JSON: z.string().optional().default(""),
  APNS_KEY_ID: z.string().optional().default(""),
  APNS_TEAM_ID: z.string().optional().default(""),
  APNS_BUNDLE_ID: z.string().optional().default(""),
  APNS_PRIVATE_KEY_PATH: z.string().optional().default(""),

  CORS_ORIGINS: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  TURN_URL_LIST: parsed.data.TURN_URLS.split(",").map((s) => s.trim()).filter(Boolean),
  STUN_URL_LIST: parsed.data.STUN_URLS.split(",").map((s) => s.trim()).filter(Boolean),
  CORS_ORIGIN_LIST: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  isProd: parsed.data.NODE_ENV === "production",
};

export type AppConfig = typeof config;
