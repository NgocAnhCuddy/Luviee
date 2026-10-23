import React from 'react';
import { NotesScreen } from './notes.jsx';

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD.JS  ·  Learnsy · Student Dashboard v2 🌸
   Theme: Bánh Bèo Edition — kawaii pastel, bubbly & adorable ✨
   ~90kB · Thêm vào index/JS/components/dashboard.js
══════════════════════════════════════════════════════════════════ */

/* ══ LITE MODE — CSS override để tắt hiệu ứng nặng ══ */
function injectLiteCSS(enable){
  const ID='bb-lite-css';
  if(!enable){ const el=document.getElementById(ID); if(el)el.remove(); return; }
  if(document.getElementById(ID))return;
  const s=document.createElement('style');
  s.id=ID;
  s.textContent=`
    /* Tắt toàn bộ animation */
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.08s !important;
    }
    /* Tắt backdrop-filter nặng */
    [style*="backdrop-filter"], [style*="backdropFilter"] {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    /* Tắt box-shadow phức tạp */
    .bb-card-tap { box-shadow: none !important; }
    .bb-card-tap:hover { transform: none !important; }
    .bb-card-tap:active { transform: scale(0.97) !important; }
    /* Tắt shimmer, heartbeat, float, wiggle */
    .bb-btn-tap:active { transform: scale(0.94) !important; }
    @media(hover:hover){ .bb-btn-tap:hover { filter: none !important; } }
    /* Tắt blur trên nav/topbar */
    nav[style] { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
  `;
  document.head.appendChild(s);
}

/* ══ DEVICE PERFORMANCE DETECTOR ══ */
async function detectDevicePerformance(){
  const result={ score:100, reason:[] };

  /* 1. RAM — navigator.deviceMemory (Chrome/Android) */
  const ram=navigator.deviceMemory;
  if(ram!=null){
    if(ram<=1){ result.score-=40; result.reason.push(`RAM thấp (${ram}GB)`); }
    else if(ram<=2){ result.score-=20; result.reason.push(`RAM hạn chế (${ram}GB)`); }
  }

  /* 2. CPU cores */
  const cores=navigator.hardwareConcurrency;
  if(cores!=null){
    if(cores<=2){ result.score-=25; result.reason.push(`CPU yếu (${cores} core)`); }
    else if(cores<=4){ result.score-=10; }
  }

  /* 3. Network */
  const conn=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
  if(conn){
    if(conn.effectiveType==='2g'||conn.effectiveType==='slow-2g'){ result.score-=20; result.reason.push('Mạng chậm (2G)'); }
    else if(conn.effectiveType==='3g'){ result.score-=8; }
    if(conn.saveData){ result.score-=15; result.reason.push('Chế độ tiết kiệm dữ liệu'); }
  }

  /* 4. FPS test — đo 40 frame, trigger liteMode nếu fps 30-40 */
  await new Promise(res=>{
    let frames=0, start=performance.now(), last=start;
    function tick(now){
      frames++;
      last=now;
      if(frames<40) requestAnimationFrame(tick);
      else res(last-start);
    }
    requestAnimationFrame(tick);
  }).then(elapsed=>{
    const fps=Math.round(40/(elapsed/1000));
    result.fps=fps;
    if(fps<30){       result.score-=35; result.reason.push(`FPS thấp (~${fps}fps)`); }
    else if(fps<=40){ result.score-=18; result.reason.push(`FPS trung bình (~${fps}fps)`); }
    else if(fps<55){  result.score-=6; }
  }).catch(()=>{});

  /* Kết luận — isLow cũng bắt luôn fps 30-40 */
  result.isLow = result.score < 65 || (result.fps!=null && result.fps<=40);
  result.label = result.isLow
    ? 'Máy yếu — nên bật Lite Mode'
    : result.score < 80
      ? 'Máy trung bình — có thể bật Lite Mode'
      : 'Máy mạnh — không cần Lite Mode';
  return result;
}

/* ══ runLoginPerfCheck — gọi ngay khi user nhấn đăng nhập ══
   index.html dùng: await window.bbRunLoginPerfCheck()
   Trả về { liteMode: bool, fps: number, reason: string[] }
   Tự apply liteMode + lưu localStorage nếu máy yếu.         */
async function runLoginPerfCheck(){
  /* Không chạy lại nếu user đã tự set thủ công trong session này */
  if(sessionStorage.getItem('bb-perf-checked')==='1'){
    const stored=localStorage.getItem('bb-lite-mode')==='1';
    return{ liteMode:stored, fps:null, reason:[] };
  }
  const res=await detectDevicePerformance();
  sessionStorage.setItem('bb-perf-checked','1');
  if(res.isLow){
    localStorage.setItem('bb-lite-mode','1');
    /* Inject CSS ngay lập tức — trước khi React mount Dashboard */
    if(typeof injectLiteCSS==='function') injectLiteCSS(true);
  }
  return{ liteMode:res.isLow, fps:res.fps, reason:res.reason, score:res.score };
}
window.bbRunLoginPerfCheck=runLoginPerfCheck;

(function(){
const {useState,useEffect,useRef,useCallback,useMemo}=React;

/* ══ INJECT GLOBAL STYLES ══ */
(function injectGlobalCSS(){
  if(document.getElementById('bb-global-css'))return;
  const s=document.createElement('style');
  s.id='bb-global-css';
  s.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@400;500;600;700;800&display=swap');

    @keyframes bb-spin { to { transform: rotate(360deg); } }
    @keyframes bb-bounce {
      0%,100% { transform: translateY(0) scale(1); }
      40% { transform: translateY(-8px) scale(1.06); }
      60% { transform: translateY(-4px) scale(1.02); }
    }
    @keyframes bb-float {
      0%,100% { transform: translateY(0px) rotate(-2deg); }
      50% { transform: translateY(-7px) rotate(2deg); }
    }
    @keyframes bb-wiggle {
      0%,100% { transform: rotate(0deg); }
      20% { transform: rotate(-9deg); }
      40% { transform: rotate(9deg); }
      60% { transform: rotate(-5deg); }
      80% { transform: rotate(5deg); }
    }
    @keyframes bb-pop {
      0% { transform: scale(0.7); opacity:0; }
      60% { transform: scale(1.12); opacity:1; }
      100% { transform: scale(1); opacity:1; }
    }
    @keyframes bb-fadeUp {
      from { opacity:0; transform: translateY(18px); }
      to   { opacity:1; transform: translateY(0); }
    }
    /* ── Tab swipe transitions (kiểu native app) ── */
    @keyframes bb-slide-in-right {
      from { opacity:0; transform: translate3d(28px,0,0); }
      to   { opacity:1; transform: translate3d(0,0,0); }
    }
    @keyframes bb-slide-in-left {
      from { opacity:0; transform: translate3d(-28px,0,0); }
      to   { opacity:1; transform: translate3d(0,0,0); }
    }
    @keyframes bb-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes bb-heartbeat {
      0%,100% { transform: scale(1); }
      14% { transform: scale(1.2); }
      28% { transform: scale(1); }
      42% { transform: scale(1.14); }
      70% { transform: scale(1); }
    }
    @keyframes bb-sparkle-rotate {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.22); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes bb-confetti-fall {
      0% { transform: translateY(-10px) rotate(0deg); opacity:1; }
      100% { transform: translateY(60px) rotate(360deg); opacity:0; }
    }
    @keyframes bb-scanline {
      0%   { transform: translateY(-120%); opacity:0; }
      15%  { opacity:1; }
      85%  { opacity:1; }
      100% { transform: translateY(420%); opacity:0; }
    }
    @keyframes bb-pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(26,176,245,0.45); }
      70% { box-shadow: 0 0 0 12px rgba(26,176,245,0); }
      100% { box-shadow: 0 0 0 0 rgba(26,176,245,0); }
    }
    @keyframes bb-gradient-move {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes bb-jelly {
      0%,100% { transform: scale(1,1); }
      25% { transform: scale(0.94,1.06); }
      50% { transform: scale(1.06,0.94); }
      75% { transform: scale(0.97,1.03); }
    }
    @keyframes bb-star-twinkle {
      0%,100% { opacity:1; transform:scale(1); }
      50% { opacity:0.35; transform:scale(0.65); }
    }

    /* ── HUD Effects ── */
    @keyframes hud-glitch-1 {
      0%,100% { clip-path:inset(0 0 100% 0); transform:translate(0,0); }
      20%     { clip-path:inset(15% 0 60% 0); transform:translate(-2px,0); }
      40%     { clip-path:inset(50% 0 25% 0); transform:translate(2px,0); }
      60%     { clip-path:inset(75% 0 5%  0); transform:translate(-1px,0); }
      80%     { clip-path:inset(90% 0 0   0); transform:translate(1px,0); }
    }
    @keyframes hud-glitch-2 {
      0%,100% { clip-path:inset(0 0 100% 0); transform:translate(0,0); }
      20%     { clip-path:inset(60% 0 15% 0); transform:translate(2px,0); }
      40%     { clip-path:inset(25% 0 50% 0); transform:translate(-2px,0); }
      60%     { clip-path:inset(5%  0 75% 0); transform:translate(1px,0); }
      80%     { clip-path:inset(0   0 90% 0); transform:translate(-1px,0); }
    }
    @keyframes hud-glitch-run {
      0%  { opacity:1; }
      8%  { opacity:1; }
      9%  { opacity:0; }
      10% { opacity:1; }
      90% { opacity:1; }
      91% { opacity:0; }
      92% { opacity:1; }
      100%{ opacity:1; }
    }
    @keyframes hud-cursor-blink {
      0%,49% { opacity:1; }
      50%,100%{ opacity:0; }
    }
    @keyframes hud-radar-sweep {
      from { stroke-dashoffset: var(--circ); opacity:0.85; }
      to   { stroke-dashoffset: 0;           opacity:0; }
    }
    @keyframes di-pill-in {
      0%   { width:36px; height:36px; border-radius:50%; opacity:0; transform:translateX(-50%) scaleY(0.6); }
      20%  { width:36px; height:36px; border-radius:50%; opacity:1; transform:translateX(-50%) scaleY(1); }
      55%  { width:260px; height:52px; border-radius:26px; opacity:1; transform:translateX(-50%) scaleY(1); }
      100% { width:280px; height:56px; border-radius:28px; opacity:1; transform:translateX(-50%) scaleY(1); }
    }
    @keyframes di-pill-out {
      0%   { width:280px; height:56px; border-radius:28px; opacity:1; transform:translateX(-50%) scaleY(1); }
      40%  { width:260px; height:52px; border-radius:26px; opacity:1; transform:translateX(-50%) scaleY(1); }
      75%  { width:36px;  height:36px; border-radius:50%; opacity:1; transform:translateX(-50%) scaleY(1); }
      100% { width:36px;  height:36px; border-radius:50%; opacity:0; transform:translateX(-50%) scaleY(0.6); }
    }
    @keyframes di-content-in {
      0%,40% { opacity:0; transform:scale(0.8) translateY(4px); }
      100%   { opacity:1; transform:scale(1) translateY(0); }
    }
    @keyframes di-icon-pulse {
      0%,100% { transform:scale(1); }
      50%     { transform:scale(1.18); }
    }
    @keyframes di-glow-pulse {
      0%,100% { opacity:0.5; }
      50%     { opacity:1; }
    }
    /* Nhấp nháy kiểu "kích hoạt" — chạy 1 lần khi achievement toast xuất hiện */
    @keyframes di-activate-flicker {
      0%   { opacity:1; filter:brightness(1); }
      6%   { opacity:0.15; filter:brightness(2.2); }
      12%  { opacity:1; filter:brightness(1); }
      18%  { opacity:0.2; filter:brightness(2.4); }
      26%  { opacity:1; filter:brightness(1); }
      34%  { opacity:0.4; filter:brightness(1.8); }
      42%  { opacity:1; filter:brightness(1); }
      100% { opacity:1; filter:brightness(1); }
    }
    /* Nhấp nháy nhẹ liên tục — giống hệt kiểu chữ "DEV ISLAND" trong learnsy-dev-island.jsx */
    @keyframes bb-blink {
      0%,100% { opacity:1; }
      50%     { opacity:.32; }
    }
    /* Khi "kích hoạt" (mở khoá thành tích) — TOÀN BỘ icon SVG trên trang nhấp nháy cùng lúc */
    body.bb-activate-all svg {
      animation: di-activate-flicker .65s steps(1,end) 1 both !important;
    }

    .bb-btn-tap { transition: transform 0.12s !important; }
    .bb-btn-tap:active { transform: scale(0.92) !important; }
    @media(hover:hover){ .bb-btn-tap:hover { filter: brightness(1.06); } }
    .bb-card-tap { transition: transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.15s !important; }
    .bb-card-tap:hover { transform: translateY(-2px) scale(1.01) !important; }
    .bb-card-tap:active { transform: scale(0.97) !important; }

    .bb-input::placeholder { color: rgba(26,176,245,0.42); font-family: Nunito,sans-serif; }
    .bb-input:focus {
      border-color: #1ab0f5 !important;
      box-shadow: 0 0 0 3px rgba(26,176,245,0.18) !important;
    }
    .bb-scroll-hide::-webkit-scrollbar { display:none; }
    .bb-scroll-hide { -ms-overflow-style:none; scrollbar-width:none; }

    .bb-tab-btn { all:unset; cursor:pointer; -webkit-tap-highlight-color:transparent; }
    .bb-tab-btn:active { transform:scale(0.93); }
    .bb-dm-btn { all:unset; cursor:pointer; }

    .bb-sticker {
      display:inline-flex; align-items:center; justify-content:center; gap:4px;
      border-radius:999px; font-weight:600; letter-spacing:0.3px;
      transition: transform 0.18s cubic-bezier(.34,1.56,.64,1);
      font-family: Nunito, sans-serif;
    }
    .bb-sticker:hover { transform: scale(1.09) rotate(2deg); }

    /* .bb-toggle-* → index/CSS/hyperos.css */

    .bb-section-title {
      font-family: 'Baloo 2', cursive;
      font-size:16px; font-weight:700; letter-spacing:0.2px;
    }
    .bb-hero-name {
      font-family: 'Baloo 2', cursive;
      font-size:22px; font-weight:600; line-height:1.2;
    }
    .bb-logo-text {
      font-family: 'Baloo 2', cursive;
      font-weight:600; letter-spacing:1px;
    }
    .bb-logo-wrap { display:inline-flex; flex-direction:column; align-items:flex-start; line-height:1; }
    .bb-logo-taNa {
      font-family:'MiSans',system-ui,-apple-system,'Roboto',sans-serif; font-weight:600; letter-spacing:-.2px;
      color:#1AB0F5; font-size:22px !important;
      display:inline-block; line-height:1.1;
    }
    .bb-logo-sub {
      font-size:7px; font-weight:600; letter-spacing:.2px; color:#90A8C8;
      margin-top:1px; opacity:.75; white-space:nowrap;
    }
    .bb-score-big {
      font-family: 'Baloo 2', cursive;
      font-weight:600; line-height:1;
    }
  `;
  document.head.appendChild(s);
})();

/* ══ SVG ICON LIBRARY ══ */
const Icons={
  home:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  stats:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  history:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/></svg>),
  settings:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  sun:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  moon:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  book:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>),
  lock:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>),
  search:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  shuffle:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>),
  check:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><polyline points="20 6 9 17 4 12"/></svg>),
  star:(<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>),
  trophy:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H4a2 2 0 0 0-2 2v2c0 3.31 2.69 6 6 6"/><path d="M17 4h3a2 2 0 0 1 2 2v2c0 3.31-2.69 6-6 6"/><path d="M7 4h10v8a5 5 0 0 1-10 0V4z"/></svg>),
  fire:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>),
  trending:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  target:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>),
  edit:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>),
  folder:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>),
  logout:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>),
  spinner:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="1em" height="1em" style={{animation:'bb-spin 1s linear infinite'}}><path d="M12 2a10 10 0 1 0 10 10"/></svg>),
  sad:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>),
  thumbsup:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>),
  medal:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="14" r="6"/><path d="M9 2h6l1 7H8L9 2z"/><line x1="12" y1="14" x2="12" y2="14"/></svg>),
  learnsy:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>),
  greetNight:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/><path d="M17 17l.01 0"/></svg>),
  greetMorning:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>),
  greetNoon:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M17 18a5 5 0 0 0-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/></svg>),
  greetAfternoon:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M3 15h18M5.5 15C5.5 11.41 8.41 8.5 12 8.5s6.5 2.91 6.5 6.5"/><circle cx="12" cy="6" r="2"/></svg>),
  greetEvening:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>),
  sparkle:(<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M12 0L14.59 9.41 24 12l-9.41 2.59L12 24l-2.59-9.41L0 12l9.41-2.59z"/></svg>),
  heart:(<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>),
  cloud:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>),
  gift:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>),
  smile:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>),
  zap:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  ribbon:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>),
  dice:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/></svg>),
  feather:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>),
  cpu:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>),
  headphones:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>),
  chevronRight:(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="1em" height="1em"><polyline points="9 18 15 12 9 6"/></svg>),
};

/* ── Icon component ── */
function Icon({name,size=20,color,style={}}){
  const icon=Icons[name]||Icons.sparkle;
  return(
    <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',
      width:size,height:size,fontSize:size,color:color||'currentColor',flexShrink:0,...style}}>
      {icon}
    </span>
  );
}

/* ══ HUD: GlitchText ══
   Render text bình thường + 2 pseudo-layer glitch qua CSS.
   liteMode → bỏ qua, chỉ render text thẳng.                */
function GlitchText({children,color,style={},liteMode}){
  if(liteMode){
    return(
      <span style={{fontFamily:"'Baloo 2',cursive",fontWeight:600,color,...style}}>
        {children}
      </span>
    );
  }
  /* Dùng inline span xếp chồng — không cần pseudo vì JSX không hỗ trợ ::before/::after */
  const base={
    position:'absolute',top:0,left:0,width:'100%',
    fontFamily:"'Baloo 2',cursive",fontWeight:600,
    overflow:'hidden',whiteSpace:'nowrap',
    pointerEvents:'none',
  };
  return(
    <span style={{position:'relative',display:'inline-block',fontFamily:"'Baloo 2',cursive",fontWeight:600,color,...style}}>
      {/* base text */}
      <span style={{visibility:'visible'}}>{children}</span>
      {/* glitch layer 1 — lệch đỏ */}
      <span aria-hidden="true" style={{
        ...base,color:'rgba(84,198,251,0.55)',
        animation:'hud-glitch-1 4s steps(1) infinite',
        mixBlendMode:'screen',
      }}>{children}</span>
      {/* glitch layer 2 — lệch lam */}
      <span aria-hidden="true" style={{
        ...base,color:'rgba(120,160,255,0.45)',
        animation:'hud-glitch-2 4s steps(1) 0.15s infinite',
        mixBlendMode:'screen',
      }}>{children}</span>
    </span>
  );
}

/* ══ HUD: SearchInput với cursor nhấp nháy ══ */
function HudSearchInput({value,onChange,dark,liteMode}){
  const [focused,setFocused]=useState(false);
  const C=dark?CD:CL;
  const showCursor=!focused&&!value; /* chỉ show khi rỗng + không focus */
  return(
    <div style={{position:'relative'}}>
      <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',
        pointerEvents:'none',display:'flex',alignItems:'center'}}>
        <Icon name='search' size={15}
          color={dark?'rgba(26,176,245,0.45)':'rgba(100,168,200,0.45)'}/>
      </span>
      <input value={value} onChange={onChange}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
        placeholder={showCursor?'':undefined}
        className="bb-input"
        style={{
          width:'100%',padding:'10px 14px 10px 36px',borderRadius:18,
          border:`1px solid ${dark?'rgba(128,128,128,0.16)':'rgba(128,128,128,0.16)'}`,
          background:C.inputBg,color:C.fg,fontSize:13,outline:'none',
          fontFamily:'Nunito,sans-serif',fontWeight:600,
          boxSizing:'border-box',transition:'border-color .2s,box-shadow .2s',
        }}/>
      {/* Fake placeholder + cursor khi rỗng chưa focus */}
      {showCursor&&(
        <span style={{
          position:'absolute',left:36,top:'50%',transform:'translateY(-50%)',
          pointerEvents:'none',display:'flex',alignItems:'center',gap:0,
          color:'rgba(26,176,245,0.42)',fontSize:13,fontFamily:'Nunito,sans-serif',fontWeight:600,
        }}>
          Tìm bài học cute
          {!liteMode&&(
            <span style={{
              display:'inline-block',width:1.5,height:13,
              background:'rgba(26,176,245,0.7)',marginLeft:1,borderRadius:1,
              animation:'hud-cursor-blink 1s step-start infinite',
            }}/>
          )}
          <span style={{opacity:0.5}}>...</span>
        </span>
      )}
    </div>
  );
}
const CL={
  fg:'#1A1C1E',
  sub:'#8A8F98',
  card:'#FFFFFF',
  cardBlur:'none',
  cardBorder:'rgba(128,128,128,0.14)',
  inputBg:'#F0F2F5',
  navBg:'rgba(246,247,249,0.94)',
  accent:'#1AB0F5',
  accent2:'#3B82F6',
  danger:'#FF3B30',
  tagBg:'rgba(26,176,245,0.12)',
};
const CD={
  fg:'#F2F3F5',
  sub:'#8E9299',
  card:'#1E2024',
  cardBlur:'none',
  cardBorder:'rgba(255,255,255,0.08)',
  inputBg:'#2A2D32',
  navBg:'rgba(18,19,21,0.94)',
  accent:'#1AB0F5',
  accent2:'#5CC8FA',
  danger:'#f87171',
  tagBg:'rgba(26,176,245,0.16)',
};

/* ══ HELPERS ══ */
const fmtDate=ts=>{
  if(!ts)return'—';
  return new Date(ts).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
};
const fmtTime=ts=>{
  if(!ts)return'';
  return new Date(ts).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
};
const pctColor=p=>{
  if(p>=90)return'#34C759';
  if(p>=70)return'#FF9500';
  if(p>=50)return'#1ab0f5';
  return'#FF3B30';
};
const pctLabel=p=>{
  if(p>=90)return'Xuất sắc';
  if(p>=70)return'Giỏi lắm';
  if(p>=50)return'Cố lên nha';
  return'Thử lại nhé';
};
const rankBadge=pct=>{
  if(pct>=95)return{icon:'trophy',label:'Vàng',  color:'#FF9500',glow:'rgba(255,149,0,0.4)', gradient:'#fde68a'};
  if(pct>=80)return{icon:'medal', label:'Bạc',   color:'#94a3b8',glow:'rgba(148,163,184,0.4)',gradient:'#e2e8f0'};
  if(pct>=60)return{icon:'ribbon',label:'Đồng',  color:'#cd7c4b',glow:'rgba(205,124,75,0.4)', gradient:'#fed7aa'};
  return       {icon:'star',  label:'Tập sự',color:'#34C759',glow:'rgba(52,211,153,0.4)',  gradient:'#a7f3d0'};
};
const toScore=pct=>+(pct/10).toFixed(1);
const fmtScore=pct=>{const s=toScore(pct);return s%1===0?String(s|0):s.toFixed(1);};

/* ══ ACRYLIC 3D AVATAR CARD ══
   Thẻ mica trong suốt, viền neon phát sáng khi dark mode, tilt 3D theo con trỏ/chạm.
   Bọc quanh LetterAvatar hiện có — không đổi logic upload/avatar.js. */
function AcrylicAvatarCard({name,avatarUrl,dark,size=58,liteMode,verified=true}){
  const ref=useRef(null);
  const [tilt,setTilt]=useState({rx:0,ry:0,mx:50,my:50});
  const resetTilt=useCallback(()=>setTilt({rx:0,ry:0,mx:50,my:50}),[]);

  const handleMove=useCallback((clientX,clientY)=>{
    if(liteMode||!ref.current)return;
    const r=ref.current.getBoundingClientRect();
    const px=(clientX-r.left)/r.width;
    const py=(clientY-r.top)/r.height;
    const ry=(px-0.5)*18;   // rotateY
    const rx=(0.5-py)*14;   // rotateX
    setTilt({rx,ry,mx:px*100,my:py*100});
  },[liteMode]);

  const glowColor=dark?'rgba(26,176,245,0.55)':'rgba(26,176,245,0.35)';
  const cardBg=dark
    ?'linear-gradient(135deg,rgba(255,255,255,0.10),rgba(26,176,245,0.06) 40%,rgba(26,176,245,0.10))'
    :'linear-gradient(135deg,rgba(255,255,255,0.75),rgba(231,245,252,0.55) 40%,rgba(214,231,254,0.65))';
  const borderColor=dark?'rgba(26,176,245,0.45)':'rgba(26,176,245,0.3)';

  return(
    <div
      ref={ref}
      onMouseMove={e=>handleMove(e.clientX,e.clientY)}
      onMouseLeave={resetTilt}
      onTouchMove={e=>{const t=e.touches[0];if(t)handleMove(t.clientX,t.clientY);}}
      onTouchEnd={resetTilt}
      style={{
        position:'relative',flexShrink:0,
        width:size+22,height:size+22,
        perspective:600,
      }}
    >
      <div style={{
        position:'relative',width:'100%',height:'100%',borderRadius:26,
        transformStyle:'preserve-3d',
        transform:`rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: liteMode ? 'none' : 'transform .25s cubic-bezier(.2,.8,.2,1)',
        background:cardBg,
        backdropFilter: liteMode?'none':'blur(6px)',
        WebkitBackdropFilter: liteMode?'none':'blur(6px)',
        border:`1.4px solid ${borderColor}`,
        boxShadow: dark
          ? `0 0 18px ${glowColor}, 0 0 4px rgba(26,176,245,0.5), 0 6px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)`
          : `0 6px 20px rgba(26,176,245,0.18), inset 0 1px 0 rgba(255,255,255,0.6)`,
        display:'flex',alignItems:'center',justifyContent:'center',
        overflow:'hidden',
      }}>
        {!liteMode&&(
          <div style={{
            position:'absolute',inset:0,pointerEvents:'none',borderRadius:22,
            background:`radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,${dark?0.28:0.5}) 0%, transparent 55%)`,
            mixBlendMode:dark?'screen':'overlay',
          }}/>
        )}
        {dark&&(
          <div style={{
            position:'absolute',inset:-1,borderRadius:22,pointerEvents:'none',
            boxShadow:'none',
            opacity:liteMode?0.4:0.85,
          }}/>
        )}
        {verified&&(
          <div style={{
            position:'absolute',top:3,right:3,width:14,height:14,borderRadius:'50%',
            background:'#fde68a',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'none',zIndex:2,
          }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        )}
        <div className="luv-avatar-ring" style={{width:size+6,height:size+6,marginLeft:-(size+6)/2,marginTop:-(size+6)/2}}/>
        <div style={{transform:'translateZ(16px)',position:'relative'}}>
          <LetterAvatar name={name} size={size} dark={dark} animate avatarUrl={avatarUrl}/>
        </div>
        <div className="luv-avatar-heart">♥</div>
      </div>
    </div>
  );
}

