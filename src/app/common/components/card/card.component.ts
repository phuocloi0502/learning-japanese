import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() hoverable = true;
  @Input() clickable = false;

  getCardClasses(): string {
    const classes = ['card'];
    if (this.hoverable) classes.push('card-hoverable');
    if (this.clickable) classes.push('card-clickable');
    return classes.join(' ');
  }
}
