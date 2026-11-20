/**
 * cinderhalo.js — Cinder Halo, Learn world 14 (nuclear chemistry), as a place you walk (T4).
 *
 * A field of impact craters punched into a plain of black cinder. The walk goes down into them one by one, through cuttings in their
 * rims, spiralling in to the great crater, where the Fifth's reactor, the Transmutation Core, stands split open on a floor of fused glass.
 * Each of the six small craters holds a shielded concrete cell at its back, entered by a dog-leg, with a Learn bench built into it.
 * Ground, cells, wall colliders and cover boxes all come from the one plan in `cinderhalo/site-plan.js`.
 *
 * Implements the walkable Learn world contract:
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 */

import * as THREE from 'three';
import cinderData from './world-data/cinderhalo.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic } from './materials/pbr-kit.js';
import { depotConcrete, haulRoad } from './materials/lodestone-textures.js';
import { cinderRoad } from './materials/ember-textures.js';
import { createChSkyDome, createChLights, followChShadow, createChEnvironment, chSkyUniforms, followCamera, CHSKY, CINDER_SUN } from './cinderhalo/atmosphere.js';
import { makeCinderField, buildCinderTerrainGeometry } from './cinderhalo/terrain.js';
import { wallColliders, coverBoxes } from './cinderhalo/site-plan.js';
import { makeCover } from './lib/cover.js';
import { buildLampPost, buildLandingPad, buildCore, buildVista } from './cinderhalo/plant.js';
import { yawPoint } from './ember/kit.js';
import { HOST_BUILDERS } from './cinderhalo/stations.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';
import { attachCrew } from './npc/attach.js';

const FILAMENT = 0xe8a440;
const SELF_TURNED = new Set(['lamp-post', 'landing-pad']);
const SHADOW_FOLLOW_STEP = 2;

const BUILDERS = { 'transmutation-core': buildCore };

