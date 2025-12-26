import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private readonly API_ENDPOINT = '/api/whatsapp/send';

  constructor(private settingsService: SettingsService) {}

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const settings = await this.settingsService.getSettings();

      if (!settings.whatsappEnabled) {
        console.warn('WhatsApp is not enabled in settings');
        return false;
      }

      if (!settings.twilioAccountSid || !settings.twilioAuthToken || !settings.twilioFromNumber) {
        console.error('Twilio credentials are not configured');
        return false;
      }

      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone) {
        console.error('Invalid phone number format');
        return false;
      }

      try {
        const response = await fetch(this.API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountSid: settings.twilioAccountSid,
            authToken: settings.twilioAuthToken,
            from: settings.twilioFromNumber,
            to: `whatsapp:${formattedPhone}`,
            message: message
          })
        });

        if (response.ok) {
          return true;
        } else {
          console.error('Failed to send WhatsApp message:', await response.text());
          return false;
        }
      } catch (fetchError) {
        console.warn('Backend API not available, WhatsApp message would be sent:', {
          to: `whatsapp:${formattedPhone}`,
          message: message
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  async sendCaseReminder(
    phoneNumber: string,
    caseNumber: string,
    caseDate: Date,
    daysRemaining: number,
    caseType: number
  ): Promise<boolean> {
    const message = this.formatReminderMessage(caseNumber, caseDate, daysRemaining, caseType);
    return await this.sendMessage(phoneNumber, message);
  }

  private formatReminderMessage(
    caseNumber: string,
    caseDate: Date,
    daysRemaining: number,
    caseType: number
  ): string {
    const dateStr = caseDate.toLocaleDateString('mr-IN');
    return `स्मरणपत्र: केस क्रमांक ${caseNumber}, तारीख ${dateStr}. ${daysRemaining} दिवस शिल्लक आहेत (${caseType} दिवस केस). कृपया आवश्यक कृती करा.`;
  }

  private formatPhoneNumber(phone: string): string | null {
    if (!phone) return null;

    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    }

    if (cleaned.length === 10) {
      return cleaned;
    }

    if (cleaned.length > 10) {
      return cleaned.substring(cleaned.length - 10);
    }

    return null;
  }

  isConfigured(): Promise<boolean> {
    return this.settingsService.getSettings().then(settings => {
      return settings.whatsappEnabled &&
        !!settings.twilioAccountSid &&
        !!settings.twilioAuthToken &&
        !!settings.twilioFromNumber;
    });
  }
}

