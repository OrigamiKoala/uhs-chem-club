/**
 * story-scenes.js — the pictures behind a quest's story animation.
 *
 * Each painter draws one frame of a scene from a progress `t` in [0, 1], on a canvas of `w` x `h` (16:9). The scene's
 * `t` is split into phases, one for each of Vess's lines in `story/quest-story.js` (a beat's `to` is where its phase ends,
 * and the line filed to the case runs from the last `to` to 1), so what is on screen is what is being said. A painter is a
 * pure function of `t`: the same `t` is the same picture, so a player who has asked for reduced motion, or whose device is
 * drawing without WebGL, sees each beat's last frame and loses nothing. `clock` (seconds, 0 when still) only drives ambient
 * drift: the dust, an electron's orbit.
 *
 * Painters draw in the SCOURED PLATE palette (see `story-kit.js`): obsidian, titanium, one amber signal, hard shadows, no glow.
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import { mulberry32 } from '../learn/engine/plates.js';
import { BELLOWS_SCENES } from './story-scenes-bellows.js';
import { LIGAR_SCENES } from './story-scenes-ligar.js';
import { EMBER_SCENES } from './story-scenes-ember.js';
import { LANTERNFALL_SCENES } from './story-scenes-lanternfall.js';
import { FINALE_SCENES } from './story-scenes-finales.js';
import {
  C, clamp01, win, ease, easeOut, lerp, alpha, plate, bench, contact, ball, ring, line, rod, text, tag, leader,
  brackets, balance, setSceneClock
} from './story-kit.js';

const TAU = Math.PI * 2;

/** 6.02 x 10^23 with a true raised exponent. */
function sci(ctx, x, y, size, color) {
  ctx.font = `700 ${size}px Quantico, "JetBrains Mono", monospace`;
  const lead = '6.02 \u00d7 10';
  const lw = ctx.measureText ? (ctx.measureText(lead).width || lead.length * size * 0.56) : lead.length * size * 0.56;
  const ew = size * 0.56 * 2 * 0.62;
  const x0 = x - (lw + ew) / 2;
  text(ctx, lead, x0, y, { size, color, align: 'left', weight: 700 });
  text(ctx, '23', x0 + lw + 2, y - size * 0.42, { size: size * 0.62, color, align: 'left', weight: 700 });
}
/** A fade that is up between a and b, and fades in and out over `f` at the ends. */
const between = (t, a, b, f = 0.03) => win(t, a, a + f) * (1 - win(t, b - f, b));
/** A tag that stays up from `a`, fading in. */
const from = (t, a, f = 0.03) => win(t, a, a + f);

/** The point `d` along a polyline of [x, y] pairs. */
function along(poly, d) {
  let left = d;
  for (let i = 1; i < poly.length; i++) {
    const [x0, y0] = poly[i - 1];
    const [x1, y1] = poly[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (left <= len || i === poly.length - 1) {
      const k = len ? clamp01(left / len) : 0;
      return [lerp(x0, x1, k), lerp(y0, y1, k)];
    }
    left -= len;
  }
  return poly[poly.length - 1];
}
const pathLen = poly => poly.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - poly[i - 1][0], p[1] - poly[i - 1][1]) : 0), 0);

/** A streak of light along a path: a bright head and a fading tail. `d` is the head's distance along it. */
function streak(ctx, poly, d, tail, color = C.text, width = 3) {
  const steps = 10;
  let prev = along(poly, Math.max(0, d - tail));
  for (let i = 1; i <= steps; i++) {
    const p = along(poly, Math.max(0, d - tail * (1 - i / steps)));
    ctx.globalAlpha = (i / steps) * 0.95;
    line(ctx, prev[0], prev[1], p[0], p[1], color, width * (0.4 + 0.6 * (i / steps)));
    prev = p;
  }
  ctx.globalAlpha = 1;
  ball(ctx, prev[0], prev[1], width * 1.1, 'electron', { rim: false });
}

/** A cluster of nucleons packed the way a handful of marbles settle: [x, y, kind] around (cx, cy). */
function nucleons(protons, neutrons, rr) {
  const n = protons + neutrons;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996;
    const d = rr * 1.02 * Math.sqrt(i + 0.35);
    // Interleave the kinds so neither one hides the other.
    out.push([Math.cos(a) * d, Math.sin(a) * d, i % 2 === 0 ? (i / 2 < protons ? 'proton' : 'neutron') : (Math.floor(i / 2) < neutrons ? 'neutron' : 'proton')]);
  }
  return out;
}

/** Electrons on shells: `radii[i]` holds `counts[i]`. `pick(i, j)` may name an electron to draw in amber. */
function shellsAt(ctx, cx, cy, radii, counts, t, clock, { er = 7, a = 1, pick = null, speed = 0.5, ringColor = 'rgba(184,175,160,0.28)' } = {}) {
  alpha(ctx, a, () => {
    radii.forEach((r, i) => {
      ring(ctx, cx, cy, r, ringColor, 1.5);
      for (let j = 0; j < counts[i]; j++) {
        const ang = (j / counts[i]) * TAU + i * 0.9 + (clock * speed + t * 1.5) * (i % 2 ? -1 : 1) / (1 + i * 0.5);
        const ex = cx + Math.cos(ang) * r;
        const ey = cy + Math.sin(ang) * r;
        const hot = pick?.(i, j);
        if (hot) ring(ctx, ex, ey, er * 2, C.amber, 2.5);
        ball(ctx, ex, ey, er, 'electron', { rim: false });
      }
    });
  });
}

/** The Filed phase draws nothing new: the thing the line is about is bracketed. This is how far along the brackets are. */
const stamp = (t, a, b) => ease(win(t, a, b));

/* ====================================================================================================================
   q1-grain — the powder resolves into atoms; element, mixture, molecule, compound
   Phases: 0-.22 zoom in, .22-.46 element and mixture, .46-.70 the cutter, .70-.90 compound beside mixture, .90-1 filed
   ==================================================================================================================== */

const GRAINS = (() => {
  const rand = mulberry32(0x6a1);
  const pts = [];
  for (let j = -4; j <= 4; j++) {
    for (let i = -4; i <= 4; i++) {
      const x = (i + (j % 2 ? 0.5 : 0)) * 0.27 + (rand() - 0.5) * 0.1;
      const y = j * 0.235 + (rand() - 0.5) * 0.1;
      if (x * x + y * y < 0.96) pts.push({ x, y, kind: rand() < 0.42 ? 'C' : 'Na', sz: 0.88 + rand() * 0.26, g: 0.35 + rand() * 0.3 });
    }
  }
  return pts;
})();

/** Water: an oxygen and two hydrogens, drawn bent. `cut` is how far each bond (left, right) has been parted. */
function water(ctx, ox, oy, s, cut = [0, 0]) {
  const L = 2.3 * s;
  const ang = (52 * Math.PI) / 180;
  [-1, 1].forEach((sg, i) => {
    const k = cut[i];
    const bx = ox + sg * Math.sin(ang) * L;
    const by = oy + Math.cos(ang) * L;
    const drift = k * 0.9 * s;
    const hx = bx + sg * drift;
    const hy = by + drift * 0.55;
    const mx = lerp(ox, hx, 0.5);
    const my = lerp(oy, hy, 0.5);
    const dx = hx - ox;
    const dy = hy - oy;
    const dl = Math.hypot(dx, dy) || 1;
    const gap = (0.1 + k * 0.34) * s;
    if (k < 0.02) rod(ctx, ox, oy, hx, hy, 0.34 * s);
    else {
      rod(ctx, ox, oy, mx - (dx / dl) * gap, my - (dy / dl) * gap, 0.34 * s);
      rod(ctx, mx + (dx / dl) * gap, my + (dy / dl) * gap, hx, hy, 0.34 * s);
    }
    ball(ctx, hx, hy, 0.62 * s, 'H', { shadow: true });
  });
  ball(ctx, ox, oy, 0.98 * s, 'O', { shadow: true });
}

/** The cutter: a flat steel blade with a bevelled point, its tip at `x`, travelling right. */
function knife(ctx, x, y, len) {
  const g = ctx.createLinearGradient(0, y - 12, 0, y + 12);
  g.addColorStop(0, '#d8d0bf'); g.addColorStop(0.5, '#8a8274'); g.addColorStop(1, '#3c3833');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 30, y - 12);
  ctx.lineTo(x - len, y - 12);
  ctx.lineTo(x - len, y + 12);
  ctx.lineTo(x - 30, y + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#4a443d';
  ctx.fillRect(x - len - 60, y - 17, 60, 34);
  contact(ctx, x - len * 0.4, y + 52, len * 0.5, 7, 0.28);
}

