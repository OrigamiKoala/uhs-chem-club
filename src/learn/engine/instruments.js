/**
 * instruments.js — Which bench a Learn quest gets, by tier.
 *
 * A quest module asks for `SampleScope` or `CoreBench` and never finds out which
 * one it received. At T4 the player is standing on Tallow in first person, and an
 * instrument whose parts are real positions in space is built there — that is the
 * core bench, `corebench3d.js`. An instrument that is a picture of something too
 * small to stand next to stays a screen on every tier — that is the sampler
 * scope, `scope.js`. At T3 and below both are the canvas instruments.
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

/** True when this client is drawing the Learn benches in three dimensions. */
export function benchesAre3D() {
  return tierAtLeast('T4');
}

/**
 * Which quests are played on a bench that is BUILT rather than drawn.
 *
 * Not every instrument wants to be an object. The sampler scope is a
 * microscope: what it shows is a picture of a sample at a magnification, and
 * the whole lesson is that the picture gets finer as the power comes up. Built
 * in three dimensions that reads as the sample inflating — pieces swelling to
 * the size of your head — which is not what a scope does and not what matter
 * does, and a student who notices that is right. So the scope stays a screen on
 * every tier, and `q1-grain` is worked as a panel over the world the player
 * walked across to reach it.
 *
 * The core bench is the other case: it is a rig with a specimen mounted in it,
 * a beam fired through it and rings standing off it at fixed radii. Those are
 * real positions in space, so at T4 it is a real object.
 */
const BUILT_BENCHES = new Set(['q2-core']);

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
  // Always the drawn instrument — see BUILT_BENCHES above for why a microscope
  // is a screen on every tier. `SampleScope3D` is kept, built and exported for
  // the day a sample is something you can sensibly walk around.
  return new SampleScope2D(host, opts);
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

/* The built sampler scope, kept whole and reachable even though nothing asks
   for it today (see BUILT_BENCHES). */
export { SampleScope3D };

/* Re-exported so a quest module needs exactly one import line for its bench. */
export { detailFor, TINTS } from './scope.js';
export { FIELDS } from './corebench.js';
