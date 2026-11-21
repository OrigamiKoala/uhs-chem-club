/**
 * effects.js — what is visibly wrong with a problem prop (`props.js`): a lamp that sputters, a drum that is
 * warm, steam off a pipe, a drip, sparks at a clamp, bubbles in a pond, a gauge needle pinned high.
 *
 * `makeEffect(kit, prop, def)` returns `{ update(dt, t, on) }`. `on` is the symptom: true while the problem
 * stands (the quest not cleared, the world's boss not beaten, or a walk-up showing it), false once it is
 * fixed, when the prop settles (lamp steady, needle resting, no steam).
 *
 * Particles are one `THREE.Points` per effect with a fixed count, built with the prop and warmed with the
 * world; they never cast a shadow, and they are never hidden (a hidden one would compile on the frame it came
 * back): a settled effect draws at opacity 0. No effect adds a light.
 *
 * A def is `{ kind, part?, at?, ... }`: `part` names one of the prop's parts (a mesh whose material an effect
 * drives), `at` names one of its anchor points (an Object3D where particles start).
 */
import * as THREE from 'three';

export const EFFECT_KINDS = Object.freeze(['flicker', 'dark', 'glow', 'blink', 'plume', 'drip', 'sparks', 'bubbles', 'needle', 'rock']);

const lerp = (a, b, k) => a + (b - a) * k;

function anchorOf(prop, name) {
  const a = name ? prop.parts[name] : null;
  if (a?.isObject3D) return a.position.clone();
  const f = prop.focus || [0, 0.5, 0];
  return new THREE.Vector3(f[0], f[1], f[2]);
}

function materialsOf(prop, name) {
  const p = prop.parts[name];
  if (!p) return [];
  const list = Array.isArray(p) ? p : [p];
  return list.map(m => m.material).filter(m => m && m.emissive);
}

/** For the checks: whether `name` is a part of `prop` this effect can drive. */
export function effectFits(prop, def) {
  if (['flicker', 'dark', 'glow', 'blink'].includes(def.kind)) return materialsOf(prop, def.part).length > 0;
  if (def.kind === 'needle') return Boolean(prop.parts[def.part || 'needle']);
  if (def.kind === 'rock') return Boolean(prop.parts[def.part || 'beam']);
  if (def.at) return Boolean(prop.parts[def.at]?.isObject3D);
  return true;
}

