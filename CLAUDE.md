# Dự án: Học tiếng Trung (web app / PWA)

Cập nhật lần cuối: 2026-10-06. **Cập nhật mục "Trạng thái" và "Việc tiếp theo" sau mỗi lần làm xong một phần.**

## Mục tiêu và người dùng
- Người dùng chính: chủ dự án, sinh viên, không có ngân sách mua gói thuê bao, **chưa biết tiếng Trung**, tiếng Anh cơ bản. Giao tiếp bằng **tiếng Việt**.
- Mục tiêu: thông thạo để giao tiếp và tìm hiểu Trung Quốc. Mốc thực tế: HSK 4–5 (2.0). Học khoảng 30 phút/ngày.
- Người dùng sau: con 6 tuổi của chủ dự án (chưa đọc nhiều chữ). **Làm sau**, người lớn học trước. Giao diện hiện tại vẫn sáng, nút to, kiểu trò chơi.
- Tính năng mong muốn: trò chơi hóa, nhận diện giọng nói, lộ trình cá nhân hóa + bài ngắn, trắc nghiệm / đúng sai, giao diện thân thiện.
- Nguyên tắc: **miễn phí hoàn toàn**, ưu tiên mã nguồn mở, làm từng phần để chủ dự án học thử rồi góp ý.

## Công nghệ
React 18 + TypeScript + Vite 5, không có backend. Tiến độ lưu `localStorage` (khóa `htt-progress-v1`), mỗi thiết bị riêng, **chưa đồng bộ**.
PWA: `public/sw.js` (cache-first cho tệp tĩnh và âm thanh, network-first cho trang), `public/manifest.webmanifest`. Vite `base: './'`.

## Cấu trúc
| Đường dẫn | Việc |
|---|---|
| `src/hsk1.ts` | 150 từ HSK1 (2.0) + "你好", 19 bài × 8 từ. Tuple: hán tự, pinyin, nghĩa Việt, Hán Việt, emoji, câu ví dụ (zh, pinyin, Việt) |
| `src/pinyin.ts` | 8 bài phát âm (thanh điệu, nguyên âm, phụ âm, vần), kèm gợi ý tiếng Việt |
| `src/data.ts` | Gộp thành `LESSONS` (pinyin trước, HSK sau) và `ALL_WORDS` |
| `src/exercises.ts` | Sinh bài tập: học từ, chọn nghĩa, chọn chữ Hán, nghe-chọn, đúng/sai, đọc to |
| `src/Lesson.tsx` | Màn hình bài học, kết quả, tính XP/sao, lặp lại câu sai cuối bài |
| `src/store.ts` | XP, streak, mục tiêu ngày, sao, hệ thống "box" ôn tập (Leitner, **tạm thời**) |
| `src/speech.ts` | Phát mp3 dựng sẵn (khuếch đại ×3, `GAIN`), nhận diện giọng nói (Web Speech API), đo micro |
| `src/MicTest.tsx` | Màn hình kiểm tra loa, micro, nhận diện (nút 🎤✔ ở trang chủ) |
| `src/App.tsx` | Trang chủ: bản đồ bài (mở khóa tuần tự), nút "Ôn tập dành riêng cho bạn" |
| `public/audio/` | 339 mp3 + `manifest.json` (văn bản → tên tệp, tên = sha1 10 ký tự) |
| `tools/` | `export-texts.ts` + `gen_audio.py` tạo âm thanh bằng edge-tts |
| `data-src/` | Bộ HSK gốc tải về để đối chiếu, **không commit** (trong .gitignore) |

