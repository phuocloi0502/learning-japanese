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
    try {
      this.vocabularyList = await this.vocabularyService.getVocabularyByLesson1(
        this.level,
        this.chapterNumber - 1,
        this.lessonNumber - 1
      );
      console.log('📚 Loaded vocabulary list:', this.vocabularyList);

      this.allChapters = await this.vocabularyService.getVocabularyData1(this.level);
      this.isLoading = false;
      this.fullAudio = `https://cloud.jtest.net/tango/sound/${this.level.toLowerCase()}/section/Chapter${
        this.chapterNumber
      }Section${this.lessonNumber}.mp3`;
      const userId = this.authService.getUserId();

      // if (!userId) return;
      // const result = await this.databaseService.getVocabulariesByStatus(userId, this.lessonNumber);
      // this.remembered = result?.length || 0;
      this.cdr.detectChanges();
    } catch (error) {
      this.error = 'Không thể tải dữ liệu từ vựng. Vui lòng thử lại.';
    }
  }

  playFullAudio() {
    if (!this.fullAudio) return;

    const audioId = 'audio_full';

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
