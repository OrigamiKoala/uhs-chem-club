/**
 * world-shape-checks.mjs — Is this walkable world a place of its own? The measurements a world's verify
 * script holds its site to (`docs/plans/world-distinction-plan.md` section 3).
 *
 * `tools/world-shape.mjs` prints these for every world as a reading aid; a rebuilt world's own
 * `verify-<world>.mjs` calls them as checks against the numbers its site spec declares.
 *
 *   benchGround     the ground under every bench's approach mark, and its span
 *   housing         per bench, at the mark, at eye height: a roof within 14 m overhead, and how many of
 *                   eight compass directions meet a body within 12 m. `R4` or better is housed
 *   sharedLayout    the other worlds whose benches stand on the same coordinates (a cloned layout)
 *   oneCircle       true when every bench stands on one circle (the ring template)
 *   twoColumns      true when the benches stand in two straight lines, or one (the road template)
 *   platesInView    the benches whose plate can be seen from a point (the spawn)
 *   flood           the ground a player can reach from the spawn, against the real colliders
 *   lowBodies       reachable cells with a body less than 2.4 m over them (a second floor, or a beam
 *                   to walk into), outside the doorways a world declares
 *
 * Every function takes the BUILT world (`new World(null)`) and `THREE`; none changes it.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const xz = p => [p[0], p[p.length - 1]];
const EYE = 1.6;

/** Every drawn mesh that is not the sky. Cached on the world for one script's run. */
export function bodiesOf(world) {
  if (world.__shapeBodies) return world.__shapeBodies;
  world.scene.updateMatrixWorld(true);
  const bodies = [];
  world.scene.traverse(o => {
    if (o.isMesh && o.geometry?.attributes?.position && o !== world.sky && !/sky|dome|cloud|haze|shaft/i.test(o.name || '')) bodies.push(o);
  });
  world.__shapeBodies = bodies;
  return bodies;
}

/** Where the player stands to use each bench. */
export const marksOf = world => world.data.sites.map(s => xz(s.approachPos || s.pos));

export function benchGround(world) {
  const heights = marksOf(world).map(([x, z]) => world.getTerrainHeight(x, z));
  const lo = Math.min(...heights), hi = Math.max(...heights);
  return { heights, lo, hi, span: hi - lo };
}

/** `[{ id, roof, closed, code, housed }]`, the reading `world-shape.mjs` prints. */
export function housing(world, THREE) {
  const bodies = bodiesOf(world);
  const ray = new THREE.Raycaster();
  return world.data.sites.map((s, i) => {
    const [x, z] = marksOf(world)[i];
    const eye = new THREE.Vector3(x, world.getTerrainHeight(x, z) + EYE, z);
    ray.far = 14;
    ray.set(eye, new THREE.Vector3(0, 1, 0));
    const roof = ray.intersectObjects(bodies, false).length > 0;
    ray.far = 12;
    let closed = 0;
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      ray.set(eye, new THREE.Vector3(Math.sin(a), 0, Math.cos(a)));
      if (ray.intersectObjects(bodies, false).length) closed++;
    }
    return { id: s.id, roof, closed, code: (roof ? 'R' : '-') + closed, housed: roof && closed >= 4 };
  });
}

/** A world's bench coordinates as one comparable string. */
export const layoutKey = data => data.sites.map(s => xz(s.pos).map(Math.round).join(',')).sort().join(' ');

