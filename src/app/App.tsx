import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import type { ReactNode } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { RequireAuth, RequireRole } from "./components/RequireAuth";
import { AcceptanceCalculatorPage } from "./components/pages/AcceptanceCalculatorPage";
import { AdminPage } from "./components/pages/AdminPage";
import { ApplicationsPage } from "./components/pages/ApplicationsPage";
import { AssistantBotPage } from "./components/pages/AssistantBotPage";
import { BudgetSimulatorPage } from "./components/pages/BudgetSimulatorPage";
import { CommunityPage } from "./components/pages/CommunityPage";
import { ConsultationsPage } from "./components/pages/ConsultationsPage";
import { DashboardPage } from "./components/pages/DashboardPage";
import { DestinationGuidePage } from "./components/pages/DestinationGuidePage";
import { DocumentsPage } from "./components/pages/DocumentsPage";
import { ExamPrepPage } from "./components/pages/ExamPrepPage";
import { LoginPage } from "./components/pages/LoginPage";
import { OnboardingPage } from "./components/pages/OnboardingPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { RegisterPage } from "./components/pages/RegisterPage";
import { ScholarshipsPage } from "./components/pages/ScholarshipsPage";
import { SearchPage } from "./components/pages/SearchPage";
import { UniversityDetailPage } from "./components/pages/UniversityDetailPage";
import { WishlistPage } from "./components/pages/WishlistPage";
import { AppDataProvider } from "./providers/AppDataProvider";
import { AuthProvider } from "./providers/AuthProvider";

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
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

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
            </div>
          </AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
