/**
 * lanternfall.js — Lanternfall, Learn world 02, as a place you walk (T4).
 *
 * A glacier tongue ends in an ice cliff on a frozen lake under a permanent aurora. The expedition works round the lake's
 * shore and over the glacier: a walk climbs the east ablation valley between the moraine and the ice, crosses the
 * glacier above the snout, and comes down the west valley past a nunatak and an erratic to the south shore and the pad.
 * The ten benches of "Light and Electrons" are in rooms off that walk: two caves under the shore's pressure ridges on
 * the lake ice, a vault in the moraine under an aurora mast, a meltwater cave in the glacier's margin, the drilling
 * crawler's hall, the records tent at the bottom of a crevasse and its annexe cut into the ice, a chamber in the
 * nunatak under its tower, a room under the erratic, and the observatory's dome.
 *
 * Public contract (identical across all walkable Learn worlds):
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool, cover,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * The plan (`lanternfall/glacier-plan.js`) is the one declaration the layout generator, this world, the walk and
 * `verify:lanternfall` stand on. The rules it keeps: nothing occupies the same space as anything else; a site faces its
 * approach; only lamps are lit, pooled into three lights; a roofed room is under the cover mask; what never moves is
 * baked.
 */

import * as THREE from 'three';
import lanternfallData from './world-data/lanternfall.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic
} from './materials/pbr-kit.js';
import { iceCrust, lakeIce, carvedIce } from './materials/lanternfall-textures.js';
import {
  createLfSkyDome, createLfLights, followLfShadow, createLfEnvironment, lfSkyUniforms, followCamera, LFSKY
} from './lanternfall/atmosphere.js';
import { makeGlacierPlan, YARD } from './lanternfall/glacier-plan.js';
import {
  buildTerrainGeometry, buildLakeGeometry, buildCutFaces, buildShoreRidges, buildSnout, buildVista
} from './lanternfall/ground.js';
import { buildAuroraMast, buildCommsMast, buildLanternPost, buildCamp, buildSled, buildLandingPad } from './lanternfall/props.js';
import { HOST_BUILDERS } from './lanternfall/stations.js';
import { createLanternfallEffects } from './lanternfall/effects.js';
import { LampPool } from './lamp-pool.js';
import { makeCover } from './lib/cover.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every lantern in the world burns. A lamp is a lamp. */
const FILAMENT = 0xd99423;

/** Toward the key light (the aurora's glow) in the world's frame: what the cover mask takes out of a roofed room. */
export const LF_SUN = new THREE.Vector3(-40, 120, -90).normalize();

