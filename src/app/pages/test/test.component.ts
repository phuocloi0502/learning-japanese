import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TestSelectComponent } from './test-select.component';
import { TestGridComponent } from './test-grid.component';
import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-grammar',
  standalone: true,
  imports: [CommonModule, HttpClientModule, TestSelectComponent, TestGridComponent],
  templateUrl: './test.component.html',
  styleUrl: './test.component.css',
})
export class TestComponent implements OnInit, OnDestroy, OnChanges {
  title = 'Ngữ Pháp';
  description = 'Học ngữ pháp tiếng Nhật từ cơ bản đến nâng cao';

  gridRows: Array<{ id: number; name: string }> = [];
  isLoading = false;

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    // constructor: chỉ inject dependencies, không gọi side-effect
  }

  ngOnInit() {
    // Component initialized - khởi tạo, không gọi API nặng ở đây nếu phụ thuộc input
    console.log('TestComponent initialized (ngOnInit)');
  }

  ngOnChanges(changes: SimpleChanges) {
    // Example (uncomment if using @Input selectedId):
    // if (changes['selectedId'] && !changes['selectedId'].isFirstChange()) {
    //   const newId = changes['selectedId'].currentValue;
    //   this.onSelectedId(newId);
    // }
  }

  ngOnDestroy() {
    // Hủy các subscription / timers
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSelectedId(id: number) {
    if (!id) return;
    this.isLoading = true;
    this.gridRows = [];

    const url = `https://66aa33ed613eced4eba7ff6c.mockapi.io/users/${id}`;
    this.http
      .get(url)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe(
        (res: any) => {
          const rows = Array.isArray(res) ? res : [res];
          this.gridRows = rows.map((r: any) => ({
            id: id,
            name: r.name || r.username || r.email || 'N/A',
          }));
          this.cdr.detectChanges();
        },
        (err) => {
          console.error('API error', err);
          this.gridRows = [];
        }
      );
  }
}
