/**
 * cinderhalo/plant.js — What stands on Cinder Halo outside its six cells: the landing pad, a lamp at each cutting's mouth and each cell's
 * vestibule, the Transmutation Core on the great crater's floor, and the far country that nobody walks to. Each builder takes `ctx`
 * ({ M, own, lamps, t4, field }) and returns a Group with its origin on the ground and `userData.colliders = [{ x, z, r }]` in its own frame.
 *
 * NOTHING IS SCATTERED. A thing is here because the place needs it: a lamp where the way turns, the reactor the works were built round.
 */

import * as THREE from 'three';
import { part, between, rng } from '../ember/kit.js';
import { PLAIN } from './site-plan.js';

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

const cyl = (ctx, g, rt, rb, h, mat, x, y, z, seg = 12, cast = true) => { const m = part(ctx, new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, { cast }); g.add(m); return m; };
const box = (ctx, g, w, h, d, mat, x, y, z, cast = true) => { const m = part(ctx, new THREE.BoxGeometry(w, h, d), mat, x, y, z, { cast }); g.add(m); return m; };

/**
 * The Transmutation Core: a containment dome of ribbed concrete split open down one side, the steel reactor vessel standing in it with its
 * head lifted off and lying on the floor, and a ring of fallen roof plates. Origin at the dome's centre on the floor; the split faces +z.
 */
export function buildCore(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  const R = 8;
  // The dome's cylinder wall, in staves, with a gap of four staves toward +z where it split.
  const N = 24;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2);
    if (Math.abs(Math.sin(a) - 1) < 0.12) continue;
    const h = 7 + (k < 0.6 ? -3.5 + k * 4 : 0) + ((i * 7) % 5) * 0.2;
    const st = box(ctx, g, (2 * Math.PI * R) / N + 0.08, h, 1.1, i % 3 ? M.concrete : M.concreteDark, Math.cos(a) * R, h / 2, Math.sin(a) * R);
    st.rotation.y = -a + Math.PI / 2;
  }
  // The dome itself, a broken shell over the back half.
  const shell = part(ctx, new THREE.SphereGeometry(R + 0.4, 24, 10, Math.PI * 0.15, Math.PI * 1.2, 0, Math.PI / 2), M.concreteDark, 0, 6.8, 0, { cast: true });
  shell.material = M.concreteDark;
  g.add(shell);
  // The reactor vessel and its lifted head.
  cyl(ctx, g, 2.6, 2.6, 9, M.darkSteel, 0, 4.5, -1.5, 18);
  for (let y = 1; y < 9; y += 2) cyl(ctx, g, 2.75, 2.75, 0.35, M.steel, 0, y, -1.5, 18);
  const head = cyl(ctx, g, 2.9, 2.9, 1.2, M.steel, 3.6, 0.9, 3.2, 18);
  head.rotation.set(0.35, 0, 0.6);
  // Control-rod drives sticking up out of the open vessel, some bent.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.add(between(ctx, [Math.cos(a) * 1.4, 8.8, -1.5 + Math.sin(a) * 1.4], [Math.cos(a) * (1.6 + (i % 3) * 0.6), 11 + (i % 2), -1.5 + Math.sin(a) * (1.6 + (i % 3) * 0.6)], 0.12, M.brass, 6));
  }
  // Fallen roof plates, thrown out to either side of the split (the floor ends close behind the dome).
  const PLATES = [0.25, 0.65, 1.05, Math.PI - 1.05, Math.PI - 0.65, Math.PI - 0.25];
  PLATES.forEach((a, i) => {
    const r = R + 3.4 + (i % 2) * 0.8;
    const p = box(ctx, g, 3.4, 0.4, 2.2, i % 2 ? M.rusted : M.darkSteel, Math.cos(a) * r, 0.5, Math.sin(a) * r);
    p.rotation.set(0.2 * ((i % 3) - 1), a, 0.12 * ((i % 2) * 2 - 1));
  });
  g.userData.colliders = [{ x: 0, z: 0, r: R + 1.4 }];
  PLATES.forEach((a, i) => { const r = R + 3.4 + (i % 2) * 0.8; g.userData.colliders.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, r: 1.9 }); });
  return g;
}

