/**
 * thornmere.js — Thornmere, Learn world 13 (organic chemistry), as a place you walk (T4).
 *
 * A drowned forest of stumps as wide as houses, standing on mounds of hardened pitch in a lake of tar. The walk is the mound tops and
 * the root ridges between them, a zigzag chain that climbs from the landing to the Fifth's gate; six of the mounds carry a room with a
 * Learn bench built into it. Everything lower than the shore is tar, closed by a chain of colliders. Ground, rooms and shore all come
 * from the one plan in `thornmere/site-plan.js`.
 *
 * Implements the walkable Learn world contract:
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 */

import * as THREE from 'three';
import thornmereData from './world-data/thornmere.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic } from './materials/pbr-kit.js';
import { depotConcrete, haulRoad } from './materials/lodestone-textures.js';
import { crackedPitch, ribbedBark } from './materials/thornmere-textures.js';
import {
  createTmSkyDome, createTmLights, followTmShadow, createTmEnvironment, tmSkyUniforms, followCamera, TMSKY
} from './thornmere/atmosphere.js';
import { makeThornmereField, buildThornmereTerrainGeometry } from './thornmere/terrain.js';
import { shoreColliders, coverBoxes } from './thornmere/site-plan.js';
import { createCover } from './thornmere/cover.js';
import { buildLampPost, buildLandingPad, buildCarapaceGate, buildTar, buildVista } from './thornmere/plant.js';
import { yawPoint } from './ember/kit.js';
import { HOST_BUILDERS } from './thornmere/stations.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

const FILAMENT = 0xe8a440;
const SELF_TURNED = new Set(['lamp-post', 'landing-pad']);
const SHADOW_FOLLOW_STEP = 2;

const BUILDERS = {
  'carapace-gate': buildCarapaceGate
};

