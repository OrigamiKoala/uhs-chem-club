/**
 * ship/doors.js — Pressure doors.
 *
 * A DOOR IS A PORTAL AND TWO LEAVES. Every opening in a bulkhead is framed by
 * a heavy portal — a thick gunmetal ring with its upper corners cut off, the
 * shape every hatch on a ship of this class has — standing proud of the plate
 * on both faces. In it hang two leaves that part down the middle and slide
 * into the bulkhead, one each way, riding at different depths inside the wall
 * so a door's leaf and its neighbour's can share pocket without meeting.
 *
 * THEY OPEN FOR YOU. A door parts when a player comes within `OPEN_AT` of it
 * and shuts once they are `CLOSE_AT` away, which is how a door on a ship like
 * this behaves and means walking the spine is walking, not a sequence of key
 * presses. The collider is lifted the moment a door starts to open and put
 * back only once nobody is near enough to be caught in it, so a closing leaf
 * can never shove the player.
 *
 * Every threshold still names the compartment behind it, on both faces:
 * `roomAt` is asked what is actually half a metre through the opening, so a
 * bulkhead that moves takes its legend with it.
 */

import * as THREE from "three";
import { placard, mergeStatic } from "../materials/pbr-kit.js";
import { ROOMS, WALL_T, DOOR_H, doorways, roomAt } from "../ship-rooms.js";
import { DRESS, box, cyl, extrude, chamferedRect, archShape, lamp } from "./kit.js";

/*
 * A door has to be open BEFORE the player reaches it, not while they do. At
 * 1.9 m and 0.3 s of travel a sprinting player (7 m/s) met the leaves still
 * parting at the seal and read as walking through them. From 3 m, at
 * `OPEN_RATE`, the leaves are in their pockets with a walker still two metres
 * off and a sprinter a metre and a half off.
 */
export const OPEN_AT = 3.0;
export const CLOSE_AT = 3.6;
const OPEN_RATE = 4.6;    // full travel per second, parting
const CLOSE_RATE = 2.4;   // and closing, which nobody is waiting on
const LEAF_T = 0.045;
const LEAF_DEPTH = 0.04;   // each leaf rides this far either side of the wall's mid-plane

function buildLeaf(M, w, h, side) {
  // `side` −1 is the leaf that retreats toward −u, +1 toward +u. Its outer top
  // corner is cut to match the portal.
  const g = new THREE.Group();
  const c = DRESS.portalChamfer - 0.02;
  const shape = chamferedRect(w, h, c, [side < 0 ? 'tl' : 'tr'], side * w / 2, h / 2);
  const plate = extrude(g, M.panelMat, shape, LEAF_T);
  plate.position.z = -LEAF_T / 2;

  // Raised bands on both faces, a dark lower panel, and a rubber seal on the
  // meeting edge.
  for (const fz of [-1, 1]) {
    const z = fz * (LEAF_T / 2 + 0.006);
    for (const y of [0.78, 1.42]) box(g, M.panelDarkMat, w - 0.12, 0.07, 0.012, side * w / 2, y, z);
    box(g, M.panelDarkMat, w - 0.16, 0.5, 0.01, side * w / 2, 0.36, z);
    box(g, M.panelDarkMat, w - 0.24, 0.5, 0.008, side * (w / 2 + 0.03), 1.86 - (side > 0 ? 0 : 0), z);
    box(g, M.liveryMat, 0.05, 0.9, 0.009, side * 0.1, 1.1, z);
  }
  box(g, M.rubberMat, 0.03, h - 0.04, LEAF_T + 0.012, 0, h / 2, 0);
  // A leaf moves, so it cannot be baked into the hull; it is baked into
  // itself instead — a handful of meshes rather than a dozen per leaf.
  mergeStatic(g);
  return g;
}

/**
 * Raise every doorway's portal and doors. The portal and leaves go into the
 * hull group; the returned records drive `updateDoors` and the colliders.
 */
