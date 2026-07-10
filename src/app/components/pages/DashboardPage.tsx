import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Award,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  Heart,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";
import campusImage from "../../../assets/edvora-campus.jpg";
import { scholarships, universities } from "../../data/mockData";
import { readSessionJson, writeSessionJson } from "../../lib/storage";
import { useAppData } from "../../providers/AppDataProvider";
import { useAuth } from "../../providers/AuthProvider";

type DashboardTask = {
  detail: string;
  done: boolean;
  id: string;
  label: string;
  path: string;
};

const DASHBOARD_TASKS_KEY = "edvora.dashboard.tasks.v1";
const applicationStages = ["Draft", "Submitted", "Reviewed", "Accepted"];

const initialTasks: DashboardTask[] = [
  {
    id: "transcript",
    label: "Upload official transcript",
    detail: "Required for 3 applications",
    done: true,
    path: "/documents",
  },
  {
    id: "ielts",
    label: "Add IELTS certificate",
    detail: "Your score meets 9 saved programs",
    done: true,
    path: "/documents",
  },
  {
    id: "motivation-letter",
    label: "Finish the UvA motivation letter",
    detail: "Draft is waiting for review",
    done: false,
    path: "/documents",
  },
  {
    id: "safe-options",
    label: "Add one more safe option",
    detail: "Balance your current shortlist",
    done: false,
    path: "/search",
  },
  {
    id: "scholarship",
    label: "Review your funding matches",
    detail: "Two strong matches close soon",
    done: false,
    path: "/scholarships",
  },
];

const deadlineBlueprints = [
  {
    daysLeft: 9,
    id: "letter",
    label: "Motivation letter review",
    meta: "University of Amsterdam",
    path: "/documents",
  },
  {
    daysLeft: 24,
    id: "scholarship",
    label: "DAAD scholarship package",
    meta: "Funding application",
    path: "/scholarships",
  },
  {
    daysLeft: 41,
    id: "application",
    label: "Submit safe-option application",
    meta: "Fall 2027 intake",
    path: "/applications",
  },
];

const countryCodes: Record<string, string> = {
  Canada: "CA",
  Germany: "DE",
  Netherlands: "NL",
  Poland: "PL",
  Sweden: "SE",
  "United Kingdom": "UK",
  "United States": "US",
  Italy: "IT",
};

function getInitialTasks() {
  const saved = readSessionJson<DashboardTask[] | null>(DASHBOARD_TASKS_KEY, null);

  if (!Array.isArray(saved)) {
    return initialTasks;
  }

  return initialTasks.map((task) => ({
    ...task,
    done: saved.find((savedTask) => savedTask.id === task.id)?.done ?? task.done,
  }));
}

