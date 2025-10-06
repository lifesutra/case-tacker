export interface Reminder {
  id?: number;
  caseId?: number;
  title: string;
  description?: string;
  dueDate: Date;
  reminderTime: Date;
  isCompleted: boolean;
  priority: ReminderPriority;
  type: ReminderType;
  notificationSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum ReminderPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum ReminderType {
  COURT_HEARING = 'Court Hearing',
  FOLLOW_UP = 'Follow Up',
  DOCUMENT_SUBMISSION = 'Document Submission',
  INVESTIGATION = 'Investigation',
  MEETING = 'Meeting',
  OTHER = 'Other'
}
