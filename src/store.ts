import { useEffect, useState } from 'react'
import { Card, createEmptyCard, fsrs, generatorParameters, Grade } from 'ts-fsrs'

// Ôn tập theo thuật toán FSRS (mã nguồn mở): mỗi từ có một "thẻ" lưu độ ổn định và ngày cần ôn kế tiếp.
export interface Progress {
  xp: number; streak: number; lastDay: string; todayXp: number
  stars: Record<string, number>
  cards: Record<string, Card>
}
const KEY = 'htt-progress-v1'
const today = () => new Date().toISOString().slice(0, 10)
const fresh = (): Progress => ({ xp: 0, streak: 0, lastDay: '', todayXp: 0, stars: {}, cards: {} })

// Không dùng bước học ngắn (phút): từ mới được hẹn ôn theo ngày, hợp với việc học mỗi ngày vài bài.
const scheduler = fsrs(generatorParameters({ enable_short_term: false, enable_fuzz: true }))

function load(): Progress {
  try {
    const p = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } as Progress
    if (p.lastDay !== today()) p.todayXp = 0
    for (const c of Object.values(p.cards)) {   // JSON đưa ngày về chuỗi → khôi phục lại Date
      c.due = new Date(c.due)
      if (c.last_review) c.last_review = new Date(c.last_review)
    }
    return p
  } catch { return fresh() }
}

export const dueIds = (p: Progress, now = new Date()) =>
  Object.entries(p.cards).filter(([, c]) => c.due <= now).sort((a, b) => +a[1].due - +b[1].due).map(([id]) => id)

export function useProgress() {
  const [p, setP] = useState<Progress>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }, [p])

  /** results: từ → mức nhớ (1 quên, 2 khó, 3 nhớ, 4 dễ). */
  const finishLesson = (id: string, xp: number, stars: number, results: Record<string, number>) =>
    setP(prev => {
      const now = new Date(), t = today()
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
      const streak = prev.lastDay === t ? prev.streak : prev.lastDay === y ? prev.streak + 1 : 1
      const cards = { ...prev.cards }
      for (const [wid, grade] of Object.entries(results))
        cards[wid] = scheduler.next(cards[wid] ?? createEmptyCard(now), now, grade as Grade).card
      return { ...prev, xp: prev.xp + xp, streak, lastDay: t, todayXp: (prev.lastDay === t ? prev.todayXp : 0) + xp,
        stars: { ...prev.stars, [id]: Math.max(prev.stars[id] ?? 0, stars) }, cards }
    })
  return { p, finishLesson }
}
