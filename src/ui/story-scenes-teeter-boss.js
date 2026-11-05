/**
 * story-scenes-teeter-boss.js — the finale painter of `boss-tipper` (Teeter). A 960-wide plate, a pure function of `t`; every number on
 * screen is worked out from what is drawn by the bench's own planners (`settleAmounts`, `systemRatio`, `gaugePos`, `simulatePan` in
 * `engine/eqdata.js`).
 *
 * `tipper-open`: beats one and two put a mixture of 2 A ⇌ B on the Tipper's beam and let it settle; the beam tilts by where Q stands
 * against K (the place the bench's gauge puts its marker) and comes level when Q is on K. Beat three opens the Fifth's last pan twice,
 * once from A alone and once from B alone, and prints B over A under each, worked out from the two bars. Beat four runs that pan
 * particle by particle and counts the changes each way from the particles' own colours.
 */

import { K_SYSTEMS, settleAmounts, systemRatio, gaugePos, simulatePan, tallyWindow, fmtNum } from '../learn/engine/eqdata.js';
import { C, text, ground, win, ease, alpha, balance, tag } from './story-kit.js';

const A_INK = '#c0652b'; const B_INK = '#6f8fb0';
const A2B = K_SYSTEMS.a2b;
const AB = K_SYSTEMS.ab;
const MIX = { A: 0.5, B: 0.5 };
const lerp = (a, b, v) => a + (b - a) * v;

const N = 48;
const PAN = simulatePan({ n: N, b0: 0, kf: 0.1, kr: 0.05, ticks: 160, seed: 11 });

/** A pile of salt in a pan: a block whose height stands for the amount. */
function pile(ctx, x, y, w, amount, scale, ink) {
  const h = (amount / scale) * 70;
  ctx.fillStyle = ink; ctx.fillRect(x - w / 2, y - h, w, Math.max(1, h));
  ctx.fillStyle = 'rgba(255,250,235,0.18)'; ctx.fillRect(x - w / 2, y - h, w, 1.5);
}

/** A bar on the plate with its name and amount. */
function bar(ctx, x, base, name, amount, scale, ink) {
  const h = (amount / scale) * 150;
  ctx.fillStyle = ink; ctx.fillRect(x - 28, base - h, 56, Math.max(1, h));
  text(ctx, name, x, base + 18, { size: 20, color: C.text, weight: 700 });
  text(ctx, fmtNum(amount, 3), x, base - h - 14, { size: 17, color: C.dust });
}

function tipperOpen(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.5) {
    // The beam, with the mixture of 2 A ⇌ B on it settling; the tilt follows the place the gauge puts Q against K.
    const eq = settleAmounts(A2B, MIX);
    const p = ease(win(t, 0.04, 0.46));
    const now = { A: lerp(MIX.A, eq.A, p), B: lerp(MIX.B, eq.B, p) };
    const Q = systemRatio(A2B, now);
    const tilt = gaugePos(Q, A2B.K, 0.5) * 0.3;
    const cx = w * 0.3; const cy = h * 0.34;
    const pans = balance(ctx, cx, cy, w * 0.2, tilt, { drop: h * 0.2, pan: w * 0.04 });
    pile(ctx, pans.left.x, pans.left.y, pans.pan * 1.5, now.A, 1.2, A_INK);
    pile(ctx, pans.right.x, pans.right.y, pans.pan * 1.5, now.B, 1.2, B_INK);
    text(ctx, 'A', pans.left.x, pans.left.y + 26, { size: 20, color: C.text, weight: 700 });
    text(ctx, 'B', pans.right.x, pans.right.y + 26, { size: 20, color: C.text, weight: 700 });
    text(ctx, '2 A ⇌ B on the Tipper\'s beam', cx, h * 0.07, { size: 24, color: C.dust });
    // The readings, worked out from the amounts as they stand.
    const rx = w * 0.72;
    text(ctx, `A ${fmtNum(now.A, 3)}   B ${fmtNum(now.B, 3)}`, rx, h * 0.3, { size: 22, color: C.dust });
    text(ctx, `Q = ${fmtNum(Q, 3)}`, rx, h * 0.44, { size: 30, color: C.text, weight: 700 });
    text(ctx, `K = ${fmtNum(A2B.K, 2)}`, rx, h * 0.56, { size: 30, color: C.amber, weight: 700 });
    const level = Math.abs(Q - A2B.K) <= 0.01 * A2B.K;
    alpha(ctx, level ? 1 : 0, () => tag(ctx, 'the beam is level', rx, h * 0.7, { size: 22, color: C.amber, edge: C.amber }));
    return;
  }
  if (t < 0.76) {
    // The Fifth's last pan, opened from A alone and from B alone.
    const p = ease(win(t, 0.52, 0.7));
    text(ctx, 'A ⇌ B, opened from either end', w / 2, h * 0.07, { size: 24, color: C.dust });
    [{ start: { A: 1, B: 0 }, title: 'from A alone', x: 0.27 }, { start: { A: 0, B: 1 }, title: 'from B alone', x: 0.73 }].forEach(({ start, title, x }) => {
      const eq = settleAmounts(AB, start);
      const now = { A: lerp(start.A, eq.A, p), B: lerp(start.B, eq.B, p) };
      const cx = w * x; const base = h * 0.62;
      ctx.fillStyle = '#100f0c'; ctx.fillRect(cx - 120, h * 0.14, 240, base - h * 0.14 + 40);
      ctx.strokeStyle = C.steel; ctx.strokeRect(cx - 119.5, h * 0.14 + 0.5, 239, base - h * 0.14 + 39);
      text(ctx, title, cx, h * 0.14 + 22, { size: 19, color: C.dust, weight: 700 });
      bar(ctx, cx - 50, base, 'A', now.A, 1, A_INK);
      bar(ctx, cx + 50, base, 'B', now.B, 1, B_INK);
      text(ctx, `B over A = ${fmtNum(systemRatio(AB, now), 3)}`, cx, h * 0.84, { size: 24, color: C.amber, weight: 700 });
    });
    return;
  }
  // The same pan, particle by particle: the changes each way since the graph went flat, counted from the particles' own changes.
  const k = 60 + Math.round(ease(win(t, 0.78, 0.92)) * 90);
  text(ctx, 'the settled pan, particle by particle', w / 2, h * 0.07, { size: 24, color: C.dust });
  const cols = 8; const rows = 6; const x0 = w * 0.1; const y0 = h * 0.16; const cw = 46; const ch = 46;
  for (let i = 0; i < N; i++) {
    const cx = x0 + (i % cols + 0.5) * cw; const cy = y0 + (Math.floor(i / cols) + 0.5) * ch;
    ctx.fillStyle = PAN.states[k * N + i] ? B_INK : A_INK;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  }
  void rows;
  let f = 0; let v = 0;
  for (let i = 61; i <= k; i++) { f += PAN.fwd[i]; v += PAN.rev[i]; }
  const rx = w * 0.7;
  text(ctx, `A turned to B: ${f}`, rx, h * 0.34, { size: 28, color: A_INK, weight: 700 });
  text(ctx, `B turned to A: ${v}`, rx, h * 0.48, { size: 28, color: B_INK, weight: 700 });
  text(ctx, `counted since tick 60, now tick ${k}`, rx, h * 0.6, { size: 18, color: C.dim });
  const recent = tallyWindow(PAN, k, 40);
  text(ctx, `last 40 ticks: ${recent.fwd} and ${recent.rev}`, rx, h * 0.72, { size: 20, color: C.amber, weight: 700 });
}

export const TEETER_BOSS_SCENES = { 'tipper-open': tipperOpen };
