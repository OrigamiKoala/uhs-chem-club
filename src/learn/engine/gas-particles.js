/**
 * gas-particles.js — The gas itself, standing up in space: particles moving in a vessel, bouncing off its walls.
 *
 * WHY THIS FILE EXISTS (the 2026-10-23 Bellows pass, audit U1 and C10). Where shape or position is the idea, the 3D object is the
 * instrument. A gas is the clearest case on the bench: its pressure is particles knocking on a wall, its temperature is how fast they
 * go, its volume is the room they roam in, a mixture is two kinds of them in one vessel, and a leak is some of them finding a hole. A
 * flat picture of a few dots with streaks said all that without letting anyone watch it. So the glass over a cylinder, a chamber or a
 * box is now full of real moving particles, and the numbers they move by are the planners':
 *
 *   - ONE BODY PER DOT. The flat picture draws one dot per twelfth of a mole (`dotsFor`); the field draws the same number, so twice
 *     the gas is twice the particles in both.
 *   - THE SPEEDS ARE THE SPEED SCREEN'S. Each particle takes a speed from the gas's own Maxwell-Boltzmann distribution at its
 *     temperature (`speedBins`, stratified so every picture of one gas at one temperature is the same crowd). Heating speeds each
 *     one up; a lighter gas is faster at one temperature.
 *   - THE ROOM IS THE VOLUME. The vessel's length is the room the planner gives, so squeezing the piston squeezes the crowd.
 *   - THE SIZE IS THE SIZE (stage 'real gases'): `trueSize` draws each particle at the share of the room the planner says it takes.
 *
 * Particles do not collide with one another here (that is the ideal gas, and the picture says so); they knock the walls. Nothing is
 * random at runtime: every position and direction is a hash of the particle's index, so the same gas is the same crowd on every
 * machine. Reduced motion holds the crowd still. Nothing in it is lit: it is bone-coloured beads that catch the table's light.
 *
 * Pure over THREE (no DOM), so `verify:bench` builds it in Node.
 */

import * as THREE from 'three';
import { speedBins, GASES } from './gasdata.js';

/** The kit's own shapes for the gases of a mixture, in the order the gases first appear (circle, square, triangle, diamond). */
const GEOMETRY = {
  circle: () => new THREE.SphereGeometry(1, 10, 8),
  square: () => new THREE.BoxGeometry(1.5, 1.5, 1.5),
  triangle: () => new THREE.TetrahedronGeometry(1.35),
  diamond: () => new THREE.OctahedronGeometry(1.3)
};

function h32(a) {
  a = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
  a = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
  return ((a ^ (a >>> 16)) >>> 0) / 4294967296;
}
/** The same number for the same (particle, purpose) on every machine. */
export const hashUnit = (i, k = 0) => h32((i + 1) * 7919 + (k + 1) * 104729);

/** How fast a picture lets a particle go: metres per second of the gas, as table-plate metres per second. */
export const VISUAL_SPEED = 0.0011;

/**
 * `n` speeds (m/s) of a gas at `T` kelvin, one from each equal slice of its Maxwell-Boltzmann distribution, slowest first. A crowd of
 * these has the shape the speed screen draws, so the picture and the screen are one fact.
 */
export function speedQuantiles(gasKey, T, n, bins = 96) {
  if (n <= 0) return [];
  const vmax = Math.max(900, Math.sqrt((8.314 * T * 2) / (GASES[gasKey].M / 1000)) * 3.4);
  const mass = speedBins(gasKey, T, bins, vmax);
  const total = mass.reduce((a, b) => a + b, 0) || 1;
  const out = [];
  let acc = 0;
  let bin = 0;
  const dv = vmax / bins;
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) / n) * total;
    while (bin < bins - 1 && acc + mass[bin] < u) { acc += mass[bin]; bin++; }
    const frac = mass[bin] > 0 ? (u - acc) / mass[bin] : 0.5;
    out.push((bin + Math.min(1, Math.max(0, frac))) * dv);
  }
  return out;
}

/** Which particle takes which rank: a fixed shuffle, so one particle stays the fast one (or the slow one) as the gas is heated. */
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export function rankOf(i, n) {
  if (n <= 1) return 0;
  // A step of about 0.618 n that shares no factor with n visits every rank exactly once.
  let step = Math.max(1, Math.round(n * 0.6180339887));
  while (gcd(step, n) !== 1) step++;
  return (i * step) % n;
}

/**
 * A field of particles in a box. Make one with `ParticleField.make(THREE-less opts)`, add `field.group` to the scene, call
 * `set(...)` whenever the gas changes and `tick(dt, still)` every frame.
 */
