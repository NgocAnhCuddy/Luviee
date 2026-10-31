import React from 'react';

/* ══════════════════════════════════════════════════════════════════
   GLOBALS.JSX  ·  Learnsy · Global Helpers & UI Primitives
   Exports (window globals):
     window.C / window.CL / window.CD   — Color palettes
     window._shuf                        — Array shuffle
     window.applyShuffleToLesson         — Shuffle questions/answers
     window.Flower / Heart / Star / Sparkle — SVG icons
     window.playSound / playFanfare / playSad — Tone.js sounds
     window.LETTERS                      — ['A','B','C','D','E','F']

   Phụ thuộc:
     - React (window.React)
     - Tone.js (window.Tone) — từ CDN
══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  try {
    /* ══ SHUFFLE HELPERS ══ */
    function _shuf(a) {
      const r = a.slice();
      for (let i = r.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [r[i], r[j]] = [r[j], r[i]];
      }
      return r;
    }

    function applyShuffleToLesson(lesson, shuffleQ, shuffleA) {
      let qs = lesson.questions.slice();
      if (shuffleA) {
        qs = qs.map(q => {
          if (q.type === 'multiple') {
            const cv = q.options[q.correct];
            const o = _shuf(q.options.slice());
            return { ...q, options: o, correct: o.indexOf(cv) };
          }
          if (q.type === 'multi_select') {
            const cvs = (q.correct || []).map(i => q.options[i]);
            const o = _shuf(q.options.slice());
            return { ...q, options: o, correct: cvs.map(v => o.indexOf(v)) };
          }
          if (q.type === 'true_false') {
            return { ...q, items: _shuf(q.items.slice()) };
          }
          return q;
        });
      }
      if (shuffleQ) qs = _shuf(qs);      return { ...lesson, questions: qs };
    }

    /* ══ COLOR PALETTES ══ */
    const CL = {
      bg: '#F2FAFF', bg2: '#F0FAFE', surface: '#FFFFFF',
      rose: '#6FCFFB', rose2: '#92DBFC', roseL: '#E5F6FE', rosePale: '#F0FAFF',
      lav: '#1AB0F5', lav2: '#1AB0F5', lavL: '#E7F1FE', lavPale: '#F5F9FF',
      mint: '#34C759', mint2: '#6EE7B7', mintL: '#ECFDF5',
      peach: '#F97316', peachL: '#FFF7ED', peach2: '#FED7AA',
      text: '#18313D', text2: '#30586B', text3: '#7091A0', text4: '#A0BBC8',
      border: '#D5EBF5', border2: '#DDEBFE',
      grad: '#1AB0F5',
      gradSoft: '#DEF4FE',
    };

    const CD = {
      bg: '#0A1418', bg2: '#0E1A20', surface: '#182F3A',
      rose: '#6FCFFB', rose2: '#92DBFC', roseL: '#122B37', rosePale: '#0E2129',
      lav: '#1AB0F5', lav2: '#AACEFD', lavL: '#14253C', lavPale: '#101E31',
      mint: '#34C759', mint2: '#6EE7B7', mintL: '#0A2618',
      peach: '#FB923C', peachL: '#2A1208', peach2: '#7A3810',
      text: '#E4F0F5', text2: '#A8C6D4', text3: '#708D9A', text4: '#405660',
      border: '#1F495C', border2: '#183F72',
      grad: '#1AB0F5',
      gradSoft: '#122B37',
    };

    let C = CL;

    /* ══ SVG ICONS ══ */
    const Flower = ({ s = 16, c = '#B9E8FD', style = {} }) => (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, ...style }}>
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <ellipse key={i} cx="12" cy="6" rx="3" ry="5.5" fill={c} opacity={i % 2 === 0 ? 0.9 : 0.7}
            transform={`rotate(${deg} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="3.5" fill="#FFF5CC" />
      </svg>
    );

    const Heart = ({ s = 14, c = '#8FD8FB', style = {} }) => (
      <svg width={s} height={s} viewBox="0 0 20 20" fill={c} style={{ flexShrink: 0, ...style }}>
        <path d="M10 17S2 11.5 2 6.5a4 4 0 0 1 8-1 4 4 0 0 1 8 1C18 11.5 10 17 10 17z" />
      </svg>
    );

    const Star = ({ s = 13, c = '#FCD34D', style = {} }) => (
      <svg width={s} height={s} viewBox="0 0 20 20" fill={c} style={{ flexShrink: 0, ...style }}>
        <path d="M10 1.5 L12.47 7.35 L18.78 7.64 L14.09 11.89 L15.85 18.09 L10 14.55 L4.15 18.09 L5.91 11.89 L1.22 7.64 L7.53 7.35 Z" />      </svg>
    );

    const Sparkle = ({ s = 14, c = '#1AB0F5', style = {} }) => (
      <svg width={s} height={s} viewBox="0 0 20 20" fill={c} style={{ flexShrink: 0, ...style }}>
        <path d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z" />
      </svg>
    );

    const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

    /* ══ SOUND HELPERS (Tone.js) ══ */
    const _withTone = (fn) => {
      try {
        if (typeof window.Tone === 'undefined') return;
        window.Tone.start().then(fn).catch(() => { });
      } catch (e) { }
    };

    const playSound = () => {
      _withTone(() => {
        try {
          const synth = new window.Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: .005, decay: .08, sustain: .0, release: .1 },
            volume: -14
          }).toDestination();
          synth.triggerAttackRelease('A4', .09, window.Tone.now());
          setTimeout(() => synth.dispose(), 400);
        } catch (e) { }
      });
    };

    const playFanfare = () => {
      _withTone(() => {
        try {
          const synth = new window.Tone.PolySynth(window.Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: .01, decay: .2, sustain: .1, release: .28 },
            volume: -11
          }).toDestination();
          const now = window.Tone.now();
          [
            [['C5', 'E5'], 0],
            [['E5', 'G5'], .12],
            [['G5', 'C6'], .24],
            [['C5', 'E5', 'G5', 'C6'], .38]
          ].forEach(([ns, t]) => synth.triggerAttackRelease(ns, .28, now + t));
          setTimeout(() => synth.dispose(), 1800);
        } catch (e) { }      });
    };

    const playSad = () => {
      _withTone(() => {
        try {
          const synth = new window.Tone.PolySynth(window.Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: { attack: .02, decay: .3, sustain: .06, release: .3 },
            volume: -13
          }).toDestination();
          const now = window.Tone.now();
          synth.triggerAttackRelease('G4', .32, now);
          synth.triggerAttackRelease('E4', .32, now + .22);
          synth.triggerAttackRelease('D4', .32, now + .46);
          synth.triggerAttackRelease('C4', .45, now + .72);
          setTimeout(() => synth.dispose(), 2000);
        } catch (e) { }
      });
    };

    /* ══ EXPORT GLOBALS ══ */
    window.C = C;
    window.CL = CL;
    window.CD = CD;
    window._shuf = _shuf;
    window.applyShuffleToLesson = applyShuffleToLesson;
    window.Flower = Flower;
    window.Heart = Heart;
    window.Star = Star;
    window.Sparkle = Sparkle;

    /* ── SvgIcon: bộ icon SVG dùng chung (thay emoji) ── */
    const _SVG = {
      lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2M16 7l3 3"/>',
      book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
      books: '<path d="M4 19.5V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-3"/>',
      search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
      clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
      history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2"/>',
      sortaz: '<path d="M3 6h7M3 12h5M3 18h3M16 4v16M16 20l-3-3M16 20l3-3"/>',
      list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
      folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
      inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
      palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4a4 4 0 0 0 4-4C21.4 6 17.2 2 12 2z"/>',
      moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
      sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 3v4M17 5h4"/>',
      flower: '<circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 1 1 3-3M15 12a3 3 0 1 1 3 3M12 15a3 3 0 1 1-3 3M9 12a3 3 0 1 1-3-3"/>',
      party: '<path d="M5.8 11.3L2 22l10.7-3.79M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10M22 13l-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17M11 2l.33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/>',
      zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
      music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
      check: '<path d="M20 6L9 17l-5-5"/>',
      circle: '<circle cx="12" cy="12" r="9"/>',
      checksq: '<rect x="3" y="3" width="18" height="18" rx="3"/>',
      checksqon: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
      file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h6"/>',
      heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    };
    const _SVG_FILL = new Set(['zap', 'heart']);
    function SvgIcon({ name, size = 16, color = 'currentColor', style }) {
      return React.createElement('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: _SVG_FILL.has(name) ? color : 'none', stroke: color,
        strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
        style: { flexShrink: 0, display: 'inline-block', verticalAlign: '-0.2em', ...style },
        dangerouslySetInnerHTML: { __html: _SVG[name] || '' },
      });
    }
    window.SvgIcon = SvgIcon;
    window.LETTERS = LETTERS;
    window.playSound = playSound;
    window.playFanfare = playFanfare;
    window.playSad = playSad;

  } catch (e) {
    console.error('[globals] INIT ERROR:', e);
  }
})();