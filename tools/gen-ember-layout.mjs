#!/usr/bin/env node
/**
 * gen-ember-layout.mjs — Lays out Ember Reach's ground and writes
 * `src/three/world-data/ember.json`.
 *
 * Ember Reach is a hydrothermal shelf inside a caldera. A banded hot spring
 * steams at the middle; the seven benches of "Thermodynamics" stand on a ring
 * round it, a road of work lamps between them; the vent field (fumaroles, a
 * geyser, mud pots, sinter terraces) is scattered inside and outside the ring;
 * the geothermal plant stands off at the edges (wellheads, a separator
 * station, silencers, the turbine hall, cooling cells, a transformer and a
 * line of pylons); and the caldera main, one elevated steam pipe, runs round
 * the north of the ring between the separator and the turbine hall. Past it
 * the shelf ends at a railed rim, and under the rim lies the caldera floor
 * with its lava lake and a cone still breathing.
 *
 * The layout is DETERMINISTIC (seeded) and holds itself to the rules
 * `verify:ember` holds the world to: every footprint disjoint, every site clear
 * of every prop, the pipe and the rail, every approach on open ground facing
 * the way the player walks in, the boss's ground at the rim kept open.
 *
 * THE BENCHES ARE BUILT INTO THE FIELD (`src/three/ember/host-plan.js`): a wellhead's heat exchanger, a sampling shelf
 * at the spring's edge, a boiler room, a coil over a fumarole, a separator and its two routes, the silencer bay and the
 * turbine hall's control room. No shelter stands on a ring. Each host declares its footprint (`extent`, in its own frame)
 * and the generator keeps every free prop out of it and out of the lane in front of its plate; `verify:ember` measures
 * the real build against the declaration.
 *
 * Run: node tools/gen-ember-layout.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/ember/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0xe3be7);
const round = n => Math.round(n * 100) / 100;
const deg = d => d * Math.PI / 180;

const RING = 54;          // where the benches stand
const ROAD = 37;          // the lamp road, between the spring and the benches
const SPRING = 14;        // the hot spring's water
const PIPE_R = 76;        // the caldera main, round the north
const PIPE_Y = 3.0;       // its centre above the ground: a player walks under it
/** The rim: everything inside this circle is the caldera floor, 28 m down. */
const RIM = { cx: 0, cz: -260, radius: 176, rail: 177.6, span: 78 };
/** Where the Crucible is fought: open ground in front of the main's expansion loop. */
const ARENA = { boss: [0, 0, -63], player: [0, 1.6, -47] };

/* ---------------------------------------------------------------- the sites */

const APPROACH = 4.6;      // how far in front of the plate the player is asked to stand

const QUESTS = [
  ['q1-flow', 'Heat and Temperature'],
  ['q2-calorimetry', 'Calorimetry'],
  ['q3-enthalpy', 'Reaction Enthalpy'],
  ['q4-bonds', 'Bond Enthalpies'],
  ['q5-hess', "Hess's Law"],
  ['q6-entropy', 'Entropy'],
  ['q7-gibbs', 'Free Energy']
];

/**
 * Where each host stands: at an angle (degrees from the south, toward the east) and a radius, its plate facing the middle of the
 * field (the player comes in from the lamp road and stands between the plate and the spring) or, when the plan says `faceOut`,
 * facing away from it, so the machinery behind the plate is toward the spring.
 */
const SITE_DEFS = QUESTS.map(([questId, title], i) => {
  const id = `site-${i + 1}`;
  const plan = HOST_PLAN[id];
  const a = deg(plan.angle);
  const out = [Math.sin(a), Math.cos(a)];
  const r = plan.radius ?? RING;
  const f = plan.faceOut ? out : [-out[0], -out[1]];
  return { id, questId, title, stage: i + 1, pos: [out[0] * r, out[1] * r], f };
});

