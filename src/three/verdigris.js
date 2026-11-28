/**
 * verdigris.js — Verdigris, Learn world 09 (acids and bases), as a place you walk (T4).
 *
 * Verdigris is A DROWNED FORT IN A REED SWAMP. A masonry enceinte stands in the swamp with its ward flooded; its curtain
 * is broken in places, towers stand at its corners and on its north wall, the keep stands on a plinth in the ward, and
 * the fort's cisterns are low masonry heads out of the water. The Avalon sets down on a timber landing stage in the reeds
 * south-east of the fort; from there BOARDWALKS on piles turn and branch through the reeds, over the moat bridge, through
 * the gatehouse and between the towers. The benches are INSIDE THE FORT: in the gatehouse's winch chamber, in tower
 * chambers up ramps from the boardwalk, in the keep's hall, and down vaulted stairs in three cisterns sunk below the
 * water. The Leach is fought on the pump stage in the ward's north-east corner. `docs/plans/verdigris-world.md` section 8
 * is the site's spec.
 *
 * It is built behind the SAME contract as every walkable Learn world, so the stage, the voyage, the walk HUD and the bench
 * dispatcher treat it as just another place:
 *
 *   scene, data, colliders, terrainMesh, hasFarTerrain, lampPool,
 *   getTerrainHeight(x, z), benchAnchor(questId), setBenchDeployed(questId, on),
 *   setSiteComplete(questId, complete), routeTo(siteId, from, to), update(delta, cameraPos), dispose()
 *
 * WHERE EVERYTHING LIVES
 *   verdigris/fort-plan.js    the fort, the boardwalks, the rooms, the structures, the cover, the way: pure data
 *   verdigris/terrain.js      the swamp's bed, the water, the decks, the masonry and every room's shell
 *   verdigris/stations.js     the eight hosts (host-plan.js says which room each furnishes)
 *   verdigris/plant.js        the lamps, the reeds, the gate's sluices, the pump stage, the far country
 *   verdigris/atmosphere.js   the sky, the sun, the environment
 * laid out by `tools/gen-verdigris-layout.mjs`. (The first build, two columns of hosts either side of a plank spine over
 * a field of pools, is in `archive/2026-11-16/site-verdigris/`.)
 *
 * THE RULES IT KEEPS: nothing occupies the same space as anything else; a site faces the door the player walks in by;
 * there is one floor (a tower's storeys and a cistern's earth bank are bodies, never walked); ONLY LAMPS ARE LIT (a lamp is
 * a `lampMark` in the lamp pool); what never moves is baked. INSIDE A ROOM THE SUN IS TAKEN AWAY: the cover mask
 * (`lib/cover.js`) covers every room, door, stair and the gate passage, on a phone too.
 */

import * as THREE from 'three';
import verdigrisData from './world-data/verdigris.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { platedMetal, buildMaterial, enableAO, texSize, mergeStatic, consolidateStatic, addWorldVariation } from './materials/pbr-kit.js';
import { peatMud, boardwalk, marshWater, fortStone } from './materials/verdigris-textures.js';
import { packsAvailable, loadTexturePack, dressFromPack } from './materials/texture-pack.js';
import { grimed } from './verdigris/grime.js';
import {
  createVdSkyDome, createVdLights, followVdShadow, createVdEnvironment, vdSkyUniforms, followCamera, VDSKY, VERDIGRIS_SUN
} from './verdigris/atmosphere.js';
import { makeFortPlan } from './verdigris/fort-plan.js';
import { makeVerdigrisField, buildGroundGeometry, buildWaterGeometry, buildDecks, buildMasonry, mergeList } from './verdigris/terrain.js';
import * as PLANT from './verdigris/plant.js';
import { HOST_BUILDERS } from './verdigris/stations.js';
import { FILAMENT } from './kettle/kit.js';
import { makeCover } from './lib/cover.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';
import { attachCrew } from './npc/attach.js';

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** The masonry and the decks are merged by material over squares this size, so frustum culling has pieces to cull. */
const SQUARE = 40;

