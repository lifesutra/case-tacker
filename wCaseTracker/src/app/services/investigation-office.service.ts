import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { InvestigationOffice, TimePeriod } from '../models/investigation-office.model';

@Injectable({
  providedIn: 'root'
})
export class InvestigationOfficeService {
  private officesSubject = new BehaviorSubject<InvestigationOffice[]>([]);
  public offices$ = this.officesSubject.asObservable();

  constructor(private db: DatabaseService) {
    this.loadOffices();
  }

  private async loadOffices(): Promise<void> {
    const offices = await this.db.investigationOffices.toArray();
    this.officesSubject.next(offices);
  }

  getInvestigationOffices(): Observable<InvestigationOffice[]> {
    return this.offices$;
  }

  getInvestigationOfficeById(id: number): Observable<InvestigationOffice | undefined> {
    return from(this.db.investigationOffices.get(id));
  }

  getOfficesByOfficer(officerName: string): Observable<InvestigationOffice[]> {
    return from(this.db.investigationOffices.where('officerName').equals(officerName).toArray());
  }

  getOfficesByTimePeriod(period: TimePeriod): Observable<InvestigationOffice[]> {
    return from(this.db.investigationOffices.where('timePeriod').equals(period).toArray());
  }

  searchOffices(searchTerm: string): Observable<InvestigationOffice[]> {
    return this.offices$.pipe(
      map(offices => offices.filter(o =>
        o.officeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }

  async addInvestigationOffice(officeData: Omit<InvestigationOffice, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const newOffice: InvestigationOffice = {
      ...officeData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const id = await this.db.investigationOffices.add(newOffice);
    await this.loadOffices();
    return id;
  }

  async updateInvestigationOffice(id: number, officeData: Partial<InvestigationOffice>): Promise<void> {
    await this.db.investigationOffices.update(id, {
      ...officeData,
      updatedAt: new Date()
    });
    await this.loadOffices();
  }

  async deleteInvestigationOffice(id: number): Promise<void> {
    await this.db.investigationOffices.delete(id);
    await this.loadOffices();
  }

  async getStatistics(): Promise<{
    total: number;
    byTimePeriod: Record<string, number>;
    byOfficer: Record<string, number>;
  }> {
    const offices = await this.db.investigationOffices.toArray();
    const byTimePeriod: Record<string, number> = {};
    const byOfficer: Record<string, number> = {};

    offices.forEach(office => {
      byTimePeriod[office.timePeriod] = (byTimePeriod[office.timePeriod] || 0) + 1;
      byOfficer[office.officerName] = (byOfficer[office.officerName] || 0) + 1;
    });

    return {
      total: offices.length,
      byTimePeriod,
      byOfficer
    };
  }

  async bulkImportOffices(offices: Omit<InvestigationOffice, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
    const now = new Date();
    const officesToAdd: InvestigationOffice[] = offices.map(office => ({
      ...office,
      caseDate: office.caseDate instanceof Date ? office.caseDate : new Date(office.caseDate),
      createdAt: now,
      updatedAt: now
    }));
    
    const ids = await this.db.investigationOffices.bulkAdd(officesToAdd);
    await this.loadOffices();
    return Array.isArray(ids) ? ids.length : 1;
  }

  async clearAllOffices(): Promise<void> {
    await this.db.investigationOffices.clear();
    await this.loadOffices();
  }
}

