// Common constants used across the application

export const APP_CONFIG = {
  APP_NAME: 'Học Tiếng Nhật',
  VERSION: '1.0.0',
  API_BASE_URL: 'https://api.example.com',
} as const;

export const ROUTES = {
  HOME: '/home',
  VOCABULARY: '/vocabulary',
  GRAMMAR: '/grammar',
  KANJI: '/kanji',
} as const;

export const MENU_ITEMS = [
  { label: 'Trang Chủ', route: '/home', icon: '🏠' },
  { label: 'Từ Vựng', route: '/vocabulary', icon: '📚' },
  { label: 'Ngữ Pháp', route: '/grammar', icon: '📖' },
  { label: 'Kanji', route: '/kanji', icon: '🈯' }
] as const;

export const JLPT_LEVELS = {
  N5: { name: 'N5', description: 'Cơ bản nhất', kanjiCount: 100, vocabularyCount: 800 },
  N4: { name: 'N4', description: 'Sơ cấp', kanjiCount: 300, vocabularyCount: 1500 },
  N3: { name: 'N3', description: 'Trung cấp', kanjiCount: 650, vocabularyCount: 3750 },
  N2: { name: 'N2', description: 'Trung thượng cấp', kanjiCount: 1000, vocabularyCount: 6000 },
  N1: { name: 'N1', description: 'Cao cấp', kanjiCount: 2000, vocabularyCount: 10000 },
} as const;

export const VOCABULARY_CATEGORIES = [
  { id: 'basic', name: 'Từ vựng cơ bản', icon: '🎯', description: 'Học những từ vựng cơ bản nhất trong tiếng Nhật' },
  { id: 'family', name: 'Từ vựng gia đình', icon: '🏠', description: 'Các từ vựng về thành viên trong gia đình' },
  { id: 'food', name: 'Từ vựng ẩm thực', icon: '🍱', description: 'Học từ vựng về các món ăn Nhật Bản' },
  { id: 'transport', name: 'Từ vựng giao thông', icon: '🚗', description: 'Các từ vựng về phương tiện và giao thông' },
] as const;

export const GRAMMAR_CATEGORIES = [
  { id: 'n5', name: 'Ngữ pháp N5', icon: '🔰', description: 'Ngữ pháp cơ bản nhất cho người mới bắt đầu' },
  { id: 'n4', name: 'Ngữ pháp N4', icon: '📝', description: 'Ngữ pháp trung cấp cho người đã có nền tảng' },
  { id: 'n3', name: 'Ngữ pháp N3', icon: '🎯', description: 'Ngữ pháp nâng cao cho người muốn thông thạo' },
  { id: 'conversation', name: 'Mẫu câu giao tiếp', icon: '💬', description: 'Các mẫu câu thường dùng trong giao tiếp hàng ngày' },
] as const;

export const KANJI_CATEGORIES = [
  { id: 'n5', name: 'Kanji N5', icon: '🔰', description: '100 chữ Kanji cơ bản nhất cho người mới bắt đầu' },
  { id: 'n4', name: 'Kanji N4', icon: '📝', description: '300 chữ Kanji trung cấp cho trình độ N4' },
  { id: 'n3', name: 'Kanji N3', icon: '🎯', description: '650 chữ Kanji nâng cao cho trình độ N3' },
  { id: 'radicals', name: 'Học theo bộ thủ', icon: '📚', description: 'Học Kanji theo các bộ thủ cơ bản' },
] as const;
