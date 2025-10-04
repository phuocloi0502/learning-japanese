import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private app: any;
  private analytics: any;
  private auth: any;
  private database: any;

  constructor() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Initialize Firebase
      this.app = initializeApp(environment.firebase);

      // Initialize services (only in browser)
      if (typeof window !== 'undefined') {
        this.analytics = getAnalytics(this.app);
        this.auth = getAuth(this.app);
        this.database = getDatabase(this.app);
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
    }
  }

  getApp() {
    return this.app;
  }

  getAnalytics() {
    return this.analytics;
  }

  getAuth() {
    return this.auth;
  }

  getDatabase() {
    return this.database;
  }
}
