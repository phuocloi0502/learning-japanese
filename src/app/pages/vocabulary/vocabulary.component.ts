import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VocabularyService, Chapter, Lesson } from '../../services/vocabulary.service';
import { DatabaseService } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vocabulary.component.html',
  styleUrl: './vocabulary.component.css',
})
export class VocabularyComponent implements OnInit {
  title = 'Từ Vựng';
  description = 'Học từ vựng tiếng Nhật theo chủ đề';

  selectedLevel = 'N5';
  availableLevels: string[] = [];
  chapters: Chapter[] = [];
  isLoading = false;
  error = '';

  remembered = 0;
  rememberedCountMap: { [lessonId: number]: number } = {};

  constructor(
    private vocabularyService: VocabularyService,
    private cdr: ChangeDetectorRef,
    private databaseService: DatabaseService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Luôn scroll lên đầu trang khi vào component
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.availableLevels = this.vocabularyService.getAvailableLevels();
    this.loadVocabularyData();
  }

  loadVocabularyData() {
    console.log(`🔄 Starting to load vocabulary data for ${this.selectedLevel}`);
    this.isLoading = true;
    this.error = '';
    this.chapters = []; // Clear previous data

    this.vocabularyService.getVocabularyData(this.selectedLevel).subscribe({
      next: (data) => {
        console.log(`✅ Data received for ${this.selectedLevel}:`, data);
        this.chapters = data;
        console.log(`📚 Set chapters: ${this.chapters.length} chapters for ${this.selectedLevel}`);
        // Trong loadVocabularyData, sau khi this.chapters = data;
        this.loadRememberedCounts();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`❌ Error loading vocabulary for ${this.selectedLevel}:`, error);
        this.error = 'Không thể tải dữ liệu từ vựng. Vui lòng thử lại.';
        this.isLoading = false;
      },
    });
  }

  onLevelChange() {
    this.loadVocabularyData();
  }
  async loadRememberedCounts() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    const promises: Promise<void>[] = [];
    for (const chapter of this.chapters) {
      for (const lesson of chapter.lessonList) {
        const p = this.databaseService
          .getVocabulariesByStatus(userId, lesson, true)
          .then((result) => {
            this.rememberedCountMap[lesson.lesson_id] = result?.length || 0;
          });
        promises.push(p);
      }
    }
    await Promise.all(promises);
    this.cdr.detectChanges();
  }

  getTotalVocabularyCount(): number {
    return this.chapters.reduce((total, chapter) => {
      return (
        total +
        chapter.lessonList.reduce((lessonTotal, lesson) => {
          return lessonTotal + lesson.vocabularyList.length;
        }, 0)
      );
    }, 0);
  }
}
