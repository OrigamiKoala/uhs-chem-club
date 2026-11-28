/**
 * mirrowen.js — Mirrowen, Learn world 06, as a place you walk (T4).
 *
 * A working harbour on a cold morning. The player lands on the town terrace and walks down the stair in
 * the quay wall to the main quay. Round the basin run the quays: the main quay, a mole north to a head
 * on the frozen sea, the north quay, the west shore. Two gates join them over water: the dry dock's gate
 * and the canal's lock gate. An ice-breaker and a tanker lie moored with their gangways out; a freighter
 * lies frozen into the canal behind the lock, where the Fifth froze the water at its ordinary
 * temperature. The benches are inside the harbour: aboard the three ships, in two boathouses on piles,
 * and in the pump well at the floor of the dry dock (`mirrowen/harbour-plan.js`).
 *
 * Public contract (identical across all walkable Learn worlds):
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool, cover,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   mirrowen/harbour-plan.js   the plan: levels, volumes, rooms, hulls, the one height field (no THREE)
 *   mirrowen/terrain.js        the ground, the water, the quay walls, the dock, the hulls, the rooms, the far country
 *   mirrowen/stations.js       the seven hosts in their rooms (host-plan.js is their footprints)
 *   mirrowen/plant.js          lamp posts, bollards, the pad, the Fifth's ice walls
 *   mirrowen/atmosphere.js     the sky, the sun, the environment
 *   mirrowen/effects.js        steam, sea smoke, diamond dust
 * laid out by `tools/gen-mirrowen-layout.mjs`.
 *
 * THE RULES IT KEEPS: nothing occupies the same space as anything else; only lamps are lit, from a pool of
 * three lights; what never moves is baked; every roofed room is under the shared cover mask; the water,
 * the ice and every drop are closed by the walls and railings the plan declares.
 */

import * as THREE from 'three';
import mirrowenData from './world-data/mirrowen.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic, addWorldBoxUV, addWorldVariation
} from './materials/pbr-kit.js';
import { frostShingle, quayPaving, crystalIce, canalRipple } from './materials/mirrowen-textures.js';
import { grainSurface } from './materials/lanternfall-textures.js';
import { packsAvailable, loadTexturePack, dressFromPack } from './materials/texture-pack.js';
import {
  createMwSkyDome, createMwLights, followMwShadow, createMwEnvironment, mwSkyUniforms, followCamera, MWSKY, MIRROWEN_SUN
} from './mirrowen/atmosphere.js';
import { makeHarbourPlan, WATER, TERRACE } from './mirrowen/harbour-plan.js';
import { buildMirrowenTerrainGeometry, buildWaterGeometry, buildHarbourShells, buildHarbourVista } from './mirrowen/terrain.js';
import { buildLampPost, buildBollard, buildLandingPad, buildIceWall, buildShed, buildGantryCrane } from './mirrowen/plant.js';
import { yawPoint } from './mirrowen/kit.js';
import { HOST_BUILDERS } from './mirrowen/stations.js';
import { createMirrowenEffects } from './mirrowen/effects.js';
import { LampPool } from './lamp-pool.js';
import { makeCover } from './lib/cover.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';
import { attachCrew } from './npc/attach.js';

/** The amber filament every work lamp in the world burns. */
const FILAMENT = 0xd99423;

/** Landmarks that are round, or turn themselves: their group is never turned. */
const SELF_TURNED = new Set(['lamp-post', 'bollard', 'ice-wall']);

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** sRGB (0..1) to linear light. */
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Set a material's colour so that its map, whose mean in linear light is `mean` (a number or [r, g, b]), averages to
 * the sRGB colour `hex`: the paint of a ship, the tone of a board.
 */
function tintTo(mat, hex, mean) {
  const c = new THREE.Color(hex);   // linear, as three keeps it
  const m = Array.isArray(mean) ? mean : [mean, mean, mean];
  mat.color.setRGB(c.r / m[0], c.g / m[1], c.b / m[2]);
}

/** A copy of a material that shares its maps but not its bookkeeping (Material.clone would copy the maps' list). */
function cloneBare(m) {
  const ud = m.userData;
  m.userData = {};
  const c = m.clone();
  m.userData = ud;
  return c;
}

