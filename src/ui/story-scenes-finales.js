/**
 * story-scenes-finales.js — the boss finales of Lanternfall, Ligar, Bellows and Ember Reach, and two benches that outgrew their first drawing.
 *
 * Same contract as `story-scenes.js` (a pure function of `t`, one phase for each line of Vess in `story/quest-story.js`), drawn straight on
 * the 1280 x 720 plate with the kit. A boss finale has one shape, as the Hopper's does: the machine lights bench by bench
 * (0 to .25), settles (.25 to .5), gives up what it was keeping (.5 to .75), and the find goes into the Case File (.75 to .92). The
 * line filed to the case runs from there to the end, over the brackets.
 *
 * These replace the first drawings of `eater-lens`, `warden-cut`, `warm-cylinder`, `crucible-open`, `beam-dim` and `magnet-pull` in the
 * world files; the old painters are kept in `archive/2026-10-25/`.
 *
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import { mulberry32 } from '../learn/engine/plates.js';
import { planAbsorb, wavelengthRgb } from '../learn/engine/lightdata.js';
import {
  C, clamp01, win, ease, easeOut, lerp, alpha, plate, bench, contact, ball, ring, line, rod, text, tag, leader, brackets
} from './story-kit.js';

const TAU = Math.PI * 2;
const GY = 0.82;
const between = (t, a, b, f = 0.03) => win(t, a, a + f) * (1 - win(t, b - f, b));
const since = (t, a, f = 0.03) => win(t, a, a + f);
const css = rgb => (rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : C.pale);

/** How lit each of the five benches is: one after another, then cold once the machine settles. */
const lights = t => [0, 1, 2, 3, 4].map(i => ease(win(t, 0.02 + i * 0.045, 0.06 + i * 0.045)) * (1 - ease(win(t, 0.25, 0.32))));

