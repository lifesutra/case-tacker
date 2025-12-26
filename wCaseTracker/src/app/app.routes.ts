import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { CaseList } from './components/case-list/case-list';
import { CaseForm } from './components/case-form/case-form';
import { ReminderList } from './components/reminder-list/reminder-list';
import { Login } from './components/login/login';
import { XlsUpload } from './components/xls-upload/xls-upload';
import { SettingsComponent } from './components/settings/settings';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'cases', component: CaseList, canActivate: [authGuard] },
  { path: 'cases/new', component: CaseForm, canActivate: [authGuard] },
  { path: 'cases/edit/:id', component: CaseForm, canActivate: [authGuard] },
  { path: 'cases/:id', component: CaseForm, canActivate: [authGuard] },
  { path: 'reminders', component: ReminderList, canActivate: [authGuard] },
  { path: 'xls-upload', component: XlsUpload, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
