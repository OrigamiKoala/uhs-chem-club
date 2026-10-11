/**
 * bellows.js — Bellows, Learn world 04, as a place you walk (T4).
 *
 * A cloud deck. One great circular steel platform rides a sea of pressurised
 * cloud in thin air, with the Compressor standing at its middle, the six benches
 * of "Gases" on a ring round it, a road of work lamps between them, the gas works
 * (holders, scoops, vents, pipe racks) standing off outside the ring, a rail round
 * the edge and the Avalon's pad on the near side. There is no ground in Bellows:
 * what you stand on is a plate, and what is under the plate is weather.
 *
 * It is built behind the SAME contract as Tallow, Lanternfall and Ligar, so the
 * stage, the voyage, the walk HUD and the bench dispatcher treat it as just
 * another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 *
 * The pieces live beside it in `three/bellows/` (sky and cloud sea, deck and rail,
 * props, sites, effects), laid out by `tools/gen-bellows-layout.mjs`.
 *
 * THE RULES IT KEEPS, as the other worlds do:
 *   - NOTHING OCCUPIES THE SAME SPACE AS ANYTHING ELSE: every landmark declares a
 *     footprint, every pair is disjoint, and `verify:bellows` measures the world
 *     that was actually built.
 *   - A SITE FACES THE GROUND THE PLAYER WALKS IN FROM: the angle is derived from
 *     `approachPos`, so moving an approach mark turns the site to meet it.
 *   - ONLY LAMPS ARE LIT. A work lamp is a `lampMark` pooled into three real
 *     lights (`lamp-pool.js`); nothing here owns a PointLight.
 *   - WHAT NEVER MOVES IS BAKED. The Compressor's rod and wheel, the cased
 *     instruments and the indicators stay addressable; the rest is merged.
 *   - THE RAIL IS A WALL. The deck's edge is a closed ring of colliders, so the
 *     only drop in the world is one nobody can reach.
 */

