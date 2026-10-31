import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   PW-GATE.JSX  ·  Learnsy · Password Gate (HyperOS 3 bottom sheet)
   Exports (window globals):
     window.PwGate — Component: nhập mật khẩu để mở bài học bị khóa

   Phụ thuộc:
     - React (window.React)
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    const { useState } = React;

    function PwGate({ lesson, onUnlock, onCancel, dark }) {
      const [pw, setPw] = useState('');
      const [err, setErr] = useState(false);

      const try_ = () => {
        if (pw === lesson.password) {
          onUnlock();
        } else {
          setErr(true);
          setTimeout(() => setErr(false), 600);
        }
      };

      return (
        <div
          onClick={e => { if (e.target === e.currentTarget) onCancel && onCancel(); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(8,20,28,0.46)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 9999
          }}>
          <div className="hy-sheet" style={{ width: '100%', maxWidth: 480, paddingTop: 30, animation: 'pop .22s ease both' }}>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span className="hy-ico c-orange" style={{ width: 52, height: 52, borderRadius: 16, marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--hy-text)', marginBottom: 4 }}>
                {lesson.title}
              </div>
              <div className="hy-value" style={{ fontSize: 13.5 }}>
                Nhập mật khẩu để mở bài này
              </div>
            </div>

            <input
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && try_()}
              type="password"
              className={'hy-input' + (err ? ' do-shake' : '')}
              placeholder="Mật khẩu"
              autoFocus
              style={{
                textAlign: 'center', letterSpacing: 3, marginBottom: 14,
                outline: err ? '2px solid var(--hy-red)' : undefined
              }}
            />

            <button className="hy-btn block" onClick={try_} style={{ marginBottom: 8 }}>
              Mở bài
            </button>
            <button className="hy-btn plain block" onClick={onCancel}>
              Quay lại
            </button>
          </div>
          <style>{`
            .do-shake { animation: pw-shake .35s ease !important; }
            @keyframes pw-shake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-6px); }
              40%, 80% { transform: translateX(6px); }
            }
          `}</style>
        </div>
      );
    }

    /* ══ EXPORT GLOBALS ══ */
    window.PwGate = PwGate;
  } catch (e) {
    console.error('[pw-gate] INIT ERROR:', e);
  }
})();
