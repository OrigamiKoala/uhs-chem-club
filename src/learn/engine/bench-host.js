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

/* ------------------------------------------------------------ live viewer

   THE KEYS ON THE BENCH FIND THE BENCH THROUGH HERE. A quest's tool keys are
   DOM buttons in the frame's `.lq-controls`, and at T4 they are mirrored onto
   the instrument as real keys (`bench-keys.js`). The frame is built before the
   instrument, and neither knows about the other, so the viewer announces
   itself here when it is constructed and withdraws when it is disposed. Still
   no three.js: this module only holds a reference. */

/** Live viewers, oldest first. The last one is the one being worked. */
const liveViewers = [];
const viewerListeners = new Set();

/** Called by `BenchViewer3D`'s constructor. */
export function registerBenchViewer(v) {
  if (!v) return;
  const at = liveViewers.indexOf(v);
  if (at >= 0) liveViewers.splice(at, 1);
  liveViewers.push(v);
  for (const cb of [...viewerListeners]) {
    try { cb(v); } catch (err) { console.error('Bench viewer listener failed:', err); }
  }
}

/** Called by `BenchViewer3D.dispose()`. */
export function unregisterBenchViewer(v) {
  const at = liveViewers.indexOf(v);
  if (at >= 0) liveViewers.splice(at, 1);
  for (const cb of [...viewerListeners]) {
    try { cb(activeBenchViewer()); } catch (err) { console.error('Bench viewer listener failed:', err); }
  }
}

/** The most recently registered viewer that has not been disposed, or null. */
export function activeBenchViewer() {
  for (let i = liveViewers.length - 1; i >= 0; i--) {
    if (!liveViewers[i].disposed) return liveViewers[i];
  }
  return null;
}

/**
 * Hear about a viewer coming up (and, with `null` or the survivor, one going
 * away). Returns the unsubscribe function.
 * @param {(viewer: object|null) => void} cb
 */
export function onBenchViewer(cb) {
  if (typeof cb !== 'function') return () => {};
  viewerListeners.add(cb);
  return () => viewerListeners.delete(cb);
}
