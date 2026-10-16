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
 * T1 (the atom kit, `atoms.js`) adds the hooks a kit uses to say what its pieces LOOK like and
 * to extend what a join and a run can do. Each is optional, and each is called by BOTH views
 * with the same arguments, so the drawn and the built table cannot show different things:
 *   kinds.x.tool     true for a piece that is LAID ON another (a lens on a sample) and comes off it
 *                    again when it is picked up; a `planJoin` that answers `once: true` makes a PASS
 *                    instead (a cutter drawn across a sample) and the tool returns to where it hangs
 *   kinds.x.nojoin   true for a kind that is never a join target or a joiner (a particle, a detector)
 *   kinds.x.split    true when a held, joined piece offers the "Pull Out" key
 *   planJoin(...)    may also answer `set: {a?: props, b?: props}` (what the join leaves written on
 *                    the pieces, e.g. a sample that has been cut) and `once`
 *   run(...)         may also answer `stamp: {pieceId: props}` (the reading written on the thing read)
 *                    with no `x`/`y` when the reading is not for the recorder
 *   paintPiece(ctx, piece, state, {x, y, r, lit, sc, flat}) -> boolean   paints a piece's whole face
 *                    (label included); false leaves it to the generic puck
 *   faceKey(piece, state) -> string   what the face depends on, so the built table repaints it
 *   paintFixture(ctx, fixture, state, {x0, y0, x1, y1, sc, X, Y, lay})   paints the content of a
 *                    fixture's box flat (a needle, a beam's path, a reading)
 *   paintLink(ctx, link, {a, b, ax, ay, bx, by, sc}) -> boolean   paints a join; false = a plain line
 *   linkRods(link, state) -> number   how many rods the built table lays for a join (default 1)
 *   table.opts       plain data a stage hands its kit (`state.opts`)
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
