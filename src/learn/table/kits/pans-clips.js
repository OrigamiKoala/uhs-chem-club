/**
 * kits/pans-clips.js — the lead-in clips of Teeter's predict stages, and the gas box of `q4-properties` stage 7.
 *
 *   CLIP   a looping demonstration of 5 to 8 seconds, no controls (`noRun`, no dial), put on a predict stage so the guess has a picture to
 *          stand on. A clip shows the IDEA on a case other than the one the stage asks about, and never the settled answer:
 *            react    a reaction A ⇌ B from its first ticks (the particles change colour, the graph begins to move)
 *            gasadd   a closed gas with a second gas added, the volume fixed
 *            dissolve a solid in water: crystals leave the heap as ions and return to it
 *            hill     two energy wells and the particles that fill them, for a ΔG° of −4 kJ/mol
 *   PGAS   a one-litre gas box: a crowd of particles for a concentration, the wall collisions of one second counted from the crowd, and
 *          the pressure that concentration gives (p = c × RT).
 * With the clock frozen a clip shows its last frame, standing still.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './pans-registry.js';
import { say, frameOf } from './matter-draw.js';
import { A_INK, B_INK, driftOf } from './pans-pan.js';
import { historyOf, stateOfParticle } from './pans-read.js';
import { R_ATM } from '../../engine/eqdata.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const GREY = '#8a8478';

function box(ctx, F, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
}
const dot = (ctx, F, x, y, r, ink) => { ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.8, F.len(r)), 0, Math.PI * 2); ctx.fill(); };
/** Seconds into a loop of `run` seconds of motion and `hold` seconds at the end: 0..1 while it plays, 1 while it holds; a frozen clock shows the end. */
const progress = (clock, run, hold = 1.6) => (clock ? Math.min(1, (clock % (run + hold)) / run) : 1);

/* ------------------------------------------------------------------ the scenes */

function sceneReact(ctx, F, f, clock) {
  const p = f.props;
  const { w, h } = f.size;
  const sys = { n: p.n ?? 48, b0: p.b0 ?? 0, kf: p.kf, kr: p.kr, seed: p.seed ?? 1 };
  const hist = historyOf(sys);
  const span = p.span ?? 40;
  const t = (p.from ?? 0) + Math.floor(progress(clock, span / (p.speed ?? 6)) * span);
  const ww = Math.min(w * 0.46, h - 11);
  box(ctx, F, 2, 8, ww, ww);
  const cols = 8; const rows = Math.ceil(sys.n / cols); const cw = ww / cols; const ch = ww / rows;
  for (let i = 0; i < sys.n; i++) {
    const d = driftOf(i, clock);
    const cx = 2 + (i % cols + 0.5) * cw + d.dx * cw * 0.2; const cy = 8 + (Math.floor(i / cols) + 0.5) * ch + d.dy * ch * 0.2;
    dot(ctx, F, cx, cy, Math.min(cw, ch) * 0.26, stateOfParticle(hist, i, t) ? B_INK : A_INK);
    if (clock && [0, 1, 2].some(k => t - k > 0 && stateOfParticle(hist, i, t - k) !== stateOfParticle(hist, i, t - k - 1))) {
      ctx.strokeStyle = AMBER; ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), Math.max(3, F.len(Math.min(cw, ch) * 0.4)), 0, Math.PI * 2); ctx.stroke();
    }
  }
  // The graph so far: A and B against time; the time axis spans the whole clip, so the curve is drawn as far as the clip has gone.
  const gx = 2 + ww + 3; const gw = w - gx - 2;
  box(ctx, F, gx, 8, gw, ww);
  const from = p.from ?? 0;
  const X = k => gx + ((k - from) / span) * gw; const Y = v => 8 + ww - (v / sys.n) * ww;
  for (const [pick, ink] of [[k => sys.n - hist.b[k], A_INK], [k => hist.b[k], B_INK]]) {
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.4, F.len(0.3)); ctx.beginPath();
    for (let k = from; k <= t; k++) { const px = F.x(X(k)); const py = F.y(Y(pick(k))); if (k === from) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke(); ctx.lineWidth = 1;
  }
  say(ctx, `time ${t}`, F.x(2), F.y(h - 2.6), F.size(2.3, 5.8), { color: DUST, weight: 700 });
}

