import { Injectable } from '@angular/core';
import { ref, set, get, onValue, off } from '@angular/fire/database';
import { Observable, BehaviorSubject } from 'rxjs';
import { FirebaseService } from './firebase.service';

export interface VocabularyStatus {
  [vocabularyId: number]: boolean; // true = remembered, false = not remembered
}

export interface LessonStatus {
  [lessonId: number]: VocabularyStatus;
}

export interface UserVocabularyData {
  [lessonId: number]: VocabularyStatus;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private database: any;

  constructor(private firebaseService: FirebaseService) {
    this.database = this.firebaseService.getDatabase();
  }

  /**
   * Save vocabulary status for a user
   * Structure: vocabulary_status/[user_id]/lesson_id/vocabulary_id/{status: true/false}
   */
  async saveVocabularyStatus(
    userId: string,
    lessonId: number,
    vocabularyId: number,
    status: boolean
  ): Promise<void> {
    try {
      if (!this.database) {
        console.error('Database not initialized');
        throw new Error('Database not initialized');
      }

      const path = `vocabulary_status/${userId}/${lessonId}/${vocabularyId}`;
      const statusRef = ref(this.database, path);

      console.log(`🔄 Saving vocabulary status:`, {
        path,
        userId,
        lessonId,
        vocabularyId,
        status,
      });

      await set(statusRef, status);
      console.log(
        `✅ Successfully saved vocabulary status: ${vocabularyId} = ${status} for user ${userId}`
      );
    } catch (error) {
      console.error('❌ Error saving vocabulary status:', error);
      throw error;
    }
  }

  /**
   * Get vocabulary status for a specific lesson
   */
  async getLessonVocabularyStatus(userId: string, lessonId: number): Promise<VocabularyStatus> {
    try {
      const statusRef = ref(this.database, `vocabulary_status/${userId}/${lessonId}`);
      const snapshot = await get(statusRef);

      if (snapshot.exists()) {
        return snapshot.val() as VocabularyStatus;
      }
      return {};
    } catch (error) {
      console.error('Error getting lesson vocabulary status:', error);
      throw error;
    }
  }
  /**
   * Lấy danh sách vocabulary theo trạng thái (true = đã nhớ, false = chưa nhớ/chưa có trong DB)
   */
  async getVocabulariesByStatus(
    userId: string,
    lesson: { lesson_id: number; vocabularyList: any[] },
    status: boolean
  ): Promise<any[]> {
    try {
      const vocabStatus = await this.getLessonVocabularyStatus(userId, lesson.lesson_id);

      return lesson.vocabularyList.filter((vocab) => {
        const currentStatus = vocabStatus[vocab.vocabulary_id];

        if (status === true) {
          // Đã nhớ
          return currentStatus === true;
        } else {
          // Chưa nhớ = false hoặc chưa có trong DB
          return currentStatus === false || currentStatus === undefined;
        }
      });
    } catch (error) {
      console.error('❌ Lỗi khi lấy vocabularies theo trạng thái:', error);
      return [];
    }
  }

  /**
   * Get all vocabulary status for a user
   */
  async getUserVocabularyStatus(userId: string): Promise<UserVocabularyData> {
    try {
      const statusRef = ref(this.database, `vocabulary_status/${userId}`);
      const snapshot = await get(statusRef);

      if (snapshot.exists()) {
        return snapshot.val() as UserVocabularyData;
      }
      return {};
    } catch (error) {
      console.error('Error getting user vocabulary status:', error);
      throw error;
    }
  }
  /**
   * Get  vocabulary status by vocabularyId for a user
   */
  async getStatusVocById(
    userId: string,
    lessonId: number,
    vocabularyId: number
  ): Promise<boolean | null> {
    try {
      const path = `vocabulary_status/${userId}/${lessonId}/${vocabularyId}`;
      const statusRef = ref(this.database, path);

      const snapshot = await get(statusRef);

      if (snapshot.exists()) {
        return snapshot.val(); // true | false
      } else {
        return null; // chưa có dữ liệu
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy trạng thái từ vựng:', error);
      return null;
    }
  }

  /**
   * Listen to vocabulary status changes for a specific lesson
   */
  listenToLessonVocabularyStatus(userId: string, lessonId: number): Observable<VocabularyStatus> {
    const statusRef = ref(this.database, `vocabulary_status/${userId}/${lessonId}`);
    const subject = new BehaviorSubject<VocabularyStatus>({});

    onValue(statusRef, (snapshot: any) => {
      if (snapshot.exists()) {
        subject.next(snapshot.val() as VocabularyStatus);
      } else {
        subject.next({});
      }
    });

    return subject.asObservable();
  }

  /**
   * Listen to all vocabulary status changes for a user
   */
  listenToUserVocabularyStatus(userId: string): Observable<UserVocabularyData> {
    const statusRef = ref(this.database, `vocabulary_status/${userId}`);
    const subject = new BehaviorSubject<UserVocabularyData>({});

    onValue(statusRef, (snapshot: any) => {
      if (snapshot.exists()) {
        subject.next(snapshot.val() as UserVocabularyData);
      } else {
        subject.next({});
      }
    });

    return subject.asObservable();
  }

  /**
   * Get statistics for a user
   */
  async getUserStatistics(userId: string): Promise<{
    totalVocabulary: number;
    rememberedVocabulary: number;
    notRememberedVocabulary: number;
    progressPercentage: number;
  }> {
    try {
      const userData = await this.getUserVocabularyStatus(userId);

      let totalVocabulary = 0;
      let rememberedVocabulary = 0;
      let notRememberedVocabulary = 0;

      for (const lessonId in userData) {
        const lessonStatus = userData[lessonId];
        for (const vocabularyId in lessonStatus) {
          totalVocabulary++;
          if (lessonStatus[vocabularyId]) {
            rememberedVocabulary++;
          } else {
            notRememberedVocabulary++;
          }
        }
      }

      const progressPercentage =
        totalVocabulary > 0 ? (rememberedVocabulary / totalVocabulary) * 100 : 0;

      return {
        totalVocabulary,
        rememberedVocabulary,
        notRememberedVocabulary,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up listeners (call this in ngOnDestroy)
   */
  cleanupListeners(): void {
    // Note: In a real app, you'd want to track and clean up specific listeners
    // For now, this is a placeholder
    console.log('Cleaning up database listeners');
  }
  /**
   * Lấy danh sách vocabularyId có trạng thái == status (true/false)
   */
  async getRememberedVocabulary(
    userId: string,
    lessonId: number | string,
    status: boolean
  ): Promise<string[]> {
    const path = `vocabulary_status/${userId}/${lessonId}`;
    const statusRef = ref(this.database, path);

    try {
      const snapshot = await get(statusRef);
      if (!snapshot.exists()) {
        return []; // không có dữ liệu
      }

      const data = snapshot.val() as Record<string, any>; // giá trị có thể boolean hoặc object
      return Object.keys(data).filter((vocabId) => {
        const val = data[vocabId];
        // Hỗ trợ cả trường hợp lưu trực tiếp boolean, hoặc object có trường `learned`/`learn`
        if (typeof val === 'boolean') return val === status;
        if (val && typeof val === 'object') {
          if ('learned' in val) return !!val.learned === status;
          if ('learn' in val) return !!val.learn === status;
          // fallback: nếu object chứa giá trị boolean trực tiếp
          // ignore otherwise
        }
        return false;
      });
    } catch (err) {
      console.error('Error reading vocabulary status from DB:', err);
      throw err;
    }
  }
}
