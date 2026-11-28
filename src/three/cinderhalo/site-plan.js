/**
 * cinderhalo/site-plan.js — Cinder Halo's ground and cells, as one declaration. Pure data and arithmetic, no THREE: the layout generator,
 * `CinderHaloWorld`, the walk and `verify:cinderhalo` all stand on this file.
 *
 * THE PLACE. A plain of black cinder punched by impact craters. One great crater (G) holds the Fifth's broken reactor on its floor; six
 * smaller craters are punched into the ground round it, each floor lower than the last, and the walk goes down into them one by one
 * through cuttings in their rims, spiralling in to the great crater's floor. ONE height field (`height`), one floor: a cell's roof is a body.
 *
 * THE HEIGHT FIELD is the lowest of: the plain; each crater's floor plus its wall's rise with distance outside the floor; each cutting's
 * floor (falling evenly between the two floors it joins) plus the same rise. Inside the walk (`walkable`) that lowest is the floor itself,
 * so a floor is flat and every wall rises from it. Outside the walk the rock is roughened and a raised rim lies round each crater.
 *
 * THE CELLS. Each small crater holds one shielded concrete cell at its back, against the wall, its front toward the floor's middle: a
 * room of 12.4 by 12.4 m inside, 5 m to the roof, and a vestibule on its front whose outer opening is on its side, so the way in is a dog-leg
 * and no straight line runs from the crater floor to the plate. Cells face along the axes, so their cover boxes are exact.
 */

export const PLAIN = 3.0;
export const BOUND = 100;
/** The walk is held this far inside its outline by the wall colliders. */
export const CUT_HALF = 3.5;

/** The crater floors: centre, radius of the flat floor, height of the floor. L is the landing apron on the plain; G the great crater. */
export const PARTS = Object.freeze({
  L: { x: 0, z: 70, r: 24, floor: 0 },
  C1: { x: -64, z: 25, r: 18, floor: -2.0 },
  C2: { x: -66, z: -36, r: 18, floor: -4.5 },
  C3: { x: -23, z: -76, r: 18, floor: -7.0 },
  C4: { x: 38, z: -66, r: 18, floor: -9.0 },
  C5: { x: 64, z: -12, r: 18, floor: -11.0 },
  C6: { x: 44, z: 25, r: 18, floor: -12.5 },
  G: { x: 0, z: -12, r: 24, floor: -15.0 }
});
/** The way down, part to part, each a cutting through the rims. */
export const CUTS = Object.freeze([['L', 'C1'], ['C1', 'C2'], ['C2', 'C3'], ['C3', 'C4'], ['C4', 'C5'], ['C5', 'C6'], ['C6', 'G']]);
/** The overlook: a short level spur from the landing out to the great crater's north rim. */
export const APRON = Object.freeze({ a: [0, 48], b: [0, 34], half: 5, floor: 0 });

export const PAD = Object.freeze([0, 80]);
export const PAD_R = 9.4;
export const PAD_RISE = 0.06;
export const SPAWN = Object.freeze([0, 1.6, 60]);
/** The Core's ground on the great crater's floor: the boss before the split dome, the player's mark north of it. */
export const ARENA = Object.freeze({ boss: [0, -15, -12], player: [0, 1.6, 4], dome: [0, -26], domeR: 8 });

const smooth = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

/** How far the rock rises above a floor at distance `d` outside it: a steep crater wall that flattens, then keeps climbing slowly. */
export const rise = d => 9 * (1 - Math.exp(-d / 8)) + 0.35 * d;

