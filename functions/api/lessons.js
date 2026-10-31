/**
 * ═════════════════════════════════════════════════════════════════
 *  /functions/api/lessons.js  —  Danh sách bài học ĐÃ CẮT THEO BẬC (Free/Premium)
 *
 *  GET /api/lessons        Header: Authorization: Bearer <token phiên học sinh>
 *     → { ok:true, tier:'free'|'premium', lessons:[...] }
 *
 *  Cắt phía SERVER nên học sinh Free không thể mở DevTools để lấy phần bị khoá:
 *    • bài bị khoá  → trả metadata (tiêu đề, môn, số câu), KHÔNG có questions/password
 *    • bài dài      → chỉ trả N câu đầu (+ tierCut {shown,total})
 *    • bài đã lưu trữ / sai lớp → không trả
 *
 *  Env: SUPA_URL, SUPA_KEY, SESSION_SECRET (bắt buộc – như /api/score),
 *       SUPA_SERVICE_KEY (khuyên dùng; cần nếu đã chạy 2026_lessons_lockdown.sql)
 *
 *  Quy tắc bậc phải GIỐNG index/JS/components/tier.jsx
 * ═════════════════════════════════════════════════════════════════
 */
import { verifyToken } from './session.js';
import { redisCmdSafe, redisPipelineSafe } from '../_lib/redis.js';

const NO_CACHE = { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' };
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...NO_CACHE, 'Content-Type': 'application/json' } });
}

const lc = (s) => String(s || '').trim().toLowerCase();
const alive = (until) => !until || new Date(until).getTime() > Date.now();

