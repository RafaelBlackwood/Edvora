import { createClient, type Provider } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export const missingSupabaseMessage =
  "Edvora is not connected to its backend. Add the Supabase URL and publishable key to the environment.";

type ProviderSettings = {
  external?: Record<string, boolean | undefined>;
};

export type OAuthProviderAvailability =
  | { enabled: boolean; reachable: true }
  | { enabled: false; reachable: false };

export async function getOAuthProviderAvailability(
  provider: Provider,
): Promise<OAuthProviderAvailability> {
  if (!supabaseUrl || !supabasePublishableKey) {
    return { enabled: false, reachable: false };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabasePublishableKey },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Auth settings returned ${response.status}.`);
    }

    const settings = (await response.json()) as ProviderSettings;
    return {
      enabled: settings.external?.[provider] === true,
      reachable: true,
    };
  } catch {
    return { enabled: false, reachable: false };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
