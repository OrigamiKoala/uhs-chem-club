/**
 * kits/index.js — The registry plus the kits the app ships.
 *
 * The throwaway kit that proves the reducer lives under `tools/lib/` and is never
 * imported here. T1 ships the atom kit and T2 the card, mass and heap kits; `optics`, `gas`, `heat` and `arms`
 * follow with their phases, one import line each (a kit module registers itself
 * through `registry.js`). Nothing else in `table/` changes: `model.js` and
 * `table2d.js` import THIS module, so every shipped kit is registered before a
 * table is built.
 */

export * from './registry.js';
import './atoms.js';
import './cards.js';
import './mass.js';
import './heap.js';
import './bonds.js';
