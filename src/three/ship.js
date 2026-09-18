/**
 * ship.js — Hyper-Realistic Starship Interior (T4 / T3)
 * Scoured Plate / Used Universe industrial aesthetic matching 3d-conversion-prompts.md & dist/art/
 *
 * Implements physical room compartments, corridor spine network along walkPath splines,
 * PBR weathered durasteel plating, CRT tactical displays, holographic star map,
 * and solid collision physics bounds.
 */

import * as THREE from "three";
import { createHoloMaterial } from "./materials/holo.js";
import {
  createDurasteelTexture,
  createFloorGrateTexture,
  createHazardStripesTexture,
  createCrtScreenTexture,
  createControlPanelTexture
} from "./materials/textures.js";
import {
  createPlanetMaterial,
  createAtmosphereShell,
  createRingMaterial
} from "./materials/celestial.js";
import { SHIP_GRAPH } from "./ship-graph.js";
import { tierManager, tierAtLeast } from "./tier.js";

export class ShipInterior {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.colliders = []; // AABB { minX, maxX, minZ, maxZ } for physical collision
    this.animatedElements = [];
    this.interactiveTerminals = []; // { id, name, pos, route }
    this.dustParticles = null;

    this.initMaterials();
    this.buildHullArchitecture();
    this.buildCorridorSpines();
    this.buildBridgeRoom();
    this.buildCockpitRoom();
    this.buildStarmapRoom();
    this.buildQuartersRoom();
    this.buildCargoRoom();
    this.buildCommsRoom();
    this.buildAirlockRoom();
    this.buildAtmosphericDust();
    this.buildPlanetaryVista();

