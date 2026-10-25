/**
 * story-kit.js — the drawing kit behind the quest story animations (`story-scenes.js`).
 *
 * Everything here is a pure function over a 2D context, so Node can import it (`verify:story` draws every scene on a stub
 * context). SCOURED PLATE: obsidian and titanium, one amber signal, hard-edged shadows, and nothing blooms. Solid things
 * are shaded with a gradient so they read as objects, not as discs; a light is never a glow.
 */

import { mulberry32 } from '../learn/engine/plates.js';

export const C = {
  bg0: '#0c0b09', bg1: '#15130f', rim: '#2e2a26', steel: '#6b625a', dust: '#b8afa0', dim: '#544e46', faint: '#2a2622',
  amber: '#e59b24', text: '#dcd6cc', pale: '#cfc8b8', iron: '#3c3833', green: '#78a142', rust: '#9a4a2e', danger: '#b8382c'
};

/** What each kind of atom is made of, as a lit-from-upper-left matte ball: [base, highlight, edge]. */
export const MATTER = {
  C: ['#4b4741', '#8f887b', '#1d1b18'],
  Na: ['#b4ab97', '#f0eadb', '#4a463d'],
  Cl: ['#5b7a32', '#b4d083', '#233016'],
  O: ['#9a4a2e', '#dd8c6a', '#3b1a10'],
  H: ['#d6cebd', '#fffaf0', '#6a6458'],
  Li: ['#a9a08e', '#e9e2d1', '#46423a'],
  Mg: ['#8b8576', '#d3ccba', '#3a372f'],
  Cl37: ['#3d5a20', '#93b567', '#16210b'],
  proton: ['#e59b24', '#ffd98a', '#6b430a'],
  neutron: ['#a39b8c', '#e4ddcc', '#3f3b34'],
  electron: ['#dcd6cc', '#ffffff', '#6b625a'],
  ingot: ['#8d8579', '#d9d0bd', '#38342d']
};

/** Printed labels are drawn larger when the picture is shown small (a phone), so they stay readable. Reset to 1 when the story closes. */
let labelScale = 1;
export function setLabelScale(k) { labelScale = Math.max(1, Math.min(1.7, Number(k) || 1)); }

export const clamp01 = v => Math.max(0, Math.min(1, v));
/** `t` inside the window [a, b], as 0..1. */
export const win = (t, a, b) => clamp01((t - a) / (b - a));
export const ease = v => v * v * (3 - 2 * v);
export const easeOut = v => 1 - (1 - v) * (1 - v) * (1 - v);
export const lerp = (a, b, v) => a + (b - a) * v;
/** A window that fades in over [a, a+f] and out over [b-f, b]. */
export const pulse = (t, a, b, f = 0.04) => Math.min(win(t, a, a + f), 1 - win(t, b - f, b));

export function alpha(ctx, a, fn) {
  if (a <= 0.001) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * clamp01(a);
  fn();
  ctx.globalAlpha = prev;
}

/** The plate every scene sits on: dark ground, a faint survey grid, registration ticks, a vignette, grain, drifting dust. */
export function plate(ctx, w, h, clock = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, C.bg1);
  g.addColorStop(1, C.bg0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(214, 196, 168, 0.035)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < 16; i++) { ctx.moveTo(Math.round(w * i / 16) + 0.5, 0); ctx.lineTo(Math.round(w * i / 16) + 0.5, h); }
  for (let j = 1; j < 9; j++) { ctx.moveTo(0, Math.round(h * j / 9) + 0.5); ctx.lineTo(w, Math.round(h * j / 9) + 0.5); }
  ctx.stroke();

  // Registration ticks in the four corners, like a survey plate.
  const m = Math.round(w * 0.024);
  const k = Math.round(w * 0.018);
  ctx.strokeStyle = C.rim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.moveTo(x + sx * k, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * k);
  });
  ctx.stroke();

  // Grain: a few hundred still specks, seeded so the plate never shimmers.
  const rand = mulberry32(0x91a);
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = `rgba(220, 210, 190, ${0.015 + rand() * 0.035})`;
    ctx.fillRect(rand() * w, rand() * h, 1.5, 1.5);
  }

  // Dust that drifts across the beam of the lamp, slow, with the real clock.
  for (let i = 0; i < 26; i++) {
    const sp = 0.4 + rand() * 0.9;
    const x = ((rand() * w + clock * 7 * sp) % w + w) % w;
    const y = ((rand() * h - clock * 3 * sp) % h + h) % h;
    ctx.fillStyle = `rgba(220, 206, 176, ${0.07 + rand() * 0.12})`;
    ctx.fillRect(x, y, 1 + rand() * 1.4, 1 + rand() * 1.4);
  }

  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** A table edge to stand things on. */