/** A host-frame point as a world point: x to the player's right, z toward the player. */
function toWorld(def, lx, lz) {
  const [px, pz] = def.pos;
  const [fx, fz] = def.f;
  return [px + lx * fz + lz * fx, pz - lx * fx + lz * fz];
}
function hostRect(def, [x0, x1, z0, z1]) {
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => toWorld(def, lx, lz));
  return {
    minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1]))
  };
}
const unionRect = (a, b) => ({ minX: Math.min(a.minX, b.minX), maxX: Math.max(a.maxX, b.maxX), minZ: Math.min(a.minZ, b.minZ), maxZ: Math.max(a.maxZ, b.maxZ) });
function rectDist(x, z, r) {
  const dx = Math.max(r.minX - x, 0, x - r.maxX), dz = Math.max(r.minZ - z, 0, z - r.maxZ);
  return Math.hypot(dx, dz);
}

const sites = SITE_DEFS.map(d => {
  const plan = HOST_PLAN[d.id];
  const [fx, fz] = d.f;
  // The ground that must be level: the host's machinery and the lane in front of its plate.
  const area = unionRect(hostRect(d, plan.extent), hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]));
  const cx = (area.minX + area.maxX) / 2, cz = (area.minZ + area.maxZ) / 2;
  const r = Math.hypot(area.maxX - area.minX, area.maxZ - area.minZ) / 2 + 0.8;
  return {
    id: d.id, questId: d.questId, stage: d.stage,
    pos: [round(d.pos[0]), 0, round(d.pos[1])],
    approachPos: [round(d.pos[0] + fx * APPROACH), 1.6, round(d.pos[1] + fz * APPROACH)],
    label: `Bench ${d.stage} - ${d.title}`,
    structure: plan.structure, built: true,
    flat: { x: round(cx), z: round(cz), r: round(r) }
  };
});

/* --------------------------------------------------------- the caldera main */

/**
 * One elevated run round the north of the ring, from the separator in the east
 * to the turbine hall in the west. Where it crosses the lane to the rim it is
 * lifted into an expansion loop, a gate a player walks through to the overlook.
 * Points are [x, height above the ground, z].
 */
function mainRun() {
  const pts = [];
  // Out of the separator, heading west along its inlet axis.
  pts.push([84.1, PIPE_Y, -13.2]);
  for (let a = 100; a <= 262; a += 5) {
    const r = deg(a);
    const x = PIPE_R * Math.sin(r), z = PIPE_R * Math.cos(r);
    // The expansion loop over the lane: up, across, down.
    if (a === 175) { pts.push([round(x), PIPE_Y, round(z)]); continue; }
    if (a === 180) {
      const xs = [4.4, 4.4, -4.4, -4.4];
      const ys = [PIPE_Y, 7.4, 7.4, PIPE_Y];
      for (let k = 0; k < 4; k++) pts.push([xs[k], ys[k], round(-Math.sqrt(PIPE_R * PIPE_R - xs[k] * xs[k]))]);
      continue;
    }
    pts.push([round(x), PIPE_Y, round(z)]);
  }
  // Into the turbine hall's north gable.
  const last = pts[pts.length - 1];
  pts.push([-80, PIPE_Y, last[2]]);
  pts.push([-80, PIPE_Y, 5.6]);
  return pts;
}

const runs = [{ id: 'caldera-main', radius: 0.55, points: mainRun() }];

/* ---------------------------------------------------------------- the props */

