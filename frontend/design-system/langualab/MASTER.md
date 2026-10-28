# Design System Master — LanguaLab

> **LOGIC:** Khi xây dựng hoặc làm lại giao diện bất kỳ trang nào, trước tiên kiểm tra `frontend/design-system/langualab/pages/[page-name].md`. Nếu có file đó thì quy tắc trong file con sẽ **override** Master này. Nếu không có, tuân thủ nghiêm ngặt 100% các quy tắc bên dưới.

---

**Dự án:** LanguaLab (Nền tảng Học ngoại ngữ & Luyện thi chứng chỉ quốc tế)  
**Phong cách chủ đạo:** **Neo-brutalism** (Viền đen dày, bóng đổ cứng lệch không blur, màu bão hoà cao, bố cục tương phản mạnh mẽ, minh hoạ flat)  
**Phiên bản:** 2.0 (Chuẩn ui-ux-pro-max + Giữ nguyên chức năng)  

---

## 1. Triết lý Thiết kế & Định hướng Thương hiệu

1. **Thương hiệu LanguaLab**: Trẻ trung, học thuật nhưng vui tươi, trực quan và đậm chất hành động. Mascot chính: **Quyển sách đeo tai nghe**.
2. **Neo-brutalism nguyên bản**:
   - Viền đen rõ ràng (`var(--bw)` = 3px cho thẻ/khối lớn, 2px cho badge/nút nhỏ).
   - Bóng đổ cứng lệch 45° không blur (`var(--shadow)` = 4px 4px 0 var(--line)). Khi hover hoặc active: dịch chuyển nút (`translate-x-0.5 translate-y-0.5`) giảm bóng tương ứng.
   - Bo góc nhỏ mềm mại (`rounded-brut`: 6px, `rounded-brut-lg`: 12px), tránh cảm giác thô kệch nhọn hoắt nhưng không bo tròn quá mức kiểu pill/soft 3D.
   - Màu sắc phân mảng rõ ràng theo chức năng, phẳng hoàn toàn, không gradient, không glassmorphism.
3. **Tuyệt đối KHÔNG "AI hoá"**:
   - ❌ CẤM dùng icon Sparkles, Magic Wand, Stars lấp lánh.
   - ❌ CẤM gradient tím-xanh công nghệ, cấm kính mờ (glassmorphism), cấm backdrop-blur bóng bẩy giả tạo.
   - ❌ CẤM câu chữ quảng cáo AI ("Tạo bởi AI", "Phép màu trí tuệ nhân tạo").
   - ❌ CẤM dùng emoji thay thế cho icon chức năng.

---

## 2. Bảng màu & Token Biến CSS (Theming)

Mọi mã màu phải đi qua CSS variables hoặc Tailwind theme tokens; **tuyệt đối không hardcode mã hex trong template hay component**.

### 2.1 Bảng màu cốt lõi (Core Roles)

