/**
 * kits/index.js — The registry plus the kits the app ships.
 *
 * T0a ships none: the reducer is proved on a throwaway kit that lives under
 * `tools/lib/` and is never imported here. T1 adds
 *
 *     import './atoms.js';
 *
 * below (a kit module registers itself through `registry.js`), and so on for
 * `cards`, `optics`, `gas`, `heat` and `arms`. Nothing else in `table/` changes:
 * `model.js` and `table2d.js` import THIS module, so every shipped kit is
 * registered before a table is built.
 */

export * from './registry.js';
