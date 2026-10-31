/* ══════════════════════════════════════════════════════════════════
   THEME.JS · Learnsy · Chủ đề màu "Bánh bèo" (hồng pastel, kawaii)
   ─────────────────────────────────────────────────────────────────
   Cách hoạt động (không phải sửa từng component):
     • Chủ đề lưu ở localStorage 'learnsy_theme' ('default' | 'banhbeo'),
       cũng ép được bằng ?theme=banhbeo. Đổi chủ đề → tải lại trang.
     • Khi là 'banhbeo': gắn class html.theme-bb (banhbeo.css lo biến màu, phông,
       thẻ bo tròn, họa tiết) và CHẶN các chỗ code đặt màu xanh cứng (#1AB0F5…)
       để đổi sang hồng NGAY LÚC GÁN (style React, thuộc tính SVG, thẻ <style>).
       Hậu tố alpha như '#1AB0F5'+'1e' vẫn đúng vì chỉ thay 6 ký tự màu.
     • AMOLED (mặc định bật, chỉ có tác dụng ở chế độ tối): nền đen thuần #000, thẻ gần đen —
     OLED tắt hẳn điểm ảnh nên tiết kiệm pin và đen sâu hơn. Các màu xám/xanh tối "chỉ dùng cho
     chế độ tối" trong code được đổi qua cùng cơ chế. Xem index/CSS/amoled.css.
     • Trang trí: lớp SVG (nơ, tim, hoa, sao lấp lánh) bay nhẹ — 100% SVG, không emoji,
       tắt khi người dùng bật "giảm chuyển động".
   ══════════════════════════════════════════════════════════════════ */
const KEY = 'learnsy_theme';

function readTheme() {
  try {
    const q = new URLSearchParams(location.search).get('theme');
    if (q === 'banhbeo' || q === 'default') localStorage.setItem(KEY, q);
    return localStorage.getItem(KEY) === 'banhbeo' ? 'banhbeo' : 'default';
  } catch { return 'default'; }
}
const theme = readTheme();
/* AMOLED: nền đen thuần ở chế độ tối (mặc định BẬT; tắt bằng Cài đặt hoặc ?amoled=0) */
function readAmoled() {
  try {
    const q = new URLSearchParams(location.search).get('amoled');
    if (q === '0' || q === '1') localStorage.setItem('learnsy_amoled', q);
    return localStorage.getItem('learnsy_amoled') !== '0';
  } catch { return true; }
}
const amoled = readAmoled();

/* màu xanh HyperOS → màu hồng bánh bèo (khóa viết thường) */
/* Màu nền/viền chỉ xuất hiện ở chế độ tối → đẩy về đen thuần + xám rất tối (OLED tắt hẳn điểm ảnh) */
const AMOLED = {
  '#1e2024': '#0B0B0D', '#2a2d32': '#17181B', '#2b2e33': '#17181B', '#101f26': '#0A0A0C', '#163341': '#22262B',
  '#0a1420': '#000000', '#0e2129': '#0A0A0C', '#122135': '#0A0A0C', '#0a121d': '#000000', '#081217': '#000000',
  '#0c1c24': '#0A0A0C', '#0a1418': '#000000', '#0a181e': '#000000', '#0f232d': '#1A1D21', '#14253c': '#16181C',
  '#142131': '#0A0A0C', '#10181d': '#050506', '#343841': '#1F2125', '#262b33': '#101114', '#303844': '#1B1E23',
  '#343b47': '#1F2227', '#1e2229': '#08080A', '#3c414b': '#24272C', '#262a30': '#101114', '#12000e': '#000000',
};
/* Kết hợp Bánh bèo + AMOLED: đen ngả mận thay vì xám trung tính */
const AMOLED_BB = {
  '#1e2024': '#12080E', '#2a2d32': '#1F0F18', '#2b2e33': '#1F0F18', '#101f26': '#0C0509', '#163341': '#2A1420',
  '#0f232d': '#2A1420', '#14253c': '#220F1A', '#343841': '#2A1722', '#3c414b': '#33202C', '#303844': '#2A1722',
};

