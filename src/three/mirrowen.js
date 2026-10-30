/**
 * mirrowen.js — Mirrowen, Learn world 06, as a place you walk (T4).
 *
 * A tidal shelf in the morning under a high white haze. A round harbour basin lies at the middle of
 * it, grey-green and still, and a canal sixteen metres across runs out of it to the north. Seven
 * working points of the harbour stand on a ring round the basin, each with a bench built into it: an
 * ice-breaker's chart house, a bay of the tank farm, the pumping station, the yard where canal ice is
 * cut, the boiler house, a dosing station and the distillery. Lamps mark the quay between them. Far up
 * the canal, past the last lamp, the Fifth froze the water at its ordinary temperature: the sheet lies
 * white-blue between two walls of crystal ice, with the ships it trapped listing in it. The Undertow
 * is fought on the open quay beside it.
 *
 * It is built behind the SAME contract as Tallow, Lanternfall, Ligar, Bellows and Ember Reach, so the
 * stage, the voyage, the walk HUD and the bench dispatcher treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   mirrowen/atmosphere.js     the sky, the sun, the environment
 *   mirrowen/terrain.js        the shelf, the water, the sea, the ice; the roads
 *   mirrowen/plant.js          what people built, and the Fifth's ice and the hulls in it
 *   mirrowen/stations.js       the seven hosts the benches are built into (host-plan.js is their footprints)
 *   mirrowen/effects.js        steam, sea smoke, diamond dust
 *   materials/mirrowen-textures.js  the surfaces
 * laid out by `tools/gen-mirrowen-layout.mjs`.
 *
 * THE RULES IT KEEPS, as the other worlds do:
 *   - NOTHING OCCUPIES THE SAME SPACE AS ANYTHING ELSE: every landmark declares a footprint, every pair is
 *     disjoint, and `verify:mirrowen` measures the world that was actually built.
 *   - A SITE FACES THE GROUND THE PLAYER WALKS IN FROM: the angle is derived from `approachPos`.
 *   - ONLY LAMPS ARE LIT. A work lamp is a `lampMark` pooled into three real lights; nothing here owns a
 *     PointLight and no other surface glows.
 *   - WHAT NEVER MOVES IS BAKED. The radar scanner and the bench indicators stay addressable; the rest is merged.
 *   - THE WATER IS A WALL. A closed ring of colliders lies round the basin and the canal, so nobody
 *     walks into them, and the frozen end of the canal is closed by ice on both banks.
 */

import * as THREE from 'three';
import mirrowenData from './world-data/mirrowen.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, buildMaterial, enableAO, texSize, mergeStatic, canvas2d
} from './materials/pbr-kit.js';
import { frostShingle, quayPaving, crystalIce, canalRipple } from './materials/mirrowen-textures.js';
import {
  createMwSkyDome, createMwLights, followMwShadow, createMwEnvironment, mwSkyUniforms, followCamera, MWSKY
} from './mirrowen/atmosphere.js';
import {
  makeMirrowenField, buildMirrowenTerrainGeometry, buildWaterGeometry, buildSeaGeometry, buildRibbon, buildDisc
} from './mirrowen/terrain.js';
import {
  buildLampPost, buildBollard, buildCrateStack, buildDrumRack, buildShed, buildGantryCrane, buildHarbourLight,
  buildLandingPad, buildIceWall, buildHull
} from './mirrowen/plant.js';
import { yawPoint } from './mirrowen/kit.js';
import { HOST_BUILDERS } from './mirrowen/stations.js';
import { registerFieldPoint } from './field-points.js';
import { createMirrowenEffects } from './mirrowen/effects.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every work lamp in the world burns. A lamp is a lamp. */
const FILAMENT = 0xd99423;

/** Landmarks that are round, or turn themselves: their group is never turned. */
const SELF_TURNED = new Set(['lamp-post', 'bollard', 'harbour-light', 'ice-wall']);

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** How far outside the waterline the ring of colliders stands, and the spacing along it. */
const WATER_RING = 0.55;
const WATER_RING_STEP = 0.85;

