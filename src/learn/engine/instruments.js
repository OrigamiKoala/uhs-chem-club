/**
 * instruments.js — Which bench a Learn quest gets, by tier.
 *
 * A quest module asks for `SampleScope` or `CoreBench` and never finds out which
 * one it received. At T4 the player is standing on Tallow in first person and
 * both instruments are BUILT there: the sampler scope (`scope3d.js`) and the
 * core bench (`corebench3d.js`) are objects on the plate the player walked up
 * to, with their screens bolted over them and their controls standing on them.
 * At T3 and below both are the canvas instruments in `scope.js` / `corebench.js`.
 *
 * THE TWO ARE THE SAME INSTRUMENT. They expose the same methods, take the same
 * sample and specimen declarations, and plan every tool through the same pure
 * functions in the canvas engines. A stage that grades correct on one grades
 * correct on the other, which is the rule that keeps T4 a fidelity tier rather
 * than a second game (3d-conversion-prompts.md §0.5). Quest modules hold all the
 * copy and all the answers, and neither bench reads either.
 *
 * `mountScene` / `unmountScene` are how a 3D bench gets drawn: the host screen
 * passes hooks that hand the viewer to the stage's render loop. The canvas
 * instruments ignore them, so the quest module is identical either way.
 */

import { tierAtLeast } from '../../three/tier.js';
import { benchDeployment } from './bench-host.js';
import { SampleScope as SampleScope2D } from './scope.js';
import { CoreBench as CoreBench2D } from './corebench.js';
import { SampleScope3D } from './scope3d.js';
import { CoreBench3D } from './corebench3d.js';
import { CatalogueBoard as CatalogueBoard2D } from './catalogue.js';
import { AssayFloor as AssayFloor2D } from './assay.js';
import { CatalogueBoard3D } from './catalogue3d.js';
import { AssayFloor3D } from './assay3d.js';
import { JoinBench as JoinBench2D } from './joinbench.js';
import { JoinBench3D } from './joinbench3d.js';
import { LightBench as LightBench2D } from './lightbench.js';
import { LightBench3D } from './lightbench3d.js';
import { CloudPlate as CloudPlate2D } from './cloudplate.js';
import { CloudPlate3D } from './cloudplate3d.js';
import { BoxRack as BoxRack2D } from './boxrack.js';
import { BoxRack3D } from './boxrack3d.js';
import { ElectronBench as ElectronBench2D } from './electronbench.js';
import { ElectronBench3D } from './electronbench3d.js';
import { BondBench as BondBench2D } from './bondbench.js';
import { BondBench3D } from './bondbench3d.js';
import { PairBoard as PairBoard2D } from './pairboard.js';
import { PairBoard3D } from './pairboard3d.js';
import { DomainRig as DomainRig2D } from './domainrig.js';
import { DomainRig3D } from './domainrig3d.js';
import { GasRig as GasRig2D } from './gasrig.js';
import { GasRig3D } from './gasrig3d.js';
import { Calorimeter as Calorimeter2D } from './calorimeter.js';
import { Calorimeter3D } from './calorimeter3d.js';
import { Table2D } from './table2d.js';
import { Table3D } from './table3d.js';

/** True when this client is drawing the Learn benches in three dimensions. */
export function benchesAre3D() {
  return tierAtLeast('T4');
}

