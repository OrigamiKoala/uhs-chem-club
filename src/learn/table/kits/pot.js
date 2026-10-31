/**
 * kits/pot.js — The pot kit: Kettle's reaction pot, its jars and its balance, worked with the hands.
 *
 * A KIT THAT EXTENDS THE HEAT KIT. The cards, plaques, answer dial, number marker and rail of Ember Reach are the heat kit's and
 * are used as they are. The pot kit adds the jar and the instruments Kettle's benches need, one family at a time as they arrive.
 * Each bench's instruments live in their own file (`pot-<name>.js`) and register themselves (`pot-registry.js`), so benches built
 * side by side never edit the same function.
 *
 * A THIN WRAPPER over `engine/reactdata.js`: a reading is the planner's answer shown as the picture. A stage declares what stands
 * on the table and what to look for; it never declares what the table will read.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS, HEAT_RECORDER } from './heat.js';
import { paintPiece, paintFixture, faceKey } from './pot-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers } from './pot-registry.js';

/* One import per bench: each file registers its own instruments and pieces. */
import './pot-reactor.js';
import './pot-names.js';
import './pot-change.js';
import './pot-balance.js';
import './pot-ionic.js';
import './pot-titrate.js';
import './pot-kinds.js';
import './pot-hsab.js';

export const POT_KIT_ID = 'pot';
export const POT_BOUNDS = HEAT_BOUNDS;

function run(state, fid) {
  const f = state.fixtures[fid];
  if (!f || f.noRun) return null;
  const h = fixtureHandler(f.kind);
  if (h?.run) return h.run(state, fid);
  return HEAT_KIT.run(state, fid);
}

const piece3d = (p, state, c) => {
  const def = pieceDef(p.kind);
  if (def?.piece3d) return def.piece3d(p, state, c);
  return HEAT_KIT.piece3d(p, state, c);
};

const dress3d = (f, state, c) => {
  const h = fixtureHandler(f.kind);
  if (h?.dress3d) return h.dress3d(f, state, c);
  return HEAT_KIT.dress3d(f, state, c);
};

const settle = state => {
  HEAT_KIT.settle(state);
  for (const h of allFixtureHandlers()) h.settle?.(state);
};

export const POT_KIT = {
  ...HEAT_KIT,
  id: POT_KIT_ID,
  kinds: { ...HEAT_KIT.kinds, ...pieceKinds() },
  run,
  paintPiece,
  paintFixture,
  faceKey,
  piece3d,
  dress3d,
  settle,
  printed: p => (pieceDef(p.kind)?.printed ? pieceDef(p.kind).printed(p) : HEAT_KIT.printed(p))
};

registerKit(POT_KIT);

/** A stage's declaration with the pot kit's defaults: the kit, the bounds, a parked recorder strip. */
export function potTable(spec, { w = POT_BOUNDS.w, recorder = null } = {}) {
  return { kit: POT_KIT_ID, bounds: { w, h: POT_BOUNDS.h }, tools: [], recorder: recorder || { ...HEAT_RECORDER }, ...spec };
}

export * from './heat.js';
export * from './pot-read.js';
export { jar, reactorFixture, weighFixture } from './pot-reactor.js';
