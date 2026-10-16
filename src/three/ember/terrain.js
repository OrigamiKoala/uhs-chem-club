/**
 * ember/terrain.js — The shelf, the rim and the caldera, as one height field.
 *
 * The walk, the landing solver and every Node check stand on EXACTLY the ground
 * that is drawn, because the mesh is sampled from the same `height(x, z)` the
 * game calls. Four places live in the one function:
 *
 *   THE SHELF. Where the player walks: a few decimetres of rolling sinter, dead
 *   flat under every bench, the pad, the plant buildings and the boss's ground,
 *   with a shallow bowl at the middle that holds the hot spring.
 *
 *   THE RIM. North of the walk the shelf simply ends. Inside one big circle
 *   (`data.rim`) the ground is the caldera floor, 28 m down; the edge of the
 *   circle is a cliff, and a rail just inside it is a closed wall of colliders,
 *   so the only drop in the world is one nobody can reach.
 *
 *   THE FLOOR. Black, lumpy, cooled flow, with the lava lake lying flat in it
 *   and a cone standing out of it to the north-north-east.
 *
 *   THE WALLS. Past the walk the shelf lifts into the caldera's own walls,
 *   stepped where the flows that built them lie on one another, and lowest in
 *   the west-south-west, where the sun is, so they never hide it.
 *
 * ONE GRID TO THE HORIZON, as Lanternfall: two-metre cells across the walk,
 * growing geometrically to an 900 m disc, in one mesh. The colour of the
 * ground (sinter, sulphur, the spring's mats, the dark of the flows and the
 * bands of the walls) is painted into its vertices once, from the same layout
 * the props were placed by, so a fumarole stands in its own yellow.
 */

import * as THREE from 'three';

function hash2(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in 2D, 0..1. */
function vnoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

export function fbm2(x, z, seed, oct = 3) {
  let s = 0, amp = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += vnoise(x * f, z * f, seed + i * 31) * amp; n += amp; f *= 2.03; amp *= 0.5; }
  return s / n;
}

function ridge2(x, z, seed, oct = 3) {
  return 1 - Math.abs(fbm2(x, z, seed, oct) * 2 - 1);
}

const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/** Toward the sun in plan (west-south-west): the walls are lowest there. */
const SUN_PLAN = (() => { const x = -0.82, z = 0.44; const n = Math.hypot(x, z); return [x / n, z / n]; })();

/** Landmarks that are buildings or plant, and want level ground under them. */
const LEVEL_UNDER = new Set([
  'separator', 'silencer-pair', 'turbine-hall', 'cooling-cells', 'transformer', 'wellhead',
  'siphon-manifold', 'habitat', 'pylon', 'comms-mast', 'geyser', 'mud-pot', 'sinter-terrace'
]);

/**
 * @param {object} data the world JSON
 */