/** How far (m) the player walks before the key light's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

export class LanternfallWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = lanternfallData;
    this.scene = new THREE.Scene();
    this.scene.name = 'lanternfall';

    this.colliders = [];
    this.siteMarkers = new Map();
    this.siteColliders = [];
    this.benchAnchors = new Map();
    this.disposables = [];
    this.lamps = [];
    this.landmarkNodes = [];
    this.elapsed = 0;
    this.benchesOpen = 0;
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.plan = makeGlacierPlan();
    this.field = this.plan;

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initLandmarks();
    this.initHosts();
    this.initEffects();
    this.initLampPool();
    this.initCover();
    this.bakeStatics();
    this.buildColliders();
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
    M.carved = buildMaterial(carvedIce({ size: texSize(256), seed: 3 }), { repeat: 2, roughness: 1.0 });
    M.carved.normalScale.set(1.2, 1.2);
    M.carved.envMapIntensity = 1.4;
    M.snow = std({ color: 0xe2eef3, roughness: 0.92, metalness: 0 });

    const metal = (paint, base, rust, seed, weather, panels, size) => buildMaterial(
      platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 2, roughness: 1.0 }
    );
    M.steel = metal('#9fb0b8', '#7f8f98', '#8a6f58', 41, 0.42, 2, 512);
    M.darkSteel = metal('#38444f', '#55626c', '#6b5543', 47, 0.5, 4, 256);
    M.clad = metal('#b7a46f', '#8f8a78', '#7d5f45', 49, 0.48, 3, 256);
    for (const m of [M.steel, M.darkSteel, M.clad]) { m.normalScale.set(1.2, 1.2); m.aoMapIntensity = 0.85; }

    M.frost = std({ color: 0xd7eaf2, roughness: 0.42, metalness: 0, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
    M.glass = std({ color: 0xbfe0ea, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false });
    M.glassDark = std({ color: 0x0b1219, roughness: 0.2, metalness: 0.2 });
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });
    M.timber = std({ color: 0x5a4a38, roughness: 0.96, metalness: 0 });
    M.canvas = std({ color: 0x8f9a8a, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
    M.tarp = std({ color: 0x6d7d87, roughness: 0.96, metalness: 0 });
    M.footing = std({ color: 0x6b7780, roughness: 1.0, metalness: 0 });
    M.rubber = std({ color: 0x1c2127, roughness: 0.95, metalness: 0.1 });
    M.paper = std({ color: 0xcfd3cc, roughness: 0.95, metalness: 0 });
    M.case = std({ color: 0xc4d3da, roughness: 0.48, metalness: 0.55 });
    M.caseDark = std({ color: 0x2d3a44, roughness: 0.5, metalness: 0.5 });
    M.paintRed = std({ color: 0x7e3428, roughness: 0.7, metalness: 0.2 });
    // Lake water seen down a hole: black and still, a mirror.
    M.water = std({ color: 0x06121a, roughness: 0.04, metalness: 0, envMapIntensity: 1.6 });

    // The land in section and the rooms' shells (painted per vertex where the colour says what the material is).
    M.faceIce = buildMaterial(carvedIce({ size: texSize(256), seed: 7 }), { repeat: 1, roughness: 0.9 });
    M.faceIce.envMapIntensity = 1.2;
    M.faceTill = std({ color: 0xffffff, roughness: 1.0, metalness: 0 });
    M.slab = buildMaterial(carvedIce({ size: texSize(256), seed: 11 }), { repeat: 1, roughness: 0.85 });
    M.slab.color = new THREE.Color(0xc9dde4);
    M.slab.envMapIntensity = 1.3;
    M.snowBridge = std({ color: 0xbcd0dc, roughness: 0.95, metalness: 0 });
    M.rockWall = std({ color: 0xffffff, roughness: 0.95, metalness: 0 });
    M.rockFloor = std({ color: 0x4a4d52, roughness: 0.95, metalness: 0 });
    M.stone = std({ color: 0x6f6c68, roughness: 0.96, metalness: 0 });
    M.granite = std({ color: 0x7d7872, roughness: 0.92, metalness: 0 });
    M.panel = std({ color: 0xc4ccd0, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide });
    M.serac = std({ color: 0xbcd6e4, roughness: 0.6, metalness: 0 });
    M.channel = std({ color: 0x8eb0c2, roughness: 0.15, metalness: 0 });

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /** Materials made after `initMaterials` (the kit's vertex-coloured twins) are owned once building is done. */
  ownMadeMaterials() {
    for (const m of this.M.__made || []) this.own(m);
    this.M.__made = [];
  }

  /* ======================================================================
     LIGHT AND SKY
     ====================================================================== */

  initLighting() {
    const { key, hemi } = createLfLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
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
     THE LAND
     ====================================================================== */

  /** The walking surface: the ONE height field (`glacier-plan.js`). */
  getTerrainHeight(x, z) {
    return this.plan.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const crust = buildMaterial(iceCrust({ size: texSize(512), seed: 5 }), { repeat: 1, roughness: 1.0 });
    crust.vertexColors = true;
    crust.normalScale.set(1.3, 1.3);
    crust.envMapIntensity = 0.9;
    for (const t of crust.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(crust);
    const geo = this.own(buildTerrainGeometry(this.plan));
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
    const lake = new THREE.Mesh(this.own(buildLakeGeometry(this.plan)), lakeMat);
    lake.name = 'lanternfall-lake';
    lake.userData.phys = 'ground';
    lake.userData.noWeather = true;
    lake.receiveShadow = this.t4;
    this.scene.add(lake);
    this.lakeMesh = lake;

    const ctx = this.ctx;
    this.scene.add(buildCutFaces(ctx, this.plan));
    this.scene.add(buildShoreRidges(ctx, this.plan));
    this.scene.add(buildSnout(ctx));
    this.scene.add(buildVista(ctx, this.plan));
    this.ownMadeMaterials();
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
        case 'aurora-mast': node = buildAuroraMast(ctx); break;
        case 'comms-mast': node = buildCommsMast(ctx); break;
        case 'lantern-post': node = buildLanternPost(ctx, posts++); break;
        case 'camp': node = buildCamp(ctx, lm.rotY || 0, seed++); break;
        case 'sled': node = buildSled(ctx, lm.rotY || 0); break;
        case 'landing-pad': node = buildLandingPad(ctx, this.plan); break;
        default: node = null;
      }
      if (!node) continue;
      node.position.set(lm.pos[0], lm.asset === 'landing-pad' ? YARD : y, lm.pos[2]);
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
    }
  }

  /* ======================================================================
     THE TEN HOSTS
     ====================================================================== */

  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    if (Math.hypot(ax, az) < 0.01) return 0;
    return Math.atan2(ax, az);
  }

  initHosts() {
    this.siteColliders = [];
    for (const site of this.data.sites) {
      const build = HOST_BUILDERS[site.id];
      if (!build || !site.built) continue;
      const host = build(this, this.plan);
      const g = host.group;
      g.position.set(site.pos[0], site.pos[1], site.pos[2]);
      g.rotation.y = this.siteFacing(site);
      this.scene.add(g);
      this.siteMarkers.set(site.questId, { site, group: g, indicator: host.bench.indicator, shell: host.shell });
      this.registerBenchAnchor(site, g, host.bench, host.benchLocal);

      const cos = Math.cos(g.rotation.y), sin = Math.sin(g.rotation.y);
      const at = (lx, lz) => [g.position.x + lx * cos + lz * sin, g.position.z - lx * sin + lz * cos];
      for (const c of host.colliders) {
        if (c.r !== undefined) {
          const [x, z] = at(c.lx, c.lz);
          this.siteColliders.push({ x, z, radius: c.r });
          continue;
        }
        // Every host faces along an axis: a box stays a box.
        const [p0x, p0z] = at(c.lx - c.hw, c.lz - c.hd);
        const [p1x, p1z] = at(c.lx + c.hw, c.lz + c.hd);
        this.siteColliders.push({ minX: Math.min(p0x, p1x), maxX: Math.max(p0x, p1x), minZ: Math.min(p0z, p1z), maxZ: Math.max(p0z, p1z) });
      }
    }
    this.ownMadeMaterials();
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

  /** The way on foot to a bench, door by door (`lib/workings.js`). */
  routeTo(siteId, fromPos, toPos = null) {
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.y, fromPos.z];
    const site = this.data.sites.find(s => s.id === siteId || s.questId === siteId);
    const to = toPos ? (Array.isArray(toPos) ? toPos : [toPos.x, toPos.y, toPos.z]) : site?.approachPos;
    if (!to) return [[from[0], from[from.length - 1]]];
    return this.plan.routeTo(from[0], from[from.length - 1], to[0], to[to.length - 1]);
  }

  /* ======================================================================
     AIR, LAMPS, COVER AND THE FRAME BUDGET
     ====================================================================== */

  initEffects() {
    this.effects = createLanternfallEffects({ heightAt: (x, z) => this.getTerrainHeight(x, z), t4: this.t4 });
    this.scene.add(this.effects.group);
  }

  /** THE LANTERNS SHARE THREE LIGHTS: only the lamps round the player need a real light (`lamp-pool.js`). */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  /** The cover mask: inside every room the key light and the sky are taken out; what is left is the lamps. */
  initCover() {
    this.cover = makeCover({ sun: LF_SUN, ...this.plan.coverSpec() });
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

  /* ======================================================================
     COLLISION
     ====================================================================== */

  buildColliders() {
    // 1. Every side of every walk volume and room that is not a doorway (`lib/workings.js`).
    for (const c of this.plan.wallColliders()) this.colliders.push(c);
    // 2. What stands on the walk.
    const push = (x, z, radius) => this.colliders.push({ x, z, radius });
    for (const { lm } of this.landmarkNodes) {
      switch (lm.asset) {
        case 'lantern-post': push(lm.pos[0], lm.pos[2], 0.3); break;
        case 'aurora-mast': push(lm.pos[0], lm.pos[2], 1.0); break;
        case 'comms-mast': push(lm.pos[0], lm.pos[2], 0.5); break;
        case 'camp': {
          const c = Math.cos(lm.rotY || 0), s = Math.sin(lm.rotY || 0);
          for (const [lx, lz, r] of [[-1.15, -0.4, 1.2], [1.05, 0.5, 1.0], [0.2, -1.25, 0.4]]) push(lm.pos[0] + lx * c + lz * s, lm.pos[2] - lx * s + lz * c, r);
          break;
        }
        case 'sled': push(lm.pos[0], lm.pos[2], 0.95); break;
        default: break;
      }
    }
    // 3. The hosts' machinery and benches.
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
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.effects?.update(delta, this.elapsed, cameraPos);
      this.lampPool?.update(cameraPos);
    }
    // The key light breathes with the aurora: a slow green drift, never a flash.
    this.keyLight.intensity = 1.25 + Math.sin(this.elapsed * 0.21) * 0.12;
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
