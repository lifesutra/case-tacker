import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { DatabaseService } from './database.service';
import { Settings, DEFAULT_SETTINGS } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<Settings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  constructor(private db: DatabaseService) {
    this.loadSettings();
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.db.settings.toArray();
    if (settings.length > 0) {
      this.settingsSubject.next(settings[0]);
    } else {
      const defaultSettings = await this.createDefaultSettings();
      this.settingsSubject.next(defaultSettings);
    }
  }

  async getSettings(): Promise<Settings> {
    const settings = await this.db.settings.toArray();
    if (settings.length > 0) {
      return settings[0];
    }
    return await this.createDefaultSettings();
  }

  getSettingsObservable(): Observable<Settings | null> {
    return this.settings$;
  }

  async updateSettings(settingsData: Partial<Settings>): Promise<void> {
    const existing = await this.db.settings.toArray();
    const settings: Settings = {
      ...(existing[0] || DEFAULT_SETTINGS),
      ...settingsData,
      updatedAt: new Date()
    };

    if (existing.length > 0) {
      settings.id = existing[0].id;
      settings.createdAt = existing[0].createdAt;
      await this.db.settings.put(settings);
    } else {
      settings.createdAt = new Date();
      await this.db.settings.add(settings);
    }

    await this.loadSettings();
  }

  private async createDefaultSettings(): Promise<Settings> {
    const defaultSettings: Settings = {
      ...DEFAULT_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const id = await this.db.settings.add(defaultSettings);
    defaultSettings.id = id;
    return defaultSettings;
  }
}

