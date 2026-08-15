import { useEffect, useMemo } from "react";
import { CircleAlert } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { AuthShell } from "../auth/AuthShell";
import { useAuth } from "../../providers/AuthProvider";

function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const next = useMemo(() => safeReturnPath(searchParams.get("next")), [searchParams]);
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");

  useEffect(() => {
    if (!isLoading && isAuthenticated && !providerError) {
      navigate(next, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, next, providerError]);

  const failed = !isLoading && (!isAuthenticated || Boolean(providerError));

  return (
    <AuthShell>
      <section className="auth-callback" aria-live="polite">
        {failed ? (
          <>
            <span className="auth-verify-mark" aria-hidden="true"><CircleAlert size={22} /></span>
            <header className="auth-header">
              <h2>Sign-in could not be completed</h2>
              <p>{providerError ?? "The provider did not return a valid session. Please try again."}</p>
            </header>
            <button type="button" className="auth-primary-button" onClick={() => navigate("/", { replace: true })}>
              Return to sign in
            </button>
          </>
        ) : (
          <>
            <span className="auth-spinner" aria-hidden="true" />
            <header className="auth-header">
              <h2>Completing sign in</h2>
              <p>Securely connecting your account to Edvora.</p>
            </header>
          </>
        )}
      </section>
    </AuthShell>
  );
}