async function rest(env, path) {
  const key = (env.SUPA_SERVICE_KEY || env.SUPA_KEY || '').trim();
  const r = await fetch(`${env.SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`supabase ${r.status} ${path.split('?')[0]}`);
  return r.json();
}

function normCfg(c) {
  c = c && typeof c === 'object' ? c : {};
  const l = c.limits && typeof c.limits === 'object' ? c.limits : {};
  return {
    enabled: !!c.enabled,
    defaultTier: c.defaultTier === 'premium' ? 'premium' : 'free',
    maxLessons: Math.max(0, parseInt(l.maxLessons ?? 5, 10) || 0),
    maxQuestions: Math.max(0, parseInt(l.maxQuestions ?? 10, 10) || 0),
    dailyAttempts: Math.max(0, parseInt(l.dailyAttempts ?? 3, 10) || 0),
    classTiers: c.classTiers && typeof c.classTiers === 'object' ? c.classTiers : {},
    lessonAccess: c.lessonAccess && typeof c.lessonAccess === 'object' ? c.lessonAccess : {},
  };
}

function resolveTier(cfg, stu) {
  if (!cfg.enabled) return 'premium';
  if (stu.tier === 'premium') return alive(stu.premium_until) ? 'premium' : 'free';
  if (stu.tier === 'free') return 'free';
  const cls = lc(stu.class_name);
  if (cls) {
    const key = Object.keys(cfg.classTiers).find((k) => lc(k) === cls);
    if (key) {
      const ct = cfg.classTiers[key] || {};
      if (ct.tier === 'premium') return alive(ct.until) ? 'premium' : 'free';
      if (ct.tier === 'free') return 'free';
    }
  }
  return cfg.defaultTier;
}

export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'POST') return json({ ok: false, error: 'Method không hỗ trợ' }, 405);
  if (!env.SUPA_URL || !env.SUPA_KEY) return json({ ok: false, error: 'Cấu hình server chưa đầy đủ' }, 500);
  const secret = (env.SESSION_SECRET || '').trim();
  if (!secret) return json({ ok: false, error: 'SESSION_SECRET chưa đặt' }, 501);

  const h = request.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  const v = await verifyToken(token, secret);
  if (!v.ok) return json({ ok: false, error: v.reason === 'expired' ? 'Phiên đã hết hạn' : 'Chưa đăng nhập' }, 401);

  // Hoàn lại 1 lượt/ngày khi màn làm bài LỖI (app gọi sau khi đã lỡ đếm). Chỉ hoàn nếu lượt vừa đếm
  // còn trong 10 phút (khoá tier:seen), mỗi lượt hoàn 1 lần, tối đa 3 lần hoàn/ngày để không lạm dụng.
  if (request.method === 'POST') {
    let body = null;
    try { body = await request.json(); } catch (e) { /* ignore */ }
    const lid = body && body.refund != null ? String(body.refund).slice(0, 80) : '';
    if (!lid) return json({ ok: false, error: 'Thiếu mã bài' }, 400);
    const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
    const seenKey = `tier:seen:${v.sid}:${lid}`;
    const dayKey = `tier:att:${v.sid}:${day}`;
    const refKey = `tier:ref:${v.sid}:${day}`;
    const had = await redisCmdSafe(env, ['DEL', seenKey]);
    if (Number(had) !== 1) return json({ ok: true, refunded: false });
    const n = await redisCmdSafe(env, ['INCR', refKey]);
    await redisCmdSafe(env, ['EXPIRE', refKey, '172800']);
    if (Number(n) > 3) return json({ ok: true, refunded: false, reason: 'limit' });
    await redisCmdSafe(env, ['DECR', dayKey]);
    return json({ ok: true, refunded: true });
  }

  const url = new URL(request.url);
  const wantId = url.searchParams.get('id');

  try {
    const sid = encodeURIComponent(v.sid);
    const [stuRows, cfgRows, lessons] = await Promise.all([
      rest(env, `students?id=eq.${sid}&select=id,class_name,tier,premium_until,perks,is_active`)
        .catch(() => rest(env, `students?id=eq.${sid}&select=id,class_name,tier,premium_until,is_active`))
        .catch(() => rest(env, `students?id=eq.${sid}&select=id,class_name,is_active`)), // chưa chạy migration bậc
      rest(env, 'tier_settings?id=eq.1&select=config').catch(() => []),
      rest(env, 'lessons?select=*&order=created_at'),
    ]);
    const stu = stuRows[0];
    if (!stu || stu.is_active === false) return json({ ok: false, error: 'Tài khoản không hợp lệ' }, 403);

    const cfg = normCfg(cfgRows[0] && cfgRows[0].config);
    // Quyền riêng của học sinh ghi đè giới hạn chung (admin đặt)
    const pk = cfg.enabled && stu.perks && typeof stu.perks === 'object' ? stu.perks : {};
    for (const k of ['maxLessons', 'maxQuestions', 'dailyAttempts']) {
      if (pk[k] !== undefined && pk[k] !== null && pk[k] !== '') cfg[k] = Math.max(0, parseInt(pk[k], 10) || 0);
    }
    const openLessons = new Set(Array.isArray(pk.openLessons) ? pk.openLessons.map(String) : []);
    const tier = resolveTier(cfg, stu);
    const mine = lc(stu.class_name);

    // bài hiển thị cho học sinh này (khớp logic app.jsx)
    const visible = lessons.filter((l) => {
      const cat = String(l.category || 'normal');
      if (cat.startsWith('archived_')) return false;
      if (cat === 'practice' && !l.is_published) return false;
      if (Array.isArray(l.target_classes)) {
        return !!mine && l.target_classes.some((c) => lc(c) === mine);
      }
      return true;
    });

    // N bài "thường" mới nhất (bài đã đặt luôn-Free/Premium không tính)
    const normal = visible.filter((l) => String(l.category || 'normal') !== 'practice'
      && cfg.lessonAccess[l.id] !== 'free' && cfg.lessonAccess[l.id] !== 'premium');
    const allowed = new Set(cfg.maxLessons ? normal.slice(-cfg.maxLessons).map((l) => l.id) : normal.map((l) => l.id));

    // ── Lấy câu hỏi của MỘT bài (Free: cắt N câu + đếm lượt/ngày) ──
    if (wantId) {
      const l = visible.find((x) => String(x.id) === String(wantId));
      if (!l) return json({ ok: false, error: 'Không tìm thấy bài' }, 404);
      if (tier === 'premium') return json({ ok: true, tier, lesson: l });
      const total = (l.questions || []).length;
      const isPractice = String(l.category || 'normal') === 'practice';
      const acc = cfg.lessonAccess[l.id];
      const locked = !openLessons.has(String(l.id)) && (acc === 'premium' || (!isPractice && acc !== 'free' && !allowed.has(l.id)));
      if (locked) return json({ ok: false, error: 'Bài này chỉ dành cho Premium', code: 'locked' }, 403);
      let attemptsLeft = null;
      if (cfg.dailyAttempts) {
        const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10); // ngày theo giờ VN
        const seenKey = `tier:seen:${v.sid}:${l.id}`;
        const dayKey = `tier:att:${v.sid}:${day}`;
        const seen = await redisCmdSafe(env, ['SET', seenKey, '1', 'NX', 'EX', '600']);
        if (seen === 'OK') { // lượt mới (làm lại trong 10 phút không tính thêm)
          const r = await redisPipelineSafe(env, [['INCR', dayKey], ['EXPIRE', dayKey, '172800']]);
          const n = r ? Number(r[0]) : 0;
          if (r && n > cfg.dailyAttempts) {
            await redisPipelineSafe(env, [['DECR', dayKey], ['DEL', seenKey]]);
            return json({ ok: false, error: 'Bạn đã hết lượt làm bài hôm nay (gói Free)', code: 'attempts' }, 429);
          }
          if (r) attemptsLeft = Math.max(0, cfg.dailyAttempts - n);
        }
      }
      const shown = cfg.maxQuestions && total > cfg.maxQuestions ? cfg.maxQuestions : total;
      return json({ ok: true, tier, attemptsLeft, lesson: { ...l, questions: (l.questions || []).slice(0, shown), questionCount: total, tierCut: shown < total ? { shown, total } : null } });
    }

    const out = visible.map((l) => {
      const total = (l.questions || []).length;
      if (tier === 'premium') return l;
      const acc = cfg.lessonAccess[l.id];
      const isPractice = String(l.category || 'normal') === 'practice';
      const locked = !openLessons.has(String(l.id)) && (acc === 'premium' || (!isPractice && acc !== 'free' && !allowed.has(l.id)));
      if (locked) {
        return { ...l, questions: [], password: l.password ? '1' : '', questionCount: total, tierLocked: true };
      }
      // Free: danh sách KHÔNG kèm câu hỏi — muốn làm phải gọi /api/lessons?id=… (để server đếm lượt/ngày)
      const shown = cfg.maxQuestions && total > cfg.maxQuestions ? cfg.maxQuestions : total;
      return { ...l, questions: [], needFetch: true, questionCount: total, tierCut: shown < total ? { shown, total } : null };
    });

    return json({ ok: true, tier, enabled: cfg.enabled, lessons: out });
  } catch (err) {
    console.error('[lessons]', err?.message ?? err);
    return json({ ok: false, error: 'Lỗi server nội bộ' }, 500);
  }
}
