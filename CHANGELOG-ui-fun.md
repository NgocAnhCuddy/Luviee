# Nâng cấp giao diện mới · Học vui / Học cấp tốc · SVG · Dark mode

## Dark mode — nút/công tắc bị tối màu
- Nguyên nhân: trang không khai báo `color-scheme`, nên "chế độ tối ép buộc" của MIUI/HyperOS/Chrome tự đảo màu núm trắng và nút → chìm vào nền tối.
- Sửa: `<meta name="color-scheme">` + `color-scheme` theo class `.dark`, `forced-color-adjust:none` cho nút/công tắc, và màu rõ ràng cho công tắc, chip, nút phụ, segmented, drawer trong `index/CSS/hyperos.css`.

## Học vui / Học cấp tốc (fun-study.jsx)
- Quyền trợ giúp: 50:50 (×2, ẩn 2 đáp án sai), +10 giây (cấp tốc có giờ, ×1).
- Khiên combo: đạt combo 5 và 10 nhận 1 khiên (tối đa 3), sai thì khiên đỡ, combo giữ nguyên.
- Cấp độ (Lv) mỗi 60 XP, thanh XP lên cấp, banner "Lên cấp!".
- Câu vàng x2 XP (khoảng 1/6 câu).
- Màn kết quả: huy hiệu (Hoàn hảo, Chuỗi lửa, Tia chớp, Cao thủ), kỷ lục theo bài và chế độ (lưu cục bộ).
- Màn cài đặt hiện kỷ lục và các quyền trợ giúp.

## 100% SVG
- Fun-study, dashboard (nút Học vui/Học cấp tốc, khóa bài), home-screen, toast, vocab, notes toolbar, thông báo đều dùng SVG. Thêm `window.SvgIcon` (globals.jsx).
- Ký hiệu ☐/☑ bên trong nội dung ghi chú giữ nguyên vì là dữ liệu người dùng gõ.