    this.scene.add(this.group);
  }

  initMaterials() {
    const loader = new THREE.TextureLoader();

    // 1. Durasteel Bulkhead Material (Nano Banana PBR Asset)
    this.durasteelTex = createDurasteelTexture(512, 512);
    this.durasteelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d34,
      map: this.durasteelTex,
      roughness: 0.84,
      metalness: 0.62
    });

    loader.load("/art/durasteel_cockpit_pbr.jpg", (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      this.durasteelMat.map = tex;
      this.durasteelMat.needsUpdate = true;
    }, undefined, () => {
      loader.load("/art/durasteel_plate.jpg", (tex2) => {
        tex2.wrapS = THREE.RepeatWrapping;
        tex2.wrapT = THREE.RepeatWrapping;
        tex2.repeat.set(2, 2);
        this.durasteelMat.map = tex2;
        this.durasteelMat.needsUpdate = true;
      });
    });

    // 2. Heavy Floor Grating
    this.floorGrateTex = createFloorGrateTexture(256, 256);
    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1c22,
      map: this.floorGrateTex,
      roughness: 0.88,
      metalness: 0.72
    });

    // 3. Tarnished Brass & Conduit Material
    this.brassMat = new THREE.MeshStandardMaterial({
      color: 0x826732,
      roughness: 0.58,
      metalness: 0.82
    });

    // 4. Dark Cast Iron Chassis
    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.92,
      metalness: 0.38
    });

    // 5. Yellow/Black Hazard Chevrons
    this.hazardTex = createHazardStripesTexture(256, 64);
    this.hazardMat = new THREE.MeshStandardMaterial({
      map: this.hazardTex,
      roughness: 0.72,
      metalness: 0.22
    });

    // 6. Recessed Halogen Guide Strips (Warm Amber / Sodium filament #d99423)
    this.halogenMat = new THREE.MeshBasicMaterial({
      color: 0xd99423
    });

    // 7. Indicators
    this.amberLampMat = new THREE.MeshBasicMaterial({ color: 0xd99423 });
    this.greenLampMat = new THREE.MeshBasicMaterial({ color: 0x38b000 });
    this.redLampMat = new THREE.MeshBasicMaterial({ color: 0xc92a2a });

    // 8. CRT Displays
    this.crtAmberTex = createCrtScreenTexture("SYSTEM CALIB", "amber");
    this.crtGreenTex = createCrtScreenTexture("ANALYSIS RF", "green");
    this.crtAmberMat = new THREE.MeshBasicMaterial({ map: this.crtAmberTex });
    this.crtGreenMat = new THREE.MeshBasicMaterial({ map: this.crtGreenTex });

    // 9. Analog Control Panel
    this.controlPanelTex = createControlPanelTexture(512, 256);
    this.controlPanelMat = new THREE.MeshStandardMaterial({
      map: this.controlPanelTex,
      roughness: 0.75,
      metalness: 0.28
    });

    // 10. Fabric / Bedding Material
    this.fabricMat = new THREE.MeshStandardMaterial({
      color: 0x3d3930,
      roughness: 0.95,
      metalness: 0.05
    });
  }

  addCollider(minX, maxX, minZ, maxZ) {
    this.colliders.push({ minX, maxX, minZ, maxZ });
  }

  buildHullArchitecture() {
    // Main deck floor slab (Y = -0.2 to 0.0)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 22), this.floorMat);
    floor.position.set(0, -0.2, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Main structural ceiling slab (Y = 4.0 to 4.4)
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 22), this.durasteelMat);
    ceil.position.set(0, 4.2, 0);
    this.group.add(ceil);

    // Perimeter outer hull armor walls
    // Port outer wall
    const wallPort = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 22), this.durasteelMat);
    wallPort.position.set(-8.25, 2.0, 0);
    this.group.add(wallPort);
    this.addCollider(-8.5, -8.0, -11, 11);

    // Starboard outer wall
    const wallStbd = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 22), this.durasteelMat);
    wallStbd.position.set(8.25, 2.0, 0);
    this.group.add(wallStbd);
    this.addCollider(8.0, 8.5, -11, 11);

    // Aft blast wall (behind airlock)
    const wallAft = new THREE.Mesh(new THREE.BoxGeometry(18, 4.2, 0.5), this.durasteelMat);
    wallAft.position.set(0, 2.0, -8.75);
    this.group.add(wallAft);
    this.addCollider(-9, 9, -9.0, -8.5);

    // Forward viewport wall with observation cutouts
    const wallFwdPort = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4.2, 0.5), this.durasteelMat);
    wallFwdPort.position.set(-6.5, 2.0, 4.25);
    const wallFwdStbd = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4.2, 0.5), this.durasteelMat);
    wallFwdStbd.position.set(6.5, 2.0, 4.25);
    this.group.add(wallFwdPort, wallFwdStbd);
    this.addCollider(-8.5, -4.75, 4.0, 4.5);
    this.addCollider(4.75, 8.5, 4.0, 4.5);

    // 6 Heavy Industrial Ribbed Bulkhead Hull Arches along the ship length
    for (let z = -7.5; z <= 3.5; z += 2.2) {
      const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.0, 0.5), this.durasteelMat);
      ribL.position.set(-8.0, 2.0, z);
      const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.0, 0.5), this.durasteelMat);
      ribR.position.set(8.0, 2.0, z);
      const ribRoof = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.4, 0.5), this.durasteelMat);
      ribRoof.position.set(0, 3.9, z);

      // Gusset brackets
      const gusL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.4), this.ironMat);
      gusL.position.set(-7.5, 3.5, z);
      gusL.rotation.z = Math.PI / 4;
      const gusR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.4), this.ironMat);
      gusR.position.set(7.5, 3.5, z);
      gusR.rotation.z = -Math.PI / 4;

      this.group.add(ribL, ribR, ribRoof, gusL, gusR);
    }
  }

  buildCorridorSpines() {
    // 1. Central Spine Corridor (Bridge to Airlock, Z: -4.5 to 2.0)
    // Overhead cable raceway along central spine
    const racewaySpine = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 7.5), this.ironMat);
    racewaySpine.position.set(0, 3.8, -1.25);
    this.group.add(racewaySpine);

    // 4 Copper/Brass hydraulic and electrical conduit runs along the spine
    for (let cx of [-0.5, -0.2, 0.2, 0.5]) {
      const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 7.5, 8), this.brassMat);
      conduit.rotation.x = Math.PI / 2;
      conduit.position.set(cx, 3.68, -1.25);
      this.group.add(conduit);
    }

    // Recessed halogen runway guide strips embedded into deck
    const stripSpineL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 7.5), this.halogenMat);
    stripSpineL.position.set(-0.8, 0.015, -1.25);
    const stripSpineR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 7.5), this.halogenMat);
    stripSpineR.position.set(0.8, 0.015, -1.25);
    this.group.add(stripSpineL, stripSpineR);

    // 2. Transverse Cross-Corridor (Connecting Comms at X=-2.8 across Spine X=0 to Cargo at X=4.2 at Z=-2.0)
    const racewayCross = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.15, 1.2), this.ironMat);
    racewayCross.position.set(0.7, 3.75, -2.05);
    this.group.add(racewayCross);

    for (let cz of [-2.25, -1.85]) {
      const conduitCross = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 7.0, 8), this.brassMat);
      conduitCross.rotation.z = Math.PI / 2;
      conduitCross.position.set(0.7, 3.65, cz);
      this.group.add(conduitCross);
    }

    // 3. Port & Starboard Wing Corridors at Z = 2.0 (Connecting Bridge to Quarters X=-3.8 & Starmap X=3.2)
    const racewayWing = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.15, 1.0), this.ironMat);
    racewayWing.position.set(-0.3, 3.75, 2.0);
    this.group.add(racewayWing);

    // 4. Chamfered Doorway / Hatch Bulkheads at exact hatchPos locations
    for (const [nodeKey, node] of Object.entries(SHIP_GRAPH.nodes)) {
      for (const [adjKey, hPos] of Object.entries(node.hatchPos)) {
        const frame = new THREE.Group();
        frame.position.set(hPos[0], 0, hPos[2]);

        const adjNode = SHIP_GRAPH.nodes[adjKey];
        const dir = new THREE.Vector3(adjNode.pos[0] - node.pos[0], 0, adjNode.pos[2] - node.pos[2]).normalize();
        frame.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 0.3), this.durasteelMat);
        postL.position.set(-0.75, 1.3, 0);
        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.6, 0.3), this.durasteelMat);
        postR.position.set(0.75, 1.3, 0);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.3, 0.3), this.durasteelMat);
        lintel.position.set(0, 2.5, 0);

        const headerPlate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.04), this.ironMat);
        headerPlate.position.set(0, 2.45, 0.18);

        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 8), this.amberLampMat);
        lamp.rotation.x = Math.PI / 2;
        lamp.position.set(0, 2.45, 0.21);

        frame.add(postL, postR, lintel, headerPlate, lamp);
        this.group.add(frame);
      }
    }
  }

  buildBridgeRoom() {
    // Command Bridge at anchor [0, 1.55, 2.0]
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, 2.0);

    const canopyBase = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.7, 0.4), this.durasteelMat);
    canopyBase.position.set(0, 0.35, -2.2);
    const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.7, 0.4), this.durasteelMat);
    canopyTop.position.set(0, 3.65, -2.2);
    bridgeGroup.add(canopyBase, canopyTop);

    for (let x of [-3.2, -1.1, 1.1, 3.2]) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.8, 0.35), this.durasteelMat);
      mullion.position.set(x, 2.0, -2.2);
      mullion.rotation.z = x < 0 ? -0.14 : 0.14;
      bridgeGroup.add(mullion);
    }

    for (let side of [-1, 1]) {
      const deskX = side * 2.2;
      const deskZ = -1.2;

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), this.durasteelMat);
      deskTop.position.set(deskX, 0.85, deskZ);
      const deskLegL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.1), this.ironMat);
      deskLegL.position.set(deskX - 0.7, 0.425, deskZ);
      const deskLegR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.1), this.ironMat);
      deskLegR.position.set(deskX + 0.7, 0.425, deskZ);
      bridgeGroup.add(deskTop, deskLegL, deskLegR);

      const consoleChassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.45), this.ironMat);
      consoleChassis.position.set(deskX, 1.12, deskZ - 0.35);
      consoleChassis.rotation.x = 0.3;

      const crtA = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.04), this.crtAmberMat);
      crtA.position.set(deskX - 0.32, 1.16, deskZ - 0.18);
      crtA.rotation.x = 0.3;

      const crtB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.04), this.crtGreenMat);
      crtB.position.set(deskX + 0.32, 1.16, deskZ - 0.18);
      crtB.rotation.x = 0.3;

      const switchPlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.3), this.controlPanelMat);
      switchPlate.position.set(deskX, 0.91, deskZ + 0.2);

      for (let l = -0.15; l <= 0.15; l += 0.1) {
        const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), this.brassMat);
        lever.position.set(deskX + l, 0.98, deskZ + 0.2);
        lever.rotation.x = -0.25;
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), this.ironMat);
        knob.position.set(deskX + l, 1.04, deskZ + 0.18);
        bridgeGroup.add(lever, knob);
      }

      const cable = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 16), this.ironMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(deskX + side * 0.45, 0.91, deskZ + 0.15);

      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), this.ironMat);
      chairBase.position.set(deskX, 0.25, deskZ + 0.85);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), this.fabricMat);
      seat.position.set(deskX, 0.52, deskZ + 0.85);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), this.fabricMat);
      backrest.position.set(deskX, 0.82, deskZ + 1.1);
      bridgeGroup.add(consoleChassis, crtA, crtB, switchPlate, cable, chairBase, seat, backrest);

      this.addCollider(deskX - 0.9, deskX + 0.9, deskZ - 0.7 + 2.0, deskZ + 0.7 + 2.0);
    }

    this.group.add(bridgeGroup);
  }

  buildCockpitRoom() {
    // Flight Cockpit at anchor [0, 1.45, 1.6] facing forward
    const cockpitGroup = new THREE.Group();
    cockpitGroup.position.set(0, 0, 1.6);

    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.75, 8), this.ironMat);
    column.position.set(0, 0.55, -0.6);
    column.rotation.x = 0.22;

    const yokeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8), this.ironMat);
    yokeBar.rotation.z = Math.PI / 2;
    yokeBar.position.set(0, 0.92, -0.52);

    const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 8), this.durasteelMat);
    gripL.position.set(-0.21, 0.98, -0.52);
    const gripR = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.22, 8), this.durasteelMat);
    gripR.position.set(0.21, 0.98, -0.52);
    cockpitGroup.add(column, yokeBar, gripL, gripR);

    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 0.55), this.durasteelMat);
    dash.position.set(0, 0.95, -1.05);
    dash.rotation.x = 0.35;

    const radarScreen = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.48, 0.04), this.crtAmberMat);
    radarScreen.position.set(0, 1.0, -0.85);
    radarScreen.rotation.x = 0.35;

    const atScreen = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.04), this.crtGreenMat);
    atScreen.position.set(-0.68, 1.0, -0.85);
    atScreen.rotation.x = 0.35;

    const auxScreen = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.04), this.controlPanelMat);
    auxScreen.position.set(0.68, 1.0, -0.85);
    auxScreen.rotation.x = 0.35;

    cockpitGroup.add(dash, radarScreen, atScreen, auxScreen);

    const overheadConsole = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 1.4), this.ironMat);
    overheadConsole.position.set(0, 2.9, -0.2);
    overheadConsole.rotation.x = 0.15;

    const ohPanel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 1.1), this.controlPanelMat);
    ohPanel.position.set(0, 2.76, -0.2);
    ohPanel.rotation.x = 0.15;

    for (let bx of [-0.9, 0.9]) {
      const bundle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), this.ironMat);
      bundle.position.set(bx, 2.0, -0.6);
      bundle.rotation.x = 0.45;
      cockpitGroup.add(bundle);
    }

    cockpitGroup.add(overheadConsole, ohPanel);
    this.addCollider(-1.3, 1.3, 0.3, 1.1);

    this.group.add(cockpitGroup);
  }

  buildStarmapRoom() {
    // Star Map & Navigation Room at anchor [3.2, 1.8, 1.8]
    const starmapGroup = new THREE.Group();
    starmapGroup.position.set(3.2, 0, 1.8);

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.85, 8), this.durasteelMat);
    tableBase.position.set(0, 0.425, 0);
    tableBase.receiveShadow = true;
    starmapGroup.add(tableBase);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.1, 8), this.ironMat);
    tableTop.position.set(0, 0.88, 0);
    starmapGroup.add(tableTop);

    const rail = new THREE.Mesh(new THREE.TorusGeometry(1.52, 0.035, 8, 32), this.brassMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(0, 0.92, 0);

    for (let a = 0; a < 8; a++) {
      const angle = a * (Math.PI * 2 / 8);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), this.ironMat);
      post.position.set(Math.cos(angle) * 1.5, 0.8, Math.sin(angle) * 1.5);
      starmapGroup.add(post);
    }
    starmapGroup.add(rail);

    const emitterRing = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 24), this.brassMat);
    emitterRing.position.set(0, 0.95, 0);
    starmapGroup.add(emitterRing);

    const holoProjector = new THREE.Group();
    holoProjector.position.set(0, 1.45, 0);

    const wireSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 16, 12),
      createHoloMaterial({ color: 0xffaa22, opacity: 0.35, wireframe: true })
    );
    holoProjector.add(wireSphere);

    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    const sunLight = new THREE.PointLight(0xffaa22, 1.2, 6);
    holoProjector.add(sunCore, sunLight);

    for (let r = 0; r < 3; r++) {
      const rad = 0.28 + r * 0.18;
      const orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(rad - 0.005, rad + 0.005, 32),
        new THREE.MeshBasicMaterial({ color: 0xffaa22, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
      );
      orbitRing.rotation.x = Math.PI / 2 + (r * 0.18);
      orbitRing.rotation.y = r * 0.25;

      const planetGeo = new THREE.SphereGeometry(0.035 + r * 0.015, 12, 12);
      const planetMesh = new THREE.Mesh(
        planetGeo,
        new THREE.MeshBasicMaterial({ color: r === 0 ? 0xcc8833 : (r === 1 ? 0xddaa55 : 0xaa6622) })
      );
      planetMesh.position.set(rad, 0, 0);
      orbitRing.add(planetMesh);

      holoProjector.add(orbitRing);
      this.animatedElements.push({ obj: orbitRing, speed: 0.3 / (r + 1) });
    }

    starmapGroup.add(holoProjector);
    this.addCollider(3.2 - 1.6, 3.2 + 1.6, 1.8 - 1.6, 1.8 + 1.6);
    this.group.add(starmapGroup);
  }

  buildQuartersRoom() {
    // Crew Quarters at anchor [-3.8, 1.6, 2.2]
    const quartersGroup = new THREE.Group();
    quartersGroup.position.set(-3.8, 0, 2.2);

    const bunkFrame = new THREE.Group();
    bunkFrame.position.set(-1.0, 0, 0.4);

    for (let cx of [-0.6, 0.6]) {
      for (let cz of [-0.9, 0.9]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), this.durasteelMat);
        post.position.set(cx, 1.3, cz);
        bunkFrame.add(post);
      }
    }

    for (let y = 0.4; y <= 2.2; y += 0.35) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), this.ironMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0.6, y, 0);
      bunkFrame.add(rung);
    }

    const mattressLower = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.7), this.fabricMat);
    mattressLower.position.set(0, 0.45, 0);
    const blanketLower = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.2), this.durasteelMat);
    blanketLower.position.set(0, 0.52, -0.2);
    const pillowLower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.35), this.fabricMat);
    pillowLower.position.set(0, 0.55, 0.65);
    bunkFrame.add(mattressLower, blanketLower, pillowLower);

    const mattressUpper = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.7), this.fabricMat);
    mattressUpper.position.set(0, 1.65, 0);
    const blanketUpper = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.2), this.durasteelMat);
    blanketUpper.position.set(0, 1.72, -0.2);
    const pillowUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.35), this.fabricMat);
    pillowUpper.position.set(0, 1.75, 0.65);
    bunkFrame.add(mattressUpper, blanketUpper, pillowUpper);

    const lockerA = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.6), this.durasteelMat);
    lockerA.position.set(0, 0.16, -0.45);
    const lockerB = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.6), this.durasteelMat);
    lockerB.position.set(0, 0.16, 0.45);
    bunkFrame.add(lockerA, lockerB);

    quartersGroup.add(bunkFrame);
    this.addCollider(-3.8 - 1.8, -3.8 - 0.2, 2.2 - 0.7, 2.2 + 1.5);

    const deskShelf = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.6), this.ironMat);
    deskShelf.position.set(0.6, 0.9, -0.8);

    for (let sx of [0.3, 0.9]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.45), this.ironMat);
      strut.position.set(sx, 0.65, -0.8);
      quartersGroup.add(strut);
    }

    const miniCrt = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.3), this.crtAmberMat);
    miniCrt.position.set(0.6, 1.08, -0.8);

    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6), this.brassMat);
    lampArm.position.set(0.88, 1.15, -0.65);
    lampArm.rotation.z = -0.35;
    const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 8), this.durasteelMat);
    lampHead.position.set(0.78, 1.3, -0.65);
    lampHead.rotation.z = Math.PI * 0.8;
    const lampLight = new THREE.PointLight(0xffb703, 0.8, 3.5);
    lampLight.position.set(0.75, 1.25, -0.65);

    quartersGroup.add(deskShelf, miniCrt, lampArm, lampHead, lampLight);
    this.addCollider(-3.8 + 0.2, -3.8 + 1.1, 2.2 - 1.2, 2.2 - 0.4);

    this.group.add(quartersGroup);
  }

  buildCargoRoom() {
    // Cargo Hold at anchor [4.2, 1.6, -2.2]
    const cargoGroup = new THREE.Group();
    cargoGroup.position.set(4.2, 0, -2.2);

    const craneBeam = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 6.5), this.hazardMat);
    craneBeam.position.set(0, 3.75, 0);

    const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.8), this.ironMat);
    trolley.position.set(0, 3.4, -0.5);
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), this.ironMat);
    cable.position.set(0, 2.7, -0.5);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12, Math.PI * 1.5), this.ironMat);
    hook.position.set(0, 2.05, -0.5);
    cargoGroup.add(craneBeam, trolley, cable, hook);

    const rackGroup = new THREE.Group();
    rackGroup.position.set(1.8, 0, 0);

    for (let rx of [-0.6, 0.6]) {
      for (let rz of [-1.5, 0, 1.5]) {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.4, 0.1), this.hazardMat);
        upright.position.set(rx, 1.7, rz);
        rackGroup.add(upright);
      }
    }

    for (let tier = 0; tier < 3; tier++) {
      const sy = 0.5 + tier * 1.0;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 3.2), this.ironMat);
      shelf.position.set(0, sy, 0);
      rackGroup.add(shelf);

      for (let dz of [-1.0, -0.4, 0.4, 1.0]) {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.75, 12), tier % 2 === 0 ? this.durasteelMat : this.brassMat);
        drum.position.set(dz < 0 ? -0.25 : 0.25, sy + 0.42, dz);
        rackGroup.add(drum);
      }
    }
    cargoGroup.add(rackGroup);
    this.addCollider(4.2 + 1.1, 4.2 + 2.5, -2.2 - 1.8, -2.2 + 1.8);

    const containerA = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.8), this.durasteelMat);
    containerA.position.set(-1.4, 0.6, 1.2);
    const containerB = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.8), this.hazardMat);
    containerB.position.set(-1.4, 0.6, -1.0);
    cargoGroup.add(containerA, containerB);
    this.addCollider(4.2 - 2.2, 4.2 - 0.6, -2.2 - 2.0, -2.2 + 2.2);

    this.group.add(cargoGroup);
  }

  buildCommsRoom() {
    // Comms Array at anchor [-2.8, 1.8, -2.0]
    const commsGroup = new THREE.Group();
    commsGroup.position.set(-2.8, 0, -2.0);

    const rack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.75), this.ironMat);
    rack.position.set(0, 1.7, -1.2);
    commsGroup.add(rack);

    const osc = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.05), this.crtGreenMat);
    osc.position.set(-0.6, 1.85, -0.8);
    commsGroup.add(osc);

    const tel = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.05), this.crtAmberMat);
    tel.position.set(0.6, 1.85, -0.8);
    commsGroup.add(tel);

    const tubeShelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.28), this.durasteelMat);
    tubeShelf.position.set(0, 2.45, -0.75);
    commsGroup.add(tubeShelf);

    for (let tx = -0.7; tx <= 0.7; tx += 0.28) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 8), this.amberLampMat);
      tube.position.set(tx, 2.58, -0.75);
      commsGroup.add(tube);
    }
    const tubeLight = new THREE.PointLight(0xd99423, 0.9, 4.0);
    tubeLight.position.set(0, 2.6, -0.6);
    commsGroup.add(tubeLight);

    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.8), this.durasteelMat);
    desk.position.set(0, 0.85, -0.5);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.5), this.controlPanelMat);
    panel.position.set(0, 0.92, -0.5);
    commsGroup.add(desk, panel);

    for (let c = -0.5; c <= 0.5; c += 0.35) {
      const cord = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 6, 12, Math.PI), this.ironMat);
      cord.rotation.y = Math.PI / 2;
      cord.position.set(c, 1.25, -0.75);
      commsGroup.add(cord);
    }

    this.addCollider(-2.8 - 1.4, -2.8 + 1.4, -2.0 - 1.6, -2.0 - 0.1);
    this.group.add(commsGroup);
  }

  buildAirlockRoom() {
    // Airlock & Departure Bay at anchor [0, 1.8, -4.5]
    const airlockGroup = new THREE.Group();
    airlockGroup.position.set(0, 0, -4.5);

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.6, 0.6), this.hazardMat);
    doorFrame.position.set(0, 1.8, -2.0);
    airlockGroup.add(doorFrame);

    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 0.3), this.durasteelMat);
    doorSlab.position.set(0, 1.7, -1.9);
    airlockGroup.add(doorSlab);

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 20), this.ironMat);
    wheel.position.set(0, 1.7, -1.72);
    for (let s = 0; s < 2; s++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.84, 6), this.ironMat);
      spoke.rotation.z = s * (Math.PI / 2);
      spoke.position.set(0, 1.7, -1.72);
      airlockGroup.add(spoke);
    }
    airlockGroup.add(wheel);

    for (let py of [1.0, 2.4]) {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.4, 12), this.brassMat);
      cylinder.rotation.z = Math.PI / 2;
      cylinder.position.set(0, py, -1.72);

      const hazardSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 12), this.hazardMat);
      hazardSleeve.rotation.z = Math.PI / 2;
      hazardSleeve.position.set(0, py, -1.72);

      airlockGroup.add(cylinder, hazardSleeve);
    }

    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12), this.amberLampMat);
    beacon.position.set(0, 3.4, -1.75);
    const beaconLight = new THREE.PointLight(0xd99423, 1.1, 5.0);
    beaconLight.position.set(0, 3.3, -1.6);
    airlockGroup.add(beacon, beaconLight);

    for (let lx of [-1.2, 1.2]) {
      const lockIndicator = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.04), this.redLampMat);
      lockIndicator.position.set(lx, 3.2, -1.74);
      airlockGroup.add(lockIndicator);
    }

    for (let vx of [-1.8, 1.8]) {
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), this.ironMat);
      vent.position.set(vx, 1.6, -1.5);
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 8), this.brassMat);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(vx, 2.6, -1.4);
      airlockGroup.add(vent, nozzle);
    }

    this.addCollider(-2.5, 2.5, -6.8, -6.2);
    this.group.add(airlockGroup);
  }

  buildAtmosphericDust() {
    const dustCount = tierAtLeast("T4") ? 2200 : 1000;
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 15;
      dPos[i * 3 + 1] = 0.2 + Math.random() * 3.8;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dMat = new THREE.PointsMaterial({
      color: 0xd99423,
      size: 0.035,
      transparent: true,
      opacity: 0.38,
      blending: THREE.NormalBlending
    });
    this.dustParticles = new THREE.Points(dGeo, dMat);
    this.group.add(this.dustParticles);
  }

  buildPlanetaryVista() {
    const vista = new THREE.Group();
    const giantCenter = new THREE.Vector3(-30, 13, -95);
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

  update(delta, time) {
    for (const el of this.animatedElements) {
      if (el.obj) el.obj.rotation.z += delta * el.speed;
    }

    if (this.dustParticles) {
      const pos = this.dustParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - delta * 0.08;
        if (y < 0.2) y = 3.8;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  }
}
