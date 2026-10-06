import { ALL_WORDS, Word } from './data'

export type Ex =
  | { kind: 'learn'; word: Word }
  | { kind: 'mc'; word: Word; prompt: string; big: string; audio?: boolean; options: { id: string; label: string; sub?: string }[] }
  | { kind: 'tf'; word: Word; shown: Word; correct: boolean; audio?: boolean }
  | { kind: 'speak'; word: Word }
  | { kind: 'type'; word: Word }                       // gõ pinyin (truy hồi chủ động)
  | { kind: 'recall'; word: Word; listen: boolean }    // tự nhớ nghĩa rồi tự chấm (truy hồi chủ động)

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export interface Ctx { canSpeak: boolean; pinyin: boolean; pool: Word[] }

/** hard=true: bài tự nhớ lại (không có đáp án để chọn); hard=false: bài nhận ra đáp án. */
export function makeExercise(w: Word, ctx: Ctx, hard = false): Ex {
  const others = (n: number) => shuffle((ctx.pinyin ? ctx.pool : ALL_WORDS).filter(x => x.id !== w.id && x.pinyin !== w.pinyin)).slice(0, n)

  if (ctx.pinyin) {
    // Bài phát âm: luôn dựa vào nghe. Các lựa chọn là các âm cùng nhóm để dễ phân biệt.
    const kinds = ['listen', 'listen', 'tf', ...(ctx.canSpeak ? ['speak'] : [])]
    switch (pick(kinds)) {
      case 'tf': { const correct = Math.random() < 0.5
        return { kind: 'tf', word: w, shown: correct ? w : others(1)[0], correct, audio: true } }
      case 'speak': return { kind: 'speak', word: w }
      default: return { kind: 'mc', word: w, prompt: 'Nghe và chọn âm đúng', big: '🔊', audio: true,
        options: shuffle([w, ...others(3)]).map(x => ({ id: x.id, label: x.pinyin })) }
    }
  }

  if (hard) {
    const kinds = ['type', 'recall', 'recall', 'recallListen', ...(ctx.canSpeak ? ['speak'] : [])]
    switch (pick(kinds)) {
      case 'type': return { kind: 'type', word: w }
      case 'recallListen': return { kind: 'recall', word: w, listen: true }
      case 'speak': return { kind: 'speak', word: w }
      default: return { kind: 'recall', word: w, listen: false }
    }
  }

  switch (pick(['vi', 'hanzi', 'listen', 'tf'])) {
    case 'vi': return { kind: 'mc', word: w, prompt: 'Từ này nghĩa là gì?', big: w.hanzi,
      options: shuffle([w, ...others(3)]).map(x => ({ id: x.id, label: `${x.emoji} ${x.vi}`.trim() })) }
    case 'hanzi': return { kind: 'mc', word: w, prompt: `Chọn chữ Hán cho "${w.vi}"`, big: w.emoji || w.vi,
      options: shuffle([w, ...others(3)]).map(x => ({ id: x.id, label: x.hanzi, sub: x.pinyin })) }
    case 'listen': return { kind: 'mc', word: w, prompt: 'Nghe và chọn đáp án đúng', big: '🔊', audio: true,
      options: shuffle([w, ...others(3)]).map(x => ({ id: x.id, label: x.hanzi, sub: x.pinyin })) }
    default: { const correct = Math.random() < 0.5
      return { kind: 'tf', word: w, shown: correct ? w : others(1)[0], correct } }
  }
}

export const isHard = (e: Ex) => e.kind === 'type' || e.kind === 'recall' || e.kind === 'speak'

/**
 * Bài học: học từ mới → lượt 1 nhận ra đáp án → lượt 2 tự nhớ lại (xen thêm vài từ cũ để ôn xen kẽ).
 * recallOnly: bài ôn tập, chỉ có lượt tự nhớ lại.
 */
export function buildLesson(words: Word[], ctx: Ctx, withLearn = true, extra: Word[] = [], recallOnly = false): Ex[] {
  const learn: Ex[] = withLearn ? words.map(word => ({ kind: 'learn', word })) : []
  if (recallOnly) return shuffle(words).map(w => makeExercise(w, ctx, true))
  const pass1 = shuffle(words).map(w => makeExercise(w, ctx, false))
  const pass2 = shuffle([...words, ...extra]).map(w => makeExercise(w, ctx, true))
  return [...learn, ...pass1, ...pass2]
}
