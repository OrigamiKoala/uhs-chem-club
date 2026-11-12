/**
 * kits/matter.js — The matter kit: Mirrowen's seven benches, worked with the hands.
 *
 * A KIT THAT EXTENDS THE HEAT KIT. The cards, blocks, tins, plaques, number marker and answer dial, the particle boxes, the cup and the
 * rail of Ember Reach are the heat kit's and are used as they are. The matter kit adds the molecule card (`mol`) and the instruments
 * this world needs, one family at a time as its benches arrive: the PROBE (the heat that pulls a mole of a liquid's molecules away from
 * their neighbours), and then the window, the vapour flask, the heating curve, the volumetric flask and the strip.
 *
 * A THIN WRAPPER over `engine/matterdata.js` and it authors nothing: a reading is the planner's answer, shown as the picture. A stage
 * declares what stands on the table and what to look for; it never declares what the table will read.
 */

import { registerKit } from './registry.js';
import { HEAT_KIT, HEAT_BOUNDS, HEAT_RECORDER } from './heat.js';
import { dressRecorded } from './pans-3d.js';
import { replayHeat, paintMotion as heatMotion, isLive as heatLive } from './heat-motion.js';
import { replayMatter } from './matter-motion.js';
import { paintPiece, paintFixture, faceKey, RECTS, contentTop } from './matter-draw.js';
import { paintTrayView } from './matter-window.js';
import { probeRead, probeValue, seatedIn } from './matter-read.js';
import { fixtureHandler, pieceDef, pieceKinds, allFixtureHandlers } from './matter-registry.js';
import './matter-tour.js';

/* One import per bench: each file registers its own instruments and pieces (`matter-registry.js`). */
import './matter-window.js';
import './matter-vapour.js';
import './matter-tester.js';
import './matter-curve.js';
import './matter-flask.js';
import './matter-strip.js';
import './matter-lead.js';
import './matter-tour-min.js';

export const MATTER_KIT_ID = 'matter';
export const MATTER_BOUNDS = HEAT_BOUNDS;

function run(state, fid) {
  const f = state.fixtures[fid];
  if (!f || f.noRun) return null;
  if (f.kind === 'probe') {
    const r = probeRead(state, fid);
    if (!r.item) return { noop: 'Put a card in the probe first.' };
    if (f.props.accepts && !f.props.accepts.includes(r.item.id)) return { noop: 'This sample is for you to predict.' };
    return { stamp: { [r.item.id]: { grip: probeValue(r.item) } } };
  }
  const h = fixtureHandler(f.kind);
  if (h?.run) return h.run(state, fid);
  return HEAT_KIT.run(state, fid);
}

/** A piece's solid: a registered piece's own, else the heat kit's. */
const piece3d = (p, state, c) => {
  const def = pieceDef(p.kind);
  if (def?.piece3d) return def.piece3d(p, state, c);
  return HEAT_KIT.piece3d(p, state, c);
};

/** The kinds of fixture whose particles move (`matter-motion.js`): the molecules in their windows, boxes, cylinders and flasks. */
export const MOVING_KINDS = new Set(['press', 'window', 'vapour', 'probe', 'heatcurve', 'flask', 'solidtest', 'surface', 'cell', 'jar', 'mlead', 'jarscale', 'strip', 'filter', 'still', 'boiler', 'plan', 'cooler', 'phasemap']);
const MOVING_PIECES = new Set(['pbox']);
export const isMoving = f => (MOVING_KINDS.has(f.kind) && !f.props?.still) || heatLive(f);

/** Fixture rows are laid out from the top by their dials; the recording context has no layout, so give it the rows the real one has. */
const withRows = (f, b) => ({ ...b, lay: { ...b.lay, dials: Object.keys(f.dials || {}).map((_, i) => ({ y: b.lay.box.y0 + 8 + i * 5 })) } });
const crowdMatter = dressRecorded({ paint: (ctx, f, state, b) => paintFixture(ctx, f, state, withRows(f, b)) });
const crowdHeat = dressRecorded({ paint: heatMotion });
const crowdOf = (f, state, c) => (MOVING_KINDS.has(f.kind) ? crowdMatter : crowdHeat)(f, state, c);

const dress3d = (f, state, c) => {
  const h = fixtureHandler(f.kind);
  const solid = h?.dress3d ? h.dress3d(f, state, c) : HEAT_KIT.dress3d(f, state, c);
  // The moving particles stand up over the plate as a crowd of spheres, read from the same painter as the flat bench.
  if (!isMoving(f)) return solid;
  const crowd = crowdOf(f, state, c);
  const g = new c.THREE.Group();
  if (solid) g.add(solid);
  g.add(crowd);
  g.userData.update = (fx, st) => { solid?.userData?.update?.(fx, st); crowd.userData.sync(fx, st); };
  g.userData.sync = (fx, st) => crowd.userData.sync(fx, st);
  g.userData.tick = (dt, still) => { solid?.userData?.tick?.(dt, still); crowd.userData.tick(dt, still); };
  g.userData.counts = crowd.userData.counts;
  return g;
};

