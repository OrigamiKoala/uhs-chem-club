/**
 * ember.js — Ember Reach, Learn world 05, as a place you walk (T4).
 *
 * A hydrothermal shelf inside a caldera, under a sulphur haze in the afternoon.
 * A banded hot spring steams at the middle: deep blue where it is hottest,
 * turquoise toward the lip, and round it the mats that grow in the runoff in
 * the order the water cools (pale sinter, yellow, orange, rust-brown). The
 * seven benches of "Thermodynamics" stand on a ring round it, each in its own
 * heat-shield shelter, with a road of work lamps between them; fumaroles, a
 * geyser, mud pots and sinter terraces breathe all over the shelf; the
 * geothermal plant stands off at the edges, and the caldera main carries its
 * steam round the north, lifted into an expansion loop where the lane runs out
 * to the rim. Through the loop is the overlook: a railed edge, the caldera
 * floor 28 m below it with a lava lake lying in it, a cone beyond still
 * putting up its plume, and clamped to the main on the overlook, the Fifth
 * Guild's siphon, furred with frost. The Crucible is fought in front of the
 * loop.
 *
 * It is built behind the SAME contract as Tallow, Lanternfall, Ligar and
 * Bellows, so the stage, the voyage, the walk HUD and the bench dispatcher
 * treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   ember/atmosphere.js        the sky, the sun, the lake's glow, the environment
 *   ember/terrain.js           the shelf, the rim, the floor and the walls; the spring, the lake, the roads
 *   ember/field.js             what the ground built: vents, geyser, mud, terraces, lava
 *   ember/plant.js             what people built: wells, the main, the plant, the lines, the siphon
 *   ember/stations.js          the seven hosts the benches are built into (host-plan.js is their footprints)
 *   ember/effects.js           steam, fume, mist, the geyser's water, sulphur motes
 *   materials/ember-textures.js  the surfaces
 * laid out by `tools/gen-ember-layout.mjs`.
 *
 * THE RULES IT KEEPS, as the other worlds do:
 *   - NOTHING OCCUPIES THE SAME SPACE AS ANYTHING ELSE: every landmark declares a
 *     footprint, every pair is disjoint, and `verify:ember` measures the world
 *     that was actually built.
 *   - A SITE FACES THE GROUND THE PLAYER WALKS IN FROM: the angle is derived from
 *     `approachPos`, so moving an approach mark turns the site to meet it.
 *   - ONLY LAMPS ARE LIT. A work lamp is a `lampMark` pooled into three real
 *     lights; nothing here owns a PointLight. The one other emissive surface is
 *     the lava lake far below the rim: molten rock is incandescent, the one
 *     filament nature makes, and nobody stands on it.
 *   - WHAT NEVER MOVES IS BAKED. The fans, the mud's bubbles, the cased
 *     instruments and the indicators stay addressable; the rest is merged.
 *   - THE RIM IS A WALL. The rail along the edge is a closed chain of colliders,
 *     so the only drop in the world is one nobody can reach.
 */

