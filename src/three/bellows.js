/**
 * bellows.js — Bellows, Learn world 04, as a place you walk (T4).
 *
 * A gas works hung in thin air over a sea of cloud. There is no ground: the player lands on a steel stage
 * and walks railed catwalks and ramps between decks at seven heights, from 8 m under the stage to 12 m over
 * it, round the works' structures: the Compressor's tower on its plinth (the apron in front of it is the
 * boss's ground), a sphere on its skirt, a piston gasholder, a liquefier's cold box, a bladder moored over
 * its gondola and a bladder hauled down onto its cradle. The six benches are inside those structures
 * (`bellows/works-plan.js`).
 *
 * Public contract (identical across all walkable Learn worlds):
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool, cover,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   bellows/works-plan.js   the plan: levels, volumes, rooms, structures, the one height field (no THREE)
 *   bellows/decks.js        the decks, rails, legs, rooms, passages and structures
 *   bellows/stations.js     the six hosts in their rooms (host-plan.js is their footprints)
 *   bellows/plant.js        the Compressor, the pad, the cumulus heads
 *   bellows/vista.js        what stands in the far country
 *   bellows/atmosphere.js   the sky, the cloud sea, the sun, the environment
 *   bellows/effects.js      spindrift and plumes
 * laid out by `tools/gen-bellows-layout.mjs`.
 *
 * THE RULES IT KEEPS: nothing occupies the same space as anything else; only lamps are lit, from a pool of
 * three lights; what never moves is baked; every roofed room is under the shared cover mask; every drop is
 * closed by the rails the plan declares.
 */

import * as THREE from 'three';
import bellowsData from './world-data/bellows.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, treadPlate, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic
} from './materials/pbr-kit.js';
import { slabConcrete, ribbedSheet } from './materials/kettle-textures.js';
import {
  createBwSkyDome, createCloudSea, createBwLights, followBwShadow, createBwEnvironment,
  bwSkyUniforms, followCamera, BWSKY, SUN_DIR
} from './bellows/atmosphere.js';
import { makeWorksPlan, PLINTH, SEA } from './bellows/works-plan.js';
import { buildWorks, buildWorksLamps, buildDeckPlate } from './bellows/decks.js';
import { buildCompressorTower, buildLandingPad, buildCloudHeads } from './bellows/plant.js';
import { buildVista } from './bellows/vista.js';
import { HOST_BUILDERS } from './bellows/stations.js';
import { registerFieldPoint } from './field-points.js';
import { createBellowsEffects } from './bellows/effects.js';
import { LampPool } from './lamp-pool.js';
import { makeCover } from './lib/cover.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every work lamp in the world burns. */
const FILAMENT = 0xd99423;

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** Where the Compressor stands on its plinth. */
const COMPRESSOR_AT = [0, PLINTH.top, -10];

