/**
 * lodestone.js — Lodestone, Learn world 12 (the transition metals), as a place you walk (T4).
 *
 * Lodestone is A SLOT CANYON CUT DOWN THROUGH BANDED IRON. The Avalon sets down in a scoured hollow on the tableland at
 * the canyon's head; a cleft opens in the hollow's west wall and the floor drops into it. From there there is one way:
 * down the canyon, run after run, bend after bend, the walls rising from 4 m at the head to over 30 m at the foot, to a
 * round pothole where the Fifth's sorting magnet, the Coil, stands. At the outside of six bends, where the water undercut
 * the wall beneath a hard bed, the Fifth used the hollow left behind: each ALCOVE is the room of one bench (a core
 * store, a manganese face, a seep, a drum gallery, a chimney, a magnetite pocket). `docs/plans/lodestone-world.md`
 * section 7 is the site's spec.
 *
 * It is built behind the SAME contract as every walkable Learn world, so the stage, the voyage, the walk HUD and the
 * bench dispatcher treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   lodestone/canyon-plan.js  the canyon, its floor, its alcoves, the walk's edge, the cover, the way: pure data
 *   lodestone/terrain.js      the one height field, the ground mesh, the canyon's rock faces, the alcoves' roofs
 *   lodestone/rock.js         the banded iron, drawn by height in the world
 *   lodestone/stations.js     the six hosts (host-plan.js says which alcove each stands in)
 *   lodestone/plant.js        the lamps, the Coil's cable and yard, the rockfall, the far country
 *   lodestone/atmosphere.js   the sky, the low sun, the environment
 * laid out by `tools/gen-lodestone-layout.mjs`.
 *
 * THE RULES IT KEEPS: nothing occupies the same space as anything else; a site faces the floor the player walks in on;
 * there is one floor (a roof over an alcove is a body); ONLY LAMPS ARE LIT (a lamp is a `lampMark` pooled into three
 * real lights); what never moves is baked. THE SUN REACHES ONLY THE TOP OF THE WALLS: the cover mask (`lib/cover.js`)
 * takes it out of the canyon, the pothole and the alcoves below their rims, on a phone too.
 */

import * as THREE from 'three';
import lodestoneData from './world-data/lodestone.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic } from './materials/pbr-kit.js';
import { canyonGravel, depotConcrete } from './materials/lodestone-textures.js';
import {
  createLsSkyDome, createLsLights, followLsShadow, createLsEnvironment, lsSkyUniforms, followCamera, LSSKY, LODESTONE_SUN
} from './lodestone/atmosphere.js';
import { makeCanyonPlan } from './lodestone/canyon-plan.js';
import { makeLodestoneField, buildGroundGeometry, buildFaceGeometry, buildRoofGeometries } from './lodestone/terrain.js';
import { bandRock } from './lodestone/rock.js';
import * as PLANT from './lodestone/plant.js';
import { HOST_BUILDERS } from './lodestone/stations.js';
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