/**
 * The closed ring of colliders round the open water: points on the offset outline of the basin and the
 * canal (a circle, two straight banks and a rounded end), kept where they are not inside the other
 * shape's offset. Exported so `verify:mirrowen` reads the same ring the walk does.
 */
export function waterRing(field, data, offset = WATER_RING, step = WATER_RING_STEP) {
  const { basin: B, channel: C } = data.water;
  const out = [];
  const keep = (x, z) => field.waterSD(x, z) >= offset - 0.05;
  const push = (x, z) => { if (keep(x, z)) out.push({ x, z, radius: 0.75 }); };
  const RB = B.radius + offset;
  const nb = Math.ceil((2 * Math.PI * RB) / step);
  for (let i = 0; i < nb; i++) { const a = (i / nb) * Math.PI * 2; push(B.x + Math.sin(a) * RB, B.z + Math.cos(a) * RB); }
  const RC = C.half + offset;
  const L = Math.hypot(C.bx - C.ax, C.bz - C.az);
  const ux = (C.bx - C.ax) / L, uz = (C.bz - C.az) / L;
  const nx = -uz, nz = ux;
  const nl = Math.ceil(L / step);
  for (let i = 0; i <= nl; i++) {
    const t = (i / nl) * L;
    for (const s of [-1, 1]) push(C.ax + ux * t + nx * s * RC, C.az + uz * t + nz * s * RC);
  }
  for (const [px, pz, dir] of [[C.bx, C.bz, 1], [C.ax, C.az, -1]]) {
    const na = Math.ceil((Math.PI * RC) / step);
    const base = Math.atan2(ux * dir, uz * dir);
    for (let i = 0; i <= na; i++) {
      const a = base - Math.PI / 2 + (i / na) * Math.PI;
      push(px + Math.sin(a) * RC, pz + Math.cos(a) * RC);
    }
  }
  return out;
}