/** A flat slab of hardware, lit from the top left, edged in amber while its bench is lit. */
function slab(ctx, x, y, bw, bh, on, shade = 1, tone = [78, 72, 64]) {
  const g = ctx.createLinearGradient(x, y, x + bw, y + bh);
  g.addColorStop(0, `rgb(${Math.round(tone[0] * shade)},${Math.round(tone[1] * shade)},${Math.round(tone[2] * shade)})`);
  g.addColorStop(1, `rgb(${Math.round(tone[0] * shade * 0.46)},${Math.round(tone[1] * shade * 0.46)},${Math.round(tone[2] * shade * 0.46)})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = 'rgba(255,250,235,0.1)';
  ctx.fillRect(x, y, bw, 2);
  ctx.strokeStyle = on > 0.02 ? `rgba(229,155,36,${0.35 + on * 0.65})` : 'rgba(0,0,0,0.6)';
  ctx.lineWidth = on > 0.02 ? 3 : 2;
  ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
}

/** The five names a boss's benches go by, hung on their parts. Each: [name, labelX, labelY, partX, partY] in fractions. */
function callouts(ctx, w, h, t, list) {
  list.forEach(([name, px, py, tx, ty], i) => {
    const a = since(t, 0.03 + i * 0.045, 0.02) * (1 - win(t, 0.25, 0.29));
    leader(ctx, w * px, h * py, w * tx, h * ty, a, C.steel);
    tag(ctx, name, w * px, h * py, { size: 26, a, color: C.text, edge: C.amber });
  });
}

/** Whatever the machine fell into: grains, in the colour of the place. */
function rubble(ctx, w, h, t, cx, spread, [r, g, b], seed, a0 = 0.3, a1 = 0.5, count = 420, size = 6) {
  const rand = mulberry32(seed);
  const n = Math.round(easeOut(win(t, a0, a1)) * count);
  for (let i = 0; i < n; i++) {
    const ang = rand() * TAU;
    const rr = Math.sqrt(rand()) * spread;
    const top = Math.max(0, 1 - rr / spread);
    const x = cx + Math.cos(ang) * rr;
    const y = h * GY - 4 - rand() * h * 0.11 * top - Math.abs(Math.sin(ang)) * 6 * (1 - top);
    const k = 0.62 + rand() * 0.55;
    ctx.fillStyle = `rgb(${Math.round(r * k)},${Math.round(g * k)},${Math.round(b * k)})`;
    ctx.fillRect(x, y, 3 + rand() * size, 3 + rand() * size * 0.7);
  }
}

/** The Case File, standing open: the back and tab first, the front over whatever slides in. */
function fileBack(ctx, fx, fy, a) {
  alpha(ctx, a, () => {
    const g = ctx.createLinearGradient(0, fy - 120, 0, fy + 110);
    g.addColorStop(0, '#34302a'); g.addColorStop(1, '#201d19');
    ctx.fillStyle = g;
    ctx.fillRect(fx - 160, fy - 120, 320, 230);
    ctx.fillStyle = '#3c3833';
    ctx.fillRect(fx - 160, fy - 152, 180, 34);
    ctx.strokeStyle = C.steel;
    ctx.lineWidth = 1;
    ctx.strokeRect(fx - 159.5, fy - 119.5, 319, 229);
    ctx.strokeRect(fx - 159.5, fy - 151.5, 179, 33);
    text(ctx, 'Case File', fx - 70, fy - 134, { size: 22, color: C.pale, scale: true });
  });
}
function fileFront(ctx, fx, fy, a) {
  alpha(ctx, a, () => {
    const g = ctx.createLinearGradient(0, fy - 20, 0, fy + 110);
    g.addColorStop(0, '#3c3833'); g.addColorStop(1, '#26221e');
    ctx.fillStyle = g;
    ctx.fillRect(fx - 160, fy - 8, 320, 118);
    ctx.fillStyle = 'rgba(214,196,168,0.12)';
    ctx.fillRect(fx - 160, fy - 8, 320, 2);
    ctx.strokeStyle = C.steel;
    ctx.lineWidth = 1;
    ctx.strokeRect(fx - 159.5, fy - 7.5, 319, 117);
  });
}

/** Run a part with the sink and kick a machine takes as it settles. */
function settled(ctx, id, settle, w, h, mode, fn) {
  const sink = easeOut(settle);
  const off = mode === 'split' ? 0 : sink * (h * 0.08 + id * h * 0.02);
  const kick = mode === 'split' ? 0 : (id % 2 ? 1 : -1) * sink * w * 0.02 * (id + 1) * 0.5;
  ctx.save();
  ctx.translate(kick, off);
  fn();
  ctx.restore();
}

function machineClip(ctx, w, h, fn) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h * GY + 3);
  ctx.clip();
  fn();
  ctx.restore();
}

/* ====================================================================================================================
   boss-eater — the Lantern-Eater settles into ice and leaves a ground lens, its focus beyond the violet end
   ==================================================================================================================== */

function eaterBody(ctx, w, h, lit, settle, cx) {
  const gy = h * GY;
  contact(ctx, cx, gy + 4, w * 0.3, 18, 0.5 * (1 - settle * 0.5));
  const ice = [92, 108, 122];
  // 3: a spectrum, the housing
  settled(ctx, 3, settle, w, h, 'sink', () => {
    slab(ctx, cx - w * 0.12, h * 0.3, w * 0.24, h * 0.32, lit[3], 1, ice);
    for (let i = 0; i < 4; i++) line(ctx, cx - w * 0.12 + 14, h * 0.34 + i * h * 0.07, cx + w * 0.12 - 14, h * 0.34 + i * h * 0.07, 'rgba(0,0,0,0.25)', 2);
  });
  // legs
  settled(ctx, 4, settle, w, h, 'sink', () => {
    slab(ctx, cx - w * 0.1, h * 0.62, w * 0.04, h * 0.2, lit[3], 0.8, ice);
    slab(ctx, cx + w * 0.06, h * 0.62, w * 0.04, h * 0.2, lit[3], 0.8, ice);
  });
  // 4: a beam, the horn on top
  settled(ctx, 0, settle, w, h, 'sink', () => {
    ctx.fillStyle = '#56626c';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.13, h * 0.1);
    ctx.lineTo(cx + w * 0.13, h * 0.1);
    ctx.lineTo(cx + w * 0.06, h * 0.3);
    ctx.lineTo(cx - w * 0.06, h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = lit[4] > 0.02 ? `rgba(229,155,36,${0.35 + lit[4] * 0.65})` : 'rgba(0,0,0,0.6)';
    ctx.lineWidth = lit[4] > 0.02 ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,235,0.14)';
    ctx.fillRect(cx - w * 0.13, h * 0.1, w * 0.26, 4);
  });
  // 1: a photon, the eye
  settled(ctx, 1, settle, w, h, 'sink', () => {
    ball(ctx, cx, h * 0.46, h * 0.085, 'ingot', { rim: true });
    ring(ctx, cx, h * 0.46, h * 0.095, lit[1] > 0.02 ? `rgba(229,155,36,${0.35 + lit[1] * 0.65})` : 'rgba(0,0,0,0.6)', lit[1] > 0.02 ? 4 : 2);
    ball(ctx, cx, h * 0.46, h * 0.035, 'electron', { rim: false });
  });
  // 0: a line, the prism box
  settled(ctx, 2, settle, w, h, 'sink', () => {
    slab(ctx, cx - w * 0.25, h * 0.38, w * 0.1, h * 0.15, lit[0], 0.9, ice);
    ctx.fillStyle = 'rgba(180,200,220,0.35)';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.235, h * 0.5); ctx.lineTo(cx - w * 0.2, h * 0.41); ctx.lineTo(cx - w * 0.165, h * 0.5);
    ctx.closePath(); ctx.fill();
    line(ctx, cx - w * 0.15, h * 0.45, cx - w * 0.12, h * 0.45, '#8a8274', 6);
  });
  // 2: a magnet, the coil box
  settled(ctx, 2, settle, w, h, 'sink', () => {
    slab(ctx, cx + w * 0.15, h * 0.38, w * 0.1, h * 0.15, lit[2], 0.9, ice);
    for (let i = 0; i < 5; i++) line(ctx, cx + w * 0.16, h * 0.4 + i * h * 0.025, cx + w * 0.24, h * 0.4 + i * h * 0.025, '#9a6a2a', 4);
    line(ctx, cx + w * 0.12, h * 0.45, cx + w * 0.15, h * 0.45, '#8a8274', 6);
  });
}

function eaterLens(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  bench(ctx, w, h, GY);
  const cx = w * 0.4;
  const lit = lights(t);
  const settle = win(t, 0.27, 0.46);
  const bodyA = 1 - win(t, 0.44, 0.52);
  if (bodyA > 0) machineClip(ctx, w, h, () => alpha(ctx, bodyA, () => eaterBody(ctx, w, h, lit, settle, cx)));
  callouts(ctx, w, h, t, [
    ['a line', 0.08, 0.2, 0.4 - 0.22, 0.46], ['a photon', 0.7, 0.2, 0.4, 0.46], ['a magnet', 0.74, 0.44, 0.4 + 0.2, 0.46],
    ['a spectrum', 0.1, 0.68, 0.4 - 0.1, 0.5], ['a beam', 0.56, 0.06, 0.4 + 0.05, 0.2]
  ]);

  // The shards of cold ice it settles into.
  const rand = mulberry32(0x77e);
  const n = Math.round(easeOut(win(t, 0.3, 0.5)) * 36);
  for (let i = 0; i < n; i++) {
    const x = cx + (rand() - 0.5) * w * 0.4;
    const hh = 10 + rand() * 30;
    const wd = 8 + rand() * 18;
    const y = h * GY - 2;
    ctx.fillStyle = `rgba(${150 + Math.round(rand() * 60)},${180 + Math.round(rand() * 50)},${200 + Math.round(rand() * 40)},0.85)`;
    ctx.beginPath();
    ctx.moveTo(x - wd / 2, y); ctx.lineTo(x - wd * 0.1, y - hh); ctx.lineTo(x + wd / 2, y);
    ctx.closePath(); ctx.fill();
  }
  tag(ctx, 'cold ice', cx + w * 0.26, h * 0.76, { size: 26, a: since(t, 0.38) * (1 - win(t, 0.5, 0.54)) });

  // The lens comes up out of the ice, and the band of light it was ground for is laid beside it.
  const up = ease(win(t, 0.5, 0.62));
  const toFile = ease(win(t, 0.77, 0.86));
  const fx = w * 0.79;
  const fy = h * 0.6;
  fileBack(ctx, fx, fy, ease(win(t, 0.74, 0.8)));
  if (up > 0) {
    const lx = lerp(cx, fx, toFile);
    const ly = lerp(lerp(h * 0.78, h * 0.4, up), fy - 10, toFile);
    const r = lerp(0.4, 1, up) * h * 0.13 * lerp(1, 0.5, toFile);
    // A polished disc of fluorite: pale glass, a bright rim, a reflection.
    const g = ctx.createRadialGradient(lx - r * 0.35, ly - r * 0.4, r * 0.1, lx, ly, r);
    g.addColorStop(0, '#f6f4ee'); g.addColorStop(0.5, '#b8c8d2'); g.addColorStop(1, '#4a5a66');
    ctx.beginPath(); ctx.arc(lx, ly, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ring(ctx, lx, ly, r, '#0c0b09', 3);
    ring(ctx, lx, ly, r * 0.8, 'rgba(255,255,255,0.35)', 2);
    ctx.beginPath(); ctx.arc(lx, ly, r * 0.62, Math.PI * 1.1, Math.PI * 1.6); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.stroke();
    if (toFile < 0.05) contact(ctx, lx, ly + r + 12, r * 0.9, 10, 0.4 * up);
    tag(ctx, 'fluorite lens', lx, ly - r - 40, { size: 26, color: C.amber, edge: C.amber, a: since(t, 0.54) * (1 - win(t, 0.76, 0.8)) });

    // The visible band, and the dark beyond its violet end that the lens is ground for.
    const bandA = ease(win(t, 0.6, 0.7)) * (1 - win(t, 0.76, 0.8));
    alpha(ctx, bandA, () => {
      const bx = w * 0.64;
      const bw = w * 0.3;
      const by = h * 0.42;
      for (let i = 0; i < 48; i++) {
        ctx.fillStyle = css(wavelengthRgb(380 + (i / 48) * 370));
        ctx.fillRect(bx + (i / 48) * bw, by, bw / 48 + 1, h * 0.07);
      }
      ctx.fillStyle = 'rgba(8,7,6,0.8)';
      ctx.fillRect(bx - w * 0.1, by, w * 0.1, h * 0.07);
      line(ctx, bx, by - 14, bx, by + h * 0.07 + 14, C.amber, 3, [6, 6]);
      tag(ctx, 'beyond violet', bx - w * 0.05, by + h * 0.07 + 48, { size: 22, color: C.amber, edge: C.amber });
      tag(ctx, 'what the eye sees', bx + bw / 2, by + h * 0.07 + 48, { size: 22 });
    });
    tag(ctx, 'no guild lamp gives it', w * 0.78, h * 0.3, { size: 24, a: ease(win(t, 0.68, 0.74)) * (1 - win(t, 0.76, 0.8)) });
  }
  fileFront(ctx, fx, fy, ease(win(t, 0.74, 0.8)));

  // Across the fog: a lattice of Ligar, held by pairs of electrons.
  const na = ease(win(t, 0.8, 0.88));
  if (na > 0) {
    const gx = w * 0.15;
    const gy = h * 0.2;
    const s = h * 0.1;
    alpha(ctx, na, () => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        if (i < 3) rod(ctx, gx + i * s, gy + j * s, gx + (i + 1) * s, gy + j * s, 5, '#6b625a');
        if (j < 3) rod(ctx, gx + i * s, gy + j * s, gx + i * s, gy + (j + 1) * s, 5, '#6b625a');
      }
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) ball(ctx, gx + i * s, gy + j * s, h * (((i + j) % 2) ? 0.026 : 0.036), ((i + j) % 2) ? 'Cl' : 'Na', { shadow: false });
      tag(ctx, 'the lattices of Ligar', gx + 1.5 * s, gy + 3 * s + 70, { size: 24 });
    });
  }
  const f = ease(win(t, 0.92, 0.98));
  if (f > 0) brackets(ctx, fx - 176, fy - 166, 352, 290, C.amber, f, 4);
}

/* ====================================================================================================================
   boss-warden — the Basalt Warden settles into quarry stone; the slab behind it is cut clean through
   ==================================================================================================================== */

function wardenBody(ctx, w, h, lit, settle, cx) {
  const gy = h * GY;
  contact(ctx, cx, gy + 4, w * 0.28, 18, 0.5 * (1 - settle * 0.5));
  const rock = [70, 66, 60];
  const joints = (x, y, bw, bh, n) => { for (let i = 1; i < n; i++) line(ctx, x + (bw * i) / n, y + 2, x + (bw * i) / n, y + bh - 2, 'rgba(0,0,0,0.35)', 2); };
  // 0: a salt, the legs
  settled(ctx, 0, settle, w, h, 'sink', () => {
    slab(ctx, cx - w * 0.1, h * 0.58, w * 0.07, h * 0.24, lit[0], 0.85, rock); joints(cx - w * 0.1, h * 0.58, w * 0.07, h * 0.24, 3);
    slab(ctx, cx + w * 0.03, h * 0.58, w * 0.07, h * 0.24, lit[0], 0.85, rock); joints(cx + w * 0.03, h * 0.58, w * 0.07, h * 0.24, 3);
  });
  // 1: a drawing, the torso
  settled(ctx, 1, settle, w, h, 'sink', () => {
    slab(ctx, cx - w * 0.13, h * 0.32, w * 0.26, h * 0.27, lit[1], 1, rock); joints(cx - w * 0.13, h * 0.32, w * 0.26, h * 0.27, 6);
  });
  // 2: a shape, the left arm
  settled(ctx, 2, settle, w, h, 'sink', () => {
    slab(ctx, cx - w * 0.22, h * 0.34, w * 0.08, h * 0.28, lit[2], 0.9, rock); joints(cx - w * 0.22, h * 0.34, w * 0.08, h * 0.28, 3);
  });
  // 3: a field, the right arm
  settled(ctx, 3, settle, w, h, 'sink', () => {
    slab(ctx, cx + w * 0.14, h * 0.34, w * 0.08, h * 0.28, lit[3], 0.9, rock); joints(cx + w * 0.14, h * 0.34, w * 0.08, h * 0.28, 3);
  });
  // 4: a magnet, the head
  settled(ctx, 4, settle, w, h, 'sink', () => {
    slab(ctx, cx - w * 0.06, h * 0.17, w * 0.12, h * 0.14, lit[4], 1.05, rock);
    ctx.fillStyle = '#0c0b09';
    ctx.fillRect(cx - w * 0.04, h * 0.22, w * 0.03, 8);
    ctx.fillRect(cx + w * 0.01, h * 0.22, w * 0.03, 8);
  });
}

function wardenCut(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  bench(ctx, w, h, GY);
  const cx = w * 0.3;
  const lit = lights(t);
  const settle = win(t, 0.27, 0.46);
  const bodyA = 1 - win(t, 0.44, 0.52);
  if (bodyA > 0) machineClip(ctx, w, h, () => alpha(ctx, bodyA, () => wardenBody(ctx, w, h, lit, settle, cx)));
  callouts(ctx, w, h, t, [
    ['a salt', 0.07, 0.7, 0.3 - 0.07, 0.7], ['a drawing', 0.62, 0.22, 0.3, 0.42], ['a shape', 0.07, 0.3, 0.3 - 0.18, 0.46],
    ['a field', 0.62, 0.5, 0.3 + 0.17, 0.48], ['a magnet', 0.62, 0.08, 0.3, 0.24]
  ]);
  rubble(ctx, w, h, t, cx, w * 0.2, [96, 90, 82], 0x77a, 0.3, 0.5, 300, 12);
  tag(ctx, 'quarry stone', cx + w * 0.2, h * 0.75, { size: 26, a: since(t, 0.38) * (1 - win(t, 0.5, 0.54)) });

  // The slab behind it: ionic rock over covalent rock, and one straight cut through both.
  const sa = ease(win(t, 0.5, 0.58));
  const toFile = ease(win(t, 0.77, 0.86));
  const fx = w * 0.79;
  const fy = h * 0.6;
  fileBack(ctx, fx, fy, ease(win(t, 0.74, 0.8)));
  if (sa > 0) {
    const sw = lerp(w * 0.34, w * 0.17, toFile);
    const sh = lerp(h * 0.55, h * 0.19, toFile);
    const sx = lerp(w * 0.5, fx - sw / 2, toFile);
    const sy = lerp(h * 0.18, fy - 36, toFile);
    ctx.save();
    ctx.translate(sx, sy);
    const open = ease(win(t, 0.58, 0.7));
    // Two halves, split along one straight line: the upper left slides up and away by a hair.
    const half = (dx, dy, clip) => {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.beginPath(); clip(); ctx.clip();
      const gu = ctx.createLinearGradient(0, 0, sw, sh);
      gu.addColorStop(0, '#6a655b'); gu.addColorStop(1, '#3a362f');
      ctx.fillStyle = gu; ctx.fillRect(0, 0, sw, sh * 0.5);
      const gl = ctx.createLinearGradient(0, 0, sw, sh);
      gl.addColorStop(0, '#4f4a43'); gl.addColorStop(1, '#2a2723');
      ctx.fillStyle = gl; ctx.fillRect(0, sh * 0.5, sw, sh * 0.5);
      // Grain of the two kinds of rock.
      const r = mulberry32(0x77c);
      for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(220,210,190,${0.05 + r() * 0.08})`; ctx.fillRect(r() * sw, r() * sh * 0.5, 4 + r() * 8, 3 + r() * 5); }
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.12})`; ctx.fillRect(r() * sw, sh * 0.5 + r() * sh * 0.5, 6 + r() * 14, 2); }
      line(ctx, 0, sh * 0.5, sw, sh * 0.5, 'rgba(0,0,0,0.5)', 3);
      ctx.restore();
    };
    half(-open * sw * 0.012, -open * sh * 0.016, () => { ctx.moveTo(0, 0); ctx.lineTo(sw, 0); ctx.lineTo(sw, sh * 0.08); ctx.lineTo(0, sh * 0.92); ctx.closePath(); });
    half(open * sw * 0.012, open * sh * 0.016, () => { ctx.moveTo(sw, sh * 0.08); ctx.lineTo(sw, sh); ctx.lineTo(0, sh); ctx.lineTo(0, sh * 0.92); ctx.closePath(); });
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.strokeRect(0.5, 0.5, sw - 1, sh - 1);
    ctx.restore();
    if (toFile < 0.1) {
      tag(ctx, 'ionic rock', sx + sw * 0.5, sy - 38, { size: 22, a: since(t, 0.6) * (1 - win(t, 0.76, 0.8)) });
      tag(ctx, 'covalent rock', sx + sw * 0.5, sy + sh + 40, { size: 22, a: since(t, 0.62) * (1 - win(t, 0.76, 0.8)) });
      tag(ctx, 'cut clean through', sx - w * 0.12, sy + sh * 0.5, { size: 24, color: C.amber, edge: C.amber, a: since(t, 0.66) * (1 - win(t, 0.76, 0.8)) });
    }
  }
  fileFront(ctx, fx, fy, ease(win(t, 0.74, 0.8)));
  const f = ease(win(t, 0.92, 0.98));
  if (f > 0) brackets(ctx, fx - 176, fy - 166, 352, 290, C.amber, f, 4);
}

/* ====================================================================================================================
   boss-compressor — the Compressor stands cold; in its vault a sealed cylinder has held one pressure for twelve days
   ==================================================================================================================== */

function compressorBody(ctx, w, h, lit, settle, cx) {
  const gy = h * GY;
  contact(ctx, cx, gy + 4, w * 0.3, 18, 0.5);
  const steel = [86, 84, 80];
  // The long cylinder body, rounded, lying across the deck.
  const body = (x, y, bw, bh, on, shade = 1) => {
    const g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0, `rgb(${Math.round(120 * shade)},${Math.round(116 * shade)},${Math.round(108 * shade)})`);
    g.addColorStop(0.5, `rgb(${Math.round(78 * shade)},${Math.round(74 * shade)},${Math.round(68 * shade)})`);
    g.addColorStop(1, `rgb(${Math.round(30 * shade)},${Math.round(28 * shade)},${Math.round(26 * shade)})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, bw, bh, bh / 2) : ctx.rect(x, y, bw, bh);
    ctx.fill();
    ctx.strokeStyle = on > 0.02 ? `rgba(229,155,36,${0.35 + on * 0.65})` : 'rgba(0,0,0,0.6)';
    ctx.lineWidth = on > 0.02 ? 3 : 2;
    ctx.stroke();
  };
  // 0: a piston, the cylinder and rod
  settled(ctx, 0, settle, w, h, 'cool', () => {
    body(cx - w * 0.28, h * 0.5, w * 0.2, h * 0.14, lit[0]);
    line(ctx, cx - w * 0.08, h * 0.57, cx + w * 0.02, h * 0.57, '#a59c8c', 10);
    slab(ctx, cx - w * 0.3, h * 0.46, w * 0.03, h * 0.22, lit[0], 0.8, steel);
  });
  // 1: a heater, the coil box on top
  settled(ctx, 1, settle, w, h, 'cool', () => {
    slab(ctx, cx - w * 0.12, h * 0.26, w * 0.14, h * 0.17, lit[1], 1, steel);
    for (let i = 0; i < 5; i++) line(ctx, cx - w * 0.105, h * 0.285 + i * h * 0.025, cx - w * 0.015, h * 0.285 + i * h * 0.025, '#9a6a2a', 4);
    line(ctx, cx - w * 0.05, h * 0.43, cx - w * 0.05, h * 0.5, '#8a8274', 7);
  });
  // 2: a count, the round tank
  settled(ctx, 2, settle, w, h, 'cool', () => {
    ball(ctx, cx + w * 0.1, h * 0.55, h * 0.13, 'ingot', { rim: true });
    ring(ctx, cx + w * 0.1, h * 0.55, h * 0.14, lit[2] > 0.02 ? `rgba(229,155,36,${0.35 + lit[2] * 0.65})` : 'rgba(0,0,0,0.6)', lit[2] > 0.02 ? 4 : 2);
    line(ctx, cx + w * 0.02, h * 0.57, cx + w * 0.07, h * 0.57, '#8a8274', 8);
  });
  // 3: a blend, the T of pipe
  settled(ctx, 3, settle, w, h, 'cool', () => {
    slab(ctx, cx + w * 0.24, h * 0.53, w * 0.12, h * 0.05, lit[3], 1, steel);
    slab(ctx, cx + w * 0.28, h * 0.38, w * 0.04, h * 0.15, lit[3], 1, steel);
    line(ctx, cx + w * 0.22, h * 0.555, cx + w * 0.24, h * 0.555, '#8a8274', 8);
  });
  // 4: a pinhole, the fine vent
  settled(ctx, 4, settle, w, h, 'cool', () => {
    slab(ctx, cx + w * 0.36, h * 0.56, w * 0.05, h * 0.02, lit[4], 1, steel);
    ball(ctx, cx + w * 0.415, h * 0.57, 3, 'electron', { rim: false });
    slab(ctx, cx - w * 0.24, h * 0.64, w * 0.5, h * 0.04, 0, 0.7, steel);
  });
}