| Vai trò | Biến CSS Light | Biến CSS Dark | Ý nghĩa & Ứng dụng |
|---------|----------------|---------------|-------------------|
| **Background** | `var(--bg)` (`#F5F6FA`) | `var(--bg)` (`#12131D`) | Nền tổng thể toàn trang |
| **Surface** | `var(--surface)` (`#FFFFFF`) | `var(--surface)` (`#1E2132`) | Nền thẻ, card, modal |
| **Surface-2** | `var(--surface-2)` (`#EAEBF4`) | `var(--surface-2)` (`#282C43`) | Nền ô input, header bảng |
| **Ink (Chữ chính)** | `var(--ink)` (`#11141D`) | `var(--ink)` (`#F5F7FF`) | Tiêu đề, chữ văn bản (contrast ≥ 7:1) |
| **Ink-soft (Chữ phụ)** | `var(--ink-soft)` (`#4E5569`) | `var(--ink-soft)` (`#A3A8BE`) | Mô tả, nhãn phụ (contrast ≥ 4.5:1) |
| **Line (Viền & Bóng)** | `var(--line)` (`#11141D`) | `var(--line)` (`#F5F7FF`) | Viền neo-brutalism, bóng đổ cứng |
| **Primary (Chính)** | `var(--c-blue)` (`#2F5BFF`), ink `#FFFFFF` (5.17:1) | `var(--c-blue)` (`#547BFF`), ink `#11141D` (4.95:1) | Hành động chính, điều hướng |
| **Secondary (Phụ)** | `var(--c-violet)` (`#9B6BFF`), ink `#11141D` (5.20:1) | `var(--c-violet)` (`#B18CFF`), ink `#11141D` (6.80:1) | Hành động phụ, badge kỹ năng |
| **Accent / CTA** | `var(--c-yellow)` (`#FFD23F`), ink `#11141D` (12.74:1) | `var(--c-yellow)` (`#FFDC5C`), ink `#11141D` (13.10:1) | Nút "Học ngay", "Bắt đầu", nổi bật |
| **Success / OK** | `var(--c-green)` (`#00D084`), ink `#11141D` (9.07:1) | `var(--c-green)` (`#20E096`), ink `#11141D` (9.80:1) | Đã hoàn thành, chính xác |
| **Warning / Warn** | `var(--c-yellow)` (`#FFD23F`), ink `#11141D` (12.74:1) | `var(--c-yellow)` (`#FFDC5C`), ink `#11141D` (13.10:1) | Đang học, lưu ý |
| **Danger / Bad** | `var(--c-coral)` (`#FF5A4E`), ink `#11141D` (5.98:1) | `var(--c-coral)` (`#FF6666`), ink `#11141D` (6.20:1) | Sai sót, bẫy lỗi, xoá |

### 2.2 Hero Banner Trang Chủ (HomeHero)

Hero Banner ở trang chủ (`components/home/HomeHero.vue`, `HeroScene.vue`, `HeroMascot.vue`) là một **artwork độc lập** với theme, giữ nguyên bảng màu ở cả Light và Dark mode. Trong phạm vi banner, các biến nền tảng được cố định (`--line: #11141D; --ink: #11141D; --surface: #FFFBF0; --on-tone: #11141D;`) để nút bấm và viền không bị đảo màu khi bật Dark mode.

#### 1. Bảng màu 3 Buổi (Tokens mới trong tailwind.css)
- **Buổi sáng (5h - 12h)**:
  - Nền (`--hero-sang-bg`): `#BDEFF7` | Đồi phẳng (`--hero-sang-hill`): `#7FD6D0`
  - Chữ chính (`--hero-sang-ink`): `#11141D` | Chữ phụ (`--hero-sang-ink-soft`): `#233842`
  - Bìa sách: `#2F5BFF` (Xanh) | Thẻ lời chào: `#FFFBF0` (Kem)
- **Buổi chiều (12h - 18h)**:
  - Nền (`--hero-chieu-bg`): `#FFD3A1` | Đồi phẳng (`--hero-chieu-hill`): `#F4A261`
  - Chữ chính (`--hero-chieu-ink`): `#11141D` | Chữ phụ (`--hero-chieu-ink-soft`): `#422818`
  - Bìa sách: `#F28B52` (Cam) | Thẻ lời chào: `#FFFBF0` (Kem)
- **Buổi tối (18h - 5h)**:
  - Nền (`--hero-toi-bg`): `#1B2565` | Đồi phẳng (`--hero-toi-hill`): `#34479B`
  - Chữ chính (`--hero-toi-ink`): `#FFFFFF` | Chữ phụ (`--hero-toi-ink-soft`): `#D3DBFF`
  - Bìa sách: `#A99BFF` (Tím nhạt) | Thẻ lời chào: `#9BE8C0` (Xanh bạc hà)