export function makeEmberField(data) {
  const S = data.spring;
  const RIM = data.rim;
  const FLOOR = data.floor.level;
  const lake = data.lake;
  const cone = data.cone;

  // Places that must be level: every bench, the pad, the spawn, the boss's ground, and the plant.
  const flat = data.sites.map(s => ({ x: s.pos[0], z: s.pos[2], r: 7.5, blend: 6 }));
  const pad = data.landmarks.find(l => l.asset === 'landing-pad');
  if (pad) flat.push({ x: pad.pos[0], z: pad.pos[2], r: 12, blend: 8 });
  flat.push({ x: data.spawn.pos[0], z: data.spawn.pos[2], r: 6, blend: 10 });
  if (data.arena) {
    flat.push({ x: data.arena.boss[0], z: data.arena.boss[2], r: 13, blend: 8 });
    flat.push({ x: data.arena.player[0], z: data.arena.player[2], r: 6, blend: 8 });
  }
  for (const l of data.landmarks) {
    if (LEVEL_UNDER.has(l.asset)) flat.push({ x: l.pos[0], z: l.pos[2], r: l.radius + 1.2, blend: 5 });
  }

  const PAD_TOP = 0.12;
  const PAD_R = 9.4;

  /** How far a point lies past the rim's edge (positive over the caldera floor). */
  const rimDist = (x, z) => RIM.radius - Math.hypot(x - RIM.cx, z - RIM.cz);

  /** The shelf and the walls, with no flat places cut into it. */
  const raw = (x, z) => {
    // Rolling sinter across the walk: low and slow.
    const roll = (fbm2(x * 0.022, z * 0.022, 11, 3) - 0.5) * 0.85;
    // Hummocks: the mounds old springs built and abandoned.
    const hum = (vnoise(x * 0.085, z * 0.085, 23) - 0.5) * 0.24;
    const d = Math.hypot(x, z);
    // Past the walk, the shelf lifts into the caldera's walls.
    const nx = x / (d || 1), nz = z / (d || 1);
    const az = Math.atan2(x, z);
    const sunward = Math.max(0, nx * SUN_PLAN[0] + nz * SUN_PLAN[1]);
    const start = 150 + 34 * fbm2(az * 1.6 + 7, 1.3, 41, 2);
    const H = 160 + 90 * fbm2(az * 2.1 + 3, 4.7, 43, 3) - 110 * sunward * sunward;
    const p = smooth(start, start + 250, d);
    let wall = 0;
    if (p > 0) {
      wall = H * Math.pow(p, 1.35);
      // Each flow that built the wall is a step in it.
      const step = 19;
      const stepped = Math.floor(wall / step) * step + smooth(0.55, 1, (wall / step) % 1) * step;
      wall = wall * 0.55 + stepped * 0.45;
      wall += (ridge2(x * 0.018, z * 0.018, 47, 4) - 0.5) * 34 * p;
    }
    // The outer shelf, between the walk and the wall, is rougher than the walk.
    const outer = smooth(96, 150, d) * (fbm2(x * 0.05, z * 0.05, 29, 3) - 0.4) * 3.2;
    return roll + hum + outer + wall;
  };

  /** The caldera floor, with the lake lying flat in it and the cone standing out of it. */
  const lower = (x, z) => {
    let y = FLOOR + (fbm2(x * 0.028, z * 0.028, 61, 4) - 0.5) * 5 + (ridge2(x * 0.09, z * 0.09, 63, 2) - 0.5) * 1.2;
    const e = ((x - lake.x) / lake.rx) ** 2 + ((z - lake.z) / lake.rz) ** 2;
    y = FLOOR - 0.6 + (y - FLOOR + 0.6) * smooth(0.9, 1.5, e);
    const r = Math.hypot(x - cone.x, z - cone.z);
    if (r < cone.radius) {
      const a = Math.atan2(x - cone.x, z - cone.z);
      const gully = 0.86 + 0.28 * ridge2(a * 3.2, r * 0.02, 67, 3);
      let h = cone.height * Math.pow(1 - r / cone.radius, 1.55) * gully;
      if (r < cone.crater) h -= (1 - (r / cone.crater) ** 2) * 34;
      y += h;
    }
    return y;
  };

  const height = (x, z) => {
    let k = 1;
    for (const f of flat) {
      const d = Math.hypot(x - f.x, z - f.z);
      if (d < f.r + f.blend) k = Math.min(k, smooth(f.r, f.r + f.blend, d));
    }
    let y = raw(x, z) * k;

    // The spring's bowl: the water lies in it, a hand below the sinter round it.
    const ds = Math.hypot(x - S.x, z - S.z);
    if (ds < S.radius + 1.2) {
      const q = Math.min(1, ds / S.radius);
      const bowl = -0.32 - 1.25 * (1 - q * q);
      y = bowl + (y - bowl) * smooth(S.radius - 0.4, S.radius + 1.2, ds);
    }

    // The rim: past the edge the ground falls to the caldera floor. The cliff is
    // a few metres wide by the walk and widens as it runs away from it, so a far
    // stretch is a slope the grid can draw rather than a wall one cell wide.
    const rd = rimDist(x, z);
    if (rd > -0.2) {
      const d = Math.hypot(x, z);
      const width = 9 + 0.28 * Math.max(0, d - 110);
      const t = smooth(0, width, rd);
      if (t > 0) {
        // Ledges in the cliff: the flows it cuts.
        const ledge = Math.floor(t * 4) / 4 * 0.35 + t * 0.65;
        y = y + (lower(x, z) - y) * ledge;
      }
    }

    // The pad stands a hand above the shelf, bevelled down to it.
    if (pad) {
      const d = Math.hypot(x - pad.pos[0], z - pad.pos[2]);
      if (d < PAD_R + 0.6) y = PAD_TOP * (1 - smooth(PAD_R - 0.05, PAD_R + 0.6, d));
    }
    return y;
  };

  /** True over open hot water: the walk is kept out of it by a ring of colliders. */
  const inSpring = (x, z) => Math.hypot(x - S.x, z - S.z) < S.radius;

  return { height, raw, lower, rimDist, inSpring, PAD_TOP, PAD_R };
}

