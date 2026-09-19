/**
 * instruments.js — Which bench a Learn quest gets, by tier.
 *
 * A quest module asks for `SampleScope` or `CoreBench` and never finds out which
 * one it received. At T4 the player is standing on Tallow in first person, so the
 * instrument is the 3D bench in `scope3d.js` / `corebench3d.js`; at T3 and below
 * it is the canvas instrument in `scope.js` / `corebench.js`, exactly as before.
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
import { SampleScope as SampleScope2D } from './scope.js';
import { CoreBench as CoreBench2D } from './corebench.js';
import { SampleScope3D } from './scope3d.js';
import { CoreBench3D } from './corebench3d.js';

/** True when this client is drawing the Learn benches in three dimensions. */
export function benchesAre3D() {
  return tierAtLeast('T4');
}

/**
 * The sampler scope. Signature and behaviour match `SampleScope` in scope.js.
 * @param {HTMLElement} host
 * @param {{kinds: object, onProbe?: Function, onSelect?: Function,
 *          mountScene?: Function, unmountScene?: Function}} opts
 */
export function SampleScope(host, opts = {}) {
  return benchesAre3D()
    ? new SampleScope3D(host, opts)
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
    ? new CoreBench3D(host, opts)
    : new CoreBench2D(host, opts);
}

/* Re-exported so a quest module needs exactly one import line for its bench. */
export { detailFor, TINTS } from './scope.js';
export { FIELDS } from './corebench.js';
