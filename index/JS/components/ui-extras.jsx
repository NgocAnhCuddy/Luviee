import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   UI-EXTRAS.JSX  ·  Dùng chung cho giao diện Mới (/) và Cũ (/classic.html)
   - window.switchUI('new'|'classic')   đổi giao diện (lưu localStorage 'learnsy_ui')
   - window.UiModeCard({dark})           thẻ chọn giao diện đặt trong Cài đặt
   - window.RegisterSheet({dark,onLogin,onClose})  form đăng ký tự phục vụ (giao diện cũ)
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const { useState, useEffect } = React;

  const curMode = () => (/\/classic(\.html)?$/.test(location.pathname) ? 'classic' : 'new');

  window.switchUI = function (mode) {
    try { localStorage.setItem('learnsy_ui', mode === 'classic' ? 'classic' : 'new'); } catch (e) {}
    location.href = mode === 'classic' ? '/classic.html' : '/';
  };

  /* Chủ đề màu: Mặc định (HyperOS xanh) hoặc Bánh bèo (hồng pastel). Đổi xong tải lại trang. */
  function ThemeCard({ dark }) {
    const cur = (window.LearnsyTheme && window.LearnsyTheme.name) || 'default';
    const amo = !(window.LearnsyTheme && window.LearnsyTheme.amoled === false);
    const fg = dark ? '#F2F3F5' : '#1A1C1E';
    const sub = dark ? '#A8AEB6' : '#6B7280';
    const bg = dark ? 'rgba(30,32,36,0.92)' : 'rgba(255,255,255,0.92)';
    const Heart = ({ c }) => <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill={c} /></svg>;
    const Flower = ({ c }) => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><g fill={c}><circle cx="12" cy="5.5" r="3.6" /><circle cx="18.2" cy="10" r="3.6" /><circle cx="15.8" cy="17.3" r="3.6" /><circle cx="8.2" cy="17.3" r="3.6" /><circle cx="5.8" cy="10" r="3.6" /></g><circle cx="12" cy="12" r="2.8" fill="#fff" opacity=".85" /></svg>;
    const opt = (k, title, desc, swatch, icon) => {
      const on = cur === k;
      return (
        <button type="button" className={'ls-theme-opt' + (on ? ' on' : '')} onClick={() => { if (!on && window.LearnsyTheme) window.LearnsyTheme.set(k); }}
          style={{ cursor: on ? 'default' : 'pointer' }}>
          <div className="ls-theme-sw" style={{ background: swatch }}>{icon}</div>
          <div style={{ fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            {title}{on && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ls-ac,#1AB0F5)' }}>· đang dùng</span>}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: sub, marginTop: 3, lineHeight: 1.35 }}>{desc}</div>
        </button>
      );
    };
    return (
      <div style={{ margin: '12px 14px 0', borderRadius: 22, padding: 14, background: bg }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: fg, marginBottom: 10 }}>Màu sắc</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {opt('default', 'Mặc định', 'HyperOS xanh, gọn gàng', 'linear-gradient(135deg,#8FD8FB,#1AB0F5)', <Heart c="#fff" />)}
          {opt('banhbeo', 'Bánh bèo', 'Hồng pastel, nơ, tim, hoa', 'linear-gradient(135deg,#FFC1DA,#FF6FA8)', <><Flower c="#fff" /><Heart c="#fff" /><Flower c="#fff" /></>)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--hy-line,rgba(128,128,128,.18))' }}>
          <span style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#1A1B1F' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: fg }}>Nền đen thuần (AMOLED)</div>
            <div style={{ fontSize: 12, color: sub, marginTop: 2, lineHeight: 1.35 }}>Chỉ ở chế độ tối. Tiết kiệm pin màn OLED, đen sâu hơn.</div>
          </div>
          <div className={'bb-toggle-track' + (amo ? ' is-on' : '')} role="switch" aria-checked={amo} tabIndex={0}
            onClick={() => window.LearnsyTheme && window.LearnsyTheme.setAmoled(!amo)}>
            <div className="bb-toggle-thumb" />
          </div>
        </div>
      </div>
    );
  }

  function UiModeCard({ dark }) {
    const cur = curMode();
    const fg = dark ? '#F2F3F5' : '#1A1C1E';
    const sub = dark ? '#A8AEB6' : '#6B7280';
    const bg = dark ? 'rgba(30,32,36,0.92)' : 'rgba(255,255,255,0.92)';
    const opt = (k, title, desc) => {
      const on = cur === k;
      return (
        <button type="button" onClick={() => { if (!on) window.switchUI(k); }}
          style={{ flex: 1, textAlign: 'left', border: on ? '2px solid #1AB0F5' : '2px solid transparent', borderRadius: 16, padding: '12px 12px', cursor: on ? 'default' : 'pointer', background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: fg, fontFamily: 'inherit' }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            {title}{on && <span style={{ fontSize: 11, fontWeight: 700, color: '#1AB0F5' }}>· đang dùng</span>}
          </div>
          <div style={{ fontSize: 12, fontWeight: 500, color: sub, marginTop: 3, lineHeight: 1.35 }}>{desc}</div>
        </button>
      );
    };
    return (
      <div style={{ margin: '12px 14px 100px', borderRadius: 22, padding: 14, background: bg }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: fg, marginBottom: 10 }}>Giao diện</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {opt('new', 'Mới', 'HyperOS: gọn, menu ≡')}
          {opt('classic', 'Cũ', 'Giao diện gốc: thanh tab dưới')}
        </div>
        <div style={{ fontSize: 11.5, color: sub, marginTop: 10, lineHeight: 1.4 }}>Đổi xong trang sẽ tải lại. Tài khoản và dữ liệu học giữ nguyên.</div>
      </div>
    );
  }

  function RegisterSheet({ dark, onLogin, onClose }) {
    const T = window.LearnsyTier;
    const reg = (T && T.cfg && T.cfg.registration) || {};
    const classes = String(reg.classes || '').split(/[\n,;]+/).map((x) => x.trim()).filter(Boolean);
    const [name, setName] = useState('');
    const [cls, setCls] = useState('');
    const [hp, setHp] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [done, setDone] = useState(null);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
      const k = (e) => { if (e.key === 'Escape') onClose && onClose(); };
      document.addEventListener('keydown', k);
      return () => document.removeEventListener('keydown', k);
    }, []);
    const fg = dark ? '#F2F3F5' : '#1A1C1E', sub = dark ? '#A8AEB6' : '#6B7280';
    const field = { width: '100%', boxSizing: 'border-box', height: 46, borderRadius: 14, border: 'none', background: dark ? '#2A2D32' : '#F0F2F5', color: fg, fontSize: 15, fontWeight: 600, padding: '0 14px', outline: 'none', fontFamily: 'inherit' };
    const btn = { width: '100%', minHeight: 48, border: 'none', borderRadius: 16, background: '#1AB0F5', color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
    const lab = { fontSize: 12.5, fontWeight: 700, color: sub, margin: '0 4px 6px' };

    const submit = async () => {
      if (busy) return;
      if (name.trim().length < 2 || !cls.trim()) { setErr('Nhập họ tên và lớp nhé!'); return; }
      setBusy(true); setErr('');
      try {
        const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, className: cls, hp }) });
        const j = await r.json().catch(() => null);
        if (r.ok && j && j.ok) setDone(j); else setErr((j && j.msg) || 'Không đăng ký được. Thử lại nhé!');
      } catch (e) { setErr('Lỗi kết nối, thử lại nhé!'); }
      setBusy(false);
    };
    const copy = async () => {
      try { await navigator.clipboard.writeText('Tài khoản: ' + done.username + '\nMật khẩu: ' + done.password); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
    };
    const enter = async () => {
      setBusy(true); setErr('');
      const res = await onLogin(done.username, done.password);
      if (!res || !res.ok) { setErr((res && res.msg) || 'Đăng nhập thất bại!'); setBusy(false); }
    };

    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, background: dark ? '#1E2024' : '#FFFFFF', borderRadius: 26, padding: '22px 18px 18px', color: fg }}>
          {!done ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 4 }}>Đăng ký tài khoản</div>
              <div style={{ fontSize: 12.5, color: sub, textAlign: 'center', marginBottom: 16 }}>Chỉ cần tên và lớp — mật khẩu do hệ thống tạo</div>
              <div style={lab}>Họ và tên</div>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="vd: Thu Anh" style={{ ...field, marginBottom: 12 }} />
              <div style={lab}>Lớp</div>
              {classes.length ? (
                <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ ...field, marginBottom: 14 }}>
                  <option value="">Chọn lớp…</option>{classes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input value={cls} onChange={(e) => setCls(e.target.value)} maxLength={12} placeholder="" style={{ ...field, marginBottom: 14 }} />
              )}
              <input value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, opacity: 0, width: 1, height: 1 }} />
              {err && <div style={{ color: '#FF3B30', fontSize: 13, fontWeight: 600, margin: '0 4px 12px' }}>{err}</div>}
              <button type="button" style={{ ...btn, opacity: busy ? .7 : 1 }} onClick={submit} disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</button>
              <button type="button" onClick={onClose} style={{ display: 'block', width: '100%', marginTop: 10, border: 'none', background: 'none', color: '#1AB0F5', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Đã có tài khoản? Đăng nhập</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, textAlign: 'center' }}>{done.pending ? 'Đã gửi đăng ký' : 'Tạo tài khoản thành công!'}</div>
              <div style={{ fontSize: 12.5, color: sub, textAlign: 'center', margin: '4px 0 14px' }}>Hãy lưu lại — mật khẩu chỉ hiện một lần này.</div>
              <div style={{ borderRadius: 16, background: dark ? '#2A2D32' : '#F0F2F5', padding: '14px 12px' }}>
                <div style={{ fontSize: 12, color: sub, fontWeight: 600 }}>Tên đăng nhập</div>
                <div style={{ fontSize: 19, fontWeight: 800, userSelect: 'all' }}>{done.username}</div>
                <div style={{ fontSize: 12, color: sub, fontWeight: 600, marginTop: 10 }}>Mật khẩu</div>
                <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: 1, userSelect: 'all' }}>{done.password}</div>
              </div>
              {done.pending && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: '#FF9500' }}>Tài khoản đang chờ giáo viên duyệt, chưa đăng nhập được ngay.</div>}
              {err && <div style={{ marginTop: 12, color: '#FF3B30', fontSize: 13, fontWeight: 600 }}>{err}</div>}
              <button type="button" onClick={copy} style={{ ...btn, marginTop: 14, background: dark ? '#2A2D32' : '#E8EBEF', color: fg }}>{copied ? 'Đã sao chép' : 'Sao chép tài khoản & mật khẩu'}</button>
              {!done.pending
                ? <button type="button" onClick={enter} disabled={busy} style={{ ...btn, marginTop: 10 }}>{busy ? 'Đang vào…' : 'Vào học ngay'}</button>
                : <button type="button" onClick={onClose} style={{ ...btn, marginTop: 10 }}>Về đăng nhập</button>}
            </>
          )}
        </div>
      </div>
    );
  }

  window.UiModeCard = UiModeCard;
  window.ThemeCard = ThemeCard;
  window.RegisterSheet = RegisterSheet;
})();
