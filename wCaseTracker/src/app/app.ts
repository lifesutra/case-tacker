import { Component, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { DatabaseService } from './services/database.service';
import { ReminderService } from './services/reminder.service';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule, ButtonModule, MenuModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('केस ट्रॅकर');
  sidebarVisible = false;
  isMobile = false;
  menuItems: MenuItem[] = [];
  private notificationInterval: any;

  constructor(
    private db: DatabaseService,
    private reminderService: ReminderService,
    private authService: AuthService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
    if (!this.isMobile) {
      this.sidebarVisible = false;
    }
  }

  async ngOnInit() {
    await this.db.initDatabase();

    this.menuItems = [
      {
        label: 'डॅशबोर्ड',
        icon: 'pi pi-home',
        routerLink: '/dashboard',
        command: () => this.closeSidebar()
      },
      {
        separator: true
      },
      {
        label: 'Excel अपलोड',
        icon: 'pi pi-upload',
        routerLink: '/xls-upload',
        command: () => this.closeSidebar()
      },
      {
        label: 'केसेस',
        icon: 'pi pi-briefcase',
        items: [
          {
            label: 'सर्व केसेस पहा',
            icon: 'pi pi-list',
            routerLink: '/cases',
            command: () => this.closeSidebar()
          }
        ]
      },
      {
        label: 'स्मरणपत्रे',
        icon: 'pi pi-bell',
        routerLink: '/reminders',
        command: () => this.closeSidebar()
      },
      {
        separator: true
      },
      {
        label: 'सेटिंग्ज',
        icon: 'pi pi-cog',
        routerLink: '/settings',
        command: () => this.closeSidebar()
      },
      {
        label: 'लॉगआउट',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile) {
          this.closeSidebar();
        }
      });

    this.startReminderNotifications();
  }

  ngOnDestroy() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  closeSidebar() {
    this.sidebarVisible = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeSidebar();
  }

  private startReminderNotifications() {
    this.reminderService.checkAndNotify();

    this.notificationInterval = setInterval(() => {
      this.reminderService.checkAndNotify();
    }, 60000);
  }
}
