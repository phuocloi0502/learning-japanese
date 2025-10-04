import { Injectable } from '@angular/core';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { FirebaseError } from 'firebase/app';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private auth: Auth;

  constructor(private firebaseService: FirebaseService) {
    this.auth = this.firebaseService.getAuth();

    // Listen to auth state changes
    onAuthStateChanged(this.auth, (user: User | null) => {
      this.userSubject.next(user);
    });
  }

  async signIn(email: string, password: string): Promise<User> {
    const auth = this.firebaseService.getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.userSubject.next(userCredential.user);
      return userCredential.user;
    } catch (err: unknown) {
      const error = err as FirebaseError;
      console.error('Auth error:', error);

      let message = 'Đăng nhập thất bại';

      if (error.code === 'auth/invalid-credential') {
        message = 'Email hoặc mật khẩu không đúng';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Email hoặc mật khẩu không đúng';
      } else if (error.message) {
        message = error.message;
      }

      // 👉 Thay vì throw cứng, reject để UI nhận lỗi
      return Promise.reject(message);
    }
  }

  async signUp(email: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      this.userSubject.next(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
    this.userSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
  }

  getUserId(): string | null {
    return this.userSubject.value?.uid || null;
  }
  isAdmin(): boolean {
    const adminEmail = 'vophuocloi0502@gmail.com';
    return this.userSubject.value?.email === adminEmail;
  }
}