function sceneGasAdd(ctx, F, f, clock) {
  const { w, h } = f.size;
  const bw = w - 4; const bh = h - 13;
  box(ctx, F, 2, 8, bw, bh);
  const kinds = [[6, '#6f8fb0'], [14, '#a8a090'], [4, '#c0652b']];
  let k = 0;
  for (const [n, ink] of kinds) for (let j = 0; j < n; j++, k++) {
    const d = driftOf(k, clock, 3.1);
    dot(ctx, F, 2 + bw * (0.5 + d.dx * 0.46 * (0.4 + (j % 5) * 0.14)), 8 + bh * (0.5 + d.dy * 0.44 * (0.4 + (j % 4) * 0.15)), 0.9, ink);
  }
  const added = Math.round(progress(clock, 5) * 10);
  for (let j = 0; j < added; j++, k++) {
    const d = driftOf(k + 50, clock, 3.1);
    dot(ctx, F, 2 + bw * (0.5 + d.dx * 0.46), 8 + bh * (0.5 + d.dy * 0.44), 0.9, GREY);
  }
  say(ctx, `grey gas added: ${added}`, F.x(2), F.y(h - 2.6), F.size(2.3, 5.8), { color: DUST, weight: 700 });
  say(ctx, 'same volume', F.x(w - 2), F.y(h - 2.6), F.size(2.2, 5.6), { color: DIM, align: 'right' });
}

function sceneDissolve(ctx, F, f, clock) {
  const { w, h } = f.size;
  const bw = w - 4; const bh = h - 13;
  box(ctx, F, 2, 8, bw, bh);
  ctx.fillStyle = '#1b2227'; ctx.fillRect(F.x(2.6), F.y(11), F.len(bw - 1.2), F.len(bh - 3.6));
  const n = 12; let leaving = 0;
  for (let i = 0; i < n; i++) {
    const phase = Math.sin(clock * 0.8 + i * 2.1 + 0.4) > (clock ? 0.2 : 0.99);
    const hx = 2 + bw * 0.12 + (i % 6) * (bw * 0.76 / 6); const hy = 8 + bh - 2.4 - Math.floor(i / 6) * 2.4;
    if (!phase) { ctx.fillStyle = '#d6cfb8'; ctx.fillRect(F.x(hx - 1.1), F.y(hy - 1.1), F.len(2.2), F.len(2.2)); } else {
      leaving++;
      const d = driftOf(i + 70, clock, 1.4);
      dot(ctx, F, hx + d.dx * 2.2, 8 + bh * 0.45 + d.dy * bh * 0.2, 0.8, A_INK);
      dot(ctx, F, hx + 2 + d.dy * 2.2, 8 + bh * 0.45 + d.dx * bh * 0.2 + 1.2, 0.8, B_INK);
    }
  }
  say(ctx, `dissolved now: ${leaving} of ${n}`, F.x(2), F.y(h - 2.6), F.size(2.3, 5.8), { color: DUST, weight: 700, maxW: F.len(w - 4) });
}

/** Two wells: the left holds the reactant, the right the product, at the depth the free energy change gives; the fraction in each well is the Boltzmann share at 298 K. */
function sceneHill(ctx, F, f, clock) {
  const { w, h } = f.size;
  const dG = f.props.dG ?? -4;
  const RT = 8.314 * 298.15 / 1000;
  const pProd = 1 / (1 + Math.exp(dG / RT));
  const bw = w - 4; const bh = h - 13;
  box(ctx, F, 2, 8, bw, bh);
  const wellY = side => (side === 0 ? 8 + bh * 0.5 : 8 + bh * Math.min(0.85, Math.max(0.2, 0.5 + dG / 20)));
  // The two floors, drawn as short rules at each well's depth.
  for (const side of [0, 1]) {
    const x0 = 2 + bw * (side ? 0.56 : 0.08); const x1 = x0 + bw * 0.34;
    ctx.strokeStyle = side ? B_INK : A_INK; ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(wellY(side) + 2)); ctx.lineTo(F.x(x1), F.y(wellY(side) + 2)); ctx.stroke();
    say(ctx, side ? 'product' : 'reactant', F.x((x0 + x1) / 2), F.y(wellY(side) + 5), F.size(2.2, 5.6), { align: 'center', color: DUST });
  }
  const N = 20; const nProd = Math.round(N * pProd);
  for (let i = 0; i < N; i++) {
    const side = i < nProd ? 1 : 0;
    const x0 = 2 + bw * (side ? 0.56 : 0.08);
    const k = side ? i : i - nProd;
    const d = driftOf(i + 11, clock, 2.4);
    dot(ctx, F, x0 + bw * 0.34 * ((k % 7 + 0.5) / 7) + d.dx * 0.9, wellY(side) - 1 - Math.floor(k / 7) * 2.4 + d.dy * 0.9, 0.9, side ? B_INK : A_INK);
  }
  say(ctx, `ΔG° ${String(dG).replace('-', '−')} kJ/mol`, F.x(2), F.y(f.size.h - 2.6), F.size(2.3, 5.8), { color: AMBER, weight: 700 });
}

