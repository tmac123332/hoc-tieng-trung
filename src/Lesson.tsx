import { useEffect, useMemo, useRef, useState } from 'react'
import { Word } from './data'
import { buildLesson, Ex, isHard, makeExercise } from './exercises'
import { checkPinyin } from './pinyinCheck'
import { canListen, ERRORS, listen, speak } from './speech'

interface Props { title: string; words: Word[]; pinyin?: boolean; withLearn?: boolean; extra?: Word[]; recallOnly?: boolean
  onExit: () => void
  onFinish: (xp: number, stars: number, results: Record<string, number>) => void }

const GRADES: [number, string, string][] = [[1, '😵', 'Quên'], [2, '😐', 'Khó'], [3, '🙂', 'Nhớ'], [4, '😎', 'Dễ']]

export default function Lesson({ words, pinyin = false, withLearn = true, extra = [], recallOnly = false, onExit, onFinish }: Props) {
  const ctx = { canSpeak: canListen, pinyin, pool: words }
  const [queue, setQueue] = useState<Ex[]>(() => buildLesson(words, ctx, withLearn, extra, recallOnly))
  const [i, setI] = useState(0)
  const [fb, setFb] = useState<null | { ok: boolean; note?: string }>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [heard, setHeard] = useState(false)
  const [live, setLive] = useState('')
  const [micErr, setMicErr] = useState('')
  const [typed, setTyped] = useState('')
  const [revealed, setRevealed] = useState(false)
  const results = useRef<Record<string, number>>({})   // mức nhớ thấp nhất của từng từ trong bài (1–4)
  const total = useMemo(() => queue.length, [])   // tiến độ tính theo số bài ban đầu
  const ex = queue[i]
  const done = i >= queue.length

  useEffect(() => {
    if (!ex) return
    if ((ex.kind === 'mc' && ex.audio) || (ex.kind === 'tf' && ex.audio) || (ex.kind === 'recall' && ex.listen)) speak(ex.word.hanzi)
  }, [i])

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

  const record = (id: string, grade: number) => { results.current[id] = Math.min(results.current[id] ?? 4, grade) }
  const fail = () => {
    setMistakes(m => m + 1)
    setQueue(q => [...q, makeExercise(ex.word, ctx, isHard(ex))])   // gặp lại từ sai ở cuối bài
  }

  const answer = (ok: boolean, note?: string) => {
    if (fb) return
    setFb({ ok, note })
    record(ex.word.id, ok ? 3 : 1)
    if (!ok) fail()
  }
  const selfGrade = (g: number) => {   // bài tự nhớ: người học tự chấm 1–4
    record(ex.word.id, g)
    if (g === 1) fail()
    next()
  }
  const submitType = () => {
    if (fb || !typed.trim()) return
    const r = checkPinyin(typed, ex.word.pinyin)
    answer(r === 'ok', r === 'tone' ? 'Đúng âm nhưng sai hoặc thiếu thanh điệu.' : undefined)
  }
  const next = () => { setFb(null); setPicked(null); setHeard(false); setMicErr(''); setTyped(''); setRevealed(false); setI(i + 1) }

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

        {ex.kind === 'type' && (<>
          <p className="prompt">Gõ pinyin của từ này (cả thanh điệu)</p>
          <div className="hanzi" onClick={() => speak(ex.word.hanzi)}>{ex.word.hanzi}</div>
          <button className="btn ghost" onClick={() => speak(ex.word.hanzi)}>🔊 Nghe</button>
          <input className="typebox" value={typed} disabled={!!fb} autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false}
            placeholder="vd: ni3 hao3 hoặc nǐ hǎo" onChange={e => setTyped(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitType() }} />
          <button className="btn ghost" disabled={!!fb || !typed.trim()} onClick={submitType}>Kiểm tra</button>
          <small className="hint">Thanh: 1 ngang, 2 lên, 3 xuống-lên, 4 xuống. Thanh nhẹ không cần số.</small>
        </>)}

        {ex.kind === 'recall' && (<>
          <p className="prompt">{ex.listen ? 'Nghe và tự nhớ nghĩa' : 'Tự nhớ lại nghĩa của từ này'}</p>
          {ex.listen
            ? <div className="big speaker" onClick={() => speak(ex.word.hanzi)}>🔊</div>
            : <div className="hanzi" onClick={() => speak(ex.word.hanzi)}>{ex.word.hanzi}</div>}
          {!revealed
            ? <button className="btn ghost" onClick={() => setRevealed(true)}>👁️ Xem đáp án</button>
            : <>
                <div className="hanzi small">{ex.word.hanzi}</div>
                <div className="pinyin">{ex.word.pinyin}</div><div className="vi">{ex.word.vi}</div>
                {ex.word.hv && <div className="hv">Hán Việt: <b>{ex.word.hv}</b></div>}
                <button className="btn ghost" onClick={() => speak(ex.word.hanzi)}>🔊 Nghe</button>
              </>}
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
        {ex.kind === 'learn' && <button className="btn primary" onClick={next}>Đã nhớ</button>}
        {ex.kind === 'recall' && revealed && (<>
          <div className="msg">Bạn nhớ từ này thế nào?</div>
          <div className="grades">{GRADES.map(([g, icon, label]) =>
            <button key={g} className={'grade g' + g} onClick={() => selfGrade(g)}><span>{icon}</span>{label}</button>)}</div>
        </>)}
        {ex.kind !== 'learn' && ex.kind !== 'recall' && fb && (<>
          <div className="msg">{fb.ok ? '🎉 Chính xác!' : pinyin ? `😅 Đáp án: ${ex.word.pinyin}` : `😅 Đáp án: ${ex.word.hanzi} (${ex.word.pinyin}) = ${ex.word.vi}`}
            {fb.note && <small>{fb.note}</small>}</div>
          <button className="btn primary" onClick={next}>Tiếp tục</button>
        </>)}
      </div>
    </div>
  )
}
