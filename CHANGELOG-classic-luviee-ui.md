# Giao diện Cũ (classic) → giống giao diện Luviee

- `classic.html` + `classic/`: nạp thêm `v2.css`, `foundation.css`, `luviee-cute.css` (lấy nguyên từ Luviee); logo chữ Satisfy gradient; spinner tím-hồng.
- Bo góc thẻ/nút/ô nhập đồng bộ theo Luviee (14 → 18–22) ở toàn bộ màn học sinh.
- `quiz-player.jsx` lấy nguyên từ Luviee (giao diện làm bài mới, thanh tiến độ, dock, hiệu ứng đúng/sai); kèm `highlighter.jsx` (gạch chân/dạ quang) và `notes.jsx` (Sổ ghi chú + hộp ghi nhanh).
- `dashboard.jsx`: nền Luviee (mascot, trạng thái trống, loading, banner pastel, tab Ghi chú, 3 ô ảnh đại diện) + GIỮ phần của Learnsy: khoá Premium/phân bậc, nút đổi giao diện Mới/Cũ.
- `avatar.jsx`, `ripple-haptic.jsx` lấy từ Luviee (đa ảnh đại diện, ripple/rung/vuốt).
- Giữ nguyên: tên "Learnsy", phân bậc Free/Premium, đăng ký học sinh, `supaGate`, `/api/lessons`.

## Hoàn lượt làm bài khi màn làm bài lỗi (Free)
- `app.jsx` (index + classic): bọc `QuizPlayer` bằng `QuizBoundary`; lỗi hoặc không mở được bài sau 15 giây → hoàn lượt (localStorage + server), quay về danh sách, báo nguyên nhân.
- `quiz-player.jsx`: gọi `onStarted` khi bài hiển thị được (lúc đó lượt mới chắc chắn tính).
- `tier.jsx`: thêm `refundAttempt`.
- `functions/api/lessons.js`: thêm `POST {refund:id}` — chỉ hoàn lượt vừa đếm trong 10 phút, mỗi lượt 1 lần, tối đa 3 lần/ngày.
