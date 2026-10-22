/**
 * tallow.js — Tallow: the abandoned salt-flat refinery. (Learn world 01)
 *
 * The companion to `world.js`. Erebus is an amber basin at low sun; Tallow is a
 * high salt pan under a thin veil of cloud, the sun white and softened with a
 * halo round it, a pale world hanging low in the north-east, and a plant that
 * was abandoned with the vessels still standing. Same SCOURED PLATE world
 * (CLAUDE.md §Aesthetic), a different light and a different crust.
 *
 * This file is the orchestrator and the public face the rest of the app knows:
 * `scene`, `data`, `colliders`, `terrainMesh`, `hasFarTerrain`,
 * `getTerrainHeight`, `benchAnchor`, `setBenchDeployed`, `setSiteComplete` and
 * `update`. What the world is MADE of lives beside it in `tallow/`:
 *
 *   atmosphere.js the sky (veil, halo, the ranges on the horizon drawn IN the
 *                 sky so they never slide), aerial perspective for every
 *                 material, the lights, the environment map, the pale world
 *   terrain.js    the height field and the one ground mesh to the horizon, cut
 *                 round the excavation; the crust, ruts, paths, damp, mirror
 *                 flats and mirage are drawn by its shader
 *   surfaces.js   the salt-polygon crust, piled salt, the islands' strata, and
 *                 the salt that creeps up everything standing on the flat
 *   plant.js      the refinery: evaporators, columns, pipe racks, conveyor, loadout scale, mast
 *   stations.js   the six hosts: the machine each bench is built into
 *   hauler.js     the derelict ore hauler
 *   vista.js      what stands beyond the walk: rock islands, the far plant
 *   effects.js    the air moving: motes, grit streams, salt devils, plumes
 *   kit.js        structural stock: I-sections and corrugated sheet
 *
 * WHAT IS HERE, AND WHY IT IS HERE
 * The refinery is one process line, walked from the landing pad inward: brine pans,
 * the evaporator row, cracking towers, pipe bridges, the conveyor, the weigh hopper
 * and the bagging line, and the loadout scale beside the hauler. Six Unit 1 benches
 * are built INTO that line, one per written quest, each at the step of the process
 * its quest is about (`tallow/stations.js`; laid out by `tools/gen-tallow-layout.mjs`):
 *   site-1  Bench 1 — q1-grain. The raw-salt sample point at the conveyor's tail.
 *   site-2  Bench 2 — q2-core. The instrument room under the evaporator row, down
 *           the stair that rises between the two vessels over it.
 *   site-3  Bench 3 — q3-catalogue. The process control house south of the row; its
 *           veranda holds the desk, its record wall the card index.
 *   site-4  Bench 4 — q4-ledger. A cracking tower's sampling deck: the column stands
 *           behind the bench, a draw-off line comes down to a sample-cooler skid.
 *   site-5  Bench 5 — q5-assay. The weigh hopper hung under the conveyor head's
 *           discharge, catch bins and a floor balance under its chute.
 *   site-6  Bench 6 — q6-weigh. The sack-filling scale on the bagging line, fed from
 *           the hopper's bins by a belt and a bucket elevator.
 * All six carry their instruments as built objects (`BUILT_BENCHES`). A bench is part of
 * its host (one object), and the host keeps the bay (`bench-bay.js`) empty.
 *
 * PHYSICS: every prop declares a footprint in `tallow.json` and every footprint is
 * disjoint — no two objects occupy the same space, which `verify:tallow` proves
 * on the world actually built. The sub-level is a real excavation: the ground
 * mesh is cut along the pit's own outline, the pit is built as geometry, and
 * `getTerrainHeight` resolves the ramp, so the player walks down instead of
 * being teleported under the ground.
 *
 * LIGHT: nothing here blooms. The only emissive surfaces in the whole scene are
 * sodium luminaires, the mast's obstruction lamp and one indicator per built site. That is the rule in CLAUDE.md §4.2.
 */

import * as THREE from 'three';
import tallowData from './world-data/tallow.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import { buildBayBench } from './bench-bay.js';
import { registerFieldPoint } from './field-points.js';
import {
  platedMetal, treadPlate, sedimentaryRock,
  buildMaterial, enableAO,
  texSize, heightField, heightToNormal, asDataTexture, fbm,
  boltLine, weldBead, cableRun, pipeFlange, placard,
  hazardStripe, mergeStatic
} from './materials/pbr-kit.js';
import { createSalvageCrateTexture } from './materials/tallow-textures.js';
import { roundedSlab, boxUVs } from '../learn/engine/table-props.js';
import {
  createTallowSkyDome, createTallowCelestials, createTallowLights, followTallowShadow,
  createTallowEnvironment, applyTallowAir, tallowSkyUniforms, TSKY
} from './tallow/atmosphere.js';
import { makeTallowField, buildTallowTerrainGeometry, createTallowTerrainMaterial } from './tallow/terrain.js';
import {
  saltCrust, saltGrain, createTallowStrataTexture, createGroundHeightTexture, applySaltWeather
} from './tallow/surfaces.js';
import { createTallowEffects } from './tallow/effects.js';
import {
  buildEvaporator, buildCrackingTower, buildPipeBridge, buildConveyor, buildLoadoutScale,
  buildCommsMast, buildDebrisField, buildStakeMarker, mulberry32, SUPPORT_POINTS
} from './tallow/plant.js';
import { HOST_BUILDERS, HOPPER } from './tallow/stations.js';
import { buildHauler } from './tallow/hauler.js';
import { buildTallowVista } from './tallow/vista.js';
import { iBeamGeometry } from './tallow/kit.js';
import { LampPool } from './lamp-pool.js';
import { paceShadow, holdShadowUntilAsked } from './shadow-pace.js';

/** How far (m) the player walks before the sun's shadow box follows them. */
const SHADOW_FOLLOW_STEP = 2;

/** Sodium filament, from inside a thing. The one warm colour on the flat. */
const SODIUM = 0xd99423;