export function bench(ctx, w, h, y = 0.84) {
  const by = h * y;
  const g = ctx.createLinearGradient(0, by, 0, h);
  g.addColorStop(0, '#26221e');
  g.addColorStop(1, '#14120f');
  ctx.fillStyle = g;
  ctx.fillRect(0, by, w, h - by);
  ctx.fillStyle = C.rim;
  ctx.fillRect(0, by, w, 2);
  ctx.fillStyle = 'rgba(214, 196, 168, 0.07)';
  ctx.fillRect(0, by + 2, w, 1);
}

/** A hard, flat contact shadow: no blur. */
export function contact(ctx, x, y, rx, ry = rx * 0.28, a = 0.5) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.fill();
}

/** A matte ball, lit from the upper left. `kind` is a MATTER key. */
export function ball(ctx, x, y, r, kind = 'C', { shadow = false, rim = true } = {}) {
  const [base, hi, edge] = MATTER[kind] || MATTER.C;
  r = Math.max(0.6, r);
  if (shadow) contact(ctx, x + r * 0.2, y + r * 1.02, r * 0.95, r * 0.26, 0.42);
  const g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.08, x, y, r * 1.02);
  g.addColorStop(0, hi);
  g.addColorStop(0.45, base);
  g.addColorStop(1, edge);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  if (rim && r > 3) { ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1; ctx.stroke(); }
}

/** A thin ring (an orbit, a selection, a lens edge). */
export function ring(ctx, x, y, r, color = C.dim, width = 1, dash = null) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash?.(dash || []);
  ctx.stroke();
  ctx.setLineDash?.([]);
}

export function line(ctx, x0, y0, x1, y1, color = C.dim, width = 1, dash = null) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash?.(dash || []);
  ctx.stroke();
  ctx.setLineDash?.([]);
}

/** A rod joining two points, shaded as a cylinder: a bond. */
export function rod(ctx, x0, y0, x1, y1, width, color = '#8a8274') {
  ctx.lineCap = 'round';
  line(ctx, x0, y0, x1, y1, 'rgba(0,0,0,0.6)', width + 3);
  line(ctx, x0, y0, x1, y1, color, width);
  line(ctx, x0 - width * 0.18, y0 - width * 0.18, x1 - width * 0.18, y1 - width * 0.18, 'rgba(255,250,235,0.35)', Math.max(1, width * 0.28));
  ctx.lineCap = 'butt';
}

