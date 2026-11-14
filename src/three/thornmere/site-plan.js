/**
 * thornmere/site-plan.js — Thornmere's ground and rooms, as one declaration. Pure data and arithmetic, no THREE: the layout generator,
 * `ThornmereWorld`, the walk and `verify:thornmere` all stand on this file.
 *
 * THE PLACE. Eight mounds of hardened pitch stand in a lake of tar, each higher than the last, joined by ridges of root. The walk is the
 * mound tops and the ridge crests and nothing else: everything lower is tar, closed by a chain of colliders along every shore. The mounds
 * make a zigzag chain with two side branches (M3 off M2, M6 off M5). There is ONE height field (`height`) and one floor: a roof is a body.
 *
 * Six mounds carry one room each (a hollow stump, a still, a root vault, a pit, a fallen trunk, a plate works), with a Learn bench built
 * into it; M0 is the landing and M7 the ground in front of the Fifth's gate.
 */

export const TAR_LEVEL = -0.35;
export const LAKE_BED = -1.6;
/** Ground counts as walkable when it stands this far above the tar. */
export const SHORE_ABOVE = 0.3;
export const BOUND = 96;

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;

/** The mounds: centre, radius of the foot, height of the flat top. The top is flat out to `r - EDGE_IN`. */
export const EDGE_IN = 4;
export const EDGE_OUT = 3;
export const MOUNDS = Object.freeze({
  M0: { x: 0, z: 68, r: 28, top: 0.5 },
  M1: { x: -38, z: 30, r: 17, top: 1.0 },
  M2: { x: 0, z: 6, r: 17, top: 1.8 },
  M3: { x: 42, z: 22, r: 17, top: 1.5 },
  M4: { x: -34, z: -22, r: 17, top: 2.9 },
  M5: { x: 4, z: -44, r: 18, top: 3.9 },
  M6: { x: -42, z: -62, r: 17, top: 4.8 },
  M7: { x: 44, z: -66, r: 24, top: 5.6 }
});
/** The root ridges, each between two mounds: a crest `RIDGE_HALF` wide either side of the line, rising evenly from one top to the other. */
export const RIDGE_HALF = 3.2;
export const RIDGE_FALL = 3.6;
export const RIDGES = Object.freeze([['M0', 'M1'], ['M1', 'M2'], ['M2', 'M3'], ['M2', 'M4'], ['M4', 'M5'], ['M5', 'M6'], ['M5', 'M7']]);

export const PAD = Object.freeze([0, 74]);
export const PAD_R = 9.4;
export const PAD_RISE = 0.06;

/** Bench 4's floor is dished into its mound: `PIT.depth` lower at the middle, rising to the mound top between `r0` and `r1` metres out. */
export const PIT = Object.freeze({ mound: 'M4', depth: 0.9, r0: 9.6, r1: 12.6 });

function moundHeight(m, x, z) {
  const d = Math.hypot(x - m.x, z - m.z);
  return lerp(m.top, LAKE_BED, smooth(m.r - EDGE_IN, m.r + EDGE_OUT, d));
}
function ridgeHeight(a, b, x, z) {
  const dx = b.x - a.x; const dz = b.z - a.z; const L = Math.hypot(dx, dz);
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (L * L)));
  const d = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
  const crest = lerp(a.top, b.top, smooth((a.r - EDGE_IN) / L, 1 - (b.r - EDGE_IN) / L, t));
  return lerp(crest, LAKE_BED, smooth(RIDGE_HALF, RIDGE_HALF + RIDGE_FALL, d));
}

/** The ground's height at (x, z): the highest of every mound and ridge there, the lake bed elsewhere. */
export function height(x, z) {
  let y = LAKE_BED;
  for (const m of Object.values(MOUNDS)) y = Math.max(y, moundHeight(m, x, z));
  for (const [a, b] of RIDGES) y = Math.max(y, ridgeHeight(MOUNDS[a], MOUNDS[b], x, z));
  const pm = MOUNDS[PIT.mound];
  const pd = Math.hypot(x - pm.x, z - pm.z);
  if (pd < PIT.r1) y -= PIT.depth * (1 - smooth(PIT.r0, PIT.r1, pd));
  // The landing pad is a plate lying on the first mound: its top is the ground there.
  const dp = Math.hypot(x - PAD[0], z - PAD[1]);
  if (dp < PAD_R + 0.6) y = Math.max(y, MOUNDS.M0.top + PAD_RISE * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, dp)));
  return y;
}
/** Can a player stand here? Above the tar by a margin and inside the walk's bounds. */
export const walkable = (x, z) => Math.abs(x) < BOUND && Math.abs(z) < BOUND && height(x, z) > TAR_LEVEL + SHORE_ABOVE;

/**
 * The shore: a chain of colliders on every cell of tar that touches walkable ground, so nobody walks into the lake. Marched on a grid of
 * `step` metres; deterministic.
 */
