import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CaseService } from '../../services/case.service';
import { DatabaseService } from '../../services/database.service';
import { DivisionStats, SeverityStats } from '../../models/case.model';

@Component({
  selector: 'app-station-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './station-dashboard.html',
  styleUrl: './station-dashboard.scss'
})
export class StationDashboard implements OnInit {
  divisionStats: DivisionStats | null = null;
  loading: boolean = true;
  expandedStations: Set<string> = new Set();
  divisionExpanded: boolean = false;

  constructor(
    private caseService: CaseService,
    private databaseService: DatabaseService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    await this.loadDivisionData();
  }

  async loadDivisionData() {
    this.loading = true;
    this.divisionStats = await this.caseService.getDivisionStatistics();
    this.loading = false;
  }

  async refreshData() {
    await this.loadDivisionData();
    this.messageService.add({
      severity: 'success',
      summary: 'यश',
      detail: 'डेटा रिफ्रेश झाला'
    });
  }

  clearDatabaseAndRefresh() {
    this.confirmationService.confirm({
      message: 'तुम्हाला खात्री आहे की तुम्ही सर्व केसेस आणि डेटा हटवू इच्छिता? हे पूर्ववत करता येणार नाही.',
      header: 'डेटाबेस क्लीअर करा',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'होय, हटवा',
      rejectLabel: 'नाही',
      accept: async () => {
        try {
          await this.databaseService.cases.clear();
          await this.databaseService.reminders.clear();
          await this.databaseService.investigationOffices.clear();
          this.divisionExpanded = false;
          this.expandedStations.clear();
          await this.loadDivisionData();
          this.messageService.add({
            severity: 'success',
            summary: 'यश',
            detail: 'डेटाबेस यशस्वीरित्या क्लीअर झाला'
          });
        } catch (error) {
          this.messageService.add({
            severity: 'error',
            summary: 'त्रुटी',
            detail: 'डेटाबेस क्लीअर करताना त्रुटी आली'
          });
        }
      }
    });
  }

  toggleDivision() {
    this.divisionExpanded = !this.divisionExpanded;
  }

  toggleStation(stationName: string) {
    if (this.expandedStations.has(stationName)) {
      this.expandedStations.delete(stationName);
    } else {
      this.expandedStations.add(stationName);
    }
  }

  isStationExpanded(stationName: string): boolean {
    return this.expandedStations.has(stationName);
  }

  expandAll() {
    this.divisionExpanded = true;
    this.divisionStats?.stations.forEach(s =>
      this.expandedStations.add(s.stationName)
    );
  }

  collapseAll() {
    this.divisionExpanded = false;
    this.expandedStations.clear();
  }

  navigateToStationCases(stationName: string, caseType?: number, severity?: string) {
    const queryParams: Record<string, string | number> = { station: stationName };
    if (caseType) queryParams['caseType'] = caseType;
    if (severity) queryParams['severity'] = severity;
    this.router.navigate(['/cases'], { queryParams });
  }

  navigateToDivisionCases(caseType?: number, severity?: string) {
    const queryParams: Record<string, string | number> = {};
    if (caseType) queryParams['caseType'] = caseType;
    if (severity) queryParams['severity'] = severity;
    this.router.navigate(['/cases'], { queryParams });
  }

  getTotalSeverityCases(stats: SeverityStats): number {
    return stats.days60.critical + stats.days60.warning + stats.days60.caution + stats.days60.overdue +
           stats.days90.critical + stats.days90.warning + stats.days90.caution + stats.days90.overdue +
           stats.days45.total;
  }

  getCriticalCount(stats: SeverityStats): number {
    return stats.days60.critical + stats.days90.critical;
  }

  getOverdueCount(stats: SeverityStats): number {
    return stats.days60.overdue + stats.days90.overdue;
  }
}
