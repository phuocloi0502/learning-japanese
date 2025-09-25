import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CompressionService {

  constructor() { }

  /**
   * Compress JSON data using LZ-string algorithm (simplified)
   */
  compress(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      // Simple compression by removing unnecessary whitespace
      return jsonString.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error('Compression error:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Decompress JSON data
   */
  decompress(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  }

  /**
   * Get estimated compression ratio
   */
  getCompressionRatio(original: string, compressed: string): number {
    return Math.round((1 - compressed.length / original.length) * 100);
  }
}