/** A fixed pool of particles rising, falling or bursting from one point. */
function particles(kit, prop, def, { n, color, size, opacity, blending = THREE.NormalBlending }) {
  const geo = kit.own(new THREE.BufferGeometry());
  const pos = new Float32Array(n * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = kit.own(new THREE.PointsMaterial({
    color, size, map: kit.puffTexture(), transparent: true, opacity, depthWrite: false, sizeAttenuation: true, blending
  }));
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.userData.noMerge = true;
  pts.castShadow = false;
  prop.group.add(pts);
  const origin = anchorOf(prop, def.at);
  return { pts, geo, pos, mat, origin, age: new Float32Array(n).map((_, i) => i / n), vel: new Float32Array(n * 3) };
}

export function makeEffect(kit, prop, def) {
  switch (def.kind) {
    case 'flicker': {
      const mats = materialsOf(prop, def.part);
      const base = mats.map(m => m.emissiveIntensity);
      let level = 1, next = 0;
      return {
        update(dt, t, on) {
          if (!on) { mats.forEach((m, i) => { m.emissiveIntensity = base[i]; }); return; }
          // Mostly dark, catching for a moment now and then.
          next -= dt;
          if (next <= 0) { level = Math.random() < 0.3 ? 0.5 + Math.random() * 0.6 : Math.random() * 0.08; next = 0.05 + Math.random() * (level > 0.3 ? 0.15 : 0.9); }
          mats.forEach((m, i) => { m.emissiveIntensity = base[i] * level; });
        }
      };
    }
    case 'dark': {
      const mats = materialsOf(prop, def.part);
      const base = mats.map(m => m.emissiveIntensity);
      return { update(dt, t, on) { mats.forEach((m, i) => { m.emissiveIntensity = on ? base[i] * 0.03 : base[i]; }); } };
    }
    case 'glow': {
      const mats = materialsOf(prop, def.part);
      const max = def.max ?? 1.2;
      return { update(dt, t, on) { mats.forEach((m, i) => { m.emissiveIntensity = on ? max * (0.75 + 0.25 * Math.sin(t * 1.3 + i * 1.7)) : 0; }); } };
    }
    case 'blink': {
      // Lamps flashing together, on and off, while the problem stands; dark once it is put right.
      const mats = materialsOf(prop, def.part);
      const base = mats.map(m => m.emissiveIntensity);
      const period = def.period ?? 1.6;
      return { update(dt, t, on) { const lit = on && (t % period) < period * 0.35; mats.forEach((m, i) => { m.emissiveIntensity = lit ? base[i] * 1.4 : base[i] * 0.05; }); } };
    }
    case 'plume': {
      const n = def.n ?? 36;
      const P = particles(kit, prop, def, { n, color: def.color ?? 0xd8d8d8, size: def.size ?? 0.5, opacity: def.opacity ?? 0.35 });
      const rise = def.rise ?? 0.9, spread = def.spread ?? 0.25, life = def.life ?? 3.2, down = def.down ? -1 : 1;
      let fade = 0;
      return {
        update(dt, t, on) {
          fade = THREE.MathUtils.clamp(fade + (on ? dt : -dt) / 1.5, 0, 1);
          P.mat.opacity = (def.opacity ?? 0.35) * fade;
          if (fade <= 0.001) return;
          for (let i = 0; i < n; i++) {
            P.age[i] += dt / life;
            if (P.age[i] >= 1) P.age[i] -= 1;
            const a = P.age[i];
            const sw = Math.sin(i * 12.9 + t * 0.7) * spread * a;
            P.pos[i * 3] = P.origin.x + sw + Math.cos(i * 2.4) * spread * a * 1.5;
            P.pos[i * 3 + 1] = P.origin.y + down * rise * life * a * (1 - 0.3 * a);
            P.pos[i * 3 + 2] = P.origin.z + Math.sin(i * 2.4) * spread * a * 1.5 + (def.drift ?? 0) * a;
          }
          P.geo.attributes.position.needsUpdate = true;
        }
      };
    }
    case 'drip': {
      const n = def.n ?? 6;
      const P = particles(kit, prop, def, { n, color: def.color ?? 0x88aacc, size: def.size ?? 0.06, opacity: 0.9 });
      const fall = P.origin.y - (def.floor ?? 0.03);
      return {
        update(dt, t, on) {
          P.mat.opacity = on ? 0.9 : 0;
          if (!on) return;
          for (let i = 0; i < n; i++) {
            P.age[i] += dt / (def.every ?? 1.4);
            if (P.age[i] >= 1) P.age[i] -= 1;
            const a = Math.max(0, (P.age[i] - 0.6) / 0.4);   // hangs, then falls
            P.pos[i * 3] = P.origin.x;
            P.pos[i * 3 + 1] = P.origin.y - fall * a * a;
            P.pos[i * 3 + 2] = P.origin.z;
          }
          P.geo.attributes.position.needsUpdate = true;
        }
      };
    }
    case 'sparks': {
      const n = def.n ?? 18;
      const P = particles(kit, prop, def, { n, color: def.color ?? 0xffc46a, size: def.size ?? 0.07, opacity: 1, blending: THREE.AdditiveBlending });
      let burst = 0, wait = 0.5;
      return {
        update(dt, t, on) {
          if (!on) { P.mat.opacity = 0; return; }
          wait -= dt;
          if (wait <= 0) {
            burst = 0.45;
            wait = 0.6 + Math.random() * 2.2;
            for (let i = 0; i < n; i++) {
              P.pos[i * 3] = P.origin.x; P.pos[i * 3 + 1] = P.origin.y; P.pos[i * 3 + 2] = P.origin.z;
              P.vel[i * 3] = (Math.random() - 0.5) * 2.2; P.vel[i * 3 + 1] = Math.random() * 1.6; P.vel[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
            }
          }
          burst -= dt;
          P.mat.opacity = burst > 0 ? 1 : 0;
          if (burst <= 0) return;
          for (let i = 0; i < n; i++) {
            P.vel[i * 3 + 1] -= 9.8 * dt;
            P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] += P.vel[i * 3 + 1] * dt; P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
          }
          P.geo.attributes.position.needsUpdate = true;
        }
      };
    }
    case 'bubbles': {
      const n = def.n ?? 16;
      const P = particles(kit, prop, def, { n, color: def.color ?? 0xcfe0d0, size: def.size ?? 0.09, opacity: 0.8 });
      const r = (prop.parts.r ?? 1) * 0.8;
      const spot = Array.from({ length: n }, (_, i) => [Math.cos(i * 2.399) * r * Math.sqrt((i + 0.5) / n), Math.sin(i * 2.399) * r * Math.sqrt((i + 0.5) / n)]);
      return {
        update(dt, t, on) {
          P.mat.opacity = on ? 0.8 : 0;
          if (!on) return;
          for (let i = 0; i < n; i++) {
            P.age[i] += dt / (1.2 + (i % 5) * 0.3);
            if (P.age[i] >= 1) P.age[i] -= 1;
            P.pos[i * 3] = P.origin.x + spot[i][0];
            P.pos[i * 3 + 1] = P.origin.y + 0.02 + 0.06 * P.age[i];
            P.pos[i * 3 + 2] = P.origin.z + spot[i][1];
          }
          P.geo.attributes.position.needsUpdate = true;
        }
      };
    }
    case 'needle': {
      const g = prop.parts[def.part || 'needle'];
      const from = def.from ?? 1.2, to = def.to ?? -1.1;
      let k = 0;
      return {
        update(dt, t, on) {
          if (!g) return;
          k = THREE.MathUtils.clamp(k + (on ? dt : -dt) / 2, 0, 1);
          g.rotation.z = lerp(from, to, k) + (on ? Math.sin(t * 23) * 0.03 + Math.sin(t * 7.1) * 0.05 : 0);
        }
      };
    }
    case 'rock': {
      const g = prop.parts[def.part || 'beam'];
      const amp = def.amp ?? 0.28, speed = def.speed ?? 1.6;
      let a = 0;
      return {
        update(dt, t, on) {
          if (!g) return;
          a = THREE.MathUtils.clamp(a + (on ? dt : -dt) / 1.5, 0, 1);
          g.rotation.z = Math.sin(t * speed) * amp * a;
        }
      };
    }
    default:
      return { update() {} };
  }
}
