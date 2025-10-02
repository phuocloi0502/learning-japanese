import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterModule, CommonModule, MatTooltipModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent implements OnInit, OnDestroy {
  menuItems = [
    { label: 'Trang Chủ', route: '/home', icon: '🏠' },
    { label: 'Từ Vựng', route: '/vocabulary', icon: '📚' },
    //{ label: 'Flash Card', route: '/flashcard', icon: '🎴' },
    { label: 'Ngữ Pháp', route: '/grammar', icon: '📖' },
    { label: 'Kanji', route: '/kanji', icon: '🈯' },
  ];

  currentUser: User | null = null;
  showMenu = false;
  currentMenuLabel = 'Trang Chủ';
  showUserInfo = false;
  private destroy$ = new Subject<void>();

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser = user;
    });
    // Cập nhật label khi route thay đổi
    this.router.events.subscribe(() => {
      const currentRoute = this.router.url;
      const found = this.menuItems.find((item) => currentRoute.startsWith(item.route));
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
    } catch (error) {
      ////console.error('Logout error:', error);
    }
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }
}