const SCENES = { react: sceneReact, gasadd: sceneGasAdd, dissolve: sceneDissolve, hill: sceneHill };

function paintClip(ctx, f, state, b) {
  const F = frameOf(b);
  const clock = b.clock || 0;
  say(ctx, f.label, F.x(2), F.y(4.2), F.size(2.4, 6), { color: DUST, weight: 700, maxW: F.len(f.size.w - 4) });
  SCENES[f.props.scene](ctx, F, f, clock);
}

registerFixture('clip', { paint: paintClip, live: () => true });

/** A lead-in clip: `scene` is one of react, gasadd, dissolve, hill; the rest of `props` is that scene's own. */
export function clipFixture(id, at, scene, { title = 'Demonstration', w = 44, h = 32, ...props } = {}) {
  return { id, kind: 'clip', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { scene, ...props } };
}

/* ------------------------------------------------------------------ the gas box */

/** A one-litre box holding `c` mol of gas at `T` kelvin: the crowd, the collisions of one second counted from it, and p = c × RT. */
export function pgasRead(f) {
  const { c, T = 298 } = f.props;
  const RT = R_ATM * T;
  return { c, T, RT, p: c * RT, n: Math.max(1, Math.round(c * 400)) };
}

function paintPgas(ctx, f, state, b) {
  const F = frameOf(b);
  const r = pgasRead(f);
  const { w, h } = f.size;
  const clock = b.clock || 0;
  say(ctx, f.label, F.x(2), F.y(4.2), F.size(2.4, 6), { color: DUST, weight: 700, maxW: F.len(w - 4) });
  const bw = w - 4; const bh = h - 20;
  box(ctx, F, 2, 8, bw, bh);
  // Each particle crosses the box at a pace set by the temperature; each time it meets a wall it is counted.
  let hits = 0;
  for (let i = 0; i < r.n; i++) {
    const d = driftOf(i + 5, clock, 3.4 * Math.sqrt(r.T / 298));
    const sx = 0.5 + d.dx * 0.46; const sy = 0.5 + d.dy * 0.46;
    dot(ctx, F, 2 + bw * sx, 8 + bh * sy, 0.8, A_INK);
    if (Math.abs(d.dx) > 0.985 || Math.abs(d.dy) > 0.985) hits++;
  }
  void hits;
  const sz = F.size(2.3, 5.8);
  say(ctx, `c = ${r.c} mol in 1 L`, F.x(2), F.y(h - 10.4), sz, { color: DUST, maxW: F.len(w - 4) });
  say(ctx, `p = c × RT = ${(r.p).toFixed(2)} atm`, F.x(2), F.y(h - 6.2), sz, { color: AMBER, weight: 700, maxW: F.len(w - 4) });
  say(ctx, `RT ${r.RT.toFixed(1)} L·atm/mol`, F.x(2), F.y(h - 2.4), F.size(2.1, 5.6), { color: DIM, maxW: F.len(w - 4) });
}

registerFixture('pgas', { paint: paintPgas, live: () => true });

export function pgasFixture(id, at, { c, T = 298, title = 'Gas in a 1 L box', w = 44, h = 44 } = {}) {
  return { id, kind: 'pgas', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { c, T } };
}
