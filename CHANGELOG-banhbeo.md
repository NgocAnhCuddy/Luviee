# Chủ đề "Bánh bèo" (giao diện mới)

Bật ở **Cài đặt → Màu sắc → Bánh bèo** (hoặc `?theme=banhbeo`; `?theme=default` để quay lại). Đổi xong trang tự tải lại, dữ liệu giữ nguyên. Mặc định vẫn là HyperOS xanh.

## Gồm
- Bảng màu hồng pastel (sáng) và tím mận hồng (tối), thẻ bo 30px viền hồng, nút gradient hồng, công tắc hồng.
- Phông Baloo 2 cho tiêu đề + Nunito cho nội dung; nơ nhỏ trước logo.
- Họa tiết SVG bay nhẹ (nơ, tim, hoa, sao lấp lánh, mây) — 100% SVG, tự tắt khi bật "giảm chuyển động", ít họa tiết hơn trên màn nhỏ.

## Cách làm (không đụng từng component)
- `index/JS/theme.js`: khi chủ đề bật, đổi mọi màu xanh cứng trong code (#1AB0F5, rgba(26,176,245,…)…) sang hồng lúc React gán style / thuộc tính SVG / thẻ `<style>` (có MutationObserver vì Chromium không cho chặn setter style). Hậu tố alpha và dạng `rgb()` đều được xử lý. Đã thử trên Chromium thật. Chủ đề mặc định thì file này không patch gì.
- `index/CSS/banhbeo.css`: biến màu, phông, thẻ, nút, họa tiết (chỉ có tác dụng với `html.theme-bb`).
- CSS tĩnh trong `index/CSS/*.css` dùng biến `--ls-ac` / `--ls-ac-rgb` thay màu xanh cứng (mặc định vẫn xanh).
- Giao diện `classic` chưa có chủ đề này.

# Tối ưu màn hình AMOLED
Mặc định BẬT, chỉ tác dụng ở chế độ tối. Tắt ở Cài đặt → Màu sắc → "Nền đen thuần (AMOLED)" hoặc `?amoled=0` (`?amoled=1` để bật lại).
- Nền `#000`, thẻ gần đen (`#0B0B0D`) viền mảnh thay bóng đổ; kết hợp Bánh bèo thì đen ngả mận.
- Bỏ `backdrop-filter` (tốn GPU, làm nền đen thành xám đục); chữ trắng ngà `#E9EAEC` thay trắng tinh.
- Màu xám/xanh tối inline trong code (`#1E2024`, `#2A2D32`, `#101F26`…) được `theme.js` đổi về đen/xám rất tối; chỉ đổi các màu dùng riêng cho chế độ tối.
- Thanh trạng thái (`theme-color`) đổi đen khi tối.
- Họa tiết Bánh bèo ở chế độ AMOLED mờ và đứng yên.
- Code: `index/CSS/amoled.css`, `index/JS/theme.js`, thêm công tắc trong `ui-extras.jsx`.

## Thu gọn đề dài (quiz-player)
- Đoạn tư liệu / câu hỏi ≥ ~320 ký tự có nút "Thu gọn / Xem thêm" (SVG), hiện ~4 dòng đầu + mờ dần.
- Lựa chọn nhớ trong localStorage `ls_collapse_long`, đồng bộ giữa chế độ 1 câu và cuộn. Highlight vẫn hoạt động.
