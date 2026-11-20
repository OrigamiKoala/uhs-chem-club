/**
 * brinewire.js — Brinewire, Learn world 10 (electrochemistry), as a place you walk (T4).
 *
 * Brinewire is A TIDAL BARRAGE ACROSS THE COPPER MARSH. One concrete wall runs north and south between two headlands: on its west
 * the LAGOON, the marsh's brine impounded 10 m up against it, the cell frames and the pylons standing in it; on its east a 12 m
 * DROP to the tailrace basin and the tidal flats. The Avalon sets down on the north abutment; from there the CREST ROAD runs south
 * along the top of the wall between two parapets, past two GATE HOUSES standing off it over the lagoon on piers, to the south
 * abutment; ONE RAMP then goes down the wall's east face in two flights, with a LANDING half way from which an adit runs into the
 * wall to the CELL GALLERY and its three chambers; at the foot, the SWITCHYARD and its rectifier CAGE against the wall. The benches
 * are in those six rooms. The Clamp is fought on the apron at the foot. `docs/plans/brinewire-world.md` section 9 is the spec.
 *
 * It is built behind the SAME contract as every walkable Learn world, so the stage, the voyage, the walk HUD and the bench
 * dispatcher treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   brinewire/barrage-plan.js  the wall, the walks, the rooms, the cover, the way: pure data
 *   brinewire/terrain.js       the land round it, the wall's concrete, the walks' paving, every room's shell, the water
 *   brinewire/stations.js      the six hosts (host-plan.js says which room each furnishes)
 *   brinewire/plant.js         the ramp's and the gallery's lamps, the outfalls, the deck, the switchyard, the far country
 *   brinewire/atmosphere.js    the sky, the sun, the environment
 * laid out by `tools/gen-brinewire-layout.mjs`. (The first build, two columns of hosts either side of a plank spine over a
 * field of pools, is in `archive/2026-11-17/site-brinewire/`.)
 *
 * THE RULES IT KEEPS: nothing occupies the same space as anything else; a site faces the door the player walks in by; there is
 * one floor (the deck over the gallery is a body, never walked); ONLY LAMPS ARE LIT (a lamp is a `lampMark` in the lamp pool);
 * what never moves is baked. INSIDE A ROOM THE SUN IS TAKEN AWAY: the cover mask (`lib/cover.js`) covers every room, passage, the
 * adit and the gallery, on a phone too; the low sun comes into the gate houses only through their west windows.
 */

import * as THREE from 'three';
import brinewireData from './world-data/brinewire.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic, canvas2d } from './materials/pbr-kit.js';
import { saltMud, brineWater, pourConcrete } from './materials/brinewire-textures.js';
import {
  createBwSkyDome, createBwLights, followBwShadow, createBwEnvironment, bwSkyUniforms, followCamera, BWSKY, BRINEWIRE_SUN
} from './brinewire/atmosphere.js';
import { makeBarragePlan } from './brinewire/barrage-plan.js';
import { makeBrinewireField, buildGroundGeometry, buildPaving, buildBarrage, buildWaterGeometry, mergeList } from './brinewire/terrain.js';
import * as PLANT from './brinewire/plant.js';
import { HOST_BUILDERS } from './brinewire/stations.js';
import { FILAMENT } from './kettle/kit.js';
import { makeCover } from './lib/cover.js';
import { yawPoint } from './ember/kit.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';
import { attachCrew } from './npc/attach.js';

/** Landmarks that are round, or turn themselves: their group is never turned. */
const SELF_TURNED = new Set(['lamp-post', 'landing-pad']);

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** The barrage is merged by material over squares this size, so frustum culling still has pieces to cull. */
const SQUARE = 40;