export function text(ctx, str, x, y, { size = 26, color = C.dust, align = 'center', weight = 400, track = 0, baseline = 'middle', scale = false } = {}) {
  if (scale) size *= labelScale;
  ctx.font = `${weight} ${Math.round(size)}px Quantico, "JetBrains Mono", monospace`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${track}px`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

/** A printed label on a small plate: a hairline border, a dark well, and one word or two. */
export function tag(ctx, str, x, y, { size = 24, color = C.pale, edge = C.steel, align = 'center', a = 1, fill = 'rgba(12,11,9,0.88)' } = {}) {
  size *= labelScale;
  alpha(ctx, a, () => {
    ctx.font = `400 ${Math.round(size)}px Quantico, "JetBrains Mono", monospace`;
    const tw = ctx.measureText ? (ctx.measureText(str).width || str.length * size * 0.56) : str.length * size * 0.56;
    const pad = size * 0.5;
    const bw = tw + pad * 2;
    const bh = size * 1.7;
    const bx = align === 'left' ? x : align === 'right' ? x - bw : x - bw / 2;
    ctx.fillStyle = fill;
    ctx.fillRect(bx, y - bh / 2, bw, bh);
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, y - bh / 2 + 0.5, bw - 1, bh - 1);
    text(ctx, str, bx + bw / 2, y + 1, { size, color, align: 'center' });
  });
}

/** A line from `from` toward `to`, drawn progressively (`p` 0..1), ending in a dot on the thing it names. */
export function leader(ctx, fx, fy, tx, ty, p, color = C.steel) {
  if (p <= 0) return;
  const x = lerp(tx, fx, clamp01(p));
  const y = lerp(ty, fy, clamp01(p));
  line(ctx, tx, ty, x, y, color, 1.5);
  ctx.beginPath();
  ctx.arc(tx, ty, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/** Four corner brackets around a box: the quiet way to say "this one". */
export function brackets(ctx, x, y, bw, bh, color = C.amber, p = 1, width = 3) {
  if (p <= 0) return;
  const k = Math.min(bw, bh) * 0.22 * clamp01(p);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  [[x, y, 1, 1], [x + bw, y, -1, 1], [x, y + bh, 1, -1], [x + bw, y + bh, -1, -1]].forEach(([cx, cy, sx, sy]) => {
    ctx.moveTo(cx + sx * k, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * k);
  });
  ctx.stroke();
}

/** A beam balance: a bar on a pivot, tilted by `tilt` radians (positive: the right end down), with two pans. Returns the pan centres. */
export function balance(ctx, cx, cy, half, tilt, { pivotX = cx, drop = half * 0.2, pan = half * 0.22, post = true } = {}) {
  const s = Math.sin(tilt);
  const c = Math.cos(tilt);
  const lx = pivotX - (pivotX - (cx - half)) * c;
  const ly = cy - (pivotX - (cx - half)) * s;
  const rx = pivotX + ((cx + half) - pivotX) * c;
  const ry = cy + ((cx + half) - pivotX) * s;
  if (post) {
    const g = ctx.createLinearGradient(pivotX - 10, 0, pivotX + 10, 0);
    g.addColorStop(0, '#2a2622'); g.addColorStop(0.5, '#6b625a'); g.addColorStop(1, '#2a2622');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(pivotX - half * 0.05, cy + half * 0.55);
    ctx.lineTo(pivotX, cy);
    ctx.lineTo(pivotX + half * 0.05, cy + half * 0.55);
    ctx.closePath();
    ctx.fill();
  }
  // The bar.
  ctx.lineCap = 'round';
  line(ctx, lx, ly, rx, ry, '#000', 11);
  line(ctx, lx, ly, rx, ry, '#8a8274', 7);
  line(ctx, lx, ly - 2, rx, ry - 2, 'rgba(255,250,235,0.3)', 2);
  ctx.lineCap = 'butt';
  // The pans hang straight down from the ends.
  [[lx, ly], [rx, ry]].forEach(([x, y]) => {
    line(ctx, x, y, x - pan, y + drop, C.dim, 1.5);
    line(ctx, x, y, x + pan, y + drop, C.dim, 1.5);
    ctx.fillStyle = '#4a453f';
    ctx.fillRect(x - pan * 1.15, y + drop, pan * 2.3, 6);
    ctx.fillStyle = 'rgba(255,250,235,0.18)';
    ctx.fillRect(x - pan * 1.15, y + drop, pan * 2.3, 1.5);
  });
  ctx.beginPath();
  ctx.arc(pivotX, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#b8afa0';
  ctx.fill();
  return { left: { x: lx, y: ly + drop }, right: { x: rx, y: ry + drop }, pan: pan * 1.15 };
}
