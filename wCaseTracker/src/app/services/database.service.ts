import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Case } from '../models/case.model';
import { Reminder } from '../models/reminder.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService extends Dexie {
  cases!: Table<Case, number>;
  reminders!: Table<Reminder, number>;

  constructor() {
    super('CaseTrackerDB');

    this.version(1).stores({
      cases: '++id, caseNumber, title, status, priority, filingDate, nextHearingDate, createdAt',
      reminders: '++id, caseId, title, dueDate, reminderTime, isCompleted, priority, type, createdAt'
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
  }

  // Export data as JSON
  async exportData(): Promise<{ cases: Case[], reminders: Reminder[] }> {
    const cases = await this.cases.toArray();
    const reminders = await this.reminders.toArray();
    return { cases, reminders };
  }

  // Import data from JSON
  async importData(data: { cases: Case[], reminders: Reminder[] }): Promise<void> {
    await this.transaction('rw', this.cases, this.reminders, async () => {
      if (data.cases && data.cases.length > 0) {
        await this.cases.bulkAdd(data.cases);
      }
      if (data.reminders && data.reminders.length > 0) {
        await this.reminders.bulkAdd(data.reminders);
      }
    });
  }
}
