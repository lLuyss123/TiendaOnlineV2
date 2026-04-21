import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";

import { authService } from "@/services/auth";
import type { User } from "@/types/api";

const authStorageKey = "sportstore-auth-user";

const readStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(authStorageKey);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as User;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
};

const persistUser = (user: User | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(authStorageKey);
    return;
  }

  window.localStorage.setItem(authStorageKey, JSON.stringify(user));
};

type RefreshSessionOptions = {
  background?: boolean;
};

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<User>;
  register: (payload: { nombre: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: (options?: RefreshSessionOptions) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [bootstrappedUser] = useState<User | null>(() => readStoredUser());
  const [user, setUser] = useState<User | null>(bootstrappedUser);
  const [isLoading, setIsLoading] = useState(() => bootstrappedUser === null);

  const refreshSession = useCallback(async ({ background = false }: RefreshSessionOptions = {}) => {
    if (!background) {
      setIsLoading(true);
    }

    try {
      const { user: nextUser } = await authService.me();
      persistUser(nextUser);
      startTransition(() => setUser(nextUser));
    } catch (error) {
      console.error("[auth] No pudimos revalidar la sesion.", error);
    } finally {
      if (!background) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshSession({ background: bootstrappedUser !== null });
  }, [bootstrappedUser, refreshSession]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshSession({ background: true });
      }
    };

    const handleFocus = () => {
      void refreshSession({ background: true });
    };

    const handleOnline = () => {
      void refreshSession({ background: true });
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshSession]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login: async (payload) => {
        const { user: loggedInUser } = await authService.login(payload);
        persistUser(loggedInUser);
        startTransition(() => setUser(loggedInUser));
        return loggedInUser;
      },
      register: async (payload) => {
        await authService.register(payload);
      },
      logout: async () => {
        await authService.logout();
        persistUser(null);
        startTransition(() => setUser(null));
      },
      refreshSession
    }),
    [isLoading, refreshSession, user]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
};
