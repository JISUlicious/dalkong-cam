import { z } from "zod";

export const emailSchema = z.string().email().max(254);

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password is too long");

export const signupRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type SignupRequest = z.infer<typeof signupRequestSchema>;

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  deviceLabel: z.string().max(120).optional(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1).max(512),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1).max(512),
});
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; emailVerified: boolean };
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  type: "access";
}
