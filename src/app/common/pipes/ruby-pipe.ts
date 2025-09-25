import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'ruby',
  standalone: true
})
export class RubyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(text: string | null | undefined): SafeHtml {
    if (!text) {
      return '';
    }

    // Thay Kanji（ふりがな） bằng ruby markup
    const replaced = text.replace(
      /([一-龯]+)（([ぁ-んァ-ン]+)）/g,
      (_match, kanji, hiragana) => {
        return `<ruby><rb>${kanji}</rb><rt>${hiragana}</rt></ruby>`;
      }
    );

    return this.sanitizer.bypassSecurityTrustHtml(replaced);
  }
}