/** A cutting as a segment from just inside one floor to just inside the next, with the two floors at its ends. */
function cutOf(a, b) {
  const A = PARTS[a]; const B = PARTS[b];
  const dx = B.x - A.x; const dz = B.z - A.z; const L = Math.hypot(dx, dz);
  const ux = dx / L; const uz = dz / L;
  return { a, b, ax: A.x + ux * (A.r - 1), az: A.z + uz * (A.r - 1), bx: B.x - ux * (B.r - 1), bz: B.z - uz * (B.r - 1), fa: A.floor, fb: B.floor, half: CUT_HALF };
}
export const CUT_SEGS = Object.freeze(CUTS.map(([a, b]) => Object.freeze(cutOf(a, b))));
const APRON_SEG = Object.freeze({ ax: APRON.a[0], az: APRON.a[1], bx: APRON.b[0], bz: APRON.b[1], fa: APRON.floor, fb: APRON.floor, half: APRON.half });

/** Distance from (x, z) to a segment, and how far along it (0 to 1) the nearest point is. */
function seg(s, x, z) {
  const dx = s.bx - s.ax; const dz = s.bz - s.az; const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / L2));
  return { d: Math.hypot(x - (s.ax + dx * t), z - (s.az + dz * t)), t };
}

/** Distance outside the walk (0 inside it), and the floor of the piece of walk nearest. */
export function walkDistance(x, z) {
  let best = Infinity; let floor = 0;
  for (const P of Object.values(PARTS)) { const d = Math.max(0, Math.hypot(x - P.x, z - P.z) - P.r); if (d < best) { best = d; floor = P.floor; } }
  for (const s of [...CUT_SEGS, APRON_SEG]) { const q = seg(s, x, z); const d = Math.max(0, q.d - s.half); if (d < best) { best = d; floor = s.fa + (s.fb - s.fa) * q.t; } }
  return { d: best, floor };
}

/* A deterministic value noise for the rock, so no two stretches of crater wall are the same. */
const hash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
function noise(x, z) {
  const i = Math.floor(x); const j = Math.floor(z); const fx = x - i; const fz = z - j;
  const u = fx * fx * (3 - 2 * fx); const v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j); const b = hash(i + 1, j); const c = hash(i, j + 1); const d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x, z) => noise(x, z) * 0.55 + noise(x * 2.1 + 9, z * 2.1 - 4) * 0.3 + noise(x * 4.3 - 2, z * 4.3 + 7) * 0.15;

/** The ground's height at (x, z). */
export function height(x, z) {
  let y = PLAIN + (fbm(x * 0.02, z * 0.02) - 0.5) * 2.4;
  for (const P of Object.values(PARTS)) y = Math.min(y, P.floor + rise(Math.max(0, Math.hypot(x - P.x, z - P.z) - P.r)));
  for (const s of [...CUT_SEGS, APRON_SEG]) {
    const q = seg(s, x, z);
    y = Math.min(y, s.fa + (s.fb - s.fa) * q.t + rise(Math.max(0, q.d - s.half)));
  }
  // Outside the walk: a raised rim round every crater, and rough rock, both fading in from the walk's edge so a floor stays flat.
  const out = walkDistance(x, z).d;
  if (out > 0) {
    const k = smooth(0, 2.5, out);
    let rim = 0;
    for (const P of Object.values(PARTS)) { if (P === PARTS.L) continue; const d = Math.hypot(x - P.x, z - P.z) - P.r; rim = Math.max(rim, (P === PARTS.G ? 2.6 : 1.6) * Math.exp(-(((d - (P === PARTS.G ? 26 : 10)) / 4) ** 2))); }
    y += k * (rim + (fbm(x * 0.18, z * 0.18) - 0.5) * 1.6);
  }
  // The landing pad is a plate lying on the landing: its top is the ground there.
  const dp = Math.hypot(x - PAD[0], z - PAD[1]);
  if (dp < PAD_R + 0.6) y = Math.max(y, PARTS.L.floor + PAD_RISE * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, dp)));
  return y;
}

/** Can a player stand here? Inside the walk and inside the map. */
export const walkable = (x, z) => Math.abs(x) < BOUND && Math.abs(z) < BOUND && walkDistance(x, z).d <= 0;