import * as THREE from 'three';
import bellowsData from './world-data/bellows.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, treadPlate, buildMaterial, enableAO, texSize, mergeStatic
} from './materials/pbr-kit.js';
import {
  createBwSkyDome, createCloudSea, createBwLights, followBwShadow, createBwEnvironment,
  bwSkyUniforms, followCamera, BWSKY
} from './bellows/atmosphere.js';
import { makeBellowsField, buildDeckGeometry, buildRim, buildMarkings, buildUnderside } from './bellows/terrain.js';
import {
  buildCompressorTower, buildGasholder, buildScoopPylon, buildPipeRack, buildVentStack,
  buildCrateStack, buildMooredBladder, buildLampPost, buildCommsMast, buildLandingPad, buildCloudHeads
} from './bellows/props.js';
import { buildSite } from './bellows/sites.js';
import { createBellowsEffects } from './bellows/effects.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every work lamp in the world burns. A lamp is a lamp. */
const FILAMENT = 0xd99423;

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

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
    this.vents = [];                 // world-space plume mouths
    this.movers = [];                // the Compressor's rod and wheel
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The cloud sea runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.field = makeBellowsField(this.data);

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initDeck();
    this.initLandmarks();
    this.initSites();
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
    // The deck: tread plate, cold and bright, scoured by thin air and sun more than by rain.
    M.deck = buildMaterial(treadPlate({ size: texSize(512), base: '#8e949c', seed: 7, weather: 0.35 }), { repeat: 1, roughness: 1.0 });
    M.deck.normalScale.set(1.1, 1.1);
    M.deck.envMapIntensity = 0.9;
    M.deck.vertexColors = false;

    const steel = platedMetal({
      paint: '#b9c3cf', metal: '#8d98a5', rust: '#8a7660',
      panels: 2, seed: 61, weather: 0.3, size: texSize(512)
    });
    const dark = platedMetal({
      paint: '#3d4756', metal: '#5a6574', rust: '#6b5a48',
      panels: 4, seed: 67, weather: 0.38, size: texSize(256)
    });
    const clad = platedMetal({
      paint: '#d9dee6', metal: '#9aa4b2', rust: '#9a8266',
      panels: 3, seed: 71, weather: 0.22, size: texSize(256)
    });
    M.steel = buildMaterial(steel, { repeat: 2, roughness: 1.0 });
    M.darkSteel = buildMaterial(dark, { repeat: 3, roughness: 1.0 });
    M.cladding = buildMaterial(clad, { repeat: 2, roughness: 1.0 });
    for (const m of [M.steel, M.darkSteel, M.cladding]) { m.normalScale.set(1.2, 1.2); m.aoMapIntensity = 0.85; }

    M.brass = new THREE.MeshStandardMaterial({ color: 0xb08d4c, roughness: 0.4, metalness: 0.9 });
    M.skin = new THREE.MeshStandardMaterial({ color: 0x3b3b41, roughness: 0.82, metalness: 0.05 });
    M.crate = new THREE.MeshStandardMaterial({ color: 0x6a7684, roughness: 0.85, metalness: 0.2 });
    M.cloud = new THREE.MeshStandardMaterial({ color: 0xf2f5fa, roughness: 1, metalness: 0 });
    M.rime = new THREE.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.6, metalness: 0 });

    // Hazed panes and dark glass. Transparent materials are decals to the overlap
    // check and are left out of a bake, as in the other worlds.
    M.pane = new THREE.MeshStandardMaterial({
      color: 0xdbe6f3, roughness: 0.35, metalness: 0, transparent: true, opacity: 0.34,
      depthWrite: false, side: THREE.DoubleSide
    });
    M.glass = new THREE.MeshStandardMaterial({
      color: 0xc4dcef, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false
    });
    M.glassDark = new THREE.MeshStandardMaterial({ color: 0x0b1219, roughness: 0.2, metalness: 0.2 });

    // Paint on the deck, and the ink of a rule or a dial: a decal, and a plain dark-on-light mark.
    M.paint = new THREE.MeshStandardMaterial({
      color: 0xc9a14a, roughness: 0.8, metalness: 0, transparent: true, opacity: 0.92,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false
    });
    M.paint2 = new THREE.MeshStandardMaterial({ color: 0xe8eef6, roughness: 0.6, metalness: 0 });

    // The one warm thing: an amber filament behind glass.
    M.lantern = new THREE.MeshStandardMaterial({
      color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6
    });

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

    // The haze is the horizon's own colour; near and far are what the voyage reads.
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
     THE DECK AND THE SEA
     ====================================================================== */

  /** The walking surface: the deck inside its rim, and the sea of cloud below it (a drop nobody can reach). */
  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initDeck() {
    const R = this.data.deck.radius;
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    for (const t of this.M.deck.userData.surfaceMaps || []) t.anisotropy = aniso;

    this.deckMesh = new THREE.Mesh(this.own(buildDeckGeometry(R)), this.M.deck);
    this.deckMesh.name = 'bellows-deck';
    this.deckMesh.userData.phys = 'ground';
    this.deckMesh.userData.noWeather = true;
    this.deckMesh.receiveShadow = this.t4;
    this.scene.add(this.deckMesh);

    this.scene.add(buildUnderside(this.ctx, R, this.data.deck.seaLevel));

    const rim = buildRim(this.ctx, R);
    this.scene.add(rim.group);
    this.rimColliders = rim.colliders;

    this.scene.add(buildMarkings(this.ctx, this.data));

    // The cloud sea is the world's ground to the horizon, and the thing the voyage reads as terrain.
    this.sea = createCloudSea({ radius: 1500, y: this.data.deck.seaLevel });
    this.own(this.sea.geometry, this.sea.material);
    this.terrainMesh = this.sea;
    this.scene.add(this.sea);

    this.cloudHeads = buildCloudHeads(this.ctx, this.data.deck.seaLevel);
    this.scene.add(this.cloudHeads);
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
      let node = null;
      switch (lm.asset) {
        case 'compressor-tower': node = buildCompressorTower(ctx); break;
        case 'gasholder': node = buildGasholder(ctx, lm.rotY || 0); break;
        case 'scoop-pylon': node = buildScoopPylon(ctx, lm.rotY || 0); break;
        case 'pipe-rack': node = buildPipeRack(ctx, lm.rotY || 0); break;
        case 'vent-stack': node = buildVentStack(ctx); break;
        case 'crate-stack': node = buildCrateStack(ctx, lm.rotY || 0, seed++); break;
        case 'bladder-moor': node = buildMooredBladder(ctx, lm.rotY || 0); break;
        case 'lamp-post': node = buildLampPost(ctx, posts++); break;
        case 'comms-mast': node = buildCommsMast(ctx); break;
        case 'landing-pad': node = buildLandingPad(ctx); break;
        default: node = null;
      }
      if (!node) continue;
      node.position.set(lm.pos[0], 0, lm.pos[2]);
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      for (const v of node.userData.vents || []) this.vents.push([lm.pos[0] + v[0], v[1], lm.pos[2] + v[2]]);
      this.scene.add(node);
    }
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

  /** A point in a site's own frame, in world terms. */
  siteToWorld(site, lx, lz) {
    const a = this.siteFacing(site);
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [site.pos[0] + lx * c + lz * s, site.pos[2] - lx * s + lz * c];
  }

  initSites() {
    this.siteColliders = [];
    for (const site of this.data.sites) {
      const built = buildSite(this.ctx, site);
      const y = this.getTerrainHeight(site.pos[0], site.pos[2]);
      built.group.position.set(site.pos[0], y, site.pos[2]);
      built.group.rotation.y = this.siteFacing(site);
      this.scene.add(built.group);

      this.siteMarkers.set(site.questId, { site, group: built.group, indicator: built.bench.indicator });
      this.registerBenchAnchor(site, built.group, built.bench, built.benchLocal);
      for (const c of built.colliders) {
        const [x, z] = this.siteToWorld(site, c.x, c.z);
        this.siteColliders.push({ x, z, radius: c.radius });
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
    this.effects = createBellowsEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents: this.vents
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
   * mesh or two per material; the cased instruments, the indicators and the
   * Compressor's moving parts stay their own meshes.
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
    const push = (x, z, radius) => this.colliders.push({ x, z, radius });
    const rot = (lm, lx, lz) => {
      const c = Math.cos(lm.rotY || 0), s = Math.sin(lm.rotY || 0);
      return [lm.pos[0] + lx * c + lz * s, lm.pos[2] - lx * s + lz * c];
    };

    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      switch (lm.asset) {
        case 'lamp-post': push(lm.pos[0], lm.pos[2], 0.3); break;
        case 'compressor-tower': push(lm.pos[0], lm.pos[2], 11.4); break;
        case 'gasholder':
          // The holder stands on six legs: a player can walk under the sphere, never through a leg.
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + 0.2;
            const [x, z] = rot(lm, Math.cos(a) * 3.9, Math.sin(a) * 3.9);
            push(x, z, 0.55);
          }
          break;
        case 'scoop-pylon': push(lm.pos[0], lm.pos[2], 1.7); break;
        case 'vent-stack': push(lm.pos[0], lm.pos[2], 1.5); break;
        case 'comms-mast': push(lm.pos[0], lm.pos[2], 0.7); break;
        case 'pipe-rack':
          // Elevated: it collides as its trestle feet, and you walk under the pipes.
          for (const x of [-6.2, -2.07, 2.07, 6.2]) {
            for (const z of [-1.5, 1.5]) { const [px, pz] = rot(lm, x, z); push(px, pz, 0.45); }
          }
          break;
        case 'bladder-moor':
          for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) { const [px, pz] = rot(lm, x, 0); push(px, pz, 1.3); }
          break;
        case 'crate-stack': push(lm.pos[0], lm.pos[2], 1.9); break;
        default: break;   // the pad is walked over
      }
    }
    for (const c of this.siteColliders) this.colliders.push(c);
    for (const c of this.rimColliders) this.colliders.push(c);
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
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0, every: 6 });
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
