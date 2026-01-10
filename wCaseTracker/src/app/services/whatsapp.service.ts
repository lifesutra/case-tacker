import { Injectable, Injector } from '@angular/core';
import { SettingsService } from './settings.service';
import { Settings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private readonly API_ENDPOINT = '/api/whatsapp/send';
  private caseService: any;

  constructor(
    private settingsService: SettingsService,
    private injector: Injector
  ) {}

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
    caseType: number,
    investigationOfficeName?: string,
    caseId?: number
  ): Promise<boolean> {
    const message = this.formatReminderMessage(caseNumber, caseDate, daysRemaining, caseType, investigationOfficeName);
    const success = await this.sendMessageViaWeb(phoneNumber, message);

    if (success && caseId) {
      if (!this.caseService) {
        const { CaseService } = await import('./case.service');
        this.caseService = this.injector.get(CaseService);
      }

      try {
        const caseData = await this.caseService.getCaseById(caseId).toPromise();
        if (caseData) {
          await this.caseService.updateCase(caseId, {
            reminderAttemptCount: (caseData.reminderAttemptCount || 0) + 1,
            lastWhatsAppDate: new Date()
          });
        }
      } catch (error) {
        console.error('Error updating case communication tracking:', error);
      }
    }

    return success;
  }

  async sendMessageViaWeb(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!formattedPhone) {
        console.error('Invalid phone number format');
        return false;
      }

      const fullPhoneNumber = `91${formattedPhone}`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${fullPhoneNumber}&text=${encodedMessage}`;
      
      window.open(whatsappUrl, '_blank');
      return true;
    } catch (error) {
      console.error('Error opening WhatsApp Web:', error);
      return false;
    }
  }

  private formatReminderMessage(
    caseNumber: string,
    caseDate: Date,
    daysRemaining: number,
    caseType: number,
    investigationOfficeName?: string
  ): string {
    const caseDateObj = new Date(caseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    caseDateObj.setHours(0, 0, 0, 0);
    
    const daysSinceCase = Math.floor((today.getTime() - caseDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    const dateStr = caseDateObj.toLocaleDateString('mr-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    let officerName = 'IO/ तपासीक अधिकारी/अंमलदार';
    if (investigationOfficeName) {
      const parts = investigationOfficeName.split(' - ');
      if (parts.length > 1) {
        const officerPart = parts[parts.length - 1].trim();
        officerName = officerPart || 'IO/ तपासीक अधिकारी/अंमलदार';
      } else {
        officerName = investigationOfficeName.trim() || 'IO/ तपासीक अधिकारी/अंमलदार';
      }
    }

    const message = `प्रति - ${officerName}
• दोषारोप पत्र दाखल करण्यास ${daysRemaining} दिवस बाकी
• FIR No. ${caseNumber}
         दाखल दिनांक :- ${dateStr}
         तपास कालावधी - ${caseType} दिवस 
        दाखल झाल्यापासुनचा कालावधी - ${daysSinceCase} दिवस
        शिल्लक दिवस - ${daysRemaining} दिवस
•वेळेत तपास पुर्ण करुन विहीत कालावधीत दोषारोपपत्र सादर करावे`;

    return message;
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
    return Promise.resolve(true);
  }
}

