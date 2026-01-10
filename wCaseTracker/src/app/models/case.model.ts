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
  caseDate: Date;
  caseType: CaseType;
  investigationOfficeId?: number;
  investigationOfficeName?: string;
  investigationOfficePhone?: string;
  remarks?: string;
  investigationPeriod?: number;
  nextHearingDate?: Date;
  closedDate?: Date;
  notes?: string;
  // Communication tracking
  reminderAttemptCount?: number;
  callStatus?: CaseCallStatus;
  lastCallDate?: Date;
  lastWhatsAppDate?: Date;
  communicationFeedback?: string;
  lastContactedBy?: string;
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

export enum CaseType {
  DAYS_45 = 45,
  DAYS_60 = 60,
  DAYS_90 = 90
}

export enum CaseCallStatus {
  NOT_CALLED = 'Not Called',
  CALL_DONE = 'Call Done',
  CALLED_NO_RESPONSE = 'Called - No Response',
  BUSY = 'Busy',
  INVALID_NUMBER = 'Invalid Number',
  FOLLOW_UP_REQUIRED = 'Follow Up Required'
}
