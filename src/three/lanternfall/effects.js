/**
 * lanternfall/effects.js — The moving air over the ice: diamond dust.
 *
 * Ice crystals hang in air that cold and turn over slowly in the light, so the
 * air itself glints: a few hundred points round the eye, drifting down and
 * sideways, wrapping so the player is always standing in them. They are the
 * only thing in the world that moves of its own accord besides the aurora, and
 * they are SMALL and DIM: nothing blooms, and no point is bright enough to read
 * as a lamp.
 */

import * as THREE from 'three';

const COUNT = 520;
const SPAN = 36;     // the box round the eye the dust lives in, metres

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createLanternfallEffects({ heightAt, t4 = false } = {}) {
  const group = new THREE.Group();
  group.name = 'lanternfall-effects';
  const n = t4 ? COUNT : 120;
  const r = rng(0x1ce);
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (r() - 0.5) * SPAN;
    pos[i * 3 + 1] = r() * 12;
    pos[i * 3 + 2] = (r() - 0.5) * SPAN;
    seed[i] = r();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3));
  const mat = new THREE.PointsMaterial({
    color: 0xcfe8f2, size: 0.045, sizeAttenuation: true, transparent: true, opacity: 0.55,
    depthWrite: false, fog: false
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.userData.phys = 'ambient';
  points.userData.noWeather = true;
  group.add(points);

  const center = new THREE.Vector3();
  const live = geo.attributes.position;

  return {
    group,
    setViewportHeight() {},
    update(delta, time, cameraPos) {
      if (!cameraPos) return;
      center.copy(cameraPos);
      const ground = heightAt ? heightAt(cameraPos.x, cameraPos.z) : 0;
      for (let i = 0; i < n; i++) {
        const s = seed[i];
        // Drift down and across the wind, turning over slowly.
        const fall = (0.18 + s * 0.2);
        let x = pos[i * 3] + Math.sin(time * 0.3 + s * 40) * 0.06 + delta * 0.35;
        let y = pos[i * 3 + 1] - fall * delta;
        let z = pos[i * 3 + 2] + Math.cos(time * 0.27 + s * 31) * 0.05;
        if (y < -1) y += 12;
        // Wrap round the eye, so the player is always standing in it.
        if (x > SPAN / 2) x -= SPAN; else if (x < -SPAN / 2) x += SPAN;
        if (z > SPAN / 2) z -= SPAN; else if (z < -SPAN / 2) z += SPAN;
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        live.setXYZ(i, center.x + x, ground + 0.2 + y, center.z + z);
      }
      live.needsUpdate = true;
      mat.opacity = 0.42 + 0.14 * Math.sin(time * 0.9);
    },
    dispose() { geo.dispose(); mat.dispose(); }
  };
}
