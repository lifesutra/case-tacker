import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CaseService } from '../../services/case.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  caseStats: {
    total: number;
    pending: number;
    closed: number;
    closerToDate: number;
  } = {
    total: 0,
    pending: 0,
    closed: 0,
    closerToDate: 0
  };

  constructor(
    private caseService: CaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.caseStats = await this.caseService.getCaseStatistics();
  }

  navigateToCases(filter?: string) {
    if (filter) {
      this.router.navigate(['/cases'], { queryParams: { filter } });
    } else {
      this.router.navigate(['/cases']);
    }
  }

  getCaseSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (status) {
      case 'Open': return 'info';
      case 'In Progress': return 'info';
      case 'Under Investigation': return 'warn';
      case 'Pending Court': return 'warn';
      case 'Closed': return 'success';
      default: return 'secondary';
    }
  }

  getReminderSeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warn';
      case 'Low': return 'info';
      default: return 'secondary';
    }
  }
}
