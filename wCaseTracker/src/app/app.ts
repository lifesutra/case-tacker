import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { DatabaseService } from './services/database.service';
import { ReminderService } from './services/reminder.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule, MenubarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Case Tracker');
  menuItems: MenuItem[] = [];
  private notificationInterval: any;

  constructor(
    private db: DatabaseService,
    private reminderService: ReminderService
  ) {}

  async ngOnInit() {
    // Initialize database
    await this.db.initDatabase();

    // Setup menu items
    this.menuItems = [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: '/dashboard'
      },
      {
        label: 'Cases',
        icon: 'pi pi-briefcase',
        items: [
          {
            label: 'View All Cases',
            icon: 'pi pi-list',
            routerLink: '/cases'
          },
          {
            label: 'New Case',
            icon: 'pi pi-plus',
            routerLink: '/cases/new'
          }
        ]
      },
      {
        label: 'Reminders',
        icon: 'pi pi-bell',
        routerLink: '/reminders'
      }
    ];

    // Start checking for reminders every minute
    this.startReminderNotifications();
  }

  ngOnDestroy() {
    // Clear interval when app is destroyed
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  private startReminderNotifications() {
    // Check immediately on app start
    this.reminderService.checkAndNotify();

    // Then check every minute (60000ms)
    this.notificationInterval = setInterval(() => {
      this.reminderService.checkAndNotify();
    }, 60000);
  }
}
