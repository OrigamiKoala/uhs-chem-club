/**
 * ship.js — Comprehensive Star Wars / Dune 'Used Universe' 3D Ship Interior & Planetary Vista
 * Procedurally textured durasteel bulkheads, tactile CRT consoles, spice holo-table, and dust motes
 */

import * as THREE from 'three';
import { createHoloMaterial } from './materials/holo.js';
import {
  createDurasteelTexture,
  createFloorGrateTexture,
  createHazardStripesTexture,
  createCrtScreenTexture,
  createControlPanelTexture,
  createDesertPlanetTexture
} from './materials/textures.js';

export class ShipInterior {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.holoElements = [];
    this.animatedElements = [];
    this.dustParticles = null;
    this.planet = null;
    this.moons = [];

    this.initMaterials();
    this.buildArchitecture();
    this.buildBridgeSection();
    this.buildStarmapSection();
    this.buildQuartersSection();
    this.buildCargoSection();
    this.buildCommsSection();
    this.buildAirlockSection();
    this.buildAtmosphericDust();
    this.buildPlanetaryVista();

    this.scene.add(this.group);
  }

  initMaterials() {
    // 1. Textures & Nano Banana Asset Loading
    const loader = new THREE.TextureLoader();
    this.durasteelTex = createDurasteelTexture(512, 512);

    // Weathered Durasteel Bulkhead Material with Nano Banana texture map
    this.durasteelMat = new THREE.MeshStandardMaterial({
      color: 0x22252c,
      map: this.durasteelTex,
      roughness: 0.82,
      metalness: 0.65
    });

    loader.load('/art/durasteel_plate.jpg', (loadedTex) => {
      loadedTex.wrapS = THREE.RepeatWrapping;
      loadedTex.wrapT = THREE.RepeatWrapping;
      loadedTex.repeat.set(2, 2);
      this.durasteelMat.map = loadedTex;
      this.durasteelMat.needsUpdate = true;
    });

    this.floorGrateTex = createFloorGrateTexture(256, 256);
    this.hazardTex = createHazardStripesTexture(256, 64);
    this.controlPanelTex = createControlPanelTexture(512, 256);
    this.crtAmberTex = createCrtScreenTexture('SYSTEM CALIB', 'amber');
    this.crtGreenTex = createCrtScreenTexture('ANALYSIS RF', 'green');
    this.planetTex = createDesertPlanetTexture(1024, 512);

    // 3. Heavy Industrial Floor Grating Material
    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      map: this.floorGrateTex,
      roughness: 0.88,
      metalness: 0.7
    });

    // 4. Tarnished Brass & Conduit Material
    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0x8a6e38,
      roughness: 0.6,
      metalness: 0.8
    });

    // 5. Dark Cast Iron / Chasis Material
    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0x121417,
      roughness: 0.9,
      metalness: 0.4
    });

    // 6. Hazard Stripe Material
    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTex,
      roughness: 0.7,
      metalness: 0.2
    });

    // 7. Recessed Halogen Guide Strips (Warm Amber / Sodium)
    this.halogenMat = new THREE.MeshBasicMaterial({
      color: 0xd9822b
    });

    // 8. Indicator Lamps
    this.amberLampMat = new THREE.MeshBasicMaterial({ color: 0xff9f1c });
    this.redLampMat = new THREE.MeshBasicMaterial({ color: 0xd90429 });
    this.greenLampMat = new THREE.MeshBasicMaterial({ color: 0x38b000 });

    // 9. CRT Monitor Materials
    this.crtAmberMat = new THREE.MeshBasicMaterial({ map: this.crtAmberTex });
    this.crtGreenMat = new THREE.MeshBasicMaterial({ map: this.crtGreenTex });
    this.controlPanelMat = new THREE.MeshStandardMaterial({
      map: this.controlPanelTex,
      roughness: 0.7,
      metalness: 0.3
    });
  }

  buildArchitecture() {
    // Deck Floor Plates
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 22), this.floorMat);
    floor.position.set(0, -0.2, 0);
    this.group.add(floor);

    // Floor Runway Halogen Strips (replacing cyan neon)
    for (let x of [-4.5, -0.05, 4.5]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 20), this.halogenMat);
      strip.position.set(x, 0.02, 0);
      this.group.add(strip);
    }

    // Bulkhead Ceiling
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 22), this.durasteelMat);
    ceil.position.set(0, 4.2, 0);
    this.group.add(ceil);

    // Left & Right Armor Plated Bulkhead Walls
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 22), this.durasteelMat);
    wallLeft.position.set(-8.5, 2.0, 0);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 22), this.durasteelMat);
    wallRight.position.set(8.5, 2.0, 0);
    this.group.add(wallLeft, wallRight);

    // 5 Heavy Industrial Ribbed Hull Arches
    for (let z = -8; z <= 8; z += 4) {
      const archL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.4, 0.8), this.durasteelMat);
      archL.position.set(-8.1, 2.0, z);
      const archR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 4.4, 0.8), this.durasteelMat);
      archR.position.set(8.1, 2.0, z);
      const archTop = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.6, 0.8), this.durasteelMat);
      archTop.position.set(0, 4.1, z);

      // Angled corner gusset brackets
      const gussetL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.6), this.ironMat);
      gussetL.position.set(-7.5, 3.6, z);
      gussetL.rotation.z = Math.PI / 4;
      const gussetR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.6), this.ironMat);
      gussetR.position.set(7.5, 3.6, z);
      gussetR.rotation.z = -Math.PI / 4;

      this.group.add(archL, archR, archTop, gussetL, gussetR);
    }

    // Overhead Cable Raceways & Hydraulic Pipes along ship spine
    for (let c = -1.2; c <= 1.2; c += 0.6) {
      const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 20, 8);
      const pipe = new THREE.Mesh(pipeGeo, this.brassMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(c, 3.8, 0);
      this.group.add(pipe);
    }
  }

  buildBridgeSection() {
    // Forward Blast Viewport Window Frame at Z = -9
    const frameBase = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 0.6), this.durasteelMat);
    frameBase.position.set(0, 0.6, -9);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 0.6), this.durasteelMat);
    frameTop.position.set(0, 3.6, -9);

    // Multi-pane angled mullion struts
    for (let mx of [-5, -2, 2, 5]) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.0, 0.5), this.durasteelMat);
      mullion.position.set(mx, 2.1, -9);
      mullion.rotation.z = mx < 0 ? 0.08 : -0.08;
      this.group.add(mullion);
    }
    this.group.add(frameBase, frameTop);

    // Forward Command Deck Console Structure at Z = 1.2
    const consoleChassis = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 1.4), this.ironMat);
    consoleChassis.position.set(0, 0.45, 1.2);
    this.group.add(consoleChassis);

    // Angled Instrument Dashboard
    const dashPanel = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.05, 1.0), this.controlPanelMat);
    dashPanel.position.set(0, 0.92, 1.2);
    dashPanel.rotation.x = -0.15;
    this.group.add(dashPanel);

    // Recessed Dual CRT Flight Monitors on Bridge Console
    const crtLeft = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.1), this.crtAmberMat);
    crtLeft.position.set(-1.1, 1.25, 0.9);
    crtLeft.rotation.x = -0.15;

    const crtRight = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.1), this.crtGreenMat);
    crtRight.position.set(1.1, 1.25, 0.9);
    crtRight.rotation.x = -0.15;
    this.group.add(crtLeft, crtRight);

    // Dual Utilitarian Flight Chairs (Star Wars cockpit style)
    for (let cx of [-1.3, 1.3]) {
      const seatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.6, 8), this.ironMat);
      seatBase.position.set(cx, 0.3, 2.5);
      const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), this.durasteelMat);
      cushion.position.set(cx, 0.65, 2.5);
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.15), this.durasteelMat);
      seatBack.position.set(cx, 1.1, 2.8);
      seatBack.rotation.x = -0.1;
      this.group.add(seatBase, cushion, seatBack);
    }
  }

  buildStarmapSection() {
    // Monolithic Brutalist Octagonal Tactical Table (Dune style at X = 3.2, Z = 0)
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.9, 8), this.durasteelMat);
    tableBase.position.set(3.2, 0.45, 0);

    // Weathered Brass Rim with Tactile Rotary Dials
    const tableRim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.08, 8, 16), this.brassMat);
    tableRim.position.set(3.2, 0.92, 0);
    tableRim.rotation.x = Math.PI / 2;
    this.group.add(tableBase, tableRim);

    // Monolithic Holo Emitter Lens in table center
    const emitterLens = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.1, 16), this.ironMat);
    emitterLens.position.set(3.2, 0.93, 0);
    this.group.add(emitterLens);

    // Dune Spice-Amber Particulate Hologram
    const spiceHoloMat = createHoloMaterial('#ff9f1c', 35);
    const globe = new THREE.Mesh(new THREE.IcosahedronGeometry(0.65, 2), spiceHoloMat);
    globe.position.set(3.2, 1.7, 0);
    this.group.add(globe);
    this.holoElements.push(globe);

    // Orbital Spice Navigation Rings
    const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.92, 32), createHoloMaterial('#f4a261', 20));
    ring1.position.set(3.2, 1.7, 0);
    ring1.rotation.x = Math.PI / 3;

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.15, 32), createHoloMaterial('#e76f51', 15));
    ring2.position.set(3.2, 1.7, 0);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 6;

    this.group.add(ring1, ring2);
    this.holoElements.push(ring1, ring2);

    // Floating Golden Spice Particles orbiting tactical table
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 0.5 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;
      pPos[i * 3] = 3.2 + radius * Math.cos(theta) * Math.cos(phi);
      pPos[i * 3 + 1] = 1.7 + radius * Math.sin(phi);
      pPos[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffb703,
      size: 0.035,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const holoCloud = new THREE.Points(pGeo, pMat);
    this.group.add(holoCloud);
    this.animatedElements.push(holoCloud);
  }

  buildQuartersSection() {
    // Crew Bunk Habitation Alcove (at X = -3.8, Z = 0)
    // Welded Durasteel Bunk Frame
    const bunkFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.2), this.ironMat);
    bunkFrameL.position.set(-5.0, 1.3, 0);
    const bunkFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.6, 2.2), this.ironMat);
    bunkFrameR.position.set(-2.8, 1.3, 0);

    // Lower & Upper Bunk Slabs
    const lowerBed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 2.0), this.durasteelMat);
    lowerBed.position.set(-3.9, 0.4, 0);
    const upperBed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 2.0), this.durasteelMat);
    upperBed.position.set(-3.9, 1.7, 0);

    // Footlocker Equipment Crates under bunk
    const crateA = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.8), this.durasteelMat);
    crateA.position.set(-4.3, 0.18, 0);
    const crateB = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.8), this.durasteelMat);
    crateB.position.set(-3.3, 0.18, 0);

    // Small Fold-Down Field Desk with Amber Terminal
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.7), this.ironMat);
    desk.position.set(-5.4, 0.85, 1.8);
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.15), this.crtAmberMat);
    terminal.position.set(-5.4, 1.05, 1.8);
    terminal.rotation.y = 0.3;

    this.group.add(bunkFrameL, bunkFrameR, lowerBed, upperBed, crateA, crateB, desk, terminal);
  }

  buildCargoSection() {
    // Cargo Bay at X = 4.2, Z = -3.8
    // Overhead Gantry Crane Beam with Yellow Hazard Stripes
    const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 7.0), this.hazardMat);
    gantry.position.set(4.2, 3.7, -3.8);
    this.group.add(gantry);

    // Heavy Pallet Racks
    for (let shelf = 0; shelf < 3; shelf++) {
      const shelfSlab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.6), this.ironMat);
      shelfSlab.position.set(4.2, 0.5 + shelf * 0.85, -3.8);
      this.group.add(shelfSlab);

      // Cylindrical Spice Canisters & Fuel Drums
      const drum1 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 12), this.brassMat);
      drum1.position.set(3.4, 0.86 + shelf * 0.85, -3.8);

      const drum2 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.65, 12), this.durasteelMat);
      drum2.position.set(4.1, 0.86 + shelf * 0.85, -3.8);

      const drum3 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.65, 12), this.hazardMat);
      drum3.position.set(4.8, 0.86 + shelf * 0.85, -3.8);

      this.group.add(drum1, drum2, drum3);
    }

    // Heavy Stamped Durasteel Shipping Containers on deck
    const containerGeo = new THREE.BoxGeometry(1.6, 1.0, 1.2);
    const containerA = new THREE.Mesh(containerGeo, this.durasteelMat);
    containerA.position.set(6.2, 0.5, -4.5);
    const containerB = new THREE.Mesh(containerGeo, this.hazardMat);
    containerB.position.set(6.2, 0.5, -3.0);
    this.group.add(containerA, containerB);
  }

  buildCommsSection() {
    // Comms & Signal Intercept Bay at X = -2.8, Z = -3.8
    // Full Height Equipment Chassis
    const rackChassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.8), this.ironMat);
    rackChassis.position.set(-2.8, 1.6, -4.2);
    this.group.add(rackChassis);

    // Green Phosphor Oscilloscope Screen
    const oscScreen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), this.crtGreenMat);
    oscScreen.position.set(-3.2, 2.2, -3.78);
    this.group.add(oscScreen);

    // Amber Telemetry Screen
    const statusScreen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), this.crtAmberMat);
    statusScreen.position.set(-2.3, 2.2, -3.78);
    this.group.add(statusScreen);

    // Lower Analog Tuner Panel
    const tunerPanel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.05), this.controlPanelMat);
    tunerPanel.position.set(-2.8, 1.3, -3.78);
    this.group.add(tunerPanel);

    // Glowing Radio Frequency Vacuum Tubes
    for (let tx = -3.4; tx <= -2.2; tx += 0.3) {
      const tubeGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8), this.amberLampMat);
      tubeGlass.position.set(tx, 2.7, -3.75);
      this.group.add(tubeGlass);
    }
  }

  buildAirlockSection() {
    // Massive Reinforced Airlock Blast Door at Z = -8.0
    // Outer Bulkhead Frame with Hazard Chevrons
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.8, 0.4), this.hazardMat);
    doorFrame.position.set(0, 1.9, -8.2);
    this.group.add(doorFrame);

    // Recessed Hydraulic Circular/Vault Pressure Door
    const innerDoor = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.35, 16), this.durasteelMat);
    innerDoor.rotation.x = Math.PI / 2;
    innerDoor.position.set(0, 1.9, -8.0);
    this.group.add(innerDoor);

    // Central Rotary Manual Override Handwheel
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 16), this.ironMat);
    wheel.position.set(0, 1.9, -7.8);
    this.group.add(wheel);

    // Dual Hydraulic Piston Locking Cylinders
    for (let py of [1.2, 2.6]) {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 12), this.brassMat);
      cylinder.rotation.z = Math.PI / 2;
      cylinder.position.set(0, py, -7.9);
      this.group.add(cylinder);
    }

    // Overhead Status Warning Beacon
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12), this.amberLampMat);
    beacon.position.set(0, 3.5, -8.0);
    this.group.add(beacon);
  }

  buildAtmosphericDust() {
    // 2,000 Particulate Dust Motes floating in the cabin, catching sunbeams
    const dustCount = 2000;
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 16;
      dPos[i * 3 + 1] = Math.random() * 4.0;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    const dMat = new THREE.PointsMaterial({
      color: 0xe0a96d,
      size: 0.04,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.dustParticles = new THREE.Points(dGeo, dMat);
    this.group.add(this.dustParticles);
  }

  buildPlanetaryVista() {
    // Giant Arrakis / Desert Planet visible through front viewport at Z = -85
    const planetGeo = new THREE.SphereGeometry(24, 48, 48);
    const planetMat = new THREE.MeshStandardMaterial({
      map: this.planetTex,
      roughness: 0.95,
      metalness: 0.1,
      emissive: 0x3d200a,
      emissiveIntensity: 0.25
    });
    this.planet = new THREE.Mesh(planetGeo, planetMat);
    this.planet.position.set(0, 6, -85);
    this.group.add(this.planet);

    // Warm Atmospheric Dust Halo
    const haloGeo = new THREE.SphereGeometry(25.0, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf4a261,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(this.planet.position);
    this.group.add(halo);

    // Twin Cratered Moons in High Orbit
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0x8a7f72,
      roughness: 0.9
    });
    const moon1 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 24, 24), moonMat);
    moon1.position.set(-36, 18, -95);
    const moon2 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), moonMat);
    moon2.position.set(38, 24, -110);
    this.group.add(moon1, moon2);
    this.moons.push(moon1, moon2);
  }

  update(delta = 0.016, time = 0) {
    // Rotate desert planet slowly
    if (this.planet) {
      this.planet.rotation.y += delta * 0.03;
    }

    // Orbit moons slightly
    if (this.moons.length >= 2) {
      this.moons[0].position.x = -36 + Math.sin(time * 0.1) * 2;
      this.moons[1].position.y = 24 + Math.cos(time * 0.12) * 2;
    }

    // Swirl floating dust particles
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] -= delta * 0.08; // gentle settling
        pos[i] += Math.sin(time * 0.5 + pos[i + 2]) * 0.002;
        if (pos[i + 1] < 0) {
          pos[i + 1] = 4.0; // wrap to ceiling
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Animate spice holo elements
    for (let el of this.holoElements) {
      if (el.material && el.material.uniforms && el.material.uniforms.uTime) {
        el.material.uniforms.uTime.value = time;
      }
      el.rotation.y += delta * 0.25;
    }

    // Orbit animated elements (spice particle cloud)
    for (let el of this.animatedElements) {
      el.rotation.y += delta * 0.35;
    }
  }
}
