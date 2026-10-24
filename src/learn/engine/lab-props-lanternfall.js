/**
 * lab-props-lanternfall.js — solid parts for Lanternfall's spatial ideas (problems doc U1, C10): a wave you can see rise and fall in space, packets
 * of light striking a plate, a beam of light dimmed on its way through a cell, and the rods an electron's arrows are in an orbital box.
 *
 * Same rules as `lab-props.js` (nothing blooms; a lit part is an emissive surface and never a light; weathered metals). Each builder returns a
 * Group on y = 0 and, where its picture follows the table, a `userData.set(...)` the kit's `dress3d` calls from the group's
 * `userData.sync(fixture, state)` (`table3d.js` runs it after every change). The numbers a part is set from come from the kit's own readers, so
 * the solid and the flat picture under it are one fact.
 *
 * Pure over THREE: no DOM, so `verify:bench` builds these in Node.
 */

import * as THREE from 'three';
import { roundedSlab } from './table-props.js';

const mesh = (geo, mat, { cast = true, receive = true } = {}) => {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
};

/** A lit material in `rgb` (0-255 triple): an emissive surface, never a light. */
const glowMat = (c, rgb, intensity = 0.9, extra = {}) => {
  const col = new THREE.Color(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  return c.own(new THREE.MeshStandardMaterial({ color: col.clone().multiplyScalar(0.3), emissive: col, emissiveIntensity: intensity, roughness: 0.4, metalness: 0, ...extra }));
};
const setGlow = (mat, rgb, intensity) => {
  const col = new THREE.Color(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  mat.color.copy(col).multiplyScalar(0.3);
  mat.emissive.copy(col);
  mat.emissiveIntensity = intensity;
};

const NEUTRAL = [196, 186, 164];

/**
 * A wave of light standing over its screen: a thin ribbon whose height follows a cosine along `len` metres, `rise` metres at its crests.
 * `set(crests, rgb)` sets how many crests fit the length and its colour; `set(null)` hides it.
 */
export function buildWaveRibbon(c, { len, rise, width = 0.012 }) {
  const N = 96;
  const g = new THREE.Group();
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 2 * 3);
  const idx = [];
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setIndex(idx);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = glowMat(c, NEUTRAL, 0.7, { side: THREE.DoubleSide });
  const ribbon = mesh(geo, mat, { cast: false, receive: false });
  g.add(ribbon);
  // A rail under each end, so the ribbon is held in something.
  for (const sx of [-1, 1]) {
    const post = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, rise * 1.25, 8), c.mats.labSteel);
    post.position.set(sx * (len / 2 + 0.004), rise * 0.62, 0);
    g.add(post);
  }
  g.userData.height = rise * 1.3;
  g.userData.set = (crests, rgb) => {
    ribbon.visible = crests != null;
    if (crests == null) return;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const x = -len / 2 + len * u;
      const y = rise * 0.5 * (1 + Math.cos(2 * Math.PI * crests * u));
      pos[i * 6] = x; pos[i * 6 + 1] = y; pos[i * 6 + 2] = -width / 2;
      pos[i * 6 + 3] = x; pos[i * 6 + 4] = y; pos[i * 6 + 5] = width / 2;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    setGlow(mat, rgb || NEUTRAL, 0.7);
  };
  g.userData.set(null);
  return g;
};

/**
 * Packets of light in a row over a tube: up to `max` small capsules, `set(n, rgb, size)` shows `n` of them in a colour, as big as `size` (0..1)
 * says. A brighter lamp is more of them and never bigger ones; a higher frequency is bigger ones and never more.
 */
export function buildPhotonRow(c, { len, max = 5 }) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.006, 12, 8);
  const mat = glowMat(c, NEUTRAL, 0.95);
  const items = [];
  for (let i = 0; i < max; i++) {
    const m = mesh(geo, mat, { cast: false, receive: false });
    m.position.set(-len / 2 + (len * (i + 0.5)) / max, 0, ((i % 3) - 1) * 0.008);
    m.visible = false;
    g.add(m);
    items.push(m);
  }
  g.userData.height = 0.02;
  g.userData.set = (n, rgb, size = 0.5) => {
    items.forEach((m, i) => {
      m.visible = i < (n || 0);
      m.scale.set(0.8 + size * 0.9, 0.8 + size * 0.9, 0.8 + size * 0.9);
      m.scale.x *= 1.7;
    });
    if (rgb) setGlow(mat, rgb, 0.95);
  };
  return g;
};

/**
 * A beam of light through a cell: a bar going in whole and a bar coming out, the second as thick and as bright as the share of light that got
 * through, `set(rgb, through)` (`through` in 0..1, `null` hides the bar that comes out when no cell stands in the beam).
 */
export function buildBeamThrough(c, { inLen, outLen, gap }) {
  const g = new THREE.Group();
  const h = 0.008;
  const inMat = glowMat(c, NEUTRAL, 0.9);
  const outMat = glowMat(c, NEUTRAL, 0.9);
  const bin = mesh(new THREE.BoxGeometry(inLen, h, h * 1.4), inMat, { cast: false, receive: false });
  bin.position.set(-gap / 2 - inLen / 2, 0, 0);
  const bout = mesh(new THREE.BoxGeometry(outLen, h, h * 1.4), outMat, { cast: false, receive: false });
  bout.position.set(gap / 2 + outLen / 2, 0, 0);
  g.add(bin, bout);
  g.userData.height = h;
  g.userData.set = (rgb, through) => {
    setGlow(inMat, rgb || NEUTRAL, 0.9);
    bout.visible = through != null;
    if (through == null) return;
    const k = Math.max(0.12, Math.min(1, through));
    bout.scale.set(1, k, k);
    setGlow(outMat, rgb || NEUTRAL, 0.15 + 0.75 * k);
  };
  return g;
};

/**
 * An arrow standing in an orbital box: a rod with a head. An up arrow has its head at the top; a down arrow hangs the other way, with its
 * head at the foot, so the two read differently from the camera.
 */
export function buildArrowRod(c, { up, tall = 0.034 }) {
  const g = new THREE.Group();
  const mat = up ? c.mats.labBrass : c.mats.labCeramic;
  const rod = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, tall, 8), mat);
  rod.position.y = tall / 2;
  g.add(rod);
  const head = mesh(new THREE.ConeGeometry(0.0065, 0.011, 10), mat);
  if (up) { head.position.y = tall + 0.004; } else { head.rotation.x = Math.PI; head.position.y = -0.002; }
  g.add(head);
  g.userData.height = tall + 0.01;
  return g;
};

export { roundedSlab };
