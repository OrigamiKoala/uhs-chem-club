/**
 * lodestone.js — Lodestone, Learn world 12 (the transition metals), as a place you walk (T4).
 *
 * An iron canyon under a rust dusk: the Fifth's drum depot along the haul road down the canyon floor, six working points either side of it,
 * and the bowl at the canyon's foot where the Coil stands. The walls are rock nobody climbs: a chain of colliders runs along each wall's foot.
 *
 * Implements the walkable Learn world contract:
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 */

import * as THREE from 'three';
import lodestoneData from './world-data/lodestone.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic } from './materials/pbr-kit.js';
import { canyonGravel, haulRoad, depotConcrete } from './materials/lodestone-textures.js';
import {
  createLsSkyDome, createLsLights, followLsShadow, createLsEnvironment, lsSkyUniforms, followCamera, LSSKY
} from './lodestone/atmosphere.js';
import { makeLodestoneField, buildLodestoneTerrainGeometry, buildRibbon, buildDisc, wallColliders } from './lodestone/terrain.js';
import { buildDrumStack, buildOreHeap, buildLodeBoulder, buildCoilMast, buildLampPost, buildLandingPad } from './lodestone/plant.js';
import { yawPoint } from './ember/kit.js';
import { HOST_BUILDERS } from './lodestone/stations.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

const FILAMENT = 0xe8a440;
const SELF_TURNED = new Set(['lamp-post', 'landing-pad', 'ore-heap', 'lode-boulder', 'coil-mast']);
const SHADOW_FOLLOW_STEP = 2;

const BUILDERS = {
  'drum-stack': buildDrumStack,
  'ore-heap': buildOreHeap,
  'lode-boulder': buildLodeBoulder,
  'coil-mast': buildCoilMast
};