function dial(ctx, cx, cy, r, frac, color = C.amber) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#2a2622'); g.addColorStop(1, '#0f0e0c');
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
  ring(ctx, cx, cy, r, C.steel, 3);
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (0.75 + 1.5 * (i / 8));
    line(ctx, cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82, cx + Math.cos(a) * r * 0.94, cy + Math.sin(a) * r * 0.94, C.dust, 2);
  }
  const a = Math.PI * (0.75 + 1.5 * frac);
  line(ctx, cx, cy, cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, color, 4);
  ball(ctx, cx, cy, r * 0.08, 'electron', { rim: false });
}

function warmCylinder(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  bench(ctx, w, h, GY);
  const cx = w * 0.46;
  const lit = lights(t);
  const settle = win(t, 0.27, 0.46);
  const cold = 1 - win(t, 0.44, 0.52);
  if (cold > 0) machineClip(ctx, w, h, () => alpha(ctx, cold, () => compressorBody(ctx, w, h, lit, settle, cx)));
  callouts(ctx, w, h, t, [
    ['a piston', 0.08, 0.34, 0.46 - 0.22, 0.56], ['a heater', 0.08, 0.12, 0.46 - 0.05, 0.3], ['a count', 0.7, 0.28, 0.56, 0.45],
    ['a blend', 0.84, 0.24, 0.46 + 0.28, 0.42], ['a pinhole', 0.82, 0.74, 0.46 + 0.4, 0.58]
  ]);
  tag(ctx, 'cold in its housing', cx, h * 0.9, { size: 26, a: since(t, 0.36) * (1 - win(t, 0.5, 0.54)) });

  // The vault: a sealed cylinder, a gauge that does not move, and a deck outside that freezes around it.
  const va = ease(win(t, 0.5, 0.58));
  const toFile = ease(win(t, 0.77, 0.86));
  const fx = w * 0.79;
  const fy = h * 0.6;
  fileBack(ctx, fx, fy, ease(win(t, 0.74, 0.8)));
  if (va > 0) {
    const days = win(t, 0.54, 0.7);
    const kx = lerp(w * 0.34, fx, toFile);
    const ky = lerp(h * GY, fy + 60, toFile);
    const sc = lerp(1, 0.46, toFile);
    ctx.save();
    ctx.translate(kx, ky);
    ctx.scale(sc, sc);
    // The cylinder: a steel bottle with a domed top and a valve.
    const bw = 130;
    const bh = 300;
    const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    g.addColorStop(0, '#2a2622'); g.addColorStop(0.3, '#8a8274'); g.addColorStop(0.7, '#5a544c'); g.addColorStop(1, '#1d1b18');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-bw / 2, 0); ctx.lineTo(-bw / 2, -bh + 50);
    ctx.quadraticCurveTo(-bw / 2, -bh, 0, -bh);
    ctx.quadraticCurveTo(bw / 2, -bh, bw / 2, -bh + 50);
    ctx.lineTo(bw / 2, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = C.amber; ctx.fillRect(-bw / 2, -bh * 0.55, bw, 10);
    ctx.fillStyle = '#6b625a'; ctx.fillRect(-14, -bh - 26, 28, 30);
    ctx.fillRect(-30, -bh - 30, 60, 8);
    ctx.restore();
    contact(ctx, kx, ky + 8, 90 * sc, 12 * sc, 0.45);
    // The gauge never moves; the deck thermometer does.
    const dx = lerp(w * 0.58, fx - 40, toFile);
    alpha(ctx, 1 - toFile, () => {
      dial(ctx, w * 0.56, h * 0.34, h * 0.1, 0.55);
      tag(ctx, 'gauge: unchanged', w * 0.56, h * 0.34 + h * 0.15, { size: 22 });
      const tx = w * 0.7;
      const ty0 = h * 0.2;
      const th = h * 0.5;
      ctx.fillStyle = '#100f0c'; ctx.fillRect(tx - 10, ty0, 20, th);
      ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(tx - 10, ty0, 20, th);
      const level = lerp(0.88, 0.2, days);
      ctx.fillStyle = '#6f8fb0';
      ctx.fillRect(tx - 6, ty0 + th * (1 - level), 12, th * level - 4);
      tag(ctx, 'deck', tx, ty0 - 34, { size: 22 });
      text(ctx, `${Math.round(lerp(19, -30, days))} °C`, tx + 54, ty0 + th * (1 - level), { size: 28, color: C.text, align: 'left', scale: true });
      text(ctx, `day ${Math.round(days * 12)}`, w * 0.56, h * 0.18, { size: 34, color: C.text, weight: 700, scale: true });
    });
    tag(ctx, 'something inside gives off heat', w * 0.5, h * 0.07, { size: 24, color: C.amber, edge: C.amber, a: since(t, 0.66) * (1 - win(t, 0.76, 0.8)) });
    void dx;
  }
  fileFront(ctx, fx, fy, ease(win(t, 0.74, 0.8)));
  const f = ease(win(t, 0.92, 0.98));
  if (f > 0) brackets(ctx, fx - 176, fy - 166, 352, 290, C.amber, f, 4);
}

