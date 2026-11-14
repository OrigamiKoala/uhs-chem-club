/**
 * kits/thorn.js — the `thorn` kit for Thornmere (unit13, organic chemistry). Extends `HEAT_KIT` (cards, slots, trays, rails, plaques,
 * markers) with the world's own instruments, each registered by its family file through `thorn-registry.js`.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS } from './heat.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey } from './heat-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers, allFixtureEntries } from './thorn-registry.js';
import { liveDress } from './lode-3d.js';
import './thorn-tour.js';
import './thorn-build.js';
import './thorn-mol.js';
import './thorn-test.js';
import './thorn-families.js';

export const THORN_KIT_ID = 'thorn';
export const THORN_BOUNDS = HEAT_BOUNDS;

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
  return h?.paint ? h.paint(ctx, f, state, b) : heatFixture(ctx, f, state, b);
};
const piece3d = (p, state, c) => { const def = pieceDef(p.kind); return def?.piece3d ? def.piece3d(p, state, c) : HEAT_KIT.piece3d(p, state, c); };
const dress3d = (f, state, c) => { const h = fixtureHandler(f.kind); return h ? (h.dress3d ? h.dress3d(f, state, c) : null) : HEAT_KIT.dress3d(f, state, c); };
const settle = state => { HEAT_KIT.settle(state); for (const h of allFixtureHandlers()) h.settle?.(state); };

export const THORN_KIT = {
  ...HEAT_KIT,
  id: THORN_KIT_ID,
  kinds: { ...HEAT_KIT.kinds, ...pieceKinds() },
  run,
  tapZones: (f, state) => fixtureHandler(f.kind)?.tapZones?.(f, state) || [],
  replay: () => {},
  onMiss: () => {},
  live: state => Object.values(state.fixtures || {}).some(f => fixtureHandler(f.kind)?.live?.(f, state)),
  paintPiece,
  paintFixture,
  faceKey,
  piece3d,
  dress3d,
  settle,
  printed: p => (pieceDef(p.kind)?.printed ? pieceDef(p.kind).printed(p) : HEAT_KIT.printed(p))
};

// At `3D On` every live Thornmere instrument is the same moving picture, laid on the plate (the Lodestone method).
for (const [, h] of allFixtureEntries()) if (h.paint && h.live && !h.dress3d) h.dress3d = liveDress(h);
registerKit(THORN_KIT);

/** Fixture kinds that print their own title. */
const OWN_TITLE = new Set(['tbuild', 'tmol', 'tlead', 'ttest', 'tchoice', 'ttwist', 'tmirror']);

export function thornTable(spec, { w = THORN_BOUNDS.w, h = THORN_BOUNDS.h, recorder = null } = {}) {
  for (const f of spec.fixtures || []) if (f.props && OWN_TITLE.has(f.kind) && f.props.hideLabel == null) f.props.hideLabel = true;
  // The kit's instruments keep their readings on their own faces: the recorder is parked, two units square, where the Tour leaves it out.
  return { kit: THORN_KIT_ID, bounds: { w, h }, tools: [], recorder: recorder || { at: { x: w - 1.6, y: h - 1.6 }, size: { w: 2, h: 2 } }, ...spec };
}

export * from './heat.js';
export { tbuildFixture, buildRead, buildScript, whereOn, tchoiceFixture, chosen, chosenIndex } from './thorn-build.js';
export { tmolFixture, molRead, arrowScript, pickScript, tleadFixture, addLeadScene } from './thorn-mol.js';
export { ttestFixture, testRead, resultOf, tcard, addTest } from './thorn-test.js';