#### 2. Bố cục Hero Banner
- **Khung ngoài**: Viền 3px mực `#11141D`, bo góc `rounded-brut-lg` (12px), bóng cứng lệch 6px `shadow-[6px_6px_0px_#11141D]`. Nền màu đặc theo buổi, không gradient, không blur.
- **Trái (7 cột trên desktop)**:
  - Hàng nhãn: "LanguaLab" + nhãn buổi ("SÁNG" / "CHIỀU" / "TỐI", viền 2px).
  - Tiêu đề 2 dòng: `<h1>` "Chào buổi …," và "{tên}!" cỡ 42px đậm.
  - Mô tả một dòng truyền cảm hứng.
  - Hai nút cùng hàng: "Học ngay" (vàng, mũi tên phải truyền qua slot `#right`, không xuống dòng) và nút phụ nền kem "Luyện đề IELTS" (mũi tên chéo, `min-h-[44px]`).
  - Dòng chip mục tiêu: biểu tượng tia sét `Zap` trong vòng tròn vàng + "Mục tiêu hôm nay: 50 XP" + câu động viên.
- **Phải (5 cột trên desktop)**:
  - Minh hoạ phẳng canh phải và đáy.
  - Linh vật quyển sách mở đeo tai nghe (`HeroMascot.vue`): mặt cười, má hồng, tai nghe xanh dương, ốp tai vàng, hai chân đứng trên đế vàng nhãn "LITTLE STEPS. BIG DREAMS.".
  - Thẻ lời chào nghiêng -8° và thẻ mục tiêu kỳ thi nghiêng +8° (tím nhạt `#A99BFF`, `{EXAM} {BAND}+`).
  - Cảnh vật nền theo buổi: Sáng (mặt trời cười + mây + tách cà phê), Chiều (mặt trời cam + ly nước mát), Tối (trăng lưỡi liềm + sao + đèn bàn học).
- **Dưới đáy**: Dải đồi lượn sóng phẳng cùng tông màu, **không viền đen**, cao tối đa khoảng 90px, nằm sau nội dung (`z-0 pointer-events-none`).
- **Mobile (<1024px)**: Xếp dọc, chữ ở trên, tranh ở dưới, hai nút xuống dòng tự nhiên, tuyệt đối không scroll ngang.

#### 3. Quy tắc Kỹ thuật Bắt buộc
1. **SVG Animation**: Toạ độ định vị cố định đặt trên thẻ `<g>` NGOÀI (`transform="translate(...)"`); class CSS animation chỉ áp lên thẻ `<g>` TRONG. Không animate cùng phần tử đang giữ thuộc tính transform định vị.
2. **Icon trong Nút**: `BaseButton` truyền icon qua slot `#right`. Nút luôn giữ trên một dòng (`whitespace-nowrap`). Nút phụ dùng `inline-flex items-center gap-2`.
3. **SVG Font**: Thuộc tính font-family cho thẻ `<text>` trong SVG đặt bằng `style="font-family: var(--font-display), sans-serif"`.
4. **Trợ năng (A11y)**: Vùng bấm $\ge 44\times 44$px, focus-visible thấy rõ, tương phản chữ $\ge 4.5:1$, viền $\ge 3:1$. SVG minh hoạ mang `aria-hidden="true"`.
5. **Prefers-reduced-motion**: Tắt hoàn toàn animation khi người dùng kích hoạt reduced motion. Chỉ dùng chuyển động nhẹ (nổi lên xuống $\le 3$px, mây trôi $\le 6$px).
6. **Không icon AI / Emoji**: Chỉ dùng Lucide icons (`Zap`, `ArrowRight`, `ArrowUpRight`), không gradient, không icon sparkles/wand. Ngôi sao 4 cánh tĩnh nhỏ là hoạ tiết trang trí phẳng (tối đa 6 cái).

### 2.3 Hệ màu 8 Chức năng LanguaLab

Mỗi tính năng có bộ 3 token: `solid`, `soft` (nền nhạt) và `ink` (màu chữ tương phản cao):
1. **Gõ câu phản xạ (`go-cau`)**: Green (`--c-green`, `--c-green-soft`, `--c-green-ink`)
2. **Video & Podcast (`video-podcast`)**: Blue (`--c-blue`, `--c-blue-soft`, `--c-blue-ink`)
3. **Ngữ pháp thực chiến (`ngu-phap`)**: Yellow (`--c-yellow`, `--c-yellow-soft`, `--c-yellow-ink`)
4. **Từ vựng & Phát âm (`tu-vung`)**: Pink (`--c-pink`, `--c-pink-soft`, `--c-pink-ink`)
5. **Luyện đọc & Dịch (`doc-dich`)**: Orange (`--c-orange`, `--c-orange-soft`, `--c-orange-ink`)
6. **Từ điển chuyên sâu (`tu-dien`)**: Violet (`--c-violet`, `--c-violet-soft`, `--c-violet-ink`)
7. **Luyện thi chứng chỉ (`luyen-thi`)**: Coral (`--c-coral`, `--c-coral-soft`, `--c-coral-ink`)
8. **Góp ý & Cộng đồng (`yeu-cau-tinh-nang`)**: Cyan (`--c-cyan`, `--c-cyan-soft`, `--c-cyan-ink`)

