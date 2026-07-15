export const applicationStatuses = ["Draft", "Submitted", "Reviewed", "Accepted", "Rejected"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type ApplicationTask = {
  completed: boolean;
  dueDate: string | null;
  id: string;
  title: string;
};

export type ApplicantDetails = {
  address: string;
  dateOfBirth: string;
  email: string;
  firstName: string;
  lastName: string;
  nationality: string;
  phone: string;
};

export type EducationDetails = {
  degree: string;
  fieldOfStudy: string;
  gpa: string;
  gpaScale: string;
  graduationYear: string;
  institution: string;
};

export type ApplicationRecord = {
  applicant: ApplicantDetails;
  applicationReference: string | null;
  deadline: string;
  documents: string[];
  education: EducationDetails;
  id: string;
  intake: string;
  lastUpdated: string;
  notes: string;
  portalUrl: string;
  program: string;
  progress: number;
  status: ApplicationStatus;
  submittedDate: string | null;
  tasks: ApplicationTask[];
  university: string;
  universityId: string;
};

export type ApplicationUpdate = Partial<
  Pick<
    ApplicationRecord,
    | "applicationReference"
    | "deadline"
    | "documents"
    | "intake"
    | "notes"
    | "portalUrl"
    | "program"
    | "status"
    | "submittedDate"
    | "tasks"
  >
> & {
  applicant?: Partial<ApplicantDetails>;
  education?: Partial<EducationDetails>;
};
