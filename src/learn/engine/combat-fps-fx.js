/**
 * combat-fps-fx.js — First-person combat FX & camera dynamics for Learn quest encounters.
 *
 * Implements FPS weapon discharge, plasma beam tracers, muzzle flashes,
 * hit sparks, kinetic impact bursts, and camera shake / trauma.
 */

import * as THREE from 'three';

let soundscape = null;
if (typeof window !== 'undefined') {
  import('../../audio/soundscape.js').then(m => { soundscape = m.soundscape; }).catch(() => {});
}

let _fxSeed = 54321;
function fxRand() {
  _fxSeed = (_fxSeed * 1664525 + 1013904223) >>> 0;
  return _fxSeed / 4294967296;
}

const AMBER = 0xe59b24;

export class CombatFpsFx {
  /**
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.name = 'fps-combat-fx';
    this.scene.add(this.group);

    this.beams = [];
    this.sparks = [];
    this.disposables = [];

    // Screen Trauma / Camera Shake
    this.trauma = 0; // 0 to 1
    this.shakeRot = new THREE.Euler();
    this.shakePos = new THREE.Vector3();

    // Muzzle Flash Point Light
    this.muzzleLight = new THREE.PointLight(AMBER, 0, 5);
    this.group.add(this.muzzleLight);
    this.disposables.push(this.muzzleLight);
    this.muzzleFlashTimer = 0;

    // Beam Material & Geometry cache
    this.beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 6);
    this.beamGeo.rotateX(Math.PI / 2);
    this.beamMat = new THREE.MeshBasicMaterial({ color: 0xffe082, transparent: true, opacity: 0.95 });
    this.disposables.push(this.beamGeo, this.beamMat);
  }

  /**
   * Fire a player attack from FPS camera view towards target position.
   * @param {THREE.Vector3} targetPos
   * @param {Function} [onHit]
   */
  firePlayerAttack(targetPos, onHit) {
    if (!this.camera) return;

    // Camera origin in world coords
    const camPos = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);

    // Camera forward, right, down
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);

    // Muzzle position: bottom-right of viewport in front of camera
    const muzzle = camPos.clone()
      .addScaledVector(fwd, 0.45)
      .addScaledVector(right, 0.28)
      .addScaledVector(up, -0.22);

    // Flash light at muzzle
    this.muzzleLight.position.copy(muzzle);
    this.muzzleLight.intensity = 4.5;
    this.muzzleFlashTimer = 0.08;

    // Small camera kick back on firing
    this.addTrauma(0.22);

    // Create projectile beam
    const mesh = new THREE.Mesh(this.beamGeo, this.beamMat.clone());
    this.group.add(mesh);

    const dir = targetPos.clone().sub(muzzle);
    const dist = dir.length();
    dir.normalize();

    this.beams.push({
      mesh,
      start: muzzle,
      dir,
      speed: 38.0, // fast projectile
      traveled: 0,
      totalDist: dist,
      targetPos: targetPos.clone(),
      onHit
    });

    try { soundscape.playKeyCapThunk?.(); } catch (e) {}
  }

  /**
   * Spawn an impact spark explosion at impact point.
   * @param {THREE.Vector3} pos
   * @param {number} [color]
   */
  spawnHitSparks(pos, color = AMBER) {
    const COUNT = 18;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const velocities = [];

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const v = new THREE.Vector3(
        (fxRand() - 0.5) * 4.5,
        (fxRand() - 0.2) * 4.0,
        (fxRand() - 0.5) * 4.5
      );
      velocities.push(v);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size: 0.06,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });
    const p = new THREE.Points(geo, mat);
    this.group.add(p);

    this.sparks.push({ points: p, geo, mat, velocities, life: 0.45, maxLife: 0.45 });
  }

  /**
   * Add camera trauma (screenshake)
   * @param {number} amount
   */
  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(dt) {
    // Muzzle flash decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleLight.intensity = 0;
      }
    }

    // Beams update
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.traveled += b.speed * dt;
      const cur = b.start.clone().addScaledVector(b.dir, b.traveled);
      b.mesh.position.copy(cur);
      b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), b.dir);

      if (b.traveled >= b.totalDist) {
        // Hit target!
        this.group.remove(b.mesh);
        b.mesh.geometry?.dispose?.();
        this.beams.splice(i, 1);
        this.spawnHitSparks(b.targetPos);
        b.onHit?.();
      }
    }

    // Sparks update
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        this.group.remove(sp.points);
        sp.geo.dispose();
        sp.mat.dispose();
        this.sparks.splice(i, 1);
        continue;
      }

      const frac = sp.life / sp.maxLife;
      sp.mat.opacity = frac;

      const posArr = sp.geo.attributes.position.array;
      for (let j = 0; j < sp.velocities.length; j++) {
        const v = sp.velocities[j];
        posArr[j * 3] += v.x * dt;
        posArr[j * 3 + 1] += v.y * dt;
        posArr[j * 3 + 2] += v.z * dt;
        v.y -= 9.8 * dt; // gravity
      }
      sp.geo.attributes.position.needsUpdate = true;
    }

    // Decay trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 2.2);
    }
  }

  /**
   * Returns current camera shake rotation offset to apply to camera.
   */
  getShakeOffsets() {
    if (this.trauma <= 0.001) return null;
    const t2 = this.trauma * this.trauma;
    const yaw = (fxRand() - 0.5) * 0.045 * t2;
    const pitch = (fxRand() - 0.5) * 0.045 * t2;
    const roll = (fxRand() - 0.5) * 0.03 * t2;
    const posX = (fxRand() - 0.5) * 0.025 * t2;
    const posY = (fxRand() - 0.5) * 0.025 * t2;
    return { yaw, pitch, roll, posX, posY };
  }

  dispose() {
    for (const b of this.beams) {
      this.group.remove(b.mesh);
      b.mesh.geometry?.dispose?.();
    }
    this.beams = [];
    for (const sp of this.sparks) {
      this.group.remove(sp.points);
      sp.geo.dispose();
      sp.mat.dispose();
    }
    this.sparks = [];
    this.group.parent?.remove(this.group);
    for (const d of this.disposables) {
      d.dispose?.();
    }
  }
}
