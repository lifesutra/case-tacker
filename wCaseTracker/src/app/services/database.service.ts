import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Case } from '../models/case.model';
import { Reminder } from '../models/reminder.model';
import { InvestigationOffice } from '../models/investigation-office.model';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  cases!: Table<Case, number>;
  reminders!: Table<Reminder, number>;
  investigationOffices!: Table<InvestigationOffice, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('CaseTrackerDB');

    this.version(1).stores({
      cases: '++id, caseNumber, title, status, priority, filingDate, nextHearingDate, createdAt',
      reminders: '++id, caseId, title, dueDate, reminderTime, isCompleted, priority, type, createdAt'
    });

    this.version(2).stores({
      cases: '++id, caseNumber, title, status, priority, filingDate, nextHearingDate, createdAt',
      reminders: '++id, caseId, title, dueDate, reminderTime, isCompleted, priority, type, createdAt',
      investigationOffices: '++id, officeName, officerName, designation, timePeriod, caseNumber, caseDate, createdAt'
    });

    this.version(3).stores({
      cases: '++id, caseNumber, title, status, priority, filingDate, caseDate, caseType, investigationOfficeId, nextHearingDate, createdAt',
      reminders: '++id, caseId, title, dueDate, reminderTime, isCompleted, priority, type, createdAt',
      investigationOffices: '++id, officeName, officerName, designation, timePeriod, caseNumber, caseDate, createdAt',
      settings: '++id, createdAt'
    }).upgrade(async (tx) => {
      const cases = await tx.table('cases').toArray();
      for (const caseItem of cases) {
        const updatedCase: any = {
          ...caseItem,
          caseDate: caseItem.filingDate || new Date(),
          caseType: 60
        };
        await tx.table('cases').update(caseItem.id, updatedCase);
      }
    });
  }

  // Initialize database with indexes
  async initDatabase(): Promise<void> {
    try {
      await this.open();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  // Clear all data (useful for testing or reset)
  async clearAllData(): Promise<void> {
    await this.cases.clear();
    await this.reminders.clear();
    await this.investigationOffices.clear();
    await this.settings.clear();
  }

  // Export data as JSON
  async exportData(): Promise<{ cases: Case[], reminders: Reminder[], investigationOffices: InvestigationOffice[] }> {
    const cases = await this.cases.toArray();
    const reminders = await this.reminders.toArray();
    const investigationOffices = await this.investigationOffices.toArray();
    return { cases, reminders, investigationOffices };
  }

  // Import data from JSON
  async importData(data: { cases: Case[], reminders: Reminder[], investigationOffices?: InvestigationOffice[] }): Promise<void> {
    await this.transaction('rw', this.cases, this.reminders, this.investigationOffices, async () => {
      if (data.cases && data.cases.length > 0) {
        await this.cases.bulkAdd(data.cases);
      }
      if (data.reminders && data.reminders.length > 0) {
        await this.reminders.bulkAdd(data.reminders);
      }
      if (data.investigationOffices && data.investigationOffices.length > 0) {
        await this.investigationOffices.bulkAdd(data.investigationOffices);
      }
    });
  }
}