/**
 * The far country, one landmark to each quarter, all beyond the walk and none of it solid (`phys: 'ambient'`):
 *   north  the broken shell of a cooling tower on the plain
 *   east   a line of transmission pylons, two of them fallen, one loose cable swinging
 *   south  the reactor's tall stack beyond the great crater
 *   west   a field of small craters, a Fifth hull grounded in one
 * Returns the group and the things that move.
 */
export function buildVista(ctx) {
  const { M } = ctx;
  const g = new THREE.Group();
  g.name = 'cinderhalo-vista';
  g.userData.phys = 'ambient';
  const r = rng(0x1404);
  const movers = [];
  const y0 = PLAIN - 1;

  // North: a cooling tower's shell, broken at its lip, in staves of concrete.
  {
    const cx = -40; const cz = 230; const H = 90; const N = 36;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const h = H - (i > 4 && i < 12 ? 18 + (i % 3) * 6 : 0);
      for (let s = 0; s < 3; s++) {
        const y = (s + 0.5) * (h / 3); const t = y / H;
        const rr = 40 - 18 * Math.sin(Math.PI * Math.min(1, t * 0.9)) + (t > 0.75 ? 5 * (t - 0.75) * 4 : 0);
        const st = box(ctx, g, (2 * Math.PI * rr) / N + 0.6, h / 3 + 0.2, 1.2, i % 4 ? M.concrete : M.concreteDark, cx + Math.cos(a) * rr, y0 + y, cz + Math.sin(a) * rr, false);
        st.rotation.y = -a + Math.PI / 2;
      }
    }
  }
  // East: pylons in a line, two lying on their sides.
  for (let i = 0; i < 7; i++) {
    const x = 170 + (i % 2) * 6; const z = -160 + i * 52;
    const fallen = i === 2 || i === 5;
    const p = new THREE.Group();
    for (const [sx, sz] of [[-3, -3], [3, -3], [3, 3], [-3, 3]]) p.add(between(ctx, [sx, 0, sz], [sx * 0.25, 30, sz * 0.25], 0.25, M.darkSteel, 4));
    p.add(between(ctx, [-8, 24, 0], [8, 24, 0], 0.3, M.darkSteel, 4));
    p.add(between(ctx, [-5, 29, 0], [5, 29, 0], 0.25, M.darkSteel, 4));
    p.position.set(x, y0, z);
    if (fallen) { p.rotation.set(0, 0.4, Math.PI / 2 - 0.12); p.position.y = y0 + 3; }
    g.add(p);
    if (i === 4) {
      const cable = new THREE.Group();
      cable.position.set(x - 8, y0 + 24, z);
      cable.add(between(ctx, [0, 0, 0], [0, -16, 0], 0.12, M.darkSteel, 4));
      cable.userData.noMerge = true;
      cable.userData.phase = 0.7;
      g.add(cable);
      movers.push(cable);
    }
  }
  // South: the reactor's stack, banded, beyond the great crater.
  cyl(ctx, g, 4.5, 7, 120, M.concrete, 30, y0 + 60, -230, 16, false);
  for (let y = 20; y < 120; y += 25) cyl(ctx, g, 5.6 - y * 0.012, 5.6 - y * 0.012, 3, M.concreteDark, 30, y0 + y, -230, 16, false);
  // West: small craters' raised rims, and a grounded hull in one.
  for (let i = 0; i < 9; i++) {
    const x = -170 - r() * 120; const z = -140 + r() * 300; const rr = 12 + r() * 16;
    const rim = part(ctx, new THREE.TorusGeometry(rr, 2.2 + r() * 1.2, 5, 22), M.cinderRock, x, y0, z);
    rim.rotation.x = Math.PI / 2;
    rim.scale.z = 0.6;
    g.add(rim);
  }
  {
    const hull = new THREE.Group();
    hull.add(part(ctx, new THREE.CylinderGeometry(9, 12, 70, 10), M.darkSteel, 0, 0, 0));
    hull.add(part(ctx, new THREE.ConeGeometry(9, 22, 10), M.rusted, 0, 46, 0));
    for (const s of [-1, 1]) hull.add(part(ctx, new THREE.BoxGeometry(30, 1.6, 14), M.darkSteel, s * 18, -20, 0));
    hull.rotation.set(Math.PI / 2 - 0.25, 0.8, 0.3);
    hull.position.set(-210, y0 + 4, 40);
    g.add(hull);
  }
  return { group: g, movers };
}
