/**
 * ship.js — The persistent ship interior (Bridge, Star Map, Quarters, Cargo, Comms, Airlock)
 * Procedural low-poly primitives with emissive edges and shared materials
 */

import * as THREE from 'three';
import { createHoloMaterial } from './materials/holo.js';

export class ShipInterior {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.holoElements = [];
    this.buildShip();
    this.scene.add(this.group);
  }

  buildShip() {
    // Shared dark metal material for ship structure
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.7,
      metalness: 0.8
    });

    // Emissive cyan trim material
    const cyanTrimMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff
    });

    // Emissive amber trim
    const amberTrimMat = new THREE.MeshBasicMaterial({
      color: 0xffb300
    });

    // 1. Deck Floor Plates
    const floorGeo = new THREE.BoxGeometry(16, 0.4, 20);
    const floor = new THREE.Mesh(floorGeo, metalMat);
    floor.position.set(0, -0.2, 0);
    this.group.add(floor);

    // Floor light strips
    for (let x of [-4, 0, 4]) {
      const stripGeo = new THREE.BoxGeometry(0.12, 0.05, 18);
      const strip = new THREE.Mesh(stripGeo, cyanTrimMat);
      strip.position.set(x, 0.02, 0);
      this.group.add(strip);
    }

    // 2. Bulkhead Ceiling & Arched Ribs
    const ceilGeo = new THREE.BoxGeometry(16, 0.4, 20);
    const ceil = new THREE.Mesh(ceilGeo, metalMat);
    ceil.position.set(0, 4.2, 0);
    this.group.add(ceil);

    // 4 Structural Arches
    for (let z = -6; z <= 6; z += 4) {
      const archLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), metalMat);
      archLeft.position.set(-7.5, 2.0, z);
      const archRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), metalMat);
      archRight.position.set(7.5, 2.0, z);
      this.group.add(archLeft, archRight);
    }

    // 3. Bridge Forward Observation Window Frame (Z = -9)
    const windowFrameGeo = new THREE.TorusGeometry(5, 0.35, 8, 24, Math.PI);
    const windowFrame = new THREE.Mesh(windowFrameGeo, metalMat);
    windowFrame.position.set(0, 1.8, -9);
    windowFrame.rotation.z = Math.PI;
    this.group.add(windowFrame);

    // Center Bridge Console
    const consoleGeo = new THREE.BoxGeometry(3, 0.9, 1.2);
    const consoleMesh = new THREE.Mesh(consoleGeo, metalMat);
    consoleMesh.position.set(0, 0.45, 1.5);
    const consoleTrim = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.08, 1.25), cyanTrimMat);
    consoleTrim.position.set(0, 0.9, 1.5);
    this.group.add(consoleMesh, consoleTrim);

    // 4. Tactical Holo Table (Star Map location at X = 3.2, Z = 0)
    const tableBaseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.9, 8);
    const tableBase = new THREE.Mesh(tableBaseGeo, metalMat);
    tableBase.position.set(3.2, 0.45, 0);
    const tableRing = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.05, 8, 16), cyanTrimMat);
    tableRing.position.set(3.2, 0.92, 0);
    tableRing.rotation.x = Math.PI / 2;
    this.group.add(tableBase, tableRing);

    // Holographic planetary projection above table
    const holoMat = createHoloMaterial('#00e5ff', 25);
    const holoGlobeGeo = new THREE.IcosahedronGeometry(0.6, 2);
    const holoGlobe = new THREE.Mesh(holoGlobeGeo, holoMat);
    holoGlobe.position.set(3.2, 1.6, 0);
    this.group.add(holoGlobe);
    this.holoElements.push(holoGlobe);

    // Orbiting ring on holo table
    const orbitRingGeo = new THREE.RingGeometry(0.85, 0.9, 32);
    const orbitRing = new THREE.Mesh(orbitRingGeo, createHoloMaterial('#ffea46', 15));
    orbitRing.position.set(3.2, 1.6, 0);
    orbitRing.rotation.x = Math.PI / 3;
    this.group.add(orbitRing);
    this.holoElements.push(orbitRing);

    // 5. Quarters Alcove (X = -3.8, Z = 0)
    const podGeo = new THREE.CylinderGeometry(1.0, 1.0, 2.8, 12, 1, true, 0, Math.PI);
    const pod = new THREE.Mesh(podGeo, metalMat);
    pod.position.set(-3.8, 1.4, 0);
    pod.rotation.y = Math.PI / 2;
    this.group.add(pod);

    // 6. Cargo Hold Shelving (X = 4.2, Z = -3.5)
    for (let shelf = 0; shelf < 3; shelf++) {
      const shelfMesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.2), metalMat);
      shelfMesh.position.set(4.2, 0.6 + shelf * 0.7, -3.5);
      this.group.add(shelfMesh);

      // Containment canisters on shelf
      const canisterGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.45, 12);
      const canisterA = new THREE.Mesh(canisterGeo, amberTrimMat);
      canisterA.position.set(3.6, 0.85 + shelf * 0.7, -3.5);
      const canisterB = new THREE.Mesh(canisterGeo, cyanTrimMat);
      canisterB.position.set(4.4, 0.85 + shelf * 0.7, -3.5);
      this.group.add(canisterA, canisterB);
    }

    // 7. Comms Telemetry Array (X = -2.8, Z = -3.5)
    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2.5, 8), metalMat);
    dishMast.position.set(-2.8, 1.25, -3.5);
    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.4, 16, 1, true), metalMat);
    dish.position.set(-2.8, 2.5, -3.5);
    dish.rotation.x = -Math.PI / 4;
    this.group.add(dishMast, dish);

    // 8. Distant Planet visible through front viewport
    const planetGeo = new THREE.SphereGeometry(22, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x1a365d,
      roughness: 0.9,
      emissive: 0x0b192c,
      emissiveIntensity: 0.3
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planet.position.set(0, 5, -80);
    this.group.add(planet);
    this.planet = planet;

    // Atmospheric rim glow on planet
    const atmoGeo = new THREE.SphereGeometry(22.8, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const atmo = new THREE.Mesh(atmoGeo, atmoMat);
    atmo.position.copy(planet.position);
    this.group.add(atmo);
  }

  update(delta = 0.016, time = 0) {
    if (this.planet) {
      this.planet.rotation.y += delta * 0.04;
    }
    for (let el of this.holoElements) {
      if (el.material && el.material.uniforms && el.material.uniforms.uTime) {
        el.material.uniforms.uTime.value = time;
      }
      el.rotation.y += delta * 0.3;
    }
  }
}
