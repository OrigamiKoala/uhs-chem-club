/**
 * cutscene/shot.js — the camera, weather and light kit that gives each world's arrival its own look.
 *
 * `kit.js` draws things (people, the lander, props); this file decides how a shot sees them: a camera that pushes,
 * tilts and pans; night as a dark grade with real light shapes cut back into it (lamp cones, light pools, lightning);
 * weather with depth (rain, snow, ash, embers, fog banks); reflections and heat shimmer copied from the frame itself;
 * and the lander flown in different ways (a glide with its shadow racing it, a hover, a docking, a flare and set-down).
 *
 * Everything stays a pure function of scene time. Reflections and shimmer read back the canvas, so they do nothing on
 * the stub context `verify:story` paints on.
 */

import { W, H, TAU, clamp01, lerp, rng, alpha, lander, rgbOf } from './kit.js';

/* ------------------------------------------------------------------ camera */

/** Draw `fn` through a camera centred on world point (cx, cy), zoomed by `z`, rolled by `roll` radians. */
export function camera(ctx, cx, cy, z, fn, roll = 0) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  if (roll) ctx.rotate(roll);
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
  fn();
  ctx.restore();
}

/** A hand-held drift: a small slow wander, as [dx, dy]. */
export function handheld(clock, k = 1) {
  return [
    (Math.sin(clock * 0.9) * 3 + Math.sin(clock * 2.3 + 1) * 1.4) * k,
    (Math.cos(clock * 0.7) * 2.2 + Math.sin(clock * 1.9 + 2) * 1.1) * k
  ];
}

/** Smoothstep. */
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };

/** A point along a polyline `pts` ([[x, y], ...]) at 0..1 of its length. */
export function along(pts, u) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    total += d;
  }
  let want = clamp01(u) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? clamp01(want / seg[i]) : 0;
      return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
    }
    want -= seg[i];
  }
  return pts[pts.length - 1];
}

/* ------------------------------------------------------------------- light */

/** Additive light: whatever `fn` draws brightens what is under it. */
export function light(ctx, fn) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  fn();
  ctx.restore();
}

/** A dark grade over the frame: night, smoke, a hall with the lamps off. */
export function grade(ctx, color, a) {
  if (a <= 0.001) return;
  ctx.fillStyle = `rgba(${color}, ${clamp01(a)})`;
  ctx.fillRect(-W, -H, W * 3, H * 3);
}

/** A flat wedge of light from (x, y) along angle `ang`, `spread` radians either side, fading over `len`. */
export function cone(ctx, x, y, ang, spread, len, color, a) {
  if (a <= 0.001) return;
  const ex = x + Math.cos(ang) * len;
  const ey = y + Math.sin(ang) * len;
  const g = ctx.createLinearGradient(x, y, ex, ey);
  g.addColorStop(0, `rgba(${color}, ${clamp01(a)})`);
  g.addColorStop(0.55, `rgba(${color}, ${clamp01(a * 0.35)})`);
  g.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(ang - spread) * len, y + Math.sin(ang - spread) * len);
  ctx.lineTo(x + Math.cos(ang + spread) * len, y + Math.sin(ang + spread) * len);
  ctx.closePath();
  ctx.fill();
}