export class BellowsWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = bellowsData;
    this.scene = new THREE.Scene();
    this.scene.name = 'bellows';

    this.colliders = [];
    this.siteMarkers = new Map();    // questId -> { site, group, indicator }
    this.benchAnchors = new Map();   // questId -> the physical frame of that site's working surface
    this.disposables = [];
    this.lamps = [];                 // lampMarks: where the pooled light comes from
    this.vents = [];                 // world-space plume mouths [x, y, z]
    this.movers = [];                // the Compressor's rod and wheel
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The cloud sea runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.plan = makeWorksPlan();
    this.field = this.plan;

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initWorks();
    this.initLandmarks();
    this.initHosts();
    this.initEffects();
    this.initLampPool();
    this.initCover();
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

  /** What the builders are handed: materials, `own`, the lamp list, the tier and the plan. */
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
    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256) => {
      const m = buildMaterial(platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 1, roughness: 1.0 });
      m.normalScale.set(1.2, 1.2);
      m.aoMapIntensity = 0.85;
      return m;
    };

    // The deck: tread plate, cold and bright, scoured by thin air and sun more than by rain; worn per vertex.
    M.deck = buildMaterial(treadPlate({ size: texSize(512), base: '#8e949c', seed: 7, weather: 0.35 }), { repeat: 1, roughness: 1.0 });
    M.deck.normalScale.set(1.1, 1.1);
    M.deck.envMapIntensity = 0.9;
    M.deck.vertexColors = true;

    M.steel = metal('#b9c3cf', '#8d98a5', '#8a7660', 61, 0.3, 2, 512);
    M.darkSteel = metal('#3d4756', '#5a6574', '#6b5a48', 67, 0.38, 4);
    M.cladding = metal('#d9dee6', '#9aa4b2', '#9a8266', 71, 0.22, 3, 512);
    M.grating = metal('#4a525e', '#5d6672', '#6b5a48', 73, 0.5, 6);
    M.concrete = buildMaterial(slabConcrete({ size: texSize(512), seed: 13 }), { repeat: 1, roughness: 1.0 });
    M.concrete.color.set(0xb6b8bc);
    M.ribbed = buildMaterial(ribbedSheet({ size: texSize(512), seed: 47, paint: '#c9cfd6', rust: '#8a7660', weather: 0.25 }), { repeat: 1, roughness: 1.0 });

    M.brass = std({ color: 0xb08d4c, roughness: 0.4, metalness: 0.9 });
    M.copper = std({ color: 0xb5714a, roughness: 0.42, metalness: 0.9 });
    M.skin = std({ color: 0x3b3b41, roughness: 0.82, metalness: 0.05 });
    M.canvas = std({ color: 0x5c5a55, roughness: 0.95, metalness: 0 });
    M.insul = std({ color: 0xd8dbdc, roughness: 0.85, metalness: 0.05 });
    M.crate = std({ color: 0x6a7684, roughness: 0.85, metalness: 0.2 });
    // THE ONE CLEAN THING on a weathered plant: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe6ebf1, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2d3744, roughness: 0.55, metalness: 0.4 });
    M.rubber = std({ color: 0x1b1d21, roughness: 0.95, metalness: 0 });
    M.cloud = std({ color: 0xf2f5fa, roughness: 1, metalness: 0 });
    M.rime = std({ color: 0xdfe8f2, roughness: 0.6, metalness: 0 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });

    // Hazed panes and dark glass. Transparent materials are decals to the overlap check and are left out of a bake.
    M.glass = std({ color: 0xc4dcef, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0b1219, roughness: 0.2, metalness: 0.2 });
    M.paint2 = std({ color: 0xe8eef6, roughness: 0.6, metalness: 0 });

    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

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
      this.scene.environmentIntensity = 0.8;
    }
  }

  initSky() {
    this.sky = createBwSkyDome(900);
    this.scene.add(this.sky);
  }

  /* ======================================================================
     THE WORKS: DECKS, RAILS, LEGS, ROOMS AND STRUCTURES, AND THE SEA UNDER THEM
     ====================================================================== */

  /** The walking surface: a deck's floor where the plan declares one, and the cloud sea (a drop no one can reach) elsewhere. */
  getTerrainHeight(x, z) {
    return this.plan.height(x, z);
  }

  initWorks() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    for (const t of this.M.deck.userData.surfaceMaps || []) t.anisotropy = aniso;

    this.deckMesh = new THREE.Mesh(this.own(buildDeckPlate(this.plan)), this.M.deck);
    this.deckMesh.name = 'bellows-deck';
    this.deckMesh.frustumCulled = false;
    this.deckMesh.userData.phys = 'ground';
    this.deckMesh.userData.noWeather = true;
    this.deckMesh.receiveShadow = this.t4;
    this.scene.add(this.deckMesh);

    const works = buildWorks(this.ctx, this.plan);
    this.works = works.group;
    this.scene.add(this.works);
    this.scene.add(buildWorksLamps(this.ctx, works.lamps));

    // The cloud sea is the world's ground to the horizon, and the thing the voyage reads as terrain.
    this.sea = createCloudSea({ radius: 1500, y: SEA });
    this.own(this.sea.geometry, this.sea.material);
    this.terrainMesh = this.sea;
    this.scene.add(this.sea);

    this.cloudHeads = buildCloudHeads(this.ctx, SEA);
    this.scene.add(this.cloudHeads);
    this.vista = buildVista(this.ctx);
    this.scene.add(this.vista);
  }

  /* ======================================================================
     LANDMARKS: the pad, and the Compressor on its plinth
     ====================================================================== */

  initLandmarks() {
    const ctx = this.ctx;
    for (const lm of this.data.landmarks) {
      if (lm.asset !== 'landing-pad') continue;
      const node = buildLandingPad(ctx);
      node.position.set(lm.pos[0], this.getTerrainHeight(lm.pos[0], lm.pos[2]), lm.pos[2]);
      node.name = `landing-pad@${lm.pos[0]},${lm.pos[2]}`;
      node.userData.phys = 'ground';
      this.scene.add(node);
    }
    const tower = buildCompressorTower(ctx);
    tower.position.set(...COMPRESSOR_AT);
    tower.name = 'compressor-tower';
    for (const v of tower.userData.vents || []) this.vents.push([COMPRESSOR_AT[0] + v[0], COMPRESSOR_AT[1] + v[1], COMPRESSOR_AT[2] + v[2]]);
    this.scene.add(tower);
    this.compressor = tower;
  }

  /* ======================================================================
     THE SIX HOSTS
     ====================================================================== */

  /** Which way a site faces: toward the floor a player walks in from (derived from `approachPos`). */
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
        this.hostVents.push([x, g.position.y + v.ly, z]);
      }

      // The places the player is sent to for this bench (a field stage): real pieces of the host, in the world's frame.
      for (const fp of host.fieldPoints || []) {
        const [px, pz] = at(fp.lx, fp.lz);
        const [sx, sz] = at(fp.stand.lx, fp.stand.lz);
        registerFieldPoint(this, {
          id: fp.id, siteId: site.id, label: fp.label, host: site.id,
          pos: [px, g.position.y + fp.ly, pz], half: fp.half, rotY: g.rotation.y,
          stand: [sx, g.position.y, sz]
        });
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

  /** The way on foot to a bench: deck by deck, along the catwalks and ramps, door by door (`lib/workings.js`). */
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
    const vents = [...this.vents, ...this.hostVents, ...(this.data.vents || []).map(v => [v.x, v.y, v.z])];
    this.effects = createBellowsEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents
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
    this.cover = makeCover({ sun: SUN_DIR, ...this.plan.coverSpec() });
    this.cover.applyTo(this.scene);
  }

  /** WHAT NEVER MOVES IS BAKED. The cased instruments, the indicators and the Compressor's moving parts stay their own meshes. */
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
     COLLISION: the walls and rails the plan declares, the drum's ring, the hosts
     ====================================================================== */

  buildColliders() {
    for (const c of this.plan.wallColliders()) this.colliders.push(c);
    for (const c of this.plan.extraColliders()) this.colliders.push(c);
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /* ======================================================================
     FRAME
     ====================================================================== */

  update(delta, cameraPos) {
    this.elapsed += delta;
    bwSkyUniforms.uBwTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      this.sea.material.uniforms.uBwEye.value.copy(cameraPos);
      const moved = followBwShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      // The Compressor moves, so its shadow is re-drawn a little more often than a still world's.
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 6 });
      this.effects?.update(delta, this.elapsed, cameraPos);
      this.lampPool?.update(cameraPos);
    }
    for (const o of this.movers) {
      const m = o.userData.mover;
      if (m.kind === 'stroke') o.position.y = m.base + Math.sin(this.elapsed * m.rate) * m.amp;
      else if (m.kind === 'spin') o.rotation.z += m.rate * delta;
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
