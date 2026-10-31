/**
 * story-scenes-kettle-q4.js — the story painters of Kettle's q4 bench, spread into `KETTLE_SCENES` (`story-scenes-kettle.js`).
 * Follow `story-scenes-kettle.js`: 960 x 540 plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `recipe-board`: the furnace recipe Fe2O3 + CO -> Fe + CO2, drawn as molecules. Every molecule on the plate is drawn from
 * `reactdata-balance.js` `shapeOf`; the atoms of each kind on each side are tallied AS THEY ARE DRAWN, so the rows and the
 * equals sign beside them are counted, never typed. The coefficients rise one at a time (to the ones `smallestCoefs` finds)
 * until every row agrees.
 */

import { parseEquation, pretty } from '../learn/engine/reactdata.js';
import { shapeOf, smallestCoefs } from '../learn/engine/reactdata-balance.js';
import { C, ball, line, ground, legacyText as text } from './story-kit.js';

const EQ = 'Fe2O3 + CO -> Fe + CO2';
const NL = parseEquation(EQ).lhs.length;
const SPECIES = (() => { const e = parseEquation(EQ); return [...e.lhs, ...e.rhs].map(s => s.f); })();
const FINAL = smallestCoefs(EQ);
const KIND = { Fe: 'ingot', O: 'O', C: 'C' };
const RADIUS = { Fe: 1.0, C: 0.85, O: 0.8 };
const UNIT = 26;
const ORDER = ['Fe', 'C', 'O'];

/** When each species' number rises by one, from its first rise: the player sees them go up one at a time. */
const FIRST = [0.3, 0.4, 0.33, 0.42];
const coefAt = (i, t) => {
  let n = 1;
  for (let k = 0; k < FINAL[i] - 1; k++) if (t >= FIRST[i] + k * 0.06) n++;
  return n;
};

function recipeBoard(ctx, w, h, t) {
  ground(ctx, w, h);
  const n = SPECIES.map((_, i) => coefAt(i, t));
  const tallies = [{}, {}];
  // The equation line, written from the numbers standing now.
  const side = (from, to) => SPECIES.slice(from, to).map((f, k) => `${n[from + k] === 1 ? '' : `${n[from + k]} `}${pretty(f)}`).join(' + ');
  text(ctx, `${side(0, NL)}  →  ${side(NL, SPECIES.length)}`, w / 2, h * 0.07, { size: 30, color: C.pale, weight: 700 });
  // The molecules: two rows on each side, one molecule for each unit of the number standing in front.
  const rowY = [h * 0.26, h * 0.5];
  const colX = [w * 0.05, w * 0.55];
  SPECIES.forEach((f, i) => {
    const s = i < NL ? 0 : 1;
    const y = rowY[i % NL];
    const atoms = shapeOf(f);
    for (let k = 0; k < n[i]; k++) {
      const cx = colX[s] + 135 + k * 105;
      for (const a of atoms) {
        ball(ctx, cx + a.x * UNIT, y + a.y * UNIT, RADIUS[a.el] * UNIT * 0.95, KIND[a.el], { shadow: true });
        tallies[s][a.el] = (tallies[s][a.el] || 0) + 1;
      }
    }
    text(ctx, pretty(f), colX[s], y, { size: 22, color: C.dust, align: 'left' });
  });
  line(ctx, w * 0.47, h * 0.38, w * 0.53, h * 0.38, C.amber, 3);
  // The rows: counted from the atoms just drawn.
  if (t > 0.05) {
    text(ctx, 'atoms', w * 0.1, h * 0.69, { size: 20, color: C.dim, align: 'left' });
    ORDER.forEach((el, k) => {
      const y = h * 0.76 + k * h * 0.075;
      const l = tallies[0][el] || 0; const r = tallies[1][el] || 0;
      text(ctx, el, w * 0.1, y, { size: 26, color: C.dust, align: 'left', weight: 700 });
      text(ctx, String(l), w * 0.34, y, { size: 28, color: C.amber, weight: 700 });
      text(ctx, String(r), w * 0.66, y, { size: 28, color: C.amber, weight: 700 });
      text(ctx, l === r ? '=' : '≠', w / 2, y, { size: 28, color: l === r ? C.green : C.danger, weight: 700 });
    });
  }
}

export const Q4_SCENES = {
  'recipe-board': recipeBoard
};
