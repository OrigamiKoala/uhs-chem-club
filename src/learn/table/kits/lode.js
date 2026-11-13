/**
 * kits/lode.js — the `lode` kit for Lodestone (unit12, transition metals). Extends `HEAT_KIT` (cards, slots, trays, rails, plaques) with the
 * world's own instruments, each registered by its family file through `lode-registry.js`.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS } from './heat.js';
import { paintPiece as heatPiece, paintFixture as heatFixture, faceKey as heatFaceKey } from './heat-draw.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers, allFixtureEntries } from './lode-registry.js';
import { installLodeDresses } from './lode-3d.js';
import './lode-tour.js';
import './lode-shell.js';
import './lode-lead.js';
import './lode-cplx.js';
import './lode-light.js';
import './lode-magnet.js';

export const LODE_KIT_ID = 'lode';
export const LODE_BOUNDS = HEAT_BOUNDS;

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

export const LODE_KIT = {
  ...HEAT_KIT,
  id: LODE_KIT_ID,
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

installLodeDresses(allFixtureEntries());
registerKit(LODE_KIT);

const OWN_TITLE = new Set(['dshell', 'iestrip', 'lodelead', 'lchoice', 'beaker', 'cplx', 'match', 'spec', 'wheel', 'cfield', 'dsplit', 'magnet']);

export function lodeTable(spec, { w = LODE_BOUNDS.w, h = LODE_BOUNDS.h, recorder = null } = {}) {
  for (const f of spec.fixtures || []) if (f.dials && Object.keys(f.dials).length && f.props && f.props.dialIndent == null) f.props.dialIndent = 3.6;
  for (const f of spec.fixtures || []) if (f.props && OWN_TITLE.has(f.kind) && f.props.hideLabel == null) f.props.hideLabel = true;
  // The kit's instruments keep their readings on their own faces: the recorder is parked, two units square, where the Tour leaves it out.
  return { kit: LODE_KIT_ID, bounds: { w, h }, tools: [], recorder: recorder || { at: { x: w - 1.6, y: h - 1.6 }, size: { w: 2, h: 2 } }, ...spec };
}

export * from './heat.js';
export { dshellFixture, dshellRead, atomOcc, iestripFixture, iestripRead, lchoiceFixture, chosen, pickOf, elemCard } from './lode-shell.js';
export { lodeLeadFixture } from './lode-lead.js';
export { vial, specFixture, specRead, wheelFixture, wheelRead, cfieldFixture, cfieldRead, dsplitFixture, dsplitRead, CF_ORBITALS } from './lode-light.js';
export { beakerFixture, beakerRead, cplxFixture, cplxRead, matchFixture, matchRead } from './lode-cplx.js';
export { magnetFixture, magnetRead } from './lode-magnet.js';
