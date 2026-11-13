/**
 * kits/lode-registry.js — fixture and piece registry for the `lode` kit (Lodestone, unit12). Each family file registers its own kinds,
 * so no two builders edit one list.
 */

const FIXTURES = new Map();
const PIECES = new Map();

export const registerFixture = (kind, handler) => { FIXTURES.set(kind, handler); };
export const registerPiece = (kind, def) => { PIECES.set(kind, def); };
export const fixtureHandler = kind => FIXTURES.get(kind) || null;
export const pieceDef = kind => PIECES.get(kind) || null;
export const allFixtureHandlers = () => [...FIXTURES.values()];
export const allFixtureEntries = () => [...FIXTURES.entries()];
export const pieceKinds = () => Object.fromEntries([...PIECES.entries()].filter(([, d]) => d.kind).map(([k, d]) => [k, d.kind]));
