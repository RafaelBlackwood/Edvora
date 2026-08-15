import { useState } from "react";
import { ArrowRight, CircleAlert, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router";
import { AuthShell } from "../auth/AuthShell";
import { useAuth } from "../../providers/AuthProvider";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? "Unable to update your password.");
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthShell>
      <header className="auth-header">
        <h2>Choose a new password</h2>
        <p>Use a strong password that you have not used for this account before.</p>
      </header>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-field-group">
          <label htmlFor="new-password">New password</label>
          <div className="auth-input-wrap">
            <LockKeyhole className="auth-input-icon" size={17} aria-hidden="true" />
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value.slice(0, 128));
                setError("");
              }}
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
        </div>

        <div className="auth-field-group">
          <label htmlFor="confirm-password">Confirm new password</label>
          <div className="auth-input-wrap">
            <LockKeyhole className="auth-input-icon" size={17} aria-hidden="true" />
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value.slice(0, 128));
                setError("");
              }}
              required
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
            />
          </div>
        </div>

        {error && (
          <div className="auth-alert" role="alert" aria-live="polite">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="auth-primary-button" disabled={loading}>
          {loading ? "Updating password..." : "Update password"}
          {!loading && <ArrowRight size={17} aria-hidden="true" />}
        </button>
      </form>
    </AuthShell>
  );
}