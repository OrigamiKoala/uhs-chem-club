/**
 * combat-fps-fx.js — Combat effects for the boss arenas.
 *
 * Everything the player SEES of a fight lives here, drawn in the world scene:
 *   - the player's volley: glowing bolts with a streaking trail that fly from the
 *     bottom-right of the view into the boss, one bolt per beat;
 *   - the impact each bolt makes: a flash, a ring, a burst of sparks and a floating
 *     damage figure;
 *   - the boss's answer: a charge orb that swells in front of it, then a slow
 *     bolt that travels to the player;
 *   - dust, shockwaves and explosions for landings, roars and the defeat;
 *   - smoke and embers that rise off a boss as it takes damage.
 *
 * It only DRAWS. It decides nothing about the fight: `BossArena` tells it what
 * happened and when. A single point light is moved to whichever bolt or blast is
 * live, because a changing light count recompiles every material in the world.
 */

import * as THREE from 'three';

let soundscape = null;
if (typeof window !== 'undefined') {
  import('../../audio/soundscape.js').then(m => { soundscape = m.soundscape; }).catch(() => {});
}

export function sfx(name) {
  try { soundscape?.[name]?.(); } catch (e) { /* audio is never load-bearing */ }
}

let _fxSeed = 54321;
function fxRand() {
  _fxSeed = (_fxSeed * 1664525 + 1013904223) >>> 0;
  return _fxSeed / 4294967296;
}
const rr = (a, b) => a + (b - a) * fxRand();

export const AMBER = 0xe59b24;
const CORE = 0xfff3d6;
const DUST = 0xb7aa92;

/* ---------------- shared sprites (built once, in a browser only) ---------------- */

let _glowTex = null;
let _ringTex = null;
let _shadowTex = null;

