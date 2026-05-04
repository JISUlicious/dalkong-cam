import type {
  LoginRequest,
  RefreshRequest,
  SignupRequest,
} from "@dalkong/shared";

import { api } from "./client";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; emailVerified: boolean };
}

export const authApi = {
  signup: (req: SignupRequest) =>
    api<{ ok: true }>(`/auth/signup`, {
      method: "POST",
      body: req,
      retryOn401: false,
    }),
  login: (req: LoginRequest) =>
    api<AuthResponse>(`/auth/login`, {
      method: "POST",
      body: req,
      retryOn401: false,
    }),
  refresh: (req: RefreshRequest) =>
    api<AuthResponse>(`/auth/refresh`, {
      method: "POST",
      body: req,
      retryOn401: false,
    }),
  me: () => api<{ user: AuthResponse["user"] }>(`/auth/me`),
  logout: (refreshToken: string) =>
    api<{ ok: true }>(`/auth/logout`, {
      method: "POST",
      body: { refreshToken },
    }),
  resendVerification: () =>
    api<{ ok: true }>(`/auth/resend-verification`, { method: "POST" }),
};