function grainResolve(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  const R = h * 0.36;
  const lx = w * 0.37;
  const ly = h * 0.5;
  const zoom = ease(win(t, 0.01, 0.2));
  const lensA = 1 - win(t, 0.46, 0.5);

  /* ---- the lens, its glass and what is under it ---- */
  alpha(ctx, lensA, () => {
    ctx.save();
    ctx.translate(lx - R * 0.72, ly + R * 0.72);
    ctx.rotate(Math.PI / 4);
    const hg = ctx.createLinearGradient(0, -15, 0, 15);
    hg.addColorStop(0, '#2c2824'); hg.addColorStop(0.5, '#7a7166'); hg.addColorStop(1, '#2c2824');
    ctx.fillStyle = hg;
    ctx.fillRect(-R * 0.62, -15, R * 0.6, 30);
    ctx.fillStyle = '#4a443d';
    ctx.fillRect(-R * 0.1, -19, 22, 38);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, R, 0, TAU);
    ctx.clip();
    const gl = ctx.createRadialGradient(lx, ly - R * 0.2, R * 0.1, lx, ly, R);
    gl.addColorStop(0, '#221e19'); gl.addColorStop(1, '#0e0c0a');
    ctx.fillStyle = gl;
    ctx.fillRect(lx - R, ly - R, R * 2, R * 2);

    // The heap of powder from above: a grey body that gives way to separate grains as the lens closes in.
    alpha(ctx, 1 - win(zoom, 0.35, 0.8), () => {
      const hp = ctx.createRadialGradient(lx - R * 0.06, ly - R * 0.08, 2, lx, ly, R * 0.46);
      hp.addColorStop(0, '#7a7266'); hp.addColorStop(0.7, '#4b453d'); hp.addColorStop(1, 'rgba(40,36,31,0)');
      ctx.fillStyle = hp;
      ctx.beginPath();
      ctx.arc(lx, ly, R * 0.46, 0, TAU);
      ctx.fill();
    });

    const S = lerp(0.36, 1.18, zoom);
    const r0 = lerp(0.028, 0.105, zoom) * R;
    GRAINS.forEach(p => {
      const x = lx + p.x * R * S;
      const y = ly + p.y * R * S;
      const r = r0 * p.sz;
      const atomA = win(zoom, 0.3, 0.7);
      alpha(ctx, 1 - atomA, () => {
        ctx.fillStyle = `rgb(${Math.round(150 + p.g * 70)},${Math.round(142 + p.g * 64)},${Math.round(128 + p.g * 56)})`;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1.2, r * 0.8), 0, TAU);
        ctx.fill();
      });
      alpha(ctx, atomA, () => ball(ctx, x, y, r, p.kind, { shadow: true }));
      // One kind of atom at a time is ringed, so it can be called an element; then the whole spread together is a mixture.
      const pick = p.kind === 'C' ? between(t, 0.25, 0.36, 0.025) : between(t, 0.32, 0.43, 0.025);
      if (pick > 0.02) alpha(ctx, pick, () => ring(ctx, x, y, r * 1.4, p.kind === 'C' ? C.amber : C.pale, 2.5));
    });
    ctx.restore();

    // The rim: a turned steel ring, lit from the top.
    const rg = ctx.createLinearGradient(lx, ly - R, lx, ly + R);
    rg.addColorStop(0, '#9a9183'); rg.addColorStop(0.5, '#4a443d'); rg.addColorStop(1, '#2a2622');
    ctx.beginPath();
    ctx.arc(lx, ly, R + 7, 0, TAU);
    ctx.strokeStyle = rg;
    ctx.lineWidth = 15;
    ctx.stroke();
    ring(ctx, lx, ly, R - 1, 'rgba(0,0,0,0.7)', 2);

    tag(ctx, zoom < 0.5 ? 'powder' : 'atoms', lx, ly + R + 50, { size: 26, color: C.pale, align: 'center' });
    const kA = ease(win(t, 0.14, 0.2)) * (1 - win(t, 0.23, 0.26));
    if (kA > 0) {
      const c = GRAINS.find(p => p.kind === 'C' && p.x > 0.3 && p.y < -0.25);
      const n = GRAINS.find(p => p.kind === 'Na' && p.x > 0.4 && p.y > 0.2);
      leader(ctx, w * 0.69, h * 0.3, lx + c.x * R * 1.18, ly + c.y * R * 1.18, kA, C.steel);
      leader(ctx, w * 0.69, h * 0.7, lx + n.x * R * 1.18, ly + n.y * R * 1.18, kA, C.steel);
      tag(ctx, 'carbon', w * 0.69, h * 0.3, { a: kA });
      tag(ctx, 'sodium', w * 0.69, h * 0.7, { a: kA });
    }
  });

  /* ---- phase B: one kind is an element; unjoined kinds together are a mixture ---- */
  const legA = between(t, 0.26, 0.5, 0.025);
  if (legA > 0) {
    const lgx = w * 0.76;
    const e = ease(win(t, 0.27, 0.33));
    const m = ease(win(t, 0.37, 0.43));
    tag(ctx, 'element', lgx, h * 0.3, { a: legA * e, edge: C.amber, color: C.text, size: 28 });
    alpha(ctx, legA * e, () => [0, 1, 2].forEach(i => ball(ctx, lgx + 30 + i * 66, h * 0.42, 25, 'C', { shadow: true })));
    tag(ctx, 'mixture', lgx, h * 0.6, { a: legA * m, edge: C.amber, color: C.text, size: 28 });
    alpha(ctx, legA * m, () => ['C', 'Na', 'C', 'Na'].forEach((k, i) => ball(ctx, lgx + 30 + i * 62, h * 0.72, 23, k, { shadow: true })));
  }

  /* ---- phases C and D: the cutter, then a compound beside a mixture. The same two things stay on the bench throughout. ---- */
  if (t > 0.46) {
    const mx = w * 0.3;
    const my = h * 0.42;
    const s = h * 0.058;
    const molA = ease(win(t, 0.47, 0.52));
    const L = 2.3 * s;
    const sin52 = Math.sin((52 * Math.PI) / 180);
    const midX = [mx - sin52 * L * 0.5, mx + sin52 * L * 0.5];
    const yCut = my + Math.cos((52 * Math.PI) / 180) * L * 0.5;
    const pass = ease(win(t, 0.53, 0.6));
    const tipX = lerp(mx - sin52 * L - s * 3.6, mx + sin52 * L + s * 1.4, pass);
    // The bonds part as the blade goes through them, and join again once the next line begins.
    const rejoin = ease(win(t, 0.7, 0.76));
    const cut = midX.map(m => ease(win(tipX, m - 6, m + 70)) * (1 - rejoin));
    const bladeBack = ease(win(t, 0.6, 0.64));
    alpha(ctx, molA, () => {
      if (pass > 0.001 && bladeBack < 1) knife(ctx, tipX - bladeBack * w * 0.3, yCut, s * 4.4);
      water(ctx, mx, my, s, cut);
    });
    tag(ctx, 'molecule', mx, h * 0.17, { size: 26, a: molA * (1 - ease(win(t, 0.575, 0.6))) * (1 - rejoin) });
    tag(ctx, 'split into atoms', mx, h * 0.76, { size: 26, a: ease(win(t, 0.6, 0.64)) * (1 - rejoin) });

    // A single atom under the same blade: it only holds.
    const ax = w * 0.72 + h * 0.13;
    const ay = h * 0.5;
    const ar = h * 0.075;
    const aA = ease(win(t, 0.6, 0.65));
    if (aA > 0) {
      const press = ease(win(t, 0.64, 0.675)) * (1 - ease(win(t, 0.68, 0.7)));
      const shove = Math.sin(win(t, 0.66, 0.7) * Math.PI * 3) * 3 * (1 - win(t, 0.66, 0.7));
      ball(ctx, ax + shove, ay, ar, 'Na', { shadow: true });
      if (press > 0.002) knife(ctx, lerp(ax - ar - 330, ax - ar - 6, press), ay, h * 0.3);
      tag(ctx, 'atom: still whole', ax, h * 0.76, { size: 26, a: ease(win(t, 0.67, 0.7)) * (1 - ease(win(t, 0.74, 0.77))) });
    }

    // Phase D: the molecule is whole again, and the loose pair is only two atoms side by side.
    const dA = ease(win(t, 0.72, 0.78));
    const mxp = w * 0.72;
    if (dA > 0) {
      const comeIn = easeOut(win(t, 0.72, 0.8));
      ball(ctx, lerp(w * 0.97, mxp - h * 0.13, comeIn), ay, h * 0.08, 'C', { shadow: true });
      tag(ctx, 'compound', mx, h * 0.76, { size: 26, edge: C.amber, color: C.text, a: ease(win(t, 0.76, 0.82)) });
      tag(ctx, 'mixture', mxp, h * 0.76, { size: 26, edge: C.amber, color: C.text, a: ease(win(t, 0.8, 0.86)) });
      tag(ctx, 'different elements, joined', mx, h * 0.19, { size: 22, a: ease(win(t, 0.82, 0.88)) });
      tag(ctx, 'loose and unjoined', mxp, h * 0.19, { size: 22, a: ease(win(t, 0.84, 0.9)) });
    }
  }
  // Filed: the loose pair is what the powder was.
  const fA = stamp(t, 0.9, 0.97);
  if (fA > 0) brackets(ctx, w * 0.72 - h * 0.3, h * 0.5 - h * 0.17, h * 0.6, h * 0.34, C.amber, fA, 4);
}

/* ====================================================================================================================
   q2-core — a beam crosses a foil of mostly empty space; the nucleus; what each part is; what the bench cannot reach
   Phases: 0-.24 the beam, .24-.50 inside the atom, .50-.74 protons name the element, .74-.90 out of reach, .90-1 filed
   ==================================================================================================================== */

