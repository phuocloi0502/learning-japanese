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

  selectedLevel = localStorage.getItem('selectedLevel') || 'N5';
  availableLevels: string[] = [];
  chapters: Chapter[] = [];
  chapters1: Chapter[] = [];
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
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.availableLevels = this.vocabularyService.getAvailableLevels();
    this.loadVocabularyData();
  }

  async loadVocabularyData() {
    this.isLoading = true;
    this.error = '';
    this.chapters = [];
    try {
      this.chapters = await this.vocabularyService.getVocabularyData1(this.selectedLevel);
      console.log('📚 Loaded chapters from Firebase Realtime Database:', this.chapters);
      await this.loadRememberedCounts();
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      this.error = 'Không thể tải dữ liệu từ vựng. Vui lòng thử lại.';
      this.isLoading = false;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onLevelChange() {
    localStorage.setItem('selectedLevel', this.selectedLevel);
    this.loadVocabularyData();
  }
  async loadRememberedCounts() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    const promises: Promise<void>[] = [];

    for (const chapter of this.chapters) {
      if (!chapter.lessonList) continue; // tránh lỗi null

      for (const lesson of chapter.lessonList) {
        if (!lesson?.lesson_id) continue;

        // const p = this.databaseService
        //   .getVocabulariesByStatus(userId, lesson, true)
        //   .then((result) => {
        //     this.rememberedCountMap[lesson.lesson_id] = result?.length || 0;
        //   })
        //   .catch((err) => {
        //     console.error(`❌ Lỗi khi lấy vocab cho lesson ${lesson.lesson_id}`, err);
        //     this.rememberedCountMap[lesson.lesson_id] = 0;
        //   });

        // promises.push(p);
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
