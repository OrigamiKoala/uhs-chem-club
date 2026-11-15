/**
 * kits/nuke-draw.js — the drawing helpers every Cinder Halo painter shares: words, frames, keys drawn on a fixture, a nucleus of counted
 * protons and neutrons, a track of radiation with its trail of ions, and a clock for a change that has just happened. The general helpers
 * (words, frames, the change clock) are Thornmere's (`thorn-draw.js`), used as they are. Pure functions of what they are given.
 *
 * COLOUR. A proton is rust, a neutron grey; an electron or a beta particle a pale dot; a positron a pale dot ringed in steel blue; alpha
 * particles and their trails ochre, beta pale, gamma a thin wavy line. Amber is a signal (a key that is on), never a surface.
 */

import { C as THORN_C, frameOf, say, title, foot, progress, ease, lerp, clamp } from './thorn-draw.js';
import { scatter } from '../../engine/nucdata.js';

export { frameOf, say, title, foot, progress, ease, lerp, clamp };

export const C = Object.freeze({
  ...THORN_C,
  proton: '#b4572f',
  protonRim: '#d47a4c',
  neutron: '#8a8478',
  neutronRim: '#aaa395',
  e: '#efe6cf',
  positron: '#9ab6d4',
  alpha: '#c9933e',
  beta: '#e6dcc4',
  gamma: '#c8c2a0',
  ion: '#d9b26a',
  win: '#100f0c',
  plus: '#c0652b',
  minus: '#6f8fb0',
  shield: { paper: '#d8cfb8', aluminium: '#9aa3ab', lead: '#4b4f56' }
});

/** A filled rectangle in fixture units, with an optional 1 px edge. */
export function box(ctx, F, x, y, w, h, fill, edge = null) {
  if (fill) { ctx.fillStyle = fill; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h)); }
  if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h))); }
}

/** A key drawn on a fixture (a tap zone's face): outlined, amber when it is on. */
export function key(ctx, F, z, text, on = false) {
  box(ctx, F, z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0, on ? '#2c2416' : '#1b1915', on ? C.amber : C.steel);
  say(ctx, text, F.x((z.x0 + z.x1) / 2), F.y((z.y0 + z.y1) / 2), F.size(1.85, 6.2), { align: 'center', color: on ? C.amber : C.text, weight: on ? 700 : 500, maxW: F.len(z.x1 - z.x0 - 0.8) });
}

/** A row of keys laid left to right from `x0` at height `y`: returns the zones `{x0, x1, y0, y1}` in fixture units. */
export function keyRow(labels, x0, y, { h = 5, gap = 1.2, pad = 2.4, per = 1.75 } = {}) {
  let x = x0;
  return labels.map(t => {
    const w = Math.max(8, String(t).length * per + pad);
    const z = { x0: x, x1: x + w, y0: y, y1: y + h };
    x += w + gap;
    return z;
  });
}

/* ------------------------------------------------------------------ a nucleus */

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** Where the k-th of n nucleons sits in a packed disc of radius 1 (a sunflower spiral, so any n packs evenly). */
export function nucleonPlace(k, n) {
  const r = Math.sqrt((k + 0.5) / n);
  const a = k * GOLDEN;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}
/** Which places of a nucleus of Z protons and N neutrons hold protons: spread through it by a seeded shuffle. */
export function protonSlots(Z, N, seed = 'nuc') {
  const n = Z + N;
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => scatter(`${seed}:${a}`) - scatter(`${seed}:${b}`));
  const isP = new Array(n).fill(false);
  for (let i = 0; i < Z; i++) isP[order[i]] = true;
  return isP;
}
/**
 * A nucleus at (cx, cy) in fixture units, of radius `R`, its nucleons drawn as discs: `isP` says which are protons; `skip` (a Set of
 * indices) leaves some out (they are drawn by the caller as they leave); `turn` (a Map index → 'p' | 'n' with a mix 0..1) recolours some.
 */
