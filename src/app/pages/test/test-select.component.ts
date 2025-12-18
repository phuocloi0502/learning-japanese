import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-select.component.html',
  styleUrls: ['./test-select.component.css'],
})
export class TestSelectComponent {
  @Output() selectedId = new EventEmitter<number>();
  public options = Array.from({ length: 10 }, (_, i) => i + 1);

  onChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const id = Number(value);
    if (!isNaN(id)) {
      this.selectedId.emit(id);
    }
  }
}
