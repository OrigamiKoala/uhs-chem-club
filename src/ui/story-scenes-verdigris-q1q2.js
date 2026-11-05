/**
 * story-scenes-verdigris-q1q2.js — the story painters of Verdigris benches 1 and 2 (`q1-handover`, `q2-scale`), spread into `SCENES`
 * (`story-scenes.js`) through `legacy()`: a 960-wide plate, a pure function of `t`, every number on screen counted from what is drawn or
 * read from the bench's own planners (`engine/phdata.js`, `table/kits/ph-read.js`).
 *
 * `handover` (q1): beat one moves the hydrogen of each HCl onto a water molecule and counts the hydrogens that have arrived; beat two does
 * the same for ammonia taking one from water; beat three writes the hydrogens and charge of each member of three conjugate pairs; beat four
 * multiplies the ion concentrations of three waters.
 */

import { sci, fmt, formulaStats, waterIons, scaleSolution, ACIDS, BASES } from '../learn/engine/phdata.js';
import { windowOf, ionizedCells, cellGrid, ionText } from '../learn/table/kits/ph-read.js';
import { C, text, ground, win, ease, disc, lerp } from './story-kit.js';

const WATER = '#7d8b97';
const TAGGED = '#f4f0e6';
const HYD = '#5e584e';

/** Eight cells, each a unit beside a water molecule; the cells the planner says changed show the moved hydrogen, which travels in beat time p. */
function handoverWindow(ctx, scene, solute, p, x, y, w, h, title) {
  const props = { solute, units: 8 };
  const wo = windowOf(props);
  const gone = [...ionizedCells(8, wo.ionized, 11)];
  const cells = cellGrid(8, 4, x + 6, y + 6, w - 12, h - 12);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  let arrived = 0;
  cells.forEach((c, i) => {
    const R = Math.min(c.cw, c.ch) * 0.2;
    const lx = c.x - c.cw * 0.2; const rx = c.x + c.cw * 0.2;
    const moves = gone.includes(i);
    const k = moves ? p : 0;
    if (scene === 'acid') {
      disc(ctx, lx, c.y, R, moves && k > 0.5 ? '#78a142' : '#9a948a');
      disc(ctx, rx - R * 0.9, c.y - R * 1.2, R * 0.5, HYD); disc(ctx, rx + R * 0.9, c.y - R * 1.2, R * 0.5, HYD);
      disc(ctx, rx, c.y, R, k > 0.5 ? '#d99423' : WATER);
      // the marked hydrogen leaves the acid for the water
      disc(ctx, lerp(lx + R * 1.3, rx - R * 1.1, ease(k)), c.y + R * 0.1, R * 0.5, moves || k === 0 ? TAGGED : TAGGED);
      if (moves && k >= 1) arrived++;
    } else {
      disc(ctx, lx, c.y, R, moves && k > 0.5 ? '#9a948a' : '#78a142');
      for (let j = 0; j < 3; j++) disc(ctx, lx + (j - 1) * R * 1.1, c.y - R * 1.45, R * 0.5, HYD);
      disc(ctx, rx, c.y, R, moves && k > 0.5 ? '#6f8fb0' : WATER);
      disc(ctx, lerp(rx - R * 1.3, lx + R * 0.9, ease(k)), c.y + R * 1.2 - k * R * 2.6, R * 0.5, TAGGED);
      disc(ctx, rx + R * 1.3, c.y + R * 0.2, R * 0.5, TAGGED);
      if (moves && k >= 1) arrived++;
    }
  });
  text(ctx, title, x + w / 2, y - 18, { size: 21, color: C.dust, weight: 700 });
  return arrived;
}

function handover(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.26) {
    const p = ease(win(t, 0.03, 0.2));
    text(ctx, 'HCl poured into water; the marked hydrogen of each HCl', w / 2, 34, { size: 24, color: C.dust });
    const n = handoverWindow(ctx, 'acid', { id: 'hcl', c: 0.10 }, p, 220, 110, 520, 200, '0.10 M hydrochloric acid');
    text(ctx, `${n} of 8 hydrogens have reached a water molecule`, w / 2, 350, { size: 22, color: C.amber, weight: 700 });
    return;
  }
  if (t < 0.52) {
    const p = ease(win(t, 0.28, 0.46));
    text(ctx, 'Ammonia in water; the marked hydrogens of the water', w / 2, 34, { size: 24, color: C.dust });
    const n = handoverWindow(ctx, 'base', { id: 'nh3', c: 0.00010 }, p, 220, 110, 520, 200, '0.00010 M ammonia');
    text(ctx, `${n} of 8 ammonia particles have taken a hydrogen`, w / 2, 350, { size: 22, color: C.amber, weight: 700 });
    return;
  }
  if (t < 0.78) {
    const k = ease(win(t, 0.54, 0.72));
    text(ctx, 'Hydrogens and charge of each pair', w / 2, 34, { size: 24, color: C.dust });
    const pairs = [['HNO₃', 'NO₃⁻'], ['H₂O', 'OH⁻'], ['NH₄⁺', 'NH₃']];
    pairs.forEach(([a, b], i) => {
      const y = 130 + i * 110;
      const sa = formulaStats(a); const sb = formulaStats(b);
      text(ctx, ionText(a), 170, y, { size: 30, color: C.text, weight: 700 });
      text(ctx, `${sa.h} H, charge ${sa.charge}`.replace('-', '−'), 330, y, { size: 20, color: C.dust, align: 'left' });
      if (k > 0.2 + i * 0.25) {
        text(ctx, ionText(b), 600, y, { size: 30, color: C.text, weight: 700 });
        text(ctx, `${sb.h} H, charge ${sb.charge}`.replace('-', '−'), 740, y, { size: 20, color: C.amber, align: 'left' });
      }
    });
    return;
  }
  const k = ease(win(t, 0.8, 0.9));
  text(ctx, 'H₃O⁺ times OH⁻, in three waters', w / 2, 34, { size: 24, color: C.dust });
  [['Pure water', {}], ['Acid added', { acid: 1e-3 }], ['Base added', { base: 1e-2 }]].forEach(([name, spec], i) => {
    const y = 140 + i * 110; const v = waterIons(spec);
    text(ctx, name, 70, y, { size: 22, color: C.dust, weight: 700, align: 'left' });
    text(ctx, `${sci(v.h, 2)} × ${sci(v.oh, 2)}`, 300, y, { size: 22, color: C.text, weight: 700, align: 'left' });
    if (k > 0.2 + i * 0.25) text(ctx, `= ${sci(v.h * v.oh, 2)}`, 700, y, { size: 26, color: C.amber, weight: 700, align: 'left' });
  });
}

