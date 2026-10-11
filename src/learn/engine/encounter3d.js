/**
 * encounter3d.js — The fight, stood in front of the player.
 *
 * At T4 a stage that declares an `encounter` stands actual 3D MONSTERS
 * in front of the player facing them across the arena with full FPS combat:
 * weapon discharge, plasma beam tracers, muzzle flashes, hitmarkers,
 * damage vignettes, monster stagger reactions, and violent counter-lunges.
 *
 * Also maintains the well spoil bodies (`foebody.js`) for instrument wells.
 */

import * as THREE from 'three';
import { buildFoeBody } from './foebody.js';
import { encounterSnapshot } from './bench-host.js';
import { soundscape } from '../../audio/soundscape.js';
import { CombatMonster3D } from './combat-monster-3d.js';
import { CombatFpsFx } from './combat-fps-fx.js';
import { CombatFpsHud } from './combat-fps-hud.js';

/** Where in the well's frame each species stands, by instrument head. */
const PERCH = {
  'lamp moth': { x: -0.07, y: 0.11, z: 0 },
  'gas bladder': { x: 0, y: 0, z: 0.15 },
  'the compressor': { x: 0, y: 0, z: 0.1 }
};

const _eye = new THREE.Vector3();

function reducedMotion() {
  try {
    if (localStorage.getItem('avalon_motion_pref') === 'true') return true;
  } catch { /* storage can be blocked */ }
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  } catch { return false; }
}

function isRealBrowser() {
  if (typeof process !== 'undefined' && Boolean(process.versions?.node)) return false;
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (globalThis.__IS_SHIM__ || globalThis.document?.isShim) return false;
  return true;
}

export class FoeLayer3D {
  /**
   * @param {object} viewer the `BenchViewer3D` this layer stands on
   * @param {{ tints?: object }} [opts] the dust palette the crates are poured in
   */
  constructor(viewer, opts = {}) {
    this.viewer = viewer;
    this.tints = opts.tints || null;
    this.group = new THREE.Group();
    this.group.name = 'foes';
    viewer.root.add(this.group);

    /** @type {Map<string, object>} foe id -> body in well */
    this.bodies = new Map();
    /** @type {CombatMonster3D[]} 3D Life-sized monsters */
    this.monsters = [];

    this.enc = null;
    this.lost = 0;
    this.dirty = false;
    this.poses = new Map();
    this.disposed = false;
    this.onDocClick = null;

    if (isRealBrowser() && viewer.scene && viewer.camera) {
      this.fpsFx = new CombatFpsFx(viewer.scene, viewer.camera);
      this.fpsHud = new CombatFpsHud(document.body, viewer.camera);
      this.fpsHud.onStrike = () => this.triggerPlayerAttack();
    } else {
      this.fpsFx = null;
      this.fpsHud = null;
    }

    const snap = encounterSnapshot();
    if (snap) this.sync(snap);
  }

  /* ---------------- fed by the 2D encounter ---------------- */

  /** A stage began (or ended): `enc` is `resolveEncounter(stage)` or null. */
  begin(enc) {
    this.dropBodies();
    this.dropMonsters();
    this.enc = enc || null;
    this.poses = new Map();
    this.lost = 0;
    this.dirty = Boolean(this.enc);

    if (this.enc) {
      if (this.viewer.stations.length) this.layout();
      this.layoutCombatMonsters();
    } else {
      this.fpsHud?.hide();
      this.detachCommitListener();
    }
  }

  /**
   * The fight moved. `snap` is `{ enc, fight, poses }` from `Encounter`, or
   * null when it ended.
   */
  sync(snap) {
    if (this.disposed) return;
    const enc = snap?.enc || null;
    if (enc !== this.enc) this.begin(enc);
    if (!enc) return;
    this.poses = snap.poses || new Map();

    // A committed miss: every foe comes at the player once.
    const lost = snap.fight?.lost ?? 0;
    if (lost > this.lost) {
      for (const b of this.bodies.values()) b.hitPlayer?.();
      for (const m of this.monsters) m.triggerLunge?.();
      this.fpsFx?.addTrauma(0.65);
      this.fpsHud?.triggerDamageFlash();
      if (!reducedMotion()) soundscape.playKeyCapThunk?.();
    }

    if (snap.fight?.won) {
      for (const m of this.monsters) m.triggerDisperse?.();
    }

    this.lost = lost;
    this.fpsHud?.updateThreatPlate(this.enc, snap.fight);
    this.applyPoses();
  }

  applyPoses() {
    const instant = reducedMotion();
    for (const foe of this.enc?.foes || []) {
      const body = this.bodies.get(foe.id);
      const got = this.poses.get(foe.id);
      if (body) {
        if (body.lastEntry !== got) {
          body.lastEntry = got;
          body.setPose(got?.pose || 'idle', got, instant);
        }
      }
      const monster = this.monsters.find(m => m.foe.id === foe.id);
      if (monster) {
        if (got?.pose === 'dispersed') {
          monster.triggerDisperse();
        }
      }
    }
  }

  /* ---------------- 3D Life-Sized Combat Monsters in Arena ---------------- */

  layoutCombatMonsters() {
    this.dropMonsters();
    if (!this.enc || !this.enc.foes?.length) return;

    const n = this.enc.foes.length;
    const span = Math.min(2.4, (n - 1) * 0.95);

    this.enc.foes.forEach((foe, i) => {
      const x = n === 1 ? 0 : -span / 2 + (i / Math.max(1, n - 1)) * span;
      const z = -2.2 - (i % 2) * 0.35;
      const y = 1.15;
      const monster = new CombatMonster3D(this.enc.species, foe, { x, y, z });
      this.group.add(monster.group);
      this.monsters.push(monster);
    });

    if (this.fpsHud) {
      this.fpsHud.setMonsters(this.monsters);
      this.fpsHud.show(this.enc, null);
    }
    this.attachCommitListener();
  }

