import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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

  constructor(private authService: AuthService, private router: Router) {}

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
      if (this.isSignUp) {
        await this.authService.signUp(this.email, this.password);
        this.success = 'Đăng ký thành công! Đang chuyển hướng...';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      } else {
        await this.authService.signIn(this.email, this.password);
        this.success = 'Đăng nhập thành công! Đang chuyển hướng...';
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1500);
      }
    } catch (error: any) {
      //console.error('Auth error:', error);

      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          this.error = 'Không tìm thấy tài khoản với email này';
          break;
        case 'auth/wrong-password':
          this.error = 'Mật khẩu không đúng';
          break;
        case 'auth/email-already-in-use':
          this.error = 'Email này đã được sử dụng';
          break;
        case 'auth/weak-password':
          this.error = 'Mật khẩu quá yếu';
          break;
        case 'auth/invalid-email':
          this.error = 'Email không hợp lệ';
          break;
        default:
          this.error = 'Có lỗi xảy ra. Vui lòng thử lại';
      }
    } finally {
      this.isLoading = false;
    }
  }
}
