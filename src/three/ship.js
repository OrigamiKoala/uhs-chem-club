/**
 * ship.js — The Avalon's interior: a working ship, assembled from parts.
 *
 * THE DECK PLAN IS DATA. `ship-rooms.js` says where every bulkhead stands, how
 * wide its opening is and how high the deckhead is; `ship/hull.js` builds the
 * structure from that description and registers one collider per SOLID wall
 * segment, so a doorway is walkable because there is genuinely nothing in it.
 *
 * THE SHIP IS BUILT, NOT MODELLED. Every compartment is lined with the same
 * section by `ship/kit.js` — kick plate, panelled courses between structural
 * ribs, an upper chamfer, a coffered deckhead with light troughs — and the
 * rooms in `ship/rooms/` stand their own equipment in front of it. The bow is
 * a faceted nose under a raked canopy with the flight pods in it; aft of the
 * bridge a spine runs the length of the ship with berths and comms to port,
 * the cargo hold, the ladderwell and the airlock to starboard, and the engine
 * room across the stern.
 *
 * This file is the orchestrator and the public face: `stage.js` and
 * `verify:ship` talk to `ShipInterior` and to nothing under `ship/`.
 */

import * as THREE from "three";
import { enableAO, mergeStatic } from "./materials/pbr-kit.js";
import {
  createQuestHoloTexture,
  createCommsStandingsTexture,
  createCommsHoloTexture,
  createCargoManifestTexture
} from "./materials/textures.js";
import { createPlanetMaterial, createRingMaterial } from "./materials/celestial.js";
import { HULL, ROOMS, WALLS, CEIL, WALL_T, DOOR_H, wallSegments, roomAt } from "./ship-rooms.js";
import { tierAtLeast } from "./tier.js";
import { aimBoxFromBounds } from "./aim-target.js";
import { session } from "../session.js";

import { createShipMaterials } from "./ship/materials.js";
import { applyWorldUVs } from "./ship/kit.js";
import { buildHull } from "./ship/hull.js";
import { buildDoors, updateDoors } from "./ship/doors.js";
import { buildCorridor } from "./ship/corridor.js";
import { buildBridgeRoom, CLUB_BOARD_POS, BRIDGE_STAND } from "./ship/rooms/bridge.js";
import { buildCockpitRoom } from "./ship/rooms/cockpit.js";
import { buildStarmapRoom } from "./ship/rooms/starmap.js";
import { buildBerth } from "./ship/rooms/berths.js";
import { buildCargoRoom } from "./ship/rooms/cargo.js";
import { buildStairwellRoom } from "./ship/rooms/stairwell.js";
import { buildCommsRoom } from "./ship/rooms/comms.js";
import { buildAirlockRoom } from "./ship/rooms/airlock.js";
import { buildFurnaceRoom } from "./ship/rooms/furnace.js";

export { CLUB_BOARD_POS, BRIDGE_STAND };

/** How far the airlock leaf swings inward, in radians, before it meets its stop. */
const AIRLOCK_LEAF_SWING = 1.35;

export class ShipInterior {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.colliders = [];            // AABB { minX, maxX, minZ, maxZ }
    this.animatedElements = [];     // { obj, speed, isHover?, baseY? } or { update(delta, time) }
    this.interactiveTerminals = []; // { id, name, pos, route, prompt?, aim? }
    this.lightSources = [];         // { id, pos: Vector3, color: Color, intensity, distance, decay }
    this.dustParticles = null;
    this._bakes = [];

    Object.assign(this, createShipMaterials());

    this.hull = new THREE.Group();
    this.hull.name = 'hull';
    this.group.add(this.hull);

    buildHull(this);
    this.doors = buildDoors(this, this.hull);
    buildCorridor(this);

    buildBridgeRoom(this);
    buildCockpitRoom(this);
    buildStarmapRoom(this);
    buildBerth(this, 'quarters', { locker: 'ortega', designator: 'BERTH A' });
    buildBerth(this, 'berth_b', { locker: 'cadet', designator: 'BERTH B' });
    buildCargoRoom(this);
    buildStairwellRoom(this);
    buildCommsRoom(this);
    buildAirlockRoom(this);
    buildFurnaceRoom(this);

    this.buildAtmosphericDust();
    this.buildPlanetaryVista();