export function drawNucleus(ctx, F, cx, cy, R, isP, { skip = null, turn = null, jitter = 0, clock = 0 } = {}) {
  const n = isP.length;
  const r = Math.max(0.35, (R / Math.sqrt(n)) * 0.95);
  for (let k = n - 1; k >= 0; k--) {
    if (skip && skip.has(k)) continue;
    const q = nucleonPlace(k, n);
    const jx = jitter ? Math.sin(clock * 31 + k * 1.7) * jitter : 0;
    const jy = jitter ? Math.cos(clock * 27 + k * 2.3) * jitter : 0;
    let p = isP[k];
    let fill = p ? C.proton : C.neutron;
    if (turn && turn.has(k)) {
      const { to, k: mix } = turn.get(k);
      p = to === 'p';
      fill = mix >= 0.5 ? (p ? C.proton : C.neutron) : (p ? C.neutron : C.proton);
    }
    nucleon(ctx, F, cx + q.x * R + jx, cy + q.y * R + jy, r, p ? 'p' : 'n', fill);
  }
}
/** One proton or neutron, at fixture units. */
export function nucleon(ctx, F, x, y, r, kind, fill = null) {
  ctx.fillStyle = fill || (kind === 'p' ? C.proton : C.neutron);
  ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.2, F.len(r)), 0, Math.PI * 2); ctx.fill();
  if (F.len(r) > 3) { ctx.strokeStyle = kind === 'p' ? C.protonRim : C.neutronRim; ctx.lineWidth = 1; ctx.stroke(); }
}
/** A small particle: an electron, a positron (ringed), drawn at fixture units. */
export function lepton(ctx, F, x, y, r, positron = false) {
  ctx.fillStyle = C.e;
  ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.5, F.len(r)), 0, Math.PI * 2); ctx.fill();
  if (positron) { ctx.strokeStyle = C.positron; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1; }
}
/** A gamma ray: a short wavy line from (x0, y0) running `len` along `ang`, at fixture units. */
export function gammaWave(ctx, F, x0, y0, ang, len, phase = 0, color = C.gamma) {
  ctx.strokeStyle = color; ctx.lineWidth = 1.4;
  ctx.beginPath();
  const ux = Math.cos(ang); const uy = Math.sin(ang);
  for (let s = 0; s <= len; s += 0.4) {
    const w = Math.sin(s * 2.2 + phase) * 0.55;
    const x = x0 + ux * s - uy * w; const y = y0 + uy * s + ux * w;
    if (s === 0) ctx.moveTo(F.x(x), F.y(y)); else ctx.lineTo(F.x(x), F.y(y));
  }
  ctx.stroke(); ctx.lineWidth = 1;
}

/** A nuclear symbol with mass number above and atomic number below, at fixture units; returns its width in fixture units. */
export function nucSym(ctx, F, x, y, A, Z, sym, size = 2.4, o = {}) {
  const s = F.size(size, 7); const sm = F.size(size * 0.62, 5.5);
  const color = o.color || C.text;
  say(ctx, String(A), F.x(x), F.y(y) - s * 0.42, sm, { align: 'left', color, sans: true });
  say(ctx, String(Z), F.x(x), F.y(y) + s * 0.42, sm, { align: 'left', color, sans: true });
  ctx.font = `600 ${sm}px "Quantico", sans-serif`;
  const wNum = Math.max(ctx.measureText(String(A)).width, ctx.measureText(String(Z)).width);
  say(ctx, sym, F.x(x) + wNum + 1, F.y(y), s, { align: 'left', color, weight: 700, sans: true });
  ctx.font = `700 ${s}px "Quantico", sans-serif`;
  return (wNum + 1 + ctx.measureText(sym).width) / (F.len(1) || 1);
}

/** Thousands with a comma: 1860 → "1,860". */
export const commas = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** A minus sign that reads as one. */
export const signed = n => String(n).replace('-', '−');
