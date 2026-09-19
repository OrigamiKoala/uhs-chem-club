/**
 * bench-host.js — How a 3D Learn bench gets drawn, without knowing who draws it.
 *
 * The 3D benches need somewhere to render. The obvious way to arrange that is to
 * import the stage, but the stage pulls in three.js, the ship, both worlds and
 * their JSON — and the Learn quest modules are imported by `npm run verify:learn`
 * in plain Node, where that whole graph is neither loadable nor wanted.
 *
 * So the dependency is inverted. The benches ask this module for a host; the
 * browser registers one at boot. In Node nothing registers, the host stays null,
 * and a bench that is never constructed there never asks.
 */

/** @type {{mount: Function, unmount: Function} | null} */
let host = null;

/**
 * Register who renders the 3D benches. Called once, from the browser entry point.
 * @param {{mount: (viewer: object) => void, unmount: (viewer: object) => void}} h
 */
export function setBenchHost(h) {
  host = h && typeof h.mount === 'function' ? h : null;
}

/** The registered host, or a pair of no-ops when there is none. */
export function benchHost() {
  return host || { mount() {}, unmount() {} };
}