function beamPhase(ctx, w, h, t) {
  const cy = h * 0.5;
  const fx = w * 0.56;
  const bandW = w * 0.075;
  // The source: a steel block with a nozzle.
  const sg = ctx.createLinearGradient(0, cy - 60, 0, cy + 60);
  sg.addColorStop(0, '#6b625a'); sg.addColorStop(0.5, '#3c3833'); sg.addColorStop(1, '#1d1b18');
  ctx.fillStyle = sg;
  ctx.fillRect(w * 0.05, cy - 56, w * 0.085, 112);
  ctx.fillStyle = '#85796c';
  ctx.fillRect(w * 0.135, cy - 14, w * 0.025, 28);
  contact(ctx, w * 0.1, cy + 70, w * 0.05, 9, 0.4);
  tag(ctx, 'beam', w * 0.093, cy + 100, { size: 24 });

  // The foil, edge-on: nothing but a few tiny nuclei in a wide empty pane.
  ctx.fillStyle = 'rgba(184,175,160,0.05)';
  ctx.fillRect(fx - bandW, h * 0.1, bandW * 2, h * 0.8);
  line(ctx, fx - bandW, h * 0.1, fx - bandW, h * 0.9, 'rgba(184,175,160,0.25)', 1.5);
  line(ctx, fx + bandW, h * 0.1, fx + bandW, h * 0.9, 'rgba(184,175,160,0.25)', 1.5);
  const rows = 9;
  const pitch = (h * 0.8) / rows;
  const nuclei = [];
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < rows; r++) {
      const x = fx + (c - 1) * bandW * 0.62;
      const y = h * 0.1 + pitch * (r + 0.5);
      nuclei.push([x, y, c, r]);
      ball(ctx, x, y, 6, 'proton', { rim: false });
    }
  }

  // Shots: nearly all pass between the nuclei; one meets a nucleus head on and comes back.
  const wall = w * 0.92;
  const shots = 13;
  const hit = nuclei.find(n => n[2] === 0 && n[3] === 4);
  const hitY = hit[1];
  const impacts = [];
  for (let k = 0; k < shots; k++) {
    const isBack = k === 6;
    const gapY = isBack ? hitY : h * 0.1 + pitch * (((k * 5) % (rows - 1)) + 1);
    const ts = 0.012 + k * 0.015;
    const poly = isBack
      ? [[w * 0.16, gapY], [hit[0] - 10, gapY], [w * 0.32, h * 0.2]]
      : [[w * 0.16, gapY], [wall, gapY]];
    const total = pathLen(poly);
    const d = ((t - ts) / 0.1) * total;
    if (d > 0) {
      if (d < total * 1.12) streak(ctx, poly, Math.min(d, total), w * 0.13, isBack ? C.amber : C.text, isBack ? 4.2 : 3.4);
      if (d >= total) impacts.push({ x: poly[poly.length - 1][0], y: poly[poly.length - 1][1], back: isBack });
    }
  }
  // The wall and what lands on it.
  const wg = ctx.createLinearGradient(wall, 0, wall + 16, 0);
  wg.addColorStop(0, '#4a443d'); wg.addColorStop(1, '#1d1b18');
  ctx.fillStyle = wg;
  ctx.fillRect(wall, h * 0.1, 16, h * 0.8);
  // The back detector, beside the source.
  ctx.fillStyle = '#4a443d';
  ctx.fillRect(w * 0.28, h * 0.17, w * 0.1, 10);
  impacts.forEach(m => ball(ctx, m.x - (m.back ? 0 : 4), m.y, m.back ? 7 : 4.5, m.back ? 'proton' : 'electron', { rim: false }));
  tag(ctx, 'straight through', wall - 20, h * 0.05, { size: 24, align: 'right', a: from(t, 0.14) });
  tag(ctx, 'one comes back', w * 0.33, h * 0.1, { size: 24, color: C.amber, edge: C.amber, align: 'center', a: from(t, 0.19) });
}

function nucleusPhase(ctx, w, h, t, clock) {
  const cx = w * 0.42;
  const cy = h * 0.48;
  const grow = easeOut(win(t, 0.25, 0.31));
  const rr = h * 0.03 * grow;
  const nu = nucleons(6, 6, rr);
  shellsAt(ctx, cx, cy, [h * 0.25, h * 0.4], [2, 4], t, clock, { er: 9, a: ease(win(t, 0.3, 0.35)) });
  nu.forEach(([x, y, k]) => ball(ctx, cx + x, cy + y, h * 0.04 * grow, k, { shadow: false }));

  tag(ctx, 'nucleus', cx, cy - h * 0.2, { size: 24, a: from(t, 0.32) });
  leader(ctx, cx, cy - h * 0.2 + 22, cx, cy - h * 0.12, from(t, 0.32), C.steel);
  tag(ctx, 'shells', cx - h * 0.4 - 40, cy - h * 0.2, { size: 24, align: 'right', a: from(t, 0.34) });
  leader(ctx, cx - h * 0.4 - 40, cy - h * 0.2 + 12, cx - h * 0.4 * Math.cos(0.7), cy - h * 0.4 * Math.sin(0.7), from(t, 0.34), C.steel);

  // What each part is, with its charge.
  const lx = w * 0.71;
  [['proton', '+1', 0.35, 0.38], ['neutron', '0', 0.39, 0.5], ['electron', '-1', 0.43, 0.62]].forEach(([k, ch, a0, y]) => {
    const a = ease(win(t, a0, a0 + 0.04));
    alpha(ctx, a, () => {
      ball(ctx, lx, h * y, k === 'electron' ? 10 : 24, k, { shadow: k !== 'electron' });
      text(ctx, k, lx + 60, h * y - 2, { size: 26, color: C.text, align: 'left', scale: true });
      text(ctx, ch, lx + 330, h * y - 2, { size: 30, color: k === 'proton' ? C.amber : C.pale, align: 'right', weight: 700, scale: true });
    });
  });
  text(ctx, 'not to scale', w * 0.5, h * 0.95, { size: 20, color: C.dim, align: 'center', a: 1, scale: true });
}

function atomsPhase(ctx, w, h, t, clock) {
  const atoms = [
    { name: 'lithium', n: 3, radii: [0.1, 0.18], counts: [2, 1], x: 0.2 },
    { name: 'carbon', n: 6, radii: [0.1, 0.18], counts: [2, 4], x: 0.5 },
    { name: 'sodium', n: 11, radii: [0.085, 0.15, 0.215], counts: [2, 8, 1], x: 0.8 }
  ];
  atoms.forEach((a, i) => {
    const on = ease(win(t, 0.52 + i * 0.05, 0.58 + i * 0.05));
    const cx = w * a.x;
    const cy = h * 0.46;
    const outer = a.counts.length - 1;
    const hot = ease(win(t, 0.66, 0.7));
    shellsAt(ctx, cx, cy, a.radii.map(r => r * h), a.counts, t, clock, {
      er: 7.5, a: on, pick: (si) => hot > 0.5 && si === outer
    });
    alpha(ctx, on, () => {
      ball(ctx, cx, cy, h * 0.05, 'proton', { shadow: false });
      text(ctx, String(a.n), cx, cy + 1, { size: 32, color: '#1d1405', weight: 700 });
      tag(ctx, a.name, cx, cy + h * 0.31, { size: 26 });
    });
  });
  tag(ctx, 'protons decide the element', w * 0.5, h * 0.08, { size: 26, a: from(t, 0.54), color: C.text });
  const hl = ease(win(t, 0.66, 0.72));
  tag(ctx, 'outer shell: how it reacts', w * 0.5, h * 0.9, { size: 24, a: hl, edge: C.amber, color: C.text });
}

function reachPhase(ctx, w, h, t, clock) {
  const cx = w * 0.45;
  const cy = h * 0.5;
  const radii = [h * 0.11, h * 0.2, h * 0.3];
  shellsAt(ctx, cx, cy, radii, [2, 8, 1], t, clock, { er: 8 });
  ball(ctx, cx, cy, 8, 'proton', { rim: false });
  // Everything a bench can touch stops at the cloud of electrons.
  ring(ctx, cx, cy, radii[2] + 34, 'rgba(184,175,160,0.4)', 2, [8, 8]);
  tag(ctx, 'the bench stops here', cx, cy - radii[2] - 62, { size: 24, a: from(t, 0.8) });
  // A pair of tweezers comes in from the right, and stops.
  const reach = easeOut(win(t, 0.76, 0.82));
  const stopX = cx + radii[2] + 48;
  const tipX = lerp(w * 0.97, stopX, reach) + Math.sin(win(t, 0.82, 0.9) * 20) * 2 * (1 - win(t, 0.86, 0.9));
  const jaw = 7;
  line(ctx, w * 1.05, cy - 70, tipX, cy - jaw, '#8a8274', 7);
  line(ctx, w * 1.05, cy + 70, tipX, cy + jaw, '#8a8274', 7);
  line(ctx, w * 1.05, cy - 72, tipX, cy - jaw - 2, 'rgba(255,250,235,0.3)', 2);
  tag(ctx, 'protons', cx, cy + radii[2] + 70, { size: 24, color: C.amber, edge: C.amber, a: from(t, 0.82) });
  leader(ctx, cx, cy + radii[2] + 48, cx, cy + 10, from(t, 0.82), C.amber);
}

function beamFoil(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  alpha(ctx, 1 - win(t, 0.22, 0.27), () => beamPhase(ctx, w, h, t));
  alpha(ctx, between(t, 0.24, 0.52, 0.03), () => nucleusPhase(ctx, w, h, t, clock));
  alpha(ctx, between(t, 0.5, 0.76, 0.03), () => atomsPhase(ctx, w, h, t, clock));
  alpha(ctx, win(t, 0.74, 0.79), () => reachPhase(ctx, w, h, t, clock));
  const f = stamp(t, 0.9, 0.97);
  if (f > 0) brackets(ctx, w * 0.45 - 46, h * 0.5 - 46, 92, 92, C.amber, f, 4);
}