/** A pool of light lying on the ground at (x, y): an ellipse flattened by `flat`. */
export function pool(ctx, x, y, rx, color, a, flat = 0.22) {
  if (a <= 0.001 || rx <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, flat);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${color}, ${clamp01(a)})`);
  g.addColorStop(0.5, `rgba(${color}, ${clamp01(a * 0.4)})`);
  g.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

/** A round halo of light in the air around (x, y): a lantern, a lit window, a lamp through fog. */
export function halo(ctx, x, y, r, color, a) {
  pool(ctx, x, y, r, color, a, 1);
}

/** The whole frame lit at once: a lightning flash, a blast. */
export function flash(ctx, a, color = '236, 232, 224') {
  if (a <= 0.001) return;
  ctx.fillStyle = `rgba(${color}, ${clamp01(a)})`;
  ctx.fillRect(-W, -H, W * 3, H * 3);
}

/** A forked lightning bolt from (x, y0) down to y1. */
export function bolt(ctx, seed, x, y0, y1, a) {
  if (a <= 0.01) return;
  const r = rng(seed);
  const draw = (sx, sy, ey, w, depth) => {
    let px = sx;
    let py = sy;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(px, py);
    while (py < ey) {
      py += 14 + r() * 26;
      px += (r() - 0.5) * 40;
      ctx.lineTo(px, Math.min(py, ey));
      if (depth < 2 && r() > 0.86) { ctx.stroke(); draw(px, py, py + 60 + r() * 120, w * 0.5, depth + 1); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(px, py); }
    }
    ctx.stroke();
  };
  ctx.strokeStyle = `rgba(240, 236, 228, ${clamp01(a)})`;
  ctx.lineCap = 'round';
  draw(x, y0, y1, 3, 0);
}

/* ----------------------------------------------------------------- weather */

/** Rain: slanted streaks in two depths, and splashes on the line `ground` (null for none). */
export function rain(ctx, seed, clock, { n = 260, slant = 0.22, a = 0.28, ground = null, color = '200, 206, 210' } = {}) {
  const r = rng(seed);
  ctx.lineCap = 'butt';
  for (const depth of [0.55, 1]) {
    ctx.strokeStyle = `rgba(${color}, ${a * depth})`;
    ctx.lineWidth = depth;
    ctx.beginPath();
    for (let i = 0; i < n / 2; i++) {
      const sp = (900 + r() * 400) * depth;
      const len = 18 + 26 * depth;
      const y = ((r() * (H + 200) + clock * sp) % (H + 200)) - 100;
      const x = ((r() * (W + 300) + y * slant) % (W + 300)) - 150;
      ctx.moveTo(x, y);
      ctx.lineTo(x - slant * len, y - len);
    }
    ctx.stroke();
  }
  if (ground != null) {
    ctx.strokeStyle = `rgba(${color}, ${a * 0.9})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const life = (clock * 3 + r()) % 1;
      const x = r() * W;
      const y = ground + r() * 120;
      const s = 2 + life * 7;
      ctx.moveTo(x - s, y - s * (1 - life) * 0.8);
      ctx.lineTo(x, y);
      ctx.lineTo(x + s, y - s * (1 - life) * 0.8);
    }
    ctx.stroke();
  }
}

/** Snow in three depths, blown by `wind` (px/s) and swaying as it falls. */
export function snow(ctx, seed, clock, { n = 220, wind = -60, fall = 50, a = 0.7, color = '226, 230, 236', size = 2.6 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const d = 0.35 + r() * 0.65;
    const sp = fall * d * (0.7 + r() * 0.6);
    const y = ((r() * (H + 40) + clock * sp) % (H + 40)) - 20;
    const x = ((((r() * (W + 200) + clock * wind * d + Math.sin(clock * 1.3 + i) * 12 * d) % (W + 200)) + (W + 200)) % (W + 200)) - 100;
    const s = size * d * (0.6 + r() * 0.8);
    ctx.fillStyle = `rgba(${color}, ${a * d})`;
    ctx.fillRect(x, y, s, s);
  }
}

/** Ash coming down slowly, grey flakes that tumble. */
export function ash(ctx, seed, clock, { n = 120, a = 0.5, color = '130, 120, 112', wind = 18 } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const d = 0.4 + r() * 0.6;
    const y = ((r() * (H + 40) + clock * 22 * d) % (H + 40)) - 20;
    const x = ((((r() * (W + 100) + clock * wind * d + Math.sin(clock * 0.8 + i * 1.7) * 18) % (W + 100)) + (W + 100)) % (W + 100)) - 50;
    const s = 1.5 + d * 2.5;
    ctx.fillStyle = `rgba(${color}, ${a * d})`;
    ctx.fillRect(x, y, s, s * (0.4 + 0.6 * Math.abs(Math.sin(clock * 3 + i))));
  }
}

