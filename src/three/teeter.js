/**
 * teeter.js — Teeter, Learn world 08 (equilibrium), as a place you walk (T4).
 *
 * Teeter is A HILLSIDE OF SALT TERRACES. The hill faces west; it is cut into five level terraces 5.5 m apart, each a band
 * of brine pans held up by a masonry wall. The Avalon sets down on the top shelf by the spring house; from there ONE STAIR
 * runs straight down the fall line at the south edge, four ramps cut down through four walls, and at the foot of each a
 * level DIKE branches north along the wall above it. The benches are in ROOMS DUG INTO THE TERRACE WALLS under the pans
 * above them (two are weir houses whose upper storey stands up among those pans), entered from the dike through a
 * passage in the wall. The Tipper is fought on the drying floor at the bottom, over the great pan.
 * `docs/plans/teeter-world.md` section 9 is the site's spec.
 *
 * It is built behind the SAME contract as every walkable Learn world, so the stage, the voyage, the walk HUD and the bench
 * dispatcher treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   teeter/terrace-plan.js  the terraces, the stair, the dikes, the rooms, the pans, the cover, the way: pure data
 *   teeter/terrain.js       the ground mesh, the masonry (walls, kerbs, the stair, every room's shell), the brine
 *   teeter/stations.js      the eight hosts (host-plan.js says which room each furnishes)
 *   teeter/plant.js         the pumps, the spring house, the stair's lamps, the falls, the drying floor, the far country
 *   teeter/atmosphere.js    the sky, the sun, the environment
 * laid out by `tools/gen-teeter-layout.mjs`. (The first build, two columns of hosts either side of a causeway on a flat
 * field of pans, is in `archive/2026-11-16/site-teeter/`.)
 *
 * THE RULES IT KEEPS: nothing occupies the same space as anything else; a site faces the door the player walks in by;
 * there is one floor (a roof over a room is a body, and the pans over it are not walked); ONLY LAMPS ARE LIT (a lamp is a
 * `lampMark` in the lamp pool); what never moves is baked. INSIDE A ROOM THE SUN IS TAKEN AWAY: the cover mask
 * (`lib/cover.js`) covers every room and passage, on a phone too; the sun reaches only the first metres inside each door.
 */

import * as THREE from 'three';
import teeterData from './world-data/teeter.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic } from './materials/pbr-kit.js';
import { panCrust, saltSlab, brineRipple } from './materials/teeter-textures.js';
import {
  createTtSkyDome, createTtLights, followTtShadow, createTtEnvironment, ttSkyUniforms, followCamera, TTSKY, TEETER_SUN
} from './teeter/atmosphere.js';
import { makeTerracePlan } from './teeter/terrace-plan.js';
import { makeTeeterField, buildGroundGeometry, buildMasonry, buildBrineGeometry, mergeList } from './teeter/terrain.js';
import * as PLANT from './teeter/plant.js';
import { HOST_BUILDERS } from './teeter/stations.js';
import { FILAMENT } from './kettle/kit.js';
import { makeCover } from './lib/cover.js';
import { yawPoint } from './ember/kit.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** Landmarks that are round, or turn themselves: their group is never turned. */
const SELF_TURNED = new Set(['lamp-post', 'landing-pad']);

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** The masonry is merged by material over squares this size, so frustum culling still has pieces to cull. */
const MASONRY_SQUARE = 40;