export class TallowWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = tallowData;
    this.scene = new THREE.Scene();
    this.scene.name = 'tallow';

    this.colliders = [];
    this.siteMarkers = new Map();   // questId -> { indicator, group, site }
    // questId -> the physical frame of that site's working surface, so the
    // Learn instrument can be deployed onto the plate that is actually there
    // rather than onto a second bench conjured at the same coordinates.
    this.benchAnchors = new Map();
    this.disposables = [];
    this.lamps = [];
    this.elapsed = 0;
    // The pan runs to the horizon on its own; the voyage must not lay a ring over it.
    this.hasFarTerrain = true;
    this.t4 = tierAtLeast('T4');

    this.sub = this.data.sublevel;
    this.field = makeTallowField();

    this.initMetals();
    this.initLighting();
    this.initSky();
    this.initTerrain();
    this.initSublevel();
    this.initRefinery();
    this.initCrates();
    this.initSaltHeaps();
    this.initPanRims();
    this.initHauler();
    this.initLandingPad();
    this.initHosts();
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
   * `aoMap` samples the SECOND uv set, which a primitive geometry does not have
   * — so a generated AO map is a silent no-op until the mesh is told to reuse
   * its own UVs for it. Rather than remember that at every one of the hundred
   * call sites below, it is done once, here, for anything whose material
   * actually carries one.
   */
  enableAmbientOcclusion() {
    const done = new Set();
    this.scene.traverse(o => {
      if (!o.geometry || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some(m => m && m.aoMap)) return;
      if (done.has(o.geometry)) return;
      if (o.geometry.attributes.uv1) { done.add(o.geometry); return; }
      done.add(o.geometry);
      enableAO(o.geometry);
    });
  }

  /**
   * THE WEATHER, APPLIED ONCE TO EVERYTHING THAT WAS BUILT.
   *
   * Every standard material in the world gets two patches: salt, which crusts
   * the foot of whatever stands on the flat, settles on what faces up and
   * leaves the dried tide lines of brine that once stood round it; and the
   * air, which fades every surface into the sky behind it with distance. The
   * ground and the sky finish themselves. A Learn instrument deployed later is
   * NOT weathered — it is the one thing on the flat somebody is using.
   */
  weatherTheWorld() {
    this.groundTex = this.own(createGroundHeightTexture((x, z) => this.getTerrainHeight(x, z)));
    const seen = new Set();
    this.scene.traverse(o => {
      if (!o.isMesh && !o.isInstancedMesh && !o.isPoints) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        if (o.isMesh && !o.userData.noSalt && m !== this.terrainMesh?.material) {
          const lamp = m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0;
          if (!lamp) applySaltWeather(m, { ground: this.groundTex, ...(m.userData.salt || {}) });
        }
        applyTallowAir(m);
      }
    });
  }

  /** Track a texture/geometry/material so dispose() can actually free it. */
  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /**
   * FOUR METALS, ONE GENERATOR, FOUR AMOUNTS OF WEATHER.
   *
   * Every plate here comes out of `platedMetal`, which builds a plate the way
   * the real object acquired it: rolled steel, a pressed panel grid, rivet
   * lines, paint, paint worn off the high edges, and rust blooming out of the
   * bare metal and streaking downward. They differ almost entirely in the
   * `weather` number. Built first, because the lab below ground uses them too.
   *
   * RESOLUTION IS SPENT WHERE THE PLAYER'S FACE GOES: `pale` is the bench top
   * and the host's sheet, read from half a metre, so it is drawn at full size; the
   * drums, columns and pipe runs are read from ten metres and across repeats.
   */
  initMetals() {
    const pale = platedMetal({
      paint: '#9a9081', metal: '#6d6559', rust: '#7c4826',
      panels: 2, seed: 31, weather: 0.78, size: texSize(512)
    });
    const drum = platedMetal({
      paint: '#8e8371', metal: '#6a6153', rust: '#84492a',
      panels: 1, seed: 47, weather: 0.92, grain: 1.1, size: texSize(512)
    });
    const dark = platedMetal({
      paint: '#4e463c', metal: '#5c554b', rust: '#6d3f22',
      panels: 4, seed: 59, weather: 0.62, size: texSize(256)
    });
    const pipe = platedMetal({
      paint: '#7f7565', metal: '#776e61', rust: '#8a5029',
      panels: 1, seed: 71, weather: 0.85, rivets: false, size: texSize(256)
    });
    this.drumMat = this.own(buildMaterial(drum, { repeat: [3, 1.6], roughness: 1.0 }));
    this.plateMat = this.own(buildMaterial(pale, { repeat: 2, roughness: 1.0 }));
    this.pipeMat = this.own(buildMaterial(pipe, { repeat: [4, 1], roughness: 1.0 }));
    this.darkSteelMat = this.own(buildMaterial(dark, { repeat: 3, roughness: 1.0 }));
    for (const m of [this.drumMat, this.plateMat, this.pipeMat, this.darkSteelMat]) {
      m.normalScale.set(1.25, 1.25);
      m.aoMapIntensity = 0.85;
    }
  }

  /** What the plant builders are handed: the metals, disposal, and the tier. */
  get plantCtx() {
    return {
      M: {
        drum: this.drumMat, plate: this.plateMat, pipe: this.pipeMat,
        dark: this.darkSteelMat, bulk: this.bulkMat
      },
      own: (...o) => this.own(...o),
      t4: this.t4,
      heightAt: (x, z) => this.surfaceHeight(x, z),
      sky: TSKY
    };
  }

  /* ======================================================================
     LIGHT AND SKY
     A high sun through a thin veil, and a white crust throwing most of it
     back up. See tallow/atmosphere.js.
     ====================================================================== */

  initLighting() {
    const { sun, hemi } = createTallowLights({ shadows: this.t4 });
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
    this.scene.background = TSKY.haze.clone();

    const env = createTallowEnvironment(this.renderer);
    if (env) {
      this.envTarget = env;
      this.scene.environment = env.texture;
      this.scene.environmentIntensity = 0.5;
    }
  }

  initSky() {
    this.sky = createTallowSkyDome(900);
    this.scene.add(this.sky);
    this.celestials = createTallowCelestials();
    this.scene.add(this.celestials);
  }

  /* ======================================================================
     TERRAIN
     The pan, from the boots to the horizon, with the excavation cut out of
     it along the pit's own walls. See tallow/terrain.js.
     ====================================================================== */

  /** The open flat, before the excavation is considered. */
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
   * The walking surface. Resolves the flat, the descending stair ramp and the
   * lab deck, so the sub-level is entered on foot and never by teleport.
   */
  getTerrainHeight(x, z) {
    if (this.inRoom(x, z)) return this.sub.floorY;
    if (this.inStair(x, z)) {
      const s = this.sub.stair;
      // maxZ is the head at ground level; minZ is the foot at the deck. The head
      // takes the crust's own height at the mouth, so there is no step down onto
      // the ramp where the excavation begins.
      const headY = this.surfaceHeight(x, s.maxZ);
      const t = (s.maxZ - z) / (s.maxZ - s.minZ);
      return THREE.MathUtils.lerp(headY, this.sub.floorY, THREE.MathUtils.clamp(t, 0, 1));
    }
    return this.surfaceHeight(x, z);
  }

  initTerrain() {
    const aniso = this.renderer?.capabilities?.getMaxAnisotropy?.() || 8;
    const crust = buildMaterial(saltCrust({ size: texSize(512), seed: 4 }), { repeat: 1 });
    for (const t of [crust.map, crust.normalMap, crust.roughnessMap, crust.aoMap]) {
      if (!t) continue;
      t.anisotropy = aniso;
      this.own(t);
    }
    this.own(crust);
    this.crustMap = crust.map;

    // Grit: the crystal at the player's feet, far below the crust's repeat.
    const gritHeight = heightField(texSize(256), (u, v) =>
      0.5 + (fbm(u * 34, v * 34, { octaves: 4, period: 34, seed: 0x9f1 }) - 0.5) * 0.9
    );
    const grit = this.own(asDataTexture(heightToNormal(gritHeight, 1.6), 1));
    grit.anisotropy = aniso;
    const macro = this.own(asDataTexture(heightField(texSize(256), (u, v) =>
      fbm(u * 4, v * 4, { octaves: 5, period: 4, seed: 0x2ee })
    ), 1));
    this.macroMap = macro;
    this.strataMap = this.own(createTallowStrataTexture());

    const s = this.sub;
    const geo = this.own(buildTallowTerrainGeometry(this.field, {
      step: this.t4 ? 1.25 : 2.0,
      growth: this.t4 ? 1.07 : 1.11,
      holes: [s.room, s.stair],
      tile: 6
    }));
    const mat = this.own(createTallowTerrainMaterial({
      crust, grit, macro, strata: this.strataMap, tracks: this.data.tracks
    }));
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.name = 'tallow-ground';
    // The ground everything else stands on and is bedded into.
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.userData.noSalt = true;
    this.terrainMesh.receiveShadow = this.t4;
    this.scene.add(this.terrainMesh);
  }

  /* ======================================================================
     THE SUB-LEVEL
     An open cut down to the old diagnostic deck, roofed over at the far end.
     ====================================================================== */

  initSublevel() {
    const r = this.sub.room;
    const s = this.sub.stair;
    const fy = this.sub.floorY;

    // The lab deck is walked on, so it is treadplate — raised durbar pattern,
    // ground flat down the line people actually take. That worn stripe is the
    // single most convincing thing about an industrial floor.
    this.deckMat = this.own(buildMaterial(
      // Repeated nine times across the deck, so 256 carries more detail per
      // metre than 512 repeated twice would. Resolution is only ever worth what
      // the repeat does not already give you.
      treadPlate({ base: '#6a6254', seed: 13, weather: 0.85, size: texSize(256) }),
      { repeat: 9, roughness: 1.0 }
    ));
    this.deckMat.normalScale.set(1.5, 1.5);

    // Bulkheads below ground kept the colour the sun took off everything above.
    // This is the one place on Tallow that still looks like the crucible plate.
    this.bulkMat = this.own(buildMaterial(
      platedMetal({
        paint: '#5a4f42', metal: '#6a6055', rust: '#7d4726',
        panels: 3, seed: 97, weather: 0.55, size: texSize(256)
      }),
      { repeat: 4, roughness: 1.0 }
    ));
    this.bulkMat.normalScale.set(1.35, 1.35);

    // The raw cut face: hardpan in section, the strata the excavator went
    // through, faulted so the bedding is not wallpaper.
    this.cutMat = this.own(buildMaterial(
      sedimentaryRock({ warm: '#9b8b73', cool: '#6e6453', seed: 23, size: texSize(256) }),
      { repeat: [3, 1], roughness: 1.0, metalness: 0.0 }
    ));
    this.cutMat.normalScale.set(1.6, 1.6);

    const g = new THREE.Group();

    // --- Lab deck ---
    const floor = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(r.maxX - r.minX, 0.35, r.maxZ - r.minZ)),
      this.deckMat
    );
    floor.position.set((r.minX + r.maxX) / 2, fy - 0.175, (r.minZ + r.maxZ) / 2);
    floor.receiveShadow = tierAtLeast('T4');
    g.add(floor);

    // --- Lab walls, plated on the inside, raw cut above the plating ---
    const wallH = Math.abs(fy) + 0.6;
    // The end wall runs the full width; the side walls stop against its face
    // rather than through it, so no two members share the same space.
    const sideD = (r.maxZ - r.minZ) - 0.15;
    const sideZ = (r.minZ + r.maxZ) / 2 + 0.075;
    const wallSpecs = [
      { w: r.maxX - r.minX, d: 0.3, x: (r.minX + r.maxX) / 2, z: r.minZ },
      { w: 0.3, d: sideD, x: r.minX, z: sideZ },
      { w: 0.3, d: sideD, x: r.maxX, z: sideZ }
    ];
    for (const spec of wallSpecs) {
      const m = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(spec.w, wallH, spec.d)), this.bulkMat
      );
      m.position.set(spec.x, fy + wallH / 2, spec.z);
      m.castShadow = m.receiveShadow = tierAtLeast('T4');
      g.add(m);
    }
    // South wall, split around the stair opening so the way in stays clear.
    for (const [x0, x1] of [[r.minX, s.minX], [s.maxX, r.maxX]]) {
      const w = x1 - x0;
      if (w <= 0.05) continue;
      const m = new THREE.Mesh(this.own(new THREE.BoxGeometry(w, wallH, 0.3)), this.bulkMat);
      m.position.set((x0 + x1) / 2, fy + wallH / 2, r.maxZ);
      m.castShadow = m.receiveShadow = tierAtLeast('T4');
      g.add(m);
    }

    // --- Roof slab over the lab, leaving the stair cut open to the sky ---
    this.roofThick = 0.55;
    const roof = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(r.maxX - r.minX + 1.2, this.roofThick, r.maxZ - r.minZ + 0.6)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x554d42, roughness: 0.95, metalness: 0.3 }))
    );
    roof.position.set((r.minX + r.maxX) / 2, this.sub.ceilingY + this.roofThick / 2, (r.minZ + r.maxZ) / 2 - 0.3);
    roof.castShadow = roof.receiveShadow = tierAtLeast('T4');
    g.add(roof);

    // Roof beams, so the ceiling has structure when you look up from the bench. None crosses the air over
    // the bench's front (the camera leans in there, `bench-bay.js` `lean`), so the one that would is left
    // out: the slab above is the roof, and the span between its neighbours is the bench's own bay.
    const labBench = this.data.sites.find(x => x.id === 'site-2');
    for (let i = 0; i < 5; i++) {
      const bz = r.minZ + 1.6 + i * ((r.maxZ - r.minZ - 3.2) / 4);
      if (labBench && bz > labBench.pos[2] - 0.6 && bz < labBench.pos[2] + 3.4) continue;
      const beam = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(r.maxX - r.minX, 0.32, 0.26)),
        this.bulkMat
      );
      beam.position.set((r.minX + r.maxX) / 2, this.sub.ceilingY - 0.17, bz);
      g.add(beam);
    }

    // --- The stair cut: raw walls, plated ramp, treads ---
    // The terrain has a hole cut through it here, so the ramp the player walks
    // down (getTerrainHeight lerps it) has to actually be built, or they would
    // be walking on open sky.
    const headY = this.surfaceHeight((s.minX + s.maxX) / 2, s.maxZ);
    const run = s.maxZ - s.minZ;
    const drop = headY - fy;
    const rampLen = Math.hypot(run, drop);
    const ramp = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(s.maxX - s.minX, 0.3, rampLen)),
      this.deckMat
    );
    ramp.position.set((s.minX + s.maxX) / 2, (headY + fy) / 2 - 0.15, (s.minZ + s.maxZ) / 2);
    ramp.rotation.x = -Math.atan2(drop, run);
    ramp.receiveShadow = tierAtLeast('T4');
    g.add(ramp);

    const cutH = Math.abs(fy) + 0.4;
    for (const x of [s.minX, s.maxX]) {
      const m = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.3, cutH, s.maxZ - s.minZ)), this.cutMat
      );
      m.position.set(x, fy + cutH / 2, (s.minZ + s.maxZ) / 2);
      m.receiveShadow = tierAtLeast('T4');
      g.add(m);
    }

    // Treads bedded into the ramp. The ramp itself is what the player walks on
    // (getTerrainHeight lerps it); the treads are the thing that makes it read
    // as a stair rather than a slope.
    const treadMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x6b6152, roughness: 0.92, metalness: 0.35
    }));
    const steps = 14;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const z = THREE.MathUtils.lerp(s.maxZ, s.minZ, t);
      const y = THREE.MathUtils.lerp(headY, fy, t);
      const tread = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(s.maxX - s.minX - 0.5, 0.07, 0.34)), treadMat
      );
      // Bedded just proud of the ramp face, and raked to match it.
      tread.position.set((s.minX + s.maxX) / 2, y + 0.036, z);
      tread.rotation.x = -Math.atan2(drop, run);
      tread.castShadow = tierAtLeast('T4');
      g.add(tread);
    }

    // Handrail down one side of the cut: stanchions plus a top rail.
    const railMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x7d7364, roughness: 0.78, metalness: 0.55
    }));
    for (let i = 0; i <= 5; i++) {
      const t = i / 5;
      const z = THREE.MathUtils.lerp(s.maxZ, s.minZ, t);
      const y = THREE.MathUtils.lerp(headY, fy, t);
      const post = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 8)), railMat
      );
      post.position.set(s.minX + 0.3, y + 0.52, z);
      post.castShadow = tierAtLeast('T4');
      g.add(post);
    }
    const rail = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.045, 0.045, rampLen, 8)), railMat
    );
    rail.position.set(s.minX + 0.3, (headY + fy) / 2 + 1.02, (s.minZ + s.maxZ) / 2);
    rail.rotation.x = Math.PI / 2 - Math.atan2(drop, run);
    g.add(rail);

    // The rim kerb around the open cut, so the edge is visible from the surface
    // before you are standing on it.
    const kerbMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x6e6555, roughness: 0.94, metalness: 0.2
    }));
    // Each kerb sits just clear of the wall face below it (walls are 0.3 thick,
    // so their outer face is 0.15 out); nothing is drawn inside anything else.
    const kerbs = [
      [(r.minX + r.maxX) / 2, r.minZ - 0.35, r.maxX - r.minX + 1.0, 0.4],
      [r.minX - 0.35, (r.minZ + r.maxZ) / 2, 0.4, r.maxZ - r.minZ],
      [r.maxX + 0.35, (r.minZ + r.maxZ) / 2, 0.4, r.maxZ - r.minZ]
    ];
    for (const [x, z, w, d] of kerbs) {
      const k = new THREE.Mesh(this.own(new THREE.BoxGeometry(w, 0.3, d)), kerbMat);
      k.position.set(x, this.surfaceHeight(x, z) + 0.15, z);
      k.castShadow = k.receiveShadow = tierAtLeast('T4');
      g.add(k);
    }

    // Sodium luminaires in the lab. These are lamps, so they are allowed to be
    // lit — and they are the reason the sub-level reads warm while the flat above
    // reads bleached.
    //
    // Fixtures are many and lights are few: each group of fixtures is lit by ONE
    // pooled light at its middle (a little stronger, a little further reaching),
    // which puts the brightest floor right over the bench at site 2. A point light
    // per fixture would be shaded on every pixel of the salt flat above as well.
    const bench = this.data.sites.find(x => x.id === 'site-2');
    const bx = bench ? bench.pos[0] : (r.minX + r.maxX) / 2;
    const lampGroups = [
      // over the bench: four fixtures, two lights
      ...[-4.5, 4.5].map(dx => ({ fixtures: [-44.2, -41.2].map(lz => [bx + dx, lz]), mark: [bx + dx, -42.7] })),
      // and one hung over the back of the plate itself, so the table the camera leans in over is lit from above it
      // (behind the plate and the screens, clear of the air the camera stands in)
      { fixtures: [[bx, -44.1]], mark: [bx, -44.1] },
      // under the vessels, and at the stair foot
      ...this.data.landmarks.filter(l => l.on === 'roof').map(l => ({ fixtures: [[l.pos[0], l.pos[2] - 3.0]], mark: [l.pos[0], l.pos[2] - 3.0] })),
      { fixtures: [[bx, s.minZ - 0.8]], mark: [bx, s.minZ - 0.8] }
    ];
    for (const grp of lampGroups) {
      for (const [lx, lz] of grp.fixtures) g.add(this.buildLuminaire(lx, this.sub.ceilingY - 0.42, lz, { light: null }));
      g.add(this.lampMark(grp.mark[0], this.sub.ceilingY - 0.62, grp.mark[1], { intensity: 6.5, distance: 16 }));
    }

    /* ================= THE VESSELS' STEEL =================
       The two evaporators over the room stand on its roof, and their load comes
       down through the room: a girder under each vessel on either side of its
       centre line, and four columns to the deck. ================== */
    this.labColliders = [];
    const girderY = this.sub.ceilingY - 0.33 - 0.14;
    for (const l of this.data.landmarks) {
      if (l.on !== 'roof') continue;
      for (const dz of [-2.2, 2.2]) {
        const gd = new THREE.Mesh(this.own(iBeamGeometry(6.4, { h: 0.28, w: 0.2 })), this.darkSteelMat);
        gd.geometry.rotateZ(Math.PI / 2);
        gd.position.set(l.pos[0], girderY, l.pos[2] + dz);
        g.add(gd);
        for (const dx of [-2.9, 2.9]) {
          const hCol = girderY - 0.14 - fy;
          const col = new THREE.Mesh(this.own(iBeamGeometry(hCol, { h: 0.3, w: 0.26 })), this.darkSteelMat);
          col.position.set(l.pos[0] + dx, fy + hCol / 2, l.pos[2] + dz);
          col.castShadow = tierAtLeast('T4');
          g.add(col);
          const foot = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.6, 0.05, 0.6)), this.darkSteelMat);
          foot.position.set(l.pos[0] + dx, fy + 0.025, l.pos[2] + dz);
          g.add(foot);
          this.labColliders.push({ x: l.pos[0] + dx, z: l.pos[2] + dz, radius: 0.34 });
        }
      }
    }

    /* ================= THE SERVICES =================
       A roofed industrial room is mostly the things that run across its
       ceiling. Bare walls and a floor is a box; pipe, conduit, cable tray and
       the brackets holding them up is a room that was built for a purpose and
       then left. This is where the sub-level stops looking like a corridor in
       a game and starts looking like the crucible plate it is drawn from.
       ================================================ */

    const runZ0 = r.minZ + 1.0;
    const runZ1 = r.maxZ - 1.0;
    const ceil = this.sub.ceilingY;

    // Two process pipes and a lagged one, running the length of the ceiling on
    // the east side, dropping to a valve station at the far end.
    for (const [px, rad, mat] of [
      [r.maxX - 1.5, 0.15, this.pipeMat],
      [r.maxX - 1.9, 0.11, this.pipeMat],
      [r.maxX - 2.35, 0.2, this.plateMat]
    ]) {
      const run = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(rad, rad, runZ1 - runZ0, 12)), mat
      );
      run.rotation.x = Math.PI / 2;
      run.position.set(px, ceil - 0.5, (runZ0 + runZ1) / 2);
      run.castShadow = tierAtLeast('T4');
      g.add(run);

      // Bolted joints every few metres, and a hanger at each one.
      for (let z = runZ0 + 2.2; z < runZ1 - 1; z += 3.6) {
        const fl = pipeFlange(rad, this.darkSteelMat, this.darkSteelMat);
        fl.rotation.x = Math.PI / 2;
        fl.position.set(px, ceil - 0.5, z);
        g.add(fl);

        const hanger = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.04, 0.42, 0.04)), this.darkSteelMat
        );
        hanger.position.set(px, ceil - 0.28, z + 0.3);
        g.add(hanger);
      }
    }

    // Cable tray on the west side: a perforated channel with a loom in it.
    const tray = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.42, 0.06, runZ1 - runZ0)), this.darkSteelMat
    );
    tray.position.set(r.minX + 1.7, ceil - 0.42, (runZ0 + runZ1) / 2);
    g.add(tray);
    for (const tx of [-0.2, 0.2]) {
      const cheek = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.04, 0.14, runZ1 - runZ0)), this.darkSteelMat
      );
      cheek.position.set(r.minX + 1.7 + tx, ceil - 0.38, (runZ0 + runZ1) / 2);
      g.add(cheek);
    }
    const loomMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x2a251f, roughness: 0.95, metalness: 0.2
    }));
    for (let i = 0; i < 3; i++) {
      const loom = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.035, 0.035, runZ1 - runZ0, 6)), loomMat
      );
      loom.rotation.x = Math.PI / 2;
      loom.position.set(r.minX + 1.58 + i * 0.12, ceil - 0.36, (runZ0 + runZ1) / 2);
      g.add(loom);
    }

    // Conduit dropping down the end wall to a distribution box, with the box's
    // door hanging open. Every abandoned plant has exactly one of these.
    const conduit = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 8)), this.darkSteelMat
    );
    conduit.position.set(r.minX + 1.7, ceil - 1.6, r.minZ + 0.35);
    g.add(conduit);
    const box = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.5, 0.7, 0.22)), this.bulkMat
    );
    box.position.set(r.minX + 1.7, fy + 1.5, r.minZ + 0.32);
    g.add(box);
    const door = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.48, 0.68, 0.03)), this.darkSteelMat
    );
    door.position.set(r.minX + 2.18, fy + 1.5, r.minZ + 0.55);
    door.rotation.y = -1.05;
    g.add(door);

    // A floor drain where the deck falls to it, and the stain around it.
    const drain = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 14)), this.darkSteelMat
    );
    drain.position.set(bx - 3.5, fy + 0.005, -39.5);
    g.add(drain);
    const stain = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(0.72, 20)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x3a342c, transparent: true, opacity: 0.45, roughness: 0.5,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
      }))
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(bx - 3.5, fy + 0.002, -39.5);
    g.add(stain);

    // Hazard striping across the stair head, where the floor stops being floor.
    const edge = hazardStripe(s.maxX - s.minX, 0.3);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(
      (s.minX + s.maxX) / 2,
      this.surfaceHeight((s.minX + s.maxX) / 2, s.maxZ) + 0.012,
      s.maxZ + 0.28
    );
    g.add(edge);
    this.own(edge.geometry, edge.material, edge.material.map);

    // Wall placards: the room's own designations, stencilled on plate.
    for (const [tx, tz, code] of [
      [r.minX + 0.18, -40.0, 'LAB-02'],
      [r.maxX - 0.18, -38.0, 'VENT-7']
    ]) {
      const tag = placard(code, { w: 0.62, h: 0.2 });
      tag.position.set(tx, fy + 1.85, tz);
      tag.rotation.y = tx < 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(tag);
      this.own(tag.geometry, tag.material, tag.material.map);
    }

    this.scene.add(g);
  }

  /** A caged sodium fixture: cast housing, warm diffuser, one small point light. */
  buildLuminaire(x, y, z, { light = { intensity: 5.2, distance: 13 } } = {}) {
    const g = new THREE.Group();
    // One set of materials for every luminaire, so the lab's four bake into
    // three meshes rather than twelve.
    this.lumMats = this.lumMats || {
      housing: this.own(new THREE.MeshStandardMaterial({ color: 0x3f3830, roughness: 0.9, metalness: 0.5 })),
      diffuser: this.own(new THREE.MeshStandardMaterial({
        color: 0xffe0ae, emissive: 0xffd9a0, emissiveIntensity: 1.5, roughness: 0.6
      })),
      cage: this.own(new THREE.MeshStandardMaterial({ color: 0x2e2923, roughness: 0.85, metalness: 0.6 }))
    };
    const housing = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.62, 0.16, 0.34)), this.lumMats.housing
    );
    g.add(housing);

    const diffuser = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.5, 0.04, 0.24)), this.lumMats.diffuser
    );
    diffuser.position.y = -0.09;
    g.add(diffuser);

    // The protective cage: five bars, because an unguarded lamp in a work space
    // would have been smashed decades ago.
    const cageMat = this.lumMats.cage;
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6)), cageMat
      );
      bar.rotation.z = Math.PI / 2;
      bar.position.set(-0.2 + i * 0.1, -0.12, 0);
      g.add(bar);
    }

    if (light) g.add(this.lampMark(0, -0.2, 0, light));

    g.position.set(x, y, z);
    return g;
  }

  /**
   * Where a sodium lamp's light comes from. Not a PointLight: an empty marker
   * that `initLampPool` reads once everything is placed, so the world's lamps
   * are lit through a pool of two real lights rather than one light each.
   */
  lampMark(x, y, z, { intensity = 5.2, distance = 13 } = {}) {
    const mark = new THREE.Object3D();
    mark.position.set(x, y, z);
    mark.userData.lamp = { color: 0xffd9a0, intensity, distance, decay: 1.6 };
    this.lamps.push(mark);
    return mark;
  }

  /**
   * BAKE WHAT NEVER MOVES. The refinery, the pad and the hauler were baked as
   * they were built; the five sites, the lab and the crate stacks were not, and
   * they were five hundred of the world's nine hundred draw calls (drawn twice,
   * once more for the sun's shadow). Each becomes one mesh per material.
   *
   * What must stay addressable already says so: the cased-up instrument is
   * `noMerge` (it hides when the bench deploys) and is baked on its own INSIDE
   * that group, so casing it up still hides one thing; the site indicator and
   * the windsock are `noMerge`. A mesh carrying a physics tag or `noSalt` is
   * left alone too, because the tag lives on the mesh and a bake would drop it.
   */
  bakeStatics() {
    const bake = (group) => {
      group.traverse(o => {
        if (o !== group && (o.userData.phys || o.userData.noSalt || o.userData.openShell)) {
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
    for (const node of [...this.scene.children]) {
      if (!node.isGroup || node.userData.partBoxes || node.userData.noMerge || node.userData.phys) continue;
      bake(node);
    }
    // Every baked geometry is the world's to free, including the ones the
    // refinery, the pad and the hauler baked for themselves.
    const owned = new Set(this.disposables);
    this.scene.traverse(o => {
      const g = o.userData.ownGeometry;
      if (g && !owned.has(g)) { owned.add(g); this.own(g); }
    });
  }

  /**
   * THE LAMPS SHARE TWO LIGHTS. The lab's pooled lamps and the work lamps on the
   * hosts stand tens of metres apart, so the two lights nearest the eye are
   * always the ones that show (lamp-pool.js).
   */
  initLampPool() {
    this.lampPool = new LampPool(this.scene, 2);
    this.scene.updateMatrixWorld(true);
    for (const mark of this.lamps) {
      this.lampPool.add({ ...mark.userData.lamp, position: mark.getWorldPosition(new THREE.Vector3()) });
    }
  }

  /* ======================================================================
     THE REFINERY
     ====================================================================== */

  initRefinery() {
    const ctx = this.plantCtx;
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      // A vessel over the instrument room stands on its roof, whose top is the foundation's foot.
      const y = lm.on === 'roof' ? this.sub.ceilingY + this.roofThick + 0.3 : this.surfaceHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      switch (lm.asset) {
        case 'evaporator': node = buildEvaporator(ctx, lm.scale); break;
        case 'cracking-tower': node = buildCrackingTower(ctx, lm.scale); break;
        case 'pipe-bridge': node = buildPipeBridge(ctx); break;
        case 'conveyor': node = buildConveyor(ctx); break;
        case 'loadout-scale': node = buildLoadoutScale(ctx); break;
        case 'comms-mast': node = buildCommsMast(ctx); break;
        case 'debris-field': node = buildDebrisField(ctx, lm.scale, lm.pos[0], lm.pos[2]); break;
        case 'stake-marker': node = buildStakeMarker(ctx); break;
        default: node = null;
      }
      if (!node) continue;
      if (node.userData.lamp) this.mastLamp = node.userData.lamp;
      // Bake the prop into one mesh per material before it is placed. An
      // evaporator is about sixty meshes once it is dressed, and there are
      // four of them — this is what keeps the detail affordable.
      mergeStatic(node);
      node.position.set(lm.pos[0], y, lm.pos[2]);
      node.rotation.y = lm.rotY;
      // Named so the physics check can say WHICH evaporator is in the way.
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      this.scene.add(node);
    }
  }

  /* ======================================================================
     THE SALVAGE: crates, heaps, pans, the hauler, the pad
     ====================================================================== */

  initCrates() {
    // Four stencil variants, shared across every stack: one atlas, not eight.
    const codes = [['MM', '17-C'], ['AH', '04-J'], ['TS', '22-B'], ['ME', '09-R']];
    this.crateMats = codes.map(([c, s]) => {
      const t = createSalvageCrateTexture(256, c, s);
      this.own(t.map, t.normalMap, t.roughnessMap);
      return this.own(new THREE.MeshStandardMaterial({
        map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap,
        roughness: 0.95, metalness: 0.3
      }));
    });

    // A crate has been handled for forty years: its edges are broken and rounded, never a sharp box.
    const crateGeo = this.own(roundedSlab(1.15, 1.15, 0.9, 0.07, 0.035));
    crateGeo.translate(0, -0.45, 0);
    boxUVs(crateGeo, 1.15, 0.9, 1.15);
    const lipGeo = this.own(roundedSlab(1.22, 1.22, 0.07, 0.06, 0.02));
    lipGeo.translate(0, -0.035, 0);

    for (const lm of this.data.landmarks) {
      if (lm.asset !== 'crate-stack') continue;
      const baseY = this.surfaceHeight(lm.pos[0], lm.pos[2]);
      const rand = mulberry32(((lm.pos[0] * 374761393) ^ (lm.pos[2] * 668265263)) >>> 0);
      const g = new THREE.Group();

      // Three high at most: a stack a student cannot see over would hide the yard.
      const tall = 2 + Math.floor(rand() * 2);
      for (let i = 0; i < tall; i++) {
        const mat = this.crateMats[Math.floor(rand() * this.crateMats.length)];
        const c = new THREE.Mesh(crateGeo, mat);
        // Stacks settle: each crate sits slightly off the one below it.
        c.position.set((rand() - 0.5) * 0.14, 0.45 + i * 0.97, (rand() - 0.5) * 0.14);
        c.rotation.y = (rand() - 0.5) * 0.16;
        // Knocked about: a lean, and a little out of square in size.
        c.rotation.x = (rand() - 0.5) * 0.05;
        c.rotation.z = (rand() - 0.5) * 0.05;
        c.scale.set(0.97 + rand() * 0.07, 0.95 + rand() * 0.08, 0.97 + rand() * 0.07);
        c.castShadow = c.receiveShadow = tierAtLeast('T4');
        g.add(c);

        const lip = new THREE.Mesh(lipGeo, this.darkSteelMat);
        lip.position.copy(c.position);
        lip.position.y += 0.47;
        lip.rotation.y = c.rotation.y;
        g.add(lip);
      }

      // A second, lower stack beside the first, inside the same footprint.
      if (rand() > 0.45) {
        const c = new THREE.Mesh(crateGeo, this.crateMats[Math.floor(rand() * 4)]);
        c.position.set(1.18, 0.45, (rand() - 0.5) * 0.3);
        c.rotation.y = (rand() - 0.5) * 0.4;
        c.castShadow = c.receiveShadow = tierAtLeast('T4');
        g.add(c);
      }

      g.position.set(lm.pos[0], baseY, lm.pos[2]);
      g.rotation.y = lm.rotY;
      this.scene.add(g);
    }
  }

  /**
   * Stockpiles of harvested salt. A real pile stands at its angle of repose,
   * its flanks cut by rills where rain ran down it, its top wind-rounded and
   * crusted, with a skirt of spilled salt round its foot. Built at a density
   * the rills can actually be drawn at.
   */
  initSaltHeaps() {
    const grain = buildMaterial(saltGrain({ size: texSize(256), seed: 5 }), { repeat: 1 });
    for (const t of grain.userData.surfaceMaps) this.own(t);
    this.own(grain);
    grain.roughness = 1.0;
    grain.normalScale.set(1.2, 1.2);
    // A pile is salt: it does not grow a salt crust, it IS one.
    grain.userData.noSalt = true;

    for (const lm of this.data.landmarks) {
      if (lm.asset !== 'salt-heap') continue;
      // The widest the pile gets (skirt and lobes included) stays inside the
      // footprint tallow.json declares for it; a pile stands at about 35°.
      const s = lm.radius / 5.8;
      const R = lm.radius * 0.93 / 1.53;
      const H = R * 0.72;
      const seg = this.t4 ? 72 : 40;
      const rings = this.t4 ? 26 : 14;
      const geo = new THREE.CylinderGeometry(0.01, 1, 1, seg, rings, true);
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      const rand = mulberry32(((lm.pos[0] * 2654435761) ^ (lm.pos[2] * 40503)) >>> 0);
      const ph = rand() * 10;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) + 0.5;           // 0 at the foot, 1 at the top
        const th = Math.atan2(pos.getZ(i), pos.getX(i));
        // The profile: a cone with a wind-rounded crown and a spill skirt.
        const t = 1 - y;
        let rr = R * (0.06 + 0.94 * Math.pow(t, 0.92)) + R * 0.35 * Math.pow(t, 6);
        // Lobed plan, and rills cut down the flanks.
        rr *= 1 + 0.08 * Math.sin(th * 3 + ph) + 0.05 * Math.sin(th * 5 - ph * 1.3);
        const rill = Math.pow(Math.abs(Math.sin(th * 13 + ph + y * 1.5)), 6) * 0.07 * Math.sin(Math.PI * Math.min(1, y * 1.2));
        rr *= 1 - rill;
        rr *= 1 + (rand() - 0.5) * 0.02;
        let hh = H * (1 - Math.pow(t, 1.0)) * (1 - 0.18 * Math.pow(1 - t, 3));
        hh -= H * 0.12 * Math.pow(t, 5);
        pos.setXYZ(i, Math.cos(th) * rr, hh, Math.sin(th) * rr);
        uv.setXY(i, (th / (Math.PI * 2) + 0.5) * 6 * s, y * 2.4 * s);
      }
      geo.computeVertexNormals();
      this.own(geo);

      const m = new THREE.Mesh(geo, grain);
      m.position.set(lm.pos[0], this.surfaceHeight(lm.pos[0], lm.pos[2]) - 0.35 * s, lm.pos[2]);
      m.rotation.y = lm.rotY;
      m.castShadow = m.receiveShadow = this.t4;
      m.userData.noSalt = true;
      m.name = `salt-heap@${lm.pos[0]},${lm.pos[2]}`;
      this.scene.add(m);
    }
  }

  /**
   * Evaporation ponds: a bund of scraped crust round a sheet of brine. Brine
   * concentrating in the sun goes the colours real salt works go — milky, then
   * green, then the rose of the algae that live in it — so the four ponds are
   * four stages of the same process, and they are the only colour on the flat.
   */
  initPanRims() {
    const bundMat = this.own(new THREE.MeshStandardMaterial({
      color: 0xb8ad98, roughness: 1.0, metalness: 0.0
    }));
    bundMat.userData.salt = { creep: 1.4, top: 0.9, tide: 0.2 };
    const tints = [0xb7a4a0, 0x9fae9f, 0xc9b996, 0xcfc9bd];
    let k = 0;
    for (const lm of this.data.landmarks) {
      if (lm.asset !== 'pan-rim') continue;
      const s = lm.scale;
      const R = 8.2 * s;
      const y = this.surfaceHeight(lm.pos[0], lm.pos[2]);
      const g = new THREE.Group();
      const rand = mulberry32(((lm.pos[0] * 73856093) ^ (lm.pos[2] * 19349663)) >>> 0);
      const ph = rand() * 10;
      const plan = th => R * (1 + 0.06 * Math.sin(th * 2 + ph) + 0.04 * Math.sin(th * 5 - ph));

      // The bund: a low trapezoid of scraped crust, swept round the plan.
      const N = this.t4 ? 96 : 48;
      const prof = [[-0.9, 0], [-0.35, 0.42], [0.3, 0.42], [0.85, 0]];
      const verts = [], idx = [];
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * Math.PI * 2;
        const rr = plan(th);
        const bump = 1 + (rand() - 0.5) * 0.25;
        for (const [dr, hy] of prof) {
          verts.push(Math.cos(th) * (rr + dr * s), hy * s * bump, Math.sin(th) * (rr + dr * s));
        }
      }
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < prof.length - 1; j++) {
          const a = i * prof.length + j, b = a + 1, c = a + prof.length, d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      bg.setIndex(idx);
      bg.computeVertexNormals();
      this.own(bg);
      const bund = new THREE.Mesh(bg, bundMat);
      bund.position.y = -0.04;
      bund.receiveShadow = bund.castShadow = this.t4;
      g.add(bund);

      // The brine: a sheet a hand below the bund's crest, with a crystal
      // margin where it has pulled back from the edge.
      const pts = [];
      for (let i = 0; i < 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        const rr = plan(th) - 0.55 * s;
        pts.push(new THREE.Vector2(Math.cos(th) * rr, -Math.sin(th) * rr));
      }
      const shape = new THREE.Shape(pts);
      const wg = this.own(new THREE.ShapeGeometry(shape, 8));
      wg.rotateX(-Math.PI / 2);
      const brine = this.own(new THREE.MeshStandardMaterial({
        color: tints[k % tints.length], roughness: 0.06, metalness: 0.0,
        envMapIntensity: 1.2
      }));
      const water = new THREE.Mesh(wg, brine);
      water.position.y = 0.1 * s;
      water.userData.noSalt = true;
      water.receiveShadow = this.t4;
      g.add(water);

      const shoreG = this.own(new THREE.RingGeometry(0.1, 1, 64, 1));
      const sp = shoreG.attributes.position;
      for (let i = 0; i < sp.count; i++) {
        const x = sp.getX(i), yy = sp.getY(i);
        const th = Math.atan2(-yy, x);
        const outer = Math.hypot(x, yy) > 0.5;
        const rr = plan(th) - (outer ? 0.45 : 1.3 + rand() * 0.5) * s;
        sp.setXY(i, Math.cos(th) * rr, -Math.sin(th) * rr);
      }
      shoreG.rotateX(-Math.PI / 2);
      const shore = new THREE.Mesh(shoreG, this.own(new THREE.MeshStandardMaterial({
        color: 0xeee8dc, roughness: 0.95, transparent: true, opacity: 0.85,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
      })));
      shore.position.y = 0.1 * s + 0.004;
      g.add(shore);

      g.position.set(lm.pos[0], y, lm.pos[2]);
      g.userData.phys = 'ground';
      g.name = `pond@${lm.pos[0]},${lm.pos[2]}`;
      this.scene.add(g);
      k++;
    }
  }

  /** The derelict ore hauler, sunk to its axles in the crust. See tallow/hauler.js. */
  initHauler() {
    const lm = this.data.landmarks.find(l => l.asset === 'hauler');
    if (!lm) return;
    const g = buildHauler(this.plantCtx, lm);
    if (!g) return;
    g.position.set(lm.pos[0], this.surfaceHeight(lm.pos[0], lm.pos[2]) - (g.userData.sink ?? 0.55), lm.pos[2]);
    g.rotation.y = lm.rotY;
    g.rotation.z = g.userData.list ?? 0.04;
    g.name = `hauler@${lm.pos[0]},${lm.pos[2]}`;
    this.scene.add(g);
  }

  /**
   * Cast concrete, poured against board formwork forty years ago: the grain of
   * the boards printed in it, blowholes, and the aggregate showing where the
   * skin has weathered off. One set, shared by everything poured on the flat.
   */
  concreteMaterial() {
    if (this._concrete) return this._concrete;
    const S = texSize(512);
    const height = heightField(S, (u, v) => {
      const board = Math.abs(((v * 8) % 1) - 0.5) < 0.03 ? -0.12 : 0;
      const grain = (fbm(u * 3, v * 40, { octaves: 3, period: 40, seed: 0x7c1 }) - 0.5) * 0.08;
      const pits = Math.max(0, 0.06 - (fbm(u * 60, v * 60, { octaves: 2, period: 60, seed: 0x3b }) - 0.35)) * -1.2;
      const agg = (fbm(u * 24, v * 24, { octaves: 4, period: 24, seed: 0x55 }) - 0.5) * 0.18;
      return 0.6 + board + grain + agg + Math.max(-0.2, pits);
    });
    const alb = document.createElement('canvas');
    alb.width = alb.height = S;
    const actx = alb.getContext('2d');
    const img = actx.createImageData(S, S);
    const hd = heightField(S, (u, v) => fbm(u * 5, v * 5, { octaves: 5, period: 5, seed: 0x991 }));
    const src = height.getContext('2d').getImageData(0, 0, S, S).data;
    const mot = hd.getContext('2d').getImageData(0, 0, S, S).data;
    for (let i = 0; i < S * S; i++) {
      const h = src[i * 4] / 255, m = mot[i * 4] / 255;
      const k = 0.78 + (h - 0.6) * 0.5 + (m - 0.5) * 0.22;
      img.data[i * 4] = Math.min(255, 168 * k);
      img.data[i * 4 + 1] = Math.min(255, 161 * k);
      img.data[i * 4 + 2] = Math.min(255, 149 * k);
      img.data[i * 4 + 3] = 255;
    }
    actx.putImageData(img, 0, 0);
    const mat = buildMaterial({ albedo: alb, height, normalStrength: 1.8 }, { repeat: 1, roughness: 0.95 });
    for (const t of mat.userData.surfaceMaps) this.own(t);
    mat.userData.salt = { creep: 0.9, top: 0.7, tide: 0.4 };
    this._concrete = this.own(mat);
    return mat;
  }

  /** World-scaled box uvs, so a texture lies at one metre per 2 uv everywhere. */
  boxUVs(geo, scale = 0.5) {
    const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i));
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (ay > 0.7) uv.setXY(i, x * scale, z * scale);
      else if (ax > 0.7) uv.setXY(i, z * scale, y * scale);
      else uv.setXY(i, x * scale, y * scale);
    }
    return geo;
  }

  /**
   * The pad the Avalon sets down on: an octagon of heavy plate laid on the
   * crust, bevelled at its edge so a hauler can drive up onto it, painted with
   * a worn ring-and-chevron marking, black at the middle where thrust has hit
   * it a thousand times, with flush perimeter lamps (dark: the pad is cold),
   * tie-down rings, precast blast walls on two sides and the windsock.
   *
   * EVERYTHING ON THE DECK IS LOW. The ship stands on its legs over this, on
   * the ground height `solveLanding` reads; a marker post half a metre tall
   * would come up through its landing gear. Nothing inside the octagon stands
   * more than a hand above the plate.
   */
  initLandingPad() {
    const lm = this.data.landmarks.find(l => l.asset === 'landing-pad');
    if (!lm) return;
    const g = new THREE.Group();
    const t4 = this.t4;
    const R = 7.9;
    const TOP = 0.2;

    const deckSet = buildMaterial(platedMetal({
      paint: '#5d574d', metal: '#6a655c', rust: '#6f4428',
      panels: 3, seed: 83, weather: 0.7, size: texSize(512)
    }), { repeat: 3, roughness: 1.0 });
    for (const t of deckSet.userData.surfaceMaps) this.own(t);
    this.own(deckSet);
    deckSet.normalScale.set(1.2, 1.2);
    // The crust creeps onto the plate's edge but not across a deck in use.
    deckSet.userData.salt = { creep: 0.25, top: 0.25, tide: 0.0 };

    // The deck, with the bevel as one lathed profile: crust to plate in 0.6 m.
    // Listed from the buried foot inward, so the lathe's faces point up and out.
    const prof = [
      new THREE.Vector2(R + 0.6, -0.3), new THREE.Vector2(R + 0.6, -0.06),
      new THREE.Vector2(R + 0.05, TOP - 0.03), new THREE.Vector2(R - 0.02, TOP),
      new THREE.Vector2(0, TOP)
    ];
    const deckGeo = this.own(new THREE.LatheGeometry(prof, 8));
    deckGeo.rotateY(Math.PI / 8);
    // Planar uvs, so the plate grid lies flat across the octagon.
    const dp = deckGeo.attributes.position, duv = deckGeo.attributes.uv;
    for (let i = 0; i < dp.count; i++) duv.setXY(i, dp.getX(i) / 6, dp.getZ(i) / 6);
    deckGeo.computeVertexNormals();
    const deck = new THREE.Mesh(deckGeo, deckSet);
    deck.receiveShadow = t4;
    g.add(deck);

    // Seams between the plates: raised weld runs in a grid, clipped to the octagon.
    const seamMat = this.darkSteelMat;
    const apothem = R * Math.cos(Math.PI / 8);
    for (let k = -2; k <= 2; k++) {
      const c = k * 2.9;
      const half = Math.sqrt(Math.max(0, apothem * apothem - c * c)) - 0.4;
      if (half < 1) continue;
      for (const along of ['x', 'z']) {
        const bead = weldBead(half * 2, seamMat, { radius: 0.02, seed: k + (along === 'x' ? 11 : 29) });
        if (along === 'x') { bead.position.set(0, TOP, c); bead.rotation.y = Math.PI / 2; }
        else bead.position.set(c, TOP, 0);
        g.add(bead);
      }
    }

    // The marking and the scorch are paint and soot: decals on the plate.
    const mark = this.padMarkingTexture();
    const decal = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(R - 0.3, 64)),
      this.own(new THREE.MeshStandardMaterial({
        map: mark, transparent: true, roughness: 0.9, metalness: 0.0,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
      }))
    );
    decal.rotation.x = -Math.PI / 2;
    decal.position.y = TOP + 0.004;
    g.add(decal);

    // Flush perimeter lamps: dark lenses in cast housings, let into the bevel.
    const housingGeo = this.own(new THREE.BoxGeometry(0.34, 0.08, 0.2));
    const lensGeo = this.own(new THREE.BoxGeometry(0.24, 0.02, 0.1));
    const lensMat = this.own(new THREE.MeshStandardMaterial({ color: 0x3a3127, roughness: 0.35, metalness: 0.1 }));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = R + 0.22;
      const hsg = new THREE.Mesh(housingGeo, this.darkSteelMat);
      hsg.position.set(Math.cos(a) * rr, TOP - 0.06, Math.sin(a) * rr);
      hsg.rotation.y = -a;
      g.add(hsg);
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(Math.cos(a) * rr, TOP - 0.015, Math.sin(a) * rr);
      lens.rotation.y = -a;
      g.add(lens);
    }

    // Tie-down rings, set into the plate on a circle.
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const ring = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(0.12, 0.025, 6, 14)), this.darkSteelMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(Math.cos(a) * 5.6, TOP + 0.02, Math.sin(a) * 5.6);
      g.add(ring);
    }

    // Blast walls: precast segments on an arc, with gaps between them, on the
    // two sides the old spoil berms stood.
    const wallMat = this.own(new THREE.MeshStandardMaterial({ color: 0x9a9384, roughness: 0.97, metalness: 0.0 }));
    wallMat.map = this.concreteMap || (this.concreteMap = this.own(asDataTexture(heightField(texSize(256), (u, v) =>
      0.72 + (fbm(u * 12, v * 12, { octaves: 5, period: 12, seed: 0x4c1 }) - 0.5) * 0.5
    ), 1)));
    wallMat.map.colorSpace = THREE.NoColorSpace;
    wallMat.userData.salt = { creep: 0.9, top: 0.7, tide: 0.35 };
    const wProf = new THREE.Shape([
      new THREE.Vector2(-0.8, 0), new THREE.Vector2(0.8, 0), new THREE.Vector2(0.62, 0.3),
      new THREE.Vector2(0.28, 1.45), new THREE.Vector2(-0.28, 1.45), new THREE.Vector2(-0.62, 0.3)
    ]);
    const segLen = 2.1;
    const segGeo = this.own(new THREE.ExtrudeGeometry(wProf, {
      depth: segLen, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1
    }));
    segGeo.translate(0, 0, -segLen / 2);
    segGeo.rotateY(Math.PI / 2);
    const sp = segGeo.attributes.position, suv = segGeo.attributes.uv;
    for (let i = 0; i < sp.count; i++) suv.setXY(i, (sp.getX(i) + sp.getZ(i)) / 3, sp.getY(i) / 3);
    for (const a0 of [Math.PI * 0.25, Math.PI * 1.25]) {
      for (let k = -2; k <= 2; k++) {
        const a = a0 + k * 0.215;
        const seg = new THREE.Mesh(segGeo, wallMat);
        seg.position.set(Math.cos(a) * 9.6, -0.04, Math.sin(a) * 9.6);
        seg.rotation.y = -a;
        seg.rotation.z = (k % 2 ? 0.015 : -0.01);
        seg.castShadow = seg.receiveShadow = t4;
        g.add(seg);
        const lug = new THREE.Mesh(this.own(new THREE.TorusGeometry(0.09, 0.018, 5, 10, Math.PI)), this.darkSteelMat);
        lug.position.set(Math.cos(a) * 9.6, 1.45, Math.sin(a) * 9.6);
        lug.rotation.y = -a + Math.PI / 2;
        g.add(lug);
      }
    }

    // Windsock: the one thing on Tallow that still moves on its own.
    const mast = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.05, 0.08, 4.4, 10)), this.darkSteelMat
    );
    mast.position.set(6.9, 2.2 - 0.04, -6.1);
    g.add(mast);
    const mastFoot = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.5, 0.12, 0.5)), this.darkSteelMat);
    mastFoot.position.set(6.9, 0.04, -6.1);
    g.add(mastFoot);
    const hoop = new THREE.Mesh(this.own(new THREE.TorusGeometry(0.3, 0.02, 6, 16)), this.darkSteelMat);
    hoop.position.set(6.9, 4.2, -6.1);
    hoop.rotation.y = Math.PI / 2;
    g.add(hoop);
    const sock = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.28, 0.12, 1.6, 12, 4, true)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x9c6a28, roughness: 1.0, side: THREE.DoubleSide
      }))
    );
    // Hinged at its mouth, so it turns about the hoop rather than its middle.
    sock.geometry.translate(0, -0.8, 0);
    sock.rotation.z = Math.PI / 2 - 0.12;
    sock.position.set(6.9, 4.2, -6.1);
    sock.userData.noMerge = true;   // it turns in the wind
    g.add(sock);
    this.windsock = sock;

    // A service pedestal at the edge: the fuel and power umbilicals, capped.
    const ped = new THREE.Group();
    const cab = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.8, 1.1, 0.5)), this.plateMat);
    cab.position.y = 0.55;
    cab.castShadow = t4;
    ped.add(cab);
    const hood = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.9, 0.06, 0.62)), this.darkSteelMat);
    hood.position.set(0, 1.13, 0.04);
    hood.rotation.x = 0.1;
    ped.add(hood);
    for (const dx of [-0.2, 0.2]) {
      const cap = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 12)), this.darkSteelMat);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(dx, 0.75, 0.3);
      ped.add(cap);
    }
    const hose = cableRun([0.2, 0.75, 0.36], [0.9, 0.05, 1.3], this.darkSteelMat, { sag: 0.3, radius: 0.05, segments: 16 });
    this.own(hose.userData.ownGeometry);
    ped.add(hose);
    const tag = placard('PAD 2', { w: 0.42, h: 0.16 });
    this.own(tag.geometry, tag.material, tag.material.map);
    tag.position.set(0, 0.95, 0.253);
    ped.add(tag);
    const pa = -Math.PI * 0.72;
    ped.position.set(Math.cos(pa) * (R + 1.5), 0, Math.sin(pa) * (R + 1.5));
    ped.rotation.y = -pa - Math.PI / 2;
    g.add(ped);

    mergeStatic(g);
    g.position.set(lm.pos[0], this.surfaceHeight(lm.pos[0], lm.pos[2]), lm.pos[2]);
    g.name = `landing-pad@${lm.pos[0]},${lm.pos[2]}`;
    this.scene.add(g);
  }

  /** The pad's paint and soot, drawn once: a worn ring, chevrons, the scorch. */
  padMarkingTexture() {
    const N = texSize(1024);
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const ctx = c.getContext('2d');
    const C = N / 2;
    ctx.clearRect(0, 0, N, N);
    // Soot: black at the heart, feathering out in streaks.
    const soot = ctx.createRadialGradient?.(C, C, 0, C, C, N * 0.34);
    if (soot) {
      soot.addColorStop(0, 'rgba(20,17,14,0.92)');
      soot.addColorStop(0.45, 'rgba(28,24,20,0.6)');
      soot.addColorStop(1, 'rgba(40,34,28,0)');
      ctx.fillStyle = soot;
      ctx.fillRect(0, 0, N, N);
    }
    ctx.strokeStyle = 'rgba(30,26,22,0.35)';
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2 + Math.sin(i * 7.1) * 0.05;
      const r0 = N * (0.12 + 0.05 * Math.abs(Math.sin(i * 3.3)));
      const r1 = N * (0.3 + 0.1 * Math.abs(Math.sin(i * 1.7)));
      ctx.lineWidth = N * (0.004 + 0.006 * Math.abs(Math.sin(i * 5.9)));
      ctx.beginPath();
      ctx.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0);
      ctx.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1);
      ctx.stroke();
    }
    // The ring and the four chevrons, in a pale worn yellow.
    ctx.strokeStyle = 'rgba(196,168,92,0.8)';
    ctx.lineWidth = N * 0.018;
    ctx.beginPath();
    ctx.arc(C, C, N * 0.43, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(196,168,92,0.8)';
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + Math.PI / 4;
      ctx.save();
      ctx.translate(C + Math.cos(a) * N * 0.37, C + Math.sin(a) * N * 0.37);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(-N * 0.05, 0); ctx.lineTo(0, -N * 0.035); ctx.lineTo(N * 0.05, 0);
      ctx.lineTo(N * 0.05, N * 0.02); ctx.lineTo(0, -N * 0.015); ctx.lineTo(-N * 0.05, N * 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Wear: the paint taken back out where boots and skids have gone.
    ctx.globalCompositeOperation = 'destination-out';
    const rand = mulberry32(0xa11);
    for (let i = 0; i < 900; i++) {
      ctx.globalAlpha = 0.08 + rand() * 0.3;
      const x = rand() * N, y = rand() * N;
      ctx.fillRect(x, y, 2 + rand() * N * 0.03, 1 + rand() * N * 0.006);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return this.own(tex);
  }

  /* ======================================================================
     THE SITES
     ====================================================================== */

  /**
   * A work bench: the shared bay bench (`bench-bay.js`) in the sampling-shelf
   * skin, dressed the way a salvage bench is. `kind` is which instrument is cased
   * up on this bench. It changes the face of the dormant cabinet and nothing else:
   * five sites used to stand five identical cabinets with a microscope's round
   * aperture in them, so a player walking the flat could not tell the card index
   * from the assay works until they were standing at it.
   */
  buildBench(opts = {}) {
    const { kind = 'scope' } = opts;
    const ctx = { own: (...o) => this.own(...o), t4: tierAtLeast('T4') };
    return buildBayBench(ctx, {
      skin: opts.skin || 'shelf',
      plate: opts.plate || 'BN-01',
      mats: { top: this.plateMat, dark: this.darkSteelMat },
      // Tool rail: the cutter and the shaker, racked where a hand would reach.
      rail: { len: 0.9, x: -0.58, y: 0.34, r: 0.018, tools: [[-0.82, 0.22], [-0.58, 0.3], [-0.34, 0.18]] },
      dormant: (dormant, { height }) => {
        // The instrument housing: a cabinet standing on the bench, chamfered at the
        // top-left the way a plate is, with a recessed dark aperture in its face.
        // THE ONE CLEAN THING ON THE MACHINE. The plant is forty years weathered and the salt has
        // crept up all of it; the cabinet is the instrument somebody uses, so it keeps its own
        // metal, a little less rough, and the salt does not reach it.
        this.caseMats = this.caseMats || {
          plate: this.own(Object.assign(this.plateMat.clone(), { roughness: 0.66 })),
          dark: this.own(Object.assign(this.darkSteelMat.clone(), { roughness: 0.66 }))
        };
        const housing = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(1.15, 0.78, 0.52)),
          kind === 'cards' ? this.caseMats.dark : this.caseMats.plate
        );
        housing.position.set(0, height + 0.43, -0.16);
        housing.castShadow = housing.receiveShadow = tierAtLeast('T4');
        housing.userData.noSalt = true;
        dormant.add(housing);

        /* WHAT IS ON THE CABINET'S FACE IS WHAT THE BENCH IS FOR. */
        if (kind === 'cards') {
          // A CARD INDEX, cased up: a bank of shallow drawers, each with a pull and
          // a brass index-card holder, and the drawer that is half out.
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const out = (r === 1 && c === 1) ? 0.06 : 0;
              const drawer = new THREE.Mesh(
                this.own(new THREE.BoxGeometry(0.33, 0.20, 0.44)), this.plateMat
              );
              drawer.position.set(-0.35 + c * 0.35, height + 0.16 + r * 0.22, -0.16 + out);
              dormant.add(drawer);

              const holder = new THREE.Mesh(
                this.own(new THREE.BoxGeometry(0.16, 0.055, 0.012)), this.darkSteelMat
              );
              holder.position.set(-0.35 + c * 0.35, height + 0.16 + r * 0.22, 0.065 + out);
              dormant.add(holder);

              const pull = new THREE.Mesh(
                this.own(new THREE.CylinderGeometry(0.009, 0.009, 0.10, 8)), this.darkSteelMat
              );
              pull.rotation.z = Math.PI / 2;
              pull.position.set(-0.35 + c * 0.35, height + 0.095 + r * 0.22, 0.068 + out);
              dormant.add(pull);
            }
          }
        } else if (kind === 'assay') {
          // THE ASSAY WORKS, cased up: a weigh-head with a big round scale on the
          // front of it, its needle dead, over a shrouded chute.
          const scaleRim = new THREE.Mesh(
            this.own(new THREE.TorusGeometry(0.235, 0.032, 8, 26)), this.darkSteelMat
          );
          scaleRim.position.set(0, height + 0.52, 0.11);
          dormant.add(scaleRim);

          const dialFace = new THREE.Mesh(
            this.own(new THREE.CircleGeometry(0.225, 28)),
            this.own(new THREE.MeshStandardMaterial({
              color: 0x2a251d, roughness: 0.74, metalness: 0.08
            }))
          );
          dialFace.position.set(0, height + 0.52, 0.107);
          dormant.add(dialFace);

          // Graduations round the face, and a needle resting on the bottom stop.
          const tickGeo = this.own(new THREE.BoxGeometry(0.008, 0.034, 0.004));
          for (let i = 0; i < 12; i++) {
            const a = -Math.PI * 0.78 + (i / 11) * Math.PI * 1.56;
            const tick = new THREE.Mesh(tickGeo, this.pipeMat);
            tick.position.set(Math.sin(a) * 0.185, height + 0.52 + Math.cos(a) * 0.185, 0.113);
            tick.rotation.z = -a;
            dormant.add(tick);
          }
          const needle = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.010, 0.185, 0.008)),
            this.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.7 }))
          );
          needle.position.set(-0.062, height + 0.435, 0.118);
          needle.rotation.z = 0.78;
          dormant.add(needle);

          // The shrouded chute under it, and the shutter dogged across its mouth.
          const shroud = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.30, 0.20, 0.22)), this.plateMat
          );
          shroud.position.set(0, height + 0.13, 0.02);
          dormant.add(shroud);
          const shutter = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.34, 0.05, 0.02)), this.darkSteelMat
          );
          shutter.position.set(0, height + 0.06, 0.135);
          dormant.add(shutter);
        } else {
          const bezel = new THREE.Mesh(
            this.own(new THREE.TorusGeometry(0.26, 0.035, 8, 26)), this.darkSteelMat
          );
          bezel.position.set(0, height + 0.5, 0.11);
          dormant.add(bezel);

          // The aperture face. Dark phosphor glass, not a screen: what it shows is
          // the instrument, and the instrument lives in its own scene.
          const aperture = new THREE.Mesh(
            this.own(new THREE.CircleGeometry(0.245, 26)),
            this.own(new THREE.MeshStandardMaterial({
              color: 0x0d0c0a, roughness: 0.42, metalness: 0.1
            }))
          );
          aperture.position.set(0, height + 0.5, 0.108);
          dormant.add(aperture);

          // The power dial: a knurled knob with a pointer and a ring of detents.
          const dialBody = new THREE.Mesh(
            this.own(new THREE.CylinderGeometry(0.075, 0.085, 0.05, 18)), this.darkSteelMat
          );
          dialBody.rotation.x = Math.PI / 2;
          dialBody.position.set(0.42, height + 0.28, 0.1);
          dormant.add(dialBody);
          const pointer = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.012, 0.07, 0.012)),
            this.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.7 }))
          );
          pointer.position.set(0.42, height + 0.32, 0.13);
          dormant.add(pointer);
          for (let i = 0; i < 6; i++) {
            const a = -Math.PI * 0.7 + (i / 5) * Math.PI * 1.4;
            const detent = new THREE.Mesh(
              this.own(new THREE.BoxGeometry(0.008, 0.022, 0.006)), this.darkSteelMat
            );
            detent.position.set(0.42 + Math.sin(a) * 0.11, height + 0.28 + Math.cos(a) * 0.11, 0.115);
            detent.rotation.z = -a;
            dormant.add(detent);
          }
        }

      },
      extras: (g, { width, depth, height }) => {
        // Under-bench shelf holding two spare crates.
        for (const sx of [-width * 0.28, width * 0.22]) {
          const c = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.42, 0.32, 0.42)),
            this.crateMats ? this.crateMats[0] : this.plateMat
          );
          c.position.set(sx, height * 0.42 + 0.19, 0);
          g.add(c);
        }


        /* ================= THE SMALL PARTS =================
           This is the one object in the world the player stands at with their face
           half a metre from it, so it is the one that has to survive being looked
           at closely. Everything below is a thing a working bench actually has.
           ================================================== */

        // Bolt lines down both ends of the top, through into the leg frames.
        for (const bx of [-width / 2 + 0.12, width / 2 - 0.12]) {
          g.add(boltLine(
            [bx, height + 0.047, -depth / 2 + 0.14],
            [bx, height + 0.047, depth / 2 - 0.14],
            4, this.darkSteelMat, { size: 0.016, normalAxis: 'y' }
          ));
        }

        // The seam down the middle: the top is two plates, welded.
        const seam = weldBead(width - 0.08, this.pipeMat, { radius: 0.013, seed: 0x5e });
        seam.rotation.z = Math.PI / 2;
        seam.position.set(0, height + 0.047, 0);
        g.add(seam);
        this.own(seam.userData.ownGeometry);

        // A bench vice, bolted to the near left corner with its jaws open. Nothing
        // says workshop faster, and nothing is more obviously missing without it.
        const vice = new THREE.Group();
        const viceBody = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.2, 0.15, 0.13)), this.darkSteelMat
        );
        viceBody.position.y = 0.075;
        vice.add(viceBody);
        for (const [jx, jw] of [[-0.08, 0.05], [0.07, 0.05]]) {
          const jaw = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(jw, 0.1, 0.17)), this.pipeMat
          );
          jaw.position.set(jx, 0.13, 0);
          vice.add(jaw);
        }
        const screw = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.018, 0.018, 0.3, 8)), this.pipeMat
        );
        screw.rotation.z = Math.PI / 2;
        screw.position.set(0.06, 0.085, 0);
        vice.add(screw);
        const handle = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.012, 0.012, 0.19, 6)), this.darkSteelMat
        );
        handle.position.set(0.21, 0.085, 0);
        vice.add(handle);
        vice.position.set(-width / 2 + 0.34, height + 0.045, depth / 2 - 0.26);
        vice.rotation.y = 0.22;
        g.add(vice);

        // A rag, left where it was dropped. One quad, folded, and it is the thing
        // that stops a bench top being a rendered rectangle.
        const rag = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.22, 0.012, 0.16)),
          this.own(new THREE.MeshStandardMaterial({ color: 0x6f6553, roughness: 1.0 }))
        );
        rag.position.set(width / 2 - 0.5, height + 0.051, depth / 2 - 0.3);
        rag.rotation.set(0.04, 0.6, 0.02);
        g.add(rag);
        const ragFold = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.13, 0.02, 0.1)), rag.material
        );
        ragFold.position.set(width / 2 - 0.44, height + 0.063, depth / 2 - 0.26);
        ragFold.rotation.set(0.1, 0.9, -0.06);
        g.add(ragFold);

        // Swarf and offcuts: a scatter of small salvage tight against the back lip,
        // where everything that is not in use ends up. The band is narrow on
        // purpose — a Learn instrument deployed on this bench stands its screens on
        // the plate just in front of it, and a chip under a stand foot is two
        // objects in one place.
        const rand = mulberry32(0x71a3 + Math.round(width * 100));
        const chipGeo = this.own(new THREE.BoxGeometry(0.05, 0.02, 0.04));
        for (let i = 0; i < 14; i++) {
          const chip = new THREE.Mesh(chipGeo, this.darkSteelMat);
          chip.position.set(
            (rand() - 0.5) * (width - 0.6),
            height + 0.056,
            -depth / 2 + 0.085 + rand() * 0.05
          );
          chip.rotation.set(rand() * 0.4, rand() * Math.PI, rand() * 0.3);
          chip.scale.setScalar(0.6 + rand() * 0.9);
          g.add(chip);
        }

      }
    });
  }

  /* ======================================================================
     THE HOSTS
     Each bench is built into the piece of the plant it belongs to (see
     tallow/stations.js): the group a builder returns is the machine and its
     bench as one object, set down at the site's mark and turned to face the
     ground the player walks in from.
     ====================================================================== */

  initHosts() {
    this.hostColliders = [];
    for (const site of this.data.sites) {
      const build = HOST_BUILDERS[site.id];
      if (!build || !site.built) continue;

      // What a host needs to know about its neighbours comes from the layout, not from a table here.
      const lm = this.data.landmarks.find(l => l.host === site.id);
      const opts = {};
      if (site.id === 'site-4' && lm) {
        opts.towerRot = lm.rotY;
        opts.towerScale = lm.scale;
        opts.towerBack = Math.hypot(lm.pos[0] - site.pos[0], lm.pos[2] - site.pos[2]);
      }
      if (site.id === 'site-6') {
        const hopper = this.data.sites.find(x => x.id === 'site-5');
        // The hopper's catch bins end 1.3 m west of its bench, and the belt stops short of them.
        if (hopper) opts.feedX = (hopper.pos[0] - site.pos[0]) - HOPPER.shift - 1.3 - 0.4;
      }

      const host = build(this, site, opts);
      const g = host.group;
      const y = site.pos[1] < -1 ? this.sub.floorY : this.surfaceHeight(site.pos[0], site.pos[2]);
      g.position.set(site.pos[0], y, site.pos[2]);
      g.rotation.y = this.siteFacing(site);
      this.scene.add(g);

      this.siteMarkers.set(site.questId, { site, group: g, indicator: host.bench.indicator });
      this.registerBenchAnchor(site, g, host.bench, host.benchLocal);

      // The places the player is sent to for this bench (plan §2.5): real pieces of the host, in the world's frame.
      for (const fp of host.fieldPoints || []) {
        const c = Math.cos(g.rotation.y), sn = Math.sin(g.rotation.y);
        const at = (lx, lz) => [g.position.x + lx * c + lz * sn, g.position.z - lx * sn + lz * c];
        const [px, pz] = at(fp.lx, fp.lz);
        const [sx, sz] = at(fp.stand.lx, fp.stand.lz);
        registerFieldPoint(this, {
          id: fp.id, siteId: site.id, label: fp.label, host: site.id,
          pos: [px, y + fp.ly, pz], half: fp.half, rotY: g.rotation.y,
          stand: [sx, y, sz]
        });
      }

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
  /**
   * Record where a bench's working surface is, in world terms.
   *
   * `local` is where the bench sits inside the site group; the group's own
   * rotation is applied so a site that faces the other way still reports the
   * plate it actually has. `dormant` is the cased-up instrument, which is
   * hidden for exactly as long as the deployed one is standing in its place.
   */
  /**
   * Which way a site faces: toward the ground a player walks in from.
   *
   * THIS USED TO BE A HARDCODED `Math.PI` ON BOTH BUILT SITES, AND IT WAS
   * BACKWARDS. A site group's local +z is its front — the bench's back lip sits
   * at local -z, and the machinery (the control house's wall, the lab's gauge
   * board) is behind it — so a site turned 180° away from its approach put its back wall between
   * the player and the bench, and docked the instrument's camera on the far
   * side of the plate looking at the lip. That is what "I can't adjust my
   * viewport to see the entire thing" was.
   *
   * Derived from `approachPos` so it can never drift from where the player
   * actually arrives: move the approach mark and the site turns to meet it.
   */
  siteFacing(site) {
    const ax = (site.approachPos?.[0] ?? site.pos[0]) - site.pos[0];
    const az = (site.approachPos?.[2] ?? site.pos[2]) - site.pos[2];
    if (Math.hypot(ax, az) < 0.01) return 0;
    return Math.atan2(ax, az);
  }

  registerBenchAnchor(site, group, bench, local) {
    const cos = Math.cos(group.rotation.y);
    const sin = Math.sin(group.rotation.y);
    const [lx, , lz] = local;
    this.benchAnchors.set(site.questId, {
      siteId: site.id,
      position: [
        group.position.x + lx * cos + lz * sin,
        group.position.y,
        group.position.z - lx * sin + lz * cos
      ],
      rotationY: group.rotation.y,
      topY: group.position.y + bench.topY,
      dormant: bench.dormant
    });
  }

  /**
   * Case the bench instrument up, or open it. One object, two states — never
   * two objects in one place.
   */
  setBenchDeployed(questId, deployed) {
    const anchor = this.benchAnchors.get(questId);
    if (anchor?.dormant) anchor.dormant.visible = !deployed;
    this.openBenches = this.openBenches || new Set();
    if (deployed) this.openBenches.add(questId); else this.openBenches.delete(questId);
  }

  get benchesOpen() { return this.openBenches?.size || 0; }

  /** The working surface for a quest's site, or null if it has no bench. */
  benchAnchor(questId) {
    return this.benchAnchors.get(questId) || null;
  }

  /* ======================================================================
     ATMOSPHERE
     ====================================================================== */

  /**
   * What stands beyond the walk: the far plant, the stranded machines, the
   * islands of rock out on the pan. See tallow/vista.js. It hands back the
   * vents that still breathe, and the air carries their plumes.
   */
  initVista() {
    const vista = buildTallowVista({
      heightAt: (x, z) => this.surfaceHeight(x, z),
      t4: this.t4,
      own: (...o) => this.own(...o),
      M: this.plantCtx.M,
      strata: this.strataMap,
      macro: this.macroMap,
      saltMap: this.crustMap
    });
    this.vista = vista;
    if (vista?.group) this.scene.add(vista.group);
  }

  /**
   * The air, moving: salt motes at the eye, grit streaming over the crust,
   * salt devils on the far flats and vapour off the far stacks. The world
   * builds on T4 only for the walk; lower tiers get the motes alone.
   */
  initEffects() {
    this.effects = createTallowEffects({
      heightAt: (x, z) => this.getTerrainHeight(x, z),
      t4: this.t4,
      plumes: this.vista?.plumes || []
    });
    this.scene.add(this.effects.group);
  }

  /* ======================================================================
     COLLISION
     Every prop's declared footprint becomes a collider, plus the pit rim.
     ====================================================================== */

  buildColliders() {
    const r = this.sub.room;
    const s = this.sub.stair;
    const W = 0.4;
    const push = (minX, maxX, minZ, maxZ) => this.colliders.push({ minX, maxX, minZ, maxZ });

    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      // Stakes and scattered plate are ankle height: walk over them.
      if (lm.asset === 'stake-marker' || lm.asset === 'debris-field') continue;
      // Pan rims and the landing pad are walked on, not walked into.
      if (lm.asset === 'pan-rim' || lm.asset === 'landing-pad') continue;
      // A host collides as its builder says (`initHosts`); a vessel on the room's roof is out of reach.
      if (lm.host || lm.on === 'roof') continue;

      /*
       * ELEVATED STRUCTURES ARE THEIR SUPPORTS.
       *
       * A pipe bridge and a conveyor are twenty-odd metres long and carried
       * five metres in the air. One radius at their centre is wrong in both
       * directions at once: it seals a square of open ground nobody could walk
       * into anyway, and it leaves the rest of the span with nothing, so the
       * player strolls straight through the piers at either end.
       *
       * What is actually in the way is the legs. So that is what is collided.
       */
      const supports = this.supportPoints(lm);
      if (supports) {
        for (const sp of supports) this.colliders.push(sp);
        continue;
      }

      this.colliders.push({ x: lm.pos[0], z: lm.pos[2], radius: lm.radius });
    }

    // The hosts: you stand at a bench, you do not walk through it or the machine it is built
    // into. Each builder hands back its own footprints in its own frame (`initHosts` turned
    // them to the world's), the room its columns (`initSublevel`).
    for (const c of this.hostColliders || []) this.colliders.push(c);
    for (const c of this.labColliders || []) this.colliders.push(c);

    // The pit rim. Thin box colliders around the excavation, split so the stair
    // mouth is the only way down — which is what makes the descent a walk.
    push(r.minX - W, r.maxX + W, r.minZ - W, r.minZ);           // far wall
    push(r.minX - W, r.minX, r.minZ, r.maxZ);                   // west wall
    push(r.maxX, r.maxX + W, r.minZ, r.maxZ);                   // east wall
    push(r.minX - W, s.minX, r.maxZ, r.maxZ + W);               // near wall, west of stair
    push(s.maxX, r.maxX + W, r.maxZ, r.maxZ + W);               // near wall, east of stair
    push(s.minX - W, s.minX, s.minZ, s.maxZ);                   // stair cut, west
    push(s.maxX, s.maxX + W, s.minZ, s.maxZ);                   // stair cut, east
  }

  /* ======================================================================
     STATE AND FRAME
     ====================================================================== */

  /**
   * The feet of an elevated structure, in world terms, or null if the landmark
   * is an ordinary solid object.
   *
   * The local coordinates come from `SUPPORT_POINTS` in `tallow/plant.js`,
   * the one table of where the builders there stand their columns and legs.
   */
  supportPoints(lm) {
    const spec = SUPPORT_POINTS[lm.asset];
    if (!spec) return null;
    const local = spec.points;

    const cos = Math.cos(lm.rotY || 0);
    const sin = Math.sin(lm.rotY || 0);
    return local.map(([lx, lz]) => ({
      x: lm.pos[0] + lx * cos + lz * sin,
      z: lm.pos[2] - lx * sin + lz * cos,
      radius: spec.radius ?? 0.55
    }));
  }

  /**
   * Light a site's indicator when its quest is complete. Driven by the Learn
   * track's own progress, never duplicated here — the world reads state, it
   * does not keep it.
   */
  setSiteComplete(questId, complete) {
    const marker = this.siteMarkers.get(questId);
    if (!marker || !marker.indicator) return;
    marker.indicator.material.emissiveIntensity = complete ? 1.7 : 0;
    marker.indicator.material.color.setHex(complete ? 0xd99423 : 0x4a4038);
    marker.indicator.material.needsUpdate = true;
  }

  update(delta, cameraPos) {
    this.elapsed += delta;
    tallowSkyUniforms.uTTime.value = this.elapsed;
    if (cameraPos) {
      // A deployed instrument moves (jaws close, pieces fall), so its
      // shadow is drawn every frame; otherwise only when the box moves.
      const moved = followTallowShadow(this.sunLight, cameraPos, SHADOW_FOLLOW_STEP);
      paceShadow(this.sunLight, moved, { live: this.benchesOpen > 0 });
      if (this.renderer?.getDrawingBufferSize) {
        this._buf = this._buf || new THREE.Vector2();
        this.effects?.setViewportHeight(this.renderer.getDrawingBufferSize(this._buf).y);
      }
      this.effects?.update(delta, this.elapsed, cameraPos);
      this.lampPool?.update(cameraPos);
    }
    this.vista?.update?.(delta, this.elapsed);

    if (this.windsock) {
      this.windsock.rotation.y = Math.sin(this.elapsed * 0.6) * 0.18;
    }
    if (this.mastLamp) {
      this.mastLamp.material.emissiveIntensity =
        1.4 + Math.sin(this.elapsed * 1.7) * 0.18;
    }
  }

  dispose() {
    this.effects?.dispose();
    this.envTarget?.dispose();
    for (const d of this.disposables) {
      try { d.dispose(); } catch (e) {}
    }
    this.disposables = [];
    this.scene.clear();
    this.siteMarkers.clear();
    this.benchAnchors.clear();
    this.colliders = [];
  }
}
