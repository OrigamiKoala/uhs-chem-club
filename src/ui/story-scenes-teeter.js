/**
 * story-scenes-teeter.js — the story painters of Teeter (unit08), spread into `SCENES` (`story-scenes.js`). Follow `story-scenes-kettle.js`:
 * a 960-wide plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `pan-both-ways` (q1-both): the bench's own pan is run again, particle by particle (`simulatePan`, the planner the bench reads). Beat one
 * draws the two lines of a pan that started with A alone until they go flat. Beat two keeps running the settled pan with eight particles
 * ringed, and the two counts under it are counted from the drawn particles' own changes. Beat three runs a pan that started with B alone
 * and draws it over the first.
 */

import { TEETER_Q6_SCENES } from './story-scenes-teeter-q6.js';
import { simulatePan, rng } from '../learn/engine/eqdata.js';
import { C, line, text, ground, win, ease } from './story-kit.js';
import { TEETER_Q8_SCENES } from './story-scenes-teeter-q8.js';
import { TEETER_Q7_SCENES } from './story-scenes-teeter-q7.js';
import { TEETER_Q2_SCENES } from './story-scenes-teeter-q2.js';
import { TEETER_Q3_SCENES } from './story-scenes-teeter-q3.js';
import { TEETER_Q4_SCENES } from './story-scenes-teeter-q4.js';
import { TEETER_Q5_SCENES } from './story-scenes-teeter-q5.js';
import { TEETER_BOSS_SCENES } from './story-scenes-teeter-boss.js';

const N = 48;
const KF = 0.1; const KR = 0.05;
const A_INK = '#c0652b'; const B_INK = '#6f8fb0';
const RINGED = [1, 7, 12, 19, 26, 33, 40, 45];
const TICKS = 160;
const FROM_A = simulatePan({ n: N, b0: 0, kf: KF, kr: KR, ticks: TICKS, seed: 11 });
const FROM_B = simulatePan({ n: N, b0: N, kf: KF, kr: KR, ticks: TICKS, seed: 31 });

const fs = h => Math.max(13, h * 0.042);