/* ══ ID CARD FULL MODAL — thẻ acrylic 3D full-size, phong cách hologram ══
   Bấm vào avatar ở hero để mở. Ảnh thật (nếu có) được phủ filter neon/wireframe;
   nếu không có ảnh, fallback ra LetterAvatar phóng to bên trong khung hologram. */
function IdCardFullModal({student,avatarUrl,dark,liteMode,avgPct,streak,badge,totalDone,onClose}){
  const cardRef=useRef(null);
  const [tilt,setTilt]=useState({rx:0,ry:0,mx:50,my:50});
  const resetTilt=useCallback(()=>setTilt({rx:6,ry:0,mx:50,my:35}),[]);
  useEffect(()=>{resetTilt();},[resetTilt]);

  const handleMove=useCallback((clientX,clientY)=>{
    if(liteMode||!cardRef.current)return;
    const r=cardRef.current.getBoundingClientRect();
    const px=(clientX-r.left)/r.width;
    const py=(clientY-r.top)/r.height;
    setTilt({rx:(0.5-py)*14,ry:(px-0.5)*20,mx:px*100,my:py*100});
  },[liteMode]);

  const name=student?.display_name||student?.username||'Học sinh';

  return(
    <div style={{
      position:'fixed',inset:0,zIndex:6000,
      background:'radial-gradient(circle at 50% 30%, rgba(12,30,38,0.92), rgba(0,0,0,0.96))',
      display:'flex',alignItems:'center',justifyContent:'center',
      animation:'bb-fadeUp .2s ease both',padding:24,
    }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>

      {/* Nút đóng */}
      <button onClick={onClose} style={{
        position:'absolute',top:20,right:20,width:36,height:36,borderRadius:'50%',
        background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',
        display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:2,
        transition:'all .15s',
      }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.2)';e.currentTarget.style.transform='scale(1.08)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.transform='scale(1)';}}
        onMouseDown={e=>e.currentTarget.style.transform='scale(0.9)'}
        onMouseUp={e=>e.currentTarget.style.transform='scale(1.08)'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* Sparkle trang trí góc */}
      <div style={{position:'absolute',bottom:'12%',right:'8%',opacity:0.6,animation:liteMode?'none':'bb-sparkle-rotate 4s linear infinite'}}>
        <Icon name="sparkle" size={26} color="#fff"/>
      </div>

      <div style={{perspective:900,width:'100%',maxWidth:300}}>
        <div
          ref={cardRef}
          onMouseMove={e=>handleMove(e.clientX,e.clientY)}
          onMouseLeave={resetTilt}
          onTouchMove={e=>{const t=e.touches[0];if(t)handleMove(t.clientX,t.clientY);}}
          onTouchEnd={resetTilt}
          style={{
            position:'relative',width:'100%',aspectRatio:'0.62',borderRadius:26,
            transformStyle:'preserve-3d',
            transform:`rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition:liteMode?'none':'transform .3s cubic-bezier(.2,.8,.2,1)',
            background:'linear-gradient(150deg,rgba(255,255,255,0.10),rgba(26,176,245,0.05) 45%,rgba(26,176,245,0.10))',
            backdropFilter:liteMode?'none':'blur(10px)',
            WebkitBackdropFilter:liteMode?'none':'blur(10px)',
            border:'1px solid rgba(182,231,253,0.35)',
            boxShadow:`0 0 30px rgba(0,0,0,0.08), 0 0 60px rgba(26,176,245,0.25), 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)`,
            overflow:'hidden',padding:'20px 18px',
            animation:'bb-fadeUp .3s cubic-bezier(.34,1.56,.64,1) both',
          }}
        >
          {/* Sheen theo con trỏ */}
          {!liteMode&&(
            <div style={{
              position:'absolute',inset:0,pointerEvents:'none',
              background:`radial-gradient(circle at ${tilt.mx}% ${tilt.my}%, rgba(255,255,255,0.22) 0%, transparent 50%)`,
              mixBlendMode:'screen',
            }}/>
          )}
          {/* Viền sáng chạy quanh mép — mô phỏng cạnh mica bắt đèn */}
          <div style={{position:'absolute',inset:0,borderRadius:26,pointerEvents:'none',
            background:'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.18) 48%, transparent 62%)',
            opacity:liteMode?0.3:0.8}}/>

          {/* ── Header: avatar nhỏ + tên + verified ── */}
          <div style={{display:'flex',alignItems:'center',gap:10,position:'relative',transform:'translateZ(20px)'}}>
            <div style={{width:38,height:38,borderRadius:'50%',flexShrink:0,overflow:'hidden',
              border:'1px solid rgba(255,255,255,0.5)',boxShadow:'none'}}>
              <LetterAvatar name={name} size={38} dark={true} animate avatarUrl={avatarUrl}/>
            </div>
            <div style={{flex:1,minWidth:0,color:'#fff',fontFamily:"'Baloo 2',cursive",fontSize:17,fontWeight:600,
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textShadow:'0 0 12px rgba(26,176,245,0.6)'}}>
              {name}
            </div>
            <div style={{width:26,height:26,borderRadius:'50%',flexShrink:0,
              background:'#fde68a',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'none'}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#78350f" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>

          {/* ── Portrait lớn hologram wireframe ── */}
          <div style={{
            position:'relative',marginTop:16,borderRadius:22,overflow:'hidden',
            height:'52%',transform:'translateZ(14px)',
            background:'radial-gradient(circle at 50% 35%, rgba(26,176,245,0.14), rgba(0,0,0,0.35))',
            border:'1px solid rgba(153,221,252,0.25)',
          }}>
            {avatarUrl?(
              <img src={avatarUrl} alt={name} style={{
                width:'100%',height:'100%',objectFit:'cover',
                filter:liteMode
                  ?'saturate(1.4) contrast(1.1)'
                  :'saturate(0) contrast(1.3) brightness(1.05) drop-shadow(0 0 10px rgba(26,176,245,0.6))',
                mixBlendMode:liteMode?'normal':'luminosity',
                opacity:liteMode?1:0.92,
              }}/>
            ):(
              <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{transform:'scale(2.1)'}}>
                  <LetterAvatar name={name} size={64} dark={true} animate avatarUrl={avatarUrl}/>
                </div>
              </div>
            )}
            {/* Overlay lưới hologram + gradient màu neon quét qua ảnh */}
            {!liteMode&&(
              <>
                <div style={{position:'absolute',inset:0,pointerEvents:'none',mixBlendMode:'color',
                  background:'#1ab0f5'}}/>
                <div style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.25,
                  backgroundImage:'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 8px), repeating-linear-gradient(90deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 8px)'}}/>
                <div style={{position:'absolute',left:0,right:0,height:'26%',pointerEvents:'none',
                  background:'linear-gradient(180deg, transparent, rgba(255,255,255,0.35), transparent)',
                  animation:'bb-scanline 2.6s ease-in-out infinite'}}/>
              </>
            )}
          </div>

          {/* ── Stats dưới thẻ ── */}
          <div style={{marginTop:14,position:'relative',transform:'translateZ(18px)',color:'rgba(255,255,255,0.85)'}}>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
              <span className="bb-sticker" style={{
                background:badge.gradient,color:'#fff',padding:'3px 10px',fontSize:10,
                boxShadow:`0 2px 8px ${badge.glow}`,display:'inline-flex',alignItems:'center',gap:4,
              }}>
                <Icon name={badge.icon} size={11} color="#fff"/>{badge.label}
              </span>
              {streak>0&&(
                <span className="bb-sticker" style={{
                  background:'#fde68a',color:'#92400e',
                  padding:'3px 10px',fontSize:10,boxShadow:'none',
                  display:'inline-flex',alignItems:'center',gap:4,
                }}>
                  <Icon name="fire" size={11} color="#92400e"/>{streak} ngày
                </span>
              )}
            </div>
            <div style={{fontSize:10,letterSpacing:0.4,lineHeight:1.7,color:'rgba(255,255,255,0.55)',fontFamily:'monospace'}}>
              ID: {(student?.username||'guest').toUpperCase().slice(0,14)}<br/>
              ĐIỂM TB: {avgPct}/100 · ĐÃ HỌC: {totalDone} BÀI<br/>
              STATUS: ĐÃ XÁC THỰC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* useAvatar, LetterAvatar, AvatarUploader — lazy từ window (avatar.js) */
const _avatarNoop=()=>({avatarUrl:null,loading:false,
  uploadAvatar:async()=>({ok:false,msg:'avatar.js chưa load'}),
  removeAvatar:async()=>{}});
const useAvatar      =(...a)=>(window.useAvatar||_avatarNoop)(...a);
const LetterAvatar   =(p)=>window.LetterAvatar
  ?React.createElement(window.LetterAvatar,p)
  :React.createElement('div',{style:{width:p.size||64,height:p.size||64,borderRadius:'50%',background:'rgba(26,176,245,0.2)'}});
const AvatarUploader =(p)=>window.AvatarUploader
  ?React.createElement(window.AvatarUploader,p)
  :null;

/* ══ DECORATIVE FLOATING EMOJIS ══ */
function FloatingDecos({dark}){
  /* Tiny SVG shapes instead of emoji for consistent cross-platform rendering */
  const decos=[
    {svg:<svg viewBox="0 0 24 24" width="18" height="18" fill="#1ab0f5"><path d="M12 2C9.5 2 8 4.5 8 6.5c0 3 4 7 4 7s4-4 4-7C16 4.5 14.5 2 12 2z"/></svg>,t:'8%',l:'5%',del:0,dur:5},
    {svg:<svg viewBox="0 0 24 24" width="14" height="14" fill="#8fd8fb"><path d="M12 0l2.59 9.41L24 12l-9.41 2.59L12 24l-2.59-9.41L0 12l9.41-2.59z"/></svg>,t:'15%',r:'8%',del:1.2,dur:4.5},
    {svg:<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#1ab0f5" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,t:'55%',l:'3%',del:0.7,dur:6},
    {svg:<svg viewBox="0 0 24 24" width="13" height="13" fill="#1AB0F5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>,t:'35%',r:'4%',del:2,dur:5.5},
    {svg:<svg viewBox="0 0 24 24" width="12" height="12" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,t:'72%',l:'6%',del:1.5,dur:4},
    {svg:<svg viewBox="0 0 24 24" width="15" height="15" fill="#34C759"><path d="M12 0l2.59 9.41L24 12l-9.41 2.59L12 24l-2.59-9.41L0 12l9.41-2.59z"/></svg>,t:'82%',r:'5%',del:0.3,dur:5.8},
  ];
  return(
    <>
      {decos.map((d,i)=>(
        <div key={i} style={{
          position:'fixed',top:d.t,left:d.l,right:d.r,
          pointerEvents:'none',zIndex:0,userSelect:'none',
          opacity:dark?0.12:0.22,
          animation:`bb-float ${d.dur}s ease-in-out ${d.del}s infinite`,
        }}>{d.svg}</div>
      ))}
    </>
  );
}

/* ══ SCORE BADGE — kawaii ring ══ */
function ScoreSVG({pct=0,size=56,dark,showMax=true,liteMode}){
  const color=pctColor(pct);
  const r=size/2-4;
  const circ=2*Math.PI*r;
  const dash=circ*(pct/100);
  const fs=size*0.28;
  const subFs=size*0.13;
  /* Radar sweep — chỉ mount 1 lần, tự fade sau 900ms */
  const [showSweep,setShowSweep]=useState(!liteMode);
  useEffect(()=>{
    if(liteMode)return;
    const t=setTimeout(()=>setShowSweep(false),900);
    return()=>clearTimeout(t);
  },[liteMode]);
  return(
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:'block',flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r+2} fill={color} opacity="0.07"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.06)'} strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:'stroke-dasharray .7s cubic-bezier(.34,1.56,.64,1)',filter:`drop-shadow(0 0 3px ${color}66)`}}/>
      {/* ── Radar sweep — quét 1 vòng rồi tắt ── */}
      {showSweep&&(
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={2} strokeLinecap="round"
          strokeDasharray={`${circ*0.22} ${circ*0.78}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{
            '--circ':`${circ}`,
            opacity:0.7,
            animation:'hud-radar-sweep 0.85s cubic-bezier(.4,0,.6,1) both',
            filter:`drop-shadow(0 0 4px ${color})`,
          }}/>
      )}
      <text x={size/2} y={size/2-(showMax?subFs*0.55:0)}
        textAnchor="middle" dominantBaseline="middle"
        fill={color} fontFamily="'Baloo 2',cursive" fontWeight="800" fontSize={fs}>{fmtScore(pct)}</text>
      {showMax&&(
        <text x={size/2} y={size/2+fs*0.5}
          textAnchor="middle" dominantBaseline="middle"
          fill={dark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.28)'}
          fontFamily="Nunito,sans-serif" fontWeight="700" fontSize={subFs}>/10</text>
      )}
    </svg>
  );
}

