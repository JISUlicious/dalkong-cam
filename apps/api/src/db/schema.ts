import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const deviceRoleEnum = pgEnum("device_role", ["camera", "viewer"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    emailVerificationSentAt: timestamp("email_verification_sent_at", {
      withTimezone: true,
    }),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex("users_email_unique").on(sql`lower(${t.email})`),
  }),
);

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: deviceRoleEnum("role").notNull(),
    name: text("name").notNull(),
    sessionId: text("session_id"),
    isRecording: boolean("is_recording").notNull().default(false),
    deviceSecretHash: text("device_secret_hash").notNull(),
    fcmToken: text("fcm_token"),
    apnsToken: text("apns_token"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("devices_user_idx").on(t.userId),
    roleIdx: index("devices_user_role_idx").on(t.userId, t.role),
  }),
);

export const cameraViewerPairs = pgTable(
  "camera_viewer_pairs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cameraId: uuid("camera_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    viewerId: uuid("viewer_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    approvedAt: timestamp("approved_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pairUnique: uniqueIndex("camera_viewer_pair_unique").on(
      t.cameraId,
      t.viewerId,
    ),
    cameraIdx: index("pair_camera_idx").on(t.cameraId),
    viewerIdx: index("pair_viewer_idx").on(t.viewerId),
  }),
);

export const savedVideos = pgTable(
  "saved_videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => devices.id, { onDelete: "cascade" }),
    deviceName: text("device_name").notNull(),
    storageKey: text("storage_key").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    durationMs: integer("duration_ms"),
    contentType: text("content_type").notNull().default("video/mp4"),
    uploadCompleted: boolean("upload_completed").notNull().default(false),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("saved_videos_user_idx").on(t.userId),
    deviceTimeIdx: index("saved_videos_device_time_idx").on(
      t.deviceId,
      t.recordedAt,
    ),
    storageKeyUnique: uniqueIndex("saved_videos_storage_key_unique").on(
      t.storageKey,
    ),
  }),
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    deviceLabel: text("device_label"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userIdx: index("refresh_tokens_user_idx").on(t.userId),
    tokenHashUnique: uniqueIndex("refresh_tokens_token_hash_unique").on(
      t.tokenHash,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type SavedVideo = typeof savedVideos.$inferSelect;
export type NewSavedVideo = typeof savedVideos.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