/** Embers rising from below `y0`, each burning out as it climbs. */
export function embers(ctx, seed, clock, { n = 50, y0 = H, rise = 260, x0 = 0, x1 = W, a = 0.9, color = '236, 140, 60' } = {}) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const period = 2 + r() * 2.5;
    const life = ((clock + r() * period) % period) / period;
    const x = x0 + r() * (x1 - x0) + Math.sin(clock * 2 + i) * 14 * life;
    const y = y0 - life * rise * (0.6 + r() * 0.8);
    ctx.fillStyle = `rgba(${color}, ${a * (1 - life) * (0.5 + 0.5 * Math.sin(clock * 20 + i))})`;
    ctx.fillRect(x, y, 2, 2);
  }
}

/** A bank of fog: soft puffs drifting along y, `h` deep. */
export function fog(ctx, seed, clock, y, h, { color = '200, 204, 206', a = 0.3, speed = 10, n = 9, x0 = -200, x1 = W + 200 } = {}) {
  if (a <= 0.001) return;
  const r = rng(seed);
  const span = x1 - x0;
  for (let i = 0; i < n; i++) {
    const rx = 180 + r() * 260;
    const x = x0 + ((((r() * span + clock * speed * (0.6 + r() * 0.8)) % span) + span) % span);
    const yy = y + (r() - 0.5) * h;
    ctx.save();
    ctx.translate(x, yy);
    ctx.scale(1, (h / rx) * 0.9 + 0.08);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(${color}, ${a * (0.6 + r() * 0.4)})`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
    ctx.restore();
  }
}

/** A flat layer of haze across the frame from y down to y + h. */
export function veil(ctx, y, h, color, a) {
  if (a <= 0.001) return;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, `rgba(${color}, 0)`);
  g.addColorStop(0.5, `rgba(${color}, ${clamp01(a)})`);
  g.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-W, y, W * 3, h);
}

/**
 * Dust or spray thrown out along the ground from (x, y) by thrust: billows that roll outward and up and thin out.
 * `p` 0..1 is how far the cloud has spread; `k` how thick it is.
 */
export function plume(ctx, seed, x, y, p, k, { color = '170, 160, 146', reach = 420, rise = 90 } = {}) {
  if (k <= 0.01) return;
  const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1;
    const sp = 0.35 + r() * 0.65;
    const d = p * reach * sp;
    const bx = x + side * d;
    const by = y - 6 - p * rise * r() * sp - r() * 10;
    const rad = 16 + p * 70 * (0.5 + r());
    const a = k * (1 - p * 0.7) * (0.25 + r() * 0.2);
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
    g.addColorStop(0, `rgba(${color}, ${clamp01(a)})`);
    g.addColorStop(1, `rgba(${color}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(bx - rad, by - rad, rad * 2, rad * 2);
  }
}

/** Rings spreading on still water from (x, y). */
export function ripples(ctx, x, y, clock, { n = 3, period = 1.6, r = 60, color = '214, 218, 220', a = 0.35, flat = 0.25 } = {}) {
  ctx.lineWidth = 1.2;
  for (let i = 0; i < n; i++) {
    const life = ((clock / period + i / n) % 1);
    ctx.strokeStyle = `rgba(${color}, ${a * (1 - life)})`;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(1, r * life), Math.max(1, r * life * flat), 0, 0, TAU);
    ctx.stroke();
  }
}

