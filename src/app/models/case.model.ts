export interface Case {
  id?: number;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  category: string;
  location: string;
  complainant?: string;
  accused?: string;
  filingDate: Date;
  nextHearingDate?: Date;
  closedDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CaseStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  UNDER_INVESTIGATION = 'Under Investigation',
  PENDING_COURT = 'Pending Court',
  CLOSED = 'Closed',
  ARCHIVED = 'Archived'
}

export enum CasePriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent'
}
