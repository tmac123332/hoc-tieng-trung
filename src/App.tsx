import { useState } from 'react'
import { LESSONS, ALL_WORDS, Word } from './data'
import { useProgress } from './store'
import Lesson from './Lesson'
import MicTest from './MicTest'

const DAILY_GOAL = 30
type Active = { id: string; title: string; words: Word[]; pinyin: boolean; withLearn: boolean; run: number } | null

export default function App() {
  const { p, finishLesson } = useProgress()
  const [active, setActive] = useState<Active>(null)
  const [testing, setTesting] = useState(false)

  // Lộ trình cá nhân hóa: ôn các từ yếu nhất (box thấp / sai nhiều) trong số từ đã học
  const learned = ALL_WORDS.filter(w => p.words[w.id])
  const weak = [...learned].sort((a, b) =>
    (p.words[a.id].box - p.words[b.id].box) || (p.words[b.id].wrong - p.words[a.id].wrong)).slice(0, 5)
  const nextIdx = LESSONS.findIndex(l => !p.stars[l.id])
  const start = (id: string, title: string, words: Word[], withLearn: boolean, pinyin = false) =>
    setActive({ id, title, words, pinyin, withLearn, run: Date.now() })

  if (testing) return <MicTest onExit={() => setTesting(false)} />

  if (active) return (
    <Lesson key={active.run} title={active.title} words={active.words} pinyin={active.pinyin} withLearn={active.withLearn}
      onExit={() => setActive(null)}
      onFinish={(xp, stars, res) => finishLesson(active.id, xp, stars, res)} />
  )

  return (
    <div className="screen home">
      <header>
        <h1>🐼 Học tiếng Trung</h1>
        <div className="stats"><button className="testbtn" title="Kiểm tra loa và micro" onClick={() => setTesting(true)}>🎤✔</button><span>🔥 {p.streak}</span><span>⭐ {p.xp} XP</span></div>
      </header>
      <div className="goal">
        <div>Mục tiêu hôm nay: {Math.min(p.todayXp, DAILY_GOAL)}/{DAILY_GOAL} XP</div>
        <div className="bar"><div style={{ width: `${Math.min(100, (p.todayXp / DAILY_GOAL) * 100)}%` }} /></div>
      </div>

      {weak.length >= 4 && (
        <button className="review" onClick={() => start('review', 'Ôn tập', weak, false)}>
          🎯 Ôn tập dành riêng cho bạn <small>{weak.map(w => w.hanzi).join(' ')}</small>
        </button>
      )}

      <div className="path">
        {LESSONS.map((l, i) => {
          const locked = nextIdx !== -1 && i > nextIdx
          return (
            <button key={l.id} disabled={locked} className={'node ' + (i % 2 ? 'right' : 'left') + (i === nextIdx ? ' current' : '')}
              onClick={() => start(l.id, l.title, l.words, true, l.mode === 'pinyin')}>
              <span className="ic">{locked ? '🔒' : l.icon}</span>
              <span className="t">{l.title}</span>
              <span className="st">{'⭐'.repeat(p.stars[l.id] ?? 0) || (i === nextIdx ? 'BẮT ĐẦU' : '')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
