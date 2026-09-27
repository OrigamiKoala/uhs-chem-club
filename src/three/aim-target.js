/**
 * aim-target.js — what [E] would act on: the thing the camera is POINTED at.
 *
 * It used to be whatever the player stood nearest. On the ship that meant the
 * room they were in — standing in the storage bay with your back to the
 * manifest still offered the manifest — and wherever two things were close
 * the nearer one won, however hard you were looking at the other. Now a
 * target is the box its object occupies, and [E] acts on the first box the
 * view ray enters, within that target's reach. Standing close is still
 * required; it is just no longer enough.
 *
 * Pure: no three.js, no DOM, so a verifier can import it in plain Node.
 *
 * A box is `{ center: [x, y, z], half: [hx, hy, hz], rotY }` — an upright box
 * turned about Y the way three.js turns a group (`rotation.y = rotY`).
 * A candidate is `{ boxes: [box, ...], reach, ... }`; anything else on it
 * rides along to the caller.
 */

/** An upright box. `rotY` is the object's own `rotation.y`. */
export function aimBox(center, half, rotY = 0) {
  return { center, half, rotY };
}

/** An upright box from its extents in world axes. */
export function aimBoxFromBounds(minX, maxX, minY, maxY, minZ, maxZ) {
  return aimBox(
    [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
    [(maxX - minX) / 2, (maxY - minY) / 2, (maxZ - minZ) / 2]
  );
}

/**
 * Distance along the ray to where it enters `box` (grown by `slack` on every
 * side), or null for a miss. A ray that STARTS inside the box is a miss: a
 * player standing in an open doorway is not pointing at the doorway.
 */
export function rayEntersBox(origin, dir, box, slack = 0) {
  const c = Math.cos(box.rotY || 0);
  const s = Math.sin(box.rotY || 0);
  const ox = origin.x - box.center[0];
  const oy = origin.y - box.center[1];
  const oz = origin.z - box.center[2];
  // World -> box frame: the inverse of three's Y rotation.
  const o = [ox * c - oz * s, oy, ox * s + oz * c];
  const d = [dir.x * c - dir.z * s, dir.y, dir.x * s + dir.z * c];

  let tMin = -Infinity;
  let tMax = Infinity;
  for (let i = 0; i < 3; i++) {
    const h = box.half[i] + slack;
    if (Math.abs(d[i]) < 1e-9) {
      if (Math.abs(o[i]) > h) return null;
      continue;
    }
    let t1 = (-h - o[i]) / d[i];
    let t2 = (h - o[i]) / d[i];
    if (t1 > t2) [t1, t2] = [t2, t1];
    if (t1 > tMin) tMin = t1;
    if (t2 < tMax) tMax = t2;
    if (tMin > tMax) return null;
  }
  if (tMax < 0 || tMin < 0) return null;
  return tMin;
}

/**
 * The candidate the view ray reaches first, or null.
 *
 * `blockers` are boxes that stop the ray (a bulkhead between the player and
 * the terminal on the far side of it). `slack` forgives a ray that grazes an
 * edge, because a fingertip on a look stick is not a crosshair.
 */
export function pickAimTarget(origin, dir, candidates, { blockers = [], slack = 0.12 } = {}) {
  let best = null;
  let bestT = Infinity;
  for (const cand of candidates) {
    for (const box of cand.boxes || []) {
      const t = rayEntersBox(origin, dir, box, slack);
      if (t === null || t > cand.reach || t >= bestT) continue;
      best = cand;
      bestT = t;
    }
  }
  if (!best) return null;
  for (const b of blockers) {
    const t = rayEntersBox(origin, dir, b, 0);
    if (t !== null && t < bestT) return null;
  }
  return best;
}

/**
 * What [E] can act on in a walkable Learn world: each site's bench and the
 * landing pad (the way off). Read from the world's own data and bench
 * anchors, so a bench or a pad that moves takes its target with it — one
 * implementation for Tallow and Ligar alike. `eyeY` keeps a bench on another
 * floor out of it: Tallow's lab bench sits under part of the yard, and
 * Ligar's forge five metres below the flat.
 */
export function learnWorldAimTargets(world, eyeY) {
  if (!world._aimTargets) {
    world._aimTargets = world.data.sites.map(site => {
      const a = world.benchAnchor?.(site.questId);
      // The plate is 4.8 x 1.3 along the bench's own x; the cased instrument
      // stands about a metre above it.
      const box = a
        ? aimBox(
            [a.position[0], (a.position[1] + a.topY + 1.0) / 2, a.position[2]],
            [2.4, (a.topY + 1.0 - a.position[1]) / 2, 0.65],
            a.rotationY
          )
        : aimBox([site.pos[0], site.pos[1] + 1.2, site.pos[2]], [1.5, 1.2, 1.5]);
      const levelY = a ? a.topY + 0.65 : site.pos[1] + 1.6;
      return { kind: 'site', site, levelY, reach: 3.0, boxes: [box] };
    });
    const pad = world.data.landmarks?.find(l => l.asset === 'landing-pad');
    if (pad) {
      const y = world.getTerrainHeight(pad.pos[0], pad.pos[2]);
      world._aimTargets.push({
        kind: 'pad', reach: 9,
        boxes: [aimBox([pad.pos[0], y, pad.pos[2]], [7.4, 0.3, 7.4])]
      });
    }
  }
  return world._aimTargets.filter(t => t.kind !== 'site' || Math.abs(eyeY - t.levelY) < 2.6);
}
