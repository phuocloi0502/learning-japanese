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
import { RubyPipe } from '../../common/pipes/ruby-pipe';
import { ensureAuthenticated } from '../../common/utils/helpers';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FormsModule, RubyPipe],
  templateUrl: './flashcard.component.html',
  styleUrl: './flashcard.component.css',
})
export class FlashcardComponent implements OnInit, OnDestroy {
  level = '';
  chapterNumber = 0;
  lessonNumber = 0;
  isEnd = false;

  chapter: Chapter | null = null;
  lesson: Lesson | null = null;
  vocabularyList: VocabularyItem[] = [];

  // Flash card state
  currentIndex = 0;
  showAnswer = false;

  // User progress
  userProgress: { [vocabularyId: number]: boolean } = {};

  // Statistics
  totalCards = 0;
  totalCardsOfLesson = 0;
  totalCardsCurrent = 0;
  rememberedCards = 0;
  notRememberedCards = 0;

  rememberedList: number[] = [];
  notRememberedList: number[] = [];

  isLoading = false;
  error = '';
  isAuthenticated = false;
  // Audio management
  currentAudio: HTMLAudioElement | null = null;
  currentPlayingId: string | null = null;

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
    this.loadUserProgress();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  filterMode: 'all' | 'remembered' | 'notRemembered' = 'all'; // mặc định là all

  setFilterMode(mode: 'all' | 'remembered' | 'notRemembered') {
    this.filterMode = mode;
    this.cdr.detectChanges();
    // if (mode === 'all') {
    //   this.vocabularyList = this.lesson.vocabularyList;
    // } else {
    //   this.listRememberedVocabulary(mode === 'remembered');
    // }
  }

  loadLessonData() {
    this.setFilterMode('all');
    this.isLoading = true;
    this.error = '';
    this.isEnd = false;

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

        //this.vocabularyList = [...this.lesson.vocabularyList];
        this.vocabularyList = this.shuffleVocabularyList(this.lesson.vocabularyList);
        this.totalCardsOfLesson = this.lesson.vocabularyList.length;
        this.totalCardsCurrent = this.totalCardsOfLesson;
        this.currentIndex = 0;
        this.showAnswer = false;
        this.updateStatistics();
        if (!this.lesson) return;

        const userId = ensureAuthenticated(this.authService, this.router);
        if (!userId) return;
        const result = await this.databaseService.getVocabulariesByStatus(
          userId,
          this.lesson,
          true
        );
        this.rememberedCards = result?.length;
        this.notRememberedCards = this.totalCardsOfLesson - this.rememberedCards;
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

  async loadUserProgress() {
    if (!this.isAuthenticated || !this.lesson) return;

    const userId = this.authService.getUserId();
    if (!userId) return;

    // Load progress for current lesson only
    this.databaseService
      .getLessonVocabularyStatus(userId, this.lesson.lesson_id)
      .then((status) => {
        this.userProgress = status;
        this.updateStatistics();
      })
      .catch((error) => {
        //console.error('Error loading user progress:', error);
      });
  }

  toggleAnswer() {
    this.showAnswer = !this.showAnswer;
  }

  async listRememberedVocabulary(status: boolean) {
    const userId = ensureAuthenticated(this.authService, this.router);
    if (!userId) return;

    if (!this.lesson) return;
    this.isEnd = false;

    const result = await this.databaseService.getVocabulariesByStatus(userId, this.lesson, status);

    if (status) {
      this.setFilterMode('remembered');
      this.rememberedList = result.map((v) => v.vocabulary_id);
      this.vocabularyList = this.lesson.vocabularyList.filter((v) =>
        this.rememberedList.includes(v.vocabulary_id)
      );
      this.vocabularyList = this.shuffleVocabularyList(this.vocabularyList);
      this.totalCardsCurrent = this.vocabularyList.length;
      this.currentIndex = 0;
      this.cdr.detectChanges();
      //console.log('✅ Danh sách đã nhớ:', this.vocabularyList);
    } else {
      this.setFilterMode('notRemembered');
      this.notRememberedList = result.map((v) => v.vocabulary_id);
      this.vocabularyList = this.lesson.vocabularyList.filter((v) =>
        this.notRememberedList.includes(v.vocabulary_id)
      );
      this.vocabularyList = this.shuffleVocabularyList(this.vocabularyList);
      this.totalCardsCurrent = this.vocabularyList.length;
      this.currentIndex = 0;
      this.cdr.detectChanges();
      //console.log('❌ Danh sách chưa nhớ:', this.vocabularyList);
    }

    this.cdr.detectChanges();
  }

  markAsRemembered() {
    const userId = ensureAuthenticated(this.authService, this.router);
    if (!userId) return;

    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab || !this.lesson) return;
    // Save to database
    this.databaseService
      .saveVocabularyStatus(userId, this.lesson.lesson_id, currentVocab.vocabulary_id, true)
      .then(() => {
        this.userProgress[currentVocab.vocabulary_id] = true;
        this.updateStatistics();
        this.nextCard();
        this.cdr.detectChanges();
        //console.log(this.currentIndex);
      })
      .catch((error) => {
        //console.error('Error saving vocabulary status:', error);
      });
  }

