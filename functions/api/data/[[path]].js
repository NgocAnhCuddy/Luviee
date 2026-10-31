/**
 * ═════════════════════════════════════════════════════════════════
 *  /functions/api/data.js  —  Cổng đọc dữ liệu tính năng theo bậc (Free/Premium)
 *
 *  GET /api/data/<bảng>?<truy vấn PostgREST>   Authorization: Bearer <token phiên>
 *  Chỉ đọc (GET/HEAD) các bảng của tính năng Từ vựng / Luyện nghe / Kho tệp.
 *  Học sinh Free mà tính năng đó bị tắt → 403. Còn lại chuyển tiếp nguyên truy vấn
 *  sang Supabase (client supabase-js dùng được nguyên, xem window.supaGate).
 *
 *  Env: SUPA_URL, SUPA_KEY, SESSION_SECRET, (khuyên dùng) SUPA_SERVICE_KEY
 * ═════════════════════════════════════════════════════════════════
 */
import { verifyToken } from '../session.js';

const TABLE_FEATURE = {
  vocab_courses: 'vocab', vocab_units: 'vocab', vocab_words: 'vocab',
  vocab_word_forms: 'vocab', vocab_word_families: 'vocab',
  irregular_verb_sets: 'vocab', irregular_verbs: 'vocab',
  listening_items: 'listening',
  learning_files: 'files',
};
const FEATURE_DEFAULT = { practice: false, vocab: true, listening: false, stats: false, history: true, notes: true, files: false };

const lc = (s) => String(s || '').trim().toLowerCase();
const alive = (u) => !u || new Date(u).getTime() > Date.now();
const err = (status, error) => new Response(JSON.stringify({ message: error, error }), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

async function rest(env, path) {
  const key = (env.SUPA_SERVICE_KEY || env.SUPA_KEY || '').trim();
  const r = await fetch(`${env.SUPA_URL}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) throw new Error('supabase ' + r.status);
  return r.json();
}

export async function onRequest({ request, env, params }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return err(405, 'Chỉ hỗ trợ đọc');
  if (!env.SUPA_URL || !env.SUPA_KEY) return err(500, 'Cấu hình server chưa đầy đủ');
  const secret = (env.SESSION_SECRET || '').trim();
  if (!secret) return err(501, 'SESSION_SECRET chưa đặt');

  const table = Array.isArray(params.path) ? params.path[0] : String(params.path || '');
  const feature = TABLE_FEATURE[table];
  if (!feature) return err(404, 'Bảng không được hỗ trợ');

  const h = request.headers.get('Authorization') || '';
  const v = await verifyToken(h.startsWith('Bearer ') ? h.slice(7).trim() : '', secret);
  if (!v.ok) return err(401, v.reason === 'expired' ? 'Phiên đã hết hạn' : 'Chưa đăng nhập');

  try {
    const sid = encodeURIComponent(v.sid);
    const [stuRows, cfgRows] = await Promise.all([
      rest(env, `students?id=eq.${sid}&select=id,class_name,tier,premium_until,perks,is_active`)
        .catch(() => rest(env, `students?id=eq.${sid}&select=id,class_name,tier,premium_until,is_active`))
        .catch(() => rest(env, `students?id=eq.${sid}&select=id,class_name,is_active`)),
      rest(env, 'tier_settings?id=eq.1&select=config').catch(() => []),
    ]);
    const stu = stuRows[0];
    if (!stu || stu.is_active === false) return err(403, 'Tài khoản không hợp lệ');
    const c = (cfgRows[0] && cfgRows[0].config) || {};
    if (c.enabled) {
      let tier = c.defaultTier === 'premium' ? 'premium' : 'free';
      if (stu.tier === 'premium') tier = alive(stu.premium_until) ? 'premium' : 'free';
      else if (stu.tier === 'free') tier = 'free';
      else if (stu.class_name && c.classTiers) {
        const k = Object.keys(c.classTiers).find((x) => lc(x) === lc(stu.class_name));
        if (k) { const ct = c.classTiers[k] || {}; if (ct.tier === 'premium') tier = alive(ct.until) ? 'premium' : 'free'; else if (ct.tier === 'free') tier = 'free'; }
      }
      const feats = Object.assign({}, FEATURE_DEFAULT, (c.limits && c.limits.features) || {});
      const pf = (stu.perks && stu.perks.features) || {};
      if (pf[feature] === false) return err(403, 'Tính năng này đã bị khoá cho tài khoản của bạn');
      if (pf[feature] !== true && tier === 'free' && feats[feature] === false) return err(403, 'Tính năng này chỉ dành cho Premium');
    }
    const key = (env.SUPA_SERVICE_KEY || env.SUPA_KEY).trim();
    const u = new URL(request.url);
    const up = await fetch(`${env.SUPA_URL}/rest/v1/${table}${u.search}`, {
      method: request.method,
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        Accept: request.headers.get('Accept') || 'application/json',
        ...(request.headers.get('Prefer') ? { Prefer: request.headers.get('Prefer') } : {}),
        ...(request.headers.get('Range') ? { Range: request.headers.get('Range') } : {}),
      },
    });
    const headers = new Headers({ 'Cache-Control': 'no-store' });
    ['Content-Type', 'Content-Range'].forEach((k) => { const x = up.headers.get(k); if (x) headers.set(k, x); });
    return new Response(up.body, { status: up.status, headers });
  } catch (e) {
    console.error('[data]', e?.message ?? e);
    return err(500, 'Lỗi server nội bộ');
  }
}
