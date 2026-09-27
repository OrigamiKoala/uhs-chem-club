/**
 * vista.js — what stands beyond the walk on Ligar.
 *
 * Nothing here is a place a player can reach: it is all `phys: 'ambient'`,
 * outside the ±100 m walk, and exists to give the quarry SCALE — the thing a
 * toy world never has. Three depth planes do the work: the far country and
 * the volcano in the sky (atmosphere.js); the trap benches climbing away
 * (terrain.js); and between them, here, bodies at 120–450 m whose parallax
 * the player sees as they walk:
 *
 *   - THE ORGAN PIPES. Spires of columnar basalt standing straight out of
 *     the plain, thirty and forty metres tall — the cores of old flows the
 *     plain has weathered away from, each a bundle of hundreds of columns
 *     with its talus skirt. They are the thing a player looks up at.
 *   - THE GREAT ARCH. Far out on the western benches, a natural arch eighty
 *     metres across, built exactly as the three near ones are — so a player
 *     who has stood under one knows, without being told, how big this is.
 *   - THE WORKS (industry.js): the smelter this quarry feeds, its stacks
 *     still drawing, the power line that runs to it, and the dragline that
 *     dug the benches and was walked out onto the plain and left.
 *
 * All the rock is the column kit (basalt.js) at vista fidelity — no drums,
 * because at two hundred metres a cross-fracture is a pixel — merged into one
 * mesh on the same two materials the near rock uses.
 *
 * `buildLigarVista(ctx)` returns { group, vents, update, dispose }: `vents`
 * are stack mouths { x, y, z, size, rate } the effects layer blows smoke from.
 */

import * as THREE from 'three';
import { RockBuilder, columnRaft, basaltArch, rubbleField } from './basalt.js';
import { buildLigarIndustry } from './industry.js';

/** Bearing (radians, atan2(z, x)), distance, radius, height of each spire. */
const SPIRES = [
  { bearing: 2.62, dist: 132, radius: 7.5, height: 34, pitch: 1.05 },
  { bearing: 2.78, dist: 150, radius: 5.0, height: 26, pitch: 0.9 },
  { bearing: -1.95, dist: 128, radius: 8.5, height: 40, pitch: 1.15 },
  { bearing: -1.72, dist: 146, radius: 4.6, height: 22, pitch: 0.85 },
  { bearing: 1.05, dist: 138, radius: 6.8, height: 30, pitch: 1.0 },
  { bearing: 0.2, dist: 170, radius: 5.5, height: 24, pitch: 0.95 }
];

/** The great arch: bearing, distance, half-span, facing. */
const GREAT_ARCH = { bearing: -2.55, dist: 330, R: 40, yaw: 0.9 };

export function buildLigarVista({ heightAt, t4, rockMats, own }) {
  const group = new THREE.Group();
  group.name = 'ligar-vista';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;

  const rb = new RockBuilder();

  for (const [i, s] of SPIRES.entries()) {
    const x = Math.cos(s.bearing) * s.dist;
    const z = Math.sin(s.bearing) * s.dist;
    const y0 = heightAt(x, z);
    const ground = (lx, lz) => heightAt(lx, lz) - y0;
    // Built in world x/z so each column founds on the ground under it, then
    // lifted by the ground at the centre (the builder works relative to it).
    const sub = new RockBuilder();
    columnRaft(sub, {
      radius: s.radius, x0: x, z0: z, height: s.height, pitch: s.pitch,
      seed: 0x51e0 + i * 77, ground, t4: false, gappy: 0.6, profile: 'dome'
    });
    rubbleField(sub, {
      count: t4 ? 60 : 24,
      minX: x - s.radius * 1.9, maxX: x + s.radius * 1.9,
      minZ: z - s.radius * 1.9, maxZ: z + s.radius * 1.9,
      avoid: [{ minX: x - s.radius * 0.8, maxX: x + s.radius * 0.8, minZ: z - s.radius * 0.8, maxZ: z + s.radius * 0.8 }],
      y: -0.2, seed: 0x7a1 + i, scale: 1.6, mound: 1.6, ground, t4: false
    });
    append(rb, sub, 0, y0, 0);
  }

  {
    const a = GREAT_ARCH;
    const cx = Math.cos(a.bearing) * a.dist;
    const cz = Math.sin(a.bearing) * a.dist;
    const cy = heightAt(cx, cz);
    const c = Math.cos(a.yaw), sn = Math.sin(a.yaw);
    const ground = (lx, lz) => heightAt(cx + lx * c + lz * sn, cz - lx * sn + lz * c) - cy;
    const scale = a.R / 14;
    const footRise = [-a.R, a.R].map(fx => ground(fx, 0));
    const sub = new RockBuilder();
    basaltArch(sub, {
      R: a.R, scale, seed: 0x6a7c, ground, t4: false,
      legDrop: 2.2 * scale + Math.max(0, -Math.min(...footRise))
    });
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(cx, cy, cz),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a.yaw),
      new THREE.Vector3(1, 1, 1)
    );
    appendMatrix(rb, sub, m);
  }

  const rock = rb.toMesh(rockMats, { shadows: false, name: 'vista-rock' });
  own(rock.geometry);
  rock.userData.partBoxes = [];
  group.add(rock);

  const industry = buildLigarIndustry({ heightAt, t4, own });
  group.add(industry.group);

  return {
    group,
    vents: industry.vents || [],
    update: (delta, time) => industry.update?.(delta, time),
    dispose: () => industry.dispose?.()
  };
}

/** Copy one builder's triangles into another, offset. */
function append(dst, src, dx, dy, dz) {
  appendMatrix(dst, src, new THREE.Matrix4().makeTranslation(dx, dy, dz));
}

function appendMatrix(dst, src, m) {
  const v = new THREE.Vector3();
  for (let g = 0; g < 2; g++) {
    const P = src.pos[g];
    for (let i = 0; i < P.length; i += 3) {
      v.set(P[i], P[i + 1], P[i + 2]).applyMatrix4(m);
      dst.pos[g].push(v.x, v.y, v.z);
    }
    for (const u of src.uv[g]) dst.uv[g].push(u);
    for (const k of src.col[g]) dst.col[g].push(k);
  }
}