function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function glowTexture() {
  if (!_glowTex) {
    _glowTex = canvasTexture(64, (g, s) => {
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.25, 'rgba(255,255,255,0.65)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.16)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    });
  }
  return _glowTex;
}

export function ringTexture() {
  if (!_ringTex) {
    _ringTex = canvasTexture(128, (g, s) => {
      const grad = g.createRadialGradient(s / 2, s / 2, s * 0.30, s / 2, s / 2, s / 2);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.7, 'rgba(255,255,255,0.9)');
      grad.addColorStop(0.85, 'rgba(255,255,255,0.35)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    });
  }
  return _ringTex;
}

export function shadowTexture() {
  if (!_shadowTex) {
    _shadowTex = canvasTexture(128, (g, s) => {
      const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grad.addColorStop(0, 'rgba(0,0,0,0.85)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.5)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, s, s);
    });
  }
  return _shadowTex;
}

function glowSprite(color, scale, { additive = true, opacity = 1, depthTest = false } = {}) {
  const mat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest,
    fog: false,
    toneMapped: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  s.renderOrder = 20;
  return s;
}

/* ====================================================================
   CombatFpsFx
   ==================================================================== */

export class CombatFpsFx {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @param {{ reduced?: boolean }} [opts]
   */
  constructor(scene, camera, opts = {}) {
    this.scene = scene;
    this.camera = camera;
    this.reduced = Boolean(opts.reduced);
    this.group = new THREE.Group();
    this.group.name = 'boss-combat-fx';
    this.scene.add(this.group);

    this.effects = [];          // anything with update(dt) -> alive, dispose()
    this.trauma = 0;

    // The ONE light the effects use. It is created here and never added later.
    this.light = new THREE.PointLight(AMBER, 0, 16, 2);
    this.group.add(this.light);
    this.lightT = 0;
    this.lightDur = 0.2;
    this.lightPeak = 0;

    this.trailGeo = new THREE.ConeGeometry(0.16, 3.2, 10, 1, true);
    this.trailGeo.rotateX(-Math.PI / 2);
    this.trailGeo.translate(0, 0, -1.6);
    this.ringGeo = new THREE.RingGeometry(0.82, 1, 56);
    this.ringGeo.rotateX(-Math.PI / 2);
    this.sparkGeos = [];
  }

  /* ------------------------------ light ------------------------------ */

  pulseLight(pos, color, intensity, dur = 0.22) {
    this.light.position.copy(pos);
    this.light.color.set(color);
    this.lightPeak = intensity;
    this.lightDur = dur;
    this.lightT = dur;
  }

  /* --------------------------- player volley --------------------------- */

  /** Where a shot leaves the player's view: low and to the right of centre. */
  muzzlePoint() {
    const camPos = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);
    const q = this.camera.getWorldQuaternion(new THREE.Quaternion());
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    return camPos.addScaledVector(fwd, 0.7).addScaledVector(right, 0.34).addScaledVector(up, -0.26);
  }

  /**
   * Fire `count` bolts, one every `interval` seconds, each flying at the point
   * `getTarget()` returns when it leaves (so a boss that strafes is still hit).
   * `onHit(i, point)` runs as each bolt lands.
   */
  fireVolley(getTarget, { count = 3, interval = 0.16, onHit, scale = 1 } = {}) {
    if (!this.camera) return;
    for (let i = 0; i < count; i++) {
      this.effects.push(new Delay(i * interval, () => {
        const muzzle = this.muzzlePoint();
        const aim = getTarget();
        if (!aim) return;
        const big = i === count - 1 ? 1.35 : 1;
        const jitter = new THREE.Vector3(rr(-0.5, 0.5), rr(-0.4, 0.4), rr(-0.5, 0.5));
        const to = aim.point.clone().add(jitter.multiplyScalar(i === count - 1 ? 0 : 1));
        this.muzzleFlash(muzzle, scale * big);
        this.addTrauma(0.12 * big);
        sfx('playKeyCapThunk');
        this.effects.push(new Bolt(this, {
          from: muzzle,
          to,
          speed: 46,
          color: AMBER,
          core: CORE,
          size: 0.62 * scale * big,
          shrinkNear: true,
          onHit: () => onHit?.(i, to.clone())
        }));
      }));
    }
  }

  muzzleFlash(pos, scale = 1) {
    this.effects.push(new Flash(this, pos, { color: CORE, size: 0.9 * scale, life: 0.09, grow: 1.4 }));
    this.pulseLight(pos, AMBER, 5, 0.1);
  }

  /* ------------------------------ foe bolt ------------------------------ */

  /** A swelling orb in front of the foe that pays off `onDone` when it breaks. */
  chargeOrb(getPos, dur, color, onDone) {
    this.effects.push(new ChargeOrb(this, getPos, dur, color, onDone));
  }

  /** The foe's answer: a slow, big bolt that arrives at the player's eye. */
  fireFoeBolt(from, color, onHit) {
    if (!this.camera) return;
    const to = new THREE.Vector3();
    this.camera.getWorldPosition(to);
    const q = this.camera.getWorldQuaternion(new THREE.Quaternion());
    to.addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(q), 0.8);
    to.y -= 0.15;
    this.effects.push(new Bolt(this, {
      from, to, speed: 24, color, core: 0xffffff, size: 1.5, trailLen: 1.8, onHit
    }));
  }

  /* ----------------------------- impacts etc ----------------------------- */

  /** A bolt landing: flash, ring, sparks and a pulse of light. */
  hitBurst(pos, { scale = 1, color = AMBER } = {}) {
    this.effects.push(new Flash(this, pos, { color: CORE, size: 2.2 * scale, life: 0.16, grow: 1.6 }));
    this.effects.push(new Flash(this, pos, { color, size: 3.6 * scale, life: 0.3, grow: 1.9, opacity: 0.8 }));
    this.effects.push(new RingFlash(this, pos, { color, size: 1.0 * scale, to: 4.2 * scale, life: 0.34 }));
    this.sparks(pos, { count: Math.round(26 * scale), speed: 7 * scale, color, size: 0.2 * scale });
    this.pulseLight(pos, color, 7 * scale, 0.26);
    sfx('playStamp');
  }

  sparks(pos, { count = 24, speed = 6, color = AMBER, size = 0.18, life = 0.7, gravity = 11 } = {}) {
    this.effects.push(new Sparks(this, pos, { count, speed, color, size, life, gravity }));
  }

  /** A floating figure that pops, rises and fades. */
  damageNumber(pos, text, { color = '#ffd27a', big = false } = {}) {
    if (!this.camera) return;
    this.effects.push(new FloatText(this, pos, text, { color, big }));
  }

  /** Dust thrown up off the ground: a landing, a roar, a collapse. */
  dustBurst(pos, { radius = 3, count = 12, color = DUST, rise = 1.6 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rr(-0.3, 0.3);
      this.effects.push(new DustPuff(this, pos, a, radius, color, rise));
    }
  }

  /** A flat ring that races outward along the ground. */
  shockwave(pos, { radius = 8, color = DUST, life = 0.7 } = {}) {
    this.effects.push(new GroundRing(this, pos, { radius, color, life }));
  }

  /** One fireball: flash, ring, sparks and trauma. */
  explosion(pos, { scale = 1, color = 0xff8a2a } = {}) {
    this.effects.push(new Flash(this, pos, { color: 0xffffff, size: 3.2 * scale, life: 0.2, grow: 1.7 }));
    this.effects.push(new Flash(this, pos, { color, size: 6.0 * scale, life: 0.5, grow: 2.2, opacity: 0.85 }));
    this.effects.push(new RingFlash(this, pos, { color, size: 1.2 * scale, to: 7 * scale, life: 0.5 }));
    this.sparks(pos, { count: Math.round(40 * scale), speed: 10 * scale, color, size: 0.26 * scale, life: 0.95 });
    this.pulseLight(pos, color, 12 * scale, 0.4);
    this.addTrauma(0.3 * Math.min(scale, 2));
    sfx('playTouchdown');
  }

  /* ----------------------------- camera ----------------------------- */

  addTrauma(amount) {
    if (this.reduced) return;
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  getShakeOffsets() {
    if (this.trauma <= 0.001) return null;
    const t2 = this.trauma * this.trauma;
    const roll = (fxRand() - 0.5) * 0.05 * t2;
    const posX = (fxRand() - 0.5) * 0.06 * t2;
    const posY = (fxRand() - 0.5) * 0.06 * t2;
    return { roll, posX, posY };
  }

  /* ------------------------------ frame ------------------------------ */

  update(dt) {
    if (this.lightT > 0) {
      this.lightT = Math.max(0, this.lightT - dt);
      const f = this.lightT / this.lightDur;
      this.light.intensity = this.lightPeak * f * f;
    } else if (this.light.intensity !== 0) {
      this.light.intensity = 0;
    }

    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      if (!e.update(dt)) {
        e.dispose?.();
        this.effects.splice(i, 1);
      }
    }
    if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - dt * 1.8);
  }

  dispose() {
    for (const e of this.effects) e.dispose?.();
    this.effects = [];
    this.group.parent?.remove(this.group);
    this.light.dispose?.();
    this.trailGeo.dispose();
    this.ringGeo.dispose();
  }
}

/* ====================================================================
   Effects — each has update(dt) -> still alive, and dispose()
   ==================================================================== */

class Delay {
  constructor(t, fn) { this.t = t; this.fn = fn; }
  update(dt) {
    this.t -= dt;
    if (this.t <= 0) { this.fn(); return false; }
    return true;
  }
}

/** A glowing projectile with a trail, flying from `from` to `to`. */
class Bolt {
  constructor(fx, { from, to, speed, color, core, size, trailLen = 1, shrinkNear = false, onHit }) {
    this.fx = fx;
    this.size = size;
    this.shrinkNear = shrinkNear;
    this._eye = new THREE.Vector3();
    this.start = from.clone();
    this.end = to.clone();
    this.dir = this.end.clone().sub(this.start);
    this.total = this.dir.length();
    this.dir.normalize();
    this.speed = speed;
    this.traveled = 0;
    this.onHit = onHit;
    this.color = color;
    this.t = 0;

    this.group = new THREE.Group();
    this.group.position.copy(this.start);
    this.group.lookAt(this.end);

    this.trailMat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false
    });
    this.trail = new THREE.Mesh(fx.trailGeo, this.trailMat);
    this.trail.scale.set(size * 1.0, size * 1.0, trailLen * Math.min(1, 0.4 + this.total / 14));
    this.trail.renderOrder = 19;

    this.trailCoreMat = this.trailMat.clone();
    this.trailCoreMat.color.set(core);
    this.trailCoreMat.opacity = 0.9;
    this.trailCore = new THREE.Mesh(fx.trailGeo, this.trailCoreMat);
    this.trailCore.scale.set(size * 0.42, size * 0.42, trailLen * 0.7);
    this.trailCore.renderOrder = 19;

    this.halo = glowSprite(color, size * 3.4, { opacity: 0.9 });
    this.head = glowSprite(core, size * 1.5);
    this.group.add(this.trail, this.trailCore, this.halo, this.head);
    fx.group.add(this.group);
  }

  update(dt) {
    this.t += dt;
    this.traveled += this.speed * dt;
    const prog = Math.min(1, this.traveled / this.total);
    this.group.position.copy(this.start).addScaledVector(this.dir, Math.min(this.traveled, this.total));
    const flick = 1 + Math.sin(this.t * 60) * 0.12;
    // A bolt leaving the muzzle is under a metre from the lens; at full size it
    // would white the screen out. It grows into its size as it clears the eye.
    let k = 1;
    if (this.shrinkNear) {
      this.fx.camera.getWorldPosition(this._eye);
      k = THREE.MathUtils.clamp(this._eye.distanceTo(this.group.position) / 9, 0.12, 1);
    }
    this.head.scale.setScalar(this.size * 1.5 * k);
    this.halo.scale.setScalar(this.size * 3.4 * k * flick);
    this.trail.scale.x = this.trail.scale.y = this.size * k;
    this.trailCore.scale.x = this.trailCore.scale.y = this.size * 0.42 * k;
    this.fx.pulseLight(this.group.position, this.color, 3.2, 0.06);
    if (prog >= 1) {
      this.onHit?.();
      return false;
    }
    return true;
  }

  dispose() {
    this.fx.group.remove(this.group);
    this.trailMat.dispose();
    this.trailCoreMat.dispose();
    this.halo.material.dispose();
    this.head.material.dispose();
  }
}