  markAsNotRemembered() {
    const userId = ensureAuthenticated(this.authService, this.router);
    if (!userId) return;
    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab || !this.lesson) return;
    if (!userId) return;

    // Save to database
    this.databaseService
      .saveVocabularyStatus(userId, this.lesson.lesson_id, currentVocab.vocabulary_id, false)
      .then(() => {
        this.userProgress[currentVocab.vocabulary_id] = false;
        this.updateStatistics();
        this.nextCard();
        this.cdr.detectChanges();
      })
      .catch((error) => {
        //console.error('Error saving vocabulary status:', error);
      });
  }

  nextCard() {
    // Stop audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentPlayingId = null;
    }
    if (this.currentIndex < this.vocabularyList.length - 1) {
      this.currentIndex++;
      this.showAnswer = false;
    } else {
      this.isEnd = true;
    }
  }

  previousCard() {
    // Stop audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentPlayingId = null;
    }
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.showAnswer = false;
    }
  }

  shuffleVocabularyList(list: VocabularyItem[]): VocabularyItem[] {
    const arr = [...list]; // tạo bản sao, không ảnh hưởng list gốc
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  getCurrentVocabulary(): VocabularyItem | null {
    if (this.vocabularyList.length === 0) return null;
    return this.vocabularyList[this.currentIndex];
  }

  updateStatistics() {
    this.rememberedCards = Object.values(this.userProgress).filter(
      (status) => status === true
    ).length;
    this.notRememberedCards = this.totalCardsOfLesson - this.rememberedCards;
  }

  getProgressPercentage(): number {
    if (this.totalCardsOfLesson === 0) return 0;
    return Math.round((this.rememberedCards / this.totalCardsOfLesson) * 100);
  }

  isCurrentVocabularyRemembered(): boolean {
    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab) return false;
    return this.userProgress[currentVocab.vocabulary_id] === true;
  }

  isCurrentVocabularyNotRemembered(): boolean {
    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab) return false;
    return this.userProgress[currentVocab.vocabulary_id] === false;
  }

  goToVocabulary() {
    this.router.navigate(['/vocabulary']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
  isAudioPlaying(): boolean {
    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab) return false;
    return (
      this.currentPlayingId === `audio_${currentVocab.vocabulary_id}` &&
      this.currentAudio !== null &&
      !this.currentAudio.paused
    );
  }
  getAudioButtonText(): string {
    if (this.isAudioPlaying()) {
      return '⏸️';
    }
    return '🔊';
  }
  playAudio() {
    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab) return;
    const soundUrl = currentVocab.sound_url;
    const vocabularyId = currentVocab.vocabulary_id;
    if (!soundUrl) return;
    const audioId = `audio_${vocabularyId}`;

    // If clicking the same audio that's currently playing, pause/resume it
    if (this.currentPlayingId === audioId && this.currentAudio) {
      if (this.currentAudio.paused) {
        this.currentAudio.play().catch((error) => {
          //console.error('Error resuming audio:', error);
        });
      } else {
        this.currentAudio.pause();
      }
      return;
    }

    // Stop current audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    // Create new audio and play
    this.currentAudio = new Audio(soundUrl);
    this.currentPlayingId = audioId;
    this.currentAudio.currentTime = 0;

    // Play the audio
    this.currentAudio.play().catch((error) => {
      //console.error('Error playing audio:', error);
      this.currentAudio = null;
      this.currentPlayingId = null;
      this.cdr.detectChanges();
    });

    // Handle audio end
    this.currentAudio.onended = () => {
      this.currentAudio = null;
      this.currentPlayingId = null;
      this.cdr.detectChanges(); // Cập nhật lại UI để getAudioButtonText đổi trạng thái
    };

    // Handle audio error
    this.currentAudio.onerror = () => {
      //console.error('Audio error for:', soundUrl);
      this.currentAudio = null;
      this.currentPlayingId = null;
      this.cdr.detectChanges();
    };
  }
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.nextCard();
    } else if (event.key === 'ArrowLeft') {
      this.previousCard();
    } else if (event.key === ' ') {
      this.toggleAnswer();
      event.preventDefault(); // ngăn chặn cuộn trang khi nhấn Space
    }
  }
}
