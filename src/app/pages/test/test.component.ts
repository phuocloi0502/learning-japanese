import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTestComponent } from '../../components/data-test/data-test.component';
import { DebugTestComponent } from '../../components/debug-test/debug-test.component';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule, DataTestComponent, DebugTestComponent],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <h1 class="text-center">🧪 Test Page</h1>
          <p class="text-center">Nếu bạn thấy trang này, ứng dụng đang hoạt động bình thường!</p>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <app-debug-test></app-debug-test>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <app-data-test></app-data-test>
        </div>
      </div>
    </div>
  `,
  styles: [`
    h1 { color: #333; margin: 20px 0; }
    p { color: #666; font-size: 1.2rem; }
  `]
})
export class TestComponent {}
