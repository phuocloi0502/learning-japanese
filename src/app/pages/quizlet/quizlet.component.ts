import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  VocabularyService,
  Chapter,
  Lesson,
  VocabularyItem,
} from '../../services/vocabulary.service';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { ensureAuthenticated } from '../../common/utils/helpers';
export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}
export interface VocabularyItemWithOptions extends VocabularyItem {
  options: AnswerOption[];
}
@Component({
  selector: 'app-quizlet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quizlet.component.html',
  styleUrls: ['./quizlet.component.css'],
})
export class QuizletComponent implements OnInit, OnDestroy {
  level = '';
  chapterNumber = 0;
  lessonNumber = 0;

  chapter: Chapter | null = null;
  lesson: Lesson | null = null;
  vocabularyList: VocabularyItemWithOptions[] = [];

  isLoading = false;
  error = '';
  isAuthenticated = false;

  //quizlet
  userAnswers: { [questionIndex: number]: number } = {};
  showCorrectAnswers: boolean = false;
  notCorrectAnswers: number[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private vocabularyService: VocabularyService,
    private authService: AuthService,
    private databaseService: DatabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Luôn scroll lên đầu trang khi vào component
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Get route parameters
    this.route.params.subscribe((params: any) => {
      this.level = params['level'];
      this.chapterNumber = +params['chapter'];
      this.lessonNumber = +params['lesson'];

      if (this.level && this.chapterNumber && this.lessonNumber) {
        this.loadLessonData();
      }
    });

    // Check authentication
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isAuthenticated = !!user;
      if (user) {
      }
    });
    const userId = ensureAuthenticated(this.authService, this.router);
    if (!userId) return;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLessonData() {
    this.isLoading = true;
    this.error = '';
    this.showCorrectAnswers = false;
    this.userAnswers = {};
    this.notCorrectAnswers = [];

    this.vocabularyService.getVocabularyData(this.level).subscribe({
      next: async (chapters: Chapter[]) => {
        // Find the specific chapter
        this.chapter = chapters.find((c) => c.chapter_number === this.chapterNumber) || null;

        if (!this.chapter) {
          this.error = `Không tìm thấy chương ${this.chapterNumber} trong cấp độ ${this.level}`;
          this.isLoading = false;
          return;
        }

        // Find the specific lesson
        this.lesson =
          this.chapter.lessonList.find((l) => l.lesson_number === this.lessonNumber) || null;

        if (!this.lesson) {
          this.error = `Không tìm thấy bài ${this.lessonNumber} trong chương ${this.chapterNumber}`;
          this.isLoading = false;
          return;
        }
        //console.log('Lesson found:', this.lesson.vocabularyList);
        // this.createAnswerOptions(this.lesson.vocabularyList);
        this.vocabularyList = this.lesson.vocabularyList.map((item) => ({
          ...item,
          options: this.createAnswerOptions(item),
        }));
        this.vocabularyList = this.shuffleVocabularyList(this.vocabularyList);
        //this.vocabularyList = this.shuffleVocabularyList(this.lesson.vocabularyList);

        if (!this.lesson) return;

        const userId = ensureAuthenticated(this.authService, this.router);
        if (!userId) return;
        const result = await this.databaseService.getVocabulariesByStatus(
          userId,
          this.lesson,
          true
        );

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        //console.error('Error loading lesson data:', error);
        this.error = 'Không thể tải dữ liệu bài học';
        this.isLoading = false;
      },
    });
  }
  // Dùng cho vòng lặp ngoài (các câu hỏi)
  trackQuestion(index: number, item: any): number {
    return index;
  }
  // Dùng cho vòng lặp trong (các đáp án)
  trackOption(index: number, option: AnswerOption): string {
    return option.text; // hoặc option.id nếu có
  }

  onAnswerSelected(questionIndex: number, optionIndex: number) {
    this.userAnswers[questionIndex] = optionIndex;
    // Bạn có thể //console.log để kiểm tra:
    //console.log(`Câu ${questionIndex} chọn đáp án ${optionIndex}`);
    //console.log('Tất cả đáp án:', this.userAnswers);
  }
  getCorrectAnswers(): { [questionIndex: number]: number } {
    const correctAnswers: { [questionIndex: number]: number } = {};
    this.vocabularyList.forEach((vocab, index) => {
      const correctOptionIndex = vocab.options.findIndex((option) => option.isCorrect);
      correctAnswers[index] = correctOptionIndex;
    });
    return correctAnswers;
  }

  createAnswerOptions(vocabulary: VocabularyItem): AnswerOption[] {
    const options: AnswerOption[] = [{ text: vocabulary.meaning, isCorrect: true }];
    const allMeanings =
      this.lesson?.vocabularyList
        .filter((v) => v.vocabulary_id !== vocabulary.vocabulary_id)
        .map((v) => v.meaning) || [];
    while (options.length < 4 && allMeanings.length > 0) {
      const randomIndex = Math.floor(Math.random() * allMeanings.length);
      const randomMeaning = allMeanings.splice(randomIndex, 1)[0];
      options.push({ text: randomMeaning, isCorrect: false });
    }
    return this.shuffleVocabularyListOptions(options);
  }

  checkAnswer(): number {
    window.scrollTo({ top: 0, behavior: 'auto' });

    this.showCorrectAnswers = true;
    this.notCorrectAnswers = [];
    const correctAnswers = this.getCorrectAnswers();
    let score = 0;
    for (const questionIndex in correctAnswers) {
      if (correctAnswers[questionIndex] === this.userAnswers[questionIndex]) {
        score++;
      } else {
        this.notCorrectAnswers.push(+questionIndex);
      }
    }
    //console.log('Câu sai:', this.notCorrectAnswers);
    //console.log(`Điểm của bạn: ${score}/${this.vocabularyList.length}`);
    return score;
  }
  isWrongAnswer(index: number): boolean {
    return this.showCorrectAnswers && this.notCorrectAnswers.includes(index);
  }
  isCorrectOption(qIndex: number, optIndex: number): boolean {
    return this.showCorrectAnswers && this.vocabularyList[qIndex].options[optIndex].isCorrect;
  }

  isWrongOption(qIndex: number, optIndex: number): boolean {
    return (
      this.showCorrectAnswers &&
      this.userAnswers[qIndex] === optIndex &&
      !this.vocabularyList[qIndex].options[optIndex].isCorrect
    );
  }

  shuffleVocabularyListOptions(list: AnswerOption[]): AnswerOption[] {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  shuffleVocabularyList(list: VocabularyItemWithOptions[]): VocabularyItemWithOptions[] {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