/**
 * Which quests are played on a bench that is BUILT rather than drawn.
 *
 * BOTH OF THEM, AT T4. The sampler scope used to stay a drawn screen on every
 * tier on the argument that a microscope's picture is a picture, and that
 * building it would read as the sample inflating. What that reasoning missed is
 * where the picture belongs: on a bench the player has walked to there is a
 * SCREEN to put it on, bolted over the wells, and the samples themselves are
 * crates on the plate in front of you. So the instrument is built — the bulk
 * matter sits in real wells at real stations, the power control is a milled cap
 * you reach over and turn, and the magnified picture is the thing on the screen
 * above it, which is exactly the relationship a scope has to its sample.
 *
 * The core bench was always the other case: a rig with a specimen mounted in it,
 * a beam fired through it and rings standing off it at fixed radii. Those are
 * real positions in space.
 *
 * (T2, `bench-tabletop.md`: `q3-catalogue` and `q4-ledger` have since become tabletops, the card kit and the atom
 * kit, played by `table3d.js`, and the hopper boss plays on tables too; the board and the core bench below are real
 * instruments no quest plays now, kept and checked until T7 retires them.)
 *
 * THE LAST THREE FOLLOW, AND TWO OF THEM ARE EASIER CASES THAN EITHER.
 *
 * `q4-ledger` is the core bench again, at site four, and needed nothing but its
 * name in this list.
 *
 * `q3-catalogue` is a card index, and a card index resolves nothing: it is a
 * drawer of cards and a board of slots, objects the size of a hand that a
 * filing clerk picks up and puts down. There is no picture of a card; there is
 * a card. `catalogue3d.js` builds it the whole way, and filing one is reaching
 * over and moving it — still two taps, never a drag.
 *
 * (T2, `bench-tabletop.md`: `q5-assay`, `q6-weigh` and `boss-hopper` are tabletops too, the mass kit; the paragraph below
 * says what the assay floor was, and it is still a real instrument, so it is still built and checked.)
 *
 * `q5-assay` tips a heap down a chute past a deflector into a row of bins.
 * Those are objects falling into containers at arm's length, so `assay3d.js`
 * builds the works and the pieces really fall. The counting the flat-picture
 * rule exists to protect is protected by the geometry instead: each bin is
 * open-fronted behind a sight glass and every piece stacks into ONE PLANE just
 * inside it, on the grid `packBin` computes, so nothing is ever behind anything
 * and the heap and the tally over it are the same measurement.
 *
 * Below T4 both are the canvas instruments, and both grade identically — the
 * planners (`planSettle`, `planCut`, `planBeam`, `planStrip`) live in the 2D
 * engines and are the single implementation.
 */
