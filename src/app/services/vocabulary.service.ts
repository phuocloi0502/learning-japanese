import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, timeout, retry, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ref, set, get, onValue, off, remove } from '@angular/fire/database';
import { FirebaseService } from './firebase.service';
import { log } from 'console';

export interface VocabularyItem {
  lesson: string;
  vocabulary_id: number;
  kanji: string;
  furigana: string;
  meaning: string;
  example: string;
  example_meaning: string;
  sound_url: string;
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

  getAvailableLevels(): string[] {
    return ['N1', 'N2', 'N3', 'N4', 'N5'];
  }
}