export class VerdigrisWorld {
  constructor(renderer = null) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.name = 'verdigris';
    this.data = verdigrisData;
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
    // The swamp runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');
    // Kettle's built kit (kettle/kit.js): the hosts' and the plant's boxes chamfered, cylinders bevelled, uvs in metres.
    this.builtKit = true;

    // THE FORT, AS A PLAN. The height field, the walk, the colliders, the light mask and the guide all stand on it.
    this.plan = makeFortPlan();
    const pad = this.data.landmarks.find(l => l.asset === 'landing-pad');
    this.field = makeVerdigrisField(this.plan, pad ? [pad.pos[0], pad.pos[2]] : null);

    this.initMaterials();
    this.initPacks();
    this.initLighting();
    this.sky = createVdSkyDome(900);
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
    // The people who work here, walking their rounds (`npc/attach.js`, `src/npc/crews/verdigris.js`).
    this.crew = attachCrew(this, 'verdigris');
  }

  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /** What the builders are handed: materials, `own`, the lamp list, the tier, the field and the plan. */
  get ctx() {
    return { M: this.M, own: (...o) => this.own(...o), lamps: this.lamps, t4: this.t4, field: this.field, plan: this.plan, builtKit: this.builtKit };
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
    // A copy of a material sharing its maps (`clone` would push the canvas maps listed in userData through JSON).
    const variant = (m, color) => { const ud = m.userData; m.userData = {}; const c = m.clone(); m.userData = ud; c.userData = { ...ud }; c.color = new THREE.Color(color); return c; };
    // EVERY REPEAT IS METRIC (the realism pass): the masonry, the decks and the built kit lay their uvs in metres, so a
    // material's repeat is 1 / the size of its tile in metres, and one texel density holds across the world.
    const metal = (paint, base, rust, seed, weather, panels = 2, size = 256, tile = 1.6) => {
      const m = buildMaterial(platedMetal({ paint, metal: base, rust, panels, seed, weather, size: texSize(size) }), { repeat: 1 / tile, roughness: 1.0 });
      m.normalScale.set(1.2, 1.2);
      m.aoMapIntensity = 0.85;
      return m;
    };
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    // THE SWAMP'S BED: wet peat for grain; the vertex colours say what it is (silt, reed mud, drowned flags, far rises).
    M.ground = buildMaterial(peatMud({ size: texSize(512), seed: 31 }), { repeat: 1, roughness: 1.0 });
    M.ground.vertexColors = true;
    M.ground.envMapIntensity = 0.5;
    for (const t of M.ground.userData.surfaceMaps || []) t.anisotropy = aniso;
    // THE FORT'S MASONRY: coursed grey stone (a 2.5 m tile), dressed stone for copings, courses and floors (2.1 m), brick
    // in the vaults (1.5 m). The procedural set is every one's lower-tier look and the slots the photographs fill.
    const stoneSet = fortStone({ size: texSize(512), seed: 7 });
    M.stone = buildMaterial(stoneSet, { repeat: 1 / 2.5, roughness: 1.0 });
    M.coping = buildMaterial(stoneSet, { repeat: 1 / 2.1, roughness: 1.0 });
    M.coping.color = new THREE.Color(0xc9ccbf);
    M.flags = variant(M.coping, 0xa9ab9e);
    M.brick = buildMaterial(fortStone({ size: texSize(256), seed: 13 }), { repeat: 1 / 1.5, roughness: 1.0 });
    M.brick.color = new THREE.Color(0x9a7a66);
    M.earth = std({ color: 0x55603f, roughness: 1.0, metalness: 0 });
    M.slit = std({ color: 0x141714, roughness: 1.0, metalness: 0 });
    M.concrete = M.stone;
    // THE BOARDWALKS: boards laid across the line of travel (a 4 m procedural tile of twenty boards; the photograph is
    // 2 m); the fascia, posts, rails, trestles and piles are the same oak, darker as they get wetter.
    M.plank = buildMaterial(boardwalk({ size: texSize(512), seed: 5 }), { repeat: 1 / 4, roughness: 1.0 });
    for (const t of M.plank.userData.surfaceMaps || []) t.anisotropy = aniso;
    // The boardwalks' and the rooms' own timber wears the boards' maps; each long timber is cut from one board
    // (`terrain.js` `grainAlong`). What the kit builds (the hosts, the lamp posts, the far country) is plain oak.
    M.deckTimber = variant(M.plank, 0x9c8f78);
    M.rail = variant(M.plank, 0x6a6252);
    M.pile = variant(M.plank, 0x4a463a);
    M.timber = std({ color: 0x6f6148, roughness: 0.95, metalness: 0 });
    M.timberDark = std({ color: 0x3a372c, roughness: 0.95, metalness: 0 });
    // Copper that has gone green: the towers' roofs (a standing seam every half metre), the fittings; the old metal
    // shows through the wear.
    M.roof = metal('#6f9c88', '#5d8d78', '#476b58', 81, 0.35, 3, 512, 1.6);
    M.roof.side = THREE.DoubleSide;
    M.patina = metal('#6f9c88', '#5d8d78', '#476b58', 82, 0.35, 3, 512);
    M.patinaDark = metal('#3d6657', '#4a7564', '#2f4a3d', 83, 0.5, 4);
    M.copperClad = metal('#88b5a0', '#9a7a4e', '#5d8870', 85, 0.55, 3, 512);
    M.steel = metal('#8a9892', '#6f7d77', '#7f6a52', 87, 0.4, 2, 512);
    M.darkSteel = metal('#3b4440', '#4b5651', '#5e5444', 89, 0.5, 4);
    M.castIron = metal('#3a3d3a', '#34372f', '#5e4a34', 115, 0.55, 3);
    M.rusted = metal('#7a5a40', '#5e5348', '#84512f', 91, 0.8, 3);
    // The bench's top is built of stock boxes (`bench-bay.js`, uvs 0..1 per face): it keeps the old repeat.
    M.benchTop = buildMaterial(platedMetal({ paint: '#8aa093', metal: '#738a7e', rust: '#566e5f', panels: 3, seed: 93, weather: 0.4, size: texSize(256) }), { repeat: 2, roughness: 1.0 });
    M.benchTop.normalScale.set(1.2, 1.2);
    M.benchTop.aoMapIntensity = 0.85;
    M.reed = std({ color: 0x828a4c, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, vertexColors: true });
    M.reedDry = std({ color: 0xa39769, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, vertexColors: true });
    M.deadwood = std({ color: 0x4c4a40, roughness: 1.0, metalness: 0 });
    M.bloom = std({ color: 0xc8d8c9, roughness: 0.95, metalness: 0 });
    M.salt = std({ color: 0xe4e6dc, roughness: 0.95, metalness: 0 });
    M.rubble = std({ color: 0x6b7466, roughness: 0.97, metalness: 0, flatShading: true });
    M.brass = std({ color: 0xb08d4c, roughness: 0.42, metalness: 0.9 });
    M.copper = std({ color: 0xb06a43, roughness: 0.45, metalness: 0.9 });
    M.glassCarboy = std({ color: 0x5f7a66, roughness: 0.15, metalness: 0.1 });
    M.wicker = std({ color: 0x7d6a46, roughness: 0.95, metalness: 0 });
    M.drumB = std({ color: 0x8a3b2a, roughness: 0.62, metalness: 0.45 });
    M.paintBlue = std({ color: 0x3f6f8c, roughness: 0.62, metalness: 0.3 });
    M.paintYellow = std({ color: 0xc9a14a, roughness: 0.7, metalness: 0.1 });
    M.paintRed = std({ color: 0x8e2f22, roughness: 0.65, metalness: 0.1 });
    M.paint2 = std({ color: 0xe0e2d2, roughness: 0.6, metalness: 0 });
    M.board = std({ color: 0x2c3230, roughness: 0.85, metalness: 0 });
    M.rope = std({ color: 0x8a7a58, roughness: 0.95, metalness: 0 });
    M.rubber = std({ color: 0x1c1a1a, roughness: 0.9, metalness: 0 });
    // Marsh water is black-green and glossy: opaque in a host's vat, translucent over the swamp's bed.
    const ripple = (seed, size = 256) => {
      const set = marshWater({ size: texSize(size), seed });
      const m = buildMaterial(set, { repeat: 1, roughness: 0.1 });
      // The waves' own normals (verdigris-textures.js), in place of the ones read off the 8-bit height.
      if (set.normalCanvas && m.normalMap) { m.normalMap.image = set.normalCanvas; m.normalMap.needsUpdate = true; m.normalScale.set(0.35, 0.35); }
      return m;
    };
    M.water = ripple(9);
    M.water.envMapIntensity = 1.2;
    M.swamp = ripple(19, 512);
    M.swamp.envMapIntensity = 1.1;
    M.swamp.transparent = true;
    M.swamp.opacity = 0.9;
    M.swamp.depthWrite = false;
    M.glass = std({ color: 0xd5dfe2, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false });
    M.glassDark = std({ color: 0x0f1214, roughness: 0.18, metalness: 0.2 });
    // THE ONE CLEAN THING in a weathered fort: the cased instrument keeps its own bright paint and bare metal.
    M.case = std({ color: 0xe6e7d8, roughness: 0.5, metalness: 0.25 });
    M.caseDark = std({ color: 0x2c3330, roughness: 0.55, metalness: 0.4 });
    // The one warm thing: an amber filament behind glass.
    M.lantern = std({ color: 0x5a4a38, emissive: FILAMENT, emissiveIntensity: 1.4, roughness: 0.6 });

    // THE WATERLINE (verdigris/grime.js): the masonry and the decks wear clones that draw the algae band, the damp and
    // the old high-water line on every face that looks out over the water. Made before the variation below, which each
    // copy then gets for itself.
    M.stoneG = grimed(M.stone);
    M.copingG = grimed(M.coping, { algae: 0.7, damp: 0.38, line: 0.45 });
    M.timberG = grimed(M.deckTimber, { algae: 0.6, damp: 0.35, line: 0.12 });
    M.pileG = grimed(M.pile, { algae: 0.55, damp: 0.3, line: 0.0 });
    // EVERY BIG SURFACE DRIFTS in tone and roughness across the fort (pbr-kit `addWorldVariation`); the walls also carry
    // streaks where rain has run down from the coping. Coursed stone, boards and brick take no anti-tile (its rotated
    // second sample draws their joints crossed); the tone drift breaks their repeat instead.
    for (const m of [M.stoneG, M.stone]) addWorldVariation(m, { scale: 7, strength: 0.16, roughShift: 0.08, antiTile: 0, streaks: 0.16 });
    for (const m of [M.copingG, M.coping, M.flags]) addWorldVariation(m, { scale: 6, strength: 0.13, roughShift: 0.1, antiTile: 0, streaks: 0.06 });
    for (const m of [M.brick]) addWorldVariation(m, { scale: 5, strength: 0.12, roughShift: 0.08, antiTile: 0 });
    for (const m of [M.plank, M.deckTimber, M.timberG, M.rail, M.pile, M.pileG]) addWorldVariation(m, { scale: 5, strength: 0.12, roughShift: 0.1, antiTile: 0 });
    addWorldVariation(M.roof, { scale: 6, strength: 0.14, roughShift: 0.1, antiTile: 0, streaks: 0.1 });

    for (const m of new Set(Object.values(M))) {
      this.own(m);
      for (const t of m.userData?.surfaceMaps || []) this.own(t);
    }
    this.M = M;
    this.lanternMat = M.lantern;
  }

  /**
   * THE PHOTOGRAPHED SURFACES (CC0, `public/textures/verdigris/LICENSE.md`). At 3D On with a renderer, each pack is
   * fetched after the world is built and put into the slots its materials' procedural maps already hold
   * (texture-pack.js), so no program changes and each map is uploaded as it lands; until then, and below 3D On, the
   * procedural maps stay. `scale` = (1 / the photo's tile in metres) / the material's own repeat, so every photo lies at
   * its real size. `grey` is the material's colour once it wears the photo (the photos are graded close to what each
   * surface wants).
   */
  initPacks() {
    if (!this.t4 || !packsAvailable(this.renderer)) return;
    const M = this.M;
    const sc = (photo, repeat) => (1 / photo) / repeat;
    const plan = {
      wall: [
        [M.stone, { scale: sc(2.5, 1 / 2.5), normalScale: 0.85, aoIntensity: 0.7 }, 0xeef0e8],
        [M.stoneG, { scale: sc(2.5, 1 / 2.5), normalScale: 0.85, aoIntensity: 0.7 }, 0xeef0e8]
      ],
      dressed: [
        [M.coping, { scale: sc(2.1, 1 / 2.1), normalScale: 0.9, aoIntensity: 0.7 }, 0xdfe3da],
        [M.copingG, { scale: sc(2.1, 1 / 2.1), normalScale: 0.9, aoIntensity: 0.7 }, 0xdfe3da],
        [M.flags, { scale: sc(2.1, 1 / 2.1), normalScale: 1.0, aoIntensity: 0.8 }, 0xc4c6bc]
      ],
      planks: [
        [M.plank, { scale: sc(2, 1 / 4), normalScale: 1.0, aoIntensity: 0.7 }, 0xf2eee4],
        [M.deckTimber, { scale: sc(2, 1 / 4), normalScale: 1.0 }, 0xd0c8b8],
        [M.timberG, { scale: sc(2, 1 / 4), normalScale: 1.0 }, 0xd0c8b8],
        [M.rail, { scale: sc(2, 1 / 4), normalScale: 1.0 }, 0xa49c8c],
        [M.pile, { scale: sc(2, 1 / 4), normalScale: 1.0 }, 0x6a6558],
        [M.pileG, { scale: sc(2, 1 / 4), normalScale: 1.0 }, 0x6a6558]
      ],
      brick: [[M.brick, { scale: sc(1.5, 1 / 1.5), normalScale: 1.0 }, 0xd2cac0]]
    };
    const aniso = this.renderer.capabilities?.getMaxAnisotropy?.() || 8;
    for (const [name, mats] of Object.entries(plan)) {
      loadTexturePack('/textures/verdigris', name).then(pack => {
        if (this._disposed || !pack) return;
        for (const [mat, opts, grey] of mats) {
          if (!mat) continue;
          const made = dressFromPack(mat, pack, { ...opts, renderer: this.renderer });
          for (const t of made) t.anisotropy = aniso;
          this.own(...made);
          if (grey !== undefined) mat.color.setHex(grey);
        }
      });
    }
  }

  /* ------------------------------------------------------------ light and sky */

  initLighting() {
    const { key, hemi } = createVdLights({ shadows: this.t4 });
    this.keyLight = key;
    this.scene.add(key, key.target, hemi);
    holdShadowUntilAsked(this.scene, key);
    // Thick fog: the haze is the horizon's own colour. It starts a little further from the eye than the layout's
    // ambience says (the realism pass), so the near fort keeps its colour; the layout keeps its numbers.
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, Math.max(amb.fogNear, 12), amb.fogFar * 1.15);
    this.scene.background = VDSKY.horizon.clone();
    const env = createVdEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.62;
    }
  }

  /* ------------------------------------------------------------ the ground */

  getTerrainHeight(x, z) {
    return this.field.height(x, z);
  }

  /** Merge lists of geometries by material over squares, into one group of `phys` meshes. */
  mergedGroup(name, lists, mats, { phys = 'ground', noShadow = [] } = {}) {
    const group = new THREE.Group();
    group.name = name;
    group.userData.phys = phys;
    group.userData.noMerge = true;
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
        const m = new THREE.Mesh(this.own(geo), mats[key]);
        m.name = `${name}:${key}@${sk}`;
        m.castShadow = this.t4 && !noShadow.includes(key);
        m.receiveShadow = this.t4;
        group.add(m);
      }
    }
    this.scene.add(group);
    return group;
  }

  /** The bed, the water, the boardwalks and the masonry. The bed, the decks and the masonry are GROUND; the water is ambient. */
  initTerrain() {
    const ground = this.own(buildGroundGeometry(this.plan));
    this.terrainMesh = new THREE.Mesh(ground, this.M.ground);
    this.terrainMesh.name = 'verdigris-ground';
    this.terrainMesh.frustumCulled = false;
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);

    const M = this.M;
    this.decks = this.mergedGroup('boardwalks', buildDecks(this.plan), { plank: M.plank, timber: M.timberG, pile: M.pileG, rail: M.rail }, { noShadow: ['pile'] });
    this.masonry = this.mergedGroup('fort', buildMasonry(this.plan),
      { stone: M.stoneG, coping: M.copingG, brick: M.brick, flags: M.flags, earth: M.earth, timber: M.deckTimber, roof: M.roof, slit: M.slit, rubble: M.stoneG }, { noShadow: ['flags', 'slit'] });

    // The water over the swamp, the moat and the ward: one sheet, ambience (nothing stands on it).
    const water = new THREE.Mesh(this.own(buildWaterGeometry(this.plan)), M.swamp);
    water.name = 'verdigris-water';
    water.renderOrder = 2;
    water.frustumCulled = false;
    water.userData.phys = 'ambient';
    water.userData.noMerge = true;
    water.userData.noWeather = true;
    this.scene.add(water);
  }

  /** The lamps along the boardwalks, the reeds, the gate's sluices, the far country. */
  initPlant() {
    this.plantColliders = [];
    for (const build of PLANT.PLANT_BUILDERS) {
      const node = build(this);
      if (!node) continue;
      this.scene.add(node);
      for (const m of node.userData.movers || []) this.movers.push(m);
      for (const c of node.userData.colliders || []) this.plantColliders.push(c.minX !== undefined ? { ...c } : { x: c.x, z: c.z, radius: c.r });
    }
  }

  /** The landing stage's pad. */
  initLandmarks() {
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      if (lm.asset !== 'landing-pad') continue;
      const node = PLANT.buildLandingPad(this.ctx, this.field);
      node.position.set(lm.pos[0], this.plan.height(lm.pos[0], lm.pos[2]), lm.pos[2]);
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      node.userData.phys = 'ground';
      this.scene.add(node);
      this.landmarkNodes.push({ lm, node });
    }
  }

  /**
   * The way on foot from where the player stands to a site's approach mark, as a list of [x, z]: door by door along the
   * boardwalks, up a ramp or down a stair, in at the room's door. The guide follows it.
   */
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

  /** WHAT NEVER MOVES IS BAKED. The cased instruments, the indicators and what moves stay their own. */
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
    // The far country is the horizon's own, and it is baked the same way (the reeds are merged as they are built).
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

  /** The walk's walls (every closed side of every volume), the plant and every host's machinery. */
  buildColliders() {
    this.edgeColliders = this.plan.colliders();
    for (const c of this.edgeColliders) this.colliders.push(c);
    for (const c of this.plantColliders) this.colliders.push(c);
    for (const c of this.siteColliders) this.colliders.push(c);
  }

  /**
   * INSIDE IS COVERED. The mask takes the sun and most of the sky out of every room, door, stair and the gate passage;
   * the sun reaches the floor inside a door that faces it. A deployed instrument arrives later with materials of its own;
   * `update` covers it.
   */
  initCover() {
    this.cover = makeCover({ sun: VERDIGRIS_SUN, ...this.plan.coverSpec([VERDIGRIS_SUN.x, VERDIGRIS_SUN.y, VERDIGRIS_SUN.z]) });
    this.cover.applyTo(this.scene);
  }

  /* ------------------------------------------------------------ frame */

  update(delta, cameraPos) {
    this.crew?.update(delta, cameraPos);
    this.elapsed += delta;
    vdSkyUniforms.uVdTime.value = this.elapsed;
    if (cameraPos) {
      followCamera(this.sky, cameraPos);
      const moved = followVdShadow(this.keyLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.keyLight, moved, { live: this.benchesOpen > 0 && this.benchMoving !== false, every: 30 });
      this.lampPool?.update(cameraPos);
    }
    if ((this._coverTick = ((this._coverTick ?? 0) + 1) % 10) === 0) this.cover.applyTo(this.scene);
    for (const m of this.movers) m.update(this.elapsed);
    // The swamp's skin drifts: its ripple slides slowly across the sheet.
    const n = this.M.swamp.normalMap, t = this.elapsed;
    if (n) n.offset.set(t * 0.003, -t * 0.002);
    this.lanternMat.emissiveIntensity = 1.35 + Math.sin(this.elapsed * 1.3) * 0.1;
  }

  dispose() {
    this._disposed = true;
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
    this.movers = [];
  }
}
