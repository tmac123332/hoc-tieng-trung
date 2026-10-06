// So khớp pinyin người dùng gõ với đáp án. Chấp nhận dấu thanh (nǐ hǎo) hoặc số (ni3 hao3), bỏ qua khoảng trắng,
// ü/v/u: đều tính là "ü". Thanh điệu là bắt buộc: đúng âm nhưng sai thanh vẫn bị tính sai (kèm gợi ý riêng).
const MARKED: Record<string, [string, number]> = {}
const ROWS: [string, string][] = [['a', 'āáǎà'], ['e', 'ēéěè'], ['i', 'īíǐì'], ['o', 'ōóǒò'], ['u', 'ūúǔù'], ['v', 'ǖǘǚǜ']]
for (const [base, marks] of ROWS) [...marks].forEach((m, i) => { MARKED[m] = [base, i + 1] })

function parse(s: string) {
  let letters = ''
  const tones: number[] = []
  for (const ch of s.toLowerCase().normalize('NFC')) {
    const m = MARKED[ch]
    if (m) { letters += m[0]; tones.push(m[1]) }
    else if (ch === 'ü') letters += 'v'
    else if (/[a-z]/.test(ch)) letters += ch
    else if (/[1-4]/.test(ch)) tones.push(Number(ch))
  }
  return { letters, tones }
}

export type PinyinResult = 'ok' | 'tone' | 'wrong'

export function checkPinyin(input: string, target: string): PinyinResult {
  const a = parse(input), b = parse(target)
  if (a.letters.replace(/v/g, 'u') !== b.letters.replace(/v/g, 'u')) return 'wrong'
  return a.tones.join() === b.tones.join() ? 'ok' : 'tone'
}
