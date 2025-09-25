import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kanji',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanji.component.html',
  styleUrl: './kanji.component.css'
})
export class KanjiComponent {
  title = 'Kanji';
  description = 'Học chữ Kanji theo bộ và cấp độ JLPT';
}
