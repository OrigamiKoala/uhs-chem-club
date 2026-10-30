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
import { paintPiece, paintFixture, faceKey, RECTS, contentTop } from './matter-draw.js';
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

export const MATTER_KIT_ID = 'matter';
export const MATTER_BOUNDS = HEAT_BOUNDS;

function run(state, fid) {
  const f = state.fixtures[fid];
  if (!f || f.noRun) return null;
  if (f.kind === 'probe') {
    const r = probeRead(state, fid);
    if (!r.item) return { noop: 'Put a card in the probe first.' };
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

const dress3d = (f, state, c) => {
  const h = fixtureHandler(f.kind);
  if (h?.dress3d) return h.dress3d(f, state, c);
  return HEAT_KIT.dress3d(f, state, c);
};

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
export function probeFixture(id, at, { mode = 'grip', title = 'Probe', runLabel = mode === 'ion' ? 'Drop In Water' : 'Pull Apart', w = 58 } = {}) {
  const top = contentTop(0);
  const h = Math.round((top + 30) * 10) / 10;
  const slotId = `${id}.well`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: { id, kind: 'probe', label: title, at: { ...at }, size: { w, h }, dials: {}, runLabel, props: { backdrop: true, slot: slotId, mode } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 15, y: y0 + top + 9.5 }, size: { w: 24, h: 17 } },
    slotId,
    size: { w, h }
  };
}

export { seatedIn };
export * from './heat.js';
export * from './matter-read.js';