export class LodestoneWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.data = lodestoneData;
    this.colliders = [];
    this.disposables = [];
    this.lamps = [];
    this.siteMarkers = new Map();
    this.benchAnchors = new Map();
    this.siteColliders = [];
    this.landmarkNodes = [];
    this.animated = [];
    this.elapsed = 0;
    this.benchesOpen = 0;
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.field = makeLodestoneField(this.data);

    this.initMaterials();
    this.initLighting();
    this.sky = createLsSkyDome(900);
    this.scene.add(this.sky);
    this.initTerrain();
    this.initLandmarks();
    this.initHosts();
    this.initLampPool();
    this.bakeStatics();
    this.buildColliders();
    this.enableAmbientOcclusion();
  }

  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  get ctx() {
    return { M: this.M, own: (...o) => this.own(...o), lamps: this.lamps, t4: this.t4, field: this.field };
  }

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

  initMaterials() {
    const M = {};
    const std = o => new THREE.MeshStandardMaterial(o);
    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256) => {
      const m = buildMaterial(platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 2, roughness: 1.0 });
      m.normalScale.set(1.2, 1.2);
      m.aoMapIntensity = 0.85;
      return m;
    };

    const stone = depotConcrete({ size: texSize(512), seed: 17 });
    M.concrete = buildMaterial(stone, { repeat: 1, roughness: 1.0 });
    M.stone = M.concrete;
    const road = haulRoad({ size: texSize(512), seed: 11 });
    M.catwalk = buildMaterial(road, { repeat: 3, roughness: 1.0 });
    M.road = buildMaterial(road, { repeat: 1, roughness: 1.0 });

    M.steel = metal('#7d8792', '#646e78', '#5c4d3e', 101, 0.35, 2, 512);
    M.darkSteel = metal('#333942', '#444c57', '#4a3d33', 103, 0.45, 4);
    M.rusted = metal('#78523d', '#58483e', '#86482b', 107, 0.75, 3);
    M.benchTop = metal('#7c8c94', '#657680', '#485a64', 109, 0.35, 3);
    M.copper = std({ color: 0xb66e43, roughness: 0.42, metalness: 0.9 });
    M.drumBlue = metal('#3d5a78', '#4a5560', '#7a4a30', 113, 0.55, 2);
    M.drumGreen = metal('#4d6a48', '#4a5560', '#7a4a30', 117, 0.55, 2);
    M.timber = std({ color: 0x5a4632, roughness: 0.9, metalness: 0 });
    M.ore = std({ color: 0x7a3e26, roughness: 0.95, metalness: 0.05 });
    M.magnetite = std({ color: 0x24221f, roughness: 0.55, metalness: 0.55 });
    M.brass = std({ color: 0xb8944f, roughness: 0.42, metalness: 0.9 });
    M.amber = std({ color: 0xd98a2b, roughness: 0.45, metalness: 0.25 });
    M.paint = std({ color: 0xd6d9de, roughness: 0.65, metalness: 0.05 });
    M.glass = std({ color: 0xd5dfe8, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false });
    M.glassDark = std({ color: 0x0f1216, roughness: 0.18, metalness: 0.2 });
    M.case = std({ color: 0xe6e8ee, roughness: 0.48, metalness: 0.25 });
    M.caseDark = std({ color: 0x262b33, roughness: 0.55, metalness: 0.4 });
    M.lantern = std({ color: 0x5c4a34, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  initLighting() {
    const { key, hemi } = createLsLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    const amb = this.data.ambience || { fogColor: 0x3a2620, fogNear: 70, fogFar: 300 };
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = LSSKY.horizon.clone();
    const env = createLsEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.75;
    }
  }

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const basalt = buildMaterial(canyonGravel({ size: texSize(512), seed: 41 }), { repeat: 1, roughness: 1.0 });
    basalt.vertexColors = true;
    basalt.normalScale.set(1.25, 1.25);
    basalt.envMapIntensity = 0.45;
    for (const t of basalt.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(basalt);

    const geo = this.own(buildLodestoneTerrainGeometry(this.field));
    this.terrainMesh = new THREE.Mesh(geo, basalt);
    this.terrainMesh.name = 'lodestone-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    const ribbons = this.data.roads.map(r => buildRibbon(this.field, r.pts, r.width ?? r.w));
    ribbons.push(buildDisc(this.field, this.data.arena.boss[0], this.data.arena.boss[2], 12.0));
    const g = new THREE.Group();
    g.name = 'lodestone-roads';
    g.userData.phys = 'ground';
    this.M.road.polygonOffset = true;
    this.M.road.polygonOffsetFactor = -2;
    this.M.road.polygonOffsetUnits = -2;
    for (const geo2 of ribbons) {
      const m = new THREE.Mesh(this.own(geo2), this.M.road);
      m.renderOrder = 1;
      m.receiveShadow = this.t4;
      m.userData.noWeather = true;
      g.add(m);
    }
    this.scene.add(g);
  }

  initLandmarks() {
    const ctx = this.ctx;
    let seed = 1;
    let posts = 0;
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      const y = this.getTerrainHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      if (lm.asset === 'lamp-post') node = buildLampPost(ctx, posts++);
      else if (lm.asset === 'landing-pad') node = buildLandingPad(ctx, this.field);
      else if (BUILDERS[lm.asset]) node = BUILDERS[lm.asset](ctx, lm, seed++);
      if (!node) continue;
      node.position.set(lm.pos[0], lm.asset === 'landing-pad' ? 0 : y, lm.pos[2]);
      if (!SELF_TURNED.has(lm.asset)) node.rotation.y = lm.rotY || 0;
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
      if (node.userData.animate) this.animated.push(node);
    }
  }

  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    return Math.hypot(ax, az) < 0.01 ? 0 : Math.atan2(ax, az);
  }

  initHosts() {
    for (const site of this.data.sites) {
      const build = HOST_BUILDERS[site.id];
      if (!build) continue;
      const host = build(this);
      const g = host.group;
      g.position.set(site.pos[0], this.getTerrainHeight(site.pos[0], site.pos[2]), site.pos[2]);
      g.rotation.y = this.siteFacing(site);
      this.scene.add(g);

      this.siteMarkers.set(site.questId, { site, group: g, indicator: host.bench.indicator });
      this.registerBenchAnchor(site, g, host.bench, host.benchLocal);

      const cos = Math.cos(g.rotation.y), sin = Math.sin(g.rotation.y);
      const at = (lx, lz) => [g.position.x + lx * cos + lz * sin, g.position.z - lx * sin + lz * cos];
      for (const c of host.colliders) {
        if (c.r !== undefined) {
          const [x, z] = at(c.lx, c.lz);
          this.siteColliders.push({ x, z, radius: c.r });
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
      dormant: bench.dormant,
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

  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

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
    this.staticMerge = this.renderer ? consolidateStatic(this.scene) : null;
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  buildColliders() {
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }
    for (const c of this.siteColliders) this.colliders.push(c);
    // The canyon walls: a chain along each wall's foot and across both ends, so the rock is never climbed.
    this.wallColliders = wallColliders();
    for (const c of this.wallColliders) this.colliders.push(c);
  }

  update(delta, cameraPos) {
    this.elapsed += delta;
    lsSkyUniforms.uLsTime.value = this.elapsed;
    for (const node of this.animated) node.userData.animate(this.elapsed);
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followLsShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
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
    this.animated = [];
  }
}