/** Expanded metal: a diamond mesh, strands opaque and holes cut (alpha), for the cage's walls. */
function expandedMetal(S = 128) {
  const c = canvas2d(S, S);
  const x = c.getContext('2d');
  const img = x.createImageData(S, S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    // Four diamonds across the tile: a strand where the distance to a diamond's edge is small.
    const u = (i / S) * 4, v = (j / S) * 2;
    const fu = Math.abs((u % 1) - 0.5), fv = Math.abs((v % 1) - 0.5);
    const d = fu + fv;
    const strand = Math.abs(d - 0.5) < 0.09;
    const k = (j * S + i) * 4;
    const shade = 120 + ((i * 7 + j * 3) % 17);
    img.data[k] = shade; img.data[k + 1] = shade + 4; img.data[k + 2] = shade + 6;
    img.data[k + 3] = strand ? 255 : 0;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class BrinewireWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.name = 'brinewire';
    this.data = brinewireData;
    this.colliders = [];
    this.disposables = [];
    this.lamps = [];
    this.siteMarkers = new Map();
    this.benchAnchors = new Map();
    this.siteColliders = [];
    this.landmarkNodes = [];
    this.movers = [];
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The lagoon, the flats and the headlands run to the horizon on their own; the voyage must not lay a ring over them.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    // THE BARRAGE, AS A PLAN. The height field, the walk, the colliders, the light mask and the guide all stand on it.
    this.plan = makeBarragePlan();
    const pad = this.data.landmarks.find(l => l.asset === 'landing-pad');
    this.field = makeBrinewireField(this.plan, pad ? [pad.pos[0], pad.pos[2]] : null);

    this.initMaterials();
    this.initLighting();
    this.sky = createBwSkyDome(900);
    this.scene.add(this.sky);
    this.initTerrain();
    this.initPlant();
    this.initLandmarks();
    this.initHosts();
    this.initLampPool();
    this.bakeStatics();
    this.buildColliders();
    this.enableAmbientOcclusion();
    this.initCover();
    // The people who work here, walking their rounds (`npc/attach.js`, `src/npc/crews/brinewire.js`).
    this.crew = attachCrew(this, 'brinewire');
  }

  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /** What the builders are handed: materials, `own`, the lamp list, the tier, the field and the plan. */
  get ctx() {
    return { M: this.M, own: (...o) => this.own(...o), lamps: this.lamps, t4: this.t4, field: this.field, plan: this.plan };
  }

  /** `aoMap` samples the SECOND uv set, which a primitive geometry does not have: reuse the first. */
  enableAmbientOcclusion() {
    const done = new Set();
    this.scene.traverse(o => {
      if (!o.geometry || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some(m => m && m.aoMap) || done.has(o.geometry)) return;
      done.add(o.geometry);
      if (!o.geometry.attributes.uv1) enableAO(o.geometry);
    });
  }

  /* ---------------------------------------------------------------- materials */

  initMaterials() {
    const M = {};
    const std = o => new THREE.MeshStandardMaterial(o);
    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256) => {
      const m = buildMaterial(platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 2, roughness: 1.0 });
      m.normalScale.set(1.2, 1.2);
      m.aoMapIntensity = 0.85;
      return m;
    };
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    // THE GROUND round the barrage: mud and silt for grain; the vertex colours say what it is (bed, flats, sandstone, shore).
    M.ground = buildMaterial(saltMud({ size: texSize(512), seed: 31 }), { repeat: 1, roughness: 1.0 });
    M.ground.vertexColors = true;
    M.ground.normalScale.set(1.1, 1.1);
    M.ground.envMapIntensity = 0.55;
    for (const t of M.ground.userData.surfaceMaps || []) t.anisotropy = aniso;
    // THE BARRAGE'S CONCRETE: poured in lifts, board-marked, rust run from every bolt. Faces a shade darker where the water was.
    const concrete = (color, seed, repeat = 1) => {
      const m = buildMaterial(pourConcrete({ size: texSize(512), seed }), { repeat, roughness: 1.0 });
      m.color = new THREE.Color(color);
      return m;
    };
    M.concrete = concrete(0xc9c6bd, 7);
    M.face = concrete(0xb9b5aa, 11);
    M.coping = concrete(0xd6d2c6, 13);
    M.deck = concrete(0xbdbab2, 17);
    M.vault = concrete(0xa9a59b, 19);
    M.block = concrete(0xc2bcae, 23);
    M.floor = concrete(0x9d998f, 29);
    M.concreteDark = concrete(0x8f8b82, 37);
    // The water's line on a face: wet concrete with a skin of weed, and the salt dried over it.
    M.wetFace = concrete(0x4f564c, 43);
    M.wetFace.roughness = 0.55;
    M.saltCrust = std({ color: 0xdcd8cc, roughness: 0.95, metalness: 0 });
    // The walks' paving: the same concrete, coloured per vertex (joints, wear, salt).
    M.paving = concrete(0xffffff, 41);
    M.paving.vertexColors = true;
    for (const m of [M.ground, M.paving]) for (const t of m.userData.surfaceMaps || []) t.anisotropy = aniso;
    M.brick = std({ color: 0x8e5a40, roughness: 0.9, metalness: 0 });
    M.brickDark = std({ color: 0x4a3328, roughness: 0.9, metalness: 0 });
    M.slag = std({ color: 0x3e5a4c, roughness: 0.85, metalness: 0.1, flatShading: true });
    // Copper that has gone green: the patina is the paint, the old metal shows through the wear.
    M.patina = metal('#6f9c88', '#5d8d78', '#476b58', 81, 0.35, 3, 512);
    M.patinaDark = metal('#3d6657', '#4a7564', '#2f4a3d', 83, 0.5, 4);
    M.copperClad = metal('#a5865a', '#b0794a', '#5d8870', 85, 0.5, 3, 512);
    M.steel = metal('#8a9892', '#6f7d77', '#7f6a52', 87, 0.4, 2, 512);
    M.darkSteel = metal('#3b4440', '#4b5651', '#5e5444', 89, 0.5, 4);
    M.rusted = metal('#7a5a40', '#5e5348', '#84512f', 91, 0.8, 3);
    M.gateLeaf = metal('#53646a', '#4b5651', '#8a4a26', 95, 0.75, 3, 512);
    M.roofSheet = metal('#8e9593', '#7c8381', '#8a6444', 97, 0.55, 5);
    M.benchTop = metal('#8aa093', '#738a7e', '#566e5f', 93, 0.4, 3);
    M.paintYellow = metal('#b8913f', '#8c8a80', '#7a5a3a', 99, 0.45, 2);
    M.timber = std({ color: 0x7a6a4e, roughness: 0.95, metalness: 0 });
    M.timberDark = std({ color: 0x3e3b2f, roughness: 0.95, metalness: 0 });
    M.brass = std({ color: 0xb08d4c, roughness: 0.42, metalness: 0.9 });
    M.copper = std({ color: 0xb06a43, roughness: 0.45, metalness: 0.9 });
    M.zinc = std({ color: 0x9aa3a6, roughness: 0.5, metalness: 0.85 });
    M.zincSpent = std({ color: 0x8b8f86, roughness: 0.85, metalness: 0.3 });
    M.lead = std({ color: 0x5d6168, roughness: 0.6, metalness: 0.7 });
    M.rubber = std({ color: 0x1c1a1a, roughness: 0.9, metalness: 0 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintBlue = std({ color: 0x3f6f8c, roughness: 0.62, metalness: 0.3 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe0e2d2, roughness: 0.6, metalness: 0 });
    M.paper = std({ color: 0xe9e3d2, roughness: 0.9, metalness: 0 });
    M.board = std({ color: 0x2c3230, roughness: 0.85, metalness: 0 });
    M.rust = std({ color: 0x7c4a2a, roughness: 0.95, metalness: 0.2 });
    M.void = std({ color: 0x0c0d0d, roughness: 1, metalness: 0 });
    // The cage's expanded metal: strands kept, holes cut (alpha test, so it still writes depth).
    const mesh = this.own(expandedMetal(texSize(128)));
    mesh.repeat.set(1, 1);
    M.mesh = std({ color: 0x9aa09a, map: mesh, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.6 });
    // Brine: a sheet in a tank (opaque), and the lagoon and the tailwater (translucent).
    const ripple = (seed) => buildMaterial(brineWater({ size: texSize(256), seed }), { repeat: 1, roughness: 0.14 });
    M.water = ripple(9);
    M.water.envMapIntensity = 1.2;
    M.lagoon = ripple(19);
    M.lagoon.envMapIntensity = 1.25;
    M.lagoon.transparent = true;
    M.lagoon.opacity = 0.84;
    M.lagoon.depthWrite = false;
    M.tail = ripple(29);
    M.tail.envMapIntensity = 1.15;
    M.tail.transparent = true;
    M.tail.opacity = 0.8;
    M.tail.depthWrite = false;
    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1214, roughness: 0.18, metalness: 0.2 });
    // THE ONE CLEAN THING in a weathered works: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe6e7d8, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2c3330, roughness: 0.55, metalness: 0.4 });
    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /* ------------------------------------------------------------ light and sky */

  initLighting() {
    const { key, hemi } = createBwLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = BWSKY.horizon.clone();
    const env = createBwEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.75;
    }
  }

  /* ------------------------------------------------------------ the ground */

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  /** The ground mesh, the barrage, the paving and the water. The ground, the barrage and the paving are GROUND; the water is ambient. */
  initTerrain() {
    const ground = this.own(buildGroundGeometry(this.field, this.plan));
    this.terrainMesh = new THREE.Mesh(ground, this.M.ground);
    this.terrainMesh.name = 'brinewire-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    // THE BARRAGE, merged by material over 40 m squares: faces, deck, parapets, gate houses, rooms, gallery, the cage.
    const lists = buildBarrage(this.plan);
    const mat = {
      concrete: this.M.concrete, face: this.M.face, coping: this.M.coping, deck: this.M.deck, block: this.M.block, vault: this.M.vault,
      brick: this.M.brick, floor: this.M.floor, steel: this.M.darkSteel, roof: this.M.roofSheet, rail: this.M.darkSteel, timber: this.M.timber, mesh: this.M.mesh,
      wet: this.M.wetFace, salt: this.M.saltCrust
    };
    const barrage = new THREE.Group();
    barrage.name = 'barrage';
    barrage.userData.phys = 'ground';
    barrage.userData.noMerge = true;
    for (const [key, list] of Object.entries(lists)) {
      const squares = new Map();
      for (const g of list) {
        g.computeBoundingBox();
        const c = g.boundingBox.getCenter(new THREE.Vector3());
        const sk = `${Math.floor(c.x / SQUARE)},${Math.floor(c.z / SQUARE)}`;
        if (!squares.has(sk)) squares.set(sk, []);
        squares.get(sk).push(g);
      }
      for (const [sk, gs] of squares) {
        const geo = mergeList(gs);
        if (!geo) continue;
        const m = new THREE.Mesh(this.own(geo), mat[key]);
        m.name = `barrage:${key}@${sk}`;
        m.castShadow = this.t4 && !['floor', 'mesh', 'wet', 'salt'].includes(key);
        m.receiveShadow = this.t4;
        barrage.add(m);
      }
    }
    // The walks' paving, one mesh.
    const paving = new THREE.Mesh(this.own(buildPaving(this.plan)), this.M.paving);
    paving.name = 'barrage:paving';
    paving.receiveShadow = this.t4;
    barrage.add(paving);
    this.scene.add(barrage);
    this.barrage = barrage;

    // The lagoon and the tailwater: two sheets, ambience (nothing stands on them).
    const water = buildWaterGeometry(this.plan);
    for (const [key, geo, m] of [['lagoon', water.lagoon, this.M.lagoon], ['tail', water.tail, this.M.tail]]) {
      const sheet = new THREE.Mesh(this.own(geo), m);
      sheet.name = `brinewire-${key}`;
      sheet.renderOrder = 2;
      sheet.frustumCulled = false;
      sheet.userData.phys = 'ambient';
      sheet.userData.noMerge = true;
      sheet.userData.noWeather = true;
      this.scene.add(sheet);
    }
  }

  /** The ramp's and gallery's lamps, the outfalls, the deck, the switchyard, the far country. */
  initPlant() {
    this.plantColliders = [];
    for (const build of PLANT.PLANT_BUILDERS) {
      const node = build(this);
      if (!node) continue;
      this.scene.add(node);
      for (const m of node.userData.movers || []) this.movers.push(m);
      for (const c of node.userData.colliders || []) this.plantColliders.push(c.minX !== undefined ? { ...c } : { x: c.x, z: c.z, radius: c.r });
    }
  }

  /** The north yard's pad and the lamp posts on the open walk. */
  initLandmarks() {
    const ctx = this.ctx;
    let posts = 0;
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      let node = null;
      if (lm.asset === 'lamp-post') node = PLANT.buildLampPost(ctx, posts++);
      else if (lm.asset === 'landing-pad') node = PLANT.buildLandingPad(ctx, this.field);
      if (!node) continue;
      const y = lm.asset === 'landing-pad' ? this.plan.height(lm.pos[0], lm.pos[2]) : this.getTerrainHeight(lm.pos[0], lm.pos[2]);
      node.position.set(lm.pos[0], y, lm.pos[2]);
      if (!SELF_TURNED.has(lm.asset)) node.rotation.y = lm.rotY || 0;
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
    }
  }

  /**
   * The way on foot from where the player stands to a site's approach mark, as a list of [x, z]: along the crest road, in at a
   * gate house's door; or down the ramp, through the adit and along the gallery to a chamber's door; or on down to the foot.
   */
  routeTo(siteId, fromPos, toPos = null) {
    const site = this.data.sites.find(s => s.id === siteId);
    if (!site) return null;
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.z];
    const to = toPos ? [toPos[0], 0, toPos[1]] : site.approachPos;
    return this.plan.routeTo(from[0], from[from.length === 3 ? 2 : 1], to[0], to[2]);
  }

  /* ------------------------------------------------------------ the sites */

  /** Which way a site faces: toward the door a player walks in by, derived from `approachPos`. */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    return Math.hypot(ax, az) < 0.01 ? 0 : Math.atan2(ax, az);
  }

  /** Build every host in its room, turned to face its door. The bench is a part of its host, one object. */
  initHosts() {
    for (const site of this.data.sites) {
      const build = HOST_BUILDERS[site.id];
      if (!build) continue;
      const host = build(this);
      const g = host.group;
      g.position.set(site.pos[0], this.getTerrainHeight(site.pos[0], site.pos[2]), site.pos[2]);
      g.rotation.y = this.siteFacing(site);
      this.scene.add(g);
      for (const m of host.movers || []) this.movers.push(m);

      this.siteMarkers.set(site.questId, { site, group: g, indicator: host.bench.indicator });
      this.registerBenchAnchor(site, g, host.bench, host.benchLocal);

      const cos = Math.cos(g.rotation.y), sin = Math.sin(g.rotation.y);
      const at = (lx, lz) => [g.position.x + lx * cos + lz * sin, g.position.z - lx * sin + lz * cos];
      // Every room faces along an axis, so a host turns by a quarter turn and its box colliders stay boxes, exactly.
      for (const c of host.colliders) {
        if (c.r !== undefined) { const [x, z] = at(c.lx, c.lz); this.siteColliders.push({ x, z, radius: c.r }); continue; }
        const pts = [[c.lx - c.hw, c.lz - c.hd], [c.lx + c.hw, c.lz + c.hd]].map(([a, b]) => at(a, b));
        this.siteColliders.push({ minX: Math.min(pts[0][0], pts[1][0]), maxX: Math.max(pts[0][0], pts[1][0]), minZ: Math.min(pts[0][1], pts[1][1]), maxZ: Math.max(pts[0][1], pts[1][1]) });
      }
    }
  }

  registerBenchAnchor(site, group, bench, local) {
    const cos = Math.cos(group.rotation.y), sin = Math.sin(group.rotation.y);
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
    if (!marker?.indicator) return;
    marker.indicator.material.emissiveIntensity = complete ? 1.7 : 0;
    marker.indicator.material.color.setHex(complete ? FILAMENT : 0x4a4038);
    marker.indicator.material.needsUpdate = true;
  }

  /* ------------------------------------------------------------ lamps, bake, walls */

  /** Every lamp is declared to the pool (lamp-pool.js): where it is and whether it is on. */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
  }

  /** WHAT NEVER MOVES IS BAKED. The cased instruments, the indicators and the outfalls' water stay their own. */
  bakeStatics() {
    const bake = (group) => {
      group.traverse(o => { if (o !== group && (o.userData.phys || o.userData.openShell)) o.userData.noMerge = true; });
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
      bake(node);
    }
    // The far country is the horizon's own, and it is baked the same way.
    for (const node of this.scene.children) {
      if (node.name !== 'far-country') continue;
      mergeStatic(node);
      node.traverse(o => { if (o.isMesh) o.userData.phys = 'ambient'; });
    }
    this.staticMerge = this.renderer ? consolidateStatic(this.scene) : null;
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  /** The walk's walls (every closed side of every volume), the plant, the posts and every host's machinery. */
  buildColliders() {
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }
    this.edgeColliders = this.plan.colliders();
    for (const c of this.edgeColliders) this.colliders.push(c);
    for (const c of this.plantColliders) this.colliders.push(c);
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /**
   * INSIDE A ROOM THE SUN IS TAKEN AWAY. The mask takes the sun and most of the sky out of every room, passage, the adit and the
   * gallery; the low western sun still comes into the gate houses through their west windows. A deployed instrument arrives
   * later with materials of its own; `update` covers it.
   */
  initCover() {
    this.cover = makeCover({ sun: BRINEWIRE_SUN, ...this.plan.coverSpec() });
    this.cover.applyTo(this.scene);
  }

  /* ------------------------------------------------------------ frame */

  update(delta, cameraPos) {
    this.crew?.update(delta, cameraPos);
    this.elapsed += delta;
    bwSkyUniforms.uBwTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followBwShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
    if ((this._coverTick = ((this._coverTick ?? 0) + 1) % 10) === 0) this.cover.applyTo(this.scene);
    for (const m of this.movers) m.update(this.elapsed);
    // The water creeps: the lagoon's ripple drifts east on the breeze, the tailwater's runs out to the flats.
    const t = this.elapsed;
    const ln = this.M.lagoon.normalMap, tn = this.M.tail.normalMap;
    if (ln) ln.offset.set(t * 0.003, t * 0.0015);
    if (tn) tn.offset.set(t * 0.006, -t * 0.001);
    this.lanternMat.emissiveIntensity = 1.35 + Math.sin(this.elapsed * 1.3) * 0.1;
  }

  dispose() {
    this.crew?.dispose();
    this.crew = null;
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
