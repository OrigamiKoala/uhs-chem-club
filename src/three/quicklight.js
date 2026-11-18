/**
 * quicklight.js — Quicklight, Learn world 11 (kinetics), as a place you walk (T4).
 *
 * Quicklight is A REFINERY PACKED ONTO A BLACK LAVA FIELD UNDER A STANDING STORM. Two flows lie one on the other; the upper
 * one's front crosses the site from west to east. On the LOWER FLOW: the laydown yard where the Avalon sets down, a grid of
 * alleys under pipe racks, the analyser bunker sunk under a heap of earth, the control block, and the tank bund sunk four
 * metres with the pump cellar in its wall. ONE RAMP goes up through the flow's front in a cutting to the REACTOR PLOT: the
 * cracking reactor on its skirt, the reactor train on its table, the catalyst bunker under its heap, and the fenced flare yard
 * where the Flare is fought. The benches are in those six rooms. `docs/plans/quicklight-world.md` section 7 is the spec.
 *
 * It is built behind the SAME contract as every walkable Learn world, so the stage, the voyage, the walk HUD and the bench
 * dispatcher treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   quicklight/refinery-plan.js  the alleys, the ramps, the rooms, the land, the cover, the way: pure data
 *   quicklight/terrain.js        the lava and the hardstanding, the paving, the kerbs and walls, every room's shell and the
 *                                structures over them (the cracking reactor, the reactor train, the control block)
 *   quicklight/stations.js       the six hosts (host-plan.js says which room each furnishes)
 *   quicklight/plant.js          the pipe racks and their lamps, the units packed between the alleys, the tank bund's tanks,
 *                                the flare stack, the rod pylons, the far country
 *   quicklight/atmosphere.js     the storm sky, the sun, the environment, the lightning
 * laid out by `tools/gen-quicklight-layout.mjs`. (The first build, two columns of rigs either side of a spine road on a flat
 * plate, is in `archive/2026-11-17/site-quicklight/`.)
 *
 * THE RULES IT KEEPS: nothing occupies the same space as anything else; a site faces the door the player walks in by; there is
 * one floor (the racks, the reactor and the table are bodies, never walked); ONLY LAMPS ARE LIT (a lamp is a `lampMark` in the
 * lamp pool), and the lightning is the one declared weather source; what never moves is baked. INSIDE A ROOM THE SUN IS TAKEN
 * AWAY: the cover mask (`lib/cover.js`) covers every room and passage, on a phone too.
 */

import * as THREE from 'three';
import quicklightData from './world-data/quicklight.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic, canvas2d } from './materials/pbr-kit.js';
import { stormBasalt, pourConcrete } from './materials/quicklight-textures.js';
import {
  createQlSkyDome, createQlLights, followQlShadow, createQlEnvironment, qlSkyUniforms, followCamera, QLSKY, QUICKLIGHT_SUN,
  buildLightning
} from './quicklight/atmosphere.js';
import { makeRefineryPlan } from './quicklight/refinery-plan.js';
import { makeQuicklightField, buildGroundGeometry, buildPaving, buildRefinery, mergeList } from './quicklight/terrain.js';
import * as PLANT from './quicklight/plant.js';
import { HOST_BUILDERS } from './quicklight/stations.js';
import { FILAMENT } from './kettle/kit.js';
import { makeCover } from './lib/cover.js';
import { yawPoint } from './ember/kit.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** Landmarks that are round, or turn themselves: their group is never turned. */
const SELF_TURNED = new Set(['lamp-post', 'landing-pad']);

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** The refinery is merged by material over squares this size, so frustum culling still has pieces to cull. */
const SQUARE = 40;

