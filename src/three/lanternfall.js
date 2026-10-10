/**
 * lanternfall.js — Lanternfall, Learn world 02, as a place you walk (T4).
 *
 * An ice field under a permanent aurora. The nine benches of "Light and
 * Electrons" stand on a ring of packed ice round a frozen lake, each under its
 * own frosted shelter, with a road of amber lanterns between them, the ice
 * country standing off outside the ring and the Avalon's pad on the near side.
 * The sky is the first emission spectrum the player ever sees: a few exact
 * colours, hung in curtains, and the lanterns are the only warm light in a world
 * of cold colour.
 *
 * It is built behind the SAME contract as Tallow and Ligar (`TallowWorld`,
 * `LigarWorld`), so the stage, the voyage, the walk HUD and the bench dispatcher
 * treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 *
 * The pieces live beside it in `three/lanternfall/` (sky, terrain, props, sites,
 * effects) with PBR surfaces from `materials/lanternfall-textures.js`, laid out
 * by `tools/gen-lanternfall-layout.mjs`.
 *
 * THE RULES IT KEEPS, as Tallow and Ligar do:
 *   - NOTHING OCCUPIES THE SAME SPACE AS ANYTHING ELSE: every landmark declares
 *     a footprint, every pair is disjoint, and `verify:lanternfall` measures the
 *     world that was actually built.
 *   - A SITE FACES THE GROUND THE PLAYER WALKS IN FROM: the angle is derived
 *     from `approachPos`, so moving an approach mark turns the site to meet it.
 *   - ONLY LAMPS ARE LIT. A lantern is a `lampMark` pooled into three real
 *     lights (`lamp-pool.js`); nothing here owns a PointLight.
 *   - WHAT NEVER MOVES IS BAKED. `mergeStatic` folds every static group into a
 *     draw call or two; the cased instrument and the indicator stay addressable.
 */

import * as THREE from 'three';
import lanternfallData from './world-data/lanternfall.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, buildMaterial, enableAO, texSize, mergeStatic
} from './materials/pbr-kit.js';
import { iceCrust, lakeIce, carvedIce } from './materials/lanternfall-textures.js';
import {
  createLfSkyDome, createLfLights, followLfShadow, createLfEnvironment, lfSkyUniforms, followCamera, LFSKY
} from './lanternfall/atmosphere.js';
import { makeLanternfallField, buildLanternfallTerrainGeometry, buildLakeGeometry } from './lanternfall/terrain.js';
import {
  buildIceSpire, buildPressureRidge, buildAuroraMast, buildCommsMast, buildLanternPost,
  buildCamp, buildSled, buildStake, buildIceCrawler, buildLandingPad
} from './lanternfall/props.js';
import { buildSite } from './lanternfall/sites.js';
import { createLanternfallEffects } from './lanternfall/effects.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every lantern in the world burns. A lamp is a lamp. */
const FILAMENT = 0xd99423;

