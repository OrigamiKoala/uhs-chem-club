/**
 * reach.mjs — Can you actually walk there?
 *
 * THE RULE. A room you cannot walk into is worse than no room. The ship is
 * now a set of compartments joined by openings, and an opening is only an
 * opening if the colliders around it leave a gap wide enough for a body. A
 * wall drawn with a hole in it but collided as one slab looks perfect and is
 * a sealed box; so is a doorway a locker has been pushed in front of.
 *
 * HOW IT IS MEASURED. The deck is sampled on a grid and each cell is tested
 * exactly the way `FpsControls.testBoxCollision` tests it — the player's
 * square of side 2r against every AABB — then flood-filled four-ways from the
 * spawn. What comes back is the set of deck a player can actually stand on,
 * having started where the game starts them. Nothing is assumed about which
 * gaps are doors.
 *
 * It is a CONSERVATIVE answer: the grid ignores sliding along a wall and
 * diagonal squeezes, so anything it says is reachable really is.
 */

/** Exactly `FpsControls.testBoxCollision`. */
export function isFree(colliders, x, z, r = 0.25) {
  for (const b of colliders) {
    if (x + r > b.minX && x - r < b.maxX && z + r > b.minZ && z - r < b.maxZ) {
      return false;
    }
  }
  return true;
}

/**
 * @param {Array} colliders AABBs { minX, maxX, minZ, maxZ }
 * @param {{minX,maxX,minZ,maxZ}} bounds the walkable clamp box
 * @param {[number, number]} spawn where the player starts, [x, z]
 * @param {{step?: number, radius?: number}} opts
 */
export function floodFill(colliders, bounds, spawn, { step = 0.15, radius = 0.25 } = {}) {
  const x0 = bounds.minX + radius;
  const x1 = bounds.maxX - radius;
  const z0 = bounds.minZ + radius;
  const z1 = bounds.maxZ - radius;
  const nx = Math.max(1, Math.ceil((x1 - x0) / step) + 1);
  const nz = Math.max(1, Math.ceil((z1 - z0) / step) + 1);

  const at = (i, j) => [x0 + i * step, z0 + j * step];
  const idx = (i, j) => j * nx + i;

  const free = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const [x, z] = at(i, j);
      if (x > x1 + 1e-9 || z > z1 + 1e-9) continue;
      free[idx(i, j)] = isFree(colliders, x, z, radius) ? 1 : 0;
    }
  }

  const seen = new Uint8Array(nx * nz);
  const si = Math.round((spawn[0] - x0) / step);
  const sj = Math.round((spawn[1] - z0) / step);
  const start = idx(si, sj);
  const ok = si >= 0 && si < nx && sj >= 0 && sj < nz && free[start] === 1;

  if (ok) {
    const queue = [start];
    seen[start] = 1;
    while (queue.length) {
      const cur = queue.pop();
      const i = cur % nx, j = (cur - i) / nx;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || ni >= nx || nj < 0 || nj >= nz) continue;
        const k = idx(ni, nj);
        if (seen[k] || !free[k]) continue;
        seen[k] = 1;
        queue.push(k);
      }
    }
  }

  let cells = 0;
  for (let k = 0; k < seen.length; k++) cells += seen[k];

  return {
    spawnFree: ok,
    cells,
    step,
    radius,
    /** Is this point free standing, and joined to the spawn by open deck? */
    reachable(x, z) {
      if (!isFree(colliders, x, z, radius)) return false;
      const i = (x - x0) / step;
      const j = (z - z0) / step;
      for (const ii of [Math.floor(i), Math.ceil(i)]) {
        for (const jj of [Math.floor(j), Math.ceil(j)]) {
          if (ii < 0 || ii >= nx || jj < 0 || jj >= nz) continue;
          if (seen[idx(ii, jj)]) return true;
        }
      }
      return false;
    },
    /** Why a point failed, for a message worth reading. */
    explain(x, z) {
      if (!isFree(colliders, x, z, radius)) {
        const hit = colliders.find(b =>
          x + radius > b.minX && x - radius < b.maxX &&
          z + radius > b.minZ && z - radius < b.maxZ);
        return `stands inside a collider x[${hit.minX.toFixed(2)},${hit.maxX.toFixed(2)}] z[${hit.minZ.toFixed(2)},${hit.maxZ.toFixed(2)}]`;
      }
      return 'clear standing, but sealed off from the spawn';
    }
  };
}
