/**
 * ligar.js — Ligar: the basalt arch field. (Learn world 02)
 *
 * The third place in this product, and the second one you walk. Erebus is an
 * amber basin at low sun; Tallow is a bleached salt pan under a high veil;
 * Ligar is a black stone quarry at dusk in a flood-basalt province, with three
 * natural arches striding away to the north that should have fallen a
 * thousand years ago and have not, trap benches climbing away on every side,
 * and a volcano on the north-east horizon still breathing.
 *
 * WHY THE GROUND LOOKS LIKE THAT. A lava sheet cooling from the top down tears
 * itself into an irregular honeycomb of prisms, and each prism grows downward
 * as a column. So everything here is columnar (`ligar/basalt.js`): the
 * pavement the player walks on is the worn tops of a column field, the walls
 * of the cut are the columns in section, the spoil is broken column, and the
 * arches are the same jointing fanned round a void. No two columns are the
 * same shape, because in a real flow no two are.
 *
 * WHERE EVERYTHING LIVES
 *   ligar/atmosphere.js  the sky, the sun, the air, the far country
 *   ligar/terrain.js     the ground to the horizon, and its surface
 *   ligar/basalt.js      the column kit every rock is built from
 *   ligar/surfaces.js    ash, damp, lichen and rust, applied once to all
 *   ligar/vista.js       what stands beyond the walk
 *   ligar/effects.js     the moving air: ash, grit, smoke, sparks
 *   ligar/mine-plan.js   the hills and the workings driven into them, as plain data and functions
 *   ligar/mine.js        the rock, the sets, the rail and the lamps of those workings
 *   ligar/stations.js    the nine hosts: the piece of the quarry or the mine each bench is built into
 *   this file            the plant, physics and state
 *
 * WHAT IS HERE, AND WHY IT IS HERE
 * Nine Unit 3 benches, each built INTO the working it belongs to rather than set down in a hut
 * (`docs/plans/bench-integration.md` §3). Four stand at surface workings, five underground:
 *   site-1  slab-dressing yard    the saw bed at the quarry's west face, where cut slabs are clamped
 *   site-3  crusher house         the jaw crusher's inspection deck, on the east deck
 *   site-4  scale house           the weighbridge's desk, beside it on the same deck
 *   site-5  mine substation       at hill A's main portal: two charged plates as its bus bars
 *   site-2  ore drift             just inside the main adit, a vein crossing the basalt; the forge is here
 *   site-6  drill chamber         a rock-bolt board and the drill jumbo's stand
 *   site-8  survey station        the junction of three drifts
 *   site-7  sump and pump station down hill B's decline
 *   site-9  hoist chamber         the deepest point, a winze to a lower level
 * ALL NINE carry their instruments as built objects, so a player who walks up and presses [E] keeps
 * their feet and works a real bench.
 *
 * THE HILLS ARE NOT CLIMBED. Each is a rounded block that rises in two steps and is closed round by a
 * ring of colliders, open only at the cuttings dug back into its face. So inside a hill's footprint the
 * only floor there is is a working's, and `getTerrainHeight` answers it without layers.
 *
 * PHYSICS: every prop declares a footprint in `ligar.json` and every footprint
 * is disjoint — no two objects occupy the same space, which `verify:ligar`
 * proves both from the declaration and by BUILDING the world in Node and
 * measuring every pair of bodies in it. A merged rock mesh records one box
 * per column in `userData.partBoxes`, so the check sees every column where it
 * is. The cut is a real excavation: the terrain mesh has a hole in it, the pit
 * is built as geometry, and `getTerrainHeight` resolves the ramp.
 *
 * LIGHT: nothing here blooms. The sun is low, red with dust and about to go;
 * the only emissive surfaces in the whole world are the forge in the ore drift, the
 * luminaires, the mast lamps and one indicator per bench — and the luminaires
 * share a pool of three real lights (lamp-pool.js), because a PointLight is
 * shaded on every pixel of the quarry whether it reaches it or not.
 */

import * as THREE from 'three';
import ligarData from './world-data/ligar.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { buildBayBench } from './bench-bay.js';
import {
  platedMetal, treadPlate,
  buildMaterial, enableAO,
  texSize, heightField, heightToNormal, asDataTexture, fbm,
  boltRing, boltLine, weldBead, cableRun,
  hazardStripe, mergeStatic
} from './materials/pbr-kit.js';
import {
  basaltColumn, scoriaGrit, lavaTubeWall, conveyorBelt, basaltTop
} from './materials/ligar-textures.js';
import {
  createLigarSkyDome, createLigarCelestials, createLigarLights, followLigarShadow,
  createLigarEnvironment, applyLigarAir, ligarSkyUniforms, LSKY, setLigarCover
} from './ligar/atmosphere.js';
import {
  makeLigarField, buildLigarTerrainGeometry, buildFloorGeometry, createLigarTerrainMaterial
} from './ligar/terrain.js';
import {
  RockBuilder, columnRaft, columnWall, basaltArch, rubbleField, fallenColumn,
  sawnSlab, radialRing, lintelBeam
} from './ligar/basalt.js';
import { createGroundHeightTexture, applyLigarWeather } from './ligar/surfaces.js';
import { buildLigarVista } from './ligar/vista.js';
import {
  buildConveyor, buildOreCart, buildDrumStack, buildGuardHut, buildHauler, buildShed,
  buildStack, buildWaterTower, buildCableMast, buildLandingPad, buildStakeMarker
} from './ligar/plant.js';
import { createLigarEffects } from './ligar/effects.js';
import { HOST_BUILDERS } from './ligar/stations.js';
import { makeMinePlan, hillDistance } from './ligar/mine-plan.js';
import { buildMine } from './ligar/mine.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/* Deterministic layout noise: the quarry is the same quarry every visit. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sodium filament, the same one Tallow's lamps burn. A lamp is a lamp. */
const SODIUM = 0xd99423;

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/**
 * How far the terrain's hole reaches past the pit's walkable floor, into the
 * rock. The cut's faces are whole columns that stand proud of the wall line;
 * the hole is widened so they stand in open air rather than under an overhang
 * of pavement with nothing beneath it.
 */
const CUT_MARGIN = 0.8;

