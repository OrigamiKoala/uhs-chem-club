/**
 * instruments.js — Which bench a Learn quest gets, by tier.
 *
 * Every Learn quest is now played on a Tabletop (`table2d.js` / `table3d.js`).
 * At T4 the table is built on the world's bench (`Table3D`), leaning the camera in over
 * the plate; at T3 and below it is drawn top-down (`Table2D`).
 */

import { tierAtLeast } from '../../three/tier.js';
import { benchDeployment } from './bench-host.js';
import { Table2D } from './table2d.js';
import { Table3D } from './table3d.js';

/** True when this client is drawing the Learn benches in three dimensions. */
export function benchesAre3D() {
  return tierAtLeast('T4');
}

/**
 * Which quests are played on a bench that is BUILT rather than drawn.
 * Every quest across all walkable worlds and Kettle is played on Table3D at T4.
 */
const BUILT_BENCHES = new Set([
  // Unit 1 — Tallow
  'q1-grain', 'q2-core', 'q3-catalogue', 'q4-ledger', 'q5-assay', 'q6-weigh', 'boss-hopper',
  // Unit 2 — Lanternfall
  'q1-wave', 'q2-photon', 'q3-lines', 'q4-cloud', 'q5-numbers', 'q6-filling', 'q7-pes', 'q8-trends', 'q9-absorb', 'boss-eater',
  // Unit 3 — Ligar
  'q1-joins', 'q2-lattice', 'q3-distance', 'q4-dots', 'q5-resonance', 'q6-shape', 'q7-polarity', 'q8-hybrid', 'q9-orbitals', 'boss-warden',
  // Unit 4 — Bellows
  'q1-knocks', 'q2-laws', 'q3-ideal', 'q4-mixtures', 'q5-speed', 'q6-real', 'boss-compressor',
  // Unit 5 — Ember Reach
  'q1-flow', 'q2-calorimetry', 'q3-enthalpy', 'q4-bonds', 'q5-hess', 'q6-entropy', 'q7-gibbs', 'boss-crucible',
  // Unit 7 — Kettle
  'q1-recipe', 'boss-golem',
]);

/**
 * True when `questId` is played on an instrument that is built in the world.
 * The host screen asks this to decide whether the quest frame is bolted to a
 * bench or drawn as a page.
 */
export function benchIsBuilt(questId) {
  return benchesAre3D() && BUILT_BENCHES.has(questId);
}

/**
 * Fold the deployment frame into a bench's options, so an instrument built on a
 * world the player can walk is laid on the bench that is already standing there.
 * Off a walkable world this adds nothing and the bench builds its own room.
 */
function deployed(opts) {
  const world = benchDeployment();
  return world ? { ...opts, world } : opts;
}

/**
 * The tabletop: pieces, trays, a rail, slots, containers and fixtures on the
 * bench, graded on what is on the table (`table/`, plan `bench-tabletop.md`).
 * At T4 it is BUILT (`table3d.js`, a `BenchViewer3D` that leans the camera in over
 * the plate); at T3 and below it is the drawn top-down tabletop (`table2d.js`).
 */
export function Tabletop(host, opts = {}) {
  return benchesAre3D()
    ? new Table3D(host, deployed(opts))
    : new Table2D(host, opts);
}

/* Legacy instrument factory shims delegating to Tabletop. */
export const SampleScope = Tabletop;
export const CoreBench = Tabletop;
export const CatalogueBoard = Tabletop;
export const AssayFloor = Tabletop;
export const JoinBench = Tabletop;
export const LightBench = Tabletop;
export const CloudPlate = Tabletop;
export const BoxRack = Tabletop;
export const ElectronBench = Tabletop;
export const BondBench = Tabletop;
export const PairBoard = Tabletop;
export const DomainRig = Tabletop;
export const GasRig = Tabletop;
export const Calorimeter = Tabletop;

/* Exported so a caller that wants the built instrument by name can have it. */
export { Table2D, Table3D };

/* Re-exported so a quest module needs exactly one import line for its bench. */
export { detailFor, TINTS } from './scope.js';
export { FIELDS } from './corebench.js';
