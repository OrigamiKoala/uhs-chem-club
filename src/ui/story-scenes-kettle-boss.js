/**
 * story-scenes-kettle-boss.js — the Recipe Golem's story animation: the vault behind the golem and the ledger in it.
 *
 * 960 x 540 plate, a pure function of `t`. Every number on screen is counted or computed from the drawn thing and the planners: the ore in and
 * the metal out are the ledger's own lines, the most iron the ore can give is `reactdata.js` applied to the ore drawn, and the gap is their difference.
 */

import { molarMass, parseEquation, reactPlan } from '../learn/engine/reactdata.js';
import { C, disc, line, legacyText as text, ground, win, ease } from './story-kit.js';

const fs = h => Math.max(11, h * 0.04);

function box(ctx, x, y, w, h, fill, stroke = C.steel, lw = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

const ORE_TONS = 39.9;
const CLAIM_TONS = 50.0;
// 39.9 t of Fe2O3 is 0.250 Mmol; the equation makes 2 Fe for each, 55.8 g/mol: the same arithmetic as the bench, in tons.
const POSSIBLE_TONS = (() => {
  const mol = (ORE_TONS * 1e6) / molarMass('Fe2O3');
  return (reactPlan(parseEquation('Fe2O3 + 3 CO -> 2 Fe + 3 CO2'), { Fe2O3: mol }).made.Fe * molarMass('Fe')) / 1e6;
})();
const GAP_TONS = CLAIM_TONS - POSSIBLE_TONS;

/** The five benches the phases drew on, as small lamps that light one by one: heap, board, pot, furnace, ledger. */
const LAMPS = ['heaps', 'board', 'pot', 'furnace', 'ledger'];

function golemVault(ctx, w, h, t) {
  ground(ctx, w, h);
  // Beat one: the five benches the fight used, lit in turn along the top.
  LAMPS.forEach((name, i) => {
    const on = ease(win(t, 0.02 + i * 0.035, 0.08 + i * 0.035));
    const x = w * (0.2 + i * 0.15);
    disc(ctx, x, h * 0.09, h * 0.022, on > 0.5 ? C.amber : C.dim);
    text(ctx, name, x, h * 0.15, { size: fs(h), color: on > 0.5 ? C.dust : C.dim });
  });
  // Beat two: the golem's vessel, its valves closing and the steam stopping.
  const cx = w * 0.3; const top = h * 0.24;
  const shut = ease(win(t, 0.26, 0.42));
  box(ctx, cx - w * 0.1, top, w * 0.2, h * 0.36, '#16140f', C.steel, 2);
  line(ctx, cx - w * 0.1, top + h * 0.18, cx + w * 0.1, top + h * 0.18, C.dim, 1);
  for (let k = 0; k < 3; k++) {
    const vx = cx - w * 0.07 + k * w * 0.07;
    ctx.fillStyle = shut > 0.5 ? C.dim : C.amber;
    ctx.fillRect(vx - 5, top - h * 0.04, 10, h * 0.04 * (1 - shut * 0.6));
    if (shut < 0.9) for (let s = 0; s < 3; s++) disc(ctx, vx, top - h * 0.05 - s * h * 0.03 - ((t * 400 + k * 20) % 20), 4 + s, C.dim);
  }
  text(ctx, shut > 0.8 ? 'the golem stands still' : 'the golem at its valves', cx, top + h * 0.45, { size: fs(h), color: C.dust });
  // Beat three: the vault opens and the ledger is in it.
  const open = ease(win(t, 0.5, 0.64));
  const lx = w * 0.56; const lw = w * 0.38;
  if (open > 0.01) {
    box(ctx, lx, h * 0.24, lw, h * 0.36 * open, '#100f0c', C.steel, 2);
    if (open > 0.8) {
      text(ctx, 'ore in', lx + 16, h * 0.31, { size: fs(h), color: C.dust, align: 'left' });
      text(ctx, `${ORE_TONS.toFixed(1)} t`, lx + lw - 16, h * 0.31, { size: fs(h), color: C.pale, align: 'right', weight: 700 });
      text(ctx, 'metal out', lx + 16, h * 0.4, { size: fs(h), color: C.dust, align: 'left' });
      text(ctx, `${CLAIM_TONS.toFixed(1)} t`, lx + lw - 16, h * 0.4, { size: fs(h), color: C.danger, align: 'right', weight: 700 });
    }
  }
  // Beat four: the most the ore can give, set against the claim; the gap is counted from the two.
  const bars = ease(win(t, 0.7, 0.9));
  if (bars > 0.01) {
    const bx = w * 0.1; const bw = w * 0.8; const scale = bw / 56;
    const bar = (label, tons, y, color) => {
      text(ctx, label, bx, y - h * 0.03, { size: fs(h), color: C.dust, align: 'left' });
      box(ctx, bx, y, bw, h * 0.03, '#100f0c', C.steel);
      ctx.fillStyle = color;
      ctx.fillRect(bx + 1, y + 1, Math.max(0, tons * scale * bars - 2), h * 0.03 - 2);
    };
    bar('the most iron the ore can give', POSSIBLE_TONS, h * 0.77, C.pale);
    bar('the iron the ledger claims', CLAIM_TONS, h * 0.88, C.danger);
    if (bars > 0.9) text(ctx, `${GAP_TONS.toFixed(1)} t more than the ore can give`, bx + POSSIBLE_TONS * scale + w * 0.2, h * 0.775 + h * 0.055, { size: fs(h), color: C.amber, weight: 700 });
  }
}

export const BOSS_SCENES = { 'golem-vault': golemVault };
