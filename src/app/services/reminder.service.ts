import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { Reminder, ReminderPriority, ReminderType } from '../models/reminder.model';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private remindersSubject = new BehaviorSubject<Reminder[]>([]);
  public reminders$ = this.remindersSubject.asObservable();

  constructor(private db: DatabaseService) {
    this.loadReminders();
  }

  // Load all reminders
  private async loadReminders(): Promise<void> {
    const reminders = await this.db.reminders.toArray();
    this.remindersSubject.next(reminders);
  }

  // Get all reminders
  getReminders(): Observable<Reminder[]> {
    return this.reminders$;
  }

  // Get reminder by ID
  getReminderById(id: number): Observable<Reminder | undefined> {
    return from(this.db.reminders.get(id));
  }

  // Get reminders by case ID
  getRemindersByCaseId(caseId: number): Observable<Reminder[]> {
    return from(this.db.reminders.where('caseId').equals(caseId).toArray());
  }

  // Get pending reminders
  getPendingReminders(): Observable<Reminder[]> {
    return this.reminders$.pipe(
      map(reminders => reminders.filter(r => !r.isCompleted))
    );
  }

  // Get completed reminders
  getCompletedReminders(): Observable<Reminder[]> {
    return this.reminders$.pipe(
      map(reminders => reminders.filter(r => r.isCompleted))
    );
  }

  // Get overdue reminders
  getOverdueReminders(): Observable<Reminder[]> {
    const now = new Date();
    return this.reminders$.pipe(
      map(reminders => reminders.filter(r =>
        !r.isCompleted && new Date(r.dueDate) < now
      ))
    );
  }

  // Get upcoming reminders (next 7 days)
  getUpcomingReminders(days: number = 7): Observable<Reminder[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.reminders$.pipe(
      map(reminders => reminders.filter(r => {
        const dueDate = new Date(r.dueDate);
        return !r.isCompleted && dueDate >= today && dueDate <= futureDate;
      }))
    );
  }

  // Add new reminder
  async addReminder(reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const newReminder: Reminder = {
      ...reminderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const id = await this.db.reminders.add(newReminder);
    await this.loadReminders();

    // Request notification permission if needed
    this.requestNotificationPermission();

    return id;
  }

  // Update reminder
  async updateReminder(id: number, reminderData: Partial<Reminder>): Promise<void> {
    await this.db.reminders.update(id, {
      ...reminderData,
      updatedAt: new Date()
    });
    await this.loadReminders();
  }

  // Toggle reminder completion
  async toggleComplete(id: number): Promise<void> {
    const reminder = await this.db.reminders.get(id);
    if (reminder) {
      await this.updateReminder(id, { isCompleted: !reminder.isCompleted });
    }
  }

  // Delete reminder
  async deleteReminder(id: number): Promise<void> {
    await this.db.reminders.delete(id);
    await this.loadReminders();
  }

  // Get reminder statistics
  async getReminderStatistics(): Promise<{
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    today: number;
  }> {
    const reminders = await this.db.reminders.toArray();
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      total: reminders.length,
      pending: reminders.filter(r => !r.isCompleted).length,
      completed: reminders.filter(r => r.isCompleted).length,
      overdue: reminders.filter(r => !r.isCompleted && new Date(r.dueDate) < now).length,
      today: reminders.filter(r => {
        const dueDate = new Date(r.dueDate);
        return !r.isCompleted && dueDate >= today && dueDate < tomorrow;
      }).length
    };
  }

  // Request notification permission
  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Check and send notifications for due reminders
  async checkAndNotify(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const now = new Date();
      const reminders = await this.db.reminders
        .where('isCompleted')
        .equals(0 as any)
        .toArray();

      reminders.forEach(reminder => {
        const reminderTime = new Date(reminder.reminderTime);
        if (reminderTime <= now && !reminder.notificationSent) {
          this.showNotification(reminder);
          this.updateReminder(reminder.id!, { notificationSent: true });
        }
      });
    }
  }

  // Show browser notification
  private showNotification(reminder: Reminder): void {
    const options: NotificationOptions = {
      body: reminder.description || 'You have a reminder due',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: `reminder-${reminder.id}`,
      requireInteraction: true
    };

    new Notification(reminder.title, options);
  }
}
