/**
 * kits/rate-registry.js — Fixture and piece registry for the `rate` kit (Quicklight, unit11).
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
export const allFixtureEntries = () => [...FIXTURES.entries()];

/** At 3D On (`b.bodies`) the plate leaves a fixture's solid shapes to its 3D dress: fills, strokes and rectangles become no-ops, text still draws. */
export const shapesOff = ctx => new Proxy(ctx, {
  get(t, k) {
    if (k === 'fill' || k === 'stroke' || k === 'fillRect' || k === 'strokeRect') return () => undefined;
    const v = t[k];
    return typeof v === 'function' ? v.bind(t) : v;
  },
  set(t, k, v) { t[k] = v; return true; }
});
