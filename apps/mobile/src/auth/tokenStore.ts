import * as SecureStore from "expo-secure-store";

import { apiBaseUrl } from "@/lib/config";

const REFRESH_KEY = "dalkong.refreshToken";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; emailVerified: boolean };
}

type Listener = (
  state: {
    accessToken: string | null;
    user: AuthResponse["user"] | null;
  },
) => void;

class TokenStore {
  private accessToken: string | null = null;
  private user: AuthResponse["user"] | null = null;
  private refreshing: Promise<boolean> | null = null;
  private listeners = new Set<Listener>();

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getUser(): AuthResponse["user"] | null {
    return this.user;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ accessToken: this.accessToken, user: this.user });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener({ accessToken: this.accessToken, user: this.user });
    }
  }

  async setSession(resp: AuthResponse): Promise<void> {
    this.accessToken = resp.accessToken;
    this.user = resp.user;
    await SecureStore.setItemAsync(REFRESH_KEY, resp.refreshToken);
    this.notify();
  }

  async clear(): Promise<void> {
    this.accessToken = null;
    this.user = null;
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    this.notify();
  }

  async tryRefresh(): Promise<boolean> {
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const stored = await SecureStore.getItemAsync(REFRESH_KEY).catch(
        () => null,
      );
      if (!stored) return false;
      try {
        const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refreshToken: stored }),
        });
        if (!res.ok) {
          await this.clear();
          return false;
        }
        const data = (await res.json()) as AuthResponse;
        await this.setSession(data);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  async hydrate(): Promise<boolean> {
    return this.tryRefresh();
  }
}

export const tokenStore = new TokenStore();
