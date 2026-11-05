/**
 * kits/pans.js — The pans kit: Teeter's benches, worked with the hands.
 *
 * A KIT THAT EXTENDS THE HEAT KIT, as the matter kit does. The cards, number marker, answer dial, plaque and rail are the heat kit's and
 * are used as they are. This kit adds the pan (a dish of particles that turn A to B and B to A, a graph, two tallies) and, bench by bench,
 * the instruments the other benches need (`pans-registry.js`).
 *
 * A THIN WRAPPER over `engine/eqdata.js`: a reading is the planner's answer, shown as the picture; a stage declares what stands on the table
 * and never what it will read. The pan is drawn flat, seen from above, because a dish of particles is a flat layer: nothing here depends on
 * depth, so the drawn and the built table show the same picture.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS, HEAT_RECORDER } from './heat.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey } from './heat-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers } from './pans-registry.js';
import './pans-tour.js';

/* One import per bench: each file registers its own instruments and pieces. */
import './pans-pan.js';

export const PANS_KIT_ID = 'pans';
export const PANS_BOUNDS = HEAT_BOUNDS;

function run(state, fid) {
  const f = state.fixtures[fid];
  if (!f || f.noRun) return null;
  const h = fixtureHandler(f.kind);
  if (h?.run) return h.run(state, fid);
  return HEAT_KIT.run(state, fid);
}

const paintPiece = (ctx, p, state, o) => {
  const def = pieceDef(p.kind);
  if (def?.paint) { def.paint(ctx, p, state, o); return true; }
  return heatPiece(ctx, p, state, o);
};
const faceKey = (p, state) => (pieceDef(p.kind)?.faceKey ? pieceDef(p.kind).faceKey(p, state) : heatFaceKey(p, state));
const paintFixture = (ctx, f, state, b) => {
  const h = fixtureHandler(f.kind);
  if (h?.paint) return h.paint(ctx, f, state, b);
  return heatFixture(ctx, f, state, b);
};
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

export const PANS_KIT = {
  ...HEAT_KIT,
  id: PANS_KIT_ID,
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

registerKit(PANS_KIT);

/** A stage's declaration with the pans kit's defaults: the kit, the bounds, a parked recorder strip. */
export function pansTable(spec, { w = PANS_BOUNDS.w, h = PANS_BOUNDS.h, recorder = null } = {}) {
  return { kit: PANS_KIT_ID, bounds: { w, h }, tools: [], recorder: recorder || { ...HEAT_RECORDER, at: { x: w - 2.6, y: h - 2.4 } }, ...spec };
}

export * from './heat.js';
export * from './pans-read.js';
export { panFixture } from './pans-pan.js';
