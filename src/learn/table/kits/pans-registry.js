/**
 * kits/pans-registry.js — How a bench adds its own instrument or piece to the pans kit (the matter-registry pattern).
 *
 * Each bench's fixtures and pieces live in their own file (`pans-<name>.js`) and register themselves here on import; `pans.js` imports
 * the files and builds the kit from what is registered, so two benches never edit the same function. See `matter-registry.js` for the
 * shape of a handler: fixtures give `paint`, `run`, `dress3d`, `settle`; pieces give `kind`, `paint`, `faceKey`, `piece3d`, `printed`.
 * Tour words: `table/tour.js` `addTourText` (fixtures keyed `pans:<kind>`, pieces by kind).
 */

const FIXTURES = new Map();
const PIECES = new Map();

export const registerFixture = (kind, handler) => { FIXTURES.set(kind, handler); };
export const registerPiece = (kind, def) => { PIECES.set(kind, def); };
export const fixtureHandler = kind => FIXTURES.get(kind) || null;
export const pieceDef = kind => PIECES.get(kind) || null;
export const allFixtureHandlers = () => [...FIXTURES.values()];
export const pieceKinds = () => Object.fromEntries([...PIECES.entries()].filter(([, d]) => d.kind).map(([k, d]) => [k, d.kind]));
export const allKinds = () => [...FIXTURES.keys()];
