/**
 * ═════════════════════════════════════════════════════════════════
 *  /functions/api/register.js  —  Học sinh tự đăng ký tài khoản
 *
 *  POST /api/register   body: { name, className, hp }
 *     → server TỰ TẠO username + mật khẩu ngẫu nhiên, trả về MỘT lần:
 *       { ok:true, username, password, pending }
 *
 *  Admin bật/tắt & cấu hình ở Admin → Phân bậc & Đăng ký (tier_settings.config.registration).
 *  Mật khẩu được băm bởi Edge Function `student-set-password` (giống admin tạo tay).
 *
 *  Env: SUPA_URL, SUPA_KEY, SUPA_SERVICE_KEY (BẮT BUỘC: ghi bảng students),
 *       ADMIN_API_KEY (= APP_SECRET của Edge Function), UPSTASH_* (khuyên dùng: chống spam)
 * ═════════════════════════════════════════════════════════════════
 */
import { rateCount } from '../_lib/redis.js';

const NO_CACHE = { 'Cache-Control': 'no-store', 'Pragma': 'no-cache' };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...NO_CACHE, 'Content-Type': 'application/json' } });

const PER_IP_PER_HOUR = 5;
const PER_DAY_TOTAL = 300;
const lc = (s) => String(s || '').trim().toLowerCase();
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // bỏ ký tự dễ nhầm (i l o 0 1)

function randStr(len, alpha) {
  const b = new Uint8Array(len); crypto.getRandomValues(b);
  return Array.from(b, (x) => alpha[x % alpha.length]).join('');
}

/** "Thu Anh" → "anht" (tên + chữ cái đầu họ/đệm) */
function baseUsername(name) {
  const words = name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return 'hs';
  const last = words[words.length - 1];
  const ini = words.slice(0, -1).map((w) => w[0]).join('');
  return (last + ini).slice(0, 14);
}

