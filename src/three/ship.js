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
  createDurasteelNormalTexture,
  createFloorGrateTexture,
  createHazardStripesTexture,
  createCrtScreenTexture,
  createControlPanelTexture,
  createQuestHoloTexture,
  createClubHoloTexture,
  createCommsStandingsTexture,
  createCargoManifestTexture,
  createBlastDoorTexture,
  createRackPanelTexture,
  createFootlockerTexture,
  createContainerStencilTexture,
  createKeyboardTexture,
  createDialGaugeTexture,
  createVacuumTubeTexture
} from "./materials/textures.js";
import {
  createPlanetMaterial,
  createAtmosphereShell,
  createRingMaterial
} from "./materials/celestial.js";
import { SHIP_GRAPH } from "./ship-graph.js";
import { tierManager, tierAtLeast } from "./tier.js";
import { session } from "../session.js";
import { QUEST1_STORY } from "../story/quest1.js";

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
    this.buildLightingFixtures();
    this.buildAtmosphericDust();
    this.buildPlanetaryVista();

    this.scene.add(this.group);

    this.clubHoloClosed = false;
    this.starmapHoloClosed = false;
    const isAuthed = Boolean(session?.token && session?.player);
    this.setClubHoloVisible(isAuthed);
    this.setStarmapHoloVisible(true);
  }

  initMaterials() {
    const loader = new THREE.TextureLoader();

    // 1. Durasteel Bulkhead Material (Nano Banana PBR Asset with Normal Map)
    this.durasteelTex = createDurasteelTexture(512, 512);
    this.durasteelNormTex = createDurasteelNormalTexture(256, 256);
    this.durasteelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2d34,
      map: this.durasteelTex,
      normalMap: this.durasteelNormTex,
      roughness: 0.84,
      metalness: 0.62
    });
    this.durasteelMat.normalScale.set(0.75, 0.75);

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

    // 6b. Ceiling Luminaire Diffusers (Warm Sodium / Halogen #ffe6b0)
    this.luminaireMat = new THREE.MeshBasicMaterial({ color: 0xffe6b0 });
    this.luminaireWarmMat = new THREE.MeshBasicMaterial({ color: 0xffcaa0 });

    // 7. Indicators
    this.amberLampMat = new THREE.MeshBasicMaterial({ color: 0xd99423 });
    this.greenLampMat = new THREE.MeshBasicMaterial({ color: 0x38b000 });
    this.redLampMat = new THREE.MeshBasicMaterial({ color: 0xc92a2a });

    // 8. CRT Displays (Multiple functional channels)
    this.crtAmberTex = createCrtScreenTexture("TELEMETRY", "amber");
    this.crtGreenTex = createCrtScreenTexture("ANALYSIS RF", "green");
    this.crtRadarTex = createCrtScreenTexture("RADAR", "green");
    this.crtReactorTex = createCrtScreenTexture("REACTOR", "amber");
    this.crtAmberMat = new THREE.MeshBasicMaterial({ map: this.crtAmberTex });
    this.crtGreenMat = new THREE.MeshBasicMaterial({ map: this.crtGreenTex });
    this.crtRadarMat = new THREE.MeshBasicMaterial({ map: this.crtRadarTex });
    this.crtReactorMat = new THREE.MeshBasicMaterial({ map: this.crtReactorTex });

    // 9. Analog Control Panel & Keyboards
    this.controlPanelTex = createControlPanelTexture(512, 256);
    this.controlPanelMat = new THREE.MeshStandardMaterial({
      map: this.controlPanelTex,
      roughness: 0.75,
      metalness: 0.28
    });
    this.keyboardTex = createKeyboardTexture(512, 256);
    this.keyboardMat = new THREE.MeshStandardMaterial({
      map: this.keyboardTex,
      roughness: 0.72,
      metalness: 0.25
    });

    // 10. Fabric / Bedding Material
    this.fabricMat = new THREE.MeshStandardMaterial({
      color: 0x3d3930,
      roughness: 0.95,
      metalness: 0.05
    });

    // 11. Stenciled Footlockers (Crew Quarters)
    this.footlockerOrtegaTex = createFootlockerTexture(512, 256, "CREW 12 // J. ORTEGA");
    this.footlockerOrtegaMat = new THREE.MeshStandardMaterial({
      map: this.footlockerOrtegaTex,
      roughness: 0.85,
      metalness: 0.35
    });
    this.footlockerCadetTex = createFootlockerTexture(512, 256, "CREW 14 // CADET ISSUE");
    this.footlockerCadetMat = new THREE.MeshStandardMaterial({
      map: this.footlockerCadetTex,
      roughness: 0.85,
      metalness: 0.35
    });

    // 12. Heavy Blast Door (Airlock Bay)
    this.blastDoorTex = createBlastDoorTexture(512, 512);
    this.blastDoorMat = new THREE.MeshStandardMaterial({
      map: this.blastDoorTex,
      roughness: 0.82,
      metalness: 0.52
    });

    // 13. 19-inch Equipment Rack Panels (Comms Array)
    this.rackPanelTex = createRackPanelTexture(512, 512);
    this.rackPanelMat = new THREE.MeshStandardMaterial({
      map: this.rackPanelTex,
      roughness: 0.8,
      metalness: 0.45
    });

    // 14. Dial Gauges (PSI & BAR)
    this.dialGaugePsiTex = createDialGaugeTexture(256, 256, "PSI");
    this.dialGaugeBarTex = createDialGaugeTexture(256, 256, "BAR");
    this.dialGaugePsiMat = new THREE.MeshStandardMaterial({
      map: this.dialGaugePsiTex,
      roughness: 0.4,
      metalness: 0.5
    });
    this.dialGaugeBarMat = new THREE.MeshStandardMaterial({
      map: this.dialGaugeBarTex,
      roughness: 0.4,
      metalness: 0.5
    });

    // 15. Shipping Container Stencils (Cargo Hold)
    this.containerMat = new THREE.MeshStandardMaterial({
      map: createContainerStencilTexture(512, 512, "MM", "44-B"),
      roughness: 0.88,
      metalness: 0.3
    });

    // 16. Glowing Vacuum Tubes (Comms Array)
    this.vacuumTubeTex = createVacuumTubeTexture(128, 256);
    this.vacuumTubeMat = new THREE.MeshBasicMaterial({
      map: this.vacuumTubeTex,
      transparent: true,
      opacity: 0.92
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

    // Transverse deck runway guide strips
    const stripCrossF = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.03, 0.08), this.halogenMat);
    stripCrossF.position.set(0.7, 0.015, -2.45);
    const stripCrossB = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.03, 0.08), this.halogenMat);
    stripCrossB.position.set(0.7, 0.015, -1.65);
    this.group.add(stripCrossF, stripCrossB);

    // 3. Port & Starboard Wing Corridors at Z = 2.0 (Connecting Bridge to Quarters X=-3.8 & Starmap X=3.2)
    const racewayWing = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.15, 1.0), this.ironMat);
    racewayWing.position.set(-0.3, 3.75, 2.0);
    this.group.add(racewayWing);

    // Wing corridor deck runway guide strips
    const stripWingF = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.03, 0.08), this.halogenMat);
    stripWingF.position.set(-0.3, 0.015, 1.6);
    const stripWingB = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.03, 0.08), this.halogenMat);
    stripWingB.position.set(-0.3, 0.015, 2.4);
    this.group.add(stripWingF, stripWingB);

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

    // Forward Observation Canopy at Z = 2.25 (world Z = 4.25, framing the forward viewport cutout)
    const canopyBase = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.7, 0.4), this.durasteelMat);
    canopyBase.position.set(0, 0.35, 2.25);
    const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.7, 0.4), this.durasteelMat);
    canopyTop.position.set(0, 3.65, 2.25);
    bridgeGroup.add(canopyBase, canopyTop);

    for (let x of [-3.2, -1.1, 1.1, 3.2]) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.8, 0.35), this.durasteelMat);
      mullion.position.set(x, 2.0, 2.25);
      mullion.rotation.z = x < 0 ? -0.14 : 0.14;
      bridgeGroup.add(mullion);
    }

    // Side Tactical Bridge Consoles (flanking the central walkway)
    for (let side of [-1, 1]) {
      const deskX = side * 2.2;
      const deskZ = -1.2; // world Z = 0.8

      // Main heavy console desk
      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.2), this.durasteelMat);
      deskTop.position.set(deskX, 0.85, deskZ);
      const deskLegL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.1), this.ironMat);
      deskLegL.position.set(deskX - 0.75, 0.425, deskZ);
      const deskLegR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.1), this.ironMat);
      deskLegR.position.set(deskX + 0.75, 0.425, deskZ);
      bridgeGroup.add(deskTop, deskLegL, deskLegR);

      // Mechanical terminal keyboard on desk surface
      const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.025, 0.32), this.keyboardMat);
      keyboard.position.set(deskX, 0.905, deskZ + 0.22);
      bridgeGroup.add(keyboard);

      // Console superstructure chassis
      const consoleChassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.48, 0.45), this.ironMat);
      consoleChassis.position.set(deskX, 1.14, deskZ - 0.35);
      consoleChassis.rotation.x = 0.3;

      // Lower CRT screens: Telemetry (amber) and Reactor Core (amber/green)
      const crtLowerA = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.04), this.crtTelemetryMat);
      crtLowerA.position.set(deskX - 0.34, 1.18, deskZ - 0.18);
      crtLowerA.rotation.x = 0.3;

      const crtLowerB = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.04), this.crtReactorMat);
      crtLowerB.position.set(deskX + 0.34, 1.18, deskZ - 0.18);
      crtLowerB.rotation.x = 0.3;

      // Upper Monitor Bridge & secondary CRTs (Radar & Analysis Spectrum)
      const upperGantry = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.25), this.ironMat);
      upperGantry.position.set(deskX, 1.58, deskZ - 0.42);

      const crtUpperA = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.04), this.crtRadarMat);
      crtUpperA.position.set(deskX - 0.32, 1.62, deskZ - 0.32);
      crtUpperA.rotation.x = -0.15;

      const crtUpperB = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.04), this.crtGreenMat);
      crtUpperB.position.set(deskX + 0.32, 1.62, deskZ - 0.32);
      crtUpperB.rotation.x = -0.15;

      // Analog dial gauge mounted on console flank
      const dialG = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), side < 0 ? this.dialGaugePsiMat : this.dialGaugeBarMat);
      dialG.rotation.x = Math.PI / 2;
      dialG.position.set(deskX - side * 0.78, 1.25, deskZ - 0.2);

      // Switchgear with toggle levers & safety guards
      const switchPlate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.24), this.controlPanelMat);
      switchPlate.position.set(deskX + side * 0.52, 0.91, deskZ + 0.22);

      for (let l = -0.12; l <= 0.12; l += 0.08) {
        const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), this.brassMat);
        lever.position.set(deskX + side * 0.52 + l, 0.98, deskZ + 0.22);
        lever.rotation.x = -0.25;
        const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), this.ironMat);
        knob.position.set(deskX + side * 0.52 + l, 1.04, deskZ + 0.2);
        bridgeGroup.add(lever, knob);
      }

      // Cable bundle loop from under desk to deck floor
      const cable = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 16), this.ironMat);
      cable.rotation.x = Math.PI / 2;
      cable.position.set(deskX + side * 0.55, 0.91, deskZ - 0.05);

      // Articulated tactical task lamp
      const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), this.brassMat);
      lampStem.position.set(deskX - side * 0.65, 1.08, deskZ - 0.1);
      lampStem.rotation.z = side * 0.25;
      const lampCowl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), this.durasteelMat);
      lampCowl.position.set(deskX - side * 0.6, 1.22, deskZ - 0.08);
      lampCowl.rotation.z = side * -0.5;
      const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), this.luminaireWarmMat);
      lampBulb.position.set(deskX - side * 0.58, 1.18, deskZ - 0.06);

      // Industrial pilot seat with heavy armrests & headrest
      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), this.ironMat);
      chairBase.position.set(deskX, 0.25, deskZ + 0.85);
      const chairFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.05, 8), this.ironMat);
      chairFoot.position.set(deskX, 0.025, deskZ + 0.85);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.58), this.fabricMat);
      seat.position.set(deskX, 0.52, deskZ + 0.85);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.1), this.fabricMat);
      backrest.position.set(deskX, 0.84, deskZ + 1.12);
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.08), this.fabricMat);
      headrest.position.set(deskX, 1.22, deskZ + 1.14);

      for (let armSide of [-0.34, 0.34]) {
        const armPost = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), this.ironMat);
        armPost.position.set(deskX + armSide, 0.65, deskZ + 0.85);
        const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.35), this.durasteelMat);
        armRest.position.set(deskX + armSide, 0.78, deskZ + 0.85);
        bridgeGroup.add(armPost, armRest);
      }

      bridgeGroup.add(
        consoleChassis, crtLowerA, crtLowerB,
        upperGantry, crtUpperA, crtUpperB,
        dialG, switchPlate, cable, lampStem, lampCowl, lampBulb,
        chairBase, chairFoot, seat, backrest, headrest
      );

      // Tight desk collider shifted back to Z: [0.2, 1.4], leaving transverse corridor Z: [1.4, 2.6] completely clear
      this.addCollider(deskX - 0.8, deskX + 0.8, 0.2, 1.4);
    }

    // 3D Holographic Directory & Club Notice Screen
    // Positioned in front of camera's original bridge position [0, 1.55, 1.8] (world Z = 3.2)
    const holoScreenGroup = new THREE.Group();
    holoScreenGroup.position.set(0, 1.55, 1.2);

    const clubTex = createClubHoloTexture();
    this.clubHoloMat = new THREE.MeshBasicMaterial({
      map: clubTex,
      transparent: true,
      opacity: 0.95,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });

    const screenGeom = new THREE.PlaneGeometry(1.8, 1.0125);

    // Front plane facing camera at Z = 1.8 (normal facing -Z)
    const holoFront = new THREE.Mesh(screenGeom, this.clubHoloMat);
    holoFront.rotation.y = Math.PI;
    holoFront.position.set(0, 0, -0.005);

    // Back plane facing forward (normal facing +Z)
    const holoBack = new THREE.Mesh(screenGeom, this.clubHoloMat);
    holoBack.position.set(0, 0, 0.005);

    holoScreenGroup.add(holoFront, holoBack);
    this.clubHoloGroup = holoScreenGroup;

    // Floor emitter base
    const emitterBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.04, 20), this.durasteelMat);
    emitterBase.position.set(0, 0.02, 1.2);
    const emitterLens = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.05, 20), this.brassMat);
    emitterLens.position.set(0, 0.03, 1.2);
    bridgeGroup.add(emitterBase, emitterLens);

    // Vertical holographic projection beam
    const beamGeom = new THREE.CylinderGeometry(0.9, 0.18, 1.5, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xd99423,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      depthWrite: false
    });
    const beam = new THREE.Mesh(beamGeom, beamMat);
    beam.position.set(0, 0.75, 1.2);
    this.clubHoloBeam = beam;
    bridgeGroup.add(beam);

    bridgeGroup.add(holoScreenGroup);

    this.group.add(bridgeGroup);
  }

  buildCockpitRoom() {
    // Flight Helm facing forward
    // Styled as dual pilot & navigator flight pods flanking a clear central aisle
    const cockpitGroup = new THREE.Group();
    cockpitGroup.position.set(0, 0, 3.2);

    for (let side of [-1, 1]) {
      const podX = side * 1.25;

      // Heavy flight steering column
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.78, 8), this.ironMat);
      column.position.set(podX, 0.55, 0.2);
      column.rotation.x = -0.22;

      // Ergonomic dual-handle yoke
      const yokeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.44, 8), this.ironMat);
      yokeBar.rotation.z = Math.PI / 2;
      yokeBar.position.set(podX, 0.94, 0.28);

      const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), this.durasteelMat);
      gripL.position.set(podX - 0.22, 1.0, 0.28);
      const gripR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), this.durasteelMat);
      gripR.position.set(podX + 0.22, 1.0, 0.28);

      // Center hub cap with amber status indicator
      const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), this.brassMat);
      hubCap.rotation.x = Math.PI / 2;
      hubCap.position.set(podX, 0.94, 0.3);
      const hubLamp = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), this.amberLampMat);
      hubLamp.position.set(podX, 0.94, 0.32);

      cockpitGroup.add(column, yokeBar, gripL, gripR, hubCap, hubLamp);

      // Flight dash binnacle
      const podDash = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.58, 0.48), this.durasteelMat);
      podDash.position.set(podX, 0.96, 0.65);
      podDash.rotation.x = -0.35;

      // Primary flight CRT (Attitude/Vector & Radar)
      const screenA = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.04), side < 0 ? this.crtTelemetryMat : this.crtRadarMat);
      screenA.position.set(podX - 0.2, 1.02, 0.52);
      screenA.rotation.x = -0.35;

      const screenB = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.04), side < 0 ? this.crtReactorMat : this.crtGreenMat);
      screenB.position.set(podX + 0.22, 1.04, 0.53);
      screenB.rotation.x = -0.35;

      // Micro dial gauges on dash
      const dashDial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), this.dialGaugePsiMat);
      dashDial.rotation.x = Math.PI / 2 - 0.35;
      dashDial.position.set(podX + 0.25, 0.84, 0.58);

      // Rudder pedals on deck
      for (let pSide of [-0.15, 0.15]) {
        const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.16), this.ironMat);
        pedal.position.set(podX + pSide, 0.06, 0.62);
        pedal.rotation.x = 0.45;
        cockpitGroup.add(pedal);
      }

      cockpitGroup.add(podDash, screenA, screenB, dashDial);

      // Armored bucket pilot seat with five-point harness straps
      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45, 8), this.ironMat);
      chairBase.position.set(podX, 0.25, -0.35);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.09, 0.56), this.fabricMat);
      seat.position.set(podX, 0.52, -0.35);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.09), this.fabricMat);
      backrest.position.set(podX, 0.82, -0.6);

      // Safety harness straps
      for (let s of [-0.14, 0.14]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.015), this.durasteelMat);
        strap.position.set(podX + s, 0.82, -0.54);
        cockpitGroup.add(strap);
      }

      cockpitGroup.add(chairBase, seat, backrest);

      // Colliders for pods shifted forward to Z: [2.6, 3.8], leaving transverse corridor Z: [1.4, 2.6] clear
      this.addCollider(podX - 0.55, podX + 0.55, 2.6, 3.8);
    }

    // Center Throttle Quadrant & Avionics Pedestal (X = 0, Z = 0.3)
    const centerPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.72), this.ironMat);
    centerPedestal.position.set(0, 0.45, 0.1);
    centerPedestal.rotation.x = -0.15;

    // 4 Throttle levers with brass shafts and spherical knobs
    for (let t = -0.12; t <= 0.12; t += 0.08) {
      const tLever = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), this.brassMat);
      tLever.position.set(t, 0.82, 0.08);
      tLever.rotation.x = -0.3;
      const tKnob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), this.ironMat);
      tKnob.position.set(t, 0.88, 0.06);
      cockpitGroup.add(tLever, tKnob);
    }

    // Attitude sphere gimbal housing
    const attitudeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), this.brassMat);
    attitudeSphere.position.set(0, 0.78, 0.32);

    cockpitGroup.add(centerPedestal, attitudeSphere);

    // Overhead avionics rack suspended above eye height (Y = 3.15)
    const overheadConsole = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.26, 1.2), this.ironMat);
    overheadConsole.position.set(0, 3.15, 0.2);
    overheadConsole.rotation.x = -0.12;

    const ohPanel = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.04, 0.95), this.controlPanelMat);
    ohPanel.position.set(0, 3.01, 0.2);
    ohPanel.rotation.x = -0.12;

    // Amber luminaire strip on cockpit overhead console
    const ohLamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.15), this.luminaireWarmMat);
    ohLamp.position.set(0, 2.99, 0.2);
    ohLamp.rotation.x = -0.12;

    cockpitGroup.add(overheadConsole, ohPanel, ohLamp);
    this.addCollider(-0.25, 0.25, 3.1, 3.6);
    this.group.add(cockpitGroup);
  }

  buildStarmapRoom() {
    // Star Map & Navigation Room at anchor [3.2, 1.8, 1.8]
    const starmapGroup = new THREE.Group();
    starmapGroup.position.set(3.2, 0, 1.8);

    // Chamfered octagonal tactical table pedestal
    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.45, 0.85, 8), this.durasteelMat);
    tableBase.position.set(0, 0.425, 0);
    tableBase.receiveShadow = true;
    starmapGroup.add(tableBase);

    // Tabletop rim with beveled control surfaces
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.1, 8), this.ironMat);
    tableTop.position.set(0, 0.88, 0);
    starmapGroup.add(tableTop);

    // Brass perimeter safety grab rail on stanchion posts
    const rail = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.035, 8, 32), this.brassMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(0, 0.94, 0);

    for (let a = 0; a < 8; a++) {
      const angle = a * (Math.PI * 2 / 8);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), this.ironMat);
      post.position.set(Math.cos(angle) * 1.34, 0.8, Math.sin(angle) * 1.34);
      starmapGroup.add(post);

      // Tactile pushbuttons and rotary dials on the table rim bevel
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8), a % 2 === 0 ? this.amberLampMat : this.brassMat);
      button.position.set(Math.cos(angle + 0.2) * 1.12, 0.94, Math.sin(angle + 0.2) * 1.12);
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.025, 12), this.ironMat);
      dial.position.set(Math.cos(angle - 0.2) * 1.12, 0.94, Math.sin(angle - 0.2) * 1.12);
      starmapGroup.add(button, dial);
    }
    starmapGroup.add(rail);

    // Stepped concentric holographic emitter rings
    const emitterOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.04, 24), this.durasteelMat);
    emitterOuter.position.set(0, 0.94, 0);
    const emitterRing = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.07, 24), this.brassMat);
    emitterRing.position.set(0, 0.97, 0);
    const emitterCore = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.09, 16), this.halogenMat);
    emitterCore.position.set(0, 0.99, 0);
    starmapGroup.add(emitterOuter, emitterRing, emitterCore);

    // Multi-tier planetary orrery projection
    const holoProjector = new THREE.Group();
    holoProjector.position.set(0, 1.35, 0);

    const wireSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.52, 16, 12),
      createHoloMaterial({ color: 0xffaa22, opacity: 0.32, wireframe: true })
    );
    holoProjector.add(wireSphere);

    const sunCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffd166 })
    );
    holoProjector.add(sunCore);

    // 4 Inclined orbital paths with celestial bodies
    const orbitConfigs = [
      { rad: 0.22, color: 0xcc8833, size: 0.026, inclX: 0.15, inclY: 0.1, speed: 0.5 },
      { rad: 0.36, color: 0xddaa55, size: 0.042, inclX: -0.22, inclY: 0.35, speed: 0.35, hasRings: true },
      { rad: 0.48, color: 0x995533, size: 0.032, inclX: 0.28, inclY: -0.15, speed: 0.22 },
      { rad: 0.62, color: 0x7788aa, size: 0.024, inclX: -0.1, inclY: 0.45, speed: 0.16 }
    ];

    orbitConfigs.forEach((cfg) => {
      const orbitRing = new THREE.Mesh(
        new THREE.RingGeometry(cfg.rad - 0.005, cfg.rad + 0.005, 32),
        new THREE.MeshBasicMaterial({ color: 0xffaa22, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
      );
      orbitRing.rotation.x = Math.PI / 2 + cfg.inclX;
      orbitRing.rotation.y = cfg.inclY;

      const planetMesh = new THREE.Mesh(
        new THREE.SphereGeometry(cfg.size, 12, 12),
        new THREE.MeshBasicMaterial({ color: cfg.color })
      );
      planetMesh.position.set(cfg.rad, 0, 0);

      // Gas giant miniature ring disc
      if (cfg.hasRings) {
        const pRings = new THREE.Mesh(
          new THREE.RingGeometry(cfg.size * 1.4, cfg.size * 2.2, 16),
          new THREE.MeshBasicMaterial({ color: 0xcca877, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
        );
        pRings.rotation.x = Math.PI / 2 + 0.3;
        planetMesh.add(pRings);
      }

      orbitRing.add(planetMesh);
      holoProjector.add(orbitRing);
      this.animatedElements.push({ obj: orbitRing, speed: cfg.speed });
    });

    // 3D Holographic Quest Display floating above table
    const qTex = createQuestHoloTexture(0, 20, '');
    this.starmapHoloMat = new THREE.MeshBasicMaterial({
      map: qTex,
      transparent: true,
      opacity: 0.94,
      side: THREE.DoubleSide
    });
    const holoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), this.starmapHoloMat);
    holoPlane.position.set(0, 1.95, 0);
    this.animatedElements.push({ obj: holoPlane, speed: 0.05, isHover: true });

    // Starmap holographic projection group (planetary orrery + quest display)
    const starmapHoloGroup = new THREE.Group();
    starmapHoloGroup.add(holoProjector);
    starmapHoloGroup.add(holoPlane);
    this.starmapHoloGroup = starmapHoloGroup;
    this.starmapHoloProjector = holoProjector;
    this.starmapHoloPlane = holoPlane;
    starmapGroup.add(starmapHoloGroup);

    // Tight pedestal-only collider, leaving room walkable on all sides
    this.addCollider(3.2 - 0.85, 3.2 + 0.85, 1.8 - 0.85, 1.8 + 0.85);
    this.group.add(starmapGroup);
  }

  buildQuartersRoom() {
    // Crew Quarters at anchor [-3.8, 1.6, 2.2]
    const quartersGroup = new THREE.Group();
    quartersGroup.position.set(-3.8, 0, 2.2);

    // 1. Two-tier industrial bunk bed frame against port wall
    const bunkFrame = new THREE.Group();
    bunkFrame.position.set(-1.0, 0, 0.4);

    for (let cx of [-0.6, 0.6]) {
      for (let cz of [-0.9, 0.9]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.6, 0.08), this.durasteelMat);
        post.position.set(cx, 1.3, cz);
        bunkFrame.add(post);
      }
    }

    // Access ladder rungs
    for (let y = 0.4; y <= 2.2; y += 0.35) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), this.ironMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0.6, y, 0);
      bunkFrame.add(rung);
    }

    // Lower bunk mattress, blanket & pillow
    const mattressLower = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.7), this.fabricMat);
    mattressLower.position.set(0, 0.45, 0);
    const blanketLower = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.2), this.durasteelMat);
    blanketLower.position.set(0, 0.52, -0.2);
    const pillowLower = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.35), this.fabricMat);
    pillowLower.position.set(0, 0.55, 0.65);
    bunkFrame.add(mattressLower, blanketLower, pillowLower);

    // Upper bunk mattress, blanket, pillow & safety rail
    const mattressUpper = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, 1.7), this.fabricMat);
    mattressUpper.position.set(0, 1.65, 0);
    const blanketUpper = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.2), this.durasteelMat);
    blanketUpper.position.set(0, 1.72, -0.2);
    const pillowUpper = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.35), this.fabricMat);
    pillowUpper.position.set(0, 1.75, 0.65);
    const safetyRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 1.2), this.durasteelMat);
    safetyRail.position.set(0.56, 1.82, -0.2);
    bunkFrame.add(mattressUpper, blanketUpper, pillowUpper, safetyRail);

    // Personal bunk cubbies with datapad
    const cubbyLower = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.15), this.durasteelMat);
    cubbyLower.position.set(-0.4, 0.72, 0.82);
    const datapad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.12), this.ironMat);
    datapad.position.set(-0.4, 0.62, 0.82);
    bunkFrame.add(cubbyLower, datapad);

    // Under-bunk storage: Two stenciled metal footlockers resting cleanly on deck (Y = 0.16)
    const lockerA = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.6), this.footlockerOrtegaMat);
    lockerA.position.set(0, 0.16, -0.45);
    const lockerB = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.6), this.footlockerCadetMat);
    lockerB.position.set(0, 0.16, 0.45);
    bunkFrame.add(lockerA, lockerB);

    quartersGroup.add(bunkFrame);
    // Bunks tight against port outer wall
    this.addCollider(-5.4, -4.2, 1.7, 3.5);

    // 2. Fold-down Work Desk against bulkhead wall at X = 0.6 (world X = -3.2), Z = -0.8
    const deskShelf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.65), this.durasteelMat);
    deskShelf.position.set(0.6, 0.9, -0.8);

    for (let sx of [0.28, 0.92]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.45), this.ironMat);
      strut.position.set(sx, 0.65, -0.8);
      quartersGroup.add(strut);
    }

    // Mini CRT crew log terminal on desk
    const miniCrt = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.28), this.crtAmberMat);
    miniCrt.position.set(0.52, 1.08, -0.82);

    // Realistic articulated anglepoise desk lamp: weighted base + dual hinged arms + conical shade
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 12), this.ironMat);
    lampBase.position.set(0.88, 0.945, -0.65);

    const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.26, 6), this.brassMat);
    lowerArm.position.set(0.88, 1.08, -0.65);
    lowerArm.rotation.z = -0.28;

    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.24, 6), this.brassMat);
    upperArm.position.set(0.82, 1.25, -0.65);
    upperArm.rotation.z = 0.52;

    const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 8), this.durasteelMat);
    lampHead.position.set(0.72, 1.32, -0.65);
    lampHead.rotation.z = Math.PI * 0.85;

    const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), this.luminaireWarmMat);
    lampBulb.position.set(0.68, 1.25, -0.65);

    // Stool at desk
    const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12), this.durasteelMat);
    stoolSeat.position.set(0.6, 0.52, -0.32);
    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), this.ironMat);
    stoolLeg.position.set(0.6, 0.25, -0.32);
    const stoolFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.04, 8), this.ironMat);
    stoolFoot.position.set(0.6, 0.02, -0.32);

    // 3. Wall Utility Hooks with hanging expedition gear
    const hookRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.9), this.ironMat);
    hookRail.position.set(-0.25, 1.65, -0.85);
    quartersGroup.add(hookRail);

    for (let hz of [-1.15, -0.85, -0.55]) {
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 8, Math.PI), this.brassMat);
      hook.rotation.y = Math.PI / 2;
      hook.position.set(-0.22, 1.63, hz);
      quartersGroup.add(hook);
    }

    // Hanging canvas duffel / gear pack on hook 1
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.24), this.fabricMat);
    pack.position.set(-0.22, 1.35, -1.15);
    // Hanging survival jacket on hook 2
    const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.48, 0.22), this.durasteelMat);
    jacket.position.set(-0.22, 1.32, -0.85);
    // Hanging oxygen canister / rebreather on hook 3
    const canister = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32, 8), this.brassMat);
    canister.position.set(-0.22, 1.4, -0.55);

    quartersGroup.add(
      deskShelf, miniCrt, lampBase, lowerArm, upperArm, lampHead, lampBulb,
      stoolSeat, stoolLeg, stoolFoot, pack, jacket, canister
    );

    // Desk and stool collider against wall
    this.addCollider(-3.6, -2.8, 1.0, 1.8);

    this.group.add(quartersGroup);
  }

  buildCargoRoom() {
    // Cargo Hold at anchor [4.2, 1.6, -2.2]
    const cargoGroup = new THREE.Group();
    cargoGroup.position.set(4.2, 0, -2.2);

    // 1. Overhead Gantry Crane with I-beam flange and motorized hoist
    const craneBeamWeb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 6.8), this.hazardMat);
    craneBeamWeb.position.set(0, 3.75, 0);
    const craneTopFlange = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 6.8), this.hazardMat);
    craneTopFlange.position.set(0, 3.98, 0);
    const craneBottomFlange = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 6.8), this.hazardMat);
    craneBottomFlange.position.set(0, 3.52, 0);
    cargoGroup.add(craneBeamWeb, craneTopFlange, craneBottomFlange);

    // Hoist trolley carriage riding bottom flange
    const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.28, 0.78), this.ironMat);
    trolley.position.set(0, 3.36, -0.4);

    // Trolley flanged wheels
    for (let wx of [-0.28, 0.28]) {
      for (let wz of [-0.25, 0.25]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), this.durasteelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 3.52, -0.4 + wz);
        cargoGroup.add(wheel);
      }
    }

    // Steel wire rope cable & forged lifting hook with safety latch
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.1, 6), this.ironMat);
    cable.position.set(0, 2.7, -0.4);
    const counterweight = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), this.ironMat);
    counterweight.position.set(0, 2.15, -0.4);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 6, 14, Math.PI * 1.5), this.brassMat);
    hook.position.set(0, 2.02, -0.4);
    cargoGroup.add(trolley, cable, counterweight, hook);

    // 2. Multi-tier Heavy Cantilever Storage Racks against starboard outer wall
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

      // Sealed cylindrical chemical drums resting cleanly ON shelf surface (sy + 0.04 + 0.38)
      for (let dz of [-1.0, -0.38, 0.38, 1.0]) {
        const drumY = sy + 0.04 + 0.38;
        const drumX = dz < 0 ? -0.26 : 0.26;
        const drum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.24, 0.76, 16),
          tier % 2 === 0 ? this.durasteelMat : this.brassMat
        );
        drum.position.set(drumX, drumY, dz);

        // Chime reinforcement rings on drum top and bottom
        const topChime = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 6, 16), this.ironMat);
        topChime.rotation.x = Math.PI / 2;
        topChime.position.set(drumX, drumY + 0.37, dz);
        const bungCap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8), this.brassMat);
        bungCap.position.set(drumX + 0.12, drumY + 0.39, dz + 0.05);

        rackGroup.add(drum, topChime, bungCap);
      }
    }
    cargoGroup.add(rackGroup);
    // Storage racks against starboard outer wall
    this.addCollider(5.3, 6.7, -3.8, -0.6);

    // 3. Stenciled Shipping Freight Containers
    // Container A (Primary unit with Guild stencil)
    const containerA = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.6), this.containerMat);
    containerA.position.set(-1.4, 0.6, 1.2);

    // Container B (Hazard striped freight unit)
    const containerB = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.6), this.hazardMat);
    containerB.position.set(-1.4, 0.6, -1.0);

    // Top stacked smaller container unit C resting on container B
    const containerC = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), this.durasteelMat);
    containerC.position.set(-1.4, 1.6, -1.0);

    // Twist-lock corner castings on container A
    for (let cx of [-0.68, 0.68]) {
      for (let cz of [-0.78, 0.78]) {
        for (let cy of [0.05, 1.15]) {
          const cornerCast = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), this.ironMat);
          cornerCast.position.set(-1.4 + cx, cy, 1.2 + cz);
          cargoGroup.add(cornerCast);
        }
      }
    }

    cargoGroup.add(containerA, containerB, containerC);
    // Crates collider leaving walkways clear
    this.addCollider(2.1, 3.5, -1.8, -0.2);

    // 4. 3D Cargo Manifest Terminal on container A facing room center (X: -1.4, Z: 0.39)
    const mTex = createCargoManifestTexture(0, 8, '');
    this.cargoScreenMat = new THREE.MeshBasicMaterial({
      map: mTex,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const manifestScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), this.cargoScreenMat);
    manifestScreen.position.set(-1.4, 1.15, 0.37);
    manifestScreen.rotation.y = Math.PI;

    // Terminal bezel frame
    const manifestFrame = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.63, 0.03), this.ironMat);
    manifestFrame.position.set(-1.4, 1.15, 0.395);
    cargoGroup.add(manifestScreen, manifestFrame);

    this.group.add(cargoGroup);
  }

  buildCommsRoom() {
    // Comms Array at anchor [-2.8, 1.8, -2.0]
    const commsGroup = new THREE.Group();
    commsGroup.position.set(-2.8, 0, -2.0);

    // 1. Floor-to-ceiling 19-inch Equipment Rack with authentic modular faceplates
    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.4, 0.75), this.ironMat);
    rackFrame.position.set(0, 1.7, -1.2);
    commsGroup.add(rackFrame);

    // Modular 4U rack panels on rack face
    for (let u = 0; u < 3; u++) {
      const uPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.48, 0.78), this.rackPanelMat);
      uPanel.position.set(0, 0.85 + u * 0.84, -0.815);
      commsGroup.add(uPanel);
    }

    // 2. Monitoring & Spectrum Consoles
    // Green Oscilloscope CRT
    const osc = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.05), this.crtGreenMat);
    osc.position.set(-0.6, 1.85, -0.8);
    commsGroup.add(osc);

    // 3D Live Standings Screen on main console
    const sTex = createCommsStandingsTexture([], '');
    this.commsScreenMat = new THREE.MeshBasicMaterial({ map: sTex });
    const standingsScreen = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.65, 0.05), this.commsScreenMat);
    standingsScreen.position.set(0.6, 1.85, -0.8);
    commsGroup.add(standingsScreen);

    // 3. Glowing Vacuum Tube Gallery with protective wire cage
    const tubeShelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.28), this.durasteelMat);
    tubeShelf.position.set(0, 2.45, -0.75);
    commsGroup.add(tubeShelf);

    for (let tx = -0.7; tx <= 0.7; tx += 0.28) {
      // Glass vacuum tube with internal filament
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.24, 12), this.vacuumTubeMat);
      tube.position.set(tx, 2.6, -0.75);
      const tubeBasePin = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 8), this.brassMat);
      tubeBasePin.position.set(tx, 2.47, -0.75);
      commsGroup.add(tube, tubeBasePin);
    }

    // Protective wire cage enclosing tubes
    const cageRoof = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.02, 0.26), this.ironMat);
    cageRoof.position.set(0, 2.76, -0.75);
    commsGroup.add(cageRoof);

    // 4. Operator Desk with mechanical keyboard and analog patch bay
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, 0.85), this.durasteelMat);
    desk.position.set(0, 0.85, -0.48);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.5), this.controlPanelMat);
    panel.position.set(0, 0.92, -0.5);

    // Mechanical keyboard on operator desk
    const commsKeyboard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.025, 0.28), this.keyboardMat);
    commsKeyboard.position.set(-0.55, 0.92, -0.26);

    commsGroup.add(desk, panel, commsKeyboard);

    // Looping 3D patch cables connecting between patch bay jacks
    const cordOffsets = [
      { x1: -0.45, y1: 1.22, x2: -0.15, y2: 1.12, r: 0.18 },
      { x1: -0.15, y1: 1.34, x2: 0.22, y2: 1.25, r: 0.22 },
      { x1: 0.25, y1: 1.18, x2: 0.55, y2: 1.35, r: 0.19 }
    ];

    for (const cord of cordOffsets) {
      const midX = (cord.x1 + cord.x2) / 2;
      const midY = Math.min(cord.y1, cord.y2) - 0.08;
      const loop = new THREE.Mesh(new THREE.TorusGeometry(cord.r, 0.016, 6, 14, Math.PI), this.ironMat);
      loop.position.set(midX, midY, -0.76);
      loop.rotation.y = Math.PI / 2;
      commsGroup.add(loop);
    }

    // Communication headset on rack side hook
    const headsetBand = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 12, Math.PI), this.durasteelMat);
    headsetBand.position.set(1.22, 1.45, -0.75);
    const earpieceL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), this.fabricMat);
    earpieceL.position.set(1.22, 1.35, -0.65);
    commsGroup.add(headsetBand, earpieceL);

    // Equipment rack against wall only, leaving floor in front clear
    this.addCollider(-3.8, -1.8, -3.6, -2.4);
    this.group.add(commsGroup);
  }

  buildAirlockRoom() {
    // Airlock & Departure Bay at anchor [0, 1.8, -4.5]
    const airlockGroup = new THREE.Group();
    airlockGroup.position.set(0, 0, -4.5);

    // 1. Massive chamfered octagonal bulkhead frame with hazard stripes
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.6, 0.6), this.hazardMat);
    doorFrame.position.set(0, 1.8, -2.0);
    airlockGroup.add(doorFrame);

    // 2. Heavy armored blast door slab with PBR blast door texture
    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 0.3), this.blastDoorMat);
    doorSlab.position.set(0, 1.7, -1.9);
    airlockGroup.add(doorSlab);

    // 3. Manual Dogging Handwheel with spoke grips and center locking pin
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.048, 8, 24), this.ironMat);
    wheel.position.set(0, 1.7, -1.72);
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.86, 6), this.ironMat);
      spoke.rotation.z = s * (Math.PI / 4);
      spoke.position.set(0, 1.7, -1.72);
      airlockGroup.add(spoke);
    }
    const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12), this.brassMat);
    centerPin.rotation.x = Math.PI / 2;
    centerPin.position.set(0, 1.7, -1.68);
    airlockGroup.add(wheel, centerPin);

    // 4. Hydraulic locking rams with hazard sleeves and polished chrome rods
    for (let py of [0.95, 2.45]) {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 2.6, 12), this.brassMat);
      cylinder.rotation.z = Math.PI / 2;
      cylinder.position.set(0, py, -1.72);

      const hazardSleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.65, 12), this.hazardMat);
      hazardSleeveL.rotation.z = Math.PI / 2;
      hazardSleeveL.position.set(-1.0, py, -1.72);

      const hazardSleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.65, 12), this.hazardMat);
      hazardSleeveR.rotation.z = Math.PI / 2;
      hazardSleeveR.position.set(1.0, py, -1.72);

      airlockGroup.add(cylinder, hazardSleeveL, hazardSleeveR);
    }

    // 5. Overhead rotating amber warning beacon lamp
    const beaconHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 12), this.ironMat);
    beaconHousing.position.set(0, 3.52, -1.75);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12), this.amberLampMat);
    beacon.position.set(0, 3.4, -1.75);
    airlockGroup.add(beaconHousing, beacon);

    // Dual red "LOCKED" indicator lamps
    for (let lx of [-1.3, 1.3]) {
      const lockIndicator = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.04), this.redLampMat);
      lockIndicator.position.set(lx, 3.2, -1.74);
      airlockGroup.add(lockIndicator);
    }

    // Pressure equalization dial gauges (PSI and BAR) on door frame
    const airlockGaugeA = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), this.dialGaugePsiMat);
    airlockGaugeA.rotation.x = Math.PI / 2;
    airlockGaugeA.position.set(-1.9, 2.0, -1.72);
    const airlockGaugeB = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), this.dialGaugeBarMat);
    airlockGaugeB.rotation.x = Math.PI / 2;
    airlockGaugeB.position.set(-1.9, 1.7, -1.72);
    airlockGroup.add(airlockGaugeA, airlockGaugeB);

    // 6. High-pressure steam decontamination nozzles and pipes
    for (let vx of [-1.85, 1.85]) {
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.6, 8), this.ironMat);
      vent.position.set(vx, 1.6, -1.5);
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 8), this.brassMat);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(vx, 2.6, -1.4);
      airlockGroup.add(vent, nozzle);
    }

    // Emergency wall-mounted oxygen rebreather pack
    const rebreather = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.55, 0.22), this.redLampMat);
    rebreather.position.set(1.95, 1.6, -1.65);
    const rebreatherGauge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), this.brassMat);
    rebreatherGauge.rotation.x = Math.PI / 2;
    rebreatherGauge.position.set(1.95, 1.75, -1.53);
    airlockGroup.add(rebreather, rebreatherGauge);

    // Outer airlock wall at Z = -6.5
    this.addCollider(-2.0, 2.0, -7.0, -6.0);
    this.group.add(airlockGroup);
  }

  createCeilingLuminaire(x, y, z, rotY = 0, length = 1.2) {
    const fixture = new THREE.Group();
    fixture.position.set(x, y, z);
    fixture.rotation.y = rotY;

    // Dark iron protective chassis housing mounted flush to ceiling slab
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, length), this.ironMat);
    housing.position.set(0, 0, 0);

    // Glowing diffuser panel facing down
    const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(0.24, length - 0.08), this.luminaireMat);
    diffuser.rotation.x = Math.PI / 2;
    diffuser.position.set(0, -0.061, 0);

    // Brass wire guard cross-ribs
    const ribCount = Math.max(2, Math.round(length / 0.28));
    for (let i = 0; i < ribCount; i++) {
      const ribZ = -(length - 0.16) / 2 + (i / (ribCount - 1)) * (length - 0.16);
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), this.brassMat);
      wire.rotation.z = Math.PI / 2;
      wire.position.set(0, -0.066, ribZ);
      fixture.add(wire);
    }

    fixture.add(housing, diffuser);
    this.group.add(fixture);
    return fixture;
  }

  buildLightingFixtures() {
    // 1. Central Spine Corridor (Bridge to Airlock)
    this.createCeilingLuminaire(0, 3.94, 0.5, 0, 1.4);
    this.createCeilingLuminaire(0, 3.94, -1.2, 0, 1.4);
    this.createCeilingLuminaire(0, 3.94, -2.8, 0, 1.4);

    // 2. Transverse Cross-Corridor (Comms to Cargo at Z = -2.0)
    this.createCeilingLuminaire(-1.4, 3.94, -2.0, Math.PI / 2, 1.5);
    this.createCeilingLuminaire(2.1, 3.94, -2.0, Math.PI / 2, 1.5);

    // 3. Port & Starboard Wing Corridors at Z = 2.0 (Bridge to Quarters & Starmap)
    this.createCeilingLuminaire(-1.9, 3.94, 2.0, Math.PI / 2, 1.5);
    this.createCeilingLuminaire(1.6, 3.94, 2.0, Math.PI / 2, 1.5);

    // 4. Command Bridge Ceiling
    this.createCeilingLuminaire(0, 3.94, 1.8, 0, 1.8);

    // 5. Cockpit Canopy Area
    this.createCeilingLuminaire(0, 3.94, 2.8, 0, 1.4);

    // 6. Star Map & Navigation Room
    this.createCeilingLuminaire(3.2, 3.94, 1.8, 0, 1.6);

    // 7. Crew Quarters
    this.createCeilingLuminaire(-3.8, 3.94, 2.2, 0, 1.6);

    // 8. Cargo Hold
    this.createCeilingLuminaire(4.2, 3.94, -2.2, 0, 1.8);

    // 9. Comms Array
    this.createCeilingLuminaire(-2.8, 3.94, -2.0, 0, 1.6);

    // 10. Airlock & Departure Bay
    this.createCeilingLuminaire(0, 3.94, -4.5, 0, 1.8);
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
    // Gas giant & ring system placed ahead through forward canopy (Z = +85) and visible through windows
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
   * shape of the glass it is being looked through. A narrow window cropped its
   * left and right edges off. The screen and the beam that throws it scale
   * together; `stage.fitClubHolo` decides by how much.
   */
  setClubHoloScale(scale) {
    const s = Math.max(0.2, Math.min(1, Number(scale) || 1));
    if (this.clubHoloGroup) this.clubHoloGroup.scale.setScalar(s);
    // The beam is a cone standing on the deck: it keeps its height and narrows
    // with the screen, or it would flare wider than the thing it projects.
    if (this.clubHoloBeam) this.clubHoloBeam.scale.set(s, 1, s);
  }

  setClubHoloVisible(visible, force = false) {
    if (!force && this.clubHoloClosed) {
      visible = false;
    }
    const v = Boolean(visible);
    if (this.clubHoloGroup) this.clubHoloGroup.visible = v;
    if (this.clubHoloBeam) this.clubHoloBeam.visible = v;
  }

  closeClubHolo() {
    this.clubHoloClosed = true;
    this.setClubHoloVisible(false, true);
  }

  openClubHolo() {
    this.clubHoloClosed = false;
    this.setClubHoloVisible(true, true);
  }

  toggleClubHolo() {
    if (this.isClubHoloVisible()) {
      this.closeClubHolo();
    } else {
      this.openClubHolo();
    }
    return this.isClubHoloVisible();
  }

  isClubHoloVisible() {
    return Boolean(this.clubHoloGroup && this.clubHoloGroup.visible);
  }

  setStarmapHoloVisible(visible, force = false) {
    if (!force && this.starmapHoloClosed) {
      visible = false;
    }
    const v = Boolean(visible);
    if (this.starmapHoloGroup) this.starmapHoloGroup.visible = v;
  }

  closeStarmapHolo() {
    this.starmapHoloClosed = true;
    this.setStarmapHoloVisible(false, true);
  }

  openStarmapHolo() {
    this.starmapHoloClosed = false;
    this.setStarmapHoloVisible(true, true);
  }

  toggleStarmapHolo() {
    if (this.isStarmapHoloVisible()) {
      this.closeStarmapHolo();
    } else {
      this.openStarmapHolo();
    }
    return this.isStarmapHoloVisible();
  }

  isStarmapHoloVisible() {
    return Boolean(this.starmapHoloGroup && this.starmapHoloGroup.visible);
  }

  update(delta, time) {
    for (const el of this.animatedElements) {
      if (el.isHover) {
        el.obj.position.y = (el.baseY !== undefined ? el.baseY : 1.95) + Math.sin(time * 1.5) * 0.04;
      } else if (el.obj) {
        el.obj.rotation.z += delta * el.speed;
      }
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
