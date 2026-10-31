import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   TIER-MANAGER.JSX  ·  Admin → Phân bậc Free / Premium
   Cấu hình lưu ở bảng tier_settings (xem supabase/migrations/2026_tiers.sql)
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const { useState, useEffect, useMemo } = React;

  function Switch({ on, onChange, label }) {
    return (
      <button type="button" role="switch" aria-checked={!!on} aria-label={label} onClick={() => onChange(!on)}
        style={{ width: 46, height: 28, borderRadius: 99, border: 'none', padding: 0, position: 'relative', cursor: 'pointer', flexShrink: 0, background: on ? '#1AB0F5' : 'rgba(120,125,135,0.35)', transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </button>
    );
  }

  function TierManager({ dark, C, toast_ }) {
    const T = window.LearnsyTier;
    const [cfg, setCfg] = useState(() => T.norm(T.cfg));
    const [orig, setOrig] = useState(() => JSON.stringify(T.norm(T.cfg)));
    const [classes, setClasses] = useState([]);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
      let alive = true;
      (async () => {
        const c = await T.load(true);
        if (!alive) return;
        setCfg(T.norm(c)); setOrig(JSON.stringify(T.norm(c)));
        try {
          const { data } = await window.supa.from('students').select('class_name');
          if (alive && data) setClasses([...new Set(data.map((s) => String(s.class_name || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true })));
        } catch (e) {}
      })();
      return () => { alive = false; };
    }, []);

    const dirty = useMemo(() => JSON.stringify(cfg) !== orig, [cfg, orig]);
    const set = (patch) => setCfg((c) => ({ ...c, ...patch }));
    const setLim = (patch) => setCfg((c) => ({ ...c, limits: { ...c.limits, ...patch } }));
    const setFeat = (k, v) => setCfg((c) => ({ ...c, limits: { ...c.limits, features: { ...c.limits.features, [k]: v } } }));
    const setClassTier = (cls, patch) => setCfg((c) => {
      const cur = c.classTiers[cls] || { tier: 'inherit', until: '' };
      const nx = { ...cur, ...patch };
      const ct = { ...c.classTiers };
      if (nx.tier === 'inherit') delete ct[cls]; else ct[cls] = nx;
      return { ...c, classTiers: ct };
    });

    const save = async () => {
      setSaving(true); setErr('');
      const { error } = await T.save(cfg);
      setSaving(false);
      if (error) {
        const m = /relation|does not exist|schema cache/i.test(error.message || '') ? 'Chưa có bảng tier_settings — chạy supabase/migrations/2026_tiers.sql trước.' : error.message;
        setErr(m); toast_ && toast_('x ' + m, 4000); return;
      }
      setOrig(JSON.stringify(T.norm(cfg)));
      toast_ && toast_('✓ Đã lưu phân bậc', 1800);
    };

    const bg = dark ? '#1E2024' : '#FFFFFF';
    const fg = dark ? '#F2F3F5' : '#1A1C1E';
    const sub = dark ? '#9AA0A8' : '#8A8F98';
    const fill = dark ? '#2A2D32' : '#F0F2F5';
    const card = { background: bg, borderRadius: 22, padding: '4px 16px', margin: '0 0 14px' };
    const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', minHeight: 52 };
    const line = { borderTop: '1px solid ' + (dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)') };
    const label = { flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: fg };
    const hint = { fontSize: 12, fontWeight: 500, color: sub, marginTop: 2 };
    const sec = { fontSize: 12.5, fontWeight: 600, color: sub, margin: '18px 6px 8px', textTransform: 'uppercase', letterSpacing: .4 };
    const inp = { width: 84, height: 38, borderRadius: 12, border: 'none', background: fill, color: fg, fontSize: 15, fontWeight: 600, textAlign: 'center', outline: 'none' };
    const txt = { width: '100%', borderRadius: 14, border: 'none', background: fill, color: fg, fontSize: 14, fontWeight: 500, padding: '11px 13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
    const sel = { height: 38, borderRadius: 12, border: 'none', background: fill, color: fg, fontSize: 13.5, fontWeight: 600, padding: '0 10px', outline: 'none' };
    const seg = (val, opts, on) => (
      <div style={{ display: 'flex', background: fill, borderRadius: 12, padding: 3, gap: 3 }}>
        {opts.map(([k, t]) => (
          <button key={k} type="button" onClick={() => on(k)} style={{ border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', background: val === k ? '#1AB0F5' : 'transparent', color: val === k ? '#fff' : sub }}>{t}</button>
        ))}
      </div>
    );
    const num = (k, t, h) => (
      <div style={{ ...row, ...line }}>
        <div style={label}>{t}<div style={hint}>{h}</div></div>
        <input type="number" min="0" inputMode="numeric" value={cfg.limits[k]} onChange={(e) => setLim({ [k]: Math.max(0, parseInt(e.target.value, 10) || 0) })} style={inp} />
      </div>
    );

    return (
      <div style={{ padding: '16px 12px 120px' }} className="fade-up">
        <div style={{ fontSize: 22, fontWeight: 700, color: fg, margin: '0 6px 4px' }}>Phân bậc Free / Premium</div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: sub, margin: '0 6px 6px', lineHeight: 1.5 }}>
          Học sinh Free sẽ bị cắt theo giới hạn dưới đây. Đặt 0 = không giới hạn. Bậc từng học sinh chỉnh ở tab Học sinh, theo lớp chỉnh ở mục bên dưới.
        </div>

        <div style={{ ...card, marginTop: 14 }}>
          <div style={row}>
            <div style={label}>Bật phân bậc<div style={hint}>Đang tắt thì mọi học sinh đều dùng đầy đủ</div></div>
            <Switch on={cfg.enabled} onChange={(v) => set({ enabled: v })} label="Bật phân bậc" />
          </div>
          <div style={{ ...row, ...line }}>
            <div style={label}>Bậc mặc định<div style={hint}>Cho học sinh không có bậc riêng và lớp chưa đặt</div></div>
            {seg(cfg.defaultTier, [['free', 'Free'], ['premium', 'Premium']], (v) => set({ defaultTier: v }))}
          </div>
        </div>

        <div style={sec}>Giới hạn của Free</div>
        <div style={card}>
          <div style={{ height: 1 }} />
          {num('maxLessons', 'Số bài được học', 'Chỉ N bài mới nhất mở, còn lại bị khoá. Bài đặt “Luôn Free/Premium” không tính')}
          {num('maxQuestions', 'Số câu mỗi bài', 'Bài dài hơn sẽ chỉ hiện N câu đầu')}
          {num('dailyAttempts', 'Lượt làm bài mỗi ngày', 'Tính theo từng máy của học sinh')}
        </div>

        <div style={sec}>Tính năng Free được dùng</div>
        <div style={card}>
          {T.FEATURES.map(([k, t], i) => (
            <div key={k} style={{ ...row, ...(i ? line : null) }}>
              <div style={label}>{t}</div>
              <Switch on={cfg.limits.features[k] !== false} onChange={(v) => setFeat(k, v)} label={t} />
            </div>
          ))}
        </div>

        <div style={sec}>Bậc theo lớp</div>
        <div style={card}>
          {classes.length === 0 && <div style={{ ...row, color: sub, fontSize: 13.5, fontWeight: 500 }}>Chưa có lớp nào trong tab Học sinh.</div>}
          {classes.map((cls, i) => {
            const ct = cfg.classTiers[cls] || { tier: 'inherit', until: '' };
            return (
              <div key={cls} style={{ ...row, ...(i ? line : null), flexWrap: 'wrap' }}>
                <div style={{ ...label, flex: '1 1 90px' }}>{cls}</div>
                <select value={ct.tier} onChange={(e) => setClassTier(cls, { tier: e.target.value })} style={sel}>
                  <option value="inherit">Mặc định</option>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
                {ct.tier === 'premium' && (
                  <input type="date" value={ct.until || ''} onChange={(e) => setClassTier(cls, { until: e.target.value })} title="Hạn Premium (để trống = không hết hạn)" style={{ ...sel, width: 142 }} />
                )}
              </div>
            );
          })}
        </div>

        <div style={sec}>Nội dung hiện cho học sinh Free</div>
        <div style={{ ...card, padding: '14px 16px' }}>
          <input value={cfg.upgradeTitle} onChange={(e) => set({ upgradeTitle: e.target.value })} placeholder="Tiêu đề" style={{ ...txt, marginBottom: 8, fontWeight: 600 }} />
          <textarea value={cfg.upgradeText} onChange={(e) => set({ upgradeText: e.target.value })} rows={3} placeholder="Lời giới thiệu Premium" style={{ ...txt, marginBottom: 8, resize: 'vertical' }} />
          <textarea value={cfg.contact} onChange={(e) => set({ contact: e.target.value })} rows={2} placeholder="Cách liên hệ để nâng cấp (Zalo, SĐT, email…)" style={{ ...txt, resize: 'vertical' }} />
        </div>

        <div style={sec}>Đăng ký tài khoản (học sinh tự đăng ký)</div>
        <div style={card}>
          <div style={row}>
            <div style={label}>Cho phép tự đăng ký<div style={hint}>Hiện nút “Đăng ký” ở màn đăng nhập. Học sinh chỉ nhập tên và lớp, mật khẩu do hệ thống tạo</div></div>
            <Switch on={cfg.registration.enabled} onChange={(v) => set({ registration: { ...cfg.registration, enabled: v } })} label="Cho phép tự đăng ký" />
          </div>
          <div style={{ ...row, ...line }}>
            <div style={label}>Bậc của tài khoản mới</div>
            <select value={cfg.registration.tier} onChange={(e) => set({ registration: { ...cfg.registration, tier: e.target.value } })} style={sel}>
              <option value="inherit">Theo lớp / mặc định</option><option value="free">Free</option><option value="premium">Premium</option>
            </select>
          </div>
          <div style={{ ...row, ...line }}>
            <div style={label}>Admin duyệt trước<div style={hint}>Tài khoản mới bị khoá cho tới khi bạn bật lại trong tab Học sinh</div></div>
            <Switch on={cfg.registration.approval} onChange={(v) => set({ registration: { ...cfg.registration, approval: v } })} label="Admin duyệt trước" />
          </div>
          <div style={{ padding: '12px 0 14px', ...line }}>
            <div style={label}>Danh sách lớp được chọn<div style={hint}>Mỗi lớp một dòng hoặc cách nhau dấu phẩy. Để trống = học sinh tự gõ tên lớp</div></div>
            <textarea value={cfg.registration.classes} onChange={(e) => set({ registration: { ...cfg.registration, classes: e.target.value } })} rows={2} placeholder="" style={{ ...txt, marginTop: 8, resize: 'vertical' }} />
            {classes.length > 0 && (
              <button type="button" onClick={() => set({ registration: { ...cfg.registration, classes: classes.join(', ') } })} style={{ marginTop: 8, border: 'none', background: 'none', color: '#1AB0F5', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Điền từ các lớp hiện có ({classes.length})</button>
            )}
          </div>
        </div>

        {err && <div style={{ margin: '0 6px 10px', color: '#FF3B30', fontSize: 13, fontWeight: 600 }}>{err}</div>}

        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(14px + env(safe-area-inset-bottom,0px))', display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
          <button type="button" disabled={!dirty || saving} onClick={save}
            style={{ pointerEvents: 'auto', width: '100%', maxWidth: 420, minHeight: 50, border: 'none', borderRadius: 18, background: dirty ? '#1AB0F5' : (dark ? '#2A2D32' : '#D9DDE2'), color: dirty ? '#fff' : sub, fontSize: 15.5, fontWeight: 600, cursor: dirty ? 'pointer' : 'default' }}>
            {saving ? 'Đang lưu…' : dirty ? 'Lưu thay đổi' : 'Đã lưu'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Quyền riêng của 1 học sinh (dùng trong Sửa học sinh) ──
     value = {features:{vocab:true|false}, maxLessons, maxQuestions, dailyAttempts, openLessons:[ids]} | null */
  function PerksEditor({ dark, value, onChange }) {
    const T = window.LearnsyTier;
    const v = value || {};
    const [open, setOpen] = useState(!!(value && Object.keys(value).length));
    const [lessons, setLessons] = useState([]);
    const [q, setQ] = useState('');
    useEffect(() => {
      if (!open || lessons.length) return;
      window.supa.from('lessons').select('id,title,subject').order('created_at', { ascending: false })
        .then(({ data }) => setLessons(data || []));
    }, [open]);
    const fg = dark ? '#F2F3F5' : '#1A1C1E', sub = dark ? '#9AA0A8' : '#8A8F98', fill = dark ? '#2A2D32' : '#F0F2F5';
    const emit = (patch) => {
      const n = { ...v, ...patch };
      if (n.features) { n.features = { ...n.features }; Object.keys(n.features).forEach((k) => { if (n.features[k] === undefined) delete n.features[k]; }); if (!Object.keys(n.features).length) delete n.features; }
      ['maxLessons', 'maxQuestions', 'dailyAttempts'].forEach((k) => { if (n[k] === '' || n[k] === undefined || n[k] === null) delete n[k]; });
      if (!n.openLessons || !n.openLessons.length) delete n.openLessons;
      onChange(Object.keys(n).length ? n : null);
    };
    const sel = { height: 34, borderRadius: 10, border: 'none', background: fill, color: fg, fontSize: 12.5, fontWeight: 600, padding: '0 8px', outline: 'none' };
    const numInp = { width: '100%', height: 34, borderRadius: 10, border: 'none', background: fill, color: fg, fontSize: 13, fontWeight: 600, textAlign: 'center', outline: 'none', boxSizing: 'border-box' };
    const lab = { fontSize: 10, fontWeight: 700, color: sub, letterSpacing: .8, textTransform: 'uppercase', marginBottom: 4, display: 'block' };
    const picked = new Set((v.openLessons || []).map(String));
    const shown = lessons.filter((l) => !q || (l.title || '').toLowerCase().includes(q.toLowerCase()));
    return (
      <div style={{ borderRadius: 14, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)', padding: '8px 12px' }}>
        <button type="button" onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', color: fg, fontSize: 13, fontWeight: 700, textAlign: 'left' }}>
          <span style={{ flex: 1 }}>Quyền riêng {value ? <span style={{ color: '#1AB0F5' }}>· đang bật</span> : null}</span>
          <span style={{ color: sub, fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            <div style={{ fontSize: 11.5, color: sub, lineHeight: 1.45 }}>Ghi đè bậc & giới hạn chung chỉ cho học sinh này. Để “Theo bậc” / trống = không ghi đè. 0 = không giới hạn.</div>
            <div>
              <span style={lab}>Tính năng</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {T.FEATURES.map(([k, t]) => {
                  const cur = v.features && v.features[k] !== undefined ? String(v.features[k]) : '';
                  return (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: fg }}>
                      <span style={{ flex: 1, minWidth: 0 }}>{t}</span>
                      <select value={cur} onChange={(e) => emit({ features: { ...(v.features || {}), [k]: e.target.value === '' ? undefined : e.target.value === 'true' } })} style={sel}>
                        <option value="">Theo bậc</option><option value="true">Mở</option><option value="false">Khoá</option>
                      </select>
                    </label>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {[['maxLessons', 'Số bài'], ['maxQuestions', 'Câu / bài'], ['dailyAttempts', 'Lượt / ngày']].map(([k, t]) => (
                <div key={k}><span style={lab}>{t}</span>
                  <input type="number" min="0" placeholder="Theo chung" value={v[k] ?? ''} onChange={(e) => emit({ [k]: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0) })} style={numInp} /></div>
              ))}
            </div>
            <div>
              <span style={lab}>Mở riêng các bài ({picked.size})</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm bài…" style={{ ...numInp, textAlign: 'left', padding: '0 10px', marginBottom: 6 }} />
              <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {shown.map((l) => {
                  const on = picked.has(String(l.id));
                  return (
                    <label key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, color: fg, padding: '5px 4px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={on} onChange={() => { const n = new Set(picked); on ? n.delete(String(l.id)) : n.add(String(l.id)); emit({ openLessons: [...n] }); }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title || 'Chưa đặt tên'}</span>
                      <span style={{ color: sub, fontSize: 11 }}>{l.subject}</span>
                    </label>
                  );
                })}
                {open && !shown.length && <div style={{ fontSize: 12, color: sub }}>Không có bài.</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  window.TierManager = TierManager;
  window.TierPerksEditor = PerksEditor;
})();
