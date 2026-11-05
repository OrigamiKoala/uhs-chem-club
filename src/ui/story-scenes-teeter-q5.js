/**
 * story-scenes-teeter-q5.js — the story painter of Teeter's bench 5 (`q5-ice`), spread into `TEETER_SCENES` (`story-scenes-teeter.js`).
 * A 960-wide plate, a pure function of `t`. Bars start at the start amount and move to the settled amount from `iceAmounts`
 * (`engine/eqdata.js`); every figure printed (the drop of a bar, the share of the start that reacted) is measured from the drawn bar heights.
 *
 * `ice-bars`: 0 to 0.32 H₂ + I₂ ⇌ 2 HI from 1.0 M each: the HI bar rises twice as far as the H₂ bar falls; 0.32 to 0.64 N₂O₄ from 1.0 M:
 * the bar hardly moves; 0.64 to 1 N₂O₄ from 0.020 M: the bar passes the dashed line 5 % below its start.
 */

import { Q5, iceAmounts } from '../learn/engine/eqdata.js';
import { C, text, ground, win, ease } from './story-kit.js';

const INK = ['#c0652b', '#6f8fb0', '#8a9a5b'];
const fs = h => Math.max(13, h * 0.042);

function panel(ctx, x, y, w, h, cols, max, p, { dash = null } = {}) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const base = y + h - 34; const full = h - 70;
  const cw = w / cols.length;
  const drops = [];
  cols.forEach((c, i) => {
    const sh = (c.init / max) * full;
    const eh = (c.now / max) * full;
    const bx = x + i * cw + cw / 2;
    ctx.strokeStyle = C.dust; ctx.setLineDash([5, 4]); ctx.strokeRect(bx - 38, base - sh, 34, sh); ctx.setLineDash([]);
    ctx.fillStyle = INK[i % 3]; ctx.fillRect(bx + 4, base - eh, 34, eh);
    text(ctx, c.name, bx, base + 20, { size: 22, weight: 700 });
    drops.push({ name: c.name, pix: eh - sh, full });
    if (dash === c.name) { ctx.strokeStyle = C.amber; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.moveTo(bx - 50, base - sh * 0.95); ctx.lineTo(bx + 50, base - sh * 0.95); ctx.stroke(); ctx.setLineDash([]); }
  });
  return { drops, full, base };
}

function iceBars(ctx, w, h, t) {
  ground(ctx, w, h);
  const beat = t < 0.32 ? 0 : t < 0.64 ? 1 : 2;
  const [lo, hi] = [[0, 0.32], [0.32, 0.64], [0.64, 1]][beat];
  const k = ease(win(t, lo + 0.03, hi - 0.1));
  const sets = [
    { rx: Q5.hi, init: { 'H₂': 1, 'I₂': 1 }, max: 2, dash: null },
    { rx: Q5.n2o4, init: { 'N₂O₄': 1 }, max: 1, dash: 'N₂O₄' },
    { rx: Q5.n2o4, init: { 'N₂O₄': 0.02 }, max: 0.02, dash: 'N₂O₄' }
  ][beat];
  const end = iceAmounts(sets.rx.species, sets.init, sets.rx.K).amounts;
  const cols = Object.keys(sets.rx.species).map(name => { const s = sets.init[name] ?? 0; return { name, init: s, now: s + (end[name] - s) * k }; });
  const r = panel(ctx, w * 0.1, h * 0.14, w * 0.8, h * 0.58, cols, sets.max, k, { dash: sets.dash });
  text(ctx, sets.rx.eq, w * 0.5, h * 0.07, { size: fs(h), color: C.dust });
  // Figures measured from the drawn bars (pixels against the full-height bar).
  const per = pix => (Math.abs(pix) / r.full) * sets.max;
  if (beat === 0) {
    const a = per(r.drops[0].pix); const b = per(r.drops[2].pix);
    text(ctx, `H₂ bar fell ${a.toFixed(2)}; HI bar rose ${b.toFixed(2)}`, w * 0.5, h * 0.82, { size: fs(h) * 1.15, color: C.amber, weight: 700 });
  } else {
    const share = (Math.abs(r.drops[0].pix) / (sets.init['N₂O₄'] / sets.max * r.full)) * 100;
    text(ctx, `${share.toFixed(0)} % of the start reacted`, w * 0.5, h * 0.82, { size: fs(h) * 1.15, color: C.amber, weight: 700 });
    text(ctx, beat === 1 ? 'the bar stays above the dashed line' : 'the bar passes below the dashed line', w * 0.5, h * 0.9, { size: fs(h), color: C.dust });
  }
}

export const TEETER_Q5_SCENES = { 'ice-bars': iceBars };