/** A growing glow in front of the foe; breaks into `onDone`. */
class ChargeOrb {
  constructor(fx, getPos, dur, color, onDone) {
    this.fx = fx;
    this.getPos = getPos;
    this.dur = dur;
    this.t = 0;
    this.onDone = onDone;
    this.color = color;
    this.halo = glowSprite(color, 0.5, { opacity: 0.85 });
    this.core = glowSprite(0xffffff, 0.3);
    this.ring = glowSprite(color, 1, { opacity: 0.0 });
    this.ring.material.map = ringTexture();
    fx.group.add(this.halo, this.core, this.ring);
  }

  update(dt) {
    this.t += dt;
    const k = Math.min(1, this.t / this.dur);
    const p = this.getPos();
    this.halo.position.copy(p);
    this.core.position.copy(p);
    this.ring.position.copy(p);
    const swell = 0.6 + 3.6 * k * k;
    this.halo.scale.setScalar(swell * (1 + Math.sin(this.t * 40) * 0.05));
    this.core.scale.setScalar(0.3 + 1.4 * k);
    // A ring collapses onto the orb: the tell that it is about to fire.
    this.ring.scale.setScalar(Math.max(0.1, 7 * (1 - k)));
    this.ring.material.opacity = 0.9 * k;
    this.fx.pulseLight(p, this.color, 2 + 5 * k, 0.08);
    if (k >= 1) {
      this.onDone?.(p.clone());
      return false;
    }
    return true;
  }

