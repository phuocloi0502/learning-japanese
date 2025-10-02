import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, timeout, retry, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ref, set, get, onValue, off } from '@angular/fire/database';
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

  async getVocabularyData1(level: string): Promise<Chapter[]> {
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
  async getVocabularyByLesson1(
    level: string,
    chapter: number,
    lessonNumber: number
  ): Promise<VocabularyItem[]> {
    try {
      const statusRef = ref(
        this.database,
        `vocabulary_data/${level}/${chapter}/lessonList/${lessonNumber}/vocabularyList`
      );
      const snapshot = await get(statusRef);

      if (snapshot.exists()) {
        return snapshot.val() as VocabularyItem[];
      }
      return [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get vocabulary data for a specific level from Firebase Hosting
   */
  getVocabularyData(level: string): Observable<Chapter[]> {
    //console.log(`🔍 Getting vocabulary data for ${level}`);

    const fileName = `data${level}.json`;
    // URL từ Firebase Hosting
    const filePath = `${environment.dataBaseUrl}${fileName}`;
    //console.log(`🌐 Loading from URL: ${filePath}`);

    return this.http
      .get<Chapter[]>(filePath, {
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      })
      .pipe(
        timeout(30000), // 30 seconds timeout
        retry(1), // Retry 1 time only
        map((data) => {
          return data;
        }),
        catchError((error) => {
          return of([]);
        })
      );
  }

  /**
   * Get all available levels
   */
  getAvailableLevels(): string[] {
    return ['N1', 'N2', 'N3', 'N4', 'N5'];
  }

  /**
   * Get vocabulary by chapter and lesson
   */
  getVocabularyByLesson(
    level: string,
    chapterNumber: number,
    lessonNumber: number
  ): Observable<VocabularyItem[]> {
    return this.getVocabularyData(level).pipe(
      map((data) => {
        const chapter = data.find((c) => c.chapter_number === chapterNumber);

        if (!chapter) {
          //console.warn(`Chapter ${chapterNumber} not found in ${level}`);
          return [];
        }

        const lesson = chapter.lessonList.find((l) => l.lesson_number === lessonNumber);

        if (!lesson) {
          //console.warn(`Lesson ${lessonNumber} not found in chapter ${chapterNumber}`);
          return [];
        }

        return lesson.vocabularyList;
      })
    );
  }
}
