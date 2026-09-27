/**
 * tools/verify-voyage.mjs — The Avalon can land, and a player can get off it.
 *
 * At T4 a world is reached by flying the Avalon to it (`three/voyage.js`): it
 * lands on the world that is already built and the player walks out of the
 * airlock and down a ramp onto the ground. Three things have to be true of the
 * REAL ship and the REAL worlds for that to work, and none of them can be seen
 * by reading the code:
 *
 *   1. THE HATCH IS A HOLE. With the outer leaf swung open, a line through the
 *      middle of the hatch at head, chest and knee height meets nothing aboard
 *      — no plating, no lining, no backing sheet (one of those stood in the
 *      opening on the first build and the walk-out went face-first into it).
 *      With the leaf shut, the same line stops on the leaf.
 *   2. THE SHIP LANDS CLEAR. On every world it can fly to, `solveLanding`
 *      finds a spot whose hull and ramp boxes meet no collider the walk uses,
 *      whose ramp foot is standable open ground inside the walk bounds, and
 *      whose hatch sill is no more than a ramp's reach above that ground.
 *   3. THE CHEVRON ABOARD FOLLOWS THE DECK. Every leg of the route that leads
 *      from the pilot's place to the hatch stays out of every structural
 *      collider except where it passes a doorway (a door's leaves are what the
 *      player walks through, and they open for them).
 */

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const THREE = await import('three');
const { ShipInterior } = await import('../src/three/ship.js');
const { AIRLOCK_HATCH, HULL, SHIP_BOUNDS } = await import('../src/three/ship-rooms.js');
const X = await import('../src/three/ship-exterior.js');
const { AIRLOCK_ROUTE } = await import('../src/three/voyage.js');
const { TallowWorld } = await import('../src/three/tallow.js');
const { LigarWorld } = await import('../src/three/ligar.js');
const { WorldScene } = await import('../src/three/world.js');

let failed = false;
function check(cond, msg, detail = '') {
  if (cond) console.log(`  ok   ${msg}`);
  else { console.error(`  fail ${msg}${detail ? ` — ${detail}` : ''}`); failed = true; }
}

/* ------------------------------------------------------------- 1. the hatch */
console.log('The airlock hatch\n');
const scene = new THREE.Scene();
const ship = new ShipInterior(scene);
const rayThroughHatch = (y) => {
  scene.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(new THREE.Vector3(3.9, y, AIRLOCK_HATCH.z), new THREE.Vector3(1, 0, 0), 0, 12);
  return rc.intersectObjects(scene.children, true).filter(h => h.object.isMesh && h.object.visible);
};
const heights = [AIRLOCK_HATCH.y - 0.6, AIRLOCK_HATCH.y, AIRLOCK_HATCH.y + 0.6];
ship.setAirlockOpen(1);
for (const y of heights) {
  const hits = rayThroughHatch(y);
  check(hits.length === 0, `open hatch is clear at y ${y.toFixed(2)}`,
    hits.length ? `meets a ${hits[0].object.parent?.name || 'mesh'} at x ${hits[0].point.x.toFixed(2)}` : '');
}
ship.setAirlockOpen(0);
{
  const hits = rayThroughHatch(AIRLOCK_HATCH.y);
  const leaf = hits[0] && (() => { let n = hits[0].object; while (n) { if (n.name === 'airlock-leaf') return true; n = n.parent; } return false; })();
  check(Boolean(leaf), 'shut hatch is sealed by its leaf');
}

/* --------------------------------------------------------- 2. the landings */
console.log('\nLanding on every world\n');
const inside = (b, p, r = 0) => p.x > b.minX - r && p.x < b.maxX + r && p.z > b.minZ - r && p.z < b.maxZ + r;
const boxMeets = (a, c) => {
  if (c.radius !== undefined) {
    const cx = Math.max(a.minX, Math.min(c.x, a.maxX)), cz = Math.max(a.minZ, Math.min(c.z, a.maxZ));
    return Math.hypot(cx - c.x, cz - c.z) < c.radius;
  }
  return c.minX !== undefined && a.minX < c.maxX && a.maxX > c.minX && a.minZ < c.maxZ && a.maxZ > c.minZ;
};
for (const [name, W, bound] of [['Tallow', TallowWorld, 100], ['Ligar', LigarWorld, 100], ['Erebus', WorldScene, 85]]) {
  const world = new W(null);
  const L = X.solveLanding(world, X.landingPrefsFor(world));
  const boxes = X.shipWorldColliders(L);
  const clashes = [];
  for (const b of boxes) for (const c of world.colliders) if (boxMeets(b, c)) clashes.push(c);
  check(clashes.length === 0, `${name}: the hull and ramp stand clear of every collider`,
    clashes.length ? `${clashes.length} collider(s), first ${JSON.stringify(clashes[0])}` : '');
  const foot = X.localToWorld(L, X.RAMP_FOOT.x, 0, X.RAMP_FOOT.z);
  const footFree = !world.colliders.some(c => c.radius !== undefined
    ? Math.hypot(foot.x - c.x, foot.z - c.z) < c.radius + 0.25
    : inside(c, foot, 0.25));
  check(footFree && !boxes.some(b => inside(b, foot, 0.25)), `${name}: the ramp's foot is open ground`);
  check(Math.abs(foot.x) < bound - 1 && Math.abs(foot.z) < bound - 1, `${name}: the ramp's foot is inside the walk`);
  const sill = L.deckY + X.HATCH_SILL.y;
  const drop = sill - world.getTerrainHeight(foot.x, foot.z);
  check(drop > 0 && drop < 4.3, `${name}: the sill is a ramp's reach above the ground (${drop.toFixed(2)} m)`);
  check(Math.abs(Math.round(L.yaw / (Math.PI / 2)) * (Math.PI / 2) - L.yaw) < 1e-9, `${name}: heading on the quarter turn (colliders are exact)`);
}

/* ------------------------------------------------------ 3. the route aboard */
console.log('\nThe route to the airlock\n');
{
  const cols = ship.colliders;   // structure and furniture; doors are not in here
  let worst = null;
  for (let i = 0; i < AIRLOCK_ROUTE.length - 1; i++) {
    const [ax, az] = AIRLOCK_ROUTE[i], [bx, bz] = AIRLOCK_ROUTE[i + 1];
    const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.1);
    for (let k = 0; k <= n; k++) {
      const p = { x: ax + (bx - ax) * (k / n), z: az + (bz - az) * (k / n) };
      if (p.x < SHIP_BOUNDS.minX || p.x > SHIP_BOUNDS.maxX || p.z < SHIP_BOUNDS.minZ || p.z > SHIP_BOUNDS.maxZ) worst = worst || p;
      if (cols.some(c => inside(c, p))) worst = worst || p;
    }
  }
  check(!worst, 'every leg of the route stays on open deck', worst ? `blocked at (${worst.x.toFixed(2)}, ${worst.z.toFixed(2)})` : '');
  const end = AIRLOCK_ROUTE[AIRLOCK_ROUTE.length - 1];
  check(Math.abs(end[1] - AIRLOCK_HATCH.z) < 0.01 && end[0] > HULL.maxX - 2, 'the route ends square to the hatch');
}

console.log(failed ? '\nVOYAGE FAILED' : '\nVOYAGE OK');
process.exit(failed ? 1 : 0);
