/**
 * story-scenes-kettle-q5.js — the story painters of Kettle's q5 bench, spread into `KETTLE_SCENES` (`story-scenes-kettle.js`).
 * Follow `story-scenes-kettle.js`: 960 x 540 plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `cloudy-pond`: the lead nitrate and potassium iodide of the bench, as `reactdata-ionic.js` `mixOutcome` works them out. Every ion is a
 * disc in an array; each tally on the plate is a count of those discs (in the jars, dissolved, packed together, unchanged).
 */

import { IONS, ionText } from '../learn/engine/reactdata.js';
import { mixOutcome } from '../learn/engine/reactdata-ionic.js';
import { C, disc, line, legacyText as text, ground, win, ease, lerp } from './story-kit.js';

const A = { cat: 'Pb2', an: 'NO3' };
const B = { cat: 'K', an: 'I' };
const INK = { Pb2: '#b9a24a', NO3: '#6f8fb0', K: '#c98a5a', I: '#7d6aa8' };
const fs = h => Math.max(13, h * 0.045);
const mark = id => { const q = IONS[id].q; return `${Math.abs(q) > 1 ? Math.abs(q) : ''}${q > 0 ? '+' : '−'}`; };

/** The discs of the pond: where each starts (its own jar's half of the beaker), where it ends, and whether it leaves the water. */
function discsOf(w, h) {
  const o = mixOutcome(A, B);
  const bx = w * 0.06; const bw = w * 0.56; const by = h * 0.16; const bh = h * 0.52;
  const list = [];
  const jar = (counts, half) => {
    let k = 0;
    for (const [id, n] of Object.entries(counts)) {
      for (let i = 0; i < n; i++, k++) {
        list.push({ id, x0: bx + bw * (half * 0.5) + bw * 0.12 + (k % 2) * bw * 0.2, y0: by + bh * 0.14 + Math.floor(k / 2) * bh * 0.19, jar: half });
      }
    }
  };
  jar({ [A.cat]: o.before[A.cat], [A.an]: o.before[A.an] }, 0);
  jar({ [B.cat]: o.before[B.cat], [B.an]: o.before[B.an] }, 1);
  // The ions that leave pack together at the bottom, alternating; the rest stay where they stand.
  const left = { ...o.reacted };
  const seq = [];
  const [cats, ans] = o.solid.ions;
  let c = cats.n; let a = ans.n; let nextAn = a >= c;
  while (c > 0 || a > 0) { if ((nextAn && a > 0) || c === 0) { seq.push(ans.ion); a--; } else { seq.push(cats.ion); c--; } nextAn = !nextAn; }
  const slots = seq.map((id, i) => ({ id, x: bx + bw * 0.34 + i * bw * 0.1, y: by + bh * 0.88, taken: false }));
  for (const d of list) {
    if (left[d.id] > 0) {
      left[d.id]--;
      const s = slots.find(q => q.id === d.id && !q.taken);
      s.taken = true;
      d.x1 = s.x; d.y1 = s.y; d.leaves = true;
    } else { d.x1 = d.x0; d.y1 = d.y0; d.leaves = false; }
  }
  return { list, o, box: { bx, bw, by, bh } };
}

function cloudyPond(ctx, w, h, t) {
  ground(ctx, w, h);
  const { list, o, box } = discsOf(w, h);
  const r = h * 0.034;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(box.bx, box.by, box.bw, box.bh);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(box.bx, box.by, box.bw, box.bh); ctx.lineWidth = 1;
  // The jars are poured together after 0.2, and the ions that react pack together by 0.5.
  const pour = ease(win(t, 0.2, 0.3));
  const pack = ease(win(t, 0.3, 0.5));
  if (pour < 1) line(ctx, box.bx + box.bw / 2, box.by + 4, box.bx + box.bw / 2, box.by + box.bh * 0.75, C.dim, 1, [4, 4]);
  if (pack > 0.2) { ctx.fillStyle = '#d9b61c'; ctx.globalAlpha = 0.16 * pack; ctx.fillRect(box.bx, box.by, box.bw, box.bh * 0.8); ctx.globalAlpha = 1; }
  const appear = ease(win(t, 0, 0.18));
  list.forEach((d, i) => {
    const a = Math.max(0, Math.min(1, appear * 1.6 - i * 0.05));
    if (a <= 0) return;
    const m = d.leaves ? pack : 0;
    const x = lerp(d.x0, d.x1, m); const y = lerp(d.y0, d.y1, m);
    ctx.globalAlpha = a;
    disc(ctx, x, y, r, INK[d.id], '#2e2a26');
    text(ctx, mark(d.id), x, y, { size: Math.max(11, r * 0.95), color: '#15130f', weight: 700 });
    ctx.globalAlpha = 1;
  });
  // Tallies, each a count of the discs drawn above.
  const tx = w * 0.68;
  const packedNow = list.filter(d => d.leaves).length;
  const shown = Math.min(list.length, Math.floor(appear * 1.6 * 6));
  if (appear > 0.5) text(ctx, `ions in the jars: ${list.length}`, tx, h * 0.2, { size: fs(h), color: C.dust, align: 'left' });
  if (t > 0.3) text(ctx, `dissolved in the water: ${list.length - (pack > 0.98 ? packedNow : 0)}`, tx, h * 0.3, { size: fs(h), color: C.pale, align: 'left' });
  if (t > 0.5) text(ctx, `packed into a solid: ${packedNow}`, tx, h * 0.4, { size: fs(h), color: '#d9b61c', align: 'left', weight: 700 });
  // The ions that did not move, ringed and counted.
  const stay = ease(win(t, 0.54, 0.72));
  if (stay > 0.05) {
    const stood = list.filter(d => !d.leaves);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.globalAlpha = stay;
    for (const d of stood) { ctx.beginPath(); ctx.arc(d.x0, d.y0, r * 1.4, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.lineWidth = 1;
    if (stay > 0.5) text(ctx, `unchanged: ${stood.length}  (${ionText(B.cat)}, ${ionText(A.an)})`, tx, h * 0.5, { size: fs(h), color: C.amber, align: 'left', weight: 700 });
  }
  // The equation of what changed, from the solid's own ions.
  const eq = ease(win(t, 0.78, 0.92));
  if (eq > 0.05) {
    ctx.globalAlpha = eq;
    const parts = o.solid.ions.map(x => `${x.n === 1 ? '' : `${x.n} `}${ionText(x.ion)}`).join(' + ');
    text(ctx, `${parts} → ${o.solid.text}(s)`, w * 0.5, h * 0.86, { size: fs(h) * 1.25, color: C.pale, weight: 700 });
    ctx.globalAlpha = 1;
  }
  void shown;
}

export const Q5_SCENES = { 'cloudy-pond': cloudyPond };
