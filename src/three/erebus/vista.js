/**
 * vista.js — What stands beyond the walk: buttes on the horizon, and the wreck.
 *
 * None of it is reachable and none of it is an object in the basin, so the
 * whole group is `phys: 'ambient'`, like the sky. It is built from the same
 * geology as the stones the player can touch (rocks.js), so the bands on a
 * butte six hundred metres off are the bands on the spire by the rim, at the
 * same altitudes — which is what tells the eye these are the same country, only
 * further away.
 *
 * The wreck is the one thing out there that was made. It is a capital hull,
 * three hundred metres of it, that came down nose first into the dunes long
 * enough ago that the sand has filled its gashes. It is dark, it is huge and it
 * is half gone in the haze, and it is never explained.
 */

import * as THREE from 'three';
import { mergeStatic } from '../materials/pbr-kit.js';
import { hullMaterial } from './surfaces.js';
import { rng, lerp } from './noise.js';
import { columnGeometry } from './rocks.js';
import { loft } from './lander.js';

/** Bearings (radians, from +x toward +z) kept clear of buttes: the wreck stands there. */
const WRECK = { bearing: Math.atan2(-470, -220), dist: 540 };

function butte(seed, x, z, { height, radius, heightAt, rockMat, t4, taper = 0.1, squash = [1, 0.8] }) {
  // Founded below the lowest ground under its footprint.
  let low = Infinity;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    low = Math.min(low, heightAt(x + Math.cos(a) * radius, z + Math.sin(a) * radius));
  }
  const bury = 14;
  const g = columnGeometry(seed, {
    height: height + (heightAt(x, z) - low), radius, baseY: low, taper, cap: 0.05, squash,
    bury, segs: t4 ? 56 : 36, rings: Math.round((height + bury) / (t4 ? 3.2 : 5)),
    gully: 0.3, ledge: 0.045, notch: 0, plan: 0.24, talus: 0.32, talusSpread: 0.6
  });
  const m = new THREE.Mesh(g, rockMat);
  m.position.set(x, low, z);
  m.rotation.y = seed * 1.7;
  return m;
}

function capitalWreck() {
  const group = new THREE.Group();
  const hullMat = hullMaterial({ tint: '#5a524a', grade: 'heavy', dust: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0f0d0b, roughness: 1, metalness: 0.2 });
  const deck = new THREE.MeshStandardMaterial({ color: 0x2b2622, roughness: 0.95, metalness: 0.4 });

  // An arrowhead hull: flat keel, raised centre ridge, sharp prow at +z.
  const sec = (z, w, h) => ({
    z, pts: [[-w, 0], [w, 0], [w * 0.92, h * 0.28], [w * 0.2, h], [-w * 0.2, h], [-w * 0.92, h * 0.28]]
  });
  const L = 300;
  const hull = loft([
    sec(-L / 2, 70, 44), sec(-L / 2 + 30, 74, 46), sec(-20, 58, 38), sec(60, 34, 24), sec(L / 2 - 20, 9, 8), sec(L / 2, 1.5, 2)
  ], { uvScale: 0.03 });
  group.add(new THREE.Mesh(hull, hullMat));

  // The command tower at the stern, stepped.
  const tiers = [[46, 16, 34], [30, 12, 22], [18, 9, 14]];
  let y = 40, z0 = -L / 2 + 38;
  for (const [w, h, d] of tiers) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), deck);
    b.position.set(0, y + h / 2, z0);
    group.add(b);
    y += h; z0 += 3;
  }
  // Trenches of superstructure along the ridge, and the black of torn plating.
  const r = rng(0xcaf);
  for (let i = 0; i < 40; i++) {
    const zz = lerp(-L / 2 + 50, L / 2 - 60, r());
    const f = (zz + L / 2) / L;
    const w = lerp(26, 6, f) * (0.3 + r() * 0.6);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, 2 + r() * 5, 4 + r() * 16), deck);
    box.position.set((r() - 0.5) * lerp(30, 6, f), lerp(40, 10, f), zz);
    group.add(box);
  }
  for (let i = 0; i < 9; i++) {
    const zz = lerp(-L / 2 + 20, L / 2 - 80, r());
    const gash = new THREE.Mesh(new THREE.BoxGeometry(6 + r() * 14, 8 + r() * 10, 10 + r() * 30), dark);
    const side = r() < 0.5 ? -1 : 1;
    gash.position.set(side * lerp(60, 20, (zz + L / 2) / L), 12 + r() * 10, zz);
    group.add(gash);
  }
  // Engine bank at the stern.
  for (let i = -2; i <= 2; i++) {
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 14, 20, 1, true), dark);
    bell.rotation.x = Math.PI / 2;
    bell.position.set(i * 24, 20, -L / 2 - 5);
    group.add(bell);
  }
  mergeStatic(group);
  return group;
}

export function buildVista({ heightAt, rockMat, t4 }) {
  const vista = new THREE.Group();
  vista.name = 'erebus-vista';
  vista.userData.phys = 'ambient';

  /* ---- buttes on the horizon: a broken ring, three deep ---- */
  const r = rng(0x7a5e);
  const placed = [];
  const tries = t4 ? 220 : 120;
  const want = t4 ? 26 : 14;
  for (let i = 0; i < tries && placed.length < want; i++) {
    const bearing = r() * Math.PI * 2;
    const dw = Math.abs(Math.atan2(Math.sin(bearing - WRECK.bearing), Math.cos(bearing - WRECK.bearing)));
    if (dw < 0.32) continue;
    const dist = 240 + Math.pow(r(), 0.7) * 520;
    const radius = lerp(26, 110, Math.pow(r(), 1.6)) * (dist / 520);
    const height = lerp(28, 120, Math.pow(r(), 1.3)) * (0.6 + dist / 900);
    const x = Math.cos(bearing) * dist, z = Math.sin(bearing) * dist;
    if (placed.some(p => Math.hypot(p.x - x, p.z - z) < (p.radius + radius) * 1.15)) continue;
    placed.push({ x, z, radius });
    const tall = height / radius > 1.4;
    vista.add(butte(0x100 + i, x, z, {
      height, radius, heightAt, rockMat, t4,
      taper: tall ? 0.28 : 0.08 + r() * 0.1,
      squash: [1, 0.55 + r() * 0.4]
    }));
  }

  /* ---- the wreck ---- */
  const wreck = capitalWreck();
  const wx = Math.cos(WRECK.bearing) * WRECK.dist, wz = Math.sin(WRECK.bearing) * WRECK.dist;
  wreck.position.set(wx, heightAt(wx, wz) - 30, wz);
  // Nose down into the dunes, rolled, turned across the line of sight.
  wreck.rotation.set(0.2, 0.9, 0.12, 'YXZ');
  vista.add(wreck);

  vista.traverse(o => { if (o.isMesh) { o.receiveShadow = false; o.castShadow = false; } });
  return vista;
}
