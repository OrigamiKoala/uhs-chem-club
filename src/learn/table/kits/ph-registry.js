/**
 * kits/ph-registry.js — How a bench adds its own instrument or piece to the ph kit (the pans-registry pattern, Teeter).
 *
 * Each instrument's fixtures and pieces live in their own file (`ph-<name>.js`) and register themselves here on import; `ph.js` imports
 * the files and builds the kit from what is registered, so two benches never edit the same function. Fixtures give `paint`, `run`,
 * `dress3d`, `settle`; pieces give `kind`, `paint`, `faceKey`, `piece3d`, `printed`. Tour words: `table/tour.js` `addTourText`
 * (fixtures keyed `ph:<kind>`, pieces by kind) in `ph-tour.js` or the instrument's own `ph-<name>-tour.js`.
 */

const FIXTURES = new Map();
const PIECES = new Map();

export const registerFixture = (kind, handler) => { FIXTURES.set(kind, handler); };
export const registerPiece = (kind, def) => { PIECES.set(kind, def); };
export const fixtureHandler = kind => FIXTURES.get(kind) || null;
export const pieceDef = kind => PIECES.get(kind) || null;
export const allFixtureHandlers = () => [...FIXTURES.values()];
export const pieceKinds = () => Object.fromEntries([...PIECES.entries()].filter(([, d]) => d.kind).map(([k, d]) => [k, d.kind]));
