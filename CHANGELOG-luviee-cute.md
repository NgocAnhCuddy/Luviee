# Luviee — đổi tên + giao diện pastel dễ thương
- Đổi tên hiển thị: logo "Luvie" → "Luviee", tiêu đề trang, nhãn export (không đổi class CSS / khóa lưu trữ).
- `index/CSS/luviee-cute.css` (mới, nạp trong index.html): trạng thái trống, loading riêng, vòng avatar pastel + tim nhún, hiệu ứng nhấn mềm cho banner.
- dashboard.jsx: LuvMascot (SVG), LuvEmpty, LuvLoader; banner gradient pastel (sáng) — chế độ tối giữ đậm hơn; avatar card có vòng pastel quay chậm.
- Lite Mode / prefers-reduced-motion tự tắt animation mới.

## Sửa tiếp
- Cài đặt: hiện hàng 3 ô ảnh đại diện (truyền slots/activeSlot/onSwitch từ useAvatar vào AvatarUploader — trước đó bị thiếu).
- Sửa nhãn thiếu dấu ở thẻ hồ sơ: Bài làm / Điểm TB / Cao nhất, "Học sinh".
- Đổi nốt chữ hiển thị còn sót: chân trang đăng nhập, đăng nhập admin, tên package.