/* ====================================================================================================================
   boss-crucible — the Crucible splits along its firebrick seams: a heat exchanger and a pipe running down into the crust
   ==================================================================================================================== */

function crucibleOpen(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  const gy = h * GY;
  bench(ctx, w, h, GY);
  const cx = w * 0.4;
  const lit = lights(t);
  const split = ease(win(t, 0.27, 0.46));
  const coldA = 1 - ease(win(t, 0.25, 0.34));
  const brick = [118, 62, 44];

  // The crust under the deck, in strata, and the pipe that goes down into it.
  const crust = ease(win(t, 0.5, 0.6));
  if (crust > 0) {
    alpha(ctx, crust, () => {
      const rand = mulberry32(0xc1);
      [['#2a2420', 0], ['#201c19', 1], ['#2d2722', 2], ['#191613', 3]].forEach(([col, i]) => {
        ctx.fillStyle = col;
        ctx.fillRect(0, gy + 8 + i * h * 0.045, w, h * 0.045);
        for (let k = 0; k < 40; k++) { ctx.fillStyle = 'rgba(214,196,168,0.04)'; ctx.fillRect(rand() * w, gy + 8 + i * h * 0.045 + rand() * h * 0.04, 6 + rand() * 18, 2); }
      });
    });
  }

  // The furnace: two firebrick halves that stand together, then part. The exchanger is behind them.
  const exchA = ease(win(t, 0.3, 0.46));
  const slide = split * w * 0.17;
  // The exchanger: plates in a row between two headers, with no steam over it.
  alpha(ctx, exchA, () => {
    const ex = cx - w * 0.1;
    slab(ctx, ex - w * 0.03, h * 0.4, w * 0.035, h * 0.42, 0, 0.9, [96, 94, 90]);
    slab(ctx, ex + w * 0.2, h * 0.4, w * 0.035, h * 0.42, 0, 0.9, [96, 94, 90]);
    for (let i = 0; i < 8; i++) slab(ctx, ex + w * 0.012 + i * w * 0.022, h * 0.42, w * 0.01, h * 0.38, 0, 1, [150, 146, 138]);
  });
  const halfBody = (x, side) => {
    slab(ctx, x, h * 0.3, w * 0.12, h * 0.52, lit[0] * coldA, 1, brick);
    for (let r = 0; r < 12; r++) for (let c = 0; c < 3; c++) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 3 + ((r % 2) ? w * 0.02 : 0) + c * w * 0.04, h * 0.3 + 6 + r * h * 0.04, w * 0.04, h * 0.036);
    }
    void side;
  };
  halfBody(cx - w * 0.12 - slide, -1);
  halfBody(cx + slide, 1);
  // The stack: the chimney on the right half.
  slab(ctx, cx + slide + w * 0.03, h * 0.08, w * 0.06, h * 0.24, lit[2] * coldA, 0.95, [100, 64, 50]);
  // The bath, the ledger and the balance step back once the furnace has opened: the exchanger is what is left to look at.
  ctx.save();
  ctx.globalAlpha = 1 - ease(win(t, 0.5, 0.58));
  // The bath tank and its thermometer: on the left, as the first bench was.
  slab(ctx, cx - w * 0.33 - slide, h * 0.52, w * 0.13, h * 0.3, lit[3] * coldA, 0.9, [80, 84, 90]);
  ctx.fillStyle = '#6f8fb0'; ctx.fillRect(cx - w * 0.32 - slide, h * 0.62, w * 0.11, h * 0.18);
  line(ctx, cx - w * 0.26 - slide, h * 0.56, cx - w * 0.26 - slide, h * 0.62, C.text, 3);
  // The ledger panel and a balance: the other two benches.
  slab(ctx, cx + w * 0.17 + slide, h * 0.5, w * 0.1, h * 0.2, lit[1] * coldA, 0.9, [76, 72, 64]);
  for (let i = 0; i < 4; i++) line(ctx, cx + w * 0.18 + slide, h * 0.54 + i * h * 0.04, cx + w * 0.26 + slide, h * 0.54 + i * h * 0.04, 'rgba(0,0,0,0.4)', 2);
  line(ctx, cx + w * 0.2 + slide, h * 0.2, cx + w * 0.3 + slide, h * 0.2, C.dust, 5);
  slab(ctx, cx + w * 0.247 + slide, h * 0.2, w * 0.006, h * 0.12, lit[4] * coldA, 1, [90, 88, 84]);
  ctx.restore();
  callouts(ctx, w, h, t, [
    ['a ledger', 0.88, 0.5, 0.4 + 0.22, 0.58], ['a stack', 0.84, 0.1, 0.4 + 0.06, 0.14], ['a bath', 0.06, 0.4, 0.4 - 0.27, 0.62],
    ['a table', 0.88, 0.7, 0.4 + 0.22, 0.64], ['a balance', 0.66, 0.07, 0.4 + 0.25, 0.21]
  ]);
  tag(ctx, 'splits along its seams', cx, h * 0.14, { size: 26, a: since(t, 0.36) * (1 - win(t, 0.5, 0.54)) });

  // The pipe: from the exchanger down through the deck into the crust.
  const pipe = ease(win(t, 0.58, 0.72));
  if (pipe > 0) {
    const px = cx - w * 0.1 + w * 0.12;
    const g = ctx.createLinearGradient(px - 14, 0, px + 14, 0);
    g.addColorStop(0, '#2a2622'); g.addColorStop(0.4, '#9a9183'); g.addColorStop(1, '#2a2622');
    ctx.fillStyle = g;
    ctx.fillRect(px - 14, h * 0.78, 28, (h * 0.98 - h * 0.78) * pipe);
    tag(ctx, 'down into the crust', px + w * 0.15, gy + h * 0.1, { size: 24, a: since(t, 0.64) * (1 - win(t, 0.76, 0.8)) });
    tag(ctx, 'not a wisp of steam', cx, h * 0.08, { size: 24, a: since(t, 0.6) * (1 - win(t, 0.76, 0.8)) });
  }

  const fa = ease(win(t, 0.74, 0.8));
  const fx = w * 0.84;
  const fy = h * 0.4;
  fileBack(ctx, fx - 40, fy, fa);
  fileFront(ctx, fx - 40, fy, fa);
  tag(ctx, 'the siphon manifold', fx - 40, fy - 6, { size: 22, a: fa });
  const f = ease(win(t, 0.92, 0.98));
  if (f > 0) brackets(ctx, fx - 40 - 176, fy - 166, 352, 290, C.amber, f, 4);
}