  dropMonsters() {
    for (const m of this.monsters) {
      this.group.remove(m.group);
      m.dispose?.();
    }
    this.monsters = [];
  }

  attachCommitListener() {
    if (typeof document === 'undefined') return;
    this.detachCommitListener();
    this.onDocClick = (e) => {
      if (e.target.closest?.('.lq-commit')) {
        this.triggerPlayerAttack();
      }
    };
    document.addEventListener('click', this.onDocClick);
  }

  detachCommitListener() {
    if (this.onDocClick && typeof document !== 'undefined') {
      document.removeEventListener('click', this.onDocClick);
      this.onDocClick = null;
    }
  }

  triggerPlayerAttack() {
    if (!this.monsters.length || !this.fpsFx) {
      // Also click the Commit button if triggered via HUD
      const commitBtn = document.querySelector('.lq-commit');
      if (commitBtn && !commitBtn.disabled) commitBtn.click();
      return;
    }

    const target = this.monsters[0];
    if (!target || !target.group.visible) return;

    const targetPos = new THREE.Vector3();
    target.group.getWorldPosition(targetPos);
    targetPos.y += 0.85;

    this.fpsFx.firePlayerAttack(targetPos, () => {
      target.triggerHitReact();
      this.fpsHud?.triggerHitmarker();
    });

    // Also trigger the stage commit if initiated from crosshair
    const commitBtn = document.querySelector('.lq-commit');
    if (commitBtn && !commitBtn.disabled && !document.activeElement?.closest?.('.lq-commit')) {
      commitBtn.click();
    }
  }

  /* ---------------- standing on the bench ---------------- */

  /** Stand a body in every station's well. Called whenever the stations change. */
  layout() {
    if (this.disposed || !this.enc) return;
    this.dirty = false;
    const stations = this.viewer.stations;
    const reduced = reducedMotion();

    this.enc.foes.forEach((foe, i) => {
      const st = stations[i];
      if (!st) return;
      let body = this.bodies.get(foe.id);
      if (!body) {
        body = buildFoeBody(this.enc.species, foe, { kinds: this.enc.env?.kinds, tints: this.tints });
        if (!body) return;
        body.stationIndex = i;
        body.hit.userData.foeBody = body;
        this.group.add(body.group);
        this.bodies.set(foe.id, body);
        body.lastEntry = undefined;
      }
      body.stationIndex = i;
      body.station = st;
      const perch = PERCH[this.enc.species] || { x: 0, y: 0, z: 0 };
      body.baseX = st.group.position.x + perch.x;
      body.baseY = 0.95 + perch.y;
      body.baseZ = st.group.position.z + perch.z;
      body.group.position.set(body.baseX, body.baseY, body.baseZ);
    });
    this.group.visible = true;
    this.applyPoses();
    if (reduced) for (const b of this.bodies.values()) b.snap?.();
  }

  /** The stations were torn down: nothing stands in a well that is not there. */
  hide() {
    this.group.visible = false;
    this.dirty = Boolean(this.enc);
    this.fpsHud?.hide();
  }

  dropBodies() {
    for (const b of this.bodies.values()) {
      this.group.remove(b.group);
      b.dispose?.();
    }
    this.bodies.clear();
  }

  /* ---------------- per frame ---------------- */

  update(dt) {
    if (this.disposed || !this.enc) return;
    if (this.dirty && this.viewer.stations.length) this.layout();
    const reduced = reducedMotion();
    const step = Math.min(dt, 0.05);

    // FPS camera trauma screenshake
    if (this.fpsFx) {
      this.fpsFx.update(step);
      const shake = this.fpsFx.getShakeOffsets();
      if (shake && this.viewer.camera) {
        this.viewer.camera.rotation.z = shake.roll;
        this.viewer.camera.position.x += shake.posX;
        this.viewer.camera.position.y += shake.posY;
      }
    }

    const eye = this.viewer.camera.getWorldPosition(_eye);
    this.viewer.root.worldToLocal(eye);

    for (const b of this.bodies.values()) {
      b.update(step, reduced, Math.atan2(eye.x - b.baseX, eye.z - b.baseZ));
    }

    for (const m of this.monsters) {
      m.update(step, reduced, eye);
    }

    this.fpsHud?.update(step);
  }

  /* ---------------- pressing a foe ---------------- */

  /** The station whose foe the ray passes through, or null. */
  stationUnderRay(raycaster) {
    if (this.disposed || !this.group.visible) return null;

    // Check station well bodies first
    const hits = [];
    for (const b of this.bodies.values()) {
      if (!b.group.visible) continue;
      const h = raycaster.intersectObject(b.hit, false);
      if (h.length) hits.push({ d: h[0].distance, st: b.station });
    }
    if (hits.length) {
      hits.sort((a, c) => a.d - c.d);
      return hits[0].st || null;
    }

    // Check click on life-sized 3D combat monsters
    for (const m of this.monsters) {
      if (!m.group.visible || !m.hitBox) continue;
      const h = raycaster.intersectObject(m.hitBox, false);
      if (h.length) {
        this.triggerPlayerAttack();
        return this.viewer.stations?.[0] || null;
      }
    }

    return null;
  }

  dispose() {
    this.disposed = true;
    this.detachCommitListener();
    this.dropBodies();
    this.dropMonsters();
    this.fpsFx?.dispose();
    this.fpsHud?.dispose();
    this.group.parent?.remove(this.group);
    this.enc = null;
  }
}