function box(ctx, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/** The dish: 48 particles in a jittered grid, coloured by the state the simulation gives them at tick `k`. */
function dish(ctx, hist, k, x, y, w, h, ringed) {
  box(ctx, x, y, w, h);
  const cols = 8; const rows = 6;
  const cw = w / cols; const ch = h / rows; const r = Math.min(cw, ch) * 0.3;
  for (let i = 0; i < N; i++) {
    const g = rng(i * 7919 + k * 104729 + 17);
    const cx = x + ((i % cols) + 0.5) * cw + (g() - 0.5) * cw * 0.34;
    const cy = y + (Math.floor(i / cols) + 0.5) * ch + (g() - 0.5) * ch * 0.34;
    ctx.fillStyle = hist.states[k * N + i] ? B_INK : A_INK;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    if (ringed && RINGED.includes(i)) { ctx.strokeStyle = C.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
  }
}

/** The graph: A (orange) and B (blue) against tick, out to tick `k`. */
function graph(ctx, hist, k, x, y, w, h, { dashB = false } = {}) {
  box(ctx, x, y, w, h);
  const X = t => x + (t / TICKS) * w;
  const Y = v => y + h - (v / N) * h;
  ctx.strokeStyle = C.dim; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x, Y(N / 2)); ctx.lineTo(x + w, Y(N / 2)); ctx.stroke(); ctx.setLineDash([]);
  const trace = (pick, ink) => {
    ctx.strokeStyle = ink; ctx.lineWidth = 2.4; ctx.beginPath();
    for (let t = 0; t <= k; t++) { if (t === 0) ctx.moveTo(X(t), Y(pick(t))); else ctx.lineTo(X(t), Y(pick(t))); }
    ctx.stroke(); ctx.lineWidth = 1;
  };
  trace(t => N - hist.b[t], A_INK);
  trace(t => hist.b[t], B_INK);
  text(ctx, String(N), x + 14, y + 12, { size: 12, color: C.dim });
  text(ctx, '0', x + 8, y + h - 10, { size: 12, color: C.dim });
  void dashB;
}

function panBothWays(ctx, w, h, t) {
  ground(ctx, w, h);
  const dx = w * 0.06; const dy = h * 0.14; const dw = w * 0.28; const dh = h * 0.42;
  const gx = w * 0.4; const gy = h * 0.14; const gw = w * 0.54; const gh = h * 0.42;
  // Beat one (0 to 0.3): a pan that started with A alone; the lines run from tick 0 to 60 and flatten.
  // Beat two (0.3 to 0.66): the settled pan runs from tick 60 to 130, particles ringed, the two counts counted from the drawn changes.
  // Beat three (0.66 to 1): a pan that started with B alone runs to the same level.
  if (t <= 0.66) {
    const k = t <= 0.3 ? Math.round(ease(win(t, 0, 0.3)) * 60) : 60 + Math.round(ease(win(t, 0.3, 0.66)) * 70);
    dish(ctx, FROM_A, k, dx, dy, dw, dh, t > 0.3);
    graph(ctx, FROM_A, k, gx, gy, gw, gh);
    text(ctx, t <= 0.3 ? 'A alone, then settling' : 'the settled pan, eight particles ringed', w * 0.5, h * 0.08, { size: fs(h), color: C.dust });
    if (t > 0.3) {
      // The counts: every change drawn between tick 60 and now.
      let f = 0; let v = 0;
      for (let i = 61; i <= k; i++) { f += FROM_A.fwd[i]; v += FROM_A.rev[i]; }
      text(ctx, `A turned to B: ${f}`, w * 0.3, h * 0.7, { size: fs(h) * 1.15, color: A_INK, weight: 700 });
      text(ctx, `B turned to A: ${v}`, w * 0.7, h * 0.7, { size: fs(h) * 1.15, color: B_INK, weight: 700 });
      text(ctx, 'counted since the graph went flat', w * 0.5, h * 0.8, { size: fs(h), color: C.dim });
      // Ringed particles that have changed colour since tick 60.
      let changed = 0;
      for (const i of RINGED) for (let s = 61; s <= k; s++) if (FROM_A.states[s * N + i] !== FROM_A.states[(s - 1) * N + i]) changed++;
      text(ctx, `ringed particles changed colour ${changed} times`, w * 0.5, h * 0.9, { size: fs(h), color: C.amber, weight: 700 });
    } else {
      text(ctx, `A left: ${N - FROM_A.b[k]}`, w * 0.5, h * 0.74, { size: fs(h) * 1.15, color: A_INK, weight: 700 });
    }
  } else {
    const k = Math.round(ease(win(t, 0.66, 0.92)) * 120);
    dish(ctx, FROM_B, k, dx, dy, dw, dh, false);
    graph(ctx, FROM_A, 120, gx, gy, gw, gh);
    ctx.globalAlpha = 0.35; graph(ctx, FROM_A, 120, gx, gy, gw, gh); ctx.globalAlpha = 1;
    // The pan that started with B alone, over the first.
    ctx.strokeStyle = A_INK; ctx.lineWidth = 2.4; ctx.setLineDash([6, 4]); ctx.beginPath();
    const X = tt => gx + (tt / TICKS) * gw; const Y = v => gy + gh - (v / N) * gh;
    for (let tt = 0; tt <= k; tt++) { if (tt === 0) ctx.moveTo(X(tt), Y(N - FROM_B.b[tt])); else ctx.lineTo(X(tt), Y(N - FROM_B.b[tt])); }
    ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    text(ctx, 'B alone: dashed, over the pan that began with A', w * 0.5, h * 0.08, { size: fs(h), color: C.dust });
    text(ctx, `A left: ${N - FROM_B.b[k]}`, w * 0.5, h * 0.74, { size: fs(h) * 1.15, color: A_INK, weight: 700 });
  }
  line(ctx, 0, 0, 0, 0, C.dim, 1);
}

export const TEETER_SCENES = {
  ...TEETER_Q2_SCENES,
  ...TEETER_Q3_SCENES,
  ...TEETER_Q4_SCENES,
  ...TEETER_Q5_SCENES,
  ...TEETER_Q7_SCENES,
  ...TEETER_Q8_SCENES,
  ...TEETER_Q6_SCENES,
  ...TEETER_BOSS_SCENES,
  'pan-both-ways': panBothWays
};
