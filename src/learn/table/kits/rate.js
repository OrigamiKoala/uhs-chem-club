/**
 * kits/rate.js — The `rate` kit for Quicklight (unit11, kinetics).
 * Extends `HEAT_KIT` (cards, trays, rails, plaques, selectors, equation stacks) with kinetics instruments.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS, HEAT_RECORDER } from './heat.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey } from './heat-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers } from './rate-registry.js';
import './rate-tour.js';
import './rate-vessel.js';
import './rate-log.js';
import './rate-plotter.js';
import './rate-collide.js';
import './rate-mb.js';
import './rate-profile.js';
import { replayVessels, paintPickFrame, paintPickHint } from './rate-vessel.js';

export const RATE_KIT_ID = 'rate';
export const RATE_BOUNDS = HEAT_BOUNDS;

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
  const out = h?.paint ? h.paint(ctx, f, state, b) : heatFixture(ctx, f, state, b);
  if (f.props?.pick) { paintPickHint(ctx, f, state, b); paintPickFrame(ctx, f, state, b); }
  return out;
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

export const RATE_KIT = {
  ...HEAT_KIT,
  id: RATE_KIT_ID,
  kinds: { ...HEAT_KIT.kinds, ...pieceKinds() },
  run,
  tapZones: (f, state) => fixtureHandler(f.kind)?.tapZones?.(f, state) || [],
  replay: () => { replayVessels(); },
  onMiss: () => { replayVessels(); },
  live: state => Object.values(state.fixtures || {}).some(f => fixtureHandler(f.kind)?.live?.(f, state)),
  paintPiece,
  paintFixture,
  faceKey,
  piece3d,
  dress3d,
  settle,
  printed: p => (pieceDef(p.kind)?.printed ? pieceDef(p.kind).printed(p) : HEAT_KIT.printed(p))
};

registerKit(RATE_KIT);

export function rateTable(spec, { w = RATE_BOUNDS.w, h = RATE_BOUNDS.h, recorder = null } = {}) {
  return { kit: RATE_KIT_ID, bounds: { w, h }, tools: [], recorder: recorder || { ...HEAT_RECORDER, at: { x: w - 2.6, y: h - 2.4 } }, ...spec };
}

export * from './heat.js';
export { kvesselFixture, rateLeadFixture, choiceFixture, pickable } from './rate-vessel.js';
export { rateslogFixture, rateboardFixture } from './rate-log.js';
export { plotterFixture } from './rate-plotter.js';
export { collviewFixture } from './rate-collide.js';
export { mbhistFixture } from './rate-mb.js';
export { kprofileFixture } from './rate-profile.js';
