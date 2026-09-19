/**
 * bench-host.js — How a 3D Learn bench gets drawn, and where it gets deployed,
 * without knowing who draws it or what it is standing on.
 *
 * The 3D benches need somewhere to render. The obvious way to arrange that is to
 * import the stage, but the stage pulls in three.js, the ship, both worlds and
 * their JSON — and the Learn quest modules are imported by `npm run verify:learn`
 * in plain Node, where that whole graph is neither loadable nor wanted.
 *
 * So the dependency is inverted. The benches ask this module for a host; the
 * browser registers one at boot. In Node nothing registers, the host stays null,
 * and a bench that is never constructed there never asks.
 *
 * THE DEPLOYMENT FRAME is the second thing that travels this way. On a world
 * that is built as a place, the instrument is not a scene of its own — it is
 * laid on the bench that is already standing on the ground, in front of a player
 * who walked to it. The host screen says which site is being worked; the host
 * answers with that bench's physical frame; the instrument deploys onto it. A
 * quest module never learns that any of this happened.
 */

/** @type {{mount: Function, unmount: Function, deployment?: Function} | null} */
let host = null;

/** The quest whose bench is being worked, set by the host screen before mount. */
let activeQuestId = null;

/**
 * Register who renders the 3D benches. Called once, from the browser entry point.
 * @param {{
 *   mount: (viewer: object) => void,
 *   unmount: (viewer: object) => void,
 *   deployment?: (questId: string) => object | null
 * }} h
 */
export function setBenchHost(h) {
  host = h && typeof h.mount === 'function' ? h : null;
}

/** The registered host, or a pair of no-ops when there is none. */
export function benchHost() {
  return host || { mount() {}, unmount() {} };
}

/**
 * Say which quest's bench is about to be worked, or `null` on the way out.
 * Called by `screens/learn-quest.js`, which is the only place that knows.
 */
export function setBenchSite(questId) {
  activeQuestId = questId || null;
}

/**
 * The physical frame of the bench the player is standing at:
 * `{ scene, camera, position, rotationY, topY }`, or null when this quest is
 * not being played on ground the player can walk.
 */
export function benchDeployment() {
  if (!host || typeof host.deployment !== 'function' || !activeQuestId) return null;
  try {
    return host.deployment(activeQuestId) || null;
  } catch (err) {
    console.error('Bench deployment lookup failed:', err);
    return null;
  }
}
