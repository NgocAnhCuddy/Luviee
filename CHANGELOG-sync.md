# Đồng bộ admin → học sinh không cần reload

## Nguyên nhân
- Cấu hình phân bậc, quyền riêng (bậc/hạn/perks/lớp) và danh sách bài chỉ nạp MỘT lần lúc mở trang.
- Avatar: cache localStorage 1 giờ + cờ Redis memo vĩnh viễn trong phiên; admin upload ảnh thì **DEL** `avatar:user` (học sinh mất cờ) và URL không đổi nên HTTP cache giữ ảnh cũ.

## Cách sửa
- `index|classic/JS/sync.js` (mới): kiểm tra khi mở app, quay lại tab, focus, có mạng, và mỗi ~30s (tab hiện). Mỗi chu kỳ: hàng học sinh + tier_settings (Supabase trực tiếp) và 1 request `MGET` Redis (rev bài học + avatar).
- Quyền/lớp/bậc/hạn Premium/cấu hình đổi → render lại ngay và tải lại danh sách bài (im lặng, lỗi thì giữ danh sách cũ).
- Admin sửa bài → `invalidateCache` cũng `INCR sync:rev:lessons` → học sinh tải lại bài trong ≤30s.
- Avatar: admin upload ghi URL mới `?t=` thay vì DEL; máy học sinh phát hiện URL đổi và cập nhật (kể cả 3 ô ảnh).
- Khóa/xóa tài khoản được áp trong vài giây.
- `/api/cache`: thêm `MGET` (chỉ khóa được phép đọc) và `INCR` chỉ trên `sync:rev:lessons`. Có test.

Không cần migration hay env mới. Không có Redis → vẫn đồng bộ quyền/avatar-less, bài làm mới mỗi 10 phút.

## Chỉ render khi cần (app.jsx, index + classic)
- `memoStable` + `React.memo` cho Dashboard: đổi state ở App không liên quan (modal, thông báo, lớp…) không còn render lại cả Dashboard. Prop dạng hàm được thay bằng hàm ổn định gọi bản mới nhất nên không bị closure cũ.
- `HiddenGate`: khi học sinh ở màn Nghe/Từ vựng/Ôn tập (Dashboard bị ẩn) thì Dashboard đóng băng, hiện lại mới render bản mới nhất.
- Đổi bậc/quyền vẫn cập nhật nhờ prop `tierTick`.
