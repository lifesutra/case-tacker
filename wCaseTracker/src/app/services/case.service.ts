import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { Case, CaseStatus, CasePriority } from '../models/case.model';
import { ReminderService } from './reminder.service';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private casesSubject = new BehaviorSubject<Case[]>([]);
  public cases$ = this.casesSubject.asObservable();
  private reminderService?: ReminderService;

  constructor(
    private db: DatabaseService,
    private injector: Injector
  ) {
    this.loadCases();
  }

  private getReminderService(): ReminderService {
    if (!this.reminderService) {
      this.reminderService = this.injector.get(ReminderService);
    }
    return this.reminderService;
  }

  // Load all cases
  private async loadCases(): Promise<void> {
    const cases = await this.db.cases.toArray();
    this.casesSubject.next(cases);
  }

  // Get all cases
  getCases(): Observable<Case[]> {
    return this.cases$;
  }

  // Get case by ID
  getCaseById(id: number): Observable<Case | undefined> {
    return from(this.db.cases.get(id));
  }

  // Get cases by status
  getCasesByStatus(status: CaseStatus): Observable<Case[]> {
    return from(this.db.cases.where('status').equals(status).toArray());
  }

  // Get cases by priority
  getCasesByPriority(priority: CasePriority): Observable<Case[]> {
    return from(this.db.cases.where('priority').equals(priority).toArray());
  }

  // Search cases
  searchCases(searchTerm: string): Observable<Case[]> {
    return this.cases$.pipe(
      map(cases => cases.filter(c =>
        c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.complainant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.accused?.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }

  // Add new case
  async addCase(caseData: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const newCase: Case = {
      ...caseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const id = await this.db.cases.add(newCase);
    newCase.id = id;
    await this.loadCases();
    
    const reminderService = this.getReminderService();
    await reminderService.generateRemindersForCase(newCase);
    
    return id;
  }

  // Update case
  async updateCase(id: number, caseData: Partial<Case>): Promise<void> {
    await this.db.cases.update(id, {
      ...caseData,
      updatedAt: new Date()
    });
    await this.loadCases();
    
    const updatedCase = await this.db.cases.get(id);
    if (updatedCase) {
      const reminderService = this.getReminderService();
      await reminderService.generateRemindersForCase(updatedCase);
    }
  }

  // Delete case
  async deleteCase(id: number): Promise<void> {
    await this.db.cases.delete(id);
    // Also delete associated reminders
    await this.db.reminders.where('caseId').equals(id).delete();
    await this.loadCases();
  }

  // Get upcoming hearings
  async getUpcomingHearings(days: number = 7): Promise<Case[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const cases = await this.db.cases
      .where('nextHearingDate')
      .between(today, futureDate, true, true)
      .toArray();

    return cases;
  }

  getDaysRemaining(caseItem: Case): number {
    const caseDate = new Date(caseItem.caseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    caseDate.setHours(0, 0, 0, 0);
    
    const daysSinceCase = Math.floor((today.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = caseItem.caseType - daysSinceCase;
    
    return daysRemaining;
  }

  getCasesCloserToDate(thresholdDays: number = 5): Observable<Case[]> {
    return this.cases$.pipe(
      map(cases => cases.filter(c => {
        if (c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED) {
          return false;
        }
        const daysRemaining = this.getDaysRemaining(c);
        return daysRemaining >= 0 && daysRemaining <= thresholdDays;
      }))
    );
  }

  async getCaseStatistics(): Promise<{
    total: number;
    pending: number;
    closed: number;
    closerToDate: number;
  }> {
    const cases = await this.db.cases.toArray();
    const closerToDate = cases.filter(c => {
      if (c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED) {
        return false;
      }
      const daysRemaining = this.getDaysRemaining(c);
      return daysRemaining >= 0 && daysRemaining <= 5;
    }).length;

    return {
      total: cases.length,
      pending: cases.filter(c => c.status !== CaseStatus.CLOSED && c.status !== CaseStatus.ARCHIVED).length,
      closed: cases.filter(c => c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED).length,
      closerToDate
    };
  }
}