const HEX = {
  '#1ab0f5': '#FF6FA8', '#0e8fd0': '#D6418A', '#5cc8fa': '#FF9CC4', '#7fd6ff': '#FFB3D3',
  '#8fd8fb': '#FFB3D3', '#6fcffb': '#FF9CC4', '#559bf7': '#F28CB9', '#63a1f1': '#F28CB9',
  '#60a5fa': '#F28CB9', '#54b9e8': '#FF80B3', '#afe3fb': '#FFC9DE', '#cbeeff': '#FFD9E8',
  '#e5f6fe': '#FFE6F0', '#f0faff': '#FFF0F6', '#e7f1fe': '#FFE9F2', '#f2faff': '#FFF2F8',
  '#d5ebf5': '#F8D5E5', '#101f26': '#2A1B2D', '#163341': '#4A2A48', '#0a181e': '#201424',
  '#14253c': '#3A2440', '#0f232d': '#3A2442', '#dceaf0': '#FFE6F1', '#18313d': '#4A2B3B',
  '#607d8a': '#B58AA2', '#7091a0': '#B58AA2', '#98b9c8': '#E2B5CB', '#384f5a': '#8F6580',
  '#90a6b0': '#C9A0B6', '#d8e6ed': '#F3D6E4',
};
const ACTIVE = theme === 'banhbeo' || amoled;
if (amoled) Object.assign(HEX, AMOLED, theme === 'banhbeo' ? AMOLED_BB : {});
if (theme !== 'banhbeo') {
  /* chủ đề mặc định + AMOLED: chỉ giữ các mục AMOLED, bỏ toàn bộ màu hồng */
  for (const k of Object.keys(HEX)) if (!(k in AMOLED)) delete HEX[k];
}
/* Cùng bảng màu ở dạng rgb()/rgba(): trình duyệt thường chuyển #hex → rgb(r, g, b) khi đọc lại style. */
const hexToTuple = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RGB = new Map();
for (const [from, to] of Object.entries(HEX)) RGB.set(hexToTuple(from).join(','), hexToTuple(to));
/* các tông cyan/xanh dạng rgba có sẵn trong code (không có dạng hex tương ứng) */
if (theme === 'banhbeo') {
  RGB.set('153,221,252', [255, 170, 205]);
  RGB.set('111,207,251', [255, 150, 195]);
  RGB.set('26,176,245', [255, 111, 168]);
  RGB.set('85,155,247', [242, 140, 185]);
}
/* rgba nền thẻ tối dạng (30,32,36) là #1E2024 → đã nằm trong bảng HEX nên tự có ở đây */
const HEX_RE = new RegExp('(' + Object.keys(HEX).join('|') + ')', 'gi');
const RGB_RE = /rgb(a?)\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/gi;
const QUICK = /#[0-9a-f]{6}|rgba?\(/i;

export function recolor(v) {
  if (!ACTIVE || typeof v !== 'string' || !QUICK.test(v)) return v;
  let out = v.replace(HEX_RE, (m) => HEX[m.toLowerCase()] || m);
  out = out.replace(RGB_RE, (m, a, r, g, b) => {
    const t = RGB.get(r + ',' + g + ',' + b);
    return t ? 'rgb' + a + '(' + t[0] + ', ' + t[1] + ', ' + t[2] : m;
  });
  return out;
}

/* Chromium gắn các thuộc tính style.xxx lên TỪNG phần tử (không phải prototype) nên không chặn được setter.
   Thay vào đó: chặn setProperty/setAttribute (prototype) + MutationObserver đọc lại thuộc tính style
   ngay sau khi React gán (microtask → chạy trước lần vẽ, không bị chớp màu xanh). */
function patchProtoSetters() {
  const sp = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function (n, v, p) { return sp.call(this, n, recolor(v), p); };
  const sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) { return sa.call(this, n, typeof v === 'string' ? recolor(v) : v); };
}
function fixInlineStyle(el) {
  if (!el || el.nodeType !== 1) return;
  const s = el.getAttribute && el.getAttribute('style');
  if (s && QUICK.test(s)) { const n = recolor(s); if (n !== s) el.setAttribute('style', n); }
}
function fixTree(root) {
  fixInlineStyle(root);
  if (root.querySelectorAll) root.querySelectorAll('[style]').forEach(fixInlineStyle);
}