/** A diamond mesh with its holes cut (alpha), for chain-link (`diamond`) or for floor grating (`bars`). */
function openMesh(S = 128, kind = 'diamond') {
  const c = canvas2d(S, S);
  const x = c.getContext('2d');
  const img = x.createImageData(S, S);
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    let strand;
    if (kind === 'diamond') {
      const u = (i / S) * 6, v = (j / S) * 6;
      const fu = Math.abs((u % 1) - 0.5), fv = Math.abs((v % 1) - 0.5);
      strand = Math.abs(fu + fv - 0.5) < 0.07;
    } else {
      strand = (i % 8) < 2 || (j % 32) < 2;
    }
    const k = (j * S + i) * 4;
    const shade = 130 + ((i * 7 + j * 3) % 15);
    img.data[k] = shade; img.data[k + 1] = shade + 2; img.data[k + 2] = shade + 4;
    img.data[k + 3] = strand ? 255 : 0;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class QuicklightWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.name = 'quicklight';
    this.data = quicklightData;
    this.colliders = [];
    this.disposables = [];
    this.lamps = [];
    this.siteMarkers = new Map();
    this.benchAnchors = new Map();
    this.siteColliders = [];
    this.landmarkNodes = [];
    this.movers = [];
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The lava field runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    // THE REFINERY, AS A PLAN. The height field, the walk, the colliders, the light mask and the guide all stand on it.
    this.plan = makeRefineryPlan();
    const pad = this.data.landmarks.find(l => l.asset === 'landing-pad');
    this.field = makeQuicklightField(this.plan, pad ? [pad.pos[0], pad.pos[2]] : null);

    this.initMaterials();
    this.initLighting();
    this.sky = createQlSkyDome(900);
    this.scene.add(this.sky);
    this.initTerrain();
    this.initPlant();
    this.initLandmarks();
    this.initHosts();
    this.initLampPool();
    this.bakeStatics();
    this.buildColliders();
    this.enableAmbientOcclusion();
    this.initCover();
  }

  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /** What the builders are handed: materials, `own`, the lamp list, the tier, the field and the plan. */
  get ctx() {
    return { M: this.M, own: (...o) => this.own(...o), lamps: this.lamps, t4: this.t4, field: this.field, plan: this.plan };
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
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    // THE GROUND: young basalt for grain; the vertex colours say what it is (flow top, the front in section, hardstanding, earth).
    M.ground = buildMaterial(stormBasalt({ size: texSize(512), seed: 41 }), { repeat: 1, roughness: 1.0 });
    M.ground.vertexColors = true;
    M.ground.normalScale.set(1.25, 1.25);
    M.ground.envMapIntensity = 0.45;
    // CONCRETE, poured and weathered; a shade apart for each use.
    const concrete = (color, seed, repeat = 1) => {
      const m = buildMaterial(pourConcrete({ size: texSize(512), seed }), { repeat, roughness: 1.0 });
      m.color = new THREE.Color(color);
      return m;
    };
    M.concrete = concrete(0xa9a7a2, 7);
    M.face = concrete(0x8e8b86, 11);
    M.coping = concrete(0xb7b4ad, 13);
    M.floor = concrete(0x8d8a84, 17);
    M.block = concrete(0x9c978e, 19);
    M.skirt = concrete(0xb3aea4, 23);
    M.paving = concrete(0xffffff, 29);
    M.paving.vertexColors = true;
    for (const m of [M.ground, M.paving]) for (const t of m.userData.surfaceMaps || []) t.anisotropy = aniso;
    // STEEL from sections, painted long ago; galvanised where it is a rail; the vessels' aluminium jacket over insulation.
    M.steel = metal('#5f666d', '#4f565d', '#6e5440', 101, 0.5, 2, 512);
    M.darkSteel = metal('#30353b', '#40464d', '#4a3d33', 103, 0.5, 4);
    M.rusted = metal('#6c4b38', '#58483e', '#86482b', 107, 0.8, 3);
    M.rail = metal('#8e959a', '#7f878c', '#6b5a48', 111, 0.4, 2);
    M.cladding = metal('#a4a7a8', '#9a9d9e', '#7e6c58', 113, 0.35, 6, 512);
    M.corrugated = metal('#7d8184', '#6e7275', '#7b5136', 115, 0.7, 8);
    M.roof = metal('#6f7478', '#62676b', '#6e5038', 117, 0.6, 5);
    M.paintRed = metal('#7a2e24', '#5b5049', '#6e3a24', 119, 0.6, 2);
    M.benchTop = metal('#7c8c94', '#657680', '#485a64', 109, 0.35, 3);
    M.copper = std({ color: 0xa8673f, roughness: 0.45, metalness: 0.9 });
    M.brass = std({ color: 0xa88a4f, roughness: 0.42, metalness: 0.9 });
    // Fuel in a sight glass or a sample bottle: dark straw. A liquid, not a light.
    M.fuel = std({ color: 0x6e5427, roughness: 0.25, metalness: 0.05 });
    M.catalyst = std({ color: 0x8c8a80, roughness: 0.95, metalness: 0, flatShading: true });
    M.paint = std({ color: 0xd2d4d6, roughness: 0.65, metalness: 0.05 });
    M.rubber = std({ color: 0x1c1b1b, roughness: 0.9, metalness: 0 });
    M.paper = std({ color: 0xe2ddd0, roughness: 0.9, metalness: 0 });
    M.timber = std({ color: 0x5e5244, roughness: 0.95, metalness: 0 });
    M.void = std({ color: 0x0b0c0d, roughness: 1, metalness: 0 });
    // Chain-link and grating: strands kept, holes cut (alpha test, so it still writes depth).
    const link = this.own(openMesh(texSize(128), 'diamond'));
    M.fence = std({ color: 0x8c9296, map: link, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.6 });
    const grate = this.own(openMesh(texSize(128), 'bars'));
    M.grating = std({ color: 0x6c7176, map: grate, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.6 });
    M.glass = std({ color: 0xd5dfe8, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, depthWrite: false });
    M.glassDark = std({ color: 0x0f1216, roughness: 0.18, metalness: 0.2 });
    // THE ONE CLEAN THING in a weathered works: the cased instrument keeps its own paint.
    M.case = std({ color: 0xe6e8ee, roughness: 0.48, metalness: 0.25 });
    M.caseDark = std({ color: 0x262b33, roughness: 0.55, metalness: 0.4 });
    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5c4a34, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    for (const m of Object.values(M)) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /* ------------------------------------------------------------ light and sky */

  initLighting() {
    const { key, hemi } = createQlLights({ shadows: this.t4 });
    this.keyLight = key;
    this.hemi = hemi;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = QLSKY.horizon.clone();
    const env = createQlEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.7;
    }
  }

  /* ------------------------------------------------------------ the ground */

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  /** The ground mesh, the paving, and every built body. The ground, the paving and the built bodies are GROUND. */
  initTerrain() {
    const ground = this.own(buildGroundGeometry(this.field, this.plan));
    this.terrainMesh = new THREE.Mesh(ground, this.M.ground);
    this.terrainMesh.name = 'quicklight-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    // THE REFINERY'S BUILT BODIES, merged by material over 40 m squares.
    const lists = buildRefinery(this.plan);
    const built = new THREE.Group();
    built.name = 'refinery';
    built.userData.phys = 'ground';
    built.userData.noMerge = true;
    for (const [key, list] of Object.entries(lists)) {
      const squares = new Map();
      for (const g of list) {
        g.computeBoundingBox();
        const c = g.boundingBox.getCenter(new THREE.Vector3());
        const sk = `${Math.floor(c.x / SQUARE)},${Math.floor(c.z / SQUARE)}`;
        if (!squares.has(sk)) squares.set(sk, []);
        squares.get(sk).push(g);
      }
      for (const [sk, gs] of squares) {
        const geo = mergeList(gs);
        if (!geo) continue;
        const m = new THREE.Mesh(this.own(geo), this.M[key]);
        m.name = `refinery:${key}@${sk}`;
        m.castShadow = this.t4 && !['floor', 'fence', 'grating', 'rail'].includes(key);
        m.receiveShadow = this.t4;
        built.add(m);
      }
    }
    const paving = new THREE.Mesh(this.own(buildPaving(this.plan)), this.M.paving);
    paving.name = 'refinery:paving';
    paving.receiveShadow = this.t4;
    built.add(paving);
    this.scene.add(built);
    this.built = built;
  }

  /** The racks and their lamps, the units, the bund's tanks, the flare stack, the rod pylons, the far country. */
  initPlant() {
    this.plantColliders = [];
    for (const build of PLANT.PLANT_BUILDERS) {
      const node = build(this);
      if (!node) continue;
      this.scene.add(node);
      for (const m of node.userData.movers || []) this.movers.push(m);
      for (const c of node.userData.colliders || []) this.plantColliders.push(c.minX !== undefined ? { ...c } : { x: c.x, z: c.z, radius: c.r });
    }
    // THE WEATHER: lightning to the rod pylons, now and then. The one source that is not a lamp.
    this.lightning = buildLightning(this, PLANT.ROD_TIPS);
    this.scene.add(this.lightning.group);
    this.movers.push(this.lightning);
  }

  /** The laydown yard's pad and the lamp posts on the two yards. */
  initLandmarks() {
    const ctx = this.ctx;
    let posts = 0;
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      let node = null;
      if (lm.asset === 'lamp-post') node = PLANT.buildLampPost(ctx, posts++);
      else if (lm.asset === 'landing-pad') node = PLANT.buildLandingPad(ctx, this.field);
      if (!node) continue;
      const y = lm.asset === 'landing-pad' ? this.plan.height(lm.pos[0], lm.pos[2]) : this.getTerrainHeight(lm.pos[0], lm.pos[2]);
      node.position.set(lm.pos[0], y, lm.pos[2]);
      if (!SELF_TURNED.has(lm.asset)) node.rotation.y = lm.rotY || 0;
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      if (lm.asset === 'landing-pad') node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
    }
  }

  /** The way on foot from where the player stands to a site's approach mark, door by door through the grid. */
  routeTo(siteId, fromPos, toPos = null) {
    const site = this.data.sites.find(s => s.id === siteId);
    if (!site) return null;
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.z];
    const to = toPos ? [toPos[0], 0, toPos[1]] : site.approachPos;
    return this.plan.routeTo(from[0], from[from.length === 3 ? 2 : 1], to[0], to[2]);
  }

  /* ------------------------------------------------------------ the sites */

  /** Which way a site faces: toward the door a player walks in by, derived from `approachPos`. */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    return Math.hypot(ax, az) < 0.01 ? 0 : Math.atan2(ax, az);
  }

  /** Build every host in its room, turned to face its door. The bench is a part of its host, one object. */
  initHosts() {
    for (const site of this.data.sites) {
      const build = HOST_BUILDERS[site.id];
      if (!build) continue;
      const host = build(this);
      const g = host.group;
      g.position.set(site.pos[0], this.getTerrainHeight(site.pos[0], site.pos[2]), site.pos[2]);
      g.rotation.y = this.siteFacing(site);
      this.scene.add(g);
      for (const m of host.movers || []) this.movers.push(m);

      this.siteMarkers.set(site.questId, { site, group: g, indicator: host.bench.indicator });
      this.registerBenchAnchor(site, g, host.bench, host.benchLocal);

      const cos = Math.cos(g.rotation.y), sin = Math.sin(g.rotation.y);
      const at = (lx, lz) => [g.position.x + lx * cos + lz * sin, g.position.z - lx * sin + lz * cos];
      // Every room faces along an axis, so a host turns by a quarter turn and its box colliders stay boxes, exactly.
      for (const c of host.colliders) {
        if (c.r !== undefined) { const [x, z] = at(c.lx, c.lz); this.siteColliders.push({ x, z, radius: c.r }); continue; }
        const pts = [[c.lx - c.hw, c.lz - c.hd], [c.lx + c.hw, c.lz + c.hd]].map(([a, b]) => at(a, b));
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
    if (!marker?.indicator) return;
    marker.indicator.material.emissiveIntensity = complete ? 1.7 : 0;
    marker.indicator.material.color.setHex(complete ? FILAMENT : 0x4a4038);
    marker.indicator.material.needsUpdate = true;
  }

  /* ------------------------------------------------------------ lamps, bake, walls */

  /** Every lamp is declared to the pool (lamp-pool.js): where it is and whether it is on. */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
  }

  /** WHAT NEVER MOVES IS BAKED. The cased instruments, the indicators and the lightning stay their own. */
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
    // The far country is the horizon's own, and it is baked the same way.
    for (const node of this.scene.children) {
      if (node.name !== 'far-country') continue;
      mergeStatic(node);
      node.traverse(o => { if (o.isMesh) o.userData.phys = 'ambient'; });
    }
    this.staticMerge = this.renderer ? consolidateStatic(this.scene) : null;
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  /** The walk's walls (every closed side of every volume), the plant, the posts and every host's machinery. */
  buildColliders() {
    for (const { lm, node } of this.landmarkNodes) {
      const rot = node.rotation.y;
      for (const c of node.userData.colliders || []) {
        const [dx, dz] = yawPoint(c.x, c.z, rot);
        this.colliders.push({ x: lm.pos[0] + dx, z: lm.pos[2] + dz, radius: c.r });
      }
    }
    this.edgeColliders = this.plan.colliders();
    for (const c of this.edgeColliders) this.colliders.push(c);
    for (const c of this.plantColliders) this.colliders.push(c);
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /**
   * INSIDE A ROOM THE SUN IS TAKEN AWAY. The mask takes the sun and most of the sky out of every room and passage. A deployed
   * instrument arrives later with materials of its own; `update` covers it.
   */
  initCover() {
    this.cover = makeCover({ sun: QUICKLIGHT_SUN, ...this.plan.coverSpec() });
    this.cover.applyTo(this.scene);
  }

  /* ------------------------------------------------------------ frame */

  update(delta, cameraPos) {
    this.elapsed += delta;
    qlSkyUniforms.uQlTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followQlShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
    if ((this._coverTick = ((this._coverTick ?? 0) + 1) % 10) === 0) this.cover.applyTo(this.scene);
    for (const m of this.movers) m.update(this.elapsed);
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
    this.movers = [];
  }
}