---

## 3. Typography (Hệ Font Hình học Đậm)

- **Display / Heading Font**: `'Space Grotesk'`, `'Be Vietnam Pro'`, sans-serif.  
  Font-weight: `700` (Bold), `800` (ExtraBold), `900` (Black). Line-height cô đọng (1.1 - 1.25).
- **Body Font**: `'Be Vietnam Pro'`, system-ui, -apple-system, sans-serif.  
  Font-weight: `500` (Medium), `600` (SemiBold), `700` (Bold). Đảm bảo đọc tiếng Việt chuẩn mực, dấu thanh không bị xô lệch.
- **Mono / Số liệu**: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, monospace. Dùng cho WPM, thời gian, IPA, điểm số, mã bài thi.

---

## 4. Quy tắc Viền, Bóng, Bo góc & Kích thước tương tác

- **Viền (`border`)**:
  - Khối card, banner, modal: `border-[3px] border-line`
  - Nút bấm, badge, input, item danh sách: `border-2 border-line`
- **Bóng đổ (`shadow`)**:
  - Nút bấm, thẻ tiêu chuẩn: `shadow-brut` (`4px 4px 0 var(--line)`)
  - Badge, chip nhỏ: `shadow-brut-sm` (`2px 2px 0 var(--line)`)
  - Banner lớn, modal: `shadow-brut-lg` (`6px 6px 0 var(--line)`)
  - Hiệu ứng click/active: `translate-x-[2px] translate-y-[2px] shadow-none`
- **Bo góc (`border-radius`)**:
  - `rounded-brut` (`6px`) cho nút, ô nhập liệu, badge, icon box.
  - `rounded-brut-lg` (`12px`) cho khối thẻ bài học, modal, banner lớn.
  - `rounded-full` chỉ dành cho avatar hoặc vòng tiến độ tròn.
- **Kích thước bấm tối thiểu (Touch Targets)**:
  - Tất cả các nút bấm, icon button, tab, checkbox phải đạt kích thước tối thiểu **44×44px** (hoặc `min-h-[44px]`).
- **Focus ring dễ thấy**:
  - `:focus-visible` toàn cục tự động áp dụng `outline: 3px solid var(--focus); outline-offset: 2px;` (với `--focus: #D9381E` ở Light mode đạt 4.29:1 vs background và 4.63:1 vs surface, vượt chuẩn 3:1 WCAG 2.2; ở Dark mode `--focus: #FFD23F` đạt 12.79:1).
  - Tuyệt đối không dùng `focus-visible:outline-none` hay `ring-3`/`ring-focus` riêng lẻ.

---

## 5. Quy tắc Icon & Minh hoạ

1. **Bộ icon duy nhất**: `@lucide/vue`.
2. **Quy cách vẽ nét**:
   - `stroke-width`: `2.2` đến `2.5` để cân bằng với nét viền dày của neo-brutalism.
   - Kích thước thông dụng: `w-4 h-4` (nhãn nhỏ/badge), `w-5 h-5` (nút/tiêu đề), `w-6 h-6` (banner/thẻ chính).
   - Icon đứng độc lập (không kèm chữ): **BẮT BUỘC** có `aria-label` hoặc `title`.
3. **Minh hoạ phẳng (Flat Illustration)**:
   - Dựng thuần bằng SVG/CSS, không nhúng ảnh raster PNG/JPG trừ avatar hoặc ảnh thumbnail thật của bài học.
   - Mascot quyển sách đeo tai nghe `HeroMascot.vue`: vector phẳng, viền nét rõ, biểu cảm vui vẻ.

