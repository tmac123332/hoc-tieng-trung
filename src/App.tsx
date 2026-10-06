import { useState } from 'react'
import { LESSONS, ALL_WORDS, Word } from './data'
import { dueIds, useProgress } from './store'
import Lesson from './Lesson'
import MicTest from './MicTest'

const DAILY_GOAL = 30
const REVIEW_SIZE = 10
const EXTRA_OLD = 3   // số từ cũ xen vào bài mới để ôn xen kẽ
type Active = { id: string; title: string; words: Word[]; pinyin: boolean; withLearn: boolean; extra: Word[]; recallOnly: boolean; run: number } | null

const byId = new Map(ALL_WORDS.map(w => [w.id, w]))

export default function App() {
  const { p, finishLesson } = useProgress()
  const [active, setActive] = useState<Active>(null)
  const [testing, setTesting] = useState(false)

  // Lộ trình cá nhân hóa (FSRS): từ nào đến hạn ôn thì hiện ở đây, từ gần quên nhất lên đầu
  const due = dueIds(p).map(id => byId.get(id)).filter((w): w is Word => !!w)
  const learnedCount = ALL_WORDS.filter(w => p.cards[w.id]).length
  const nextIdx = LESSONS.findIndex(l => !p.stars[l.id])

  const start = (id: string, title: string, words: Word[], opts: Partial<Active & object> = {}) =>
    setActive({ id, title, words, pinyin: false, withLearn: true, extra: [], recallOnly: false, run: Date.now(), ...opts })

  const startLesson = (l: typeof LESSONS[number]) => {
    const inLesson = new Set(l.words.map(w => w.id))
    // từ cũ xen kẽ: ưu tiên từ đến hạn ôn, rồi đến các từ đã học khác
    const pool = [...due, ...ALL_WORDS.filter(w => p.cards[w.id] && !due.includes(w))].filter(w => !inLesson.has(w.id))
    start(l.id, l.title, l.words, { pinyin: l.mode === 'pinyin', extra: l.mode === 'pinyin' ? [] : pool.slice(0, EXTRA_OLD) })
  }

  if (testing) return <MicTest onExit={() => setTesting(false)} />

  if (active) return (
    <Lesson key={active.run} title={active.title} words={active.words} pinyin={active.pinyin} withLearn={active.withLearn}
      extra={active.extra} recallOnly={active.recallOnly}
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

      {due.length > 0 && (
        <button className="review" onClick={() => start('review', 'Ôn tập', due.slice(0, REVIEW_SIZE), { withLearn: false, recallOnly: true })}>
          🔁 Hôm nay cần ôn: {due.length} từ <small>{due.slice(0, 5).map(w => w.hanzi).join(' ')}</small>
        </button>
      )}
      {due.length === 0 && learnedCount > 0 && <div className="allgood">✅ Hôm nay không còn từ nào cần ôn</div>}

      <div className="path">
        {LESSONS.map((l, i) => {
          const locked = nextIdx !== -1 && i > nextIdx
          return (
            <button key={l.id} disabled={locked} className={'node ' + (i % 2 ? 'right' : 'left') + (i === nextIdx ? ' current' : '')}
              onClick={() => startLesson(l)}>
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
