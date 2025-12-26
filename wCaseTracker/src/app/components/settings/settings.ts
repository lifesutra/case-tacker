import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SettingsService } from '../../services/settings.service';
import { Settings } from '../../models/settings.model';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    ButtonModule,
    CheckboxModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SettingsComponent implements OnInit {
  settings: Settings = {
    reminderDays45: [35, 40, 45],
    reminderDays60: [50, 55, 60],
    reminderDays90: [80, 85, 90],
    whatsappEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  reminder45Days: string = '35,40,45';
  reminder60Days: string = '50,55,60';
  reminder90Days: string = '80,85,90';
  loading: boolean = false;

  constructor(
    private settingsService: SettingsService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    this.settings = await this.settingsService.getSettings();
    this.reminder45Days = this.settings.reminderDays45.join(',');
    this.reminder60Days = this.settings.reminderDays60.join(',');
    this.reminder90Days = this.settings.reminderDays90.join(',');
  }

  parseReminderDays(daysString: string): number[] {
    return daysString.split(',')
      .map(d => parseInt(d.trim()))
      .filter(d => !isNaN(d) && d > 0)
      .sort((a, b) => a - b);
  }

  async saveSettings() {
    this.loading = true;
    try {
      const reminderDays45 = this.parseReminderDays(this.reminder45Days);
      const reminderDays60 = this.parseReminderDays(this.reminder60Days);
      const reminderDays90 = this.parseReminderDays(this.reminder90Days);

      if (reminderDays45.length === 0 || reminderDays60.length === 0 || reminderDays90.length === 0) {
        this.messageService.add({
          severity: 'error',
          summary: 'त्रुटी',
          detail: 'कृपया सर्व स्मरणपत्र दिवस प्रविष्ट करा'
        });
        return;
      }

      await this.settingsService.updateSettings({
        reminderDays45,
        reminderDays60,
        reminderDays90,
        whatsappEnabled: this.settings.whatsappEnabled,
        twilioAccountSid: this.settings.twilioAccountSid,
        twilioAuthToken: this.settings.twilioAuthToken,
        twilioFromNumber: this.settings.twilioFromNumber
      });

      this.messageService.add({
        severity: 'success',
        summary: 'यश',
        detail: 'सेटिंग्ज यशस्वीरित्या अपडेट केल्या'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'त्रुटी',
        detail: 'सेटिंग्ज सेव्ह करताना त्रुटी आली'
      });
    } finally {
      this.loading = false;
    }
  }
}