/** How far (m) the player walks before the key light's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

export class LanternfallWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = lanternfallData;
    this.scene = new THREE.Scene();
    this.scene.name = 'lanternfall';

    this.colliders = [];
    this.siteMarkers = new Map();    // questId -> { site, group, indicator }
    this.benchAnchors = new Map();   // questId -> the physical frame of that site's working surface
    this.disposables = [];
    this.lamps = [];                 // lampMarks: where the lanterns' pooled light comes from
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The ice runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.field = makeLanternfallField(this.data);

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initLandmarks();
    this.initSites();
    this.initEffects();
    this.initLampPool();
    this.bakeStatics();
    this.buildColliders();
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
    M.carved = buildMaterial(carvedIce({ size: texSize(256), seed: 3 }), { repeat: 2, roughness: 1.0 });
    M.carved.normalScale.set(1.2, 1.2);
    M.carved.envMapIntensity = 1.4;
    M.snow = new THREE.MeshStandardMaterial({ color: 0xe2eef3, roughness: 0.92, metalness: 0 });

    const steel = platedMetal({
      paint: '#9fb0b8', metal: '#7f8f98', rust: '#8a6f58',
      panels: 2, seed: 41, weather: 0.42, size: texSize(512)
    });
    const dark = platedMetal({
      paint: '#38444f', metal: '#55626c', rust: '#6b5543',
      panels: 4, seed: 47, weather: 0.5, size: texSize(256)
    });
    M.steel = buildMaterial(steel, { repeat: 2, roughness: 1.0 });
    M.darkSteel = buildMaterial(dark, { repeat: 3, roughness: 1.0 });
    for (const m of [M.steel, M.darkSteel]) { m.normalScale.set(1.2, 1.2); m.aoMapIntensity = 0.85; }

    // Frosted panels, clear ice, and dark glass. Transparent materials are decals to
    // the overlap check and are left out of a bake, as in the other worlds.
    M.frost = new THREE.MeshStandardMaterial({
      color: 0xd7eaf2, roughness: 0.42, metalness: 0, transparent: true, opacity: 0.42,
      depthWrite: false, side: THREE.DoubleSide
    });
    M.glass = new THREE.MeshStandardMaterial({
      color: 0xbfe0ea, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false
    });
    M.glassDark = new THREE.MeshStandardMaterial({ color: 0x0b1219, roughness: 0.2, metalness: 0.2 });

    // The one warm thing: an amber filament behind glass.
    M.lantern = new THREE.MeshStandardMaterial({
      color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6
    });
    M.timber = new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 0.96, metalness: 0 });
    M.canvas = new THREE.MeshStandardMaterial({ color: 0x8f9ea6, roughness: 0.95, metalness: 0 });

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
    const { key, hemi } = createLfLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);

    // The haze is the horizon's own colour; near and far are what the voyage reads.
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = LFSKY.horizon.clone();

    const env = createLfEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.75;
    }
  }

  initSky() {
    this.sky = createLfSkyDome(900);
    this.scene.add(this.sky);
  }

  /* ======================================================================
     TERRAIN
     ====================================================================== */

  /** The walking surface: the ice, the pad's deck and the flat under every bench. */
  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const crust = buildMaterial(iceCrust({ size: texSize(512), seed: 5 }), { repeat: 1, roughness: 1.0 });
    crust.vertexColors = true;
    crust.normalScale.set(1.4, 1.4);
    crust.envMapIntensity = 0.9;
    for (const t of crust.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(crust);

    const geo = this.own(buildLanternfallTerrainGeometry(this.field));
    this.terrainMesh = new THREE.Mesh(geo, crust);
    this.terrainMesh.name = 'lanternfall-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    // The frozen lake: dark clear ice, nearly a mirror, so the aurora is in it.
    const lakeMat = buildMaterial(lakeIce({ size: texSize(512), seed: 9 }), { repeat: 1, roughness: 1.0 });
    lakeMat.envMapIntensity = 2.0;
    lakeMat.normalScale.set(0.7, 0.7);
    for (const t of lakeMat.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(lakeMat);
    const lake = new THREE.Mesh(this.own(buildLakeGeometry(this.data.lake)), lakeMat);
    lake.name = 'lanternfall-lake';
    lake.position.set(this.data.lake.x, this.field.height(this.data.lake.x, this.data.lake.z) + 0.02, this.data.lake.z);
    lake.userData.phys = 'ground';
    lake.userData.noWeather = true;
    lake.receiveShadow = this.t4;
    this.scene.add(lake);
    this.lakeMesh = lake;
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
        case 'ice-spire': node = buildIceSpire(ctx, lm.scale || 1, lm.rotY || 0, seed++); break;
        case 'pressure-ridge': node = buildPressureRidge(ctx, lm.scale || 1, lm.rotY || 0, seed++); break;
        case 'aurora-mast': node = buildAuroraMast(ctx); break;
        case 'comms-mast': node = buildCommsMast(ctx); break;
        case 'lantern-post': node = buildLanternPost(ctx, posts++); break;
        case 'camp': node = buildCamp(ctx, lm.rotY || 0, seed++); break;
        case 'sled': node = buildSled(ctx, lm.rotY || 0); break;
        case 'stake-marker': node = buildStake(ctx); break;
        case 'ice-crawler': node = buildIceCrawler(ctx, lm.rotY || 0); break;
        case 'landing-pad': node = buildLandingPad(ctx, this.field); break;
        default: node = null;
      }
      if (!node) continue;
      node.position.set(lm.pos[0], lm.asset === 'landing-pad' ? 0 : y, lm.pos[2]);
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
    }
  }

  /* ======================================================================
     THE SITES
     ====================================================================== */

  /**
   * Which way a site faces: toward the ground a player walks in from. Derived
   * from `approachPos`, the same rule Tallow and Ligar follow, for the same
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
    this.effects = createLanternfallEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4
    });
    this.scene.add(this.effects.group);
  }

  /**
   * THE LANTERNS SHARE THREE LIGHTS. A lantern's light shows only within a few
   * metres of it, so only the lamps round the player need a real light at all
   * (lamp-pool.js). Twenty-six posts and nine work lamps are 35 sources.
   */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  /**
   * WHAT NEVER MOVES IS BAKED. Every top-level group not already baked becomes
   * a mesh or two per material; the cased instruments and the indicators stay
   * their own meshes, because casing one up hides exactly one thing.
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
      const sc = lm.scale || 1;
      switch (lm.asset) {
        case 'lantern-post': push(lm.pos[0], lm.pos[2], 0.3); break;
        case 'ice-spire': push(lm.pos[0], lm.pos[2], Math.min(lm.radius - 0.2, 1.5 * sc + 0.5)); break;
        case 'pressure-ridge': {
          const L = 8.2 * sc;
          for (let i = 0; i < 5; i++) {
            const t = (i / 4 - 0.5) * L * 0.92;
            const [x, z] = rot(lm, t, 0);
            push(x, z, 1.5 * Math.max(0.9, sc));
          }
          break;
        }
        case 'aurora-mast': push(lm.pos[0], lm.pos[2], 1.0); break;
        case 'comms-mast': push(lm.pos[0], lm.pos[2], 0.5); break;
        case 'camp':
          for (const [lx, lz, r] of [[-1.15, -0.4, 1.2], [1.05, 0.5, 1.0], [0.2, -1.25, 0.4]]) {
            const [x, z] = rot(lm, lx, lz);
            push(x, z, r);
          }
          break;
        case 'sled': push(lm.pos[0], lm.pos[2], 0.95); break;
        case 'ice-crawler':
          for (const lx of [-2.0, -0.7, 0.7, 2.0]) {
            const [x, z] = rot(lm, lx, 0);
            push(x, z, 1.7);
          }
          { const [x, z] = rot(lm, 1.35, 0); push(x, z, 1.4); }
          break;
        default: break;   // stakes and the pad are walked over
      }
    }
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /* ======================================================================
     FRAME
     ====================================================================== */

  update(delta, cameraPos) {
    this.elapsed += delta;
    lfSkyUniforms.uLfTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followLfShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0, every: 30 });
      this.effects?.update(delta, this.elapsed, cameraPos);
      this.lampPool?.update(cameraPos);
    }
    // The key light breathes with the aurora: a slow green drift, never a flash.
    this.keyLight.intensity = 1.25 + Math.sin(this.elapsed * 0.21) * 0.12;
    // Lanterns are old, not alarming: a slow filament drift.
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
  }
}
