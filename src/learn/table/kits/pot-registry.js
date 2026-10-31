/**
 * kits/pot-registry.js — How a bench adds its own instrument or piece to the pot kit (the same pattern as `matter-registry.js`).
 *
 * Each bench's fixtures and pieces live in their own file (`pot-<name>.js`) and register themselves on import; `pot.js` imports the
 * files and builds the kit from what is registered, so two benches never edit the same function. A handler is plain data:
 *
 *   registerFixture(kind, {
 *     paint(ctx, f, state, b),        // the flat picture (called by the drawn and the built table)
 *     run(state, fid) -> row|null,    // what the fixture's key does (see `kits/registry.js` `run`); omit if it has no key
 *     dress3d(f, state, c) -> group,  // solid parts over the picture at 3D On (optional)
 *     settle(state),                  // keep a reading on a piece when the table changes (optional)
 *   })
 *   registerPiece(kind, {
 *     kind: { r, rect, nojoin: true },  // the kit's `kinds` entry
 *     paint(ctx, p, state, o),          // the flat face
 *     faceKey(p, state) -> string,      // changes whenever the face would
 *     piece3d(p, state, c) -> group|null,
 *     printed(p) -> string,
 *   })
 * The Tour's words come from `table/tour.js` `addTourText` (fixtures keyed `pot:<kind>`, pieces by kind).
 */

const FIXTURES = new Map();
const PIECES = new Map();

export const registerFixture = (kind, handler) => { FIXTURES.set(kind, handler); };
export const registerPiece = (kind, def) => { PIECES.set(kind, def); };
export const fixtureHandler = kind => FIXTURES.get(kind) || null;
export const pieceDef = kind => PIECES.get(kind) || null;
export const allFixtureHandlers = () => [...FIXTURES.values()];
export const pieceKinds = () => Object.fromEntries([...PIECES.entries()].filter(([, d]) => d.kind).map(([k, d]) => [k, d.kind]));
