import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Provider as SupabaseProvider, Session } from "@supabase/supabase-js";
import { userProfile } from "../data/mockData";
import {
  normalizeEmail,
  sanitizeUserText,
  validateEmail,
  validateName,
  validateOneTimeCode,
  validatePassword,
} from "../lib/security";
import {
  getOAuthProviderAvailability,
  isSupabaseConfigured,
  missingSupabaseMessage,
  supabase,
} from "../lib/supabase";

type AuthRole = "student" | "admin";
export type AuthProviderName = "Google" | "Apple" | "Facebook" | "X";

const OAUTH_PROVIDERS: Record<AuthProviderName, SupabaseProvider> = {
  Apple: "apple",
  Facebook: "facebook",
  Google: "google",
  X: "x",
};

export type AuthUser = {
  id: string;
  isGuest: boolean;
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
  requiresVerification?: boolean;
};

type PendingRegistration = {
  email: string;
  name: string;
};

type AuthContextValue = {
  canUseGuestAccess: boolean;
  continueAsGuest: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  pendingRegistration: PendingRegistration | null;
  registerAccount: (input: RegistrationInput) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult>;
  signIn: (input: Credentials) => Promise<AuthResult>;
  signInWithProvider: (provider: AuthProviderName, redirectPath?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<AuthResult>;
  user: AuthUser | null;
  verifyEmail: (code: string) => Promise<AuthResult>;
};

type ProfileRow = {
  application_goal: string | null;
  avatar_url: string | null;
  budget: string | null;
  current_level: string | null;
  destination_countries: string[] | null;
  display_name: string;
  field_of_study: string | null;
  intake_season: string | null;
  nationality: string | null;
  onboarding_completed: boolean;
  role: string;
  target_degree: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const GUEST_ACCESS_ENABLED =
  import.meta.env.DEV ||
  import.meta.env.VITE_ENABLE_GUEST_ACCESS === "true" ||
  ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
const DEV_GUEST_SESSION_KEY = "edvora.dev.guest";
const DEV_GUEST_USER: AuthUser = {
  avatar: userProfile.avatar,
  email: "guest@edvora.local",
  id: "dev-guest",
  isGuest: true,
  name: "Guest Student",
  profileCompletion: 0,
  role: "student",
};

function getDevGuestUser() {
  if (!GUEST_ACCESS_ENABLED || window.sessionStorage.getItem(DEV_GUEST_SESSION_KEY) !== "true") {
    return null;
  }

  return DEV_GUEST_USER;
}

function friendlyAuthMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network request failed")
  ) {
    return "The authentication service is offline. Start the local backend and try again.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "The email or password is incorrect.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email before signing in.";
  }

  if (normalized.includes("user already registered")) {
    return "An account already exists for this email.";
  }

  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return message;
}

