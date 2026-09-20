/**
 * ship.js — The Avalon's interior: a set of compartments, not a hall.
 *
 * THE DECK PLAN IS DATA. `ship-rooms.js` says where every bulkhead stands, how
 * wide its opening is and how high the deckhead is; this file builds plate from
 * that description and registers one collider per SOLID wall segment, so a
 * doorway is walkable because there is genuinely nothing in it — never because
 * a hole was drawn in a mesh that still collides as a slab.
 *
 * The bow is the bridge: canopy, both flight pods, the tactical console bank
 * and the star-map holo-table, one room with three stations. Aft of it a spine
 * corridor bisects the ship; berth A, berth B and comms open off it to port,
 * storage, the stairwell vestibule and the airlock to starboard, and the
 * furnace room closes the far end across the beam.
 *
 * Scoured Plate throughout: warm dark plate, filament light, cut corners, and
 * the only lit things are lamps.
 */

import * as THREE from "three";
import {
  platedMetal, treadPlate, buildMaterial, enableAO, texSize,
  dressMaterialFromAlbedo, mergeStatic, boltLine,
  pipeFlange, placard, weldBead, sedimentaryRock
} from "./materials/pbr-kit.js";
import { createHoloMaterial } from "./materials/holo.js";
import {
  createHazardStripesTexture,
  createCrtScreenTexture,
  createControlPanelTexture,
  createQuestHoloTexture,
  createClubHoloTexture,
  createCommsStandingsTexture,
  createCommsHoloTexture,
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
  createRingMaterial
} from "./materials/celestial.js";
import {
  HULL, ROOMS, WALLS, CEIL, WALL_T, DOOR_H,
  wallSegments, doorways, roomAt
} from "./ship-rooms.js";
import { tierAtLeast } from "./tier.js";
import { session } from "../session.js";