/* ====================================================================================================================
   q9-absorb — a solution leaves the colour it does not take; absorbance rises with concentration; a line reads the sealed sample
   ==================================================================================================================== */

/** A cuvette: a glass cell with a liquid of `rgb` and `dots` of the solute. */
function cuvette(ctx, x, y, cw, ch, fill, dots, seed) {
  ctx.fillStyle = 'rgba(184,175,160,0.08)';
  ctx.fillRect(x, y, cw, ch);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 4, y + ch * 0.12, cw - 8, ch * 0.88 - 4);
  const rand = mulberry32(seed);
  for (let i = 0; i < dots; i++) ball(ctx, x + 10 + rand() * (cw - 20), y + ch * 0.16 + rand() * (ch * 0.78), 3.2, 'Cl37', { rim: false });
  ctx.strokeStyle = 'rgba(214,196,168,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(x, y, cw, ch);
  ctx.fillStyle = 'rgba(255,250,235,0.14)'; ctx.fillRect(x + 6, y + 4, 5, ch - 8);
}

function beamDim(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  const blue = 'rgba(70,110,170,0.55)';
  const A = c => planAbsorb('cuso4', 630, 1, c);
  const standards = [0.002, 0.004, 0.006];
  const sealed = 0.005;

  // Phase A: white light in, orange taken out, blue left.
  const aA = 1 - win(t, 0.26, 0.31);
  if (aA > 0) {
    alpha(ctx, aA, () => {
      const run = ease(win(t, 0.03, 0.2));
      const cy = h * 0.46;
      const cx = w * 0.46;
      const cw = w * 0.14;
      const ch = h * 0.34;
      // The lamp.
      slab(ctx, w * 0.05, cy - 46, w * 0.08, 92, 0, 1, [86, 84, 80]);
      ctx.fillStyle = '#efe8d8'; ctx.fillRect(w * 0.13, cy - 12, w * 0.012, 24);
      // The beam in, white; the beam out, blue; the orange it lost, stopped in the cell.
      const inEnd = lerp(w * 0.142, cx - cw / 2, run);
      ctx.lineCap = 'round';
      line(ctx, w * 0.142, cy, inEnd, cy, '#efe8d8', 12);
      if (run > 0.95) {
        const out = ease(win(t, 0.14, 0.24));
        line(ctx, cx + cw / 2, cy, lerp(cx + cw / 2, w * 0.86, out), cy, '#7fa0d8', 12);
        line(ctx, cx - cw / 2 + 12, cy + 26, lerp(cx - cw / 2 + 12, cx + cw * 0.05, out), cy + 26, '#e0762e', 6, [10, 8]);
      }
      ctx.lineCap = 'butt';
      cuvette(ctx, cx - cw / 2, cy - ch / 2, cw, ch, blue, 36, 0x9d);
      tag(ctx, 'white in', w * 0.2, cy - 56, { size: 24 });
      tag(ctx, 'blue out', w * 0.74, cy - 56, { size: 24, color: '#9ab6e8', edge: '#6f8fc0', a: since(t, 0.16) });
      tag(ctx, 'orange taken out', cx, cy + ch / 2 + 54, { size: 24, color: '#e8923e', edge: '#e0762e', a: since(t, 0.18) });
    });
  }

  // Phase B: three standards, three absorbances, each twice and thrice the first.
  const bA = between(t, 0.27, 0.54, 0.03);
  if (bA > 0) {
    alpha(ctx, bA, () => {
      standards.forEach((c, i) => {
        const on = ease(win(t, 0.3 + i * 0.05, 0.38 + i * 0.05));
        const x = w * (0.24 + i * 0.26);
        alpha(ctx, on, () => {
          cuvette(ctx, x - 55, h * 0.18, 110, h * 0.3, `rgba(70,110,170,${0.25 + (i + 1) * 0.14})`, (i + 1) * 12, 0x91 + i);
          tag(ctx, `${c * 1000} mmol/L`, x, h * 0.18 + h * 0.3 + 44, { size: 24 });
          // Its absorbance, drawn as a bar that stands as tall as the reading.
          const bar = A(c) / A(0.008) * h * 0.2;
          ctx.fillStyle = '#26221e'; ctx.fillRect(x - 28, h * 0.84 - h * 0.25, 56, h * 0.25);
          ctx.fillStyle = C.amber; ctx.fillRect(x - 24, h * 0.84 - bar * 1.2 - 2, 48, bar * 1.2);
          text(ctx, A(c).toFixed(2), x, h * 0.84 - bar * 1.2 - 24, { size: 28, color: C.text, weight: 700, scale: true });
        });
      });
      tag(ctx, 'twice the copper, twice the absorbance', w * 0.5, h * 0.07, { size: 26, color: C.text, a: ease(win(t, 0.42, 0.5)) });
    });
  }

  // Phase C: the line through the standards, and the sealed sample read back off it.
  const cA = between(t, 0.55, 0.8, 0.03);
  if (cA > 0) {
    alpha(ctx, cA, () => {
      const gx = w * 0.12;
      const gw = w * 0.5;
      const gy0 = h * 0.8;
      const gh = h * 0.6;
      const X = c => gx + (c / 0.008) * gw;
      const Y = a => gy0 - (a / A(0.008)) * gh;
      line(ctx, gx, gy0, gx + gw + 20, gy0, C.steel, 3);
      line(ctx, gx, gy0, gx, gy0 - gh - 20, C.steel, 3);
      text(ctx, 'concentration', gx + gw / 2, gy0 + 54, { size: 24, color: C.dust, scale: true });
      text(ctx, 'absorbance', gx - 20, gy0 - gh - 44, { size: 24, color: C.dust, align: 'left', scale: true });
      const draw = ease(win(t, 0.58, 0.66));
      line(ctx, gx, gy0, lerp(gx, X(0.0085), draw), lerp(gy0, Y(A(0.0085)), draw), C.text, 4);
      standards.forEach((c, i) => { if (draw > 0.2 + i * 0.25) ball(ctx, X(c), Y(A(c)), 11, 'proton', { rim: false }); });
      const rd = ease(win(t, 0.68, 0.76));
      if (rd > 0) {
        const sx = X(sealed);
        const sy = Y(A(sealed));
        line(ctx, gx, sy, lerp(gx, sx, rd), sy, C.amber, 3, [8, 6]);
        line(ctx, sx, sy, sx, lerp(sy, gy0, rd), C.amber, 3, [8, 6]);
        ball(ctx, sx, sy, 12, 'electron', { rim: false });
        tag(ctx, '5 mmol/L', sx, gy0 + 100, { size: 28, color: C.amber, edge: C.amber, a: rd });
      }
      tag(ctx, 'sealed tank water', w * 0.8, h * 0.36, { size: 26, a: ease(win(t, 0.7, 0.76)), color: C.text });
      tag(ctx, 'read back off the line', w * 0.8, h * 0.46, { size: 24, a: ease(win(t, 0.72, 0.78)) });
    });
  }

  // Phase D: the feeder still on the ice, made of everything measured here.
  const dA = ease(win(t, 0.8, 0.88));
  if (dA > 0) {
    alpha(ctx, dA, () => {
      bench(ctx, w, h, GY);
      eaterBody(ctx, w, h, [0, 0, 0, 0, 0], 0, w * 0.5);
      tag(ctx, 'the Lantern-Eater', w * 0.5, h * 0.9, { size: 28, color: C.text });
    });
  }
  const f = ease(win(t, 0.92, 0.98));
  if (f > 0) brackets(ctx, w * 0.5 - 220, h * 0.1, 440, h * 0.72, C.amber, f, 4);
}