import * as THREE from 'three';
import emberData from './world-data/ember.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, buildMaterial, enableAO, texSize, mergeStatic, asColorTexture, canvas2d
} from './materials/pbr-kit.js';
import {
  sinterCrust, cinderRoad, blackGlass, sulphurCrust, ventConcrete, lavaCrust, springRipple
} from './materials/ember-textures.js';
import {
  createErSkyDome, createErLights, followErShadow, createErEnvironment, erSkyUniforms, followCamera, ERSKY
} from './ember/atmosphere.js';
import {
  makeEmberField, buildEmberTerrainGeometry, buildSpringGeometry, buildLakeGeometry, buildRibbon, buildDisc
} from './ember/terrain.js';
import {
  buildFumarole, buildSulphurMound, buildMudPot, buildGeyser, buildSinterTerrace, buildLavaLobe,
  buildProbeStake, buildSpringLip
} from './ember/field.js';
import {
  buildWellhead, buildSeparator, buildSilencerPair, buildTurbineHall, buildCoolingCells, buildTransformer,
  buildPylon, buildCommsMast, buildLandingPad, buildCrateStack, buildDrumRack, buildHabitat,
  buildSiphonManifold, buildLampPost, buildPipes, buildRimRail, buildPowerLines
} from './ember/plant.js';
import { yawPoint } from './ember/kit.js';
import { HOST_BUILDERS } from './ember/stations.js';
import { registerFieldPoint } from './field-points.js';
import { createEmberEffects } from './ember/effects.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every work lamp in the world burns. A lamp is a lamp. */
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
    this.siteMarkers = new Map();    // questId -> { site, group, indicator }
    this.benchAnchors = new Map();   // questId -> the physical frame of that site's working surface
    this.disposables = [];
    this.lamps = [];                 // lampMarks: where the pooled light comes from
    this.vents = [];                 // world-space steam mouths
    this.movers = [];                // the cooling fans and the mud's bubbles
    this.landmarkNodes = [];         // [{ lm, node }] for colliders and vents
    this.geyserVent = null;
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The shelf and the caldera run to the horizon on their own; the voyage must not lay a ring over them.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.field = makeEmberField(this.data);

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initLandmarks();
    this.initPlant();
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
   * Turn on ambient occlusion everywhere it was generated. `aoMap` samples the
   * SECOND uv set, which a primitive geometry does not have, so one pass tells
   * every mesh to reuse its own uvs for it.
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

    // Sinter on the props: the same crust as the ground, without the ground's painted colour.
    M.sinter = buildMaterial(sinterCrust({ size: texSize(512), seed: 8 }), { repeat: 2, roughness: 1.0 });
    M.sinter.normalScale.set(1.3, 1.3);
    M.sinterWarm = M.sinter.clone();
    M.sinterWarm.color.set(0xf0cfa2);
    M.sinterWet = M.sinter.clone();
    M.sinterWet.color.set(0x8c8172);
    M.sinterWet.roughness = 0.42;
    M.sulphur = buildMaterial(sulphurCrust({ size: texSize(256), seed: 5 }), { repeat: 2, roughness: 1.0 });
    M.sulphurPale = std({ color: 0xeadc98, roughness: 0.6, metalness: 0 });
    M.rock = buildMaterial(blackGlass({ size: texSize(512), seed: 11 }), { repeat: 1, roughness: 1.0 });
    M.rock.normalScale.set(1.2, 1.2);
    M.rock.envMapIntensity = 1.2;
    M.concrete = buildMaterial(ventConcrete({ size: texSize(512), seed: 9 }), { repeat: 1, roughness: 1.0 });

    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256) => buildMaterial(
      platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 2, roughness: 1.0 }
    );
    M.clad = metal('#c4c7c5', '#a3a8a8', '#8b7a62', 81, 0.3, 2, 512);
    M.steel = metal('#8b9184', '#727a70', '#7d5f45', 83, 0.45, 2, 512);
    M.darkSteel = metal('#3c403b', '#555a54', '#6b5442', 85, 0.5, 4);
    M.rusted = metal('#6a4a36', '#5b4b40', '#7a4a2a', 87, 0.85, 3);
    M.livery = metal('#2c2830', '#4a4650', '#5a4a40', 89, 0.22, 3);
    M.hallWall = metal('#a59b86', '#8e8676', '#7d6248', 91, 0.5, 3, 512);
    M.hallRoof = metal('#6b5d50', '#62584d', '#7a5638', 93, 0.62, 4);
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
    M.pool = std({ color: 0x6fa9a4, roughness: 0.06, metalness: 0, envMapIntensity: 1.4 });
    M.rime = std({ color: 0xe6eef4, roughness: 0.5, metalness: 0 });
    M.brick = std({ color: 0x8a4e3a, roughness: 0.92, metalness: 0 });
    M.drum = std({ color: 0x3d5a6e, roughness: 0.6, metalness: 0.5 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintYellow = std({ color: 0xc9a14a, roughness: 0.7, metalness: 0.1 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe8e2d4, roughness: 0.6, metalness: 0 });

    // Glass, panes and the mesh of a fence. Transparent materials are decals to the
    // overlap check and are left out of a bake, as in the other worlds.
    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1214, roughness: 0.18, metalness: 0.2 });
    M.mesh = std({ color: 0x2f302d, roughness: 0.8, metalness: 0.5, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });

    // THE ONE CLEAN THING in a weathered field: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe9e4d6, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2f333a, roughness: 0.55, metalness: 0.4 });

    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    // The roads: red and black cinder, feathered into the crust at both edges.
    M.cinder = buildMaterial(cinderRoad({ size: texSize(512), seed: 3 }), { repeat: 1, roughness: 1.0 });
    M.cinder.alphaMap = this.own(this.featherTexture());
    M.cinder.transparent = true;
    M.cinder.depthWrite = false;
    M.cinder.polygonOffset = true;
    M.cinder.polygonOffsetFactor = -2;
    M.cinder.polygonOffsetUnits = -2;

    // The hot spring: a mirror that moves, coloured by its depth.
    const ripple = buildMaterial(springRipple({ size: texSize(256), seed: 17 }), { repeat: 3, roughness: 0.06 });
    ripple.map?.dispose();
    ripple.map = null;
    ripple.userData.surfaceMaps = [ripple.normalMap].filter(Boolean);
    ripple.vertexColors = true;
    ripple.metalness = 0;
    ripple.envMapIntensity = 1.5;
    ripple.normalScale.set(0.35, 0.35);
    M.water = ripple;

    // The lava lake: black crust on melt. The seams are the only emissive map in the world.
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
    const { key, hemi, glow } = createErLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi, glow);
    holdShadowUntilAsked(this.scene, key);

    // The haze is the horizon's own colour; near and far are what the voyage reads.
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
     THE GROUND, THE SPRING, THE LAKE AND THE ROADS
     ====================================================================== */

  /** The walking surface: the shelf, the pad, the bowl of the spring and, past the rail, the drop. */
  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const crust = buildMaterial(sinterCrust({ size: texSize(512), seed: 7 }), { repeat: 1, roughness: 1.0 });
    crust.vertexColors = true;
    crust.normalScale.set(1.35, 1.35);
    crust.envMapIntensity = 0.7;
    for (const t of crust.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(crust);

    const geo = this.own(buildEmberTerrainGeometry(this.field, this.data));
    this.terrainMesh = new THREE.Mesh(geo, crust);
    this.terrainMesh.name = 'ember-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    // The hot spring, in its bowl, and the lip the water built round it.
    const S = this.data.spring;
    const water = new THREE.Mesh(this.own(buildSpringGeometry(S)), this.M.water);
    water.name = 'ember-spring';
    water.position.set(S.x, -0.24, S.z);
    water.userData.phys = 'ground';
    water.userData.noWeather = true;
    water.receiveShadow = this.t4;
    this.scene.add(water);
    this.springMesh = water;
    const lip = buildSpringLip(this.ctx, S);
    lip.position.set(S.x, -0.18, S.z);
    this.scene.add(lip);

    // The lava lake, flat in the caldera floor.
    const L = this.data.lake;
    const lake = new THREE.Mesh(this.own(buildLakeGeometry(L)), this.M.magma);
    lake.name = 'ember-lava-lake';
    lake.position.set(L.x, this.data.floor.level - 0.25, L.z);
    lake.userData.phys = 'ground';
    lake.userData.noWeather = true;
    this.scene.add(lake);
    this.lakeMesh = lake;

    this.initRoads();
  }

  /** The cinder roads: the ring, a spoke to every bench, the way in, the pad, and the lane to the rim. */
  initRoads() {
    const D = this.data;
    const R = D.road.radius;
    const ribbons = [];
    const ring = [];
    for (let i = 0; i < 120; i++) { const a = (i / 120) * Math.PI * 2; ring.push([Math.sin(a) * R, Math.cos(a) * R]); }
    ribbons.push(buildRibbon(this.field, ring, 3.2, { closed: true }));
    for (const s of D.sites) {
      const [ax, , az] = s.approachPos;
      const n = Math.hypot(ax, az);
      ribbons.push(buildRibbon(this.field, [[ax / n * (R + 1.2), az / n * (R + 1.2)], [ax * 1.02, az * 1.02]], 2.4));
    }
    const sp = D.spawn.pos;
    ribbons.push(buildRibbon(this.field, [[sp[0], sp[2] + 2], [0, R + 1.2]], 3.0));
    const pad = D.landmarks.find(l => l.asset === 'landing-pad');
    if (pad) ribbons.push(buildRibbon(this.field, [[1.5, 80], [pad.pos[0] - this.field.PAD_R + 0.5, pad.pos[2]]], 2.6));
    const A = D.arena;
    ribbons.push(buildRibbon(this.field, [[0, -R - 1.2], [0, A.boss[2] + 9]], 3.4));
    ribbons.push(buildRibbon(this.field, [[0, A.boss[2] - 9], [0, D.rim.cz + D.rim.rail + 1.2]], 2.6));
    ribbons.push(buildDisc(this.field, A.boss[0], A.boss[2], 10.5));
    const g = new THREE.Group();
    g.name = 'ember-roads';
    g.userData.phys = 'ground';
    for (const geo of ribbons) {
      const m = new THREE.Mesh(this.own(geo), this.M.cinder);
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
        case 'turbine-hall': node = buildTurbineHall(ctx); break;
        case 'cooling-cells': node = buildCoolingCells(ctx); break;
        case 'transformer': node = buildTransformer(ctx); break;
        case 'pylon': node = buildPylon(ctx); break;
        case 'comms-mast': node = buildCommsMast(ctx); break;
        case 'landing-pad': node = buildLandingPad(ctx, this.field); break;
        case 'crate-stack': node = buildCrateStack(ctx, lm, seed++); break;
        case 'drum-rack': node = buildDrumRack(ctx, lm, seed++); break;
        case 'habitat': node = buildHabitat(ctx); break;
        case 'siphon-manifold': node = buildSiphonManifold(ctx); break;
        case 'lamp-post': node = buildLampPost(ctx, posts++); break;
        default: node = null;
      }
      if (!node) continue;
      node.position.set(lm.pos[0], lm.asset === 'landing-pad' ? 0 : y, lm.pos[2]);
      // A lamp post turns itself, and a round thing carries its turn in its own layout
      // (a turned group's parts are measured by boxes turned with it, which a round
      // body overfills); everything else is turned by its landmark.
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

  /** The pipe network, the rim rail and the power lines: laid along the ground, not stood on it. */
  initPlant() {
    const pipes = buildPipes(this.ctx, this.data.pipes, this.field);
    this.scene.add(pipes.group);
    this.pipeColliders = pipes.colliders;

    const rail = buildRimRail(this.ctx, this.data.rim, this.field);
    this.scene.add(rail.group);
    this.rimColliders = rail.colliders;

    // The power line: from the transformer down the pylons in order.
    this.scene.updateMatrixWorld(true);
    const attachOf = name => {
      const hit = this.landmarkNodes.filter(e => e.lm.asset === name);
      return hit;
    };
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
     THE SITES
     ====================================================================== */

  /**
   * Which way a site faces: toward the ground a player walks in from. Derived
   * from `approachPos`, the same rule the other worlds follow, for the same
   * reason: a hardcoded angle puts a player behind a bench's back wall.
   */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    if (Math.hypot(ax, az) < 0.01) return 0;
    return Math.atan2(ax, az);
  }

  /**
   * Build every host: the piece of the geothermal field a bench belongs to (stations.js), placed at its site and
   * turned to face its approach. The bench is a part of its host, one object, so a bench is never bolted to
   * anything but the machine it is for.
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

      // The places the player is sent to for this bench (plan section 2.5): real pieces of the host, in the world's frame.
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

      // The host's colliders are in its own frame; the walk wants them in the world's. A host is turned to face its approach, and
      // a turned box would collide as the larger box that holds it, so a box is laid as a row of discs along its long side.
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

  /**
   * Record where a bench's working surface is, in world terms. `local` is where
   * the bench sits inside the site group; the group's own rotation is applied so
   * a site that faces another way still reports the plate it actually has.
   */
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

  /**
   * Light a site's indicator when its quest is complete. Driven by the Learn
   * track's own progress: the world reads state, it never keeps it.
   */
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
    // Fume off the lava lake and the cone, far below and beyond the rim, lit orange from beneath.
    const fume = [];
    const L = D.lake;
    for (const [fx, fz] of [[0, 0], [0.5, 0.2], [-0.5, -0.1], [0.2, -0.55], [-0.25, 0.5]]) {
      const x = L.x + fx * L.rx, z = L.z + fz * L.rz;
      fume.push({ x, y: D.floor.level + 0.5, z, size: 7, rise: 80, life: 34, rate: 0.9, tint: 1, alpha: 0.26, lean: 0.6 });
    }
    const C = D.cone;
    fume.push({ x: C.x, y: this.field.height(C.x, C.z) + 26, z: C.z, size: 24, rise: 380, life: 70, rate: 1.4, tint: 0.55, alpha: 0.3, lean: 1.1 });
    this.effects = createEmberEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents: [...this.vents, ...this.hostVents, ...fume],
      geyser: this.geyserVent,
      spring: { ...D.spring, y: -0.24 }
    });
    this.scene.add(this.effects.group);
  }

  /**
   * THE WORK LAMPS SHARE THREE LIGHTS. A lamp's light shows only within a few
   * metres of it, so only the lamps round the player need a real light at all
   * (lamp-pool.js).
   */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  /**
   * WHAT NEVER MOVES IS BAKED. Every top-level group not already baked becomes a
   * mesh or two per material; the cased instruments, the indicators, the fans and
   * the bubbles stay their own meshes.
   */
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

  /** Find the moving parts once the bake is done: the baked props kept them as they were. */
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
        if (c.minX !== undefined) {
          // A box is only ever declared by a building that is not turned.
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
    // The spring: a ring round the open water, so nobody walks into it.
    const S = this.data.spring;
    const Rr = S.radius + 0.55;
    const N = Math.ceil((2 * Math.PI * Rr) / 1.0);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      this.colliders.push({ x: S.x + Math.sin(a) * Rr, z: S.z + Math.cos(a) * Rr, radius: 0.75 });
    }
    for (const c of this.siteColliders) this.colliders.push(c);
    for (const c of this.pipeColliders) this.colliders.push(c);
    for (const c of this.rimColliders) this.colliders.push(c);
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
      else if (m.kind === 'bubble') {
        // Swell, hold for a moment, burst; then the next one.
        const t = (this.elapsed * m.rate + m.phase) % 1;
        const s = t < 0.8 ? t / 0.8 : 0.01;
        o.scale.set(Math.max(0.01, s), Math.max(0.01, s * 0.8), Math.max(0.01, s));
      }
    }
    // The spring's surface moves; the lake's crust drifts, and its seams breathe.
    if (this.M.water.normalMap) this.M.water.normalMap.offset.set(this.elapsed * 0.006, this.elapsed * 0.004);
    if (this.M.magma.map) {
      const o = this.elapsed * 0.0012;
      this.M.magma.map.offset.set(o, o * 0.4);
      this.M.magma.emissiveMap.offset.set(o, o * 0.4);
      for (const t of [this.M.magma.normalMap, this.M.magma.roughnessMap, this.M.magma.aoMap]) t?.offset.set(o, o * 0.4);
      this.M.magma.emissiveIntensity = 1.55 + Math.sin(this.elapsed * 0.7) * 0.12 + Math.sin(this.elapsed * 2.3) * 0.05;
    }
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