const landmarks = [];
const taken = [];   // { x, z, r }
const segs = [];    // pipe segments in plan: { a:[x,z], b:[x,z], r }
const distSeg = (x, z, a, b) => {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
  return Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
};
/** Rects (world AABB) that no free prop may stand in: every host's real extent and its lane. */
const KEEP = [];
const keep = (name, r, { margin = 0.8, owner = null } = {}) => KEEP.push({ name, ...r, margin, owner });
const rimDist = (x, z) => RIM.radius - Math.hypot(x - RIM.cx, z - RIM.cz);   // > 0 past the edge
const railDist = (x, z) => Math.hypot(x - RIM.cx, z - RIM.cz) - RIM.rail;     // > 0 on the walk's side
function fits(x, z, r, pad = 0.6) {
  if (!taken.every(t => Math.hypot(x - t.x, z - t.z) >= t.r + r + pad)) return false;
  if (!segs.every(s => distSeg(x, z, s.a, s.b) >= s.r + r + pad)) return false;
  if (!KEEP.every(k => rectDist(x, z, k) >= r + k.margin)) return false;
  // Inside the walk, nothing stands at the rail or past it.
  if (railDist(x, z) < r + 1.2) return false;
  return true;
}
function add(asset, x, z, radius, extra = {}) {
  landmarks.push({ asset, pos: [round(x), 0, round(z)], radius, ...extra });
  taken.push({ x, z, r: radius });
}
function claimRun(run, extra = 1.4) {
  for (let i = 0; i < run.points.length - 1; i++) {
    const a = run.points[i], b = run.points[i + 1];
    segs.push({ a: [a[0], a[2]], b: [b[0], b[2]], r: run.radius + extra });
  }
}

// Every host claims its whole footprint, and the lane in front of its plate, before anything free is placed.
for (const d of SITE_DEFS) {
  keep(`${d.id} host`, hostRect(d, HOST_PLAN[d.id].extent), { owner: d.id });
  keep(`${d.id} approach`, hostRect(d, [-LANE.hw, LANE.hw, LANE.from, LANE.to]), { margin: 0.2, owner: d.id });
}
for (const s of sites) taken.push({ x: s.approachPos[0], z: s.approachPos[2], r: 3.2 });
// The spring and its banks, the lamp road (as a ring of claims), the spawn and its road, the lane to the rim.
taken.push({ x: 0, z: 0, r: SPRING + 3.5 });
for (let i = 0; i < 48; i++) {
  const a = (i / 48) * Math.PI * 2;
  taken.push({ x: ROAD * Math.sin(a), z: ROAD * Math.cos(a), r: 2.2 });
}
for (let z = 40; z <= 90; z += 5) taken.push({ x: 0, z, r: 3.4 });
for (let z = -40; z >= -58; z -= 4) taken.push({ x: 0, z, r: 4.4 });
taken.push({ x: ARENA.boss[0], z: ARENA.boss[2], r: 11 });
taken.push({ x: ARENA.player[0], z: ARENA.player[2], r: 5 });
// Each spoke, from the lamp road out to the bench's approach.
for (const s of sites) {
  const [ax, , az] = s.approachPos;
  const n = Math.hypot(ax, az);
  for (let r = Math.min(ROAD + 2, n); r <= Math.max(ROAD + 2, n); r += 3) taken.push({ x: ax / n * r, z: az / n * r, r: 2.2 });
}
claimRun(runs[0]);

// The landing pad: south-east, on open shelf, with the room a hull needs round it.
add('landing-pad', 50, 76, 10, { minTier: 'T3' });
taken.push({ x: 50, z: 76, r: 21 });
taken.push({ x: 26, z: 82, r: 3 });   // the spur from the spawn road to the pad

/* ---- the plant ---- */
add('separator', 86, -13.2, 6.6, { minTier: 'T3' });
add('silencer-pair', 87, 12, 5.6, { rotY: round(deg(90)), minTier: 'T3' });
add('turbine-hall', -80, 18, 13.4, { minTier: 'T3' });
add('cooling-cells', -76, 52, 10.5, { rotY: round(deg(90)), minTier: 'T3' });
add('transformer', -63, 33, 4.2, { minTier: 'T3' });
// Each pylon is turned square to its line, so the wires leave its arms clear of its frame.
{
  const line = [[-63, 33], [-50, 74], [-24, 103], [6, 116]];
  for (let i = 1; i < line.length; i++) {
    const prev = line[i - 1], next = line[Math.min(line.length - 1, i + 1)];
    const rotY = Math.atan2(next[0] - prev[0], next[1] - prev[1]);
    add('pylon', line[i][0], line[i][1], 3.2, { line: i - 1, rotY: round(rotY), minTier: 'T3' });
  }
}
add('comms-mast', 74, 56, 1.6, { minTier: 'T3' });

