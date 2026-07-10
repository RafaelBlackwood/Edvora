import { useEffect, useState } from "react";
import AppleIcon from "@mui/icons-material/Apple";
import FacebookIcon from "@mui/icons-material/Facebook";
import GoogleIcon from "@mui/icons-material/Google";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { AuthShell } from "../auth/AuthShell";
import { normalizeEmail } from "../../lib/security";
import { useAuth } from "../../providers/AuthProvider";

type LoginView = "sign-in" | "forgot" | "reset-sent";
type Provider = "Google" | "Apple" | "Facebook";

const providers: Array<{
  icon: typeof GoogleIcon;
  name: Provider;
}> = [
  { icon: GoogleIcon, name: "Google" },
  { icon: AppleIcon, name: "Apple" },
  { icon: FacebookIcon, name: "Facebook" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, signIn, signInWithProvider } = useAuth();
  const [view, setView] = useState<LoginView>("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [from, isAuthenticated, navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn({ email: normalizeEmail(email), password });
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to sign in.");
      return;
    }

    navigate(from, { replace: true });
  };

  const handleProviderLogin = (provider: Provider) => {
    signInWithProvider(provider);
    navigate(from, { replace: true });
  };

  const useDemoAccount = () => {
    setEmail("alex.rivera@email.com");
    setPassword("EdvoraDemo1!");
    setError("");
  };

  const openForgotPassword = () => {
    setView("forgot");
    setError("");
  };

  const handleResetRequest = (event: React.FormEvent) => {
    event.preventDefault();
    setView("reset-sent");
  };

  const returnToSignIn = () => {
    setView("sign-in");
    setError("");
  };

  return (
    <AuthShell>
      {view === "sign-in" ? (
        <>
          <nav className="auth-tabs" aria-label="Account access">
            <button type="button" aria-current="page">
              Sign in
            </button>
            <button type="button" onClick={() => navigate("/register")}>
              Create account
            </button>
          </nav>

          <header className="auth-header">
            <h2>Welcome back</h2>
            <p>Pick up where you left off and keep your applications moving.</p>
          </header>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field-group">
              <label htmlFor="login-email">Email address</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={17} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value.slice(0, 254));
                    setError("");
                  }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  maxLength={254}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <div className="auth-field-row">
                <label htmlFor="login-password">Password</label>
                <button type="button" onClick={openForgotPassword}>
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrap">
                <LockKeyhole className="auth-input-icon" size={17} aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value.slice(0, 128));
                    setError("");
                  }}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-alert" role="alert" aria-live="polite">
                <CircleAlert size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="auth-primary-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>

          <div className="auth-social-grid">
            {providers.map(({ icon: ProviderIcon, name }) => (
              <button
                key={name}
                type="button"
                className="auth-social-button"
                onClick={() => handleProviderLogin(name)}
                aria-label={`Continue with ${name}`}
                title={`Continue with ${name}`}
              >
                <ProviderIcon aria-hidden="true" />
                <span className="auth-social-label">{name}</span>
              </button>
            ))}
          </div>

          <div className="auth-demo">
            <div className="auth-demo-copy">
              <strong>Exploring Edvora?</strong>
              <span>Use the ready-made student account.</span>
            </div>
            <button type="button" className="auth-demo-button" onClick={useDemoAccount}>
              Fill demo details
            </button>
          </div>
        </>
      ) : (
        <>
          <button type="button" className="auth-back-button" onClick={returnToSignIn}>
            <ArrowLeft size={16} aria-hidden="true" />
            Back to sign in
          </button>

          {view === "forgot" ? (
            <>
              <header className="auth-header">
                <h2>Reset your password</h2>
                <p>Enter your account email and we will send you a secure reset link.</p>
              </header>

              <form className="auth-form" onSubmit={handleResetRequest}>
                <div className="auth-field-group">
                  <label htmlFor="reset-email">Email address</label>
                  <div className="auth-input-wrap">
                    <Mail className="auth-input-icon" size={17} aria-hidden="true" />
                    <input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value.slice(0, 254))}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                      maxLength={254}
                      autoFocus
                    />
                  </div>
                </div>
                <button type="submit" className="auth-primary-button">
                  Send reset link
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <>
              <span className="auth-success-mark" aria-hidden="true">
                <CircleCheck size={23} />
              </span>
              <header className="auth-header">
                <h2>Check your inbox</h2>
                <p>
                  We sent a password reset link to <strong>{email}</strong>. It may take a minute
                  to arrive.
                </p>
              </header>
              <button type="button" className="auth-secondary-button" onClick={() => setView("forgot")}>
                Send another link
              </button>
            </>
          )}
        </>
      )}
    </AuthShell>
  );
}
