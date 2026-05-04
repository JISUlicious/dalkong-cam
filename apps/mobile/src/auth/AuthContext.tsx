import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { authApi } from "@/api/auth";
import { tokenStore } from "./tokenStore";

interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  hydrated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe(({ user: u }) => setUser(u));
    void tokenStore.hydrate().finally(() => setHydrated(true));
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hydrated,
      async signIn(email, password) {
        const resp = await authApi.login({ email, password });
        await tokenStore.setSession(resp);
      },
      async signUp(email, password) {
        await authApi.signup({ email, password });
      },
      async signOut() {
        await tokenStore.clear();
      },
    }),
    [user, hydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
