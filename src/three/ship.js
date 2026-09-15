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
  createDesertPlanetTexture,
  createGasGiantPlanetTexture,
  createPlanetRingsTexture
} from './materials/textures.js';

export class ShipInterior {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.holoElements = [];
    this.animatedElements = [];
    this.dustParticles = null;
    this.planet = null;
    this.gasGiant = null;
    this.rings = null;
    this.moons = [];
    this.asteroids = [];

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
    this.gasGiantTex = createGasGiantPlanetTexture(1024, 512);
    this.ringsTex = createPlanetRingsTexture(512, 64);

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
    // === STARSHIP FLIGHT COCKPIT & CANOPY FRAMEWORK ===
    // 1. Forward Viewport Heavy Canopy Framing (Millennium Falcon / Ornithopter faceted canopy)
    const canopyRimBottom = new THREE.Mesh(new THREE.BoxGeometry(10, 0.45, 0.6), this.durasteelMat);
    canopyRimBottom.position.set(0, 0.75, -2.4);
    const canopyRimTop = new THREE.Mesh(new THREE.BoxGeometry(10, 0.45, 0.6), this.durasteelMat);
    canopyRimTop.position.set(0, 3.4, -2.4);
    this.group.add(canopyRimBottom, canopyRimTop);

    // Center vertical canopy divider strut
    const centerStrut = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.7, 0.4), this.ironMat);
    centerStrut.position.set(0, 2.05, -2.4);
    this.group.add(centerStrut);

    // Angled faceted canopy trusses
    for (let side of [-1, 1]) {
      // Main diagonal canopy mullion
      const diagStrut = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.0, 0.4), this.durasteelMat);
      diagStrut.position.set(side * 2.8, 2.1, -2.4);
      diagStrut.rotation.z = side * 0.32;
      this.group.add(diagStrut);

      // Corner gusset bracket
      const cornerBracket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.45), this.ironMat);
      cornerBracket.position.set(side * 4.2, 3.1, -2.35);
      cornerBracket.rotation.z = side * Math.PI / 4;
      this.group.add(cornerBracket);

      // Angled cockpit ceiling support spars arching back toward the pilot
      const archSpar = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 3.8), this.durasteelMat);
      archSpar.position.set(side * 2.5, 3.45, -0.4);
      archSpar.rotation.x = -0.12;
      this.group.add(archSpar);
    }

    // Far forward blast viewport reinforcement at Z = -8
    const farFrameBase = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 0.6), this.durasteelMat);
    farFrameBase.position.set(0, 0.6, -8);
    const farFrameTop = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 0.6), this.durasteelMat);
    farFrameTop.position.set(0, 3.8, -8);
    for (let mx of [-6, -2.5, 2.5, 6]) {
      const farMullion = new THREE.Mesh(new THREE.BoxGeometry(0.4, 3.4, 0.5), this.durasteelMat);
      farMullion.position.set(mx, 2.2, -8);
      farMullion.rotation.z = mx < 0 ? 0.07 : -0.07;
      this.group.add(farMullion);
    }
    this.group.add(farFrameBase, farFrameTop);

    // 2. Overhead Avionics Instrument Rack (directly above pilot head)
    const overheadRack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 2.2), this.ironMat);
    overheadRack.position.set(0, 3.2, 0.2);
    overheadRack.rotation.x = 0.1;
    this.group.add(overheadRack);

    // Overhead switch panel plate
    const overheadPanel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.05, 1.8), this.controlPanelMat);
    overheadPanel.position.set(0, 3.0, 0.2);
    overheadPanel.rotation.x = 0.1;
    this.group.add(overheadPanel);

    // Overhead indicator diodes and breakers
    for (let i = -1.2; i <= 1.2; i += 0.4) {
      const diode = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8),
        Math.abs(i) < 0.5 ? this.amberLampMat : (i > 0 ? this.greenLampMat : this.redLampMat)
      );
      diode.rotation.x = Math.PI / 2;
      diode.position.set(i, 2.96, 0.0);
      this.group.add(diode);
    }

    // Overhead conduit bundles feeding into dash
    for (let cx of [-1.5, 1.5]) {
      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), this.brassMat);
      conduit.position.set(cx, 2.4, 0.8);
      conduit.rotation.z = cx < 0 ? 0.2 : -0.2;
      this.group.add(conduit);
    }

    // 3. Primary Flight Instrument Console (Angled Dashboard)
    const consoleBase = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.85, 1.6), this.ironMat);
    consoleBase.position.set(0, 0.42, 0.2);
    this.group.add(consoleBase);

    // Forward sloping main instrument board
    const dashPanel = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.06, 1.3), this.controlPanelMat);
    dashPanel.position.set(0, 0.86, 0.2);
    dashPanel.rotation.x = -0.22;
    this.group.add(dashPanel);

    // Center auxiliary telemetry CRT (System Status)
    const crtCenter = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.1), this.crtAmberMat);
    crtCenter.position.set(0, 1.15, -0.25);
    crtCenter.rotation.x = -0.18;
    this.group.add(crtCenter);

    // Pilot Helm CRT (Port - Amber Vector Scope)
    const crtPilot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 0.1), this.crtAmberMat);
    crtPilot.position.set(-1.45, 1.2, -0.15);
    crtPilot.rotation.x = -0.18;
    crtPilot.rotation.y = 0.1;
    this.group.add(crtPilot);

    // Co-Pilot Radar / Spectrometry CRT (Starboard - Green Sensor)
    const crtCoPilot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 0.1), this.crtGreenMat);
    crtCoPilot.position.set(1.45, 1.2, -0.15);
    crtCoPilot.rotation.x = -0.18;
    crtCoPilot.rotation.y = -0.1;
    this.group.add(crtCoPilot);

    // Tactical warning plate with hazard stripes
    const hazardPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.02), this.hazardMat);
    hazardPlate.position.set(0, 0.85, 0.75);
    this.group.add(hazardPlate);

    // 4. Dual Tactile Flight Yokes / Control Columns
    for (let yx of [-1.1, 1.1]) {
      // Yoke pedestal column
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.65, 8), this.ironMat);
      col.position.set(yx, 0.7, 0.75);
      col.rotation.x = -0.25;

      // Handlebar crossbar
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.06), this.durasteelMat);
      handle.position.set(yx, 0.95, 0.68);

      // Left & Right handgrips with trigger
      const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 8), this.brassMat);
      gripL.position.set(yx - 0.16, 0.98, 0.68);
      const gripR = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.14, 8), this.brassMat);
      gripR.position.set(yx + 0.16, 0.98, 0.68);

      this.group.add(col, handle, gripL, gripR);
    }

    // Center Dual Throttle Lever Assembly
    const throttleMount = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.4), this.ironMat);
    throttleMount.position.set(0, 0.92, 0.55);
    for (let tx of [-0.08, 0.08]) {
      const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6), this.brassMat);
      lever.position.set(tx, 1.0, 0.55);
      lever.rotation.x = 0.2;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), this.amberLampMat);
      knob.position.set(tx, 1.08, 0.52);
      this.group.add(lever, knob);
    }
    this.group.add(throttleMount);

    // 5. Pilot and Co-Pilot Armored Flight Chairs (Star Wars / Dune Style)
    for (let cx of [-1.2, 1.2]) {
      // Swivel pedestal base
      const seatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.5, 8), this.ironMat);
      seatBase.position.set(cx, 0.25, 1.8);

      // Armored bucket seat bottom
      const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.75), this.durasteelMat);
      seatCushion.position.set(cx, 0.56, 1.8);

      // High-back spinal armor plate
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.95, 0.14), this.durasteelMat);
      seatBack.position.set(cx, 1.08, 2.15);
      seatBack.rotation.x = -0.08;

      // Headrest with side support bolsters
      const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.15), this.ironMat);
      headRest.position.set(cx, 1.62, 2.22);
      headRest.rotation.x = -0.08;

      // Restraint harness chest buckles
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.04), this.brassMat);
      buckle.position.set(cx, 1.05, 2.06);

      this.group.add(seatBase, seatCushion, seatBack, headRest, buckle);
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
    // === SPACE OPERA MULTI-PLANET CELESTIAL VISTA ===
    // 1. Chromatic Gas Giant (Jovian class with atmospheric storms)
    const gasGiantGeo = new THREE.SphereGeometry(22, 48, 48);
    const gasGiantMat = new THREE.MeshStandardMaterial({
      map: this.gasGiantTex,
      roughness: 0.85,
      metalness: 0.15,
      emissive: 0x181e28,
      emissiveIntensity: 0.2
    });
    this.gasGiant = new THREE.Mesh(gasGiantGeo, gasGiantMat);
    this.gasGiant.position.set(-28, 12, -90);
    this.group.add(this.gasGiant);

    // Majestic Planetary Ring System (dusty icy rings with Cassini division)
    const ringGeo = new THREE.RingGeometry(26, 50, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      map: this.ringsTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      roughness: 0.9,
      metalness: 0.1
    });
    this.rings = new THREE.Mesh(ringGeo, ringMat);
    this.rings.position.copy(this.gasGiant.position);
    this.rings.rotation.x = Math.PI * 0.42;
    this.rings.rotation.y = -0.22;
    this.group.add(this.rings);

    // 2. Vareth-9 (Quest 1 Destination — Banded Arid Desert World) in orbital descent
    const planetGeo = new THREE.SphereGeometry(16, 48, 48);
    const planetMat = new THREE.MeshStandardMaterial({
      map: this.planetTex,
      roughness: 0.92,
      metalness: 0.1,
      emissive: 0x2e1808,
      emissiveIntensity: 0.2
    });
    this.planet = new THREE.Mesh(planetGeo, planetMat);
    this.planet.position.set(22, -8, -80);
    this.group.add(this.planet);

    // Vareth-9 Atmospheric Dust Halo
    const haloGeo = new THREE.SphereGeometry(16.8, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf4a261,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(this.planet.position);
    this.group.add(halo);

    // 3. Distant Crystalline Ice Moon (Cryo-Haven Sector)
    const iceMoonMat = new THREE.MeshStandardMaterial({
      color: 0xa8c8e8,
      roughness: 0.75,
      emissive: 0x102035,
      emissiveIntensity: 0.3
    });
    const iceMoon = new THREE.Mesh(new THREE.SphereGeometry(3.6, 24, 24), iceMoonMat);
    iceMoon.position.set(-6, 22, -120);
    this.group.add(iceMoon);
    this.moons.push(iceMoon);

    // 4. Volcanic Smoldering Moon (Pyros Sector)
    const pyroMoonMat = new THREE.MeshStandardMaterial({
      color: 0x6e3820,
      roughness: 0.9,
      emissive: 0xd95a18,
      emissiveIntensity: 0.25
    });
    const pyroMoon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 20, 20), pyroMoonMat);
    pyroMoon.position.set(38, 16, -95);
    this.group.add(pyroMoon);
    this.moons.push(pyroMoon);

    // 5. Drifting Asteroid Debris Belt in Space
    const asteroidMat = new THREE.MeshStandardMaterial({
      color: 0x3d4148,
      roughness: 0.95,
      metalness: 0.2
    });
    for (let i = 0; i < 32; i++) {
      const scale = 0.35 + Math.random() * 1.2;
      const astGeo = new THREE.DodecahedronGeometry(scale, 1);
      const ast = new THREE.Mesh(astGeo, asteroidMat);
      ast.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 35,
        -30 - Math.random() * 55
      );
      ast.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.4,
        rotSpeedY: (Math.random() - 0.5) * 0.4,
        driftSpeedZ: 0.02 + Math.random() * 0.04
      };
      this.group.add(ast);
      this.asteroids.push(ast);
    }
  }

  update(delta = 0.016, time = 0) {
    // Slowly rotate planetary bodies
    if (this.planet) {
      this.planet.rotation.y += delta * 0.025;
    }
    if (this.gasGiant) {
      this.gasGiant.rotation.y += delta * 0.018;
    }
    if (this.rings) {
      this.rings.rotation.z += delta * 0.008;
    }

    // Orbit moons in space
    if (this.moons.length >= 2) {
      this.moons[0].position.x = -6 + Math.sin(time * 0.08) * 3;
      this.moons[1].position.y = 16 + Math.cos(time * 0.1) * 2;
    }

    // Tumble drifting asteroids
    for (let ast of this.asteroids) {
      ast.rotation.x += delta * ast.userData.rotSpeedX;
      ast.rotation.y += delta * ast.userData.rotSpeedY;
    }

    // Swirl floating cabin air motes
    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i + 1] -= delta * 0.08;
        pos[i] += Math.sin(time * 0.5 + pos[i + 2]) * 0.002;
        if (pos[i + 1] < 0) {
          pos[i + 1] = 4.0;
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

    // Orbit animated elements
    for (let el of this.animatedElements) {
      el.rotation.y += delta * 0.35;
    }
  }
}