export class MirrowenWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = mirrowenData;
    this.scene = new THREE.Scene();
    this.scene.name = 'mirrowen';

    this.colliders = [];
    this.siteMarkers = new Map();
    this.benchAnchors = new Map();
    this.disposables = [];
    this.lamps = [];
    this.vents = [];
    this.movers = [];
    this.landmarkNodes = [];
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The harbour, the hills and the sea ice run to the horizon on their own.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.plan = makeHarbourPlan();
    this.field = this.plan;

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initLandmarks();
    this.initHosts();
    this.initSurfaces();
    this.initEffects();
    this.initLampPool();
    this.initCover();
    this.bakeStatics();
    this.buildColliders();
    this.collectMovers();
    this.enableAmbientOcclusion();
    // The people who work here, walking their rounds (`npc/attach.js`, `src/npc/crews/mirrowen.js`).
    this.crew = attachCrew(this, 'mirrowen');
    this.initPacks();
  }

  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  get ctx() {
    return { M: this.M, own: (...o) => this.own(...o), lamps: this.lamps, t4: this.t4, field: this.plan, plan: this.plan };
  }

  enableAmbientOcclusion() {
    const done = new Set();
    this.scene.traverse(o => {
      if (!o.geometry || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some(m => m && m.aoMap)) return;
      if (done.has(o.geometry)) return;
      done.add(o.geometry);
      if (o.geometry.attributes.uv1) return;
      enableAO(o.geometry);
    });
  }

  /* ======================================================================
     MATERIALS
     ====================================================================== */

  initMaterials() {
    const M = {};
    const std = o => new THREE.MeshStandardMaterial(o);
    const metal = (paint, base, rust, seed, weather, panels = 2, size = 128) => {
      const m = buildMaterial(
        platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(Math.min(size, 256)) }), { repeat: 2, roughness: 1.0 }
      );
      m.userData.paint = paint;   // the colour the neutral photo plate is tinted to when it lands (`initPacks`)
      return m;
    };
    // Neutral grains for the materials that had no maps (boards, brick), so a photo set has slots to land in and the
    // lower tiers have grain; the colour is in the material, divided by the grain's own mean.
    const grain = (kind, seed, hex, mean = 0.62) => {
      const m = buildMaterial(grainSurface({ kind, seed, mean, contrast: 0.18, size: texSize(256) }), { repeat: 1, roughness: 1.0, metalness: 0 });
      tintTo(m, hex, srgbToLinear(mean));
      return m;
    };

    // Stone and concrete: the quays are dressed granite, the dock and the pump well cast concrete.
    M.granite = buildMaterial(quayPaving({ size: texSize(256), seed: 5 }), { repeat: 1, roughness: 1.0 });
    M.granite.color.set(0xb4b6b4);
    M.concrete = buildMaterial(quayPaving({ size: texSize(256), seed: 9 }), { repeat: 2, roughness: 1.0 });
    M.concrete.color.set(0x9a9c98);

    // Steel: painted plate weathered by the sea, a different paint for each ship.
    M.clad = metal('#c3c9c9', '#a7adae', '#8b7a62', 81, 0.3, 2, 512);
    M.steel = metal('#8d979a', '#737d80', '#7d5f45', 83, 0.45, 2, 512);
    M.darkSteel = metal('#363d41', '#52595c', '#6b5442', 85, 0.5, 4);
    M.rusted = metal('#6c4a3c', '#5b4b44', '#7a4a2a', 87, 0.85, 3);
    M.shipRed = metal('#7a3027', '#5a4640', '#7a4a2a', 89, 0.55, 5, 512);
    M.shipBlack = metal('#25292b', '#3a3e40', '#6b4a32', 90, 0.5, 5, 512);
    M.shipRust = metal('#5c4136', '#52463f', '#7d4a28', 92, 0.95, 5, 512);
    M.shipWhite = metal('#d6d9d5', '#b4b8b6', '#8a7258', 94, 0.45, 3, 512);
    M.hullPlate = metal('#4d5457', '#5a6164', '#6e5440', 96, 0.6, 4);
    M.deckPlate = metal('#5f625c', '#6b6e68', '#6e5440', 98, 0.7, 6, 512);
    M.tankSteel = metal('#7d8a84', '#6c7570', '#7a5a40', 100, 0.55, 3, 512);
    M.holdSteel = metal('#6a5a48', '#5b5048', '#7a4a2a', 102, 0.9, 4, 512);
    M.hatch = metal('#3c4a52', '#4c565c', '#6e5440', 104, 0.6, 3);
    M.bootTop = metal('#2b2f2f', '#3a3e3e', '#5a4a3a', 106, 0.5, 2);
    M.grating = metal('#4a4f50', '#5d6264', '#6e5440', 97, 0.55, 6);
    M.hallWall = metal('#a9b2b1', '#8e9694', '#7d6248', 91, 0.5, 3, 512);
    M.hallRoof = metal('#566066', '#4f5a60', '#7a5638', 93, 0.62, 4);
    M.roofSheet = metal('#6a7678', '#5f6b6d', '#7d5236', 95, 0.7, 5);
    M.perf = metal('#4a4f50', '#5d6264', '#6e5440', 97, 0.55, 6);
    M.tankWhite = metal('#d4d9d7', '#aab0ae', '#8a7258', 99, 0.4, 3, 512);
    M.tankGreen = metal('#4c6a64', '#455e59', '#7a5a40', 101, 0.5, 3, 512);
    M.crate = metal('#6a7a62', '#5f6a58', '#7a5a40', 103, 0.5, 2);
    M.crateB = metal('#8a7048', '#75623f', '#6a4a30', 105, 0.55, 2);
    for (const k of ['clad', 'steel', 'darkSteel', 'rusted', 'shipRed', 'shipBlack', 'shipRust', 'shipWhite', 'hullPlate', 'deckPlate', 'tankSteel', 'holdSteel', 'hatch', 'bootTop', 'grating', 'hallWall', 'hallRoof', 'roofSheet', 'perf', 'tankWhite', 'tankGreen', 'crate', 'crateB']) {
      M[k].normalScale.set(1.2, 1.2);
      M[k].aoMapIntensity = 0.85;
    }

    M.brass = std({ color: 0xb08d4c, roughness: 0.42, metalness: 0.9 });
    M.copper = std({ color: 0xb5714a, roughness: 0.4, metalness: 0.9 });
    M.rubber = std({ color: 0x1c1d1e, roughness: 0.9, metalness: 0 });
    M.insul = std({ color: 0xdcdcd4, roughness: 0.82, metalness: 0.05 });
    M.timber = grain('boards', 11, 0x6a5a48);
    M.timberDark = grain('boards', 12, 0x3e342c);
    M.boards = grain('boards', 13, 0x5d5448);
    M.brick = grain('rock', 14, 0x80483b);
    M.drum = std({ color: 0x3d5a6e, roughness: 0.6, metalness: 0.5 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintYellow = std({ color: 0xc9a14a, roughness: 0.7, metalness: 0.1 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe8e8e0, roughness: 0.6, metalness: 0 });
    M.sack = std({ color: 0xc8bea4, roughness: 0.98, metalness: 0 });
    M.salt = std({ color: 0xe6e6e0, roughness: 0.9, metalness: 0 });

    // Glass. Transparent materials are decals to the overlap check and are left out of a bake.
    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1416, roughness: 0.18, metalness: 0.2 });

    // The cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe9ebe6, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2f353a, roughness: 0.55, metalness: 0.4 });

    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    // The Fifth's ice: crystal columns, white where milky and blue where clear. Opaque, so it is a body.
    M.ice = buildMaterial(crystalIce({ size: texSize(256), seed: 21 }), { repeat: 1, roughness: 1.0 });
    M.ice.normalScale.set(1.3, 1.3);
    M.ice.envMapIntensity = 1.5;
    M.ice.flatShading = true;
    M.iceDeep = M.ice.clone();
    M.iceDeep.color.set(0x9ec4da);
    M.iceDeep.flatShading = true;

    // The ground, painted per vertex, in three surfaces (`terrain.js` groundSurface): wind-packed snow on the hills
    // and the sea ice, granite setts on the quays and the terrace, the dry dock's concrete floor. The ground's uvs run
    // at 0.12 per metre (8.33 m a unit); `initPacks` scales the photos from these tiles.
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    M.ground = buildMaterial(frostShingle({ size: texSize(256), seed: 7 }), { repeat: 2, roughness: 1.0 });
    M.ground.vertexColors = true;
    M.ground.normalScale.set(0.9, 0.9);
    M.ground.envMapIntensity = 0.75;
    M.ground.color.setScalar(1.1);
    M.setts = buildMaterial(quayPaving({ size: texSize(256), seed: 13 }), { repeat: 4, roughness: 1.0 });
    M.setts.vertexColors = true;
    M.setts.envMapIntensity = 0.7;
    M.setts.color.setScalar(1.6);
    M.dockFloor = buildMaterial(quayPaving({ size: texSize(256), seed: 15 }), { repeat: 4, roughness: 1.0 });
    M.dockFloor.vertexColors = true;
    M.dockFloor.color.setScalar(2.4);
    for (const m of [M.ground, M.setts, M.dockFloor]) for (const t of m.userData.surfaceMaps || []) t.anisotropy = aniso;

    // The water: a moving mirror, coloured per vertex.
    const ripple = buildMaterial(canalRipple({ size: texSize(256), seed: 17 }), { repeat: 3, roughness: 0.06 });
    ripple.map?.dispose();
    ripple.map = null;
    ripple.userData.surfaceMaps = [ripple.normalMap].filter(Boolean);
    ripple.vertexColors = true;
    ripple.metalness = 0;
    ripple.envMapIntensity = 1.5;
    ripple.normalScale.set(0.35, 0.35);
    M.water = ripple;

    // The bench's plate keeps the procedural plated steel it has always had: the photographed plate goes on the rest
    // of the steel (`initPacks`), never on the surface a student works on.
    M.benchTop = cloneBare(M.steel);

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /* ======================================================================
     SURFACES IN METRES
     ====================================================================== */

  /**
   * Every shell, hull, room and prop is built of boxes whose uvs run 0..1 across each face, so a plate, a block or a
   * board changed size with every box (a ship's side was eight plates long, a 30 cm kerb one). Laid from the world
   * instead (`addWorldBoxUV`), every tile is a fixed size in metres everywhere; the large surfaces also drift in tone
   * and roughness and break their repeat (`addWorldVariation`), and the walls carry run streaks. A material on a
   * moving part keeps its own uvs (a projection in the world's frame would swim on it): the mover gets a copy first.
   */
  initSurfaces() {
    const M = this.M;
    // Movers: their meshes take an unpatched copy of their material.
    const copies = new Map();
    this.scene.traverse(o => {
      if (!o.userData.mover) return;
      o.traverse(c => {
        if (!c.isMesh || Array.isArray(c.material)) return;
        if (!copies.has(c.material)) copies.set(c.material, this.own(cloneBare(c.material)));
        c.material = copies.get(c.material);
      });
    });
    // [keys, metres per uv unit (one tile = metres / the material's repeat of 2 or 1), world variation or null]
    // Anti-tile blends in a rotated second sample, so it is only for maps with no direction (rust, concrete); a
    // board, a course of stone, a brick bond, a corrugation or a plate seam would show crossed.
    const big = { scale: 7, strength: 0.12, roughShift: 0.1, antiTile: 0 };
    const SURF = [
      [['granite'], 1.9, { ...big, streaks: 0.18 }],
      [['concrete'], 2, { ...big, antiTile: 0.4, streaks: 0.22 }],
      [['clad', 'shipRed', 'shipBlack', 'shipWhite', 'hullPlate', 'tankSteel', 'tankWhite', 'tankGreen', 'hallWall'], 5, { ...big, strength: 0.1, streaks: 0.14 }],
      [['shipRust', 'holdSteel', 'rusted', 'bootTop'], 4, { ...big, antiTile: 0.5 }],
      [['deckPlate', 'grating', 'hatch', 'hallRoof', 'roofSheet'], 4, { ...big, strength: 0.08 }],
      [['steel', 'darkSteel', 'perf', 'crate', 'crateB'], 2, null],
      [['timber', 'timberDark', 'boards'], 1.8, { ...big, strength: 0.1 }],
      [['brick'], 1.0, { ...big, strength: 0.1, streaks: 0.12 }]
    ];
    for (const [keys, metres, wv] of SURF) {
      for (const k of keys) {
        if (!M[k]) continue;
        addWorldBoxUV(M[k], { metres });
        if (wv) addWorldVariation(M[k], wv);
      }
    }
    // The ground: slow drift over the vertex paint, anti-tile on the snow and the setts.
    addWorldVariation(M.ground, { scale: 16, strength: 0.05, roughShift: 0.08, antiTile: 0.6 });
    addWorldVariation(M.setts, { scale: 9, strength: 0.1, roughShift: 0.12, antiTile: 0 });
    addWorldVariation(M.dockFloor, { scale: 6, strength: 0.1, roughShift: 0.12, antiTile: 0.5 });
  }

  /**
   * THE PHOTOGRAPHED SURFACES (`materials/texture-pack.js`, `public/textures/mirrowen/`, CC0, see LICENSE.md there).
   * The world is complete with its procedural maps; at 3D On with a renderer the photo packs are fetched and put into
   * the same map slots as they land, each sent to the GPU at once, during the flight. Nothing is fetched in Node or
   * below T4, and a pack that fails leaves the procedural surface it would have replaced.
   *
   * `scale` = metres one procedural tile covered / metres one photo tile covers (LICENSE.md lists the photo sizes).
   * The world-uv materials tile at `metres / repeat`, so for them `scale` = that / the photo's size. Painted steel and
   * sheet are graded neutral; the paint moves into the material colour when the photo lands (`tintTo`).
   */
  initPacks() {
    if (!this.t4 || !packsAvailable(this.renderer)) return;
    const M = this.M;
    const base = '/textures/mirrowen';
    const live = () => !this._disposed;
    const each = (keys, o) => keys.filter(k => M[k]).map(k => [M[k], o]);
    // The linear means the photos were graded to (`tools/textures/prep_mirrowen.py` prints them).
    const MEAN = {
      setts: [0.25, 0.248, 0.234], snow: [0.661, 0.68, 0.699], granite: [0.321, 0.292, 0.259], concrete: [0.326, 0.324, 0.309],
      plate: [0.51, 0.51, 0.51], deck: [0.286, 0.268, 0.251], rust: [0.356, 0.274, 0.226], boards: [0.382, 0.279, 0.204],
      roof: [0.398, 0.398, 0.398], brick: [0.223, 0.153, 0.131]
    };
    const PAINTED = ['clad', 'steel', 'darkSteel', 'shipRed', 'shipBlack', 'shipWhite', 'hullPlate', 'tankSteel', 'tankWhite', 'tankGreen', 'hatch', 'crate', 'crateB'];
    const SMALL = ['steel', 'darkSteel', 'crate', 'crateB'];
    // Paint in daylight reads a little darker than the procedural plate's lit panels did.
    const paint = (keys, pack) => () => { for (const k of keys) if (M[k]) { tintTo(M[k], M[k].userData.paint, MEAN[pack]); M[k].color.multiplyScalar(0.85); } };
    const to = (pairs, pack) => () => { for (const [k, hex] of pairs) if (M[k]) tintTo(M[k], hex, MEAN[pack]); };
    const plan = [
      // The ground: the photo's colour times the vertex paint (the paint is about 0.5 on the setts, 0.88 on snow).
      { name: 'snow', mats: [[M.ground, { scale: (8.33 / 2) / 3.5, normalScale: 0.8 }]], after: () => M.ground.color.setScalar(1.05) },
      { name: 'setts', mats: [[M.setts, { scale: (8.33 / 4) / 2.0, normalScale: 1.0 }]], after: () => M.setts.color.setScalar(1.7) },
      { name: 'concrete', mats: [[M.dockFloor, { scale: (8.33 / 4) / 2.0, normalScale: 0.9 }], ...each(['concrete'], { scale: 1 / 2, normalScale: 1.0 })],
        after: () => { M.dockFloor.color.setScalar(2.2); to([['concrete', 0xa4a6a2]], 'concrete')(); } },
      { name: 'granite', mats: each(['granite'], { scale: 1.9 / 1.9, normalScale: 1.1 }), after: to([['granite', 0x9c9c98]], 'granite') },
      // The hulls and walls tile at 2.5 m (the photo's size); steel, dark steel and crates at 1 m.
      { name: 'plate', mats: [...each(PAINTED.filter(k => !SMALL.includes(k)), { scale: 1, normalScale: 0.9, aoIntensity: 0.6 }),
        ...each(SMALL, { scale: 1 / 2.5, normalScale: 0.7, aoIntensity: 0.6 })], after: paint(PAINTED, 'plate') },
      { name: 'deck', mats: each(['deckPlate', 'grating', 'perf'], { scale: 2 / 2, normalScale: 0.8, aoIntensity: 0.6 }), after: to([['deckPlate', 0x6c6f69], ['grating', 0x575c5d], ['perf', 0x575c5d]], 'deck') },
      { name: 'rust', mats: each(['shipRust', 'holdSteel', 'rusted', 'bootTop'], { scale: 2 / 2, normalScale: 0.9, aoIntensity: 0.6 }),
        after: to([['shipRust', 0x5c4136], ['holdSteel', 0x5e5144], ['rusted', 0x5f4538], ['bootTop', 0x2e3030]], 'rust') },
      { name: 'boards', mats: each(['timber', 'timberDark', 'boards'], { scale: 1.8 / 2.4, normalScale: 0.9 }),
        after: to([['timber', 0x8a8072], ['timberDark', 0x4e463e], ['boards', 0x8c8478]], 'boards') },
      { name: 'roof', mats: each(['roofSheet', 'hallRoof', 'hallWall'], { scale: 2 / 2.7, normalScale: 1.0, aoIntensity: 0.6 }),
        after: to([['roofSheet', 0x6a7678], ['hallRoof', 0x566066], ['hallWall', 0xa9b2b1]], 'roof') },
      { name: 'brick', mats: each(['brick'], { scale: 1 / 1, normalScale: 1.0 }), after: to([['brick', 0x80483b]], 'brick') }
    ];
    this.packsReady = Promise.all(plan.map(entry => loadTexturePack(base, entry.name).then(pack => {
      if (!live() || !pack) return;
      for (const [mat, o] of entry.mats) this.own(...dressFromPack(mat, pack, { ...o, renderer: this.renderer }));
      entry.after?.();
    })));
  }

  /* ======================================================================
     LIGHT AND SKY
     ====================================================================== */

  initLighting() {
    const { key, hemi } = createMwLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);

    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = MWSKY.horizon.clone();

    const env = createMwEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.75;
    }
  }

  initSky() {
    this.sky = createMwSkyDome(900);
    this.scene.add(this.sky);
  }

  /* ======================================================================
     THE GROUND, THE WATER AND WHAT IS BUILT OF STONE AND STEEL
     ====================================================================== */

  getTerrainHeight(x, z) {
    return this.plan.height(x, z);
  }

  initTerrain() {
    const geo = this.own(buildMirrowenTerrainGeometry(this.plan, this.data));
    this.terrainMesh = new THREE.Mesh(geo, [this.M.ground, this.M.setts, this.M.dockFloor]);
    this.terrainMesh.name = 'mirrowen-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    const water = new THREE.Mesh(this.own(buildWaterGeometry(this.plan)), this.M.water);
    water.name = 'mirrowen-water';
    water.position.y = WATER;
    water.frustumCulled = false;
    water.userData.phys = 'ground';
    water.userData.noWeather = true;
    water.receiveShadow = this.t4;
    this.scene.add(water);
    this.waterMesh = water;

    this.shells = buildHarbourShells(this.ctx, this.plan);
    this.scene.add(this.shells);

    this.vista = buildHarbourVista(this.ctx, this.plan);
    this.scene.add(this.vista);
  }

  /* ======================================================================
     LANDMARKS
     ====================================================================== */

  initLandmarks() {
    const ctx = this.ctx;
    let seed = 1;
    let posts = 0;
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      const y = this.getTerrainHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      switch (lm.asset) {
        case 'lamp-post': node = buildLampPost(ctx, posts++); break;
        case 'bollard': node = buildBollard(ctx); break;
        case 'landing-pad': node = buildLandingPad(ctx, this.plan); break;
        case 'ice-wall': node = buildIceWall(ctx, lm, seed++); break;
        case 'shed': node = buildShed(ctx); break;
        case 'gantry-crane': node = buildGantryCrane(ctx); break;
        default: node = null;
      }
      if (!node) continue;
      node.position.set(lm.pos[0], lm.asset === 'landing-pad' ? TERRACE : y, lm.pos[2]);
      if (!SELF_TURNED.has(lm.asset)) node.rotation.y = lm.rotY || 0;
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
      const rot = node.rotation.y;
      for (const v of node.userData.vents || []) {
        const [dx, dz] = yawPoint(v.x, v.z, rot);
        this.vents.push({ ...v, x: lm.pos[0] + dx, y: y + v.y, z: lm.pos[2] + dz });
      }
    }
  }

  /* ======================================================================
     THE SEVEN HOSTS
     ====================================================================== */

  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    if (Math.hypot(ax, az) < 0.01) return 0;
    return Math.atan2(ax, az);
  }

  initHosts() {
    this.siteColliders = [];
    this.hostVents = [];
    for (const site of this.data.sites) {
      const build = HOST_BUILDERS[site.id];
      if (!build || !site.built) continue;
      const host = build(this);
      const g = host.group;
      g.position.set(site.pos[0], this.getTerrainHeight(site.pos[0], site.pos[2]), site.pos[2]);
      g.rotation.y = this.siteFacing(site);
      this.scene.add(g);

      this.siteMarkers.set(site.questId, { site, group: g, indicator: host.bench.indicator });
      this.registerBenchAnchor(site, g, host.bench, host.benchLocal);

      const cos = Math.cos(g.rotation.y), sin = Math.sin(g.rotation.y);
      const at = (lx, lz) => [g.position.x + lx * cos + lz * sin, g.position.z - lx * sin + lz * cos];

      for (const v of host.vents || []) {
        const [x, z] = at(v.lx, v.lz);
        const { lx, lz, ly, ...rest } = v;
        this.hostVents.push({ ...rest, x, y: g.position.y + (ly ?? v.y), z });
      }

      // Every host faces along an axis, so a box stays an exact box in the world's frame.
      for (const c of host.colliders) {
        if (c.r !== undefined) {
          const [x, z] = at(c.lx, c.lz);
          this.siteColliders.push({ x, z, radius: c.r });
          continue;
        }
        const [p0x, p0z] = at(c.lx - c.hw, c.lz - c.hd);
        const [p1x, p1z] = at(c.lx + c.hw, c.lz + c.hd);
        this.siteColliders.push({ minX: Math.min(p0x, p1x), maxX: Math.max(p0x, p1x), minZ: Math.min(p0z, p1z), maxZ: Math.max(p0z, p1z) });
      }
    }
  }

  registerBenchAnchor(site, group, bench, local) {
    const cos = Math.cos(group.rotation.y);
    const sin = Math.sin(group.rotation.y);
    const [lx, ly, lz] = local;
    this.benchAnchors.set(site.questId, {
      siteId: site.id,
      position: [group.position.x + lx * cos + lz * sin, group.position.y + (ly || 0), group.position.z - lx * sin + lz * cos],
      rotationY: group.rotation.y,
      topY: group.position.y + (ly || 0) + bench.topY,
      dormant: bench.dormant
    });
  }

  setBenchDeployed(questId, deployed) {
    const anchor = this.benchAnchors.get(questId);
    if (anchor?.dormant) anchor.dormant.visible = !deployed;
    if (anchor) {
      if (deployed && !anchor.open) this.benchesOpen++;
      if (!deployed && anchor.open) this.benchesOpen--;
      anchor.open = deployed;
    }
  }

  benchAnchor(questId) {
    return this.benchAnchors.get(questId) || null;
  }

  setSiteComplete(questId, complete) {
    const marker = this.siteMarkers.get(questId);
    if (!marker || !marker.indicator) return;
    marker.indicator.material.emissiveIntensity = complete ? 1.7 : 0;
    marker.indicator.material.color.setHex(complete ? FILAMENT : 0x4a4038);
    marker.indicator.material.needsUpdate = true;
  }

  /** The way on foot to a bench: quay by quay, over the gates and up the gangways, door by door (`lib/workings.js`). */
  routeTo(siteId, fromPos, toPos = null) {
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.y, fromPos.z];
    const site = this.data.sites.find(s => s.id === siteId || s.questId === siteId);
    const to = toPos ? (Array.isArray(toPos) ? toPos : [toPos.x, toPos.y, toPos.z]) : site?.approachPos;
    if (!to) return [[from[0], from[from.length - 1]]];
    return this.plan.routeTo(from[0], from[from.length - 1], to[0], to[to.length - 1]);
  }

  /* ======================================================================
     AIR, LAMPS, COVER MASK AND BAKE
     ====================================================================== */

  initEffects() {
    // Sea smoke lifts off the open water: the basin and the outer harbour.
    const mist = [];
    for (const [x, z, r] of [[0, -40, 14], [-20, -20, 12], [10, -10, 10], [20, -50, 10], [-24, -54, 10], [62, -30, 9], [84, 0, 10], [80, -50, 10]]) mist.push({ x, z, y: WATER, r });
    this.effects = createMirrowenEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents: [...this.vents, ...this.hostVents, ...(this.data.vents || [])],
      mist
    });
    this.scene.add(this.effects.group);
  }

  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  initCover() {
    this.cover = makeCover({ sun: MIRROWEN_SUN, ...this.plan.coverSpec() });
    this.cover.applyTo(this.scene);
  }

  bakeStatics() {
    const bake = (group) => {
      group.traverse(o => {
        if (o !== group && (o.userData.phys || o.userData.openShell)) o.userData.noMerge = true;
      });
      mergeStatic(group);
    };
    for (const anchor of this.benchAnchors.values()) {
      const dormant = anchor.dormant;
      if (!dormant) continue;
      dormant.userData.noMerge = false;
      bake(dormant);
      dormant.userData.noMerge = true;
    }
    for (const node of [...this.scene.children]) {
      if (!node.isGroup || node.userData.partBoxes || node.userData.noMerge || node.userData.phys) continue;
      if (node === this.effects?.group) continue;
      bake(node);
    }
    this.staticMerge = this.renderer ? consolidateStatic(this.scene) : null;
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  collectMovers() {
    this.scene.traverse(o => { if (o.userData.mover) this.movers.push(o); });
  }

  /* ======================================================================
     COLLISION
     ====================================================================== */

  buildColliders() {
    // Every wall, kerb, railing and bulwark the plan declares, and the tug in the dock.
    for (const c of this.plan.wallColliders()) this.colliders.push(c);
    for (const c of this.plan.extraColliders()) this.colliders.push(c);
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /* ======================================================================
     FRAME
     ====================================================================== */

  update(delta, cameraPos) {
    this.crew?.update(delta, cameraPos);
    this.elapsed += delta;
    mwSkyUniforms.uMwTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followMwShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      if (this.renderer?.getDrawingBufferSize) {
        this._buf = this._buf || new THREE.Vector2();
        this.effects?.setViewportHeight(this.renderer.getDrawingBufferSize(this._buf).y);
      }
      this.effects?.update(delta, this.elapsed, cameraPos);
      this.lampPool?.update(cameraPos);
    }
    for (const o of this.movers) {
      const m = o.userData.mover;
      if (m.kind === 'yaw') o.rotation.y += m.rate * delta;
      else if (m.kind === 'swing') o.rotation.z = Math.sin(this.elapsed * m.rate + (m.phase || 0)) * m.amp;
    }
    if (this.M.water.normalMap) this.M.water.normalMap.offset.set(this.elapsed * 0.004, this.elapsed * 0.003);
    this.lanternMat.emissiveIntensity = 1.35 + Math.sin(this.elapsed * 1.3) * 0.1;
  }

  dispose() {
    this._disposed = true;
    this.crew?.dispose();
    this.crew = null;
    this.effects?.dispose();
    this.envTarget?.dispose();
    for (const d of this.disposables) {
      try { d.dispose(); } catch (e) { /* already freed */ }
    }
    this.disposables = [];
    this.scene.clear();
    this.siteMarkers.clear();
    this.benchAnchors.clear();
    this.colliders = [];
    this.lamps = [];
    this.movers = [];
  }
}