// The wellheads, each tied into the main by an elevated spur.
function well(x, z) {
  // The spur leaves the well toward the nearest point of the main.
  const a = Math.atan2(x, z);
  const mx = PIPE_R * Math.sin(a), mz = PIPE_R * Math.cos(a);
  const d = Math.hypot(mx - x, mz - z);
  const ux = (mx - x) / d, uz = (mz - z) / d;
  // Turned so the well's own +x (its flowline) faces the main.
  const rotY = Math.atan2(-uz, ux);
  add('wellhead', x, z, 3.4, { rotY: round(rotY), minTier: 'T3' });
  // The riser stands on the end of the well's flowline (which tops out at 1.82 m).
  const sx = x + ux * 2.0, sz = z + uz * 2.0;
  const run = {
    id: `spur-${landmarks.length}`, radius: 0.3,
    points: [[round(sx), 1.84, round(sz)], [round(sx), PIPE_Y, round(sz)], [round(mx), PIPE_Y, round(mz)]]
  };
  runs.push(run);
  claimRun({ ...run, points: run.points.slice(1) }, 1.2);
}
well(50, -74);
well(-56, -70);
well(56, -38);

/* ---- the Fifth's siphon, clamped to the main on the overlook ---- */
{
  const a = deg(204);
  const R = 82.2;
  const x = R * Math.sin(a), z = R * Math.cos(a);
  // Long axis along the main's tangent.
  const tx = Math.cos(a), tz = -Math.sin(a);
  const rotY = Math.atan2(-tz, tx);
  add('siphon-manifold', x, z, 4.6, { rotY: round(rotY), minTier: 'T3' });
  // Two taps: out from the main and down onto the exchanger's nozzles.
  for (const s of [-2.2, 2.2]) {
    const nx = x + tx * s, nz = z + tz * s;
    const ux = Math.sin(a), uz = Math.cos(a);
    const mx = nx - ux * (R - PIPE_R), mz = nz - uz * (R - PIPE_R);
    runs.push({
      id: `tap-${s > 0 ? 'b' : 'a'}`, radius: 0.26,
      points: [[round(mx), PIPE_Y, round(mz)], [round(nx), PIPE_Y, round(nz)], [round(nx), 2.32, round(nz)]]
    });
  }
}

/* ---- the vent field round the spring ---- */
add('geyser', -21, -22, 4.6, { minTier: 'T3' });
add('mud-pot', 25, -16, 3.2, { minTier: 'T3' });
add('mud-pot', 21, 22, 2.8, { scale: 0.85, minTier: 'T3' });
add('sinter-terrace', -25, 9, 5.2, { scale: 1.0, rotY: 0.4, minTier: 'T3' });
add('sinter-terrace', 7, -27, 4.4, { scale: 0.82, rotY: 2.1, minTier: 'T3' });
add('sinter-terrace', 31, -9, 4.6, { scale: 0.88, rotY: 4.0, minTier: 'T3' });
add('habitat', -36, 86, 6, { rotY: round(deg(160)), minTier: 'T3' });
add('habitat', -64, 77, 6, { rotY: round(deg(120)), minTier: 'T3' });

function scatter(asset, count, test, radius, extra = () => ({})) {
  let placed = 0;
  for (let k = 0; k < 6000 && placed < count; k++) {
    const x = (rnd() - 0.5) * 230, z = (rnd() - 0.5) * 230;
    if (!test(x, z)) continue;
    if (!fits(x, z, radius)) continue;
    add(asset, x, z, radius, extra());
    placed++;
  }
  return placed;
}
const ring = (lo, hi) => (x, z) => { const d = Math.hypot(x, z); return d > lo && d < hi; };
const walk = (x, z) => Math.abs(x) < 94 && Math.abs(z) < 94;
const north = (x, z) => z < -40 && walk(x, z);

