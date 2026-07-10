import type { ReactNode } from "react";
import { Check, GraduationCap } from "lucide-react";
import campusImage from "../../../assets/edvora-campus.jpg";


type AuthShellProps = {
  children: ReactNode;
};

function Brand() {
  return (
    <div className="auth-brand" aria-label="Edvora home">
      <span className="auth-brand-mark" aria-hidden="true">
        <GraduationCap size={21} strokeWidth={2} />
      </span>
      <span className="auth-brand-name">Edvora</span>
    </div>
  );
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-visual" aria-label="Edvora university application support">
        <img src={campusImage} alt="University campus with a green courtyard" />
        <div className="auth-visual-shade" aria-hidden="true" />

        <div className="auth-visual-content">
          <Brand />

          <div className="auth-story">
            <p className="auth-eyebrow">Your application, finally in one place</p>
            <h1>A clear path to the university that fits you.</h1>
            <p className="auth-story-copy">
              Find programs, organize every requirement, and move from shortlist to
              submission with confidence.
            </p>

            <ul className="auth-proof-list">
              <li>
                <Check size={16} aria-hidden="true" />
                Personalized university matches
              </li>
              <li>
                <Check size={16} aria-hidden="true" />
                Deadlines and documents kept on track
              </li>
              <li>
                <Check size={16} aria-hidden="true" />
                Guidance for every application step
              </li>
            </ul>
          </div>

          <p className="auth-visual-footer">Built for ambitious students, wherever home is.</p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          {children}
          <p className="auth-legal">
            By continuing, you agree to Edvora&apos;s <button type="button">Terms</button> and{" "}
            <button type="button">Privacy Policy</button>.
          </p>
        </div>
      </section>
    </main>
  );
}