/**
 * The wall: a collider on every grid cell outside the walk that touches the walk, so nobody climbs a crater wall or steps off the apron.
 * Marched on a grid of `step` metres; deterministic.
 */
export function wallColliders(step = 1.0, radius = 0.78) {
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

/* ------------------------------------------------------------------ the cells */

/** A cell in its host frame: origin under the middle of the plate, +z toward the player and the door, +x to the player's right. */
export const CELL = Object.freeze({
  inner: { x0: -6.2, x1: 6.2, z0: -5.4, z1: 7.0 },
  wall: 1.0,
  roof: 5.0,
  door: { x0: 1.6, x1: 4.6 },                       // the inner door in the front wall (mirrored with the vestibule)
  vest: { x0: 0.6, x1: 7.2, z0: 8.0, z1: 11.0 },   // the vestibule's inside; its outer opening is its far end (x1), flush with the side wall
  vestRoof: 3.2,
  back: 8.5                                          // how far the plate stands behind the crater's middle
});
export const APPROACH = 4.6;
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

const unit = (dx, dz) => { const L = Math.hypot(dx, dz) || 1; return [dx / L, dz / L]; };
/** Snap a direction to the nearest of the four axes. */
const snap = ([x, z]) => (Math.abs(x) >= Math.abs(z) ? [Math.sign(x), 0] : [0, Math.sign(z)]);

/** The order the parts are walked in, and each crater's way in and way out. */
export const ORDER = Object.freeze(['L', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'G']);

const HOSTS = [
  ['site-1', 'q1-still-warm', 'Bench 1 - Radioactive Decay', 'drum-store', 'C1', 'CHO-01', 'shelf'],
  ['site-2', 'q2-what-comes-off', 'Bench 2 - Types of Radiation', 'shield-cell', 'C2', 'CHO-02', 'deck'],
  ['site-3', 'q3-equations', 'Bench 3 - Nuclear Equations', 'target-hall', 'C3', 'CHO-03', 'desk'],
  ['site-4', 'q4-stability', 'Bench 4 - Nuclear Stability', 'separation-hall', 'C4', 'CHO-04', 'shelf'],
  ['site-5', 'q5-half-gone', 'Bench 5 - Half-Life', 'cask-vault', 'C5', 'CHO-05', 'deck'],
  ['site-6', 'q6-shortfall', 'Bench 6 - Binding Energy', 'pool-hall', 'C6', 'CHO-06', 'desk']
];

export const HOST_PLAN = Object.freeze(Object.fromEntries(HOSTS.map(([id, questId, label, structure, crater, plate, skin], i) => {
  const P = PARTS[crater];
  const k = ORDER.indexOf(crater);
  const prev = PARTS[ORDER[k - 1]]; const next = PARTS[ORDER[k + 1]];
  const uIn = unit(prev.x - P.x, prev.z - P.z); const uOut = unit(next.x - P.x, next.z - P.z);
  // The cell's back is away from both ways in and out; its front (the face) toward them.
  const face = snap(unit(uIn[0] + uOut[0], uIn[1] + uOut[1]));
  const pos = [P.x - face[0] * CELL.back, P.z - face[1] * CELL.back];
  // The vestibule opens on the side the way in comes from: +1 to the player's right (host +x), -1 to the left.
  const right = [face[1], -face[0]];
  const mirror = uIn[0] * right[0] + uIn[1] * right[1] >= 0 ? 1 : -1;
  return [id, Object.freeze({ questId, label, structure, crater, plate, skin, stage: i + 1, face, pos, centre: [P.x, P.z], mirror, uIn, uOut })];
})));

/** A point of a host's frame in the world: `lx` to the player's right, `lz` toward the player. */
export function hostToWorld(plan, lx, lz) {
  const [fx, fz] = plan.face;
  return [plan.pos[0] + lx * fz + lz * fx, plan.pos[1] - lx * fx + lz * fz];
}

/** The boxes inside which the sun and the sky are taken away: each cell's room, and its vestibule, in world coordinates. */
export function coverBoxes() {
  const out = [];
  for (const plan of Object.values(HOST_PLAN)) {
    const y = PARTS[plan.crater].floor;
    const m = plan.mirror;
    const rect = (x0, x1, z0, z1, top, sky = 0) => {
      const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => hostToWorld(plan, lx, lz));
      const xs = pts.map(p => p[0]); const zs = pts.map(p => p[1]);
      out.push({ min: [Math.min(...xs), y - 0.5, Math.min(...zs)], max: [Math.max(...xs), y + top, Math.max(...zs)], sky });
    };
    rect(CELL.inner.x0 + 0.05, CELL.inner.x1 - 0.05, CELL.inner.z0 + 0.05, CELL.inner.z1 - 0.05, CELL.roof + 0.4);
    const vx = [CELL.vest.x0 * m, CELL.vest.x1 * m].sort((a, b) => a - b);
    rect(vx[0] + 0.05, vx[1], CELL.vest.z0 + 0.05, CELL.vest.z1 - 0.05, CELL.vestRoof + 0.3, 0.25);
  }
  return out;
}