/* ------------------------------------------------------------ the grid */

/** The grid lines: two-metre cells across the walk, then growing to the horizon. */
function axisLines(core = 126, step = 2, reach = 900) {
  const pos = [];
  for (let v = 0; v <= core; v += step) pos.push(v);
  let v = core, s = step;
  while (v < reach) { s *= 1.2; v = Math.min(reach, v + s); pos.push(v); }
  return [...pos.slice(1).reverse().map(p => -p), ...pos];
}

/* ---- the ground's colour ---- */

const C = {
  sinter: [1.0, 1.0, 1.0],
  wet: [0.93, 0.95, 0.9],
  rimPale: [1.02, 0.98, 0.84],
  yellow: [1.02, 0.84, 0.38],
  orange: [0.98, 0.54, 0.24],
  rust: [0.64, 0.38, 0.24],
  brown: [0.5, 0.36, 0.28],
  sulphur: [1.04, 0.9, 0.42],
  ochre: [0.92, 0.66, 0.44],
  mud: [0.6, 0.58, 0.56],
  basalt: [0.24, 0.22, 0.22],
  flow: [0.15, 0.135, 0.14],
  tuffA: [0.62, 0.5, 0.4],
  tuffB: [0.44, 0.37, 0.33],
  tuffC: [0.72, 0.6, 0.46],
  scoria: [0.42, 0.24, 0.18]
};
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * The colour a stretch of ground has, as a multiplier on the sinter's albedo.
 * `slope` is 1 - normal.y (0 flat, 1 a wall).
 */
function groundTint(x, z, y, slope, field, data, marks) {
  const S = data.spring;
  let c = C.sinter;

  // The spring's mats, in the order the water cools as it runs out: pale sinter at
  // the lip, then yellow, orange and rust-brown, streaked out along the runoff.
  const ds = Math.hypot(x - S.x, z - S.z);
  if (ds < S.radius + 34) {
    const a = Math.atan2(x - S.x, z - S.z);
    const streak = fbm2(a * 7.0, ds * 0.06, 71, 3);
    const run = ds - S.radius - (streak - 0.5) * 10 - Math.max(0, streak - 0.6) * 18;
    let m;
    if (run < 1.5) m = mix3(C.rimPale, C.yellow, smooth(0, 1.5, run));
    else if (run < 6) m = mix3(C.yellow, C.orange, smooth(1.5, 6, run));
    else if (run < 12) m = mix3(C.orange, C.rust, smooth(6, 12, run));
    else m = mix3(C.rust, C.brown, smooth(12, 18, run));
    const fade = 1 - smooth(14, 26, run);
    c = mix3(c, m, fade);
  }

  // Marks from the layout: sulphur round each vent, orange round the geyser, grey round the mud.
  for (const mk of marks) {
    const d = Math.hypot(x - mk.x, z - mk.z);
    if (d > mk.r) continue;
    const t = 1 - smooth(mk.r * 0.35, mk.r, d + (vnoise(x * 0.6, z * 0.6, 73) - 0.5) * mk.r * 0.4);
    c = mix3(c, mk.c, t * mk.k);
  }

  // Iron in the films: slow ochre patches across the shelf.
  const iron = fbm2(x * 0.03, z * 0.03, 79, 3);
  c = mix3(c, C.ochre, Math.max(0, iron - 0.58) * 1.6);
  // Damp lows hold their colour a little darker.
  c = mix3(c, C.wet, Math.max(0, 0.42 - fbm2(x * 0.07, z * 0.07, 83, 2)) * 0.8);

  // The rim, the floor and the cone: black flow, oxidised red near the cone's top.
  const rd = field.rimDist(x, z);
  if (rd > -6) {
    const t = smooth(-6, 4, rd);
    let f = mix3(C.basalt, C.flow, smooth(-25, -27.5, y));
    const cone = data.cone;
    const rc = Math.hypot(x - cone.x, z - cone.z);
    if (rc < cone.radius) f = mix3(f, C.scoria, smooth(cone.radius * 0.6, cone.crater, rc) * 0.8);
    c = mix3(c, f, t);
  }

  // The walls: tuff in bands by height, dark where a cliff is too steep to hold dust.
  const d = Math.hypot(x, z);
  if (d > 120 && rd < 0) {
    const band = Math.sin(y * 0.21 + fbm2(x * 0.01, z * 0.01, 89, 2) * 5) * 0.5 + 0.5;
    let w = mix3(C.tuffB, C.tuffA, band);
    w = mix3(w, C.tuffC, Math.max(0, fbm2(x * 0.02, z * 0.02, 97, 3) - 0.55) * 2);
    w = mix3(w, C.basalt, smooth(0.35, 0.7, slope));
    c = mix3(c, w, smooth(120, 175, d) * Math.min(1, 0.3 + y / 25));
  }
  // Any steep face anywhere is bare rock.
  c = mix3(c, C.basalt, smooth(0.42, 0.75, slope) * 0.8);
  return c;
}

