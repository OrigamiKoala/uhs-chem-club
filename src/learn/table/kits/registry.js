/**
 * kits/registry.js — Which kits the tabletop knows.
 *
 * A KIT is the chemistry (or physics) of one family of pieces, and it is the
 * only place a table asks "what does this do?". The reducer in `../model.js`
 * knows how to pick, place, join, pour and run; it never knows what a join
 * MEANS. A kit answers, by calling the same pure planners the instruments
 * already share (`planJoin`, `planLewis`, `planDomains`, ...). A kit is a thin
 * wrapper over those planners and never a second implementation of one.
 *
 * THE KIT INTERFACE (everything but `id` is optional):
 *
 *   id          string, the name a stage's `table.kit` gives.
 *   kinds       { [kind]: { r?: number } }  piece kinds and their radius in
 *               table units (default `DEFAULT_R`).
 *   planJoin(a, b, state) -> { holds: boolean, reason?: string, link?: object }
 *               What the physics says about joining pieces `a` and `b` (the
 *               piece records, cluster included through `state`). NEVER a
 *               gatekeeper: it is asked about any pair the player attempts,
 *               and `holds:false` is a real outcome (the pair drifts apart).
 *               `link` is plain JSON kept on the join (a transfer's counts, a
 *               shared pair) for `readPiece` and the views to draw.
 *   canJoin(a, b, state) -> boolean   `planJoin(...).holds`; derived if absent.
 *   readPiece(id, state) -> object    A piece's DERIVED reading from the
 *               structure it is in (charge, lamp, shells). Derived rather than
 *               stored, so a split undoes a join by itself.
 *   formulaOf(ids, state) -> string|null   The formula of a cluster of piece ids.
 *   chargeOf(ids, state) -> number         Net charge of a cluster.
 *   run(state, fixtureId) -> {x, y, label}|null   What a fixture reads when run.
 *               The recorder appends it; nothing else may invent a row.
 *   tools       { [toolId]: { probe(state) -> action[] } }  Actions that
 *               exercise a tool; `verify:table` holds each to "changes the
 *               state or the picture".
 *   maxScale    number, the largest `scale` a card may take (default 1).
 *
 * VIEW HOOKS (T0b; optional, read only by the views and the shared gestures):
 *   kinds.x.flip / .scale   true when a piece of kind x can be turned over / scaled;
 *               a held piece then offers the Flip, Smaller and Larger keys
 *   faceOf(piece, state) -> {text?, badge?, flipped?}   what a piece shows on its face
 *   pourStep(state, from, to, what) -> number   one pour gesture's amount (default 1)
 *   kinds.x.instanced   true for many small unlabelled pieces: one draw call per kind
 *   fixture3d(fixture, {THREE, scale, mats, toPlate, plaque}) -> {group, update?(fixture, state)}
 *               builds a fixture for the built table (reuse the `*3d.js` builders here);
 *               without it a fixture is a rim, a knob per dial and a Run key
 *
 * T1 adds `kits/atoms.js` (over `joinbench.js` / `lewis.js`) and registers it
 * here; the reducer does not change.
 */

export const DEFAULT_R = 4.5;

const KITS = new Map();

/** Fill in what a kit may leave out. */
function complete(kit) {
  return {
    kinds: {},
    maxScale: 1,
    tools: {},
    planJoin: () => ({ holds: false, reason: 'nothing here joins' }),
    formulaOf: () => null,
    chargeOf: () => 0,
    readPiece: () => ({}),
    run: () => null,
    ...kit,
    canJoin(a, b, state) { return Boolean(this.planJoin(a, b, state).holds); }
  };
}

export function registerKit(kit) {
  if (!kit || typeof kit.id !== 'string' || !kit.id) throw new Error('registerKit: a kit needs an id');
  KITS.set(kit.id, complete(kit));
  return KITS.get(kit.id);
}

export function unregisterKit(id) { KITS.delete(id); }
export function hasKit(id) { return KITS.has(id); }
export function kitIds() { return [...KITS.keys()]; }

export function getKit(id) {
  const kit = KITS.get(id);
  if (!kit) throw new Error(`table: no kit "${id}" is registered`);
  return kit;
}

/** The radius of a piece, in table units. */
export function radiusOf(kit, piece) {
  return piece?.r ?? kit.kinds?.[piece?.kind]?.r ?? DEFAULT_R;
}
