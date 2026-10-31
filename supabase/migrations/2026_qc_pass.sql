-- Learnsy · Migration: cờ "QC pass" cho bài học. Chạy MỘT LẦN trong Supabase → SQL Editor (chạy lại an toàn).
alter table public.lessons add column if not exists qc_passed boolean not null default false;
alter table public.lessons add column if not exists qc_at timestamptz;