    // World-scale texture, then bake: the lining alone is thousands of parts
    // and must cost a handful of draw calls, not thousands.
    applyWorldUVs(this.group);
    mergeStatic(this.hull);
    for (const g of this._bakes) mergeStatic(g);
    this.enableAmbientOcclusion();

    this.scene.add(this.group);

    this.clubHoloClosed = false;
    this.starmapHoloClosed = false;
    const isAuthed = Boolean(session?.token && session?.player);
    this.setClubHoloVisible(isAuthed);
    this.setStarmapHoloVisible(true);
  }

  /* ====================================================================
     SERVICES THE ROOMS USE
     ==================================================================== */

  addCollider(minX, maxX, minZ, maxZ) {
    this.colliders.push({ minX, maxX, minZ, maxZ });
  }

  /**
   * Declare a point light the pool may use. The ship has far more fixtures
   * than the forward renderer has lights; `ShipLightPool` lights the nearest.
   */
  addLight(id, pos, color, intensity = 2.6, distance = 9, decay = 1.2) {
    this.lightSources.push({
      id,
      pos: new THREE.Vector3(...pos),
      color: new THREE.Color(color),
      intensity, distance, decay
    });
  }

  /**
   * Register a group to be baked into one mesh per material once the ship is
   * built. Anything under it that must stay addressable (a screen whose
   * texture is swapped, a part that animates) sets `userData.noMerge`.
   */
  bake(group) {
    this._bakes.push(group);
    return group;
  }

  /**
   * Turn on ambient occlusion everywhere a material carries one. `aoMap`
   * samples the SECOND uv set, which a primitive geometry does not have, so
   * a generated occlusion map does nothing until the mesh is told to reuse
   * its own UVs for it.
   */
  enableAmbientOcclusion() {
    const done = new Set();
    this.group.traverse(o => {
      if (!o.geometry || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some(m => m && m.aoMap)) return;
      if (done.has(o.geometry)) return;
      done.add(o.geometry);
      enableAO(o.geometry);
    });
  }

  /**
   * Is anything standing between the bridge standing position and the club
   * board? Exposed so `verify:ship` can ask the built ship rather than trust a
   * comment. Pure collider arithmetic.
   */
  assertClearSightline(from = BRIDGE_STAND, to = CLUB_BOARD_POS) {
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from[0] + (to[0] - from[0]) * t;
      const z = from[2] + (to[2] - from[2]) * t;
      const hit = this.colliders.find(c =>
        x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ
      );
      if (hit) return { clear: false, at: [+x.toFixed(2), +z.toFixed(2)], box: hit };
    }
    return { clear: true };
  }

  /* ====================================================================
     AIR AND VIEW
     ==================================================================== */

  buildAtmosphericDust() {
    const dustCount = tierAtLeast("T4") ? 1800 : 800;
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(dustCount * 3);
    const spanX = HULL.maxX - HULL.minX;
    const spanZ = HULL.maxZ - HULL.minZ;
    const midZ = (HULL.maxZ + HULL.minZ) / 2;
    for (let i = 0; i < dustCount; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * spanX;
      dPos[i * 3 + 1] = 0.2 + Math.random() * (CEIL.room - 0.4);
      dPos[i * 3 + 2] = midZ + (Math.random() - 0.5) * spanZ;
    }
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dMat = new THREE.PointsMaterial({
      color: 0xc9a46a, size: 0.022, transparent: true,
      opacity: 0.28, blending: THREE.NormalBlending, depthWrite: false
    });
    this.dustParticles = new THREE.Points(dGeo, dMat);
    this.dustParticles.userData.phys = 'ambient';
    this.group.add(this.dustParticles);
  }

  buildPlanetaryVista() {
    const vista = new THREE.Group();
    vista.name = 'vista';
    vista.userData.phys = 'ambient';
    const giantCenter = new THREE.Vector3(-25, 14, 85);
    const giantRadius = 22;

    const giant = new THREE.Mesh(
      new THREE.SphereGeometry(giantRadius, 48, 32),
      createPlanetMaterial("gas", {
        colors: ["#cdbb98", "#9c7a52", "#6f4a33", "#b8805a"],
        atmo: "#c9c2b4",
        atmoStrength: 0.35,
        seed: [3.1, 0.0, 7.4],
        octaves: 4
      })
    );
    const giantFrame = new THREE.Group();
    giantFrame.position.copy(giantCenter);
    giantFrame.rotation.set(0.32, 0, 0.3);
    giantFrame.add(giant);
    vista.add(giantFrame);

    const rings = new THREE.Mesh(
      new THREE.RingGeometry(giantRadius * 1.3, giantRadius * 2.25, 64, 1),
      createRingMaterial({
        inner: giantRadius * 1.3,
        outer: giantRadius * 2.25,
        planetCenter: giantCenter,
        planetRadius: giantRadius,
        colors: ["#b7a891", "#8a7a66"]
      })
    );
    rings.position.copy(giantCenter);
    rings.rotation.set(0.32 + Math.PI / 2, 0, 0.3);
    vista.add(rings);

    this.group.add(vista);
  }

  /* ====================================================================
     DISPLAYS AND HOLOGRAMS
     ==================================================================== */

  updateDisplays(questData = {}, standingsData = {}, inventoryData = {}) {
    if (this.starmapHoloMat) {
      const q = questData;
      const newQTex = createQuestHoloTexture(q.cleared || 0, q.total || 20, q.transmission || '');
      this.starmapHoloMat.map?.dispose();
      this.starmapHoloMat.map = newQTex;
      this.starmapHoloMat.needsUpdate = true;
    }

    if (this.commsScreenMat) {
      const s = standingsData;
      const newSTex = createCommsStandingsTexture(s.teams || [], s.chatter || '');
      this.commsScreenMat.map?.dispose();
      this.commsScreenMat.map = newSTex;
      this.commsScreenMat.needsUpdate = true;
    }

    if (this.commsHoloMat) {
      const s = standingsData;
      const newHTex = createCommsHoloTexture(s.teams || [], s.chatter || '');
      this.commsHoloMat.map?.dispose();
      this.commsHoloMat.map = newHTex;
      this.commsHoloMat.needsUpdate = true;
    }

    if (this.cargoScreenMat) {
      const inv = inventoryData;
      const newMTex = createCargoManifestTexture(inv.count || 0, inv.max || 8, inv.trinket || '');
      this.cargoScreenMat.map?.dispose();
      this.cargoScreenMat.map = newMTex;
      this.cargoScreenMat.needsUpdate = true;
    }
  }

  /**
   * The board is a physical object in the room, so nothing about it knows the
   * shape of the glass it is being looked through. The screen and the beam
   * that throws it scale together; `stage.fitClubHolo` decides by how much.
   */
  setClubHoloScale(scale) {
    const s = Math.max(0.2, Math.min(1, Number(scale) || 1));
    if (this.clubHoloGroup) this.clubHoloGroup.scale.setScalar(s);
    if (this.clubHoloBeam) this.clubHoloBeam.scale.set(s, 1, s);
  }

  setClubHoloVisible(visible, force = false) {
    if (!force && this.clubHoloClosed) visible = false;
    const v = Boolean(visible);
    if (this.clubHoloGroup) this.clubHoloGroup.visible = v;
    if (this.clubHoloBeam) this.clubHoloBeam.visible = v;
  }
  closeClubHolo() { this.clubHoloClosed = true; this.setClubHoloVisible(false, true); }
  openClubHolo() { this.clubHoloClosed = false; this.setClubHoloVisible(true, true); }
  toggleClubHolo() {
    if (this.isClubHoloVisible()) this.closeClubHolo(); else this.openClubHolo();
    return this.isClubHoloVisible();
  }
  isClubHoloVisible() { return Boolean(this.clubHoloGroup && this.clubHoloGroup.visible); }

  setStarmapHoloVisible(visible, force = false) {
    if (!force && this.starmapHoloClosed) visible = false;
    if (this.starmapHoloGroup) this.starmapHoloGroup.visible = Boolean(visible);
  }
  closeStarmapHolo() { this.starmapHoloClosed = true; this.setStarmapHoloVisible(false, true); }
  openStarmapHolo() { this.starmapHoloClosed = false; this.setStarmapHoloVisible(true, true); }
  toggleStarmapHolo() {
    if (this.isStarmapHoloVisible()) this.closeStarmapHolo(); else this.openStarmapHolo();
    return this.isStarmapHoloVisible();
  }
  isStarmapHoloVisible() { return Boolean(this.starmapHoloGroup && this.starmapHoloGroup.visible); }

  setCommsHoloVisible(visible, force = false) {
    if (!force && this.commsHoloClosed) visible = false;
    const v = Boolean(visible);
    if (this.commsHoloGroup) this.commsHoloGroup.visible = v;
    if (this.commsHoloBeam) this.commsHoloBeam.visible = v;
  }
  closeCommsHolo() { this.commsHoloClosed = true; this.setCommsHoloVisible(false, true); }
  openCommsHolo() { this.commsHoloClosed = false; this.setCommsHoloVisible(true, true); }
  toggleCommsHolo() {
    if (this.isCommsHoloVisible()) this.closeCommsHolo(); else this.openCommsHolo();
    return this.isCommsHoloVisible();
  }
  isCommsHoloVisible() { return Boolean(this.commsHoloGroup && this.commsHoloGroup.visible); }

  /* ====================================================================
     DOORS, AIM AND COLLIDERS
     ==================================================================== */

  getActiveColliders() {
    const closed = this.doors
      ? this.doors.filter(d => !d.isOpen).map(d => d.collider).filter(Boolean)
      : [];
    return [...this.colliders, ...closed];
  }

  /**
   * Everything [E] can act on aboard, as `pickAimTarget` candidates: every
   * station's own furniture. Doors are not on the list — they part for a
   * player who walks up to them. What the player is LOOKING at decides
   * between stations, never which is nearest.
   */
  getAimTargets() {
    if (!this._aimTargets) {
      this._aimTargets = this.interactiveTerminals
        .filter(t => t.aim)
        .map(t => ({ kind: 'terminal', terminal: t, reach: 2.6, boxes: t.aim }));
    }
    return this._aimTargets;
  }

  /**
   * The bulkheads, as boxes that stop the view ray: a terminal on the far
   * side of a wall is not in front of you, however close it is.
   */
  getAimBlockers() {
    if (!this._aimBlockers) {
      this._aimBlockers = [];
      for (const wall of WALLS) {
        for (const [a, b] of wallSegments(wall)) {
          this._aimBlockers.push(wall.axis === 'x'
            ? aimBoxFromBounds(wall.at - WALL_T / 2, wall.at + WALL_T / 2, 0, wall.top, a, b)
            : aimBoxFromBounds(a, b, 0, wall.top, wall.at - WALL_T / 2, wall.at + WALL_T / 2));
        }
      }
      // A shut door stops the view as surely as the wall it is set in.
      for (const d of this.doors || []) {
        const c = d.collider;
        const box = aimBoxFromBounds(c.minX, c.maxX, 0, DOOR_H, c.minZ, c.maxZ);
        box.door = d;
        this._aimBlockers.push(box);
      }
    }
    return this._aimBlockers.filter(b => !b.door || !b.door.isOpen);
  }

  /**
   * Swing the airlock's outer leaf: 0 is dogged shut on its seal, 1 is open
   * against its stop inside the lock. Only the voyage opens it, and only once
   * the ship is down on a world — there is vacuum on the other side otherwise.
   */
  setAirlockOpen(t) {
    if (!this.airlockLeaf) return;
    const k = Math.max(0, Math.min(1, t));
    this.airlockLeaf.rotation.y = -AIRLOCK_LEAF_SWING * k;
  }

  /** Hide or show the canopy vista (the gas giant): a voyage draws its own sky. */
  setVistaVisible(on) {
    const v = this.group.getObjectByName('vista');
    if (v) v.visible = Boolean(on);
  }

  /** Hold a door open or shut by hand; it goes back to automatic once you leave. */
  toggleDoor(door) {
    if (!door) return false;
    door.held = !door.isOpen;
    door.isOpen = door.held;
    return door.isOpen;
  }
  openDoor(door) { if (door) { door.held = true; door.isOpen = true; } }
  closeDoor(door) { if (door) { door.held = false; door.isOpen = false; } }

  /**
   * One frame. `viewer` is the camera's position, which is what the doors
   * answer to. Returns true when a door opened or shut, so the caller can
   * hand the walk the new set of colliders.
   */
  update(delta, time, viewer = null) {
    const changed = updateDoors(this.doors, delta, viewer);

    for (const el of this.animatedElements) {
      if (typeof el.update === 'function') {
        el.update(delta, time);
      } else if (el.isHover) {
        el.obj.position.y = (el.baseY !== undefined ? el.baseY : 1.95) + Math.sin(time * 1.5) * 0.04;
      } else if (el.obj) {
        el.obj.rotation.z += delta * el.speed;
      }
    }

    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - delta * 0.05;
        if (y < 0.2) y = CEIL.room - 0.3;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
    return changed;
  }
}

export { ROOMS, roomAt };