/* <style> được code JS tiêm vào (home-screen, dashboard…) và <style> trong index.html */
function recolorStyleEl(el) {
  if (el.tagName !== 'STYLE' || el.dataset.lsBb) return;
  const t = el.textContent;
  const n = recolor(t);
  el.dataset.lsBb = '1';
  if (n !== t) el.textContent = n;
}
function watchStyles() {
  document.querySelectorAll('style').forEach(recolorStyleEl);
  fixTree(document.documentElement);
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'attributes') { fixInlineStyle(m.target); continue; }
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        recolorStyleEl(n);
        fixTree(n);
        if (n.querySelectorAll) n.querySelectorAll('style').forEach(recolorStyleEl);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
}

/* ── Họa tiết SVG bay nhẹ ── */
const SPRITES = {
  bow: '<path d="M12 12c-3-5-8-6-9-3s2 7 9 3zM12 12c3-5 8-6 9-3s-2 7-9 3z" fill="currentColor" opacity=".9"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><path d="M11 14l-3 7M13 14l3 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="currentColor"/>',
  flower: '<g fill="currentColor"><circle cx="12" cy="5.5" r="3.6"/><circle cx="18.2" cy="10" r="3.6"/><circle cx="15.8" cy="17.3" r="3.6"/><circle cx="8.2" cy="17.3" r="3.6"/><circle cx="5.8" cy="10" r="3.6"/></g><circle cx="12" cy="12" r="2.8" fill="#fff" opacity=".85"/>',
  spark: '<path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3z" fill="currentColor"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 9.5a4.2 4.2 0 0 1 .5 8.5z" fill="currentColor"/>',
};
const DECOR = [
  ['bow', 6, 10, 30, '#FF8FBD', 7.5, 0], ['heart', 86, 8, 22, '#FFA3C8', 6, 1.2], ['flower', 90, 34, 28, '#FFB8D4', 9, .6],
  ['spark', 4, 38, 18, '#FFC1DA', 5, 2], ['heart', 8, 62, 20, '#FF9CC4', 7, 1.8], ['cloud', 80, 58, 38, '#FFD3E5', 11, .3],
  ['spark', 92, 78, 16, '#FFB3D3', 5.5, 2.4], ['flower', 5, 86, 26, '#FFB8D4', 9.5, 1], ['bow', 84, 90, 26, '#FF8FBD', 8, 2.1],
];
function mountDecor() {
  if (document.getElementById('ls-bb-decor')) return;
  const box = document.createElement('div');
  box.id = 'ls-bb-decor';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = DECOR.map(([n, x, y, s, c, dur, delay]) =>
    `<svg class="bb-sprite" viewBox="0 0 24 24" width="${s}" height="${s}" style="left:${x}%;top:${y}%;color:${c};animation-duration:${dur}s;animation-delay:-${delay * 3}s">${SPRITES[n]}</svg>`).join('');
  document.body.appendChild(box);
}

function syncThemeColor() {
  /* thanh trạng thái/URL hòa vào nền: đen khi AMOLED + tối */
  const dark = document.documentElement.classList.contains('dark');
  let m = document.querySelector('meta[name="theme-color"]');
  if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
  m.content = dark ? (amoled ? '#000000' : '#12000e') : (theme === 'banhbeo' ? '#FFF3F8' : '#fff5f9');
}

if (amoled) document.documentElement.classList.add('amoled');
if (ACTIVE) { patchProtoSetters(); watchStyles(); }
if (theme === 'banhbeo') {
  document.documentElement.classList.add('theme-bb');
  if (document.body) mountDecor(); else document.addEventListener('DOMContentLoaded', mountDecor);
}
syncThemeColor();
new MutationObserver(syncThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

export function setAmoled(on) {
  try { localStorage.setItem('learnsy_amoled', on ? '1' : '0'); } catch { /* ignore */ }
  location.reload();
}

export function setTheme(name) {
  try { localStorage.setItem(KEY, name === 'banhbeo' ? 'banhbeo' : 'default'); } catch { /* ignore */ }
  location.reload();
}

if (typeof window !== 'undefined') {
  window.LearnsyTheme = { name: theme, set: setTheme, color: recolor, amoled, setAmoled };
}
