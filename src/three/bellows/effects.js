/**
 * bellows/effects.js — The moving air over the deck.
 *
 * Two things move of their own accord in Bellows besides the cloud and the
 * Compressor's own rod and wheel. Spindrift: pale wisps of cloud torn off the sea
 * and blown across the deck, wrapped round the eye so the player is always
 * standing in them. And the plumes: steam off the exhaust stack and the vent
 * stacks, rising from each mouth, spreading and thinning with age.
 *
 * They are SMALL, SOFT and DIM: nothing blooms, and no point is bright enough to
 * read as a lamp (CLAUDE.md §1).
 */

import * as THREE from 'three';

const WISPS = 360;
const SPAN = 40;        // the box round the eye the spindrift lives in, metres
const PUFFS = 26;       // per plume

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {{ heightAt?: Function, t4?: boolean, vents?: number[][] }} opts vents are world-space mouths */
export function createBellowsEffects({ heightAt, t4 = false, vents = [] } = {}) {
  const group = new THREE.Group();
  group.name = 'bellows-effects';

  /* ---- spindrift ---- */
  const n = t4 ? WISPS : 90;
  const r = rng(0xb3110);
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (r() - 0.5) * SPAN;
    pos[i * 3 + 1] = r() * 9;
    pos[i * 3 + 2] = (r() - 0.5) * SPAN;
    seed[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
  const mat = new THREE.PointsMaterial({
    color: 0xe9eef7, size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.28,
    depthWrite: false, fog: false
  });
  const wisps = new THREE.Points(geo, mat);
  wisps.frustumCulled = false;
  wisps.userData.phys = 'ambient';
  wisps.userData.noWeather = true;
  group.add(wisps);

  /* ---- plumes ---- */
  const plumeN = vents.length * PUFFS;
  const pgeo = new THREE.BufferGeometry();
  const ppos = new Float32Array(plumeN * 3);
  const page = new Float32Array(plumeN);
  const pr = rng(0x57ea3);
  for (let i = 0; i < plumeN; i++) page[i] = pr();
  pgeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const pmat = new THREE.PointsMaterial({
    color: 0xf2f4f8, size: 1.5, sizeAttenuation: true, transparent: true, opacity: 0.2,
    depthWrite: false, fog: false
  });
  const plumes = new THREE.Points(pgeo, pmat);
  plumes.frustumCulled = false;
  plumes.userData.phys = 'ambient';
  plumes.userData.noWeather = true;
  if (plumeN) group.add(plumes);

  const live = geo.attributes.position;
  const plive = pgeo.attributes.position;
  const wind = new THREE.Vector2(0.9, 0.35);

  return {
    group,
    setViewportHeight() {},
    update(delta, time, cameraPos) {
      if (cameraPos) {
        const ground = heightAt ? heightAt(cameraPos.x, cameraPos.z) : 0;
        for (let i = 0; i < n; i++) {
          const s = seed[i];
          let x = pos[i * 3] + (wind.x * (0.6 + s)) * delta * 2.2;
          let y = pos[i * 3 + 1] + Math.sin(time * 0.4 + s * 30) * 0.004;
          let z = pos[i * 3 + 2] + (wind.y * (0.6 + s)) * delta * 2.2;
          if (x > SPAN / 2) x -= SPAN; else if (x < -SPAN / 2) x += SPAN;
          if (z > SPAN / 2) z -= SPAN; else if (z < -SPAN / 2) z += SPAN;
          pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
          live.setXYZ(i, cameraPos.x + x, ground + 0.4 + y, cameraPos.z + z);
        }
        live.needsUpdate = true;
      }
      // Each puff rises from its vent, drifting down the wind and widening as it ages.
      for (let v = 0; v < vents.length; v++) {
        const [vx, vy, vz] = vents[v];
        for (let k = 0; k < PUFFS; k++) {
          const i = v * PUFFS + k;
          const age = (page[i] + time * 0.11) % 1;
          const spread = age * 3.2;
          const a = (i * 2.399) % (Math.PI * 2);
          plive.setXYZ(
            i,
            vx + wind.x * age * 14 + Math.cos(a) * spread,
            vy + age * 16 + Math.sin(a * 1.7) * spread * 0.4,
            vz + wind.y * age * 14 + Math.sin(a) * spread
          );
        }
      }
      if (plumeN) plive.needsUpdate = true;
      mat.opacity = 0.24 + 0.05 * Math.sin(time * 0.7);
    },
    dispose() { geo.dispose(); mat.dispose(); pgeo.dispose(); pmat.dispose(); }
  };
}