/* ====================================================================================================================
   q3-catalogue — atoms in order of protons fall into rows; periods and groups; give and take; one pair read off the chart
   Phases: 0-.24 order, .24-.48 rows and columns, .48-.74 give and take, .74-.90 salt, .90-1 filed
   ==================================================================================================================== */

const CHART = [
  ['H', 1, 0, 0], ['He', 2, 0, 7],
  ...['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'].map((s, i) => [s, 3 + i, 1, i]),
  ...['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'].map((s, i) => [s, 11 + i, 2, i])
];
const OUTER = { H: 1, He: 2, Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7, Ne: 8, Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7, Ar: 8 };

function chartFill(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  const cw = 110;
  const gap = 12;
  const tw = 8 * cw + 7 * gap;
  const x0 = (w - tw) / 2;
  const y0 = h * 0.2;
  const morph = ease(win(t, 0.13, 0.23));
  const dots = ease(win(t, 0.26, 0.32));
  const tints = ease(win(t, 0.5, 0.58));
  const focus = ease(win(t, 0.76, 0.82));

  // The empty places of the first row, so the shape of the chart reads.
  for (let c = 1; c < 7; c++) {
    const x = x0 + c * (cw + gap);
    ctx.strokeStyle = 'rgba(184,175,160,0.1)';
    ctx.setLineDash?.([4, 6]);
    ctx.strokeRect(x + 0.5, y0 + 0.5, cw - 1, cw - 1);
    ctx.setLineDash?.([]);
  }

  const cards = CHART.map(([sym, z, row, col], i) => {
    // First they lie in one row, by proton count.
    const lw = 62;
    const lx = (w - 18 * (lw + 4)) / 2 + i * (lw + 4);
    const ly = h * 0.46;
    const tx = x0 + col * (cw + gap);
    const ty = y0 + row * (cw + gap);
    const arrive = ease(win(t, 0.005 + i * 0.0035, 0.035 + i * 0.0035));
    return { sym, z, row, col, x: lerp(lx, tx, morph), y: lerp(ly, ty, morph) - (1 - arrive) * h * 0.2, s: lerp(lw, cw, morph), a: arrive };
  });

  const noble = s => s === 'He' || s === 'Ne' || s === 'Ar';
  const metal = s => ['Li', 'Be', 'Na', 'Mg', 'Al'].includes(s);
  const nonmetal = s => ['N', 'O', 'F', 'P', 'S', 'Cl'].includes(s);
  const hot = s => s === 'Na' || s === 'Cl';
  cards.forEach(c => {
    const dim = 1 - focus * (hot(c.sym) ? 0 : 0.72);
    alpha(ctx, c.a * dim, () => {
      const g = ctx.createLinearGradient(0, c.y, 0, c.y + c.s);
      let top = '#2b2723'; let bot = '#1a1815';
      if (tints > 0.01 && metal(c.sym)) { top = lerp3('#2b2723', '#4a3c26', tints); bot = lerp3('#1a1815', '#2a2114', tints); }
      if (tints > 0.01 && nonmetal(c.sym)) { top = lerp3('#2b2723', '#2f3d24', tints); bot = lerp3('#1a1815', '#1a2312', tints); }
      g.addColorStop(0, top); g.addColorStop(1, bot);
      ctx.fillStyle = g;
      ctx.fillRect(c.x, c.y, c.s, c.s * (c.s > 80 ? 1 : 1.12));
      ctx.strokeStyle = noble(c.sym) && tints > 0.4 ? C.amber : 'rgba(184,175,160,0.3)';
      ctx.lineWidth = noble(c.sym) && tints > 0.4 ? 2.5 : 1;
      ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.s - 1, c.s * (c.s > 80 ? 1 : 1.12) - 1);
      text(ctx, String(c.z), c.x + 9, c.y + 14, { size: lerp(15, 20, morph), color: C.dust, align: 'left' });
      text(ctx, c.sym, c.x + c.s / 2, c.y + c.s * 0.5, { size: lerp(26, 40, morph), color: C.text, weight: 700 });
      // The outer-shell count as a row of dots under the symbol.
      if (dots > 0.01) {
        const n = OUTER[c.sym];
        for (let d = 0; d < n; d++) ball(ctx, c.x + c.s / 2 + (d - (n - 1) / 2) * 9.5, c.y + c.s * 0.82, 3.6, 'electron', { rim: false });
      }
    });
  });

  // Phase A words.
  tag(ctx, 'atomic number', w * 0.5, h * 0.3, { size: 28, a: between(t, 0.07, 0.19, 0.03), color: C.text });
  tag(ctx, 'fewest protons', w * 0.12, h * 0.72, { size: 22, align: 'left', a: between(t, 0.08, 0.19, 0.03) });
  tag(ctx, 'most protons', w * 0.88, h * 0.72, { size: 22, align: 'right', a: between(t, 0.08, 0.19, 0.03) });

  // Phase B: a row is a period; a column is a group.
  const rowA = ease(win(t, 0.3, 0.36));
  brackets(ctx, x0 - 10, y0 + (cw + gap) * 2 - 8, tw + 20, cw + 16, C.amber, rowA * (1 - win(t, 0.49, 0.53)), 3);
  tag(ctx, 'period', x0 - 10, y0 + (cw + gap) * 3 + 22, { size: 24, align: 'left', a: rowA * (1 - win(t, 0.49, 0.53)), edge: C.amber, color: C.text });
  const colA = ease(win(t, 0.38, 0.44));
  brackets(ctx, x0 - 8, y0 - 8, cw + 16, (cw + gap) * 3 - gap + 16, C.amber, colA * (1 - win(t, 0.49, 0.53)), 3);
  tag(ctx, 'group', x0 + 2 * cw + 40, y0 + (cw + gap) * 3 + 22, { size: 24, align: 'left', a: colA * (1 - win(t, 0.49, 0.53)), edge: C.amber, color: C.text });
  tag(ctx, 'same outer-shell count', x0 + cw + 24 + 120, y0 - 26, { size: 22, align: 'left', a: colA * (1 - win(t, 0.49, 0.53)) });

  // Phase C: metals hand electrons over; nonmetals take them on; the noble gases want nothing.
  const lab = (s, px, col, a, align = 'center') => tag(ctx, s, px, y0 + (cw + gap) * 3 + 22, { size: 24, a, edge: col, color: C.text, align });
  lab('metals', x0 + 1 * (cw + gap) + cw / 2, C.amber, ease(win(t, 0.54, 0.6)) * (1 - focus));
  lab('nonmetals', x0 + 4 * (cw + gap) + cw / 2, C.green, ease(win(t, 0.58, 0.64)) * (1 - focus));
  lab('noble gases', x0 + tw, C.amber, ease(win(t, 0.62, 0.68)) * (1 - focus), 'right');
  // One electron leaves sodium for chlorine.
  const hop = ease(win(t, 0.64, 0.73));
  if (hop > 0 && hop < 1.001) {
    const nax = x0 + 0 * (cw + gap) + cw / 2;
    const clx = x0 + 6 * (cw + gap) + cw / 2;
    const yy = y0 + 2 * (cw + gap) + cw * 0.82;
    const ex = lerp(nax, clx, hop);
    const ey = yy - Math.sin(hop * Math.PI) * 120;
    ball(ctx, ex, ey, 11, 'electron', { rim: false });
  }

  // Phase D: salt is the pair that sits on opposite sides.
  const pair = ease(win(t, 0.76, 0.84));
  if (pair > 0) {
    const ny = y0 + 2 * (cw + gap) + cw / 2;
    const nax = x0 + cw;
    const clx = x0 + 6 * (cw + gap);
    line(ctx, nax + 4, ny, lerp(nax + 4, clx - 4, pair), ny, C.amber, 3, [10, 8]);
    tag(ctx, 'salt', (nax + clx) / 2, ny - 2, { size: 26, color: C.amber, edge: C.amber, a: win(pair, 0.5, 1) });
  }
  const f = stamp(t, 0.9, 0.97);
  if (f > 0) {
    brackets(ctx, x0 - 8, y0 + (cw + gap) * 2 - 8, cw + 16, cw + 16, C.amber, f, 4);
    brackets(ctx, x0 + 6 * (cw + gap) - 8, y0 + (cw + gap) * 2 - 8, cw + 16, cw + 16, C.amber, f, 4);
  }
}

