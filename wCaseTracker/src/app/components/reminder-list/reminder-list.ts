import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ReminderService } from '../../services/reminder.service';
import { Reminder } from '../../models/reminder.model';

@Component({
  selector: 'app-reminder-list',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    TagModule,
    CheckboxModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './reminder-list.html',
  styleUrl: './reminder-list.scss'
})
export class ReminderList implements OnInit {
  reminders: Reminder[] = [];
  pendingReminders: Reminder[] = [];
  overdueReminders: Reminder[] = [];

  constructor(
    private reminderService: ReminderService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadReminders();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  loadReminders() {
    this.reminderService.getReminders().subscribe(reminders => {
      this.reminders = reminders;
    });

    this.reminderService.getPendingReminders().subscribe(pending => {
      this.pendingReminders = pending;
    });

    this.reminderService.getOverdueReminders().subscribe(overdue => {
      this.overdueReminders = overdue;
    });
  }

  async toggleComplete(reminder: Reminder) {
    try {
      await this.reminderService.toggleComplete(reminder.id!);
      this.messageService.add({
        severity: 'success',
        summary: 'यश',
        detail: reminder.isCompleted ? 'स्मरणपत्र अपूर्ण म्हणून चिन्हांकित केले' : 'स्मरणपत्र पूर्ण झाले'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'स्मरणपत्र अपडेट करण्यात अयशस्वी'
      });
    }
  }

  async deleteReminder(reminder: Reminder) {
    try {
      await this.reminderService.deleteReminder(reminder.id!);
      this.messageService.add({
        severity: 'success',
        summary: 'यश',
        detail: 'स्मरणपत्र हटवले'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'स्मरणपत्र हटवण्यात अयशस्वी'
      });
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

  isOverdue(dueDate: Date): boolean {
    return new Date(dueDate) < new Date();
  }
}
