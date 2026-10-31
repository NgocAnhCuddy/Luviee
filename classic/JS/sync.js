/* ══════════════════════════════════════════════════════════════════
   SYNC.JS · Learnsy · Đồng bộ admin → học sinh KHÔNG cần reload
   ─────────────────────────────────────────────────────────────────
   Trước đây quyền (bậc/lớp/quyền riêng), cấu hình phân bậc, danh sách bài và
   avatar chỉ được nạp MỘT lần lúc mở trang (avatar thêm cache 1 giờ) nên
   admin đổi xong học sinh phải reload vài lần mới thấy.

   Engine này chạy một "chu kỳ đồng bộ" khi:
     • app khởi động / học sinh đăng nhập
     • quay lại tab (visibilitychange), focus cửa sổ, có mạng lại, pageshow (bfcache)
     • định kỳ mỗi ~30s khi tab đang hiện (tạm dừng khi tab ẩn)
     • ngay lập tức khi tab khác cùng trình duyệt báo (BroadcastChannel)
     • khi gọi LearnsySync.trigger()  (vd. admin lưu học sinh trong cùng trình duyệt)

   Mỗi chu kỳ (song song, lỗi cái nào bỏ qua cái đó, KHÔNG BAO GIỜ làm mất dữ liệu đang hiện):
     ① hàng students của chính học sinh  (lớp, bậc, hạn, quyền riêng, tên, khóa)
        → Supabase trực tiếp (không tốn Cloudflare Functions)
     ② tier_settings.config  (qua LearnsyTier.load(true), chỉ phát sự kiện khi đổi thật)
     ③ MGET Redis 1 request: sync:rev:lessons (admin tăng mỗi lần sửa bài) + avatar:user + avatar:active

   Phát sự kiện (subscribe):
     'student'  {row|null, changed}  — hàng học sinh (null = tài khoản đã bị xóa)
     'lessons'  {reason}             — cần tải lại danh sách bài (bậc/lớp/cấu hình/bài đổi)
     'avatar'   {userId,url,active,first} — avatar trên server khác bản đang giữ

   Dùng chung cho index/ và classic/ (hai bản sao cùng nội dung).
   ══════════════════════════════════════════════════════════════════ */

const POLL_MS = 30 * 1000;          // chu kỳ khi tab đang hiện
const MIN_GAP_MS = 4 * 1000;        // 2 chu kỳ không sát nhau hơn mức này (trừ force)
const LESSON_SAFETY_MS = 10 * 60 * 1000; // Redis không chạy được → vẫn tải lại bài mỗi 10 phút
const CHANNEL = 'learnsy-sync-v1';

const subs = { student: new Set(), lessons: new Set(), avatar: new Set() };
const emit = (topic, payload) => {
  subs[topic].forEach((fn) => { try { fn(payload); } catch (e) { console.warn('[sync] subscriber lỗi', e); } });
};

let running = false;
let timer = null;
let inflight = null;
let lastRun = 0;
let lastLessonsEmit = 0;
let userId = null;
let username = null;
let bc = null;

// trạng thái lần trước (để chỉ phát khi đổi thật)
let lastStudentJson = undefined;   // undefined = chưa lấy lần nào
let lastFingerprint = undefined;
let lastLessonRev = undefined;
let lastAvatarUrl = undefined;
let lastAvatarActive = undefined;
let redisOk = false;

const safeJson = (v) => { try { return JSON.stringify(v); } catch { return ''; } };

/* ── ① hàng học sinh ─────────────────────────────────────────── */
const COL_SETS = [
  'id,username,display_name,class_name,is_active,tier,premium_until,perks',
  'id,username,display_name,class_name,is_active,tier,premium_until', // chưa có cột perks
  'id,username,display_name,class_name,is_active',                    // chưa chạy migration bậc
];

async function fetchStudentRow() {
  const supa = window.supa;
  if (!supa || (!userId && !username)) return { skip: true };
  let last = null;
  for (const cols of COL_SETS) {
    const q = userId
      ? supa.from('students').select(cols).eq('id', userId).maybeSingle()
      : supa.from('students').select(cols).eq('username', username).maybeSingle();
    const { data, error } = await q;
    if (!error) return { row: data || null };   // data=null ⇒ tài khoản đã bị xóa
    last = error;
    if (!/column|schema cache|perks|tier|premium_until/i.test(error.message || '')) break;
  }
  return { error: last || true };
}

/* ── ③ Redis (1 request) ─────────────────────────────────────── */
async function fetchRedis() {
  const keys = ['sync:rev:lessons'];
  if (userId) keys.push('avatar:user:' + userId, 'avatar:active:' + userId);
  try {
    const r = await fetch('/api/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify(['MGET', ...keys]),
    });
    if (!r.ok) return null;
    const j = await r.json().catch(() => null);
    if (!j || j.error || !Array.isArray(j.result)) return null;
    return { rev: j.result[0], avatar: j.result[1], active: j.result[2] };
  } catch { return null; }
}

