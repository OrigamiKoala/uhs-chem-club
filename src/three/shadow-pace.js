/**
 * shadow-pace.js — a sun that never moves re-draws its shadow only when it must.
 *
 * Both walkable desert worlds keep one 2048 shadow map in a box that follows
 * the player, snapped to whole texels. Re-drawing every caster into it every
 * frame is paid for even while the player stands still and looks about, which
 * is most of the time spent at a pylon or a bench.
 */

/**
 * THE SUN DOES NOT MOVE, SO ITS SHADOWS ONLY CHANGE WHEN SOMETHING DOES.
 * Called once a frame by the world: the map is re-drawn when the shadow box
 * has moved (the player walked) or when the world says something that casts
 * is moving (`live`); otherwise it is re-drawn one frame in `every`, which
 * keeps a turning windsock or a player's own swinging view honest at a
 * fraction of the cost. A scene rendered WITHOUT this having run first — the
 * voyage draws the world from outside — always gets a fresh map, because the
 * flag is put back after every render (`holdShadowUntilAsked`).
 */
export function paceShadow(sun, moved, { live = false, every = 3 } = {}) {
  if (!sun.castShadow) return;
  sun.userData.shadowTick = ((sun.userData.shadowTick || 0) + 1) % every;
  sun.shadow.autoUpdate = moved || live || !sun.shadow.map || sun.userData.shadowTick === 0;
}

/** Re-arm the shadow after each render of `scene`, so pacing only lasts one frame. */
export function holdShadowUntilAsked(scene, sun) {
  const prev = scene.onAfterRender;
  scene.onAfterRender = function (...args) {
    prev?.apply(this, args);
    sun.shadow.autoUpdate = true;
  };
}

/* --------------------------------------------------------------------------
   AN OPEN BENCH ONLY NEEDS A FRESH SHADOW WHILE SOMETHING ON IT MOVES.

   A deployed instrument used to hold the sun's map live for as long as it was
   open, which re-drew every caster in the world sixty times a second while the
   player read a prompt. What a bench adds to a world is everything in the scene
   the world did not put there itself: the instrument, the panel hardware, a
   boss. Those are fingerprinted once a frame (the pose of every node with a
   visible shadow caster under it, and the caster's geometry), and the map is
   held live only while the fingerprint is changing and for a moment after.
   -------------------------------------------------------------------------- */

/** Call once the world is built: everything in the scene now is the world's own. */
export function markWorldOwn(scene) {
  scene.userData.worldOwn = new WeakSet(scene.children);
}

let _h = 0;
let _n = 0;

function fingerprint(o) {
  if (!o.visible) return false;
  let has = false;
  const kids = o.children;
  for (let i = 0; i < kids.length; i++) if (fingerprint(kids[i])) has = true;
  if (o.castShadow && (o.isMesh || o.isLine || o.isPoints) && o.geometry) {
    has = true;
    const g = o.geometry;
    const pos = g.attributes.position;
    _h += g.id * 0.618 + (pos ? pos.version * 0.37 : 0) + (g.drawRange.count === Infinity ? 0 : g.drawRange.count * 0.11);
    if (o.isInstancedMesh) _h += o.count * 1.37 + o.instanceMatrix.version * 0.71;
  }
  if (!has) return false;
  const k = ++_n;
  if (o.matrixAutoUpdate) {
    const p = o.position, q = o.quaternion, s = o.scale;
    _h += k * (p.x * 1.13 + p.y * 2.29 + p.z * 3.71 + q.x * 5.03 + q.y * 7.19 + q.z * 11.3 + q.w * 13.7 + s.x * 17.9 + s.y * 19.1 + s.z * 23.3);
  } else {
    const e = o.matrix.elements;
    for (let i = 0; i < 16; i++) _h += k * (i + 1.5) * e[i];
  }
  return true;
}

/**
 * True while anything a bench brought into `scene` that casts a shadow is
 * moving, appearing or leaving, and for `hold` seconds after it stops. A scene
 * never marked with `markWorldOwn` always answers true.
 */
export function visitorsMoving(scene, delta, hold = 0.3) {
  const own = scene.userData.worldOwn;
  if (!own) return true;
  _h = 0;
  _n = 0;
  const kids = scene.children;
  for (let i = 0; i < kids.length; i++) {
    const o = kids[i];
    if (own.has(o) || o.isCamera) continue;
    fingerprint(o);
  }
  const pace = scene.userData.visitorPace || (scene.userData.visitorPace = { h: NaN, rest: 0 });
  if (_h !== pace.h) {
    pace.h = _h;
    pace.rest = 0;
    return true;
  }
  pace.rest += delta > 0 ? delta : 0;
  return pace.rest < hold;
}