const BUILT_BENCHES = new Set([
  // Unit 1 — Tallow
  'q1-grain',      // the tabletop, atom kit — table3d.js (T1; the sampler scope serves no quest now and is retired with T7)
  'q2-core',       // the tabletop, atom kit — table3d.js (T1; the core bench still serves q4-ledger)
  'q3-catalogue',  // the tabletop, card kit — table3d.js (T2; the catalogue board is retired with T7)
  'q4-ledger',     // the tabletop, atom kit — table3d.js (T2; the core bench is retired with T7)
  'q5-assay',      // the tabletop, mass kit (assay) — table3d.js (T2; the assay floor is retired with T7)
  'q6-weigh',      // the tabletop, mass kit (two pans and counters), at site six
  'boss-hopper',   // the hopper: five phases on one table, atom, card and mass kits, its foe in the table's corner
  // Unit 3 — Ligar. The join bench is a subclass of the drawn bench, so its
  // tools are the canvas bench's tools and cannot grade differently.
  'q1-joins',      // the join bench, pair plates — joinbench3d.js
  'q2-lattice',    // the join bench, slab plates — joinbench3d.js
  // Unit 7 — Kettle. Built as Ligar's bench three; Kettle is not yet walkable,
  // so at T4 it builds its own room around itself (`rooms.js`, the foundry).
  'q1-recipe',     // the tabletop, heap kit — table3d.js (T2c; the sampler scope still serves nothing else here)
  'boss-golem',    // the golem: two phases on the heap kit and the mass kit, its foe in the table's corner
  // Unit 2 — Lanternfall.
  'q1-wave',       // the light bench, trace and prism heads — lightbench3d.js
  'q2-photon',     // the light bench, photocell head
  'q3-lines',      // the light bench, prism head and the energy ladder
  'q4-cloud',      // the cloud plate — cloudplate3d.js
  'q5-numbers',    // the box rack, address layout — boxrack3d.js
  'q6-filling',    // the box rack, atomic layout
  'q7-pes',        // the electron bench, spectrum head — electronbench3d.js
  'q8-trends',     // the electron bench, atom head and pull meter
  'q9-absorb',     // the light bench, cuvette head
  // Unit 3 — Ligar, benches three to nine.
  'q3-distance',   // the bond bench, pair and lattice plates — bondbench3d.js
  'q4-dots',       // the pair board — pairboard3d.js
  'q5-resonance',  // the pair board again, with the charge tool and the gauge
  'q6-shape',      // the domain rig, hub plates — domainrig3d.js
  'q7-polarity',   // the domain rig, field plates
  'q8-hybrid',     // the domain rig, mixer and twist plates
  'q9-orbitals',   // the box rack, molecular layout — boxrack3d.js
  'boss-warden',   // the warden: bond bench, pair board, domain rig and box rack in turn, in its own room
  // Unit 4 — Bellows. One instrument, six heads: cylinder, mixture, leak, tube, path and record.
  'q1-knocks',     // the gas rig, cylinder head with the speed screen — gasrig3d.js
  'q2-laws',       // the gas rig, cylinders with traces, and the gauge records
  'q3-ideal',      // the gas rig, cylinders with the scale and the readings
  'q4-mixtures',   // the gas rig, mixture tanks
  'q5-speed',      // the gas rig, speed screen, pinhole, tube and path
  'q6-real',       // the gas rig, real-gas cylinders
  'boss-compressor', // the compressor: cylinders, tanks and the pinhole in turn
  // Unit 5 — Ember Reach. One instrument, seven heads: contact, cup, diagram, bonds, hess, box and gibbs.
  'q1-flow',       // the calorimeter, contact and cup heads — calorimeter3d.js
  'q2-calorimetry',// the calorimeter, cup head
  'q3-enthalpy',   // the calorimeter, cup and diagram heads
  'q4-bonds',      // the calorimeter, bond crank and ledger heads
  'q5-hess',       // the calorimeter, Hess stack and formation heads
  'q6-entropy',    // the calorimeter, microstate box and phase heads
  'q7-gibbs',      // the calorimeter, Gibbs plotter head
  'boss-crucible'  // the crucible: cup, diagram, Hess stack, box and Gibbs plotter in turn
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
 *
 * The quest module never sees this: it passes the same options it always passed.
 */
function deployed(opts) {
  const world = benchDeployment();
  return world ? { ...opts, world } : opts;
}

/**
 * The sampler scope. Signature and behaviour match `SampleScope` in scope.js.
 * @param {HTMLElement} host
 * @param {{kinds: object, onProbe?: Function, onSelect?: Function,
 *          mountScene?: Function, unmountScene?: Function}} opts
 */
export function SampleScope(host, opts = {}) {
  return benchesAre3D()
    ? new SampleScope3D(host, deployed(opts))
    : new SampleScope2D(host, opts);
}

/**
 * The core bench. Signature and behaviour match `CoreBench` in corebench.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function,
 *          mountScene?: Function, unmountScene?: Function}} opts
 */
export function CoreBench(host, opts = {}) {
  return benchesAre3D()
    ? new CoreBench3D(host, deployed(opts))
    : new CoreBench2D(host, opts);
}

/**
 * The catalogue board. Signature and behaviour match `CatalogueBoard` in
 * catalogue.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onPlace?: Function, onLift?: Function}} opts
 */
export function CatalogueBoard(host, opts = {}) {
  return benchesAre3D()
    ? new CatalogueBoard3D(host, deployed(opts))
    : new CatalogueBoard2D(host, opts);
}

/**
 * The assay floor. Signature and behaviour match `AssayFloor` in assay.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function}} opts
 */
export function AssayFloor(host, opts = {}) {
  return benchesAre3D()
    ? new AssayFloor3D(host, deployed(opts))
    : new AssayFloor2D(host, opts);
}

/**
 * The join bench. Signature and behaviour match `JoinBench` in joinbench.js;
 * the built one is a subclass of it, so every tool is literally the same code.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function}} opts
 */
export function JoinBench(host, opts = {}) {
  return benchesAre3D()
    ? new JoinBench3D(host, deployed(opts))
    : new JoinBench2D(host, opts);
}

/**
 * The light bench. Signature and behaviour match `LightBench` in lightbench.js;
 * the built one is a subclass of it through `plateBench3D`.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function, onSetting?: Function,
 *          onBrightness?: Function}} opts
 */
export function LightBench(host, opts = {}) {
  return benchesAre3D()
    ? new LightBench3D(host, deployed(opts))
    : new LightBench2D(host, opts);
}

/**
 * The cloud plate. Signature and behaviour match `CloudPlate` in cloudplate.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function, onSetting?: Function}} opts
 */
export function CloudPlate(host, opts = {}) {
  return benchesAre3D()
    ? new CloudPlate3D(host, deployed(opts))
    : new CloudPlate2D(host, opts);
}

/**
 * The box rack. Signature and behaviour match `BoxRack` in boxrack.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function}} opts
 */
export function BoxRack(host, opts = {}) {
  return benchesAre3D()
    ? new BoxRack3D(host, deployed(opts))
    : new BoxRack2D(host, opts);
}

/**
 * The electron bench. Signature and behaviour match `ElectronBench` in
 * electronbench.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function}} opts
 */
export function ElectronBench(host, opts = {}) {
  return benchesAre3D()
    ? new ElectronBench3D(host, deployed(opts))
    : new ElectronBench2D(host, opts);
}

/**
 * The bond bench. Signature and behaviour match `BondBench` in bondbench.js; the
 * built one is a subclass of it through `plateBench3D`.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function, onSetting?: Function}} opts
 */
export function BondBench(host, opts = {}) {
  return benchesAre3D()
    ? new BondBench3D(host, deployed(opts))
    : new BondBench2D(host, opts);
}

/**
 * The pair board. Signature and behaviour match `PairBoard` in pairboard.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function}} opts
 */
export function PairBoard(host, opts = {}) {
  return benchesAre3D()
    ? new PairBoard3D(host, deployed(opts))
    : new PairBoard2D(host, opts);
}

/**
 * The domain rig. Signature and behaviour match `DomainRig` in domainrig.js.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function}} opts
 */
export function DomainRig(host, opts = {}) {
  return benchesAre3D()
    ? new DomainRig3D(host, deployed(opts))
    : new DomainRig2D(host, opts);
}

/**
 * The gas rig. Signature and behaviour match `GasRig` in gasrig.js; the built one
 * is a subclass of it through `plateBench3D`.
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function, onVolume?: Function,
 *          onTemp?: Function, onTime?: Function}} opts
 */
export function GasRig(host, opts = {}) {
  return benchesAre3D()
    ? new GasRig3D(host, deployed(opts))
    : new GasRig2D(host, opts);
}

/**
 * The calorimeter and thermodynamic bench (Ember Reach).
 * @param {HTMLElement} host
 * @param {{onProbe?: Function, onSelect?: Function, onDial?: Function, onCardAct?: Function}} opts
 */
export function Calorimeter(host, opts = {}) {
  return benchesAre3D()
    ? new Calorimeter3D(host, deployed(opts))
    : new Calorimeter2D(host, opts);
}

/**
 * The tabletop: pieces, trays, a rail, slots, containers and fixtures on the
 * bench, graded on what is on the table (`table/`, plan `bench-tabletop.md`).
 * At T4 it is BUILT (`table3d.js`, a `BenchViewer3D` that leans the camera in over
 * the plate); at T3 and below it is the drawn top-down tabletop (`table2d.js`).
 * They draw the same `TableState`, share the gestures (`table/gestures.js`) and
 * send the same reducer actions, so a stage grades identically on both.
 *
 * A quest that plays a table stage at T4 must be listed in `BUILT_BENCHES`, so
 * the host screen keeps the player on their feet at the bench.
 * @param {HTMLElement} host
 * @param {{onAction?: (action: object) => void, tools?: string[], toolHost?: HTMLElement,
 *          onLeanChange?: (leaning: boolean) => void, onCarry?: (label: string|null) => void,
 *          room?: string}} opts `room` names the room (`rooms.js`) a quest with no world under it stands its table in
 */
export function Tabletop(host, opts = {}) {
  return benchesAre3D()
    ? new Table3D(host, deployed(opts))
    : new Table2D(host, opts);
}

/* Exported so a caller that wants the built instrument by name can have it. */
export { Table2D, Table3D };
export { SampleScope3D, CoreBench3D, CatalogueBoard3D, AssayFloor3D, JoinBench3D, LightBench3D, CloudPlate3D, BoxRack3D, ElectronBench3D, BondBench3D, PairBoard3D, DomainRig3D, GasRig3D, Calorimeter3D };

/* Re-exported so a quest module needs exactly one import line for its bench. */
export { detailFor, TINTS } from './scope.js';
export { FIELDS } from './corebench.js';