/** Frost growing out from (x, y) in branching feathers; `p` 0..1 how far it has spread. */
export function frost(ctx, seed, x, y, rad, p, color = '226, 232, 236') {
  if (p <= 0.01) return;
  const r = rng(seed);
  ctx.strokeStyle = `rgba(${color}, ${0.55 * clamp01(p * 2)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const ang = Math.PI + (i / 8) * Math.PI + (r() - 0.5) * 0.3;
    const len = rad * p * (0.6 + r() * 0.4);
    const ex = x + Math.cos(ang) * len * 1.8;
    const ey = y + Math.sin(ang) * len * 0.35;
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    for (let j = 1; j < 6; j++) {
      const u = j / 6;
      const bx = lerp(x, ex, u);
      const by = lerp(y, ey, u);
      const bl = len * 0.25 * (1 - u);
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang - 0.7) * bl, by + Math.sin(ang - 0.7) * bl * 0.4);
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang + 0.7) * bl, by + Math.sin(ang + 0.7) * bl * 0.4);
    }
  }
  ctx.stroke();
}

/* ----------------------------------------------------- frame read-backs */

/** The canvas's pixels per scene unit, or 0 where there is no real canvas to read back (the verify stub). */
function readScale(ctx) {
  const cv = ctx.canvas;
  return cv && typeof cv.width === 'number' && cv.width > 0 ? cv.width / W : 0;
}

/**
 * Still water from screen y0 to y0 + h: the frame above it copied upside down, broken into rows that wave sideways,
 * darkened and tinted toward `tint`. Call it after everything that should show in the water is drawn.
 */
export function reflect(ctx, y0, h, clock, { a = 0.55, tint = '20, 24, 28', ripple = 3, row = 3, x0 = 0, x1 = W } = {}) {
  const k = readScale(ctx);
  if (!k) return;
  const cv = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = a;
  for (let y = 0; y < h; y += row) {
    const src = y0 - y - row;
    if (src < 0) break;
    const dx = Math.sin(y * 0.35 + clock * 2.4) * ripple * (0.3 + y / h);
    ctx.drawImage(cv, x0 * k, src * k, (x1 - x0) * k, row * k, (x0 + dx) * k, (y0 + y) * k, (x1 - x0) * k, row * k);
  }
  ctx.restore();
  const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, `rgba(${tint}, 0.35)`);
  g.addColorStop(1, `rgba(${tint}, 0.85)`);
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, x1 - x0, h);
}

/** Heat shimmer: the band y0..y1 of the frame redrawn with each row shifted a little, as hot air bends light. */
export function shimmer(ctx, y0, y1, clock, amp = 2.5, x0 = 0, x1 = W) {
  const k = readScale(ctx);
  if (!k || amp <= 0.05) return;
  const cv = ctx.canvas;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let y = y0; y < y1; y += 4) {
    const fade = Math.sin(((y - y0) / (y1 - y0)) * Math.PI);
    const dx = Math.sin(y * 0.18 + clock * 7) * amp * fade + Math.sin(y * 0.05 - clock * 3) * amp * 0.5 * fade;
    ctx.drawImage(cv, x0 * k, y * k, (x1 - x0) * k, 4 * k, (x0 + dx) * k, y * k, (x1 - x0) * k, 4 * k);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------- craft */

/**
 * The lander flown: drawn standing at (x, y) but rotated by `tilt` about its middle, burners at `thrust`, ramp at
 * `ramp`; `lamps` 0..1 lights its landing lamps, a pair of cones down and forward.
 */
export function craft(ctx, x, y, s, { tilt = 0, thrust = 0, ramp = 0, lamps = 0, clock = 0, lampColor = '240, 226, 196' } = {}) {
  const L = 260 * s;
  ctx.save();
  ctx.translate(x, y - L * 0.2);
  ctx.rotate(tilt);
  lander(ctx, 0, L * 0.2, s, { ramp, thrust, clock });
  ctx.restore();
  craftLamps(ctx, x, y, s, tilt, lamps, lampColor);
}

/**
 * Only the lander's landing lamps: two cones and the lamp faces. Draw it again after a night grade so the lamps
 * light the air and the ground instead of being darkened with them.
 */
export function craftLamps(ctx, x, y, s, tilt, k, color = '240, 226, 196') {
  if (k <= 0.01) return;
  const L = 260 * s;
  ctx.save();
  ctx.translate(x, y - L * 0.2);
  ctx.rotate(tilt);
  light(ctx, () => {
    cone(ctx, L * 0.3, L * 0.1, Math.PI * 0.42, 0.22, L * 2.6, color, 0.16 * k);
    cone(ctx, -L * 0.25, L * 0.12, Math.PI * 0.55, 0.18, L * 2.2, color, 0.1 * k);
  });
  ctx.fillStyle = `rgba(${color}, ${0.9 * k})`;
  ctx.fillRect(L * 0.28, L * 0.04, 6 * s, 4 * s);
  ctx.fillRect(-L * 0.27, L * 0.06, 6 * s, 4 * s);
  ctx.restore();
}

/** A hand-held device's screen at (x, y), w x h, framed; `fn` draws inside it in screen-local coordinates. */
export function device(ctx, x, y, w, h, a, fn) {
  if (a <= 0.01) return;
  alpha(ctx, a, () => {
    ctx.fillStyle = '#0c0b09';
    ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
    ctx.strokeStyle = '#544e46';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.translate(x, y);
    fn();
    ctx.restore();
  });
}

/** The lander's shadow on flat ground at y, thrown from x by a light at `ld` (-1 left .. 1 right) for height `alt`. */
export function craftShadow(ctx, x, y, s, alt, ld = -1, a = 0.5) {
  const L = 260 * s;
  const off = -ld * alt * 0.45;
  const blur = 1 + alt / 300;
  ctx.fillStyle = `rgba(0, 0, 0, ${clamp01(a / blur)})`;
  ctx.beginPath();
  ctx.ellipse(x + off, y, L * 0.5 * blur, L * 0.05 * blur, 0, 0, TAU);
  ctx.fill();
}

/* --------------------------------------------------------------- small aids */

/** A colour string 'r, g, b' from a hex. */
export const rgbStr = hex => rgbOf(hex).join(', ');

/** Draw `fn` faded toward the air: far figures and props sit back in the haze. */
export function far(ctx, a, fn) { alpha(ctx, a, fn); }

/** A ground plane seen in perspective from the horizon at hy to the bottom of the frame, banded toward the horizon. */
export function plane(ctx, hy, near, farC, bands = 0, bandColor = 'rgba(0, 0, 0, 0.08)') {
  const g = ctx.createLinearGradient(0, hy, 0, H);
  g.addColorStop(0, farC);
  g.addColorStop(1, near);
  ctx.fillStyle = g;
  ctx.fillRect(-W, hy, W * 3, H - hy + H);
  if (bands) {
    ctx.fillStyle = bandColor;
    for (let i = 1; i <= bands; i++) {
      const u = i / bands;
      const y = hy + (H - hy) * u * u;
      ctx.fillRect(-W, y, W * 3, Math.max(1, u * 3));
    }
  }
}

/* ------------------------------------------------------------ story props */

/** A ship running with no lights: a dark hull that shows only where it hides what is behind it. */
export function darkShip(ctx, x, y, s, rim = 0) {
  ctx.fillStyle = '#050608';
  ctx.beginPath();
  ctx.moveTo(x - 170 * s, y + 8 * s); ctx.lineTo(x - 120 * s, y - 16 * s); ctx.lineTo(x + 110 * s, y - 22 * s);
  ctx.lineTo(x + 190 * s, y); ctx.lineTo(x + 110 * s, y + 22 * s); ctx.lineTo(x - 140 * s, y + 26 * s);
  ctx.closePath();
  ctx.fill();
  if (rim > 0.01) {
    ctx.strokeStyle = `rgba(240, 226, 196, ${0.5 * rim})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 140 * s, y + 26 * s); ctx.lineTo(x + 110 * s, y + 22 * s); ctx.lineTo(x + 190 * s, y); ctx.stroke();
  }
}