export class LigarWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = ligarData;
    this.scene = new THREE.Scene();
    this.scene.name = 'ligar';

    this.colliders = [];
    this.siteMarkers = new Map();   // questId -> { indicator, group, site }
    this.hostColliders = [];        // what each bench's host stands on the ground with (initHosts)
    // questId -> the physical frame of that site's working surface, so the
    // Learn instrument deploys onto the plate that is actually there rather
    // than onto a second bench conjured at the same coordinates.
    this.benchAnchors = new Map();
    this.disposables = [];
    this.lamps = [];          // emissive faces that breathe in update()
    this.lampMarks = [];      // where the luminaires' pooled light comes from
    this.elapsed = 0;
    this.benchesOpen = 0;
    // The ground runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.sub = this.data.sublevel;
    // The hills the workings are driven into, and the workings themselves (ligar/mine-plan.js): the
    // height field, the walk, the colliders, the light mask and the guide all stand on this one plan.
    this.mine = makeMinePlan(this.data);
    this.field = makeLigarField(this.data.terrain.maxHeight, this.data.hills);
    setLigarCover(this.data.hills.map(h => this.mine.coverBoxes().filter(b => this.mine.byId.get(b.id).hill === h.id)));
    // Surfaces standing proud of the pavement that a player walks ON — the
    // terrace, the deck, the pad. Registered by the builders as they build, and
    // read by `getTerrainHeight`, so feet stand on the plate rather than in it.
    this.raised = [];

    this.initMaterials();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initCut();
    this.initLandmarks();
    this.initMine();
    this.initTube();
    this.initBatchDeck();
    this.initHosts();
    this.initGroundCover();
    this.initVista();
    this.initEffects();
    this.initLampPool();
    this.bakeStatics();
    this.buildColliders();
    this.enableAmbientOcclusion();
    this.weatherTheWorld();
  }

  /**
   * Turn on ambient occlusion everywhere it was generated.
   *
   * `aoMap` samples the SECOND uv set, which a primitive geometry does not
   * have, so a generated occlusion map is a silent no-op until the mesh is told
   * to reuse its own UVs for it. Done once, here, rather than remembered at a
   * hundred call sites — the same pass Tallow and the ship each run.
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

  /**
   * THE WEATHER, APPLIED ONCE TO EVERYTHING THAT WAS BUILT.
   *
   * Every standard material in the world gets two patches: the weather (ash
   * on what faces up, a dark damp foot, lichen on stone, rust down steep
   * faces), and the air, which fades every surface into the sky behind it
   * with distance. The ground and the sky finish themselves. A Learn
   * instrument deployed later is NOT weathered — it is the one thing in the
   * quarry somebody is using.
   */
  weatherTheWorld() {
    this.groundTex = this.own(createGroundHeightTexture((x, z) => this.getTerrainHeight(x, z)));
    const stone = new Set([...this.rockMats, this.basaltMat, this.tubeMat]);
    const seen = new Set();
    this.scene.traverse(o => {
      if (!o.isMesh && !o.isInstancedMesh && !o.isPoints) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        if (o.isMesh && !o.userData.noWeather && m !== this.terrainMesh?.material && m !== this.floorMat) {
          const lamp = m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0;
          if (!lamp) {
            const isStone = stone.has(m);
            applyLigarWeather(m, {
              ground: this.groundTex,
              ash: isStone ? 0.55 : 0.4,
              damp: isStone ? 0.45 : 0.28,
              lichen: isStone ? 0.55 : 0,
              weep: isStone ? 0.18 : 0.32,
              ...(m.userData.weather || {})
            });
          }
        }
        applyLigarAir(m);
      }
    });
    // Everything built so far has had its air; what is added later (a deployed instrument) has not.
    this._aired = new WeakSet(seen);
  }

  /**
   * A deployed instrument is built AFTER the world, with materials of its own, so the weather and the air
   * (fog, and the cover mask that takes the sun and the sky out of a working) never reached them. Out in the
   * yard that is the point: it is the one thing somebody is using, and it is not weathered. Under a hill it
   * would be a bench lit by a sun that cannot reach it, in a room that is dark. So its materials get the
   * air, and with it the mask. (Only the air: it is still not weathered.)
   */
  coverNewMaterials() {
    this._aired = this._aired || new WeakSet();
    this.scene.traverse(o => {
      if (!o.isMesh && !o.isPoints && !o.isLine) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m || this._aired.has(m)) continue;
        this._aired.add(m);
        applyLigarAir(m);
      }
    });
  }

  /** Track a texture/geometry/material so dispose() can actually free it. */
  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /* ======================================================================
     MATERIALS
     ====================================================================== */

  initMaterials() {
    /* THE STONE. A column's face and a column's lid are different surfaces —
       the face is banded by the cooling front, the lid is worn vesicular
       stone — so every rock mesh carries both, as two material groups, and
       both take the per-column tone the builder writes into vertex colour. */
    const col = basaltColumn({ size: texSize(512), seed: 11 });
    const face = buildMaterial(col, { repeat: 1, roughness: 1.0 });
    face.vertexColors = true;
    face.normalScale.set(1.3, 1.3);
    face.aoMapIntensity = 1.0;
    const top = basaltTop({ size: texSize(512), seed: 16 });
    const lid = buildMaterial(top, { repeat: 1, roughness: 1.0 });
    lid.vertexColors = true;
    lid.normalScale.set(1.1, 1.1);
    this.rockMats = [this.own(face), this.own(lid)];
    this.topSet = lid;

    // Cut blocks and hewn stone that are not columns: the same face texture,
    // without the vertex tone a primitive does not carry.
    this.basaltMat = this.own(buildMaterial(col, { repeat: [1, 2], roughness: 1.0 }));
    this.basaltMat.normalScale.set(1.35, 1.35);
    this.basaltMat.aoMapIntensity = 1.0;
    this.archMat = this.basaltMat;

    const tube = lavaTubeWall({ size: texSize(256), seed: 14 });
    this.tubeMat = this.own(buildMaterial(tube, { repeat: [3, 2], roughness: 1.0 }));
    this.tubeMat.normalScale.set(1.3, 1.3);

    const scoria = scoriaGrit({ size: texSize(512), seed: 13 });
    this.scoriaSet = this.own(buildMaterial(scoria, { repeat: 1, roughness: 1.0 }));
    this.scoriaMat = this.own(buildMaterial(scoria, { repeat: 8, roughness: 1.0 }));
    this.scoriaMat.normalScale.set(1.4, 1.4);

    const belt = conveyorBelt({ size: texSize(256), seed: 15 });
    this.beltMat = this.own(buildMaterial(belt, { repeat: [1, 6], roughness: 1.0 }));

    /* THE METAL. One generator, four amounts of weather — the difference
       between a drum that has stood in the wind for forty years and a handrail
       people still hold. Ligar's plant is older and wetter than Tallow's, so
       everything here carries more rust and less paint. */
    const pale = platedMetal({
      paint: '#7d7263', metal: '#615a50', rust: '#8a4d27',
      panels: 2, seed: 83, weather: 0.86, size: texSize(512)
    });
    const dark = platedMetal({
      paint: '#403a33', metal: '#4e4840', rust: '#6f3f21',
      panels: 4, seed: 97, weather: 0.7, size: texSize(256)
    });
    const drum = platedMetal({
      paint: '#4a4239', metal: '#5b544a', rust: '#8d4f2a',
      panels: 1, seed: 103, weather: 0.95, grain: 1.1, size: texSize(256)
    });
    const pipe = platedMetal({
      paint: '#6f6557', metal: '#6a6255', rust: '#93562c',
      panels: 1, seed: 109, weather: 0.9, rivets: false, size: texSize(256)
    });

    this.plateMat = this.own(buildMaterial(pale, { repeat: 2, roughness: 1.0 }));
    this.darkSteelMat = this.own(buildMaterial(dark, { repeat: 3, roughness: 1.0 }));
    this.drumMat = this.own(buildMaterial(drum, { repeat: [3, 1.6], roughness: 1.0 }));
    this.pipeMat = this.own(buildMaterial(pipe, { repeat: [4, 1], roughness: 1.0 }));

    const tread = treadPlate({ size: texSize(256), base: '#5e564a', seed: 29, weather: 0.8 });
    this.treadMat = this.own(buildMaterial(tread, { repeat: 6, roughness: 1.0 }));

    for (const m of [this.plateMat, this.darkSteelMat, this.drumMat, this.pipeMat, this.treadMat]) {
      m.normalScale.set(1.25, 1.25);
      m.aoMapIntensity = 0.85;
    }

    // Timber: the sheds and the props in the cut are cut from something that
    // grew, and it is the only non-mineral, non-metal surface in the world.
    this.timberMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x5a4a38, roughness: 0.96, metalness: 0.0
    }));

    /* A small hexagonal prism for the stone riding a conveyor belt — at that
       size the shape of the section is not something anyone can read. */
    this.hexGeo = this.own(new THREE.CylinderGeometry(0.5, 0.48, 1, 6, 1));
    this.hexGeo.computeBoundingBox();
  }

  /** A merged rock mesh from a builder, owned and shadowed. */
  rockMesh(rb, name = 'basalt') {
    const mesh = rb.toMesh(this.rockMats, { shadows: this.t4, name });
    this.own(mesh.geometry);
    return mesh;
  }

  /* ======================================================================
     LIGHT AND SKY
     A low amber sun through dust, a dim warm sky fill, and almost nothing
     thrown back by black stone. See ligar/atmosphere.js.
     ====================================================================== */

  initLighting() {
    const { sun, hemi } = createLigarLights({ shadows: this.t4 });
    this.sunLight = sun;
    this.scene.add(sun, sun.target, hemi);
    holdShadowUntilAsked(this.scene, sun);

    /*
     * The haze. Every material's fog is replaced by aerial perspective toward
     * the sky in the direction it is seen (atmosphere.js), reading near/far
     * from here; the colour is only what the voyage's cloud deck is tinted with.
     */
    const amb = this.data.ambience;
    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = LSKY.haze.clone();

    const env = createLigarEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.45;
    }
  }

  initSky() {
    this.sky = createLigarSkyDome(900);
    this.scene.add(this.sky);
    this.celestials = createLigarCelestials();
    this.scene.add(this.celestials);
  }

  /* ======================================================================
     TERRAIN
     The plateau, the trap benches beyond it, and the horizon, with the
     excavation cut out along its own walls. See ligar/terrain.js.
     ====================================================================== */

  /** The open ground, before the excavation is considered. */
  surfaceHeight(x, z) {
    return this.field.height(x, z);
  }

  inRoom(x, z) {
    const r = this.sub.room;
    return x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;
  }

  inStair(x, z) {
    const s = this.sub.stair;
    return x > s.minX && x < s.maxX && z > s.minZ && z < s.maxZ;
  }

  /**
   * The walking surface. Resolves the flat, the ramp down into the cut and the
   * quarry floor, so the excavation is entered on foot and never by teleport.
   */
  getTerrainHeight(x, z) {
    // Inside the workings: their floor. A hill cannot be climbed (ringColliders), so there is never a
    // second floor over one, and the walk needs no layers.
    const mined = this.mine.floorAt(x, z);
    if (mined !== null) return mined;
    if (this.inRoom(x, z)) return this.sub.floorY;
    const up = this.raisedHeight(x, z);
    if (up !== null) return up;
    if (this.inStair(x, z)) {
      const s = this.sub.stair;
      // maxZ is the head, at ground level; minZ is the foot, at the floor. The
      // head takes the ground's own height at the mouth, so there is no step
      // down onto the ramp where the excavation begins.
      const headY = this.surfaceHeight(x, s.maxZ);
      const t = (s.maxZ - z) / (s.maxZ - s.minZ);
      return THREE.MathUtils.lerp(headY, this.sub.floorY, THREE.MathUtils.clamp(t, 0, 1));
    }
    return this.surfaceHeight(x, z);
  }

  /**
   * The top of whatever raised surface stands at (x, z), or null.
   *
   * THE WALK CLAMPS THE CAMERA TO THIS FUNCTION, so anything a player stands on
   * has to be in it. Without it the terrace, the deck and the pad were drawn
   * over ground the walk still thought was bare, and a player walking onto the
   * deck sank sixteen centimetres into the plate.
   */
  raisedHeight(x, z) {
    let best = null;
    for (const r of this.raised) {
      let y = null;
      if (r.kind === 'circle') {
        if (Math.hypot(x - r.cx, z - r.cz) <= r.radius) y = r.y;
      } else {
        // A site-local rectangle, turned by the site's facing.
        const dx = x - r.cx;
        const dz = z - r.cz;
        const c = Math.cos(r.rot || 0);
        const sn = Math.sin(r.rot || 0);
        const lx = dx * c - dz * sn;
        const lz = dx * sn + dz * c;
        if (Math.abs(lx) <= r.hx && Math.abs(lz) <= r.hz) {
          y = r.y;
          // A ramp: the surface rises across its local x, from the ground at
          // one edge to the full height at the other.
          if (r.ramp) {
            const t = (lx + r.hx) / (2 * r.hx);
            y = THREE.MathUtils.lerp(r.rampFrom, r.y, t);
          }
        }
      }
      if (y !== null && (best === null || y > best)) best = y;
    }
    return best;
  }

  /** The cut's holes in the ground: the pit and the ramp, widened into the rock. */
  cutHoles() {
    const r = this.sub.room;
    const s = this.sub.stair;
    const M = CUT_MARGIN;
    return [
      { minX: r.minX - M, maxX: r.maxX + M, minZ: r.minZ - M, maxZ: r.maxZ + M },
      { minX: s.minX - M, maxX: s.maxX + M, minZ: r.maxZ, maxZ: s.maxZ },
      // Each portal's cutting, dug back into the face of its hill.
      ...this.mine.terrainHoles()
    ];
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const stone = this.topSet;
    const grit = this.scoriaSet;
    for (const t of [stone.map, stone.normalMap, stone.roughnessMap, stone.aoMap,
      grit.map, grit.normalMap, grit.roughnessMap]) {
      if (t) t.anisotropy = aniso;
    }
    // The ground samples in world metres (uv = xz / 2.5), so its maps repeat.
    const detailH = heightField(texSize(256), (u, v) =>
      0.5 + (fbm(u * 34, v * 34, { octaves: 4, period: 34, seed: 0xb17 }) - 0.5) * 0.9
    );
    const detail = this.own(asDataTexture(heightToNormal(detailH, 1.6), 1));
    detail.anisotropy = aniso;
    const macro = this.own(asDataTexture(heightField(texSize(256), (u, v) =>
      fbm(u * 4, v * 4, { octaves: 5, period: 4, seed: 0x5ac })
    ), 1));

    const geo = this.own(buildLigarTerrainGeometry(this.field, {
      step: this.t4 ? 1.25 : 2.0,
      growth: this.t4 ? 1.065 : 1.1,
      holes: this.cutHoles()
    }));
    const mat = this.own(createLigarTerrainMaterial({
      stone, grit, detail, macro, tracks: this.data.tracks
    }));
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.name = 'ligar-ground';
    // The ground everything else stands on and is bedded into.
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noWeather = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);
  }

  /* ======================================================================
     THE CUT
     An open excavation down into the flow. Its walls are the thing that makes
     Ligar Ligar: the quarry has cut THROUGH the colonnade, so what is exposed
     on all four sides is column in section, standing shoulder to shoulder from
     the floor to the lip, the front rank spalled at the top. At the far end
     the cut has opened a lava tube, and the forge is inside it.
     ====================================================================== */

  initCut() {
    const r = this.sub.room;
    const st = this.sub.stair;
    const fy = this.sub.floorY;
    const M = CUT_MARGIN;

    const cut = new THREE.Group();
    cut.name = 'the-cut';
    // The excavation is a PLACE, not a prop: its walls and floor are the ground
    // down here, and everything standing in the pit is bedded into them.
    cut.userData.phys = 'ground';
    this.scene.add(cut);

    /* THE FLOOR. Crushed column, driven over until it is level, with the
       water of the last rain standing in it — the same surface as the plateau,
       so a puddle down here is the same water as one up there. */
    const frand = mulberry32(0x40c1);
    const floorGeo = this.own(buildFloorGeometry({
      minX: r.minX - M, maxX: r.maxX + M, minZ: r.minZ - M, maxZ: r.maxZ,
      y: () => fy + (frand() - 0.5) * 0.03,
      wetAt: (x, z) => {
        const n = Math.sin(x * 0.31 + 1.2) * Math.cos(z * 0.27 - 0.4) + Math.sin(x * 0.11 - z * 0.13) * 0.6;
        // Water gathers along the foot of the walls, where the floor was
        // never quite levelled, and in a few broad hollows.
        const edge = Math.min(x - r.minX, r.maxX - x, z - r.minZ) < 1.4 ? 0.35 : 0;
        return Math.max(0, Math.min(1, (n - 0.55) * 1.4 + edge));
      },
      yard: 0.85
    }));
    this.floorMat = this.terrainMesh.material;
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.name = 'cut-floor';
    floor.receiveShadow = this.t4;
    cut.add(floor);

    /* THE TUBE IS INSIDE THE CUT, NOT BEHIND IT.
       The quarry opened a lava tube at this end, and the forge is in it — but a
       chamber built the far side of the far wall would be outside the
       excavation rectangle, where `getTerrainHeight` answers with the surface
       five metres overhead. So the tube is roofed over the FAR PORTION OF THE
       FLOOR: its mouth is an arch you duck through, standing in the pit. */
    this.tube = { minX: -11.0, maxX: -1.0, minZ: r.minZ, maxZ: -21.5 };

    /* THE WALLS, in section: one merged mesh of real columns for the whole
       cut. Each wall line runs along the edge of the terrain's hole and its
       faces stand proud into the margin, so no face is ever under an overhang
       of pavement. The near wall is split round the ramp, and the ramp is a
       trench with a wall down each side. */
    const rb = new RockBuilder();
    const lipAt = (x, z) => this.surfaceHeight(x, z);
    const wall = (ax, az, bx, bz, dirX, dirZ, seed, extra = {}) => columnWall(rb, {
      ax, az, bx, bz, dirX, dirZ, floorY: fy, lipAt, seed, t4: this.t4, ...extra
    });
    wall(r.minX - M, r.minZ - M, r.maxX + M, r.minZ - M, 0, 1, 0x11a1);        // far
    wall(r.minX - M, r.minZ - M, r.minX - M, r.maxZ + M, 1, 0, 0x22b2);        // west
    wall(r.maxX + M, r.minZ - M, r.maxX + M, r.maxZ + M, -1, 0, 0x33c3);       // east
    wall(r.minX - M, r.maxZ + M, st.minX - M, r.maxZ + M, 0, -1, 0x44d4);      // near, west of ramp
    wall(st.maxX + M, r.maxZ + M, r.maxX + M, r.maxZ + M, 0, -1, 0x55e5);      // near, east of ramp
    const rampFloor = (x, z) => this.getTerrainHeight((st.minX + st.maxX) / 2, Math.max(z, st.minZ));
    wall(st.minX - M, r.maxZ, st.minX - M, st.maxZ, 1, 0, 0x66f6, { floorAt: rampFloor });   // ramp, west
    wall(st.maxX + M, r.maxZ, st.maxX + M, st.maxZ, -1, 0, 0x77a7, { floorAt: rampFloor });  // ramp, east
    const walls = this.rockMesh(rb, 'cut-walls');
    cut.add(walls);

    /* THE RAMP. A cut in the rock with a plated running surface laid in it and
       a handrail down its east side. */
    const ramp = new THREE.Group();
    ramp.name = 'cut-ramp';
    cut.add(ramp);

    const headY = this.surfaceHeight((st.minX + st.maxX) / 2, st.maxZ);
    const runZ = st.maxZ - st.minZ;
    const drop = headY - fy;
    const pitch = Math.atan2(drop, runZ);
    const deckW = st.maxX - st.minX;
    const deckLen = Math.hypot(runZ, drop);

    const deck = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(deckW, 0.12, deckLen)), this.treadMat
    );
    deck.position.set(
      (st.minX + st.maxX) / 2,
      (headY + fy) / 2 - 0.06,
      (st.minZ + st.maxZ) / 2
    );
    deck.rotation.x = -pitch;
    deck.receiveShadow = this.t4;
    ramp.add(deck);

    // Cross cleats, so the ramp is a ramp you can get up rather than a slide.
    const cleatGeo = this.own(new THREE.BoxGeometry(deckW - 0.1, 0.05, 0.08));
    const steps = Math.round(deckLen / 0.85);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const cleat = new THREE.Mesh(cleatGeo, this.darkSteelMat);
      cleat.position.set(
        (st.minX + st.maxX) / 2,
        headY - drop * t + 0.04,
        st.maxZ - runZ * t
      );
      cleat.rotation.x = -pitch;
      ramp.add(cleat);
    }

    // Handrail down the east side, stanchions bolted through the deck.
    const railX = st.maxX - 0.14;
    const postGeo = this.own(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 8));
    for (let i = 0; i <= steps; i += 2) {
      const t = i / steps;
      const post = new THREE.Mesh(postGeo, this.pipeMat);
      post.position.set(railX, headY - drop * t + 0.52, st.maxZ - runZ * t);
      post.castShadow = this.t4;
      ramp.add(post);
    }
    for (const railY of [1.02, 0.56]) {
      const rail = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.028, 0.028, deckLen, 8)), this.pipeMat
      );
      rail.rotation.set(Math.PI / 2 - pitch, 0, 0);
      rail.position.set(railX, (headY + fy) / 2 + railY, (st.minZ + st.maxZ) / 2);
      ramp.add(rail);
    }

    // Hazard striping across the head of the ramp, painted on the pavement.
    const stripe = hazardStripe(deckW, 0.5, { pitch: 0.2 });
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set((st.minX + st.maxX) / 2, headY + 0.03, st.maxZ + 0.34);
    ramp.add(stripe);
    this.own(stripe.geometry, stripe.material, stripe.material.map);

    /* THE LIP. A rolled steel kerb round the open edges of the cut, set back
       on the pavement behind the columns, so the drop has an edge you can see
       from twenty metres. Split round the ramp mouth, exactly as the wall is. */
    const kerb = new THREE.Group();
    kerb.name = 'cut-kerb';
    const kerbAt = (cx, cz, w, d) => {
      const k = new THREE.Mesh(this.own(new THREE.BoxGeometry(w, 0.26, d)), this.pipeMat);
      k.position.set(cx, this.surfaceHeight(cx, cz) + 0.1, cz);
      k.castShadow = k.receiveShadow = this.t4;
      kerb.add(k);
    };
    const KW = 0.3;
    const E = M + KW / 2 + 0.05;
    kerbAt((r.minX + r.maxX) / 2, r.minZ - E, r.maxX - r.minX + E * 2 + KW, KW);
    kerbAt(r.minX - E, (r.minZ + r.maxZ) / 2, KW, r.maxZ - r.minZ + E * 2);
    kerbAt(r.maxX + E, (r.minZ + r.maxZ) / 2, KW, r.maxZ - r.minZ + E * 2);
    kerbAt((r.minX - E + st.minX - E) / 2, r.maxZ + E, (st.minX - r.minX), KW);
    kerbAt((st.maxX + E + r.maxX + E) / 2, r.maxZ + E, (r.maxX - st.maxX), KW);
    cut.add(kerb);

    /* SPOIL ON THE FLOOR. Broken column lying where the face dropped it, kept
       out of everything that already stands down here: the forge chamber, the
       foot of the ramp, and every belt's whole run. */
    const t = this.tube;
    const avoid = [
      { minX: t.minX - 0.8, maxX: t.maxX + 0.8, minZ: t.minZ, maxZ: t.maxZ + 1.6 },
      { minX: st.minX - 1.2, maxX: st.maxX + 1.2, minZ: r.maxZ - 4.0, maxZ: r.maxZ }
    ];
    for (const lm of this.data.landmarks) {
      if (lm.asset !== 'conveyor') continue;
      const sn = Math.sin(lm.rotY || 0);
      const cs = Math.cos(lm.rotY || 0);
      for (let k = -11.5; k <= 11.5; k += 1.0) {
        const x = lm.pos[0] + k * sn;
        const z = lm.pos[2] + k * cs;
        avoid.push({ minX: x - 1.1, maxX: x + 1.1, minZ: z - 1.1, maxZ: z + 1.1 });
      }
    }
    const rubble = this.buildRubbleField({
      count: this.t4 ? 110 : 50,
      minX: r.minX + 2.5, maxX: r.maxX - 2.5,
      minZ: r.minZ + 2.5, maxZ: r.maxZ - 2.5,
      y: fy, seed: 0x9d2e, scale: 1.0, avoid
    });
    // Its OWN body, not part of the cut. The cut is ground and exempt from the
    // overlap check; rubble filed under it could lie through the forge's bench
    // and the check would never see it — which is exactly what it once did.
    rubble.name = 'cut-rubble';
    this.scene.add(rubble);

    this.cutFloorY = fy;
  }

  /**
   * A field of broken column lying on a surface — one merged mesh of real
   * broken sections, each recorded as a part box. Used on the quarry floor, in
   * the spoil heaps, along the conveyor discharge, in the carts.
   */
  buildRubbleField({ count, minX, maxX, minZ, maxZ, y, seed, scale = 1, mound = 0, avoid = [], ground = null }) {
    const rb = new RockBuilder();
    rubbleField(rb, { count, minX, maxX, minZ, maxZ, y, seed, scale, mound, avoid, ground, t4: this.t4 });
    return this.rockMesh(rb, 'rubble');
  }

  /**
   * The ground under a landmark, in its own frame: `(lx, lz) => y`, the height
   * of the pavement at that local point relative to the landmark's origin.
   *
   * A prop is placed at the height of the ground under its centre, and a prop
   * thirty metres across stands on ground that is not level. Anything laid on
   * the ground inside it — scree, a heap, a column's foot — is laid on the
   * ground actually under it, or it floats on one side and is buried on the
   * other. `verify:ligar` found both.
   */
  localGround(lm) {
    const cy = this.surfaceHeight(lm.pos[0], lm.pos[2]);
    const c = Math.cos(lm.rotY || 0);
    const sn = Math.sin(lm.rotY || 0);
    return (lx, lz) => this.surfaceHeight(
      lm.pos[0] + lx * c + lz * sn, lm.pos[2] - lx * sn + lz * c
    ) - cy;
  }

  /**
   * Like `localGround`, but the WALKING surface — which knows about the cut.
   * A conveyor stands half in the excavation and half on the flat, and its legs
   * are founded on whichever of the two is actually under each one.
   */
  localWalk(lm) {
    const cy = this.surfaceHeight(lm.pos[0], lm.pos[2]);
    const c = Math.cos(lm.rotY || 0);
    const sn = Math.sin(lm.rotY || 0);
    return (lx, lz) => this.getTerrainHeight(
      lm.pos[0] + lx * c + lz * sn, lm.pos[2] - lx * sn + lz * c
    ) - cy;
  }

  /* ======================================================================
     THE LANDMARKS
     Everything standing on the flat that is not a site. Each one is built
     once, baked into one mesh per material, and placed from `ligar.json`.
     ====================================================================== */

  initLandmarks() {
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !this.t4) continue;
      // A host is built with its bench (initHosts); its landmark only declares the footprint.
      if (lm.host) continue;
      const y = this.surfaceHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      const ground = this.localGround(lm);
      switch (lm.asset) {
        case 'arch': node = this.buildArch(lm.scale, lm.pos[0], lm.pos[2], lm.rotY, ground); break;
        case 'colonnade': node = this.buildColonnade(lm.scale, lm.pos[0], lm.pos[2], ground); break;
        case 'spoil-heap': node = this.buildSpoilHeap(lm.scale, lm.pos[0], lm.pos[2], ground); break;
        case 'broken-column': node = this.buildBrokenColumn(lm.scale, lm.pos[0], lm.pos[2], ground); break;
        case 'conveyor': node = buildConveyor(this, this.localWalk(lm)); break;
        case 'ore-cart': node = buildOreCart(this, lm.pos[0]); break;
        case 'drum-stack': node = buildDrumStack(this, lm.pos[0], lm.pos[2]); break;
        case 'guard-hut': node = buildGuardHut(this); break;
        case 'hauler': node = buildHauler(this); break;
        case 'shed': node = buildShed(this, lm.scale); break;
        case 'stack': node = buildStack(this, lm.scale); break;
        case 'water-tower': node = buildWaterTower(this); break;
        case 'cable-mast': node = buildCableMast(this); break;
        case 'landing-pad': node = buildLandingPad(this); break;
        case 'stake-marker': node = buildStakeMarker(this, lm.pos[0], ground); break;
        default: node = null;
      }
      if (!node) continue;

      /* BAKE, EXCEPT WHERE BAKING WOULD BE A LIE.
         `mergeStatic` collapses a dressed prop into one mesh per material and
         records each part's box. It refuses anything under `noMerge`, so a
         lamp that lights and a rock mesh that carries its own part boxes both
         survive. */
      mergeStatic(node);
      node.position.set(lm.pos[0], y, lm.pos[2]);
      if (lm.asset === 'landing-pad') {
        this.raised.push({ kind: 'circle', cx: lm.pos[0], cz: lm.pos[2], radius: 7.3, y: y + 0.22 });
      }
      if (lm.asset === 'stack') {
        // Where its smoke leaves it, for the effects to find.
        (this.vents = this.vents || []).push({
          x: lm.pos[0], y: y + (node.userData.ventY || 16), z: lm.pos[2], rate: 1, size: 0.55
        });
      }
      node.rotation.y = lm.rotY;
      // Named so the physics check can say WHICH arch is in the way.
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      this.scene.add(node);
    }
  }

  /**
   * A great stone arch (ligar/basalt.js `basaltArch`): thick-footed,
   * thin-crowned, lumpy, its columns fanned round the void the way a flow
   * cooling round one grows them — so the soffit is a honeycomb of column
   * ends and the flanks are a fan of column lengths. Talus heaps round both
   * feet, and a column or two that came off the crown lies where it fell.
   */
  buildArch(scale = 1, sx = 0, sz = 0, rotY = 0, ground = null) {
    const g = new THREE.Group();
    const seed = ((sx * 73856093) ^ (sz * 19349663)) >>> 0;
    const R = 14 * scale;

    /* THE GROUND IS NOT LEVEL UNDER AN ARCH. The span is thirty metres and
       the plateau lifts toward the benches, so each foot stands on ground at
       its own height. The legs are founded deep enough to reach the lower one;
       the columns below the ground under them are never built. */
    const footRise = [-R, R].map(fx => (ground ? ground(fx, 0) : 0));
    const legDrop = 2.2 * scale + Math.max(0, -Math.min(...footRise));

    const rb = new RockBuilder();
    const info = basaltArch(rb, { R, scale, seed, ground, legDrop, t4: this.t4 });
    this.archInfo = this.archInfo || new Map();
    this.archInfo.set(`${sx},${sz}`, info);

    // Talus: the stone the arch has shed, heaped round both feet.
    for (const footX of [-R, R]) {
      rubbleField(rb, {
        count: this.t4 ? 46 : 20,
        minX: footX - 4.4 * scale, maxX: footX + 4.4 * scale,
        minZ: -5.0 * scale, maxZ: 5.0 * scale,
        avoid: [{ minX: footX - info.legHalfX, maxX: footX + info.legHalfX, minZ: -info.legHalfZ, maxZ: info.legHalfZ }],
        y: -0.12, seed: (seed + Math.round(footX * 10)) >>> 0,
        scale: 1.0 * scale, mound: 0.5 * scale, ground, t4: this.t4
      });
    }
    // A column off the crown, broken where it hit the ground.
    const rand = mulberry32(seed ^ 0x55);
    const fz = (rand() < 0.5 ? -1 : 1) * (5.5 + rand() * 3) * scale;
    fallenColumn(rb, { len: 3.4 * scale, r: 0.42 * scale, seed: seed ^ 0x77,
      ground, t4: this.t4, at: [(rand() - 0.5) * 6 * scale, fz], yaw: rand() * Math.PI });
    g.add(this.rockMesh(rb, 'arch'));
    return g;
  }

  /**
   * A patch of standing colonnade: a raft of columns broken off at different
   * heights, tallest in the middle where the face has not yet worked its way
   * in, with the columns that have toppled lying in scree round its foot.
   * Every raft has its own column size, because every flow cooled at its own
   * rate.
   */
  buildColonnade(scale = 1, sx = 0, sz = 0, ground = null) {
    const g = new THREE.Group();
    const seed = ((sx * 83492791) ^ (sz * 29835607)) >>> 0;
    const rand = mulberry32(seed);
    const R = 7.0 * scale;
    const rb = new RockBuilder();
    columnRaft(rb, {
      radius: R, scale, seed, ground, t4: this.t4,
      height: 6.6 + rand() * 2.4,
      pitch: 0.72 + rand() * 0.4
    });
    // Scree round the foot of the raft, where the outer columns have toppled,
    // kept outside the raft itself.
    rubbleField(rb, {
      count: this.t4 ? 36 : 16,
      minX: -R * 1.12, maxX: R * 1.12, minZ: -R * 1.12, maxZ: R * 1.12,
      avoid: [{ minX: -R * 0.72, maxX: R * 0.72, minZ: -R * 0.72, maxZ: R * 0.72 }],
      y: -0.1, seed: seed ^ 0x6a41, scale: 0.8 * scale, ground, t4: this.t4
    });
    g.add(this.rockMesh(rb, 'colonnade'));
    return g;
  }

  /**
   * A tipped heap of broken column, pushed up by a loader: a body of fines at
   * the angle of repose, with the big blocks lying on and in it.
   */
  buildSpoilHeap(scale = 1, sx = 0, sz = 0, ground = null) {
    const g = new THREE.Group();
    const seed = ((sx * 19349663) ^ (sz * 83492791)) >>> 0;
    // The heap's body: a low cone of crushed stone, lumpy, founded on the
    // ground under its own rim. The blocks are spread over less than the
    // declared footprint on purpose — a piece at the rim lies on its side and
    // reaches past its centre.
    const R = 3.0 * scale;
    const H = 1.35 * scale;
    const cone = new THREE.ConeGeometry(R * 0.92, H, 22, 5, false);
    const p = cone.attributes.position;
    const rand = mulberry32(seed ^ 0x3131);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 + (Math.sin(Math.atan2(z, x) * 5 + seed) * 0.07 + (rand() - 0.5) * 0.08) * (y < H / 2 - 0.01 ? 1 : 0);
      p.setX(i, x * k);
      p.setZ(i, z * k);
      const gy = ground ? ground(x * k, z * k) : 0;
      p.setY(i, y + H / 2 - 0.12 + gy * (0.5 - y / H));
    }
    cone.computeVertexNormals();
    this.own(cone);
    const body = new THREE.Mesh(cone, this.scoriaMat);
    body.castShadow = body.receiveShadow = this.t4;
    g.add(body);
    const rb = new RockBuilder();
    rubbleField(rb, {
      count: this.t4 ? 64 : 30,
      minX: -R, maxX: R, minZ: -R, maxZ: R,
      y: -0.12, seed, scale: 0.85 * scale, mound: H * 0.9, ground, t4: this.t4
    });
    g.add(this.rockMesh(rb, 'spoil'));
    return g;
  }

  /**
   * One toppled column, lying where it fell and broken into drums that rolled
   * a little apart and stayed in line — with the chips off its breaks.
   */
  buildBrokenColumn(scale = 1, sx = 0, sz = 0, ground = null) {
    const g = new THREE.Group();
    const seed = ((sx * 2654435761) ^ (sz * 40503)) >>> 0;
    const rand = mulberry32(seed);
    const rb = new RockBuilder();
    fallenColumn(rb, { len: 4.4 * scale, r: (0.44 + rand() * 0.2) * scale, seed, ground, t4: this.t4 });
    rubbleField(rb, {
      count: this.t4 ? 14 : 7,
      minX: -2.6 * scale, maxX: 2.6 * scale, minZ: -1.0 * scale, maxZ: 1.0 * scale,
      avoid: [{ minX: -2.3 * scale, maxX: 2.3 * scale, minZ: -0.7 * scale, maxZ: 0.7 * scale }],
      y: -0.06, seed: seed ^ 0x1de1, scale: 0.3 * scale, ground, t4: this.t4
    });
    g.add(this.rockMesh(rb, 'fallen-column'));
    return g;
  }

  /* ======================================================================
     THE BENCHES
     The one object in this world the player stands at with their face half a
     metre from it, so it is the one that has to survive being looked at.
     ====================================================================== */

  /**
   * A working bench, and the instrument cased up on it.
   *
   * Ligar's benches are not Tallow's. Tallow salvaged, so its benches are light
   * pressed plate on folded legs; Ligar cuts and melts stone, so its benches
   * are fabricated from channel, bolted through to a basalt plinth, and scarred
   * by everything that has been dropped on them. What they share is the
   * CONTRACT — 4.8 m of plate at 0.995 m, because the instrument that deploys
   * on one lays out up to four stations at 0.92 m centres and a station is
   * 0.72 m across its tray. A shorter bench would hang its end trays off the
   * plate, and an instrument cannot stand on something that is not there.
   *
   * The frame is the shared bay bench (`bench-bay.js`): the rock-bolted `ledge` underground, and
   * whatever skin the host asks for on the surface (`shelf`, `desk`, `deck`).
   *
   * `kind` is which instrument is cased up here. It changes the face of the
   * dormant cabinet and nothing else: four identical cabinets would mean a
   * player walking the quarry could not tell the press from the weigh-head
   * until they were standing at it.
   *
   * @returns {{group: THREE.Group, indicator: THREE.Mesh,
   *            dormant: THREE.Group, topY: number}}
   */
  buildBench(opts = {}) {
    const { kind = 'join', plate = 'LB-01', skin = 'ledge' } = opts;
    const ctx = { own: (...o) => this.own(...o), t4: tierAtLeast('T4') };
    return buildBayBench(ctx, {
      skin,
      plate,
      mats: { top: this.plateMat, dark: this.darkSteelMat, stone: this.basaltMat, timber: this.timberMat },
      // Tool rail along the back, with three tools racked where a hand reaches.
      rail: { len: 0.94, x: -0.6, y: 0.36, r: 0.018, tools: [[-0.86, 0.24], [-0.6, 0.32], [-0.34, 0.19]] },
      apron: { inset: 0.44, drop: 0.14 },
      noWeather: true,
      dormant: (dormant, { height }) => {
        const housing = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(1.2, 0.8, 0.54)),
          kind === 'join' ? this.darkSteelMat : this.plateMat
        );
        housing.position.set(0, height + 0.44, -0.16);
        housing.castShadow = housing.receiveShadow = tierAtLeast('T4');
        dormant.add(housing);

        /* WHAT IS ON THE CABINET'S FACE IS WHAT THE BENCH IS FOR. */
        if (kind === 'join') {
          // THE PRESS, cased up: two jaws on a square-thread screw with a capstan
          // on the end of it, and a furnace door beside them with its damper shut.
          const bedplate = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.86, 0.08, 0.3)), this.pipeMat
          );
          bedplate.position.set(-0.12, height + 0.16, 0.12);
          dormant.add(bedplate);
          for (const [jx, jw] of [[-0.42, 0.1], [0.12, 0.1]]) {
            const jaw = new THREE.Mesh(
              this.own(new THREE.BoxGeometry(jw, 0.26, 0.26)), this.darkSteelMat
            );
            jaw.position.set(jx, height + 0.32, 0.12);
            dormant.add(jaw);
          }
          const screw = new THREE.Mesh(
            this.own(new THREE.CylinderGeometry(0.028, 0.028, 0.72, 10)), this.pipeMat
          );
          screw.rotation.z = Math.PI / 2;
          screw.position.set(0.1, height + 0.32, 0.12);
          dormant.add(screw);
          const capstan = new THREE.Mesh(
            this.own(new THREE.TorusGeometry(0.1, 0.018, 6, 14)), this.darkSteelMat
          );
          capstan.rotation.y = Math.PI / 2;
          capstan.position.set(0.46, height + 0.32, 0.12);
          dormant.add(capstan);
          for (let i = 0; i < 4; i++) {
            const spoke = new THREE.Mesh(
              this.own(new THREE.BoxGeometry(0.014, 0.2, 0.014)), this.darkSteelMat
            );
            spoke.position.set(0.46, height + 0.32, 0.12);
            spoke.rotation.x = (i / 4) * Math.PI;
            dormant.add(spoke);
          }
          // The furnace door in the cabinet face, dogged shut.
          const door = new THREE.Mesh(
            this.own(new THREE.CircleGeometry(0.2, 22)),
            this.own(new THREE.MeshStandardMaterial({
              color: 0x2b241e, roughness: 0.82, metalness: 0.12
            }))
          );
          door.position.set(0.36, height + 0.56, 0.115);
          dormant.add(door);
          const dogs = boltRing(0.23, 6, this.darkSteelMat, { size: 0.026, axis: 'y' });
          dogs.rotation.x = Math.PI / 2;
          dogs.position.set(0.36, height + 0.56, 0.112);
          dormant.add(dogs);
        } else if (kind === 'assay') {
          // THE WEIGH-HEAD, cased up: a big round scale over a shrouded chute, its
          // needle resting on the bottom stop.
          const scaleRim = new THREE.Mesh(
            this.own(new THREE.TorusGeometry(0.235, 0.032, 8, 26)), this.darkSteelMat
          );
          scaleRim.position.set(0, height + 0.54, 0.12);
          dormant.add(scaleRim);
          const dialFace = new THREE.Mesh(
            this.own(new THREE.CircleGeometry(0.225, 28)),
            this.own(new THREE.MeshStandardMaterial({
              color: 0x2a251d, roughness: 0.74, metalness: 0.08
            }))
          );
          dialFace.position.set(0, height + 0.54, 0.117);
          dormant.add(dialFace);
          const tickGeo = this.own(new THREE.BoxGeometry(0.008, 0.034, 0.004));
          for (let i = 0; i < 12; i++) {
            const a = -Math.PI * 0.78 + (i / 11) * Math.PI * 1.56;
            const tick = new THREE.Mesh(tickGeo, this.pipeMat);
            tick.position.set(Math.sin(a) * 0.185, height + 0.54 + Math.cos(a) * 0.185, 0.123);
            tick.rotation.z = -a;
            dormant.add(tick);
          }
          const needle = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.010, 0.185, 0.008)),
            this.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.7 }))
          );
          needle.position.set(-0.062, height + 0.455, 0.128);
          needle.rotation.z = 0.78;
          dormant.add(needle);
          const shroud = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.32, 0.2, 0.22)), this.plateMat
          );
          shroud.position.set(0, height + 0.14, 0.03);
          dormant.add(shroud);
          const shutter = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.36, 0.05, 0.02)), this.darkSteelMat
          );
          shutter.position.set(0, height + 0.07, 0.145);
          dormant.add(shutter);
        } else if (kind === 'bond') {
          // THE BOND BENCH, cased up: a graph window with a Morse well scored across it,
          // and a crank wheel on the cabinet's flank winding a carriage along a rail.
          const win = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.62, 0.42, 0.02)),
            this.own(new THREE.MeshStandardMaterial({ color: 0x0d0c0a, roughness: 0.4, metalness: 0.1 }))
          );
          win.position.set(-0.18, height + 0.56, 0.115);
          dormant.add(win);
          const curve = [[0, 0.17], [0.07, 0.04], [0.14, -0.1], [0.22, -0.15], [0.3, -0.12], [0.4, -0.04], [0.5, 0.0]];
          for (let i = 0; i < curve.length - 1; i++) {
            const [ax, ay] = curve[i]; const [bx, by] = curve[i + 1];
            const seg = new THREE.Mesh(
              this.own(new THREE.BoxGeometry(Math.hypot(bx - ax, by - ay), 0.012, 0.006)), this.pipeMat
            );
            seg.position.set(-0.43 + (ax + bx) / 2 * 0.9, height + 0.56 + (ay + by) / 2, 0.128);
            seg.rotation.z = Math.atan2(by - ay, bx - ax);
            dormant.add(seg);
          }
          const rail = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.9, 0.03, 0.06)), this.darkSteelMat);
          rail.position.set(-0.05, height + 0.2, 0.12);
          dormant.add(rail);
          for (const cx of [-0.38, 0.28]) {
            const carriage = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.06, 12, 10)), this.pipeMat);
            carriage.position.set(cx, height + 0.27, 0.12);
            dormant.add(carriage);
          }
          const wheel = new THREE.Mesh(this.own(new THREE.TorusGeometry(0.15, 0.022, 6, 18)), this.darkSteelMat);
          wheel.position.set(0.46, height + 0.5, 0.12);
          dormant.add(wheel);
          for (let i = 0; i < 4; i++) {
            const spoke = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.012, 0.3, 0.012)), this.darkSteelMat);
            spoke.position.set(0.46, height + 0.5, 0.12);
            spoke.rotation.z = (i / 4) * Math.PI;
            dormant.add(spoke);
          }
        } else if (kind === 'pair') {
          // THE PAIR BOARD, cased up: a slate with three discs on a triangle and a tray of capsules.
          const slate = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.7, 0.5, 0.02)),
            this.own(new THREE.MeshStandardMaterial({ color: 0x1a191c, roughness: 0.82, metalness: 0.05 }))
          );
          slate.position.set(0, height + 0.58, 0.115);
          dormant.add(slate);
          for (const [dx, dy] of [[0, 0.12], [-0.2, -0.1], [0.2, -0.1]]) {
            const disc = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.06, 0.06, 0.016, 14)), this.pipeMat);
            disc.rotation.x = Math.PI / 2;
            disc.position.set(dx, height + 0.58 + dy, 0.13);
            dormant.add(disc);
          }
          const tray = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.62, 0.04, 0.14)), this.darkSteelMat);
          tray.position.set(0, height + 0.18, 0.14);
          dormant.add(tray);
          for (let i = 0; i < 8; i++) {
            const cap = new THREE.Mesh(this.own(new THREE.CapsuleGeometry(0.017, 0.04, 3, 6)), this.pipeMat);
            cap.rotation.z = Math.PI / 2;
            cap.position.set(-0.25 + i * 0.07, height + 0.23, 0.14);
            dormant.add(cap);
          }
        } else if (kind === 'rig') {
          // THE DOMAIN RIG, cased up: a hub on a post with four arms along the corners of a tetrahedron.
          const post = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.03, 0.05, 0.3, 10)), this.darkSteelMat);
          post.position.set(0, height + 0.2, 0.12);
          dormant.add(post);
          const hubBall = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.06, 14, 10)), this.pipeMat);
          hubBall.position.set(0, height + 0.42, 0.12);
          dormant.add(hubBall);
          for (const [ax, ay, az] of [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]]) {
            const len = 0.17;
            const k = len / Math.sqrt(3);
            const arm = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.009, 0.009, len, 6)), this.darkSteelMat);
            arm.position.set(ax * k / 2, height + 0.42 + ay * k / 2, 0.12 + az * k / 2);
            arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(ax, ay, az).normalize());
            dormant.add(arm);
            const tip = new THREE.Mesh(this.own(new THREE.SphereGeometry(0.028, 10, 8)), this.plateMat);
            tip.position.set(ax * k, height + 0.42 + ay * k, 0.12 + az * k);
            dormant.add(tip);
          }
          const proto = new THREE.Mesh(this.own(new THREE.TorusGeometry(0.1, 0.01, 4, 20, Math.PI)), this.darkSteelMat);
          proto.position.set(0.4, height + 0.16, 0.12);
          dormant.add(proto);
        } else if (kind === 'rack') {
          // THE BOX RACK, cased up: a ladder of boxes, one box low and a row of three above it.
          const rows = [1, 1, 3, 1, 3];
          rows.forEach((n, ri) => {
            for (let b = 0; b < n; b++) {
              const box = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.1, 0.07, 0.04)), this.darkSteelMat);
              box.position.set((b - (n - 1) / 2) * 0.12, height + 0.2 + ri * 0.11, 0.115);
              dormant.add(box);
            }
          });
          const hoof = new THREE.Mesh(this.own(new THREE.TorusGeometry(0.07, 0.016, 6, 14, Math.PI)), this.darkSteelMat);
          hoof.position.set(0.44, height + 0.2, 0.12);
          dormant.add(hoof);
        } else {
          // THE SCOPE, cased up: a bezelled aperture and a power dial with detents.
          const bezel = new THREE.Mesh(
            this.own(new THREE.TorusGeometry(0.26, 0.035, 8, 26)), this.darkSteelMat
          );
          bezel.position.set(0, height + 0.52, 0.12);
          dormant.add(bezel);
          const aperture = new THREE.Mesh(
            this.own(new THREE.CircleGeometry(0.245, 26)),
            this.own(new THREE.MeshStandardMaterial({
              color: 0x0d0c0a, roughness: 0.42, metalness: 0.1
            }))
          );
          aperture.position.set(0, height + 0.52, 0.118);
          dormant.add(aperture);
          const dialBody = new THREE.Mesh(
            this.own(new THREE.CylinderGeometry(0.075, 0.085, 0.05, 18)), this.darkSteelMat
          );
          dialBody.rotation.x = Math.PI / 2;
          dialBody.position.set(0.44, height + 0.28, 0.11);
          dormant.add(dialBody);
          const pointer = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.012, 0.07, 0.012)),
            this.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.7 }))
          );
          pointer.position.set(0.44, height + 0.32, 0.14);
          dormant.add(pointer);
          for (let i = 0; i < 6; i++) {
            const a = -Math.PI * 0.7 + (i / 5) * Math.PI * 1.4;
            const detent = new THREE.Mesh(
              this.own(new THREE.BoxGeometry(0.008, 0.022, 0.006)), this.darkSteelMat
            );
            detent.position.set(0.44 + Math.sin(a) * 0.11, height + 0.28 + Math.cos(a) * 0.11, 0.125);
            detent.rotation.z = -a;
            dormant.add(detent);
          }
        }

      },
      extras: (g, { width, depth, height }) => {
        const rand = mulberry32(0x2a71 + Math.round(width * 100) + kind.length);
        /* ================= THE SMALL PARTS =================
           Everything below is a thing a working bench in a quarry actually has.
           ================================================== */

        // Bolt lines down both ends of the top, through into the frame.
        for (const bx of [-width / 2 + 0.16, width / 2 - 0.16]) {
          g.add(boltLine(
            [bx, height + 0.047, -depth / 2 + 0.16],
            [bx, height + 0.047, depth / 2 - 0.16],
            4, this.darkSteelMat, { size: 0.016, normalAxis: 'y' }
          ));
        }

        // The seam down the middle: the top is two plates, welded.
        const seam = weldBead(width - 0.1, this.pipeMat, { radius: 0.013, seed: 0x77 });
        seam.rotation.z = Math.PI / 2;
        seam.position.set(0, height + 0.047, 0);
        g.add(seam);
        this.own(seam.userData.ownGeometry);

        // A stone-cutter's cramp screwed to the near left corner, jaws open.
        const cramp = new THREE.Group();
        const crampBody = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.24, 0.14, 0.12)), this.darkSteelMat
        );
        crampBody.position.y = 0.07;
        cramp.add(crampBody);
        for (const [jx, jw] of [[-0.1, 0.05], [0.09, 0.05]]) {
          const jaw = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(jw, 0.11, 0.18)), this.pipeMat
          );
          jaw.position.set(jx, 0.13, 0);
          cramp.add(jaw);
        }
        const crampScrew = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.018, 0.018, 0.32, 8)), this.pipeMat
        );
        crampScrew.rotation.z = Math.PI / 2;
        crampScrew.position.set(0.08, 0.09, 0);
        cramp.add(crampScrew);
        const crampHandle = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6)), this.darkSteelMat
        );
        crampHandle.position.set(0.23, 0.09, 0);
        cramp.add(crampHandle);
        cramp.position.set(-width / 2 + 0.36, height + 0.045, depth / 2 - 0.27);
        cramp.rotation.y = 0.2;
        g.add(cramp);

        // A rag, left where it was dropped. One folded quad, and it is the thing
        // that stops a bench top being a rendered rectangle.
        const rag = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.22, 0.012, 0.16)),
          this.own(new THREE.MeshStandardMaterial({ color: 0x4f463a, roughness: 1.0 }))
        );
        rag.position.set(width / 2 - 0.52, height + 0.051, depth / 2 - 0.3);
        rag.rotation.set(0.04, 0.6, 0.02);
        g.add(rag);
        const ragFold = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.13, 0.02, 0.1)), rag.material
        );
        ragFold.position.set(width / 2 - 0.46, height + 0.063, depth / 2 - 0.26);
        ragFold.rotation.set(0.1, 0.9, -0.06);
        g.add(ragFold);

        /* STONE CHIPS along the back lip, where everything not in use ends up. The
           band is narrow on purpose — an instrument deployed on this bench stands
           its screens on the plate just in front of it, and a chip under a stand
           foot is two objects in one place. */
        // Chips, not rocks: a fragment lying on its side reaches as far as it is
        // long, and at the size the floor rubble is drawn one of these reached
        // twenty centimetres into the plate — into the screen stand of whichever
        // station a four-sample stage put there. `verify:bench` found it.
        const chips = this.buildRubbleField({
          count: 16,
          minX: -width / 2 + 0.34, maxX: width / 2 - 0.34,
          minZ: -depth / 2 + 0.085, maxZ: -depth / 2 + 0.105,
          y: height + 0.046, seed: 0x5c1a + Math.round(width * 10), scale: 0.045
        });
        chips.userData.noMerge = true;
        g.add(chips);

        // Dust the bench has stood in, banked against its windward legs.
        for (const dx of [-width / 2 + 0.16, width / 2 - 0.16]) {
          const drift = new THREE.Mesh(
            this.own(new THREE.SphereGeometry(0.3, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5)),
            this.own(new THREE.MeshStandardMaterial({
              color: 0x574c3e, roughness: 1.0, metalness: 0.0
            }))
          );
          drift.scale.set(1.0, 0.3, 1.5);
          drift.position.set(dx, 0.0, depth / 2 + 0.24 + rand() * 0.08);
          drift.receiveShadow = tierAtLeast('T4');
          g.add(drift);
        }

      }
    });
  }


  /* ======================================================================
     THE MINE
     Two hills, and the workings driven into them (ligar/mine.js).
     ====================================================================== */

  initMine() {
    const { rock, sets } = buildMine(this);
    this.scene.add(rock, sets);
  }

  /* ======================================================================
     THE LAVA TUBE
     The quarry opened a lava tube at the pit's far end. It used to house the
     forge and a bench; both have moved into the ore drift (bench 2) and the
     tube is what it always was, an empty barrel the quarry broke into, with
     the props the crew left in it.
     ====================================================================== */

  initTube() {
    const t = this.tube;
    const fy = this.sub.floorY;
    const g = new THREE.Group();
    g.name = 'lava-tube';
    const rand = mulberry32(0x2b02);

    const W = t.maxX - t.minX;
    const D = t.maxZ - t.minZ;
    const R = W / 2;                    // the barrel's radius
    const SPRING = 0.4;                 // how high the barrel springs off the floor
    const cx = (t.minX + t.maxX) / 2, cz = (t.minZ + t.maxZ) / 2;
    const MOUTH_Z = t.maxZ - cz;
    const BACK_Z = t.minZ - cz;

    /* THE BARREL. A lava tube is a pipe the flow drained out of, so the roof
       is the one curved surface in a world made entirely of flat faces — which
       is exactly why the player knows they have gone inside. Drawn as the top
       half of a cylinder lying along the tube. */
    const roof = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(R, R, D, 24, 1, true, Math.PI / 2, Math.PI)),
      this.tubeMat
    );
    roof.rotation.x = Math.PI / 2;
    roof.position.set(0, SPRING, 0);
    roof.material.side = THREE.DoubleSide;
    roof.receiveShadow = tierAtLeast('T4');
    // An open shell: a vault has an underside you stand beneath, not an inside you stand in.
    roof.userData.openShell = true;
    g.add(roof);

    // The low kerb walls the barrel springs off, so the tube meets the floor in a fillet.
    for (const sx of [-R, R]) {
      const kerbWall = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.5, SPRING + 0.5, D)), this.tubeMat);
      kerbWall.position.set(sx, (SPRING + 0.5) / 2 - 0.2, 0);
      kerbWall.receiveShadow = tierAtLeast('T4');
      g.add(kerbWall);
    }

    // The back of the tube, where it narrows and goes dark.
    const back = new THREE.Mesh(this.own(new THREE.BoxGeometry(W + 0.6, R + 1.2, 0.6)), this.tubeMat);
    back.position.set(0, (R + 1.2) / 2 - 0.2, BACK_Z - 0.2);
    back.receiveShadow = tierAtLeast('T4');
    g.add(back);

    /* THE MOUTH. The columns round the tube's mouth stand RADIAL to it — the
       flow cooled round the void the tube drained — so walking in is walking
       under a fan of column ends. The middle is left clear. */
    {
      const rb = new RockBuilder();
      radialRing(rb, {
        cx: 0, cy: SPRING, z0: MOUTH_Z - 0.3, rIn: R + 0.05, rOut: R + 1.1,
        depth: 1.1, a0: 0, a1: Math.PI, seed: 0x2b0e, pitch: 0.5,
        skip: (px, py) => py < 2.5 && Math.abs(px) < 2.4
      });
      g.add(this.rockMesh(rb, 'tube-mouth'));
    }

    // Sodium luminaires under the barrel.
    for (const lz of [-4.6, 1.4]) g.add(this.buildLuminaire(0, R - 0.6, lz));

    // What the crew left: shoring timber stacked against the east wall, drums at the back, a spoil bucket.
    for (let i = 0; i < 5; i++) {
      const prop = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8)), this.timberMat);
      prop.rotation.z = Math.PI / 2;
      prop.position.set(R - 1.2, 0.12 + (i % 3) * 0.2, -1.2 + Math.floor(i / 3) * 0.1 + (i % 3) * 0.12);
      prop.rotation.y = (rand() - 0.5) * 0.2;
      g.add(prop);
    }
    for (const [dx, dz] of [[-R + 1.1, BACK_Z + 1.2], [-R + 2.1, BACK_Z + 1.0]]) {
      const drum = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.34, 0.34, 0.86, 16)), this.drumMat);
      drum.position.set(dx, 0.43, dz);
      drum.castShadow = tierAtLeast('T4');
      g.add(drum);
    }

    g.position.set(cx, fy, cz);
    this.scene.add(g);
  }

  /**
   * The east deck — the plated apron sites 3 and 4 stand on, and the gantry
   * that names them both.
   *
   * It is a SURFACE (`phys: 'ground'`): the two site structures, the hoppers
   * and the handrail all stand on it, so measuring it as a body would report a
   * collision with every one of them. That is the same category the pavement,
   * the quarry floor and the landing apron are in.
   */
  initBatchDeck() {
    const g = new THREE.Group();
    g.name = 'east-deck';
    g.userData.phys = 'ground';

    const D = { ...this.data.deck };
    this.deck = D;
    const w = D.maxX - D.minX;
    const d = D.maxZ - D.minZ;
    const cx = (D.minX + D.maxX) / 2;
    const cz = (D.minZ + D.maxZ) / 2;
    const y = this.surfaceHeight(cx, cz);
    this.deckY = y + 0.16;

    const slab = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(w, 0.32, d)), this.treadMat
    );
    this.raised.push({ kind: 'rect', cx, cz, rot: 0, hx: w / 2, hz: d / 2, y: this.deckY });
    // The lip up onto it is a ramp: ground at its outer edge, deck at its inner.
    this.raised.push({
      kind: 'rect', cx: D.minX - 0.5, cz, rot: 0, hx: 0.5, hz: d / 2,
      y: this.deckY, ramp: true, rampFrom: y - 0.02
    });
    slab.position.set(cx, y, cz);
    slab.receiveShadow = tierAtLeast('T4');
    g.add(slab);

    // The kerb round its edge, and a ramped lip on the approach side so a
    // player walks up onto it rather than stepping through a 160 mm wall.
    for (const [kx, kz, kw, kd] of [
      [cx, D.minZ - 0.12, w + 0.24, 0.24],
      [cx, D.maxZ + 0.12, w + 0.24, 0.24],
      [D.maxX + 0.12, cz, 0.24, d]
    ]) {
      const kerb = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(kw, 0.28, kd)), this.pipeMat
      );
      kerb.position.set(kx, y + 0.22, kz);
      g.add(kerb);
    }
    const lip = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.1, 0.34, d)), this.treadMat
    );
    lip.position.set(D.minX - 0.5, y + 0.02, cz);
    lip.rotation.z = 0.15;
    g.add(lip);

    // Panel seams and weld beads across the deck: it was laid in plates.
    for (let i = 1; i < 5; i++) {
      const seam = weldBead(w, this.pipeMat, { radius: 0.02, seed: 0x30 + i });
      seam.rotation.z = Math.PI / 2;
      seam.position.set(cx, y + 0.165, D.minZ + (d / 5) * i);
      g.add(seam);
      this.own(seam.userData.ownGeometry);
    }

    /* THE GANTRY. The portal you walk under to get onto the deck. */
    const GX = D.minX + 0.4;
    const gantry = new THREE.Group();
    for (const gz of [D.minZ + 1.0, cz, D.maxZ - 1.0]) {
      const colM = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.42, 6.4, 0.42)), this.darkSteelMat
      );
      colM.position.set(GX, y + 3.2, gz);
      colM.castShadow = tierAtLeast('T4');
      gantry.add(colM);
      const base = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.8, 0.14, 0.8)), this.plateMat
      );
      base.position.set(GX, y + 0.25, gz);
      gantry.add(base);
      const holdDown = boltRing(0.28, 8, this.darkSteelMat, { size: 0.03, axis: 'y' });
      holdDown.position.set(GX, y + 0.33, gz);
      gantry.add(holdDown);
      // Knee braces up to the header, so the portal is braced and not balanced.
      for (const s of [-1, 1]) {
        const knee = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.16, 1.7, 0.16)), this.darkSteelMat
        );
        knee.position.set(GX, y + 5.6, gz + s * 0.62);
        knee.rotation.x = s * 0.62;
        gantry.add(knee);
      }
    }
    // Two header beams with a lattice between them.
    for (const hy of [6.0, 6.7]) {
      const beam = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.28, 0.28, d - 1.0)), this.darkSteelMat
      );
      beam.position.set(GX, y + hy, cz);
      beam.castShadow = tierAtLeast('T4');
      gantry.add(beam);
    }
    for (let i = 0; i < 14; i++) {
      const web = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.1, 0.86, 0.1)), this.darkSteelMat
      );
      web.position.set(GX, y + 6.35, D.minZ + 0.8 + i * ((d - 1.6) / 13));
      web.rotation.x = i % 2 ? 0.66 : -0.66;
      gantry.add(web);
    }
    gantry.add(boltLine(
      [GX, y + 6.0, D.minZ + 1.0], [GX, y + 6.0, D.maxZ - 1.0], 10,
      this.darkSteelMat, { size: 0.026, normalAxis: 'x' }
    ));
    gantry.name = 'deck-gantry';
    g.add(gantry);

    /* THE HANDRAIL along the open west edge of the deck, split for the way on.
       A deck with a drop off its edge and no rail is a deck nobody built. */
    // The rail stands off the two ways on, the lanes in front of the crusher's bench and the scale house's.
    const railZ = [[D.minZ, -6.6], [-1.4, 5.4], [10.6, D.maxZ]];
    for (const [z0, z1] of railZ) {
      const len = z1 - z0;
      if (len <= 0.4) continue;
      for (const ry of [1.05, 0.56]) {
        const rail = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.03, 0.03, len, 8)), this.pipeMat
        );
        rail.rotation.x = Math.PI / 2;
        rail.position.set(D.minX + 0.02, y + 0.16 + ry, (z0 + z1) / 2);
        g.add(rail);
      }
      const posts = Math.max(2, Math.round(len / 1.6));
      for (let i = 0; i <= posts; i++) {
        const post = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8)), this.pipeMat
        );
        post.position.set(D.minX + 0.02, y + 0.71, z0 + (len / posts) * i);
        g.add(post);
      }
    }

    // Hazard striping along the edge, and a puddle of spilt grit at the lip.
    const stripe = hazardStripe(0.5, d, { pitch: 0.22 });
    stripe.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    stripe.position.set(D.minX + 0.34, y + 0.17, cz);
    g.add(stripe);
    this.own(stripe.geometry, stripe.material, stripe.material.map);

    // Luminaires on the gantry, lighting the deck at dusk.
    for (const lz of [D.minZ + 3.0, cz, D.maxZ - 3.0]) {
      const lum = this.buildLuminaire(GX + 0.5, y + 5.8, lz);
      g.add(lum);
    }

    this.scene.add(g);
  }

  /* ======================================================================
     THE HOSTS
     Each bench is built into the piece of the quarry or the mine it belongs to
     (`ligar/stations.js`): the saw bed at the quarry face, the crusher's
     inspection deck, the scale house's desk, the mine's substation, and five
     chambers underground. The group a builder returns is the machine and its
     bench as ONE object, set down at the site's mark and turned to face the
     ground the player walks in from.
     ====================================================================== */

  initHosts() {
    this.hostColliders = [];
    for (const site of this.data.sites) {
      const build = HOST_BUILDERS[site.id];
      if (!build || !site.built) continue;
      const host = build(this, site);
      const g = host.group;
      g.position.set(site.pos[0], this.siteFloor(site), site.pos[2]);
      g.rotation.y = this.siteFacing(site);
      this.scene.add(g);

      this.siteMarkers.set(site.questId, { site, group: g, indicator: host.bench.indicator });
      this.registerBenchAnchor(site, g, host.bench, host.benchLocal);

      // The host's colliders are in its own frame; the walk wants them in the world's.
      const cos = Math.cos(g.rotation.y), sin = Math.sin(g.rotation.y);
      for (const c of host.colliders) {
        const x = g.position.x + c.lx * cos + c.lz * sin;
        const z = g.position.z - c.lx * sin + c.lz * cos;
        if (c.r !== undefined) { this.hostColliders.push({ x, z, radius: c.r }); continue; }
        const ex = Math.abs(c.hw * cos) + Math.abs(c.hd * sin);
        const ez = Math.abs(c.hw * sin) + Math.abs(c.hd * cos);
        this.hostColliders.push({ minX: x - ex, maxX: x + ex, minZ: z - ez, maxZ: z + ez });
      }
    }
  }

  /** The floor a site's bench stands on: the working's, the deck's, or the pavement's. */
  siteFloor(site) {
    const m = this.mine.floorAt(site.pos[0], site.pos[2]);
    if (m !== null) return m;
    return this.raisedHeight(site.pos[0], site.pos[2]) ?? this.surfaceHeight(site.pos[0], site.pos[2]);
  }

  /**
   * The way on foot from where the player stands to a site's approach mark, as a list of [x, z]:
   * straight on the open ground, through a portal and doorway by doorway underground. The guide
   * arrow follows it (`three/guide-arrow.js`); a world with no workings answers with the straight line.
   */
  routeTo(siteId, fromPos) {
    const site = this.data.sites.find(s => s.id === siteId);
    if (!site) return null;
    const from = Array.isArray(fromPos) ? fromPos : [fromPos.x, fromPos.z];
    const to = site.approachPos;
    return this.mine.routeTo(from[0], from[1], to[0], to[2]);
  }



  /**
   * A caged sodium luminaire: a lamp, so it is lit. The diffuser glows, and
   * the light under it is a SOURCE in the world's lamp pool rather than a
   * PointLight of its own — a forward renderer shades every light on every
   * pixel of the quarry, lit or not, and there are nine of these. Returned as
   * a group with `noMerge`, because the diffuser breathes and a baked lamp
   * could not.
   */
  buildLuminaire(x, y, z, { intensity = 6.5, distance = 11 } = {}) {
    const g = new THREE.Group();
    g.userData.noMerge = true;
    const housing = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.18, 0.26, 0.2, 14)), this.darkSteelMat
    );
    g.add(housing);
    const diffuser = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 14)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x5c3f22, emissive: SODIUM, emissiveIntensity: 1.25, roughness: 0.5
      }))
    );
    diffuser.position.y = -0.11;
    g.add(diffuser);
    this.lamps.push(diffuser);
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.014, 0.14, 0.014)), this.darkSteelMat
      );
      const a = (i / 4) * Math.PI * 2;
      bar.position.set(Math.cos(a) * 0.23, -0.17, Math.sin(a) * 0.23);
      g.add(bar);
    }
    const mark = new THREE.Object3D();
    mark.position.y = -0.3;
    mark.userData.lamp = { color: 0xffc98a, intensity, distance, decay: 1.4 };
    g.add(mark);
    this.lampMarks.push(mark);
    g.position.set(x, y, z);
    return g;
  }

  /* ======================================================================
     BEYOND THE WALK, AND THE MOVING AIR
     ====================================================================== */

  /**
   * GROUND COVER. A quarried plateau is never bare: loose cobbles the loaders
   * never picked up, and scrub — wiry grass and the dry heads of whatever
   * grows in ash — rooted wherever ash and rain gather. It is what the eye
   * reads at the boots, and a ground without it reads as a render. Both keep
   * off the yard, the haul road, the pit, the pad and every footprint.
   */
  initGroundCover() {
    const rand = mulberry32(0xc0b1);
    const L = this.data.landmarks;
    const r = this.sub.room;
    const s = this.sub.stair;
    const segs = (this.data.tracks?.ruts || []).flatMap(l => l.slice(1).map((p, i) => [l[i], p]));
    const nearTrack = (x, z, d) => segs.some(([a, b]) => {
      const abx = b[0] - a[0], abz = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (z - a[1]) * abz) / (abx * abx + abz * abz)));
      return Math.hypot(x - a[0] - abx * t, z - a[1] - abz * t) < d;
    });
    const clear = (x, z, pad) => {
      if (Math.abs(x) > 96 || Math.abs(z) > 96) return false;
      // Nothing is scattered on a hill, its cliffs or the cuttings dug into them (a cobble there would hang in
      // the air over a cutting's floor): the hills are bare rock.
      if (this.data.hills.some(h => hillDistance(h, x, z) < 6 + pad)) return false;
      if (x > r.minX - 3 && x < r.maxX + 3 && z > r.minZ - 3 && z < r.maxZ + 3) return false;
      if (x > s.minX - 3 && x < s.maxX + 3 && z > s.minZ - 3 && z < s.maxZ + 3) return false;
      // An arch's feet flare into talus past its declared radius.
      if (L.some(l => Math.hypot(x - l.pos[0], z - l.pos[2]) < l.radius + pad + (l.asset === 'arch' ? 4 : 0))) return false;
      // A conveyor is twenty-two metres long, not a circle: keep off its whole run.
      if (L.some(l => {
        if (l.asset !== 'conveyor') return false;
        const dx = x - l.pos[0]; const dz = z - l.pos[2];
        const along = dx * Math.sin(l.rotY) + dz * Math.cos(l.rotY);
        const across = dx * Math.cos(l.rotY) - dz * Math.sin(l.rotY);
        return Math.abs(along) < 12 && Math.abs(across) < 2.4 + pad;
      })) return false;
      if (this.data.sites.some(st => Math.hypot(x - st.pos[0], z - st.pos[2]) < 8.5)) return false;
      if (this.deck && x > this.deck.minX - 2 && x < this.deck.maxX + 2 && z > this.deck.minZ - 2 && z < this.deck.maxZ + 2) return false;
      if (this.raisedHeight(x, z) !== null) return false;
      return !nearTrack(x, z, 3.2);
    };
    const smp = { height: 0, yard: 0, ash: 0, wet: 0, tone: 0 };

    /* Cobbles: one merged mesh of small broken stone, each piece boxed. */
    {
      const rb = new RockBuilder();
      const n = this.t4 ? 420 : 160;
      let placed = 0;
      for (let tries = 0; tries < n * 6 && placed < n; tries++) {
        const x = (rand() - 0.5) * 190;
        const z = (rand() - 0.5) * 190;
        if (!clear(x, z, 1.2)) continue;
        this.field.sample(x, z, smp);
        if (smp.yard > 0.5 && rand() < 0.7) continue;
        rubbleField(rb, {
          count: 1 + Math.floor(rand() * 3), minX: x - 0.6, maxX: x + 0.6, minZ: z - 0.6, maxZ: z + 0.6,
          y: -0.05, seed: (0xc0b0 + tries) >>> 0, scale: 0.28 + rand() * 0.35,
          ground: (px, pz) => this.surfaceHeight(px, pz), t4: false, flat: 0.85
        });
        placed++;
      }
      const cobbles = this.rockMesh(rb, 'plateau-cobbles');
      cobbles.castShadow = false;
      this.scene.add(cobbles);
    }

    /* Scrub: crossed blade cards, instanced, stirred by the wind. */
    {
      const c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.clearRect?.(0, 0, 128, 128);
      const br = mulberry32(0x7ab5);
      for (let i = 0; i < 70; i++) {
        const x0 = 20 + br() * 88;
        const lean = (br() - 0.5) * 50;
        const h = 50 + br() * 76;
        const tone = br();
        const col = tone < 0.55 ? `rgb(${120 + br() * 40},${104 + br() * 30},${70 + br() * 20})`
          : tone < 0.85 ? `rgb(${84 + br() * 30},${86 + br() * 26},${52 + br() * 18})`
            : `rgb(${150 + br() * 30},${92 + br() * 20},${48 + br() * 12})`;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1 + br() * 1.6;
        ctx.beginPath?.();
        ctx.moveTo?.(x0, 128);
        ctx.quadraticCurveTo?.(x0 + lean * 0.3, 128 - h * 0.6, x0 + lean, 128 - h);
        ctx.stroke?.();
      }
      const tex = this.own(new THREE.CanvasTexture(c));
      tex.colorSpace = THREE.SRGBColorSpace;
      const geo = new THREE.BufferGeometry();
      const P = [], U = [], N = [];
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI;
        const dx = Math.cos(a) * 0.5, dz = Math.sin(a) * 0.5;
        const quad = [[-dx, 0, -dz, 0, 0], [dx, 0, dz, 1, 0], [dx, 1, dz, 1, 1], [-dx, 0, -dz, 0, 0], [dx, 1, dz, 1, 1], [-dx, 1, -dz, 0, 1]];
        for (const [x, y, z, u, v] of quad) { P.push(x, y, z); U.push(u, v); N.push(0, 1, 0); }
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      this.own(geo);
      const mat = this.own(new THREE.MeshStandardMaterial({
        map: tex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.95, metalness: 0
      }));
      this.scrubTime = { value: 0 };
      const time = this.scrubTime;
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uScrubT = time;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nuniform float uScrubT;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            {
              vec3 root = vec3(0.0);
              #ifdef USE_INSTANCING
                root = instanceMatrix[3].xyz;
              #endif
              float gust = sin(uScrubT * 1.7 + root.x * 0.21 + root.z * 0.17) * 0.5 + 0.5;
              float sway = (0.06 + 0.1 * gust) * position.y * position.y;
              transformed.x += sway * 0.906;
              transformed.z -= sway * 0.408;
            }`);
      };
      mat.customProgramCacheKey = () => 'ligar-scrub';
      const n = this.t4 ? 2600 : 900;
      const mesh = new THREE.InstancedMesh(geo, mat, n);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const up = new THREE.Vector3(0, 1, 0);
      let placed = 0;
      for (let tries = 0; tries < n * 8 && placed < n; tries++) {
        const x = (rand() - 0.5) * 190;
        const z = (rand() - 0.5) * 190;
        if (!clear(x, z, 0.6)) continue;
        this.field.sample(x, z, smp);
        // Scrub roots where ash and water gather, and hardly anywhere else.
        const want = 0.08 + smp.ash * 0.6 + smp.wet * 0.5 - smp.yard * 0.6;
        if (rand() > want) continue;
        // In clumps: a few tufts round each accepted root.
        const k = 1 + Math.floor(rand() * 4);
        for (let j = 0; j < k && placed < n; j++) {
          const px = x + (rand() - 0.5) * 1.4, pz = z + (rand() - 0.5) * 1.4;
          const h = 0.18 + rand() * 0.38;
          q.setFromAxisAngle(up, rand() * Math.PI);
          m4.compose(new THREE.Vector3(px, this.surfaceHeight(px, pz) - 0.02, pz), q,
            new THREE.Vector3(h * (0.8 + rand() * 0.6), h, h * (0.8 + rand() * 0.6)));
          mesh.setMatrixAt(placed++, m4);
        }
      }
      mesh.count = placed;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      mesh.receiveShadow = this.t4;
      mesh.name = 'plateau-scrub';
      // Not a body: a tuft is walked through.
      mesh.userData.phys = 'ambient';
      mesh.userData.noWeather = true;
      mesh.userData.noMerge = true;
      if (!geo.boundingBox) geo.computeBoundingBox();
      const boxes = [];
      for (let i = 0; i < placed; i++) { mesh.getMatrixAt(i, m4); boxes.push(geo.boundingBox.clone().applyMatrix4(m4)); }
      mesh.userData.partBoxes = boxes;
      this.scene.add(mesh);
    }
  }

  initVista() {
    this.vista = buildLigarVista({
      heightAt: (x, z) => this.surfaceHeight(x, z),
      t4: this.t4,
      rockMats: this.rockMats,
      own: (...o) => this.own(...o)
    });
    this.scene.add(this.vista.group);
  }

  initEffects() {
    const r = this.sub.room;
    const hearth = this.forgeCoals
      ? this.forgeCoals.getWorldPosition(new THREE.Vector3())
      : null;
    // The forge's flue is driven up through the hill, and its smoke leaves the top of it.
    const forge = hearth ? { x: hearth.x, y: this.surfaceHeight(hearth.x, hearth.z) + 0.6, z: hearth.z } : null;
    this.effects = createLigarEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents: [...(this.vents || []), ...(this.vista?.vents || [])],
      hearth, forge,
      pit: r,
      hidden: (x, z) => this.data.hills.some(h => hillDistance(h, x, z) < 6)
    });
    this.scene.add(this.effects.group);
  }

  /**
   * THE LAMPS SHARE THREE LIGHTS. The luminaires stand in four clusters tens
   * of metres apart (the portal, the tube, the gantry, the batch house and
   * the scale house), so the three nearest the eye are always the ones that
   * show (lamp-pool.js). The forge keeps a light of its own: it is a fire,
   * the one red source in the world, and it throws shadows.
   */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 3);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lampMarks) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  /**
   * WHAT NEVER MOVES IS BAKED. Every top-level group not already baked (the
   * sites, the deck) is merged into one mesh per material; the cased-up
   * instrument on each bench is baked on its own INSIDE its `noMerge` group,
   * so casing it up still hides one thing. A mesh carrying a physics tag, an
   * open shell or a weather exemption keeps its own mesh, because the tag
   * lives on the mesh and a bake would drop it.
   */
  bakeStatics() {
    // A merge keeps position, normal and uv and nothing else, so a mesh whose
    // shader reads more than that — the cut's floor carries the ground's
    // `aMask`, which is where its grit and its puddles are — stays itself.
    const KEPT = new Set(['position', 'normal', 'uv', 'uv1']);
    const needsOwnAttributes = o => o.isMesh && o.geometry && Object.keys(o.geometry.attributes).some(name =>
      !KEPT.has(name) && !(name === 'color' && !(Array.isArray(o.material) ? o.material : [o.material]).some(m => m?.vertexColors)));
    const bake = (group) => {
      group.traverse(o => {
        if (o !== group && (o.userData.phys || o.userData.noWeather || o.userData.openShell || needsOwnAttributes(o))) {
          o.userData.noMerge = true;
        }
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
    // A walkable surface built as a group of parts (the deck and its gantry,
    // the cut, the pad) is baked too: it is exempt from the overlap check by
    // kind, so baking costs no precision, and the deck alone was seventy-two
    // draw calls. The terrain, the sky and the air are single meshes or
    // `noMerge` already.
    for (const node of [...this.scene.children]) {
      if (!node.isGroup || node.userData.partBoxes || node.userData.noMerge) continue;
      if (node.userData.phys && node.userData.phys !== 'ground') continue;
      bake(node);
    }
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  /* ======================================================================
     PHYSICS
     ====================================================================== */

  /**
   * The colliders the walk is held against.
   *
   * Every rectangle below is derived from the same numbers the builders used,
   * so moving a bench moves its collider. Box colliders are given in WORLD
   * terms through `localBox`, which rotates a site-local rectangle by the
   * site's own facing.
   */
  buildColliders() {
    const r = this.sub.room;
    const s = this.sub.stair;
    const W = 0.4;
    const push = (minX, maxX, minZ, maxZ) => this.colliders.push({ minX, maxX, minZ, maxZ });

    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      // A host collides as its builder says (`initHosts`); its landmark only declares the footprint.
      if (lm.host) continue;
      // Ankle height, or walked on: the stakes, the pad, the loose fallen
      // sections and the spoil (you scramble up a heap, you do not bounce off).
      if (lm.asset === 'stake-marker' || lm.asset === 'landing-pad') continue;

      /* ELEVATED STRUCTURES ARE THEIR SUPPORTS. A conveyor is twenty metres
         long and its span is overhead; one radius at its centre would seal
         open ground and leave the legs walk-through. So its legs are what is
         collided — and an ARCH is the same case: you walk under it. */
      const supports = this.supportPoints(lm);
      if (supports) {
        for (const sp of supports) this.colliders.push(sp);
        continue;
      }
      // A spoil heap or a fallen column is lower and wider than its body; its
      // collider is drawn in to what actually stops a boot.
      const shrink = (lm.asset === 'spoil-heap' || lm.asset === 'broken-column') ? 0.6 : 1.0;
      this.colliders.push({ x: lm.pos[0], z: lm.pos[2], radius: lm.radius * shrink });
    }

    // Each bench: a box matching its plate, rotated into the world by its site.
    for (const anchor of this.benchAnchors.values()) {
      const [bx, , bz] = anchor.position;
      const c = Math.abs(Math.cos(anchor.rotationY));
      const sn = Math.abs(Math.sin(anchor.rotationY));
      const hx = 2.4 * c + 0.65 * sn;
      const hz = 2.4 * sn + 0.65 * c;
      push(bx - hx, bx + hx, bz - hz, bz + hz);
    }

    // The lava tube's two walls (the barrel springs off them).
    if (this.tube) {
      const t = this.tube;
      push(t.minX - 0.3, t.minX + 0.3, t.minZ, t.maxZ);
      push(t.maxX - 0.3, t.maxX + 0.3, t.minZ, t.maxZ);
    }

    // The hosts: you stand at a bench, you do not walk through it or the machine it is built into.
    // Each builder hands back its own footprints in its own frame (`initHosts` turned them to the world's).
    for (const c of this.hostColliders) this.colliders.push(c);

    // THE HILLS. They are not climbed: a ring of colliders round each, open only at the cuttings, and a
    // wall along every side of every working that is not a doorway.
    for (const c of this.mine.ringColliders()) this.colliders.push(c);
    for (const c of this.mine.wallColliders()) this.colliders.push(c);

    // The deck gantry's three columns.
    if (this.deck) {
      const GX = this.deck.minX + 0.4;
      for (const gz of [this.deck.minZ + 1.0, (this.deck.minZ + this.deck.maxZ) / 2, this.deck.maxZ - 1.0]) {
        this.colliders.push({ x: GX, z: gz, radius: 0.34 });
      }
    }

    // THE PIT RIM. Thin box colliders round the excavation, split so the ramp
    // mouth is the only way down — which is what makes the descent a walk.
    push(r.minX - W, r.maxX + W, r.minZ - W, r.minZ);           // far wall
    push(r.minX - W, r.minX, r.minZ, r.maxZ);                   // west wall
    push(r.maxX, r.maxX + W, r.minZ, r.maxZ);                   // east wall
    push(r.minX - W, s.minX, r.maxZ, r.maxZ + W);               // near wall, west of ramp
    push(s.maxX, r.maxX + W, r.maxZ, r.maxZ + W);               // near wall, east of ramp
    push(s.minX - W, s.minX, s.minZ, s.maxZ);                   // ramp cut, west
    push(s.maxX, s.maxX + W, s.minZ, s.maxZ);                   // ramp cut, east
  }

  /**
   * The feet of an elevated structure, in world terms, or null if the landmark
   * is an ordinary solid object.
   *
   * The local coordinates are the ones the builders place their legs at:
   * `buildConveyor` puts trestles at 0 and ±0.38 of its 22 m length, a pair at
   * x = ±0.7; `buildArch` stands its legs at ±R, R = 14 x scale.
   */
  supportPoints(lm) {
    let local = null;
    let radius = 0.55;
    if (lm.asset === 'conveyor') {
      const L = 22;
      local = [];
      for (const lz of [-L * 0.38, 0, L * 0.38]) {
        local.push([-0.7, lz], [0.7, lz]);
      }
    } else if (lm.asset === 'arch') {
      // Each foot is a flared buttress, broader across the arch than through
      // it: three circles in a row along its breadth cover it.
      const R = 14 * (lm.scale || 1);
      const info = this.archInfo?.get(`${lm.pos[0]},${lm.pos[2]}`);
      const hx = info ? info.legHalfX : 2.8 * (lm.scale || 1);
      const hz = info ? info.legHalfZ : 4.4 * (lm.scale || 1);
      local = [];
      for (const fx of [-R, R]) for (const k of [-0.6, 0, 0.6]) local.push([fx, hz * k]);
      radius = Math.max(hx * 0.95, hz * 0.42);
    }
    if (!local) return null;

    const cos = Math.cos(lm.rotY || 0);
    const sin = Math.sin(lm.rotY || 0);
    return local.map(([lx, lz]) => ({
      x: lm.pos[0] + lx * cos + lz * sin,
      z: lm.pos[2] - lx * sin + lz * cos,
      radius
    }));
  }

  /* ======================================================================
     STATE AND FRAME
     ====================================================================== */

  /**
   * Which way a site faces: toward the ground a player walks in from. Derived
   * from `approachPos` — the same rule Tallow follows, for the same reason: a
   * hardcoded angle put a player behind a bench's back wall once already.
   */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    if (Math.hypot(ax, az) < 0.01) return 0;
    return Math.atan2(ax, az);
  }

  /**
   * Record where a bench's working surface is, in world terms.
   *
   * `local` is where the bench sits inside the site group; the group's own
   * rotation is applied so a site that faces another way still reports the
   * plate it actually has. `dormant` is the cased-up instrument, hidden for
   * exactly as long as the deployed one stands in its place.
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
    // A deployed instrument moves (jaws close, pieces fall), so while one is
    // open the sun's shadow is re-drawn every frame.
    if (anchor) {
      if (deployed && !anchor.open) { this.benchesOpen++; this._airWatch = 40; }
      if (!deployed && anchor.open) this.benchesOpen--;
      anchor.open = deployed;
    }
    // The case came off or went back on: the fire sees a different bench.
    if (this.forgeLight?.castShadow) this.forgeLight.shadow.needsUpdate = true;
  }

  /** The working surface for a quest's site, or null if it has no bench. */
  benchAnchor(questId) {
    return this.benchAnchors.get(questId) || null;
  }

  /**
   * Light a site's indicator when its quest is complete. Driven by the Learn
   * track's own progress — the world reads state, it never keeps it.
   */
  setSiteComplete(questId, complete) {
    const marker = this.siteMarkers.get(questId);
    if (!marker || !marker.indicator) return;
    marker.indicator.material.emissiveIntensity = complete ? 1.7 : 0;
    marker.indicator.material.color.setHex(complete ? SODIUM : 0x4a4038);
    marker.indicator.material.needsUpdate = true;
  }


  update(delta, cameraPos) {
    this.elapsed += delta;
    ligarSkyUniforms.uLTime.value = this.elapsed;
    // While an instrument is open, whatever it has built since the last look gets the air: every frame at
    // first (its stations appear a few frames after the bench is announced), then now and again.
    if (this.benchesOpen > 0) {
      const eager = (this._airWatch ?? 0) > 0;
      if (eager) this._airWatch--;
      if (eager || (this._airTick = ((this._airTick ?? 0) + 1) % 10) === 0) this.coverNewMaterials();
    }
    if (this.scrubTime) this.scrubTime.value = this.elapsed;
    if (cameraPos) {
      // Nothing in Ligar that casts a shadow moves on its own — the fire, the
      // smoke and the ash cast none — so between the box following the player
      // and an instrument being worked, the map is re-drawn twice a second as
      // a safety net rather than every third frame.
      const moved = followLigarShadow(this.sunLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.sunLight, moved, { live: this.benchesOpen > 0, every: 30 });
      if (this.renderer?.getDrawingBufferSize) {
        this._buf = this._buf || new THREE.Vector2();
        this.effects?.setViewportHeight(this.renderer.getDrawingBufferSize(this._buf).y);
      }
      // Under a hill the ash that hangs in the open air is gone.
      const v = this.mine.volumeAt(cameraPos.x, cameraPos.z);
      this._indoors = (this._indoors ?? 0) + ((v && v.kind !== 'cutting' ? 1 : 0) - (this._indoors ?? 0)) * Math.min(1, delta * 4);
      this.effects?.setIndoors?.(this._indoors);
      this.effects?.update(delta, this.elapsed, cameraPos);
      this.lampPool?.update(cameraPos);
      // The fire's shadow is frozen (see initTubeForge); while an instrument
      // is open within its reach, something in it moves, so it is re-drawn
      // one frame in three — the same pace the sun keeps for a still player.
      if (this.benchesOpen > 0 && this.forgeLight?.castShadow) {
        if (!this._forgePos) {
          this.forgeLight.updateWorldMatrix(true, false);
          this._forgePos = this.forgeLight.getWorldPosition(new THREE.Vector3());
        }
        this._forgeTick = ((this._forgeTick || 0) + 1) % 3;
        if (this._forgeTick === 0 && cameraPos.distanceTo(this._forgePos) < this.forgeLight.distance + 10) {
          this.forgeLight.shadow.needsUpdate = true;
        }
      }
    }
    this.vista?.update?.(delta, this.elapsed);

    // The fire breathes. Two sines at unrelated rates, so it never loops
    // visibly; the coals follow the light at a lag, the way embers do.
    if (this.forgeLight) {
      const f = 1 + Math.sin(this.elapsed * 7.3) * 0.08 + Math.sin(this.elapsed * 2.9 + 1.3) * 0.12
        + Math.sin(this.elapsed * 17.1) * 0.03;
      this.forgeLight.intensity = 16 * f;
      if (this.forgeCoals) this.forgeCoals.material.emissiveIntensity = 2.1 + (f - 1) * 1.6;
    }
    // Lamps are old, not alarming: a slow filament drift, never a strobe.
    for (let i = 0; i < this.lamps.length; i++) {
      const lamp = this.lamps[i];
      lamp.material.emissiveIntensity = 1.25 + Math.sin(this.elapsed * 1.3 + i * 1.7) * 0.12;
    }
  }

  dispose() {
    this.effects?.dispose();
    this.vista?.dispose?.();
    this.envTarget?.dispose();
    for (const d of this.disposables) {
      try { d.dispose(); } catch (e) {}
    }
    this.disposables = [];
    this.scene.clear();
    this.siteMarkers.clear();
    this.benchAnchors.clear();
    this.colliders = [];
    this.hostColliders = [];
    this.lamps = [];
    this.lampMarks = [];
  }
}
