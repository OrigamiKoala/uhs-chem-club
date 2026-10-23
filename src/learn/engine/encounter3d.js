/**
 * encounter3d.js — The fight, stood in front of the player.
 *
 * At T4 a stage that declares an `encounter` stands a built body in the well
 * of every station (`foebody.js`). It only observes the 2D encounter.
 */

import * as THREE from 'three';
import { buildFoeBody } from './foebody.js';
import { encounterSnapshot } from './bench-host.js';
import { soundscape } from '../../audio/soundscape.js';

/** Where in the well's frame each species stands, by instrument head. */
// Where a body stands relative to its station's well. A tabletop's corner pad has no well, so a body stands at the pad's centre.
const PERCH = {
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

export class FoeLayer3D {
  /**
   * @param {object} viewer the `BenchViewer3D` this layer stands on
   */
  constructor(viewer) {
    this.viewer = viewer;
    this.group = new THREE.Group();
    this.group.name = 'foes';
    viewer.root.add(this.group);

    /** @type {Map<string, object>} foe id -> body in well */
    this.bodies = new Map();

    this.enc = null;
    this.lost = 0;
    this.dirty = false;
    this.poses = new Map();
    this.disposed = false;

    const snap = encounterSnapshot();
    if (snap) this.sync(snap);
  }

  /* ---------------- fed by the 2D encounter ---------------- */

  /** A stage began (or ended): `enc` is `resolveEncounter(stage)` or null. */
  begin(enc) {
    this.dropBodies();
    this.enc = enc || null;
    this.poses = new Map();
    this.lost = 0;
    this.dirty = Boolean(this.enc);

    if (this.enc) {
      if (this.viewer.stations.length || this.viewer.foeSpots?.(1)) this.layout();
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
      if (!reducedMotion()) soundscape.playKeyCapThunk?.();
    }

    this.lost = lost;
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
    }
  }

  /* ---------------- standing on the bench ---------------- */

  /**
   * Stand a body in every station's well. Called whenever the stations change. A TABLETOP has no wells: its
   * viewer answers `foeSpots(n)` instead (the corner pad of the table, `table/layout.js`), and the foes stand
   * there, watching the table.
   */
  layout() {
    if (this.disposed || !this.enc) return;
    const stations = this.viewer.stations;
    const spots = stations.length ? null : this.viewer.foeSpots?.(this.enc.foes.length);
    if (!stations.length && !spots) return;
    this.dirty = false;
    const reduced = reducedMotion();

    this.enc.foes.forEach((foe, i) => {
      const st = spots ? null : stations[i];
      if (!spots && !st) return;
      let body = this.bodies.get(foe.id);
      if (!body) {
        body = buildFoeBody(this.enc.species, foe);
        if (!body) return;
        body.stationIndex = i;
        body.hit.userData.foeBody = body;
        this.group.add(body.group);
        this.bodies.set(foe.id, body);
        body.lastEntry = undefined;
      }
      body.stationIndex = i;
      body.station = st;
      const perch = (!spots && PERCH[this.enc.species]) || { x: 0, y: 0, z: 0 };
      if (spots) {
        body.baseX = spots[i].x + perch.x;
        body.baseY = spots[i].y + perch.y;
        body.baseZ = spots[i].z + perch.z;
      } else {
        body.baseX = st.group.position.x + perch.x;
        body.baseY = 0.95 + perch.y;
        body.baseZ = st.group.position.z + perch.z;
      }
      body.group.position.set(body.baseX, body.baseY, body.baseZ);
    });
    // A boss fought across an arena (`three/arena-table.js`) is the real one, standing in the world: the toy in the table's corner stands down.
    this.group.visible = !this.viewer.arenaFight;
    this.applyPoses();
    if (reduced) for (const b of this.bodies.values()) b.snap?.();
  }

  /** The stations were torn down: nothing stands in a well that is not there. */
  hide() {
    this.group.visible = false;
    this.dirty = Boolean(this.enc);
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
    if (this.dirty && (this.viewer.stations.length || this.viewer.foeSpots)) this.layout();
    const reduced = reducedMotion();
    const step = Math.min(dt, 0.05);

    const eye = this.viewer.camera.getWorldPosition(_eye);
    this.viewer.root.worldToLocal(eye);

    for (const b of this.bodies.values()) {
      b.update(step, reduced, Math.atan2(eye.x - b.baseX, eye.z - b.baseZ));
    }

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

    return null;
  }

  dispose() {
    this.disposed = true;
    this.dropBodies();
    this.group.parent?.remove(this.group);
    this.enc = null;
  }
}
