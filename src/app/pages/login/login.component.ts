import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  confirmPassword = '';
  isSignUp = false;
  isLoading = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Check if user is already logged in
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.router.navigate(['/home']);
      }
    });
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.error = '';
    this.success = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Vui lòng nhập đầy đủ thông tin';
      return;
    }

    if (this.isSignUp && this.password !== this.confirmPassword) {
      this.error = 'Mật khẩu xác nhận không khớp';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Mật khẩu phải có ít nhất 6 ký tự';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.success = '';

    try {
      const auth = getAuth();
      await setPersistence(auth, browserLocalPersistence);
      if (this.isSignUp) {
        await this.authService.signUp(this.email, this.password);
        this.success = 'Đăng ký thành công! Đang chuyển hướng...';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      } else {
        await this.authService.signIn(this.email, this.password);
        this.success = 'Đăng nhập thành công! Đang chuyển hướng...';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      }
    } catch (error: any) {
      this.error = error || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      this.isLoading = false;
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
    }
  }
}
