import { createContext, useContext, useMemo, useState } from "react";
import { userProfile } from "../data/mockData";
import {
  createSessionNonce,
  normalizeEmail,
  sanitizeUserText,
  validateEmail,
  validateName,
  validateOneTimeCode,
  validatePassword,
} from "../lib/security";
import { readSessionJson, removeSessionJson, writeSessionJson } from "../lib/storage";

type AuthRole = "student" | "admin";
type AuthProviderName = "Google" | "Apple" | "Facebook";

export type AuthUser = {
  id: string;
  avatar: string;
  email: string;
  name: string;
  profileCompletion: number;
  role: AuthRole;
};

type Credentials = {
  email: string;
  password: string;
};

type RegistrationInput = Credentials & {
  name: string;
};

type AuthResult = {
  ok: boolean;
  message?: string;
};

type PendingRegistration = {
  email: string;
  name: string;
  passwordStrengthAccepted: boolean;
};

type StoredSession = {
  expiresAt: number;
  issuedAt: number;
  nonce: string;
  user: AuthUser;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  pendingRegistration: PendingRegistration | null;
  registerAccount: (input: RegistrationInput) => Promise<AuthResult>;
  signIn: (input: Credentials) => Promise<AuthResult>;
  signInWithProvider: (provider: AuthProviderName) => void;
  signOut: () => void;
  user: AuthUser | null;
  verifyEmail: (code: string) => Promise<AuthResult>;
};

const AUTH_STORAGE_KEY = "edvora.auth.session.v1";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEMO_VERIFICATION_CODE = "246810";

const demoUsers: Array<AuthUser & { password: string }> = [
  {
    id: "student_demo",
    avatar: userProfile.avatar,
    email: "alex.rivera@email.com",
    name: userProfile.name,
    password: "EdvoraDemo1!",
    profileCompletion: userProfile.profileCompletion,
    role: "student",
  },
  {
    id: "admin_demo",
    avatar: userProfile.avatar,
    email: "admin@edvora.test",
    name: "Maya Admin",
    password: "AdminDemo1!",
    profileCompletion: 100,
    role: "admin",
  },
];

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitialSession() {
  const session = readSessionJson<StoredSession | null>(AUTH_STORAGE_KEY, null);

  if (!session || session.expiresAt <= Date.now()) {
    removeSessionJson(AUTH_STORAGE_KEY);
    return null;
  }

  return session;
}

function persistUser(user: AuthUser) {
  const now = Date.now();
  const session: StoredSession = {
    expiresAt: now + SESSION_TTL_MS,
    issuedAt: now,
    nonce: createSessionNonce(),
    user,
  };

  writeSessionJson(AUTH_STORAGE_KEY, session);
  return session;
}

function toRegisteredUser(pendingRegistration: PendingRegistration): AuthUser {
  return {
    id: `student_${crypto.randomUUID()}`,
    avatar: userProfile.avatar,
    email: pendingRegistration.email,
    name: pendingRegistration.name,
    profileCompletion: 18,
    role: "student",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => getInitialSession());
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);

  const signIn = async ({ email, password }: Credentials): Promise<AuthResult> => {
    const normalizedEmail = normalizeEmail(email);
    const emailValidation = validateEmail(normalizedEmail);

    if (!emailValidation.ok) {
      return emailValidation;
    }

    if (!password) {
      return { ok: false, message: "Password is required." };
    }

    await new Promise((resolve) => setTimeout(resolve, 450));

    const demoUser = demoUsers.find(
      (candidate) => candidate.email === normalizedEmail && candidate.password === password,
    );

    if (!demoUser) {
      return {
        ok: false,
        message: "Invalid credentials. Try the demo student account or register a new account.",
      };
    }

    const { password: _password, ...safeUser } = demoUser;
    setSession(persistUser(safeUser));
    return { ok: true };
  };

  const registerAccount = async ({ email, name, password }: RegistrationInput): Promise<AuthResult> => {
    const cleanName = sanitizeUserText(name, 80);
    const normalizedEmail = normalizeEmail(email);
    const checks = [validateName(cleanName), validateEmail(normalizedEmail), validatePassword(password)];
    const failed = checks.find((check) => !check.ok);

    if (failed) {
      return failed;
    }

    await new Promise((resolve) => setTimeout(resolve, 450));

    setPendingRegistration({
      email: normalizedEmail,
      name: cleanName,
      passwordStrengthAccepted: true,
    });

    return { ok: true };
  };

  const verifyEmail = async (code: string): Promise<AuthResult> => {
    if (!pendingRegistration) {
      return { ok: false, message: "Start registration before verifying an email." };
    }

    const codeValidation = validateOneTimeCode(code);

    if (!codeValidation.ok) {
      return codeValidation;
    }

    await new Promise((resolve) => setTimeout(resolve, 350));

    if (code !== DEMO_VERIFICATION_CODE) {
      return { ok: false, message: "Verification code is incorrect. Prototype code: 246810." };
    }

    const user = toRegisteredUser(pendingRegistration);
    setPendingRegistration(null);
    setSession(persistUser(user));

    return { ok: true };
  };

  const signInWithProvider = (provider: AuthProviderName) => {
    setSession(
      persistUser({
        id: `${provider.toLowerCase()}_demo`,
        avatar: userProfile.avatar,
        email: `${provider.toLowerCase()}-student@edvora.test`,
        name: `${provider} Student`,
        profileCompletion: 42,
        role: "student",
      }),
    );
  };

  const signOut = () => {
    removeSessionJson(AUTH_STORAGE_KEY);
    setSession(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session?.user),
      pendingRegistration,
      registerAccount,
      signIn,
      signInWithProvider,
      signOut,
      user: session?.user ?? null,
      verifyEmail,
    }),
    [pendingRegistration, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
