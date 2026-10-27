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
| **Primary (Chính)** | `var(--c-blue)` (`#2F5BFF`) | `var(--c-blue)` (`#547BFF`) | Hành động chính, điều hướng |
| **Accent / CTA** | `var(--c-yellow)` (`#FFD23F`) | `var(--c-yellow)` (`#FFDC5C`) | Nút "Học ngay", "Bắt đầu", nổi bật |
| **Success / OK** | `var(--c-green)` (`#00D084`) | `var(--c-green)` (`#20E096`) | Đã hoàn thành, chính xác |
| **Warning / Warn** | `var(--c-yellow)` (`#FFD23F`) | `var(--c-yellow)` (`#FFDC5C`) | Đang học, lưu ý |
| **Danger / Bad** | `var(--c-coral)` (`#FF5A4E`) | `var(--c-coral)` (`#FF6666`) | Sai sót, bẫy lỗi, xoá |

### 2.2 Bảng màu 3 Buổi của Greeting Banner

Mascot quyển sách đeo tai nghe đổi phông nền theo thời gian thực:
- **Buổi sáng (5h - 12h)**: Xanh ngọc Mint (`#4ED8A8`, soft: `#D6FFF0`, ink: `#004D36`) — Năng lượng tươi sáng khởi đầu ngày mới.
- **Buổi chiều (12h - 18h)**: Cam đào Peach (`#FFA366`, soft: `#FFE9D6`, ink: `#5C2600`) — Rực rỡ, bứt phá năng suất học tập.
- **Buổi tối (18h - 5h)**: Xanh navy Midnight (`#1A2238`, soft: `#283354`, ink: `#FFFFFF`, accent: `#FFD23F`) — Tĩnh tâm, tập trung rèn luyện chuyên sâu.

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
  - `focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus focus-visible:ring-offset-2`.

---

## 5. Quy tắc Icon & Minh hoạ

1. **Bộ icon duy nhất**: `@lucide/vue`.
2. **Quy cách vẽ nét**:
   - `stroke-width`: `2.2` đến `2.5` để cân bằng với nét viền dày của neo-brutalism.
   - Kích thước thông dụng: `w-4 h-4` (nhãn nhỏ/badge), `w-5 h-5` (nút/tiêu đề), `w-6 h-6` (banner/thẻ chính).
   - Icon đứng độc lập (không kèm chữ): **BẮT BUỘC** có `aria-label` hoặc `title`.
3. **Minh hoạ phẳng (Flat Illustration)**:
   - Dựng thuần bằng SVG/CSS, không nhúng ảnh raster PNG/JPG trừ avatar hoặc ảnh thumbnail thật của bài học.
   - Mascot quyển sách đeo tai nghe `MascotBook.vue`: vector phẳng, viền nét rõ, biểu cảm vui vẻ.

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

- [ ] Giữ nguyên 100% logic `<script setup>`, composables, Supabase RPC và mock mode.
- [ ] Không có mã hex hardcode trong template (dùng biến CSS/Tailwind classes).
- [ ] Không có icon Sparkles, Magic Wand hay gradient AI.
- [ ] Vùng bấm nút và ô tương tác đạt tối thiểu 44×44px.
- [ ] Nút focus hiển thị viền rõ ràng khi bấm phím Tab.
- [ ] Mọi thẻ nội dung có phần xem trước (preview trích đoạn, câu mẫu, hoặc thumbnail) nếu có nội dung.
- [ ] Không xuất hiện thanh cuộn ngang ở màn hình 375px.
- [ ] Biên dịch `npm run build` không phát sinh bất kỳ lỗi nào.
