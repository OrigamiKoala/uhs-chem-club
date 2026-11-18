/**
 * ember.js — Ember Reach, Learn world 05, as a place you walk (T4).
 *
 * The inside wall of a volcanic caldera stepping down 20 m in a four-ramp switchback toward a
 * crusted lava lake 20 m below the lowest terrace. Six geothermal workings are hollowed into the
 * cliff face behind the switchback legs with their north side open to the caldera drop; the
 * turbine hall stands at the foot beside the Crucible's arena and the railed caldera overlook.
 *
 * Public contract (identical across all walkable Learn worlds):
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool, cover,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 */

import * as THREE from 'three';
import emberData from './world-data/ember.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic, asColorTexture
} from './materials/pbr-kit.js';
import {
  sinterCrust, blackGlass, sulphurCrust, ventConcrete, lavaCrust, springRipple
} from './materials/ember-textures.js';
import {
  createErSkyDome, createErLights, followErShadow, createErEnvironment, erSkyUniforms, followCamera, ERSKY, EMBER_SUN
} from './ember/atmosphere.js';
import { makeCalderaPlan, LAKE_Y, LEVEL } from './ember/caldera-plan.js';
import {
  buildEmberTerrainGeometry, buildLakeGeometry, buildCalderaShells
} from './ember/terrain.js';
import {
  buildFumarole, buildSulphurMound, buildMudPot, buildGeyser, buildSinterTerrace, buildLavaLobe,
  buildProbeStake
} from './ember/field.js';
import {
  buildWellhead, buildSeparator, buildSilencerPair, buildCoolingCells, buildTransformer,
  buildPylon, buildCommsMast, buildLandingPad, buildHabitat, buildSiphonManifold,
  buildLampPost, buildPipes, buildPowerLines
} from './ember/plant.js';
import { yawPoint } from './ember/kit.js';
import { HOST_BUILDERS } from './ember/stations.js';
import { createEmberEffects } from './ember/effects.js';
import { LampPool } from './lamp-pool.js';
import { makeCover } from './lib/cover.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every work lamp in the world burns. */
const FILAMENT = 0xd99423;

/** Landmarks that are round, or turn themselves: their group is never turned. */
const SELF_TURNED = new Set(['lamp-post', 'fumarole', 'sulfur-mound', 'mud-pot', 'geyser', 'sinter-terrace', 'lava-lobe', 'probe-stake']);

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