/* ====================================================================================================================
   q9-orbitals — electrons fill molecular boxes from the bottom, one to a box; oxygen's two stand alone, and a magnet finds them
   ==================================================================================================================== */

/** A ladder of boxes for a two-atom molecule: [label, boxes, electrons, ...]. Electrons are filled bottom-up, singly before paired. */
const LADDER2 = [
  ['σ*2p', 1], ['π*2p', 2], ['π 2p', 2], ['σ 2p', 1], ['σ*2s', 1], ['σ 2s', 1]
];

function fillLadder(electrons) {
  // Fill bottom-up, one to a box before any pair up, as the quest teaches.
  const levels = [...LADDER2].reverse();
  const state = levels.map(([, n]) => Array(n).fill(0));
  let left = electrons;
  for (let li = 0; li < levels.length && left > 0; li++) {
    for (let b = 0; b < state[li].length && left > 0; b++) { state[li][b] = 1; left--; }
    for (let b = 0; b < state[li].length && left > 0; b++) { state[li][b] = 2; left--; }
  }
  return state.reverse();
}

function ladder(ctx, x, y, bw, bh, electrons, t, a0, label, hotLevels) {
  const st = fillLadder(electrons);
  const total = electrons;
  const shown = Math.round(clamp01(t) * total);
  // Show the first `shown` electrons in fill order.
  const order = [];
  const levels = [...LADDER2].reverse();
  for (let li = 0; li < levels.length; li++) for (let b = 0; b < levels[li][1]; b++) order.push([levels.length - 1 - li, b, 1]);
  for (let li = 0; li < levels.length; li++) for (let b = 0; b < levels[li][1]; b++) order.push([levels.length - 1 - li, b, 2]);
  const placed = order.filter(([li, b, k]) => st[li][b] >= k).slice(0, shown);
  LADDER2.forEach(([name, n], li) => {
    const ly = y + li * (bh + 26);
    text(ctx, name, x - 1.5 * bw - 24, ly + bh / 2, { size: 22, color: C.dust, align: 'right', scale: true });
    for (let b = 0; b < n; b++) {
      const bx = x + (b - (n - 1) / 2) * (bw + 14) - bw / 2;
      ctx.fillStyle = '#16140f'; ctx.fillRect(bx, ly, bw, bh);
      const hot = hotLevels.includes(li);
      ctx.strokeStyle = hot ? C.amber : C.steel; ctx.lineWidth = hot ? 3 : 2; ctx.strokeRect(bx, ly, bw, bh);
      placed.filter(p => p[0] === li && p[1] === b).forEach(([, , k]) => {
        const ax = bx + bw * (k === 1 ? 0.35 : 0.68);
        const up = k === 1;
        line(ctx, ax, ly + (up ? bh - 6 : 6), ax, ly + (up ? 6 : bh - 6), hot ? C.amber : C.pale, 4);
        ctx.fillStyle = hot ? C.amber : C.pale;
        ctx.beginPath();
        if (up) { ctx.moveTo(ax - 7, ly + 14); ctx.lineTo(ax, ly + 2); ctx.lineTo(ax + 7, ly + 14); } else { ctx.moveTo(ax - 7, ly + bh - 14); ctx.lineTo(ax, ly + bh - 2); ctx.lineTo(ax + 7, ly + bh - 14); }
        ctx.closePath(); ctx.fill();
      });
    }
  });
  tag(ctx, label, x, y + LADDER2.length * (bh + 26) + 10, { size: 28, color: C.text });
}

