-- ══════════════════════════════════════════════════════════════════
--  Learnsy · (TUỲ CHỌN) Khoá đọc trực tiếp bảng lessons bằng khoá công khai
--  Chỉ chạy khi: (1) đã deploy functions/api/lessons.js, (2) đã đặt env
--  SUPA_SERVICE_KEY trên Cloudflare Pages, (3) đã chạy 2026_tiers.sql.
--  Sau khi chạy: học sinh CHỈ lấy được bài qua /api/lessons (đã cắt theo bậc).
--  Admin (đăng nhập Supabase Auth) vẫn đọc/ghi bình thường.
--  Nhớ xoá khoá Redis `lessons_cache` (Upstash) để không còn bản đầy đủ.
-- ══════════════════════════════════════════════════════════════════
alter table public.lessons enable row level security;

-- Gỡ mọi policy SELECT cho anon hiện có (tên policy khác nhau tuỳ dự án → xem
-- Supabase → Authentication → Policies và drop policy cho role anon nếu còn).
drop policy if exists "lessons anon read" on public.lessons;
drop policy if exists "Enable read access for all users" on public.lessons;

drop policy if exists "lessons admin all" on public.lessons;
create policy "lessons admin all" on public.lessons
  for all to authenticated using (true) with check (true);

-- ── Khoá đọc trực tiếp các bảng tính năng (Từ vựng / Nghe / Kho tệp) ──
-- Chỉ chạy khi đã deploy functions/api/data/[[path]].js + đặt SUPA_SERVICE_KEY.
-- Học sinh sẽ đọc qua /api/data (server kiểm tra bậc). vocab_progress KHÔNG đụng tới.
do $$
declare t text; p record;
begin
  foreach t in array array['vocab_courses','vocab_units','vocab_words','vocab_word_forms',
                           'vocab_word_families','irregular_verb_sets','irregular_verbs',
                           'listening_items','learning_files']
  loop
    if to_regclass('public.'||t) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies
             where schemaname='public' and tablename=t
               and cmd in ('SELECT','ALL') and (roles && array['anon','public']::name[])
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('drop policy if exists "tier admin all" on public.%I', t);
    execute format('create policy "tier admin all" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
