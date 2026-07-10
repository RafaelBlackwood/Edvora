import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Edvora render failure", { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="dark flex h-screen items-center justify-center px-6"
          style={{ background: "#080d1a", color: "#e8eaf0" }}
        >
          <div
            className="max-w-md rounded-2xl p-6 text-center"
            style={{ background: "rgba(13,20,50,0.8)", border: "1px solid rgba(124,106,247,0.2)" }}
          >
            <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm" style={{ color: "#a8b4d0" }}>
              Refresh the page and try again. Your current demo session is stored only in this browser tab.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
