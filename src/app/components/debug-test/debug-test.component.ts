import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { timeout, retry } from 'rxjs/operators';

@Component({
  selector: 'app-debug-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>🔍 Debug Test - Load Data từ Firebase Hosting</h2>
      
      <div class="test-buttons">
        <button *ngFor="let level of levels" 
                (click)="testLevel(level)" 
                [disabled]="loading[level]"
                class="btn btn-primary me-2 mb-2">
          {{ loading[level] ? '⏳ Loading...' : 'Test ' + level }}
        </button>
      </div>
      
      <div class="results">
        <div *ngFor="let level of levels" class="result-item">
          <div *ngIf="results[level]">
            <h4>{{ level }}:</h4>
            <div [class]="results[level].success ? 'alert alert-success' : 'alert alert-danger'">
              <strong>{{ results[level].success ? '✅ Success' : '❌ Error' }}</strong>
              <p>{{ results[level].message }}</p>
              <div *ngIf="results[level].data" class="data-preview">
                <strong>Data preview:</strong>
                <pre>{{ results[level].data | json | slice:0:500 }}...</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .test-buttons { margin: 20px 0; }
    .results { margin: 20px 0; }
    .result-item { margin: 15px 0; }
    .data-preview { margin-top: 10px; }
    pre { 
      background: #f8f9fa; 
      padding: 10px; 
      border-radius: 4px; 
      font-size: 12px;
      max-height: 200px;
      overflow-y: auto;
    }
  `]
})
export class DebugTestComponent implements OnInit {
  levels = ['N1', 'N2', 'N3', 'N4', 'N5'];
  loading: { [key: string]: boolean } = {};
  results: { [key: string]: { success: boolean; message: string; data?: any } } = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.levels.forEach(level => {
      this.loading[level] = false;
    });
  }

  testLevel(level: string) {
    this.loading[level] = true;
    this.results[level] = { success: false, message: '' };

    const url = `https://jp-learning-0502.web.app/data/data${level}.json`;
    console.log(`🔍 Testing ${level} from: ${url}`);

    this.http.get(url, {
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }).pipe(
      timeout(30000), // 30 seconds timeout
      retry(2) // Retry 2 times
    ).subscribe({
      next: (data: any) => {
        this.loading[level] = false;
        this.results[level] = {
          success: true,
          message: `Loaded successfully! Found ${Array.isArray(data) ? data.length : 'unknown'} items`,
          data: data
        };
        console.log(`✅ ${level} success:`, data);
      },
      error: (error) => {
        this.loading[level] = false;
        let errorMessage = error.message || error.statusText || 'Unknown error';
        if (error.name === 'TimeoutError') {
          errorMessage = `Timeout (30s) - File too large (${level === 'N1' ? '1MB' : level === 'N2' ? '880KB' : 'unknown'})`;
        }
        this.results[level] = {
          success: false,
          message: `Error: ${errorMessage}`
        };
        console.error(`❌ ${level} error:`, error);
      }
    });
  }
}
