---
name: langua-conventions
description: Quy ước làm dự án web học và luyện thi ngoại ngữ Langua (LanguaLab) - Nuxt, Tailwind, Supabase, giao diện neo-brutalism. Hãy dùng skill này mỗi khi làm bất cứ việc gì trong repo LanguaLab (frontend hoặc backend), như tạo trang, component, composable, sửa giao diện, viết migration Supabase, Edge Function, gọi Gemini API, thêm tính năng luyện thi IELTS, hoặc khi người dùng nhắc đến Langua, LanguaLab, Gõ câu, Từ vựng, Ngữ pháp, luyện thi, kể cả khi họ không nói rõ tên dự án.
---

# Langua / LanguaLab - quy ước dự án

Dự án web học tập và luyện thi, **phi thương mại**. Học tiếng Anh, tiếng Trung, tiếng Nhật; thi IELTS, TOEIC, TOEFL, HSK, JLPT. **Làm IELTS trước**, các kỳ thi khác làm sau.

Tên hiển thị của sản phẩm là **Langua** (footer ©Langua, điều khoản, quyền riêng tư). Repo và thư mục là `LanguaLab`. Khi thấy chỗ nào ghi lẫn hai tên, hỏi lại người dùng thay vì tự đổi.

## 1. Cấu trúc và quy trình

- Thư mục gốc **bắt buộc** có đúng 2 thư mục: `frontend` và `backend`.
- Làm **frontend trước**, sau đó làm backend lần lượt cho từng tính năng.
- Database dùng **Supabase** (không dùng PostgreSQL tự host). Migration nằm ở `backend`, đẩy lên bằng `supabase db push` chạy từ thư mục `backend`.
- Người dùng chạy lệnh trên **Windows PowerShell**. Mọi lệnh đưa ra phải chạy được trên PowerShell (không dùng cú pháp bash như `export`, `&&` kiểu cũ, `rm -rf`).
- Nối Supabase ở frontend bằng `@nuxtjs/supabase`. Thay dữ liệu mock (ví dụ `useHomeData`, `useIelts`) bằng truy vấn thật, không để dữ liệu ảo còn sót lại.

## 2. Stack frontend

- **Nuxt + Tailwind + CSS variables** cho theming + **scoped CSS**.
- Phong cách **neo-brutalism**: viền dày, bóng cứng, màu sặc sỡ để làm nổi chức năng chính và nội dung chính. Thêm preview (ảnh xem trước) nếu có.
- Minh họa **flat illustration**. Icon dạng line, dùng **lucide**.
- **Không** làm giao diện "AI hóa". **Không** dùng icon kiểu AI (sparkles, magic wand, robot...).
- Màu và kích thước đi qua CSS variables, không hard-code rải rác trong component.

## 3. Giao diện và nội dung đã chốt

- Mỗi trang có **bảng hướng dẫn từng bước** khi vào lần đầu và **banner giới thiệu**.
- Navbar chính: Trang chủ, Gõ câu, Kho video và podcast, Ngữ pháp, Từ vựng và phát âm, Luyện đọc và dịch, Từ điển chuyên sâu (kèm lộ trình kiểu Duolingo), Yêu cầu tính năng, Luyện thi nghe nói đọc viết. Menu có thể thêm sau.
- Trang chủ gồm: tìm kiếm, điểm danh và streak, XP, thông báo, banner chào theo buổi, hôm nay học gì, thực chiến đề thi, lộ trình đến band mục tiêu, danh sách từ 7 cấp, ôn từ vựng, thống kê hôm nay, tổng kết tuần dạng story, xếp hạng XP tuần.
- Banner chào 3 buổi: sáng nền xanh ngọc, chiều nền cam đào, tối nền xanh navy. Mascot là quyển sách đeo tai nghe.
- Gõ câu: lộ trình đề xuất theo cấp, chủ đề tình huống đời sống và môi trường làm việc.
- Video/podcast: chép chính tả, nói nhại, trắc nghiệm nghe, phụ đề song ngữ, video của tôi.
- Ngữ pháp theo cấp A1, A2...; Từ vựng có bộ đề xuất và bộ của tôi; Đọc và dịch gồm báo, sách, truyện, tiểu thuyết, kịch song ngữ.
- Từ điển phải hiện nghĩa chuẩn Oxford.
- Yêu cầu tính năng: cho người dùng đề xuất tính năng để dev làm.

## 4. Khi làm lại hoặc chỉnh giao diện

- **Giữ nguyên chức năng.** Chỉ đổi lớp trình bày (layout, màu, typography, spacing); không đổi logic, props, tên route, cấu trúc dữ liệu trừ khi được yêu cầu.
- Trước khi sửa, đọc component và composable liên quan; sau khi sửa, liệt kê những file đã đổi.
- Kiểm tra cả chế độ theme (CSS variables) lẫn màn hình nhỏ.

## 5. Backend, Supabase và bảo mật

- Mọi bảng có **RLS** bật sẵn. Viết policy theo nguyên tắc tối thiểu quyền; sau mỗi migration, rà lại policy.
- Không bao giờ để `service_role` key, Gemini key, file JSON của service account ở frontend, trong `public` của `runtimeConfig`, hay commit lên Git. Thêm vào `.gitignore`.
- Gọi Gemini (chấm bài, giải thích, tạo câu hỏi) qua **server route của Nuxt** (`server/api/...`) hoặc Supabase Edge Function, key lưu ở biến môi trường phía server.
- Thao tác nguy hiểm (xóa tài khoản, xóa dữ liệu) làm ở Edge Function, kiểm tra người gọi là chính chủ.
- Không seed user giả vào Supabase thật. Dữ liệu học (ngữ pháp, từ vựng, đề) đưa lên bằng migration seed có kiểm tra số bản ghi sau khi áp.

## 6. Cách làm việc với người dùng

- Trả lời bằng tiếng Việt, ngắn gọn, đi thẳng vào việc cần làm.
- Khi cần viết prompt cho công cụ khác (ví dụ Antigravity), viết prompt đầy đủ, nêu rõ ràng buộc: giữ nguyên chức năng, đúng stack ở mục 2, không dùng icon kiểu AI.
- Nếu yêu cầu mâu thuẫn với các quy ước trên, nêu rõ chỗ mâu thuẫn và hỏi lại, không tự chọn.
