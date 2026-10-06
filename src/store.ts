import { useEffect, useState } from 'react'

export interface WordStat { box: number; wrong: number }   // box 0..4 (Leitner)
export interface Progress {
  xp: number; streak: number; lastDay: string; todayXp: number
  stars: Record<string, number>; words: Record<string, WordStat>
}
const KEY = 'htt-progress-v1'
const today = () => new Date().toISOString().slice(0, 10)
const fresh = (): Progress => ({ xp: 0, streak: 0, lastDay: '', todayXp: 0, stars: {}, words: {} })

function load(): Progress {
  try {
    const p = { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } as Progress
    if (p.lastDay !== today()) p.todayXp = 0
    return p
  } catch { return fresh() }
}

export function useProgress() {
  const [p, setP] = useState<Progress>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* ignore */ } }, [p])

  const finishLesson = (id: string, xp: number, stars: number, results: Record<string, boolean>) =>
    setP(prev => {
      const t = today()
      const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
      const streak = prev.lastDay === t ? prev.streak : prev.lastDay === y ? prev.streak + 1 : 1
      const words = { ...prev.words }
      for (const [wid, ok] of Object.entries(results)) {
        const s = words[wid] ?? { box: 0, wrong: 0 }
        words[wid] = ok ? { ...s, box: Math.min(4, s.box + 1) } : { box: 0, wrong: s.wrong + 1 }
      }
      return { ...prev, xp: prev.xp + xp, streak, lastDay: t, todayXp: (prev.lastDay === t ? prev.todayXp : 0) + xp,
        stars: { ...prev.stars, [id]: Math.max(prev.stars[id] ?? 0, stars) }, words }
    })
  return { p, finishLesson }
}
