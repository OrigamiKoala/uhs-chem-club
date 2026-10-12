/**
 * boss-arena.js — Manages 3D boss encounters in open arena areas.
 *
 * Places high-quality 3D bosses (CombatMonster3D) in open world spots,
 * manages first-person attack effects (CombatFpsFx), damage flashes,
 * hit reactions, counters, and dispersal.
 */

import * as THREE from 'three';
import { CombatMonster3D } from './combat-monster-3d.js';
import { CombatFpsFx } from './combat-fps-fx.js';

let _activeBossArena = null;

export function getActiveBossArena() {
  return _activeBossArena;
}

export function setActiveBossArena(arena) {
  _activeBossArena = arena;
}

/** Open positions for each boss battle with clear line of sight */
export const BOSS_ARENA_SPOTS = {
  'boss-hopper': {
    worldId: 'unit01',
    playerPos: [0, 1.6, 42.0],
    lookAtPos: [0, 1.6, 30.0],
    bossPos: [0, 0, 30.0],
    scale: 2.2,
    species: 'the hopper'
  },
  'boss-eater': {
    worldId: 'unit02',
    playerPos: [0, 1.6, 68.0],
    lookAtPos: [0, 1.6, 54.0],
    bossPos: [0, 1.4, 54.0],
    scale: 2.2,
    species: 'the lantern-eater'
  },
  'boss-warden': {
    worldId: 'unit03',
    playerPos: [0, 1.6, 14.0],
    lookAtPos: [0, 1.6, 2.0],
    bossPos: [0, 0, 2.0],
    scale: 2.2,
    species: 'basalt warden'
  },
  'boss-compressor': {
    worldId: 'unit04',
    playerPos: [0, 1.6, 34.0],
    lookAtPos: [0, 1.6, 20.0],
    bossPos: [0, 0, 20.0],
    scale: 2.2,
    species: 'the compressor'
  },
  'boss-golem': {
    worldId: 'unit07',
    playerPos: [0, 1.6, 8.0],
    lookAtPos: [0, 1.6, 0.0],
    bossPos: [0, 0, 0.0],
    scale: 2.2,
    species: 'recipe golem'
  }
};

export class BossArena {
  constructor(arg1, arg2 = null) {
    let scene, camera, species, bossPos, scale;
    if (arg1 && (arg1.activeWorld || arg1.scene || arg1.camera)) {
      this.stage = arg1;
      scene = arg1.activeWorld?.scene || arg1.scene;
      camera = arg1.camera;
      species = arg2?.species;
      bossPos = arg2?.bossPos;
      scale = arg2?.scale ?? 2.2;
    } else {
      this.stage = null;
      scene = arg1?.scene;
      camera = arg1?.camera;
      species = arg1?.species;
      bossPos = arg1?.bossPos;
      scale = arg1?.scale ?? 2.2;
    }

    this.scene = scene;
    this.camera = camera;
    this.species = species || 'the hopper';
    this.disposed = false;
    this.wrongBusy = false;
    this.correctBusy = false;
    this.appliedShake = null;

    const x = bossPos ? bossPos[0] : 0;
    let y = bossPos ? bossPos[1] : 0;
    const z = bossPos ? bossPos[2] : 30;

    const terrainH = this.stage?.activeWorld?.getTerrainHeight?.(x, z);
    if (typeof terrainH === 'number' && !isNaN(terrainH)) {
      y = Math.max(y, terrainH);
    }

    this.monster = new CombatMonster3D(this.species, { id: 'boss' }, { x, y, z, scale });
    if (this.scene) {
      this.scene.add(this.monster.group);
    }

    if (this.scene && this.camera) {
      this.fpsFx = new CombatFpsFx(this.scene, this.camera);
    }

    if (typeof document !== 'undefined') {
      this.vignette = document.createElement('div');
      this.vignette.className = 'fps-damage-vignette';
      document.body.appendChild(this.vignette);
    }

    this.lastT = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.tick = (now) => {
      if (this.disposed) return;
      const dt = Math.min((now - this.lastT) / 1000, 0.1);
      this.lastT = now;

      const eye = this.camera ? this.camera.position : null;
      this.monster?.update(dt, false, eye);
      this.fpsFx?.update(dt);

      if (this.camera) {
        if (this.appliedShake) {
          this.camera.rotation.z -= this.appliedShake.roll;
          this.camera.position.x -= this.appliedShake.posX;
          this.camera.position.y -= this.appliedShake.posY;
          this.appliedShake = null;
        }
        const shake = this.fpsFx?.getShakeOffsets();
        if (shake) {
          this.camera.rotation.z += shake.roll;
          this.camera.position.x += shake.posX;
          this.camera.position.y += shake.posY;
          this.appliedShake = shake;
        }
      }

      if (typeof requestAnimationFrame !== 'undefined') {
        this.animId = requestAnimationFrame(this.tick);
      }
    };
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animId = requestAnimationFrame(this.tick);
    }

    setActiveBossArena(this);
  }

  onCorrect(isLast = false) {
    if (!this.monster || this.correctBusy) return;
    this.correctBusy = true;
    setTimeout(() => { this.correctBusy = false; }, 350);

    const targetPos = this.monster.group.position.clone();
    targetPos.y += 1.2;

    if (this.fpsFx) {
      this.fpsFx.firePlayerAttack(targetPos, () => {
        this.monster?.triggerHitReact();
        if (isLast) {
          this.monster?.triggerDisperse();
        }
      });
    } else {
      this.monster.triggerHitReact();
      if (isLast) {
        this.monster.triggerDisperse();
      }
    }
  }

  onWrong() {
    if (!this.monster || this.wrongBusy) return;
    this.wrongBusy = true;
    setTimeout(() => { this.wrongBusy = false; }, 350);

    this.monster.triggerLunge();
    this.fpsFx?.addTrauma(0.75);

    if (this.vignette) {
      this.vignette.classList.add('visible');
      setTimeout(() => {
        if (!this.disposed && this.vignette) {
          this.vignette.classList.remove('visible');
        }
      }, 350);
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    if (_activeBossArena === this) {
      setActiveBossArena(null);
    }
    if (this.camera && this.appliedShake) {
      this.camera.rotation.z -= this.appliedShake.roll;
      this.camera.position.x -= this.appliedShake.posX;
      this.camera.position.y -= this.appliedShake.posY;
      this.appliedShake = null;
    }
    if (this.animId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animId);
    }
    if (this.monster) {
      this.scene?.remove(this.monster.group);
      this.monster.dispose();
      this.monster = null;
    }
    if (this.fpsFx) {
      this.fpsFx.dispose();
      this.fpsFx = null;
    }
    if (this.vignette) {
      this.vignette.remove();
      this.vignette = null;
    }
  }
}
