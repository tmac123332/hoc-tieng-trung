import { UNITS } from './hsk1'
import { PINYIN_UNITS } from './pinyin'

export interface Example { zh: string; pinyin: string; vi: string }
export interface Word { id: string; hanzi: string; pinyin: string; vi: string; hv: string; emoji: string; ex?: Example }
export interface Lesson { id: string; title: string; icon: string; mode: 'pinyin' | 'word'; words: Word[] }

// Với bài pinyin: hanzi = chữ mẫu để tạo âm thanh, vi = gợi ý phát âm.
const pinyinLessons: Lesson[] = PINYIN_UNITS.map(u => ({
  id: u.id, title: u.title, icon: u.icon, mode: 'pinyin',
  words: u.rows.map(([pinyin, hanzi, vi]) => ({ id: `${u.id}:${pinyin}`, hanzi, pinyin, vi, hv: '', emoji: '' })),
}))

const hskLessons: Lesson[] = UNITS.map(u => ({
  id: u.id, title: u.title, icon: u.icon, mode: 'word',
  words: u.rows.map(([hanzi, pinyin, vi, hv, emoji, zh, py, exVi]) =>
    ({ id: hanzi, hanzi, pinyin, vi, hv, emoji, ex: { zh, pinyin: py, vi: exVi } })),
}))

export const LESSONS: Lesson[] = [...pinyinLessons, ...hskLessons]
export const ALL_WORDS: Word[] = hskLessons.flatMap(l => l.words)
