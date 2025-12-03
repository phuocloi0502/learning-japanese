import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ref, set, get, remove } from '@angular/fire/database';
import { FirebaseService } from './firebase.service';

export interface VocabularyItem {
  lesson: string;
  vocabulary_id: number;
  kanji: string;
  furigana: string;
  meaning: string;
  example: string;
  example_meaning: string;
  sound_url: string;
  han: string;
}
export interface VocabularyItemWithIndex extends VocabularyItem {
  index: number;
  [key: string]: any;
}
export interface VocabularyItemWithOptions extends VocabularyItem {
  options: AnswerOption[];
}
export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

export interface Lesson {
  lesson_id: number;
  lesson_number: number;
  lesson_name: string;
  vocabularyList: VocabularyItem[];
}

export interface Chapter {
  chapter_number: number;
  chapter_name: string;
  level_id: string;
  lessonList: Lesson[];
}

@Injectable({
  providedIn: 'root',
})
export class VocabularyService {
  private database: any;

  constructor(private http: HttpClient, private firebaseService: FirebaseService) {
    this.database = this.firebaseService.getDatabase();
  }
  async saveVocabularyDetail(
    level: string,
    chapter: number,
    lessonNumber: number,
    vocabularyItem: VocabularyItemWithIndex
  ): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const { index, ...data } = vocabularyItem;
    const basePath = `vocabulary_data/${level}/${chapter}/lessonList/${lessonNumber}/vocabularyList/${index}`;
    const vocabRef = ref(this.database, basePath);

    try {
      // 1️⃣ Lấy dữ liệu hiện tại
      const snapshot = await get(vocabRef);
      const oldData = snapshot.exists() ? snapshot.val() : {};

      // 2️⃣ Tạo object backup chỉ cho những field chưa có _bk
      const dataWithBackup: Record<string, any> = {};
      for (const key in data) {
        if (!data.hasOwnProperty(key) || key.endsWith('_bk')) continue;

        // Nếu có dữ liệu cũ mà chưa có backup → backup giá trị cũ
        if (oldData[key] !== undefined && oldData[`${key}_bk`] === undefined) {
          dataWithBackup[`${key}_bk`] = oldData[key];
        }
        // Nếu là field mới hoàn toàn → tạo luôn backup bằng giá trị mới
        else if (oldData[key] === undefined) {
          dataWithBackup[`${key}_bk`] = data[key];
        }

        dataWithBackup[key] = data[key];
      }

      // 3️⃣ Ghi lên Firebase, giữ nguyên các field khác
      await set(vocabRef, {
        ...oldData, // giữ các field khác
        ...dataWithBackup, // cập nhật giá trị mới + backup nếu cần
      });
    } catch (error) {
      console.error('Error saving vocabulary item:', error);
      throw error;
    }
  }
  async rollBackVocabularyDetail(
    level: string,
    chapter: number,
    lessonNumber: number,
    vocabularyItem: VocabularyItemWithIndex
  ): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const { index } = vocabularyItem;
    const basePath = `vocabulary_data/${level}/${chapter}/lessonList/${lessonNumber}/vocabularyList/${index}`;
    const vocabRef = ref(this.database, basePath);

    try {
      // Lấy dữ liệu hiện tại
      const snapshot = await get(vocabRef);
      if (!snapshot.exists()) return; // không có gì để rollback
      const oldData = snapshot.val();

      const rolledBackData: Record<string, any> = {};
      let hasBackup = false;

      // Lấy các field _bk để khôi phục
      for (const key in oldData) {
        if (oldData.hasOwnProperty(key) && key.endsWith('_bk')) {
          const originalKey = key.slice(0, -3); // bỏ "_bk"
          rolledBackData[originalKey] = oldData[key];
          hasBackup = true;
        }
      }

      if (!hasBackup) {
        console.log(
          `No backup fields (_bk) found for vocabulary index ${index}. Rollback skipped.`
        );
        return;
      }

      // Ghi lại vào Firebase
      await set(vocabRef, rolledBackData);
    } catch (error) {
      console.error('Error rolling back vocabulary item:', error);
      throw error;
    }
  }

  async saveVocabularyStatus(
    userId: string,
    lessonId: number,
    vocabularyId: number
  ): Promise<void> {
    try {
      if (!this.database) {
        //console.error('Database not initialized');
        throw new Error('Database not initialized');
      }

      const path = `vocabulary_status/${userId}/${lessonId}/${vocabularyId}`;
      const statusRef = ref(this.database, path);

      await set(statusRef, '');
    } catch (error) {
      throw error;
    }
  }
  async saveVocabularyChapterStatus(
    userId: string,
    levelId: string,
    chapterId: number,
    vocabularyId: number
  ): Promise<void> {
    try {
      if (!this.database) {
        //console.error('Database not initialized');
        throw new Error('Database not initialized');
      }

      const path = `vocabulary_status/${userId}/${levelId}/c_${chapterId}/${vocabularyId}`;
      const statusRef = ref(this.database, path);

      await set(statusRef, '');
    } catch (error) {
      throw error;
    }
  }
  async removeVocabularyChapterStatus(
    userId: string,
    levelId: string,
    chapterId: number,
    vocabularyId: number
  ): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }

      const path = `vocabulary_status/${userId}/${levelId}/c_${chapterId}/${vocabularyId}`;
      const statusRef = ref(this.database, path);

      await remove(statusRef);
    } catch (error) {
      throw error;
    }
  }
  async removeVocabularyStatus(
    userId: string,
    lessonId: number,
    vocabularyId: number
  ): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }

      const path = `vocabulary_status/${userId}/${lessonId}/${vocabularyId}`;
      const statusRef = ref(this.database, path);

      await remove(statusRef);
    } catch (error) {
      throw error;
    }
  }
  async getVocabularyData(level: string): Promise<Chapter[]> {
    try {
      const statusRef = ref(this.database, `vocabulary_data/${level}`);
      const snapshot = await get(statusRef);

      if (snapshot.exists()) {
        return snapshot.val() as Chapter[];
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  async getVocabularyByLesson(
    level: string,
    chapter: number,
    lessonNumber: number
  ): Promise<Lesson | null> {
    try {
      const statusRef = ref(
        this.database,
        `vocabulary_data/${level}/${chapter}/lessonList/${lessonNumber}`
      );
      const snapshot = await get(statusRef);

      if (snapshot.exists()) {
        return snapshot.val() as Lesson;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }
  async getRememberedVocabulary(userId: string, lessonId: number | string): Promise<Number[]> {
    try {
      const statusRef = ref(this.database, `vocabulary_status/${userId}/${lessonId}`);
      const snapshot = await get(statusRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map((key) => Number(key));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }
  async getRememberedVocabularyChapter(
    userId: string,
    leveId: string,
    chapterId: number
  ): Promise<Number[]> {
    try {
      const statusRef = ref(this.database, `vocabulary_status/${userId}/${leveId}/c_${chapterId}`);
      const snapshot = await get(statusRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map((key) => Number(key));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }
  async getRememberedVocabularyByLesson(
    userId: string,
    lessonId: number | string
  ): Promise<Number[]> {
    try {
      const statusRef = ref(this.database, `vocabulary_status/${userId}/${lessonId}`);
      const snapshot = await get(statusRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        return Object.keys(data).map((key) => Number(key));
      }
      return [];
    } catch (error) {
      throw error;
    }
  }
  getAvailableLevels(): string[] {
    return ['N1', 'N2', 'N3', 'N4', 'N5'];
  }
}
