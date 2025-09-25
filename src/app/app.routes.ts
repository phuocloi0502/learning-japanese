import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { VocabularyComponent } from './pages/vocabulary/vocabulary.component';
import { VocabularyDetailComponent } from './pages/vocabulary-detail/vocabulary-detail.component';
import { FlashcardComponent } from './pages/flashcard/flashcard.component';
import { LoginComponent } from './pages/login/login.component';
import { GrammarComponent } from './pages/grammar/grammar.component';
import { KanjiComponent } from './pages/kanji/kanji.component';
import { TestComponent } from './pages/test/test.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'vocabulary', component: VocabularyComponent },
  { path: 'vocabulary/:level/:chapter/:lesson', component: VocabularyDetailComponent },
  { path: 'flashcard/:level/:chapter/:lesson', component: FlashcardComponent },
  { path: 'grammar', component: GrammarComponent },
  { path: 'kanji', component: KanjiComponent },
  { path: 'test', component: TestComponent },
  { path: '**', redirectTo: '/home' }
];
