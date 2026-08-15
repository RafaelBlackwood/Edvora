import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  applications as initialApplications,
  chatMessages as initialChatMessages,
  documents as initialDocuments,
  scholarships,
  universities,
  userProfile,
} from "../data/mockData";
import { getSafeExternalUrl, sanitizeUserText } from "../lib/security";
import { readSessionJson, writeSessionJson } from "../lib/storage";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { useAuth, type AuthUser } from "./AuthProvider";
import {
  applicationStatuses,
  type ApplicationRecord,
  type ApplicationStatus,
  type ApplicationUpdate,
} from "../types/application";

type UniversityId = string;
type DocumentItem = (typeof initialDocuments)[number] & { storagePath?: string | null };
type ChatMessage = (typeof initialChatMessages)[number];
type UserProfile = Omit<
  typeof userProfile,
  "act" | "gmat" | "gpa" | "gre" | "ielts" | "sat" | "toefl"
> & {
  act: number | null;
  gmat: number | null;
  gpa: number;
  gre: number | null;
  ielts: number;
  sat: number | null;
  toefl: number | null;
};

type NewApplicationInput = {
  deadline?: string;
  deadlineLabel?: string;
  documents?: string[];
  intake: string;
  portalUrl?: string;
  program: string;
  programSourceUrl?: string;
  programVerifiedAt?: string;
  universityId: string;
  universityName?: string;
};

type NewDocumentInput = {
  category: string;
  file: File;
};

type AppDataState = {
  applications: ApplicationRecord[];
  chatMessages: ChatMessage[];
  compareUniversityIds: UniversityId[];
  documents: DocumentItem[];
  scholarshipApplicationIds: string[];
  savedScholarshipIds: string[];
  savedUniversityIds: UniversityId[];
  universityNotes: Record<UniversityId, string>;
  userProfile: UserProfile;
};

type AppDataContextValue = AppDataState & {
  addChatMessage: (message: Omit<ChatMessage, "id">) => void;
  addDocument: (input: NewDocumentInput) => Promise<{ ok: boolean; message?: string }>;
  applyToScholarship: (id: string) => void;
  clearChatMessages: () => void;
  clearCompareUniversities: () => void;
  createApplication: (input: NewApplicationInput) => { ok: boolean; id?: string; message?: string };
  deleteApplication: (id: string) => void;
  duplicateApplication: (id: string) => { ok: boolean; id?: string; message?: string };
  isScholarshipApplied: (id: string) => boolean;
  isScholarshipSaved: (id: string) => boolean;
  isUniversitySaved: (id: UniversityId) => boolean;
  removeDocument: (id: string) => Promise<void>;
  replaceDocument: (id: string, input: NewDocumentInput) => Promise<{ ok: boolean; message?: string }>;
  setUniversityNote: (id: UniversityId, note: string) => void;
  toggleScholarshipSave: (id: string) => void;
  toggleUniversityCompare: (id: UniversityId) => void;
  toggleUniversitySave: (id: UniversityId) => void;
  updateApplication: (id: string, updates: ApplicationUpdate) => { ok: boolean; message?: string };
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  wishlistUniversities: typeof universities;
};

const APP_DATA_STORAGE_KEY = "edvora.app.data.v1";
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
]);
const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;

const emptyApplicant = {
  address: "",
  dateOfBirth: "",
  email: userProfile.email,
  firstName: userProfile.name.split(" ")[0] ?? "",
  lastName: userProfile.name.split(" ").slice(1).join(" "),
  nationality: userProfile.nationality,
  phone: "",
};

const emptyEducation = {
  degree: userProfile.currentLevel,
  fieldOfStudy: userProfile.fieldOfStudy,
  gpa: String(userProfile.gpa),
  gpaScale: "4.0",
  graduationYear: "",
  institution: "",
};

function defaultApplicationTasks(deadline: string) {
  return [
    { completed: true, dueDate: null, id: crypto.randomUUID(), title: "Confirm program and intake" },
    { completed: false, dueDate: deadline || null, id: crypto.randomUUID(), title: "Complete application form" },
    { completed: false, dueDate: deadline || null, id: crypto.randomUUID(), title: "Attach required documents" },
    { completed: false, dueDate: deadline || null, id: crypto.randomUUID(), title: "Review and submit" },
  ];
}

