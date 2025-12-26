export interface Settings {
  id?: number;
  reminderDays45: number[];
  reminderDays60: number[];
  reminderDays90: number[];
  whatsappEnabled: boolean;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SETTINGS: Settings = {
  reminderDays45: [35, 40, 45],
  reminderDays60: [50, 55, 60],
  reminderDays90: [80, 85, 90],
  whatsappEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date()
};

