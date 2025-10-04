import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VocabularyService, Chapter, Lesson } from '../../services/vocabulary.service';
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
  isLoading = false;
  error = '';

  remembered = 0;
  rememberedCountMap: { [lessonId: number]: number } = {};

  constructor(
    private vocabularyService: VocabularyService,
    private cdr: ChangeDetectorRef,
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
      this.chapters = await this.vocabularyService.getVocabularyData(this.selectedLevel);
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
  async loadRememberedCounts(): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) return;
    const tasks = this.chapters.flatMap((chapter) =>
      chapter.lessonList.map(async (lesson) => {
        const result = await this.vocabularyService.getRememberedVocabulary(
          userId,
          lesson.lesson_id
        );
        this.rememberedCountMap[lesson.lesson_id] = result?.length || 0;
      })
    );

    await Promise.all(tasks);
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
