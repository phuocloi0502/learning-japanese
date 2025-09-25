import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VocabularyService } from '../../services/vocabulary.service';

@Component({
  selector: 'app-data-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>🧪 Test Load Data</h2>
      
      <div class="test-section">
        <h3>Test các cấp độ:</h3>
        <div class="level-tests">
          <div *ngFor="let level of levels" class="level-test">
            <button (click)="testLevel(level)" [disabled]="loading[level]">
              {{ loading[level] ? '⏳ Loading...' : '🧪 Test ' + level }}
            </button>
            <div *ngIf="results[level]" class="result">
              <span [class]="results[level].success ? 'success' : 'error'">
                {{ results[level].success ? '✅' : '❌' }} {{ results[level].message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .test-section {
      margin: 20px 0;
    }
    
    .level-tests {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    
    .level-test {
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }
    
    button {
      width: 100%;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .result {
      margin-top: 10px;
      padding: 8px;
      border-radius: 4px;
    }
    
    .success {
      color: #28a745;
      background: #d4edda;
    }
    
    .error {
      color: #dc3545;
      background: #f8d7da;
    }
  `]
})
export class DataTestComponent implements OnInit {
  levels = ['N1', 'N2', 'N3', 'N4', 'N5'];
  loading: { [key: string]: boolean } = {};
  results: { [key: string]: { success: boolean; message: string } } = {};

  constructor(private vocabularyService: VocabularyService) {}

  ngOnInit() {
    // Initialize loading states
    this.levels.forEach(level => {
      this.loading[level] = false;
    });
  }

  testLevel(level: string) {
    this.loading[level] = true;
    this.results[level] = { success: false, message: '' };

    this.vocabularyService.getVocabularyData(level).subscribe({
      next: (data) => {
        this.loading[level] = false;
        this.results[level] = {
          success: true,
          message: `Loaded ${data.length} chapters successfully`
        };
        console.log(`✅ ${level} data:`, data);
      },
      error: (error) => {
        this.loading[level] = false;
        this.results[level] = {
          success: false,
          message: `Error: ${error.message || error}`
        };
        console.error(`❌ ${level} error:`, error);
      }
    });
  }
}
