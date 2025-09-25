import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  title = 'Chào mừng đến với ứng dụng học tiếng Nhật!';
  description = 'Hãy bắt đầu hành trình học tiếng Nhật của bạn ngay hôm nay';

  // Simple category data
  vocabularyCategory = { icon: '📚' };
  grammarCategory = { icon: '📖' };
  kanjiCategory = { icon: '🈯' };

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}
