import { useEffect, useMemo, useRef, useState } from 'react'
import { Word } from './data'
import { buildLesson, Ex, makeExercise } from './exercises'
import { canListen, ERRORS, listen, speak } from './speech'

interface Props { title: string; words: Word[]; pinyin?: boolean; withLearn?: boolean; onExit: () => void
  onFinish: (xp: number, stars: number, results: Record<string, boolean>) => void }

export default function Lesson({ words, pinyin = false, withLearn = true, onExit, onFinish }: Props) {
  const ctx = { canSpeak: canListen, pinyin, pool: words }
  const [queue, setQueue] = useState<Ex[]>(() => buildLesson(words, ctx, withLearn))
  const [i, setI] = useState(0)
  const [fb, setFb] = useState<null | { ok: boolean; note?: string }>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [heard, setHeard] = useState(false)
  const [live, setLive] = useState('')
  const [micErr, setMicErr] = useState('')
  const results = useRef<Record<string, boolean>>({})
  const total = useMemo(() => queue.length, [])   // tiến độ tính theo số bài ban đầu
  const ex = queue[i]
  const done = i >= queue.length

  useEffect(() => { if (ex && ((ex.kind === 'mc' && ex.audio) || (ex.kind === 'tf' && ex.audio))) speak(ex.word.hanzi) }, [i])

  if (done) {
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    const xp = 10 + stars * 5
    return (
      <div className="screen center">
        <div className="big">🎉</div><h1>Hoàn thành!</h1>
        <p>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</p><p className="xp">+{xp} XP</p>
        <button className="btn primary" onClick={() => { onFinish(xp, stars, results.current); onExit() }}>Tiếp tục</button>
      </div>
    )
  }

  const answer = (ok: boolean, note?: string) => {
    if (fb) return
    setFb({ ok, note })
    if (ok) { if (ex.kind !== 'learn' && results.current[ex.word.id] === undefined) results.current[ex.word.id] = true }
    else {
      setMistakes(m => m + 1); results.current[ex.word.id] = false
      setQueue(q => [...q, makeExercise(ex.word, ctx)])   // gặp lại từ sai ở cuối bài
    }
  }
  const next = () => { setFb(null); setPicked(null); setHeard(false); setMicErr(''); setI(i + 1) }

  return (
    <div className="screen">
      <div className="top">
        <button className="x" onClick={onExit}>✕</button>
        <div className="bar"><div style={{ width: `${Math.min(100, (i / total) * 100)}%` }} /></div>
      </div>
      <div className="body">
        {ex.kind === 'learn' && (pinyin ? (<>
          <p className="prompt">Âm mới</p>
          <div className="hanzi" onClick={() => speak(ex.word.hanzi)}>{ex.word.pinyin}</div>
          <div className="vi">{ex.word.vi}</div>
          <button className="btn ghost" onClick={() => speak(ex.word.hanzi)}>🔊 Nghe ({ex.word.hanzi})</button>
        </>) : (<>
          <p className="prompt">Từ mới</p>
          {ex.word.emoji && <div className="big">{ex.word.emoji}</div>}
          <div className="hanzi" onClick={() => speak(ex.word.hanzi)}>{ex.word.hanzi}</div>
          <div className="pinyin">{ex.word.pinyin}</div><div className="vi">{ex.word.vi}</div>
          {ex.word.hv && <div className="hv">Hán Việt: <b>{ex.word.hv}</b></div>}
          <button className="btn ghost" onClick={() => speak(ex.word.hanzi)}>🔊 Nghe</button>
          {ex.word.ex && <div className="example" onClick={() => speak(ex.word.ex!.zh)}>
            <div className="zh">{ex.word.ex.zh} 🔊</div>
            <div className="py">{ex.word.ex.pinyin}</div><div>{ex.word.ex.vi}</div>
          </div>}
        </>))}

        {ex.kind === 'mc' && (<>
          <p className="prompt">{ex.prompt}</p>
          <div className={ex.audio ? 'big speaker' : /\p{Script=Han}/u.test(ex.big) ? 'hanzi' : ex.big === ex.word.vi ? 'vi' : 'big'} onClick={() => speak(ex.word.hanzi)}>{ex.big}</div>
          <div className="options">
            {ex.options.map(o => (
              <button key={o.id} disabled={!!fb}
                className={'opt ' + (fb && o.id === ex.word.id ? 'right' : picked === o.id && fb && !fb.ok ? 'wrong' : '')}
                onClick={() => { setPicked(o.id); answer(o.id === ex.word.id) }}>
                {o.label}{o.sub && <small>{o.sub}</small>}
              </button>
            ))}
          </div>
        </>)}

        {ex.kind === 'tf' && (<>
          <p className="prompt">{ex.audio ? 'Nghe: có đúng là âm này không?' : 'Đúng hay sai?'}</p>
          {ex.audio
            ? <><div className="big speaker" onClick={() => speak(ex.word.hanzi)}>🔊</div><div className="hanzi">{ex.shown.pinyin}</div></>
            : <><div className="hanzi" onClick={() => speak(ex.word.hanzi)}>{ex.word.hanzi}</div>
                <div className="vi">= {ex.shown.emoji} {ex.shown.vi} ?</div></>}
          <div className="options two">
            <button className="opt" disabled={!!fb} onClick={() => answer(ex.correct)}>✅ Đúng</button>
            <button className="opt" disabled={!!fb} onClick={() => answer(!ex.correct)}>❌ Sai</button>
          </div>
        </>)}

        {ex.kind === 'speak' && (<>
          <p className="prompt">Hãy đọc to từ này</p>
          <div className="hanzi">{pinyin ? ex.word.pinyin : ex.word.hanzi}</div>{!pinyin && <div className="pinyin">{ex.word.pinyin}</div>}
          <button className="btn ghost" onClick={() => speak(ex.word.hanzi)}>🔊 Nghe mẫu</button>
          <button className={'mic' + (heard ? ' on' : '')} disabled={!!fb || heard} onClick={async () => {
            setHeard(true); setLive(''); setMicErr('')
            const r = await listen(ex.word.hanzi, setLive); setHeard(false)
            // Lỗi kỹ thuật (micro, mạng, không nghe thấy) không tính là đọc sai: báo lỗi và cho thử lại.
            if (r.error) setMicErr(ERRORS[r.error] ?? `Lỗi micro: ${r.error}`)
            else answer(r.ok, r.heard ? `Máy nghe được: ${r.heard}` : undefined)
          }}>🎤</button>
          <div className="live">{heard ? `Đang nghe… ${live}` : micErr && <span className="err">{micErr}</span>}</div>
          <button className="link" disabled={!!fb} onClick={() => answer(true)}>Bỏ qua (không nói được lúc này)</button>
        </>)}
      </div>

      <div className={'footer ' + (fb ? (fb.ok ? 'ok' : 'bad') : '')}>
        {ex.kind === 'learn'
          ? <button className="btn primary" onClick={next}>Đã nhớ</button>
          : fb && (<>
              <div className="msg">{fb.ok ? '🎉 Chính xác!' : pinyin ? `😅 Đáp án: ${ex.word.pinyin}` : `😅 Đáp án: ${ex.word.hanzi} (${ex.word.pinyin}) = ${ex.word.vi}`}
                {fb.note && <small>{fb.note}</small>}</div>
              <button className="btn primary" onClick={next}>Tiếp tục</button>
            </>)}
      </div>
    </div>
  )
}