function calculateApplicationProgress(application: ApplicationRecord) {
  const applicantValues = Object.values(application.applicant);
  const educationValues = Object.values(application.education);
  const completedTasks = application.tasks.filter((task) => task.completed).length;

  return Math.min(
    100,
    Math.round(
      10 +
        (applicantValues.filter(Boolean).length / applicantValues.length) * 25 +
        (educationValues.filter(Boolean).length / educationValues.length) * 20 +
        Math.min(application.documents.length / 6, 1) * 20 +
        (application.tasks.length ? completedTasks / application.tasks.length : 0) * 20 +
        (application.status === "Draft" ? 0 : 5),
    ),
  );
}

function normalizeApplication(record: Partial<ApplicationRecord> & Record<string, unknown>): ApplicationRecord {
  const status = applicationStatuses.includes(record.status as ApplicationStatus)
    ? (record.status as ApplicationStatus)
    : "Draft";
  const deadline = typeof record.deadline === "string" ? record.deadline : "";

  return {
    applicant: { ...emptyApplicant, ...(record.applicant ?? {}) },
    applicationReference: typeof record.applicationReference === "string" ? record.applicationReference : null,
    deadline,
    deadlineLabel: typeof record.deadlineLabel === "string" ? record.deadlineLabel : "",
    documents: Array.isArray(record.documents)
      ? record.documents.filter((item): item is string => typeof item === "string")
      : [],
    education: { ...emptyEducation, ...(record.education ?? {}) },
    id: typeof record.id === "string" ? record.id : `a_${crypto.randomUUID()}`,
    intake: typeof record.intake === "string" ? record.intake : "Fall 2026",
    lastUpdated: typeof record.lastUpdated === "string" ? record.lastUpdated : new Date().toISOString(),
    notes: typeof record.notes === "string" ? record.notes : "",
    portalUrl: typeof record.portalUrl === "string" ? record.portalUrl : "",
    program: typeof record.program === "string" ? record.program : "",
    programSourceUrl: typeof record.programSourceUrl === "string" ? record.programSourceUrl : "",
    programVerifiedAt: typeof record.programVerifiedAt === "string" ? record.programVerifiedAt : "",
    progress: typeof record.progress === "number" ? record.progress : 0,
    status,
    submittedDate: typeof record.submittedDate === "string" ? record.submittedDate : null,
    tasks: Array.isArray(record.tasks) && record.tasks.length ? record.tasks : defaultApplicationTasks(deadline),
    university: typeof record.university === "string" ? record.university : "University",
    universityId: typeof record.universityId === "string" ? record.universityId : "",
  };
}

const defaultState: AppDataState = {
  applications: initialApplications.map((application) => normalizeApplication(application as unknown as Partial<ApplicationRecord> & Record<string, unknown>)),
  chatMessages: initialChatMessages,
  compareUniversityIds: ["2", "8"],
  documents: initialDocuments,
  scholarshipApplicationIds: [],
  savedScholarshipIds: scholarships.filter((scholarship) => scholarship.saved).map((scholarship) => scholarship.id),
  savedUniversityIds: ["2", "8"],
  universityNotes: {},
  userProfile,
};

function normalizeState(stored: Partial<AppDataState> | null, baseState = defaultState): AppDataState {
  if (!stored) {
    return baseState;
  }

  const savedUniversityIds = stored.savedUniversityIds ?? baseState.savedUniversityIds;
  const compareUniversityIds = (stored.compareUniversityIds ?? baseState.compareUniversityIds)
    .filter((id) => savedUniversityIds.includes(id))
    .slice(0, 3);

  return {
    ...baseState,
    ...stored,
    applications: (stored.applications ?? baseState.applications).map((application) =>
      normalizeApplication(application),
    ),
    chatMessages: stored.chatMessages ?? baseState.chatMessages,
    compareUniversityIds,
    documents: stored.documents ?? baseState.documents,
    savedUniversityIds,
  };
}

function getInitialState() {
  return normalizeState(readSessionJson<Partial<AppDataState> | null>(APP_DATA_STORAGE_KEY, null));
}

