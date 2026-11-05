/**
 * kits/ph.js — The ph kit: Verdigris's benches, worked with the hands.
 *
 * A KIT THAT EXTENDS THE HEAT KIT, as the pans and matter kits do. The cards, number marker, answer dial, plaque and rail are the heat
 * kit's and are used as they are. This kit adds the flask (a solution with a window of its formula units), the pH meter, the ratio rig
 * and its tiles, and, bench by bench, the instruments the other benches need (`ph-registry.js`).
 *
 * A THIN WRAPPER over `engine/phdata.js`: a reading is the planner's answer shown as the picture; a stage declares what stands on the
 * table (a solute and a strength) and never what it will read.
 *
 * TO ADD AN INSTRUMENT FOR A BENCH: write `ph-<name>.js` that calls `registerFixture` / `registerPiece` from `ph-registry.js` (and a
 * `ph-<name>-tour.js` with its Tour words), then add ONE import line to the block below. Nothing else in this file changes.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS, HEAT_RECORDER } from './heat.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey } from './heat-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers } from './ph-registry.js';
import './ph-tour.js';

/* One import per instrument: each file registers its own fixtures and pieces. (marker: ph instruments) */
import './ph-flask.js';
import './ph-rig.js';

export const PH_KIT_ID = 'ph';
export const PH_BOUNDS = HEAT_BOUNDS;

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

export const PH_KIT = {
  ...HEAT_KIT,
  id: PH_KIT_ID,
  // The ph tables are wider than the heat kit's (three flasks across), so the hand's target on a card is a little larger: a card stays
  // 28 px across on a phone-width table (`verify:table`).
  kinds: { ...HEAT_KIT.kinds, tag: { ...HEAT_KIT.kinds.tag, r: 8.4 }, ...pieceKinds() },
  run,
  paintPiece,
  paintFixture,
  faceKey,
  piece3d,
  dress3d,
  settle,
  printed: p => (pieceDef(p.kind)?.printed ? pieceDef(p.kind).printed(p) : HEAT_KIT.printed(p))
};

registerKit(PH_KIT);

/** A stage's declaration with the ph kit's defaults: the kit, the bounds, a parked recorder strip. */
export function phTable(spec, { w = PH_BOUNDS.w, h = PH_BOUNDS.h, recorder = null } = {}) {
  return { kit: PH_KIT_ID, bounds: { w, h }, tools: [], recorder: recorder || { ...HEAT_RECORDER, at: { x: w - 2.6, y: h - 2.4 } }, ...spec };
}

import { selectorFixture as heatSelector } from './heat.js';
/** A selector with its options listed on the card, so text choices are readable before the dial moves. */
export const selectorFixture = (id, label, at, o = {}) => heatSelector(id, label, at, { list: false, ...o });
export * from './heat.js';
export * from './ph-read.js';
export { flaskFixture, meterPiece } from './ph-flask.js';
export { rigParts, tile } from './ph-rig.js';
