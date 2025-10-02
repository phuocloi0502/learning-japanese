import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, timeout, retry, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
  private cache: Map<string, Chapter[]> = new Map();

  constructor(private http: HttpClient) {
    //console.log('📚 Vocabulary Service initialized with static files');
  }

  /**
   * Get vocabulary data for a specific level from Firebase Hosting
   */
  getVocabularyData(level: string): Observable<Chapter[]> {
    //console.log(`🔍 Getting vocabulary data for ${level}`);

    // Check cache first
    if (this.cache.has(level)) {
      //console.log(`📖 Returning cached data for ${level}`);
      const cachedData = this.cache.get(level)!;
      //console.log(`📊 Cached data: ${cachedData.length} chapters`);
      return of(cachedData);
    }

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
          //console.log(`📥 Raw data received: ${Array.isArray(data) ? data.length : 'not array'}`);
          // Cache the data
          this.cache.set(level, data);
          //console.log(`📚 Loaded ${data.length} chapters for ${level} from Firebase Hosting`);
          return data;
        }),
        catchError((error) => {
          //console.error(`❌ Failed to load vocabulary data for ${level}:`, error);
          //console.error(`URL: ${filePath}`);
          if (error.name === 'TimeoutError') {
            //console.error(`⏰ Timeout loading ${level} - file too large`);
          }
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

  /**
   * Search vocabulary across all levels
   */
  searchVocabulary(
    query: string
  ): Observable<{ level: string; chapter: Chapter; lesson: Lesson; vocabulary: VocabularyItem }[]> {
    const levels = this.getAvailableLevels();
    const searchObservables = levels.map((level) =>
      this.getVocabularyData(level).pipe(
        map((data) => {
          const results: {
            level: string;
            chapter: Chapter;
            lesson: Lesson;
            vocabulary: VocabularyItem;
          }[] = [];

          for (const chapter of data) {
            for (const lesson of chapter.lessonList) {
              for (const vocabulary of lesson.vocabularyList) {
                if (
                  vocabulary.kanji.toLowerCase().includes(query.toLowerCase()) ||
                  vocabulary.furigana.toLowerCase().includes(query.toLowerCase()) ||
                  vocabulary.meaning.toLowerCase().includes(query.toLowerCase())
                ) {
                  results.push({
                    level,
                    chapter,
                    lesson,
                    vocabulary,
                  });
                }
              }
            }
          }

          return results;
        }),
        catchError((error) => {
          //console.error(`Error searching in ${level}:`, error);
          return of([]);
        })
      )
    );

    return new Observable((observer) => {
      let completed = 0;
      const allResults: {
        level: string;
        chapter: Chapter;
        lesson: Lesson;
        vocabulary: VocabularyItem;
      }[] = [];

      searchObservables.forEach((obs) => {
        obs.subscribe({
          next: (results) => {
            allResults.push(...results);
          },
          complete: () => {
            completed++;
            if (completed === searchObservables.length) {
              observer.next(allResults);
              observer.complete();
            }
          },
          error: (error) => {
            completed++;
            if (completed === searchObservables.length) {
              observer.next(allResults);
              observer.complete();
            }
          },
        });
      });
    });
  }

  /**
   * Get random vocabulary for practice
   */
  getRandomVocabulary(level: string, count: number = 10): Observable<VocabularyItem[]> {
    return this.getVocabularyData(level).pipe(
      map((data) => {
        const allVocabulary: VocabularyItem[] = [];

        // Collect all vocabulary from all chapters and lessons
        for (const chapter of data) {
          for (const lesson of chapter.lessonList) {
            allVocabulary.push(...lesson.vocabularyList);
          }
        }

        // Shuffle and return random items
        const shuffled = allVocabulary.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
      })
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    //console.log('🗑️ Vocabulary cache cleared');
  }

  /**
   * Clear cache for specific level
   */
  clearCacheForLevel(level: string): void {
    this.cache.delete(level);
    //console.log(`🗑️ Vocabulary cache cleared for ${level}`);
  }
}
