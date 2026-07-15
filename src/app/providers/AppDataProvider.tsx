import { createContext, useContext, useMemo, useState } from "react";
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
import {
  applicationStatuses,
  type ApplicationRecord,
  type ApplicationStatus,
  type ApplicationUpdate,
} from "../types/application";

type UniversityId = string;
type DocumentItem = (typeof initialDocuments)[number];
type ChatMessage = (typeof initialChatMessages)[number];
type UserProfile = typeof userProfile;

type NewApplicationInput = {
  intake: string;
  program: string;
  universityId: string;
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
  addDocument: (input: NewDocumentInput) => { ok: boolean; message?: string };
  applyToScholarship: (id: string) => void;
  clearChatMessages: () => void;
  clearCompareUniversities: () => void;
  createApplication: (input: NewApplicationInput) => { ok: boolean; id?: string; message?: string };
  deleteApplication: (id: string) => void;
  duplicateApplication: (id: string) => { ok: boolean; id?: string; message?: string };
  isScholarshipApplied: (id: string) => boolean;
  isScholarshipSaved: (id: string) => boolean;
  isUniversitySaved: (id: UniversityId) => boolean;
  removeDocument: (id: string) => void;
  replaceDocument: (id: string, input: NewDocumentInput) => { ok: boolean; message?: string };
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

function getInitialState() {
  const stored = readSessionJson<Partial<AppDataState> | null>(APP_DATA_STORAGE_KEY, null);

  if (!stored) {
    return defaultState;
  }

  const savedUniversityIds = stored.savedUniversityIds ?? defaultState.savedUniversityIds;
  const compareUniversityIds = (stored.compareUniversityIds ?? defaultState.compareUniversityIds)
    .filter((id) => savedUniversityIds.includes(id))
    .slice(0, 3);

  return {
    ...defaultState,
    ...stored,
    applications: (stored.applications ?? defaultState.applications).map((application) => normalizeApplication(application)),
    chatMessages: stored.chatMessages ?? defaultState.chatMessages,
    compareUniversityIds,
    documents: stored.documents ?? defaultState.documents,
    savedUniversityIds,
  };
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppDataState>(() => getInitialState());

  const commitState = (updater: (current: AppDataState) => AppDataState) => {
    setState((current) => {
      const next = updater(current);
      writeSessionJson(APP_DATA_STORAGE_KEY, next);
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
    commitState((current) => ({
      ...current,
      userProfile: {
        ...current.userProfile,
        ...updates,
        applicationGoal:
          typeof updates.applicationGoal === "string"
            ? sanitizeUserText(updates.applicationGoal, 240)
            : current.userProfile.applicationGoal,
        budget:
          typeof updates.budget === "string"
            ? sanitizeUserText(updates.budget, 80)
            : current.userProfile.budget,
        currentLevel:
          typeof updates.currentLevel === "string"
            ? sanitizeUserText(updates.currentLevel, 100)
            : current.userProfile.currentLevel,
        destinationCountries: updates.destinationCountries
          ? updates.destinationCountries
              .map((country) => sanitizeUserText(country, 60))
              .filter(Boolean)
          : current.userProfile.destinationCountries,
        email:
          typeof updates.email === "string"
            ? sanitizeUserText(updates.email, 160)
            : current.userProfile.email,
        fieldOfStudy:
          typeof updates.fieldOfStudy === "string"
            ? sanitizeUserText(updates.fieldOfStudy, 120)
            : current.userProfile.fieldOfStudy,
        intakeSeason:
          typeof updates.intakeSeason === "string"
            ? sanitizeUserText(updates.intakeSeason, 60)
            : current.userProfile.intakeSeason,
        name:
          typeof updates.name === "string"
            ? sanitizeUserText(updates.name, 100)
            : current.userProfile.name,
        nationality:
          typeof updates.nationality === "string"
            ? sanitizeUserText(updates.nationality, 80)
            : current.userProfile.nationality,
        targetDegree:
          typeof updates.targetDegree === "string"
            ? sanitizeUserText(updates.targetDegree, 60)
            : current.userProfile.targetDegree,
        workExperience:
          typeof updates.workExperience === "string"
            ? sanitizeUserText(updates.workExperience, 160)
            : current.userProfile.workExperience,
      },
    }));
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

  const createApplication = ({ intake, program, universityId }: NewApplicationInput) => {
    const university = universities.find((candidate) => candidate.id === universityId);

    if (!university) {
      return { ok: false, message: "Select a university before submitting." };
    }

    const cleanProgram = sanitizeUserText(program, 120);
    const cleanIntake = sanitizeUserText(intake, 40);

    if (!cleanProgram || !cleanIntake) {
      return { ok: false, message: "Select a program and intake." };
    }

    const today = new Date().toISOString();
    const tasks = defaultApplicationTasks(university.deadline).map((task, index) => ({
      ...task,
      completed: index < 3,
    }));
    const newApplication = normalizeApplication({
      applicant: emptyApplicant,
      applicationReference: null,
      deadline: university.deadline,
      documents: ["Transcript", "CV", "Motivation Letter", "IELTS Certificate"],
      education: emptyEducation,
      id: `a_${crypto.randomUUID()}`,
      intake: cleanIntake,
      lastUpdated: today,
      notes: `Created through Edvora for ${cleanIntake}.`,
      portalUrl: university.website,
      program: cleanProgram,
      progress: 0,
      status: "Draft",
      submittedDate: null,
      tasks,
      university: university.name,
      universityId: university.id,
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
  const addDocument = ({ category, file }: NewDocumentInput) => {
    if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
      return { ok: false, message: "Use PDF, Word, JPG, or PNG documents only." };
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return { ok: false, message: "Files must be 50MB or smaller." };
    }

    const cleanName = sanitizeUserText(file.name, 120);
    const cleanCategory = sanitizeUserText(category, 80) || "Other";
    const sizeInMb = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const newDocument: DocumentItem = {
      category: cleanCategory,
      expiry: null,
      id: `d_${crypto.randomUUID()}`,
      name: cleanName,
      size: sizeInMb,
      status: "Final",
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

  const replaceDocument = (id: string, { category, file }: NewDocumentInput) => {
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

    commitState((current) => ({
      ...current,
      documents: current.documents.map((document) =>
        document.id === id
          ? {
              ...document,
              category: cleanCategory,
              name: cleanName,
              size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
              status: "Final",
              uploadDate: new Date().toISOString().slice(0, 10),
              version: document.version + 1,
            }
          : document,
      ),
    }));

    return { ok: true };
  };

  const removeDocument = (id: string) => {
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
    [state],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
