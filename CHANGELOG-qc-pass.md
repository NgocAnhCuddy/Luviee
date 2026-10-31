# QC pass
- Chạy `supabase/migrations/2026_qc_pass.sql` một lần (thêm cột `lessons.qc_passed`, `qc_at`).
- Admin: mỗi thẻ bài có nút **QC** (trắng = chưa, xanh = đã QC pass), bấm để bật/tắt; tự đồng bộ cho học sinh qua sync.
- Học sinh: thẻ bài hiện icon khiên nhỏ cạnh tên (trắng = chưa QC, xanh = đã QC pass).