export class TeeterWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.name = 'teeter';
    this.data = teeterData;
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
    // The hill, the spurs and the valley run to the horizon on their own; the voyage must not lay a ring over them.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    // THE TERRACES, AS A PLAN. The height field, the walk, the colliders, the light mask and the guide all stand on it.
    this.plan = makeTerracePlan();
    const pad = this.data.landmarks.find(l => l.asset === 'landing-pad');
    this.field = makeTeeterField(this.plan, pad ? [pad.pos[0], pad.pos[2]] : null);

    this.initMaterials();
    this.initLighting();
    this.sky = createTtSkyDome(900);
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
    // THE GROUND: the pans' crust for grain; the vertex colours say what it is (clay dike, crust, stair stone, hill rock).
    M.ground = buildMaterial(panCrust({ size: texSize(512), seed: 31 }), { repeat: 1, roughness: 1.0 });
    M.ground.vertexColors = true;
    M.ground.normalScale.set(1.1, 1.1);
    M.ground.envMapIntensity = 0.6;
    for (const t of M.ground.userData.surfaceMaps || []) t.anisotropy = aniso;
    // THE MASONRY: dressed limestone, salt-bloomed. Coping and flags a shade darker; the rooms' insides darker again.
    const stone = (color, seed) => {
      const m = buildMaterial(saltSlab({ size: texSize(512), seed }), { repeat: 1, roughness: 1.0 });
      m.color = new THREE.Color(color);
      return m;
    };
    M.masonry = stone(0xe0d9c8, 7);
    M.coping = stone(0xc9c1ae, 11);
    M.flags = stone(0xb6ad9a, 13);
    M.vault = stone(0xcdc4b0, 17);
    M.brick = std({ color: 0x9a6a4c, roughness: 0.9, metalness: 0 });
    M.kerb = std({ color: 0xbdb39c, roughness: 0.97, metalness: 0 });
    M.bund = std({ color: 0xc9c0aa, roughness: 0.97, metalness: 0 });
    M.concrete = M.masonry;
    M.slab = M.masonry;
    M.clad = metal('#cfd2cd', '#aeb2ad', '#a08a6c', 81, 0.3, 2, 512);
    M.steel = metal('#9da39d', '#808880', '#8d6f52', 83, 0.4, 2, 512);
    M.darkSteel = metal('#43484a', '#585d5c', '#76604c', 85, 0.5, 4);
    M.rusted = metal('#76543e', '#62544a', '#84512f', 87, 0.8, 3);
    M.roofSheet = metal('#8e9593', '#7c8381', '#8a6444', 95, 0.55, 5);
    M.benchTop = metal('#a9aeaa', '#8d938f', '#8a7358', 105, 0.4, 3);
    M.paintGrey = metal('#8a8e88', '#6f736d', '#6a5442', 121, 0.4, 2);
    M.timber = std({ color: 0x8a7658, roughness: 0.95, metalness: 0 });
    M.timberDark = std({ color: 0x5a4a38, roughness: 0.95, metalness: 0 });
    M.brushwood = std({ color: 0x4d4436, roughness: 1.0, metalness: 0 });
    M.salt = std({ color: 0xece9de, roughness: 0.95, metalness: 0 });
    M.saltWhite = std({ color: 0xf3f1e8, roughness: 0.9, metalness: 0 });
    M.sack = std({ color: 0xd9d3c0, roughness: 0.95, metalness: 0 });
    M.paper = std({ color: 0xe9e3d2, roughness: 0.9, metalness: 0 });
    M.board = std({ color: 0x2c3230, roughness: 0.85, metalness: 0 });
    M.brass = std({ color: 0xb08d4c, roughness: 0.42, metalness: 0.9 });
    M.copper = std({ color: 0xb06a43, roughness: 0.45, metalness: 0.9 });
    M.castIron = metal('#4c4a48', '#3f3d3b', '#6a4a30', 115, 0.55, 3);
    M.rubber = std({ color: 0x1c1a1a, roughness: 0.9, metalness: 0 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintBlue = std({ color: 0x3f6f8c, roughness: 0.62, metalness: 0.3 });
    M.paintYellow = std({ color: 0xc9a14a, roughness: 0.7, metalness: 0.1 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe8e2d4, roughness: 0.6, metalness: 0 });
    // Brine is still, grey-green and glossy: in a room's culvert or tank (opaque), and over every pan (translucent).
    M.brine = buildMaterial(brineRipple({ size: texSize(256), seed: 9 }), { repeat: 1, roughness: 0.14 });
    M.brine.envMapIntensity = 1.3;
    M.panWater = buildMaterial(brineRipple({ size: texSize(256), seed: 19 }), { repeat: 1, roughness: 0.12 });
    M.panWater.envMapIntensity = 1.3;
    M.panWater.transparent = true;
    M.panWater.opacity = 0.78;
    M.panWater.depthWrite = false;
    M.river = std({ color: 0x5d6a66, roughness: 0.1, metalness: 0, envMapIntensity: 1.1 });
    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1214, roughness: 0.18, metalness: 0.2 });
    // THE ONE CLEAN THING in a weathered works: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe9e4d6, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2f333a, roughness: 0.55, metalness: 0.4 });
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
    const { key, hemi } = createTtLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = TTSKY.horizon.clone();
    const env = createTtEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.8;
    }
  }

  /* ------------------------------------------------------------ the ground */

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  /** The ground mesh, the masonry and the brine. The ground and the masonry are GROUND; the brine is ambient. */
  initTerrain() {
    const ground = this.own(buildGroundGeometry(this.field, this.plan));
    this.terrainMesh = new THREE.Mesh(ground, this.M.ground);
    this.terrainMesh.name = 'teeter-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    // THE MASONRY, merged by material over 40 m squares: walls, kerbs, the stair, the rooms' shells, the pans' bunds.
    const lists = buildMasonry(this.plan);
    const mat = { wall: this.M.masonry, coping: this.M.coping, kerb: this.M.kerb, bund: this.M.bund, flags: this.M.flags, vault: this.M.vault, timber: this.M.timber, steel: this.M.darkSteel, brick: this.M.brick, roof: this.M.roofSheet, rail: this.M.timberDark };
    const masonry = new THREE.Group();
    masonry.name = 'terraces';
    masonry.userData.phys = 'ground';
    masonry.userData.noMerge = true;
    for (const [key, list] of Object.entries(lists)) {
      const squares = new Map();
      for (const g of list) {
        g.computeBoundingBox();
        const c = g.boundingBox.getCenter(new THREE.Vector3());
        const sk = `${Math.floor(c.x / MASONRY_SQUARE)},${Math.floor(c.z / MASONRY_SQUARE)}`;
        if (!squares.has(sk)) squares.set(sk, []);
        squares.get(sk).push(g);
      }
      for (const [sk, gs] of squares) {
        const geo = mergeList(gs);
        if (!geo) continue;
        const m = new THREE.Mesh(this.own(geo), mat[key]);
        m.name = `masonry:${key}@${sk}`;
        m.castShadow = this.t4 && key !== 'bund' && key !== 'flags';
        m.receiveShadow = this.t4;
        masonry.add(m);
      }
    }
    this.scene.add(masonry);
    this.masonry = masonry;

    // The brine over every pan: one sheet, ambience (nothing stands on it).
    const brine = new THREE.Mesh(this.own(buildBrineGeometry(this.plan)), this.M.panWater);
    brine.name = 'teeter-brine';
    brine.renderOrder = 2;
    brine.userData.phys = 'ambient';
    brine.userData.noMerge = true;
    brine.userData.noWeather = true;
    this.scene.add(brine);
  }

  /** The pumps, the spring house, the stair's lamps, the falls, the drying floor, the far country. */
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

  /** The shelf's pad and the lamp posts along the dikes. */
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
   * The way on foot from where the player stands to a site's approach mark, as a list of [x, z]: out of a room by its
   * door, along the dike to the stair, down (or up) the stair, along the next dike, in at the door. The guide follows it.
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

  /** WHAT NEVER MOVES IS BAKED. The cased instruments, the indicators, the pumps' beams and rods and the falls stay their own. */
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
   * INSIDE A ROOM THE SUN IS TAKEN AWAY. The mask takes the sun and 0.7 of the sky out of every room and passage; the sun
   * still reaches the first metres inside each door. A deployed instrument arrives later with
   * materials of its own; `update` covers it.
   */
  initCover() {
    this.cover = makeCover({ sun: TEETER_SUN, ...this.plan.coverSpec() });
    this.cover.applyTo(this.scene);
  }

  /* ------------------------------------------------------------ frame */

  update(delta, cameraPos) {
    this.elapsed += delta;
    ttSkyUniforms.uTtTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followTtShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
    if ((this._coverTick = ((this._coverTick ?? 0) + 1) % 10) === 0) this.cover.applyTo(this.scene);
    for (const m of this.movers) m.update(this.elapsed);
    // The brine creeps: its ripple slides slowly across every sheet (the shimmer of the air is the sky's).
    const n = this.M.panWater.normalMap, t = this.elapsed;
    if (n) n.offset.set(t * 0.004, t * 0.0025);
    this.lanternMat.emissiveIntensity = 1.35 + Math.sin(this.elapsed * 1.3) * 0.1;
  }

  dispose() {
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
