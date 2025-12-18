import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-grid.component.html',
  styleUrls: ['./test-grid.component.css'],
})
export class TestGridComponent {
  @Input() rows: Array<{ id: number; name: string }> = [];
}