export class MirrowenWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = mirrowenData;
    this.scene = new THREE.Scene();
    this.scene.name = 'mirrowen';

    this.colliders = [];
    this.siteMarkers = new Map();    // questId -> { site, group, indicator }
    this.benchAnchors = new Map();   // questId -> the physical frame of that site's working surface
    this.disposables = [];
    this.lamps = [];                 // lampMarks: where the pooled light comes from
    this.vents = [];                 // world-space steam mouths
    this.movers = [];                // the radar scanner
    this.landmarkNodes = [];         // [{ lm, node }] for colliders
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The shelf and the ice run to the horizon on their own; the voyage must not lay a ring over them.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.field = makeMirrowenField(this.data);

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initLandmarks();
    this.initHulls();
    this.initHosts();
    this.initEffects();
    this.initLampPool();
    this.bakeStatics();
    this.buildColliders();
    this.collectMovers();
    this.enableAmbientOcclusion();
  }

  /** Track a texture/geometry/material so dispose() can actually free it. */
  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /** What the builders are handed: materials, `own`, the lamp list and the tier. */
  get ctx() {
    return { M: this.M, own: (...o) => this.own(...o), lamps: this.lamps, t4: this.t4, field: this.field };
  }

  /**
   * Turn on ambient occlusion everywhere it was generated. `aoMap` samples the SECOND uv set, which a
   * primitive geometry does not have, so one pass tells every mesh to reuse its own uvs for it.
   */
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

    M.concrete = buildMaterial(quayPaving({ size: texSize(512), seed: 5 }), { repeat: 1, roughness: 1.0 });

    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256) => buildMaterial(
      platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 2, roughness: 1.0 }
    );
    M.clad = metal('#c3c9c9', '#a7adae', '#8b7a62', 81, 0.3, 2, 512);
    M.steel = metal('#8d979a', '#737d80', '#7d5f45', 83, 0.45, 2, 512);
    M.darkSteel = metal('#363d41', '#52595c', '#6b5442', 85, 0.5, 4);
    M.rusted = metal('#6c4a3c', '#5b4b44', '#7a4a2a', 87, 0.85, 3);
    M.shipHull = metal('#6b3b31', '#5a4640', '#7a4a2a', 89, 0.7, 5, 512);
    M.hallWall = metal('#a9b2b1', '#8e9694', '#7d6248', 91, 0.5, 3, 512);
    M.hallRoof = metal('#566066', '#4f5a60', '#7a5638', 93, 0.62, 4);
    M.roofSheet = metal('#6a7678', '#5f6b6d', '#7d5236', 95, 0.7, 5);
    M.perf = metal('#4a4f50', '#5d6264', '#6e5440', 97, 0.55, 6);
    M.tankWhite = metal('#d4d9d7', '#aab0ae', '#8a7258', 99, 0.4, 3, 512);
    M.tankGreen = metal('#4c6a64', '#455e59', '#7a5a40', 101, 0.5, 3, 512);
    M.crate = metal('#6a7a62', '#5f6a58', '#7a5a40', 103, 0.5, 2);
    M.crateB = metal('#8a7048', '#75623f', '#6a4a30', 105, 0.55, 2);
    for (const m of [M.clad, M.steel, M.darkSteel, M.rusted, M.shipHull, M.hallWall, M.hallRoof, M.roofSheet, M.perf, M.tankWhite, M.tankGreen, M.crate, M.crateB]) {
      m.normalScale.set(1.2, 1.2);
      m.aoMapIntensity = 0.85;
    }

    M.brass = std({ color: 0xb08d4c, roughness: 0.42, metalness: 0.9 });
    M.copper = std({ color: 0xb5714a, roughness: 0.4, metalness: 0.9 });
    M.rubber = std({ color: 0x1c1d1e, roughness: 0.9, metalness: 0 });
    M.insul = std({ color: 0xdcdcd4, roughness: 0.82, metalness: 0.05 });
    M.timber = std({ color: 0x5a4c3e, roughness: 0.95, metalness: 0 });
    M.brick = std({ color: 0x80483b, roughness: 0.92, metalness: 0 });
    M.drum = std({ color: 0x3d5a6e, roughness: 0.6, metalness: 0.5 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintYellow = std({ color: 0xc9a14a, roughness: 0.7, metalness: 0.1 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe8e8e0, roughness: 0.6, metalness: 0 });

    // Glass. Transparent materials are decals to the overlap check and are left out of a bake, as in the other worlds.
    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1416, roughness: 0.18, metalness: 0.2 });

    // THE ONE CLEAN THING in a weathered harbour: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe9ebe6, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2f353a, roughness: 0.55, metalness: 0.4 });

    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    // The Fifth's ice, on the props: crystal columns, white where milky and blue where clear. Opaque, so it is a body.
    const crystal = crystalIce({ size: texSize(512), seed: 21 });
    M.ice = buildMaterial(crystal, { repeat: 1, roughness: 1.0 });
    M.ice.normalScale.set(1.3, 1.3);
    M.ice.envMapIntensity = 1.5;
    M.ice.flatShading = true;
    M.iceDeep = M.ice.clone();
    M.iceDeep.color.set(0x9ec4da);
    M.iceDeep.flatShading = true;
    // The sheet laid over the frozen water, coloured per vertex.
    M.iceSheet = buildMaterial(crystalIce({ size: texSize(512), seed: 23 }), { repeat: 3, roughness: 1.0 });
    M.iceSheet.vertexColors = true;
    M.iceSheet.envMapIntensity = 1.4;
    M.iceSheet.normalScale.set(0.8, 0.8);

    // The ground: frost shingle, painted per vertex.
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    M.shingle = buildMaterial(frostShingle({ size: texSize(512), seed: 7 }), { repeat: 1, roughness: 1.0 });
    M.shingle.vertexColors = true;
    M.shingle.normalScale.set(1.35, 1.35);
    M.shingle.envMapIntensity = 0.7;
    for (const t of M.shingle.userData.surfaceMaps || []) t.anisotropy = aniso;

    // The roads: rolled concrete slabs, feathered into the shingle at both edges.
    M.paving = buildMaterial(quayPaving({ size: texSize(512), seed: 3 }), { repeat: 1, roughness: 1.0 });
    M.paving.alphaMap = this.own(this.featherTexture());
    M.paving.transparent = true;
    M.paving.depthWrite = false;
    M.paving.polygonOffset = true;
    M.paving.polygonOffsetFactor = -2;
    M.paving.polygonOffsetUnits = -2;

    // The water: a mirror that moves, coloured by its depth; and the sea, which is one colour.
    const ripple = buildMaterial(canalRipple({ size: texSize(256), seed: 17 }), { repeat: 3, roughness: 0.06 });
    ripple.map?.dispose();
    ripple.map = null;
    ripple.userData.surfaceMaps = [ripple.normalMap].filter(Boolean);
    ripple.vertexColors = true;
    ripple.metalness = 0;
    ripple.envMapIntensity = 1.5;
    ripple.normalScale.set(0.35, 0.35);
    M.water = ripple;
    M.sea = ripple.clone();
    M.sea.vertexColors = false;
    M.sea.color.set(0x4d6c70);
    M.sea.normalMap = ripple.normalMap;
    M.sea.normalScale.set(0.5, 0.5);

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /** An alpha ramp across a road: clear at both edges, solid in the middle. */
  featherTexture() {
    const c = canvas2d(64, 4);
    const x = c.getContext('2d');
    const g = x.createLinearGradient?.(0, 0, 64, 0);
    if (g) {
      g.addColorStop(0, '#000');
      g.addColorStop(0.2, '#fff');
      g.addColorStop(0.8, '#fff');
      g.addColorStop(1, '#000');
      x.fillStyle = g;
    } else {
      x.fillStyle = '#fff';
    }
    x.fillRect(0, 0, 64, 4);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  /* ======================================================================
     LIGHT AND SKY
     ====================================================================== */

  initLighting() {
    const { key, hemi } = createMwLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);

    // The haze is the horizon's own colour; near and far are what the voyage reads.
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = MWSKY.horizon.clone();

    const env = createMwEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.85;
    }
  }

  initSky() {
    this.sky = createMwSkyDome(900);
    this.scene.add(this.sky);
  }

  /* ======================================================================
     THE GROUND, THE WATER, THE SEA AND THE ROADS
     ====================================================================== */

  /** The walking surface: the shelf, the pad, the banks of the canal, and past the shelf the sea bed. */
  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initTerrain() {
    const geo = this.own(buildMirrowenTerrainGeometry(this.field, this.data));
    this.terrainMesh = new THREE.Mesh(geo, this.M.shingle);
    this.terrainMesh.name = 'mirrowen-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    const L = this.field.LEVEL;
    // The open water, and the sheet over the frozen stretch.
    const water = new THREE.Mesh(this.own(buildWaterGeometry(this.field, this.data, 'open')), this.M.water);
    water.name = 'mirrowen-water';
    water.position.y = L;
    water.userData.phys = 'ground';
    water.userData.noWeather = true;
    water.receiveShadow = this.t4;
    this.scene.add(water);
    this.waterMesh = water;
    const ice = new THREE.Mesh(this.own(buildWaterGeometry(this.field, this.data, 'ice')), this.M.iceSheet);
    ice.name = 'mirrowen-ice-sheet';
    ice.position.y = L + 0.05;
    ice.userData.phys = 'ground';
    ice.userData.noWeather = true;
    ice.receiveShadow = this.t4;
    this.scene.add(ice);
    this.iceMesh = ice;
    // The sea, from beyond the walk's reach to the horizon.
    const sea = new THREE.Mesh(this.own(buildSeaGeometry((this.data.shore ?? 148) + 2)), this.M.sea);
    sea.name = 'mirrowen-sea';
    sea.position.y = L;
    sea.userData.phys = 'ground';
    sea.userData.noWeather = true;
    this.scene.add(sea);
    this.seaMesh = sea;

    this.initRoads();
  }

  /** The roads: the quay ring (broken where the canal crosses it), a spoke to every bench, the way in, the pad, and the lane to the boss's ground. */
  initRoads() {
    const D = this.data;
    const R = D.road.radius;
    const ribbons = [];
    // The quay ring, as arcs: split wherever the water or its bank would lie under it.
    {
      let run = [];
      const flush = () => { if (run.length > 1) ribbons.push(buildRibbon(this.field, run, 3.2)); run = []; };
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const x = Math.sin(a) * R, z = Math.cos(a) * R;
        if (this.field.waterSD(x, z) < 4) flush();
        else run.push([x, z]);
      }
      flush();
    }
    for (const s of D.sites) {
      const [ax, , az] = s.approachPos;
      const n = Math.hypot(ax, az);
      ribbons.push(buildRibbon(this.field, [[ax / n * (R + 1.2), az / n * (R + 1.2)], [ax * 1.02, az * 1.02]], 2.4));
    }
    const sp = D.spawn.pos;
    ribbons.push(buildRibbon(this.field, [[sp[0], sp[2] + 2], [0, R + 1.2]], 3.0));
    const pad = D.landmarks.find(l => l.asset === 'landing-pad');
    if (pad) ribbons.push(buildRibbon(this.field, [[1.5, 80], [pad.pos[0] - this.field.PAD_R + 0.5, pad.pos[2]]], 2.6));
    for (const lane of D.lanes || []) ribbons.push(buildRibbon(this.field, lane.points, lane.width || 3.0));
    ribbons.push(buildDisc(this.field, D.arena.boss[0], D.arena.boss[2], 10.5));
    const g = new THREE.Group();
    g.name = 'mirrowen-roads';
    g.userData.phys = 'ground';
    for (const geo of ribbons) {
      const m = new THREE.Mesh(this.own(geo), this.M.paving);
      m.renderOrder = 1;
      m.receiveShadow = this.t4;
      m.userData.noWeather = true;
      g.add(m);
    }
    this.scene.add(g);
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
        case 'crate-stack': node = buildCrateStack(ctx, lm, seed++); break;
        case 'drum-rack': node = buildDrumRack(ctx, lm, seed++); break;
        case 'shed': node = buildShed(ctx); break;
        case 'gantry-crane': node = buildGantryCrane(ctx); break;
        case 'harbour-light': node = buildHarbourLight(ctx); break;
        case 'landing-pad': node = buildLandingPad(ctx, this.field); break;
        case 'ice-wall': node = buildIceWall(ctx, lm, seed++); break;
        default: node = null;
      }
      if (!node) continue;
      node.position.set(lm.pos[0], lm.asset === 'landing-pad' ? 0 : y, lm.pos[2]);
      // A round thing carries its turn in its own layout (a turned group's parts are measured by boxes
      // turned with it, which a round body overfills); everything else is turned by its landmark.
      if (!SELF_TURNED.has(lm.asset)) node.rotation.y = lm.rotY || 0;
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
    }
  }

  /** The ships the ice took: hulls listing in the sheet, laid out in the JSON. */
  initHulls() {
    for (const h of this.data.hulls || []) {
      const node = buildHull(this.ctx, h);
      node.position.set(h.x, this.field.LEVEL, h.z);
      node.rotation.y = h.yaw || 0;
      node.name = `${h.tug ? 'tug' : 'cargo-ship'}@${h.x},${h.z}`;
      this.scene.add(node);
    }
  }

  /* ======================================================================
     THE SITES
     ====================================================================== */

  /** Which way a site faces: toward the ground a player walks in from. */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    if (Math.hypot(ax, az) < 0.01) return 0;
    return Math.atan2(ax, az);
  }

  /**
   * Build every host: the piece of the harbour a bench belongs to (stations.js), placed at its site and
   * turned to face its approach. The bench is a part of its host, one object, so a bench is never bolted
   * to anything but the machine it is for.
   */
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

      for (const fp of host.fieldPoints || []) {
        const [px, pz] = at(fp.lx, fp.lz);
        const [sx, sz] = at(fp.stand.lx, fp.stand.lz);
        registerFieldPoint(this, {
          id: fp.id, siteId: site.id, label: fp.label, host: site.id,
          pos: [px, g.position.y + fp.ly, pz], half: fp.half, rotY: g.rotation.y,
          stand: [sx, g.position.y, sz]
        });
      }

      // The steam a host lets go of, in the world's frame.
      for (const v of host.vents || []) {
        const [x, z] = at(v.lx, v.lz);
        const { lx, lz, ly, ...rest } = v;
        this.hostVents.push({ ...rest, x, y: g.position.y + (ly ?? v.y), z });
      }

      // The host's colliders are in its own frame; the walk wants them in the world's. A host is turned
      // to face its approach, and a turned box would collide as the larger box that holds it, so a box is
      // laid as a row of discs along its long side.
      for (const c of host.colliders) {
        if (c.r !== undefined) { const [x, z] = at(c.lx, c.lz); this.siteColliders.push({ x, z, radius: c.r }); continue; }
        const long = Math.max(c.hw, c.hd);
        const short = Math.min(c.hw, c.hd);
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

  /** Record where a bench's working surface is, in world terms. */
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

  /** Case the bench instrument up, or open it. One object, two states. */
  setBenchDeployed(questId, deployed) {
    const anchor = this.benchAnchors.get(questId);
    if (anchor?.dormant) anchor.dormant.visible = !deployed;
    if (anchor) {
      if (deployed && !anchor.open) this.benchesOpen++;
      if (!deployed && anchor.open) this.benchesOpen--;
      anchor.open = deployed;
    }
  }

  /** The working surface for a quest's site, or null if it has no bench. */
  benchAnchor(questId) {
    return this.benchAnchors.get(questId) || null;
  }

  /** Light a site's indicator when its quest is complete. The world reads state, it never keeps it. */
  setSiteComplete(questId, complete) {
    const marker = this.siteMarkers.get(questId);
    if (!marker || !marker.indicator) return;
    marker.indicator.material.emissiveIntensity = complete ? 1.7 : 0;
    marker.indicator.material.color.setHex(complete ? FILAMENT : 0x4a4038);
    marker.indicator.material.needsUpdate = true;
  }

  /* ======================================================================
     AIR, LAMPS AND THE FRAME BUDGET
     ====================================================================== */

  initEffects() {
    const D = this.data;
    const L = this.field.LEVEL;
    // Sea smoke over the open water: the basin, and the canal as far as the sheet.
    const mist = [{ x: D.water.basin.x, z: D.water.basin.z, y: L, r: D.water.basin.radius - 1 }];
    for (let z = D.water.channel.az - 10; z > D.water.frozenZ + 4; z -= 9) mist.push({ x: D.water.channel.ax, z, y: L, r: D.water.channel.half - 1 });
    this.effects = createMirrowenEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents: [...this.vents, ...this.hostVents],
      mist
    });
    this.scene.add(this.effects.group);
  }

  /** THE WORK LAMPS SHARE THREE LIGHTS. Only the lamps round the player need a real light at all (lamp-pool.js). */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  /** WHAT NEVER MOVES IS BAKED. The cased instruments, the indicators and the scanner stay their own meshes. */
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
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  /** Find the moving parts once the bake is done. */
  collectMovers() {
    this.scene.traverse(o => { if (o.userData.mover) this.movers.push(o); });
  }

  /* ======================================================================
     COLLISION
     Every prop collides as the part of it a body can actually touch.
     ====================================================================== */

  buildColliders() {
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }
    // The water: a closed ring round the basin and the canal, so nobody walks into it.
    this.waterColliders = waterRing(this.field, this.data);
    for (const c of this.waterColliders) this.colliders.push(c);
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /* ======================================================================
     FRAME
     ====================================================================== */

  update(delta, cameraPos) {
    this.elapsed += delta;
    mwSkyUniforms.uMwTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followMwShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0, every: 30 });
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
    }
    // The water moves.
    if (this.M.water.normalMap) this.M.water.normalMap.offset.set(this.elapsed * 0.004, this.elapsed * 0.003);
    // Work lamps are old, not alarming: a slow filament drift.
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