export class EmberReachWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = emberData;
    this.scene = new THREE.Scene();
    this.scene.name = 'ember';

    this.colliders = [];
    this.siteMarkers = new Map();
    this.benchAnchors = new Map();
    this.disposables = [];
    this.lamps = [];
    this.vents = [];
    this.movers = [];
    this.landmarkNodes = [];
    this.geyserVent = null;
    this.elapsed = 0;
    this.benchesOpen = 0;
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.plan = makeCalderaPlan();
    this.field = this.plan;

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initLandmarks();
    this.initPlant();
    this.initHosts();
    this.initEffects();
    this.initLampPool();
    this.initCover();
    this.bakeStatics();
    this.buildColliders();
    this.collectMovers();
    this.enableAmbientOcclusion();
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

    M.sinter = buildMaterial(sinterCrust({ size: texSize(512), seed: 8 }), { repeat: 2, roughness: 1.0 });
    M.sinter.normalScale.set(1.3, 1.3);
    M.sinterWarm = M.sinter.clone();
    M.sinterWarm.color.set(0xdcc29e);
    M.sinterWet = M.sinter.clone();
    M.sinterWet.color.set(0x8c8172);
    M.sinterWet.roughness = 0.42;
    M.sulphur = buildMaterial(sulphurCrust({ size: texSize(256), seed: 5 }), { repeat: 2, roughness: 1.0 });
    M.sulphurPale = std({ color: 0xeadc98, roughness: 0.6, metalness: 0 });
    M.rock = buildMaterial(blackGlass({ size: texSize(512), seed: 11 }), { repeat: 2, roughness: 0.92 });
    M.rock.normalScale.set(1.2, 1.2);
    M.rock.envMapIntensity = 0.9;
    M.concrete = buildMaterial(ventConcrete({ size: texSize(512), seed: 9 }), { repeat: 2, roughness: 1.0 });

    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256) => buildMaterial(
      platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 2, roughness: 1.0 }
    );
    M.clad = metal('#c4c7c5', '#a3a8a8', '#8b7a62', 81, 0.3, 2, 512);
    M.steel = metal('#8b9184', '#727a70', '#7d5f45', 83, 0.45, 2, 512);
    M.darkSteel = metal('#3c403b', '#555a54', '#6b5442', 85, 0.5, 4);
    M.rusted = metal('#6a4a36', '#5b4b40', '#7a4a2a', 87, 0.85, 3);
    M.livery = metal('#2c2830', '#4a4650', '#5a4a40', 89, 0.22, 3);
    M.hallWall = metal('#9c917d', '#867d6e', '#765b44', 91, 0.5, 3, 512);
    M.hallRoof = metal('#63564a', '#5a5046', '#745136', 93, 0.62, 4);
    M.roofSheet = metal('#7a6e62', '#6a6157', '#7d5236', 95, 0.7, 5);
    M.perf = metal('#4a4c48', '#5d605a', '#6e5440', 97, 0.55, 6);
    M.habShell = metal('#c9c2b2', '#a9a395', '#8a7258', 99, 0.42, 3);
    M.crate = metal('#6e7a5c', '#5f6a52', '#7a5a40', 101, 0.5, 2);
    M.crateB = metal('#8a6d45', '#75603f', '#6a4a30', 103, 0.55, 2);
    for (const m of [M.clad, M.steel, M.darkSteel, M.rusted, M.livery, M.hallWall, M.hallRoof, M.roofSheet, M.perf, M.habShell, M.crate, M.crateB]) {
      m.normalScale.set(1.2, 1.2);
      m.aoMapIntensity = 0.85;
    }

    M.brass = std({ color: 0xb08d4c, roughness: 0.42, metalness: 0.9 });
    M.copper = std({ color: 0xb06a43, roughness: 0.45, metalness: 0.9 });
    M.rubber = std({ color: 0x1c1a1a, roughness: 0.9, metalness: 0 });
    M.insul = std({ color: 0xd9d4c6, roughness: 0.82, metalness: 0.05 });
    M.timber = std({ color: 0x5e4a36, roughness: 0.95, metalness: 0 });
    M.mud = std({ color: 0x77706a, roughness: 0.32, metalness: 0 });
    M.clay = std({ color: 0x9c958a, roughness: 0.92, metalness: 0 });
    M.pool = std({ color: 0x4f908e, roughness: 0.08, metalness: 0, envMapIntensity: 1.4 });
    M.rime = std({ color: 0xe6eef4, roughness: 0.5, metalness: 0 });
    M.brick = std({ color: 0x864a37, roughness: 0.92, metalness: 0 });
    M.drum = std({ color: 0x3d5a6e, roughness: 0.6, metalness: 0.5 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintYellow = std({ color: 0xc9a14a, roughness: 0.7, metalness: 0.1 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe8e2d4, roughness: 0.6, metalness: 0 });

    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1214, roughness: 0.18, metalness: 0.2 });
    M.mesh = std({ color: 0x2f302d, roughness: 0.8, metalness: 0.5, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });

    M.case = std({ color: 0xe9e4d6, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2f333a, roughness: 0.55, metalness: 0.4 });
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    const ripple = buildMaterial(springRipple({ size: texSize(256), seed: 17 }), { repeat: 3, roughness: 0.06 });
    ripple.map?.dispose();
    ripple.map = null;
    ripple.userData.surfaceMaps = [ripple.normalMap].filter(Boolean);
    ripple.color = new THREE.Color(0x3f888b);
    ripple.metalness = 0;
    ripple.envMapIntensity = 1.4;
    ripple.normalScale.set(0.35, 0.35);
    M.water = ripple;

    const lava = lavaCrust({ size: texSize(512), seed: 13 });
    M.magma = buildMaterial(lava, { repeat: 2, roughness: 1.0 });
    M.magma.emissiveMap = this.own(asColorTexture(lava.emission, 2));
    M.magma.emissive = new THREE.Color(0xffffff);
    M.magma.emissiveIntensity = 1.6;
    M.magma.userData.surfaceMaps.push(M.magma.emissiveMap);

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /* ======================================================================
     LIGHT AND SKY
     ====================================================================== */

  initLighting() {
    const { key, hemi, glow } = createErLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi, glow);
    holdShadowUntilAsked(this.scene, key);

    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = ERSKY.horizon.clone();

    const env = createErEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.8;
    }
  }

  initSky() {
    this.sky = createErSkyDome(900);
    this.scene.add(this.sky);
  }

  /* ======================================================================
     TERRAIN, SHELLS AND LAVA LAKE
     ====================================================================== */

  getTerrainHeight(x, z) {
    return this.plan.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const crust = buildMaterial(sinterCrust({ size: texSize(512), seed: 7 }), { repeat: 1, roughness: 1.0 });
    crust.vertexColors = true;
    crust.normalScale.set(1.35, 1.35);
    crust.envMapIntensity = 0.7;
    for (const t of crust.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(crust);

    const geo = this.own(buildEmberTerrainGeometry(this.plan, this.data));
    this.terrainMesh = new THREE.Mesh(geo, crust);
    this.terrainMesh.name = 'ember-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    // Room shells, retaining walls, kerbs and lake-facing railings.
    this.shells = buildCalderaShells(this.ctx, this.plan);
    this.scene.add(this.shells);

    // The lava lake lying flat in the caldera floor 20 m below Level 4.
    const L = this.data.lake;
    const lake = new THREE.Mesh(this.own(buildLakeGeometry(L)), this.M.magma);
    lake.name = 'ember-lava-lake';
    lake.position.set(L.x, LAKE_Y, L.z);
    lake.userData.phys = 'ground';
    lake.userData.noWeather = true;
    this.scene.add(lake);
    this.lakeMesh = lake;
  }

  /* ======================================================================
     LANDMARKS & PLANT
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
        case 'fumarole': node = buildFumarole(ctx, lm, seed++); break;
        case 'sulfur-mound': node = buildSulphurMound(ctx, lm, seed++); break;
        case 'mud-pot': node = buildMudPot(ctx, lm, seed++); break;
        case 'geyser': node = buildGeyser(ctx, lm, seed++); break;
        case 'sinter-terrace': node = buildSinterTerrace(ctx, lm, seed++); break;
        case 'lava-lobe': node = buildLavaLobe(ctx, lm, seed++); break;
        case 'probe-stake': node = buildProbeStake(ctx, lm, seed++); break;
        case 'wellhead': node = buildWellhead(ctx); break;
        case 'separator': node = buildSeparator(ctx); break;
        case 'silencer-pair': node = buildSilencerPair(ctx); break;
        case 'cooling-cells': node = buildCoolingCells(ctx); break;
        case 'transformer': node = buildTransformer(ctx); break;
        case 'pylon': node = buildPylon(ctx); break;
        case 'comms-mast': node = buildCommsMast(ctx); break;
        case 'landing-pad': node = buildLandingPad(ctx, this.plan); break;
        case 'habitat': node = buildHabitat(ctx); break;
        case 'siphon-manifold': node = buildSiphonManifold(ctx); break;
        case 'lamp-post': node = buildLampPost(ctx, posts++); break;
        default: node = null;
      }
      if (!node) continue;
      // Landing pad sits on Level 0 (its geometry adds PAD_TOP on top of its y origin).
      const py = lm.asset === 'landing-pad' ? LEVEL[0] : y;
      node.position.set(lm.pos[0], py, lm.pos[2]);
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
      if (node.userData.geyser) {
        const v = node.userData.geyser;
        const [dx, dz] = yawPoint(v.x, v.z, rot);
        this.geyserVent = { x: lm.pos[0] + dx, y: y + v.y, z: lm.pos[2] + dz };
      }
    }
  }

  initPlant() {
    const pipes = buildPipes(this.ctx, this.data.pipes, this.plan);
    this.scene.add(pipes.group);
    this.pipeColliders = pipes.colliders;

    this.scene.updateMatrixWorld(true);
    const attachOf = name => this.landmarkNodes.filter(e => e.lm.asset === name);
    const toWorld = (node, pts) => pts.map(p => new THREE.Vector3(...p).applyMatrix4(node.matrixWorld));
    const chain = [];
    const tx = attachOf('transformer')[0];
    if (tx) chain.push(toWorld(tx.node, tx.node.userData.attach));
    for (const e of attachOf('pylon').sort((a, b) => (a.lm.line ?? 0) - (b.lm.line ?? 0))) {
      chain.push(toWorld(e.node, e.node.userData.attach));
    }
    if (chain.length >= 2) this.scene.add(buildPowerLines(this.ctx, chain));
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

      for (const c of host.colliders) {
        if (c.r !== undefined) {
          const [x, z] = at(c.lx, c.lz);
          this.siteColliders.push({ x, z, radius: c.r });
          continue;
        }
        // Axis-aligned host facing N/S/E/W: emit exact AABB collider!
        const [p0x, p0z] = at(c.lx - c.hw, c.lz - c.hd);
        const [p1x, p1z] = at(c.lx + c.hw, c.lz + c.hd);
        this.siteColliders.push({
          minX: Math.min(p0x, p1x), maxX: Math.max(p0x, p1x),
          minZ: Math.min(p0z, p1z), maxZ: Math.max(p0z, p1z)
        });
      }
    }
  }

  registerBenchAnchor(site, group, bench, local) {
    const cos = Math.cos(group.rotation.y);
    const sin = Math.sin(group.rotation.y);
    const [lx, ly, lz] = local;
    this.benchAnchors.set(site.questId, {
      siteId: site.id,
      position: [
        group.position.x + lx * cos + lz * sin,
        group.position.y + (ly || 0),
        group.position.z - lx * sin + lz * cos
      ],
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

  /** Door-by-door guide route down the switchback and into any gallery (`lib/workings.js`). */
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
    const D = this.data;
    const fume = [];
    const L = D.lake;
    for (const [fx, fz] of [[0, 0], [0.45, 0.2], [-0.45, -0.1], [0.2, -0.5], [-0.25, 0.45]]) {
      const x = L.x + fx * L.rx, z = L.z + fz * L.rz;
      fume.push({ x, y: D.floor.level + 0.5, z, size: 7, rise: 75, life: 34, rate: 0.9, tint: 1, alpha: 0.26, lean: 0.6 });
    }
    const C = D.cone;
    fume.push({ x: C.x, y: this.plan.height(C.x, C.z) + 26, z: C.z, size: 24, rise: 360, life: 70, rate: 1.4, tint: 0.55, alpha: 0.3, lean: 1.1 });
    this.effects = createEmberEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents: [...this.vents, ...this.hostVents, ...fume],
      geyser: this.geyserVent,
      spring: null
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
    this.cover = makeCover({ sun: EMBER_SUN, ...this.plan.coverSpec() });
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

  buildColliders() {
    // 1. Every wall, retaining edge and lake-facing railing from `caldera-plan.js` (`lib/workings.js`).
    for (const c of this.plan.wallColliders()) this.colliders.push(c);

    // 2. Landmark colliders.
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        if (c.minX !== undefined) {
          this.colliders.push({
            minX: lm.pos[0] + c.minX, maxX: lm.pos[0] + c.maxX,
            minZ: lm.pos[2] + c.minZ, maxZ: lm.pos[2] + c.maxZ
          });
          continue;
        }
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }

    // 3. Host machinery & bench colliders, plus pipe supports.
    for (const c of this.siteColliders) this.colliders.push(c);
    for (const c of this.pipeColliders) this.colliders.push(c);
  }

  /* ======================================================================
     FRAME
     ====================================================================== */

  update(delta, cameraPos) {
    this.elapsed += delta;
    erSkyUniforms.uErTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followErShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
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
      else if (m.kind === 'bubble') {
        const t = (this.elapsed * m.rate + m.phase) % 1;
        const s = t < 0.8 ? t / 0.8 : 0.01;
        o.scale.set(Math.max(0.01, s), Math.max(0.01, s * 0.8), Math.max(0.01, s));
      }
    }
    if (this.M.water.normalMap) this.M.water.normalMap.offset.set(this.elapsed * 0.006, this.elapsed * 0.004);
    if (this.M.magma.map) {
      const o = this.elapsed * 0.0012;
      this.M.magma.map.offset.set(o, o * 0.4);
      this.M.magma.emissiveMap.offset.set(o, o * 0.4);
      for (const t of [this.M.magma.normalMap, this.M.magma.roughnessMap, this.M.magma.aoMap]) t?.offset.set(o, o * 0.4);
      this.M.magma.emissiveIntensity = 1.55 + Math.sin(this.elapsed * 0.7) * 0.12 + Math.sin(this.elapsed * 2.3) * 0.05;
    }
    this.lanternMat.emissiveIntensity = 1.35 + Math.sin(this.elapsed * 1.3) * 0.1;
  }

  dispose() {
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