  dispose() {
    this.fx.group.remove(this.halo, this.core, this.ring);
    this.halo.material.dispose();
    this.core.material.dispose();
    this.ring.material.dispose();
  }
}

/** A sprite that swells and fades. */
class Flash {
  constructor(fx, pos, { color, size, life, grow = 1.5, opacity = 1 }) {
    this.fx = fx;
    this.life = this.max = life;
    this.size = size;
    this.grow = grow;
    this.opacity = opacity;
    this.sprite = glowSprite(color, size, { opacity });
    this.sprite.position.copy(pos);
    fx.group.add(this.sprite);
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    const f = 1 - this.life / this.max;
    this.sprite.scale.setScalar(this.size * (1 + (this.grow - 1) * f));
    this.sprite.material.opacity = this.opacity * (1 - f) * (1 - f);
    return true;
  }
  dispose() {
    this.fx.group.remove(this.sprite);
    this.sprite.material.dispose();
  }
}

/** A camera-facing ring that expands and fades. */
class RingFlash {
  constructor(fx, pos, { color, size, to, life }) {
    this.fx = fx;
    this.life = this.max = life;
    this.size = size;
    this.to = to;
    this.sprite = glowSprite(color, size, { opacity: 0.9 });
    this.sprite.material.map = ringTexture();
    this.sprite.position.copy(pos);
    fx.group.add(this.sprite);
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    const f = 1 - this.life / this.max;
    this.sprite.scale.setScalar(this.size + (this.to - this.size) * (1 - (1 - f) * (1 - f)));
    this.sprite.material.opacity = 0.9 * (1 - f);
    return true;
  }
  dispose() {
    this.fx.group.remove(this.sprite);
    this.sprite.material.dispose();
  }
}

