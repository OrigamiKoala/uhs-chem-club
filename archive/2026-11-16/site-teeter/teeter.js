/**
 * teeter.js — Teeter, Learn world 08, as a place you walk (T4).
 *
 * A field of salt pans: shallow, flat, still brine in rectangular pans over floors of white crust, held apart by
 * dikes of packed clay, with a shell causeway running north from the landing pad through the middle of them. The
 * ground the player walks is the dike tops and the causeway; the pans are fenced by their banks and never waded.
 * Eight dikes run out from the causeway, the odd benches on the west and the even on the east, each ending in a
 * head that holds a host: the sluice gate, the weigh house, the tilting gauge, the sorting house, the ledger desk,
 * the pump station, the settling pond and the plotting hut. Beam pumps stand in the pans and rock like see-saws.
 * The causeway ends on a plaza on the shore of the largest pan, which is where the Tipper is fought.
 *
 * It is built behind the SAME contract as every walkable Learn world, so the stage, the voyage, the walk HUD
 * and the bench dispatcher treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   teeter/atmosphere.js   the sky, the sun, the environment
 *   teeter/terrain.js      the pans cut into the land; roads, brine sheets and the boss's plaza
 *   teeter/plant.js        the beam pumps, salt heaps, brine tanks, salt houses, drums and sacks
 *   teeter/stations.js     the eight hosts the benches are built into (host-plan.js is their footprints)
 *   materials/teeter-textures.js   the surfaces
 * laid out by `tools/gen-teeter-layout.mjs`.
 *
 * THE RULES IT KEEPS, as the other worlds do: nothing occupies the same space as anything else; a site faces
 * the ground the player walks in from; ONLY LAMPS ARE LIT (a work lamp is a `lampMark` pooled into three real
 * lights; nothing owns a PointLight); what never moves is baked (the beam pumps' beams and rods are the only
 * moving parts, and they are kept out of the bake).
 */

import * as THREE from 'three';
import teeterData from './world-data/teeter.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic, canvas2d } from './materials/pbr-kit.js';
import { panCrust, causeway, saltSlab, brineRipple } from './materials/teeter-textures.js';
import {
  createTtSkyDome, createTtLights, followTtShadow, createTtEnvironment, ttSkyUniforms, followCamera, TTSKY
} from './teeter/atmosphere.js';
import { makeTeeterField, buildTeeterTerrainGeometry, buildBrineGeometry, buildRibbon, buildDisc, PAN } from './teeter/terrain.js';
import {
  buildBeamPump, buildSaltHeap, buildBrineTank, buildSaltHouse, buildDrumStack, buildSackStack,
  buildLampPost, buildLandingPad
} from './teeter/plant.js';
import { yawPoint } from './ember/kit.js';
import { HOST_BUILDERS } from './teeter/stations.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** The amber filament every work lamp in the world burns. A lamp is a lamp. */
const FILAMENT = 0xd99423;

/** Landmarks that are round, or turn themselves: their group is never turned. */
const SELF_TURNED = new Set(['lamp-post', 'brine-tank', 'salt-heap']);

const BUILDERS = {
  'beam-pump': buildBeamPump, 'salt-heap': buildSaltHeap, 'brine-tank': buildBrineTank, 'salt-house': buildSaltHouse,
  'drum-stack': buildDrumStack, 'sack-stack': buildSackStack
};

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

