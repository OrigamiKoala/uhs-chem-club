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
  'q1-grain',      // the sampler scope   — scope3d.js
  'q2-core',       // the core bench      — corebench3d.js
  'q3-catalogue',  // the catalogue board — catalogue3d.js
  'q4-ledger',     // the core bench again, at site four
  'q5-assay',      // the assay floor     — assay3d.js
  // Unit 2 — Ligar. Two of the four are instruments Tallow already built; the
  // join bench is the one new build, and it is a subclass of the drawn bench,
  // so its tools are the canvas bench's tools and cannot grade differently.
  'q1-joins',      // the join bench, pair plates — joinbench3d.js
  'q2-lattice',    // the join bench, slab plates — joinbench3d.js
  'q3-recipe',     // the sampler scope again     — scope3d.js
  'q4-weigh'       // the assay floor again       — assay3d.js
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

/* Exported so a caller that wants the built instrument by name can have it. */
export { SampleScope3D, CoreBench3D, CatalogueBoard3D, AssayFloor3D, JoinBench3D };

/* Re-exported so a quest module needs exactly one import line for its bench. */
export { detailFor, TINTS } from './scope.js';
export { FIELDS } from './corebench.js';
