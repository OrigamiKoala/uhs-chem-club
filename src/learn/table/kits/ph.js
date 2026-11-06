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
import { bodiesDress } from './ph-3d.js';
import { markReplay, replayView, replayMark, demoView } from './ph-replay.js';
import './ph-tour.js';

/* One import per instrument: each file registers its own fixtures and pieces. (marker: ph instruments) */
import './ph-flask.js';
import './ph-rig.js';
import './ph-burette.js';
import './ph-curve.js';
import './ph-pour.js';
import './ph-scale.js';
import './ph-race.js';
import './ph-mix.js';
import './ph-buffer.js';
import './ph-strip.js';
import './ph-solid.js';
import './ph-transfer.js';

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
const hasBodies = (h, f) => Boolean(h?.bodies3d && (typeof h.bodies3d !== 'function' || h.bodies3d(f)));
/** A handler's painter, drawing the replay of a miss instead of the table while one plays. */
const paintHandler = (h, key) => (ctx, f, state, b) => {
  const rv = replayView(f, b.clock || 0, key);
  const out = h.paint(ctx, rv.f, state, b);
  if (rv.replaying) replayMark(ctx, b, rv.step, f.props.replay.n);
  return out;
};
const paintFixture = (ctx, f, state, b) => {
  const h0 = fixtureHandler(f.kind);
  const h = h0 && { ...h0, paint: h0.paint && paintHandler(h0, b.sk || 'flat') };
  if (h?.paint) {
    // At 3D On the particles stand up as spheres (`ph-3d.js`); the plate keeps the frame, the names and the numbers.
    if (b.bodies && hasBodies(h, f)) { ctx.__skip = true; try { return h.paint(ctx, f, state, b); } finally { ctx.__skip = false; } }
    return h.paint(ctx, f, state, b);
  }
  return heatFixture(ctx, f, state, b);
};
const piece3d = (p, state, c) => {
  const def = pieceDef(p.kind);
  if (def?.piece3d) return def.piece3d(p, state, c);
  return HEAT_KIT.piece3d(p, state, c);
};
const dress3d = (f, state, c) => {
  const h = fixtureHandler(f.kind);
  const base = h?.dress3d ? h.dress3d(f, state, c) : HEAT_KIT.dress3d(f, state, c);
  if (!hasBodies(h, f)) return base;
  const bodies = bodiesDress(f, state, c, paintHandler(h, '3d'));
  if (!base) return bodies;
  const g = new c.THREE.Group();
  g.add(base, bodies);
  g.userData.sync = bodies.userData.sync; g.userData.tick = bodies.userData.tick;
  return g;
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
  // A miss replays the cause on the instruments that can (`ph-replay.js`).
  onMiss: table => markReplay(table),
  // A short demonstration of an instrument being used, for the Tour: the fixture t seconds into it.
  demoOf: (f, t) => demoView(f, t),
  // A mechanism view (a window of moving particles) keeps the table's loop running and gives its painters a clock.
  live: state => Object.values(state.fixtures || {}).some(f => fixtureHandler(f.kind)?.live?.(f, state)),
  paintPiece,
  paintFixture,
  faceKey,
  piece3d,
  dress3d,
  settle,
  // What the hand passed through on a dial (the fraction strip keeps the pH range it has been moved over): a fixture handler's `dialed`.
  dialed: (state, f, name) => fixtureHandler(f.kind)?.dialed?.(state, f, name) || null,
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
export { buretteFixture, buretteRead, POUR_LABELS } from './ph-burette.js';
export { curveFixture, curveRows } from './ph-curve.js';
export { scaleFlask, scaleMeter, scaleWindow, scaleRead, scaleMeterRead, strengthText } from './ph-scale.js';
export { pourFixture, pourRead, sceneNames, formulaChip } from './ph-pour.js';
export { raceParts, acidCard, raceRead, nameAcid, nameBase } from './ph-race.js';
export { neutParts } from './ph-mix.js';
export { mixFixture, mixRead, U as MIX_UNIT } from './ph-buffer.js';
export { stripFixture, stripRead } from './ph-strip.js';
export { transferParts, transferRead, takeSlot } from './ph-transfer.js';
export { solidFixture, solidRead, solidAfter, saturatedSpheres } from './ph-solid.js';
