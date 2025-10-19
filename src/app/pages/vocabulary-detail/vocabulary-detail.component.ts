import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  VocabularyService,
  Chapter,
  Lesson,
  VocabularyItem,
  VocabularyItemWithIndex,
} from '../../services/vocabulary.service';
import { RubyPipe } from '../../common/pipes/ruby-pipe';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';
import { FormControl, FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../components/dialog/dialog.component';

@Component({
  selector: 'app-vocabulary-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, RubyPipe, FormsModule],
  templateUrl: './vocabulary-detail.component.html',
  styleUrl: './vocabulary-detail.component.css',
})
export class VocabularyDetailComponent implements OnInit {
  level = '';
  chapterNumber = 0;
  lessonNumber = 0;

  chapter: Chapter | null = null;
  lesson: Lesson | null = null;
  vocabularyList: VocabularyItemWithIndex[] = [];
  originalVocabularyList: VocabularyItemWithIndex[] = [];

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
  // Edit mode
  isAdmin: boolean = false;
  isAdminMode: boolean = false;
  isEditMode: boolean = false;
  editingVocabularyItem: VocabularyItemWithIndex | null = null;
  private destroy$ = new Subject<void>();
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vocabularyService: VocabularyService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.level = params['level'];
      this.chapterNumber = +params['chapter'];
      this.lessonNumber = +params['lesson'];

      if (this.level && this.chapterNumber && this.lessonNumber) {
        this.loadVocabularyDetail();
      }
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
          this.isAdmin = this.authService.isAdmin();
          this.cdr.detectChanges();
        }
      });
    });
  }

  async loadVocabularyDetail() {
    this.isLoading = true;
    this.error = '';
    this.vocabularyList = [];
    this.originalVocabularyList = [];
    try {
      this.lesson = await this.vocabularyService.getVocabularyByLesson(
        this.level,
        this.chapterNumber - 1,
        this.lessonNumber - 1
      );
      if (this.lesson) {
        this.vocabularyList = this.lesson.vocabularyList.map((item, index) => ({
          ...item,
          index: index,
        }));
        this.originalVocabularyList = JSON.parse(JSON.stringify(this.vocabularyList));
        //console.log(this.vocabularyList);
      } else {
        this.vocabularyList = [];
      }
      this.allChapters = await this.vocabularyService.getVocabularyData(this.level);
      if (this.allChapters) {
        this.chapter = this.allChapters[this.chapterNumber - 1];
      }

      const rememberedList = await this.vocabularyService.getRememberedVocabulary(
        this.authService.getUserId() || '',
        this.lesson ? this.lesson.lesson_id : 0
      );
      this.remembered = rememberedList.length || 0;
      this.isLoading = false;
      this.fullAudio = `https://cloud.jtest.net/tango/sound/${this.level.toLowerCase()}/section/Chapter${
        this.chapterNumber
      }Section${this.lessonNumber}.mp3`;
      const userId = this.authService.getUserId();
      this.cdr.detectChanges();
    } catch (error) {
      this.error = 'Không thể tải dữ liệu từ vựng. Vui lòng thử lại.';
    }
  }
  openConfirm(vocab: VocabularyItemWithIndex, action: 'save' | 'rollback') {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: action === 'save' ? 'Confirm edit' : 'Confirm rollback',
        message:
          action === 'save'
            ? 'Are you sure you want to save changes to this vocabulary?'
            : 'Are you sure you want to rollback this vocabulary to the original data?',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      if (action === 'save') {
        this.handleSave(vocab);
      } else if (action === 'rollback') {
        this.handleRollback(vocab);
      }
    });
  }
  trackById(index: number, item: VocabularyItemWithIndex) {
    return item.vocabulary_id;
  }

  async handleSave(vocab: VocabularyItemWithIndex) {
    await this.vocabularyService.saveVocabularyDetail(
      this.level,
      this.chapterNumber - 1,
      this.lessonNumber - 1,
      vocab
    );

    // Cập nhật item trong danh sách
    const index = this.vocabularyList.findIndex((v) => v.index === vocab.index);
    if (index !== -1) {
      this.vocabularyList[index] = { ...this.vocabularyList[index], ...vocab };
      this.vocabularyList = [...this.vocabularyList];
    }
    this.originalVocabularyList = JSON.parse(JSON.stringify(this.vocabularyList));
    this.isEditMode = false;
    this.editingVocabularyItem = null;
    this.cdr.detectChanges();

    //  this.loadVocabularyDetail();
  }

  handleAdminMode() {
    this.isAdminMode = !this.isAdminMode;
    this.cdr.detectChanges();
  }

  setEditMode(vocab?: VocabularyItemWithIndex) {
    this.isEditMode = true;
    this.editingVocabularyItem = vocab || null;
    this.cdr.detectChanges();
  }
  handleCancel() {
    this.vocabularyList = JSON.parse(JSON.stringify(this.originalVocabularyList));
    this.isEditMode = false;
    this.editingVocabularyItem = null;
    this.cdr.detectChanges();
  }
  handleOpenSaveConfirm(vocab: VocabularyItemWithIndex) {
    this.openConfirm(vocab, 'save');
  }
  handleOpenRollBackConfirm(vocab: VocabularyItemWithIndex) {
    this.openConfirm(vocab, 'rollback');
  }
  async handleRollback(vocab: VocabularyItemWithIndex) {
    await this.vocabularyService.rollBackVocabularyDetail(
      this.level,
      this.chapterNumber - 1,
      this.lessonNumber - 1,
      vocab
    );
    this.loadVocabularyDetail();
  }

  // ngOnDestroy() {
  //   this.destroy$.next();
  //   this.destroy$.complete();
  // }
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
    this.currentAudio.onended = () => {
      this.currentAudio = null;
      this.currentPlayingId = null;
      this.cdr.detectChanges(); // Cập nhật lại UI để getAudioButtonText đổi trạng thái
    };

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
  @HostListener('document:keydown.enter', ['$event'])
  onEnterPressed(event: any) {
    if (this.dialog.openDialogs.length > 0) return;
    const target = event.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'button') return;
    if (this.isEditMode && this.editingVocabularyItem) {
      this.handleOpenSaveConfirm(this.editingVocabularyItem);
    }
  }
}