/** A mix of two #rrggbb colours. */
function lerp3(a, b, k) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`;
}

/* ====================================================================================================================
   q4-ledger — three numbers per atom; isotopes; ions; a label against the counts
   Phases: 0-.24 three numbers, .24-.48 isotopes, .48-.74 ions, .74-.90 label against counts, .90-1 filed
   ==================================================================================================================== */

function ledgerRows(ctx, x, y, rw, rows, a, hot = -1) {
  alpha(ctx, a, () => {
    const rh = 64;
    ctx.fillStyle = 'rgba(12,11,9,0.92)';
    ctx.fillRect(x, y, rw, rows.length * rh + 54);
    ctx.strokeStyle = C.steel;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rows.length * rh + 53);
    text(ctx, 'ledger', x + 22, y + 28, { size: 22, color: C.dim, align: 'left', track: 3, scale: true });
    line(ctx, x + 16, y + 48, x + rw - 16, y + 48, C.rim, 1);
    rows.forEach(([name, val, on, sum], i) => {
      const ry = y + 48 + 34 + i * rh;
      alpha(ctx, on, () => {
        if (hot === i) { ctx.fillStyle = 'rgba(229,155,36,0.14)'; ctx.fillRect(x + 8, ry - 28, rw - 16, 56); }
        if (sum) line(ctx, x + 16, ry - 32, x + rw - 16, ry - 32, C.amber, 2);
        text(ctx, name, x + 26, ry, { size: 28, color: sum ? C.amber : C.dust, align: 'left', scale: true });
        text(ctx, String(val), x + rw - 26, ry, { size: 40, color: hot === i || sum ? C.amber : C.text, align: 'right', weight: 700, scale: true });
      });
    });
  });
}

/** An atom drawn nucleon by nucleon, with its electrons on their shells. `s` is the size of the whole atom's frame. */
function atomAt(ctx, cx, cy, s, protons, neutrons, shellCounts, t, clock, { er = 7, a = 1, ringed = -1 } = {}) {
  const radii = shellCounts.map((_, i) => s * (0.34 + i * 0.26));
  shellsAt(ctx, cx, cy, radii, shellCounts, t, clock, { er, a });
  alpha(ctx, a, () => {
    const nu = nucleons(protons, neutrons, s * 0.088);
    nu.forEach(([x, y, k], i) => {
      ball(ctx, cx + x, cy + y, s * 0.098, k, { shadow: false });
      if (ringed === i) ring(ctx, cx + x, cy + y, s * 0.145, C.amber, 3);
    });
  });
}

function threeNumbers(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  const cy = h * 0.5;

  // Phase A: one lithium atom and its ledger: protons, neutrons, charge, and what the first two add up to.
  const aA = 1 - ease(win(t, 0.25, 0.29));
  const lx = w * 0.3;
  atomAt(ctx, lx, cy, h * 0.58, 3, 4, [2, 1], t, clock, { a: aA * ease(win(t, 0.01, 0.07)) });
  const rowOn = i => ease(win(t, 0.07 + i * 0.045, 0.12 + i * 0.045));
  const hotRow = t < 0.19 ? Math.min(2, Math.floor((t - 0.07) / 0.045)) : -1;
  ledgerRows(ctx, w * 0.56, h * 0.2, w * 0.32, [['protons', 3, rowOn(0)], ['neutrons', 4, rowOn(1)], ['charge', 0, rowOn(2)], ['mass number', 7, ease(win(t, 0.19, 0.24)), true]], aA, hotRow);
  tag(ctx, 'lithium-7', lx, h * 0.9, { size: 26, a: aA * ease(win(t, 0.08, 0.14)) });

  // Phase B: two isotopes: the same protons, one neutron apart.
  const bA = ease(win(t, 0.27, 0.32)) * (1 - ease(win(t, 0.49, 0.53)));
  atomAt(ctx, w * 0.27, cy, h * 0.5, 3, 3, [2, 1], t, clock, { a: bA });
  atomAt(ctx, w * 0.7, cy, h * 0.5, 3, 4, [2, 1], t, clock, { a: bA, ringed: 6 });
  tag(ctx, 'lithium-6', w * 0.27, h * 0.86, { size: 26, a: bA });
  tag(ctx, 'lithium-7', w * 0.7, h * 0.86, { size: 26, a: bA });
  tag(ctx, 'isotopes: one neutron apart, same behaviour', w * 0.485, h * 0.1, { size: 26, a: bA * ease(win(t, 0.38, 0.44)), color: C.text, edge: C.amber });

  // Phase C: ions. Magnesium gives two electrons, one to each chlorine.
  const cA = between(t, 0.51, 0.77, 0.03);
  if (cA > 0) {
    const give = ease(win(t, 0.56, 0.68));
    const mg = { x: w * 0.19, y: cy };
    const cls = [{ x: w * 0.5, y: cy }, { x: w * 0.81, y: cy }];
    const s = h * 0.46;
    const outerLeft = give > 0.75 ? 0 : give > 0.2 ? 1 : 2;
    shellsAt(ctx, mg.x, mg.y, [s * 0.25, s * 0.4, s * 0.55], [2, 8, outerLeft], t, clock, { er: 6, a: cA });
    cls.forEach((c, i) => {
      const got = give > 0.62 + i * 0.12 ? 1 : 0;
      shellsAt(ctx, c.x, c.y, [s * 0.25, s * 0.4, s * 0.55], [2, 8, 7 + got], t, clock, { er: 6, a: cA });
    });
    alpha(ctx, cA, () => {
      [[mg, '12'], [cls[0], '17'], [cls[1], '17']].forEach(([c, n]) => {
        ball(ctx, c.x, c.y, h * 0.05, 'proton');
        text(ctx, n, c.x, c.y + 1, { size: 26, color: '#1d1405', weight: 700 });
      });
      tag(ctx, 'magnesium', mg.x, h * 0.93, { size: 24 });
      tag(ctx, 'chlorine', cls[0].x, h * 0.93, { size: 24 });
      tag(ctx, 'chlorine', cls[1].x, h * 0.93, { size: 24 });
    });
    // Two electrons cross the gap, one to each chlorine.
    [0, 1].forEach(i => {
      const p = ease(win(give, i * 0.12, 0.62 + i * 0.12));
      if (p > 0 && p < 1) {
        const ex = lerp(mg.x + s * 0.55, cls[i].x - s * 0.55, p);
        const ey = cy - Math.sin(p * Math.PI) * (130 + i * 70);
        ball(ctx, ex, ey, 10, 'electron', { rim: false });
      }
    });
    const done = ease(win(t, 0.66, 0.72));
    tag(ctx, 'cation  +2', mg.x, h * 0.12, { size: 24, color: C.text, edge: C.amber, a: cA * done });
    tag(ctx, 'anion  -1', cls[0].x, h * 0.12, { size: 24, color: C.text, edge: C.amber, a: cA * done });
    tag(ctx, 'anion  -1', cls[1].x, h * 0.12, { size: 24, color: C.text, edge: C.amber, a: cA * done });
    tag(ctx, 'plus two, minus one, minus one: zero', w * 0.5, h * 0.81, { size: 22, a: cA * ease(win(t, 0.71, 0.75)) });
  }

  // Phase D: a label against the counts.
  const dA = ease(win(t, 0.78, 0.84));
  if (dA > 0) {
    ctx.save();
    ctx.translate(w * 0.27, h * 0.5);
    ctx.rotate(-0.04);
    ctx.globalAlpha = dA;
    ctx.fillStyle = '#cfc4a8';
    ctx.fillRect(-190, -90, 380, 180);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(-190, 90, 380, 5);
    text(ctx, 'lithium-6', 0, -8, { size: 54, color: '#2a2418', weight: 700 });
    text(ctx, 'label', 0, 56, { size: 24, color: '#6b5f45' });
    ctx.restore();
    const strike = ease(win(t, 0.84, 0.9));
    line(ctx, w * 0.27 - 200, h * 0.5 - 14, w * 0.27 - 200 + 400 * strike, h * 0.5 - 8, C.danger, 6);
    ledgerRows(ctx, w * 0.56, h * 0.26, w * 0.32, [['protons', 3, 1], ['neutrons', 4, 1], ['charge', 0, 1]], dA, strike > 0.5 ? 1 : -1);
    tag(ctx, 'the counts: lithium-7', w * 0.72, h * 0.84, { size: 24, a: dA * strike, edge: C.amber, color: C.text });
    tag(ctx, 'the label', w * 0.27, h * 0.84, { size: 24, a: dA });
  }
  const f = stamp(t, 0.9, 0.97);
  if (f > 0) brackets(ctx, w * 0.56 - 12, h * 0.26 - 12, w * 0.32 + 24, 64 * 3 + 54 + 24, C.amber, f, 4);
}

/* ====================================================================================================================
   q5-assay — isotopes in fixed proportions; the beam that levels at the average; why it has a decimal; three claims
   Phases: 0-.24 the mix, .24-.50 level at the average, .50-.74 the decimal, .74-.90 three claims, .90-1 filed
   ==================================================================================================================== */

/** A pile of `n` chlorine atoms in columns of `cols`, standing on a bar whose local origin is the bar's top edge. */
function pile(ctx, cx, n, cols, r, kind) {
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const rw = Math.floor(i / cols);
    ball(ctx, cx + (c - (cols - 1) / 2) * r * 2.05, -r - rw * r * 1.85, r, kind, { shadow: false });
  }
}

function balanceBins(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  const xl = w * 0.24;
  const xr = w * 0.76;
  const xOf = v => lerp(xl, xr, (v - 35) / 2);
  const barY = h * 0.66;

  // Phase A: atoms fall into two bins, thirty to ten.
  const aA = 1 - win(t, 0.24, 0.3);
  if (aA > 0) {
    alpha(ctx, aA, () => {
      bench(ctx, w, h, 0.8);
      [[xl, 30, 6, 'chlorine-35', 'Cl'], [xr, 10, 5, 'chlorine-37', 'Cl']].forEach(([bx, n, cols, name], k) => {
        const r = 22;
        // The bin: a shallow open box.
        const bw = cols * r * 2.05 + 36;
        const by = h * 0.8;
        ctx.fillStyle = '#26221e';
        ctx.fillRect(bx - bw / 2, by - 22, bw, 22);
        ctx.fillStyle = '#4a443d';
        ctx.fillRect(bx - bw / 2 - 6, by - 150 - (k ? -60 : 60), 6, 128 + (k ? -60 : 60) + 22);
        ctx.fillRect(bx + bw / 2, by - 150 - (k ? -60 : 60), 6, 128 + (k ? -60 : 60) + 22);
        for (let i = 0; i < n; i++) {
          const land = ease(win(t, 0.02 + (i / n) * 0.14 + k * 0.03, 0.06 + (i / n) * 0.14 + k * 0.03));
          const c = i % cols;
          const rw = Math.floor(i / cols);
          const x = bx + (c - (cols - 1) / 2) * r * 2.05;
          const y = by - 22 - r - rw * r * 1.85;
          if (land > 0) ball(ctx, x, lerp(y - h * 0.5, y, land), r, k ? 'Cl37' : 'Cl', { shadow: false });
        }
        tag(ctx, name, bx, by + 60, { size: 24 });
      });
      // The proportion, read straight off the bins.
      const p = ease(win(t, 0.16, 0.22));
      alpha(ctx, p, () => {
        const px = w * 0.22, pw = w * 0.56, py = h * 0.12;
        ctx.fillStyle = '#5b7a32';
        ctx.fillRect(px, py, pw * 0.75, 26);
        ctx.fillStyle = '#3d5a20';
        ctx.fillRect(px + pw * 0.75, py, pw * 0.25, 26);
        text(ctx, 'three in four', px + pw * 0.375, py + 58, { size: 24, color: C.text, scale: true });
        text(ctx, 'one in four', px + pw * 0.875, py + 58, { size: 24, color: C.text, scale: true });
      });
    });
  }

  // Phases B-C: one bar, a number line from 35 to 37, and a pivot that slides to where it lies level.
  const bB = win(t, 0.26, 0.32) * (1 - win(t, 0.74, 0.78));
  if (bB > 0) {
    const slide = ease(win(t, 0.3, 0.46));
    const pv = lerp(36, 35.5, slide);
    const px = xOf(pv);
    // Torque about the pivot: thirty at 35 against ten at 37.
    const torque = 30 * (pv - 35) - 10 * (37 - pv);
    const tilt = -Math.max(-0.1, Math.min(0.1, torque * 0.0075));
    alpha(ctx, bB, () => {
      // The post and the bar.
      ctx.save();
      ctx.translate(px, barY);
      ctx.rotate(tilt);
      ctx.translate(-px, -barY);
      const bg = ctx.createLinearGradient(0, barY - 8, 0, barY + 8);
      bg.addColorStop(0, '#a59c8c'); bg.addColorStop(1, '#4a443d');
      ctx.fillStyle = bg;
      ctx.fillRect(xl - 60, barY - 8, xr - xl + 120, 16);
      ctx.translate(0, barY - 8);
      pile(ctx, xl, 30, 6, 17, 'Cl');
      pile(ctx, xr, 10, 5, 17, 'Cl37');
      ctx.restore();
      ctx.fillStyle = '#3c3833';
      ctx.beginPath();
      ctx.moveTo(px - 30, barY + 120);
      ctx.lineTo(px, barY + 6);
      ctx.lineTo(px + 30, barY + 120);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#6b625a';
      ctx.fillRect(px - 60, barY + 120, 120, 12);
      // The ticks of the number line.
      [35, 36, 37].forEach(v => {
        line(ctx, xOf(v), barY + 64, xOf(v), barY + 80, C.steel, 2);
        text(ctx, String(v), xOf(v), barY + 104, { size: 24, color: C.dust, scale: true });
      });
      line(ctx, xOf(35), barY + 72, xOf(37), barY + 72, C.rim, 2);
    });
    // The pivot's own reading, once it has come to rest.
    const rest = ease(win(t, 0.44, 0.5));
    alpha(ctx, rest * bB, () => {
      line(ctx, px, barY - 60, px, barY + 90, C.amber, 2, [6, 6]);
      tag(ctx, '35.5', px, h * 0.1, { size: 36, color: C.amber, edge: C.amber });
      tag(ctx, 'level', px, h * 0.27, { size: 22 });
    });
    // Phase C: no atom weighs 35.5; the pivot is simply nearer the common one.
    const dec = ease(win(t, 0.54, 0.62));
    alpha(ctx, dec * bB, () => {
      const y = barY + 150;
      line(ctx, xOf(35), y, px, y, C.amber, 4);
      line(ctx, px, y, xOf(37), y, C.steel, 4);
      [xOf(35), px, xOf(37)].forEach(x => line(ctx, x, y - 8, x, y + 8, C.text, 2));
      text(ctx, '0.5', (xOf(35) + px) / 2, y + 30, { size: 26, color: C.amber, weight: 700, scale: true });
      text(ctx, '1.5', (px + xOf(37)) / 2, y + 30, { size: 26, color: C.dust, weight: 700, scale: true });
      tag(ctx, 'every atom weighs 35 or 37', w * 0.6, h * 0.4, { size: 24, a: ease(win(t, 0.58, 0.66)), color: C.text });
    });
  }

  // Phase D: three samples against the one pivot.
  const dA = ease(win(t, 0.76, 0.82));
  if (dA > 0) {
    const samples = [['A', 30, 10], ['B', 20, 20], ['C', 36, 4]];
    samples.forEach(([name, n35, n37], i) => {
      const cx = w * (0.2 + i * 0.3);
      const half = w * 0.12;
      const torque = n35 * 0.5 - n37 * 1.5;
      const tilt = -Math.max(-0.2, Math.min(0.2, torque * 0.006));
      alpha(ctx, dA, () => {
        const cy = h * 0.54;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        const bg = ctx.createLinearGradient(0, -6, 0, 6);
        bg.addColorStop(0, '#a59c8c'); bg.addColorStop(1, '#4a443d');
        ctx.fillStyle = bg;
        ctx.fillRect(-half * 1.2, -6, half * 2.4, 12);
        const bar = (n, kind, ox) => {
          const cols = 4;
          for (let k = 0; k < Math.min(n, 24); k++) ball(ctx, ox + ((k % cols) - (cols - 1) / 2) * 21, -12 - Math.floor(k / cols) * 20, 10, kind, { shadow: false, rim: false });
        };
        bar(n35 * (24 / 36), 'Cl', -half * 0.85);
        bar(n37 * (24 / 36), 'Cl37', half * 0.85);
        ctx.restore();
        ctx.fillStyle = '#3c3833';
        ctx.beginPath();
        ctx.moveTo(cx - 22, cy + 96); ctx.lineTo(cx, cy + 4); ctx.lineTo(cx + 22, cy + 96);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#6b625a';
        ctx.fillRect(cx - 54, cy + 96, 108, 10);
        const ok = Math.abs(torque) < 0.01;
        tag(ctx, `sample ${name}`, cx, h * 0.82, { size: 24 });
        tag(ctx, ok ? 'level' : 'off the pivot', cx, h * 0.9, { size: 22, color: ok ? C.amber : C.dust, edge: ok ? C.amber : C.steel });
      });
    });
    tag(ctx, 'sold as natural: one levels', w * 0.5, h * 0.12, { size: 26, a: dA, color: C.text });
  }
  const f = stamp(t, 0.9, 0.97);
  if (f > 0) {
    [1, 2].forEach(i => brackets(ctx, w * (0.2 + i * 0.3) - w * 0.14, h * 0.54 - 150, w * 0.28, 300, C.amber, f, 4));
  }
}

/* ====================================================================================================================
   q6-weigh — a crate balanced by counted atoms; the mole; grams to moles; sealed drums on the dock
   Phases: 0-.24 count by weight, .24-.50 one mole, .50-.76 grams to moles, .76-.90 the dock, .90-1 filed
   ==================================================================================================================== */

function crate(ctx, cx, cy, s) {
  const g = ctx.createLinearGradient(cx - s, cy - s, cx + s, cy + s);
  g.addColorStop(0, '#5a4a33'); g.addColorStop(1, '#2c2417');
  ctx.fillStyle = g;
  ctx.fillRect(cx - s, cy - s * 1.5, s * 2, s * 1.5);
  ctx.strokeStyle = '#17120b';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - s + 1, cy - s * 1.5 + 1, s * 2 - 2, s * 1.5 - 2);
  [0.33, 0.66].forEach(k => line(ctx, cx - s + s * 2 * k, cy - s * 1.5, cx - s + s * 2 * k, cy, '#17120b', 2));
  line(ctx, cx - s, cy - s * 0.75, cx + s, cy - s * 0.75, '#17120b', 2);
  ctx.fillStyle = 'rgba(255,250,235,0.12)';
  ctx.fillRect(cx - s, cy - s * 1.5, s * 2, 3);
}

function drum(ctx, cx, by, rw, hh, sealed = true) {
  const g = ctx.createLinearGradient(cx - rw, 0, cx + rw, 0);
  g.addColorStop(0, '#2a2622'); g.addColorStop(0.3, '#6b625a'); g.addColorStop(0.7, '#4a443d'); g.addColorStop(1, '#1d1b18');
  ctx.fillStyle = g;
  ctx.fillRect(cx - rw, by - hh, rw * 2, hh);
  ctx.beginPath();
  ctx.ellipse(cx, by, rw, rw * 0.25, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, by - hh, rw, rw * 0.25, 0, 0, TAU);
  ctx.fillStyle = '#7f766a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  [0.3, 0.7].forEach(k => {
    line(ctx, cx - rw, by - hh * k, cx + rw, by - hh * k, 'rgba(0,0,0,0.45)', 3);
    line(ctx, cx - rw, by - hh * k - 3, cx + rw, by - hh * k - 3, 'rgba(255,250,235,0.14)', 1.5);
  });
  if (sealed) {
    ctx.beginPath();
    ctx.arc(cx, by - hh, rw * 0.16, 0, TAU);
    ctx.fillStyle = C.amber;
    ctx.fill();
  }
}

function scaleCount(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);

  // Phase A: a crate on one pan, counted atoms poured on the other until the beam is level.
  const aA = 1 - win(t, 0.24, 0.3);
  if (aA > 0) {
    alpha(ctx, aA, () => {
      bench(ctx, w, h, 0.86);
      const poured = ease(win(t, 0.04, 0.2));
      const tilt = (1 - poured) * 0.09;
      const cx = w * 0.5;
      const cy = h * 0.3;
      const half = w * 0.3;
      const { left, right } = balance(ctx, cx, cy, half, -tilt, { drop: h * 0.2, pan: w * 0.1, pivotX: cx });
      ctx.fillStyle = '#3c3833';
      const pg = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0);
      pg.addColorStop(0, '#2a2622'); pg.addColorStop(0.5, '#6b625a'); pg.addColorStop(1, '#2a2622');
      ctx.fillStyle = pg;
      ctx.fillRect(cx - 10, cy, 20, h * 0.86 - cy);
      crate(ctx, left.x, left.y, h * 0.13);
      const n = Math.round(poured * 60);
      for (let i = 0; i < n; i++) {
        const c = i % 12;
        const rw = Math.floor(i / 12);
        ball(ctx, right.x + (c - 5.5) * 17 + (rw % 2) * 7, right.y - 10 - rw * 16, 8, 'Na', { shadow: false, rim: false });
      }
      // The scoop, tipping.
      if (poured < 1) {
        const sx = right.x + w * 0.08;
        const sy = h * 0.06 + poured * h * 0.04;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(0.5 + poured * 0.4);
        ctx.fillStyle = '#6b625a';
        ctx.fillRect(-34, -18, 68, 36);
        ctx.fillStyle = '#2a2622';
        ctx.fillRect(-30, -14, 60, 8);
        ctx.restore();
      }
      tag(ctx, 'crate', left.x, left.y + h * 0.1, { size: 24 });
      tag(ctx, 'counted atoms', right.x, right.y + h * 0.1, { size: 24, a: ease(win(t, 0.16, 0.22)) });
      tag(ctx, 'level: the same number of atoms', cx, h * 0.93, { size: 24, color: C.text, edge: C.amber, a: ease(win(t, 0.18, 0.24)) });
    });
  }

  // Phase B: the listed mass, in grams, of anything holds the same count.
  const bA = between(t, 0.26, 0.52, 0.03);
  if (bA > 0) {
    const items = [['carbon', '12.0 g', 'C', 25], ['oxygen', '16.0 g', 'O', 25], ['hydrogen', '1.0 g', 'H', 25]];
    alpha(ctx, bA, () => {
      bench(ctx, w, h, 0.8);
      items.forEach(([name, g, kind, r], i) => {
        const cx = w * (0.19 + i * 0.31);
        const by = h * 0.8;
        // A flat scale plate with a reading window.
        const pg = ctx.createLinearGradient(0, by - 22, 0, by);
        pg.addColorStop(0, '#5a544c'); pg.addColorStop(1, '#2a2622');
        ctx.fillStyle = pg;
        ctx.fillRect(cx - 160, by - 22, 320, 22);
        ctx.fillStyle = '#0c0b09';
        ctx.fillRect(cx - 62, by - 16, 124, 11);
        const on = ease(win(t, 0.3 + i * 0.04, 0.38 + i * 0.04));
        alpha(ctx, on, () => {
          // The same thirty atoms on every plate; only what each one weighs differs.
          for (let k = 0; k < 30; k++) {
            const row = Math.floor(k / 7);
            const col = k % 7;
            const rr = kind === 'H' ? r * 0.62 : kind === 'O' ? r * 0.92 : r;
            ball(ctx, cx + (col - 3) * 36 + (row % 2) * 17, by - 22 - rr - row * rr * 1.7, rr, kind, { shadow: false, rim: false });
          }
          text(ctx, g, cx, by + 46, { size: 38, color: C.text, weight: 700, scale: true });
          tag(ctx, name, cx, by + 116, { size: 24 });
        });
      });
      tag(ctx, 'one mole of each', w * 0.5, h * 0.1, { size: 28, color: C.text, a: ease(win(t, 0.4, 0.46)) });
      alpha(ctx, ease(win(t, 0.44, 0.5)), () => {
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        const bw = 440;
        ctx.strokeRect(w * 0.5 - bw / 2, h * 0.17, bw, 70);
        sci(ctx, w * 0.5, h * 0.17 + 38, 44, C.amber);
        text(ctx, 'atoms or molecules', w * 0.5, h * 0.17 + 105, { size: 24, color: C.dust, scale: true });
      });
    });
  }

  // Phase C: a drum of 72 grams, 18 grams to a mole.
  const cA = between(t, 0.52, 0.78, 0.03);
  if (cA > 0) {
    alpha(ctx, cA, () => {
      bench(ctx, w, h, 0.84);
      const cx = w * 0.22;
      drum(ctx, cx, h * 0.8, 90, 190, true);
      ctx.fillStyle = '#3c3833';
      ctx.fillRect(cx - 150, h * 0.8 + 6, 300, 22);
      ctx.fillStyle = '#0c0b09';
      ctx.fillRect(cx - 60, h * 0.8 + 11, 120, 12);
      text(ctx, '72 g', cx, h * 0.8 + 70, { size: 38, color: C.text, weight: 700, scale: true });
      const eq = ease(win(t, 0.56, 0.62));
      text(ctx, '72 g  /  18 g per mole', w * 0.56, h * 0.26, { size: 42, color: C.text, scale: true });
      alpha(ctx, eq, () => text(ctx, '= 4 moles', w * 0.56, h * 0.38, { size: 60, color: C.amber, weight: 700, scale: true }));
      // Four moles, one token each.
      for (let i = 0; i < 4; i++) {
        const on = ease(win(t, 0.6 + i * 0.03, 0.66 + i * 0.03));
        alpha(ctx, on, () => {
          const tx = w * 0.4 + i * 150;
          const ty = h * 0.64 - (1 - on) * 40;
          ctx.fillStyle = '#26221e';
          ctx.fillRect(tx - 62, ty - 70, 124, 140);
          ctx.strokeStyle = C.amber;
          ctx.lineWidth = 2;
          ctx.strokeRect(tx - 61, ty - 69, 122, 138);
          for (let k = 0; k < 12; k++) ball(ctx, tx + ((k % 4) - 1.5) * 24, ty - 34 + Math.floor(k / 4) * 28, 10, 'C', { shadow: false, rim: false });
          text(ctx, 'mole', tx, ty + 54, { size: 22, color: C.dust });
        });
      }
    });
  }

  // Phase D: sealed drums on the dock, counted without opening one.
  const dA = ease(win(t, 0.78, 0.84));
  if (dA > 0) {
    alpha(ctx, dA, () => {
      // Dock planks.
      const dy = h * 0.74;
      ctx.fillStyle = '#2a241c';
      ctx.fillRect(0, dy, w, h - dy);
      for (let i = 0; i < 9; i++) line(ctx, i * (w / 8), dy, i * (w / 8) - 40, h, '#17130d', 3);
      line(ctx, 0, dy, w, dy, '#4a3f2d', 3);
      [0.2, 0.4, 0.6, 0.8].forEach((x, i) => {
        ctx.fillStyle = '#4a443d';
        ctx.fillRect(w * x - 104, dy + 40, 208, 14);
        ctx.fillStyle = '#0c0b09';
        ctx.fillRect(w * x - 40, dy + 44, 80, 6);
        drum(ctx, w * x, dy + 40, 76, 170 - (i % 2) * 20, true);
      });
      tag(ctx, 'sealed: counted by weight', w * 0.5, h * 0.12, { size: 26, color: C.text });
    });
  }
  const f = stamp(t, 0.9, 0.97);
  if (f > 0) brackets(ctx, w * 0.2 - 104, h * 0.74 - 160, w * 0.6 + 208, 260, C.amber, f, 4);
}

/* ====================================================================================================================
   boss-hopper — the five benches read the machine; it settles into slag; an ingot nobody mined; the Case File
   Phases: 0-.26 five benches, .26-.50 it settles, .50-.74 the ingot, .74-.90 the Case File, .90-1 filed
   ==================================================================================================================== */

function hopperBody(ctx, w, h, lit, settle) {
  const cx = w * 0.49;
  const gy = h * 0.82;
  const sink = easeOut(settle);
  const part = (id, fn) => {
    const off = sink * (h * 0.08 + id * h * 0.02);
    const kick = (id % 2 ? 1 : -1) * sink * w * 0.02 * (id + 1) * 0.5;
    ctx.save();
    ctx.translate(kick, off);
    fn(lit[id]);
    ctx.restore();
  };
  const edge = on => (on > 0.02 ? `rgba(229,155,36,${0.35 + on * 0.65})` : 'rgba(0,0,0,0.6)');
  const slab = (x, y, bw, bh, on, shade = 1) => {
    const g = ctx.createLinearGradient(x, y, x + bw, y + bh);
    g.addColorStop(0, `rgb(${Math.round(78 * shade)},${Math.round(72 * shade)},${Math.round(64 * shade)})`);
    g.addColorStop(1, `rgb(${Math.round(36 * shade)},${Math.round(33 * shade)},${Math.round(30 * shade)})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, bw, bh);
    ctx.strokeStyle = edge(on);
    ctx.lineWidth = on > 0.02 ? 3 : 2;
    ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
  };
  contact(ctx, cx, gy + 4, w * 0.3, 18, 0.5 * (1 - sink * 0.5));
  // 4: the feet and legs, where the swarm is weighed
  part(4, on => {
    slab(cx - w * 0.17, h * 0.58, w * 0.05, h * 0.24, on, 0.85);
    slab(cx + w * 0.12, h * 0.58, w * 0.05, h * 0.24, on, 0.85);
    slab(cx - w * 0.19, h * 0.8, w * 0.09, h * 0.03, on, 0.7);
    slab(cx + w * 0.1, h * 0.8, w * 0.09, h * 0.03, on, 0.7);
  });
  // 0: the hull plates
  part(0, on => {
    slab(cx - w * 0.16, h * 0.3, w * 0.32, h * 0.28, on, 1);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) ball(ctx, cx - w * 0.14 + i * w * 0.056, h * 0.34 + j * h * 0.08, 3.2, 'ingot', { rim: false });
  });
  // the funnel the Hopper takes its name from
  part(0, () => {
    ctx.fillStyle = '#4a443d';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.14, h * 0.12);
    ctx.lineTo(cx + w * 0.14, h * 0.12);
    ctx.lineTo(cx + w * 0.07, h * 0.3);
    ctx.lineTo(cx - w * 0.07, h * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,250,235,0.14)';
    ctx.fillRect(cx - w * 0.14, h * 0.12, w * 0.28, 4);
  });
  // 1: the core readout
  part(1, on => {
    ball(ctx, cx, h * 0.44, h * 0.075, 'ingot', { rim: true });
    ring(ctx, cx, h * 0.44, h * 0.085, edge(on), on > 0.02 ? 4 : 2);
    ball(ctx, cx, h * 0.44, h * 0.03, 'proton', { rim: false });
  });
  // 2: the cooling manifold
  part(2, on => {
    for (let i = 0; i < 3; i++) slab(cx + w * 0.17 + i * w * 0.022, h * 0.32, w * 0.016, h * 0.26, on, 0.9);
    slab(cx + w * 0.16, h * 0.3, w * 0.08, h * 0.03, on, 1);
  });
  // 3: the slag assay
  part(3, on => {
    slab(cx - w * 0.27, h * 0.36, w * 0.09, h * 0.14, on, 0.9);
    line(ctx, cx - w * 0.18, h * 0.42, cx - w * 0.16, h * 0.42, '#8a8274', 6);
  });
}

