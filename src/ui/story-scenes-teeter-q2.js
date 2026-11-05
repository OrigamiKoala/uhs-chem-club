/**
 * story-scenes-teeter-q2.js — the story painter of `q2-k` (Teeter). A 960-wide plate, a pure function of `t`; every number on screen is
 * worked out from the bars drawn beside it (`settleAmounts`, `systemRatio` in `engine/eqdata.js`, the planners the bench reads).
 *
 * `ratio-holds`: beat one settles three pans of A ⇌ B that began differently and prints B over A under each, worked out from its two bars;
 * beat two does the same for H₂ + I₂ ⇌ 2 HI with the 2 as a power; beat three settles a pan with a large K and a pan with a small K.
 */

import { K_SYSTEMS, settleAmounts, systemRatio, fmtNum } from '../learn/engine/eqdata.js';
import { C, text, ground, win, ease } from './story-kit.js';

const A_INK = '#c0652b'; const B_INK = '#6f8fb0';
const AB = K_SYSTEMS.ab; const HI = K_SYSTEMS.hi;
const fill = (sys, s) => Object.fromEntries(Object.keys(sys.species).map(k => [k, s[k] ?? 0]));
const lerp = (a, b, v) => a + (b - a) * v;

/** One pan: a bar for each substance, from its start to where it settles by `p` (0 to 1); returns the amounts drawn. */
function pan(ctx, sys, start, K, p, x, y, w, h, scale, title) {
  const eq = settleAmounts(sys, start, K);
  const names = Object.keys(sys.species);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  text(ctx, title, x + w / 2, y + 20, { size: 18, color: C.dust, weight: 700 });
  const gw = w / names.length; const bw = Math.min(46, gw * 0.55); const base = y + h - 34; const top = y + 52;
  const now = {};
  names.forEach((s, i) => {
    now[s] = lerp(start[s], eq[s], p);
    const bh = (now[s] / scale) * (base - top);
    const cx = x + (i + 0.5) * gw;
    ctx.fillStyle = sys.species[s] < 0 ? A_INK : B_INK;
    ctx.fillRect(cx - bw / 2, base - bh, bw, Math.max(1, bh));
    text(ctx, s.replace('2', '₂').replace('4', '₄'), cx, base + 17, { size: 17, color: C.text, weight: 700 });
    text(ctx, fmtNum(now[s], 3), cx, base - bh - 12, { size: 15, color: C.dust });
  });
  return now;
}

function ratioHolds(ctx, w, h, t) {
  ground(ctx, w, h);
  const pw = w * 0.27; const ph = h * 0.5; const py = h * 0.14; const gap = (w - 3 * pw) / 4;
  const x = i => gap + i * (pw + gap);
  if (t < 0.7) {
    const hi = t >= 0.35;
    const sys = hi ? HI : AB;
    const starts = hi
      ? [{ H2: 1, I2: 1 }, { HI: 1 }, { H2: 0.6, I2: 1.4, HI: 0.5 }]
      : [{ A: 1.2 }, { B: 1.8 }, { A: 0.3, B: 0.3 }];
    const p = ease(win(t, hi ? 0.37 : 0.02, hi ? 0.55 : 0.2));
    const scale = hi ? 1.6 : 1.8;
    text(ctx, hi ? 'H₂ + I₂ ⇌ 2 HI' : 'A ⇌ B', w / 2, h * 0.07, { size: 26, color: C.dust });
    starts.forEach((s, i) => {
      const now = pan(ctx, sys, fill(sys, s), sys.K, p, x(i), py, pw, ph, scale, `Pan ${i + 1}`);
      const r = systemRatio(sys, now);
      const label = hi ? 'HI² over H₂ × I₂' : 'B over A';
      text(ctx, `${label} = ${fmtNum(r, 3)}`, x(i) + pw / 2, h * 0.76, { size: 22, color: C.amber, weight: 700 });
    });
    text(ctx, 'worked out from the bars as they stand', w / 2, h * 0.9, { size: 18, color: C.dim });
  } else {
    const p = ease(win(t, 0.72, 0.9));
    const rows = [{ K: 2e5, name: 'a large K' }, { K: 3e-6, name: 'a small K' }];
    text(ctx, 'A ⇌ B, each pan beginning with A alone', w / 2, h * 0.07, { size: 24, color: C.dust });
    rows.forEach((r, i) => {
      const px = w * (0.1 + i * 0.45);
      const now = pan(ctx, AB, { A: 1, B: 0 }, r.K, p, px, py, w * 0.35, ph, 1.1, r.name);
      text(ctx, `K = ${fmtNum(r.K, 2)}`, px + w * 0.175, h * 0.76, { size: 22, color: C.amber, weight: 700 });
      text(ctx, `A left ${fmtNum(now.A, 2)}`, px + w * 0.175, h * 0.86, { size: 20, color: C.dust });
    });
  }
}

export const TEETER_Q2_SCENES = { 'ratio-holds': ratioHolds };