async function sb(env, path, init) {
  const key = (env.SUPA_SERVICE_KEY || '').trim();
  return fetch(`${env.SUPA_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init && init.headers) },
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return json({ ok: false, msg: 'Method không hỗ trợ' }, 405);
  const origin = request.headers.get('Origin');
  if (origin) {
    try { if (new URL(origin).host !== new URL(request.url).host) return json({ ok: false, msg: 'Origin không hợp lệ' }, 403); }
    catch { return json({ ok: false, msg: 'Origin không hợp lệ' }, 403); }
  }
  if (!env.SUPA_URL || !env.SUPA_KEY || !env.SUPA_SERVICE_KEY || !env.ADMIN_API_KEY) {
    console.error('[register] Thiếu SUPA_URL / SUPA_KEY / SUPA_SERVICE_KEY / ADMIN_API_KEY');
    return json({ ok: false, msg: 'Máy chủ chưa được cấu hình đăng ký' }, 501);
  }

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, msg: 'Dữ liệu không hợp lệ' }, 400); }
  if (body && body.hp) return json({ ok: false, msg: 'Không thể đăng ký' }, 400); // honeypot (bot)

  // ── Cấu hình do admin đặt ──
  let reg = {};
  try {
    const r = await sb(env, 'tier_settings?id=eq.1&select=config');
    const rows = await r.json();
    reg = (rows[0] && rows[0].config && rows[0].config.registration) || {};
  } catch { /* bảng chưa có → coi như tắt */ }
  if (!reg.enabled) return json({ ok: false, msg: 'Đăng ký tài khoản đang tắt. Hãy hỏi giáo viên nhé!' }, 403);

  // ── Kiểm tra dữ liệu ──
  const name = String(body?.name ?? '').trim().replace(/\s+/g, ' ');
  let cls = String(body?.className ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 40 || !/^[\p{L}][\p{L} .'-]*$/u.test(name)) {
    return json({ ok: false, msg: 'Họ tên chưa hợp lệ (chỉ dùng chữ cái, 2–40 ký tự)' }, 400);
  }
  const allowed = String(reg.classes || '').split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
  if (allowed.length) {
    const hit = allowed.find((c) => lc(c) === lc(cls));
    if (!hit) return json({ ok: false, msg: 'Hãy chọn lớp trong danh sách' }, 400);
    cls = hit;
  } else if (!cls || cls.length > 12 || !/^[\p{L}\p{N} ._-]+$/u.test(cls)) {
    return json({ ok: false, msg: 'Lớp chưa hợp lệ' }, 400);
  }

  // ── Chống spam ──
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
  const hour = new Date().toISOString().slice(0, 13);
  const nIp = await rateCount(env, `reg:ip:${ip}:${hour}`, 3600);
  if (nIp !== undefined && nIp > PER_IP_PER_HOUR) return json({ ok: false, msg: 'Bạn đăng ký quá nhiều lần. Thử lại sau nhé!' }, 429);
  const nDay = await rateCount(env, `reg:day:${hour.slice(0, 10)}`, 86400);
  if (nDay !== undefined && nDay > PER_DAY_TOTAL) return json({ ok: false, msg: 'Hôm nay đã đủ lượt đăng ký. Hãy hỏi giáo viên nhé!' }, 429);

  try {
    // ── Trùng tên trong lớp → không tạo thêm (tránh nhân bản tài khoản) ──
    const dupQ = `students?select=id&display_name=ilike.${encodeURIComponent(name.replace(/[%_*]/g, ''))}&class_name=ilike.${encodeURIComponent(cls.replace(/[%_*]/g, ''))}&limit=1`;
    const dup = await (await sb(env, dupQ)).json();
    if (Array.isArray(dup) && dup.length) {
      return json({ ok: false, msg: 'Đã có tài khoản tên này trong lớp. Quên mật khẩu thì hỏi giáo viên nhé!' }, 409);
    }

    const password = randStr(8, ALPHABET);
    const pending = !!reg.approval;
    const tier = reg.tier === 'free' || reg.tier === 'premium' ? reg.tier : null;
    const base = baseUsername(name);

    let student = null, username = '';
    for (let i = 0; i < 8 && !student; i++) {
      username = base + randStr(i < 4 ? 2 : 3, '0123456789');
      const row = { username, password_hash: 'PENDING', display_name: name, class_name: cls, is_active: !pending };
      if (tier) row.tier = tier;
      let r = await sb(env, 'students', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
      if (!r.ok && tier && r.status === 400) { // chưa chạy migration cột tier
        delete row.tier;
        r = await sb(env, 'students', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(row) });
      }
      if (r.ok) { const rows = await r.json(); student = rows[0]; }
      else if (r.status !== 409) { console.error('[register] insert', r.status, await r.text()); return json({ ok: false, msg: 'Không tạo được tài khoản. Thử lại nhé!' }, 500); }
    }
    if (!student) return json({ ok: false, msg: 'Không tạo được tên đăng nhập. Thử lại nhé!' }, 500);

    // ── Băm & lưu mật khẩu qua Edge Function (giống admin tạo tay) ──
    const fr = await fetch(`${env.SUPA_URL}/functions/v1/student-set-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: env.SUPA_KEY, Authorization: `Bearer ${env.SUPA_KEY}`, 'x-admin-secret': env.ADMIN_API_KEY },
      body: JSON.stringify({ studentId: student.id, password }),
    });
    if (!fr.ok) {
      console.error('[register] student-set-password', fr.status, await fr.text().catch(() => ''));
      await sb(env, `students?id=eq.${encodeURIComponent(student.id)}`, { method: 'DELETE' });
      return json({ ok: false, msg: 'Không tạo được mật khẩu. Thử lại nhé!' }, 502);
    }
    return json({ ok: true, username, password, pending });
  } catch (e) {
    console.error('[register]', e?.message ?? e);
    return json({ ok: false, msg: 'Lỗi máy chủ. Thử lại nhé!' }, 500);
  }
}
