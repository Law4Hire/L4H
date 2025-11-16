// Common TypeScript interfaces for the cannlaw application

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attorney {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  barNumber?: string;
  licenseState?: string;
  bio?: string;
  photoUrl?: string;
  practiceAreas: string; // JSON string
  languages: string; // JSON string
  credentials: string; // JSON string
  yearsOfExperience?: number;
  defaultHourlyRate?: number;
  isManagingAttorney: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Case {
  id: string;
  clientId: number;
  assignedAttorneyId?: number;
  caseType: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  caseId: string;
  clientId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: number;
  uploadedAt: string;
  status: string;
}

export interface TimeEntry {
  id: number;
  caseId: string;
  attorneyId: number;
  description: string;
  hours: number;
  rate: number;
  entryDate: string;
  billable: boolean;
  createdAt: string;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'number';
  options?: string[];
  required: boolean;
  category: string;
}

export interface InterviewSession {
  sessionId: string;
  caseId: string;
  currentQuestionId: string;
  progress: number;
  responses: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