export class CinderHaloWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.data = cinderData;
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

    this.field = makeCinderField();
    this.coverBoxes = coverBoxes();

    this.initMaterials();
    this.initLighting();
    this.sky = createChSkyDome(900);
    this.scene.add(this.sky);
    this.initTerrain();
    this.initLandmarks();
    this.initHosts();
    this.initVista();
    this.initLampPool();
    this.bakeStatics();
    this.buildColliders();
    this.enableAmbientOcclusion();
    this.initCover();
    // The people who work here, walking their rounds (`npc/attach.js`, `src/npc/crews/cinderhalo.js`).
    this.crew = attachCrew(this, 'cinderhalo');
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
    M.concrete = buildMaterial(depotConcrete({ size: texSize(512), seed: 41 }), { repeat: 1, roughness: 1.0 });
    M.concreteDark = buildMaterial(depotConcrete({ size: texSize(512), seed: 43 }), { repeat: 1, roughness: 1.0 });
    M.concreteDark.color = new THREE.Color(0x8d8a86);
    M.concreteShell = buildMaterial(depotConcrete({ size: texSize(256), seed: 47 }), { repeat: 2, roughness: 1.0 });
    M.concreteShell.side = THREE.DoubleSide;
    M.stone = M.concrete;
    M.catwalk = buildMaterial(haulRoad({ size: texSize(512), seed: 13 }), { repeat: 3, roughness: 1.0 });
    M.cinderRock = std({ color: 0x1d1a18, roughness: 1.0, metalness: 0 });

    M.steel = metal('#7d8792', '#646e78', '#5c4d3e', 101, 0.4, 2, 512);
    M.darkSteel = metal('#333942', '#444c57', '#4a3d33', 103, 0.5, 4);
    M.rusted = metal('#78523d', '#58483e', '#86482b', 107, 0.8, 3);
    M.benchTop = metal('#7c8c94', '#657680', '#485a64', 109, 0.35, 3);
    M.drum = metal('#4f5a52', '#59604f', '#6b4a32', 111, 0.6, 2);
    M.drumYellow = metal('#9a7b2e', '#7a6a3c', '#6b4a32', 113, 0.7, 2);
    M.cask = metal('#8e918f', '#76797a', '#5a4c40', 117, 0.45, 1, 512);
    M.magnet = metal('#6a3a2c', '#5a4038', '#4a3a30', 119, 0.4, 1);
    M.lead = std({ color: 0x4b4f56, roughness: 0.75, metalness: 0.55 });
    M.alu = std({ color: 0x9aa3ab, roughness: 0.45, metalness: 0.85 });
    M.paper = std({ color: 0xcfc6ae, roughness: 0.95, metalness: 0 });
    M.copper = std({ color: 0xb66e43, roughness: 0.42, metalness: 0.9 });
    M.brass = std({ color: 0xb8944f, roughness: 0.42, metalness: 0.9 });
    M.water = std({ color: 0x1c2a2c, roughness: 0.08, metalness: 0.1 });
    M.glassDark = std({ color: 0x0f1216, roughness: 0.18, metalness: 0.2 });
    M.case = std({ color: 0xe6e8ee, roughness: 0.48, metalness: 0.25 });
    M.caseDark = std({ color: 0x262b33, roughness: 0.55, metalness: 0.4 });
    M.amber = std({ color: 0xd98a2b, roughness: 0.45, metalness: 0.25 });
    M.lantern = std({ color: 0x5c4a34, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  initLighting() {
    const { key, hemi } = createChLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    const amb = this.data.ambience || { fogColor: 0xcbc1b2, fogNear: 70, fogFar: 460 };
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = CHSKY.horizon.clone();
    const env = createChEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.85;
    }
  }

  /** INSIDE IS DARK: the mask takes the sun and the sky out of every cell and vestibule, on a phone too (`lib/cover.js`). */
  initCover() {
    this.cover = makeCover({ sun: CINDER_SUN, boxes: this.coverBoxes });
    this.cover.applyTo(this.scene);
  }

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const cinder = buildMaterial(cinderRoad({ size: texSize(512), seed: 61 }), { repeat: 1, roughness: 1.0 });
    cinder.vertexColors = true;
    cinder.color = new THREE.Color(0xffffff);
    cinder.normalScale?.set(1.3, 1.3);
    cinder.envMapIntensity = 0.4;
    for (const t of cinder.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(cinder);

    const geo = this.own(buildCinderTerrainGeometry());
    this.terrainMesh = new THREE.Mesh(geo, cinder);
    this.terrainMesh.name = 'cinderhalo-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);
  }

  /** The far country: merged once, apart from the loose cable, which swings. */
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
        // A cell faces along an axis, so its box colliders stay boxes (a row of discs would leave the corners walkable).
        const pts = [at(c.lx - c.hw, c.lz - c.hd), at(c.lx + c.hw, c.lz + c.hd)];
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
   * The guide's way to a bench from where the player stands: the plan's route (down each cutting, round each crater's floor in front of
   * its cell, in through the dog-leg), joined at the point of it nearest the player, so the arrow never points through rock or a wall.
   */
  routeTo(siteId, fromPos, toPos = null) {
    const site = this.data.sites.find(s => s.id === siteId);
    const R = site?.route || (siteId === 'arena' ? this.data.arenaRoute : null);
    if (!R) return null;
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.z];
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
    // The crater walls: a chain round every floor and cutting, so nobody climbs out of the walk.
    this.walls = wallColliders();
    for (const c of this.walls) this.colliders.push(c);
  }

  update(delta, cameraPos) {
    this.crew?.update(delta, cameraPos);
    this.elapsed += delta;
    chSkyUniforms.uChTime.value = this.elapsed;
    for (const node of this.animated) node.userData.animate(this.elapsed);
    for (const b of this.vistaMovers || []) b.rotation.z = Math.sin(this.elapsed * 0.45 + b.userData.phase) * 0.18;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followChShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
    // A deployed instrument arrives after the world with materials of its own: the mask goes on whatever has come since.
    if ((this._coverTick = ((this._coverTick ?? 0) + 1) % 10) === 0) this.cover.applyTo(this.scene);
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
    this.animated = [];
  }
}
