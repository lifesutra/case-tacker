import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CaseService } from '../../services/case.service';
import { ReminderService } from '../../services/reminder.service';
import { Case } from '../../models/case.model';
import { Reminder } from '../../models/reminder.model';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  caseStats: any = {};
  reminderStats: any = {};
  upcomingHearings: Case[] = [];
  upcomingReminders: Reminder[] = [];
  overdueReminders: Reminder[] = [];

  constructor(
    private caseService: CaseService,
    private reminderService: ReminderService
  ) {}

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    // Load case statistics
    this.caseStats = await this.caseService.getCaseStatistics();

    // Load reminder statistics
    this.reminderStats = await this.reminderService.getReminderStatistics();

    // Load upcoming hearings
    this.upcomingHearings = await this.caseService.getUpcomingHearings(7);

    // Load upcoming reminders
    this.reminderService.getUpcomingReminders(7).subscribe(reminders => {
      this.upcomingReminders = reminders;
    });

    // Load overdue reminders
    this.reminderService.getOverdueReminders().subscribe(reminders => {
      this.overdueReminders = reminders;
    });
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
