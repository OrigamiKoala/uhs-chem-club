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
 *   this file            the plant, the four sites, physics and state
 *
 * WHAT IS HERE, AND WHY IT IS HERE
 * Four Unit 2 sites stand on the ground as physical places, one per bench:
 *   site-1  Arch Terrace  — q1-joins.   A sawn stone terrace under a stone
 *           portal, west of the yard, where two pieces are clamped together.
 *   site-2  Tube Forge    — q2-lattice. Down the ramp into the cut and in
 *           through the lava tube: a hearth, an anvil, a quench trough. Heat,
 *           because heating a block is what that bench is for.
 *   site-3  Batch House   — q3-recipe.  On the east deck under the gantry, fed
 *           by the silos: where a batch is sampled.
 *   site-4  Weighbridge   — q4-weigh.   The weigh deck south of the batch
 *           house, with its load cells and its scale house.
 * ALL FOUR carry their instruments as built objects (`BUILT_BENCHES`), so a
 * player who walks up and presses [E] keeps their feet and works a real bench.
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
 * the only emissive surfaces in the whole world are the forge in the tube, the
 * luminaires, the mast lamps and one indicator per bench — and the luminaires
 * share a pool of three real lights (lamp-pool.js), because a PointLight is
 * shaded on every pixel of the quarry whether it reaches it or not.
 */