export function shoreColliders(step = 1.0, radius = 0.78) {
  const out = [];
  const n = Math.round((2 * BOUND) / step);
  const w = new Uint8Array((n + 1) * (n + 1));
  const at = i => -BOUND + i * step;
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) w[j * (n + 1) + i] = walkable(at(i), at(j)) ? 1 : 0;
  for (let j = 0; j <= n; j++) {
    for (let i = 0; i <= n; i++) {
      if (w[j * (n + 1) + i]) continue;
      let touches = false;
      for (let dj = -1; dj <= 1 && !touches; dj++) for (let di = -1; di <= 1; di++) {
        const ii = i + di; const jj = j + dj;
        if (ii < 0 || jj < 0 || ii > n || jj > n) continue;
        if (w[jj * (n + 1) + ii]) { touches = true; break; }
      }
      if (touches) out.push({ x: at(i), z: at(j), radius });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ the rooms */

/** The bench's own ground, in the host frame (origin under the plate, +z toward the player). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];
export const APPROACH = 4.6;
/** A room's inside radius, its centre in the host frame, its door. Every room is at least this large: 11.2 by 11 m fits inside. */
export const ROOM = Object.freeze({ r: 8.0, cz: 1.0, wall: 0.9, door: 3.4, clear: 4.8 });

const toward = (from, to) => { const dx = to.x - from.x; const dz = to.z - from.z; const L = Math.hypot(dx, dz); return [dx / L, dz / L]; };

/**
 * The six hosts. `mound` is where it stands, `from` the mound the player arrives from (the door faces it). `pos` is the plate's place:
 * the room's centre is the mound's centre, and the plate stands `ROOM.cz` behind it.
 */
const HOSTS = [
  ['site-1', 'q1-chains', 'Bench 1 - Carbon Chains', 'tapped-stump', 'M1', 'M0', 'THM-01', 'shelf'],
  ['site-2', 'q2-unsat', 'Bench 2 - Double Bonds', 'tar-still', 'M2', 'M1', 'THM-02', 'deck'],
  ['site-3', 'q3-isomers', 'Bench 3 - Isomers', 'mirror-vault', 'M3', 'M2', 'THM-03', 'desk'],
  ['site-4', 'q4-groups', 'Bench 4 - Functional Groups', 'wood-acid-pit', 'M4', 'M2', 'THM-04', 'shelf'],
  ['site-5', 'q5-reactions', 'Bench 5 - Making and Breaking', 'fallen-trunk', 'M5', 'M4', 'THM-05', 'deck'],
  ['site-6', 'q6-polymers', 'Bench 6 - Long Chains', 'plate-works', 'M6', 'M5', 'THM-06', 'desk']
];
export const HOST_PLAN = Object.freeze(Object.fromEntries(HOSTS.map(([id, questId, label, structure, mound, from, plate, skin], i) => {
  const m = MOUNDS[mound];
  const face = toward(m, MOUNDS[from]);
  return [id, {
    questId, label, structure, mound, from, plate, skin, stage: i + 1, face,
    centre: [m.x, m.z],
    pos: [m.x - face[0] * ROOM.cz, m.z - face[1] * ROOM.cz]
  }];
})));

/** A point of a host's frame in the world: `lx` to the player's right, `lz` toward the player. */
export function hostToWorld(plan, lx, lz) {
  const [fx, fz] = plan.face;
  return [plan.pos[0] + lx * fz + lz * fx, plan.pos[1] - lx * fx + lz * fz];
}

/** The boxes inside which the sun and the sky are taken away (one per room), in world coordinates. */
export function coverBoxes() {
  return Object.values(HOST_PLAN).map(p => {
    const y = height(p.centre[0], p.centre[1]);
    const r = ROOM.r + 0.2;
    return { min: [p.centre[0] - r, y - 0.5, p.centre[1] - r], max: [p.centre[0] + r, y + 9, p.centre[1] + r] };
  });
}

export const SPAWN = Object.freeze([0, 1.6, 46]);
export const ARENA = Object.freeze({ boss: [44, 0, -74], player: [44, 1.6, -58] });

/**
 * The guide's way from the spawn to a bench: along each ridge, round the edge of each mound it passes (a room stands in the middle of
 * every working mound), and in through the door.
 */
export function routeTo(siteId) {
  const chain = { 'site-1': ['M0', 'M1'], 'site-2': ['M0', 'M1', 'M2'], 'site-3': ['M0', 'M1', 'M2', 'M3'], 'site-4': ['M0', 'M1', 'M2', 'M4'], 'site-5': ['M0', 'M1', 'M2', 'M4', 'M5'], 'site-6': ['M0', 'M1', 'M2', 'M4', 'M5', 'M6'] }[siteId];
  const plan = HOST_PLAN[siteId];
  const pts = [[SPAWN[0], SPAWN[2]]];
  const mouth = (m, other) => { const [ux, uz] = toward(m, other); return [m.x + ux * (m.r - 3), m.z + uz * (m.r - 3)]; };
  for (let i = 0; i < chain.length - 1; i++) {
    const A = MOUNDS[chain[i]]; const B = MOUNDS[chain[i + 1]];
    const out = mouth(A, B);
    if (i > 0) {
      // Round the mound's edge from the mouth it came in by to the mouth it leaves by, the short way.
      const from = pts[pts.length - 1];
      let a0 = Math.atan2(from[1] - A.z, from[0] - A.x); const a1 = Math.atan2(out[1] - A.z, out[0] - A.x);
      let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const n = Math.max(1, Math.ceil(Math.abs(d) / 0.3));
      for (let k = 1; k < n; k++) { a0 += d / n; pts.push([A.x + Math.cos(a0) * (A.r - 3), A.z + Math.sin(a0) * (A.r - 3)]); }
    }
    pts.push(out, mouth(B, A));
  }
  const far = plan.structure === 'fallen-trunk' ? ROOM.cz + 10.5 : ROOM.cz + ROOM.r + 2.4;
  pts.push(hostToWorld(plan, 0, far), hostToWorld(plan, 0, APPROACH));
  return pts;
}