/** Where a landmark paints the ground round itself. */
function marksFor(data) {
  const out = [];
  for (const l of data.landmarks) {
    const s = l.scale || 1;
    if (l.asset === 'fumarole') out.push({ x: l.pos[0], z: l.pos[2], r: 5.5 * s, c: C.sulphur, k: 0.85 });
    else if (l.asset === 'sulfur-mound') out.push({ x: l.pos[0], z: l.pos[2], r: 3.2 * s, c: C.sulphur, k: 0.7 });
    else if (l.asset === 'geyser') out.push({ x: l.pos[0], z: l.pos[2], r: 10, c: C.orange, k: 0.55 });
    else if (l.asset === 'sinter-terrace') out.push({ x: l.pos[0], z: l.pos[2], r: 8 * s, c: C.rimPale, k: 0.6 });
    else if (l.asset === 'mud-pot') out.push({ x: l.pos[0], z: l.pos[2], r: 5.5 * s, c: C.mud, k: 0.8 });
    else if (l.asset === 'lava-lobe') out.push({ x: l.pos[0], z: l.pos[2], r: 7 * s, c: C.basalt, k: 0.5 });
    else if (l.asset === 'siphon-manifold') out.push({ x: l.pos[0], z: l.pos[2], r: 9, c: [1.08, 1.1, 1.14], k: 0.75 });
  }
  return out;
}