/** Glowing sparks that fly out, fall and fade. Soft round points, not pixels. */
class Sparks {
  constructor(fx, pos, { count, speed, color, size, life, gravity }) {
    this.fx = fx;
    this.life = this.max = life;
    this.gravity = gravity;
    const positions = new Float32Array(count * 3);
    this.vel = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      const v = new THREE.Vector3(rr(-1, 1), rr(-0.3, 1), rr(-1, 1)).normalize().multiplyScalar(speed * rr(0.35, 1));
      this.vel.push(v);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.mat = new THREE.PointsMaterial({
      color, size, map: glowTexture(), transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 18;
    fx.group.add(this.points);
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    this.mat.opacity = Math.min(1, (this.life / this.max) * 1.6);
    const arr = this.geo.attributes.position.array;
    for (let i = 0; i < this.vel.length; i++) {
      const v = this.vel[i];
      arr[i * 3] += v.x * dt;
      arr[i * 3 + 1] += v.y * dt;
      arr[i * 3 + 2] += v.z * dt;
      v.y -= this.gravity * dt;
      v.multiplyScalar(1 - dt * 0.8);
    }
    this.geo.attributes.position.needsUpdate = true;
    return true;
  }
  dispose() {
    this.fx.group.remove(this.points);
    this.geo.dispose();
    this.mat.dispose();
  }
}

/** A damage figure: pops in, floats up, fades. Sized to read at any range. */
class FloatText {
  constructor(fx, pos, text, { color, big }) {
    this.fx = fx;
    this.life = this.max = big ? 1.5 : 1.15;
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.font = `${big ? 800 : 700} ${big ? 84 : 70}px Quantico, 'JetBrains Mono', monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 12;
    g.strokeStyle = 'rgba(12,10,8,0.95)';
    g.strokeText(text, 128, 66);
    g.fillStyle = color;
    g.fillText(text, 128, 66);
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.tex, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false
    }));
    this.sprite.renderOrder = 30;
    const eye = new THREE.Vector3();
    fx.camera.getWorldPosition(eye);
    const dist = eye.distanceTo(pos);
    this.base = Math.max(1.4, dist * (big ? 0.2 : 0.15));
    this.sprite.scale.set(this.base * 2, this.base, 1);
    this.sprite.position.copy(pos);
    this.rise = this.base * 1.3;
    this.y0 = pos.y;
    this.drift = rr(-0.5, 0.5) * this.base;
    this.x0 = pos.x;
    fx.group.add(this.sprite);
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    const f = 1 - this.life / this.max;
    const pop = f < 0.12 ? 0.6 + (f / 0.12) * 0.7 : 1.3 - Math.min(0.3, (f - 0.12) * 1.2);
    this.sprite.scale.set(this.base * 2 * pop, this.base * pop, 1);
    this.sprite.position.y = this.y0 + this.rise * (1 - (1 - f) * (1 - f));
    this.sprite.position.x = this.x0 + this.drift * f;
    this.sprite.material.opacity = f > 0.7 ? 1 - (f - 0.7) / 0.3 : 1;
    return true;
  }
  dispose() {
    this.fx.group.remove(this.sprite);
    this.sprite.material.dispose();
    this.tex.dispose();
  }
}

/** One puff of dust: rolls outward along the ground, climbs, thins out. */
class DustPuff {
  constructor(fx, pos, angle, radius, color, rise) {
    this.fx = fx;
    this.life = this.max = rr(0.9, 1.5);
    this.sprite = glowSprite(color, radius * 0.5, { additive: false, opacity: 0.5, depthTest: true });
    this.sprite.renderOrder = 4;
    this.origin = pos.clone();
    this.dx = Math.cos(angle) * radius * rr(0.6, 1.1);
    this.dz = Math.sin(angle) * radius * rr(0.6, 1.1);
    this.rise = rise * rr(0.5, 1);
    this.size = radius * rr(0.45, 0.8);
    this.sprite.position.copy(pos);
    fx.group.add(this.sprite);
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    const f = 1 - this.life / this.max;
    const e = 1 - (1 - f) * (1 - f);
    this.sprite.position.set(this.origin.x + this.dx * e, this.origin.y + 0.3 + this.rise * e, this.origin.z + this.dz * e);
    this.sprite.scale.setScalar(this.size * (0.6 + 1.2 * e));
    this.sprite.material.opacity = 0.5 * (1 - f) * Math.min(1, f * 6 + 0.2);
    return true;
  }
  dispose() {
    this.fx.group.remove(this.sprite);
    this.sprite.material.dispose();
  }
}

/** A flat ring along the ground. */
class GroundRing {
  constructor(fx, pos, { radius, color, life }) {
    this.fx = fx;
    this.life = this.max = life;
    this.radius = radius;
    this.mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false
    });
    this.mesh = new THREE.Mesh(fx.ringGeo, this.mat);
    this.mesh.position.copy(pos);
    this.mesh.position.y += 0.08;
    this.mesh.renderOrder = 3;
    this.mesh.scale.setScalar(0.1);
    fx.group.add(this.mesh);
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;
    const f = 1 - this.life / this.max;
    this.mesh.scale.setScalar(Math.max(0.1, this.radius * (1 - (1 - f) * (1 - f))));
    this.mat.opacity = 0.7 * (1 - f);
    return true;
  }
  dispose() {
    this.fx.group.remove(this.mesh);
    this.mat.dispose();
  }
}

/* ====================================================================
   DamageEmitter — smoke and embers that rise off a wounded boss
   ==================================================================== */

export class DamageEmitter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'boss-damage-emitter';
    scene.add(this.group);

    this.smoke = [];
    for (let i = 0; i < 22; i++) {
      const s = glowSprite(0x2b2723, 1, { additive: false, opacity: 0, depthTest: true });
      s.renderOrder = 5;
      s.visible = false;
      this.group.add(s);
      this.smoke.push({ sprite: s, life: 0, max: 1, vel: new THREE.Vector3(), size: 1 });
    }

    const N = 44;
    this.emberCount = N;
    this.emberPos = new Float32Array(N * 3);
    this.emberCol = new Float32Array(N * 3);
    this.emberVel = [];
    this.emberLife = new Float32Array(N);
    for (let i = 0; i < N; i++) this.emberVel.push(new THREE.Vector3());
    this.emberGeo = new THREE.BufferGeometry();
    this.emberGeo.setAttribute('position', new THREE.BufferAttribute(this.emberPos, 3));
    this.emberGeo.setAttribute('color', new THREE.BufferAttribute(this.emberCol, 3));
    this.emberMat = new THREE.PointsMaterial({
      size: 0.28, map: glowTexture(), vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false
    });
    this.embers = new THREE.Points(this.emberGeo, this.emberMat);
    this.embers.frustumCulled = false;
    this.group.add(this.embers);
    this.spawnAcc = 0;
  }

  /**
   * @param {number} dt
   * @param {THREE.Box3} box world box round the boss
   * @param {number} level 0..1 how hurt it is
   * @param {number} emberColor hex
   */
  update(dt, box, level, emberColor = 0xff6a1f) {
    const rate = level * 9;                 // smoke puffs per second at full damage
    this.spawnAcc += dt * rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      const p = this.smoke.find(s => s.life <= 0);
      if (!p) break;
      p.life = p.max = rr(1.4, 2.4);
      p.size = rr(1.3, 2.4) * (0.7 + level * 0.8);
      p.sprite.position.set(
        rr(box.min.x, box.max.x) * 0.5 + (box.min.x + box.max.x) * 0.25,
        rr(box.min.y + (box.max.y - box.min.y) * 0.35, box.max.y),
        rr(box.min.z, box.max.z) * 0.5 + (box.min.z + box.max.z) * 0.25
      );
      p.vel.set(rr(-0.4, 0.4), rr(1.0, 2.2), rr(-0.4, 0.4));
      p.sprite.visible = true;
    }
    for (const p of this.smoke) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sprite.visible = false; continue; }
      const f = 1 - p.life / p.max;
      p.sprite.position.addScaledVector(p.vel, dt);
      p.sprite.scale.setScalar(p.size * (0.5 + f * 1.3));
      p.sprite.material.opacity = 0.42 * Math.sin(Math.min(1, f) * Math.PI) * Math.min(1, level * 2);
    }

    // Embers: a few hot flecks off the wounds, falling and cooling.
    const er = level * 14;
    let spawn = 0;
    const c = new THREE.Color(emberColor);
    for (let i = 0; i < this.emberCount; i++) {
      if (this.emberLife[i] > 0) {
        this.emberLife[i] -= dt;
        const v = this.emberVel[i];
        this.emberPos[i * 3] += v.x * dt;
        this.emberPos[i * 3 + 1] += v.y * dt;
        this.emberPos[i * 3 + 2] += v.z * dt;
        v.y -= 3.5 * dt;
        const f = Math.max(0, this.emberLife[i]) / 1.1;
        this.emberCol[i * 3] = c.r * f;
        this.emberCol[i * 3 + 1] = c.g * f;
        this.emberCol[i * 3 + 2] = c.b * f;
      } else {
        this.emberCol[i * 3] = this.emberCol[i * 3 + 1] = this.emberCol[i * 3 + 2] = 0;
        if (spawn < 2 && fxRand() < er * dt / this.emberCount * 3) {
          spawn++;
          this.emberLife[i] = rr(0.6, 1.1);
          this.emberPos[i * 3] = rr(box.min.x, box.max.x);
          this.emberPos[i * 3 + 1] = rr(box.min.y + (box.max.y - box.min.y) * 0.3, box.max.y);
          this.emberPos[i * 3 + 2] = rr(box.min.z, box.max.z);
          this.emberVel[i].set(rr(-1.2, 1.2), rr(0.5, 2.6), rr(-1.2, 1.2));
        }
      }
    }
    this.emberGeo.attributes.position.needsUpdate = true;
    this.emberGeo.attributes.color.needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.group);
    for (const p of this.smoke) p.sprite.material.dispose();
    this.emberGeo.dispose();
    this.emberMat.dispose();
  }
}