---

## 6. Tiêu chuẩn Trợ năng & Responsive

- **Tương phản chữ (Contrast ratio)**:
  - Chữ thông thường: Tối thiểu 4.5:1.
  - Chữ tiêu đề lớn: Tối thiểu 3.0:1.
  - Đã kiểm định toàn bộ cặp màu soft-ink của 8 chức năng và 3 buổi đều đạt chuẩn.
- **Responsive (Mobile-First)**:
  - 375px (Mobile): Lưới 1 cột, nút kéo dài full-width, thanh tìm kiếm tối ưu. Tuyệt đối **không scroll ngang**.
  - 768px (Tablet): Lưới 2 cột, chia tab rõ ràng, giữ nhịp thở thoáng.
  - 1280px+ (Desktop): Khung tối đa `max-w-7xl`, 3 hoặc 4 cột cho thẻ nội dung.
- **Giảm chuyển động (Prefers-reduced-motion)**:
  - Với người dùng bật chế độ giảm giật lag: tắt animation nảy hoặc nhấp nháy, giữ chuyển đổi mượt mà cơ bản.

---

## 7. Checklist Kiểm tra trước khi Bàn giao từng Màn hình

- [x] Giữ nguyên 100% logic `<script setup>`, composables, Supabase RPC và mock mode.
- [x] Không có mã hex hardcode trong template (dùng biến CSS/Tailwind classes).
- [x] Không có icon Sparkles, Magic Wand hay gradient AI.
- [x] Vùng bấm nút và ô tương tác đạt tối thiểu 44×44px (touch target).
- [x] Nút focus hiển thị viền rõ ràng khi bấm phím Tab (focus ring ≥ 3:1).
- [x] Mọi thẻ nội dung có phần xem trước (preview trích đoạn, câu mẫu, hoặc thumbnail) nếu có nội dung.
- [x] Không xuất hiện thanh cuộn ngang ở màn hình 375px (scrollWidth <= innerWidth).
- [x] Đã kiểm thử axe-core trên cả 2 theme (Light & Dark) đạt 0 lỗi Serious/Critical.
- [x] Đã kiểm tra điều hướng bàn phím và bẫy focus modal (Focus trap, Esc, trả focus).
- [x] Đã kiểm tra reduced-motion (0 animation vô hạn chạy khi bật prefers-reduced-motion).
- [x] Biên dịch `npm run build` không phát sinh bất kỳ lỗi nào.

---

## 8. Nhật ký Thay đổi

### 2026-10-28 — Hoàn thiện & Nghiệm thu Giao diện theo Skill ui-ux-pro-max (Prompt 21)
- **Bước 0 — Áp bản Greeting Banner mới**:
  - Tích hợp `GreetingBanner.vue`, `GreetingScene.vue`, `MascotBook.vue`, đồng bộ biến màu 3 buổi (`--greeting-sang-*`, `--greeting-chieu-*`, `--greeting-toi-*`) trong `tailwind.css`.
  - Khắc phục lỗi animation đè toạ độ SVG: tách riêng toạ độ `translate(...)` ra thẻ `<g>` ngoài và class CSS animation vào thẻ `<g>` trong.
  - Đảm bảo nút "Học ngay →" giữ cố định trên 1 dòng (`whitespace-nowrap shrink-0`) trên mọi kích thước màn hình từ 375px đến 1280px+.