/** The survey hand's gloved forearm reaching in from (x0, y0) to a hand at (x, y). */
export function glove(ctx, x0, y0, x, y, s = 1) {
  ctx.strokeStyle = '#3c3833';
  ctx.lineWidth = 34 * s;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
  ctx.strokeStyle = '#5b554c';
  ctx.lineWidth = 6 * s;
  ctx.beginPath(); ctx.moveTo(x0 - 8 * s, y0 - 10 * s); ctx.lineTo(x - 8 * s, y - 12 * s); ctx.stroke();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath(); ctx.ellipse(x, y, 30 * s, 22 * s, -0.3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#26221e';
  for (let i = 0; i < 4; i++) ctx.fillRect(x - 26 * s + i * 13 * s, y - 30 * s, 10 * s, 18 * s);
}

/** A short burst of sparks at (x, y), fresh every few frames. */
export function burst(ctx, seed, x, y, a, n = 8) {
  if (a <= 0.01) return;
  const r = rng(seed);
  ctx.strokeStyle = `rgba(255, 214, 150, ${clamp01(a)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const ang = r() * TAU;
    const l = 8 + r() * 26;
    ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * l, y + Math.sin(ang) * l + l * 0.3);
  }
  ctx.stroke();
}

export { W, H, TAU, clamp01, lerp, rng, alpha };