/* ── Một chu kỳ ──────────────────────────────────────────────── */
async function cycle(reason, force) {
  if (!running || (!userId && !username)) return;
  if (inflight) return inflight;
  const now = Date.now();
  if (!force && now - lastRun < MIN_GAP_MS) return;
  lastRun = now;

  inflight = (async () => {
    const T = window.LearnsyTier;
    const [stuRes, , redis] = await Promise.all([
      fetchStudentRow().catch((e) => ({ error: e })),
      // ② cấu hình phân bậc (load(true) tự bỏ qua nếu chưa kết nối; chỉ emit khi đổi)
      (T && T.load ? T.load(true) : Promise.resolve()).catch(() => {}),
      fetchRedis(),
    ]);

    let lessonsReason = null;

    // ── học sinh ──
    if (stuRes && !stuRes.skip && !stuRes.error) {
      const row = stuRes.row;
      const j = safeJson(row);
      const changed = j !== lastStudentJson;
      lastStudentJson = j;
      if (row && T && T.setStudent) {
        // chỉ đẩy phần liên quan phân bậc; setStudent emit → UI render lại
        if (changed || lastFingerprint === undefined) {
          T.setStudent({ class_name: row.class_name, tier: row.tier || null, premium_until: row.premium_until || null, perks: row.perks || null });
        }
      }
      emit('student', { row, changed });
      try {
        if (row && window.LearnsySession && window.LearnsySession.updateUser) {
          window.LearnsySession.updateUser({ display_name: row.display_name, class_name: row.class_name });
        }
      } catch { /* ignore */ }
    }

    // ── dấu vân tay "mọi thứ quyết định server cắt bài thế nào" ──
    //   lớp + bậc + hạn + quyền riêng + cấu hình phân bậc + bậc hiệu lực hiện tại
    //   (bậc hiệu lực đổi khi Premium hết hạn dù không ai sửa gì).
    if (stuRes && !stuRes.skip && !stuRes.error) {
      const row = stuRes.row || {};
      const fp = safeJson([
        row.class_name, row.tier, row.premium_until, row.perks,
        T && T.cfg, T && T.tier && T.tier(),
      ]);
      if (lastFingerprint !== undefined && fp !== lastFingerprint) lessonsReason = 'permission';
      lastFingerprint = fp;
    }

    // ── Redis: bài học + avatar ──
    if (redis) {
      redisOk = true;
      const rev = redis.rev == null ? '0' : String(redis.rev);
      if (lastLessonRev !== undefined && rev !== lastLessonRev) lessonsReason = lessonsReason || 'lessons-rev';
      lastLessonRev = rev;

      const url = typeof redis.avatar === 'string' && redis.avatar ? redis.avatar : null;
      const a = parseInt(redis.active, 10);
      const active = a >= 1 && a <= 3 ? a : null;
      const first = lastAvatarUrl === undefined;
      if (first || url !== lastAvatarUrl || active !== lastAvatarActive) {
        lastAvatarUrl = url;
        lastAvatarActive = active;
        emit('avatar', { userId, url, active, first });
      }
    } else if (!redisOk && Date.now() - lastLessonsEmit > LESSON_SAFETY_MS) {
      // Redis chưa cấu hình / lỗi: không có rev → làm mới bài theo chu kỳ dài
      lessonsReason = lessonsReason || 'safety';
    }

    if (lessonsReason) {
      lastLessonsEmit = Date.now();
      emit('lessons', { reason: lessonsReason });
    }
  })().catch((e) => console.warn('[sync] chu kỳ lỗi (' + reason + '):', e))
    .finally(() => { inflight = null; });

  return inflight;
}

/* ── Vòng đời ────────────────────────────────────────────────── */
function scheduleNext() {
  clearTimeout(timer);
  if (!running) return;
  // lệch ±20% để nhiều học sinh không đồng loạt gọi cùng giây
  const jitter = POLL_MS * (0.8 + Math.random() * 0.4);
  timer = setTimeout(async () => {
    if (document.visibilityState === 'visible') await cycle('interval', false);
    scheduleNext();
  }, jitter);
}

const onVisible = () => { if (document.visibilityState === 'visible') cycle('visible', true); };
const onFocus = () => cycle('focus', false);
const onOnline = () => cycle('online', true);
const onPageShow = (e) => { if (e && e.persisted) cycle('pageshow', true); };
const onStudentSaved = () => cycle('student-saved', true);

function broadcast(msg) {
  try { if (bc) bc.postMessage(msg); } catch { /* ignore */ }
}

export function start(user) {
  const id = user && user.id ? user.id : null;
  const un = user && user.username ? user.username : null;
  if (!id && !un) return stop();
  if (running && userId === id && username === un) return;
  stop();
  running = true;
  userId = id; username = un;
  lastRun = 0;
  lastStudentJson = lastFingerprint = lastLessonRev = lastAvatarUrl = lastAvatarActive = undefined;
  redisOk = false;
  lastLessonsEmit = Date.now();

  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onOnline);
  window.addEventListener('pageshow', onPageShow);
  window.addEventListener('learnsy:student-saved', onStudentSaved);
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = (e) => { if (e && e.data === 'poke') cycle('broadcast', true); };
    }
  } catch { bc = null; }

  cycle('start', true);
  scheduleNext();
}

export function stop() {
  running = false;
  clearTimeout(timer); timer = null;
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('focus', onFocus);
  window.removeEventListener('online', onOnline);
  window.removeEventListener('pageshow', onPageShow);
  window.removeEventListener('learnsy:student-saved', onStudentSaved);
  try { if (bc) bc.close(); } catch { /* ignore */ }
  bc = null;
  userId = null; username = null;
}

/** Chạy ngay một chu kỳ (vd. sau khi admin lưu, hoặc học sinh bấm "làm mới"). */
export function trigger(reason = 'manual') {
  broadcast('poke');
  return cycle(reason, true);
}

export function subscribe(topic, fn) {
  if (!subs[topic]) return () => {};
  subs[topic].add(fn);
  return () => subs[topic].delete(fn);
}

/** Báo cho engine biết avatar vừa đổi ở máy này (để không phát lại như "thay đổi từ xa"). */
export function noteLocalAvatar(url, active) {
  lastAvatarUrl = url || null;
  lastAvatarActive = active || null;
  broadcast('poke');
}

if (typeof window !== 'undefined') {
  window.LearnsySync = { start, stop, trigger, subscribe, noteLocalAvatar };
}
