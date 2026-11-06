/**
 * kits/cell.js — The cell kit: Brinewire's benches, worked with the hands.
 *
 * A KIT THAT EXTENDS THE HEAT KIT, as the ph and pans kits do. The cards, number marker, answer dial, plaque and rail are the heat kit's
 * and are used as they are. This kit adds, bench by bench, the instruments the electrochemistry benches need (`cell-registry.js`): the
 * potential board with its electrodes (`cell-board.js`) and the ready-built cell with its voltmeter and lamp (`cell-rig.js`).
 *
 * A THIN WRAPPER over `engine/celldata.js`: a reading is the planner's answer shown as the picture; a stage declares what stands on the
 * table (a metal in a seat, two metals in a cell) and never what it will read.
 *
 * TO ADD AN INSTRUMENT FOR A BENCH: write `cell-<name>.js` that calls `registerFixture` / `registerPiece` from `cell-registry.js` (and a
 * `cell-<name>-tour.js` with its Tour words), then add ONE import line to the block below. Nothing else in this file changes.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS, HEAT_RECORDER } from './heat.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey } from './heat-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers } from './cell-registry.js';
import './cell-tour.js';
import { hotspots } from './cell-sites.js';
import { noteMiss } from './cell-scene.js';

/* One import per instrument: each file registers its own fixtures and pieces. (marker: cell instruments) */
import './cell-board.js';
import './cell-rig.js';
import './cell-galv.js';
import './cell-redox.js';
import './cell-ledger.js';
import './cell-scene.js';
import './cell-dip.js';
import './cell-supply.js';
import './cell-load.js';
import './cell-cans.js';
import './cell-tour-min.js';
import './cell-tour-demos.js';

export const CELL_KIT_ID = 'cell';
export const CELL_BOUNDS = HEAT_BOUNDS;

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

export const CELL_KIT = {
  ...HEAT_KIT,
  id: CELL_KIT_ID,
  kinds: { ...HEAT_KIT.kinds, tag: { ...HEAT_KIT.kinds.tag, r: 8.4 }, ...pieceKinds() },
  run,
  paintPiece,
  paintFixture,
  hotspots,
  onMiss: (table, msg) => noteMiss(msg),
  live: state => Object.values(state.fixtures || {}).some(f => fixtureHandler(f.kind)?.live?.(f, state)),
  faceKey,
  piece3d,
  dress3d,
  settle,
  printed: p => (pieceDef(p.kind)?.printed ? pieceDef(p.kind).printed(p) : HEAT_KIT.printed(p))
};

registerKit(CELL_KIT);

/** A stage's declaration with the cell kit's defaults: the kit, the bounds, a parked recorder strip. */
export function cellTable(spec, { w = CELL_BOUNDS.w, h = CELL_BOUNDS.h, recorder = null } = {}) {
  return { kit: CELL_KIT_ID, bounds: { w, h }, tools: [], recorder: recorder || { ...HEAT_RECORDER, at: { x: w - 2.6, y: h - 2.4 } }, ...spec };
}

import { selectorFixture as heatSelector } from './heat.js';
/** A selector with its options listed on the card, so text choices are readable before the dial moves. */
export const selectorFixture = (id, label, at, o = {}) => heatSelector(id, label, at, { list: false, ...o });
/** A fixture whose dials nothing can turn: it only shows the answer a tap on the model has set. */
export const hideDials = fx => ({ ...fx, props: { ...fx.props, hidden: Object.keys(fx.dials) } });
export * from './heat.js';
export * from './cell-read.js';
export { canPiece } from './cell-cans.js';
export { boardFixture, electrodePiece, boardRead } from './cell-board.js';
export { sceneFixture, withScene } from './cell-scene.js';
export { rigFixture, rigRead, RIG_UNIT } from './cell-rig.js';
