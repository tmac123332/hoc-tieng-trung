// Chặng phát âm: pinyin + 4 thanh điệu. Gợi ý so sánh với tiếng Việt chỉ mang tính gần đúng.
// Tuple: [pinyin, chữ mẫu (để tạo âm thanh), gợi ý tiếng Việt]
export type PRow = [string, string, string]
export interface PUnit { id: string; title: string; icon: string; rows: PRow[] }

export const PINYIN_UNITS: PUnit[] = [
  { id: 'p-tones', title: '4 thanh điệu', icon: '🎵', rows: [
    ['mā', '妈', 'Thanh 1: cao và đều, kéo dài như hát "aaa" (gần dấu ngang)'],
    ['má', '麻', 'Thanh 2: đi lên, như hỏi lại "hả?" (gần dấu sắc)'],
    ['mǎ', '马', 'Thanh 3: xuống thấp rồi lên nhẹ, như "ử…" (gần dấu hỏi)'],
    ['mà', '骂', 'Thanh 4: rơi nhanh từ cao xuống, dứt khoát như ra lệnh "ừ!"'],
    ['ma', '吗', 'Thanh nhẹ: ngắn, nhẹ, không nhấn (như trợ từ 吗)'],
  ] },
  { id: 'p-tones2', title: 'Luyện thanh điệu', icon: '🎶', rows: [
    ['yī', '衣', 'thanh 1 – "y phục" (quần áo)'], ['yí', '姨', 'thanh 2 – dì'],
    ['yǐ', '椅', 'thanh 3 – cái ghế'], ['yì', '意', 'thanh 4 – ý nghĩa'],
    ['bā', '八', 'thanh 1 – số tám'], ['bá', '拔', 'thanh 2 – nhổ, rút'],
    ['bǎ', '把', 'thanh 3 – nắm, cầm'], ['bà', '爸', 'thanh 4 – bố'],
  ] },
  { id: 'p-vowels', title: 'Nguyên âm đơn', icon: '🅰️', rows: [
    ['ā', '啊', 'như "a" trong "ba", há miệng to'],
    ['ō', '哦', 'như "ô", môi tròn'],
    ['é', '鹅', 'giống "ơ" nhưng nói sâu trong cổ, môi dẹt (tiếng Việt không có)'],
    ['yī', '衣', 'như "i" trong "đi"'],
    ['wū', '乌', 'như "u" trong "mu", môi tròn nhỏ'],
    ['yú', '鱼', 'ü: môi tròn như nói "u" nhưng phát âm "i" (gần "uy" kéo dài)'],
  ] },
  { id: 'p-cons1', title: 'Phụ âm b p m f d t n l', icon: '👄', rows: [
    ['bā', '八', 'b: như "b/p" nhẹ, không bật hơi'], ['pā', '趴', 'p: như "p" bật hơi mạnh (thổi tờ giấy bay)'],
    ['mā', '妈', 'm: như "m" tiếng Việt'], ['fā', '发', 'f: như "ph" (răng cắn môi dưới)'],
    ['dā', '搭', 'd: như "t" nhẹ, không bật hơi'], ['tā', '他', 't: như "th" bật hơi mạnh'],
    ['nà', '那', 'n: như "n"'], ['lā', '拉', 'l: như "l"'],
  ] },
  { id: 'p-cons2', title: 'Phụ âm g k h j q x', icon: '🗣️', rows: [
    ['gē', '哥', 'g: như "c/k" nhẹ, không bật hơi'], ['kē', '科', 'k: như "kh" bật hơi mạnh'],
    ['hē', '喝', 'h: như "h" nhưng gằn ở cổ họng'], ['jī', '鸡', 'j: như "chi" nhẹ, lưỡi áp hàm trên, môi cười'],
    ['qī', '七', 'q: như "chi" bật hơi mạnh'], ['xī', '西', 'x: như "xi" nhưng môi cười, lưỡi áp răng dưới'],
  ] },
  { id: 'p-cons3', title: 'Phụ âm zh ch sh r z c s', icon: '🌀', rows: [
    ['zhī', '知', 'zh: cuộn lưỡi, như "tr" nhẹ'], ['chī', '吃', 'ch: cuộn lưỡi, như "tr" bật hơi mạnh'],
    ['shī', '师', 'sh: cuộn lưỡi, như "s" (Nam)'], ['rì', '日', 'r: cuộn lưỡi, giữa "r" và "d"'],
    ['zì', '字', 'z: như "ts", lưỡi bằng, không bật hơi'], ['cì', '次', 'c: như "ts" bật hơi mạnh'],
    ['sì', '四', 's: như "x" (xì), lưỡi bằng'],
  ] },
  { id: 'p-finals1', title: 'Vần ai ei ao ou an en', icon: '🔗', rows: [
    ['ài', '爱', 'ai: như "ai" trong "mai"'], ['hēi', '黑', 'ei: như "ây" trong "hây", hơi ngắn'],
    ['hǎo', '好', 'ao: như "ao" trong "cao"'], ['ōu', '欧', 'ou: như "âu" trong "câu"'],
    ['shān', '山', 'an: như "an" trong "san"'], ['rén', '人', 'en: như "ân" trong "nhân"'],
    ['máng', '忙', 'ang: như "ang" trong "mang"'], ['péng', '朋', 'eng: như "ơng" kéo dài'],
  ] },
  { id: 'p-finals2', title: 'Vần ong uo uan ü', icon: '🌟', rows: [
    ['dōng', '东', 'ong: như "ung" trong "đông"'], ['zhōng', '中', 'ong sau "zh": như "trung"'],
    ['wǒ', '我', 'uo: như "ua" + "ô" liền nhau'], ['guó', '国', 'uo sau g: như "cuô"'],
    ['yuè', '月', 'üe: như "uê" nhưng môi tròn'], ['nǚ', '女', 'ü: môi tròn, phát "i" (như "nuy" kéo dài)'],
    ['lǜ', '绿', 'ü sau l: như "luy", thanh 4'], ['xué', '学', 'üe sau x: như "xuê" môi tròn'],
  ] },
]