/** A table moves when it holds a fixture or a card whose particles move. */
const live = state => state.kit === MATTER_KIT_ID && (Object.values(state.zones?.trays || {}).some(t => t.view) || Object.values(state.fixtures || {}).some(isMoving) || Object.values(state.pieces || {}).some(p => !p.hidden && (MOVING_PIECES.has(p.kind) || HEAT_KIT.live?.({ ...state, kit: 'heat', fixtures: {}, pieces: { [p.id]: p } }))));

/**
 * Places on an instrument that are the particles themselves, dragged: the piston of the press (push it down to compress the gas).
 * Each sets the dial that is graded, so a scripted solution and the two-tap twin (the dial's own track) still work.
 */
function tapZones(f) {
  if (f.kind === 'press' && f.dials.squeeze) return [{ x0: 31, x1: 45, y0: 12.6, y1: 34.6, dial: 'squeeze', drag: { y0: 14, y1: 33, scale: f.dials.squeeze.max, invert: true } }];
  return HEAT_KIT.tapZones?.(f) || [];
}

/** The heat kit's own settling, then every registered fixture's. */
const settle = state => {
  HEAT_KIT.settle(state);
  for (const h of allFixtureHandlers()) h.settle?.(state);
};

export const MATTER_KIT = {
  ...HEAT_KIT,
  id: MATTER_KIT_ID,
  kinds: { ...HEAT_KIT.kinds, mol: { r: 7.5, rect: RECTS.mol, nojoin: true }, ...pieceKinds() },
  run,
  paintPiece,
  paintFixture,
  faceKey,
  piece3d,
  dress3d,
  settle,
  live,
  tapZones,
  paintTray: paintTrayView,
  // A miss replays the cause: the glides of the heat kit start again and every particle keeps moving.
  onMiss: () => { replayHeat(); replayMatter(); },
  printed: p => (p.kind === 'mol' ? String(p.label) : pieceDef(p.kind)?.printed ? pieceDef(p.kind).printed(p) : HEAT_KIT.printed(p))
};

registerKit(MATTER_KIT);

/** A stage's declaration with the matter kit's defaults: the kit, the bounds, a parked recorder strip. */
export function matterTable(spec, { w = MATTER_BOUNDS.w, recorder = null } = {}) {
  return { kit: MATTER_KIT_ID, bounds: { w, h: MATTER_BOUNDS.h }, tools: [], recorder: recorder || { ...HEAT_RECORDER }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

const piece = (kind, id, label, at, props = {}, extra = {}) => ({ id, kind, label, at, props, ...extra });

/** A molecule card. `substance` is a `SUBSTANCES` id; `shown` is a second line (its mass, say); `cloud` draws a lone atom as its cloud, `dipoles` marks a polar molecule's partial charges. */
export const molCard = (id, substance, label, at, { shown = null, cloud = false, dipoles = false } = {}, extra = {}) =>
  piece('mol', id, label, at, { substance, ...(shown ? { shown } : {}), ...(cloud ? { cloud: true } : {}), ...(dipoles ? { dipoles: true } : {}) }, extra);

/** An ion card. `ion` is a `HYDRATION` id; `symbol` what is printed on it; `r` its radius in pm, which sets how wide its disc is drawn. */
export const ionCard = (id, ion, symbol, r, at, extra = {}) => piece('mol', id, symbol, at, { ion, r }, extra);

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

/**
 * The probe: a slot for a card, a window of its molecules, and a key. `mode` 'grip' pulls a mole of a substance's molecules apart;
 * 'ion' drops a mole of gaseous ion in water and reads the heat given out. Returns the fixture and the slot (stand it where it says).
 */
export function probeFixture(id, at, { mode = 'grip', title = 'Probe', runLabel = mode === 'ion' ? 'Drop In Water' : 'Separate', w = 58, accepts = null } = {}) {
  const top = contentTop(0);
  const h = Math.round((top + 30) * 10) / 10;
  const slotId = `${id}.well`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'probe', label: title, at: { ...at }, size: { w, h }, dials: {}, runLabel, props: { backdrop: true, slot: slotId, mode, ...(accepts ? { accepts } : {}) } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId,
    size: { w, h }
  };
}

export { seatedIn };
export * from './heat.js';
export { mleadFixture } from './matter-lead.js';
export * from './matter-read.js';
