import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   STUDENT-LOGIN.JSX — Màn hình đăng nhập học sinh (Nâng cấp UI)
   Giao diện HyperOS 3 — tối giản, ô nhập filled, nút xanh đặc.
   
   Exports (window globals):
     window.StudentLoginScreen — Component: Màn hình đăng nhập
   
   Phụ thuộc:
     - React (window.React)
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    const { useState, useRef, useEffect } = React;

    function StudentLoginScreen({ dark, onLogin, notice }) {
      const [username, setUsername] = useState('');
      const [pw, setPw] = useState('');
      const [show, setShow] = useState(false);
      const [loading, setLoading] = useState(false);
      const [err, setErr] = useState('');
      const [shake, setShake] = useState(false);
      const uRef = useRef();

      // Auto focus vào ô username khi mount
      useEffect(() => {
        const timer = setTimeout(() => uRef.current && uRef.current.focus(), 150);
        return () => clearTimeout(timer);
      }, []);

      // Inject CSS animations (chỉ inject 1 lần)
      useEffect(() => {
        if (document.getElementById('student-login-styles')) return;
        const style = document.createElement('style');
        style.id = 'student-login-styles';
        style.textContent = `
          @keyframes ls-shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          @keyframes ls-spin { to { transform: rotate(360deg); } }
          .do-shake { animation: ls-shake .4s cubic-bezier(.36,.07,.19,.97) both; }
        `;
        document.head.appendChild(style);
      }, []);

      const doShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 400);
      };

      const doLogin = async () => {
        if (loading) return;
        if (!username.trim() || !pw) {
          setErr('Nhập đầy đủ username và mật khẩu nhé!');
          doShake();
          return;
        }
        setLoading(true);
        setErr('');
        const res = await onLogin(username, pw);
        if (!res.ok) {
          setErr(res.msg || 'Đăng nhập thất bại!');
          doShake();
          setPw('');
        }
        setLoading(false);
      };

      const canSubmit = !loading && username.trim() && pw;
      const bannerStyle = (c, bg) => ({
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: c,
        background: bg, borderRadius: 14, padding: '10px 14px', marginBottom: 16
      });

      return (
        <div style={{
          minHeight: '100vh',
          background: 'var(--hy-fill)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            {/* ── Logo chữ ── */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1, color: '#1AB0F5', lineHeight: 1.1 }}>Luviee</div>
              <div className="hy-value" style={{ marginTop: 6 }}>Đăng nhập để bắt đầu luyện tập</div>
            </div>

            <div className="hy-card" style={{ padding: '24px 20px 20px' }}>
              {/* Username */}
              <div style={{ marginBottom: 14 }}>
                <div className="hy-value" style={{ fontSize: 13, fontWeight: 600, margin: '0 4px 6px' }}>Tên đăng nhập</div>
                <input
                  ref={uRef}
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && doLogin()}
                  placeholder="Nhập username của bạn"
                  autoComplete="username" autoCapitalize="none"
                  className="hy-input"
                  style={err ? { outline: '2px solid var(--hy-red)' } : undefined}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <div className="hy-value" style={{ fontSize: 13, fontWeight: 600, margin: '0 4px 6px' }}>Mật khẩu</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? 'text' : 'password'} value={pw}
                    onChange={e => setPw(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doLogin()}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={'hy-input' + (shake ? ' do-shake' : '')}
                    style={{ paddingRight: 48, ...(err ? { outline: '2px solid var(--hy-red)' } : null) }}
                  />
                  <button onClick={() => setShow(s => !s)} tabIndex={-1} type="button" style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: 'var(--hy-sub)', display: 'flex', alignItems: 'center', lineHeight: 0,
                  }}>
                    {show ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Thông báo phiên hết hạn (72h không hoạt động) */}
              {notice && !err && (
                <div style={bannerStyle('var(--hy-orange)', 'rgba(255,149,0,0.12)')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  {notice}
                </div>
              )}

              {/* Error Message */}
              {err && (
                <div style={bannerStyle('var(--hy-red)', 'rgba(255,59,48,0.1)')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {err}
                </div>
              )}

              {/* Login Button */}
              <button className="hy-btn block" onClick={doLogin} disabled={!canSubmit}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'ls-spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : 'Đăng nhập'}
              </button>
            </div>

            <div className="hy-value" style={{ textAlign: 'center', marginTop: 16, fontSize: 12.5 }}>
              Tài khoản do giáo viên cấp phát
            </div>
          </div>
        </div>
      );
    }

    /* ══ EXPORT GLOBALS ══ */
    window.StudentLoginScreen = StudentLoginScreen;
  } catch (e) {
    console.error('[student-login] INIT ERROR:', e);
  }
})();
