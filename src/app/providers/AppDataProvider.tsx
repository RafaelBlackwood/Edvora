import { createContext, useContext, useMemo, useState } from "react";
import {
  applications as initialApplications,
  chatMessages as initialChatMessages,
  documents as initialDocuments,
  scholarships,
  universities,
  userProfile,
} from "../data/mockData";
import { sanitizeUserText } from "../lib/security";
import { readSessionJson, writeSessionJson } from "../lib/storage";

type UniversityId = string;
type Application = (typeof initialApplications)[number];
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
  applications: Application[];
  chatMessages: ChatMessage[];
  compareUniversityIds: UniversityId[];
  documents: DocumentItem[];
  savedScholarshipIds: string[];
  savedUniversityIds: UniversityId[];
  universityNotes: Record<UniversityId, string>;
  userProfile: UserProfile;
};

type AppDataContextValue = AppDataState & {
  addChatMessage: (message: Omit<ChatMessage, "id">) => void;
  addDocument: (input: NewDocumentInput) => { ok: boolean; message?: string };
  clearCompareUniversities: () => void;
  createApplication: (input: NewApplicationInput) => { ok: boolean; message?: string };
  isScholarshipSaved: (id: string) => boolean;
  isUniversitySaved: (id: UniversityId) => boolean;
  setUniversityNote: (id: UniversityId, note: string) => void;
  toggleScholarshipSave: (id: string) => void;
  toggleUniversityCompare: (id: UniversityId) => void;
  toggleUniversitySave: (id: UniversityId) => void;
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

const defaultState: AppDataState = {
  applications: initialApplications,
  chatMessages: initialChatMessages,
  compareUniversityIds: ["2", "8"],
  documents: initialDocuments,
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
    applications: stored.applications ?? defaultState.applications,
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

    const newApplication: Application = {
      id: `a_${crypto.randomUUID()}`,
      deadline: university.deadline,
      documents: ["Transcript", "CV", "Motivation Letter", "IELTS Certificate"],
      notes: `Submitted through Edvora for ${cleanIntake}.`,
      program: cleanProgram,
      progress: 75,
      status: "Submitted",
      submittedDate: new Date().toISOString().slice(0, 10),
      university: university.name,
      universityId: university.id,
    };

    commitState((current) => ({
      ...current,
      applications: [newApplication, ...current.applications],
    }));

    return { ok: true };
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

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...state,
      addChatMessage,
      addDocument,
      clearCompareUniversities,
      createApplication,
      isScholarshipSaved: (id: string) => state.savedScholarshipIds.includes(id),
      isUniversitySaved: (id: UniversityId) => state.savedUniversityIds.includes(id),
      setUniversityNote,
      toggleScholarshipSave,
      toggleUniversityCompare,
      toggleUniversitySave,
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
