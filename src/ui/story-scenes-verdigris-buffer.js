/**
 * story-scenes-verdigris-buffer.js — the story painter of q7-buffer (unit09), registered in `story-scenes.js` through `legacy()`.
 *
 * `buffer-catch`: a pure function of `t` on the 960-wide plate. Windows are the mixing flask's: the spheres drawn are the planner's counts
 * (`engine/phdata.js` `bufferState`, one sphere is 0.1 mmol), and every number printed is counted from the spheres drawn or read from
 * that planner. Beat one pours the same acid into water and into the acetic acid and sodium acetate flask; beat two shows each sphere of
 * acid caught by an acetate; beat three the mirror with base; beat four the pH from the ratio of the spheres.
 */

import { bufferState, ACIDS, fmt } from '../learn/engine/phdata.js';
import { cellGrid, H_INK, OH_INK, ACID_INK, BASE_INK } from '../learn/table/kits/ph-read.js';
import { C, text, ground, win, ease, disc, ring } from './story-kit.js';

const Ka = ACIDS.acetic.Ka;
const U = 1e-4;

/** The flask's reading and sphere counts after `na` acid and `nb` base pours of ten spheres. */
export function flaskAfter(ha, a, na, nb) {
  const st = bufferState({ Ka, nHA: ha * U, nA: a * U, V: 0.1, nH: na * 10 * U, nOH: nb * 10 * U, vAdd: (na + nb) * 0.01 });
  const Au = ha + a ? Math.round(st.A / U) : 0;
  return { pH: st.pH, A: Au, HA: ha + a - Au, H: Math.round((st.h * st.Vt) / U), OH: Math.round((st.oh * st.Vt) / U) };
}

/**
 * One window drawn at (x, y, w, h) with `p` (0..1) of the pour caught. Returns the counts of what is drawn.
 * A sphere that caught the pour is ringed once `p` has passed its turn; before that the pour hangs above the window.
 */
function windowPic(ctx, x, y, w, h, ha, a, kind, p, title, rows = 10) {
  const n = kind === 'acid' ? flaskAfter(ha, a, 1, 0) : kind === 'base' ? flaskAfter(ha, a, 0, 1) : flaskAfter(ha, a, 0, 0);
  const st0 = flaskAfter(ha, a, 0, 0);
  const caughtA = Math.max(0, n.A - st0.A); const caughtHA = Math.max(0, n.HA - st0.HA);
  const caught = kind === 'acid' ? caughtHA : caughtA;
  const shown = Math.round(caught * p);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const cells = cellGrid(20 * rows, 20, x + 4, y + 4, w - 8, h - 8);
  const drawn = { A: 0, HA: 0, H: 0, OH: 0 };
  let i = 0;
  const put = (k, ink, ringInk) => {
    const c = cells[i++];
    const R = Math.min(c.cw, c.ch) * 0.42;
    disc(ctx, c.x, c.y, R, ink);
    if (ringInk) ring(ctx, c.x, c.y, R + 2, ringInk, 2);
    drawn[k]++;
  };
  // Acetate first, then acetic acid; the ones that caught the pour (the last of the changed kind) are ringed in the order they are reached.
  const aPlain = n.A - (kind === 'base' ? caughtA : 0);
  for (let k = 0; k < aPlain; k++) put('A', BASE_INK);
  for (let k = 0; k < (kind === 'base' ? caughtA : 0); k++) put('A', BASE_INK, k < shown ? OH_INK : null);
  const hPlain = n.HA - (kind === 'acid' ? caughtHA : 0);
  for (let k = 0; k < hPlain; k++) put('HA', ACID_INK);
  for (let k = 0; k < (kind === 'acid' ? caughtHA : 0); k++) put('HA', ACID_INK, k < shown ? H_INK : null);
  for (let k = 0; k < n.H; k++) put('H', H_INK);
  for (let k = 0; k < n.OH; k++) put('OH', OH_INK);
  text(ctx, title, x + w / 2, y - 18, { size: 21, color: C.dust, weight: 700 });
  return { drawn, n, st0, caught, shown };
}

function bufferCatch(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.28) {
    const p = ease(win(t, 0.02, 0.2));
    text(ctx, 'The same pour of acid into two flasks', w / 2, 34, { size: 24, color: C.dust });
    [[0, 0, 'Water', 70], [100, 100, 'Acetic acid with sodium acetate', 530]].forEach(([ha, a, title, x]) => {
      const r = windowPic(ctx, x, 130, 360, 150, ha, a, 'acid', p, title);
      const after = p > 0.95;
      text(ctx, after ? `pH ${fmt(r.st0.pH, 2)} to ${fmt(r.n.pH, 2)}` : `pH ${fmt(r.st0.pH, 2)}`, x + 180, 330, { size: 26, color: C.amber, weight: 700 });
      text(ctx, `${r.drawn.H + r.caught} spheres of acid poured`, x + 180, 372, { size: 17, color: C.dim });
    });
    return;
  }
  if (t < 0.52) {
    const p = ease(win(t, 0.3, 0.46));
    text(ctx, 'In the mixture, each sphere of acid is caught by an acetate', w / 2, 34, { size: 24, color: C.dust });
    const r = windowPic(ctx, 300, 120, 360, 150, 100, 100, 'acid', p, 'Acetic acid with sodium acetate');
    const shown = r.shown;
    text(ctx, `acetate ${r.st0.A - shown}`, 300 + 100, 330, { size: 26, color: C.green, weight: 700 });
    text(ctx, `acetic acid ${r.st0.HA + shown}`, 300 + 270, 330, { size: 26, color: C.dust, weight: 700 });
    text(ctx, 'ringed spheres caught the acid', w / 2, 380, { size: 17, color: C.dim });
    return;
  }
  if (t < 0.76) {
    const p = ease(win(t, 0.54, 0.7));
    text(ctx, 'Base is caught the other way', w / 2, 34, { size: 24, color: C.dust });
    const r = windowPic(ctx, 300, 120, 360, 150, 100, 100, 'base', p, 'Acetic acid with sodium acetate');
    const shown = r.shown;
    text(ctx, `acetate ${r.st0.A + shown}`, 300 + 100, 330, { size: 26, color: C.green, weight: 700 });
    text(ctx, `acetic acid ${r.st0.HA - shown}`, 300 + 270, 330, { size: 26, color: C.dust, weight: 700 });
    if (p > 0.95) text(ctx, `pH ${fmt(r.st0.pH, 2)} to ${fmt(r.n.pH, 2)}`, w / 2, 400, { size: 26, color: C.amber, weight: 700 });
    return;
  }
  const k = ease(win(t, 0.78, 0.9));
  text(ctx, 'pH = pKa + log of acetate over acetic acid', w / 2, 34, { size: 24, color: C.dust });
  [[100, 100], [50, 150], [10, 100]].forEach(([ha, a], i) => {
    const y = 150 + i * 110;
    const r = flaskAfter(ha, a, 0, 0);
    text(ctx, `${r.A} acetate`, 130, y, { size: 24, color: C.green, weight: 700, align: 'left' });
    text(ctx, `${r.HA} acetic acid`, 380, y, { size: 24, color: C.dust, weight: 700, align: 'left' });
    if (k > 0.2 + i * 0.25) text(ctx, `pH ${fmt(r.pH, 2)}`, 700, y, { size: 28, color: C.amber, weight: 700, align: 'left' });
  });
}

export const VERDIGRIS_BUFFER_SCENES = { 'buffer-catch': bufferCatch };