export class LodestoneWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.name = 'lodestone';
    this.data = lodestoneData;
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
    // The tableland runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    // THE CANYON, AS A PLAN. The height field, the walk, the colliders, the light mask and the guide all stand on it.
    this.plan = makeCanyonPlan();
    const pad = this.data.landmarks.find(l => l.asset === 'landing-pad');
    this.field = makeLodestoneField(this.plan, pad ? [pad.pos[0], pad.pos[2]] : null);

    this.initMaterials();
    this.initLighting();
    this.sky = createLsSkyDome(900);
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
    // The people who work here, walking their rounds (`npc/attach.js`, `src/npc/crews/lodestone.js`).
    this.crew = attachCrew(this, 'lodestone');
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
    // THE ROCK: the canyon's gravel for grain, the beds drawn over it by height (rock.js). Ground, faces, roofs, blocks.
    M.rock = buildMaterial(canyonGravel({ size: texSize(512), seed: 41 }), { repeat: 1, roughness: 1.0 });
    M.rock.normalScale.set(1.2, 1.2);
    M.rock.envMapIntensity = 0.45;
    for (const t of M.rock.userData.surfaceMaps || []) t.anisotropy = aniso;
    bandRock(M.rock);

    M.concrete = buildMaterial(depotConcrete({ size: texSize(512), seed: 17 }), { repeat: 1, roughness: 1.0 });
    M.stone = M.concrete;
    M.steel = metal('#7d8792', '#646e78', '#5c4d3e', 101, 0.4, 2, 512);
    M.darkSteel = metal('#333942', '#444c57', '#4a3d33', 103, 0.45, 4);
    M.rusted = metal('#78523d', '#58483e', '#86482b', 107, 0.75, 3);
    M.castIron = metal('#4c4a48', '#3f3d3b', '#6a4a30', 105, 0.55, 3);
    M.benchTop = metal('#7c8c94', '#657680', '#485a64', 109, 0.35, 3);
    M.drumBlue = metal('#3d5a78', '#4a5560', '#7a4a30', 113, 0.55, 2);
    M.drumGreen = metal('#4d6a48', '#4a5560', '#7a4a30', 117, 0.55, 2);
    M.drumRed = metal('#7a3a2c', '#5a4a40', '#7a4a30', 119, 0.6, 2);
    M.paintGrey = metal('#8a8e88', '#6f736d', '#6a5442', 121, 0.4, 2);
    M.copper = std({ color: 0xb66e43, roughness: 0.42, metalness: 0.9 });
    M.brass = std({ color: 0xb8944f, roughness: 0.42, metalness: 0.9 });
    M.timber = std({ color: 0x6a5238, roughness: 0.92, metalness: 0 });
    M.timberDark = std({ color: 0x45372a, roughness: 0.95, metalness: 0 });
    M.rubber = std({ color: 0x1c1a1a, roughness: 0.9, metalness: 0 });
    M.paintYellow = std({ color: 0xb8923e, roughness: 0.7, metalness: 0.1 });
    M.paintWhite = std({ color: 0xe4e0d6, roughness: 0.75, metalness: 0 });
    M.magnetite = std({ color: 0x24221f, roughness: 0.55, metalness: 0.55 });
    // The core in the boxes: red jasper and grey iron oxide, as the beds are.
    M.coreJasper = std({ color: 0x8a3a2a, roughness: 0.6, metalness: 0.05 });
    M.coreIron = std({ color: 0x4a4a50, roughness: 0.45, metalness: 0.5 });
    // The seam's ores: manganese at three charges is three colours.
    M.orePink = std({ color: 0xb87a78, roughness: 0.85, metalness: 0 });
    M.oreBrown = std({ color: 0x5a3a24, roughness: 0.85, metalness: 0.1 });
    M.oreBlack = std({ color: 0x1e1c1c, roughness: 0.7, metalness: 0.3 });
    M.butte = std({ color: 0x2a2626, roughness: 0.8, metalness: 0.2 });
    M.wetRock = std({ color: 0x2a1c18, roughness: 0.25, metalness: 0.05 });
    // Liquids are dark, opaque and lie level.
    M.water = std({ color: 0x2e3a38, roughness: 0.08, metalness: 0, envMapIntensity: 1.1 });
    M.leach = std({ color: 0x1f3070, roughness: 0.12, metalness: 0, envMapIntensity: 1.0 });
    M.sampleGreen = std({ color: 0x3f6a3a, roughness: 0.15, metalness: 0 });
    M.sampleAmber = std({ color: 0x9a6a1c, roughness: 0.15, metalness: 0 });
    M.sampleViolet = std({ color: 0x5a3a6a, roughness: 0.15, metalness: 0 });
    M.samplePink = std({ color: 0xb08a8a, roughness: 0.15, metalness: 0 });
    M.sampleClear = std({ color: 0xbfc4c0, roughness: 0.1, metalness: 0 });
    M.glass = std({ color: 0xd5dfe8, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1216, roughness: 0.18, metalness: 0.2 });
    // THE ONE CLEAN THING: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe6e8ee, roughness: 0.48, metalness: 0.25 });
    M.caseDark = std({ color: 0x262b33, roughness: 0.55, metalness: 0.4 });
    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5c4a34, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /* ------------------------------------------------------------ light and sky */

  initLighting() {
    const { key, hemi } = createLsLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = LSSKY.horizon.clone();
    const env = createLsEnvironment(this.renderer);
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

  /** The ground mesh, the canyon's faces and the alcoves' roofs: all GROUND, all the banded rock. */
  initTerrain() {
    const ground = this.own(buildGroundGeometry(this.field, this.plan));
    this.terrainMesh = new THREE.Mesh(ground, this.M.rock);
    this.terrainMesh.name = 'lodestone-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    const rock = new THREE.Group();
    rock.name = 'canyon-rock';
    rock.userData.phys = 'ground';
    rock.userData.noMerge = true;
    const faces = new THREE.Mesh(this.own(buildFaceGeometry(this.field, this.plan)), this.M.rock);
    faces.name = 'canyon-faces';
    faces.castShadow = faces.receiveShadow = this.t4;
    rock.add(faces);
    for (const geo of buildRoofGeometries(this.plan)) {
      const m = new THREE.Mesh(this.own(geo), this.M.rock);
      m.name = `roof-${geo.userData.alcove}`;
      m.castShadow = m.receiveShadow = this.t4;
      rock.add(m);
    }
    this.scene.add(rock);
    this.rock = rock;
  }

  /** The lamps, the Coil's cable and yard, the rockfall, the far country. */
  initPlant() {
    this.plantColliders = [];
    for (const build of PLANT.PLANT_BUILDERS) {
      const node = build(this);
      if (!node) continue;
      this.scene.add(node);
      for (const c of node.userData.colliders || []) this.plantColliders.push(c.minX !== undefined ? { ...c } : { x: c.x, z: c.z, radius: c.r });
    }
  }

  /** The hollow: the pad and the lamps from the spawn to the cleft. */
  initLandmarks() {
    const ctx = this.ctx;
    let posts = 0;
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      const y = this.getTerrainHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      if (lm.asset === 'lamp-post') node = PLANT.buildLampPost(ctx, posts++);
      else if (lm.asset === 'landing-pad') node = PLANT.buildLandingPad(ctx, this.field);
      if (!node) continue;
      node.position.set(lm.pos[0], lm.asset === 'landing-pad' ? 0 : y, lm.pos[2]);
      if (!SELF_TURNED.has(lm.asset)) node.rotation.y = lm.rotY || 0;
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
    }
  }

  /**
   * The way on foot from where the player stands to a site's approach mark, as a list of [x, z]: down (or up) the
   * canyon along its centre line, bend by bend, and in at the alcove's mouth. The guide arrow follows it.
   */
  routeTo(siteId, fromPos, toPos = null) {
    const site = this.data.sites.find(s => s.id === siteId);
    if (!site) return null;
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.z];
    const to = toPos ? [toPos[0], 0, toPos[1]] : site.approachPos;
    return this.plan.routeTo(from[0], from[from.length === 3 ? 2 : 1], to[0], to[2]);
  }

  /* ------------------------------------------------------------ the sites */

  /** Which way a site faces: toward the floor a player walks in on, derived from `approachPos`. */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    return Math.hypot(ax, az) < 0.01 ? 0 : Math.atan2(ax, az);
  }

  /** Build every host in its alcove, turned to face its approach. The bench is a part of its host, one object. */
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
      // Every alcove faces along an axis, so a host turns by a quarter turn and its box colliders stay boxes, exactly.
      const quarter = Math.abs(Math.round(g.rotation.y / (Math.PI / 2)) * (Math.PI / 2) - g.rotation.y) < 1e-6;
      for (const c of host.colliders) {
        if (c.r !== undefined) { const [x, z] = at(c.lx, c.lz); this.siteColliders.push({ x, z, radius: c.r }); continue; }
        if (quarter) {
          const pts = [[c.lx - c.hw, c.lz - c.hd], [c.lx + c.hw, c.lz + c.hd]].map(([a, b]) => at(a, b));
          this.siteColliders.push({ minX: Math.min(pts[0][0], pts[1][0]), maxX: Math.max(pts[0][0], pts[1][0]), minZ: Math.min(pts[0][1], pts[1][1]), maxZ: Math.max(pts[0][1], pts[1][1]) });
          continue;
        }
        const long = Math.max(c.hw, c.hd), short = Math.min(c.hw, c.hd);
        const n = Math.max(1, Math.ceil((long * 2) / (short * 1.3)));
        const step = n > 1 ? (long * 2 - short * 2) / (n - 1) : 0;
        for (let i = 0; i < n; i++) {
          const o = n > 1 ? -long + short + i * step : 0;
          const [x, z] = c.hw >= c.hd ? at(c.lx + o, c.lz) : at(c.lx, c.lz + o);
          this.siteColliders.push({ x, z, radius: short });
        }
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

  /** THE WORK LAMPS SHARE THREE LIGHTS: only the lamps round the player need a real light at all (lamp-pool.js). */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
  }

  /** WHAT NEVER MOVES IS BAKED. The cased instruments, the indicators and the drip stay their own meshes. */
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

  /** The walk's edge (every cell along it), the pad's lamps, the plant and every host's machinery. */
  buildColliders() {
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }
    this.edgeColliders = this.plan.edgeColliders();
    for (const c of this.edgeColliders) this.colliders.push(c);
    for (const c of this.plantColliders) this.colliders.push(c);
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /**
   * THE SUN ONLY ON THE UPPER WALLS. The mask takes the sun and part of the sky out of the canyon, the pothole and the
   * alcoves below their rims. A deployed instrument arrives later with materials of its own; `update` covers it.
   */
  initCover() {
    this.cover = makeCover({ sun: LODESTONE_SUN, ...this.plan.coverSpec() });
    this.cover.applyTo(this.scene);
  }

  /* ------------------------------------------------------------ frame */

  update(delta, cameraPos) {
    this.crew?.update(delta, cameraPos);
    this.elapsed += delta;
    lsSkyUniforms.uLsTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followLsShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
    if ((this._coverTick = ((this._coverTick ?? 0) + 1) % 10) === 0) this.cover.applyTo(this.scene);
    for (const m of this.movers) m.update(this.elapsed);
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
