// Xuất mọi văn bản cần âm thanh ra JSON: npx esbuild tools/export-texts.ts --bundle --platform=node --outfile=tools/.tmp.cjs && node tools/.tmp.cjs tools/texts.json
import { UNITS } from '../src/hsk1'
import { PINYIN_UNITS } from '../src/pinyin'
import fs from 'fs'
const t = new Set<string>()
for (const u of UNITS) for (const r of u.rows) { t.add(r[0]); t.add(r[5]) }
for (const u of PINYIN_UNITS) for (const r of u.rows) t.add(r[1])
fs.writeFileSync(process.argv[2], JSON.stringify([...t]))
console.log(t.size, 'texts')