/** `scale` (q2): spheres counted per flask, pH and pOH side by side, a dilution chain against its floor, and warm water against cold. */
function scale(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.26) {
    const k = ease(win(t, 0.03, 0.2));
    text(ctx, 'Hydrochloric acid, diluted tenfold each time; one sphere is 0.001 mol/L of H₃O⁺', w / 2, 34, { size: 22, color: C.dust });
    [0.1, 0.01, 0.001].forEach((c, i) => {
      const x0 = 120 + i * 270; const n = Math.round(c * 1000);
      const shown = Math.round(n * k);
      for (let j = 0; j < shown; j++) disc(ctx, x0 + (j % 10) * 15, 130 + Math.floor(j / 10) * 15, 6, '#d99423');
      text(ctx, `${Number(c).toPrecision(2)} M`, x0 + 70, 80, { size: 22, color: C.dust, weight: 700 });
      text(ctx, `${shown} spheres`, x0 + 70, 330, { size: 18, color: C.dim });
      text(ctx, `pH ${fmt(scaleSolution({ id: 'hcl', c }).pH, 2)}`, x0 + 70, 380, { size: 26, color: C.amber, weight: 700 });
    });
    return;
  }
  if (t < 0.52) {
    const k = ease(win(t, 0.28, 0.46));
    text(ctx, 'Sodium hydroxide: the two meters', w / 2, 34, { size: 24, color: C.dust });
    [0.1, 0.01, 0.001].forEach((c, i) => {
      const y = 140 + i * 110; const s = scaleSolution({ id: 'naoh', c });
      text(ctx, `${Number(c).toPrecision(2)} M`, 90, y, { size: 22, color: C.dust, weight: 700, align: 'left' });
      text(ctx, `pH ${fmt(s.pH, 2)}`, 290, y, { size: 24, color: C.text, weight: 700, align: 'left' });
      text(ctx, `pOH ${fmt(s.pOH, 2)}`, 470, y, { size: 24, color: C.text, weight: 700, align: 'left' });
      if (k > 0.2 + i * 0.25) text(ctx, `= ${fmt(s.pH + s.pOH, 2)}`, 700, y, { size: 26, color: C.amber, weight: 700, align: 'left' });
    });
    return;
  }
  if (t < 0.78) {
    const k = ease(win(t, 0.54, 0.74));
    text(ctx, 'Hydrochloric acid, diluted again and again', w / 2, 34, { size: 24, color: C.dust });
    const cs = [1e-6, 1e-7, 1e-8, 1e-9];
    const y7 = 170;
    ctx.strokeStyle = C.dim; ctx.setLineDash && ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(120, y7); ctx.lineTo(840, y7); ctx.stroke(); ctx.setLineDash && ctx.setLineDash([]);
    text(ctx, 'pH 7', 90, y7, { size: 18, color: C.dim });
    cs.forEach((c, i) => {
      if (k < i / cs.length) return;
      const v = scaleSolution({ id: 'hcl', c }).pH;
      const x = 200 + i * 190; const y = y7 + (7 - v) * 70 + 4;
      disc(ctx, x, y, 12, C.amber);
      text(ctx, `${sci(c, 2)} M`, x, 380, { size: 18, color: C.dust });
      text(ctx, fmt(v, 2), x, y + 36, { size: 22, color: C.text, weight: 700 });
    });
    return;
  }
  const k = ease(win(t, 0.8, 0.9));
  text(ctx, 'Pure water, cold and warm', w / 2, 34, { size: 24, color: C.dust });
  [25, 50].forEach((T, i) => {
    const s = scaleSolution({ id: 'water', T }); const x = 270 + i * 420;
    text(ctx, `${T} °C`, x, 120, { size: 26, color: C.dust, weight: 700 });
    text(ctx, `pH ${fmt(s.pH, 2)}`, x, 190, { size: 30, color: C.amber, weight: 700 });
    if (k > 0.2 + i * 0.3) {
      text(ctx, `H₃O⁺ ${sci(s.h, 2)}`, x, 270, { size: 22, color: C.text });
      text(ctx, `OH⁻ ${sci(s.oh, 2)}`, x, 310, { size: 22, color: C.text });
    }
  });
}

export const VERDIGRIS_Q1Q2_SCENES = { handover, scale };
void ACIDS; void BASES;