function formatTuition(tuition: number, currency: string) {
  if (tuition === 0) {
    return "No tuition";
  }

  return new Intl.NumberFormat("en", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(tuition) + " / year";
}

function statusTone(status: string) {
  if (status === "Accepted") return "success";
  if (status === "Reviewed") return "review";
  if (status === "Submitted") return "info";
  if (status === "Rejected") return "danger";
  return "neutral";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    applications,
    documents,
    isScholarshipSaved,
    isUniversitySaved,
    savedScholarshipIds,
    savedUniversityIds,
    toggleScholarshipSave,
    toggleUniversitySave,
    userProfile,
  } = useAppData();
  const [taskList, setTaskList] = useState<DashboardTask[]>(getInitialTasks);

  const displayName = user?.name ?? userProfile.name;
  const firstName = displayName.split(" ")[0] || displayName;
  const profileCompletion = user?.profileCompletion ?? userProfile.profileCompletion;
  const completedTasks = taskList.filter((task) => task.done).length;
  const taskProgress = Math.round((completedTasks / taskList.length) * 100);
  const readyDocuments = documents.filter((document) => document.status === "Final").length;
  const activeApplications = applications.filter((application) => application.status !== "Rejected").length;
  const averageApplicationProgress = applications.length
    ? Math.round(applications.reduce((total, application) => total + application.progress, 0) / applications.length)
    : 0;

  const recommendations = useMemo(
    () => [...universities].sort((first, second) => second.matchScore - first.matchScore).slice(0, 3),
    [],
  );
  const featuredScholarship = useMemo(
    () => [...scholarships].sort((first, second) => second.matchScore - first.matchScore)[0],
    [],
  );
  const deadlines = useMemo(
    () =>
      deadlineBlueprints.map((item) => {
        const dueDate = new Date();
        dueDate.setHours(12, 0, 0, 0);
        dueDate.setDate(dueDate.getDate() + item.daysLeft);

        return {
          ...item,
          day: new Intl.DateTimeFormat("en", { day: "numeric" }).format(dueDate),
          month: new Intl.DateTimeFormat("en", { month: "short" }).format(dueDate),
        };
      }),
    [],
  );
  const today = useMemo(
    () => new Intl.DateTimeFormat("en", { day: "numeric", month: "long", weekday: "long" }).format(new Date()),
    [],
  );

  const toggleTask = (id: string) => {
    setTaskList((current) => {
      const next = current.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
      writeSessionJson(DASHBOARD_TASKS_KEY, next);
      return next;
    });
  };

  const stats = [
    {
      detail: "Across your shortlist",
      icon: Heart,
      label: "Saved universities",
      tone: "violet",
      value: String(savedUniversityIds.length).padStart(2, "0"),
    },
    {
      detail: averageApplicationProgress + "% average progress",
      icon: TrendingUp,
      label: "Active applications",
      tone: "cyan",
      value: String(activeApplications).padStart(2, "0"),
    },
    {
      detail: readyDocuments + " of " + documents.length + " ready",
      icon: FileCheck2,
      label: "Documents ready",
      tone: "green",
      value: readyDocuments + "/" + documents.length,
    },
    {
      detail: "Saved for review",
      icon: Award,
      label: "Funding matches",
      tone: "amber",
      value: String(savedScholarshipIds.length).padStart(2, "0"),
    },
  ];

  const profileAreas = [
    { complete: true, detail: "Identity and education", label: "Personal profile" },
    { complete: Boolean(userProfile.ielts), detail: "IELTS " + (userProfile.ielts ?? "missing"), label: "Test scores" },
    {
      complete: readyDocuments >= Math.ceil(documents.length * 0.7),
      detail: readyDocuments + " of " + documents.length + " marked final",
      label: "Core documents",
    },
    { complete: true, detail: "Degree, field, and countries", label: "Study preferences" },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-heading">
          <div>
            <div className="dashboard-heading-meta">
              <span>
                <CalendarDays size={14} aria-hidden="true" />
                {today}
              </span>
              <span className="dashboard-streak">{userProfile.streakDays}-day planning streak</span>
            </div>
            <h1>Welcome back, {firstName}</h1>
            <p>Your next application decisions are organized and ready.</p>
          </div>

          <div className="dashboard-heading-actions">
            <button
              type="button"
              className="dashboard-button dashboard-button-secondary"
              onClick={() => navigate("/search")}
            >
              <Search size={16} aria-hidden="true" />
              Explore matches
            </button>
            <button
              type="button"
              className="dashboard-button dashboard-button-primary"
              onClick={() => navigate("/applications")}
            >
              <FileText size={16} aria-hidden="true" />
              New application
            </button>
          </div>
        </header>

        <section className="dashboard-stats" aria-label="Application overview">
          {stats.map(({ detail, icon: Icon, label, tone, value }) => (
            <article className="dashboard-stat" key={label}>
              <span className={"dashboard-stat-icon dashboard-tone-" + tone}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <div>
                <div className="dashboard-stat-value">{value}</div>
                <h2>{label}</h2>
                <p>{detail}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="dashboard-main-grid">
          <div className="dashboard-primary-column">
            <section className="dashboard-panel dashboard-applications">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-kicker">Your pipeline</span>
                  <h2>Application tracker</h2>
                </div>
                <button type="button" className="dashboard-text-button" onClick={() => navigate("/applications")}>
                  View all
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="dashboard-pipeline-summary" aria-label="Application status totals">
                {applicationStages.map((stage) => (
                  <div key={stage}>
                    <strong>{applications.filter((application) => application.status === stage).length}</strong>
                    <span>{stage}</span>
                  </div>
                ))}
              </div>

              <div className="dashboard-application-list">
                {applications.slice(0, 3).map((application) => {
                  const stageIndex = Math.max(0, applicationStages.indexOf(application.status));

                  return (
                    <article className="dashboard-application-row" key={application.id}>
                      <div className="dashboard-application-main">
                        <span className="dashboard-school-mark" aria-hidden="true">
                          <GraduationCap size={18} />
                        </span>
                        <div className="dashboard-application-copy">
                          <div className="dashboard-application-title">
                            <h3>{application.university}</h3>
                            <span className={"dashboard-status dashboard-status-" + statusTone(application.status)}>
                              {application.status}
                            </span>
                          </div>
                          <p>{application.program}</p>
                        </div>
                      </div>

                      <div className="dashboard-stage-track" aria-label={application.status + " application status"}>
                        {applicationStages.map((stage, index) => (
                          <span
                            className={index <= stageIndex ? "is-complete" : ""}
                            key={stage}
                            title={stage}
                          />
                        ))}
                      </div>

                      <div className="dashboard-application-footer">
                        <span>{application.progress}% complete</span>
                        <button type="button" onClick={() => navigate("/applications")}>
                          Open application
                          <ChevronRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-advisor">
              <span className="dashboard-advisor-icon" aria-hidden="true">
                <Sparkles size={20} />
              </span>
              <div>
                <span className="dashboard-section-kicker">Edvora insight</span>
                <h2>Your strongest next move is adding one more safe option.</h2>
                <p>
                  Your GPA and IELTS profile already align with several English-taught computer
                  science programs in Germany and the Netherlands.
                </p>
              </div>
              <button type="button" onClick={() => navigate("/search")}>
                See matching programs
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            </section>

            <section className="dashboard-recommendations">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-kicker">Based on your profile</span>
                  <h2>Recommended universities</h2>
                </div>
                <button type="button" className="dashboard-text-button" onClick={() => navigate("/search")}>
                  Browse all
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>

              <div className="dashboard-university-grid">
                {recommendations.map((university) => {
                  const saved = isUniversitySaved(university.id);

                  return (
                    <article className="dashboard-university-card" key={university.id}>
                      <div className="dashboard-university-media">
                        <img
                          src={university.image}
                          alt={university.name + " campus"}
                          onError={(event) => {
                            if (event.currentTarget.src !== campusImage) {
                              event.currentTarget.src = campusImage;
                            }
                          }}
                        />
                        <span>{university.matchScore}% match</span>
                        <button
                          type="button"
                          className={saved ? "is-saved" : ""}
                          onClick={() => toggleUniversitySave(university.id)}
                          aria-label={(saved ? "Remove " : "Save ") + university.name}
                          title={saved ? "Remove from saved" : "Save university"}
                        >
                          <Heart size={16} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="dashboard-university-body">
                        <div className="dashboard-university-location">
                          <span>{countryCodes[university.country] ?? university.country.slice(0, 2).toUpperCase()}</span>
                          {university.city}, {university.country}
                        </div>
                        <h3>{university.name}</h3>
                        <div className="dashboard-university-facts">
                          <span>World rank #{university.ranking}</span>
                          <span>{formatTuition(university.tuition, university.currency)}</span>
                        </div>
                        <button type="button" onClick={() => navigate("/university/" + university.id)}>
                          View programs
                          <ArrowRight size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
            <section className="dashboard-tools" aria-label="Planning tools">
              <article>
                <span className="dashboard-tool-icon dashboard-tone-amber">
                  <CircleDollarSign size={19} aria-hidden="true" />
                </span>
                <div>
                  <span className="dashboard-section-kicker">Budget outlook</span>
                  <h2>EUR 28k-38k estimated per year</h2>
                  <p>Compare tuition and living costs across your three target countries.</p>
                </div>
                <button type="button" onClick={() => navigate("/budget")}>
                  Open budget
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </article>

              <article>
                <span className="dashboard-tool-icon dashboard-tone-cyan">
                  <Bot size={19} aria-hidden="true" />
                </span>
                <div>
                  <span className="dashboard-section-kicker">AI application coach</span>
                  <h2>Get unstuck on your next step</h2>
                  <p>Ask about program fit, requirements, documents, or application strategy.</p>
                </div>
                <button type="button" onClick={() => navigate("/assistant")}>
                  Ask Edvora
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </article>

              <article>
                <span className="dashboard-tool-icon dashboard-tone-green">
                  <Target size={19} aria-hidden="true" />
                </span>
                <div>
                  <span className="dashboard-section-kicker">Acceptance estimate</span>
                  <h2>Check your chances before applying</h2>
                  <p>Use your current GPA, test scores, and documents for a profile estimate.</p>
                </div>
                <button type="button" onClick={() => navigate("/calculator")}>
                  Run estimate
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </article>
            </section>

          </div>

          <aside className="dashboard-secondary-column">
            <section className="dashboard-panel dashboard-tasks">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-kicker">This week</span>
                  <h2>Next best actions</h2>
                </div>
                <span className="dashboard-count">{completedTasks}/{taskList.length}</span>
              </div>

              <div className="dashboard-progress-row">
                <div
                  className="dashboard-progress-track"
                  role="progressbar"
                  aria-label="Weekly task progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={taskProgress}
                >
                  <span style={{ width: taskProgress + "%" }} />
                </div>
                <strong>{taskProgress}%</strong>
              </div>

              <div className="dashboard-task-list">
                {taskList.map((task) => (
                  <div className={task.done ? "dashboard-task is-done" : "dashboard-task"} key={task.id}>
                    <button
                      type="button"
                      className="dashboard-task-check"
                      role="checkbox"
                      aria-checked={task.done}
                      aria-label={(task.done ? "Mark incomplete: " : "Mark complete: ") + task.label}
                      title={task.done ? "Mark incomplete" : "Mark complete"}
                      onClick={() => toggleTask(task.id)}
                    >
                      {task.done && <Check size={13} aria-hidden="true" />}
                    </button>
                    <div>
                      <h3>{task.label}</h3>
                      <p>{task.detail}</p>
                    </div>
                    <button
                      type="button"
                      className="dashboard-task-open"
                      onClick={() => navigate(task.path)}
                      aria-label={"Open task: " + task.label}
                      title="Open task"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-panel dashboard-profile">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-kicker">Application readiness</span>
                  <h2>Profile and documents</h2>
                </div>
                <strong className="dashboard-profile-score">{profileCompletion}%</strong>
              </div>

              <div
                className="dashboard-progress-track dashboard-profile-progress"
                role="progressbar"
                aria-label="Profile completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={profileCompletion}
              >
                <span style={{ width: profileCompletion + "%" }} />
              </div>

              <div className="dashboard-profile-list">
                {profileAreas.map((area) => (
                  <div key={area.label}>
                    <span className={area.complete ? "is-complete" : ""}>
                      {area.complete ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
                    </span>
                    <div>
                      <h3>{area.label}</h3>
                      <p>{area.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className="dashboard-panel-action" onClick={() => navigate("/profile")}>
                Improve profile
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </section>

            <section className="dashboard-panel dashboard-deadlines">
              <div className="dashboard-section-heading">
                <div>
                  <span className="dashboard-section-kicker">Coming up</span>
                  <h2>Deadlines</h2>
                </div>
                <CalendarDays size={18} aria-hidden="true" />
              </div>

              <div className="dashboard-deadline-list">
                {deadlines.map((deadline) => (
                  <button type="button" key={deadline.id} onClick={() => navigate(deadline.path)}>
                    <span className="dashboard-date-box">
                      <strong>{deadline.day}</strong>
                      <span>{deadline.month}</span>
                    </span>
                    <span className="dashboard-deadline-copy">
                      <strong>{deadline.label}</strong>
                      <span>{deadline.meta}</span>
                    </span>
                    <span className={deadline.daysLeft < 14 ? "is-urgent" : ""}>
                      {deadline.daysLeft}d
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {featuredScholarship && (
              <section className="dashboard-funding">
                <div className="dashboard-funding-top">
                  <span className="dashboard-funding-icon" aria-hidden="true">
                    <Award size={19} />
                  </span>
                  <span>{featuredScholarship.matchScore}% funding match</span>
                  <button
                    type="button"
                    className={isScholarshipSaved(featuredScholarship.id) ? "is-saved" : ""}
                    onClick={() => toggleScholarshipSave(featuredScholarship.id)}
                    aria-label={
                      (isScholarshipSaved(featuredScholarship.id) ? "Remove " : "Save ") +
                      featuredScholarship.name
                    }
                    title={isScholarshipSaved(featuredScholarship.id) ? "Remove from saved" : "Save scholarship"}
                  >
                    <Heart
                      size={16}
                      fill={isScholarshipSaved(featuredScholarship.id) ? "currentColor" : "none"}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                <span className="dashboard-section-kicker">Funding spotlight</span>
                <h2>{featuredScholarship.name}</h2>
                <p>Strong fit for your degree level, field, and destination preferences.</p>
                <button type="button" onClick={() => navigate("/scholarships")}>
                  Review scholarship
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </section>
            )}
          </aside>
        </div>


      </div>
    </div>
  );
}
