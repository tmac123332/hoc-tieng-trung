import { useEffect, useRef, useState } from 'react'
import { canListen, ERRORS, listen, meterMic, speak } from './speech'

type Step = 'idle' | 'ok' | 'fail'

/** Màn hình kiểm tra: loa → micro (thanh âm lượng) → nhận diện giọng nói. */
export default function MicTest({ onExit }: { onExit: () => void }) {
  const [level, setLevel] = useState(0)
  const [mic, setMic] = useState<{ s: Step; msg: string }>({ s: 'idle', msg: '' })
  const [rec, setRec] = useState<{ s: Step; msg: string; busy: boolean }>({ s: 'idle', msg: '', busy: false })
  const stop = useRef<null | (() => void)>(null)
  const peak = useRef(0)

  useEffect(() => () => stop.current?.(), [])

  const testMic = async () => {
    stop.current?.(); peak.current = 0; setMic({ s: 'idle', msg: 'Hãy nói gì đó, thanh bên dưới phải nhảy…' })
    try {
      stop.current = await meterMic(v => { peak.current = Math.max(peak.current, v); setLevel(v) })
      setTimeout(() => setMic(peak.current > 0.08
        ? { s: 'ok', msg: '✅ Micro hoạt động.' }
        : { s: 'fail', msg: '⚠️ Micro được phép dùng nhưng không thu được âm thanh. Kiểm tra micro có bị tắt tiếng hoặc chọn nhầm thiết bị trong Cài đặt → Hệ thống → Âm thanh → Đầu vào.' }), 4000)
    } catch (e: any) {
      setMic({ s: 'fail', msg: e?.name === 'NotFoundError' ? ERRORS['audio-capture'] : ERRORS['not-allowed'] })
    }
  }

  const testRec = async () => {
    stop.current?.(); stop.current = null; setLevel(0)
    setRec({ s: 'idle', msg: 'Hãy nói to: 你好 (nǐ hǎo)…', busy: true })
    const r = await listen(null, t => setRec({ s: 'idle', msg: `Đang nghe… ${t}`, busy: true }))
    setRec(r.error ? { s: 'fail', msg: '❌ ' + (ERRORS[r.error] ?? r.error), busy: false }
      : { s: 'ok', msg: `✅ Máy nghe được: "${r.heard}". ${r.heard.includes('你好') ? 'Chuẩn!' : 'Chưa đúng 你好 nhưng nhận diện đang hoạt động.'}`, busy: false })
  }

  return (
    <div className="screen">
      <div className="top"><button className="x" onClick={onExit}>✕</button><h1>Kiểm tra âm thanh</h1></div>
      <div className="test">
        <div className="card"><h3>1. Loa</h3>
          <button className="btn ghost" onClick={() => speak('你好')}>🔊 Phát thử "你好"</button>
          <p>Nếu không nghe gì: kiểm tra âm lượng laptop và thiết bị phát âm thanh.</p></div>
        <div className="card"><h3>2. Micro</h3>
          <button className="btn ghost" onClick={testMic}>🎤 Kiểm tra micro</button>
          <div className="meter"><div style={{ width: `${level * 100}%` }} /></div>
          <p className={mic.s}>{mic.msg}</p></div>
        <div className="card"><h3>3. Nhận diện giọng nói</h3>
          {!canListen && <p className="fail">{ERRORS['unsupported']}</p>}
          <button className="btn ghost" disabled={!canListen || rec.busy} onClick={testRec}>🗣️ Thử nói 你好</button>
          <p className={rec.s}>{rec.msg}</p>
          <small>Chrome gửi âm thanh lên máy chủ Google để nhận diện nên cần có Internet.</small></div>
      </div>
    </div>
  )
}
