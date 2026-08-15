import { Navigate, useLocation } from "react-router";
import { useAuth, type AuthUser } from "../providers/AuthProvider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="route-loading" aria-busy="true" aria-label="Loading your account">
        <span className="auth-spinner" aria-hidden="true" />
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function RequireRole({ children, roles }: { children: React.ReactNode; roles: AuthUser["role"][] }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
