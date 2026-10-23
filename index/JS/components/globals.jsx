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
    window.LETTERS = LETTERS;
    window.playSound = playSound;
    window.playFanfare = playFanfare;
    window.playSad = playSad;

  } catch (e) {
    console.error('[globals] INIT ERROR:', e);
  }
})();