/** A point on a crater's floor at `r` metres from its middle, in direction `a` (radians, atan2 of z, x). */
const onFloor = (P, a, r) => [P.x + Math.cos(a) * r, P.z + Math.sin(a) * r];
const angleOf = (P, p) => Math.atan2(p[1] - P.z, p[0] - P.x);
/** Walk round a crater at radius `r` from angle a0 to a1 the short way: the points between. */
function arc(P, a0, a1, r) {
  let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(d) / 0.25));
  const out = [];
  for (let k = 1; k < n; k++) out.push(onFloor(P, a0 + (d * k) / n, r));
  return out;
}
/** Where the cutting from part `a` toward part `b` leaves `a`'s floor (its mouth), three metres in from the edge. */
function mouth(a, b) {
  const A = PARTS[a]; const B = PARTS[b];
  const [ux, uz] = unit(B.x - A.x, B.z - A.z);
  return [A.x + ux * (A.r - 3), A.z + uz * (A.r - 3)];
}

/** The way in through a cell: outside the vestibule's opening, along it, through the inner door, to the approach mark. */
export function cellWay(plan) {
  const m = plan.mirror;
  const doorX = ((CELL.door.x0 + CELL.door.x1) / 2) * m;
  const midZ = (CELL.vest.z0 + CELL.vest.z1) / 2;
  return [[(CELL.vest.x1 + 3.4) * m, midZ], [(CELL.vest.x1 - 2) * m, midZ], [doorX, midZ], [doorX, CELL.inner.z1 - 1.0], [0, APPROACH]].map(([lx, lz]) => hostToWorld(plan, lx, lz));
}

/**
 * The guide's way from the spawn to a site (or 'arena'): across the landing, down each cutting, round each crater's floor (the short way,
 * in front of its cell), and in through the cell's dog-leg.
 */
export function routeTo(siteId) {
  const plan = HOST_PLAN[siteId] || null;
  const last = plan ? plan.crater : 'G';
  const upto = ORDER.indexOf(last);
  const pts = [[SPAWN[0], SPAWN[2]]];
  for (let k = 0; k < upto; k++) {
    const a = ORDER[k]; const b = ORDER[k + 1];
    const out = mouth(a, b);
    if (k > 0) {
      const A = PARTS[a];
      const from = pts[pts.length - 1];
      pts.push(...arc(A, angleOf(A, from), angleOf(A, out), A.r - 3));
    }
    pts.push(out, mouth(b, a));
  }
  const P = PARTS[last];
  if (plan) {
    const way = cellWay(plan);
    pts.push(...arc(P, angleOf(P, pts[pts.length - 1]), angleOf(P, way[0]), P.r - 3));
    pts.push(...way);
  } else {
    pts.push([ARENA.player[0], ARENA.player[2]]);
  }
  return pts;
}
