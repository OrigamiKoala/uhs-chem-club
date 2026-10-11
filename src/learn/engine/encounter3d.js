/**
 * encounter3d.js — The fight, stood on the bench.
 *
 * At T4 a stage that declares an `encounter` has its foes as BUILT BODIES
 * (`foebody.js`) in the wells of the instrument, so "four samples" really is
 * four foes in front of the player (docs/plans/storyline-and-combat.md, Phase 5).
 * This file owns where they stand and when they move; it decides nothing.
 *
 * WHAT IT CAN AND CANNOT DO
 *   - IT OBSERVES. The 2D `Encounter` is the one place a fight's state lives. It
 *     hands this layer a snapshot (`{ enc, fight, poses }`) every time it paints,
 *     and the layer moves each body into the pose the snapshot names. A pose is
 *     whatever `planFoe` returned — which asked the instrument's own planner —
 *     so a husk in this layer splits only when the cutter really splits it.
 *     Nothing here is read by the frame, and nothing here can refuse an answer.
 *   - THE INSTRUMENT STAYS THE PLAYER'S RIG. A foe stands IN the well, on the
 *     crate it is made of, low enough that the screen raked behind it is never
 *     hidden (`verify:bench` casts a ray from the camera to the screen's corners
 *     and fails any body in the way). The flat picture is still the picture.
 *   - A PRESS ON A FOE IS A PRESS ON ITS STATION. The body is a target the way
 *     the tray is, so on a stage that asks which sample, tapping the husk is
 *     choosing it. It goes through `stationUnderRay`, never around it.
 *   - REDUCED MOTION. Every pose snaps and the idle tremor is off.
 *   - NO FOE, NO COST. A viewer with no encounter builds nothing: the group is
 *     empty and `update` returns at once.
 */

import * as THREE from 'three';
import { buildFoeBody } from './foebody.js';
import { encounterSnapshot } from './bench-host.js';
import { soundscape } from '../../audio/soundscape.js';

/** Where in the well's frame each species stands, by instrument head. */
const PERCH = {
  // The moth clings to the vacuum tube over its metal plate.
  'lamp moth': { x: -0.07, y: 0.11, z: 0 },
  // A bladder lies on the plate in front of the barrel, low, so the screen behind it stays whole.
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

    /** @type {Map<string, object>} foe id -> body */
    this.bodies = new Map();
    this.enc = null;
    this.lost = 0;
    this.dirty = false;
    this.poses = new Map();
    this.disposed = false;

    // The frame builds the encounter plate before the instrument exists, so a
    // viewer arriving mid-stage asks what the stage already began.
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
    if (this.enc && this.viewer.stations.length) this.layout();
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

    // A committed miss: every foe comes at the player once. (The 2D plate has
    // already announced the reason; this is the body language that follows.)
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
      if (!body) continue;
      const got = this.poses.get(foe.id);
      if (body.lastEntry === got) continue;
      body.lastEntry = got;
      body.setPose(got?.pose || 'idle', got, instant);
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
      // The station's content frame: its group's x on the bench, the well floor at 0.95.
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
    // Where the player's eye is, in the bench's own frame: the foes keep it in front of them.
    const eye = this.viewer.camera.getWorldPosition(_eye);
    this.viewer.root.worldToLocal(eye);
    for (const b of this.bodies.values()) {
      b.update(step, reduced, Math.atan2(eye.x - b.baseX, eye.z - b.baseZ));
    }
  }

  /* ---------------- pressing a foe ---------------- */

  /** The station whose foe the ray passes through, or null. */
  stationUnderRay(raycaster) {
    if (this.disposed || !this.group.visible || !this.bodies.size) return null;
    const hits = [];
    for (const b of this.bodies.values()) {
      if (!b.group.visible) continue;
      const h = raycaster.intersectObject(b.hit, false);
      if (h.length) hits.push({ d: h[0].distance, st: b.station });
    }
    hits.sort((a, c) => a.d - c.d);
    return hits[0]?.st || null;
  }

  dispose() {
    this.disposed = true;
    this.dropBodies();
    this.group.parent?.remove(this.group);
    this.enc = null;
  }
}
