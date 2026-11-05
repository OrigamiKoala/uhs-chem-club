/**
 * kits/pans-pan.js — the pan and its fixtures, registered on the pans kit (`pans-registry.js`). Teeter's first bench (`q1-both`).
 *
 *   PAN   a shallow dish seen from above. Its WINDOW shows 48 particles, each A (orange) or B (blue); its PLOT draws the number of each
 *         against time; two TALLIES count the changes of the last ten ticks, A turning to B and B turning to A. The Run key lets ten
 *         more ticks go by. With `tracer` eight particles are ringed and a strip below the plot keeps their colour tick by tick.
 *
 * Simulation: each particle changes with a fixed chance per tick (see `engine/eqdata.js`). A painter prints what `panRead` says.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, registerPiece } from './pans-registry.js';
import { say, slab, frameOf } from './matter-draw.js';
import { rng } from '../../engine/eqdata.js';
import { panRead, historyOf, systemOf, stateOfParticle, PAN_TICKS, PAN_STEP, TRACERS } from './pans-read.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
/** A is orange and B is blue on every pan; these are the colours the plot, the window and the strip share. */
export const A_INK = '#c0652b';
export const B_INK = '#6f8fb0';

function frame(ctx, F, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
}

/** The window: 48 cells in a jittered grid, so no two particles overlap; the jitter is fixed by the tick so a still pan holds still. */
function paintWindow(ctx, F, r, x, y, w, h, tracer) {
  frame(ctx, F, x, y, w, h);
  const n = r.n;
  const cols = 8; const rows = Math.ceil(n / cols);
  const cw = w / cols; const ch = h / rows;
  const rad = Math.min(cw, ch) * 0.3;
  for (let i = 0; i < n; i++) {
    const g = rng(i * 7919 + r.t * 104729 + 17);
    const cx = x + (i % cols + 0.5) * cw + (g() - 0.5) * cw * 0.34;
    const cy = y + (Math.floor(i / cols) + 0.5) * ch + (g() - 0.5) * ch * 0.34;
    const isB = stateOfParticle(r.hist, i, r.t);
    ctx.fillStyle = isB ? B_INK : A_INK;
    ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), Math.max(2, F.len(rad)), 0, Math.PI * 2); ctx.fill();
    if (tracer && TRACERS.includes(i)) {
      ctx.strokeStyle = '#dcd6cc'; ctx.lineWidth = Math.max(1.2, F.len(0.35));
      ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), Math.max(3, F.len(rad * 1.6)), 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    }
  }
}

