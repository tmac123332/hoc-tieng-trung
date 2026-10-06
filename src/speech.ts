// Dùng Web Speech API có sẵn của trình duyệt (miễn phí). Nhận diện giọng nói hoạt động tốt nhất trên Chrome/Edge.
let manifest: Record<string, string> = {}
const manifestReady = fetch(`${import.meta.env.BASE_URL}audio/manifest.json`).then(r => r.json()).then(m => { manifest = m }).catch(() => {})
let current: HTMLAudioElement | null = null

function synth(text: string) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'; u.rate = 0.8
  const v = speechSynthesis.getVoices().find(v => v.lang.startsWith('zh'))
  if (v) u.voice = v
  speechSynthesis.speak(u)
}

/** Phát file mp3 dựng sẵn (giọng thần kinh); không có file thì dùng giọng của trình duyệt. */
export async function speak(text: string) {
  await manifestReady
  current?.pause()
  const f = manifest[text]
  if (!f) return synth(text)
  const el = new Audio(`${import.meta.env.BASE_URL}audio/${f}`)
  current = el
  try { boost(el) } catch { /* không khuếch đại được thì phát âm lượng gốc */ }
  el.play().catch(() => synth(text))
}

// File mp3 do edge-tts tạo ra khá nhỏ: khuếch đại bằng Web Audio, có bộ nén để không bị rè khi quá to.
const GAIN = 3
let audioCtx: AudioContext | null = null
let bus: GainNode | null = null
function boost(el: HTMLAudioElement) {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    bus = audioCtx.createGain(); bus.gain.value = GAIN
    const comp = audioCtx.createDynamicsCompressor()
    comp.threshold.value = -12; comp.ratio.value = 12
    bus.connect(comp).connect(audioCtx.destination)
  }
  if (audioCtx.state === 'suspended') void audioCtx.resume()
  audioCtx.createMediaElementSource(el).connect(bus!)
}

const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
export const canListen = !!SR

const clean = (s: string) => s.replace(/[\s，。？！,.?!、]/g, '')

const NO_PERMISSION = 'Trình duyệt chưa được phép dùng micro. Bấm biểu tượng ổ khóa cạnh thanh địa chỉ → cho phép Micro.'
export const ERRORS: Record<string, string> = {
  'not-allowed': NO_PERMISSION,
  'service-not-allowed': NO_PERMISSION,
  'audio-capture': 'Không tìm thấy micro. Kiểm tra micro đã cắm/bật và chọn đúng thiết bị trong Cài đặt âm thanh của Windows.',
  'network': 'Nhận diện giọng nói của Chrome cần Internet (xử lý trên máy chủ Google). Hãy kiểm tra kết nối mạng.',
  'no-speech': 'Không nghe thấy tiếng nói. Hãy nói to hơn, gần micro hơn.',
  'language-not-supported': 'Trình duyệt không hỗ trợ tiếng Trung cho nhận diện giọng nói.',
  'unsupported': 'Trình duyệt này không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.',
}

export interface ListenResult { ok: boolean; heard: string; error?: string }

/** Nghe người dùng nói. onLive nhận chữ tạm thời để người dùng thấy máy đang nghe. target=null: chỉ kiểm tra có nghe được hay không. */
export function listen(target: string | null, onLive?: (text: string) => void): Promise<ListenResult> {
  return new Promise(resolve => {
    if (!SR) return resolve({ ok: false, heard: '', error: 'unsupported' })
    const r = new SR()
    r.lang = 'zh-CN'; r.maxAlternatives = 5; r.interimResults = true
    let done = false, last = ''
    const finish = (res: ListenResult) => { if (!done) { done = true; try { r.stop() } catch { /* đã dừng */ } resolve(res) } }
    const silent = (): ListenResult => last ? { ok: false, heard: last } : { ok: false, heard: '', error: 'no-speech' }
    r.onresult = (e: any) => {
      const res = e.results[e.results.length - 1]
      const alts: string[] = Array.from(res as ArrayLike<any>).map((a: any) => clean(a.transcript))
      last = alts[0] ?? ''
      onLive?.(last)
      if (res.isFinal) finish({ ok: target ? alts.some(a => a.includes(clean(target))) : true, heard: last })
    }
    r.onerror = (e: any) => finish({ ok: false, heard: last, error: e.error })
    r.onend = () => finish(silent())
    try { r.start() } catch { finish({ ok: false, heard: '', error: 'audio-capture' }) }
    setTimeout(() => finish(silent()), 8000)
  })
}

/** Đo mức âm thanh từ micro (0..1). Trả về hàm dừng. Ném lỗi nếu không có quyền/không có micro. */
export async function meterMic(onLevel: (v: number) => void): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const ctx = new AudioContext(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser()
  an.fftSize = 512; src.connect(an)
  const buf = new Uint8Array(an.fftSize); let raf = 0
  const tick = () => {
    an.getByteTimeDomainData(buf)
    let max = 0; for (const b of buf) max = Math.max(max, Math.abs(b - 128))
    onLevel(Math.min(1, max / 64)); raf = requestAnimationFrame(tick)
  }
  tick()
  return () => { cancelAnimationFrame(raf); stream.getTracks().forEach(t => t.stop()); ctx.close() }
}
