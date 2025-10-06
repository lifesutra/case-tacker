import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { Case, CaseStatus, CasePriority } from '../models/case.model';

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private casesSubject = new BehaviorSubject<Case[]>([]);
  public cases$ = this.casesSubject.asObservable();

  constructor(private db: DatabaseService) {
    this.loadCases();
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
    await this.loadCases();
    return id;
  }

  // Update case
  async updateCase(id: number, caseData: Partial<Case>): Promise<void> {
    await this.db.cases.update(id, {
      ...caseData,
      updatedAt: new Date()
    });
    await this.loadCases();
  }

  // Delete case
  async deleteCase(id: number): Promise<void> {
    await this.db.cases.delete(id);
    // Also delete associated reminders
    await this.db.reminders.where('caseId').equals(id).delete();
    await this.loadCases();
  }

  // Get case statistics
  async getCaseStatistics(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    closed: number;
    urgent: number;
  }> {
    const cases = await this.db.cases.toArray();
    return {
      total: cases.length,
      open: cases.filter(c => c.status === CaseStatus.OPEN).length,
      inProgress: cases.filter(c => c.status === CaseStatus.IN_PROGRESS || c.status === CaseStatus.UNDER_INVESTIGATION).length,
      closed: cases.filter(c => c.status === CaseStatus.CLOSED || c.status === CaseStatus.ARCHIVED).length,
      urgent: cases.filter(c => c.priority === CasePriority.URGENT).length
    };
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
}
