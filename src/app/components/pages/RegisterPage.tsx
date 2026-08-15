import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { AuthShell } from "../auth/AuthShell";
import { useAuth, type AuthProviderName } from "../../providers/AuthProvider";

const providers: Array<{
  mark: string;
  name: AuthProviderName;
}> = [
  { mark: "G", name: "Google" },
  { mark: "A", name: "Apple" },
  { mark: "f", name: "Facebook" },
  { mark: "X", name: "X" },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    canUseGuestAccess,
    continueAsGuest,
    registerAccount,
    resendVerification,
    signInWithProvider,
    verifyEmail,
  } = useAuth();
  const [step, setStep] = useState<"register" | "verify">("register");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const passwordRules = [
    { label: "10+ characters", met: password.length >= 10 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
  ];

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await registerAccount({ email, name, password });
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to create account.");
      return;
    }

    if (result.requiresVerification) {
      setStep("verify");
      return;
    }

    navigate("/onboarding", { replace: true });
  };

  const handleVerify = async (verificationCode = code.join("")) => {
    setError("");
    setLoading(true);

    const result = await verifyEmail(verificationCode);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to verify your email.");
      return;
    }

    navigate("/onboarding", { replace: true });
  };

  const handleProviderRegister = async (provider: AuthProviderName) => {
    setError("");
    setLoading(true);
    const result = await signInWithProvider(provider, "/onboarding");
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? `Unable to continue with ${provider}.`);
    }
  };

  const handleGuestAccess = () => {
    continueAsGuest();
    navigate("/dashboard", { replace: true });
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = digit;
    setCode(nextCode);
    setError("");

    if (digit && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }

    if (nextCode.every(Boolean)) {
      void handleVerify(nextCode.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleCodePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);

    if (!digits) {
      return;
    }

    const nextCode = Array.from({ length: 6 }, (_, index) => digits[index] ?? "");
    setCode(nextCode);
    setError("");

    document.getElementById(`code-${Math.min(digits.length, 5)}`)?.focus();

    if (digits.length === 6) {
      void handleVerify(digits);
    }
  };

  const resendCode = async () => {
    setCode(["", "", "", "", "", ""]);
    setError("");
    setResendMessage("");
    const result = await resendVerification();

    if (!result.ok) {
      setError(result.message ?? "Unable to resend the code.");
      return;
    }

    setResendMessage(result.message ?? "A fresh code was sent to your email.");
    document.getElementById("code-0")?.focus();
  };

  return (
    <AuthShell>
      {step === "register" ? (
        <>
          <nav className="auth-tabs" aria-label="Account access">
            <button type="button" onClick={() => navigate("/")}>
              Sign in
            </button>
            <button type="button" aria-current="page">
              Create account
            </button>
          </nav>

          <header className="auth-header">
            <h2>Start your journey</h2>
            <p>Create your account and turn a complicated process into a clear plan.</p>
          </header>

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-field-group">
              <label htmlFor="register-name">Full name</label>
              <div className="auth-input-wrap">
                <UserRound className="auth-input-icon" size={17} aria-hidden="true" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value.slice(0, 80));
                    setError("");
                  }}
                  placeholder="Alex Rivera"
                  required
                  autoComplete="name"
                  maxLength={80}
                />
              </div>
            </div>

            <div className="auth-field-group">
              <label htmlFor="register-email">Email address</label>
              <div className="auth-input-wrap">
                <Mail className="auth-input-icon" size={17} aria-hidden="true" />
                <input
                  id="register-email"
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
              <label htmlFor="register-password">Create a password</label>
              <div className="auth-input-wrap">
                <LockKeyhole className="auth-input-icon" size={17} aria-hidden="true" />
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value.slice(0, 128));
                    setError("");
                  }}
                  placeholder="Choose a secure password"
                  required
                  minLength={10}
                  maxLength={128}
                  autoComplete="new-password"
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

              <ul className="auth-password-rules" aria-label="Password requirements">
                {passwordRules.map((rule) => (
                  <li key={rule.label} data-met={rule.met}>
                    <Check size={12} aria-hidden="true" />
                    {rule.label}
                  </li>
                ))}
              </ul>
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
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {providers.length > 0 && (
            <>
              <div className="auth-divider">or continue with</div>
              <div className="auth-social-grid">
                {providers.map(({ mark, name: providerName }) => (
                  <button
                    key={providerName}
                    type="button"
                    className="auth-social-button"
                    onClick={() => void handleProviderRegister(providerName)}
                    aria-label={`Continue with ${providerName}`}
                    title={`Continue with ${providerName}`}
                  >
                    <span className="auth-provider-mark" aria-hidden="true">{mark}</span>
                    <span className="auth-social-label">{providerName}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {canUseGuestAccess && (
            <button
              type="button"
              className="auth-secondary-button auth-guest-button"
              onClick={handleGuestAccess}
            >
              <UserRound size={17} aria-hidden="true" />
              Continue without account
            </button>
          )}
        </>
      ) : (
        <>
          <button
            type="button"
            className="auth-back-button"
            onClick={() => {
              setStep("register");
              setError("");
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Edit account details
          </button>

          <span className="auth-verify-mark" aria-hidden="true">
            <Mail size={22} />
          </span>
          <header className="auth-header">
            <h2>Verify your email</h2>
            <p>
              We sent a six-digit code to <strong>{email}</strong>. Enter it below to secure your
              new account.
            </p>
          </header>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleVerify();
            }}
          >
            <div className="auth-otp" onPaste={handleCodePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleCodeChange(index, event.target.value)}
                  onKeyDown={(event) => handleCodeKeyDown(index, event)}
                  aria-label={`Verification digit ${index + 1}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <p className="auth-code-note">
              Enter the code from your verification email. It expires after one hour.
            </p>

            {error && (
              <div className="auth-alert" role="alert" aria-live="polite">
                <CircleAlert size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="auth-primary-button"
              disabled={loading || code.some((digit) => !digit)}
              style={{ marginTop: error ? 18 : 0 }}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify email
                  <ArrowRight size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p className="auth-resend">
            Did not receive it?{" "}
            <button type="button" className="auth-inline-button" onClick={() => void resendCode()}>
              Resend code
            </button>
          </p>
          {resendMessage && (
            <p className="auth-resend-status" role="status">
              {resendMessage}
            </p>
          )}
        </>
      )}
    </AuthShell>
  );
}
