/**
 * story-scenes-kettle-q8.js — the story painters of Kettle's q8 bench, spread into `KETTLE_SCENES` (`story-scenes-kettle.js`).
 * Follow `story-scenes-kettle.js`: 960 x 540 plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `furnace-log`: the ore reaction of the furnace log, Fe2O3 + 3 CO -> 2 Fe + 3 CO2. The oxidation numbers on the atoms are the planner's
 * (`reactdata-kinds.js` `oxNumbers`); the electrons are drawn travelling from the carbon atoms to the iron atoms, and the number on each
 * atom changes by one for every electron that has left or arrived, so the final numbers are counted from the dots, not typed.
 */

import { parseEquation } from '../learn/engine/reactdata.js';
import { oxNumbers, electronFlow } from '../learn/engine/reactdata-kinds.js';
import { C, disc, line, legacyText as text, ground, win, ease, lerp } from './story-kit.js';

const ORE = parseEquation('Fe2O3 + 3 CO -> 2 Fe + 3 CO2');
const FLOW = electronFlow(ORE);
const N_ORE = oxNumbers('Fe2O3');
const N_CO = oxNumbers('CO');
const FE_ATOMS = FLOW.gained[0].atoms;
const C_ATOMS = FLOW.lost[0].atoms;
const PER_FE = FLOW.gained[0].electrons / FE_ATOMS;
const PER_C = FLOW.lost[0].electrons / C_ATOMS;
const INK = { Fe: '#9aa0a6', O: '#9a4a2e', C: '#4b4741' };
const sgn = v => (v > 0 ? `+${v}` : String(v).replace('-', '−'));
const fs = h => Math.max(13, h * 0.042);

function furnaceLog(ctx, w, h, t) {
  ground(ctx, w, h);
  const u = h * 0.07;
  const size = fs(h);
  // The ore: iron atoms with three oxygen atoms beside them. The carbons each hold an oxygen of their own.
  const fe = Array.from({ length: FE_ATOMS }, (_, i) => ({ x: w * 0.2, y: h * (0.3 + 0.2 * i) }));
  const c = Array.from({ length: C_ATOMS }, (_, i) => ({ x: w * 0.62, y: h * (0.24 + 0.16 * i) }));
  const o = c.map((a, i) => ({ x: w * 0.1, y: h * (0.24 + 0.16 * i), toX: a.x - u * 1.35, toY: a.y }));

  // Beat one: the ore and its numbers.
  const a1 = ease(win(t, 0.0, 0.14));
  fe.forEach(a => disc(ctx, a.x, a.y, u * 0.85 * Math.max(a1, 0.01), INK.Fe));
  // Beat four: the oxygens of the ore go across to the carbons.
  const move = ease(win(t, 0.8, 0.96));
  o.forEach(a => disc(ctx, lerp(a.x, a.toX, move), lerp(a.y, a.toY, move), u * 0.6 * Math.max(a1, 0.01), INK.O));
  // Beat two: the carbons, each with the oxygen beside it.
  const a2 = ease(win(t, 0.26, 0.4));
  c.forEach(a => {
    disc(ctx, a.x, a.y, u * 0.7 * Math.max(a2, 0.01), INK.C);
    disc(ctx, a.x + u * 1.35, a.y, u * 0.6 * Math.max(a2, 0.01), INK.O);
  });

  // Beat three: the electrons, one dot each, leaving a carbon for an iron one after the other.
  const total = FLOW.total;
  const dots = Array.from({ length: total }, (_, k) => ({
    from: c[Math.floor(k / PER_C)], to: fe[Math.floor(k / PER_FE)], ci: Math.floor(k / PER_C), fi: Math.floor(k / PER_FE),
    p: ease(win(t, 0.52 + (k / total) * 0.14, 0.62 + (k / total) * 0.14))
  }));
  for (const d of dots) {
    if (d.p <= 0 || d.p >= 1) continue;
    disc(ctx, lerp(d.from.x, d.to.x, d.p), lerp(d.from.y, d.to.y, d.p) - Math.sin(d.p * Math.PI) * u * 0.8, u * 0.17, C.amber);
  }
  const left = i => dots.filter(d => d.ci === i && d.p > 0).length;
  const arrived = i => dots.filter(d => d.fi === i && d.p >= 1).length;
  const gone = dots.filter(d => d.p >= 1).length;

  // The numbers: each changes by one for every electron that has gone or come.
  if (a1 > 0.5) {
    fe.forEach((a, i) => text(ctx, sgn(N_ORE.Fe - arrived(i)), a.x, a.y - u * 1.35, { size, color: arrived(i) ? C.amber : C.pale, weight: 700 }));
    o.forEach(a => text(ctx, sgn(N_ORE.O), lerp(a.x, a.toX, move), lerp(a.y, a.toY, move) - u, { size: size * 0.9, color: C.dust }));
    text(ctx, `all together ${sgn(FE_ATOMS * N_ORE.Fe + o.length * N_ORE.O)}`, w * 0.15, h * 0.76, { size, color: C.dust });
  }
  if (a2 > 0.5) {
    c.forEach((a, i) => {
      text(ctx, sgn(N_CO.C + left(i)), a.x, a.y - u * 1.1, { size, color: left(i) ? C.amber : C.pale, weight: 700 });
      text(ctx, sgn(N_CO.O), a.x + u * 1.35, a.y - u, { size: size * 0.9, color: C.dust });
    });
  }
  if (t > 0.5) text(ctx, `electrons moved: ${gone}`, w * 0.41, h * 0.86, { size: size * 1.1, color: C.amber, weight: 700 });
  if (t > 0.88) {
    text(ctx, `iron ${sgn(N_ORE.Fe)} to ${sgn(N_ORE.Fe - arrived(0))}`, w * 0.2, h * 0.92, { size, color: C.pale });
    text(ctx, `carbon ${sgn(N_CO.C)} to ${sgn(N_CO.C + left(0))}`, w * 0.62, h * 0.92, { size, color: C.pale });
  }
  line(ctx, w * 0.34, h * 0.45, w * 0.5, h * 0.45, C.dim, 2);
}

export const Q8_SCENES = { 'furnace-log': furnaceLog };
