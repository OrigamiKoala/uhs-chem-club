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