## Lệnh thường dùng
- Chạy thử: `npm run dev` (http://localhost:5173, `--host` để thử qua Wi-Fi nhưng khi đó micro không chạy vì không có HTTPS).
- Kiểm tra: `npx tsc`; build: `npm run build`.
- Thêm/sửa từ rồi tạo lại âm thanh (chỉ tạo phần thiếu):
  `npx esbuild tools/export-texts.ts --bundle --platform=node --outfile=tools/.tmp.cjs && node tools/.tmp.cjs tools/texts.json && python tools/gen_audio.py tools/texts.json`
  (cần `pip install edge-tts`; giọng `zh-CN-XiaoxiaoNeural`, rate -10%).

## Triển khai
- Kho: https://github.com/tmac123332/hoc-tieng-trung (public). Trang: https://tmac123332.github.io/hoc-tieng-trung/
- Đẩy lên nhánh `main` → GitHub Actions (`.github/workflows/deploy.yml`) tự build và đăng, mất 1–2 phút.
- Git cấu hình cục bộ: user `tmac123332`. Commit kèm dòng `Co-Authored-By` theo hướng dẫn của hệ thống.
- Sau khi đẩy mã, người dùng có thể phải đóng/mở lại app để nhận bản mới (service worker).

## Trạng thái hiện tại
**Đã xong:**
- Bản học đầy đủ: 8 bài phát âm + 19 bài HSK1 (151 từ), 339 mp3, mở khóa tuần tự, XP/streak/sao, ôn tập từ yếu.
- Nhận diện giọng nói + màn hình kiểm tra micro; lỗi kỹ thuật không bị tính là đọc sai.
- PWA (cài được, offline), đã đăng lên GitHub Pages, đã sửa bố cục cho điện thoại (360 px, đã kiểm tra bằng khung giả lập, **chưa thử máy thật**).

**Chưa làm / chưa kiểm chứng:**
- Chưa thử cài PWA và micro trên điện thoại thật. iPhone/Safari: nhận diện giọng nói không ổn định → **luyện nói nên dùng Android + Chrome**.
- Chưa có nhảy cóc / kiểm tra đầu vào (các bài đang khóa tuần tự).
- Ôn tập vẫn là Leitner "box" tạm thời, chưa phải FSRS.
- Chưa có chế độ cho bé, hồ sơ nhiều người dùng, đồng bộ giữa thiết bị.

## Việc tiếp theo (theo thứ tự đã thống nhất)
1. Chủ dự án học thử, góp ý (giọng đọc, gợi ý phát âm, thứ tự bài, lỗi giao diện).
2. Chọn: **HSK2** (150 từ nữa) hay **ngữ pháp + hội thoại** cho HSK1.
3. Thay hệ thống box bằng **FSRS** (thư viện `ts-fsrs`, MIT).
4. Nét chữ (Hanzi Writer), bài sắp xếp câu, ghép cặp, mascot/hiệu ứng.
5. Lộ trình HSK3 → HSK4. Sau cùng: chế độ cho bé, đồng bộ thiết bị.
6. Cân nhắc dùng bộ âm thanh người thật **Tone Perfect** (MSU) cho thanh điệu, khi xác minh được giấy phép.

## Quyết định và bài học quan trọng
- **Dữ liệu mở HSK không dùng thẳng được:** `complete-hsk-vocabulary` (MIT) chỉ có nghĩa tiếng Anh, và dạng đầu tiên của nhiều chữ bị sai cách đọc/nghĩa (vd. 都 → "Dū họ Đỗ", 读 → "dòu", 听 → "yǐn"). Vì vậy **biên soạn tay** pinyin và nghĩa Việt, chỉ dùng bộ gốc để đối chiếu danh sách từ. Khi thêm HSK2+ phải làm cùng cách.
- Nghĩa Việt, Hán Việt, câu ví dụ do Claude soạn, **chưa người bản ngữ duyệt**. Hán Việt chỉ là mẹo nhớ. Cần chủ dự án đối chiếu với nguồn thứ hai.
- Âm thanh: edge-tts (GPL-3.0, chỉ dùng làm công cụ tạo tệp, gọi dịch vụ của Microsoft) → **chỉ phù hợp dùng cá nhân**; xem lại điều khoản nếu phát hành rộng. File mp3 nhỏ nên khuếch đại ×3 trong trình duyệt (tham số âm lượng của edge-tts không có tác dụng).
- Tránh chép code **LibreLingo** (AGPL-3.0). CC-CEDICT yêu cầu ghi nguồn (CC BY-SA). Hanzi Writer: code MIT, dữ liệu nét chữ theo Arphic Public License.
- Tham khảo chính: MyHSK (github.com/iambiniyam/myhsk, MIT) cùng stack.

## Ghi chú làm việc
- Chrome tool: cửa sổ Chrome do công cụ tự mở **không đăng nhập**. Dùng `switch_browser` để kết nối Chrome thật của chủ dự án.
- **Không bao giờ nhập mật khẩu hoặc bấm đăng nhập thay chủ dự án**; việc cần đăng nhập thì hướng dẫn họ tự làm.
- Việc công khai (đẩy mã, đổi cài đặt tài khoản) chỉ làm khi chủ dự án đã đồng ý rõ.
- Khi ghi tệp có tiếng Việt hoặc nhiều dấu nháy, dùng công cụ Write/Edit, tránh heredoc dài trong Bash (đã gặp lỗi phân tích cú pháp).
- Ước lượng số từ HSK: 2.0 tích lũy 150/300/600/1.200/2.500/5.000; 3.0 khoảng 11.000 (9 cấp). HSK không đo mức bản địa.