export class ParticleField {
  /**
   * @param {{own: (m: THREE.Material) => THREE.Material, kinds?: {shape: string, color: number}[], cap?: number}} o
   *   `kinds` is one entry per gas in the vessel; `cap` the most particles one kind can hold.
   */
  constructor({ own, kinds = [{ shape: 'circle', color: 0xd6cfb8 }], cap = 72 }) {
    this.group = new THREE.Group();
    this.group.name = 'gas-particles';
    this.cap = cap;
    this.kinds = kinds.map((k, ki) => {
      const mat = own(new THREE.MeshStandardMaterial({ color: k.color, roughness: 0.38, metalness: 0.2 }));
      const mesh = new THREE.InstancedMesh(GEOMETRY[k.shape || 'circle'](), mat, cap);
      mesh.castShadow = false;
      mesh.frustumCulled = false;
      mesh.count = 0;
      mesh.name = `gas-kind-${ki}`;
      this.group.add(mesh);
      return {
        mesh, count: 0,
        pos: new Float32Array(cap * 3), vel: new Float32Array(cap * 3), speed: new Float32Array(cap), dir: new Float32Array(cap * 3)
      };
    });
    this.box = { x0: -0.1, x1: 0.1, y0: 0, y1: 0.1, z0: -0.05, z1: 0.05 };
    this.radius = 0.006;
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.s = new THREE.Vector3();
    this.p = new THREE.Vector3();
    this.seeded = this.kinds.map(() => 0);
    // Directions are fixed per particle: only the speed changes when a gas is heated.
    this.kinds.forEach((k, ki) => {
      for (let i = 0; i < cap; i++) {
        const u = hashUnit(i, 11 + ki * 5) * 2 - 1;
        const a = hashUnit(i, 12 + ki * 5) * Math.PI * 2;
        const r = Math.sqrt(Math.max(0, 1 - u * u));
        k.dir[i * 3] = r * Math.cos(a);
        k.dir[i * 3 + 1] = u;
        k.dir[i * 3 + 2] = r * Math.sin(a);
      }
    });
  }

  /**
   * Set the gas.
   * @param {{box: {x0,x1,y0,y1,z0,z1}, radius: number, groups: {count: number, speeds: number[]}[]}} o
   *   `speeds` are the particles' speeds in m/s, one per particle in rank order (`speedQuantiles`); the field shuffles them with `rankOf`.
   */
  set({ box, radius, groups }) {
    this.box = { ...box };
    this.radius = radius;
    groups.forEach((g, ki) => {
      const k = this.kinds[ki];
      if (!k) return;
      const n = Math.max(0, Math.min(this.cap, Math.round(g.count)));
      for (let i = 0; i < n; i++) {
        const sp = (g.speeds[rankOf(i, n)] ?? g.speeds[g.speeds.length - 1] ?? 0) * VISUAL_SPEED;
        k.speed[i] = sp;
        // The first time a particle appears it starts at its own place in the box.
        if (i >= this.seeded[ki]) {
          k.pos[i * 3] = box.x0 + radius + hashUnit(i, 1 + ki * 7) * Math.max(1e-6, box.x1 - box.x0 - 2 * radius);
          k.pos[i * 3 + 1] = box.y0 + radius + hashUnit(i, 2 + ki * 7) * Math.max(1e-6, box.y1 - box.y0 - 2 * radius);
          k.pos[i * 3 + 2] = box.z0 + radius + hashUnit(i, 3 + ki * 7) * Math.max(1e-6, box.z1 - box.z0 - 2 * radius);
        }
        for (let a = 0; a < 3; a++) k.vel[i * 3 + a] = Math.sign(k.vel[i * 3 + a] || k.dir[i * 3 + a]) * Math.abs(k.dir[i * 3 + a]) * sp;
      }
      this.seeded[ki] = Math.max(this.seeded[ki], n);
      k.count = n;
      k.mesh.count = n;
    });
    this.kinds.forEach((k, ki) => { if (ki >= groups.length) { k.count = 0; k.mesh.count = 0; } });
    this.constrain();
    this.write();
  }

  /** Pull every particle back inside the (possibly smaller) box. */
  constrain() {
    const { x0, x1, y0, y1, z0, z1 } = this.box;
    const r = this.radius;
    const lo = [x0 + r, y0 + r, z0 + r];
    const hi = [x1 - r, y1 - r, z1 - r];
    for (const k of this.kinds) {
      for (let i = 0; i < k.count; i++) {
        for (let a = 0; a < 3; a++) {
          const j = i * 3 + a;
          if (hi[a] < lo[a]) { k.pos[j] = (lo[a] + hi[a]) / 2; continue; }
          if (k.pos[j] < lo[a]) k.pos[j] = lo[a];
          else if (k.pos[j] > hi[a]) k.pos[j] = hi[a];
        }
      }
    }
  }

  /** Advance every particle by `dt` seconds; reduced motion holds them still. */
  tick(dt, still = false) {
    if (still || !(dt > 0)) return;
    const step = Math.min(dt, 0.05);
    const { x0, x1, y0, y1, z0, z1 } = this.box;
    const r = this.radius;
    const lo = [x0 + r, y0 + r, z0 + r];
    const hi = [x1 - r, y1 - r, z1 - r];
    for (const k of this.kinds) {
      for (let i = 0; i < k.count; i++) {
        for (let a = 0; a < 3; a++) {
          const j = i * 3 + a;
          if (hi[a] <= lo[a]) { k.pos[j] = (lo[a] + hi[a]) / 2; continue; }
          let v = k.vel[j];
          let p = k.pos[j] + v * step;
          if (p < lo[a]) { p = lo[a] + (lo[a] - p); v = Math.abs(v); }
          else if (p > hi[a]) { p = hi[a] - (p - hi[a]); v = -Math.abs(v); }
          k.pos[j] = Math.min(hi[a], Math.max(lo[a], p));
          k.vel[j] = v;
        }
      }
    }
    this.write();
  }

  /** Write the particles' places into their instanced bodies. */
  write() {
    for (const k of this.kinds) {
      for (let i = 0; i < k.count; i++) {
        this.p.set(k.pos[i * 3], k.pos[i * 3 + 1], k.pos[i * 3 + 2]);
        this.s.setScalar(this.radius);
        this.m.compose(this.p, this.q, this.s);
        k.mesh.setMatrixAt(i, this.m);
      }
      k.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  /** A reading for tests: the number of particles standing, per kind. */
  counts() { return this.kinds.map(k => k.count); }
}
