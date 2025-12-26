import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'case_tracker_user';
  private readonly DEFAULT_USERNAME = 'admin';
  private readonly DEFAULT_PASSWORD = 'admin';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const user = localStorage.getItem(this.STORAGE_KEY);
    this.isAuthenticatedSubject.next(!!user);
  }

  login(username: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (username === this.DEFAULT_USERNAME && password === this.DEFAULT_PASSWORD) {
        const user: User = { username, password };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        this.isAuthenticatedSubject.next(true);
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.isAuthenticatedSubject.next(false);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.STORAGE_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
}

