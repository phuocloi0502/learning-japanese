import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  VocabularyService,
  Chapter,
  Lesson,
  VocabularyItem,
} from '../../services/vocabulary.service';
import { RubyPipe } from '../../common/pipes/ruby-pipe';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-vocabulary-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, RubyPipe],
  templateUrl: './vocabulary-detail.component.html',
  styleUrl: './vocabulary-detail.component.css',
})
export class VocabularyDetailComponent implements OnInit {
  level = '';
  chapterNumber = 0;
  lessonNumber = 0;

  chapter: Chapter | null = null;
  lesson: Lesson | null = null;
  vocabularyList: VocabularyItem[] = [];

  remembered: number = 0;
  isAuthenticated = false;

  // Sidebar data
  allChapters: Chapter[] = [];

  // Audio management
  currentAudio: HTMLAudioElement | null = null;
  currentPlayingId: string | null = null;

  fullAudio: string = '';
  fullAudioElement: HTMLAudioElement | null = null;
  isFullPlaying: boolean = false;
  isLoading = false;
  error = '';

  private destroy$ = new Subject<void>();
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vocabularyService: VocabularyService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private databaseService: DatabaseService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.level = params['level'];
      this.chapterNumber = +params['chapter'];
      this.lessonNumber = +params['lesson'];

      if (this.level && this.chapterNumber && this.lessonNumber) {
        this.loadVocabularyDetail();
      }
      //this.fullAudio = `https://cloud.jtest.net/tango/sound/${this.level.toLowerCase()}/section/Chapter${this.chapterNumber}Section${this.lessonNumber}.mp3`
      this.fullAudio = `https://cloud.jtest.net/tango/sound/${this.level.toLowerCase()}/section/Chapter${
        this.chapterNumber
      }Section${this.lessonNumber}.mp3`;
      this.fullAudioElement = new Audio(this.fullAudio);

      // Check authentication
      this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
        this.isAuthenticated = !!user;
        if (user) {
          const userId = this.authService.getUserId();
          if (!userId) return;
        }
      });
    });
  }

  async loadVocabularyDetail() {
    this.isLoading = true;
    this.error = '';
    this.vocabularyList = [];

    this.vocabularyService.getVocabularyData(this.level).subscribe({
      next: async (chapters: Chapter[]) => {
        //console.log(`✅ Data received for ${this.level}:`, chapters);

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

        this.vocabularyList = this.lesson.vocabularyList;
        this.allChapters = chapters; // Store all chapters for sidebar
        //console.log(`📚 Loaded ${this.vocabularyList.length} vocabulary items`);
        this.isLoading = false;
        this.fullAudio = `https://cloud.jtest.net/tango/sound/${this.level.toLowerCase()}/section/Chapter${
          this.chapterNumber
        }Section${this.lessonNumber}.mp3`;

        // if (!this.isAuthenticated) {
        //   // this.router.navigate(['/login']);
        //   return;
        // }

        if (!this.lesson) return;

        const userId = this.authService.getUserId();

        if (!userId) return;
        const result = await this.databaseService.getVocabulariesByStatus(
          userId,
          this.lesson,
          true
        );
        this.remembered = result?.length;
        this.cdr.detectChanges();
      },
      error: (error) => {
        //console.error(`❌ Error loading vocabulary detail:`, error);
        this.error = 'Không thể tải dữ liệu từ vựng. Vui lòng thử lại.';
        this.isLoading = false;
      },
    });
  }

  playFullAudio() {
    if (!this.fullAudio) return;

    const audioId = 'audio_full';

    // // Nếu đang play fullAudio → pause/resume
    // if (this.currentPlayingId === audioId && this.currentAudio) {
    //   if (this.currentAudio.paused) {
    //     this.currentAudio.play().catch(err => console.error('Error resume full audio:', err));
    //   } else {
    //     this.currentAudio.pause();
    //   }
    //   return;
    // }

    // Ngừng audio hiện tại (bao gồm cả audio từ vựng riêng)
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentPlayingId = null;
      this.isFullPlaying = false;
    }

    // Nếu chưa tạo element thì tạo
    if (!this.fullAudioElement) {
      this.fullAudioElement = new Audio(this.fullAudio);
      this.fullAudioElement.addEventListener('ended', () => {
        this.fullAudioElement = null;
      });
    }

    if (this.fullAudioElement.paused) {
      this.fullAudioElement.play().catch((err) => console.error('Error play full audio:', err));
      this.isFullPlaying = true;
    } else {
      this.fullAudioElement.pause(); // chỉ pause, không reset
      this.isFullPlaying = false;
    }

    // // Reset khi end
    // this.currentAudio.addEventListener('ended', () => {
    //   this.currentAudio = null;
    //   this.currentPlayingId = null;
    // });
  }

  goBack() {
    this.router.navigate(['/vocabulary']);
  }

  playAudio(soundUrl: string, vocabularyId: number) {
    if (!soundUrl) return;
    // Nếu full audio đang chạy → chỉ pause
    if (this.fullAudioElement && !this.fullAudioElement.paused) {
      this.fullAudioElement.pause();
      this.isFullPlaying = false;
    }

    const audioId = `audio_${vocabularyId}`;

    // If clicking the same audio that's currently playing, pause/resume it
    if (this.currentPlayingId === audioId && this.currentAudio) {
      if (this.currentAudio.paused) {
        this.currentAudio.play().catch((error) => {
          /// console.error('Error resuming audio:', error);
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

    // Reset audio to beginning
    this.currentAudio.currentTime = 0;

    // Play the audio
    this.currentAudio.play().catch((error) => {
      //console.error('Error playing audio:', error);
      this.currentAudio = null;
      this.currentPlayingId = null;
    });

    // Handle audio end
    this.currentAudio.addEventListener('ended', () => {
      this.currentAudio = null;
      this.currentPlayingId = null;
    });

    // Handle audio error
    this.currentAudio.addEventListener('error', () => {
      //console.error('Audio error for:', soundUrl);
      this.currentAudio = null;
      this.currentPlayingId = null;
    });
  }

  isAudioPlaying(vocabularyId: number): boolean {
    return (
      this.currentPlayingId === `audio_${vocabularyId}` &&
      this.currentAudio !== null &&
      !this.currentAudio.paused
    );
  }

  getAudioButtonText(vocabularyId: number): string {
    if (this.isAudioPlaying(vocabularyId)) {
      return '⏸️';
    }
    return '🔊';
  }
}