/** Where the club board hangs, and where a player stands to read it. */
export const CLUB_BOARD_POS = [0, 1.55, 2.7];
export const BRIDGE_STAND = [0, 1.55, 1.3];

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
    this.buildCorridorServices();
    this.buildBridgeRoom();
    this.buildCockpitRoom();
    this.buildStarmapRoom();
    this.buildBerth('quarters', { locker: 'ortega', designator: 'BERTH A' });
    this.buildBerth('berth_b', { locker: 'cadet', designator: 'BERTH B' });
    this.buildCargoRoom();
    this.buildStairwellRoom();
    this.buildCommsRoom();
    this.buildAirlockRoom();
    this.buildFurnaceRoom();
    this.buildLightingFixtures();
    this.buildAtmosphericDust();
    this.buildServiceDressing();
    this.buildPlanetaryVista();
    this.enableAmbientOcclusion();

    this.scene.add(this.group);

    this.clubHoloClosed = false;
    this.starmapHoloClosed = false;
    const isAuthed = Boolean(session?.token && session?.player);
    this.setClubHoloVisible(isAuthed);
    this.setStarmapHoloVisible(true);
  }

  /**
   * Turn on ambient occlusion everywhere a material carries one.
   *
   * `aoMap` samples the SECOND uv set, which a primitive geometry does not
   * have, so a generated occlusion map does nothing at all until the mesh is
   * told to reuse its own UVs for it. Done once here rather than remembered at
   * a hundred call sites — cavity occlusion is what turns a panel gap into a
   * gap instead of a dark line painted on a sheet, and it is the cheapest
   * realism in the ship.
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

  initMaterials() {
    /*
     * 1. DURASTEEL BULKHEAD.
     *
     * `/art/durasteel_plate.jpg` is the authority for what this ship is made
     * of — panels, bolt rings, scratches, rust streaks, stencil text — so it
     * stays. What changes is that it now has maps that AGREE with it: normal,
     * roughness and occlusion are derived from the plate itself, so a bolt
     * head catches the light because that bolt head is there.
     *
     * A procedural plate is built first and stands in until the image arrives,
     * so the ship is never briefly untextured and a failed load is survivable.
     */
    this.durasteelMat = buildMaterial(
      platedMetal({
        paint: '#3b3c3e', metal: '#63605c', rust: '#6c4326',
        panels: 2, seed: 5, weather: 0.34, size: texSize(512)
      }),
      { repeat: 2, roughness: 1.0 }
    );
    this.durasteelMat.color.setHex(0xb9b6b2);
    this.durasteelMat.normalScale.set(0.95, 0.95);
    this.durasteelMat.aoMapIntensity = 0.8;
    dressMaterialFromAlbedo(this.durasteelMat, "/art/durasteel_plate.jpg", {
      repeat: 2, size: texSize(512), strength: 2.6, normalScale: 1.1,
      onReady: mat => { mat.color.setHex(0xffffff); }
    });

    /*
     * 1b. COMPARTMENT BULKHEAD.
     *
     * The interior walls went up after the hull did and have been painted
     * since: a lighter, flatter plate with a finer panel grid, so a doorway
     * reads as a partition standing inside the shell rather than as more hull.
     */
    this.bulkheadMat = buildMaterial(
      platedMetal({
        paint: '#4a463f', metal: '#6b675f', rust: '#71452a',
        panels: 3, seed: 61, weather: 0.5, size: texSize(512)
      }),
      { repeat: 3, roughness: 1.0 }
    );
    this.bulkheadMat.normalScale.set(1.1, 1.1);
    this.bulkheadMat.aoMapIntensity = 0.85;

    /*
     * 2. HEAVY FLOOR GRATING.
     *
     * A deck is walked on, so it is treadplate with the pattern ground flat
     * along the line people take. That worn stripe does more for a floor than
     * any amount of resolution.
     */
    this.floorMat = buildMaterial(
      treadPlate({ base: '#3f4247', seed: 21, weather: 0.7, size: texSize(512) }),
      { repeat: 7, roughness: 1.0 }
    );
    this.floorMat.normalScale.set(1.4, 1.4);
    this.floorMat.aoMapIntensity = 0.9;

    // 2b. The furnace room's floor plate: scorched, and never repainted.
    this.ashMat = buildMaterial(
      sedimentaryRock({ warm: '#5a4a3a', cool: '#3b332c', seed: 44, size: texSize(256) }),
      { repeat: [3, 1], roughness: 1.0, metalness: 0.0 }
    );

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

    // 4b. Riveted firebox iron: hotter, greasier, soot over rust.
    this.fireboxMat = new THREE.MeshStandardMaterial({
      color: 0x2a211c,
      roughness: 0.95,
      metalness: 0.45
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

    // 6c. The fire behind the grate. A firebox is a lamp, so it is allowed lit.
    this.emberMat = new THREE.MeshBasicMaterial({ color: 0xe0762a });

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
    // The tactical consoles and the flight pods ask for a "telemetry" channel
    // by name. It is the amber one; without this alias every screen that asked
    // for it was built with an undefined material and rendered flat white.
    this.crtTelemetryMat = this.crtAmberMat;

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

    // 11. Stenciled Footlockers (Crew Berths)
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

    // 12. Heavy Blast Door (Airlock Bay & the sealed lower-deck door)
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

    // 15. Shipping Container Stencils (Storage)
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

  /* ====================================================================
     THE HULL AND THE BULKHEADS
     ==================================================================== */

  /**
   * THE STRUCTURE IS ONE OBJECT.
   *
   * Deck, deckheads, side plating, blast wall, frames, every interior
   * bulkhead and every doorway frame are welded into a single structure, and
   * their joints are supposed to interpenetrate — a jamb post that merely
   * touched the plate it is welded to would be holding nothing. Building them
   * into one group says so, which lets the physics check go on being strict
   * about everything that is genuinely a separate object standing in the ship.
   *
   * The COLLIDERS, on the other hand, are drawn segment by segment: a wall
   * with a doorway in it contributes two boxes and a gap, so the gap is
   * walkable for the same reason it is see-through.
   */
  buildHullArchitecture() {
    const hull = new THREE.Group();
    hull.name = 'hull';
    this.group.add(hull);
    const add = (...objs) => hull.add(...objs);

    const W = HULL.maxX - HULL.minX;          // 11.2 m beam
    const L = HULL.maxZ - HULL.minZ;          // 15.6 m overall
    const midZ = (HULL.minZ + HULL.maxZ) / 2;
    const outerX = HULL.maxX + HULL.plate / 2;
    const inset = HULL.frame;                  // frames stand this proud

    // --- Deck slab, one plate under the whole ship ---
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(W + 1.0, 0.4, L + 1.0), this.floorMat
    );
    floor.position.set(0, -0.2, midZ);
    floor.receiveShadow = true;
    add(floor);

    // --- Deckheads. Three heights: rooms low, bridge tall, furnace taller. ---
    const bridgeR = ROOMS.bridge;
    const ceilMain = new THREE.Mesh(
      new THREE.BoxGeometry(W + 1.0, 0.3, 8.6), this.durasteelMat
    );
    ceilMain.position.set(0, CEIL.room + 0.15, -3.65);
    add(ceilMain);

    const ceilBridge = new THREE.Mesh(
      new THREE.BoxGeometry(W + 1.0, 0.4, (bridgeR.maxZ - bridgeR.minZ) + 0.4), this.durasteelMat
    );
    ceilBridge.position.set(0, CEIL.bridge + 0.2, (bridgeR.minZ + bridgeR.maxZ) / 2);
    add(ceilBridge);

    const fr = ROOMS.furnace;
    const ceilFurnace = new THREE.Mesh(
      new THREE.BoxGeometry(W + 1.0, 0.3, (fr.maxZ - fr.minZ) + 0.4), this.durasteelMat
    );
    ceilFurnace.position.set(0, CEIL.furnace + 0.15, (fr.minZ + fr.maxZ) / 2);
    add(ceilFurnace);

    // --- Outer plating ---
    for (const side of [-1, 1]) {
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(HULL.plate, 4.0, L + 1.0), this.durasteelMat
      );
      plate.position.set(outerX * side, 2.0, midZ);
      add(plate);
    }
    this.addCollider(-(HULL.maxX + HULL.plate), -(HULL.maxX - inset), HULL.minZ - HULL.plate, HULL.maxZ + HULL.plate);
    this.addCollider(HULL.maxX - inset, HULL.maxX + HULL.plate, HULL.minZ - HULL.plate, HULL.maxZ + HULL.plate);

    // Aft blast wall, closing the stern behind the furnace room.
    const aft = new THREE.Mesh(
      new THREE.BoxGeometry(W + 1.0, 3.6, HULL.plate), this.durasteelMat
    );
    aft.position.set(0, 1.8, HULL.minZ - HULL.plate / 2);
    add(aft);
    this.addCollider(-(HULL.maxX + HULL.plate), HULL.maxX + HULL.plate,
      HULL.minZ - HULL.plate, HULL.minZ + inset);

    // Forward face: solid plate outboard, the canopy aperture between.
    for (const side of [-1, 1]) {
      const fwd = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 3.9, HULL.plate), this.durasteelMat
      );
      fwd.position.set(4.9 * side, 1.95, HULL.maxZ + HULL.plate / 2);
      add(fwd);
    }
    this.addCollider(-(HULL.maxX + HULL.plate), HULL.maxX + HULL.plate,
      HULL.maxZ - inset, HULL.maxZ + HULL.plate);

    // Frames standing proud of the plating, where a room is wide enough to
    // show them: the bridge and the furnace room. The corridor has a bulkhead
    // on both sides, so a frame in there would be buried in the partition.
    const ribZones = [
      { z0: bridgeR.minZ + 0.6, z1: bridgeR.maxZ - 0.4, h: CEIL.bridge },
      { z0: fr.minZ + 0.6, z1: fr.maxZ - 0.4, h: CEIL.furnace }
    ];
    for (const zone of ribZones) {
      for (let z = zone.z0; z <= zone.z1; z += 1.5) {
        for (const side of [-1, 1]) {
          const rib = new THREE.Mesh(
            new THREE.BoxGeometry(inset, zone.h, 0.32), this.durasteelMat
          );
          rib.position.set((HULL.maxX - inset / 2) * side, zone.h / 2, z);
          add(rib);
          const gus = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.28), this.ironMat);
          gus.position.set((HULL.maxX - 0.3) * side, zone.h - 0.32, z);
          gus.rotation.z = side > 0 ? -Math.PI / 4 : Math.PI / 4;
          add(gus);
        }
      }
    }

    // --- Interior bulkheads, drawn segment by segment around the openings ---
    const postW = 0.16;
    for (const wall of WALLS) {
      const frameOpenings = (wall.openings || []).map(([a, b]) => [a - postW, b + postW]);
      const frameWall = { ...wall, openings: frameOpenings };
      for (const [a, b] of wallSegments(frameWall)) {
        const span = b - a;
        const geom = wall.axis === 'x'
          ? new THREE.BoxGeometry(WALL_T, wall.top, span)
          : new THREE.BoxGeometry(span, wall.top, WALL_T);
        const panel = new THREE.Mesh(geom, this.bulkheadMat);
        const cx = wall.axis === 'x' ? wall.at : (a + b) / 2;
        const cz = wall.axis === 'x' ? (a + b) / 2 : wall.at;
        panel.position.set(cx, wall.top / 2, cz);
        panel.castShadow = panel.receiveShadow = true;
        add(panel);

        // A welded foot at the deck, both sides, so the wall meets the plate.
        for (const s of [-1, 1]) {
          const kick = new THREE.Mesh(
            wall.axis === 'x'
              ? new THREE.BoxGeometry(0.06, 0.14, span)
              : new THREE.BoxGeometry(span, 0.14, 0.06),
            this.ironMat
          );
          kick.position.set(
            cx + (wall.axis === 'x' ? s * (WALL_T / 2 + 0.03) : 0),
            0.07,
            cz + (wall.axis === 'z' ? s * (WALL_T / 2 + 0.03) : 0)
          );
          add(kick);
        }

        if (wall.axis === 'x') {
          this.addCollider(wall.at - WALL_T / 2 - 0.06, wall.at + WALL_T / 2 + 0.06, a, b);
        } else {
          this.addCollider(a, b, wall.at - WALL_T / 2 - 0.06, wall.at + WALL_T / 2 + 0.06);
        }
      }

      /*
       * THE TRANSOM — the plate above the door, and the doorframe glitch.
       *
       * The solid segments stop at the opening's jambs, and the doorway frame's
       * lintel only reaches DOOR_H + 0.3. Everything from there up to the
       * deckhead was therefore AIR — a slot exactly as wide as the door, open
       * from the head of the frame to the ceiling, that you could see and light
       * straight through. Every threshold on the ship had it; a doorway you can
       * read the next room over the top of is the "glitching doorframe".
       *
       * It is closed here, as wall, so it is built once and collides with
       * nothing: the player never gets their head above 2.45 m.
       */
      for (const [a, b] of wall.openings || []) {
        const headroom = wall.top - (DOOR_H + 0.3);
        if (headroom <= 0.02) continue;
        const frameA = a - postW;
        const frameB = b + postW;
        const span = frameB - frameA;
        const geom = wall.axis === 'x'
          ? new THREE.BoxGeometry(WALL_T, headroom, span)
          : new THREE.BoxGeometry(span, headroom, WALL_T);
        const transom = new THREE.Mesh(geom, this.bulkheadMat);
        const tx = wall.axis === 'x' ? wall.at : (frameA + frameB) / 2;
        const tz = wall.axis === 'x' ? (frameA + frameB) / 2 : wall.at;
        transom.position.set(tx, DOOR_H + 0.3 + headroom / 2, tz);
        transom.castShadow = transom.receiveShadow = true;
        add(transom);
      }
    }

    this.buildDoorwayFrames(hull);
  }

  /**
   * DOORWAY FRAMES — one per real opening, and nowhere else.
   *
   * These used to be invented at runtime from the traversal graph: one frame
   * per graph edge, placed at the midpoint of two compartment anchors, nudged
   * along that line until it found deck nobody had already furnished. That was
   * the right answer when the ship was one room with markers in it — the
   * frames stood free, so they had to hunt for somewhere sensible to stand.
   *
   * With real bulkheads the openings are ARCHITECTURE. The frame belongs to
   * the wall, at the opening the wall declares, and its posts stand on the
   * ends of the plate rather than inside the clear span, so the opening a
   * player walks through is exactly `DOOR_CLEAR` wide.
   *
   * The sightline rule the old placer encoded is kept, and kept as an
   * assertion rather than a search: nothing structural may stand between the
   * bridge standing position and the club board. It cannot any more — the
   * bridge has no bulkhead in it at all, and the one opening on its aft face
   * is the corridor mouth, dead astern of the board. `assertClearSightline`
   * below is what proves it, and `verify:ship` calls it.
   */
  buildDoorwayFrames(hull) {
    this.doors = [];
    for (const d of doorways()) {
      const frame = new THREE.Group();
      frame.position.set(d.pos[0], 0, d.pos[1]);
      // Rotate so the frame's local X runs along the wall.
      if (d.axis === 'x') frame.rotation.y = Math.PI / 2;

      const half = d.clear / 2;
      const postW = 0.16;
      const depth = WALL_T + 0.08;

      for (const s of [-1, 1]) {
        // Height is exactly DOOR_H so posts meet the bottom of the lintel at DOOR_H
        // without vertical overlap or coplanar Z-fighting.
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(postW, DOOR_H, depth), this.durasteelMat
        );
        post.position.set(s * (half + postW / 2), DOOR_H / 2, 0);
        frame.add(post);

        frame.add(boltLine(
          [s * (half + postW / 2), 0.35, depth / 2 + 0.01],
          [s * (half + postW / 2), DOOR_H - 0.1, depth / 2 + 0.01],
          6, this.brassMat, { size: 0.022, normalAxis: 'z' }
        ));
      }

      const lintel = new THREE.Mesh(
        new THREE.BoxGeometry(d.clear + postW * 2, 0.3, depth), this.durasteelMat
      );
      lintel.position.set(0, DOOR_H + 0.15, 0);
      frame.add(lintel);

      /* ------------------------------------------------------------------
         EVERY THRESHOLD SAYS WHERE IT GOES, ON BOTH SIDES.
 
         A ship of identical grey doorways is a maze: the player walks the
         spine, opens three of them looking for the one with the star map in
         it, and learns the deck plan by trial and error. So each frame
         carries a stencilled header plate on EACH face, naming the
         compartment you walk into on THAT side — the room's name read from
         the spine, SPINE read from inside the room.
 
         The name is not written down here. `roomAt` is asked what is
         actually half a metre through the opening in each direction, so a
         bulkhead that moves takes its legend with it and a plate can never
         name a compartment that is no longer behind it.
         ------------------------------------------------------------------ */
      const probe = 0.5;
      // The frame's local +z is the doorway's `through` direction in world
      // space, for both wall axes: an x-axis wall is rotated a quarter turn
      // about y, which carries local +z onto world +x.
      const sideName = sign => {
        const id = roomAt(
          d.pos[0] + d.through[0] * probe * sign,
          d.pos[1] + d.through[1] * probe * sign
        );
        return id ? ROOMS[id].name : null;
      };

      for (const s of [1, -1]) {
        const header = new THREE.Mesh(
          new THREE.BoxGeometry(1.16, 0.2, 0.03), this.ironMat
        );
        header.position.set(0, DOOR_H + 0.12, s * (depth / 2 + 0.02));
        frame.add(header);

        const name = sideName(s);
        if (name) {
          const tag = placard(name, { w: 1.04, h: 0.15 });
          tag.position.set(0, DOOR_H + 0.12, s * (depth / 2 + 0.042));
          if (s < 0) tag.rotation.y = Math.PI;
          frame.add(tag);
        }

        const lamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.024, 0.024, 0.03, 8), this.amberLampMat
        );
        lamp.rotation.x = Math.PI / 2;
        lamp.position.set(s * 0.66, DOOR_H + 0.12, s * (depth / 2 + 0.045));
        frame.add(lamp);
      }

      // A dogging cleat on each jamb: this is a pressure door aperture
      for (const s of [-1, 1]) {
        const cleat = new THREE.Mesh(
          new THREE.BoxGeometry(0.07, 0.1, 0.06), this.brassMat
        );
        cleat.position.set(s * (half - 0.02), 1.05, depth / 2 + 0.02);
        frame.add(cleat);
      }

      // THE DOOR ITSELF — closed by default across the opening.
      // Opens by swinging cleanly inside the room against the bulkhead when E is pressed.
      const hinge = new THREE.Group();
      hinge.position.set(-half + 0.02, 0, 0);
      hinge.rotation.y = 0; // CLOSED by default
      const leafW = d.clear - 0.04;
      const leaf = new THREE.Mesh(
        new THREE.BoxGeometry(leafW, DOOR_H - 0.06, 0.05), this.durasteelMat
      );
      leaf.position.set(leafW / 2, (DOOR_H - 0.06) / 2 + 0.03, 0);
      hinge.add(leaf);

      // A window in the leaf, and a pull handle on the free edge.
      const port = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.02), this.ironMat
      );
      port.position.set(leafW / 2, 1.5, 0.035);
      const portGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.3),
        new THREE.MeshBasicMaterial({
          color: 0x0a0f16, transparent: true, opacity: 0.5, side: THREE.DoubleSide
        })
      );
      portGlass.position.set(leafW / 2, 1.5, 0.048);
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.24, 8), this.brassMat
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(leafW - 0.1, 1.05, 0.05);
      hinge.add(port, portGlass, handle);
      frame.add(hinge);

      hull.add(frame);

      // Calculate closed-door collider
      let doorCollider = null;
      if (d.axis === 'x') {
        doorCollider = {
          minX: d.pos[0] - WALL_T / 2 - 0.06,
          maxX: d.pos[0] + WALL_T / 2 + 0.06,
          minZ: d.pos[1] - d.clear / 2,
          maxZ: d.pos[1] + d.clear / 2
        };
      } else {
        doorCollider = {
          minX: d.pos[0] - d.clear / 2,
          maxX: d.pos[0] + d.clear / 2,
          minZ: d.pos[1] - WALL_T / 2 - 0.06,
          maxZ: d.pos[1] + WALL_T / 2 + 0.06
        };
      }

      // Swing towards room interior (inward into the room, away from the hallway)
      let openAngle = -1.60;
      if (d.axis === 'x') {
        openAngle = d.pos[0] < 0 ? 1.60 : -1.60;
      } else if (d.axis === 'z') {
        openAngle = d.pos[1] > 0 ? -1.60 : 1.60;
      }

      this.doors.push({
        id: `door-${d.wall}-${d.pos[0].toFixed(2)}_${d.pos[1].toFixed(2)}`,
        doorway: d,
        pos: d.pos,
        axis: d.axis,
        hinge,
        leaf,
        isOpen: false,
        openAngle,
        currentAngle: 0,
        targetAngle: 0,
        collider: doorCollider
      });
    }
  }

  /**
   * Is anything standing between the bridge standing position and the club
   * board? Exposed so `verify:ship` can ask the built ship rather than trust a
   * comment. Pure collider arithmetic: the board is read from head height and
   * everything that would block it has a footprint.
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
     THE SPINE
     ==================================================================== */

  /**
   * The corridor services are one installation: a pipe run each side, the tray
   * and loom clipped beside them, junction boxes on the plate and the guide
   * strips let into the deck. They are fitted together, not stood next to each
   * other, so they are one object.
   */
  buildCorridorServices() {
    const spine = new THREE.Group();
    spine.name = 'corridor-services';
    this.group.add(spine);

    const c = ROOMS.corridor;
    const z0 = c.minZ + 0.3;
    const z1 = c.maxZ - 0.3;
    const span = z1 - z0;
    const mz = (z0 + z1) / 2;

    for (const side of [-1, 1]) {
      const px = 0.88 * side;
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, span, 12), this.brassMat
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(px, 2.4, mz);
      pipe.castShadow = true;
      spine.add(pipe);

      for (let z = z0 + 0.9; z < z1; z += 1.7) {
        const fl = pipeFlange(0.1, this.ironMat, this.ironMat);
        fl.rotation.x = Math.PI / 2;
        fl.position.set(px, 2.4, z);
        spine.add(fl);
      }

      // Deck guide strips, let in against the kick plate.
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.03, span), this.halogenMat
      );
      strip.position.set(0.95 * side, 0.015, mz);
      spine.add(strip);
    }

    // Cable tray and the loom sitting in it, run to port of the lamps.
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, span), this.ironMat);
    tray.position.set(-0.55, 2.55, mz);
    spine.add(tray);
    for (const cx of [-0.63, -0.55, -0.47]) {
      const loom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, span, 6), this.ironMat
      );
      loom.rotation.x = Math.PI / 2;
      loom.position.set(cx, 2.6, mz);
      spine.add(loom);
    }

    // Junction boxes on the plate, in the stretches between doorways.
    const boxes = [
      [-0.93, -2.3], [-0.93, -5.1], [0.93, -2.5], [0.93, -5.35]
    ];
    for (const [bx, bz] of boxes) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.3, 0.24), this.ironMat);
      box.position.set(bx, 1.75, bz);
      spine.add(box);
      const drop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), this.ironMat
      );
      drop.position.set(bx, 2.12, bz);
      spine.add(drop);
    }

    // Frame designators, stencilled down the spine.
    let n = 3;
    for (let z = -0.6; z > c.minZ + 0.6; z -= 2.4) {
      const tag = placard(`FR ${String(n).padStart(2, '0')}`, { w: 0.34, h: 0.12 });
      tag.position.set(-1.02, 2.0, z);
      tag.rotation.y = Math.PI / 2;
      spine.add(tag);
      n += 1;
    }

    // The weld seam where the partition meets the deck, both sides.
    for (const side of [-1, 1]) {
      const seam = weldBead(span, this.ironMat, { radius: 0.024, seed: 0x90 + side });
      seam.rotation.x = Math.PI / 2;
      seam.position.set(1.0 * side, 0.03, mz);
      spine.add(seam);
    }

    mergeStatic(spine);
  }

  /* ====================================================================
     THE BRIDGE — canopy, tactical console bank, club board
     ==================================================================== */

  buildBridgeRoom() {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'bridge';

    // --- Forward observation canopy, in the bow face ---
    const canopyZ = HULL.maxZ - 0.15;
    const canopyBase = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.7, 0.3), this.durasteelMat);
    canopyBase.position.set(0, 0.35, canopyZ);
    const canopyTop = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.7, 0.3), this.durasteelMat);
    canopyTop.position.set(0, 3.15, canopyZ);
    bridgeGroup.add(canopyBase, canopyTop);

    for (const x of [-3.2, -1.1, 1.1, 3.2]) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.4, 0.28), this.durasteelMat);
      mullion.position.set(x, 1.95, canopyZ);
      mullion.rotation.z = x < 0 ? -0.1 : 0.1;
      bridgeGroup.add(mullion);
    }

    // The glazing itself. Transparent, so it is a window and not a wall.
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, 2.4),
      new THREE.MeshBasicMaterial({
        color: 0x1a2028, transparent: true, opacity: 0.16,
        side: THREE.DoubleSide, depthWrite: false
      })
    );
    glass.position.set(0, 1.95, canopyZ + 0.02);
    bridgeGroup.add(glass);

    // --- Tactical console bank, along the port bulkhead ---
    for (const [gz, side] of [[1.55, -1], [3.5, 1]]) {
      const console_ = this.buildTacticalConsole(side);
      console_.position.set(-4.85, 0, gz);
      console_.rotation.y = Math.PI / 2;
      bridgeGroup.add(console_);
      this.addCollider(-5.6, -3.55, gz - 0.95, gz + 0.95);
    }

    // --- The club board: a plate thrown from an emitter in the deck ---
    const holoScreenGroup = new THREE.Group();
    holoScreenGroup.position.set(CLUB_BOARD_POS[0], CLUB_BOARD_POS[1], CLUB_BOARD_POS[2]);

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
    const holoFront = new THREE.Mesh(screenGeom, this.clubHoloMat);
    holoFront.rotation.y = Math.PI;
    holoFront.position.set(0, 0, -0.005);
    const holoBack = new THREE.Mesh(screenGeom, this.clubHoloMat);
    holoBack.position.set(0, 0, 0.005);
    holoScreenGroup.add(holoFront, holoBack);
    this.clubHoloGroup = holoScreenGroup;

    const emitterBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.38, 0.04, 20), this.durasteelMat
    );
    emitterBase.position.set(CLUB_BOARD_POS[0], 0.02, CLUB_BOARD_POS[2]);
    const emitterLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.05, 20), this.brassMat
    );
    emitterLens.position.set(CLUB_BOARD_POS[0], 0.03, CLUB_BOARD_POS[2]);
    bridgeGroup.add(emitterBase, emitterLens);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.18, 1.5, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xd99423, transparent: true, opacity: 0.07,
        blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
      })
    );
    beam.position.set(CLUB_BOARD_POS[0], 0.75, CLUB_BOARD_POS[2]);
    this.clubHoloBeam = beam;
    bridgeGroup.add(beam, holoScreenGroup);

    // Guide strips down the bridge aisle, picking up where the spine's stop.
    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 1.6), this.halogenMat);
      strip.position.set(0.62 * side, 0.015, 1.5);
      bridgeGroup.add(strip);
    }

    this.group.add(bridgeGroup);
    this.interactiveTerminals.push(
      { id: 'bridge', name: ROOMS.bridge.name, pos: BRIDGE_STAND, route: '#/bridge' }
    );
  }

  /**
   * One tactical console, built in its own frame: desk at the origin, operator
   * standing at +Z, screens raked away from them. The bridge places two of
   * them against the port bulkhead by rotating this whole thing, which is why
   * not one coordinate in here knows where the room is.
   */
  buildTacticalConsole(side) {
    const g = new THREE.Group();

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 1.2), this.durasteelMat);
    deskTop.position.set(0, 0.85, 0);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.1), this.ironMat);
    legL.position.set(-0.75, 0.425, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.1), this.ironMat);
    legR.position.set(0.75, 0.425, 0);
    g.add(deskTop, legL, legR);

    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.025, 0.32), this.keyboardMat);
    keyboard.position.set(0, 0.905, 0.22);
    g.add(keyboard);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.48, 0.45), this.ironMat);
    chassis.position.set(0, 1.14, -0.35);
    chassis.rotation.x = 0.3;

    const crtLowerA = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.04), this.crtTelemetryMat);
    crtLowerA.position.set(-0.34, 1.18, -0.18);
    crtLowerA.rotation.x = 0.3;
    const crtLowerB = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.04), this.crtReactorMat);
    crtLowerB.position.set(0.34, 1.18, -0.18);
    crtLowerB.rotation.x = 0.3;

    const gantry = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.25), this.ironMat);
    gantry.position.set(0, 1.58, -0.42);
    const crtUpperA = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.04), this.crtRadarMat);
    crtUpperA.position.set(-0.32, 1.62, -0.32);
    crtUpperA.rotation.x = -0.15;
    const crtUpperB = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.32, 0.04), this.crtGreenMat);
    crtUpperB.position.set(0.32, 1.62, -0.32);
    crtUpperB.rotation.x = -0.15;

    const dialG = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16),
      side < 0 ? this.dialGaugePsiMat : this.dialGaugeBarMat
    );
    dialG.rotation.x = Math.PI / 2;
    dialG.position.set(-side * 0.78, 1.25, -0.2);

    const switchPlate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.24), this.controlPanelMat);
    switchPlate.position.set(side * 0.52, 0.91, 0.22);

    for (let l = -0.12; l <= 0.12; l += 0.08) {
      const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 6), this.brassMat);
      lever.position.set(side * 0.52 + l, 0.98, 0.22);
      lever.rotation.x = -0.25;
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), this.ironMat);
      knob.position.set(side * 0.52 + l, 1.04, 0.2);
      g.add(lever, knob);
    }

    const cable = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 6, 16), this.ironMat);
    cable.rotation.x = Math.PI / 2;
    cable.position.set(side * 0.55, 0.91, -0.05);

    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), this.brassMat);
    lampStem.position.set(-side * 0.65, 1.08, -0.1);
    lampStem.rotation.z = side * 0.25;
    const lampCowl = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 8), this.durasteelMat);
    lampCowl.position.set(-side * 0.6, 1.22, -0.08);
    lampCowl.rotation.z = side * -0.5;
    const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), this.luminaireWarmMat);
    lampBulb.position.set(-side * 0.58, 1.18, -0.06);

    // Industrial pilot seat, tucked so the console bank stays under two metres
    // of deck: a berth-sized bridge does not get a metre of chair behind it.
    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), this.ironMat);
    chairBase.position.set(0, 0.25, 0.7);
    const chairFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.05, 8), this.ironMat);
    chairFoot.position.set(0, 0.025, 0.7);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.5), this.fabricMat);
    seat.position.set(0, 0.52, 0.7);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.1), this.fabricMat);
    backrest.position.set(0, 0.8, 0.9);
    const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.08), this.fabricMat);
    headrest.position.set(0, 1.16, 0.91);
    for (const armSide of [-0.32, 0.32]) {
      const armPost = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), this.ironMat);
      armPost.position.set(armSide, 0.65, 0.7);
      const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.32), this.durasteelMat);
      armRest.position.set(armSide, 0.78, 0.7);
      g.add(armPost, armRest);
    }

    g.add(
      chassis, crtLowerA, crtLowerB, gantry, crtUpperA, crtUpperB,
      dialG, switchPlate, cable, lampStem, lampCowl, lampBulb,
      chairBase, chairFoot, seat, backrest, headrest
    );
    return g;
  }

  /* ====================================================================
     THE FLIGHT PODS — the `cockpit` station, in the bridge
     ==================================================================== */

  buildCockpitRoom() {
    const cockpitGroup = new THREE.Group();
    cockpitGroup.name = 'flight-pods';
    cockpitGroup.position.set(0, 0, 3.45);

    for (const side of [-1, 1]) {
      const podX = side * 1.35;

      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.78, 8), this.ironMat);
      column.position.set(podX, 0.55, 0.1);
      column.rotation.x = -0.22;

      const yokeBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.44, 8), this.ironMat);
      yokeBar.rotation.z = Math.PI / 2;
      yokeBar.position.set(podX, 0.94, 0.18);

      const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), this.durasteelMat);
      gripL.position.set(podX - 0.22, 1.0, 0.18);
      const gripR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.24, 8), this.durasteelMat);
      gripR.position.set(podX + 0.22, 1.0, 0.18);

      const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), this.brassMat);
      hubCap.rotation.x = Math.PI / 2;
      hubCap.position.set(podX, 0.94, 0.2);
      const hubLamp = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), this.amberLampMat);
      hubLamp.position.set(podX, 0.94, 0.22);

      cockpitGroup.add(column, yokeBar, gripL, gripR, hubCap, hubLamp);

      const podDash = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.58, 0.48), this.durasteelMat);
      podDash.position.set(podX, 0.96, 0.45);
      podDash.rotation.x = -0.35;

      const screenA = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.32, 0.04),
        side < 0 ? this.crtTelemetryMat : this.crtRadarMat
      );
      screenA.position.set(podX - 0.2, 1.02, 0.32);
      screenA.rotation.x = -0.35;

      const screenB = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.28, 0.04),
        side < 0 ? this.crtReactorMat : this.crtGreenMat
      );
      screenB.position.set(podX + 0.22, 1.04, 0.33);
      screenB.rotation.x = -0.35;

      const dashDial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), this.dialGaugePsiMat);
      dashDial.rotation.x = Math.PI / 2 - 0.35;
      dashDial.position.set(podX + 0.25, 0.84, 0.38);

      for (const pSide of [-0.15, 0.15]) {
        const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.025, 0.16), this.ironMat);
        pedal.position.set(podX + pSide, 0.06, 0.42);
        pedal.rotation.x = 0.45;
        cockpitGroup.add(pedal);
      }

      cockpitGroup.add(podDash, screenA, screenB, dashDial);

      const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.45, 8), this.ironMat);
      chairBase.position.set(podX, 0.25, -0.35);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.09, 0.56), this.fabricMat);
      seat.position.set(podX, 0.52, -0.35);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.58, 0.09), this.fabricMat);
      backrest.position.set(podX, 0.82, -0.6);
      for (const s of [-0.14, 0.14]) {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.52, 0.015), this.durasteelMat);
        strap.position.set(podX + s, 0.82, -0.54);
        cockpitGroup.add(strap);
      }
      cockpitGroup.add(chairBase, seat, backrest);

      // Pod footprint. The aisle between them is 1.5 m of clear deck, which is
      // the same width as every doorway on the ship.
      this.addCollider(podX - 0.6, podX + 0.6, 2.75, 4.30);
    }

    // Centre throttle quadrant and avionics pedestal, under the canopy.
    const centerPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.72), this.ironMat);
    centerPedestal.position.set(0, 0.45, 0.35);
    centerPedestal.rotation.x = -0.15;

    for (let t = -0.12; t <= 0.12; t += 0.08) {
      const tLever = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 6), this.brassMat);
      tLever.position.set(t, 0.82, 0.33);
      tLever.rotation.x = -0.3;
      const tKnob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), this.ironMat);
      tKnob.position.set(t, 0.88, 0.31);
      cockpitGroup.add(tLever, tKnob);
    }

    const attitudeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), this.brassMat);
    attitudeSphere.position.set(0, 0.78, 0.55);
    cockpitGroup.add(centerPedestal, attitudeSphere);

    // Overhead avionics rack, hung under the bridge deckhead.
    const overheadConsole = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.26, 1.1), this.ironMat);
    overheadConsole.position.set(0, 2.95, 0.1);
    overheadConsole.rotation.x = -0.12;
    const ohPanel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.9), this.controlPanelMat);
    ohPanel.position.set(0, 2.81, 0.1);
    ohPanel.rotation.x = -0.12;
    const ohLamp = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.15), this.luminaireWarmMat);
    ohLamp.position.set(0, 2.79, 0.1);
    ohLamp.rotation.x = -0.12;
    cockpitGroup.add(overheadConsole, ohPanel, ohLamp);

    this.addCollider(-0.3, 0.3, 3.40, 4.20);
    this.group.add(cockpitGroup);
    this.interactiveTerminals.push(
      { id: 'cockpit', name: 'FLIGHT PODS', pos: [0, 1.45, 3.05], route: '#/settings' }
    );
  }

  /* ====================================================================
     THE STAR MAP — starboard side of the bridge
     ==================================================================== */

  buildStarmapRoom() {
    const starmapGroup = new THREE.Group();
    starmapGroup.name = 'star-map';
    starmapGroup.position.set(3.5, 0, 2.1);

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.10, 0.85, 8), this.durasteelMat);
    tableBase.position.set(0, 0.425, 0);
    tableBase.receiveShadow = true;
    starmapGroup.add(tableBase);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 0.1, 8), this.ironMat);
    tableTop.position.set(0, 0.88, 0);
    starmapGroup.add(tableTop);

    const rail = new THREE.Mesh(new THREE.TorusGeometry(1.34, 0.035, 8, 32), this.brassMat);
    rail.rotation.x = Math.PI / 2;
    rail.position.set(0, 0.94, 0);

    for (let a = 0; a < 8; a++) {
      const angle = a * (Math.PI * 2 / 8);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), this.ironMat);
      post.position.set(Math.cos(angle) * 1.34, 0.8, Math.sin(angle) * 1.34);
      starmapGroup.add(post);

      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8),
        a % 2 === 0 ? this.amberLampMat : this.brassMat
      );
      button.position.set(Math.cos(angle + 0.2) * 1.12, 0.94, Math.sin(angle + 0.2) * 1.12);
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.025, 12), this.ironMat);
      dial.position.set(Math.cos(angle - 0.2) * 1.12, 0.94, Math.sin(angle - 0.2) * 1.12);
      starmapGroup.add(button, dial);
    }
    starmapGroup.add(rail);

    const emitterOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.04, 24), this.durasteelMat);
    emitterOuter.position.set(0, 0.94, 0);
    const emitterRing = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.07, 24), this.brassMat);
    emitterRing.position.set(0, 0.97, 0);
    const emitterCore = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.09, 16), this.halogenMat);
    emitterCore.position.set(0, 0.99, 0);
    starmapGroup.add(emitterOuter, emitterRing, emitterCore);

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

    const qTex = createQuestHoloTexture(0, 20, '');
    this.starmapHoloMat = new THREE.MeshBasicMaterial({
      map: qTex, transparent: true, opacity: 0.94, side: THREE.DoubleSide
    });
    const holoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), this.starmapHoloMat);
    holoPlane.position.set(0, 1.95, 0);
    this.animatedElements.push({ obj: holoPlane, speed: 0.05, isHover: true });

    const starmapHoloGroup = new THREE.Group();
    // The orrery turns about its own axis and is symmetric, so it does not care
    // which way it faces. The DATA PLATE hanging over it is a flat one-sided
    // plane and does: it was drawn facing the bow, so the player who spawns on
    // the bridge and looks left (the table is to starboard, which is their left
    // when facing forward) saw the BACK of it — mirrored text. A quarter turn
    // clockwise brings its face round to the crew side, where the chairs and the
    // spawn are, so it is legible without walking anywhere.
    starmapHoloGroup.rotation.y = -Math.PI / 2;
    starmapHoloGroup.add(holoProjector);
    starmapHoloGroup.add(holoPlane);
    this.starmapHoloGroup = starmapHoloGroup;
    this.starmapHoloProjector = holoProjector;
    this.starmapHoloPlane = holoPlane;
    starmapGroup.add(starmapHoloGroup);

    // Pedestal only: the rail is a handhold, so you walk right up to it.
    this.addCollider(3.5 - 0.85, 3.5 + 0.85, 2.1 - 0.85, 2.1 + 0.85);
    this.group.add(starmapGroup);
    this.interactiveTerminals.push(
      { id: 'starmap', name: 'STAR MAP', pos: [1.9, 1.55, 1.6], route: '#/starmap' }
    );
  }

  /* ====================================================================
     THE BERTHS — two of them, port side
     ==================================================================== */

  /**
   * A crew berth: bunks along the outer plating, a fold-down desk on the
   * forward bulkhead, gear on hooks. Built twice. Berth A carries the
   * `#/quarters` route; berth B carries nothing at all and is a real room
   * anyway — a ship with one bunk room and four crew would be lying.
   */
  buildBerth(roomId, { locker, designator }) {
    const room = ROOMS[roomId];
    const g = new THREE.Group();
    g.name = `berth-${roomId}`;

    // Which way the desk faces: berth A's forward bulkhead is its +Z face.
    const bunkZ = room.minZ + 0.85;
    const deskZ = room.maxZ - 0.45;

    // --- Two-tier bunk frame, long axis along the beam, against the plating ---
    const bunk = new THREE.Group();
    bunk.position.set(-4.65, 0, bunkZ);
    bunk.rotation.y = Math.PI / 2;

    for (const cx of [-0.58, 0.58]) {
      for (const cz of [-0.78, 0.78]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 0.08), this.durasteelMat);
        post.position.set(cx, 1.15, cz);
        bunk.add(post);
      }
    }
    for (let y = 0.4; y <= 2.0; y += 0.35) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), this.ironMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0.58, y, 0);
      bunk.add(rung);
    }

    const mattressLower = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.15, 1.5), this.fabricMat);
    mattressLower.position.set(0, 0.45, 0);
    const blanketLower = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.05), this.durasteelMat);
    blanketLower.position.set(0, 0.52, -0.18);
    const pillowLower = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.32), this.fabricMat);
    pillowLower.position.set(0, 0.55, 0.56);
    bunk.add(mattressLower, blanketLower, pillowLower);

    const mattressUpper = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.15, 1.5), this.fabricMat);
    mattressUpper.position.set(0, 1.5, 0);
    const blanketUpper = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 1.05), this.durasteelMat);
    blanketUpper.position.set(0, 1.57, -0.18);
    const pillowUpper = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.1, 0.32), this.fabricMat);
    pillowUpper.position.set(0, 1.6, 0.56);
    const safetyRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 1.05), this.durasteelMat);
    safetyRail.position.set(0.54, 1.67, -0.18);
    bunk.add(mattressUpper, blanketUpper, pillowUpper, safetyRail);

    const cubby = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.25, 0.14), this.durasteelMat);
    cubby.position.set(-0.38, 0.72, 0.7);
    const datapad = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.12), this.ironMat);
    datapad.position.set(-0.38, 0.62, 0.7);
    bunk.add(cubby, datapad);

    const lockerMat = locker === 'ortega' ? this.footlockerOrtegaMat : this.footlockerCadetMat;
    const lockerA = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.55), lockerMat);
    lockerA.position.set(0, 0.16, -0.4);
    const lockerB = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.32, 0.55),
      locker === 'ortega' ? this.footlockerCadetMat : this.footlockerOrtegaMat
    );
    lockerB.position.set(0, 0.16, 0.4);
    bunk.add(lockerA, lockerB);

    g.add(bunk);
    this.addCollider(-5.58, -3.72, bunkZ - 0.72, bunkZ + 0.8);

    // --- Fold-down work desk on the bulkhead the room shares forward ---
    const deskX = -2.2;
    const deskShelf = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.6), this.durasteelMat);
    deskShelf.position.set(deskX, 0.9, deskZ);
    g.add(deskShelf);
    for (const sx of [-0.32, 0.32]) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.42), this.ironMat);
      strut.position.set(deskX + sx, 0.65, deskZ);
      g.add(strut);
    }

    const miniCrt = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.26), this.crtAmberMat);
    miniCrt.position.set(deskX - 0.1, 1.08, deskZ + 0.1);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.025, 12), this.ironMat);
    lampBase.position.set(deskX + 0.3, 0.945, deskZ + 0.04);
    const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.26, 6), this.brassMat);
    lowerArm.position.set(deskX + 0.3, 1.08, deskZ + 0.04);
    lowerArm.rotation.z = -0.28;
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.24, 6), this.brassMat);
    upperArm.position.set(deskX + 0.24, 1.25, deskZ + 0.04);
    upperArm.rotation.z = 0.52;
    const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 8), this.durasteelMat);
    lampHead.position.set(deskX + 0.14, 1.32, deskZ + 0.04);
    lampHead.rotation.z = Math.PI * 0.85;
    const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), this.luminaireWarmMat);
    lampBulb.position.set(deskX + 0.1, 1.25, deskZ + 0.04);

    const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 12), this.durasteelMat);
    stoolSeat.position.set(deskX, 0.52, deskZ - 0.5);
    const stoolLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), this.ironMat);
    stoolLeg.position.set(deskX, 0.25, deskZ - 0.5);
    const stoolFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.04, 8), this.ironMat);
    stoolFoot.position.set(deskX, 0.02, deskZ - 0.5);

    g.add(miniCrt, lampBase, lowerArm, upperArm, lampHead, lampBulb,
      stoolSeat, stoolLeg, stoolFoot);
    this.addCollider(-2.85, -1.55, deskZ - 0.75, room.maxZ - 0.11);

    // --- Gear on hooks, on the plating, above head height ---
    const hookZ = (room.minZ + room.maxZ) / 2 + 0.6;
    const hookRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.9), this.ironMat);
    hookRail.position.set(-5.5, 1.65, hookZ);
    g.add(hookRail);
    const gear = [
      new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.22), this.fabricMat),
      new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.44, 0.2), this.durasteelMat),
      new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8), this.brassMat)
    ];
    gear.forEach((m, i) => {
      const hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 8, Math.PI), this.brassMat);
      hook.rotation.y = Math.PI / 2;
      hook.position.set(-5.47, 1.63, hookZ - 0.3 + i * 0.3);
      m.position.set(-5.44, 1.36, hookZ - 0.3 + i * 0.3);
      g.add(hook, m);
    });

    // The berth's own designator, stencilled beside its doorway.
    const tag = placard(designator, { w: 0.5, h: 0.16 });
    tag.position.set(-1.3, 2.05, (room.minZ + room.maxZ) / 2 + 1.05);
    tag.rotation.y = -Math.PI / 2;
    g.add(tag);

    this.group.add(g);
    if (room.route) {
      this.interactiveTerminals.push(
        { id: roomId, name: room.name, pos: [-3.2, 1.55, -1.2], route: room.route }
      );
    }
  }

  /* ====================================================================
     STORAGE — starboard, forward
     ==================================================================== */

  buildCargoRoom() {
    const cargoGroup = new THREE.Group();
    cargoGroup.name = 'storage';

    // --- Overhead gantry, run across the beam over the container stack ---
    const beamZ = -2.35;
    // The web is shorter than its flanges, so no two end faces share a plane.
    const craneWeb = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.45, 0.12), this.hazardMat);
    craneWeb.position.set(2.8, 2.40, beamZ);
    const craneTop = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 0.48), this.hazardMat);
    craneTop.position.set(2.8, 2.63, beamZ);
    const craneBottom = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 0.48), this.hazardMat);
    craneBottom.position.set(2.8, 2.17, beamZ);
    cargoGroup.add(craneWeb, craneTop, craneBottom);

    const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.6), this.ironMat);
    trolley.position.set(3.3, 2.03, beamZ);
    for (const wx of [-0.24, 0.24]) {
      for (const wz of [-0.2, 0.2]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), this.durasteelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(3.3 + wx, 2.15, beamZ + wz);
        cargoGroup.add(wheel);
      }
    }
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 6), this.ironMat);
    cable.position.set(3.3, 1.75, beamZ);
    const counterweight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), this.ironMat);
    counterweight.position.set(3.3, 1.56, beamZ);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.032, 6, 14, Math.PI * 1.5), this.brassMat);
    hook.position.set(3.3, 1.45, beamZ);
    cargoGroup.add(trolley, cable, counterweight, hook);

    // --- Cantilever storage rack against the starboard plating ---
    const rackX = 4.95;
    for (const rx of [-0.55, 0.55]) {
      for (const rz of [-1.05, 0, 1.05]) {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), this.hazardMat);
        upright.position.set(rackX + rx, 1.2, -1.0 + rz);
        cargoGroup.add(upright);
      }
    }
    for (let tier = 0; tier < 2; tier++) {
      const sy = 0.45 + tier * 0.9;
      // A SHELF IS WELDED BETWEEN ITS POSTS, NOT FLUSH WITH THEM. The shelf was
      // 1.2 wide against uprights 1.2 apart outside face to outside face, so the
      // two ends were exactly coplanar with the posts — a depth buffer cannot
      // order two surfaces in the same plane, and the whole rack flickered.
      // 1.1 lands each end 0.05 INSIDE the post it is carried by.
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 2.3), this.ironMat);
      shelf.position.set(rackX, sy, -1.0);
      cargoGroup.add(shelf);

      for (const dz of [-1.9, -1.25, -0.6, -0.05]) {
        const drumY = sy + 0.04 + 0.38;
        const drumX = rackX + (dz < -1.0 ? -0.25 : 0.25);
        const drum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.23, 0.23, 0.74, 16),
          tier % 2 === 0 ? this.durasteelMat : this.brassMat
        );
        drum.position.set(drumX, drumY, dz);
        const topChime = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.015, 6, 16), this.ironMat);
        topChime.rotation.x = Math.PI / 2;
        topChime.position.set(drumX, drumY + 0.36, dz);
        const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 8), this.brassMat);
        bung.position.set(drumX + 0.1, drumY + 0.38, dz + 0.05);
        cargoGroup.add(drum, topChime, bung);
      }
    }
    this.addCollider(4.3, 5.6, -2.3, 0.3);

    // --- Stencilled freight, stacked against the aft bulkhead ---
    const containerA = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.4), this.containerMat);
    containerA.position.set(3.3, 0.6, -2.05);
    const containerB = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), this.hazardMat);
    containerB.position.set(1.9, 0.6, -2.05);
    const containerC = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 1.0), this.durasteelMat);
    // Sits 6 mm DOWN into B's lid rather than exactly on it: a box resting with
    // its underside in the same plane as the lid below flickers across its whole
    // footprint.
    containerC.position.set(1.9, 1.469, -2.05);
    for (const cx of [-0.68, 0.68]) {
      for (const cz of [-0.68, 0.68]) {
        for (const cy of [0.05, 1.15]) {
          const cast = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), this.ironMat);
          cast.position.set(3.3 + cx, cy, -2.05 + cz);
          cargoGroup.add(cast);
        }
      }
    }
    cargoGroup.add(containerA, containerB, containerC);
    this.addCollider(1.30, 4.05, -2.75, -1.48);

    // --- Cargo manifest terminal, on the face of container A ---
    const mTex = createCargoManifestTexture(0, 8, '');
    this.cargoScreenMat = new THREE.MeshBasicMaterial({
      map: mTex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
    });
    const manifestScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), this.cargoScreenMat);
    manifestScreen.position.set(3.3, 1.02, -1.32);
    const manifestFrame = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.58, 0.03), this.ironMat);
    manifestFrame.position.set(3.3, 1.02, -1.345);
    cargoGroup.add(manifestScreen, manifestFrame);

    const tag = placard('STORAGE', { w: 0.56, h: 0.16 });
    tag.position.set(1.3, 2.05, -0.25);
    tag.rotation.y = Math.PI / 2;
    cargoGroup.add(tag);

    this.group.add(cargoGroup);
    this.interactiveTerminals.push(
      { id: 'cargo', name: ROOMS.cargo.name, pos: [3.3, 1.55, -1.0], route: '#/inventory' }
    );
  }

  /* ====================================================================
     THE STAIRWELL VESTIBULE — a door that never opens
     ==================================================================== */

  /**
   * THE SHIP IS LARGER THAN WHAT IS BUILT.
   *
   * A sealed door with a deck designator on it does more for the size of a
   * vessel than another room would: the player learns there is a deck below
   * without anybody having to build one. It has no interaction — walking up
   * to it states what it is and nothing more, because there is no key, there
   * was never going to be a key, and a prompt offering `[E]` would be the
   * interface promising something it cannot do.
   */
  buildStairwellRoom() {
    const g = new THREE.Group();
    g.name = 'stairwell';
    const room = ROOMS.stairwell;
    const midZ = (room.minZ + room.maxZ) / 2;

    // --- The sealed lower-deck door, in the starboard plating ---
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.5, 2.1), this.hazardMat);
    frame.position.set(5.36, 1.25, midZ);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.0, 1.5), this.blastDoorMat);
    slab.position.set(5.2, 1.1, midZ);
    g.add(frame, slab);

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.042, 8, 20), this.ironMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(5.06, 1.15, midZ);
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.66, 6), this.ironMat);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.x = s * (Math.PI / 4);
      spoke.position.set(5.06, 1.15, midZ);
      g.add(spoke);
    }
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), this.brassMat);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(5.02, 1.15, midZ);
    g.add(wheel, pin);

    // Sealed indicator. A red lamp is a state, not decoration.
    const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.34), this.redLampMat);
    indicator.position.set(5.04, 2.16, midZ);
    const indHousing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.44), this.ironMat);
    indHousing.position.set(5.09, 2.16, midZ);
    g.add(indicator, indHousing);

    const deckTag = placard('DECK 02', { w: 0.6, h: 0.18 });
    deckTag.position.set(5.03, 1.78, midZ);
    deckTag.rotation.y = -Math.PI / 2;
    g.add(deckTag);
    const sealTag = placard('SEALED', { w: 0.44, h: 0.15 });
    sealTag.position.set(5.03, 0.55, midZ);
    sealTag.rotation.y = -Math.PI / 2;
    g.add(sealTag);

    // Welded straps across the jamb: this was shut and then made sure of.
    for (const dz of [-0.55, 0.55]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.9), this.ironMat);
      strap.position.set(5.06, 1.9, midZ + dz);
      strap.rotation.x = 0.35;
      g.add(strap);
    }
    this.addCollider(4.95, 5.6, midZ - 1.15, midZ + 1.15);

    // --- What else is in a vestibule: a stowed ladder and a bottle rack ---
    const ladderRails = new THREE.Group();
    for (const dz of [-0.16, 0.16]) {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 8), this.durasteelMat);
      rail.position.set(1.42, 1.15, midZ + 1.0 + dz);
      ladderRails.add(rail);
    }
    for (let y = 0.35; y <= 2.0; y += 0.3) {
      const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 6), this.ironMat);
      rung.rotation.x = Math.PI / 2;
      rung.position.set(1.42, y, midZ + 1.0);
      ladderRails.add(rung);
    }
    g.add(ladderRails);
    this.addCollider(1.26, 1.62, midZ + 0.74, midZ + 1.26);

    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.62, 12), this.hazardMat);
    bottle.position.set(1.5, 0.75, midZ - 0.95);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.12, 8), this.brassMat);
    neck.position.set(1.5, 1.12, midZ - 0.95);
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.26), this.ironMat);
    bracket.position.set(1.34, 0.85, midZ - 0.95);
    g.add(bottle, neck, bracket);
    this.addCollider(1.26, 1.66, midZ - 1.2, midZ - 0.7);

    // A deck drain, because a vestibule at the foot of a stair collects water.
    const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 12), this.ironMat);
    drain.position.set(3.3, 0.012, midZ - 0.5);
    g.add(drain);

    this.group.add(g);
  }

  /* ====================================================================
     COMMS — port, aft
     ==================================================================== */

  buildCommsRoom() {
    const commsGroup = new THREE.Group();
    commsGroup.name = 'comms';
    const room = ROOMS.comms;

    // --- 19-inch equipment rack, floor to deckhead against the aft bulkhead ---
    const rackZ = room.minZ + 0.5;
    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 0.7), this.ironMat);
    rackFrame.position.set(-3.4, 1.2, rackZ);
    commsGroup.add(rackFrame);

    for (let u = 0; u < 3; u++) {
      const uPanel = new THREE.Mesh(new THREE.PlaneGeometry(2.48, 0.64), this.rackPanelMat);
      uPanel.position.set(-3.4, 0.55 + u * 0.7, rackZ + 0.355);
      commsGroup.add(uPanel);
    }

    const osc = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), this.crtGreenMat);
    osc.position.set(-4.1, 1.85, rackZ + 0.38);
    commsGroup.add(osc);

    const sTex = createCommsStandingsTexture([], '');
    this.commsScreenMat = new THREE.MeshBasicMaterial({ map: sTex });
    const standingsScreen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.05), this.commsScreenMat);
    standingsScreen.position.set(-2.7, 1.85, rackZ + 0.38);
    commsGroup.add(standingsScreen);

    // --- Vacuum tube gallery in its wire cage, over the rack ---
    const tubeShelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.26), this.durasteelMat);
    tubeShelf.position.set(-3.4, 2.28, rackZ + 0.4);
    commsGroup.add(tubeShelf);
    for (let tx = -0.7; tx <= 0.7; tx += 0.28) {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.2, 12), this.vacuumTubeMat);
      tube.position.set(-3.4 + tx, 2.41, rackZ + 0.4);
      const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 8), this.brassMat);
      pin.position.set(-3.4 + tx, 2.3, rackZ + 0.4);
      commsGroup.add(tube, pin);
    }
    const cageRoof = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.02, 0.24), this.ironMat);
    cageRoof.position.set(-3.4, 2.53, rackZ + 0.4);
    commsGroup.add(cageRoof);
    this.addCollider(-4.8, -2.0, room.minZ + 0.11, rackZ + 0.45);

    // --- Operator desk along the port plating ---
    const deskZ = -6.2;
    const desk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.6), this.durasteelMat);
    desk.position.set(-5.15, 0.85, deskZ);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 1.3), this.controlPanelMat);
    panel.position.set(-5.2, 0.92, deskZ);
    const commsKeyboard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.62), this.keyboardMat);
    commsKeyboard.position.set(-4.9, 0.92, deskZ - 0.2);
    commsGroup.add(desk, panel, commsKeyboard);

    for (const cord of [
      { y1: 1.22, y2: 1.12, z: -6.7, r: 0.17 },
      { y1: 1.34, y2: 1.25, z: -6.3, r: 0.2 },
      { y1: 1.18, y2: 1.35, z: -5.9, r: 0.18 }
    ]) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(cord.r, 0.016, 6, 14, Math.PI), this.ironMat);
      loop.position.set(-5.42, Math.min(cord.y1, cord.y2) - 0.06, cord.z);
      commsGroup.add(loop);
    }

    const headsetBand = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 6, 12, Math.PI), this.durasteelMat);
    headsetBand.rotation.y = Math.PI / 2;
    headsetBand.position.set(-5.4, 1.45, deskZ + 0.7);
    const earpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8), this.fabricMat);
    earpiece.rotation.z = Math.PI / 2;
    earpiece.position.set(-5.3, 1.35, deskZ + 0.7);
    commsGroup.add(headsetBand, earpiece);
    this.addCollider(-5.6, -4.65, deskZ - 0.95, deskZ + 0.95);

    const tag = placard('COMMS', { w: 0.5, h: 0.16 });
    tag.position.set(-1.3, 2.05, -5.55);
    tag.rotation.y = -Math.PI / 2;
    commsGroup.add(tag);

    // --- Comms Room Hologram: Fleet Guild Standings ---
    const commsHoloGroup = new THREE.Group();
    commsHoloGroup.position.set(-3.35, 1.45, -6.1);
    commsHoloGroup.rotation.y = Math.PI / 2; // Face towards the doorway entrance (+X)

    const holoTex = createCommsHoloTexture([], '');
    this.commsHoloMat = new THREE.MeshBasicMaterial({
      map: holoTex,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), this.commsHoloMat);
    commsHoloGroup.add(holoScreen);
    this.commsHoloGroup = commsHoloGroup;
    this.animatedElements.push({ obj: holoScreen, speed: 0.05, isHover: true, baseY: 0 });

    const emitterBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.3, 0.04, 16), this.durasteelMat
    );
    emitterBase.position.set(-3.35, 0.02, -6.1);
    const emitterLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.18, 0.05, 16), this.brassMat
    );
    emitterLens.position.set(-3.35, 0.03, -6.1);

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.15, 1.45, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x00f5d4, transparent: true, opacity: 0.07,
        blending: THREE.AdditiveBlending, side: THREE.FrontSide, depthWrite: false
      })
    );
    beam.position.set(-3.35, 0.725, -6.1);
    this.commsHoloBeam = beam;

    commsGroup.add(emitterBase, emitterLens, beam, commsHoloGroup);

    this.group.add(commsGroup);
    this.interactiveTerminals.push(
      { id: 'comms', name: ROOMS.comms.name, pos: [-3.3, 1.55, -6.3], route: '#/leaderboard' }
    );
  }

  /* ====================================================================
     THE AIRLOCK — starboard, aft. The way off the ship.
     ==================================================================== */

  buildAirlockRoom() {
    const g = new THREE.Group();
    g.name = 'airlock';
    /*
     * The hatch is in the STARBOARD plating, not the stern: the furnace room
     * closes the stern now, and a bay door opening into a firebox would be a
     * lie about the deck plan. Everything below is drawn in a frame where the
     * door faces +Z, then the whole assembly is turned to face inboard, so the
     * dogging wheel, the rams and the gauges keep the relationship to each
     * other they were designed with.
     */
    const midZ = (ROOMS.airlock.minZ + ROOMS.airlock.maxZ) / 2;
    g.position.set(3.45, 0, midZ);
    g.rotation.y = -Math.PI / 2;

    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.55, 0.5), this.hazardMat);
    doorFrame.position.set(0, 1.27, -1.95);
    g.add(doorFrame);

    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.0, 0.28), this.blastDoorMat);
    doorSlab.position.set(0, 1.12, -1.85);
    g.add(doorSlab);

    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.044, 8, 22), this.ironMat);
    wheel.position.set(0, 1.12, -1.68);
    for (let s = 0; s < 4; s++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 6), this.ironMat);
      spoke.rotation.z = s * (Math.PI / 4);
      spoke.position.set(0, 1.12, -1.68);
      g.add(spoke);
    }
    const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), this.brassMat);
    centerPin.rotation.x = Math.PI / 2;
    centerPin.position.set(0, 1.12, -1.64);
    g.add(wheel, centerPin);

    for (const py of [0.55, 1.95]) {
      const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.9, 12), this.brassMat);
      cylinder.rotation.z = Math.PI / 2;
      cylinder.position.set(0, py, -1.68);
      const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 12), this.hazardMat);
      sleeveL.rotation.z = Math.PI / 2;
      sleeveL.position.set(-0.72, py, -1.68);
      const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 12), this.hazardMat);
      sleeveR.rotation.z = Math.PI / 2;
      sleeveR.position.set(0.72, py, -1.68);
      g.add(cylinder, sleeveL, sleeveR);
    }

    const beaconHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.09, 12), this.ironMat);
    beaconHousing.position.set(0, 2.62, -1.7);
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.18, 12), this.amberLampMat);
    beacon.position.set(0, 2.5, -1.7);
    g.add(beaconHousing, beacon);

    for (const lx of [-0.88, 0.88]) {
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.11, 0.04), this.redLampMat);
      lock.position.set(lx, 2.3, -1.67);
      g.add(lock);
    }

    const gaugeA = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16), this.dialGaugePsiMat);
    gaugeA.rotation.x = Math.PI / 2;
    gaugeA.position.set(-1.0, 1.5, -1.66);
    const gaugeB = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16), this.dialGaugeBarMat);
    gaugeB.rotation.x = Math.PI / 2;
    gaugeB.position.set(-1.0, 1.18, -1.66);
    g.add(gaugeA, gaugeB);

    for (const vx of [-1.0, 1.0]) {
      const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 8), this.ironMat);
      vent.position.set(vx, 1.35, -1.42);
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 8), this.brassMat);
      nozzle.rotation.x = Math.PI / 2;
      nozzle.position.set(vx, 2.35, -1.34);
      g.add(vent, nozzle);
    }

    const rebreather = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.5, 0.2), this.redLampMat);
    rebreather.position.set(1.05, 1.2, -1.55);
    const rebreatherGauge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), this.brassMat);
    rebreatherGauge.rotation.x = Math.PI / 2;
    rebreatherGauge.position.set(1.05, 1.34, -1.44);
    g.add(rebreather, rebreatherGauge);

    const tag = placard('AIRLOCK', { w: 0.56, h: 0.16 });
    tag.position.set(0, 2.05, 1.18);
    tag.rotation.y = Math.PI;
    g.add(tag);

    // Everything above stands between x = 4.80 and the plating.
    this.addCollider(4.80, 5.6, midZ - 1.2, midZ + 1.2);

    this.group.add(g);
    this.interactiveTerminals.push(
      { id: 'airlock', name: ROOMS.airlock.name, pos: [3.4, 1.6, -6.6], route: '#/quest' }
    );
  }

  /* ====================================================================
     THE FURNACE ROOM — across the beam, at the stern
     ==================================================================== */

  /**
   * The one compartment on the ship that is still hot.
   *
   * Drawn from the same register as Tallow's sub-level: riveted iron, sodium
   * light, soot over rust, and a fire behind a grate that is genuinely the
   * brightest thing aboard. It binds to no route and answers no key — it is a
   * place, and the ship is more plausible for having one.
   */
  buildFurnaceRoom() {
    const g = new THREE.Group();
    g.name = 'furnace';
    const room = ROOMS.furnace;

    // --- Scorched deck plate in front of the firebox ---
    const apron = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.02, 2.9), this.ashMat);
    apron.position.set(0, 0.011, (room.minZ + room.maxZ) / 2);
    g.add(apron);

    /* ---------------- THE FIREBOX, port side ---------------- */
    const fx = -3.0, fz = -9.8;
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.2, 1.8), this.fireboxMat);
    body.position.set(fx, 1.1, fz);
    body.castShadow = true;
    g.add(body);

    // Riveted straps: the seams a pressure vessel is actually made of.
    for (const sx of [-1.0, 0, 1.0]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.2, 1.86), this.ironMat);
      strap.position.set(fx + sx, 1.1, fz);
      g.add(strap);
    }
    for (const sy of [0.4, 1.1, 1.8]) {
      g.add(boltLine([fx - 1.4, sy, fz + 0.92], [fx + 1.4, sy, fz + 0.92], 9,
        this.brassMat, { size: 0.03, normalAxis: 'z' }));
    }

    // The grate door, and the fire behind it.
    const doorPlate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.1, 0.12), this.ironMat);
    doorPlate.position.set(fx, 0.85, fz + 0.94);
    g.add(doorPlate);
    const ember = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.82), this.emberMat);
    ember.position.set(fx, 0.85, fz + 1.01);
    g.add(ember);
    for (let i = 0; i < 6; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.86, 0.05), this.ironMat);
      bar.position.set(fx - 0.45 + i * 0.18, 0.85, fz + 1.02);
      g.add(bar);
    }
    const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), this.brassMat);
    doorHandle.position.set(fx + 0.78, 0.85, fz + 1.02);
    const doorHinge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), this.ironMat);
    doorHinge.position.set(fx - 0.72, 0.85, fz + 1.0);
    g.add(doorHandle, doorHinge);

    // Ash pans on their runners under the grate.
    for (const px of [-0.7, 0.7]) {
      const pan = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.26, 0.44), this.ironMat);
      pan.position.set(fx + px, 0.15, fz + 1.12);
      const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), this.brassMat);
      pull.rotation.z = Math.PI / 2;
      pull.position.set(fx + px, 0.22, fz + 1.35);
      g.add(pan, pull);
    }

    // Flue, up through the deckhead.
    const flue = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.05, 14), this.ironMat);
    flue.position.set(fx, 2.68, fz - 0.2);
    g.add(flue);
    const flueCollar = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 6, 16), this.brassMat);
    flueCollar.rotation.x = Math.PI / 2;
    flueCollar.position.set(fx, 2.3, fz - 0.2);
    g.add(flueCollar);

    // Pressure gauges on the firebox head, and a relief valve beside them.
    for (const [gx, mat] of [[-0.75, this.dialGaugePsiMat], [0.75, this.dialGaugeBarMat]]) {
      const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 20), mat);
      gauge.rotation.x = Math.PI / 2;
      gauge.position.set(fx + gx, 1.78, fz + 0.93);
      g.add(gauge);
    }
    const relief = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.3, 10), this.brassMat);
    relief.position.set(fx, 2.35, fz + 0.5);
    g.add(relief);

    this.addCollider(fx - 1.65, fx + 1.65, fz - 1.0, fz + 1.45);

    /* ---------------- THE HOPPER, starboard side ---------------- */
    const hx = 3.3, hz = -9.7;
    const hopper = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 0.36, 1.5, 4), this.durasteelMat
    );
    hopper.rotation.y = Math.PI / 4;
    hopper.position.set(hx, 1.75, hz);
    g.add(hopper);
    const hopperRim = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 2.0), this.ironMat);
    hopperRim.position.set(hx, 2.52, hz);
    g.add(hopperRim);
    for (const [lx, lz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), this.ironMat);
      leg.position.set(hx + lx, 0.5, hz + lz);
      g.add(leg);
    }
    const chute = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), this.ironMat);
    chute.position.set(hx, 0.72, hz + 0.5);
    chute.rotation.x = 0.3;
    g.add(chute);
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.12), this.brassMat);
    gate.position.set(hx, 0.4, hz + 0.72);
    g.add(gate);
    this.addCollider(hx - 1.15, hx + 1.15, hz - 0.95, hz + 0.95);

    // Slag bin between the hopper and the firebox, and the shovel in it.
    const bin = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.8), this.ironMat);
    bin.position.set(1.2, 0.275, -8.7);
    const shovel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.2, 6), this.brassMat);
    shovel.position.set(1.2, 0.85, -8.7);
    shovel.rotation.z = 0.4;
    g.add(bin, shovel);
    this.addCollider(0.65, 1.75, -9.15, -8.25);

    /* ---------------- INSTRUMENTATION on the starboard plating ---------- */
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 1.5), this.ironMat);
    board.position.set(5.36, 1.5, -8.6);
    g.add(board);
    for (let i = 0; i < 3; i++) {
      const dial = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.17, 0.05, 20),
        i === 1 ? this.dialGaugeBarMat : this.dialGaugePsiMat
      );
      dial.rotation.z = Math.PI / 2;
      dial.position.set(5.27, 1.5, -9.05 + i * 0.45);
      g.add(dial);
    }
    const boardTag = placard('FURNACE', { w: 0.56, h: 0.16 });
    boardTag.position.set(5.25, 2.2, -8.6);
    boardTag.rotation.y = -Math.PI / 2;
    g.add(boardTag);
    this.addCollider(5.2, 5.6, -9.45, -7.95);

    // Hazard striping along the foot of the blast wall.
    const chevrons = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.22, 0.04), this.hazardMat);
    chevrons.position.set(0, 0.13, room.minZ + 0.13);
    g.add(chevrons);

    this.group.add(g);
  }

  /* ====================================================================
     LIGHT, DUST, DRESSING, VISTA
     ==================================================================== */

  createCeilingLuminaire(x, y, z, rotY = 0, length = 1.2) {
    const fixture = new THREE.Group();
    fixture.position.set(x, y, z);
    fixture.rotation.y = rotY;

    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, length), this.ironMat);
    housing.position.set(0, 0, 0);

    const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(0.24, length - 0.08), this.luminaireMat);
    diffuser.rotation.x = Math.PI / 2;
    diffuser.position.set(0, -0.061, 0);

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
    const room = CEIL.room - 0.08;
    const bridge = CEIL.bridge - 0.08;
    const furnace = CEIL.furnace - 0.08;

    // Bridge: aisle, console bank, star map.
    this.createCeilingLuminaire(0, bridge, 2.55, 0, 1.8);
    this.createCeilingLuminaire(-4.55, bridge, 2.5, Math.PI / 2, 1.6);
    this.createCeilingLuminaire(3.5, bridge, 2.1, 0, 1.6);

    // The spine, one fixture per stretch between doorways.
    this.createCeilingLuminaire(0, room, -0.9, 0, 1.4);
    this.createCeilingLuminaire(0, room, -3.6, 0, 1.4);
    this.createCeilingLuminaire(0, room, -6.3, 0, 1.4);

    // The berths.
    this.createCeilingLuminaire(-3.4, room, -0.9, 0, 1.4);
    this.createCeilingLuminaire(-3.4, room, -3.7, 0, 1.4);

    // Comms, storage, the vestibule, the airlock.
    this.createCeilingLuminaire(-3.4, room, -6.0, 0, 1.4);
    this.createCeilingLuminaire(2.9, room, -0.7, Math.PI / 2, 1.6);
    this.createCeilingLuminaire(3.3, room, -4.15, 0, 1.4);
    this.createCeilingLuminaire(3.2, room, -6.6, Math.PI / 2, 1.4);

    // The furnace room, which is tall enough to need two.
    this.createCeilingLuminaire(0, furnace, -9.4, 0, 1.8);
    this.createCeilingLuminaire(-3.0, furnace, -8.55, 0, 1.4);
  }

  buildAtmosphericDust() {
    const dustCount = tierAtLeast("T4") ? 2200 : 1000;
    const dGeo = new THREE.BufferGeometry();
    const dPos = new Float32Array(dustCount * 3);
    const spanX = HULL.maxX - HULL.minX;
    const spanZ = HULL.maxZ - HULL.minZ;
    const midZ = (HULL.maxZ + HULL.minZ) / 2;
    for (let i = 0; i < dustCount; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * spanX;
      dPos[i * 3 + 1] = 0.2 + Math.random() * (CEIL.room - 0.3);
      dPos[i * 3 + 2] = midZ + (Math.random() - 0.5) * spanZ;
    }
    dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
    const dMat = new THREE.PointsMaterial({
      color: 0xd99423, size: 0.035, transparent: true,
      opacity: 0.38, blending: THREE.NormalBlending
    });
    this.dustParticles = new THREE.Points(dGeo, dMat);
    this.group.add(this.dustParticles);
  }

  /**
   * THE SERVICES.
   *
   * A hull is believable because of what is bolted to it. This run lives in the
   * one place a narrow ship has room for it: the overhead band inside the
   * bridge and the furnace room, where the frames stand proud and nothing
   * below runs through them. Baked into one mesh per material, so the whole of
   * it costs a handful of draw calls.
   */
  buildServiceDressing() {
    const dressing = new THREE.Group();
    dressing.name = 'hull-services';

    for (const zone of [
      { z0: ROOMS.bridge.minZ + 0.7, z1: ROOMS.bridge.maxZ - 0.5, h: CEIL.bridge },
      { z0: ROOMS.furnace.minZ + 0.7, z1: ROOMS.furnace.maxZ - 0.5, h: CEIL.furnace }
    ]) {
      const span = zone.z1 - zone.z0;
      const midZ = (zone.z0 + zone.z1) / 2;
      const y = zone.h - 0.62;

      for (const side of [-1, 1]) {
        const px = (HULL.maxX - 0.42) * side;

        for (const [dx, rad, mat] of [[0, 0.1, this.brassMat], [-0.26 * side, 0.07, this.ironMat]]) {
          const pipe = new THREE.Mesh(
            new THREE.CylinderGeometry(rad, rad, span, 12), mat
          );
          pipe.rotation.x = Math.PI / 2;
          pipe.position.set(px + dx, y, midZ);
          pipe.castShadow = true;
          dressing.add(pipe);

          for (let z = zone.z0 + 0.7; z < zone.z1; z += 1.5) {
            const fl = pipeFlange(rad, this.ironMat, this.ironMat);
            fl.rotation.x = Math.PI / 2;
            fl.position.set(px + dx, y, z);
            dressing.add(fl);
          }
        }

        // Cable tray, slung under the pipes.
        const tray = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, span), this.ironMat);
        tray.position.set(px - 0.1 * side, y - 0.36, midZ);
        dressing.add(tray);
        for (let i = 0; i < 3; i++) {
          const loom = new THREE.Mesh(
            new THREE.CylinderGeometry(0.026, 0.026, span, 6), this.ironMat
          );
          loom.rotation.x = Math.PI / 2;
          loom.position.set(px - 0.1 * side - 0.08 + i * 0.08, y - 0.3, midZ);
          dressing.add(loom);
        }

        // The weld seam where the plating meets the deck.
        const seam = weldBead(span, this.ironMat, { radius: 0.028, seed: 0x90 + side });
        seam.rotation.x = Math.PI / 2;
        seam.position.set((HULL.maxX - 0.05) * side, 0.03, midZ);
        dressing.add(seam);

        // Bay designators, stencilled on the plating between frames.
        const tag = placard(zone.h === CEIL.bridge ? 'FR 01' : 'FR 09', { w: 0.34, h: 0.12 });
        tag.position.set((HULL.maxX - 0.02) * side, 1.95, midZ);
        tag.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        dressing.add(tag);
      }
    }

    mergeStatic(dressing);
    this.group.add(dressing);
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
   * shape of the glass it is being looked through. A narrow window cropped its
   * left and right edges off. The screen and the beam that throws it scale
   * together; `stage.fitClubHolo` decides by how much.
   */
  setClubHoloScale(scale) {
    const s = Math.max(0.2, Math.min(1, Number(scale) || 1));
    if (this.clubHoloGroup) this.clubHoloGroup.scale.setScalar(s);
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

  setCommsHoloVisible(visible, force = false) {
    if (!force && this.commsHoloClosed) {
      visible = false;
    }
    const v = Boolean(visible);
    if (this.commsHoloGroup) this.commsHoloGroup.visible = v;
    if (this.commsHoloBeam) this.commsHoloBeam.visible = v;
  }

  closeCommsHolo() {
    this.commsHoloClosed = true;
    this.setCommsHoloVisible(false, true);
  }

  openCommsHolo() {
    this.commsHoloClosed = false;
    this.setCommsHoloVisible(true, true);
  }

  toggleCommsHolo() {
    if (this.isCommsHoloVisible()) {
      this.closeCommsHolo();
    } else {
      this.openCommsHolo();
    }
    return this.isCommsHoloVisible();
  }

  isCommsHoloVisible() {
    return Boolean(this.commsHoloGroup && this.commsHoloGroup.visible);
  }

  /* ====================================================================
     DOOR INTERACTION AND COLLIDERS
     ==================================================================== */

  getActiveColliders() {
    const closed = this.doors
      ? this.doors.filter(d => !d.isOpen).map(d => d.collider).filter(Boolean)
      : [];
    return [...this.colliders, ...closed];
  }

  getDoorNear(x, z, maxDist = 1.6) {
    if (!this.doors || !this.doors.length) return null;
    let closest = null;
    let minD = maxDist;
    for (const door of this.doors) {
      const dist = Math.hypot(x - door.pos[0], z - door.pos[1]);
      if (dist < minD) {
        minD = dist;
        closest = door;
      }
    }
    return closest;
  }

  toggleDoor(door) {
    if (!door) return false;
    door.isOpen = !door.isOpen;
    door.targetAngle = door.isOpen ? door.openAngle : 0;
    return door.isOpen;
  }

  openDoor(door) {
    if (!door) return;
    door.isOpen = true;
    door.targetAngle = door.openAngle;
  }

  closeDoor(door) {
    if (!door) return;
    door.isOpen = false;
    door.targetAngle = 0;
  }

  updateDoors(delta) {
    if (!this.doors) return;
    const speed = 4.5;
    for (const d of this.doors) {
      if (Math.abs(d.currentAngle - d.targetAngle) > 0.005) {
        const step = Math.sign(d.targetAngle - d.currentAngle) * speed * delta;
        if (Math.abs(step) >= Math.abs(d.targetAngle - d.currentAngle)) {
          d.currentAngle = d.targetAngle;
        } else {
          d.currentAngle += step;
        }
        d.hinge.rotation.y = d.currentAngle;
      }
    }
  }

  update(delta, time) {
    this.updateDoors(delta);

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
        if (y < 0.2) y = CEIL.room - 0.3;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  }
}
