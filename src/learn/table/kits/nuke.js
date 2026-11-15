/**
 * kits/nuke.js — the `nuke` kit for Cinder Halo (unit14, nuclear chemistry). Extends `HEAT_KIT` (cards, slots, trays, plaques, typed
 * entries) with the world's own instruments, each registered by its family file through `nuke-registry.js`: the counter rig, the nucleus
 * view, the chart of nuclides, the decaying sample, the balance, the binding-energy curve and the chain chamber.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS } from './heat.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey } from './heat-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers, allFixtureEntries } from './nuke-registry.js';
import { liveDress } from './lode-3d.js';
import './nuke-tour.js';
import './nuke-count.js';
import './nuke-nuc.js';
import './nuke-chart.js';
import './nuke-choice.js';
import './nuke-families.js';

export const NUKE_KIT_ID = 'nuke';
export const NUKE_BOUNDS = HEAT_BOUNDS;

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
const dialed = (state, f, dial) => fixtureHandler(f.kind)?.dialed?.(state, f, dial) || null;

export const NUKE_KIT = {
  ...HEAT_KIT,
  id: NUKE_KIT_ID,
  kinds: { ...HEAT_KIT.kinds, ...pieceKinds() },
  run,
  dialed,
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

// At `3D On` every Cinder Halo instrument is the same moving picture, laid on the plate (the Lodestone and Thornmere method).
for (const [, h] of allFixtureEntries()) if (h.paint && !h.dress3d) h.dress3d = liveDress(h);
registerKit(NUKE_KIT);

/** Fixture kinds that print their own title. */
const OWN_TITLE = new Set(['ncount', 'nnuc', 'nchart', 'nchoice', 'nlead', 'ndrum', 'ntissue', 'ndecay', 'nscale', 'ncurve', 'nchain']);

export function nukeTable(spec, { w = NUKE_BOUNDS.w, h = NUKE_BOUNDS.h, recorder = null } = {}) {
  for (const f of spec.fixtures || []) if (f.props && OWN_TITLE.has(f.kind) && f.props.hideLabel == null) f.props.hideLabel = true;
  // The kit's instruments keep their readings on their own faces: the recorder is parked, two units square, where the Tour leaves it out.
  return { kit: NUKE_KIT_ID, bounds: { w, h }, tools: [], recorder: recorder || { at: { x: w - 1.6, y: h - 1.6 }, size: { w: 2, h: 2 } }, ...spec };
}

export * from './heat.js';
export { ncountFixture, countRead, keptCount, keptCounts, nsrc, nshield, ndrumFixture, ntissueFixture, breaksOf } from './nuke-count.js';
export { nnucFixture, nucRead } from './nuke-nuc.js';
export { nchartFixture } from './nuke-chart.js';
export { chartPick, chartMove, pickValue, walkAt } from './nuke-chart-read.js';
export { nchoiceFixture, chosenIndex, nleadFixture, addNukeLead } from './nuke-choice.js';
export { ndecayFixture, decayRead, clockOf, leftIn, rateAt } from './nuke-decay.js';
export { nscaleFixture, scaleRead, ncurveFixture, curvePick, nchainFixture, chainRead } from './nuke-scale.js';