/** The plot: A and B against time, both numbers named on the axis. */
function paintPlot(ctx, F, f, r, x, y, w, h) {
  frame(ctx, F, x, y, w, h);
  const n = r.n;
  const X = t => x + (t / PAN_TICKS) * w;
  const Y = v => y + h - (v / n) * h;
  // The scale: 0, half and all of the particles, in numbers, so the curve can be read against it.
  ctx.strokeStyle = DIM; ctx.setLineDash([2, 3]);
  for (const v of [n / 2]) { ctx.beginPath(); ctx.moveTo(F.x(x), F.y(Y(v))); ctx.lineTo(F.x(x + w), F.y(Y(v))); ctx.stroke(); }
  ctx.setLineDash([]);
  const sz = F.size(2.2, 5.8);
  say(ctx, String(n), F.x(x) + 3, F.y(y) + sz * 0.7, sz, { color: DIM });
  say(ctx, String(n / 2), F.x(x) + 3, F.y(Y(n / 2)) - sz * 0.7, sz, { color: DIM });
  say(ctx, '0', F.x(x) + 3, F.y(y + h) - sz * 0.7, sz, { color: DIM });
  const draw = (pick, ink, width = 1.6) => {
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(width, F.len(0.3));
    ctx.beginPath();
    for (let t = 0; t <= r.t; t++) { const px = F.x(X(t)); const py = F.y(Y(pick(t))); if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke(); ctx.lineWidth = 1;
  };
  const p = f.props;
  if (p.ghost) {
    const gh = historyOf({ ...r.sys, b0: p.ghost.b0, seed: p.ghost.seed });
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = B_INK; ctx.setLineDash([3, 3]); ctx.beginPath();
    for (let t = 0; t <= r.t; t++) { const px = F.x(X(t)); const py = F.y(Y(gh.b[t])); if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  draw(t => n - r.hist.b[t], A_INK);
  draw(t => r.hist.b[t], B_INK);
  // The time reached.
  ctx.strokeStyle = DIM; ctx.beginPath(); ctx.moveTo(F.x(X(r.t)), F.y(y)); ctx.lineTo(F.x(X(r.t)), F.y(y + h)); ctx.stroke();
  say(ctx, 'time', F.x(x + w) - 3, F.y(y + h) + sz * 1.0, sz, { color: DIM, align: 'right' });
}

/** Eight rows, one per ringed particle; a cell per tick over the last forty, orange for A and blue for B. */
function paintStrip(ctx, F, r, x, y, w, h) {
  frame(ctx, F, x, y, w, h);
  const span = 40;
  const cw = w / span; const rh = h / TRACERS.length;
  for (let k = 0; k < TRACERS.length; k++) {
    for (let c = 0; c < span; c++) {
      const t = r.t - (span - 1) + c;
      if (t < 0) continue;
      ctx.fillStyle = stateOfParticle(r.hist, TRACERS[k], t) ? B_INK : A_INK;
      ctx.fillRect(F.x(x + c * cw), F.y(y + k * rh) + 0.5, Math.ceil(F.len(cw)), Math.ceil(F.len(rh)) - 1);
    }
  }
}

function paintPan(ctx, f, state, b) {
  const F = frameOf(b);
  const r = panRead(state, f.id);
  const p = f.props;
  const w = f.size.w; const h = f.size.h;
  const top = 9;
  const hasWin = p.window !== false;
  const ww = hasWin ? 30 : 0;
  const px = hasWin ? ww + 7 : 3.5;
  const ph = p.tracer ? h - top - 30 : h - top - 11;
  if (hasWin) paintWindow(ctx, F, r, 3.5, top, ww, p.tracer ? ph : Math.min(ph, ww * 0.75), p.tracer);
  paintPlot(ctx, F, f, r, px, top, w - px - 3.5, ph);
  if (p.tracer) {
    paintStrip(ctx, F, r, px, top + ph + 5, w - px - 3.5, 13.5);
    say(ctx, 'ringed spheres, last 40 ticks', F.x(px), F.y(top + ph + 2.6), F.size(1.9, 5.6), { color: DIM, maxW: F.len(w - px - 3.5) });
  }
  const y = h - 3.6;
  const sz = F.size(2.3, 6);
  say(ctx, `time ${r.t}`, F.x(2.5), F.y(y - (hasWin ? 0 : 4.3)), sz, { color: DUST, weight: 700 });
  if (p.tallies !== false) {
    if (hasWin) say(ctx, `last 50 ticks: A to B ${r.fwd}, B to A ${r.rev}`, F.x(18), F.y(y), sz, { color: AMBER, weight: 700, maxW: F.len(w - 18 - 14) });
    else {
      say(ctx, `A to B ${r.fwd}`, F.x(2.5), F.y(y - 0.2), sz, { color: AMBER, weight: 700 });
      say(ctx, `B to A ${r.rev}`, F.x(2.5 + 17), F.y(y - 0.2), sz, { color: AMBER, weight: 700 });
    }
  }
}

function run(state, fid) {
  const f = state.fixtures[fid];
  const r = panRead(state, fid);
  if (r.t >= PAN_TICKS) return { noop: 'The pan has run for its full time.' };
  const t = r.t + PAN_STEP;
  const hist = r.hist;
  return { x: t, y: hist.b[t], label: fid, dials: { [fid]: { t } } };
}

registerFixture('pan', {
  paint: paintPan,
  run
});

/**
 * A pan. `kf` is the chance per tick that a particle of A turns to B and `kr` that a particle of B turns back; `b0` the particles of B at the
 * start; `start` the tick the pan has already been run to. Options: `tracer`, `window: false`, `tallies: false`, `ghost: {b0, seed}`.
 */
export function panFixture(id, at, { kf, kr, b0 = 0, n = 48, seed = 1, start = 0, tracer = false, window = true, tallies = true, ghost = null, title = 'Pan', w = null, h = null } = {}) {
  const size = { w: w ?? (window ? 100 : 50), h: h ?? (tracer ? 60 : window ? 44 : 44) };
  return {
    id, kind: 'pan', label: title, at: { ...at }, size, runLabel: 'Run',
    dials: { t: { min: 0, max: PAN_TICKS, step: PAN_STEP, value: start, label: 'Time' } },
    props: { hidden: ['t'], kf, kr, b0, n, seed, tracer, window, tallies, ...(ghost ? { ghost } : {}) }
  };
}

/* ------------------------------------------------------------------
   THE DIAGRAM CARD: a pan's spheres, frozen, as a picture to be matched
   ------------------------------------------------------------------ */

const RECT_DGM = { hw: 10.5, hh: 9.5 };

function paintDiagram(ctx, p, state, o) {
  const sc = o.sc;
  const x0 = o.x - RECT_DGM.hw * sc; const y0 = o.y - RECT_DGM.hh * sc; const w = RECT_DGM.hw * 2 * sc; const h = RECT_DGM.hh * 2 * sc;
  ctx.fillStyle = '#16140f'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  const { a, b } = p.props;
  const n = a + b; const cols = 8; const rows = Math.ceil(n / cols);
  const cw = (w - 3 * sc) / cols; const ch = (h - 7.5 * sc) / rows;
  const g = rng(a * 131 + b * 17 + 5);
  // The spheres are scattered in the grid, so the colours are mixed through the card and the count has to be made by eye.
  const order = Array.from({ length: n }, (_, i) => i).sort(() => g() - 0.5);
  for (let k = 0; k < n; k++) {
    const i = order[k];
    ctx.fillStyle = k < a ? A_INK : B_INK;
    ctx.beginPath(); ctx.arc(x0 + 1.5 * sc + (i % cols + 0.5) * cw, y0 + 1.5 * sc + (Math.floor(i / cols) + 0.5) * ch, Math.max(2, Math.min(cw, ch) * 0.34), 0, Math.PI * 2); ctx.fill();
  }
  say(ctx, String(p.label), o.x, y0 + h - 2.6 * sc, Math.max(6.2, 2.2 * sc), { align: 'center', weight: 700, maxW: w - 2 * sc });
}

registerPiece('dgm', {
  kind: { r: 8.5, rect: RECT_DGM, nojoin: true },
  paint: paintDiagram,
  faceKey: p => `dgm|${p.props.a}|${p.props.b}`,
  printed: p => String(p.label)
});

/** A diagram card of `a` orange and `b` blue spheres. */
export const diagramCard = (id, label, at, a, b, extra = {}) => ({ id, kind: 'dgm', label, at, props: { a, b }, ...extra });

/* ------------------------------------------------------------------
   THE ARROW CARD: a reaction written with one arrow or two
   ------------------------------------------------------------------ */

const RECT_ARW = { hw: 12, hh: 6.5 };

function paintArrow(ctx, p, state, o) {
  const box = slab(ctx, o, RECT_ARW, '#2a2620');
  say(ctx, String(p.label), o.x, o.y, Math.max(9, 4.4 * o.sc), { align: 'center', weight: 700, maxW: box.w - 2 * o.sc });
}

registerPiece('arw', {
  kind: { r: 7, rect: RECT_ARW, nojoin: true },
  paint: paintArrow,
  faceKey: p => `arw|${p.label}`,
  printed: p => String(p.label)
});

/** An arrow card; `label` is the written reaction. */
export const arrowCard = (id, label, at, extra = {}) => ({ id, kind: 'arw', label, at, props: {}, ...extra });
