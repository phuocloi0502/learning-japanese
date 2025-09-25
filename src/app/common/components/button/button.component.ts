import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type ButtonType = 'primary' | 'secondary' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  @Input() type: ButtonType = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() routerLink?: string;
  @Input() href?: string;
  @Input() disabled = false;
  @Input() fullWidth = false;

  getButtonClasses(): string {
    const classes = ['btn', `btn-${this.type}`, `btn-${this.size}`];
    if (this.fullWidth) classes.push('btn-full');
    if (this.disabled) classes.push('disabled');
    return classes.join(' ');
  }
}
