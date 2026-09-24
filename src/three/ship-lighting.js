/**
 * ship-lighting.js — Dynamic pooled interior lighting rig for Starship compartments
 *
 * Implements performance-safe point light pooling (<= 8 lights active simultaneously)
 * per threejs-game-optimization guidelines, providing generous range and soft decay
 * so corridors, bulkheads, consoles, and quarters are warmly and clearly illuminated.
 */

import * as THREE from 'three';

/**
 * The 21 fixtures the pool chooses from.
 *
 * ONE PER COMPARTMENT, and one per stretch of corridor between doorways. A
 * ship of small rooms needs its light distributed the way its walls are: a
 * single bright source in the middle of the deck used to reach everywhere
 * because there was nothing in the way, and now there is. Both berths, the
 * stairwell vestibule and the furnace room are on this list because they are
 * rooms, not because anything routes to them.
 *
 * The pool lights the 7 nearest, which with the camera's own inspection light
 * keeps the forward renderer inside its 8 PointLight budget.
 */
export const SHIP_LIGHT_SOURCES = [
  /* ---- THE BRIDGE: tall, and the only room with a view ---- */
  { id: 'bridge-overhead', pos: new THREE.Vector3(0, 3.1, 2.55), color: new THREE.Color(0xffd88a), intensity: 3.6, distance: 14, decay: 1.2 },
  { id: 'bridge-canopy', pos: new THREE.Vector3(0, 2.7, 4.0), color: new THREE.Color(0xffb844), intensity: 2.6, distance: 10, decay: 1.2 },
  { id: 'bridge-console-bank', pos: new THREE.Vector3(-4.2, 1.5, 2.5), color: new THREE.Color(0xffaa30), intensity: 2.4, distance: 8, decay: 1.2 },
  { id: 'cockpit-dash', pos: new THREE.Vector3(0, 1.3, 3.6), color: new THREE.Color(0xff9f1c), intensity: 2.2, distance: 7, decay: 1.2 },
  { id: 'starmap-holo-bay', pos: new THREE.Vector3(3.5, 2.7, 2.1), color: new THREE.Color(0xffaa38), intensity: 3.4, distance: 12, decay: 1.2 },
  { id: 'starmap-sun', pos: new THREE.Vector3(3.5, 1.45, 2.1), color: new THREE.Color(0xffdd55), intensity: 2.6, distance: 8, decay: 1.2 },

  /* ---- THE SPINE: one per stretch between doorways ---- */
  { id: 'spine-fwd', pos: new THREE.Vector3(0, 2.5, -0.9), color: new THREE.Color(0xffd68a), intensity: 2.6, distance: 9, decay: 1.2 },
  { id: 'spine-mid', pos: new THREE.Vector3(0, 2.5, -3.6), color: new THREE.Color(0xffd68a), intensity: 2.6, distance: 9, decay: 1.2 },
  { id: 'spine-aft', pos: new THREE.Vector3(0, 2.5, -6.3), color: new THREE.Color(0xffd68a), intensity: 2.6, distance: 9, decay: 1.2 },
  { id: 'spine-furnace-mouth', pos: new THREE.Vector3(0, 2.4, -7.6), color: new THREE.Color(0xffc24a), intensity: 2.2, distance: 8, decay: 1.2 },

  /* ---- PORT: berth A, berth B, comms ---- */
  { id: 'berth-a-ceiling', pos: new THREE.Vector3(-3.4, 2.5, -0.9), color: new THREE.Color(0xffba52), intensity: 3.0, distance: 11, decay: 1.2 },
  { id: 'berth-a-desk', pos: new THREE.Vector3(-2.2, 1.35, 0.0), color: new THREE.Color(0xffc86b), intensity: 2.0, distance: 6, decay: 1.2 },
  { id: 'berth-b-ceiling', pos: new THREE.Vector3(-3.4, 2.5, -3.7), color: new THREE.Color(0xffba52), intensity: 3.0, distance: 11, decay: 1.2 },
  { id: 'berth-b-desk', pos: new THREE.Vector3(-2.2, 1.35, -2.8), color: new THREE.Color(0xffc86b), intensity: 2.0, distance: 6, decay: 1.2 },
  { id: 'comms-bay', pos: new THREE.Vector3(-3.4, 2.5, -6.0), color: new THREE.Color(0xffb442), intensity: 3.0, distance: 11, decay: 1.2 },
  { id: 'comms-tubes', pos: new THREE.Vector3(-3.4, 2.2, -6.8), color: new THREE.Color(0xff9018), intensity: 2.0, distance: 6, decay: 1.2 },

  /* ---- STARBOARD: storage, the vestibule, the airlock ---- */
  { id: 'storage-bay', pos: new THREE.Vector3(2.9, 2.5, -0.7), color: new THREE.Color(0xffa838), intensity: 3.2, distance: 12, decay: 1.2 },
  { id: 'storage-rack', pos: new THREE.Vector3(4.6, 1.7, -1.4), color: new THREE.Color(0xffc24a), intensity: 2.0, distance: 6, decay: 1.2 },
  { id: 'stairwell-vestibule', pos: new THREE.Vector3(3.3, 2.5, -4.15), color: new THREE.Color(0xffb442), intensity: 2.8, distance: 10, decay: 1.2 },
  { id: 'airlock-staging', pos: new THREE.Vector3(3.2, 2.5, -6.6), color: new THREE.Color(0xffaa38), intensity: 3.0, distance: 11, decay: 1.2 },

  /* ---- THE FURNACE ROOM: the fire is the brightest thing aboard ---- */
  { id: 'furnace-firebox', pos: new THREE.Vector3(-3.0, 1.0, -9.1), color: new THREE.Color(0xe0762a), intensity: 4.2, distance: 12, decay: 1.2 },
  { id: 'furnace-bay', pos: new THREE.Vector3(0.4, 2.9, -9.4), color: new THREE.Color(0xffa838), intensity: 2.8, distance: 12, decay: 1.2 }
];

export class ShipLightPool {
  constructor(scene, maxPooled = 7) {
    this.scene = scene;
    this.maxPooled = maxPooled;
    this.pool = [];

    for (let i = 0; i < this.maxPooled; i++) {
      const light = new THREE.PointLight(0xffd68a, 0, 12, 1.2);
      light.castShadow = false;
      this.scene.add(light);
      this.pool.push(light);
    }
  }

  update(playerPosition) {
    if (!playerPosition) return;

    // Sort static sources by squared distance to player/camera
    const sorted = [...SHIP_LIGHT_SOURCES].sort((a, b) =>
      a.pos.distanceToSquared(playerPosition) - b.pos.distanceToSquared(playerPosition)
    );

    for (let i = 0; i < this.maxPooled; i++) {
      const light = this.pool[i];
      if (i < sorted.length) {
        const src = sorted[i];
        light.position.copy(src.pos);
        light.color.copy(src.color);
        light.intensity = src.intensity;
        light.distance = src.distance;
        light.decay = src.decay;
        light.visible = true;
      } else {
        light.intensity = 0;
        light.visible = false;
      }
    }
  }
}