function hopperFall(ctx, w, h, t, clock = 0) {
  plate(ctx, w, h, clock);
  bench(ctx, w, h, 0.82);
  const cx = w * 0.49;

  const settle = win(t, 0.27, 0.46);
  // Each bench lights in turn, then stays lit until the machine goes cold.
  const lit = [0, 1, 2, 3, 4].map(i => ease(win(t, 0.02 + i * 0.045, 0.06 + i * 0.045)) * (1 - ease(win(t, 0.27, 0.34))));
  const bodyA = 1 - win(t, 0.44, 0.52);
  if (bodyA > 0) {
    // The machine sinks into the flat, so what is below the ground line is not drawn.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h * 0.82 + 3);
    ctx.clip();
    alpha(ctx, bodyA, () => hopperBody(ctx, w, h, lit, settle));
    ctx.restore();
  }
  // What each bench read, named on the part it read, in two columns clear of the machine.
  [
    ['matter', 0.11, 0.2, cx - w * 0.15, h * 0.33],
    ['isotopes', 0.11, 0.44, cx - w * 0.27, h * 0.43],
    ['the mole', 0.11, 0.7, cx - w * 0.145, h * 0.68],
    ['the atom', 0.84, 0.2, cx + w * 0.02, h * 0.44],
    ['the chart', 0.84, 0.46, cx + w * 0.23, h * 0.46]
  ].forEach(([name, px, py, tx, ty], i) => {
    const order = ['matter', 'the atom', 'the chart', 'isotopes', 'the mole'].indexOf(name);
    const a = from(t, 0.03 + order * 0.045, 0.02) * (1 - win(t, 0.27, 0.31));
    leader(ctx, w * px, h * py, tx, ty, a, C.steel);
    tag(ctx, name, w * px, h * py, { size: 26, a, color: C.text, edge: C.amber });
  });

  // The slag it settles into: grains that fall and heap.
  const rand = mulberry32(0x40);
  const grains = Math.round(easeOut(win(t, 0.3, 0.5)) * 420);
  for (let i = 0; i < grains; i++) {
    const a = rand() * TAU;
    const rr = Math.sqrt(rand()) * w * 0.22;
    const top = Math.max(0, 1 - (rr / (w * 0.22)));
    const x = cx + Math.cos(a) * rr;
    const y = h * 0.82 - 4 - rand() * h * 0.11 * top - Math.abs(Math.sin(a)) * 6 * (1 - top);
    const g = 90 + Math.floor(rand() * 70);
    ctx.fillStyle = `rgb(${g},${g - 6},${g - 16})`;
    ctx.fillRect(x, y, 3 + rand() * 3, 3 + rand() * 2);
  }
  tag(ctx, 'cold slag', cx + w * 0.27, h * 0.75, { size: 26, a: from(t, 0.38) * (1 - win(t, 0.5, 0.54)) });

  // The Case File, standing open to the right, takes the ingot in.
  const fa = ease(win(t, 0.74, 0.8));
  const fx = w * 0.79;
  const fy = h * 0.6;
  if (fa > 0) {
    alpha(ctx, fa, () => {
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

  // The ingot comes up out of the slag, is held to the light, and slides into the file.
  const up = ease(win(t, 0.5, 0.62));
  const toFile = ease(win(t, 0.77, 0.86));
  if (up > 0) {
    const ix = lerp(cx, fx, toFile);
    const iy = lerp(lerp(h * 0.8, h * 0.42, up), fy - 20, toFile);
    const sc = lerp(0.7, 1.9, up) * lerp(1, 0.52, toFile);
    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(sc, sc);
    const topG = ctx.createLinearGradient(-90, 0, 90, 0);
    topG.addColorStop(0, '#d8cfbb'); topG.addColorStop(0.5, '#f4ecd9'); topG.addColorStop(1, '#a89f8b');
    ctx.fillStyle = topG;
    ctx.beginPath();
    ctx.moveTo(-78, -30); ctx.lineTo(78, -30); ctx.lineTo(94, -4); ctx.lineTo(-94, -4);
    ctx.closePath(); ctx.fill();
    const frG = ctx.createLinearGradient(0, -4, 0, 40);
    frG.addColorStop(0, '#8d8579'); frG.addColorStop(1, '#38342d');
    ctx.fillStyle = frG;
    ctx.fillRect(-94, -4, 188, 44);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-94, -4, 188, 44);
    ctx.restore();
    if (toFile < 0.05) contact(ctx, ix, iy + 42 * sc, 100 * sc, 14 * sc, 0.45 * up);
    tag(ctx, 'bismuth', ix, iy - 84 * sc, { size: 30, color: C.amber, edge: C.amber, a: from(t, 0.54) * (1 - win(t, 0.76, 0.8)) });
    tag(ctx, 'nobody mined this', ix, iy + 100 * sc, { size: 22, a: from(t, 0.6) * (1 - win(t, 0.76, 0.8)) });
  }
  // The front of the file, over the ingot.
  if (fa > 0) {
    alpha(ctx, fa, () => {
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

  // The next world: an atom's shells, waiting to be explained.
  const na = ease(win(t, 0.8, 0.88));
  if (na > 0) {
    const nx = w * 0.2;
    const ny = h * 0.44;
    shellsAt(ctx, nx, ny, [h * 0.1, h * 0.19, h * 0.28], [2, 8, 1], t, clock, { er: 8, a: na, ringColor: 'rgba(184,175,160,0.3)' });
    alpha(ctx, na, () => {
      ball(ctx, nx, ny, 11, 'proton', { rim: false });
      tag(ctx, 'where electrons sit', nx, ny + h * 0.4, { size: 24 });
    });
  }
  const f = stamp(t, 0.9, 0.97);
  if (f > 0) brackets(ctx, fx - 176, fy - 166, 352, 290, C.amber, f, 4);
}

/**
 * The other worlds' painters were drawn on a 960 x 540 plate. They run in those units, scaled up to the canvas, so
 * their lines, labels and sizes come out as drawn; only the plate under them and the shading of their discs are the kit's.
 */
const legacy = scenes => Object.fromEntries(Object.entries(scenes).map(([id, fn]) => [id, (ctx, w, h, t) => {
  const k = w / 960;
  ctx.save();
  ctx.scale(k, k);
  fn(ctx, 960, h / k, t);
  ctx.restore();
}]));

export const SCENES = {
  'grain-resolve': grainResolve,
  'beam-foil': beamFoil,
  'chart-fill': chartFill,
  'three-numbers': threeNumbers,
  'balance-bins': balanceBins,
  'scale-count': scaleCount,
  'hopper-fall': hopperFall,
  // The other worlds' painters, each in its own file.
  ...legacy(BELLOWS_SCENES),
  ...legacy(LIGAR_SCENES),
  ...legacy(EMBER_SCENES),
  ...legacy(LANTERNFALL_SCENES),
  // The boss finales and two benches redrawn on the kit; they replace the same ids above.
  ...FINALE_SCENES
};

/** Paint one frame of a scene. An unknown scene paints the bare plate. */
export function paintScene(id, ctx, w, h, t, clock = 0) {
  setSceneClock(clock);
  (SCENES[id] || ((c, ww, hh, _t, ck) => plate(c, ww, hh, ck)))(ctx, w, h, clamp01(t), clock);
}