import * as THREE from 'three';
import ligarData from './world-data/ligar.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, treadPlate,
  buildMaterial, enableAO,
  texSize, heightField, heightToNormal, asDataTexture, fbm,
  boltRing, boltLine, weldBead, cableRun, placard,
  hazardStripe, mergeStatic
} from './materials/pbr-kit.js';
import {
  basaltColumn, scoriaGrit, lavaTubeWall, conveyorBelt, basaltTop
} from './materials/ligar-textures.js';
import {
  createLigarSkyDome, createLigarCelestials, createLigarLights, followLigarShadow,
  createLigarEnvironment, applyLigarAir, ligarSkyUniforms, LSKY
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

/** The forge in the tube. Hotter and redder than a lamp, because it is a fire. */
const FORGE = 0xc1521c;

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
    this.field = makeLigarField(this.data.terrain.maxHeight);
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
    this.initArchTerrace();
    this.initTubeForge();
    this.initBatchDeck();
    this.initBatchHouse();
    this.initWeighbridge();
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
      { minX: s.minX - M, maxX: s.maxX + M, minZ: r.maxZ, maxZ: s.maxZ }
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
   * `kind` is which instrument is cased up here. It changes the face of the
   * dormant cabinet and nothing else: four identical cabinets would mean a
   * player walking the quarry could not tell the press from the weigh-head
   * until they were standing at it.
   *
   * @returns {{group: THREE.Group, indicator: THREE.Mesh,
   *            dormant: THREE.Group, topY: number}}
   */
  buildBench(opts = {}) {
    const {
      width = 4.8, depth = 1.3, height = 0.95, kind = 'join', plate = 'LB-01'
    } = opts;
    const g = new THREE.Group();
    const rand = mulberry32(0x2a71 + Math.round(width * 100) + kind.length);

    /* THE PLINTH. A bench in a quarry stands on stone, because stone is what
       there is — two cut blocks with the steel frame bolted down onto them. */
    for (const px of [-width / 2 + 0.55, width / 2 - 0.55]) {
      const block = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.72, 0.34, depth + 0.16)), this.basaltMat
      );
      block.position.set(px, 0.17, 0);
      block.receiveShadow = block.castShadow = tierAtLeast('T4');
      g.add(block);
    }

    const top = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width, 0.09, depth)), this.plateMat
    );
    top.position.y = height;
    top.castShadow = top.receiveShadow = tierAtLeast('T4');
    g.add(top);

    // A raised lip along the back, so nothing rolls off into the grit.
    const lip = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width, 0.14, 0.06)), this.darkSteelMat
    );
    lip.position.set(0, height + 0.11, -depth / 2 + 0.03);
    g.add(lip);

    // The frame: channel legs with gussets at the knee, footplates bolted to
    // the plinth. Heavier than Tallow's, because heavier is what this is for.
    const legGeo = this.own(new THREE.BoxGeometry(0.14, height - 0.34, 0.14));
    for (const [lx, lz] of [
      [-width / 2 + 0.16, -depth / 2 + 0.12], [width / 2 - 0.16, -depth / 2 + 0.12],
      [-width / 2 + 0.16, depth / 2 - 0.12], [width / 2 - 0.16, depth / 2 - 0.12]
    ]) {
      const leg = new THREE.Mesh(legGeo, this.darkSteelMat);
      leg.position.set(lx, 0.34 + (height - 0.34) / 2, lz);
      leg.castShadow = tierAtLeast('T4');
      g.add(leg);
      const foot = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.26, 0.04, 0.26)), this.plateMat
      );
      foot.position.set(lx, 0.36, lz);
      g.add(foot);
      // The gusset where the leg meets the top — a triangle, so it is bracing
      // rather than decoration.
      const gusset = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.02, 0.2, 0.2)), this.darkSteelMat
      );
      gusset.position.set(lx, height - 0.14, lz);
      gusset.rotation.x = Math.sign(lz) * 0.78;
      g.add(gusset);
    }
    const brace = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width - 0.36, 0.08, 0.08)), this.darkSteelMat
    );
    brace.position.set(0, height * 0.42, 0);
    g.add(brace);

    // Under-bench shelf, holding two crates of sample stone.
    const shelf = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width - 0.4, 0.05, depth - 0.3)), this.darkSteelMat
    );
    shelf.position.set(0, height * 0.52, 0);
    g.add(shelf);
    for (const sx of [-width * 0.28, width * 0.22]) {
      const c = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.44, 0.3, 0.44)), this.timberMat
      );
      c.position.set(sx, height * 0.52 + 0.18, 0);
      g.add(c);
      const band = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.46, 0.05, 0.46)), this.darkSteelMat
      );
      band.position.set(sx, height * 0.52 + 0.3, 0);
      g.add(band);
    }

    /* THE DORMANT INSTRUMENT.
       What stands on the bench when nobody is working at it is the instrument,
       cased up. When the player presses [E] the case is hidden and the stations
       deploy on this same plate — so the two are never drawn at once, and no
       two objects ever share that square of bench. */
    const dormant = new THREE.Group();
    // Held out of any static bake: this whole subtree is hidden while the
    // instrument is deployed, and a baked cabinet could never be cased up.
    dormant.userData.noMerge = true;
    g.add(dormant);

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

    // Tool rail along the back, with three tools racked where a hand reaches.
    const rail = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.018, 0.018, 0.94, 8)), this.darkSteelMat
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(-0.6, height + 0.36, -0.3);
    g.add(rail);
    for (const [tx, tl] of [[-0.86, 0.24], [-0.6, 0.32], [-0.34, 0.19]]) {
      const tool = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.05, tl, 0.035)), this.darkSteelMat
      );
      tool.position.set(tx, height + 0.36 - tl / 2 - 0.02, -0.3);
      g.add(tool);
    }

    /* THE ONE INDICATOR. Dead until this site's quest is finished.
       Set into the APRON, not into the cabinet face: the cabinet is cased up
       while the instrument is deployed, and a status lamp that vanished the
       moment you started working would be a lamp attached to nothing. */
    const indicator = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.035, 10, 8)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x4a4038, emissive: SODIUM, emissiveIntensity: 0, roughness: 0.6
      }))
    );
    indicator.position.set(width / 2 - 0.44, height - 0.14, depth / 2 + 0.036);
    indicator.userData.noMerge = true;   // its emissive changes on completion
    indicator.userData.noWeather = true;
    g.add(indicator);
    const well = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12)), this.darkSteelMat
    );
    well.rotation.x = Math.PI / 2;
    well.position.set(width / 2 - 0.44, height - 0.14, depth / 2 + 0.018);
    g.add(well);

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

    // The bench's own plate number, riveted to the apron.
    const tag = placard(plate, { w: 0.28, h: 0.11 });
    tag.position.set(-width / 2 + 0.44, height - 0.14, depth / 2 + 0.006);
    g.add(tag);
    this.own(tag.geometry, tag.material, tag.material.map);

    return { group: g, indicator, dormant, topY: height + 0.045 };
  }

  /**
   * A site's signpost.
   *
   * A SITE LABEL IS A SIGNPOST (CLAUDE.md §Tallow): it names what the bench
   * teaches, so a player choosing where to go does not have to walk into a
   * building to find out what is in it. The text is the site's own `label`
   * from the world data and is written in exactly one place.
   */
  buildSiteSign(site, { w = 2.4, h = 0.46 } = {}) {
    const g = new THREE.Group();
    const board = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(w, h, 0.05)), this.plateMat
    );
    board.castShadow = tierAtLeast('T4');
    g.add(board);
    // An angle frame round it, and a bolt at each corner.
    for (const [bx, by, bw, bh] of [
      [0, h / 2 + 0.03, w + 0.06, 0.06], [0, -h / 2 - 0.03, w + 0.06, 0.06],
      [-w / 2 - 0.03, 0, 0.06, h + 0.12], [w / 2 + 0.03, 0, 0.06, h + 0.12]
    ]) {
      const bar = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(bw, bh, 0.06)), this.darkSteelMat
      );
      bar.position.set(bx, by, 0);
      g.add(bar);
    }
    const text = placard(site.label, { w: w - 0.18, h: h - 0.14 });
    text.position.z = 0.032;
    g.add(text);
    this.own(text.geometry, text.material, text.material.map);
    return g;
  }

  /* ======================================================================
     THE SITES
     Four places, one per bench. Each is a real structure standing on the
     ground, turned to face the way the player walks in.
     ====================================================================== */

  /**
   * Site 1 — the Arch Terrace. `q1-joins`.
   *
   * A cut platform west of the yard with a stone portal standing over it: two
   * columns of basalt carrying a lintel, which is the arch the whole world is
   * named for, brought down to the size of a doorway. The press bench stands
   * under it, out of the wind, with the stone it works on stacked beside it.
   */
  initArchTerrace() {
    const site = this.data.sites.find(s => s.id === 'site-1');
    if (!site) return;
    const baseY = this.surfaceHeight(site.pos[0], site.pos[2]);
    const g = new THREE.Group();
    g.name = 'site-1';
    const rand = mulberry32(0x1a01);

    /* THE TERRACE. Column tops sawn level, a step proud of the ground, so the
       bench is not working in the dust: the honeycomb IS the paving, and its
       edge is ragged by whole columns, because it was quarried out of the
       flow it stands on. */
    this.raised.push({
      kind: 'rect', cx: site.pos[0], cz: site.pos[2], rot: this.siteFacing(site),
      hx: 4.5, hz: 3.2, y: baseY + 0.3
    });
    const rb = new RockBuilder();
    sawnSlab(rb, { hx: 4.55, hz: 3.25, top: 0.3, bottom: -0.45, pitch: 0.62, seed: 0x7e11 });
    // The step up onto it, on the approach side only.
    sawnSlab(rb, { hx: 1.6, hz: 0.3, x0: 0, z0: 3.5, top: 0.15, bottom: -0.3, pitch: 0.4, seed: 0x7e12 });
    /* THE PORTAL. Two piers of standing column carrying a lintel of columns
       laid on their sides, five metres clear — quarried out of the colonnade
       rather than imported from a temple. */
    const PIER_X = 3.5;
    const CLEAR = 4.6;
    for (const px of [-PIER_X, PIER_X]) {
      columnRaft(rb, {
        radius: 0.95, x0: px, z0: 0, pitch: 0.46, exactH: CLEAR,
        seed: 0x9e00 + (px > 0 ? 1 : 0), gappy: 0, t4: this.t4,
        ground: () => 0.3
      });
    }
    lintelBeam(rb, { half: PIER_X + 0.9, y0: 0.3 + CLEAR + 0.02, y1: 0.3 + CLEAR + 0.74, hz: 0.78, seed: 0x9e02 });
    g.add(this.rockMesh(rb, 'site-1-portal'));

    /* THE CANOPY. A sheet slung under the lintel on four rods, because the
       portal keeps the sun off and nothing keeps the grit off. */
    const canopy = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(6.4, 0.06, 3.0)), this.plateMat
    );
    canopy.position.set(0, 0.3 + CLEAR - 0.35, -0.4);
    canopy.rotation.x = 0.05;
    canopy.castShadow = canopy.receiveShadow = tierAtLeast('T4');
    g.add(canopy);
    for (let i = 0; i < 12; i++) {
      const rib = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.06, 0.04, 3.0)), this.darkSteelMat
      );
      rib.position.set(-2.95 + i * 0.54, 0.3 + CLEAR - 0.31, -0.4);
      rib.rotation.x = 0.05;
      g.add(rib);
    }
    for (const [hx, hz] of [[-2.9, -1.7], [2.9, -1.7], [-2.9, 0.9], [2.9, 0.9]]) {
      const rod = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6)), this.pipeMat
      );
      rod.position.set(hx, 0.3 + CLEAR - 0.15, hz);
      g.add(rod);
    }

    /* THE BENCH, under the portal, facing the way in. */
    const bench = this.buildBench({ kind: 'join', plate: 'LB-01' });
    bench.group.position.set(0, 0.3, -0.7);
    g.add(bench.group);

    // A caged work lamp hung off the canopy, with its feed looped to the pier.
    const lamp = this.buildLuminaire(0, 0.3 + CLEAR - 0.5, 0.35);
    g.add(lamp);
    const feed = cableRun(
      [0, 0.3 + CLEAR - 0.48, 0.35], [-3.3, 0.3 + CLEAR - 1.2, 0.3],
      this.darkSteelMat, { sag: 0.45, radius: 0.016, segments: 14 }
    );
    g.add(feed);
    this.own(feed.userData.ownGeometry);
    const drop = cableRun(
      [-3.3, 0.3 + CLEAR - 1.2, 0.3], [-3.5, 1.1, 0.0],
      this.darkSteelMat, { sag: 0.16, radius: 0.016, segments: 10 }
    );
    g.add(drop);
    this.own(drop.userData.ownGeometry);

    /* THE STOCK. Cut blocks of the two kinds this bench presses together,
       stacked on the terrace with a tally slate leaning on them. */
    for (const [bx, bz, n] of [[-3.1, 2.0, 4], [3.1, 2.0, 3]]) {
      for (let i = 0; i < n; i++) {
        const block = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.62, 0.3, 0.5)), this.basaltMat
        );
        block.position.set(bx + (rand() - 0.5) * 0.1, 0.45 + i * 0.32, bz);
        block.rotation.y = (rand() - 0.5) * 0.2;
        block.castShadow = block.receiveShadow = tierAtLeast('T4');
        g.add(block);
      }
    }

    // A hand winch on a post, for getting a block onto the plate.
    const post = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.1, 0.12, 2.6, 10)), this.pipeMat
    );
    post.position.set(-2.6, 0.3 + 1.3, -1.9);
    post.castShadow = tierAtLeast('T4');
    g.add(post);
    const jib = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.6, 0.1, 0.1)), this.darkSteelMat
    );
    jib.position.set(-1.9, 0.3 + 2.5, -1.9);
    g.add(jib);
    const chain = cableRun(
      [-1.2, 0.3 + 2.45, -1.9], [-1.2, 0.3 + 1.1, -1.9],
      this.darkSteelMat, { sag: 0.02, radius: 0.02, segments: 6 }
    );
    g.add(chain);
    this.own(chain.userData.ownGeometry);
    const hook = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.09, 0.02, 5, 10, Math.PI * 1.4)), this.pipeMat
    );
    hook.position.set(-1.2, 0.3 + 1.0, -1.9);
    g.add(hook);

    // THE SIGN, on the approach face of the west pier, at reading height.
    const sign = this.buildSiteSign(site);
    sign.position.set(-PIER_X + 0.05, 2.5, 1.0);
    sign.rotation.y = 0.28;
    g.add(sign);

    // Grit banked in the lee of the piers, and the wear where feet have gone
    // round the end of the bench for forty years.
    const wear = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(2.4, 1.6)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x3a342c, transparent: true, opacity: 0.42, roughness: 0.7,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
      }))
    );
    wear.rotation.x = -Math.PI / 2;
    wear.position.set(0, 0.302, 1.3);
    g.add(wear);

    g.position.set(site.pos[0], baseY, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    // The bench sits three quarters of a metre back from the site marker, on
    // the terrace. Recorded rather than recomputed: move the bench and the
    // instrument follows it.
    this.registerBenchAnchor(site, g, bench, [0, 0.3, -0.7]);
  }

  /**
   * Site 2 — the Tube Forge. `q2-lattice`.
   *
   * Down the ramp, along the quarry floor, and in under the arch at the far
   * end: a lava tube the cut has opened, with a hearth in it. This is the one
   * warm place on Ligar, and it is warm because the bench that stands here
   * heats blocks until they come apart — the fire is the instrument's reason
   * for being in a cave rather than on the flat.
   */
  initTubeForge() {
    const site = this.data.sites.find(s => s.id === 'site-2');
    if (!site) return;
    const t = this.tube;
    const fy = this.sub.floorY;
    const g = new THREE.Group();
    g.name = 'site-2';
    const rand = mulberry32(0x2b02);

    const W = t.maxX - t.minX;          // 10 m across
    const D = t.maxZ - t.minZ;          // 12.5 m deep
    const R = W / 2;                    // the barrel's radius
    const SPRING = 0.4;                 // how high the barrel springs off the floor
    // Local origin is the site's position, and the site's derived facing comes
    // out as zero here, so everything below is a plain translation of the
    // world rectangle into the group's frame.
    const ox = (t.minX + t.maxX) / 2 - site.pos[0];
    const oz = (t.minZ + t.maxZ) / 2 - site.pos[2];
    const MOUTH_Z = t.maxZ - site.pos[2];
    const BACK_Z = t.minZ - site.pos[2];

    /* THE BARREL. A lava tube is a pipe the flow drained out of, so the roof
       is the one curved surface in a world made entirely of flat faces — which
       is exactly why the player knows they have gone inside. Drawn as the top
       half of a cylinder lying along the tube: `thetaStart` at a quarter turn
       is what picks the top half once the cylinder has been laid down. */
    const roof = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(
        R, R, D, 24, 1, true, Math.PI / 2, Math.PI
      )),
      this.tubeMat
    );
    roof.rotation.x = Math.PI / 2;
    roof.position.set(ox, SPRING, oz);
    roof.material.side = THREE.DoubleSide;
    roof.receiveShadow = tierAtLeast('T4');
    // An open shell: a vault has an underside you stand beneath, not an inside
    // you stand in. Tells the bench check to measure its surface, not its box.
    roof.userData.openShell = true;
    g.add(roof);

    // The low kerb walls the barrel springs off, so the tube meets the floor
    // in a fillet rather than in a knife edge.
    for (const sx of [ox - R, ox + R]) {
      const kerbWall = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.5, SPRING + 0.5, D)), this.tubeMat
      );
      kerbWall.position.set(sx, (SPRING + 0.5) / 2 - 0.2, oz);
      kerbWall.receiveShadow = tierAtLeast('T4');
      g.add(kerbWall);
    }

    // The back of the tube, where it narrows and goes dark.
    const back = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(W + 0.6, R + 1.2, 0.6)), this.tubeMat
    );
    back.position.set(ox, (R + 1.2) / 2 - 0.2, BACK_Z - 0.2);
    back.receiveShadow = tierAtLeast('T4');
    g.add(back);

    /* THE MOUTH. The columns round the tube's mouth stand RADIAL to it — the
       flow cooled round the void the tube drained — so walking in is walking
       under a fan of column ends, the smaller cousin of the great arches. The
       middle is left clear: a doorway you cannot use is worse than none. */
    {
      const rb = new RockBuilder();
      radialRing(rb, {
        cx: ox, cy: SPRING, z0: MOUTH_Z - 0.3, rIn: R + 0.05, rOut: R + 1.1,
        depth: 1.1, a0: 0, a1: Math.PI, seed: 0x2b0e, pitch: 0.5,
        skip: (px, py) => py < 2.5 && Math.abs(px - ox) < 2.4
      });
      g.add(this.rockMesh(rb, 'tube-mouth'));
    }

    /* THE HEARTH, against the west wall. A stone box with a steel grate, a
       fire in it, and a hood over it drawing up a flue through the roof. The
       fire is the only thing on Ligar that moves by itself and the only red
       light in the world. */
    const HX = ox - R + 1.4;
    const hearth = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.9, 0.86, 1.3)), this.basaltMat
    );
    hearth.position.set(HX, 0.43, 0.6);
    hearth.castShadow = hearth.receiveShadow = tierAtLeast('T4');
    g.add(hearth);
    const grate = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.5, 0.06, 1.0)), this.darkSteelMat
    );
    grate.position.set(HX, 0.88, 0.6);
    g.add(grate);
    for (let i = 0; i < 7; i++) {
      const bar = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.05, 0.08, 1.0)), this.pipeMat
      );
      bar.position.set(HX - 0.64 + i * 0.21, 0.92, 0.6);
      g.add(bar);
    }

    // THE FIRE. Emissive coals and a point light on them. A fire is a lamp in
    // the sense CLAUDE.md §4.2 allows: it is literally a source, and it is the
    // reason this chamber is visible at all.
    this.forgeCoals = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.3, 0.14, 0.8)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x2a1006, emissive: FORGE, emissiveIntensity: 2.3, roughness: 0.9
      }))
    );
    this.forgeCoals.position.set(HX, 0.99, 0.6);
    this.forgeCoals.userData.noMerge = true;
    g.add(this.forgeCoals);

    this.forgeLight = new THREE.PointLight(FORGE, 16, 15, 1.7);
    this.forgeLight.position.set(HX, 1.5, 0.6);
    if (tierAtLeast('T4')) {
      this.forgeLight.castShadow = true;
      this.forgeLight.shadow.mapSize.set(512, 512);
      this.forgeLight.shadow.bias = -0.004;
      // A POINT LIGHT'S SHADOW IS SIX RENDERS OF THE SCENE, and three.js
      // re-draws all six every frame by default — for a fire that does not
      // move, in a stone tube where nothing else does either. Drawn once, and
      // again only while an instrument is being worked beside it (update()).
      this.forgeLight.shadow.autoUpdate = false;
      this.forgeLight.shadow.needsUpdate = true;
    }
    g.add(this.forgeLight);

    // The hood and the flue, venting up through the barrel.
    const hood = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.26, 1.2, 1.0, 4)), this.drumMat
    );
    hood.rotation.y = Math.PI / 4;
    hood.position.set(HX, 2.0, 0.6);
    hood.castShadow = tierAtLeast('T4');
    g.add(hood);
    const flue = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.26, 0.26, 2.6, 12)), this.pipeMat
    );
    flue.position.set(HX, 3.7, 0.6);
    g.add(flue);

    // Bellows on a timber frame beside the hearth, handle down.
    const bellows = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.52, 0.36, 1.0)), this.timberMat
    );
    bellows.position.set(HX - 0.6, 1.05, 2.3);
    g.add(bellows);
    const bhandle = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6)), this.timberMat
    );
    bhandle.rotation.z = 0.5;
    bhandle.position.set(HX - 0.6, 0.9, 2.95);
    g.add(bhandle);

    /* THE ANVIL and THE QUENCH TROUGH. What a forge has, and what the bench
       standing here is for: heat a block, hit it, put it in the water. */
    const stump = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.34, 0.4, 0.6, 12)), this.timberMat
    );
    stump.position.set(-1.6, 0.3, 2.2);
    stump.castShadow = tierAtLeast('T4');
    g.add(stump);
    const anvilBody = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.9, 0.2, 0.28)), this.pipeMat
    );
    anvilBody.position.set(-1.6, 0.7, 2.2);
    anvilBody.castShadow = tierAtLeast('T4');
    g.add(anvilBody);
    const anvilWaist = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.34, 0.22, 0.24)), this.pipeMat
    );
    anvilWaist.position.set(-1.6, 0.49, 2.2);
    g.add(anvilWaist);
    const horn = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(0.11, 0.42, 10)), this.pipeMat
    );
    horn.rotation.z = -Math.PI / 2;
    horn.position.set(-0.95, 0.7, 2.2);
    g.add(horn);

    const trough = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.4, 0.46, 0.66)), this.drumMat
    );
    trough.position.set(1.0, 0.23, 2.6);
    trough.castShadow = trough.receiveShadow = tierAtLeast('T4');
    g.add(trough);
    const water = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(1.26, 0.54)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x15171a, roughness: 0.14, metalness: 0.3
      }))
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(1.0, 0.4, 2.6);
    g.add(water);

    /* THE BENCH, across the back of the chamber, facing the mouth. */
    const bench = this.buildBench({ kind: 'join', plate: 'LB-02' });
    bench.group.position.set(ox, 0, -3.2);
    g.add(bench.group);

    // Sodium luminaires under the barrel: a fire lights a hearth, not a room.
    for (const lz of [-4.6, 1.4]) {
      const lum = this.buildLuminaire(ox, R - 0.6, oz + lz);
      g.add(lum);
    }

    // A rack of tongs on the east wall, and a bin of fuel beside it.
    const rack = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.1, 1.4, 1.2)), this.darkSteelMat
    );
    rack.position.set(ox + R - 0.6, 0.7, -0.6);
    g.add(rack);
    for (let i = 0; i < 4; i++) {
      const tong = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.04, 0.8, 0.04)), this.pipeMat
      );
      tong.position.set(ox + R - 0.72, 0.9, -1.05 + i * 0.3);
      tong.rotation.z = (rand() - 0.5) * 0.16;
      g.add(tong);
    }
    const bin = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.1, 0.7, 0.9)), this.darkSteelMat
    );
    bin.position.set(ox + R - 1.1, 0.35, 2.6);
    g.add(bin);
    const coal = this.buildRubbleField({
      count: tierAtLeast('T4') ? 22 : 10,
      minX: ox + R - 1.5, maxX: ox + R - 0.7,
      minZ: 2.25, maxZ: 2.95,
      y: 0.6, seed: 0x9e17, scale: 0.26, mound: 0.12
    });
    coal.userData.noMerge = true;
    g.add(coal);

    // THE SIGN, on the rock beside the mouth, read from the floor of the cut
    // before you duck in.
    const sign = this.buildSiteSign(site, { w: 2.6, h: 0.5 });
    sign.position.set(ox + R - 1.4, 2.6, MOUTH_Z + 0.1);
    sign.rotation.y = -0.22;
    g.add(sign);

    g.position.set(site.pos[0], site.pos[1], site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    this.registerBenchAnchor(site, g, bench, [ox, 0, -3.2]);
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

    const D = { minX: 20.5, maxX: 33.0, minZ: -11.0, maxZ: 11.0 };
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

    /* THE GANTRY. The portal you walk under to get onto the deck, carrying a
       header plate over each bench. The sign is the site's own label, so the
       gantry names what is under it and cannot drift from what is there. */
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

    /* THE HEADER PLATES. One per bench, hung on the gantry over the site it
       names, facing the way in. */
    for (const site of this.data.sites) {
      if (site.id !== 'site-3' && site.id !== 'site-4') continue;
      const board = this.buildSiteSign(site, { w: 4.2, h: 0.66 });
      board.position.set(GX - 0.28, y + 6.35, site.pos[2]);
      board.rotation.y = -Math.PI / 2;
      g.add(board);
    }

    /* THE HANDRAIL along the open west edge of the deck, split for the way on.
       A deck with a drop off its edge and no rail is a deck nobody built. */
    const railZ = [[D.minZ, -6.0], [-2.0, 3.0], [7.0, D.maxZ]];
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

  /**
   * Site 3 — the Batch House. `q3-recipe`.
   *
   * A steel-framed shed on the east deck, open to the way in, fed from two
   * silos overhead. Every batch that comes out of the quarry is sampled here,
   * which is what the bench inside is doing.
   */
  initBatchHouse() {
    const site = this.data.sites.find(s => s.id === 'site-3');
    if (!site) return;
    const g = new THREE.Group();
    g.name = 'site-3';
    const rand = mulberry32(0x3c03);

    const W = 7.4, D = 5.8, H = 4.0;

    /* THE PORTAL FRAME. Four stanchions and two rafters to a ridge, which is
       how a shed this size is actually built, and what makes the roof read as
       carried rather than floating. */
    for (const [px, pz] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) {
      const stanchion = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.24, H, 0.24)), this.darkSteelMat
      );
      stanchion.position.set(px, H / 2, pz);
      stanchion.castShadow = tierAtLeast('T4');
      g.add(stanchion);
      const base = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.5, 0.1, 0.5)), this.plateMat
      );
      base.position.set(px, 0.05, pz);
      g.add(base);
    }
    const ridgeH = H + 1.1;
    const ridge = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.22, 0.3, D + 0.6)), this.darkSteelMat
    );
    ridge.position.set(0, ridgeH, 0);
    g.add(ridge);
    const slope = Math.atan2(1.1, W / 2);
    for (const side of [-1, 1]) {
      const rafterLen = Math.hypot(W / 2, 1.1);
      for (const rz of [-D / 2, D / 2]) {
        const rafter = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(rafterLen, 0.18, 0.18)), this.darkSteelMat
        );
        rafter.position.set(side * W / 4, H + 0.55, rz);
        rafter.rotation.z = -side * slope;
        g.add(rafter);
      }
      // The sheeted roof plane and its ribs.
      const plane = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(rafterLen + 0.4, 0.07, D + 0.7)), this.plateMat
      );
      plane.position.set(side * W / 4, H + 0.68, 0);
      plane.rotation.z = -side * slope;
      plane.castShadow = plane.receiveShadow = tierAtLeast('T4');
      g.add(plane);
      const ribs = Math.round(rafterLen / 0.36);
      for (let i = 0; i < ribs; i++) {
        const along = (-0.5 + (i + 0.5) / ribs) * (rafterLen + 0.4);
        const rib = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.05, 0.05, D + 0.7)), this.darkSteelMat
        );
        rib.position.set(
          side * W / 4 + along * Math.cos(slope),
          H + 0.73 + along * Math.sin(slope) * -side,
          0
        );
        rib.rotation.z = -side * slope;
        g.add(rib);
      }
    }

    // Sheeting: back and both ends, open to the approach.
    const sheet = (w, h, x, yy, z, ry) => {
      const s = new THREE.Mesh(this.own(new THREE.BoxGeometry(w, h, 0.08)), this.plateMat);
      s.position.set(x, yy, z);
      s.rotation.y = ry;
      s.castShadow = s.receiveShadow = tierAtLeast('T4');
      g.add(s);
      const n = Math.round(w / 0.45);
      for (let i = 0; i < n; i++) {
        const off = -w / 2 + (i + 0.5) * (w / n);
        const rib = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.05, h, 0.05)), this.darkSteelMat
        );
        rib.position.set(x + Math.cos(ry) * off, yy, z - Math.sin(ry) * off);
        rib.rotation.y = ry;
        g.add(rib);
      }
    };
    sheet(W, H, 0, H / 2, -D / 2, 0);
    sheet(D, H, -W / 2, H / 2, 0, Math.PI / 2);
    sheet(D, H, W / 2, H / 2, 0, Math.PI / 2);
    // A header over the open front, so the opening is a doorway.
    sheet(W, 1.1, 0, H - 0.55, D / 2, 0);

    /* THE SILOS. Two hoppers on legs behind the house, with a chute apiece
       dropping through the roof onto the bench's feed. A sampling house with
       nothing feeding it is a shed. */
    for (const sx of [-2.0, 2.0]) {
      const silo = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(1.1, 1.1, 2.6, 16)), this.drumMat
      );
      silo.position.set(sx, H + 2.6, -D / 2 - 1.5);
      silo.castShadow = silo.receiveShadow = tierAtLeast('T4');
      g.add(silo);
      const cone = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(1.1, 0.26, 1.2, 16)), this.drumMat
      );
      cone.position.set(sx, H + 0.7, -D / 2 - 1.5);
      g.add(cone);
      const ring = boltRing(1.12, 14, this.darkSteelMat, { size: 0.026, axis: 'y' });
      ring.position.set(sx, H + 1.32, -D / 2 - 1.5);
      g.add(ring);
      for (const [lx, lz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
        const leg = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.14, H + 0.2, 0.14)), this.darkSteelMat
        );
        leg.position.set(sx + lx, (H + 0.2) / 2, -D / 2 - 1.5 + lz);
        leg.castShadow = tierAtLeast('T4');
        g.add(leg);
      }
      // The chute from the cone, in through the back wall to the bench.
      const chute = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.2, 0.2, 2.6, 10)), this.pipeMat
      );
      chute.rotation.x = -0.72;
      chute.position.set(sx, H - 0.5, -D / 2 - 0.6);
      g.add(chute);
      const gate = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.42, 0.42, 0.06)), this.darkSteelMat
      );
      gate.position.set(sx, H - 1.35, -D / 2 + 0.22);
      g.add(gate);
    }

    /* THE BENCH, across the back of the house, facing the open front. */
    const bench = this.buildBench({ kind: 'scope', plate: 'LB-03' });
    bench.group.position.set(0, 0, -1.3);
    g.add(bench.group);

    // Two luminaires on the rafters, over the plate.
    for (const lz of [-1.6, 1.4]) {
      const lum = this.buildLuminaire(0, H - 0.25, lz);
      g.add(lum);
    }

    // Sample trays stacked against one end, and a tally board on the other.
    for (let i = 0; i < 6; i++) {
      const tray = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.6, 0.08, 0.44)), this.darkSteelMat
      );
      tray.position.set(-W / 2 + 0.6, 0.06 + i * 0.1, 1.9);
      tray.rotation.y = (rand() - 0.5) * 0.08;
      g.add(tray);
    }
    const board = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.6, 1.1, 0.06)), this.plateMat
    );
    board.position.set(W / 2 - 0.16, 1.9, 0.8);
    board.rotation.y = -Math.PI / 2;
    g.add(board);
    for (let i = 0; i < 6; i++) {
      const line = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(1.3, 0.02, 0.01)), this.darkSteelMat
      );
      line.position.set(W / 2 - 0.2, 2.35 - i * 0.16, 0.8);
      line.rotation.y = -Math.PI / 2;
      g.add(line);
    }

    const baseY = this.deckY;
    g.position.set(site.pos[0], baseY, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    this.registerBenchAnchor(site, g, bench, [0, 0, -1.3]);
  }

  /**
   * Site 4 — the Weighbridge. `q4-weigh`.
   *
   * A weigh deck let into the east deck on four load cells, with a scale house
   * beside it carrying the dial everything is read off. What is weighed here is
   * what came up the conveyors, which is why it is on this side of the yard.
   */
  initWeighbridge() {
    const site = this.data.sites.find(s => s.id === 'site-4');
    if (!site) return;
    const g = new THREE.Group();
    g.name = 'site-4';

    /* THE WEIGH DECK. A plate on four cells, standing a hand's breadth proud of
       the deck it is let into, with a gap all round it — a weighbridge that
       touched its surround would weigh the surround. */
    const bridge = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(6.4, 0.24, 3.4)), this.treadMat
    );
    bridge.position.set(0, 0.16, 1.9);
    bridge.receiveShadow = tierAtLeast('T4');
    g.add(bridge);
    for (const [cx, cz] of [[-2.7, 0.6], [2.7, 0.6], [-2.7, 3.2], [2.7, 3.2]]) {
      const cell = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.2, 0.24, 0.16, 12)), this.pipeMat
      );
      cell.position.set(cx, 0.06, cz);
      g.add(cell);
      const cable = cableRun(
        [cx, 0.06, cz], [-3.3, 0.1, 0.2], this.darkSteelMat,
        { sag: 0.06, radius: 0.012, segments: 8 }
      );
      g.add(cable);
      this.own(cable.userData.ownGeometry);
    }
    // Kerb rails along the drive-on edges, and hazard striping at the ends.
    for (const rz of [0.14, 3.66]) {
      const kerbRail = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(6.4, 0.18, 0.1)), this.darkSteelMat
      );
      kerbRail.position.set(0, 0.34, rz);
      g.add(kerbRail);
    }
    for (const sx of [-3.3, 3.3]) {
      const stripe = hazardStripe(0.42, 3.4, { pitch: 0.18 });
      stripe.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      stripe.position.set(sx, 0.29, 1.9);
      g.add(stripe);
      this.own(stripe.geometry, stripe.material, stripe.material.map);
    }

    /* THE SCALE HOUSE. A small riveted cabin with the dial on its face, big
       enough to read from the weigh deck, which is the whole point of it. */
    const cabin = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.3, 2.5, 2.0)), this.drumMat
    );
    cabin.position.set(0, 1.25, -2.4);
    cabin.castShadow = cabin.receiveShadow = tierAtLeast('T4');
    g.add(cabin);
    const capRoof = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.7, 0.12, 2.4)), this.plateMat
    );
    capRoof.position.set(0, 2.56, -2.4);
    capRoof.castShadow = tierAtLeast('T4');
    g.add(capRoof);
    for (const [px, pz] of [[-1.12, -3.36], [1.12, -3.36], [-1.12, -1.44], [1.12, -1.44]]) {
      const angle = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.12, 2.5, 0.12)), this.darkSteelMat
      );
      angle.position.set(px, 1.25, pz);
      g.add(angle);
    }


    // THE DIAL. A big round scale on the cabin face, graduated, with a needle
    // resting on its bottom stop. It reads nothing because nothing is on the
    // bridge, which is what an honest instrument does (PRODUCT.md §8).
    const DIAL_Y = 1.55;
    const DIAL_Z = -1.39;
    const face = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(0.62, 36)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0xb8ad96, roughness: 0.78, metalness: 0.0
      }))
    );
    face.position.set(0, DIAL_Y, DIAL_Z);
    g.add(face);
    const bezel = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.64, 0.05, 8, 36)), this.darkSteelMat
    );
    bezel.position.set(0, DIAL_Y, DIAL_Z + 0.01);
    g.add(bezel);
    const tickGeo = this.own(new THREE.BoxGeometry(0.014, 0.08, 0.006));
    const tickMat = this.own(new THREE.MeshStandardMaterial({ color: 0x2a251f, roughness: 0.8 }));
    for (let i = 0; i < 21; i++) {
      const a = -Math.PI * 0.78 + (i / 20) * Math.PI * 1.56;
      const major = i % 5 === 0;
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.scale.y = major ? 1.4 : 0.8;
      tick.position.set(
        Math.sin(a) * (major ? 0.5 : 0.53), DIAL_Y + Math.cos(a) * (major ? 0.5 : 0.53),
        DIAL_Z + 0.006
      );
      tick.rotation.z = -a;
      g.add(tick);
    }
    const needle = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.02, 0.5, 0.01)), tickMat
    );
    needle.position.set(-0.17, DIAL_Y - 0.15, DIAL_Z + 0.02);
    needle.rotation.z = 0.78;
    g.add(needle);
    const hub = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12)), this.darkSteelMat
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, DIAL_Y, DIAL_Z + 0.025);
    g.add(hub);

    // A window in the cabin's side and the door at its back.
    const pane = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.05, 0.6, 0.9)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x14120f, roughness: 0.3, metalness: 0.15 }))
    );
    pane.position.set(1.17, 1.7, -2.4);
    g.add(pane);
    const door = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.8, 1.9, 0.06)), this.plateMat
    );
    door.position.set(-0.5, 0.98, -3.43);
    g.add(door);

    /* THE BENCH, beside the scale house, facing the way in. The weigh deck is
       in front of it, so the player stands on the bridge to work the bench —
       which is the relationship an assay bench has to a weighbridge. */
    const bench = this.buildBench({ kind: 'assay', plate: 'LB-04' });
    bench.group.position.set(0, 0, -0.5);
    g.add(bench.group);

    // Test weights racked against the cabin: cast blocks with lifting eyes.
    for (let i = 0; i < 4; i++) {
      const wt = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.36, 0.28, 0.24)), this.pipeMat
      );
      wt.position.set(-1.9, 0.14 + i * 0.29, -2.9);
      g.add(wt);
      const eye = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(0.05, 0.014, 5, 10)), this.darkSteelMat
      );
      eye.position.set(-1.9, 0.33 + i * 0.29, -2.9);
      g.add(eye);
    }

    const lum = this.buildLuminaire(0, 2.4, -1.2);
    g.add(lum);

    g.position.set(site.pos[0], this.deckY, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    this.registerBenchAnchor(site, g, bench, [0, 0, -0.5]);
  }


  /**
   * A caged sodium luminaire: a lamp, so it is lit. The diffuser glows, and
   * the light under it is a SOURCE in the world's lamp pool rather than a
   * PointLight of its own — a forward renderer shades every light on every
   * pixel of the quarry, lit or not, and there are nine of these. Returned as
   * a group with `noMerge`, because the diffuser breathes and a baked lamp
   * could not.
   */
  buildLuminaire(x, y, z) {
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
    mark.userData.lamp = { color: 0xffc98a, intensity: 6.5, distance: 11, decay: 1.4 };
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
      if (x > r.minX - 3 && x < r.maxX + 3 && z > r.minZ - 3 && z < r.maxZ + 3) return false;
      if (x > s.minX - 3 && x < s.maxX + 3 && z > s.minZ - 3 && z < s.maxZ + 3) return false;
      if (L.some(l => Math.hypot(x - l.pos[0], z - l.pos[2]) < l.radius + pad)) return false;
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
    // The tube's flue pokes out through the roof of the cut, over the hearth.
    const forge = hearth ? { x: hearth.x, y: hearth.y + 3.6, z: hearth.z } : null;
    this.effects = createLigarEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      vents: [...(this.vents || []), ...(this.vista?.vents || [])],
      hearth, forge,
      pit: r
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

    // Site 1: the two portal piers.
    const s1 = this.data.sites.find(x => x.id === 'site-1');
    if (s1) {
      for (const px of [-3.5, 3.5]) {
        const [wx, wz] = this.siteToWorld(s1, px, 0);
        this.colliders.push({ x: wx, z: wz, radius: 1.05 });
      }
    }

    // Site 2: the tube walls and back, the hearth, the trough.
    if (this.tube) {
      const t = this.tube;
      push(t.minX - 0.3, t.minX + 0.3, t.minZ, t.maxZ);
      push(t.maxX - 0.3, t.maxX + 0.3, t.minZ, t.maxZ);
      const s2 = this.data.sites.find(x => x.id === 'site-2');
      if (s2) {
        const HX = (t.minX + t.maxX) / 2 - s2.pos[0] - (t.maxX - t.minX) / 2 + 1.4;
        const [hx, hz] = this.siteToWorld(s2, HX, 0.6);
        push(hx - 1.0, hx + 1.0, hz - 0.7, hz + 0.7);
        const [tx, tz] = this.siteToWorld(s2, 1.0, 2.6);
        push(tx - 0.72, tx + 0.72, tz - 0.36, tz + 0.36);
      }
    }

    // Sites 3 and 4: the batch house's three sheeted walls, and the scale house.
    const s3 = this.data.sites.find(x => x.id === 'site-3');
    if (s3) {
      for (const [lx, lz, hw, hd] of [[0, -2.9, 3.8, 0.12], [-3.7, 0, 0.12, 2.95], [3.7, 0, 0.12, 2.95]]) {
        const [wx, wz] = this.siteToWorld(s3, lx, lz);
        const rot = Math.abs(Math.sin(this.siteFacing(s3))) > 0.5;
        const ex = rot ? hd : hw;
        const ez = rot ? hw : hd;
        push(wx - ex, wx + ex, wz - ez, wz + ez);
      }
    }
    const s4 = this.data.sites.find(x => x.id === 'site-4');
    if (s4) {
      const [wx, wz] = this.siteToWorld(s4, 0, -2.4);
      push(wx - 1.2, wx + 1.2, wz - 1.2, wz + 1.2);
    }

    // The deck gantry's three columns.
    if (this.deck) {
      const GX = this.deck.minX + 0.4;
      for (const gz of [this.deck.minZ + 1.0, 0, this.deck.maxZ - 1.0]) {
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

  /** A site-local (x, z) in world terms, through the site's facing. */
  siteToWorld(site, lx, lz) {
    const a = this.siteFacing(site);
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [site.pos[0] + lx * c + lz * s, site.pos[2] - lx * s + lz * c];
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
      if (deployed && !anchor.open) this.benchesOpen++;
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
    this.lamps = [];
    this.lampMarks = [];
  }
}