function getCloudDefaultState(authUser: AuthUser): AppDataState {
  return {
    ...defaultState,
    applications: [],
    chatMessages: [],
    compareUniversityIds: [],
    documents: [],
    scholarshipApplicationIds: [],
    savedScholarshipIds: [],
    savedUniversityIds: [],
    universityNotes: {},
    userProfile: {
      ...userProfile,
      applicationGoal: "",
      avatar: authUser.avatar,
      badges: ["Profile Started"],
      budget: "",
      currentLevel: "",
      destinationCountries: [],
      email: authUser.email,
      fieldOfStudy: "",
      gpa: 0,
      ielts: 0,
      intakeSeason: "",
      name: authUser.name,
      nationality: "",
      profileCompletion: authUser.profileCompletion,
      streakDays: 0,
      targetDegree: "",
      workExperience: "",
    },
  };
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authIsLoading, user } = useAuth();
  const [state, setState] = useState<AppDataState>(() => getInitialState());
  const [isLoading, setIsLoading] = useState(false);
  const [loadedCloudUserId, setLoadedCloudUserId] = useState<string | null>(null);
  const persistTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (authIsLoading) {
      return;
    }

    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }

    if (user?.isGuest) {
      setState(getInitialState());
      setLoadedCloudUserId(null);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setState(getInitialState());
      setLoadedCloudUserId(null);
      setIsLoading(false);
      return;
    }

    if (!user) {
      setState(defaultState);
      setLoadedCloudUserId(null);
      setIsLoading(false);
      return;
    }

    const backend = supabase;
    let active = true;
    const cloudDefault = getCloudDefaultState(user);
    setLoadedCloudUserId(null);
    setIsLoading(true);

    void supabase
      .from("workspace_state")
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          console.error("Unable to load workspace state", error);
          setState(cloudDefault);
          setLoadedCloudUserId(user.id);
          setIsLoading(false);
          return;
        }

        const stored = data?.state as Partial<AppDataState> | null | undefined;
        const next = normalizeState(stored ?? null, cloudDefault);
        setState(next);
        setLoadedCloudUserId(user.id);
        setIsLoading(false);

        if (!data) {
          const { error: createError } = await backend.from("workspace_state").upsert({
            state: next,
            user_id: user.id,
            version: 1,
          });

          if (createError) {
            console.error("Unable to initialize workspace state", createError);
          }
        }
      });

    return () => {
      active = false;
    };
  }, [authIsLoading, user]);

  useEffect(
    () => () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
    },
    [],
  );

  const commitState = (updater: (current: AppDataState) => AppDataState) => {
    setState((current) => {
      const next = updater(current);
      const backend = supabase;

      if (isSupabaseConfigured && backend && user && !user.isGuest) {
        if (persistTimerRef.current !== null) {
          window.clearTimeout(persistTimerRef.current);
        }

        const userId = user.id;
        persistTimerRef.current = window.setTimeout(() => {
          void backend
            .from("workspace_state")
            .upsert({ state: next, user_id: userId, version: 1 })
            .then(({ error }) => {
              if (error) {
                console.error("Unable to save workspace state", error);
              }
            });
        }, 350);
      } else {
        writeSessionJson(APP_DATA_STORAGE_KEY, next);
      }

      return next;
    });
  };

  const toggleUniversitySave = (id: UniversityId) => {
    commitState((current) => {
      const removing = current.savedUniversityIds.includes(id);

      return {
        ...current,
        compareUniversityIds: removing
          ? current.compareUniversityIds.filter((compareId) => compareId !== id)
          : current.compareUniversityIds,
        savedUniversityIds: removing
          ? current.savedUniversityIds.filter((savedId) => savedId !== id)
          : [...current.savedUniversityIds, id],
      };
    });
  };

  const toggleUniversityCompare = (id: UniversityId) => {
    commitState((current) => {
      const removing = current.compareUniversityIds.includes(id);
      const canAdd = current.compareUniversityIds.length < 3;

      if (!removing && !canAdd) {
        return current;
      }

      return {
        ...current,
        compareUniversityIds: removing
          ? current.compareUniversityIds.filter((compareId) => compareId !== id)
          : [...current.compareUniversityIds, id],
        savedUniversityIds:
          !removing && !current.savedUniversityIds.includes(id)
            ? [...current.savedUniversityIds, id]
            : current.savedUniversityIds,
      };
    });
  };

  const clearChatMessages = () => {
    commitState((current) => ({ ...current, chatMessages: [] }));
  };

  const clearCompareUniversities = () => {
    commitState((current) => ({ ...current, compareUniversityIds: [] }));
  };

  const toggleScholarshipSave = (id: string) => {
    commitState((current) => ({
      ...current,
      savedScholarshipIds: current.savedScholarshipIds.includes(id)
        ? current.savedScholarshipIds.filter((savedId) => savedId !== id)
        : [...current.savedScholarshipIds, id],
    }));
  };

  const applyToScholarship = (id: string) => {
    if (!scholarships.some((scholarship) => scholarship.id === id)) return;

    commitState((current) => ({
      ...current,
      scholarshipApplicationIds: current.scholarshipApplicationIds.includes(id)
        ? current.scholarshipApplicationIds
        : [...current.scholarshipApplicationIds, id],
      savedScholarshipIds: current.savedScholarshipIds.includes(id)
        ? current.savedScholarshipIds
        : [...current.savedScholarshipIds, id],
    }));
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    const sanitizeProfile = (current: UserProfile): UserProfile => ({
      ...current,
      ...updates,
      applicationGoal:
        typeof updates.applicationGoal === "string"
          ? sanitizeUserText(updates.applicationGoal, 240)
          : current.applicationGoal,
      budget:
        typeof updates.budget === "string"
          ? sanitizeUserText(updates.budget, 80)
          : current.budget,
      currentLevel:
        typeof updates.currentLevel === "string"
          ? sanitizeUserText(updates.currentLevel, 100)
          : current.currentLevel,
      destinationCountries: updates.destinationCountries
        ? updates.destinationCountries
            .map((country) => sanitizeUserText(country, 60))
            .filter(Boolean)
        : current.destinationCountries,
      email:
        typeof updates.email === "string"
          ? sanitizeUserText(updates.email, 160)
          : current.email,
      fieldOfStudy:
        typeof updates.fieldOfStudy === "string"
          ? sanitizeUserText(updates.fieldOfStudy, 120)
          : current.fieldOfStudy,
      intakeSeason:
        typeof updates.intakeSeason === "string"
          ? sanitizeUserText(updates.intakeSeason, 60)
          : current.intakeSeason,
      name:
        typeof updates.name === "string"
          ? sanitizeUserText(updates.name, 100)
          : current.name,
      nationality:
        typeof updates.nationality === "string"
          ? sanitizeUserText(updates.nationality, 80)
          : current.nationality,
      targetDegree:
        typeof updates.targetDegree === "string"
          ? sanitizeUserText(updates.targetDegree, 60)
          : current.targetDegree,
      workExperience:
        typeof updates.workExperience === "string"
          ? sanitizeUserText(updates.workExperience, 160)
          : current.workExperience,
    });
    const nextProfile = sanitizeProfile(state.userProfile);

    commitState((current) => ({
      ...current,
      userProfile: sanitizeProfile(current.userProfile),
    }));

    if (isSupabaseConfigured && supabase && user && !user.isGuest) {
      void supabase
        .from("profiles")
        .update({
          application_goal: nextProfile.applicationGoal || null,
          budget: nextProfile.budget || null,
          current_level: nextProfile.currentLevel || null,
          destination_countries: nextProfile.destinationCountries,
          display_name: nextProfile.name,
          field_of_study: nextProfile.fieldOfStudy || null,
          gmat: nextProfile.gmat,
          gpa: nextProfile.gpa || null,
          gre: nextProfile.gre,
          ielts: nextProfile.ielts || null,
          intake_season: nextProfile.intakeSeason || null,
          nationality: nextProfile.nationality || null,
          onboarding_completed: nextProfile.profileCompletion >= 100,
          target_degree: nextProfile.targetDegree || null,
          toefl: nextProfile.toefl,
          work_experience: nextProfile.workExperience || null,
        })
        .eq("id", user.id)
        .then(({ error }) => {
          if (error) {
            console.error("Unable to save profile", error);
          }
        });

      const authUpdates: { data?: { name: string }; email?: string } = {};

      if (updates.name) {
        authUpdates.data = { name: nextProfile.name };
      }

      if (updates.email && nextProfile.email !== user.email) {
        authUpdates.email = nextProfile.email;
      }

      if (authUpdates.data || authUpdates.email) {
        void supabase.auth.updateUser(authUpdates);
      }
    }
  };

  const setUniversityNote = (id: UniversityId, note: string) => {
    commitState((current) => ({
      ...current,
      universityNotes: {
        ...current.universityNotes,
        [id]: sanitizeUserText(note, 800),
      },
    }));
  };

  const addChatMessage = (message: Omit<ChatMessage, "id">) => {
    commitState((current) => ({
      ...current,
      chatMessages: [
        ...current.chatMessages,
        {
          ...message,
          content: sanitizeUserText(message.content, 1200),
          id: crypto.randomUUID(),
        },
      ],
    }));
  };

  const createApplication = ({
    deadline = "",
    deadlineLabel = "",
    documents: requestedDocuments,
    intake,
    portalUrl = "",
    program,
    programSourceUrl = "",
    programVerifiedAt = "",
    universityId,
    universityName: requestedUniversityName = "",
  }: NewApplicationInput) => {
    const university = universities.find((candidate) => candidate.id === universityId);
    const universityName = sanitizeUserText(
      requestedUniversityName || university?.name || "",
      180,
    );

    if (!universityName) {
      return { ok: false, message: "Select a university before submitting." };
    }

    const cleanProgram = sanitizeUserText(program, 240);
    const cleanIntake = sanitizeUserText(intake, 60);
    const cleanDeadline = /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : "";
    const cleanDeadlineLabel = sanitizeUserText(deadlineLabel, 240);
    const requestedPortal = portalUrl || university?.website || "";
    const safePortal = requestedPortal ? getSafeExternalUrl(requestedPortal) : "";
    const requestedSource = programSourceUrl || requestedPortal;
    const safeProgramSource = requestedSource ? getSafeExternalUrl(requestedSource) : "";

    if (!cleanProgram || !cleanIntake) {
      return { ok: false, message: "Select a program and intake." };
    }
    if ((requestedPortal && !safePortal) || (requestedSource && !safeProgramSource)) {
      return { ok: false, message: "Program links must use a valid HTTPS address." };
    }

    const documents = Array.from(
      new Set(
        (requestedDocuments?.length
          ? requestedDocuments
          : ["Application", "Academic transcript", "Program-specific supporting materials"]
        )
          .map((document) => sanitizeUserText(document, 160))
          .filter(Boolean),
      ),
    ).slice(0, 24);
    const today = new Date().toISOString();
    const tasks = defaultApplicationTasks(cleanDeadline).map((task) => ({
      ...task,
      completed: false,
    }));
    const verifiedAt = sanitizeUserText(programVerifiedAt, 20);
    const sourceNote = verifiedAt
      ? `Program catalog verified ${verifiedAt}. Confirm applicant-specific requirements on the official program page before submission.`
      : "Confirm applicant-specific requirements on the official program page before submission.";
    const newApplication = normalizeApplication({
      applicant: emptyApplicant,
      applicationReference: null,
      deadline: cleanDeadline,
      deadlineLabel: cleanDeadlineLabel,
      documents,
      education: emptyEducation,
      id: `a_${crypto.randomUUID()}`,
      intake: cleanIntake,
      lastUpdated: today,
      notes: `Created through Edvora for ${cleanIntake}. ${sourceNote}`,
      portalUrl: safePortal || "",
      program: cleanProgram,
      programSourceUrl: safeProgramSource || "",
      programVerifiedAt: verifiedAt,
      progress: 0,
      status: "Draft",
      submittedDate: null,
      tasks,
      university: universityName,
      universityId: sanitizeUserText(universityId, 100),
    });
    newApplication.progress = calculateApplicationProgress(newApplication);

    commitState((current) => ({
      ...current,
      applications: [newApplication, ...current.applications],
    }));

    return { ok: true, id: newApplication.id };
  };
  const updateApplication = (id: string, updates: ApplicationUpdate) => {
    const existing = state.applications.find((application) => application.id === id);

    if (!existing) {
      return { ok: false, message: "The application could not be found." };
    }

    const requestedPortal = updates.portalUrl === undefined
      ? existing.portalUrl
      : sanitizeUserText(updates.portalUrl, 500);
    const safePortal = requestedPortal ? getSafeExternalUrl(requestedPortal) : "";

    if (requestedPortal && !safePortal) {
      return { ok: false, message: "Portal links must use a valid HTTPS address." };
    }

    const nextStatus =
      updates.status && applicationStatuses.includes(updates.status)
        ? updates.status
        : existing.status;
    const nextApplication: ApplicationRecord = {
      ...existing,
      ...updates,
      applicant: {
        ...existing.applicant,
        ...Object.fromEntries(
          Object.entries(updates.applicant ?? {}).map(([key, value]) => [
            key,
            sanitizeUserText(String(value ?? ""), key === "address" ? 240 : 120),
          ]),
        ),
      },
      applicationReference:
        updates.applicationReference === undefined
          ? existing.applicationReference
          : sanitizeUserText(updates.applicationReference ?? "", 100) || null,
      deadline: updates.deadline === undefined ? existing.deadline : sanitizeUserText(updates.deadline, 20),
      documents:
        updates.documents === undefined
          ? existing.documents
          : updates.documents.map((document) => sanitizeUserText(document, 120)).filter(Boolean),
      education: {
        ...existing.education,
        ...Object.fromEntries(
          Object.entries(updates.education ?? {}).map(([key, value]) => [
            key,
            sanitizeUserText(String(value ?? ""), 140),
          ]),
        ),
      },
      intake: updates.intake === undefined ? existing.intake : sanitizeUserText(updates.intake, 60),
      lastUpdated: new Date().toISOString(),
      notes: updates.notes === undefined ? existing.notes : sanitizeUserText(updates.notes, 2000),
      portalUrl: safePortal || "",
      program: updates.program === undefined ? existing.program : sanitizeUserText(updates.program, 160),
      status: nextStatus,
      submittedDate:
        nextStatus === "Draft"
          ? null
          : updates.submittedDate ?? existing.submittedDate ?? new Date().toISOString().slice(0, 10),
      tasks:
        updates.tasks === undefined
          ? existing.tasks
          : updates.tasks.map((task) => ({
              completed: Boolean(task.completed),
              dueDate: task.dueDate ? sanitizeUserText(task.dueDate, 20) : null,
              id: sanitizeUserText(task.id, 100) || crypto.randomUUID(),
              title: sanitizeUserText(task.title, 160),
            })).filter((task) => task.title),
    };
    nextApplication.progress = calculateApplicationProgress(nextApplication);

    commitState((current) => ({
      ...current,
      applications: current.applications.map((application) =>
        application.id === id ? nextApplication : application,
      ),
    }));

    return { ok: true };
  };

  const deleteApplication = (id: string) => {
    commitState((current) => ({
      ...current,
      applications: current.applications.filter((application) => application.id !== id),
    }));
  };

  const duplicateApplication = (id: string) => {
    const existing = state.applications.find((application) => application.id === id);

    if (!existing) {
      return { ok: false, message: "The application could not be found." };
    }

    const copy = normalizeApplication({
      ...existing,
      applicationReference: null,
      id: `a_${crypto.randomUUID()}`,
      lastUpdated: new Date().toISOString(),
      notes: existing.notes ? `Copy of application. ${existing.notes}` : "Copy of application.",
      status: "Draft",
      submittedDate: null,
      tasks: existing.tasks.map((task) => ({
        ...task,
        completed: false,
        id: crypto.randomUUID(),
      })),
    });
    copy.progress = calculateApplicationProgress(copy);

    commitState((current) => ({
      ...current,
      applications: [copy, ...current.applications],
    }));

    return { ok: true, id: copy.id };
  };
  const addDocument = async ({ category, file }: NewDocumentInput) => {
    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      return { ok: false, message: "Use PDF, Word, JPG, or PNG documents only." };
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return { ok: false, message: "Files must be 50MB or smaller." };
    }

    const cleanName = sanitizeUserText(file.name, 120);
    const cleanCategory = sanitizeUserText(category, 80) || "Other";
    const documentId = crypto.randomUUID();
    const extension = cleanName.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 10);
    let storagePath: string | null = null;

    if (isSupabaseConfigured && !user?.isGuest) {
      if (!supabase || !user) {
        return { ok: false, message: "Sign in again before uploading a document." };
      }

      storagePath = `${user.id}/${documentId}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        return { ok: false, message: `Upload failed: ${uploadError.message}` };
      }

      const { error: recordError } = await supabase.from("documents").insert({
        category: cleanCategory,
        id: documentId,
        mime_type: file.type,
        name: cleanName,
        size_bytes: file.size,
        status: "Final",
        storage_path: storagePath,
        uploaded_at: new Date().toISOString(),
        user_id: user.id,
        version: 1,
      });

      if (recordError) {
        await supabase.storage.from("documents").remove([storagePath]);
        return { ok: false, message: `Upload could not be recorded: ${recordError.message}` };
      }
    }

    const newDocument: DocumentItem = {
      category: cleanCategory,
      expiry: null,
      id: documentId,
      name: cleanName,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "Final",
      storagePath,
      uploadDate: new Date().toISOString().slice(0, 10),
      usedIn: [],
      version: 1,
    };

    commitState((current) => ({
      ...current,
      documents: [newDocument, ...current.documents],
    }));

    return { ok: true };
  };

  const replaceDocument = async (id: string, { category, file }: NewDocumentInput) => {
    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      return { ok: false, message: "Use PDF, Word, JPG, or PNG documents only." };
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return { ok: false, message: "Files must be 50MB or smaller." };
    }

    const existingDocument = state.documents.find((document) => document.id === id);

    if (!existingDocument) {
      return { ok: false, message: "The document could not be found." };
    }

    const cleanName = sanitizeUserText(file.name, 120);
    const cleanCategory = sanitizeUserText(category, 80) || existingDocument.category;
    const nextVersion = existingDocument.version + 1;
    const extension = cleanName.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 10);
    let storagePath = existingDocument.storagePath ?? null;

    if (isSupabaseConfigured && !user?.isGuest) {
      if (!supabase || !user) {
        return { ok: false, message: "Sign in again before replacing a document." };
      }

      const nextStoragePath = `${user.id}/${id}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(nextStoragePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        return { ok: false, message: `Upload failed: ${uploadError.message}` };
      }

      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const { error: recordError } = await supabase
          .from("documents")
          .update({
            category: cleanCategory,
            mime_type: file.type,
            name: cleanName,
            size_bytes: file.size,
            status: "Final",
            storage_path: nextStoragePath,
            uploaded_at: new Date().toISOString(),
            version: nextVersion,
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (recordError) {
          await supabase.storage.from("documents").remove([nextStoragePath]);
          return { ok: false, message: `Upload could not be recorded: ${recordError.message}` };
        }
      }

      if (storagePath) {
        await supabase.storage.from("documents").remove([storagePath]);
      }

      storagePath = nextStoragePath;
    }

    commitState((current) => ({
      ...current,
      documents: current.documents.map((document) =>
        document.id === id
          ? {
              ...document,
              category: cleanCategory,
              name: cleanName,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
              status: "Final",
              storagePath,
              uploadDate: new Date().toISOString().slice(0, 10),
              version: nextVersion,
            }
          : document,
      ),
    }));

    return { ok: true };
  };

  const removeDocument = async (id: string) => {
    const existingDocument = state.documents.find((document) => document.id === id);

    if (isSupabaseConfigured && supabase && user && !user.isGuest && existingDocument) {
      if (existingDocument.storagePath) {
        const { error } = await supabase.storage
          .from("documents")
          .remove([existingDocument.storagePath]);

        if (error) {
          console.error("Unable to remove document object", error);
        }
      }

      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const { error } = await supabase
          .from("documents")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Unable to remove document record", error);
        }
      }
    }

    commitState((current) => ({
      ...current,
      documents: current.documents.filter((document) => document.id !== id),
    }));
  };

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...state,
      addChatMessage,
      addDocument,
      applyToScholarship,
      clearChatMessages,
      clearCompareUniversities,
      createApplication,
      deleteApplication,
      duplicateApplication,
      isScholarshipApplied: (id: string) => state.scholarshipApplicationIds.includes(id),
      isScholarshipSaved: (id: string) => state.savedScholarshipIds.includes(id),
      isUniversitySaved: (id: UniversityId) => state.savedUniversityIds.includes(id),
      removeDocument,
      replaceDocument,
      setUniversityNote,
      toggleScholarshipSave,
      toggleUniversityCompare,
      toggleUniversitySave,
      updateApplication,
      updateUserProfile,
      wishlistUniversities: universities.filter((university) => state.savedUniversityIds.includes(university.id)),
    }),
    [state, user],
  );

  const cloudWorkspaceIsLoading = Boolean(
    isSupabaseConfigured &&
      user &&
      !user.isGuest &&
      (isLoading || loadedCloudUserId !== user.id),
  );

  if (cloudWorkspaceIsLoading) {
    return (
      <main className="route-loading" aria-busy="true" aria-label="Loading your workspace">
        <span className="auth-spinner" aria-hidden="true" />
      </main>
    );
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
