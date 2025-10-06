import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { CaseList } from './components/case-list/case-list';
import { CaseForm } from './components/case-form/case-form';
import { ReminderList } from './components/reminder-list/reminder-list';
import { ReminderForm } from './components/reminder-form/reminder-form';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'cases', component: CaseList },
  { path: 'cases/new', component: CaseForm },
  { path: 'cases/edit/:id', component: CaseForm },
  { path: 'cases/:id', component: CaseForm },
  { path: 'reminders', component: ReminderList },
  { path: 'reminders/new', component: ReminderForm },
  { path: '**', redirectTo: '/dashboard' }
];