/* ── Score Badge Inline — pill ── */
function ScoreBadgeInline({pct,dark,fontSize=13}){
  const color=pctColor(pct);
  const w=fontSize*3.6,h=fontSize*1.8,rx=h/2;
  return(
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'inline-block',verticalAlign:'middle',flexShrink:0}}>
      <rect x={0} y={0} width={w} height={h} rx={rx} fill={color+'1e'} stroke={color+'55'} strokeWidth={1.2}/>
      <text x={w/2} y={h/2} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontFamily="'Baloo 2',cursive" fontWeight="800" fontSize={fontSize}>{fmtScore(pct)}/10</text>
    </svg>
  );
}

/* ── Kawaii Stat Card ── */
function StatCard({label,value,sub,color,dark,icon,delay=0}){
  const C=dark?CD:CL;
  return(
    <div className="bb-card-tap" style={{
      background:C.card,backdropFilter:C.cardBlur,WebkitBackdropFilter:C.cardBlur,borderRadius:24,padding:'14px 16px',
      display:'flex',alignItems:'center',gap:12,
      border:`1px solid ${color}30`,
      boxShadow:dark?`0 4px 20px ${color}20`:`0 4px 20px rgba(0,0,0,0.06),0 0 0 1px ${color}15`,
      flex:'1 1 calc(50% - 6px)',minWidth:138,
      animation:`bb-fadeUp .4s ease ${delay}s both`,
    }}>
      <div style={{
        width:46,height:46,borderRadius:18,flexShrink:0,
        background:`linear-gradient(135deg,${color}28,${color}15)`,
        display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:`0 2px 8px ${color}30`,
      }}>
        <Icon name={icon||'star'} size={22} color={color}/>
      </div>
      <div style={{minWidth:0}}>
        <div style={{fontSize:22,fontWeight:700,color,lineHeight:1,fontFamily:"'Baloo 2',cursive"}}>{value}</div>
        <div style={{fontSize:11,fontWeight:700,color:C.sub,marginTop:2}}>{label}</div>
        {sub&&<div style={{fontSize:10,color:C.sub,opacity:.7,marginTop:1}}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── Sparkline chart ── */
function Sparkline({data,color='#1ab0f5',width=120,height=44}){
  if(!data||data.length<2)return null;
  const max=Math.max(...data,1),min=Math.min(...data,0),range=max-min||1;
  const pts=data.map((v,i)=>{
    const x=i/(data.length-1)*width;
    const y=height-(v-min)/range*(height-8)-4;
    return`${x},${y}`;
  });
  const ptsStr=pts.join(' ');
  const last=pts[pts.length-1].split(',');
  const areaPath=`M ${pts[0]} ${pts.slice(1).map(p=>`L ${p}`).join(' ')} L ${width},${height} L 0,${height} Z`;
  return(
    <svg width={width} height={height} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)"/>
      <polyline points={ptsStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last[0]} cy={last[1]} r="5" fill={color} style={{filter:`drop-shadow(0 0 4px ${color}88)`}}/>
      <circle cx={last[0]} cy={last[1]} r="9" fill={color} opacity="0.14"/>
    </svg>
  );
}

/* ── Progress Ring ── */
function Ring({pct=0,size=80,stroke=8,color='#1ab0f5',dark}){
  const r=size/2-stroke;
  const circ=2*Math.PI*r;
  const dash=circ*(pct/100);
  return(
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.06)'} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        style={{transition:'stroke-dasharray .7s cubic-bezier(.34,1.56,.64,1)',filter:`drop-shadow(0 0 3px ${color}66)`}}/>
    </svg>
  );
}

/* ── Progress Bar ── */
function ProgressBar({pct,color,dark}){
  return(
    <div style={{height:10,borderRadius:99,background:dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.06)',overflow:'hidden'}}>
      <div style={{
        height:'100%',width:`${pct}%`,borderRadius:99,
        background:`linear-gradient(90deg,${color}bb,${color})`,
        transition:'width .7s cubic-bezier(.34,1.56,.64,1)',
        boxShadow:`0 2px 8px ${color}55`,
        position:'relative',overflow:'hidden',
      }}>
        <div style={{
          position:'absolute',inset:0,
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.38),transparent)',
          backgroundSize:'200% 100%',
          animation:'bb-shimmer 2s linear infinite',
        }}/>
      </div>
    </div>
  );
}

/* ── Kawaii Toggle ── */
function Toggle({val,onChange}){
  return(
    <div className={'bb-toggle-track'+(val?' is-on':'')} role="switch" aria-checked={!!val}
      onClick={()=>onChange(!val)}>
      <div className="bb-toggle-thumb"/>
    </div>
  );
}

