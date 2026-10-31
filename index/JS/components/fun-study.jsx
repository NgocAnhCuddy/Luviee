import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   FUN-STUDY.JSX — 2 cách học thêm cho bài Trắc nghiệm / Đúng-Sai
   • "Học vui"     : từng câu 1 màn, phản hồi tức thì, combo + XP + pháo
                     hoa SVG, câu Đúng/Sai tách từng ý (a, b, c, d) và có
                     thể VUỐT phải = Đúng, trái = Sai. Câu sai được hỏi lại.
   • "Học cấp tốc" : (1) lướt nhanh đáp án đúng → (2) luyện bấm giờ, câu
                     sai/hết giờ lặp lại tới khi nhớ → (3) kết quả. Ưu tiên
                     câu bạn từng làm sai (lưu cục bộ theo học sinh + bài).
   Props: lesson, mode ('fun'|'express'), dark, student, onBack
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    const { useState, useEffect, useMemo, useRef } = React;

    const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

    const GOOD = ['Chuẩn luôn!', 'Giỏi quá!', 'Đúng rồi!', 'Xuất sắc!'];
    const COMBO = { 3: 'Combo 3! Đang vào form', 5: 'Combo 5! Siêu đỉnh — nhận 1 khiên', 8: 'Combo 8! Không thể cản', 10: 'Combo 10! Huyền thoại — nhận 1 khiên' };
    const BAD = ['Suýt đúng rồi, nhớ lần sau nhé', 'Không sao, sai là để nhớ lâu', 'Cố lên, câu này sẽ quay lại'];

    /* ── 100% SVG: không dùng emoji ── */
    const ICONS = {
      flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
      star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
      zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
      gamepad: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><path d="M17.32 5H6.68a4 4 0 0 0-3.98 3.59C2.6 9.42 2 14.46 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.41-1.41A2 2 0 0 1 9.83 16h4.34a2 2 0 0 1 1.42.59L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.55-.6-6.58-.69-7.26A4 4 0 0 0 17.32 5z"/>',
      rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
      book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
      target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
      bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>',
      check: '<path d="M20 6L9 17l-5-5"/>',
      x: '<path d="M18 6L6 18M6 6l12 12"/>',
      clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
      trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
      heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
      sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M17 5h4"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      half: '<path d="M5 12h14"/><circle cx="12" cy="6" r="1.2"/><circle cx="12" cy="18" r="1.2"/>',
      timer: '<path d="M10 2h4M12 14l3-3"/><circle cx="12" cy="14" r="8"/>',
      left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
      right: '<path d="M5 12h14M12 5l7 7-7 7"/>',
      medal: '<circle cx="12" cy="15" r="6"/><path d="M8.2 10L5 3h5l2 4M15.8 10L19 3h-5l-2 4"/>',
      crown: '<path d="M2 18l2-11 5 5 3-7 3 7 5-5 2 11zM4 21h16"/>',
      flower: '<circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 1 1 3-3M15 12a3 3 0 1 1 3 3M12 15a3 3 0 1 1-3 3M9 12a3 3 0 1 1-3-3"/>',
      up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    };
    const FILLED = new Set(['star', 'heart', 'flame', 'zap', 'shield']);
    function Ic({ n, s = 16, c = 'currentColor', fill, style }) {
      const f = fill != null ? fill : FILLED.has(n);
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={f ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        style={{ flexShrink: 0, display: 'inline-block', verticalAlign: '-0.18em', ...style }} dangerouslySetInnerHTML={{ __html: ICONS[n] || '' }} />;
    }
    const BURST = [['star', '#FBBF24'], ['heart', '#FF6B9D'], ['sparkle', '#1AB0F5'], ['flower', '#C084FC'], ['zap', '#FF9500'], ['star', '#34C759']];
    const LEVEL_XP = 60;                       // mỗi 60 XP lên 1 cấp
    const levelOf = xp => Math.floor(xp / LEVEL_XP) + 1;
    const bestKey = (sid, lid, mode) => `fs_best_${sid || 'anon'}_${lid}_${mode}`;
    function loadBest(sid, lid, mode) { try { return JSON.parse(localStorage.getItem(bestKey(sid, lid, mode)) || 'null'); } catch (e) { return null; } }
    function saveBest(sid, lid, mode, v) { try { localStorage.setItem(bestKey(sid, lid, mode), JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }

    function buildItems(lesson) {
      const out = [];
      (lesson.questions || []).forEach((q, qi) => {
        if (q.type === 'multiple' && Array.isArray(q.options) && q.options.length > 1 && q.correct != null) {
          out.push({ id: String(qi), kind: 'mc', q: q.question, options: q.options, correct: [q.correct], explanation: q.explanation, image: q.image });
        } else if (q.type === 'multi_select' && Array.isArray(q.options) && (q.correct || []).length) {
          out.push({ id: String(qi), kind: 'ms', q: q.question, options: q.options, correct: q.correct, explanation: q.explanation, image: q.image });
        } else if (q.type === 'true_false' && Array.isArray(q.items)) {
          q.items.forEach((it, ii) => out.push({
            id: `${qi}.${ii}`, kind: 'tf', q: q.question, passage: q.passage, source: q.source, text: it.text,
            answer: !!it.answer, explanation: it.explanation || q.explanation, image: q.image, letter: String.fromCharCode(97 + ii),
          }));
        }
      });
      return out;
    }
    const answerHtml = it => it.kind === 'tf' ? (it.answer ? 'ĐÚNG' : 'SAI') : it.correct.map(i => `${LETTERS[i]}. ${it.options[i]}`).join('<br/>');

    /* lưu câu hay sai theo học sinh + bài */
    const wrongKey = (sid, lid) => `fs_wrong_${sid || 'anon'}_${lid}`;
    function loadWrong(sid, lid) { try { return new Set(JSON.parse(localStorage.getItem(wrongKey(sid, lid)) || '[]')); } catch (e) { return new Set(); } }
    function saveWrong(sid, lid, set) { try { localStorage.setItem(wrongKey(sid, lid), JSON.stringify([...set])); } catch (e) { /* bỏ qua */ } }

    function makePalette(dark) {
      return {
        dark,
        text: dark ? '#F2F6FC' : '#162941', textMid: dark ? '#A9BDD6' : '#607CA0',
        surface: dark ? '#262B33' : 'rgba(255,255,255,0.94)',
        border: dark ? 'rgba(181,212,253,0.26)' : 'rgba(104,168,251,0.16)',
        shadow: dark ? '0 2px 16px rgba(0,0,0,0.35)' : '0 2px 16px rgba(26,176,245,0.1)',
        navBtn: dark ? '#303844' : 'rgba(111,207,251,0.06)',
        navBtnBorder: dark ? 'rgba(153,221,252,0.45)' : 'rgba(111,207,251,0.28)',
        navBtnText: dark ? '#CBEEFF' : '#54B9E8',
      };
    }
    const grad = '#1AB0F5';
    const bigBtn = (extra) => ({
      padding: '13px 26px', borderRadius: 999, border: 'none', cursor: 'pointer', background: grad, color: '#fff',
      fontSize: 14, fontWeight:700, fontFamily: "'Nunito',sans-serif", boxShadow: 'none', ...extra,
    });
    const ghostBtn = (LC, extra) => ({
      padding: '13px 24px', borderRadius: 999, cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
      background: LC.dark ? '#343B47' : LC.surface, color: LC.text, border: `1px solid ${LC.border}`, fontSize: 14, fontWeight:600, ...extra,
    });

    function Html({ html, style, cls }) { return <div className={cls} style={style} dangerouslySetInnerHTML={{ __html: html || '' }} />; }
    function Img({ src }) { return src ? <img src={src} alt="" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 18, margin: '0 auto 12px', display: 'block' }} /> : null; }

    function TopBar({ title, onBack, LC, right }) {
      return (
        <div style={{ padding: '11px 15px 10px', background: LC.dark ? 'rgba(30,34,41,0.96)' : LC.surface, borderBottom: `1px solid ${LC.border}`, position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button onClick={onBack} style={{ padding: '6px 14px', borderRadius: 999, border: `1px solid ${LC.navBtnBorder}`, background: LC.navBtn, color: LC.navBtnText, fontSize: 12, fontWeight:600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Ic n="left" s={14} />Thoát</button>
          <div style={{ fontSize: 14, fontWeight:700, color: LC.text, flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div style={{ minWidth: 70, textAlign: 'right' }}>{right}</div>
        </div>
      );
    }

    const pwBtn = (LC, on) => ({
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: on ? 'pointer' : 'default',
      border: `1px solid ${on ? '#1AB0F5' : LC.border}`, background: on ? 'rgba(26,176,245,0.16)' : LC.surface, color: on ? (LC.dark ? '#7FD6FF' : '#0E8FD0') : LC.textMid, opacity: on ? 1 : 0.55,
    });

    /* ───────────── 1 CÂU HỎI + PHẢN HỒI + COMBO ───────────── */
    function QuizRunner({ items, LC, mode, timePerQ, maxRetry, onFinish, onWrong }) {
      const [queue, setQueue] = useState(() => items.map(it => ({ it, tries: 0 })));
      const [pos, setPos] = useState(0);
      const [picked, setPicked] = useState(null);
      const [res, setRes] = useState(null);
      const [combo, setCombo] = useState(0);
      const [maxCombo, setMaxCombo] = useState(0);
      const [xp, setXp] = useState(0);
      const [firstOk, setFirstOk] = useState(0);
      const [missed, setMissed] = useState([]);
      const [burst, setBurst] = useState(0);
      const [msg, setMsg] = useState('');
      const [timeLeft, setTimeLeft] = useState(timePerQ);
      const [dx, setDx] = useState(0);
      /* ── Tính năng vui mới ── */
      const [shield, setShield] = useState(0);              // khiên: cứu combo khi sai
      const [fifty, setFifty] = useState(2);                // 50:50 (trắc nghiệm 1 đáp án)
      const [extra, setExtra] = useState(1);                // +10 giây (cấp tốc, có giờ)
      const [hidden, setHidden] = useState([]);             // đáp án đã bị 50:50 ẩn
      const [shieldUsed, setShieldUsed] = useState(false);
      const [lvlUp, setLvlUp] = useState(0);                // hiện banner lên cấp
      const [times, setTimes] = useState([]);               // thời gian trả lời từng câu
      const [bonusMs, setBonusMs] = useState(0);            // giây cộng thêm của câu hiện tại
      const qStartRef = useRef(Date.now());
      const t0Ref = useRef(Date.now());
      const doneRef = useRef(false);
      const timeoutRef = useRef(null);
      const touchX = useRef(null);
      const cur = queue[pos];
      const express = mode === 'express';
      /* "Câu vàng": ~1/6 câu (cố định theo id) nhân đôi XP */
      const golden = !!cur && cur.tries === 0 && [...String(cur.it.id)].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 6 === 2;

      useEffect(() => {
        if (pos >= queue.length && !doneRef.current) {
          doneRef.current = true;
          onFinish({ total: items.length, firstOk, missed, maxCombo, xp, level: levelOf(xp), avgSec: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0, seconds: Math.round((Date.now() - t0Ref.current) / 1000) });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [pos]);

      function resolve(ok, timeout) {
        if (res || !cur) return;
        setRes({ ok, timeout });
        const first = cur.tries === 0;
        if (first && !timeout) setTimes(t => [...t, (Date.now() - qStartRef.current) / 1000]);
        if (first) {
          if (ok) setFirstOk(n => n + 1); else setMissed(m => [...m, cur.it]);
          onWrong && onWrong(cur.it.id, !ok);
        }
        if (ok) {
          const c = combo + 1;
          setCombo(c); setMaxCombo(m => Math.max(m, c));
          const gain = ((first ? 10 : 5) + Math.min(c, 10)) * (golden ? 2 : 1);
          const nx = xp + gain;
          if (levelOf(nx) > levelOf(xp)) { setLvlUp(levelOf(nx)); setBurst(b => b + 1); setTimeout(() => setLvlUp(0), 1800); }
          setXp(nx);
          if (c === 5 || c === 10) setShield(n => Math.min(n + 1, 3));
          setMsg((golden ? 'Câu vàng x2 XP! ' : '') + (COMBO[c] || pick(GOOD)));
          if (COMBO[c] || (c > 10 && c % 5 === 0)) setBurst(b => b + 1);
          try { navigator.vibrate && navigator.vibrate(18); } catch (e) { /* bỏ qua */ }
        } else {
          if (shield > 0) { setShield(n => n - 1); setShieldUsed(true); setMsg('Khiên đã đỡ giúp bạn — combo được giữ nguyên'); }
          else { setCombo(0); setMsg(timeout ? 'Hết giờ rồi! Xem đáp án nhé' : pick(BAD)); }
          try { navigator.vibrate && navigator.vibrate(60); } catch (e) { /* bỏ qua */ }
          if (cur.tries < maxRetry) setQueue(q => [...q, { it: cur.it, tries: cur.tries + 1 }]);
        }
      }
      timeoutRef.current = () => resolve(false, true);

      function next() { setPos(p => p + 1); setPicked(null); setRes(null); setMsg(''); setDx(0); setHidden([]); setShieldUsed(false); setBonusMs(0); qStartRef.current = Date.now(); }
      function useFifty() {
        if (res || fifty <= 0 || !cur || cur.it.kind !== 'mc') return;
        const wrong = cur.it.options.map((_, i) => i).filter(i => !cur.it.correct.includes(i) && !hidden.includes(i));
        if (wrong.length < 2) return;   // chỉ còn 1 đáp án sai thì không cần 50:50
        setHidden(shuffle(wrong).slice(0, Math.min(2, wrong.length - 1)));
        setFifty(n => n - 1);
      }
      function useExtra() { if (res || extra <= 0 || !timePerQ) return; setExtra(n => n - 1); setBonusMs(b => b + 10); setTimeLeft(t => t + 10); }

      const autoAdvance = !!res && res.ok && (express || !cur.it.explanation);
      useEffect(() => {
        if (!autoAdvance) return;
        const t = setTimeout(next, express ? 700 : 1100);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [autoAdvance, pos]);

      useEffect(() => {
        if (!timePerQ || res || !cur) return;
        setTimeLeft(timePerQ + bonusMs);
        const t0 = Date.now();
        const id = setInterval(() => {
          const left = timePerQ + bonusMs - (Date.now() - t0) / 1000;
          if (left <= 0) { clearInterval(id); setTimeLeft(0); timeoutRef.current && timeoutRef.current(); }
          else setTimeLeft(left);
        }, 100);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [pos, !!res, timePerQ, bonusMs]);

      if (!cur) return null;
      const it = cur.it;
      const progress = Math.round((pos / Math.max(queue.length, 1)) * 100);
      const typeLabel = it.kind === 'tf' ? 'Đúng / Sai' : it.kind === 'ms' ? 'Chọn nhiều đáp án' : 'Trắc nghiệm';

      function optState(i) {
        if (!res) return (it.kind === 'ms' ? (picked || []).includes(i) : picked === i) ? 'sel' : 'idle';
        if (it.correct.includes(i)) return 'correct';
        if (it.kind === 'ms' ? (picked || []).includes(i) : picked === i) return 'wrong';
        return 'dim';
      }
      const sty = {
        idle: { bg: LC.surface, bd: LC.border, fg: LC.text }, sel: { bg: 'rgba(26,176,245,0.14)', bd: '#1AB0F5', fg: LC.text },
        correct: { bg: 'rgba(52,199,89,0.14)', bd: '#34C759', fg: '#34C759' }, wrong: { bg: 'rgba(255,59,48,0.12)', bd: '#FF3B30', fg: '#FF3B30' },
        dim: { bg: LC.surface, bd: LC.border, fg: LC.textMid },
      };

      function onOption(i) {
        if (res) return;
        if (it.kind === 'mc') { setPicked(i); resolve(it.correct[0] === i, false); }
        else setPicked(p => (p || []).includes(i) ? p.filter(x => x !== i) : [...(p || []), i]);
      }
      function checkMs() {
        const a = [...(picked || [])].sort().join(','), b = [...it.correct].sort().join(',');
        resolve(a === b, false);
      }
      function answerTf(v) { if (res) return; setPicked(v); resolve(v === it.answer, false); }

      const swipeHandlers = it.kind === 'tf' && !res ? {
        onTouchStart: e => { touchX.current = e.touches[0].clientX; },
        onTouchMove: e => { if (touchX.current != null) setDx(e.touches[0].clientX - touchX.current); },
        onTouchEnd: () => { const d = dx; touchX.current = null; setDx(0); if (d > 90) answerTf(true); else if (d < -90) answerTf(false); },
      } : {};

      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight:600, color: LC.textMid }}>Câu {Math.min(pos + 1, queue.length)}/{queue.length}{cur.tries > 0 ? ' · ôn lại' : ''}</span>
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {shield > 0 && <span style={{ fontSize: 12, fontWeight:700, color: '#1AB0F5', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ic n="shield" s={14} />{shield}</span>}
                {combo >= 2 && <span style={{ fontSize: 12, fontWeight:700, color: '#F97316', animation: 'fs-pop .3s ease both', display: 'inline-flex', alignItems: 'center', gap: 3 }} key={combo}><Ic n="flame" s={14} />x{combo}</span>}
                <span style={{ fontSize: 11, fontWeight:700, color: '#1AB0F5', padding: '1px 7px', borderRadius: 99, background: 'rgba(26,176,245,0.14)' }}>Lv {levelOf(xp)}</span>
                <span style={{ fontSize: 12, fontWeight:700, color: '#FF9500', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ic n="star" s={13} />{xp}</span>
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: LC.border, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#1AB0F5', borderRadius: 99, transition: 'width .35s' }} />
            </div>
            <div style={{ height: 4, borderRadius: 99, background: LC.border, overflow: 'hidden', marginTop: 6 }} title="Tiến độ lên cấp">
              <div style={{ height: '100%', width: `${((xp % LEVEL_XP) / LEVEL_XP) * 100}%`, background: '#FF9500', transition: 'width .35s' }} />
            </div>
            {timePerQ > 0 && (
              <div style={{ height: 5, borderRadius: 99, background: LC.border, overflow: 'hidden', marginTop: 6 }}>
                <div style={{ height: '100%', width: `${Math.min(100, (timeLeft / (timePerQ + bonusMs)) * 100)}%`, background: timeLeft < 4 ? '#FF3B30' : '#34C759', transition: 'width .1s linear' }} />
              </div>
            )}
          </div>

          <div key={pos} style={{ flex: 1, padding: '16px 16px 120px', overflowY: 'auto', animation: 'fs-pop .28s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(26,176,245,0.14)', color: '#1AB0F5', fontSize: 11, fontWeight:700 }}>{typeLabel}</span>
              {golden && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 999, background: 'rgba(251,191,36,0.18)', color: '#D99A00', fontSize: 11, fontWeight:700, animation: 'fs-pop .3s ease both' }}><Ic n="star" s={12} />Câu vàng x2 XP</span>}
              <span style={{ flex: 1 }} />
              {!res && it.kind === 'mc' && (
                <button onClick={useFifty} disabled={fifty <= 0 || hidden.length > 0} style={pwBtn(LC, fifty > 0 && !hidden.length)} title="Ẩn 2 đáp án sai"><Ic n="half" s={14} />50:50 · {fifty}</button>
              )}
              {!res && timePerQ > 0 && (
                <button onClick={useExtra} disabled={extra <= 0} style={pwBtn(LC, extra > 0)} title="Thêm 10 giây"><Ic n="timer" s={14} />+10s · {extra}</button>
              )}
            </div>

            {it.kind === 'tf' && it.passage && (
              <div style={{ background: LC.surface, border: `1px solid ${LC.border}`, borderRadius: 22, padding: '13px 15px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight:700, color: '#1AB0F5', letterSpacing: 1.2, marginBottom: 6 }}>ĐOẠN TƯ LIỆU</div>
                <Html cls="ls-passage-text" html={it.passage} style={{ fontStyle: 'italic', color: LC.textMid, lineHeight: 1.7 }} />
                {it.source && <div style={{ fontSize: 11, color: LC.textMid, fontWeight: 700, marginTop: 6 }}>{it.source}</div>}
              </div>
            )}
            <Img src={it.image} />

            {it.kind === 'tf' ? (
              <div {...swipeHandlers} style={{
                background: LC.surface, border: `2px solid ${res ? (res.ok ? '#34C759' : '#FF3B30') : dx > 30 ? '#34C759' : dx < -30 ? '#FF3B30' : LC.border}`,
                borderRadius: 22, padding: '20px 18px', boxShadow: LC.shadow, touchAction: 'pan-y',
                transform: `translateX(${dx * 0.5}px) rotate(${dx / 30}deg)`, transition: dx ? 'none' : 'transform .2s',
              }}>
                {it.q && <Html cls="ls-question-text" html={it.q} style={{ fontWeight: 700, color: LC.textMid, marginBottom: 10, lineHeight: 1.6 }} />}
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ minWidth: 26, height: 26, borderRadius: '50%', background: 'rgba(26,176,245,0.18)', color: '#1AB0F5', fontSize: 12, fontWeight:700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{it.letter.toUpperCase()}</span>
                  <Html cls="ls-tf-text" html={it.text} style={{ color: LC.text, fontWeight: 700, lineHeight: 1.7 }} />
                </div>
                {!res && <div style={{ textAlign: 'center', fontSize: 11, color: LC.textMid, fontWeight: 700, marginTop: 14 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Ic n="left" s={13} />Vuốt trái = Sai · Vuốt phải = Đúng<Ic n="right" s={13} /></span></div>}
              </div>
            ) : (
              <div style={{ background: LC.surface, border: `1px solid ${LC.border}`, borderRadius: 24, padding: '16px 17px', boxShadow: LC.shadow, marginBottom: 12 }}>
                <Html cls="ls-question-text" html={it.q} style={{ fontWeight: 700, color: LC.text, lineHeight: 1.75 }} />
              </div>
            )}

            {it.kind === 'tf' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                {[[true, 'Đúng', '#34C759', 'check'], [false, 'Sai', '#FF3B30', 'x']].map(([v, label, col, ico]) => {
                  const isPick = picked === v, isAns = res && it.answer === v;
                  return (
                    <button key={label} onClick={() => answerTf(v)} style={{
                      padding: '18px 0', borderRadius: 22, fontSize: 17, fontWeight:700, cursor: res ? 'default' : 'pointer', fontFamily: "'Nunito',sans-serif",
                      border: `2px solid ${isAns ? '#34C759' : res && isPick ? '#FF3B30' : col + '66'}`,
                      background: isAns ? 'rgba(52,199,89,0.2)' : res && isPick ? 'rgba(255,59,48,0.16)' : col + '14', color: col, opacity: res && !isAns && !isPick ? 0.45 : 1,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}><Ic n={ico} s={20} />{label}</button>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {it.options.map((opt, i) => {
                  const s = sty[optState(i)];
                  if (hidden.includes(i) && !res) return null;
                  return (
                    <button key={i} onClick={() => onOption(i)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 20, textAlign: 'left', cursor: res ? 'default' : 'pointer',
                      border: `1px solid ${s.bd}`, background: s.bg, color: s.fg, fontSize: 15, fontWeight: 700, fontFamily: "'Nunito',sans-serif",
                      opacity: optState(i) === 'dim' ? 0.55 : 1, transition: 'all .15s',
                    }}>
                      <span style={{ width: 30, height: 30, borderRadius: it.kind === 'mc' ? '50%' : 9, flexShrink: 0, background: 'rgba(26,176,245,0.16)', color: '#1AB0F5', fontSize: 12, fontWeight:700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{LETTERS[i]}</span>
                      <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: opt }} />
                    </button>
                  );
                })}
                {it.kind === 'ms' && !res && (
                  <button onClick={checkMs} disabled={!(picked || []).length} style={{ ...bigBtn(), marginTop: 6, opacity: (picked || []).length ? 1 : 0.5 }}>Kiểm tra</button>
                )}
              </div>
            )}

            {res && (
              <div style={{ marginTop: 16, padding: '13px 15px', borderRadius: 20, animation: 'fs-pop .25s ease both', background: res.ok ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.08)', border: `1px solid ${res.ok ? 'rgba(52,199,89,0.4)' : 'rgba(255,59,48,0.35)'}` }}>
                <div style={{ fontSize: 14, fontWeight:700, color: res.ok ? '#34C759' : '#FF3B30' }}>{msg}</div>
                {!res.ok && it.kind === 'tf' && <div style={{ fontSize: 13, fontWeight:600, color: LC.text, marginTop: 6 }}>Đáp án: {it.answer ? 'ĐÚNG' : 'SAI'}</div>}
                {it.explanation && <div style={{ display: 'flex', gap: 7, marginTop: 6, fontSize: 13, color: LC.text, lineHeight: 1.65 }}><Ic n="bulb" s={16} c="#F59E0B" style={{ marginTop: 3 }} /><Html html={it.explanation} style={{ flex: 1 }} /></div>}
                {!autoAdvance && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <button onClick={next} style={{ ...bigBtn(), display: 'inline-flex', alignItems: 'center', gap: 6 }}>{pos >= queue.length - 1 ? 'Xem kết quả' : 'Tiếp tục'}<Ic n="right" s={16} /></button>
                  </div>
                )}
              </div>
            )}
          </div>

          {burst > 0 && (
            <div key={burst} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200, overflow: 'hidden' }}>
              {Array.from({ length: 16 }).map((_, k) => (
                <span key={k} style={{ position: 'absolute', left: `${8 + (k * 83) % 84}%`, top: '55%', animation: `fs-burst ${1.1 + (k % 4) * 0.2}s ease-out ${(k % 5) * 0.05}s both`, '--dx': `${((k * 37) % 120) - 60}px` }}><Ic n={BURST[k % BURST.length][0]} s={22 + (k % 3) * 6} c={BURST[k % BURST.length][1]} /></span>
              ))}
            </div>
          )}
          {lvlUp > 0 && (
            <div style={{ position: 'fixed', top: 84, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 210 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 999, background: '#FF9500', color: '#fff', fontWeight:800, fontSize: 15, boxShadow: '0 6px 20px rgba(255,149,0,0.45)', animation: 'fs-pop .35s ease both' }}><Ic n="up" s={18} c="#fff" />Lên cấp {lvlUp}!</div>
            </div>
          )}
        </div>
      );
    }

    function ResultScreen({ LC, result, record, mode, onRetry, onRetryMissed, onExit }) {
      const { total, firstOk, missed, maxCombo, xp, seconds, avgSec = 0, level = 1 } = result;
      const pct = total > 0 ? Math.round((firstOk * 100) / total) : 0;
      const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
      const title = pct >= 90 ? 'Xuất sắc!' : pct >= 60 ? 'Khá lắm!' : 'Cố lên, sắp được rồi!';
      /* huy hiệu nhận được ở lượt này */
      const badges = [
        missed.length === 0 && total >= 3 && ['crown', 'Hoàn hảo', 'Không sai câu nào', '#F59E0B'],
        maxCombo >= 5 && ['flame', 'Chuỗi lửa', `Combo ${maxCombo}`, '#F97316'],
        avgSec > 0 && avgSec < 6 && total >= 5 && ['zap', 'Tia chớp', `TB ${avgSec.toFixed(1)}s/câu`, '#1AB0F5'],
        level >= 3 && ['medal', 'Cao thủ', `Đạt cấp ${level}`, '#8B5CF6'],
      ].filter(Boolean);
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 18px 100px', textAlign: 'center', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 8, animation: 'fs-pop .5s ease both' }}>{[0, 1, 2].map(i => <Ic key={i} n="star" s={46} c="#FBBF24" style={{ opacity: i < stars ? 1 : 0.22, transform: i === 1 ? 'translateY(-8px) scale(1.12)' : 'none' }} />)}</div>
          <div style={{ fontSize: 21, fontWeight:700, color: LC.text, marginTop: 10 }}>{title}</div>
          <div style={{ fontSize: 14, color: LC.textMid, marginTop: 4 }}>Đúng ngay lần đầu {firstOk}/{total} ({pct}%)</div>
          {record && record.isNew && <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 999, background: 'rgba(251,191,36,0.2)', color: '#D99A00', fontSize: 12.5, fontWeight:700 }}><Ic n="trophy" s={14} />Kỷ lục mới{record.prev ? ` (trước đó ${record.prev.xp} XP)` : ''}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[['flame', '#F97316', 'Combo cao nhất', maxCombo], ['star', '#FF9500', `Điểm XP · Lv ${level}`, xp], ...(mode === 'express' ? [['clock', '#1AB0F5', 'Thời gian', `${Math.floor(seconds / 60)}p${String(seconds % 60).padStart(2, '0')}`]] : [])].map(([ic, col, lb, v]) => (
              <div key={lb} style={{ padding: '10px 16px', borderRadius: 20, background: LC.surface, border: `1px solid ${LC.border}`, minWidth: 92 }}>
                <div><Ic n={ic} s={20} c={col} /></div><div style={{ fontSize: 17, fontWeight:700, color: LC.text }}>{v}</div><div style={{ fontSize: 10.5, color: LC.textMid, fontWeight: 700 }}>{lb}</div>
              </div>
            ))}
          </div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
              {badges.map(([ic, name, sub, col]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px 8px 10px', borderRadius: 18, background: LC.surface, border: `1px solid ${col}66`, animation: 'fs-pop .4s ease both', textAlign: 'left' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: col, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic n={ic} s={18} c="#fff" /></span>
                  <span><div style={{ fontSize: 13, fontWeight:800, color: LC.text }}>{name}</div><div style={{ fontSize: 11, color: LC.textMid, fontWeight: 600 }}>{sub}</div></span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap', justifyContent: 'center' }}>
            {missed.length > 0 && <button style={bigBtn()} onClick={onRetryMissed}>Ôn {missed.length} câu sai</button>}
            <button style={missed.length ? ghostBtn(LC) : bigBtn()} onClick={onRetry}>Chơi lại</button>
            <button style={ghostBtn(LC)} onClick={onExit}>Về trang chủ</button>
          </div>
          {missed.length > 0 && (
            <div style={{ width: '100%', maxWidth: 480, marginTop: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight:700, color: LC.text, marginBottom: 8 }}>Cần ôn lại ({missed.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {missed.map(it => (
                  <div key={it.id} style={{ padding: '11px 13px', borderRadius: 18, background: LC.surface, border: `1px solid ${LC.border}` }}>
                    <Html html={it.kind === 'tf' ? `<b>${it.letter.toUpperCase()}.</b> ${it.text}` : it.q} style={{ fontSize: 13, color: LC.text, lineHeight: 1.6, fontWeight: 600 }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 5, fontSize: 12.5, color: '#34C759', fontWeight:600 }}><Ic n="check" s={15} style={{ marginTop: 2 }} /><Html html={answerHtml(it)} style={{ flex: 1 }} /></div>
                    {it.explanation && <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 12, color: LC.textMid, lineHeight: 1.55 }}><Ic n="bulb" s={14} c="#F59E0B" style={{ marginTop: 2 }} /><Html html={it.explanation} style={{ flex: 1 }} /></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    /* ───────────── CHỌN SỐ LƯỢNG / LOẠI CÂU (dùng cho cả 2 chế độ) ───────────── */
    function Chips({ options, value, onChange, LC }) {
      return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {options.map(([v, label]) => (
            <button key={String(v)} onClick={() => onChange(v)} style={{
              padding: '8px 15px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight:600, fontFamily: "'Nunito',sans-serif",
              border: `1px solid ${value === v ? '#1AB0F5' : LC.border}`, background: value === v ? 'rgba(26,176,245,0.2)' : LC.surface, color: value === v ? (LC.dark ? '#7FD6FF' : '#1AB0F5') : (LC.dark ? LC.text : LC.textMid),
            }}>{label}</button>
          ))}
        </div>
      );
    }
    const Label = ({ LC, children }) => <div style={{ fontSize: 12, fontWeight:700, color: LC.text, margin: '16px 0 8px' }}>{children}</div>;

    function SetupScreen({ lesson, items, mode, hasWrong, best, LC, onStart }) {
      const nMc = items.filter(i => i.kind !== 'tf').length, nTf = items.filter(i => i.kind === 'tf').length;
      const [kind, setKind] = useState('all');
      const [count, setCount] = useState(mode === 'express' ? 10 : 0);
      const [timer, setTimer] = useState(mode === 'express' ? 15 : 0);
      const [readFirst, setReadFirst] = useState(true);
      const [wrongFirst, setWrongFirst] = useState(true);
      const express = mode === 'express';
      return (
        <div style={{ flex: 1, padding: '22px 18px 100px', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ animation: 'fs-float 2.4s ease-in-out infinite', display: 'inline-flex', width: 78, height: 78, borderRadius: 26, alignItems: 'center', justifyContent: 'center', background: express ? '#FF9500' : '#1AB0F5', boxShadow: express ? '0 10px 26px rgba(255,149,0,0.35)' : '0 10px 26px rgba(26,176,245,0.35)' }}><Ic n={express ? 'zap' : 'gamepad'} s={40} c="#fff" fill={express} /></div>
            <div style={{ fontSize: 21, fontWeight:700, color: LC.text, fontFamily: "'Baloo 2',cursive" }}>{express ? 'Học cấp tốc' : 'Học vui'}</div>
            <div style={{ fontSize: 12.5, color: LC.textMid, marginTop: 4, lineHeight: 1.6 }}>
              {express ? 'Lướt đáp án, luyện bấm giờ, câu sai lặp lại tới khi nhớ. Hợp để ôn gấp trước giờ thi!' : 'Mỗi câu một màn, có combo, điểm XP và pháo hoa. Câu Đúng/Sai tách từng ý, vuốt để trả lời!'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
              {[['half', '50:50 ×2'], ['shield', 'Khiên combo'], ['star', 'Câu vàng x2 XP'], ['up', 'Lên cấp']].concat(express ? [['timer', '+10 giây']] : []).map(([ic, t]) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, background: LC.surface, border: `1px solid ${LC.border}`, color: LC.text, fontSize: 11.5, fontWeight: 700 }}><Ic n={ic} s={13} c="#1AB0F5" />{t}</span>
              ))}
            </div>
            {best && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '5px 13px', borderRadius: 999, background: 'rgba(251,191,36,0.16)', color: '#D99A00', fontSize: 12, fontWeight:700 }}><Ic n="trophy" s={14} />Kỷ lục: {best.xp} XP · {best.pct}% đúng</div>}
            <div style={{ fontSize: 12, color: LC.textMid, marginTop: 8, fontWeight: 700 }}>{lesson.title} · {nMc} câu trắc nghiệm · {nTf} ý Đúng/Sai</div>
          </div>

          {nMc > 0 && nTf > 0 && (<><Label LC={LC}>Loại câu</Label>
            <Chips LC={LC} value={kind} onChange={setKind} options={[['all', 'Tất cả'], ['mc', 'Chỉ trắc nghiệm'], ['tf', 'Chỉ Đúng/Sai']]} /></>)}

          <Label LC={LC}>Số câu</Label>
          <Chips LC={LC} value={count} onChange={setCount} options={express ? [[10, '10 câu'], [20, '20 câu'], [0, 'Tất cả']] : [[0, 'Tất cả'], [10, '10 câu'], [20, '20 câu']]} />

          {express && (<>
            <Label LC={LC}>Thời gian mỗi câu</Label>
            <Chips LC={LC} value={timer} onChange={setTimer} options={[[10, '10 giây'], [15, '15 giây'], [30, '30 giây'], [0, 'Không giới hạn']]} />
            <Label LC={LC}>Tuỳ chọn</Label>
            <Chips LC={LC} value={readFirst} onChange={setReadFirst} options={[[true, 'Lướt đáp án trước'], [false, 'Vào luyện ngay']]} />
            {hasWrong && <div style={{ marginTop: 8 }}><Chips LC={LC} value={wrongFirst} onChange={setWrongFirst} options={[[true, 'Ưu tiên câu từng sai'], [false, 'Ngẫu nhiên']]} /></div>}
          </>)}

          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button style={bigBtn({ padding: '15px 38px', fontSize: 15 })} onClick={() => onStart({ kind, count, timer, readFirst, wrongFirst: hasWrong && wrongFirst })}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{express ? 'Bắt đầu cấp tốc' : 'Bắt đầu chơi'}<Ic n={express ? 'zap' : 'rocket'} s={17} c="#fff" fill={false} /></span>
            </button>
          </div>
        </div>
      );
    }

    /* ───────────── LƯỚT ĐÁP ÁN (cấp tốc, pha 1) ───────────── */
    function ReadPhase({ items, LC, onDone }) {
      const [i, setI] = useState(0);
      const it = items[i];
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px 0' }}>
            <div style={{ fontSize: 11.5, fontWeight:600, color: LC.textMid, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}><Ic n="book" s={14} />Lướt đáp án · {i + 1}/{items.length}</div>
            <div style={{ height: 6, borderRadius: 99, background: LC.border, overflow: 'hidden' }}><div style={{ height: '100%', width: `${((i + 1) / items.length) * 100}%`, background: '#34C759', transition: 'width .25s' }} /></div>
          </div>
          <div key={i} style={{ flex: 1, padding: '16px 16px 120px', overflowY: 'auto', animation: 'fs-pop .25s ease both' }}>
            {it.kind === 'tf' && it.passage && <Html cls="ls-passage-text" html={it.passage} style={{ fontStyle: 'italic', color: LC.textMid, lineHeight: 1.7, marginBottom: 10, padding: '11px 13px', borderRadius: 18, background: LC.surface, border: `1px solid ${LC.border}` }} />}
            <Img src={it.image} />
            <div style={{ background: LC.surface, border: `1px solid ${LC.border}`, borderRadius: 24, padding: '16px 17px', boxShadow: LC.shadow }}>
              <Html cls="ls-question-text" html={it.kind === 'tf' ? `<b>${it.letter.toUpperCase()}.</b> ${it.text}` : it.q} style={{ fontWeight: 700, color: LC.text, lineHeight: 1.7 }} />
            </div>
            <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 20, background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.4)' }}>
              <div style={{ fontSize: 11, fontWeight:700, color: '#34C759', letterSpacing: 1 }}>ĐÁP ÁN</div>
              <Html html={answerHtml(it)} style={{ fontSize: it.kind === 'tf' ? 20 : 15, fontWeight:700, color: '#34C759', marginTop: 4, lineHeight: 1.6 }} />
            </div>
            {it.explanation && <div style={{ display: 'flex', gap: 7, marginTop: 10, fontSize: 13, color: LC.text, lineHeight: 1.65 }}><Ic n="bulb" s={16} c="#F59E0B" style={{ marginTop: 3 }} /><Html html={it.explanation} style={{ flex: 1 }} /></div>}
          </div>
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(14px + env(safe-area-inset-bottom,0px))', display: 'flex', gap: 10, justifyContent: 'center', background: LC.dark ? '#1E2229' : LC.surface, backdropFilter: 'blur(16px)', borderTop: `1px solid ${LC.border}` }}>
            <button style={ghostBtn(LC, { display: 'inline-flex', alignItems: 'center', gap: 6, opacity: i === 0 ? 0.5 : 1 })} disabled={i === 0} onClick={() => setI(i - 1)}><Ic n="left" s={16} />Trước</button>
            {i < items.length - 1
              ? <button style={bigBtn({ display: 'inline-flex', alignItems: 'center', gap: 6 })} onClick={() => setI(i + 1)}>Tiếp<Ic n="right" s={16} c="#fff" /></button>
              : <button style={bigBtn({ display: 'inline-flex', alignItems: 'center', gap: 6 })} onClick={onDone}>Vào luyện nhanh<Ic n="zap" s={16} c="#fff" fill={false} /></button>}
          </div>
        </div>
      );
    }

    /* ───────────── ROOT ───────────── */
    function FunStudy({ lesson, mode, dark, student, onBack }) {
      const LC = useMemo(() => makePalette(dark), [dark]);
      const express = mode === 'express';
      const allItems = useMemo(() => buildItems(lesson), [lesson]);
      const sid = student && student.id;
      const wrongRef = useRef(loadWrong(sid, lesson.id));
      const [phase, setPhase] = useState('setup'); // setup | read | play | result
      const [cfg, setCfg] = useState(null);
      const [session, setSession] = useState([]);
      const [runKey, setRunKey] = useState(0);
      const [result, setResult] = useState(null);
      const [record, setRecord] = useState(null);
      const best = useMemo(() => loadBest(sid, lesson.id, mode), [sid, lesson.id, mode, phase]);

      function onWrong(id, isWrong) {
        if (isWrong) wrongRef.current.add(id); else wrongRef.current.delete(id);
        saveWrong(sid, lesson.id, wrongRef.current);
      }

      function start(c) {
        let pool = allItems.filter(i => c.kind === 'all' || (c.kind === 'tf' ? i.kind === 'tf' : i.kind !== 'tf'));
        let ordered;
        if (c.wrongFirst) {
          const w = shuffle(pool.filter(i => wrongRef.current.has(i.id))), r = shuffle(pool.filter(i => !wrongRef.current.has(i.id)));
          ordered = [...w, ...r];
        } else ordered = shuffle(pool);
        if (c.count > 0) ordered = ordered.slice(0, c.count);
        setCfg(c); setSession(ordered); setRunKey(k => k + 1);
        setPhase(express && c.readFirst ? 'read' : 'play');
      }

      function playAgain(items) { setSession(items); setRunKey(k => k + 1); setResult(null); setPhase('play'); }

      const title = express ? 'Học cấp tốc' : 'Học vui';
      function finish(r) {
        const pct = r.total > 0 ? Math.round((r.firstOk * 100) / r.total) : 0;
        const prev = loadBest(sid, lesson.id, mode);
        const better = r.total >= 3 && (!prev || r.xp > prev.xp);
        if (better) saveBest(sid, lesson.id, mode, { xp: r.xp, pct, combo: r.maxCombo, at: Date.now() });
        setRecord({ isNew: better && !!prev, prev });
        setResult(r); setPhase('result');
      }
      const goBack = () => {
        if (phase === 'play' && !window.confirm('Thoát giữa chừng? Tiến độ lượt này sẽ không được lưu.')) return;
        onBack();
      };

      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', colorScheme: dark ? 'dark' : 'light' }}>
          <style>{`
            @keyframes fs-pop{0%{opacity:0;transform:scale(.94) translateY(8px)}100%{opacity:1;transform:scale(1) translateY(0)}}
            @keyframes fs-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
            @keyframes fs-burst{0%{opacity:1;transform:translate(0,0) scale(.6)}100%{opacity:0;transform:translate(var(--dx),-55vh) scale(1.3) rotate(40deg)}}
          `}</style>
          <TopBar title={title} onBack={goBack} LC={LC} />
          {allItems.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: LC.textMid, fontSize: 14, fontWeight: 700 }}>
              Bài này chưa có câu trắc nghiệm hoặc Đúng/Sai để học theo cách này. Hãy thử làm bài chuẩn nhé!
            </div>
          ) : phase === 'setup' ? (
            <SetupScreen lesson={lesson} items={allItems} mode={mode} hasWrong={allItems.some(i => wrongRef.current.has(i.id))} best={best} LC={LC} onStart={start} />
          ) : phase === 'read' ? (
            <ReadPhase items={session} LC={LC} onDone={() => setPhase('play')} />
          ) : phase === 'play' ? (
            <QuizRunner key={runKey} items={session} LC={LC} mode={mode}
              timePerQ={express ? cfg.timer : 0} maxRetry={express ? 3 : 1}
              onWrong={onWrong} onFinish={finish} />
          ) : (
            <ResultScreen LC={LC} result={result} record={record} mode={mode}
              onRetry={() => setPhase('setup')}
              onRetryMissed={() => playAgain(shuffle(result.missed))}
              onExit={onBack} />
          )}
        </div>
      );
    }

    window.FunStudy = FunStudy;
  } catch (e) {
    console.error('[fun-study] INIT ERROR:', e);
  }
})();
