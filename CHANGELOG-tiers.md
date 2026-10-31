# Phân bậc Free / Premium + Kho lưu trữ + giao diện HyperOS

## Bắt buộc trước khi deploy
Supabase → SQL Editor → chạy `supabase/migrations/2026_tiers.sql` (chạy lại nhiều lần an toàn).
Phân bậc mặc định TẮT: bật ở Admin → menu ≡ → **Phân bậc**.

## Admin
- **Phân bậc**: bật/tắt, bậc mặc định, giới hạn Free (số bài, số câu/bài, lượt làm/ngày — 0 = không giới hạn), bật/tắt từng tính năng, bậc theo lớp (kèm hạn), nội dung nâng cấp.
- **Học sinh → sửa**: chọn bậc riêng (Theo lớp/mặc định · Free · Premium + hạn). Ưu tiên: học sinh > lớp > mặc định.
- **Bài học → ⋮**: “Quyền” đổi vòng: theo chung → luôn Free → Premium; “Lưu trữ / Khôi phục” (Kho lưu trữ lọc theo dạng và môn).

## Giao diện Mới / Cũ
- Tên và logo giữ là **Learnsy** (logo chữ gradient gốc).
- Học sinh: Cài đặt → thẻ **Giao diện** → chọn Mới (HyperOS) hoặc Cũ (Learnsy gốc, thanh tab dưới). Lựa chọn nhớ theo trình duyệt (`localStorage.learnsy_ui`); có thể ép bằng `?ui=new` / `?ui=classic`.
- Giao diện Cũ chạy ở `classic.html` + thư mục `classic/` (bản Learnsy gốc), dùng chung tài khoản, dữ liệu, phân bậc, đăng ký và API với bản Mới.
- Admin không có bản Cũ.

## Học sinh tự đăng ký (`functions/api/register.js`)
- Admin → **Phân bậc & Đăng ký** → bật “Cho phép tự đăng ký”. Màn đăng nhập hiện nút **Đăng ký**: học sinh chỉ nhập họ tên + lớp; server tự tạo tên đăng nhập (vd `annv29`) và mật khẩu ngẫu nhiên 8 ký tự, hiện MỘT lần (có nút sao chép, “Vào học ngay”).
- Tuỳ chọn: danh sách lớp được chọn, bậc của tài khoản mới, admin duyệt trước (tài khoản bị khoá tới khi bật lại ở tab Học sinh).
- Chống spam: honeypot, 5 lượt/giờ/IP + 300 lượt/ngày (Upstash), chặn trùng tên trong cùng lớp.
- Env Cloudflare bắt buộc: `SUPA_SERVICE_KEY`, `ADMIN_API_KEY` (= APP_SECRET của Edge Function `student-set-password`).

## Quyền riêng từng học sinh
Admin → Học sinh → sửa → mục **Quyền riêng**: mở/khoá từng tính năng (Theo bậc · Mở · Khoá), ghi đè số bài / câu mỗi bài / lượt mỗi ngày, và mở riêng một số bài. Lưu ở cột `students.perks` (migration `2026_tiers.sql`). Áp cả ở app lẫn server (`/api/lessons`, `/api/data`).

## Cắt phía server
- `functions/api/lessons.js`: danh sách bài đã cắt theo bậc. Học sinh Free: bài khoá chỉ có metadata; bài mở KHÔNG kèm câu hỏi — khi bấm làm, app gọi `GET /api/lessons?id=…` để lấy N câu đầu và server **đếm lượt/ngày** (Redis/Upstash; làm lại cùng bài trong 10 phút không tính thêm; giờ VN).
- `functions/api/data/[[path]].js`: cổng đọc cho Từ vựng, Luyện nghe, Kho tệp (chỉ GET). Free bị tắt tính năng → 403.
- Env Cloudflare: `SESSION_SECRET` (đã có), `UPSTASH_URL/TOKEN` (đã có — cần để đếm lượt/ngày), khuyên thêm `SUPA_SERVICE_KEY`.
- Chưa deploy API → app tự dùng đường cũ (không lỗi, nhưng không cắt phía server).
- **Chặn thật sự** (tuỳ chọn, sau khi API chạy ổn): chạy `supabase/migrations/2026_lessons_lockdown.sql` rồi xoá khoá Redis `lessons_cache`. Xong thì khoá công khai không đọc thẳng được các bảng này.
- Vẫn chỉ ở giao diện: Thống kê, Lịch sử, Ghi chú (dữ liệu riêng của chính học sinh nên không có gì để chặn).

## Làm đẹp giao diện Mới (chỉ học sinh)
- Thanh trên kính mờ thay cho dải xám phẳng; màn đăng nhập hiện nền gradient.
- Ô tìm kiếm, thẻ “Mục tiêu hôm nay” rõ nét hơn; icon bài học đổi màu theo môn (Tiếng Anh xanh dương, các môn khác xanh lá/cam/tím…); bớt khoảng trống dưới danh sách bài.
- Làm bài: nút Đúng/Sai đậm và dễ đọc, thanh trên/dưới kính mờ, thẻ có bóng nhẹ, nhãn loại câu hỏi đủ tương phản.