/* ── Section Header ── */
function SectionHeader({title,dark,emoji,icon,color='#1ab0f5'}){
  const C=dark?CD:CL;
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
      <div style={{width:32,height:32,borderRadius:10,background:`${color}20`,
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        {icon
          ?<Icon name={icon} size={16} color={color}/>
          :<span style={{fontSize:16}}>{emoji}</span>
        }
      </div>
      <div className="bb-section-title" style={{color:C.fg}}>{title}</div>
    </div>
  );
}

/* ══ TAB BAR ══ */
/* SVG tab icons — inline, no emoji */
const TabIcons={
  home:(col)=>(<svg viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5z"/><polyline points="9 22 9 13 15 13 15 22"/></svg>),
  stats:(col)=>(<svg viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>),
  history:(col)=>(<svg viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/></svg>),
  notes:(col)=>(<svg viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>),
  files:(col)=>(<svg viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>),
  settings:(col)=>(<svg viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
};

/* Swipe-to-change-tab dùng window.useSwipe (swipe.jsx) có sẵn trên site */

function TabBar({tab,setTab,dark,liteMode,flickerFx}){
  const C=dark?CD:CL;
  const tabs=[
    {id:'home',    label:'Trang chủ'},
    {id:'stats',   label:'Thống kê'},
    {id:'history', label:'Lịch sử'},
    {id:'notes',   label:'Ghi chú'},
    {id:'files',   label:'Tài liệu'},
    {id:'settings',label:'Cài đặt'},
  ];
  return(
    <nav style={{
      position:'fixed',bottom:0,left:0,right:0,zIndex:200,
      background:C.navBg,backdropFilter:'blur(24px)',
      borderTop:`1px solid ${dark?'rgba(128,128,128,0.16)':'rgba(128,128,128,0.16)'}`,
      display:'flex',padding:'6px 4px',paddingBottom:'max(8px,env(safe-area-inset-bottom))',
      maxWidth:760,margin:'0 auto',
      boxShadow:dark?'0 -4px 24px rgba(26,176,245,0.1)':'0 -4px 24px rgba(26,176,245,0.08)',
    }}>
      {tabs.map((t,idx)=>{
        const active=tab===t.id;
        const col=active?C.accent:(dark?'rgba(182,231,253,0.38)':'rgba(96,140,160,0.45)');
        return(
          <button key={t.id} className="bb-tab-btn" onClick={()=>setTab(t.id)}
            style={{
              flex:1,minWidth:0,display:'flex',flexDirection:'column',alignItems:'center',gap:3,
              padding:'6px 1px',borderRadius:20,
              transition:'all .25s cubic-bezier(.34,1.56,.64,1)',
              background:active?(dark?'rgba(26,176,245,0.14)':'rgba(26,176,245,0.11)'):'transparent',
              transform:active?'scale(1.05)':'scale(1)',
            }}>
            <div style={{
              width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',
              transition:'all .25s',
              animation:active?'bb-bounce .6s ease':'none',
              filter:active?`drop-shadow(0 0 4px ${C.accent}88)`:'none',
            }}>
              <span style={{
                display:'inline-flex',
                animation:(liteMode||!flickerFx)?'none':`bb-blink 1.5s ease-in-out ${idx*0.15}s infinite`,
              }}>
                {TabIcons[t.id](col)}
              </span>
            </div>
            <span style={{
              fontSize:10,fontWeight:600,letterSpacing:0,transition:'color .2s',whiteSpace:'nowrap',
              color:active?C.accent:C.sub,
              display:'inline-block',
              animation:(liteMode||!flickerFx)?'none':`bb-blink 1.5s ease-in-out ${idx*0.15}s infinite`,
            }}>{t.label}</span>
            {active&&<div style={{width:4,height:4,borderRadius:'50%',background:C.accent,boxShadow:`0 0 6px ${C.accent}`}}/>}
          </button>
        );
      })}
    </nav>
  );
}

/* ══ ACTION BANNER CAROUSEL — nhóm banner vuốt ngang kiểu widget Samsung ══ */
/* ══ Luviee cute: mascot SVG + trạng thái trống + loading riêng (CSS: index/CSS/luviee-cute.css) ══ */
function LuvMascot({size=84,variant='happy'}){
  return(
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <ellipse cx="50" cy="92" rx="22" ry="3.5" fill="rgba(26,176,245,0.12)"/>
      <path d="M21 40 L25 13 L45 28 Z" fill="#bfe8fd" stroke="#8fd8fb" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M79 40 L75 13 L55 28 Z" fill="#bfe8fd" stroke="#8fd8fb" strokeWidth="2.5" strokeLinejoin="round"/>
      <path d="M27 31 L29 22 L37 27 Z" fill="#8fd8fb"/>
      <path d="M73 31 L71 22 L63 27 Z" fill="#8fd8fb"/>
      <circle cx="50" cy="57" r="33" fill="#f7fcff" stroke="#8fd8fb" strokeWidth="3"/>
      {variant==='happy'?(
        <>
          <path d="M34 55 Q39 48 44 55" stroke="#3a677c" strokeWidth="3" strokeLinecap="round"/>
          <path d="M56 55 Q61 48 66 55" stroke="#3a677c" strokeWidth="3" strokeLinecap="round"/>
          <path d="M45 65 Q50 71 55 65" stroke="#3a677c" strokeWidth="2.6" strokeLinecap="round"/>
        </>
      ):(
        <>
          <circle cx="39" cy="55" r="3.6" fill="#3a677c"/>
          <circle cx="61" cy="55" r="3.6" fill="#3a677c"/>
          <ellipse cx="50" cy="67" rx="3.2" ry="3.8" fill="#3a677c"/>
        </>
      )}
      <ellipse cx="31" cy="64" rx="6" ry="4" fill="#8fd8fb" opacity="0.55"/>
      <ellipse cx="69" cy="64" rx="6" ry="4" fill="#8fd8fb" opacity="0.55"/>
    </svg>
  );
}

function LuvEmpty({title,sub,dark}){
  return(
    <div className="luv-empty" style={{color:dark?'rgba(201,237,254,0.85)':'#5a8da5'}}>
      <div className="luv-empty-stage">
        <div className="luv-empty-glow" style={{opacity:dark?0.55:1}}/>
        <div className="luv-empty-mascot"><LuvMascot size={84} variant="wonder"/></div>
        <span className="luv-spark s1">✦</span>
        <span className="luv-spark s2">✦</span>
        <span className="luv-spark s3">♥</span>
      </div>
      <div className="luv-empty-title">{title}</div>
      <div className="luv-empty-sub" style={{opacity:0.85}}>{sub}</div>
    </div>
  );
}

function LuvLoader({label,dark}){
  return(
    <div className="luv-loader" style={{color:dark?'rgba(201,237,254,0.85)':'#5a8da5'}}>
      <div className="luv-loader-mascot"><LuvMascot size={76} variant="happy"/></div>
      <div className="luv-dots"><span/><span/><span/></div>
      <span style={{fontSize:13,fontWeight:700}}>{label}</span>
    </div>
  );
}

function ActionBanner({icon,title,sub,gradient,shadow,onClick,delay}){
  return(
    <button onClick={onClick} className="bb-btn-tap luv-banner"
      style={{
        width:'100%',display:'flex',alignItems:'center',gap:14,
        padding:'16px 18px',borderRadius:22,border:'none',cursor:'pointer',
        textAlign:'left',fontFamily:'Nunito,sans-serif',
        background:gradient,boxShadow:shadow,
        animation:`bb-fadeUp .35s ease ${delay}s both`,
      }}>
      <div style={{
        width:44,height:44,borderRadius:20,flexShrink:0,
        background:'rgba(255,255,255,0.22)',backdropFilter:'blur(6px)',
        display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        <Icon name={icon} size={22} color="#fff"/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>{title}</div>
        <div style={{fontSize:11.5,color:'rgba(255,255,255,0.85)',fontWeight:600,marginTop:1}}>
          {sub}
        </div>
      </div>
      <Icon name="chevronRight" size={20} color="rgba(255,255,255,0.9)"/>
    </button>
  );
}

function BannerCarousel({dark,pages}){
  const trackRef=useRef(null);
  const [page,setPage]=useState(0);
  const n=pages.length;

  const onScroll=useCallback(()=>{
    const el=trackRef.current;
    if(!el)return;
    const idx=Math.round(el.scrollLeft/el.clientWidth);
    setPage(p=>p===idx?p:Math.max(0,Math.min(n-1,idx)));
  },[n]);

  const goTo=useCallback((i)=>{
    const el=trackRef.current;
    if(!el)return;
    el.scrollTo({left:i*el.clientWidth,behavior:'smooth'});
  },[]);

  if(n===0)return null;

  return(
    <div style={{padding:'8px 0 8px'}}>
      <div ref={trackRef} onScroll={onScroll} className="bb-scroll-hide" data-no-swipe="1"
        style={{
          display:'flex',overflowX:'auto',scrollSnapType:'x mandatory',
          WebkitOverflowScrolling:'touch',
        }}>
        {pages.map((p,i)=>(
          <div key={i} style={{flex:'0 0 100%',scrollSnapAlign:'start',padding:'0 14px'}}>
            <ActionBanner {...p}/>
          </div>
        ))}
      </div>
      {n>1&&(
        <div style={{display:'flex',justifyContent:'center',gap:6,marginTop:8}}>
          {pages.map((_,i)=>(
            <button key={i} onClick={()=>goTo(i)} aria-label={`Trang ${i+1}`}
              style={{
                width:page===i?16:6,height:6,borderRadius:99,border:'none',
                padding:0,cursor:'pointer',
                background:page===i?'#1AB0F5':(dark?'rgba(26,176,245,0.3)':'rgba(26,176,245,0.25)'),
                transition:'width .25s cubic-bezier(.34,1.56,.64,1), background .25s',
              }}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ TAB HOME ══ */
function TabHome({student,lessons,loading,fetchError,onPlay,shuffleQ,shuffleA,setShuffleQ,setShuffleA,history,dark,setTab,avatarUrl,liteMode,flickerFx,onGoListening,onGoVocab,onGoPractice,practiceCount}){
  const C=dark?CD:CL;
  const [search,setSearch]=useState('');
  const [subject,setSubject]=useState('all');
  const [showIdCard,setShowIdCard]=useState(false);
  const subjects=useMemo(()=>['all',...new Set(lessons.map(l=>l.subject||'Tiếng Anh'))]  ,[lessons]);
  const filtered=useMemo(()=>lessons.filter(l=>{
    const q=search.toLowerCase();
    return(!q||l.title.toLowerCase().includes(q))&&(subject==='all'||l.subject===subject);
  }),[lessons,search,subject]);

  const avgPct=history.length?Math.round(history.reduce((a,h)=>a+h.pct,0)/history.length):0;
  const streak=useMemo(()=>{
    if(!history.length)return 0;
    const days=[...new Set(history.map(h=>new Date(h.ts).toDateString()))];
    const today=new Date().toDateString();
    let s=days[0]===today?1:0;
    if(!s)return 0;
    for(let i=1;i<days.length;i++){
      const a=new Date(days[i-1]),b=new Date(days[i]);
      if((a-b)/(1000*60*60*24)===1)s++;else break;
    }
    return s;
  },[history]);

  const greet=(()=>{
    const h=new Date().getHours();
    if(h<5) return{text:'Khuya rồi nè',icon:'greetNight',sub:'Đi ngủ thôi bé ơi~'};
    if(h<11)return{text:'Chào buổi sáng',icon:'greetMorning',sub:'Ngày mới tươi đẹp nè!'};
    if(h<13)return{text:'Buổi trưa rồi',icon:'greetNoon',sub:'Ăn cơm chưa bé?'};
    if(h<18)return{text:'Buổi chiều xinh',icon:'greetAfternoon',sub:'Học tiếp nào~'};
    return{text:'Tối rồi nè',icon:'greetEvening',sub:'Chăm chỉ ghê á!'};
  })();

  const badge=rankBadge(avgPct);

  return(
    <div style={{paddingBottom:90}}>

      {/* ── Lời chào + thẻ hồ sơ ── */}
      <div className="hy-page-title" style={{margin:'6px 20px 2px'}}>{greet.text}</div>
      <div className="hy-page-sub" style={{margin:'0 20px 14px'}}>{greet.sub}</div>

      <div className="hy-card" style={{margin:'0 14px',padding:'16px 18px'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div onClick={()=>setShowIdCard(true)} style={{cursor:'pointer'}}>
            <AcrylicAvatarCard name={student?.display_name||student?.username} size={58} dark={dark} liteMode={liteMode} avatarUrl={avatarUrl}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:18,fontWeight:700,color:C.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {student?.display_name||student?.username||'Học sinh'}
            </div>
            <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
              {streak>0&&(
                <span className="hy-chip" style={{cursor:'default',background:'rgba(255,149,0,.14)',color:'#D97F00'}}>
                  <Icon name="fire" size={13} color="#FF9500"/> {streak} ngày
                </span>
              )}
              {history.length>0&&(
                <span className="hy-chip on" style={{cursor:'default'}}>
                  <Icon name={badge.icon} size={13} color="#1AB0F5"/>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          {history.length>0&&(
            <div style={{flexShrink:0,textAlign:'center',cursor:'pointer'}} onClick={()=>setTab('stats')}>
              <ScoreSVG pct={avgPct} size={58} dark={dark} liteMode={liteMode}/>
              <div style={{fontSize:11,color:C.sub,marginTop:2}}>Điểm TB</div>
            </div>
          )}
        </div>

        {history.length>0&&(
          <div style={{display:'flex',gap:8,marginTop:14}}>
            {[
              {label:'Bài đã làm',value:history.length,icon:'book',  color:'#1AB0F5'},
              {label:'Điểm TB',   value:<ScoreBadgeInline pct={avgPct} dark={dark} fontSize={15}/>,icon:'star',   color:'#FF9500'},
              {label:'Cao nhất',  value:<ScoreBadgeInline pct={Math.max(...history.map(h=>h.pct))} dark={dark} fontSize={15}/>,icon:'trophy', color:'#34C759'},
            ].map((st,i)=>(
              <div key={i} onClick={()=>setTab('stats')}
                style={{flex:1,cursor:'pointer',background:'var(--hy-fill)',borderRadius:18,padding:'10px 4px',textAlign:'center'}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:2}}>
                  <Icon name={st.icon} size={18} color={st.color}/>
                </div>
                <div style={{fontSize:17,fontWeight:700,color:C.fg}}>{st.value}</div>
                <div style={{fontSize:11,color:C.sub,fontWeight:500}}>{st.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Search ── */}
      <div style={{padding:'12px 14px 6px'}}>
        <HudSearchInput value={search} onChange={e=>setSearch(e.target.value)} dark={dark} liteMode={liteMode}/>
      </div>

      {/* ── Lối tắt: Luyện nghe / Từ vựng / Ôn tập ── */}
      <BannerCarousel dark={dark} pages={[
        {
          icon:'headphones',title:'Luyện nghe',
          sub:'Điền từ + nhận định Đúng/Sai/NM',
          gradient:'#1AB0F5',
          shadow:'none',
          onClick:()=>onGoListening&&onGoListening(),
          delay:0.05,
        },
        {
          icon:'book',title:'Từ vựng',
          sub:'Học từ mới + kiểm tra viết',
          gradient:'#3B82F6',
          shadow:'none',
          onClick:()=>onGoVocab&&onGoVocab(),
          delay:0.08,
        },
        /* Ôn tập riêng — chỉ hiện khi có ít nhất 1 bài practice đã publish */
        ...(onGoPractice?[{
          icon:'sparkle',title:'Ôn tập riêng',
          sub:`${practiceCount} bài dành riêng cho bạn`,
          gradient:'#FF9500',
          shadow:'none',
          onClick:()=>onGoPractice&&onGoPractice(),
          delay:0.11,
        }]:[]),
      ]}/>

      {/* ── Bộ lọc môn ── */}
      {subjects.length>2&&(
        <div style={{display:'flex',gap:8,padding:'6px 14px 8px',overflowX:'auto'}} className="bb-scroll-hide">
          {subjects.map(sj=>(
            <button key={sj} className={'hy-chip'+(subject===sj?' on':'')} onClick={()=>setSubject(sj)} style={{flexShrink:0}}>
              {sj==='all'?'Tất cả':sj}
            </button>
          ))}
        </div>
      )}

      {/* ── Xáo (nhóm hàng) ── */}
      <div className="hy-card flush" style={{margin:'4px 14px 12px',padding:'0 20px'}}>
        <div className="hy-row has-ico" style={{minHeight:56,padding:'10px 0'}}>
          <span className="hy-ico"><Icon name="shuffle" size={20} color="#fff"/></span>
          <div className="hy-title" style={{flex:1,color:C.fg}}>Xáo câu hỏi</div>
          <Toggle val={shuffleQ} onChange={()=>setShuffleQ(v=>!v)}/>
        </div>
        <div className="hy-row has-ico" style={{minHeight:56,padding:'10px 0'}}>
          <span className="hy-ico c-teal"><Icon name="zap" size={20} color="#fff"/></span>
          <div className="hy-title" style={{flex:1,color:C.fg}}>Xáo đáp án</div>
          <Toggle val={shuffleA} onChange={()=>setShuffleA(v=>!v)}/>
        </div>
      </div>

      {/* ── Danh sách bài học ── */}
      <div className="hy-section-label" style={{margin:'6px 24px 8px'}}>Bài học</div>
      {loading?(
        <LuvLoader label="Đang tải bài học..." dark={dark}/>
      ):fetchError?(
        <div className="hy-card" style={{margin:'0 14px',textAlign:'center',padding:'40px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
          <Icon name="sad" size={40} color="#8A8F98"/>
          <div style={{fontSize:15,color:C.fg,fontWeight:600}}>Không tải được bài học</div>
          <div style={{fontSize:13,color:C.sub}}>Kiểm tra kết nối rồi thử lại.</div>
        </div>
      ):(
        <div style={{padding:'0 14px'}}>
          {filtered.length===0&&(
            <LuvEmpty title="Chưa thấy bài nào" sub="Thử từ khóa khác hoặc kéo xuống để tải lại" dark={dark}/>
          )}
          {filtered.length>0&&(
            <div className="hy-card flush" style={{padding:'0 18px'}}>
              {filtered.map((l,i)=>{
                const done=history.find(h=>h.lessonTitle===l.title);
                const col=done?pctColor(done.pct):'#1AB0F5';
                return(
                  <div key={l.id} onClick={()=>onPlay(l)} className="hy-row has-ico" style={{cursor:'pointer',padding:'12px 0',minHeight:68}}>
                    <span className="hy-ico" style={{background:done?col:'#1AB0F5'}}>
                      {l.password
                        ?<Icon name="lock" size={20} color="#fff"/>
                        :done
                          ?<Icon name="check" size={20} color="#fff"/>
                          :<Icon name="book" size={20} color="#fff"/>
                      }
                    </span>
                    <div style={{flex:1,minWidth:0}}>
                      <div className="hy-title" style={{color:C.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</div>
                      <div className="hy-sub" style={{color:C.sub,display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                        <span>{l.subject||'Tiếng Anh'}</span>
                        <span>·</span>
                        <span>{l.questionCount||0} câu</span>
                        {done&&<span>· <ScoreBadgeInline pct={done.pct} dark={dark} fontSize={12}/> · {fmtDate(done.ts)}</span>}
                      </div>
                    </div>
                    <i className="hy-chevron"/>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Thẻ ID Acrylic 3D (full portrait) ── */}
      {showIdCard&&(
        <IdCardFullModal
          student={student} avatarUrl={avatarUrl} dark={dark} liteMode={liteMode}
          avgPct={avgPct} streak={streak} badge={badge} totalDone={history.length}
          onClose={()=>setShowIdCard(false)}
        />
      )}
    </div>
  );
}

/* ══ TAB STATS ══ */
function TabStats({history,dark}){
  const C=dark?CD:CL;
  if(!history.length)return(
    <div style={{padding:'6px 14px 100px'}}>
      <div className="hy-page-title">Thống kê</div>
      <div className="hy-card" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'48px 28px',textAlign:'center',marginTop:14}}>
        <Icon name="stats" size={52} color="#8A8F98"/>
        <div style={{fontSize:18,fontWeight:700,color:C.fg}}>Chưa có dữ liệu</div>
        <div style={{fontSize:14,color:C.sub}}>Làm bài quiz để xem thống kê.</div>
      </div>
    </div>
  );

  const avgPct=Math.round(history.reduce((a,h)=>a+h.pct,0)/history.length);
  const best=Math.max(...history.map(h=>h.pct));
  const total=history.reduce((a,h)=>a+(h.total||0),0);
  const correct=history.reduce((a,h)=>a+(h.score||0),0);
  const badge=rankBadge(best);
  const chart=[...history].reverse().slice(0,8).map(h=>h.pct);
  const bySubject={};
  history.forEach(h=>{
    const s=h.subject||'Tiếng Anh';
    if(!bySubject[s])bySubject[s]={count:0,total:0};
    bySubject[s].count++;bySubject[s].total+=h.pct;
  });
  const tiles=[
    {icon:'check',  label:'Câu đúng',   value:correct,         sub:`trên ${total} câu`, color:'#34C759'},
    {icon:'book',   label:'Bài đã làm', value:history.length,                          color:'#1AB0F5'},
    {icon:'target', label:'Tỉ lệ đúng', value:total?fmtScore(Math.round(correct/total*100))+'/10':'—', color:'#FF9500'},
    {icon:'trophy', label:'Tốt nhất',   value:fmtScore(best)+'/10', sub:pctLabel(best), color:pctColor(best)},
  ];
  const ach=[
    {cond:history.length>=1, label:'Bắt đầu',     icon:'check',   color:'#34C759'},
    {cond:history.length>=5, label:'Siêng năng',  icon:'book',    color:'#1AB0F5'},
    {cond:history.length>=10,label:'Chăm chỉ',    icon:'star',    color:'#FF9500'},
    {cond:history.length>=20,label:'Thần đồng',   icon:'zap',     color:'#30B0C7'},
    {cond:best>=70,          label:'Giỏi',        icon:'trending',color:'#1AB0F5'},
    {cond:best>=90,          label:'Xuất sắc',    icon:'trophy',  color:'#FF9500'},
    {cond:correct/Math.max(total,1)>=0.8,label:'Chính xác',icon:'target',color:'#34C759'},
  ];

  return(
    <div style={{padding:'6px 14px 100px',display:'flex',flexDirection:'column',gap:14}}>
      <div className="hy-page-title">Thống kê</div>

      {/* ── Xếp hạng ── */}
      <div className="hy-card">
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <div style={{position:'relative',flexShrink:0}}>
            <Ring pct={avgPct} size={92} stroke={8} color={pctColor(avgPct)} dark={dark}/>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <div style={{fontSize:22,fontWeight:700,color:pctColor(avgPct),lineHeight:1}}>{fmtScore(avgPct)}</div>
              <div style={{fontSize:11,color:C.sub}}>/10</div>
            </div>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Icon name={badge.icon} size={22} color={badge.color}/>
              <div style={{fontSize:20,fontWeight:700,color:C.fg}}>{badge.label}</div>
            </div>
            <div className="hy-sub" style={{color:C.sub,marginTop:4}}>
              Cao nhất <b style={{color:pctColor(best)}}>{fmtScore(best)}/10</b> · Đã làm <b style={{color:C.fg}}>{history.length}</b> bài
            </div>
            <div className="hy-progress" style={{marginTop:10}}><i style={{width:Math.max(2,Math.min(100,avgPct))+'%',background:pctColor(avgPct)}}/></div>
          </div>
        </div>
      </div>

      {/* ── Xu hướng ── */}
      {chart.length>=2&&(
        <div className="hy-card">
          <div className="hy-title" style={{color:C.fg,marginBottom:10}}>Xu hướng điểm số</div>
          <Sparkline data={chart} color='#1AB0F5' width={Math.min(window.innerWidth-80,680)} height={56}/>
          <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
            <span className="hy-sub" style={{color:C.sub}}>Cũ nhất</span>
            <span className="hy-sub" style={{color:C.sub}}>Gần nhất</span>
          </div>
        </div>
      )}

      {/* ── Số liệu ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        {tiles.map((t,i)=>(
          <div key={i} className="hy-card" style={{padding:'16px'}}>
            <span className="hy-ico" style={{background:t.color,width:32,height:32,borderRadius:10}}>
              <Icon name={t.icon} size={17} color="#fff"/>
            </span>
            <div style={{fontSize:22,fontWeight:700,color:C.fg,marginTop:10,lineHeight:1.1}}>{t.value}</div>
            <div className="hy-sub" style={{color:C.sub,marginTop:3}}>{t.label}{t.sub?' · '+t.sub:''}</div>
          </div>
        ))}
      </div>

      {/* ── Theo môn ── */}
      {Object.keys(bySubject).length>0&&(
        <>
          <div className="hy-section-label" style={{margin:'6px 10px -4px'}}>Theo môn học</div>
          <div className="hy-card">
            {Object.entries(bySubject).map(([sj,d],idx,arr)=>{
              const avg=Math.round(d.total/d.count);
              return(
                <div key={sj} style={{marginBottom:idx<arr.length-1?16:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,alignItems:'center'}}>
                    <span style={{fontSize:15,fontWeight:600,color:C.fg}}>{sj}</span>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span className="hy-value">{d.count} bài</span>
                      <ScoreBadgeInline pct={avg} dark={dark} fontSize={13}/>
                    </div>
                  </div>
                  <div className="hy-progress"><i style={{width:Math.max(2,Math.min(100,avg))+'%',background:pctColor(avg)}}/></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Thành tích ── */}
      <div className="hy-section-label" style={{margin:'6px 10px -4px'}}>Thành tích</div>
      <div className="hy-card" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {ach.map((x,i)=>(
          <span key={i} className="hy-chip" style={{
            cursor:'default',height:34,padding:'0 14px',
            background:x.cond?x.color+'22':'var(--hy-fill)',
            color:x.cond?x.color:C.sub,opacity:x.cond?1:0.5,
          }}>
            <Icon name={x.icon} size={14} color={x.cond?x.color:C.sub}/> {x.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ══ TAB HISTORY ══ */
function TabHistory({history,onHistDetail,onClearHistory,dark,historyLoading}){
  const C=dark?CD:CL;
  const [confirmClear,setConfirmClear]=useState(false);
  const [clearing,setClearing]=useState(false);
  const [delId,setDelId]=useState(null);       // id đang chờ xác nhận xóa 1 dòng
  const doClearAll=async()=>{
    if(clearing)return;
    setClearing(true);
    await onClearHistory();
    setClearing(false);setConfirmClear(false);
  };
  const doDeleteOne=async(id)=>{
    if(clearing)return;
    setClearing(true);
    await onClearHistory([id]);
    setClearing(false);setDelId(null);
  };
  if(!history.length)return(
    <div style={{padding:'6px 14px 100px'}}>
      <div className="hy-page-title">Lịch sử</div>
      <div className="hy-card" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10,padding:'48px 28px',textAlign:'center',marginTop:14}}>
        <Icon name="history" size={52} color="#8A8F98"/>
        <div style={{fontSize:18,fontWeight:700,color:C.fg}}>Chưa có lịch sử</div>
        <div style={{fontSize:14,color:C.sub}}>Làm bài quiz để lưu kết quả.</div>
      </div>
    </div>
  );
  return(
    <div style={{padding:'6px 14px 100px'}}>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12}}>
        <div className="hy-page-title" style={{margin:'10px 6px 0'}}>Lịch sử <span className="hy-value" style={{fontSize:18}}>{history.length}</span></div>
        {!confirmClear?(
          <button className="hy-btn danger sm" onClick={()=>setConfirmClear(true)}>Xoá tất cả</button>
        ):(
          <div style={{display:'flex',gap:6}}>
            <button className="hy-btn sm" style={{background:'#FF3B30'}} disabled={clearing} onClick={doClearAll}>
              {clearing?'Đang xóa…':'Xác nhận'}
            </button>
            <button className="hy-btn plain sm" disabled={clearing} onClick={()=>setConfirmClear(false)}>Huỷ</button>
          </div>
        )}
      </div>
      <div className="hy-card flush" style={{padding:'0 16px'}}>
        {history.map((h,i)=>{
          const col=pctColor(h.pct);
          return(
            <div key={h.id||h.attemptId||(String(h.ts)+'_'+i)} onClick={()=>onHistDetail&&onHistDetail(h)}
              className="hy-row" style={{cursor:'pointer',padding:'12px 0',minHeight:72}}>
              <ScoreSVG pct={h.pct} size={48} dark={dark}/>
              <div style={{flex:1,minWidth:0}}>
                <div className="hy-title" style={{color:C.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {h.lessonTitle||'Bài quiz'}
                </div>
                <div className="hy-sub" style={{color:C.sub}}>
                  <b style={{color:col}}>{fmtScore(h.pct)}/10</b> · {Math.round(h.score*100)/100}/{Math.round(h.total*100)/100} điểm · {pctLabel(h.pct)}
                </div>
                <div className="hy-sub" style={{color:C.sub,opacity:.75}}>{fmtDate(h.ts)} {fmtTime(h.ts)}</div>
              </div>
              {h.id&&typeof h.id==='string'&&!String(h.id).startsWith('a_')&&(delId===h.id?(
                <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                  <button className="hy-btn sm" style={{background:'#FF3B30',padding:'0 12px'}} disabled={clearing} onClick={()=>doDeleteOne(h.id)}>Xóa</button>
                  <button className="hy-btn plain sm" style={{padding:'0 12px'}} onClick={()=>setDelId(null)}>Hủy</button>
                </div>
              ):(
                <button aria-label="Xóa lần làm này" onClick={e=>{e.stopPropagation();setDelId(h.id);}}
                  style={{border:'none',background:'transparent',cursor:'pointer',color:C.sub,opacity:.6,padding:6,fontSize:20,lineHeight:1}}>×</button>
              ))}
              {!(h.id&&typeof h.id==='string'&&!String(h.id).startsWith('a_'))&&<i className="hy-chevron"/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* AvatarUploader → avatar.js */

/* ══ TAB SETTINGS ══ */
function TabSettings({student,dark,setDark,shuffleQ,shuffleA,setShuffleQ,setShuffleA,onLogout,history,avatarUrl,avatarLoading,onAvatarUpload,onAvatarRemove,avatarSlots,activeSlot,onAvatarSwitch,studentId,liteMode,setLiteMode,flickerFx,setFlickerFx}){
  const C=dark?CD:CL;
  const [logoutConfirm,setLogoutConfirm]=useState(false);
  const [detectState,setDetectState]=useState(null);
  const avgPct=history.length?Math.round(history.reduce((a,h)=>a+h.pct,0)/history.length):0;
  const badge=rankBadge(avgPct);

  async function handleAutoDetect(){
    setDetectState('detecting');
    const res=await detectDevicePerformance();
    setDetectState(res);
    if(res.isLow&&!liteMode){ setLiteMode(true); }
    else if(!res.isLow&&liteMode&&res.score>=80){ setLiteMode(false); }
  }

  function ToggleRow({icon,label,sub,val,onChange,tone}){
    return(
      <div className="hy-row has-ico">
        <span className={'hy-ico'+(tone?' '+tone:'')}>
          <Icon name={icon} size={20} color="#fff"/>
        </span>
        <div style={{flex:1,minWidth:0}}>
          <div className="hy-title" style={{color:C.fg}}>{label}</div>
          {sub&&<div className="hy-sub" style={{color:C.sub}}>{sub}</div>}
        </div>
        <Toggle val={val} onChange={onChange}/>
      </div>
    );
  }

  return(
    <div style={{padding:'6px 14px 100px',display:'flex',flexDirection:'column',gap:14}}>
      <div className="hy-page-title">Cài đặt</div>

      {/* ── Hồ sơ ── */}
      <div className="hy-card" style={{padding:'22px 20px'}}>
        <AvatarUploader
          student={student} dark={dark}
          avatarUrl={avatarUrl} loading={avatarLoading}
          onUpload={onAvatarUpload} onRemove={onAvatarRemove}
          slots={avatarSlots} activeSlot={activeSlot} onSwitch={onAvatarSwitch}
        />
        <div style={{textAlign:'center',marginTop:6}}>
          <div style={{fontSize:20,fontWeight:700,color:C.fg,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {student?.display_name||student?.username||'Học sinh'}
          </div>
          <div style={{fontSize:13,color:C.sub,marginTop:2}}>@{student?.username}</div>
          <div style={{marginTop:10,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
            <span className="hy-chip on" style={{cursor:'default'}}>
              <Icon name={badge.icon} size={14} color="#1AB0F5"/>
              {badge.label}
            </span>
            {history.length>0&&<span className="hy-value">TB <b style={{color:pctColor(avgPct)}}>{fmtScore(avgPct)}/10</b></span>}
          </div>
        </div>
        {history.length>0&&(
          <div style={{display:'flex',gap:10,marginTop:16}}>
            {[
              {label:'Bài làm',  value:history.length,                               icon:'book',  color:'#1AB0F5'},
              {label:'Điểm TB',  value:fmtScore(avgPct),                             icon:'star',  color:'#FF9500'},
              {label:'Cao nhất', value:fmtScore(Math.max(...history.map(h=>h.pct))), icon:'trophy',color:'#34C759'},
            ].map((st,i)=>(
              <div key={i} style={{flex:1,textAlign:'center',background:'var(--hy-fill)',borderRadius:18,padding:'10px 4px'}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:2}}>
                  <Icon name={st.icon} size={16} color={st.color}/>
                </div>
                <div style={{fontSize:18,fontWeight:700,color:C.fg}}>{st.value}</div>
                <div style={{fontSize:11,color:C.sub,fontWeight:500}}>{st.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tuỳ chọn chung ── */}
      <div className="hy-section-label" style={{marginBottom:-6}}>Chung</div>
      <div className="hy-card flush" style={{padding:'0 20px'}}>
        <ToggleRow tone="c-indigo" icon='moon'    label='Chế độ tối'   sub='Bảo vệ mắt ban đêm'   val={dark}    onChange={setDark}/>
        <ToggleRow icon='shuffle' label='Xáo câu hỏi'  sub='Trộn thứ tự câu hỏi'  val={shuffleQ} onChange={setShuffleQ}/>
        <ToggleRow tone="c-teal" icon='dice'    label='Xáo đáp án'   sub='Trộn thứ tự đáp án'   val={shuffleA} onChange={setShuffleA}/>
        <ToggleRow tone="c-green" icon='feather'  label='Chế độ Lite'  sub='Giảm hiệu ứng, máy chạy mượt hơn' val={liteMode||false} onChange={setLiteMode}/>
        <ToggleRow tone="c-orange" icon='zap'  label='Hiệu ứng nhấp nháy'  sub='Icon & chữ nhấp nháy nhẹ (tab, thẻ bài, thành tích)' val={flickerFx!==false} onChange={setFlickerFx}/>
      </div>

      {/* ── Hiệu năng thiết bị ── */}
      <div className="hy-section-label" style={{marginBottom:-6}}>Hiệu năng thiết bị</div>
      <div className="hy-card">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
          <span className={'hy-ico'+(liteMode?' c-green':'')}><Icon name="cpu" size={20} color="#fff"/></span>
          <div style={{flex:1,minWidth:0}}>
            <div className="hy-title" style={{color:C.fg}}>{liteMode?'Chế độ Lite đang bật':'Chế độ Lite đang tắt'}</div>
          </div>
          {liteMode&&<span className="hy-chip on" style={{cursor:'default',background:'rgba(52,199,89,.14)',color:'#2BAA4D'}}>LITE</span>}
        </div>
        <p className="hy-sub" style={{color:C.sub,marginBottom:14,lineHeight:1.55}}>
          {liteMode
            ?'Animations và hiệu ứng nặng đã được tắt để máy chạy mượt hơn.'
            :'Bật chế độ Lite nếu máy bị giật lag, hoặc dùng "Phát hiện tự động" để Luviee tự kiểm tra.'}
        </p>
        {detectState&&detectState!=='detecting'&&(
          <div style={{borderRadius:18,padding:'12px 14px',marginBottom:14,
            background:detectState.isLow
              ?'rgba(255,59,48,0.1)':detectState.score<80
                ?'rgba(255,149,0,0.12)':'rgba(52,199,89,0.12)'}}>
            <div style={{fontSize:14,fontWeight:600,color:detectState.isLow?'#E5362C':detectState.score<80?'#D97F00':'#2BAA4D',marginBottom:4}}>
              {detectState.label}
            </div>
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              <span style={{fontSize:12.5,color:C.sub}}>Điểm: <b style={{color:C.fg}}>{detectState.score}/100</b></span>
              {detectState.fps&&<span style={{fontSize:12.5,color:C.sub}}>FPS: <b style={{color:C.fg}}>~{detectState.fps}</b></span>}
              {navigator.deviceMemory&&<span style={{fontSize:12.5,color:C.sub}}>RAM: <b style={{color:C.fg}}>{navigator.deviceMemory}GB</b></span>}
              {navigator.hardwareConcurrency&&<span style={{fontSize:12.5,color:C.sub}}>CPU: <b style={{color:C.fg}}>{navigator.hardwareConcurrency} core</b></span>}
            </div>
            {detectState.reason.length>0&&(
              <div style={{marginTop:4,fontSize:12.5,color:C.sub}}>
                {detectState.reason.join(' · ')}
              </div>
            )}
          </div>
        )}
        <button className="hy-btn tonal block" onClick={handleAutoDetect}
          disabled={detectState==='detecting'}>
          {detectState==='detecting'
            ?<><span style={{display:'inline-flex',animation:'bb-spin 1s linear infinite'}}><Icon name="spinner" size={16} color="#1AB0F5"/></span> Đang đo...</>
            :<><Icon name="cpu" size={16} color="#1AB0F5"/> Phát hiện tự động</>
          }
        </button>
      </div>

      {window.BgSettingsCard&&React.createElement(window.BgSettingsCard,{dark,studentId})}

      {/* ── Sparkle Settings Card — quản lý bởi learnsy-sparkle-settings.jsx ── */}
      {window.SparkleSettingsCard&&React.createElement(window.SparkleSettingsCard,{dark})}

      {/* ── Dev Island Settings Card — quản lý bởi learnsy-dev-island.jsx ── */}
      {window.DevIslandSettingsCard&&React.createElement(window.DevIslandSettingsCard,{dark})}

      {/* ── Giới thiệu ── */}
      <div className="hy-card">
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <span className="hy-ico" style={{width:48,height:48,borderRadius:15}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:18,fontWeight:700,color:C.fg}}>Luviee</div>
            <div className="hy-sub" style={{color:C.sub}}>Phiên bản 24.5</div>
          </div>
        </div>
      </div>

      {/* ── Logout ── */}
      <div>
        {!logoutConfirm?(
          <button className="hy-btn danger block" onClick={()=>setLogoutConfirm(true)}>
            <Icon name='logout' size={18} color="#E5362C"/> Đăng xuất
          </button>
        ):(
          <div className="hy-card" style={{animation:'bb-pop .2s ease both'}}>
            <div style={{fontSize:15,fontWeight:600,color:C.fg,marginBottom:14,textAlign:'center'}}>
              Bạn chắc chắn muốn đăng xuất?
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="hy-btn plain" style={{flex:1}} onClick={()=>setLogoutConfirm(false)}>Huỷ</button>
              <button className="hy-btn" style={{flex:1,background:'#FF3B30'}} onClick={onLogout}>Đăng xuất</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ DASHBOARD SHELL ══ (biến 'Dashboard' legacy đã gỡ — DashboardEnhanced phía dưới luôn ghi đè window.Dashboard nên bản cũ là code chết) ══ */

/* ══ RE-EXPORT HELPERS (must be inside IIFE — these reference local vars) ══ */
window.bbScoreSVG        = ScoreSVG;
window.bbScoreBadge      = ScoreBadgeInline;
window.bbLetterAvatar    = LetterAvatar;
window.bbProgressBar     = ProgressBar;
window.bbRing            = Ring;
window.bbSparkline       = Sparkline;
window.bbStatCard        = StatCard;
window.bbToggle          = Toggle;
window.bbIcon            = Icon;
window.bbPctColor        = pctColor;
window.bbPctLabel        = pctLabel;
window.bbRankBadge       = rankBadge;
window.bbFmtScore        = fmtScore;
window.bbFmtDate         = fmtDate;
window.bbFloatingDecos   = FloatingDecos;
window.bbSectionHeader   = SectionHeader;
window.bbTabBar          = TabBar;
window.bbTabIcons        = TabIcons;
window.bbTabHome         = TabHome;
window.bbTabHistory      = TabHistory;
window.bbTabStats        = TabStats;
window.bbTabSettings     = TabSettings;
/* window.bbTabFiles được gán bởi components/files-tab.jsx (load trước dashboard.jsx) */
window.bbInjectLiteCSS   = injectLiteCSS;
window.bbDetectPerf      = detectDevicePerformance;
window.bbGlitchText      = GlitchText;
window._bbCL             = CL;
window._bbCD             = CD;
})();

/* ══════════════════════════════════════════════════════════════════
   EXTENSIONS — Bánh Bèo Edition v2 Extra Features 🎀
   Appended components: Confetti, WeekHeatmap, DailyGoal,
   MotivationalQuote, AchievementToast, LessonPreviewModal
══════════════════════════════════════════════════════════════════ */
(function(){
const {useState,useEffect,useRef,useCallback,useMemo}=React;
const CL=window._bbCL;
const CD=window._bbCD;
const Icon        =(p)=>window.bbIcon?window.bbIcon(p):null;
const pctColor    =window.bbPctColor||(()=>'#34C759');
const pctLabel    =window.bbPctLabel||(()=>'');
const fmtScore    =window.bbFmtScore||(v=>v);
const fmtDate     =window.bbFmtDate||(()=>'');
const ProgressBar =(p)=>window.bbProgressBar?React.createElement(window.bbProgressBar,p):null;
const useAvatar   =(...a)=>(window.useAvatar||window.bbLetterAvatar||function(){return{};})(...a);
const LetterAvatar=(p)=>window.LetterAvatar?React.createElement(window.LetterAvatar,p):null;
const rankBadge   =window.bbRankBadge||(()=>null);
const FloatingDecos=(p)=>window.bbFloatingDecos?React.createElement(window.bbFloatingDecos,p):null;
const SectionHeader=(p)=>window.bbSectionHeader?React.createElement(window.bbSectionHeader,p):null;
const TabBar      =(p)=>window.bbTabBar?React.createElement(window.bbTabBar,p):null;
const TabHome     =(p)=>window.bbTabHome?React.createElement(window.bbTabHome,p):null;
const TabHistory  =(p)=>window.bbTabHistory?React.createElement(window.bbTabHistory,p):null;
const TabStats    =(p)=>window.bbTabStats?React.createElement(window.bbTabStats,p):null;
const TabSettings =(p)=>window.bbTabSettings?React.createElement(window.bbTabSettings,p):null;
const TabFiles    =(p)=>window.bbTabFiles?React.createElement(window.bbTabFiles,p):null;
const GlitchText  =(p)=>window.bbGlitchText?React.createElement(window.bbGlitchText,p):(p.children||null);

/* ══ CONFETTI BURST — kawaii hearts & stars ══ */
(function(){
  if(document.getElementById('bb-confetti-css'))return;
  const s=document.createElement('style');
  s.id='bb-confetti-css';
  s.textContent=`
    @keyframes bb-confetti-piece {
      0%   { transform: translateY(0) rotate(0deg) scale(1);   opacity: 1; }
      60%  { opacity: 1; }
      100% { transform: translateY(var(--fall-y)) translateX(var(--drift-x)) rotate(var(--rot)) scale(0.4); opacity: 0; }
    }
    .bb-confetti-piece {
      position: fixed; pointer-events: none; z-index: 9999;
      animation: bb-confetti-piece var(--dur) cubic-bezier(.25,.46,.45,.94) forwards;
    }
  `;
  document.head.appendChild(s);
})();

function burstConfetti(x, y, count=18){
  const colors=['#1ab0f5','#1AB0F5','#FF9500','#34C759','#06b6d4','#8fd8fb','#1AB0F5'];
  const shapes=[
    (c)=>`<svg width="13" height="13" viewBox="0 0 24 24"><path fill="${c}" d="M12 0l2.59 9.41L24 12l-9.41 2.59L12 24l-2.59-9.41L0 12l9.41-2.59z"/></svg>`,
    (c)=>`<svg width="13" height="13" viewBox="0 0 24 24"><polygon fill="${c}" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    (c)=>`<svg width="11" height="11" viewBox="0 0 24 24"><circle fill="${c}" cx="12" cy="12" r="10"/></svg>`,
    (c)=>`<svg width="11" height="11" viewBox="0 0 24 24"><rect fill="${c}" x="3" y="3" width="18" height="18" rx="3"/></svg>`,
    (c)=>`<svg width="12" height="12" viewBox="0 0 24 24"><polygon fill="${c}" points="12 2 22 22 2 22"/></svg>`,
    (c)=>`<svg width="10" height="14" viewBox="0 0 16 22"><rect fill="${c}" x="4" y="0" width="8" height="14" rx="2"/><path fill="${c}" d="M0 14l8 8 8-8z"/></svg>`,
  ];
  for(let i=0;i<count;i++){
    const el=document.createElement('div');
    el.className='bb-confetti-piece';
    const c=colors[Math.floor(Math.random()*colors.length)];
    el.innerHTML=shapes[Math.floor(Math.random()*shapes.length)](c);
    el.style.lineHeight='1';
    const angle=(Math.random()*360)*(Math.PI/180);
    const dist=60+Math.random()*100;
    el.style.cssText=`
      left:${x}px; top:${y}px;
      width:${12+Math.random()*10}px;
      --fall-y:${Math.sin(angle)*dist}px;
      --drift-x:${Math.cos(angle)*dist}px;
      --rot:${-180+Math.random()*360}deg;
      --dur:${0.6+Math.random()*0.8}s;
    `;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),(0.6+Math.random()*0.8+0.1)*1000);
  }
}

window.bbBurstConfetti=burstConfetti;

/* ══ WEEK HEATMAP — 7-day activity grid ══ */
function WeekHeatmap({history,dark}){
  const C=dark?CD:CL;
  const today=new Date();
  const days=Array.from({length:7},(_,i)=>{
    const d=new Date(today);
    d.setDate(today.getDate()-6+i);
    return d;
  });
  const dayLabels=['CN','T2','T3','T4','T5','T6','T7'];

  const countByDay={};
  history.forEach(h=>{
    const k=new Date(h.ts).toDateString();
    countByDay[k]=(countByDay[k]||0)+1;
  });

  return(
    <div style={{
      background:C.card,backdropFilter:C.cardBlur,WebkitBackdropFilter:C.cardBlur,borderRadius:24,padding:'16px',
      border:`1px solid ${dark?'rgba(128,128,128,0.16)':'rgba(128,128,128,0.16)'}`,
      animation:'bb-fadeUp .55s ease both',
    }}>
      <SectionHeader icon='history' title="Hoạt động 7 ngày qua" dark={dark} color='#1ab0f5'/>
      <div style={{display:'flex',gap:6,justifyContent:'space-between'}}>
        {days.map((d,i)=>{
          const k=d.toDateString();
          const cnt=countByDay[k]||0;
          const isToday=i===6;
          const intensity=cnt===0?0:cnt===1?0.35:cnt<=3?0.6:0.9;
          const bg=cnt===0
            ?(dark?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.05)')
            :`rgba(26,176,245,${intensity})`;
          return(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
              <div style={{
                width:'100%',aspectRatio:'1',borderRadius:10,
                background:bg,
                border:isToday?`2px solid #1ab0f5`:`1.5px solid ${cnt>0?'rgba(26,176,245,0.4)':'transparent'}`,
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:cnt>0?14:10,
                boxShadow:cnt>0?`0 2px 8px rgba(26,176,245,${intensity*0.5})`:'none',
                transition:'all .3s',
              }}>
                {cnt>0
                  ?<span style={{display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                    {cnt>2
                      ?<svg viewBox="0 0 24 24" width="13" height="13" fill="#fff"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      :cnt>1
                        ?<svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><path d="M12 0l2.59 9.41L24 12l-9.41 2.59L12 24l-2.59-9.41L0 12l9.41-2.59z"/></svg>
                        :<svg viewBox="0 0 24 24" width="7" height="7" fill="#fff"><circle cx="12" cy="12" r="9"/></svg>
                    }
                  </span>
                  :<span style={{opacity:0.3,display:'inline-flex'}}><svg viewBox="0 0 24 24" width="5" height="5" fill="currentColor"><circle cx="12" cy="12" r="9"/></svg></span>
                }
              </div>
              <span style={{
                fontSize:9,fontWeight:700,
                color:isToday?C.accent:C.sub,
              }}>{dayLabels[d.getDay()]}</span>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:8,fontSize:11,color:C.sub,textAlign:'center'}}>
        {history.filter(h=>{
          const d=new Date(h.ts);
          return(today-d)<7*24*60*60*1000;
        }).length} bài trong tuần này
      </div>
    </div>
  );
}

/* ══ DAILY GOAL WIDGET ══ */
function DailyGoalWidget({history,dark,goal=3}){
  const C=dark?CD:CL;
  const today=new Date().toDateString();
  const todayCount=history.filter(h=>new Date(h.ts).toDateString()===today).length;
  const pct=Math.min(Math.round(todayCount/goal*100),100);
  const done=todayCount>=goal;

  const motivations=[
    'Cố lên bé ơi~','Bé học giỏi lắm!','Thêm một chút nữa thôi',
    'Học là sức mạnh!','Tuyệt vời lắm nè','Bé xịn ghê á',
  ];
  const mot=motivations[Math.floor(Date.now()/3600000)%motivations.length];

  return(
    <div style={{
      background:done
        ?`linear-gradient(135deg,rgba(52,199,89,0.18),rgba(52,211,153,0.12))`
        :(dark?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.8)'),
      borderRadius:24,padding:'16px',
      border:`1px solid ${done?'rgba(52,199,89,0.4)':(dark?'rgba(128,128,128,0.16)':'rgba(128,128,128,0.16)')}`,
      boxShadow:done?'0 4px 20px rgba(52,199,89,0.2)':'none',
      animation:'bb-fadeUp .4s ease both',
      position:'relative',overflow:'hidden',
    }}>
      {done&&<div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(circle at 80% 20%,rgba(52,211,153,0.1),transparent 60%)'}}/>}
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{
          width:52,height:52,borderRadius:20,flexShrink:0,position:'relative',
          background:done?'#34C759':'rgba(26,176,245,0.12)',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:done?'0 4px 16px rgba(52,211,153,0.4)':'none',
          animation:done?'bb-jelly 0.6s ease':'none',
        }}>
          <Icon name={done?'check':'target'} size={26} color={done?'#fff':'#1ab0f5'}/>
        </div>
        <div style={{flex:1}}>
          <div style={{
            fontFamily:"'Baloo 2',cursive",fontSize:15,fontWeight:600,
            color:done?'#34C759':C.fg,
          }}>
            {done?'Hoàn thành mục tiêu hôm nay!':'Mục tiêu hôm nay'}
          </div>
          <div style={{fontSize:11,color:C.sub,marginTop:1}}>
            {todayCount}/{goal} bài · {done?'Xuất sắc!':mot}
          </div>
          <div style={{marginTop:8}}>
            <ProgressBar pct={pct} color={done?'#34C759':'#1ab0f5'} dark={dark}/>
          </div>
        </div>
        <div style={{
          fontFamily:"'Baloo 2',cursive",fontSize:22,fontWeight:700,
          color:done?'#34C759':'#1ab0f5',flexShrink:0,
        }}>{todayCount}<span style={{fontSize:13,color:C.sub}}>/{goal}</span></div>
      </div>
    </div>
  );
}

/* ══ MOTIVATIONAL QUOTE ══ */
function MotivationalQuote({dark,studentName}){
  const C=dark?CD:CL;
  const name=(studentName||'bé').split(' ').slice(-1)[0];
  const quotes=[
    {text:`${name} ơi, mỗi ngày học một chút là tiến bộ rồi!`,author:'Luviee'},
    {text:`Học không bao giờ là muộn, đặc biệt với ${name} xinh xắn!`,author:'Luviee'},
    {text:`Cố gắng hôm nay để ${name} tự hào ngày mai!`,author:'Luviee'},
    {text:`${name} làm được mà! Tin tưởng bản thân đi nào~`,author:'Luviee'},
    {text:`Mỗi câu đúng là một bước tiến của ${name}!`,author:'Luviee'},
    {text:`${name} học giỏi, ${name} xinh đẹp, ${name} làm được!`,author:'Luviee'},
    {text:`Hôm nay ${name} học gì mới chưa? Bắt đầu thôi nào!`,author:'Luviee'},
    {text:`Kiên nhẫn là chìa khóa, ${name} đang nắm nó rồi!`,author:'Luviee'},
  ];
  const q=quotes[Math.floor(new Date().getDate())%quotes.length];

  return(
    <div style={{
      borderRadius:22,padding:'14px 18px',
      background:dark
        ?'linear-gradient(135deg,rgba(26,176,245,0.12),rgba(26,176,245,0.1))'
        :'#f3f8ff',
      border:`1px solid ${dark?'rgba(26,176,245,0.2)':'rgba(26,176,245,0.2)'}`,
      animation:'bb-fadeUp .6s ease both',
      position:'relative',
    }}>
      <div style={{
        position:'absolute',top:10,left:14,fontSize:28,opacity:0.18,
        fontFamily:'Georgia,serif',lineHeight:1,color:'#1AB0F5',userSelect:'none',
      }}>"</div>
      <div style={{
        fontSize:13,fontWeight:700,color:C.fg,lineHeight:1.5,
        fontStyle:'italic',paddingLeft:18,fontFamily:'Nunito,sans-serif',
      }}>{q.text}</div>
      <div style={{fontSize:10,color:C.sub,marginTop:6,paddingLeft:18}}>— {q.author}</div>
      <div style={{
        position:'absolute',bottom:-2,right:10,fontSize:10,
        animation:'bb-star-twinkle 2s ease-in-out infinite',
        display:'inline-flex',
      }}><svg viewBox="0 0 24 24" width="10" height="10" fill="#1AB0F5"><path d="M12 0l2.59 9.41L24 12l-9.41 2.59L12 24l-2.59-9.41L0 12l9.41-2.59z"/></svg></div>
    </div>
  );
}

/* ══ ACHIEVEMENT TOAST — pop-up when unlocking ══ */
function AchievementToast({achievement,onClose,dark,liteMode,flickerFx}){
  const [leaving,setLeaving]=useState(false);

  useEffect(()=>{
    const leaveTimer=setTimeout(()=>setLeaving(true),3000);
    const closeTimer=setTimeout(onClose,3500);
    return()=>{clearTimeout(leaveTimer);clearTimeout(closeTimer);};
  },[onClose]);

  const handleTap=()=>{
    setLeaving(true);
    setTimeout(onClose,500);
  };

  /* Màu nền pill: luôn tối (dark island style) bất kể light/dark mode */
  const pillBg='linear-gradient(135deg,rgba(6,14,18,0.97) 0%,rgba(10,24,30,0.97) 100%)';
  const glowColor=achievement.color||'#1ab0f5';

  return(
    <div
      onClick={handleTap}
      style={{
        position:'fixed',
        top:10,
        left:'50%',
        zIndex:9999,
        /* Dynamic Island pill shape — animated via keyframes */
        width:280,
        height:56,
        borderRadius:28,
        transform:'translateX(-50%)',
        transformOrigin:'center top',
        background:pillBg,
        boxShadow:`0 0 0 1.5px rgba(255,255,255,0.08), 0 8px 28px rgba(0,0,0,0.55), 0 0 20px ${glowColor}44`,
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        gap:10,
        padding:'0 16px',
        cursor:'pointer',
        userSelect:'none',
        overflow:'hidden',
        animation: leaving
          ? 'di-pill-out 0.45s cubic-bezier(.55,.0,.45,1) both'
          : 'di-pill-in  0.55s cubic-bezier(.34,1.3,.64,1) both',
        willChange:'width,height,border-radius,opacity',
      }}
    >
      {/* Glow halo behind icon */}
      <div style={{
        position:'absolute',left:14,top:'50%',
        transform:'translateY(-50%)',
        width:32,height:32,borderRadius:'50%',
        background:glowColor,
        opacity:0.18,
        filter:'blur(8px)',
        animation:'di-glow-pulse 1.2s ease-in-out infinite',
        pointerEvents:'none',
      }}/>

      {/* Icon — nhấp nháy kiểu "kích hoạt" 1 lần rồi mới pulse đều */}
      <div style={{
        flexShrink:0,
        display:'inline-flex',
        animation: (liteMode||!flickerFx)
          ? 'di-icon-pulse 1s ease-in-out infinite'
          : 'di-activate-flicker .65s steps(1,end) 1 both, di-icon-pulse 1s ease-in-out infinite .65s',
        position:'relative',zIndex:1,
      }}>
        <Icon name={achievement.icon} size={24} color={glowColor}/>
      </div>

      {/* Text content — fades in after pill expands */}
      <div style={{
        flex:1,minWidth:0,
        animation:'di-content-in 0.55s cubic-bezier(.34,1.3,.64,1) both',
        position:'relative',zIndex:1,
      }}>
        <div style={{
          fontSize:9.5,fontWeight:600,color:glowColor,
          letterSpacing:'0.7px',textTransform:'uppercase',
          display:'flex',alignItems:'center',gap:3,
          marginBottom:1,
          fontFamily:'Nunito,sans-serif',
        }}>
          <span style={{
            display:'inline-flex',
            animation: (liteMode||!flickerFx)?'none':'di-activate-flicker .5s steps(1,end) 1 both',
          }}>
            <Icon name="ribbon" size={10} color={glowColor}/>
          </span>
          Thành tích mới!
          {!liteMode&&flickerFx&&(
            <span style={{
              display:'inline-block',width:1.5,height:9,marginLeft:1,
              background:glowColor,borderRadius:1,
              animation:'hud-cursor-blink .55s step-start infinite',
            }}/>
          )}
        </div>
        <div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:1.15}}>
          <GlitchText color={'#e4f4fc'} liteMode={liteMode||!flickerFx} style={{fontSize:14}}>
            {achievement.label}
          </GlitchText>
        </div>
      </div>

      {/* Tap-to-dismiss dot */}
      <div style={{
        flexShrink:0,width:6,height:6,borderRadius:'50%',
        background:`rgba(255,255,255,0.25)`,
        position:'relative',zIndex:1,
      }}/>
    </div>
  );
}

/* ══ LESSON PREVIEW CARD — expanded info before play ══ */
function LessonPreviewModal({lesson,history,onPlay,onPlayMode,onClose,dark}){
  const C=dark?CD:CL;
  if(!lesson)return null;
  const attempts=history.filter(h=>h.lessonTitle===lesson.title);
  const best=attempts.length?Math.max(...attempts.map(h=>h.pct)):null;
  const last=attempts[0];

  return(
    <div style={{
      position:'fixed',inset:0,zIndex:5000,
      background:'rgba(0,0,0,0.55)',backdropFilter:'blur(8px)',
      display:'flex',alignItems:'flex-end',justifyContent:'center',
      animation:'bb-fadeUp .15s ease both',
    }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{
        width:'100%',maxWidth:760,
        background:dark?'#081217':'#f2faff',
        borderRadius:'24px 24px 0 0',
        padding:'24px 20px 40px',
        animation:'bb-fadeUp .25s cubic-bezier(.34,1.56,.64,1) both',
        maxHeight:'85vh',overflowY:'auto',
      }}>
        {/* Handle bar */}
        <div style={{width:40,height:4,borderRadius:99,background:dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.12)',
          margin:'0 auto 20px'}}/>

        <div style={{display:'flex',gap:14,marginBottom:18}}>
          <div style={{
            width:56,height:56,borderRadius:22,flexShrink:0,fontSize:28,
            background:dark?'rgba(26,176,245,0.15)':'rgba(26,176,245,0.12)',
            display:'flex',alignItems:'center',justifyContent:'center',
            border:`1px solid rgba(128,128,128,0.16)`,
          }}>
            {lesson.password?<Icon name='lock' size={26} color='#4e9bbe'/>:best!==null?<Icon name='check' size={26} color={pctColor(best)}/>:<Icon name='book' size={26} color='#1ab0f5'/>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Baloo 2',cursive",fontSize:18,fontWeight:600,color:C.fg,lineHeight:1.2}}>
              {lesson.title}
            </div>
            <div style={{fontSize:12,color:C.sub,marginTop:4}}>
              {lesson.subject||'Tiếng Anh'} · {lesson.questionCount||0} câu hỏi
            </div>
          </div>
        </div>

        {/* Stats row */}
        {attempts.length>0&&(
          <div style={{display:'flex',gap:10,marginBottom:18}}>
            {[
              {label:'Lần thử',value:attempts.length,icon:'shuffle',color:'#1AB0F5'},
              {label:'Điểm cao nhất',value:fmtScore(best)+'/10',icon:'trophy',color:'#FF9500'},
              {label:'Lần cuối',value:fmtDate(last?.ts),icon:'history',color:'#06b6d4'},
            ].map((s,i)=>(
              <div key={i} style={{flex:1,textAlign:'center',
                background:dark?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.8)',
                borderRadius:18,padding:'10px 6px',
                border:`1px solid ${s.color}22`}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:2}}>
                  <Icon name={s.icon} size={16} color={s.color}/>
                </div>
                <div style={{fontSize:13,fontWeight:700,color:s.color,fontFamily:"'Baloo 2',cursive"}}>{s.value}</div>
                <div style={{fontSize:9,color:C.sub,fontWeight:700}}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar if done */}
        {best!==null&&(
          <div style={{marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:12,color:C.sub,fontWeight:700}}>Kết quả tốt nhất</span>
              <span style={{fontSize:12,fontWeight:600,color:pctColor(best)}}>{pctLabel(best)}</span>
            </div>
            <ProgressBar pct={best} color={pctColor(best)} dark={dark}/>
          </div>
        )}

        {/* Cách học vui / cấp tốc (chỉ hiện khi bài có câu trắc nghiệm hoặc đúng-sai) */}
        {onPlayMode&&(lesson.questions||[]).some(q=>q.type==='multiple'||q.type==='multi_select'||q.type==='true_false')&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            {[
              {mode:'fun',emoji:'🎮',title:'Học vui',sub:'Combo, XP, vuốt Đúng/Sai',bg:'linear-gradient(135deg,rgba(26,176,245,0.18),rgba(26,176,245,0.18))',bd:'rgba(26,176,245,0.4)'},
              {mode:'express',emoji:'⚡',title:'Học cấp tốc',sub:'Lướt đáp án + luyện bấm giờ',bg:'linear-gradient(135deg,rgba(251,191,36,0.2),rgba(249,115,22,0.18))',bd:'rgba(249,115,22,0.45)'},
            ].map(m=>(
              <button key={m.mode} onClick={()=>onPlayMode(lesson,m.mode)} className="bb-btn-tap"
                style={{padding:'12px 10px',borderRadius:20,border:`1px solid ${m.bd}`,background:m.bg,cursor:'pointer',fontFamily:'Nunito,sans-serif',textAlign:'center'}}>
                <div style={{fontSize:22}}>{m.emoji}</div>
                <div style={{fontSize:14,fontWeight:700,color:C.fg,marginTop:2}}>{m.title}</div>
                <div style={{fontSize:10.5,color:C.sub,fontWeight:700,marginTop:2}}>{m.sub}</div>
              </button>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} className="bb-btn-tap"
            style={{
              flex:1,padding:'14px',borderRadius:20,border:`1px solid ${dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)'}`,
              background:'transparent',color:C.sub,fontWeight:600,fontSize:14,cursor:'pointer',
              fontFamily:'Nunito,sans-serif',
            }}>
            Để sau
          </button>
          <button onClick={()=>{onClose();onPlay(lesson);}} className="bb-btn-tap"
            style={{
              flex:2,padding:'14px',borderRadius:20,border:'none',
              background:'#1AB0F5',
              color:'#fff',fontWeight:600,fontSize:14,cursor:'pointer',
              boxShadow:'0 4px 20px rgba(0,0,0,0.08)',
              fontFamily:'Nunito,sans-serif',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
            }}>
            <span style={{display:'inline-flex',animation:'bb-wiggle 2s ease-in-out infinite'}}><Icon name='zap' size={16} color='#fff'/></span>
            {best!==null?'Học lại nào!':'Bắt đầu học!'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ RE-EXPORT enhanced window globals ══ */
window.bbWeekHeatmap     = WeekHeatmap;
window.bbDailyGoal       = DailyGoalWidget;
window.bbMotivationalQ   = MotivationalQuote;
window.bbAchievementToast= AchievementToast;
window.bbLessonPreview   = LessonPreviewModal;

/* ══ DASHBOARD ENHANCED — drops in as a replacement for window.Dashboard ══
   Includes all original tabs PLUS:
     · WeekHeatmap in Stats tab
     · DailyGoalWidget + MotivationalQuote in Home tab
     · AchievementToast on new quiz completion
     · LessonPreviewModal before entering a quiz
     · Confetti burst on achievement unlock
══════════════════════════════════════════════════════════════════ */
function DashboardEnhanced(props){
  const {student,lessons,loading,fetchError,history,dark,setDark,
    onPlay,onClearHistory,onHistDetail,shuffleQ,shuffleA,setShuffleQ,setShuffleA,onLogout,onGoListening,onGoVocab,onGoPractice,practiceCount,onPlayMode}=props;

  // pct ưu tiên giá trị đã chuẩn hóa (server/gradeAll), chỉ tự tính khi thiếu.
  // Đồng thời loại bản ghi hỏng (không phải số) để thống kê không bị NaN.
  const normHistory=useMemo(()=>(history||[])
    .filter(h=>h&&Number.isFinite(Number(h.score))&&Number.isFinite(Number(h.total))&&Number(h.total)>0)
    .map(h=>{
      const score=Number(h.score),total=Number(h.total);
      const pct=Number.isFinite(Number(h.pct))?Number(h.pct):Math.round(Math.min(1,score/total)*100);
      return{...h,score,total,pct};
    }),[history]);

  const [tab,setTabRaw]=useState('home');
  const TAB_ORDER=['home','stats','history','notes','files','settings'];
  const prevTabIdxRef=useRef(0);
  const [tabDir,setTabDir]=useState('right'); // hướng animation cho tab mới vào
  const setTab=useCallback((next)=>{
    setTabRaw(prev=>{
      if(next===prev)return prev;
      const from=TAB_ORDER.indexOf(prev), to=TAB_ORDER.indexOf(next);
      setTabDir(to>from?'right':'left');
      prevTabIdxRef.current=to;
      return next;
    });
  },[]);
  const [achievementQueue,setAchievementQueue]=useState([]);
  const [previewLesson,setPreviewLesson]=useState(null);
  const [showExpSheet,setShowExpSheet]=useState(false);
  const [expSel,setExpSel]=useState({});
  const [liteMode,setLiteModeRaw]=useState(()=>localStorage.getItem('bb-lite-mode')==='1');
  const [flickerFx,setFlickerFxRaw]=useState(()=>localStorage.getItem('bb-flicker-fx')!=='0');
  function setFlickerFx(val){ setFlickerFxRaw(val); localStorage.setItem('bb-flicker-fx',val?'1':'0'); }
  const prevHistLen=useRef(normHistory.length);
  const C=dark?CD:CL;

  /* ── Khi có thành tích mới (achievementQueue tăng) — nhấp nháy TOÀN BỘ icon trên trang ── */
  const prevAchQLen=useRef(0);
  useEffect(()=>{
    if(achievementQueue.length>prevAchQLen.current&&!liteMode&&flickerFx){
      document.body.classList.add('bb-activate-all');
      const t=setTimeout(()=>document.body.classList.remove('bb-activate-all'),700);
      prevAchQLen.current=achievementQueue.length;
      return()=>clearTimeout(t);
    }
    prevAchQLen.current=achievementQueue.length;
  },[achievementQueue.length,liteMode,flickerFx]);


  function setLiteMode(val){
    setLiteModeRaw(val);
    localStorage.setItem('bb-lite-mode',val?'1':'0');
    injectLiteCSS(val);
  }

  /* ── Auto perf check ──
     TRƯỚC: chỉ trigger khi `student` chuyển từ null → có giá trị (tức
     vừa login). Với phiên đã đăng nhập sẵn (student đọc thẳng từ
     localStorage ngay lúc app mount, xem index/JS/app.jsx), giá trị đã
     "có" ngay từ frame đầu tiên nên điều kiện wasNull không bao giờ
     đúng — bài FPS-test không bao giờ chạy, liteMode không bao giờ tự
     bật cho nhóm người dùng này dù máy yếu. Đây là phần lớn traffic
     thực tế (đa số người vào lại web đã đăng nhập từ trước), nên đây là
     nguyên nhân chính khiến toàn trang vẫn giật trên máy yếu dù cơ chế
     lite-mode đã được xây sẵn.
     SAU: chỉ cần có student (đăng nhập, dù cũ hay mới) — hàm
     runLoginPerfCheck() bên trong đã tự chặn bằng sessionStorage
     ('bb-perf-checked') nên vẫn chỉ chạy FPS-test đúng 1 lần/tab, gọi
     lại nhiều lần không tốn thêm chi phí. */
  const perfCheckedRef=useRef(false);
  useEffect(()=>{
    const hasStudent=!!(student?.id||student?.username);
    if(!hasStudent||perfCheckedRef.current)return;
    perfCheckedRef.current=true;
    if(sessionStorage.getItem('bb-perf-checked')==='1')return;
    runLoginPerfCheck().then(r=>{ if(r.liteMode&&!liteMode) setLiteMode(true); });
  },[student]); // eslint-disable-line

  // ── Sync display_name từ Supabase (khớp với student-manager) ──
  const [liveStudent,setLiveStudent]=useState(student);
  const fetchStudentInfo=useCallback(async()=>{
    if(!student?.id&&!student?.username)return;
    try{
      // maybeSingle: tài khoản đã bị admin XÓA → data=null (không ném lỗi)
      const cols='id,username,display_name,class_name,is_active';
      const q=student?.id
        ?window.supa.from('students').select(cols).eq('id',student.id).maybeSingle()
        :window.supa.from('students').select(cols).eq('username',student.username).maybeSingle();
      const{data,error}=await q;
      if(error)return;                       // lỗi mạng: KHÔNG đăng xuất nhầm
      if(!data){                             // tài khoản không còn tồn tại
        onLogout&&onLogout('deleted');
        return;
      }
      if(data.is_active===false){            // bị khóa
        onLogout&&onLogout('locked');
        return;
      }
      setLiveStudent(s=>({...s,...data}));
      try{window.LearnsySession?.updateUser?.({display_name:data.display_name,class_name:data.class_name});}catch{}
    }catch(e){}
  },[student?.id,student?.username,onLogout]);
  useEffect(()=>{
    fetchStudentInfo();
    const onVis=()=>{if(document.visibilityState==='visible')fetchStudentInfo();};
    window.addEventListener('learnsy:student-saved',fetchStudentInfo);
    document.addEventListener('visibilitychange',onVis);
    return()=>{
      window.removeEventListener('learnsy:student-saved',fetchStudentInfo);
      document.removeEventListener('visibilitychange',onVis);
    };
  },[fetchStudentInfo]);
  const eff=liveStudent||student;

  // Avatar
  const userId=eff?.id||eff?.username;
  const {avatarUrl,loading:avatarLoading,uploadAvatar,removeAvatar,switchAvatar,slots:avatarSlots,activeSlot:avatarActiveSlot}=useAvatar(userId);

  useEffect(()=>{
    const saved=localStorage.getItem('bb-lite-mode')==='1';
    if(saved) injectLiteCSS(true);
  },[]);

  /* ── Background — quản lý bởi background-settings.js ── */
  useEffect(()=>{
    if(window.applyBackground&&window.loadBgSettings){
      window.applyBackground(window.loadBgSettings());
    }
  },[dark]);

  /* ── Sparkle particles (Plavsky) — quản lý bởi learnsy-sparkle-settings.jsx ── */
  useEffect(()=>{
    window.bbApplySparkle&&window.bbApplySparkle(dark);
  },[dark]);

  /* ── Achievement detection ── */
  useEffect(()=>{
    if(normHistory.length<=prevHistLen.current){ prevHistLen.current=normHistory.length; return; }
    prevHistLen.current=normHistory.length;
    const n=normHistory.length;
    const best=Math.max(...normHistory.map(h=>h.pct));
    const checks=[
      {cond:n===1,   icon:'check',   label:'Bắt đầu hành trình!', color:'#34C759'},
      {cond:n===5,   icon:'book',    label:'5 bài siêng năng!',   color:'#1AB0F5'},
      {cond:n===10,  icon:'star',    label:'10 bài chăm chỉ!',    color:'#FF9500'},
      {cond:n===20,  icon:'zap',     label:'Thần đồng 20 bài!',   color:'#06b6d4'},
      {cond:n===50,  icon:'trending',label:'50 bài siêu anh hùng!',color:'#1ab0f5'},
      {cond:best>=70,icon:'thumbsup',label:'Đạt điểm Giỏi!',     color:'#1ab0f5'},
      {cond:best>=90,icon:'trophy',  label:'Điểm Xuất sắc!',     color:'#FF9500'},
    ];
    const unlocked=checks.filter(c=>c.cond);
    if(unlocked.length){
      setAchievementQueue(q=>[...q,...unlocked]);
      setTimeout(()=>window.bbBurstConfetti&&window.bbBurstConfetti(window.innerWidth/2,120,24),300);
    }
  },[normHistory]);

  /* ── Intercept play → show preview first ── */
  function handlePlay(lesson){ setPreviewLesson(lesson); }
  function confirmPlay(lesson){ setPreviewLesson(null); onPlay(lesson); }
  function confirmPlayMode(lesson,mode){ setPreviewLesson(null); onPlayMode&&onPlayMode(lesson,mode); }

  const [menuOpen,setMenuOpen]=useState(false);
  const tabTitles={home:'Trang chủ',stats:'Thống kê',history:'Lịch sử',notes:'Sổ ghi chú',files:'Tài liệu',settings:'Cài đặt'};
  const swipeEnabled=!showExpSheet&&!previewLesson;
  const swipe=(window.useSwipe?window.useSwipe:function(){return{};})({
    onSwipeLeft:function(){
      if(!swipeEnabled)return;
      const i=TAB_ORDER.indexOf(tab);
      if(i<TAB_ORDER.length-1) setTab(TAB_ORDER[i+1]);
    },
    onSwipeRight:function(){
      if(!swipeEnabled)return;
      const i=TAB_ORDER.indexOf(tab);
      if(i>0) setTab(TAB_ORDER[i-1]);
    },
    threshold:56,
  });

  return(
    <div style={{maxWidth:760,margin:'0 auto',minHeight:'100vh',color:C.fg,position:'relative',fontFamily:'Nunito,sans-serif',WebkitOverflowScrolling:'touch',overflowX:'hidden'}}>

      {/* ── Top Bar ── */}
      <div style={{
        position:'sticky',top:0,zIndex:100,
        background:C.navBg,
        backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
        padding:'10px 14px',display:'flex',alignItems:'center',gap:10,
      }}>
        {window.HyBurger&&React.createElement(window.HyBurger,{dark,open:menuOpen,onClick:()=>setMenuOpen(true)})}
        <div style={{flex:1,minWidth:0,display:'flex',alignItems:'baseline',gap:8}}>
          <span className="bb-logo-taNa" style={{fontSize:20}}>Luviee</span>
          <span style={{fontSize:13,fontWeight:600,color:C.sub,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tabTitles[tab]}</span>
        </div>
        <button className="hy-btn plain icon" aria-label="Tải bài về máy"
          onClick={()=>{
            const sel={};(lessons||[]).forEach((_,i)=>{sel[i]=true;});
            setExpSel(sel);setShowExpSheet(true);
          }}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#1AB0F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </button>
        <button className="hy-btn plain icon" aria-label={dark?'Chế độ sáng':'Chế độ tối'} onClick={()=>setDark(d=>!d)}>
          {dark
            ?<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#FF9500" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            :<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="#1AB0F5" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
      </div>

      {/* ── Content (vuốt trái/phải để đổi tab, giống app native) ── */}
      <div
        {...swipe}
        style={{overflowX:'hidden'}}>
        <div key={tab} style={{
          position:'relative',zIndex:1,
          animation:liteMode?'none':`${tabDir==='right'?'bb-slide-in-right':'bb-slide-in-left'} .22s cubic-bezier(.22,.9,.32,1) both`,
          willChange:liteMode?'auto':'transform',
        }}>

        {tab==='home'&&(
          <>
            <TabHome {...{student:eff,lessons,loading,fetchError,onPlay:handlePlay,
              shuffleQ,shuffleA,setShuffleQ,setShuffleA,history:normHistory,dark,setTab,avatarUrl,liteMode,flickerFx,onGoListening,onGoVocab,onGoPractice,practiceCount}}/>
            {normHistory.length>0&&(
              <div style={{padding:'0 14px 100px',display:'flex',flexDirection:'column',gap:10}}>
                <DailyGoalWidget history={normHistory} dark={dark}/>
                <MotivationalQuote dark={dark} studentName={eff?.display_name||eff?.username}/>
              </div>
            )}
            {normHistory.length===0&&<div style={{paddingBottom:90}}/>}
          </>
        )}

        {tab==='stats'&&(
          <>
            <TabStats history={normHistory} dark={dark}/>
            {normHistory.length>0&&(
              <div style={{padding:'0 14px 100px'}}>
                <WeekHeatmap history={normHistory} dark={dark}/>
              </div>
            )}
          </>
        )}

        {tab==='history'&&(
          <TabHistory history={normHistory} onHistDetail={onHistDetail}
            onClearHistory={onClearHistory} dark={dark} historyLoading={props.historyLoading}/>
        )}

        {tab==='notes'&&(
          <NotesScreen embedded dark={dark} student={eff}/>
        )}

        {tab==='files'&&(
          <TabFiles dark={dark} liteMode={liteMode} flickerFx={flickerFx}/>
        )}

        {tab==='settings'&&(
          <TabSettings {...{student:eff,dark,setDark,shuffleQ,shuffleA,
            setShuffleQ,setShuffleA,onLogout,history:normHistory,
            avatarUrl,avatarLoading,onAvatarUpload:uploadAvatar,onAvatarRemove:removeAvatar,
            avatarSlots,activeSlot:avatarActiveSlot,onAvatarSwitch:switchAvatar,studentId:userId,liteMode,setLiteMode,
            flickerFx,setFlickerFx}}/>
        )}
        </div>
      </div>

      {window.HyDrawer&&React.createElement(window.HyDrawer,{
        open:menuOpen,onClose:()=>setMenuOpen(false),dark,title:'Luviee',active:tab,
        items:['home','stats','history','notes','files','settings'].map(id=>({id,label:tabTitles[id],icon:(window.bbTabIcons&&window.bbTabIcons[id]?window.bbTabIcons[id]('currentColor'):null)})),
        onSelect:id=>{setTab(id);setMenuOpen(false);},
      })}

      {/* ── Export Sheet ── */}
      {showExpSheet&&(
        <>
          <div onClick={()=>setShowExpSheet(false)} style={{position:'fixed',inset:0,background:'rgba(7,13,20,0.72)',zIndex:8800,backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)'}}/>
          <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:760,zIndex:8801,borderRadius:'28px 28px 0 0',padding:'20px 20px 36px',background:'#13243A',borderTop:'1px solid rgba(153,221,252,0.2)',boxShadow:'none'}}>
            <div style={{width:36,height:4,borderRadius:99,background:'rgba(255,255,255,0.15)',margin:'0 auto 18px'}}/>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1AB0F5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span style={{fontSize:15,fontWeight:700,color:'#DCEAF0',flex:1}}>Tải bài về máy</span>
              <button onClick={()=>setShowExpSheet(false)} style={{background:'none',border:'none',cursor:'pointer',padding:4,color:'#607D8A',display:'flex',borderRadius:999,transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.color='#1AB0F5';e.currentTarget.style.background='rgba(26,176,245,0.12)';}}
                onMouseLeave={e=>{e.currentTarget.style.color='#607D8A';e.currentTarget.style.background='none';}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p style={{fontSize:12,color:'#607D8A',marginBottom:14,lineHeight:1.6}}>File HTML hoạt động offline, không cần internet.</p>
            <div style={{display:'flex',gap:7,marginBottom:12}}>
              <button onClick={()=>{const s={};(lessons||[]).forEach((_,i)=>{s[i]=true;});setExpSel(s);}}
                style={{padding:'5px 13px',borderRadius:999,border:'1px solid rgba(128,128,128,0.16)',background:'rgba(26,176,245,0.08)',color:'#8FD8FB',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Nunito,sans-serif',transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,176,245,0.18)';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(26,176,245,0.08)';e.currentTarget.style.transform='translateY(0)';}}
                onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'}
                onMouseUp={e=>e.currentTarget.style.transform='translateY(-1px)'}>Chọn tất cả</button>
              <button onClick={()=>setExpSel({})}
                style={{padding:'5px 13px',borderRadius:999,border:'1px solid rgba(26,176,245,0.3)',background:'rgba(26,176,245,0.08)',color:'#1AB0F5',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'Nunito,sans-serif',transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,176,245,0.18)';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(26,176,245,0.08)';e.currentTarget.style.transform='translateY(0)';}}
                onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'}
                onMouseUp={e=>e.currentTarget.style.transform='translateY(-1px)'}>Bỏ chọn</button>
            </div>
            <div style={{maxHeight:'38vh',overflowY:'auto',display:'flex',flexDirection:'column',gap:6,marginBottom:16,paddingRight:2}}>
              {(lessons||[]).map((l,i)=>(
                <div key={i} onClick={()=>setExpSel(s=>({...s,[i]:!s[i]}))}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:18,border:`1px solid ${expSel[i]?'rgba(26,176,245,0.6)':'rgba(153,221,252,0.15)'}`,background:expSel[i]?'rgba(26,176,245,0.1)':'rgba(255,255,255,0.04)',cursor:'pointer',transition:'all .15s'}}>
                  <div style={{width:18,height:18,borderRadius:6,border:`1px solid ${expSel[i]?'#1AB0F5':'rgba(255,255,255,0.2)'}`,background:expSel[i]?'#1AB0F5':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .15s'}}>
                    {expSel[i]&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5 6 4.5 9 10.5 3"/></svg>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'#DCEAF0',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{l.password?'🔒 ':''}{l.title||'Chưa đặt tên'}</div>
                    <div style={{fontSize:11,color:'#607D8A',marginTop:2}}>{(l.questions||[]).length} câu hỏi</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{
                const selected=(lessons||[]).filter((_,i)=>expSel[i]);
                if(!selected.length){alert('Chọn ít nhất 1 bài nhé!');return;}
                if(typeof window.buildExportLiteHTML==='function'){
                  const html=window.buildExportLiteHTML(selected);
                  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
                  const url=URL.createObjectURL(blob);
                  const a=document.createElement('a');
                  const name=selected.length===1?(selected[0].title||'learnsy-quiz'):'learnsy-'+selected.length+'bai';
                  a.href=url;a.download=name.replace(/[<>:"/\|?*]/g,'').trim()+'.html';
                  document.body.appendChild(a);a.click();
                  setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1000);
                  setShowExpSheet(false);
                }
              }} style={{flex:1,padding:'11px 0',borderRadius:999,border:'1px solid rgba(153,221,252,0.3)',background:'transparent',color:'#8FD8FB',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Nunito,sans-serif',transition:'all .15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(153,221,252,0.1)';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.transform='translateY(0)';}}
                onMouseDown={e=>e.currentTarget.style.transform='scale(0.96)'}
                onMouseUp={e=>e.currentTarget.style.transform='translateY(-1px)'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:-2,marginRight:4}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Lite
              </button>
              <button onClick={()=>{
                const selected=(lessons||[]).filter((_,i)=>expSel[i]);
                if(!selected.length){alert('Chọn ít nhất 1 bài nhé!');return;}
                if(typeof window.buildExportHTML==='function'){
                  const html=window.buildExportHTML(selected);
                  const blob=new Blob([html],{type:'text/html;charset=utf-8'});
                  const url=URL.createObjectURL(blob);
                  const a=document.createElement('a');
                  const name=selected.length===1?(selected[0].title||'learnsy-quiz'):'learnsy-'+selected.length+'bai';
                  a.href=url;a.download=name.replace(/[<>:"/\|?*]/g,'').trim()+'.html';
                  document.body.appendChild(a);a.click();
                  setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},1000);
                  setShowExpSheet(false);
                }
              }} style={{flex:1,padding:'11px 0',borderRadius:999,border:'none',background:'#1AB0F5',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Nunito,sans-serif',boxShadow:'none',transition:'all .18s'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 6px 24px rgba(26,176,245,0.48)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 18px rgba(26,176,245,0.35)';}}
                onMouseDown={e=>e.currentTarget.style.transform='scale(0.96)'}
                onMouseUp={e=>e.currentTarget.style.transform='translateY(-2px)'}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:-2,marginRight:4}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Full (âm thanh)
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Achievement Toast ── */}
      {achievementQueue.length>0&&(
        <AchievementToast
          achievement={achievementQueue[0]}
          dark={dark}
          liteMode={liteMode}
          flickerFx={flickerFx}
          onClose={()=>setAchievementQueue(q=>q.slice(1))}
        />
      )}

      {/* ── Lesson Preview Modal ── */}
      {previewLesson&&(
        <LessonPreviewModal
          lesson={previewLesson}
          history={normHistory}
          onPlay={confirmPlay}
          onPlayMode={onPlayMode?confirmPlayMode:undefined}
          onClose={()=>setPreviewLesson(null)}
          dark={dark}
        />
      )}
    </div>
  );
}

/* ── Export ── */
/* DashboardEnhanced là phiên bản đầy đủ tính năng.
   Để dùng, thay window.Dashboard = DashboardEnhanced trong index.html,
   hoặc dùng trực tiếp: ReactDOM.render(<DashboardEnhanced .../>, ...) */
window.DashboardEnhanced = DashboardEnhanced;
window.Dashboard         = DashboardEnhanced; /* auto-upgrade */

/* ══ CHANGELOG / WHATSNEW BANNER ══ */
function WhatsNewBanner({dark,onDismiss}){
  const C=dark?CD:CL;
  const items=[
    {icon:'target',  text:'Mục tiêu học hàng ngày'},
    {icon:'history', text:'Heatmap hoạt động 7 ngày'},
    {icon:'ribbon',  text:'Thành tích tự động mở khoá'},
    {icon:'book',    text:'Preview bài học trước khi vào'},
    {icon:'star',    text:'Hiệu ứng sparkle khi đạt thành tích'},
  ];
  return(
    <div style={{
      margin:'12px 14px 0',borderRadius:24,overflow:'hidden',
      border:`1px solid rgba(26,176,245,0.3)`,
      animation:'bb-fadeUp .3s ease both',
    }}>
      <div style={{
        background:'#1AB0F5',
        padding:'10px 14px',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{display:'inline-flex',animation:'bb-sparkle-rotate 3s linear infinite',color:'#fff'}}>
            <Icon name="sparkle" size={16} color="#fff"/>
          </span>
          <span style={{fontFamily:"'Baloo 2',cursive",fontSize:14,fontWeight:600,color:'#fff'}}>
            Cập nhật mới · Dashboard v3
          </span>
        </div>
        <button onClick={onDismiss}
          style={{background:'rgba(255,255,255,0.2)',border:'none',cursor:'pointer',
            color:'#fff',fontSize:12,fontWeight:700,padding:'2px 8px',borderRadius:99,
            fontFamily:'Nunito,sans-serif',display:'inline-flex',alignItems:'center',gap:4,transition:'all .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.32)';e.currentTarget.style.transform='translateY(-1px)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.2)';e.currentTarget.style.transform='translateY(0)';}}
          onMouseDown={e=>e.currentTarget.style.transform='scale(0.94)'}
          onMouseUp={e=>e.currentTarget.style.transform='translateY(-1px)'}>
          <Icon name="check" size={12} color="#fff"/> Đã hiểu
        </button>
      </div>
      <div style={{
        background:dark?'rgba(26,176,245,0.12)':'rgba(243,248,255,0.9)',
        padding:'10px 14px',display:'flex',flexDirection:'column',gap:5,
      }}>
        {items.map((it,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,
            animation:`bb-fadeUp .25s ease ${i*0.07}s both`}}>
            <span style={{display:'inline-flex',flexShrink:0,color:'#1AB0F5'}}>
              <Icon name={it.icon} size={14} color='#1AB0F5'/>
            </span>
            <span style={{fontSize:12,fontWeight:700,color:C.sub}}>{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
window.bbWhatsNew=WhatsNewBanner;

})(); /* ══ END EXTENSIONS IIFE ══ */

/* ══ END OF DASHBOARD.JS · Learnsy Bánh Bèo Edition ══ */
