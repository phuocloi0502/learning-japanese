import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grammar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grammar.component.html',
  styleUrl: './grammar.component.css'
})
export class GrammarComponent {
  title = 'Ngữ Pháp';
  description = 'Học ngữ pháp tiếng Nhật từ cơ bản đến nâng cao';
}
