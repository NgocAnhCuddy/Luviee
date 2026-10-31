import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   TIER.JSX  ·  Phân bậc Free / Premium (dùng chung index + admin)
   Cấu hình lưu ở bảng tier_settings (id=1). Mặc định TẮT (enabled:false)
   nên cài xong vẫn không ai bị giới hạn cho tới khi admin bật.
   window.LearnsyTier:
     DEFAULTS, norm(cfg), load(force), save(cfg), subscribe(fn)
     setStudent({tier,premium_until,class_name})   ← app học sinh gọi
     tier()  → 'free'|'premium'   · can(feature)  · limits()
     lessonLocked(lesson, normalLessons)  · cutQuestions(lesson)
     attemptsLeft(studentKey) · noteAttempt(studentKey)
   window.TierLockModal({dark,reason,onClose})  ·  window.TierLockCard
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const FEATURES = [
    ['practice', 'Ôn tập riêng'],
    ['vocab', 'Từ vựng'],
    ['listening', 'Luyện nghe'],
    ['stats', 'Thống kê'],
    ['history', 'Lịch sử làm bài'],
    ['notes', 'Ghi chú'],
    ['files', 'Kho tệp'],
  ];

  const DEFAULTS = {
    enabled: false,
    defaultTier: 'free',
    limits: {
      maxLessons: 5,      // 0 = không giới hạn
      maxQuestions: 10,   // 0 = không giới hạn (số câu mỗi bài)
      dailyAttempts: 3,   // 0 = không giới hạn (số lượt làm bài / ngày)
      features: { practice: false, vocab: true, listening: false, stats: false, history: true, notes: true, files: false },
    },
    classTiers: {},       // { 'tên-lớp': {tier:'premium', until:'2026-12-31'} }
    lessonAccess: {},     // { lessonId: 'free' | 'premium' }
    upgradeTitle: 'Tính năng Premium',
    upgradeText: 'Nâng cấp Premium để mở khoá toàn bộ bài, câu hỏi và tính năng.',
    contact: '',
    registration: { enabled: false, classes: '', tier: 'inherit', approval: false },
  };

  function norm(cfg) {
    const c = cfg && typeof cfg === 'object' ? cfg : {};
    const l = c.limits && typeof c.limits === 'object' ? c.limits : {};
    return {
      enabled: !!c.enabled,
      defaultTier: c.defaultTier === 'premium' ? 'premium' : 'free',
      limits: {
        maxLessons: Math.max(0, parseInt(l.maxLessons ?? DEFAULTS.limits.maxLessons, 10) || 0),
        maxQuestions: Math.max(0, parseInt(l.maxQuestions ?? DEFAULTS.limits.maxQuestions, 10) || 0),
        dailyAttempts: Math.max(0, parseInt(l.dailyAttempts ?? DEFAULTS.limits.dailyAttempts, 10) || 0),
        features: Object.assign({}, DEFAULTS.limits.features, l.features || {}),
      },
      classTiers: c.classTiers && typeof c.classTiers === 'object' ? c.classTiers : {},
      lessonAccess: c.lessonAccess && typeof c.lessonAccess === 'object' ? c.lessonAccess : {},
      upgradeTitle: c.upgradeTitle || DEFAULTS.upgradeTitle,
      upgradeText: c.upgradeText || DEFAULTS.upgradeText,
      contact: c.contact || '',
      registration: {
        enabled: !!(c.registration && c.registration.enabled),
        classes: String((c.registration && c.registration.classes) || ''),
        tier: c.registration && ['free', 'premium'].includes(c.registration.tier) ? c.registration.tier : 'inherit',
        approval: !!(c.registration && c.registration.approval),
      },
    };
  }

  let cfg = norm(null);
  let stu = null;
  let loaded = false;
  const subs = new Set();
  const emit = () => { subs.forEach((f) => { try { f(); } catch (e) {} }); };

  const alive = (until) => !until || new Date(until).getTime() > Date.now();
  const lc = (s) => String(s || '').trim().toLowerCase();

  function tier() {
    if (!cfg.enabled) return 'premium';
    if (!stu) return cfg.defaultTier;
    if (stu.tier === 'premium') return alive(stu.premium_until) ? 'premium' : 'free';
    if (stu.tier === 'free') return 'free';
    // kế thừa theo lớp
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

  const isFree = () => tier() === 'free';

  /* Quyền riêng của học sinh (admin đặt): ghi đè giới hạn chung, chỉ khi phân bậc đang bật */
  const perks = () => (cfg.enabled && stu && stu.perks && typeof stu.perks === 'object' ? stu.perks : {});
  const lim = (k) => {
    const p = perks();
    return p[k] !== undefined && p[k] !== null && p[k] !== '' ? Math.max(0, parseInt(p[k], 10) || 0) : cfg.limits[k];
  };

  async function load(force) {
    if (loaded && !force) return cfg;
    try { if (window.__configReady) await window.__configReady; } catch (e) {}
    if (!window.supa) return cfg; // chưa kết nối → lần sau thử lại
    let changed = !loaded;   // lần nạp đầu luôn phát; các lần sau (đồng bộ định kỳ) chỉ phát khi cấu hình đổi thật
    try {
      const { data, error } = await window.supa.from('tier_settings').select('config').eq('id', 1).maybeSingle();
      if (!error && data) {
        const next = norm(data.config);
        if (JSON.stringify(next) !== JSON.stringify(cfg)) { cfg = next; changed = true; }
      }
    } catch (e) { /* bảng chưa tạo / lỗi mạng → giữ nguyên cấu hình đang dùng */ }
    loaded = true;
    if (changed) emit();
    return cfg;
  }

  async function save(next) {
    const c = norm(next);
    const { error } = await window.supa.from('tier_settings')
      .upsert({ id: 1, config: c, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) return { error };
    cfg = c; loaded = true; emit();
    try { if (typeof window.invalidateCache === 'function') window.invalidateCache(); } catch (e) {}
    return { error: null };
  }

  function setStudent(s) {
    const next = s || null;
    // Đồng bộ định kỳ gọi lại nhiều lần: không đổi thì không render lại cả app
    if (JSON.stringify(next) === JSON.stringify(stu)) return;
    stu = next; emit();
  }

  function can(feature) {
    const pf = perks().features;
    if (pf && pf[feature] === true) return true;
    if (pf && pf[feature] === false) return false;
    if (!isFree()) return true;
    const f = cfg.limits.features[feature];
    return f === undefined ? true : !!f;
  }

  /* Bài bị khoá cho Free: đặt 'premium' thủ công, hoặc nằm ngoài N bài mới nhất */
  function lessonLocked(lesson, list) {
    if (!isFree()) return false;
    const ol = perks().openLessons;
    if (Array.isArray(ol) && ol.includes(lesson.id)) return false;
    const acc = cfg.lessonAccess[lesson.id];
    if (acc === 'premium') return true;
    if (acc === 'free') return false;
    const max = lim('maxLessons');
    if (!max) return false;
    const open = (list || []).filter((l) => cfg.lessonAccess[l.id] !== 'free' && cfg.lessonAccess[l.id] !== 'premium');
    // danh sách lấy theo created_at tăng dần → N bài mới nhất nằm cuối
    const allowed = new Set(open.slice(-max).map((l) => l.id));
    return !allowed.has(lesson.id);
  }

  function cutQuestions(lesson) {
    const max = lim('maxQuestions');
    const qs = lesson.questions || [];
    if (!isFree() || !max || qs.length <= max) return lesson;
    return Object.assign({}, lesson, { questions: qs.slice(0, max), tierCut: { shown: max, total: qs.length } });
  }

  const dayKey = (k) => 'learnsy_tier_att_' + (k || 'anon') + '_' + new Date().toISOString().slice(0, 10);
  function attemptsLeft(k) {
    const max = lim('dailyAttempts');
    if (!isFree() || !max) return Infinity;
    let n = 0;
    try { n = parseInt(localStorage.getItem(dayKey(k)) || '0', 10) || 0; } catch (e) {}
    return Math.max(0, max - n);
  }
  function refundAttempt(k) {
    if (!isFree() || !lim('dailyAttempts')) return;
    try { localStorage.setItem(dayKey(k), String(Math.max(0, (parseInt(localStorage.getItem(dayKey(k)) || '0', 10) || 0) - 1))); } catch (e) {}
  }
  function noteAttempt(k) {
    if (!isFree() || !lim('dailyAttempts')) return;
    try { localStorage.setItem(dayKey(k), String((parseInt(localStorage.getItem(dayKey(k)) || '0', 10) || 0) + 1)); } catch (e) {}
  }

  /* ── window.supaGate(): client supabase-js đọc qua /api/data (server kiểm tra bậc) ──
     Chưa deploy /api/data (404/5xx/lỗi mạng) → tự dùng đường trực tiếp như cũ. */
  let gate = null;
  window.supaGate = function () {
    const base = window.supa;
    if (!base || !window.supabase || !base.supabaseUrl) return base || null;
    if (gate) return gate;
    const root = String(base.supabaseUrl).replace(/\/+$/, '') + '/rest/v1/';
    const gateFetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      const method = String((init && init.method) || (typeof input !== 'string' && input.method) || 'GET').toUpperCase();
      const tk = window.LearnsySession && window.LearnsySession.getToken && window.LearnsySession.getToken();
      if (tk && url.startsWith(root) && (method === 'GET' || method === 'HEAD')) {
        try {
          const h = new Headers((init && init.headers) || (typeof input !== 'string' ? input.headers : undefined));
          h.set('Authorization', 'Bearer ' + tk);
          const r = await fetch('/api/data/' + url.slice(root.length), { method, headers: h });
          if (r.status !== 404 && r.status !== 501 && r.status < 500) return r;
        } catch (e) { /* mạng lỗi → đường trực tiếp */ }
      }
      return fetch(input, init);
    };
    gate = window.supabase.createClient(base.supabaseUrl, base.supabaseKey, {
      global: { fetch: gateFetch },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return gate;
  };

  window.LearnsyTier = {
    FEATURES, DEFAULTS, norm, load, save, setStudent, tier, isFree, can,
    lessonLocked, cutQuestions, attemptsLeft, noteAttempt, refundAttempt,
    get cfg() { return cfg; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };

  /* ── UI khoá ── */
  const LockIcon = ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );

  function TierLockCard({ dark, reason, onClose, compact }) {
    const c = cfg;
    return (
      <div style={{ background: dark ? '#1E2024' : '#FFFFFF', borderRadius: 24, padding: compact ? '20px 18px' : '28px 22px', textAlign: 'center', color: dark ? '#F2F3F5' : '#1A1C1E' }}>
        <div style={{ width: 52, height: 52, borderRadius: 18, background: 'rgba(26,176,245,0.14)', color: '#1AB0F5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><LockIcon /></div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{c.upgradeTitle}</div>
        {reason ? <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 6, color: dark ? '#C8CDD4' : '#2B2E33' }}>{reason}</div> : null}
        <div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5, color: dark ? '#9AA0A8' : '#8A8F98' }}>{c.upgradeText}</div>
        {c.contact ? <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 14, background: dark ? '#2A2D32' : '#F0F2F5', fontSize: 13, fontWeight: 600, whiteSpace: 'pre-wrap' }}>{c.contact}</div> : null}
        {onClose ? (
          <button type="button" onClick={onClose} style={{ marginTop: 16, width: '100%', minHeight: 46, border: 'none', borderRadius: 16, background: '#1AB0F5', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Đã hiểu</button>
        ) : null}
      </div>
    );
  }

  function TierLockModal({ dark, reason, onClose }) {
    React.useEffect(() => {
      const k = (e) => { if (e.key === 'Escape') onClose && onClose(); };
      document.addEventListener('keydown', k);
      return () => document.removeEventListener('keydown', k);
    }, []);
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360 }}>
          <TierLockCard dark={dark} reason={reason} onClose={onClose} compact />
        </div>
      </div>
    );
  }

  window.TierLockCard = TierLockCard;
  window.TierLockModal = TierLockModal;
  window.TierLockIcon = LockIcon;
})();
