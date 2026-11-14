/**
 * thornmere/shape-checks.mjs — Thornmere's copy, written before the shared `tools/lib/world-shape-checks.mjs` arrived with the Kettle rebuild (moving onto the shared one is open work): checks that a walkable world is a place of its own, for a world's verify script to call
 * (`docs/plans/world-distinction-plan.md` section 3). Each takes the built world (`scene`, `data`, `getTerrainHeight`, `colliders`) and
 * returns a plain result; the caller decides what passes. `tools/world-shape.mjs` is the reading aid that prints the same measures for
 * every world.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const xz = p => [p[0], p[p.length - 1]];

/** Every mesh that is a body (not the sky). */
export function bodiesOf(world) {
  const out = [];
  world.scene.updateMatrixWorld(true);
  world.scene.traverse(o => { if (o.isMesh && o.geometry?.attributes?.position && o !== world.sky && !/sky|dome|cloud|haze/i.test(o.name || '')) out.push(o); });
  return out;
}

/** The lowest and highest ground under the benches' approach marks. */
export function benchGroundSpan(world) {
  const g = world.data.sites.map(s => world.getTerrainHeight(...xz(s.approachPos || s.pos)));
  return { lo: Math.min(...g), hi: Math.max(...g), span: Math.max(...g) - Math.min(...g) };
}

/** Per bench: is there a roof within 14 m overhead, and how many of 8 compass directions are closed within 12 m, at eye height. */
export function housing(THREE, world) {
  const bodies = bodiesOf(world);
  const ray = new THREE.Raycaster();
  return world.data.sites.map(s => {
    const [x, z] = xz(s.approachPos || s.pos);
    const eye = new THREE.Vector3(x, world.getTerrainHeight(x, z) + 1.6, z);
    ray.far = 14; ray.set(eye, new THREE.Vector3(0, 1, 0));
    const roofHit = ray.intersectObjects(bodies, false)[0];
    ray.far = 12;
    let closed = 0;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ray.set(eye, new THREE.Vector3(Math.sin(a), 0, Math.cos(a))); if (ray.intersectObjects(bodies, false).length) closed++; }
    return { id: s.id, roof: Boolean(roofHit), headroom: roofHit ? roofHit.distance + 1.6 : Infinity, closed, housed: Boolean(roofHit) && closed >= 4 };
  });
}

/** Do the benches stand on one circle (within `tol` metres of a common radius about their centroid)? */
export function onOneCircle(world, tol = 4) {
  const P = world.data.sites.map(s => xz(s.pos));
  const cx = P.reduce((s, p) => s + p[0], 0) / P.length; const cz = P.reduce((s, p) => s + p[1], 0) / P.length;
  const r = P.map(p => Math.hypot(p[0] - cx, p[1] - cz));
  return Math.max(...r) - Math.min(...r) < tol;
}

/** Do the benches stand in two straight columns (every x within `tol` of one of two values)? */
export function inTwoColumns(world, tol = 3) {
  for (const key of [0, 1]) {
    const v = world.data.sites.map(s => xz(s.pos)[key]).sort((a, b) => a - b);
    for (let cut = 1; cut < v.length; cut++) {
      const a = v.slice(0, cut); const b = v.slice(cut);
      if (a[a.length - 1] - a[0] < tol && b[b.length - 1] - b[0] < tol) return true;
    }
    if (v[v.length - 1] - v[0] < tol) return true;
  }
  return false;
}

/** Which other worlds have a bench on the same rounded coordinates as one of this world's? */
export function clonedCoordinates(world) {
  const mine = new Set(world.data.sites.map(s => xz(s.pos).map(Math.round).join(',')));
  const dir = join(root, 'src/three/world-data');
  const out = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json') || f === `${world.data.id}.json`) continue;
    let d; try { d = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
    for (const s of d.sites || []) if (s.pos && mine.has(xz(s.pos).map(Math.round).join(','))) out.push(`${f.replace('.json', '')}:${s.id}`);
  }
  return out;
}

/** The benches whose plate can be seen from the spawn: a clear line from the eye to a point just over the middle of the plate. */
export function platesInView(THREE, world) {
  const bodies = bodiesOf(world);
  const sp = Array.isArray(world.data.spawn) ? world.data.spawn : world.data.spawn.pos;
  const eye = new THREE.Vector3(sp[0], world.getTerrainHeight(sp[0], sp[2]) + 1.6, sp[2]);
  const ray = new THREE.Raycaster();
  const seen = [];
  for (const s of world.data.sites) {
    const a = world.benchAnchor(s.questId);
    if (!a) continue;
    const target = new THREE.Vector3(a.position[0], a.topY + 0.25, a.position[2]);
    const dir = target.clone().sub(eye); const d = dir.length();
    ray.far = d - 0.4; ray.set(eye, dir.normalize());
    // The bench's own parts round the plate do not hide it.
    const hits = ray.intersectObjects(bodies, false).filter(h => h.distance < d - 3);
    if (!hits.length) seen.push(s.id);
  }
  return seen;
}

/**
 * One floor: no place a player can stand has a body over it lower than `low` metres, except where `allow(x, z)` says a doorway or a
 * machine's overhang is meant. `cells` are the reachable [x, z] points.
 */
export function lowOverhead(THREE, world, cells, { low = 2.0, allow = () => false } = {}) {
  const bodies = bodiesOf(world).filter(o => { for (let n = o; n; n = n.parent) if (n.userData?.phys === 'ground') return false; return true; });
  const ray = new THREE.Raycaster();
  ray.far = low;
  const out = [];
  for (const [x, z] of cells) {
    if (allow(x, z)) continue;
    ray.set(new THREE.Vector3(x, world.getTerrainHeight(x, z) + 0.05, z), new THREE.Vector3(0, 1, 0));
    if (ray.intersectObjects(bodies, false).length) out.push([x, z]);
  }
  return out;
}