export function buildEmberTerrainGeometry(field, data) {
  const axis = axisLines();
  const n = axis.length;
  const positions = new Float32Array(n * n * 3);
  const uvs = new Float32Array(n * n * 2);
  const colors = new Float32Array(n * n * 3);
  const TILE = 9;
  const marks = marksFor(data);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = axis[i], z = axis[j];
      const k = j * n + i;
      const y = field.height(x, z);
      positions[k * 3] = x;
      positions[k * 3 + 1] = y;
      positions[k * 3 + 2] = z;
      uvs[k * 2] = x / TILE;
      uvs[k * 2 + 1] = z / TILE;
      // The slope from the field itself, over a metre, so the colour does not depend on the cell size.
      const e = Math.max(1, Math.min(8, Math.abs(axis[Math.min(n - 1, i + 1)] - x)));
      const gx = (field.height(x + e, z) - field.height(x - e, z)) / (2 * e);
      const gz = (field.height(x, z + e) - field.height(x, z - e)) / (2 * e);
      const slope = 1 - 1 / Math.sqrt(1 + gx * gx + gz * gz);
      const c = groundTint(x, z, y, slope, field, data, marks);
      colors[k * 3] = c[0];
      colors[k * 3 + 1] = c[1];
      colors[k * 3 + 2] = c[2];
    }
  }
  const index = new Uint32Array((n - 1) * (n - 1) * 6);
  let p = 0;
  for (let j = 0; j < n - 1; j++) {
    for (let i = 0; i < n - 1; i++) {
      const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
      index[p++] = a; index[p++] = c; index[p++] = b;
      index[p++] = b; index[p++] = c; index[p++] = d;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setAttribute('uv1', new THREE.BufferAttribute(uvs.slice(), 2));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/* ------------------------------------------------------------ the water */

/**
 * The hot spring: a disc laid in its bowl, tinted by depth the way such a
 * spring is: blue where it is deepest and hottest, turquoise toward the lip,
 * paling to the sinter at the edge. The colour is the water's; the mats round
 * it are the ground's.
 */
export function buildSpringGeometry(spring, segments = 96, rings = 10) {
  // Built in rings, not as a circle geometry (a centre and a rim), so the colour can run.
  const pos = [];
  const col = [];
  const uv = [];
  const idx = [];
  const R = spring.radius + 0.25;
  const deep = [0.02, 0.13, 0.3], mid = [0.05, 0.3, 0.46], tq = [0.2, 0.55, 0.56], lip = [0.62, 0.7, 0.58];
  const tint = t => (t < 0.55 ? mix3(deep, mid, t / 0.55) : t < 0.85 ? mix3(mid, tq, (t - 0.55) / 0.3) : mix3(tq, lip, (t - 0.85) / 0.15));
  pos.push(0, 0, 0); col.push(...deep); uv.push(0, 0);
  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const x = Math.sin(a) * R * t, z = Math.cos(a) * R * t;
      pos.push(x, 0, z);
      col.push(...tint(t));
      uv.push(x / 7, z / 7);
    }
  }
  for (let s = 0; s < segments; s++) idx.push(0, 1 + s, 1 + ((s + 1) % segments));
  for (let r = 1; r < rings; r++) {
    const a0 = 1 + (r - 1) * segments, a1 = 1 + r * segments;
    for (let s = 0; s < segments; s++) {
      const s1 = (s + 1) % segments;
      idx.push(a0 + s, a1 + s, a1 + s1, a0 + s, a1 + s1, a0 + s1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The lava lake: an ellipse laid flat in the caldera floor. */
export function buildLakeGeometry(lake, segments = 96) {
  const geo = new THREE.CircleGeometry(1, segments);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * lake.rx, z = p.getZ(i) * lake.rz;
    p.setXYZ(i, x, 0, z);
    uv.setXY(i, x / 26, z / 26);
  }
  geo.setAttribute('uv1', uv.clone());
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/* ------------------------------------------------------------ the roads */

/**
 * A ribbon of cinder laid along a polyline in plan, lifted a finger off the
 * field so it follows every roll of the shelf. UVs run in metres along it; the
 * alpha map feathers its two edges so it lies IN the ground rather than on it.
 */
export function buildRibbon(field, pts, width, { closed = false, lift = 0.03, step = 1.5 } = {}) {
  const P = [];
  const src = closed ? [...pts, pts[0]] : pts;
  for (let i = 0; i < src.length - 1; i++) {
    const [ax, az] = src[i], [bx, bz] = src[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) P.push([ax + (bx - ax) * (k / n), az + (bz - az) * (k / n)]);
  }
  P.push(src[src.length - 1]);
  const pos = [], uv = [], idx = [];
  let along = 0;
  for (let i = 0; i < P.length; i++) {
    const prev = P[Math.max(0, i - 1)], next = P[Math.min(P.length - 1, i + 1)];
    let tx = next[0] - prev[0], tz = next[1] - prev[1];
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const nx = -tz, nz = tx;
    if (i > 0) along += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    for (const side of [-1, 1]) {
      const x = P[i][0] + nx * side * width / 2, z = P[i][1] + nz * side * width / 2;
      pos.push(x, field.height(x, z) + lift, z);
      uv.push(side < 0 ? 0 : 1, along / 4);
    }
    if (i > 0) {
      const a = (i - 1) * 2, b = i * 2;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // Wound for a view from above, whichever way the line runs.
  const nrm = g.attributes.normal;
  let up = 0;
  for (let i = 0; i < nrm.count; i++) up += nrm.getY(i);
  if (up < 0) {
    for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    g.setIndex(idx);
    g.computeVertexNormals();
  }
  return g;
}

/** A disc of cinder (a plaza), feathered at its edge the same way. */
export function buildDisc(field, cx, cz, radius, { lift = 0.03, segments = 48, rings = 6 } = {}) {
  const pos = [], uv = [], idx = [];
  pos.push(cx, field.height(cx, cz) + lift, cz); uv.push(0.5, 0);
  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const x = cx + Math.sin(a) * radius * t, z = cz + Math.cos(a) * radius * t;
      pos.push(x, field.height(x, z) + lift, z);
      // u runs from the middle (0.5) to the edge (0 or 1 alike): the feather is at the rim.
      uv.push(0.5 - 0.5 * t, (x - cx) / 4);
    }
  }
  for (let s = 0; s < segments; s++) idx.push(0, 1 + s, 1 + ((s + 1) % segments));
  for (let r = 1; r < rings; r++) {
    const a0 = 1 + (r - 1) * segments, a1 = 1 + r * segments;
    for (let s = 0; s < segments; s++) {
      const s1 = (s + 1) % segments;
      idx.push(a0 + s, a1 + s, a1 + s1, a0 + s, a1 + s1, a0 + s1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('uv1', new THREE.Float32BufferAttribute(uv.slice(), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