export class ThornmereWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.data = thornmereData;
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

    this.field = makeThornmereField();
    this.cover = createCover(8);
    this.coverBoxes = coverBoxes();
    this.cover.set(this.coverBoxes);

    this.initMaterials();
    this.initLighting();
    this.sky = createTmSkyDome(900);
    this.scene.add(this.sky);
    this.initTerrain();
    this.initLandmarks();
    this.initHosts();
    this.initVista();
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

    const stone = depotConcrete({ size: texSize(512), seed: 29 });
    M.concrete = buildMaterial(stone, { repeat: 1, roughness: 1.0 });
    M.stone = M.concrete;
    M.catwalk = buildMaterial(haulRoad({ size: texSize(512), seed: 13 }), { repeat: 3, roughness: 1.0 });

    const bark = (tint, seed, repeat = 2) => {
      const m = buildMaterial(ribbedBark({ size: texSize(512), seed, tint }), { repeat, roughness: 1.0 });
      m.normalScale.set(1.4, 1.4);
      m.aoMapIntensity = 0.9;
      return m;
    };
    M.bark = bark(['#1c1814', '#57483a', '#786852'], 7);
    M.barkDark = bark(['#141210', '#3a322a', '#55493c'], 11);
    M.root = bark(['#2a241c', '#6e5d48', '#917e62'], 17, 1);
    M.barkShell = bark(['#1a1612', '#4a3e32', '#66584a'], 19, 3);
    M.barkShell.side = THREE.DoubleSide;

    M.steel = metal('#7d8792', '#646e78', '#5c4d3e', 101, 0.4, 2, 512);
    M.darkSteel = metal('#333942', '#444c57', '#4a3d33', 103, 0.5, 4);
    M.rusted = metal('#78523d', '#58483e', '#86482b', 107, 0.8, 3);
    M.benchTop = metal('#7c8c94', '#657680', '#485a64', 109, 0.35, 3);
    M.armour = metal('#8a8672', '#6c6a5e', '#4e4a40', 113, 0.3, 1, 512);
    M.armourDark = metal('#5e5c50', '#4e4c44', '#3a362e', 117, 0.4, 1);
    M.copper = std({ color: 0xb66e43, roughness: 0.42, metalness: 0.9 });
    M.brass = std({ color: 0xb8944f, roughness: 0.42, metalness: 0.9 });
    M.timber = std({ color: 0x5a4632, roughness: 0.9, metalness: 0 });
    M.timberDark = std({ color: 0x3c3024, roughness: 0.92, metalness: 0 });
    M.brick = std({ color: 0x6a4434, roughness: 0.95, metalness: 0 });
    M.pitch = std({ color: 0x141312, roughness: 0.35, metalness: 0.1 });
    M.tar = std({ color: 0x0b0b0a, roughness: 0.12, metalness: 0.0 });
    M.mirror = std({ color: 0xc4c8cc, roughness: 0.06, metalness: 1.0 });
    M.amber = std({ color: 0xd98a2b, roughness: 0.45, metalness: 0.25 });
    M.glass = std({ color: 0xd5dfe8, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false });
    M.glassDark = std({ color: 0x0f1216, roughness: 0.18, metalness: 0.2 });
    M.case = std({ color: 0xe6e8ee, roughness: 0.48, metalness: 0.25 });
    M.caseDark = std({ color: 0x262b33, roughness: 0.55, metalness: 0.4 });
    M.lantern = std({ color: 0x5c4a34, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    for (const m of Object.values(M)) {
      this.own(m);
      // Inside a room the sun and the sky do not reach: every lit material carries the cover mask.
      if (m !== M.lantern) this.cover.apply(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  initLighting() {
    const { key, hemi } = createTmLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    const amb = this.data.ambience || { fogColor: 0x8f9087, fogNear: 60, fogFar: 420 };
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = TMSKY.horizon.clone();
    const env = createTmEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.6;
    }
  }

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const pitch = buildMaterial(crackedPitch({ size: texSize(512), seed: 23 }), { repeat: 1, roughness: 1.0 });
    pitch.vertexColors = true;
    pitch.normalScale.set(1.3, 1.3);
    pitch.envMapIntensity = 0.5;
    this.cover.apply(pitch);
    for (const t of pitch.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(pitch);

    const geo = this.own(buildThornmereTerrainGeometry());
    this.terrainMesh = new THREE.Mesh(geo, pitch);
    this.terrainMesh.name = 'thornmere-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);
    this.scene.add(buildTar(this.ctx));
  }

  /** The far country: merged once, apart from the pump beams, which nod. */
  initVista() {
    const { group, movers } = buildVista(this.ctx);
    mergeStatic(group);
    group.userData.noMerge = true;
    this.scene.add(group);
    this.vistaMovers = movers;
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

  /**
   * The guide's way to a bench from where the player stands: the plan's route (ridge, round the mound's edge, in through the door),
   * joined at the point of it nearest the player, so the arrow never points across the tar or through a wall.
   */
  routeTo(siteId, fromPos, toPos = null) {
    const site = this.data.sites.find(s => s.id === siteId);
    if (!site?.route) return null;
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.z];
    const R = site.route;
    let best = { d: Infinity, i: 0, p: R[0] };
    for (let i = 0; i < R.length - 1; i++) {
      const [ax, az] = R[i]; const [bx, bz] = R[i + 1];
      const L2 = (bx - ax) ** 2 + (bz - az) ** 2 || 1;
      const t = Math.max(0, Math.min(1, ((from[0] - ax) * (bx - ax) + (from[1] - az) * (bz - az)) / L2));
      const p = [ax + (bx - ax) * t, az + (bz - az) * t];
      const d = Math.hypot(from[0] - p[0], from[1] - p[1]);
      if (d < best.d) best = { d, i, p };
    }
    const way = [[from[0], from[1]], best.p, ...R.slice(best.i + 1)];
    if (toPos) way[way.length - 1] = [toPos[0], toPos[toPos.length - 1]];
    return way;
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
    // The shore: a chain round every mound and ridge, so nobody walks into the tar.
    this.shore = shoreColliders();
    for (const c of this.shore) this.colliders.push(c);
  }

  update(delta, cameraPos) {
    this.elapsed += delta;
    tmSkyUniforms.uTmTime.value = this.elapsed;
    for (const node of this.animated) node.userData.animate(this.elapsed);
    for (const b of this.vistaMovers || []) b.rotation.x = Math.sin(this.elapsed * 0.5 + b.userData.phase) * 0.22;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followTmShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
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