export function buildDoors(ship, hull) {
  const M = ship;
  const doors = [];
  const pw = DRESS.portalW, pd = DRESS.portalD, pc = DRESS.portalChamfer;

  for (const d of doorways()) {
    const frame = new THREE.Group();
    frame.name = 'door';
    frame.position.set(d.pos[0], 0, d.pos[1]);
    // Local x runs along the wall; local +z is the doorway's `through` direction.
    if (d.axis === 'x') frame.rotation.y = Math.PI / 2;

    const half = d.clear / 2;
    const depth = WALL_T + pd * 2;

    // --- The portal: a thick ring, upper corners cut, proud of both faces ---
    const outer = archShape(d.clear + pw * 2, DOOR_H + pw, pc + 0.12, d.clear, DOOR_H + 0.01, pc);
    const portal = extrude(frame, M.ribMat, outer, depth);
    portal.position.z = -depth / 2;

    // A second, thinner collar on each face, and a hazard band at the sill.
    for (const s of [-1, 1]) {
      const collar = archShape(d.clear + pw * 2 + 0.12, DOOR_H + pw + 0.06, pc + 0.16, d.clear + pw * 2 - 0.1, DOOR_H + pw - 0.05, pc + 0.1);
      const c = extrude(frame, M.gunmetalMat, collar, 0.03);
      c.position.z = s > 0 ? depth / 2 - 0.035 : -depth / 2 + 0.005;

      // Jamb lights: two amber slits running up each side of the portal.
      for (const j of [-1, 1]) {
        box(frame, M.gunmetalMat, 0.05, 1.5, 0.012, j * (half + pw / 2), 1.0, s * (depth / 2 + 0.006));
        box(frame, M.stripAmberMat, 0.018, 1.4, 0.006, j * (half + pw / 2), 1.0, s * (depth / 2 + 0.012));
      }

      // Header: the stencilled plate naming what is on THIS side.
      const probe = 0.5;
      const id = roomAt(d.pos[0] + d.through[0] * probe * s, d.pos[1] + d.through[1] * probe * s);
      const name = id ? ROOMS[id].name : null;
      box(frame, M.gunmetalMat, Math.min(1.1, d.clear - 0.3), 0.15, 0.02, 0, DOOR_H + pw / 2, s * (depth / 2 + 0.01));
      if (name) {
        const tag = placard(name, { w: Math.min(1.02, d.clear - 0.38), h: 0.11 });
        tag.position.set(0, DOOR_H + pw / 2, s * (depth / 2 + 0.022));
        if (s < 0) tag.rotation.y = Math.PI;
        frame.add(tag);
      }

      // The door's control box, beside the portal on this face.
      const cu = half + pw + 0.2;
      const panel = new THREE.Group();
      panel.position.set(s > 0 ? cu : -cu, 1.22, s * (WALL_T / 2));
      if (s < 0) panel.rotation.y = Math.PI;
      box(panel, M.gunmetalMat, 0.16, 0.26, 0.05, 0, 0, 0.025);
      box(panel, M.panelDarkMat, 0.12, 0.22, 0.01, 0, 0, 0.055);
      box(panel, M.screenGlassMat, 0.09, 0.05, 0.004, 0, 0.06, 0.061);
      for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
        box(panel, M.steelMat, 0.022, 0.018, 0.008, (q - 1) * 0.03, -0.02 - r * 0.028, 0.062);
      }
      lamp(panel, M, 0.045, 0.1, 0.055, M.greenLampMat, 0.009);
      frame.add(panel);
    }

    // Sill: tread-plate threshold across the opening with hazard striping.
    box(frame, M.trimMat, d.clear, 0.022, depth, 0, 0.011, 0);
    for (const s of [-1, 1]) box(frame, M.hazardMat, d.clear, 0.004, 0.06, 0, 0.024, s * (depth / 2 - 0.04));

    // --- The leaves ---
    const leafW = half + 0.015;
    const leaves = [];
    for (const side of [-1, 1]) {
      const carrier = new THREE.Group();
      carrier.userData.noMerge = true;
      carrier.position.set(0, 0, side * LEAF_DEPTH);
      const leaf = buildLeaf(M, leafW, DOOR_H - 0.01, side);
      // The meeting edge sits at u = 0, each leaf lapping 15 mm past it.
      leaf.position.x = side < 0 ? 0.015 : -0.015;
      carrier.add(leaf);
      frame.add(carrier);
      leaves.push({ carrier, side });
    }
    // Indicator over the opening, both faces: amber shut, green open.
    const lamps = [];
    for (const s of [-1, 1]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.01), M.amberLampMat.clone());
      l.position.set(0, DOOR_H - 0.03, s * (depth / 2 + 0.008));
      l.userData.noMerge = true;
      frame.add(l);
      lamps.push(l);
    }

    hull.add(frame);

    const collider = d.axis === 'x'
      ? { minX: d.pos[0] - WALL_T / 2 - 0.06, maxX: d.pos[0] + WALL_T / 2 + 0.06, minZ: d.pos[1] - half, maxZ: d.pos[1] + half }
      : { minX: d.pos[0] - half, maxX: d.pos[0] + half, minZ: d.pos[1] - WALL_T / 2 - 0.06, maxZ: d.pos[1] + WALL_T / 2 + 0.06 };

    doors.push({
      id: `door-${d.wall}-${d.pos[0].toFixed(2)}_${d.pos[1].toFixed(2)}`,
      doorway: d,
      pos: d.pos,
      axis: d.axis,
      leaves,
      lamps,
      travel: half,
      isOpen: false,
      open: 0,          // 0 shut … 1 fully parted
      held: null,       // null = automatic; true/false = someone pressed [E]
      collider
    });
  }
  return doors;
}

const AMBER = new THREE.Color(0xd99423);
const GREEN = new THREE.Color(0x6f9a3a);

/**
 * Drive the doors for one frame. Returns true when the set of closed doors —
 * and so the colliders — changed, so the caller can hand the walk new ones.
 */
export function updateDoors(doors, delta, viewer) {
  if (!doors) return false;
  let changed = false;
  for (const d of doors) {
    if (viewer) {
      const dist = Math.hypot(viewer.x - d.pos[0], viewer.z - d.pos[1]);
      if (d.held === null) {
        if (!d.isOpen && dist < OPEN_AT) { d.isOpen = true; changed = true; }
        else if (d.isOpen && dist > CLOSE_AT) { d.isOpen = false; changed = true; }
      } else if (d.held === false && d.isOpen) {
        d.isOpen = false; changed = true;
      } else if (d.held === true && !d.isOpen) {
        d.isOpen = true; changed = true;
      }
      // A manual close lasts until the player walks away and back.
      if (d.held !== null && dist > CLOSE_AT) d.held = null;
    }
    const target = d.isOpen ? 1 : 0;
    if (d.open !== target) {
      const step = Math.min(delta, 0.1) * (d.isOpen ? OPEN_RATE : CLOSE_RATE);
      d.open = d.isOpen ? Math.min(1, d.open + step) : Math.max(0, d.open - step);
      // Ease: fast off the seal, soft into the pocket.
      const e = d.open * d.open * (3 - 2 * d.open);
      for (const l of d.leaves) l.carrier.position.x = l.side * e * d.travel;
      for (const lm of d.lamps) lm.material.color.copy(d.open > 0.5 ? GREEN : AMBER);
    }
  }
  return changed;
}
