import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface MenuItem {
  label: string;
  route?: string;
  icon?: string;
  action?: string; // e.g. 'logout'
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterModule, CommonModule, MatTooltipModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent implements OnInit, OnDestroy {
  baseMenuItems: MenuItem[] = [
    { label: 'Trang Chủ', route: '/home', icon: '🏠' },
    { label: 'Từ Vựng', route: '/vocabulary', icon: '📚' },
    //{ label: 'Flash Card', route: '/flashcard', icon: '🎴' },
    { label: 'Ngữ Pháp', route: '/grammar', icon: '📖' },
    { label: 'Kanji', route: '/kanji', icon: '🈯' },
  ];

  get menuItems(): MenuItem[] {
    const items: MenuItem[] = [...this.baseMenuItems];
    if (this.currentUser) {
      // thêm mục đăng xuất (sử dụng action để xử lý click)
      items.push({ label: 'Đăng xuất', route: '/login', icon: '🔒', action: 'logout' });
    } else {
      items.push({ label: 'Đăng nhập', route: '/login', icon: '🔑' });
    }
    return items;
  }
  currentUser: User | null = null;
  showMenu = false;
  currentMenuLabel = 'Trang Chủ';
  showUserInfo = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      const found = this.menuItems.find(
        (item) => item.route && currentRoute.startsWith(item.route)
      );
      this.currentMenuLabel = found ? found.label : '';
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
      this.cdr.detectChanges();
    } catch (error) {}
  }

  // Xử lý click cho menu: gọi logout nếu item.action==='logout', ngược lại điều hướng
  onMenuItemClick(item: MenuItem | any) {
    if (!item) return;
    if (item.action === 'logout') {
      this.logout();
    } else if (item.route) {
      this.router.navigate([item.route]);
    }

    // Đóng menu mobile nếu đang mở
    if (this.showMenu) {
      this.showMenu = false;
    }
    this.cdr.detectChanges();
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }
}
