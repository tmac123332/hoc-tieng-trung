"""Tạo mp3 bằng edge-tts (giọng thần kinh miễn phí) cho mọi từ/câu. Chạy: python tools/gen_audio.py tools/texts.json"""
import asyncio, hashlib, json, os, sys
import edge_tts

VOICE = "zh-CN-XiaoxiaoNeural"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")

def name(text): return hashlib.sha1(text.encode()).hexdigest()[:10] + ".mp3"

async def one(sem, text, manifest):
    f = name(text); path = os.path.join(OUT, f)
    if not os.path.exists(path):
        async with sem:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, VOICE, rate="-10%").save(path); break
                except Exception as e:
                    if attempt == 2: print("FAIL", text, e); return
                    await asyncio.sleep(2)
    manifest[text] = f

async def main():
    texts = json.load(open(sys.argv[1], encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    manifest, sem = {}, asyncio.Semaphore(5)
    await asyncio.gather(*(one(sem, t, manifest) for t in texts))
    json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(len(manifest), "/", len(texts), "ok")

asyncio.run(main())