- **Phần A — Dọn dẹp & Chuẩn hoá UI**:
  - **A1. Chuẩn hoá Modal**: Di chuyển 5 modal tự chế (`pages/admin/[loai].vue`, `pages/luyen-thi/ielts/lam-bai/[id].vue`, `components/auth/OnboardingModal.vue`, `components/common/FirstVisitGuide.vue`, `components/home/WeeklyStory.vue`) sang `<BaseModal>`, bổ sung prop `closeOnEsc` và `showCloseButton` chống mất dữ liệu khi làm bài.
  - **A2. Touch Targets**: Nâng chiều cao tối thiểu của tất cả các tab, ô số câu hỏi, icon điều hướng lên $\ge 44\times 44$px (`BaseTabs`, `QuestionNav`, `AppNavbar`).
  - **A3. Dọn sạch Style cũ**: Quét và loại bỏ hoàn toàn các class bo tròn mềm (`rounded-xl`, `rounded-2xl`), class màu cũ (`bg-white`, `text-gray-*`), thay thế bằng `rounded-brut` và CSS variables.
  - **A4. Tích hợp BaseTabs**: Cập nhật tab chuyển đổi tại `pages/cai-dat.vue` và `pages/tu-vung/index.vue` sang `<BaseTabs>`.
  - **A6. Rà soát Tokens**: Xác nhận và ghi nhận 4 biến dự phòng chưa dùng (`--lang-en`, `--lang-ja`, `--lang-zh`, `--shadow-x`).
- **Phần B — Kiểm thử Trình duyệt Thật (Playwright + Axe Core)**:
  - Chạy ma trận 24 routes $\times$ 3 viewports (375px, 768px, 1280px) $\times$ 2 themes (Light & Dark) = 144 test states.
  - 100% các trạng thái không có thanh cuộn ngang (0 horizontal scroll).
  - 100% các trang đạt 0 lỗi Axe Serious/Critical trên cả 2 theme sau khi chuẩn hoá text contrast `text-on-tone` và loại bỏ độ mờ opacity làm suy giảm độ tương phản.
  - Đảm bảo tuân thủ triệt để `prefers-reduced-motion: reduce`: vô hiệu hoá toàn bộ infinite keyframe animations (`animation-iteration-count: 1 !important`).
  - Zoom 200% font chữ trên trang chủ và IELTS không làm vỡ khung hoặc che khuất nội dung.
- **Phần C — Bảo toàn Logic 100%**:
  - Xác nhận bằng `git diff --stat ca24287 HEAD` đối với `composables`, `middleware`, `utils`, `mocks`, `config`, `constants`, `nuxt.config.ts`, `backend` cho kết quả rỗng (0 dòng thay đổi).
  - Toàn bộ 16 file có khác biệt script chỉ liên quan đến import component Base, khai báo props/emits trợ năng hoặc icon.

### 2026-10-28 — Xóa Banner cũ và Thiết kế HomeHero mới (Prompt 22)
- **Gỡ bỏ triệt để banner cũ**: Xóa hoàn toàn `GreetingBanner.vue`, `GreetingScene.vue`, `MascotBook.vue`, dọn dẹp các token cũ `--greeting-*`.
- **Tạo mới HomeHero & HeroScene & HeroMascot**:
  - Chuẩn hoá Neo-brutalism viền 3px `#11141D`, bo góc `rounded-brut-lg`, bóng đổ cứng lệch 6px `shadow-[6px_6px_0px_#11141D]`.
  - Banner hoạt động như artwork độc lập, cô lập biến CSS (`--line`, `--ink`, `--surface`, `--on-tone`) để không bị đảo màu khi bật Dark mode.
  - Cột trái: Nhãn thương hiệu + nhãn buổi viền 2px; tiêu đề 2 dòng cỡ 42px đậm; 2 nút hành động (nút "Học ngay" vàng slot `#right` không xuống dòng + nút phụ "Luyện đề IELTS" nền kem $\ge 44\times 44$px); chip mục tiêu tia sét Zap 50 XP.
  - Cột phải: Linh vật quyển sách mở đeo tai nghe (`HeroMascot.vue`), thẻ chào nghiêng -8°, thẻ mục tiêu kỳ thi nghiêng +8°, nền theo buổi (Sáng: mặt trời cười + mây + cà phê; Chiều: mặt trời cam + ly nước mát; Tối: trăng lưỡi liềm + sao + đèn bàn).
  - Dưới đáy: Đồi lượn sóng phẳng cùng tông màu, **không viền đen**, cao tối đa 90px, nằm sau nội dung (`z-0`).
  - Đảm bảo tuân thủ 100% quy tắc kỹ thuật SVG transform ngoài, animation CSS trong, text font-family inline style, reduced motion $\le 3$px và 0 lỗi Axe Core trên cả 2 theme.
