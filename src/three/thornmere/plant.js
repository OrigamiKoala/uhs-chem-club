/**
 * thornmere/plant.js — What stands on Thornmere outside its six rooms: the landing pad, a lamp at each door and ridge, the Fifth's gate on
 * the last mound, and the far country that nobody walks to. Each builder takes `ctx` ({ M, own, lamps, t4, field }) and returns a Group
 * with its origin on the ground and `userData.colliders = [{ x, z, r }]` in its own frame.
 *
 * NOTHING IS SCATTERED. A thing is here because the place needs it: a lamp where the way turns, the gate the armour belongs to.
 */

import * as THREE from 'three';
import { part, between, rng } from '../ember/kit.js';
import { MOUNDS, TAR_LEVEL } from './site-plan.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 12, cast = true) => { const m = part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast }); g.add(m); return m; };
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => { const m = part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast }); g.add(m); return m; };

/**
 * The gate of the Fifth's fortress, standing across the back of the last mound: two towers of stump, and between them a wall hung with
 * overlapping plates of armour, the Carapace. Its origin is the middle of the wall's foot; it faces +z.
 */
export function buildCarapaceGate(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    cyl(ctx, g, 2.6, 3.4, 13, M.bark, s * 11.5, 6.5, 0, 12);
    cyl(ctx, g, 3.0, 2.6, 1.2, M.darkSteel, s * 11.5, 13.4, 0, 12);
  }
  box(ctx, g, 20, 10.5, 1.6, M.barkDark, 0, 5.25, -0.6);
  // The plates: four courses, each overlapping the one below like scales.
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 6; i++) {
      const x = -8.3 + i * 3.32 + (row % 2 ? 1.2 : 0);
      if (Math.abs(x) > 9.4) continue;
      const p = box(ctx, g, 3.1, 3.0, 0.32, (i + row) % 3 ? M.armour : M.armourDark, x, 1.6 + row * 2.45, 0.42 + row * 0.02);
      p.rotation.x = -0.09;
    }
  }
  box(ctx, g, 21, 0.7, 2.2, M.darkSteel, 0, 10.8, -0.5);
  g.userData.colliders = [];
  for (let x = -13; x <= 13; x += 1.6) g.userData.colliders.push({ x, z: -0.2, r: 1.3 });
  for (const s of [-1, 1]) g.userData.colliders.push({ x: s * 11.5, z: 0, r: 3.5 });
  return g;
}

/** The tar: one level sheet out to the horizon. */
export function buildTar(ctx) {
  const m = new THREE.Mesh(ctx.own(new THREE.CircleGeometry(900, 48)), ctx.M.tar);
  m.rotation.x = -Math.PI / 2;
  m.position.y = TAR_LEVEL;
  m.name = 'tar';
  m.receiveShadow = ctx.t4;
  m.userData.phys = 'ambient';
  m.userData.noWeather = true;
  return m;
}

/**
 * The far country, one landmark to each quarter, all beyond the walk and none of it solid (`phys: 'ambient'`):
 *   north  the drowned forest: bare snags standing in the tar to the horizon
 *   east   a line of pump towers on stilts, their beams nodding
 *   south  the fortress behind the gate, plated, and one living giant over it
 *   west   a trunk fallen across two far mounds, and a cone of pitch with a seep down its side
 * Returns the group and the beams that move.
 */
export function buildVista(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  g.name = 'thornmere-vista';
  g.userData.phys = 'ambient';
  const r = rng(0x7402);
  const movers = [];

  // North: snags. Tapered, leaning a little, a few with a broken limb.
  for (let i = 0; i < 46; i++) {
    const x = -260 + r() * 520; const z = 130 + r() * 330;
    const h = 38 + r() * 34; const rb = 2.2 + r() * 2.4;
    const t = cyl(ctx, g, rb * 0.25, rb, h, r() < 0.5 ? M.bark : M.barkDark, x, TAR_LEVEL + h / 2 - 1, z, 7, false);
    t.rotation.set((r() - 0.5) * 0.12, r() * 6, (r() - 0.5) * 0.12);
    if (r() < 0.45) g.add(between(ctx, [x, TAR_LEVEL + h * 0.55, z], [x + (r() - 0.5) * 16, TAR_LEVEL + h * 0.55 + 7 + r() * 5, z + (r() - 0.5) * 16], rb * 0.2, M.barkDark, 5));
  }
  // A few nearer snags either side of the walk, still out of reach.
  for (const [x, z, h] of [[-84, 96, 30], [78, 104, 36], [-100, 6, 28], [96, -8, 33], [-98, -96, 31], [86, 78, 27]]) {
    const t = cyl(ctx, g, 0.7, 2.6, h, M.bark, x, TAR_LEVEL + h / 2 - 1, z, 8, false);
    t.rotation.z = (r() - 0.5) * 0.1;
  }

  // East: pump towers on stilts in a line, each with a walking beam.
  for (let i = 0; i < 6; i++) {
    const x = 150 + i * 14; const z = -120 + i * 46;
    for (const [sx, sz] of [[-3, -3], [3, -3], [3, 3], [-3, 3]]) g.add(between(ctx, [x + sx, TAR_LEVEL - 1, z + sz], [x + sx * 0.5, 9, z + sz * 0.5], 0.3, M.darkSteel, 5));
    box(ctx, g, 7, 0.5, 7, M.rusted, x, 9.2, z, false);
    g.add(between(ctx, [x, 9.4, z], [x, 15, z], 0.35, M.darkSteel, 6));
    const beam = new THREE.Group();
    beam.position.set(x, 15, z);
    beam.add(part(ctx, new THREE.BoxGeometry(0.7, 0.9, 13), M.rusted, 0, 0, 0));
    beam.add(part(ctx, new THREE.BoxGeometry(1.1, 2.6, 1.4), M.darkSteel, 0, -0.9, 6));
    beam.userData.noMerge = true;
    beam.userData.phase = i * 1.3;
    g.add(beam);
    movers.push(beam);
  }

  // South: the fortress beyond the gate, and the living giant over it.
  const G = MOUNDS.M7;
  box(ctx, g, 150, 26, 30, M.barkDark, G.x + 10, 12, -150, false);
  for (let i = 0; i < 9; i++) box(ctx, g, 15, 20, 1.2, i % 2 ? M.armour : M.armourDark, G.x - 56 + i * 16.4, 13, -134.2, false);
  for (const sx of [-70, 88]) cyl(ctx, g, 9, 11, 40, M.bark, G.x + sx, 19, -148, 10, false);
  cyl(ctx, g, 9, 16, 150, M.bark, G.x + 30, 72, -230, 12, false);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.add(between(ctx, [G.x + 30, 120, -230], [G.x + 30 + Math.cos(a) * 70, 150 + (i % 3) * 12, -230 + Math.sin(a) * 70], 3.2, M.barkDark, 6));
  }

  // West: a trunk fallen across two far mounds, and a cone of pitch with a seep.
  for (const z of [-30, 60]) { const m = part(ctx, new THREE.SphereGeometry(26, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.pitch, -190, TAR_LEVEL - 4, z); m.scale.y = 0.42; g.add(m); }
  g.add(between(ctx, [-192, 9.5, -44], [-186, 11.5, 74], 6.5, M.bark, 10));
  const cone = cyl(ctx, g, 4, 44, 34, M.pitch, -230, TAR_LEVEL + 16, -150, 14, false);
  cone.rotation.y = 0.4;
  g.add(between(ctx, [-228, TAR_LEVEL + 33, -148], [-204, TAR_LEVEL + 1, -128], 1.6, M.tar, 6));
  return { group: g, movers };
}
