import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  Calculator,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { sanitizeUserText } from "../lib/security";
import { useAppData } from "../providers/AppDataProvider";
import { useAuth } from "../providers/AuthProvider";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Search, label: "Search Universities", path: "/search" },
  { icon: Heart, label: "Wishlist", path: "/wishlist" },
  { icon: FileText, label: "Applications", path: "/applications" },
  { icon: BookOpen, label: "Documents", path: "/documents" },
  { icon: Award, label: "Scholarships", path: "/scholarships" },
  { icon: Calculator, label: "Acceptance Calculator", path: "/calculator" },
  { icon: Bot, label: "AI Assistant", path: "/assistant" },
  { icon: DollarSign, label: "Budget Simulator", path: "/budget" },
  { icon: Globe, label: "Destination Guide", path: "/destinations" },
  { icon: GraduationCap, label: "Exam Prep", path: "/exams" },
  { icon: Users, label: "Consultations", path: "/consultations" },
  { icon: TrendingUp, label: "Community", path: "/community" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Shield, label: "Admin Panel", path: "/admin", adminOnly: true },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { userProfile } = useAppData();

  const displayUser = {
    avatar: user?.avatar ?? userProfile.avatar,
    name: user?.name ?? userProfile.name,
    profileCompletion: user?.profileCompletion ?? userProfile.profileCompletion,
  };
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");
  const isActive = (path: string) => location.pathname === path;

  const submitGlobalSearch = () => {
    const cleanQuery = sanitizeUserText(globalQuery, 80);

    if (cleanQuery) {
      navigate(`/search?q=${encodeURIComponent(cleanQuery)}`);
    } else {
      navigate("/search");
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell flex h-screen overflow-hidden" style={{ background: "#080d1a" }}>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          app-sidebar fixed lg:relative z-50 flex flex-col h-full transition-all duration-300 ease-in-out
          ${collapsed ? "w-[72px]" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "linear-gradient(180deg, #060b18 0%, #0a0f1e 100%)",
          borderRight: "1px solid rgba(124, 106, 247, 0.12)",
        }}
      >
        <div className="flex items-center gap-3 px-4 py-5 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-white font-semibold text-lg leading-none" style={{ fontFamily: "var(--font-display)" }}>
                Edvora
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>
                Your path to global universities
              </div>
            </div>
          )}
        </div>

        <nav className="app-sidebar-nav flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-none">
          {visibleNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={"app-nav-item " + (active ? "is-active " : "") + "w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 group relative"}
                style={{
                  color: active ? "#a89bf5" : "#6b7a9e",
                }}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: "#7c6af7" }}
                  />
                )}
                <item.icon
                  size={18}
                  className="shrink-0 transition-colors"
                  style={{ color: active ? "#a89bf5" : "#6b7a9e" }}
                />
                {!collapsed && (
                  <span className="text-sm font-medium truncate" style={{ color: active ? "#c4cde8" : "#6b7a9e" }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 px-2 py-3 space-y-2" style={{ borderTop: "1px solid rgba(124, 106, 247, 0.1)" }}>
          {!collapsed && (
            <div className="app-profile-card flex items-center gap-3 px-3 py-2" style={{ background: "rgba(124, 106, 247, 0.08)" }}>
              <img src={displayUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{displayUser.name}</div>
                <div className="text-xs" style={{ color: "#6b7a9e" }}>{displayUser.profileCompletion}% complete</div>
              </div>
              <button onClick={handleSignOut} className="app-icon-button p-1" aria-label="Sign out" title="Sign out">
                <LogOut size={14} style={{ color: "#6b7a9e" }} />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="app-icon-button hidden lg:flex w-full items-center justify-center p-2"
            style={{ color: "#6b7a9e" }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="app-topbar shrink-0 flex items-center gap-4 px-4 lg:px-6 py-3"
          style={{
            background: "rgba(8, 13, 26, 0.8)",
            borderBottom: "1px solid rgba(124, 106, 247, 0.1)",
            backdropFilter: "blur(12px)",
          }}
        >
          <button
            className="app-icon-button lg:hidden p-2"
            onClick={() => setMobileOpen(true)}
            style={{ color: "#a8b4d0" }}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b7a9e" }} />
              <input
                type="text"
                value={globalQuery}
                maxLength={80}
                placeholder="Search programs, countries, scholarships..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
                style={{
                  background: "rgba(13, 22, 53, 0.6)",
                  border: "1px solid rgba(124, 106, 247, 0.15)",
                  color: "#e8eaf0",
                }}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onFocus={(e) => { e.target.style.borderColor = "rgba(124,106,247,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(124,106,247,0.15)"; }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitGlobalSearch();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#7c6af7" }} />
              <span className="text-xs font-medium" style={{ color: "#a89bf5" }}>{displayUser.profileCompletion}% Profile</span>
            </div>

            <button className="app-icon-button relative p-2" style={{ color: "#a8b4d0" }} aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            </button>

            <button
              onClick={() => navigate("/applications")}
              className="app-primary-action hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              <Sparkles size={14} />
              Start Application
            </button>

            <button
              type="button"
              className="app-avatar-button"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
              title="Open profile"
            >
              <img src={displayUser.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <nav
        className="app-bottom-nav fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around py-2 px-2"
        style={{
          background: "rgba(6, 11, 24, 0.95)",
          borderTop: "1px solid rgba(124, 106, 247, 0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        {[
          { icon: LayoutDashboard, path: "/dashboard", label: "Home" },
          { icon: Search, path: "/search", label: "Search" },
          { icon: Heart, path: "/wishlist", label: "Saved" },
          { icon: FileText, path: "/applications", label: "Apply" },
          { icon: Bot, path: "/assistant", label: "AI Bot" },
        ].map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={"app-bottom-item " + (active ? "is-active" : "") + " flex flex-col items-center gap-1 px-3 py-1.5"}
              style={{ color: active ? "#a89bf5" : "#6b7a9e" }}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="app-bottom-item flex flex-col items-center gap-1 px-3 py-1.5"
          style={{ color: "#6b7a9e" }}
        >
          <Menu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  );
}