export class TeeterWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = teeterData;
    this.scene = new THREE.Scene();
    this.scene.name = 'teeter';

    this.colliders = [];
    this.siteMarkers = new Map();    // questId -> { site, group, indicator }
    this.benchAnchors = new Map();   // questId -> the physical frame of that site's working surface
    this.disposables = [];
    this.lamps = [];                 // lampMarks: where the pooled light comes from
    this.landmarkNodes = [];         // [{ lm, node }] for colliders
    this.animated = [];              // groups with userData.animate(t): the beam pumps
    this.siteColliders = [];
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The flat and the mesas run to the horizon on their own; the voyage must not lay a ring over them.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.field = makeTeeterField(this.data);

    this.initMaterials();
    this.initLighting();
    this.sky = createTtSkyDome(900);
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

  /** What the builders are handed: materials, `own`, the lamp list and the tier. */
  get ctx() {
    return { M: this.M, own: (...o) => this.own(...o), lamps: this.lamps, t4: this.t4, field: this.field };
  }

  /** `aoMap` samples the SECOND uv set, which a primitive geometry does not have: reuse the first. */
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

  /* ---------------------------------------------------------------- materials */

  initMaterials() {
    const M = {};
    const std = o => new THREE.MeshStandardMaterial(o);
    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256) => {
      const m = buildMaterial(platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 2, roughness: 1.0 });
      m.normalScale.set(1.2, 1.2);
      m.aoMapIntensity = 0.85;
      return m;
    };
    M.slab = buildMaterial(saltSlab({ size: texSize(512), seed: 7 }), { repeat: 1, roughness: 1.0 });
    M.concrete = M.slab;
    // Salt-pan metal is galvanised and pale, with the white bloom of spray over the rust.
    M.clad = metal('#cfd2cd', '#aeb2ad', '#a08a6c', 81, 0.3, 2, 512);
    M.steel = metal('#9da39d', '#808880', '#8d6f52', 83, 0.4, 2, 512);
    M.darkSteel = metal('#43484a', '#585d5c', '#76604c', 85, 0.5, 4);
    M.rusted = metal('#76543e', '#62544a', '#84512f', 87, 0.8, 3);
    M.plaster = metal('#dcd7c9', '#b8b3a5', '#9c8467', 91, 0.35, 3, 512);
    M.roofSheet = metal('#8e9593', '#7c8381', '#8a6444', 95, 0.55, 5);
    M.crate = metal('#8a8f72', '#767b62', '#85654a', 101, 0.45, 2);
    M.crateB = metal('#a58559', '#85704c', '#74543a', 103, 0.5, 2);
    M.benchTop = metal('#a9aeaa', '#8d938f', '#8a7358', 105, 0.4, 3);
    M.timber = std({ color: 0x9c8a6c, roughness: 0.95, metalness: 0 });
    M.salt = std({ color: 0xece9de, roughness: 0.95, metalness: 0 });
    M.saltHeap = M.salt;
    M.saltWhite = std({ color: 0xf3f1e8, roughness: 0.9, metalness: 0 });
    M.sack = std({ color: 0xd9d3c0, roughness: 0.95, metalness: 0 });
    M.brass = std({ color: 0xb08d4c, roughness: 0.42, metalness: 0.9 });
    M.copper = std({ color: 0xb06a43, roughness: 0.45, metalness: 0.9 });
    M.rubber = std({ color: 0x1c1a1a, roughness: 0.9, metalness: 0 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintBlue = std({ color: 0x3f6f8c, roughness: 0.62, metalness: 0.3 });
    M.paintYellow = std({ color: 0xc9a14a, roughness: 0.7, metalness: 0.1 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe8e2d4, roughness: 0.6, metalness: 0 });
    // Brine is still, grey-green and glossy: a sheet in a host's basin, and the translucent sheet over a pan's crust.
    const ripple = () => buildMaterial(brineRipple({ size: texSize(256), seed: 9 }), { repeat: 1, roughness: 0.14 });
    M.brine = ripple();
    M.brine.envMapIntensity = 1.3;
    M.panWater = ripple();
    M.panWater.envMapIntensity = 1.3;
    M.panWater.transparent = true;
    M.panWater.opacity = 0.78;
    M.panWater.depthWrite = false;
    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1214, roughness: 0.18, metalness: 0.2 });
    // THE ONE CLEAN THING in a weathered works: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe9e4d6, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2f333a, roughness: 0.55, metalness: 0.4 });
    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    // The causeway and the spurs: shell and grit, feathered into the clay at both edges.
    M.road = buildMaterial(causeway({ size: texSize(512), seed: 3 }), { repeat: 1, roughness: 1.0 });
    M.road.alphaMap = this.own(this.featherTexture());
    M.road.transparent = true;
    M.road.depthWrite = false;
    M.road.polygonOffset = true;
    M.road.polygonOffsetFactor = -2;
    M.road.polygonOffsetUnits = -2;

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
      for (const [s, col] of [[0, '#000'], [0.2, '#fff'], [0.8, '#fff'], [1, '#000']]) g.addColorStop(s, col);
      x.fillStyle = g;
    } else x.fillStyle = '#fff';
    x.fillRect(0, 0, 64, 4);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.ClampToEdgeWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  /* ------------------------------------------------------------ light and sky */

  initLighting() {
    const { key, hemi } = createTtLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    // The haze is the horizon's own colour; near and far are what the voyage reads.
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = TTSKY.horizon.clone();
    const env = createTtEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.8;
    }
  }

  /* ------------------------------------------------------------ the ground */

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const crust = buildMaterial(panCrust({ size: texSize(512), seed: 31 }), { repeat: 1, roughness: 1.0 });
    crust.vertexColors = true;
    crust.normalScale.set(1.3, 1.3);
    crust.envMapIntensity = 0.7;
    for (const t of crust.userData.surfaceMaps || []) { t.anisotropy = aniso; this.own(t); }
    this.own(crust);

    const geo = this.own(buildTeeterTerrainGeometry(this.field, this.data));
    this.terrainMesh = new THREE.Mesh(geo, crust);
    this.terrainMesh.name = 'teeter-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    // The brine: one sheet per pan, over the crust. It is ambience (nothing stands on it), so it is exempt from the overlap rule.
    const brine = new THREE.Group();
    brine.name = 'teeter-brine';
    brine.userData.phys = 'ambient';
    for (const p of this.data.pans) {
      const m = new THREE.Mesh(this.own(buildBrineGeometry(p)), this.M.panWater);
      m.renderOrder = 2;
      m.userData.noWeather = true;
      brine.add(m);
    }
    this.scene.add(brine);

    // The causeway, a spur to every approach, the pad's spur, and the boss's plaza.
    const ribbons = this.data.roads.map(r => buildRibbon(this.field, r.pts, r.width));
    ribbons.push(buildDisc(this.field, this.data.arena.boss[0], this.data.arena.boss[2], 10.5));
    const g = new THREE.Group();
    g.name = 'teeter-roads';
    g.userData.phys = 'ground';
    for (const geo2 of ribbons) {
      const m = new THREE.Mesh(this.own(geo2), this.M.road);
      m.renderOrder = 1;
      m.receiveShadow = this.t4;
      m.userData.noWeather = true;
      g.add(m);
    }
    this.scene.add(g);
  }

  /* ------------------------------------------------------------ the plant */

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

  /* ------------------------------------------------------------ the sites */

  /** Which way a site faces: toward the ground a player walks in from, derived from `approachPos`. */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    return Math.hypot(ax, az) < 0.01 ? 0 : Math.atan2(ax, az);
  }

  /**
   * Build every host: the piece of the works a bench belongs to (stations.js), placed at its site and turned to
   * face its approach. A host is built whether or not its quest is live yet (`site.built` says whether the quest is; an unbuilt
   * site reads SEALED at the door), so a bench lands in its host the day it goes live. The bench is a part of its host, one object.
   */
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
      // The host's colliders are in its own frame; the walk wants them in the world's. A host is turned to face its approach, and
      // a turned box would collide as the larger box that holds it, so a box is laid as a row of discs along its long side.
      for (const c of host.colliders) {
        if (c.r !== undefined) { const [x, z] = at(c.lx, c.lz); this.siteColliders.push({ x, z, radius: c.r }); continue; }
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

  /** Record where a bench's working surface is, in world terms. */
  registerBenchAnchor(site, group, bench, local) {
    const cos = Math.cos(group.rotation.y), sin = Math.sin(group.rotation.y);
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

  /** The working surface for a quest's site, or null if it has no bench. */
  benchAnchor(questId) {
    return this.benchAnchors.get(questId) || null;
  }

  /** Light a site's indicator when its quest is complete: the world reads state, it never keeps it. */
  setSiteComplete(questId, complete) {
    const marker = this.siteMarkers.get(questId);
    if (!marker?.indicator) return;
    marker.indicator.material.emissiveIntensity = complete ? 1.7 : 0;
    marker.indicator.material.color.setHex(complete ? FILAMENT : 0x4a4038);
    marker.indicator.material.needsUpdate = true;
  }

  /* ------------------------------------------------------------ lamps, bake, walls */

  /** THE WORK LAMPS SHARE THREE LIGHTS: only the lamps round the player need a real light at all (lamp-pool.js). */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  /** WHAT NEVER MOVES IS BAKED. The cased instruments and the indicators stay their own meshes. */
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
    // Then, where the world is going to be drawn, the props are baked together, a material at a time, by patch of
    // ground (pbr-kit.js). The checks build a world with no renderer and read it prop by prop, as it was laid out.
    this.staticMerge = this.renderer ? consolidateStatic(this.scene) : null;
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  /** Every prop collides as the part of it a body can actually touch. */
  buildColliders() {
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }
    for (const c of this.siteColliders) this.colliders.push(c);
    // THE PANS ARE FENCED. A pan is shallow, and shallow water is never waded or climbed: each pan near the walk is a box, held in
    // to where its bank begins to fall, so the ground that is walked is the dike tops and the causeway.
    for (const p of this.data.pans) {
      if (p.decor) continue;
      this.colliders.push({ minX: p.minX + PAN.rim - 0.2, maxX: p.maxX - PAN.rim + 0.2, minZ: p.minZ + PAN.rim - 0.2, maxZ: p.maxZ - PAN.rim + 0.2 });
    }
  }

  /* ------------------------------------------------------------ frame */

  update(delta, cameraPos) {
    this.elapsed += delta;
    ttSkyUniforms.uTtTime.value = this.elapsed;
    for (const node of this.animated) node.userData.animate(this.elapsed);
    // The brine creeps: its ripple slides slowly across every sheet (the shimmer of the air is the sky's).
    const n = this.M.panWater.normalMap, m = this.M.panWater.map, t = this.elapsed;
    if (n) n.offset.set(t * 0.004, t * 0.0025);
    if (m) m.offset.set(t * 0.002, -t * 0.0015);
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followTtShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
    // Work lamps are old, not alarming: a slow filament drift.
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
