import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { DatabaseService } from './database.service';
import { Reminder, ReminderPriority, ReminderType } from '../models/reminder.model';
import { Case, CaseType } from '../models/case.model';
import { SettingsService } from './settings.service';
import { WhatsAppService } from './whatsapp.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private remindersSubject = new BehaviorSubject<Reminder[]>([]);
  public reminders$ = this.remindersSubject.asObservable();

  constructor(
    private db: DatabaseService,
    private settingsService: SettingsService,
    private whatsappService: WhatsAppService
  ) {
    this.loadReminders();
    this.startDailyCheck();
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
  private async requestNotificationPermission(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // Request permission for native platforms
      await LocalNotifications.requestPermissions();
    } else if ('Notification' in window && Notification.permission === 'default') {
      // Request permission for web
      Notification.requestPermission();
    }
  }

  // Check and send notifications for due reminders
  async checkAndNotify(): Promise<void> {
    const now = new Date();
    const reminders = await this.db.reminders
      .where('isCompleted')
      .equals(0 as any)
      .toArray();

    for (const reminder of reminders) {
      const reminderTime = new Date(reminder.reminderTime);
      if (reminderTime <= now && !reminder.notificationSent) {
        await this.showNotification(reminder);
        await this.updateReminder(reminder.id!, { notificationSent: true });
      }
    }
  }

  // Show notification (works on both web and mobile)
  private async showNotification(reminder: Reminder): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Local Notifications for native platforms
      await LocalNotifications.schedule({
        notifications: [
          {
            title: reminder.title,
            body: reminder.description || 'You have a reminder due',
            id: reminder.id || Math.floor(Math.random() * 1000000),
            schedule: { at: new Date() },
            sound: undefined,
            attachments: undefined,
            actionTypeId: '',
            extra: { reminderId: reminder.id }
          }
        ]
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      // Use Web Notifications API for web
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

  async generateRemindersForCase(caseItem: Case): Promise<void> {
    const existingReminders = await this.db.reminders.where('caseId').equals(caseItem.id!).toArray();
    if (existingReminders.length > 0) {
      for (const reminder of existingReminders) {
        await this.deleteReminder(reminder.id!);
      }
    }

    const settings = await this.settingsService.getSettings();
    let reminderDays: number[] = [];

    switch (caseItem.caseType) {
      case CaseType.DAYS_45:
        reminderDays = settings.reminderDays45;
        break;
      case CaseType.DAYS_60:
        reminderDays = settings.reminderDays60;
        break;
      case CaseType.DAYS_90:
        reminderDays = settings.reminderDays90;
        break;
    }

    const caseDate = new Date(caseItem.caseDate);
    caseDate.setHours(0, 0, 0, 0);

    for (const days of reminderDays) {
      const reminderDate = new Date(caseDate);
      reminderDate.setDate(reminderDate.getDate() + days);

      if (reminderDate >= new Date()) {
        await this.addReminder({
          caseId: caseItem.id,
          title: `केस ${caseItem.caseNumber} - ${days} दिवस स्मरणपत्र`,
          description: `केस क्रमांक: ${caseItem.caseNumber}, तारीख: ${caseItem.caseDate.toLocaleDateString('mr-IN')}, ${days} दिवस पूर्ण झाले`,
          dueDate: reminderDate,
          reminderTime: reminderDate,
          isCompleted: false,
          priority: days <= 5 ? ReminderPriority.HIGH : ReminderPriority.MEDIUM,
          type: ReminderType.FOLLOW_UP,
          notificationSent: false
        });
      }
    }
  }

  private startDailyCheck(): void {
    setInterval(async () => {
      await this.checkAndSendWhatsAppReminders();
    }, 60 * 60 * 1000);

    setTimeout(() => this.checkAndSendWhatsAppReminders(), 5000);
  }

  private async checkAndSendWhatsAppReminders(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const reminders = await this.db.reminders
      .where('isCompleted')
      .equals(0 as any)
      .toArray();

    for (const reminder of reminders) {
      const reminderDate = new Date(reminder.dueDate);
      reminderDate.setHours(0, 0, 0, 0);

      if (reminderDate >= today && reminderDate < tomorrow && !reminder.notificationSent) {
        if (reminder.caseId) {
          const caseItem = await this.db.cases.get(reminder.caseId);
          if (caseItem && caseItem.investigationOfficePhone) {
            const caseDate = new Date(caseItem.caseDate);
            const daysRemaining = caseItem.caseType - Math.floor((today.getTime() - caseDate.getTime()) / (1000 * 60 * 60 * 24));

            const sent = await this.whatsappService.sendCaseReminder(
              caseItem.investigationOfficePhone,
              caseItem.caseNumber,
              caseDate,
              daysRemaining,
              caseItem.caseType
            );

            if (sent) {
              await this.updateReminder(reminder.id!, { notificationSent: true });
            }
          }
        }
      }
    }
  }
}
