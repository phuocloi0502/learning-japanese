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
import { RubyPipe } from '../../common/pipes/ruby-pipe';
import { ensureAuthenticated } from '../../common/utils/helpers';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FormsModule, RubyPipe],
  templateUrl: './flashcard_chapter.component.html',
  styleUrl: './flashcard_chapter.component.css',
})
export class FlashcardChapterComponent implements OnInit, OnDestroy {
  level = '';
  chapterNumber = 0;
  lessonNumber = 0;
  isEnd = false;
  allChapters: Chapter[] = [];
  chapter: Chapter | null = null;
  vocabularyChapterList: VocabularyItem[] = [];
  vocabularyCurrentList: VocabularyItem[] = [];
  showFurigana = false;
  isMeansMode = false;
  // Flash card state
  currentIndex = 0;
  showAnswer = false;
  baseFuriganaState = false;

  // User progress
  userProgress: { [vocabularyId: number]: boolean } = {};

  // Statistics
  totalCards = 0;
  totalCardsOfChapter = 0;
  totalCardsCurrent = 0;
  rememberedCards = 0;
  notRememberedCards = 0;

  rememberedList: Number[] = [];
  notRememberedList: Number[] = [];

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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.route.params.subscribe((params: any) => {
      this.level = params['level'];
      this.chapterNumber = +params['chapter'];
      this.lessonNumber = +params['lesson'];

      if (this.level && this.chapterNumber) {
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
  filterMode: 'all' | 'remembered' | 'notRemembered' = 'all';

  setFilterMode(mode: 'all' | 'remembered' | 'notRemembered') {
    this.filterMode = mode;
    this.cdr.detectChanges();
  }

  async loadLessonData() {
    this.setFilterMode('all');
    this.isLoading = true;
    this.error = '';
    this.isEnd = false;

    this.allChapters = await this.vocabularyService.getVocabularyData(this.level);

    try {
      this.allChapters = await this.vocabularyService.getVocabularyData(this.level);
      this.vocabularyChapterList = this.allChapters[this.chapterNumber - 1].lessonList.flatMap(
        (lesson) => lesson.vocabularyList
      );
      //console.log(this.vocabularyChapterList);
      // if (this.allChapters) {
      //   this.chapter = this.allChapters[this.chapterNumber - 1];
      // }

      this.vocabularyCurrentList = this.shuffleVocabularyList(this.vocabularyChapterList);
      this.totalCardsOfChapter = this.vocabularyChapterList.length;
      this.totalCardsCurrent = this.totalCardsOfChapter;
      const userId = ensureAuthenticated(this.authService, this.router);
      if (!userId) return;
      await this.updateStatistics();
      this.currentIndex = 0;
      this.showAnswer = false;
      this.isLoading = false;
      this.cdr.detectChanges();
    } catch (error) {
      this.error = 'Không thể tải dữ liệu từ vựng. Vui lòng thử lại.';
    }
  }

  toggleAnswer() {
    this.showAnswer = !this.showAnswer;
  }
  async toggleMeans(event: Event) {
    await this.updateStatistics();
    const checkbox = event.target as HTMLInputElement;
    this.isMeansMode = checkbox.checked;
    this.vocabularyCurrentList = this.shuffleVocabularyList(this.vocabularyCurrentList);
    this.currentIndex = 0;
    if (this.showAnswer) {
      this.showAnswer = false;
    }
    this.cdr.detectChanges();
  }

  toggleFurigana(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    this.showFurigana = checkbox.checked;
    this.cdr.detectChanges();
  }

  async listRememberedVocabulary(status: boolean) {
    this.currentIndex = 0;
    try {
      if (status) {
        this.setFilterMode('remembered');
        this.vocabularyCurrentList = this.shuffleVocabularyList(
          this.vocabularyChapterList.filter((item) =>
            this.rememberedList.includes(item.vocabulary_id)
          )
        );
        this.totalCardsCurrent = this.vocabularyCurrentList.length;
      } else {
        this.setFilterMode('notRemembered');
        this.vocabularyCurrentList = this.shuffleVocabularyList(
          this.vocabularyChapterList.filter(
            (item) => !this.rememberedList.includes(item.vocabulary_id)
          )
        );
        this.totalCardsCurrent = this.vocabularyCurrentList.length;
      }
      this.isEnd = false;
      this.cdr.detectChanges();
    } catch (error) {
      this.error = 'Không thể tải dữ liệu từ vựng. Vui lòng thử lại.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async markAsRemembered() {
    const userId = ensureAuthenticated(this.authService, this.router);
    if (!userId) return;

    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab) return;
    this.vocabularyService
      .saveVocabularyChapterStatus(
        userId,
        this.level,
        this.chapterNumber,
        currentVocab.vocabulary_id
      )
      .then(async () => {
        await this.updateStatistics();
        this.nextCard();
        this.cdr.detectChanges();
      })
      .catch((error) => {});
  }

  async markAsNotRemembered() {
    const userId = ensureAuthenticated(this.authService, this.router);
    if (!userId) return;
    const currentVocab = this.getCurrentVocabulary();
    if (!currentVocab) return;
    this.vocabularyService
      .removeVocabularyChapterStatus(
        userId,
        this.level,
        this.chapterNumber,
        currentVocab.vocabulary_id
      )
      .then(async () => {
        await this.updateStatistics();

        this.nextCard();
        this.cdr.detectChanges();
      })
      .catch((error) => {});
  }

  nextCard() {
    // Stop audio if playing
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentPlayingId = null;
    }
    if (this.currentIndex < this.vocabularyCurrentList.length - 1) {
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
    if (this.vocabularyCurrentList.length === 0) return null;
    return this.vocabularyCurrentList[this.currentIndex];
  }

  async updateStatistics() {
    this.rememberedList = await this.vocabularyService.getRememberedVocabularyChapter(
      this.authService.getUserId() || '',
      this.level,
      this.chapterNumber
    );
    this.rememberedCards = this.rememberedList.length;
    this.notRememberedCards = this.totalCardsOfChapter - this.rememberedCards;
    this.getProgressPercentage();
  }

  getProgressPercentage(): number {
    if (this.totalCardsOfChapter === 0) return 0;
    return Math.round((this.rememberedCards / this.totalCardsOfChapter) * 100);
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
  goBack() {
    this.router.navigate([`/vocabulary`]);
  }
}