function profileCompletion(profile: ProfileRow | null) {
  if (profile?.onboarding_completed) {
    return 100;
  }

  const fields = [
    profile?.display_name,
    profile?.nationality,
    profile?.current_level,
    profile?.target_degree,
    profile?.field_of_study,
    profile?.budget,
    profile?.intake_season,
    profile?.application_goal,
    profile?.destination_countries?.length,
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

async function loadAuthUser(session: Session | null): Promise<AuthUser | null> {
  if (!session?.user || !supabase) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select(
      "application_goal, avatar_url, budget, current_level, destination_countries, display_name, field_of_study, intake_season, nationality, onboarding_completed, role, target_degree",
    )
    .eq("id", session.user.id)
    .maybeSingle();
  const profile = (data as ProfileRow | null) ?? null;
  const metadata = session.user.user_metadata as Record<string, unknown>;
  const metadataName =
    typeof metadata.name === "string"
      ? metadata.name
      : typeof metadata.full_name === "string"
        ? metadata.full_name
        : "";
  const metadataAvatar =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : "";

  return {
    id: session.user.id,
    isGuest: false,
    avatar: profile?.avatar_url || metadataAvatar || userProfile.avatar,
    email: session.user.email ?? "",
    name: profile?.display_name || metadataName || session.user.email?.split("@")[0] || "Student",
    profileCompletion: profileCompletion(profile),
    role: profile?.role === "admin" ? "admin" : "student",
  };
}

function getBackend() {
  return isSupabaseConfigured && supabase ? supabase : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);

  const hydrateSession = useCallback(async (session: Session | null) => {
    if (session) {
      window.sessionStorage.removeItem(DEV_GUEST_SESSION_KEY);
    }

    const nextUser = session ? await loadAuthUser(session) : getDevGuestUser();
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const backend = getBackend();

    if (!backend) {
      setUser(getDevGuestUser());
      setIsLoading(false);
      return;
    }

    let active = true;

    void backend.auth.getSession().then(({ data }) => {
      if (active) {
        void hydrateSession(data.session);
      }
    });

    const { data } = backend.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }

      window.setTimeout(() => {
        if (active) {
          void hydrateSession(session);
        }
      }, 0);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [hydrateSession]);

  const continueAsGuest = () => {
    if (!GUEST_ACCESS_ENABLED) {
      return;
    }

    window.sessionStorage.setItem(DEV_GUEST_SESSION_KEY, "true");
    setPendingRegistration(null);
    setIsPasswordRecovery(false);
    setUser(DEV_GUEST_USER);
    setIsLoading(false);
  };

  const signIn = async ({ email, password }: Credentials): Promise<AuthResult> => {
    const normalizedEmail = normalizeEmail(email);
    const emailValidation = validateEmail(normalizedEmail);

    if (!emailValidation.ok) {
      return emailValidation;
    }

    if (!password) {
      return { ok: false, message: "Password is required." };
    }

    const backend = getBackend();

    if (!backend) {
      return { ok: false, message: missingSupabaseMessage };
    }

    const { data, error } = await backend.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return { ok: false, message: friendlyAuthMessage(error.message) };
    }

    await hydrateSession(data.session);
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

    const backend = getBackend();

    if (!backend) {
      return { ok: false, message: missingSupabaseMessage };
    }

    const { data, error } = await backend.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: cleanName },
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      return { ok: false, message: friendlyAuthMessage(error.message) };
    }

    setPendingRegistration({ email: normalizedEmail, name: cleanName });

    if (data.session) {
      await hydrateSession(data.session);
      setPendingRegistration(null);
      return { ok: true, requiresVerification: false };
    }

    return { ok: true, requiresVerification: true };
  };

  const verifyEmail = async (code: string): Promise<AuthResult> => {
    if (!pendingRegistration) {
      return { ok: false, message: "Start registration before verifying an email." };
    }

    const codeValidation = validateOneTimeCode(code);

    if (!codeValidation.ok) {
      return codeValidation;
    }

    const backend = getBackend();

    if (!backend) {
      return { ok: false, message: missingSupabaseMessage };
    }

    const { data, error } = await backend.auth.verifyOtp({
      email: pendingRegistration.email,
      token: code,
      type: "email",
    });

    if (error) {
      return { ok: false, message: friendlyAuthMessage(error.message) };
    }

    setPendingRegistration(null);
    await hydrateSession(data.session);
    return { ok: true };
  };

  const resendVerification = async (): Promise<AuthResult> => {
    if (!pendingRegistration) {
      return { ok: false, message: "Start registration before requesting another code." };
    }

    const backend = getBackend();

    if (!backend) {
      return { ok: false, message: missingSupabaseMessage };
    }

    const { error } = await backend.auth.resend({
      email: pendingRegistration.email,
      type: "signup",
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });

    return error
      ? { ok: false, message: friendlyAuthMessage(error.message) }
      : { ok: true, message: "A fresh verification code was sent." };
  };

  const signInWithProvider = async (
    provider: AuthProviderName,
    redirectPath = "/dashboard",
  ): Promise<AuthResult> => {
    const backend = getBackend();

    if (!backend) {
      return { ok: false, message: missingSupabaseMessage };
    }

    const providerId = OAUTH_PROVIDERS[provider];
    const availability = await getOAuthProviderAvailability(providerId);

    if (!availability.reachable) {
      return { ok: false, message: "The authentication service is offline. Start the local backend and try again." };
    }

    if (!availability.enabled) {
      return { ok: false, message: `${provider} sign-in is not configured yet.` };
    }

    const safePath = redirectPath.startsWith("/") && !redirectPath.startsWith("//")
      ? redirectPath
      : "/dashboard";
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", safePath);

    const { error } = await backend.auth.signInWithOAuth({
      provider: providerId,
      options: { redirectTo: callbackUrl.toString() },
    });

    if (error) {
      const normalized = error.message.toLowerCase();
      if (normalized.includes("provider is not enabled") || normalized.includes("unsupported provider")) {
        return { ok: false, message: `${provider} sign-in is not enabled for this environment yet.` };
      }
      return { ok: false, message: friendlyAuthMessage(error.message) };
    }

    return { ok: true };
  };

  const requestPasswordReset = async (email: string): Promise<AuthResult> => {
    const normalizedEmail = normalizeEmail(email);
    const validation = validateEmail(normalizedEmail);

    if (!validation.ok) {
      return validation;
    }

    const backend = getBackend();

    if (!backend) {
      return { ok: false, message: missingSupabaseMessage };
    }

    const { error } = await backend.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return error
      ? { ok: false, message: friendlyAuthMessage(error.message) }
      : { ok: true };
  };

  const updatePassword = async (password: string): Promise<AuthResult> => {
    const validation = validatePassword(password);

    if (!validation.ok) {
      return validation;
    }

    const backend = getBackend();

    if (!backend) {
      return { ok: false, message: missingSupabaseMessage };
    }

    const { error } = await backend.auth.updateUser({ password });

    if (error) {
      return { ok: false, message: friendlyAuthMessage(error.message) };
    }

    setIsPasswordRecovery(false);
    return { ok: true };
  };

  const signOut = async () => {
    const backend = getBackend();
    window.sessionStorage.removeItem(DEV_GUEST_SESSION_KEY);
    setUser(null);
    setPendingRegistration(null);
    setIsPasswordRecovery(false);

    if (backend) {
      await backend.auth.signOut();
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      canUseGuestAccess: GUEST_ACCESS_ENABLED,
      continueAsGuest,
      isAuthenticated: Boolean(user),
      isLoading,
      isPasswordRecovery,
      pendingRegistration,
      registerAccount,
      requestPasswordReset,
      resendVerification,
      signIn,
      signInWithProvider,
      signOut,
      updatePassword,
      user,
      verifyEmail,
    }),
    [isLoading, isPasswordRecovery, pendingRegistration, user],
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