import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   HIST-DETAIL.JSX  ·  Learnsy · History Detail (HyperOS 3 bottom sheet)
   Exports (window globals):
     window.HistDetailModal — Component: chi tiết 1 lần làm quiz

   Phụ thuộc:
     - React (window.React)
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    const { useState } = React;

    const GREEN = '#34C759', ORANGE = '#FF9500', RED = '#FF3B30';

    function formatTime(sec) {
      if (!sec || sec <= 0) return null;
      const m = Math.floor(sec / 60), s = sec % 60;
      return m > 0 ? `${m}p${String(s).padStart(2, '0')}s` : `${s}s`;
    }

    function ScoreRing({ pct, color, dark }) {
      const R = 42, SW = 10, SIZE = R * 2 + SW;
      const CIRC = 2 * Math.PI * R;
      const dash = Math.max(0, Math.min(1, pct / 100)) * CIRC;
      return (
        <svg width={SIZE} height={SIZE} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
            stroke="rgba(128,128,128,0.2)" strokeWidth={SW} />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
            stroke={color} strokeWidth={SW} strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
            style={{ transition: 'stroke-dasharray .7s cubic-bezier(.22,1,.36,1)' }} />
        </svg>
      );
    }

    function StatPill({ count, label, color }) {
      return (
        <div style={{
          flex: 1, textAlign: 'center', padding: '10px 6px',
          background: `${color}1F`, borderRadius: 16
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
          <div style={{ fontSize: 12, color, fontWeight: 600, marginTop: 3 }}>{label}</div>
        </div>
      );
    }

    function QuestionRow({ pq, pi, dark, subC, cardBg, cardBorder, expanded, onToggle }) {
      const color = pq.ok ? GREEN : pq.partial ? ORANGE : RED;
      const label = pq.ok ? 'Đúng' : pq.partial ? 'Một phần' : 'Sai';
      const qt = pq.qText || pq.text || '';
      const hasDetail = qt || pq.userAns || pq.correctAns;

      return (
        <div className="hy-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 0, minHeight: 0 }}>
          <div onClick={() => hasDetail && onToggle(pi)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', minHeight: 56,
              cursor: hasDetail ? 'pointer' : 'default',
              userSelect: 'none'
            }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{
              fontSize: 14.5, color: 'var(--hy-text)', fontWeight: 500, flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              Câu {pi + 1}{qt ? ` – ${qt.length > 36 ? qt.slice(0, 36) + '…' : qt}` : ''}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color, flexShrink: 0 }}>{label}</span>
            {hasDetail && (
              <i className="hy-chevron" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s ease' }} />
            )}
          </div>

          {expanded && hasDetail && (
            <div style={{
              padding: '0 16px 14px 36px',
              display: 'flex', flexDirection: 'column', gap: 4
            }}>
              {pq.userAns && (
                <div style={{ fontSize: 13, color: 'var(--hy-sub)' }}>
                  Bạn trả lời:{' '}
                  <span style={{ color, fontWeight: 600 }}>{pq.userAns}</span>
                </div>
              )}
              {!pq.ok && pq.correctAns && (
                <div style={{ fontSize: 13, color: 'var(--hy-sub)' }}>
                  Đáp án đúng:{' '}
                  <span style={{ color: GREEN, fontWeight: 600 }}>{pq.correctAns}</span>
                </div>
              )}
              {!pq.userAns && !pq.correctAns && qt && (
                <div style={{ fontSize: 13, color: 'var(--hy-sub)', fontStyle: 'italic' }}>
                  {pq.ok ? 'Trả lời đúng' : 'Trả lời sai'}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    function HistDetailModal({ h, dark, onClose }) {
      const [expandedQ, setExpandedQ] = useState(null);
      if (!h) return null;

      const pct = h.pct || 0;
      const pctRound = Math.round(pct);
      const scoreColor = pct >= 80 ? GREEN : pct >= 50 ? ORANGE : RED;
      const label = pct >= 80 ? 'Xuất sắc' : pct >= 50 ? 'Khá tốt' : 'Cần ôn thêm';

      const d = new Date(h.ts);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} `
        + `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const timeStr = formatTime(h.durationSec || h.timeTaken);

      const perQ = h.perQ || [];
      const nCorrect = perQ.filter(q => q.ok).length;
      const nPartial = perQ.filter(q => !q.ok && q.partial).length;
      const nWrong = perQ.filter(q => !q.ok && !q.partial).length;
      const hasPartial = nPartial > 0;

      const subC = 'var(--hy-sub)';
      const toggleQ = (pi) => setExpandedQ(prev => prev === pi ? null : pi);

      return (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8,20,28,0.46)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="hy-sheet" onClick={e => e.stopPropagation()} style={{
            maxWidth: 480, width: '100%', paddingTop: 30,
            animation: 'pop .25s cubic-bezier(.22,1,.36,1) both',
            maxHeight: '90vh', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 0
          }}>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--hy-text)', flex: 1, letterSpacing: -0.2 }}>Chi tiết lần làm</span>
              <button className="hy-btn plain icon sm" onClick={onClose} aria-label="Đóng" style={{ width: 36 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ── Title + meta ── */}
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hy-text)', marginBottom: 8, lineHeight: 1.35 }}>
              {h.lessonTitle}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {h.subject && <span className="hy-chip on" style={{ height: 26, fontSize: 12.5 }}>{h.subject}</span>}
              <span className="hy-chip" style={{ height: 26, fontSize: 12.5, fontWeight: 500 }}>{dateStr}</span>
              {timeStr && <span className="hy-chip" style={{ height: 26, fontSize: 12.5, fontWeight: 500 }}>{timeStr}</span>}
              <span className="hy-chip" style={{ height: 26, fontSize: 12.5, fontWeight: 500 }}>{h.qCount || perQ.length || '—'} câu</span>
            </div>

            {/* ── Score card (ring + text) ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12,
              padding: '16px 18px', background: 'var(--hy-fill)', borderRadius: 24
            }}>
              <ScoreRing pct={pct} color={scoreColor} dark={dark} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                  {pctRound}%
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--hy-text)', marginTop: 4 }}>
                  {(() => {
                    const v = Number.isFinite(Number(h.diem10)) ? Number(h.diem10)
                      : (h.total > 0 ? Math.min(1, h.score / h.total) * 10 : 0);
                    return String(Math.round(v * 100) / 100);
                  })()} / 10 điểm
                </div>
                <div style={{ fontSize: 13, color: scoreColor, marginTop: 3, fontWeight: 600 }}>{label}</div>
              </div>
            </div>

            {/* ── Stats ── */}
            {perQ.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <StatPill count={nCorrect} label="Đúng" color={GREEN} />
                {hasPartial && <StatPill count={nPartial} label="Một phần" color={ORANGE} />}
                <StatPill count={nWrong} label="Sai" color={RED} />
              </div>
            )}

            {/* ── Per-question list ── */}
            {perQ.length > 0 && (
              <div>
                <div className="hy-section-label">Chi tiết từng câu</div>
                <div className="hy-card flush" style={{ background: 'var(--hy-fill)' }}>
                  {perQ.map((pq, pi) => (
                    <QuestionRow key={pi}
                      pq={pq} pi={pi} dark={dark}
                      subC={subC}
                      expanded={expandedQ === pi}
                      onToggle={toggleQ} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      );
    }
    /* ══ EXPORT GLOBALS ══ */
    window.HistDetailModal = HistDetailModal;
  } catch (e) {
    console.error('[hist-detail] INIT ERROR:', e);
  }
})();
