/**
 * ship-lighting.js — Dynamic pooled interior lighting rig for Starship compartments
 *
 * Implements performance-safe point light pooling (<= 8 lights active simultaneously)
 * per threejs-game-optimization guidelines, providing generous range and soft decay
 * so corridors, bulkheads, consoles, and quarters are warmly and clearly illuminated.
 */

import * as THREE from 'three';

export const SHIP_LIGHT_SOURCES = [
  // 1. Command Bridge Overhead Main
  { id: 'bridge-overhead', pos: new THREE.Vector3(0, 3.2, 1.8), color: new THREE.Color(0xffd88a), intensity: 3.4, distance: 16, decay: 1.2 },
  // 2. Cockpit Overhead Avionics
  { id: 'cockpit-overhead', pos: new THREE.Vector3(0, 2.95, 2.8), color: new THREE.Color(0xffb844), intensity: 3.0, distance: 13, decay: 1.2 },
  // 3. Cockpit Forward Avionics Dash
  { id: 'cockpit-dash', pos: new THREE.Vector3(0, 1.3, 3.2), color: new THREE.Color(0xff9f1c), intensity: 2.2, distance: 8, decay: 1.2 },
  // 4. Tactical Port Console
  { id: 'bridge-port-console', pos: new THREE.Vector3(-2.2, 1.4, 0.8), color: new THREE.Color(0xffaa30), intensity: 2.2, distance: 8, decay: 1.2 },
  // 5. Tactical Starboard Console
  { id: 'bridge-stbd-console', pos: new THREE.Vector3(2.2, 1.4, 0.8), color: new THREE.Color(0xffaa30), intensity: 2.2, distance: 8, decay: 1.2 },
  // 6. Star Map Holo-Bay Overhead
  { id: 'starmap-holo-bay', pos: new THREE.Vector3(3.2, 2.8, 1.8), color: new THREE.Color(0xffaa38), intensity: 3.6, distance: 15, decay: 1.2 },
  // 7. Star Map Sun Core
  { id: 'starmap-sun', pos: new THREE.Vector3(3.2, 1.45, 1.8), color: new THREE.Color(0xffdd55), intensity: 2.8, distance: 9, decay: 1.2 },
  // 8. Crew Quarters Ceiling
  { id: 'quarters-ceiling', pos: new THREE.Vector3(-3.8, 2.8, 2.2), color: new THREE.Color(0xffba52), intensity: 3.2, distance: 14, decay: 1.2 },
  // 9. Crew Quarters Desk Area
  { id: 'quarters-desk', pos: new THREE.Vector3(-3.12, 1.35, 1.55), color: new THREE.Color(0xffc86b), intensity: 2.2, distance: 8, decay: 1.2 },
  // 10. Cargo Hold High-Bay
  { id: 'cargo-gantry', pos: new THREE.Vector3(4.2, 3.2, -2.2), color: new THREE.Color(0xffa838), intensity: 3.8, distance: 16, decay: 1.2 },
  // 11. Cargo Freight Staging Bay
  { id: 'cargo-staging', pos: new THREE.Vector3(2.8, 1.8, -1.8), color: new THREE.Color(0xffc24a), intensity: 2.4, distance: 9, decay: 1.2 },
  // 12. Comms Array Equipment Rack Overhead
  { id: 'comms-bay', pos: new THREE.Vector3(-2.8, 2.8, -2.0), color: new THREE.Color(0xffb442), intensity: 3.2, distance: 14, decay: 1.2 },
  // 13. Comms Vacuum Tube Gallery
  { id: 'comms-tubes', pos: new THREE.Vector3(-2.8, 2.5, -2.6), color: new THREE.Color(0xff9018), intensity: 2.2, distance: 7, decay: 1.2 },
  // 14. Airlock Staging Floodlight
  { id: 'airlock-staging', pos: new THREE.Vector3(0, 3.3, -4.5), color: new THREE.Color(0xffaa38), intensity: 3.4, distance: 15, decay: 1.2 },
  // 15. Airlock Warning Beacon
  { id: 'airlock-beacon', pos: new THREE.Vector3(0, 3.2, -6.1), color: new THREE.Color(0xff9418), intensity: 2.6, distance: 10, decay: 1.2 },
  // 16. Central Spine North Corridor
  { id: 'corridor-spine-n', pos: new THREE.Vector3(0, 3.2, 0.5), color: new THREE.Color(0xffd68a), intensity: 2.6, distance: 11, decay: 1.2 },
  // 17. Central Spine South Corridor
  { id: 'corridor-spine-s', pos: new THREE.Vector3(0, 3.2, -2.2), color: new THREE.Color(0xffd68a), intensity: 2.6, distance: 11, decay: 1.2 },
  // 18. Transverse Corridor Port Junction (toward Comms)
  { id: 'corridor-cross-port', pos: new THREE.Vector3(-1.5, 3.1, -2.0), color: new THREE.Color(0xffcc7a), intensity: 2.4, distance: 10, decay: 1.2 },
  // 19. Transverse Corridor Starboard Junction (toward Cargo)
  { id: 'corridor-cross-stbd', pos: new THREE.Vector3(2.1, 3.1, -2.0), color: new THREE.Color(0xffcc7a), intensity: 2.4, distance: 10, decay: 1.2 },
  // 20. Port Wing Corridor (toward Quarters)
  { id: 'corridor-wing-port', pos: new THREE.Vector3(-1.9, 3.1, 2.0), color: new THREE.Color(0xffcc7a), intensity: 2.4, distance: 10, decay: 1.2 },
  // 21. Starboard Wing Corridor (toward Starmap)
  { id: 'corridor-wing-stbd', pos: new THREE.Vector3(1.6, 3.1, 2.0), color: new THREE.Color(0xffcc7a), intensity: 2.4, distance: 10, decay: 1.2 }
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