// Fumaroles: thickest toward the rim, where the ground is hottest; a few round the spring.
scatter('fumarole', 9, (x, z) => north(x, z) && Math.abs(x) > 14, 2.3, () => ({ scale: round(0.8 + rnd() * 0.6), minTier: 'T3' }));
scatter('fumarole', 4, ring(19, 33), 2.0, () => ({ scale: round(0.7 + rnd() * 0.35), minTier: 'T3' }));
scatter('fumarole', 6, (x, z) => ring(60, 100)(x, z) && walk(x, z), 2.3, () => ({ scale: round(0.8 + rnd() * 0.6), minTier: 'T3' }));
// Sulfur mounds and lava lobes: decoration on the inner field, ground cover on the outer.
scatter('sulfur-mound', 7, (x, z) => (ring(18, 34)(x, z) || north(x, z)), 1.6, () => ({ scale: round(0.8 + rnd() * 0.5), rotY: round(rnd() * 6.28), minTier: 'T4' }));
scatter('lava-lobe', 10, (x, z) => ring(84, 118)(x, z) && z > -70, 4.6, () => ({ scale: round(0.8 + rnd() * 0.5), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('lava-lobe', 4, (x, z) => ring(58, 74)(x, z) && z > -30, 3.6, () => ({ scale: round(0.6 + rnd() * 0.3), rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('crate-stack', 3, (x, z) => Math.hypot(x - 76, z + 2) < 14 || Math.hypot(x + 64, z - 4) < 10, 2.0, () => ({ rotY: round(rnd() * 6.28), minTier: 'T3' }));
scatter('drum-rack', 3, (x, z) => Math.hypot(x - 72, z - 30) < 16 || Math.hypot(x + 60, z + 14) < 12, 1.8, () => ({ rotY: round(rnd() * 6.28), minTier: 'T4' }));
// Temperature survey stakes: somebody walked the field with a probe.
scatter('probe-stake', 12, (x, z) => ring(17, 96)(x, z) && walk(x, z), 0.4, () => ({ minTier: 'T4' }));
// The rail's two ends stand on boulders, so the overlook does not stop in mid-air.
for (const sx of [-1, 1]) {
  const x = sx * 87, z = RIM.cz + Math.sqrt(RIM.rail * RIM.rail - 80 * 80) + 2;
  landmarks.push({ asset: 'lava-lobe', pos: [round(x), 0, round(z)], radius: 4.4, scale: 1.1, rotY: round(rnd() * 6.28), minTier: 'T3' });
}

/* -------------------------------------------------------------- the lamps */

const POSTS = 26;
for (let i = 0; i < POSTS; i++) {
  const a = (i / POSTS) * Math.PI * 2 + 0.06;
  const r = ROAD + 2.4;
  const x = r * Math.sin(a), z = r * Math.cos(a);
  // Keep the posts off the spokes and the lane.
  if (sites.some(s => Math.hypot(x - s.approachPos[0] * (r / Math.hypot(s.approachPos[0], s.approachPos[2])), z - s.approachPos[2] * (r / Math.hypot(s.approachPos[0], s.approachPos[2]))) < 3.4)) continue;
  if (Math.abs(x) < 4 && Math.abs(z) > 30) continue;
  landmarks.push({ asset: 'lamp-post', pos: [round(x), 0, round(z)], radius: 0.6, minTier: 'T3' });
}
// And down the spawn road and the lane to the rim.
for (const z of [48, 60, 72]) for (const x of [-3.6, 3.6]) landmarks.push({ asset: 'lamp-post', pos: [x, 0, z], radius: 0.6, minTier: 'T3' });
for (const z of [-52, -58]) for (const x of [-7.4, 7.4]) landmarks.push({ asset: 'lamp-post', pos: [x, 0, z], radius: 0.6, minTier: 'T3' });

/* ---------------------------------------------------------------- self-check */

let problems = 0;
const bad = msg => { problems++; console.error(`  LAYOUT: ${msg}`); };
const nm = l => `${l.asset}@${l.pos[0]},${l.pos[2]}`;
const rectOverlap = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
// Every free prop (and a lamp post) stands clear of every host's real extent and lane. The wellheads, the plant and the explicit
// vent field are placed by hand, so this is where a hand-placed one is caught.
for (const l of landmarks) {
  for (const k of KEEP) if (rectDist(l.pos[0], l.pos[2], k) < l.radius + (k.margin > 0.5 ? 0.3 : 0.05) - 0.001) bad(`${nm(l)} stands in the ${k.name} keep-out`);
}
// The hosts' extents do not touch each other (one host's own pieces and lane may), and none touches the spring, the rail, the pipe or the boss's ground.
for (let i = 0; i < KEEP.length; i++) for (let j = i + 1; j < KEEP.length; j++) {
  const a = KEEP[i], b = KEEP[j];
  if (a.owner && a.owner === b.owner) continue;
  if (rectOverlap(a, b)) bad(`${a.name} and ${b.name} extents overlap`);
}
for (const d of SITE_DEFS) {
  const [x0, x1, z0, z1] = HOST_PLAN[d.id].extent;
  for (const [lx, lz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    const [x, z] = toWorld(d, lx, lz);
    if (Math.hypot(x, z) < SPRING + 3.2) bad(`${d.id} reaches ${Math.hypot(x, z).toFixed(1)} m from the spring's middle (its bowl and lip stand to ${SPRING + 3.2})`);
    if (railDist(x, z) < 2) bad(`${d.id} reaches the rim's rail`);
  }
}
for (const k of KEEP.filter(k => !/approach/.test(k.name))) {
  for (const seg of segs) if (rectDist(seg.a[0], seg.a[1], k) < seg.r - 1.0 || rectDist(seg.b[0], seg.b[1], k) < seg.r - 1.0) bad(`${k.name} stands under the caldera main`);
  if (rectDist(ARENA.boss[0], ARENA.boss[2], k) < 11) bad(`${k.name} reaches the Crucible's ground`);
}
// Sites 8 apart, at least; every approach is on the shelf and clear of the spring.
for (let i = 0; i < sites.length; i++) for (let j = i + 1; j < sites.length; j++) {
  const got = Math.hypot(sites[i].pos[0] - sites[j].pos[0], sites[i].pos[2] - sites[j].pos[2]);
  if (got < 8) bad(`${sites[i].id} and ${sites[j].id} are ${got.toFixed(1)} apart`);
}
if (problems) { console.error(`${problems} layout problem(s); nothing written.`); process.exit(1); }

/* ---------------------------------------------------------------- the world */

const world = {
  id: 'ember',
  name: 'Ember Reach',
  place: 'Volcanic vent field',
  oneLine: 'Heat into and out of a cup, the energy in bonds, and why some changes run on their own.',
  sky: 'ember-sky',
  terrain: { heightmap: 'ember-sinter', size: [240, 240], maxHeight: 2.0, material: 'sinter-crust' },
  ambience: {
    keyLight: 0xffcf9a,
    fillLight: 0xc4a47c,
    fogColor: 0x9c8466,
    fogNear: 50,
    fogFar: 600,
    dustDensity: 0.5
  },
  spring: { x: 0, z: 0, radius: SPRING },
  road: { radius: ROAD },
  rim: RIM,
  floor: { level: -28 },
  lake: { x: -30, z: -170, rx: 46, rz: 28 },
  cone: { x: 72, z: -330, radius: 125, height: 175, crater: 16 },
  arena: ARENA,
  pipes: runs,
  landmarks,
  sites,
  spawn: { pos: [0, 1.6, 88], lookAt: [0, 1.6, 40] },
  t2: { stillCamera: Object.fromEntries(sites.map(s => [s.id, { pos: s.approachPos, lookAt: [s.pos[0], 1.2, s.pos[2]] }])) },
  t1: {
    siteOrder: sites.map(s => s.id)
  },
  tracks: []
};

writeFileSync(join(root, 'src/three/world-data/ember.json'), JSON.stringify(world, null, 2) + '\n');
const count = a => landmarks.filter(l => l.asset === a).length;
console.log(`Ember Reach: ${landmarks.length} landmarks (${count('fumarole')} fumaroles, ${count('lamp-post')} lamps, ${count('lava-lobe')} lava lobes), ${sites.length} sites, ${runs.length} pipe runs written.`);