/** The ids of the OTHER worlds in `src/three/world-data/` whose benches stand on the same coordinates. */
export function sharedLayout(data) {
  const dir = join(here, '../../src/three/world-data');
  const mine = layoutKey(data);
  const same = [];
  for (const f of readdirSync(dir).filter(n => n.endsWith('.json'))) {
    let other;
    try { other = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
    if (!other?.sites?.length || other.id === data.id) continue;
    if (layoutKey(other) === mine) same.push(other.id || f);
    // A bench on the very spot another world's bench stands on is the template showing through.
    else {
      const theirs = new Set(other.sites.map(s => xz(s.pos).map(Math.round).join(',')));
      const hits = data.sites.filter(s => theirs.has(xz(s.pos).map(Math.round).join(',')));
      if (hits.length >= Math.ceil(data.sites.length / 2)) same.push(`${other.id || f} (${hits.length} benches)`);
    }
  }
  return same;
}

/** True when every bench is within `tol` m of one circle about their centroid (and there are enough to tell). */
export function oneCircle(data, tol = 3) {
  const P = data.sites.map(s => xz(s.pos));
  if (P.length < 4) return false;
  const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cz = P.reduce((a, p) => a + p[1], 0) / P.length;
  const r = P.map(p => Math.hypot(p[0] - cx, p[1] - cz));
  return Math.max(...r) - Math.min(...r) <= tol * 2;
}

/** How many separate values a list holds, values within `tol` of each other counting as one. */
function clusters(values, tol) {
  const v = [...values].sort((a, b) => a - b);
  let n = v.length ? 1 : 0;
  for (let i = 1; i < v.length; i++) if (v[i] - v[i - 1] > tol) n++;
  return n;
}

/** True when the benches stand on at most two lines of constant x, or of constant z. */
export function twoColumns(data, tol = 3) {
  const P = data.sites.map(s => xz(s.pos));
  if (P.length < 4) return false;
  return clusters(P.map(p => p[0]), tol) <= 2 || clusters(P.map(p => p[1]), tol) <= 2;
}

/**
 * The benches whose plate can be seen from `eye` ([x, y, z]): a sight line to the middle or either end
 * of the plate that meets nothing on the way.
 */
export function platesInView(world, THREE, eye) {
  const bodies = bodiesOf(world);
  const from = new THREE.Vector3(...eye);
  const ray = new THREE.Raycaster();
  const seen = [];
  for (const site of world.data.sites) {
    const a = world.benchAnchor(site.questId);
    if (!a) continue;
    const cos = Math.cos(a.rotationY), sin = Math.sin(a.rotationY);
    let open = false;
    for (const lx of [-2, 0, 2]) {
      const to = new THREE.Vector3(a.position[0] + lx * cos, a.topY + 0.25, a.position[2] - lx * sin);
      const d = from.distanceTo(to);
      ray.set(from, to.clone().sub(from).normalize());
      ray.far = d - 0.6;
      if (!ray.intersectObjects(bodies, false).length) { open = true; break; }
    }
    if (open) seen.push(site.id);
  }
  return seen;
}

/**
 * Flood the ground from the spawn against the world's real colliders (discs `{ x, z, radius }` and boxes
 * `{ minX, maxX, minZ, maxZ }`), with the player's own radius.
 * @returns {{ reached: number, ledges: string[], reachable: (x, z, within) => boolean, cells: number[][], blocked: (x, z) => boolean }}
 */
export function flood(world, { bound = 100, cell = 0.5, radius = 0.25, step = 0.6, spawn = null } = {}) {
  const MIN = -bound, N = Math.round(bound * 2 / cell), BUCK = 4;
  const discs = new Map(), boxes = [];
  const bkey = (i, j) => i * 4096 + j;
  for (const c of world.colliders) {
    if (c.radius === undefined) { boxes.push(c); continue; }
    for (let i = Math.floor((c.x - c.radius - radius) / BUCK); i <= Math.floor((c.x + c.radius + radius) / BUCK); i++) {
      for (let j = Math.floor((c.z - c.radius - radius) / BUCK); j <= Math.floor((c.z + c.radius + radius) / BUCK); j++) {
        if (!discs.has(bkey(i, j))) discs.set(bkey(i, j), []);
        discs.get(bkey(i, j)).push(c);
      }
    }
  }
  const boxGrid = new Map();
  for (const b of boxes) {
    for (let i = Math.floor((b.minX - radius) / BUCK); i <= Math.floor((b.maxX + radius) / BUCK); i++) {
      for (let j = Math.floor((b.minZ - radius) / BUCK); j <= Math.floor((b.maxZ + radius) / BUCK); j++) {
        if (!boxGrid.has(bkey(i, j))) boxGrid.set(bkey(i, j), []);
        boxGrid.get(bkey(i, j)).push(b);
      }
    }
  }
  const blocked = (x, z) => {
    const k = bkey(Math.floor(x / BUCK), Math.floor(z / BUCK));
    if ((discs.get(k) || []).some(c => Math.hypot(x - c.x, z - c.z) < c.radius + radius)) return true;
    return (boxGrid.get(k) || []).some(b => x > b.minX - radius && x < b.maxX + radius && z > b.minZ - radius && z < b.maxZ + radius);
  };
  const idx = (i, j) => i * N + j;
  const at = i => MIN + (i + 0.5) * cell;
  const seen = new Uint8Array(N * N);
  const sp = spawn || (Array.isArray(world.data.spawn) ? world.data.spawn : world.data.spawn.pos);
  const si = Math.floor((sp[0] - MIN) / cell), sj = Math.floor((sp[sp.length - 1] - MIN) / cell);
  const queue = [[si, sj]];
  seen[idx(si, sj)] = 1;
  const ledges = [];
  const cells = [];
  while (queue.length) {
    const [i, j] = queue.pop();
    const x = at(i), z = at(j), h = world.getTerrainHeight(x, z);
    cells.push([x, z, h]);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj;
      if (ni < 0 || nj < 0 || ni >= N || nj >= N || seen[idx(ni, nj)]) continue;
      const nx = at(ni), nz = at(nj);
      if (blocked(nx, nz)) continue;
      const nh = world.getTerrainHeight(nx, nz);
      if (Math.abs(nh - h) > step && ledges.length < 8) ledges.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) ${h.toFixed(2)}u -> (${nx.toFixed(1)}, ${nz.toFixed(1)}) ${nh.toFixed(2)}u`);
      seen[idx(ni, nj)] = 1;
      queue.push([ni, nj]);
    }
  }
  const reachable = (px, pz, within) => {
    const r = Math.ceil(within / cell);
    const ci = Math.floor((px - MIN) / cell), cj = Math.floor((pz - MIN) / cell);
    for (let i = Math.max(0, ci - r); i <= Math.min(N - 1, ci + r); i++) {
      for (let j = Math.max(0, cj - r); j <= Math.min(N - 1, cj + r); j++) {
        if (seen[idx(i, j)] && Math.hypot(at(i) - px, at(j) - pz) <= within) return true;
      }
    }
    return false;
  };
  return { reached: cells.length, ledges, reachable, cells, blocked };
}

/**
 * SINGLE FLOOR. The reachable cells (sampled every `every`-th) that have a body between `from` and `clear`
 * metres above the ground: a deck to walk under, a beam at head height, a second floor. `allow(x, z)` names
 * the places a world declares (a doorway's header is higher than `clear` anyway; a pipe bridge is not).
 * @returns {string[]} the first few offenders
 */
export function lowBodies(world, THREE, cells, { from = 0.35, clear = 2.4, every = 5, allow = null, skip = null } = {}) {
  const bodies = bodiesOf(world).filter(o => !(skip && skip(o)));
  const ray = new THREE.Raycaster();
  const up = new THREE.Vector3(0, 1, 0);
  const bad = [];
  for (let k = 0; k < cells.length; k += every) {
    const [x, z, h] = cells[k];
    if (allow && allow(x, z)) continue;
    ray.set(new THREE.Vector3(x, h + from, z), up);
    ray.far = clear - from;
    const hit = ray.intersectObjects(bodies, false)[0];
    if (hit) {
      let top = hit.object;
      while (top.parent && top.parent !== world.scene) top = top.parent;
      bad.push(`(${x.toFixed(1)}, ${z.toFixed(1)}): ${top.name || top.type} is ${(from + hit.distance).toFixed(2)} m over the floor`);
      if (bad.length >= 8) break;
    }
  }
  return bad;
}
