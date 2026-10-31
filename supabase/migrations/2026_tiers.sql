-- ══════════════════════════════════════════════════════════════════
--  Learnsy · Migration: phân bậc Free / Premium
--  Chạy MỘT LẦN trong Supabase → SQL Editor. An toàn chạy lại nhiều lần.
--
--  students.tier          : NULL = kế thừa (theo lớp, rồi theo bậc mặc định) | 'free' | 'premium'
--  students.premium_until : hạn Premium của học sinh (NULL = không hết hạn)
--  tier_settings          : 1 dòng (id=1) chứa toàn bộ cấu hình phân bậc (JSON)
-- ══════════════════════════════════════════════════════════════════
alter table public.students
  add column if not exists tier text default null,
  add column if not exists premium_until timestamptz default null;

create table if not exists public.tier_settings (
  id         int primary key,
  config     jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.tier_settings enable row level security;

drop policy if exists "tier_settings read" on public.tier_settings;
create policy "tier_settings read" on public.tier_settings
  for select using (true);

drop policy if exists "tier_settings admin write" on public.tier_settings;
create policy "tier_settings admin write" on public.tier_settings
  for all to authenticated using (true) with check (true);

insert into public.tier_settings (id, config) values (1, '{}'::jsonb)
  on conflict (id) do nothing;

-- Quyền riêng từng học sinh (admin mở/khoá tính năng, nới giới hạn, mở bài riêng):
--   {"features":{"vocab":true,"files":false},"maxQuestions":0,"maxLessons":20,
--    "dailyAttempts":0,"openLessons":["<lessonId>",...]}      (0 = không giới hạn)
alter table public.students add column if not exists perks jsonb default null;