function magnetPull(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);

  // Phases A and B: the boxes of O2 and N2, filled from the bottom, one to a box before any pair up; oxygen's last two stand alone.
  const vA = 1 - ease(win(t, 0.34, 0.4));
  if (vA > 0) {
    alpha(ctx, vA, () => {
      const fill = ease(win(t, 0.03, 0.24));
      const bw = 42;
      const bh = 54;
      ladder(ctx, w * 0.3, h * 0.08, bw, bh, 12, fill, 0, 'O\u2082', win(t, 0.25, 0.3) > 0 ? [1] : []);
      ladder(ctx, w * 0.74, h * 0.08, bw, bh, 10, fill, 0, 'N\u2082', []);
      tag(ctx, 'two stand alone', w * 0.52, h * 0.27, { size: 24, color: C.amber, edge: C.amber, a: ease(win(t, 0.25, 0.32)) });
      tag(ctx, 'every electron paired', w * 0.52, h * 0.75, { size: 24, a: ease(win(t, 0.28, 0.34)) });
    });
  }

  // The same two gases in flasks, and a magnet over them: phase B's second half, and C.
  const mA = ease(win(t, 0.36, 0.44));
  if (mA > 0) {
    alpha(ctx, mA, () => {
      const pull = ease(win(t, 0.4, 0.55));
      const mx = w * 0.27;
      const my = h * 0.2;
      const horseshoe = (x, col, poleCol, a) => {
        alpha(ctx, a, () => {
          ctx.lineWidth = 34; ctx.lineCap = 'butt';
          ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, my, w * 0.06, Math.PI, 0, true); ctx.stroke();
          ctx.strokeStyle = poleCol[0]; ctx.beginPath(); ctx.moveTo(x - w * 0.06, my); ctx.lineTo(x - w * 0.06, my + h * 0.12); ctx.stroke();
          ctx.strokeStyle = poleCol[1]; ctx.beginPath(); ctx.moveTo(x + w * 0.06, my); ctx.lineTo(x + w * 0.06, my + h * 0.12); ctx.stroke();
        });
      };
      horseshoe(mx, '#8a8274', ['#b8382c', '#6b625a'], 1);
      horseshoe(w * 0.73, '#4a443d', ['#4a443d', '#4a443d'], 0.5);
      const flask = (x, name, pulled) => {
        const fy = h * 0.66 - (pulled ? pull * h * 0.26 : 0);
        const fw = w * 0.1;
        const fh = h * 0.2;
        const g = ctx.createLinearGradient(x - fw / 2, 0, x + fw / 2, 0);
        g.addColorStop(0, '#2a2622'); g.addColorStop(0.35, '#6b625a'); g.addColorStop(1, '#1d1b18');
        ctx.fillStyle = g; ctx.fillRect(x - fw / 2, fy, fw, fh);
        ctx.strokeStyle = pulled && pull > 0.9 ? C.amber : C.steel; ctx.lineWidth = 3; ctx.strokeRect(x - fw / 2, fy, fw, fh);
        text(ctx, name, x, fy + fh / 2, { size: 36, color: C.text, weight: 700, scale: true });
        contact(ctx, x, h * 0.88, fw * 0.5, 8, 0.35);
      };
      flask(mx, 'O\u2082', true);
      flask(w * 0.73, 'N\u2082', false);
      tag(ctx, 'pulled', mx, h * 0.93, { size: 24, color: C.amber, edge: C.amber, a: ease(win(t, 0.5, 0.56)) });
      tag(ctx, 'left where it was', w * 0.73, h * 0.93, { size: 24, a: ease(win(t, 0.5, 0.56)) });

      // Phase C: the drawing of pairs shows oxygen with no lone electron; the boxes do.
      const lw = ease(win(t, 0.58, 0.68));
      alpha(ctx, lw, () => {
        const cx = w * 0.5;
        const cy = h * 0.36;
        ctx.fillStyle = 'rgba(12,11,9,0.92)'; ctx.fillRect(cx - 150, cy - 70, 300, 140);
        ctx.strokeStyle = C.steel; ctx.lineWidth = 1; ctx.strokeRect(cx - 149.5, cy - 69.5, 299, 139);
        text(ctx, 'O', cx - 70, cy, { size: 56, color: C.text, weight: 700 });
        text(ctx, 'O', cx + 70, cy, { size: 56, color: C.text, weight: 700 });
        line(ctx, cx - 38, cy - 6, cx + 38, cy - 6, C.pale, 4);
        line(ctx, cx - 38, cy + 8, cx + 38, cy + 8, C.pale, 4);
        [[-70, -44], [-70, 44], [70, -44], [70, 44]].forEach(([dx, dy]) => { ball(ctx, cx + dx - 8, cy + dy, 4, 'electron', { rim: false }); ball(ctx, cx + dx + 8, cy + dy, 4, 'electron', { rim: false }); });
        tag(ctx, 'the drawing of pairs', cx, cy + 96, { size: 22 });
      });
      tag(ctx, 'shows nothing alone', w * 0.5, h * 0.55, { size: 22, a: ease(win(t, 0.64, 0.7)) });
      tag(ctx, 'the boxes still work', w * 0.5, h * 0.65, { size: 24, color: C.amber, edge: C.amber, a: ease(win(t, 0.68, 0.74)) });
    });
  }
  const f = ease(win(t, 0.92, 0.98));
  if (f > 0) brackets(ctx, w * 0.27 - 120, h * 0.12, 240, h * 0.8, C.amber, f, 4);
}

export const FINALE_SCENES = {
  'eater-lens': eaterLens,
  'warden-cut': wardenCut,
  'warm-cylinder': warmCylinder,
  'crucible-open': crucibleOpen,
  'beam-dim': beamDim,
  'magnet-pull': magnetPull
};

void rod; void bench;
