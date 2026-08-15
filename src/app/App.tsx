import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { lazy, Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { RequireAuth, RequireRole } from "./components/RequireAuth";
import { LoginPage } from "./components/pages/LoginPage";
import { OAuthCallbackPage } from "./components/pages/OAuthCallbackPage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { ResetPasswordPage } from "./components/pages/ResetPasswordPage";
import { AppDataProvider } from "./providers/AppDataProvider";
import { AuthProvider } from "./providers/AuthProvider";

const AcceptanceCalculatorPage = lazy(async () => ({
  default: (await import("./components/pages/AcceptanceCalculatorPage")).AcceptanceCalculatorPage,
}));
const AdminPage = lazy(async () => ({
  default: (await import("./components/pages/AdminPage")).AdminPage,
}));
const ApplicationsPage = lazy(async () => ({
  default: (await import("./components/pages/ApplicationsPage")).ApplicationsPage,
}));
const AssistantBotPage = lazy(async () => ({
  default: (await import("./components/pages/AssistantBotPage")).AssistantBotPage,
}));
const BudgetSimulatorPage = lazy(async () => ({
  default: (await import("./components/pages/BudgetSimulatorPage")).BudgetSimulatorPage,
}));
const CommunityPage = lazy(async () => ({
  default: (await import("./components/pages/CommunityPage")).CommunityPage,
}));
const ConsultationsPage = lazy(async () => ({
  default: (await import("./components/pages/ConsultationsPage")).ConsultationsPage,
}));
const DashboardPage = lazy(async () => ({
  default: (await import("./components/pages/DashboardPage")).DashboardPage,
}));
const DestinationGuidePage = lazy(async () => ({
  default: (await import("./components/pages/DestinationGuidePage")).DestinationGuidePage,
}));
const DocumentsPage = lazy(async () => ({
  default: (await import("./components/pages/DocumentsPage")).DocumentsPage,
}));
const ExamPrepPage = lazy(async () => ({
  default: (await import("./components/pages/ExamPrepPage")).ExamPrepPage,
}));
const OnboardingPage = lazy(async () => ({
  default: (await import("./components/pages/OnboardingPage")).OnboardingPage,
}));
const ProfilePage = lazy(async () => ({
  default: (await import("./components/pages/ProfilePage")).ProfilePage,
}));
const ScholarshipsPage = lazy(async () => ({
  default: (await import("./components/pages/ScholarshipsPage")).ScholarshipsPage,
}));
const SearchPage = lazy(async () => ({
  default: (await import("./components/pages/SearchPage")).SearchPage,
}));
const UniversityDetailPage = lazy(async () => ({
  default: (await import("./components/pages/UniversityDetailPage")).UniversityDetailPage,
}));
const WishlistPage = lazy(async () => ({
  default: (await import("./components/pages/WishlistPage")).WishlistPage,
}));

function AppWithLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

function AdminWithLayout() {
  return (
    <RequireAuth>
      <RequireRole roles={["admin"]}>
        <Layout>
          <AdminPage />
        </Layout>
      </RequireRole>
    </RequireAuth>
  );
}

const routes = [
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/university/:id", element: <UniversityDetailPage /> },
  { path: "/wishlist", element: <WishlistPage /> },
  { path: "/applications", element: <ApplicationsPage /> },
  { path: "/documents", element: <DocumentsPage /> },
  { path: "/scholarships", element: <ScholarshipsPage /> },
  { path: "/calculator", element: <AcceptanceCalculatorPage /> },
  { path: "/assistant", element: <AssistantBotPage /> },
  { path: "/budget", element: <BudgetSimulatorPage /> },
  { path: "/destinations", element: <DestinationGuidePage /> },
  { path: "/exams", element: <ExamPrepPage /> },
  { path: "/consultations", element: <ConsultationsPage /> },
  { path: "/community", element: <CommunityPage /> },
  { path: "/profile", element: <ProfilePage /> },
];

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppDataProvider>
            <div className="dark" style={{ height: "100dvh", overflow: "hidden" }}>
              <Suspense
                fallback={
                  <main className="route-loading" aria-busy="true" aria-label="Loading page">
                    <span className="auth-spinner" aria-hidden="true" />
                  </main>
                }
              >
                <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/auth/callback" element={<OAuthCallbackPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/onboarding"
                  element={
                    <RequireAuth>
                      <OnboardingPage />
                    </RequireAuth>
                  }
                />

                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={<AppWithLayout>{route.element}</AppWithLayout>}
                  />
                ))}

                <Route path="/admin" element={<AdminWithLayout />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
