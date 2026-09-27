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
 *   plant.js      the refinery: evaporators, columns, pipe racks, conveyor, mast
 *   hauler.js     the derelict ore hauler
 *   vista.js      what stands beyond the walk: rock islands, the far plant
 *   effects.js    the air moving: motes, grit streams, salt devils, plumes
 *   kit.js        structural stock: I-sections and corrugated sheet
 *
 * WHAT IS HERE, AND WHY IT IS HERE
 * Five Unit 1 sites stand on the flat as physical places, one per written quest:
 *   site-1  Bench 1 — q1-grain. Under the lean-to in the yard.
 *   site-2  Bench 2 — q2-core. Down the stairwell, in the lab.
 *   site-3  Bench 3 — q3-catalogue. Before the blockhouse in the east wall,
 *           its door racked back.
 *   site-4  Bench 4 — q4-ledger. A painted floor with a ledger board,
 *           west of the yard beyond the hauler.
 *   site-5  Bench 5 — q5-assay. A raised hopper over a chute with a row
 *           of catch bins, south of the yard.
 * All five carry their instruments as built objects (`BUILT_BENCHES`).
 *
 * PHYSICS: every prop declares a footprint in `tallow.json` and every footprint is
 * disjoint — no two objects occupy the same space, which `verify:tallow` proves
 * on the world actually built. The sub-level is a real excavation: the ground
 * mesh is cut along the pit's own outline, the pit is built as geometry, and
 * `getTerrainHeight` resolves the ramp, so the player walks down instead of
 * being teleported under the ground.
 *
 * LIGHT: nothing here blooms. The only emissive surfaces in the whole scene are
 * sodium luminaires, the mast's obstruction lamp, the vault's door lamp and one
 * indicator per built site. That is the rule in CLAUDE.md §4.2.
 */

import * as THREE from 'three';
import tallowData from './world-data/tallow.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, treadPlate, sedimentaryRock,
  buildMaterial, enableAO,
  texSize, heightField, heightToNormal, asDataTexture, fbm,
  boltRing, boltLine, weldBead, cableRun, pipeFlange, placard,
  hazardStripe, mergeStatic
} from './materials/pbr-kit.js';
import { createSalvageCrateTexture } from './materials/tallow-textures.js';
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
  buildEvaporator, buildCrackingTower, buildPipeBridge, buildConveyor,
  buildCommsMast, buildDebrisField, buildStakeMarker, mulberry32, SUPPORT_POINTS
} from './tallow/plant.js';
import { buildHauler } from './tallow/hauler.js';
import { buildTallowVista } from './tallow/vista.js';
import { iBeamGeometry, corrugatedGeometry } from './tallow/kit.js';

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
    this.initSalvageBench();
    this.initCoreBench();
    this.initCatalogueVault();
    this.initTallyFloor();
    this.initHopperGantry();
    this.initVista();
    this.initEffects();
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
   * and the lean-to, read from half a metre, so it is drawn at full size; the
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
    const roof = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(r.maxX - r.minX + 1.2, 0.55, r.maxZ - r.minZ + 0.6)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x554d42, roughness: 0.95, metalness: 0.3 }))
    );
    roof.position.set((r.minX + r.maxX) / 2, this.sub.ceilingY + 0.275, (r.minZ + r.maxZ) / 2 - 0.3);
    roof.castShadow = roof.receiveShadow = tierAtLeast('T4');
    g.add(roof);

    // Roof beams, so the ceiling has structure when you look up from the bench.
    for (let i = 0; i < 5; i++) {
      const beam = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(r.maxX - r.minX, 0.32, 0.26)),
        this.bulkMat
      );
      beam.position.set(
        (r.minX + r.maxX) / 2,
        this.sub.ceilingY - 0.17,
        r.minZ + 1.6 + i * ((r.maxZ - r.minZ - 3.2) / 4)
      );
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
    for (const [lx, lz] of [[-7, -23], [-7, -30], [7, -23], [7, -30]]) {
      g.add(this.buildLuminaire(lx, this.sub.ceilingY - 0.42, lz));
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
    drain.position.set(-3.5, fy + 0.005, -24.0);
    g.add(drain);
    const stain = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(0.72, 20)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x3a342c, transparent: true, opacity: 0.45, roughness: 0.5,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
      }))
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(-3.5, fy + 0.002, -24.0);
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
      [r.minX + 0.18, -26.0, 'LAB-02'],
      [r.maxX - 0.18, -29.0, 'VENT-7'],
      [-2.0, r.minZ + 0.18, 'DIAG BAY']
    ]) {
      const tag = placard(code, { w: 0.62, h: 0.2 });
      tag.position.set(tx, fy + 1.85, tz);
      if (tz === r.minZ + 0.18) tag.rotation.y = 0;
      else tag.rotation.y = tx < 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(tag);
      this.own(tag.geometry, tag.material, tag.material.map);
    }

    this.scene.add(g);
  }

  /** A caged sodium fixture: cast housing, warm diffuser, one small point light. */
  buildLuminaire(x, y, z) {
    const g = new THREE.Group();
    const housing = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.62, 0.16, 0.34)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x3f3830, roughness: 0.9, metalness: 0.5 }))
    );
    g.add(housing);

    const diffuser = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.5, 0.04, 0.24)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0xffe0ae, emissive: 0xffd9a0, emissiveIntensity: 1.5, roughness: 0.6
      }))
    );
    diffuser.position.y = -0.09;
    g.add(diffuser);

    // The protective cage: five bars, because an unguarded lamp in a work space
    // would have been smashed decades ago.
    const cageMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x2e2923, roughness: 0.85, metalness: 0.6
    }));
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6)), cageMat
      );
      bar.rotation.z = Math.PI / 2;
      bar.position.set(-0.2 + i * 0.1, -0.12, 0);
      g.add(bar);
    }

    const light = new THREE.PointLight(0xffd9a0, 5.2, 13, 1.6);
    light.position.y = -0.2;
    g.add(light);
    this.lamps.push(light);

    g.position.set(x, y, z);
    return g;
  }

  /* ======================================================================
     THE REFINERY
     ====================================================================== */

  initRefinery() {
    const ctx = this.plantCtx;
    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      const y = this.surfaceHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      switch (lm.asset) {
        case 'evaporator': node = buildEvaporator(ctx, lm.scale); break;
        case 'cracking-tower': node = buildCrackingTower(ctx, lm.scale); break;
        case 'pipe-bridge': node = buildPipeBridge(ctx); break;
        case 'conveyor': node = buildConveyor(ctx); break;
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

    const crateGeo = this.own(new THREE.BoxGeometry(1.15, 0.9, 1.15));
    const lipGeo = this.own(new THREE.BoxGeometry(1.22, 0.07, 1.22));

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
   * A work bench: chamfered plated top, braced legs, an instrument housing with
   * a dark aperture, a power dial, and one indicator that lights when the site's
   * quest is complete. Built twice — once under the awning, once in the lab.
   */
  buildBench(opts = {}) {
    // A salvage bench is long. It has to be: the instrument that deploys on it
    // lays out up to four stations at 0.92 m centres, and a station is 0.72 m
    // across its tray. Anything shorter and the end trays would hang off the
    // plate — the bench has to be able to hold what is put on it.
    // `kind` is which instrument is cased up on this bench. It changes the
    // face of the dormant cabinet and nothing else: five sites used to stand
    // five identical cabinets with a microscope's round aperture in them, so a
    // player walking the flat could not tell the card index from the assay
    // works until they were standing at it. The bench under them is the same
    // bench — one builder, one plate, one set of colliders.
    const { width = 4.8, depth = 1.3, height = 0.95, kind = 'scope' } = opts;
    const g = new THREE.Group();

    const top = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width, 0.09, depth)),
      this.plateMat
    );
    top.position.y = height;
    top.castShadow = top.receiveShadow = tierAtLeast('T4');
    g.add(top);

    // A raised lip along the back, so nothing rolls off into the crust.
    const lip = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width, 0.12, 0.06)), this.darkSteelMat
    );
    lip.position.set(0, height + 0.1, -depth / 2 + 0.03);
    g.add(lip);

    // Legs with cross-bracing and footplates.
    const legGeo = this.own(new THREE.BoxGeometry(0.1, height, 0.1));
    for (const [lx, lz] of [
      [-width / 2 + 0.12, -depth / 2 + 0.1], [width / 2 - 0.12, -depth / 2 + 0.1],
      [-width / 2 + 0.12, depth / 2 - 0.1], [width / 2 - 0.12, depth / 2 - 0.1]
    ]) {
      const leg = new THREE.Mesh(legGeo, this.darkSteelMat);
      leg.position.set(lx, height / 2, lz);
      leg.castShadow = tierAtLeast('T4');
      g.add(leg);
      const foot = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.2, 0.03, 0.2)), this.darkSteelMat
      );
      foot.position.set(lx, 0.015, lz);
      g.add(foot);
    }
    const brace = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width - 0.3, 0.06, 0.06)), this.darkSteelMat
    );
    brace.position.set(0, height * 0.32, 0);
    g.add(brace);

    // Under-bench shelf holding two spare crates.
    const shelf = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(width - 0.35, 0.05, depth - 0.3)), this.darkSteelMat
    );
    shelf.position.set(0, height * 0.42, 0);
    g.add(shelf);
    for (const sx of [-width * 0.28, width * 0.22]) {
      const c = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.42, 0.32, 0.42)),
        this.crateMats ? this.crateMats[0] : this.plateMat
      );
      c.position.set(sx, height * 0.42 + 0.19, 0);
      g.add(c);
    }

    // THE DORMANT INSTRUMENT.
    // What stands on the bench when nobody is working at it is the instrument,
    // cased up: cabinet, aperture, dial, tool rail. When the player presses [E]
    // the case opens and the stations deploy on this same plate — so the two are
    // never drawn at once, and no two objects ever share that square of bench.
    const dormant = new THREE.Group();
    // Held out of any static bake: this whole subtree is hidden while the
    // instrument is deployed, and a baked cabinet could never be cased up.
    dormant.userData.noMerge = true;
    g.add(dormant);

    // The instrument housing: a cabinet standing on the bench, chamfered at the
    // top-left the way a plate is, with a recessed dark aperture in its face.
    const housing = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.15, 0.78, 0.52)),
      kind === 'cards' ? this.darkSteelMat : this.plateMat
    );
    housing.position.set(0, height + 0.43, -0.16);
    housing.castShadow = housing.receiveShadow = tierAtLeast('T4');
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

    // Tool rail: the cutter and the shaker, racked where a hand would reach.
    const rail = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.018, 0.018, 0.9, 8)), this.darkSteelMat
    );
    rail.rotation.z = Math.PI / 2;
    rail.position.set(-0.58, height + 0.34, -0.3);
    g.add(rail);
    for (const [tx, tl] of [[-0.82, 0.22], [-0.58, 0.3], [-0.34, 0.18]]) {
      const tool = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.05, tl, 0.035)), this.darkSteelMat
      );
      tool.position.set(tx, height + 0.34 - tl / 2 - 0.02, -0.3);
      g.add(tool);
    }

    // The one indicator. Dead until the site's quest is finished.
    //
    // Set into the APRON, not into the cabinet face: the cabinet is cased up
    // while the instrument is deployed, and a status lamp that disappeared the
    // moment you started working would be a lamp attached to nothing.
    const indicator = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.035, 10, 8)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x4a4038, emissive: SODIUM, emissiveIntensity: 0, roughness: 0.6
      }))
    );
    indicator.position.set(width / 2 - 0.42, height - 0.12, depth / 2 + 0.035);
    indicator.userData.noMerge = true;   // its emissive changes on completion
    g.add(indicator);

    // A recessed well for the indicator, so it reads as set into the plate.
    const well = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12)), this.darkSteelMat
    );
    well.rotation.x = Math.PI / 2;
    well.position.set(width / 2 - 0.42, height - 0.12, depth / 2 + 0.018);
    g.add(well);

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

    // The bench's own plate number, riveted to the apron.
    const tag = placard(opts.plate || 'BN-01', { w: 0.28, h: 0.11 });
    tag.position.set(-width / 2 + 0.42, height - 0.12, depth / 2 + 0.005);
    g.add(tag);
    this.own(tag.geometry, tag.material, tag.material.map);

    return { group: g, indicator, dormant, topY: height + 0.045 };
  }

  initSalvageBench() {
    const site = this.data.sites.find(s => s.id === 'site-1');
    if (!site) return;
    const baseY = this.surfaceHeight(site.pos[0], site.pos[2]);
    const g = new THREE.Group();

    /*
     * THE SHELTER IS BUILT THE WAY A FIELD CREW BUILDS ONE: four H-columns on
     * bolted base plates, eave beams across their heads with knee braces,
     * rafters, purlins, and corrugated sheet screwed down onto them, falling
     * to the front so the weather runs off away from the bench. One sheet has
     * lifted at its corner in some old gale and one strip is gone altogether,
     * which is where the light comes through onto the plate.
     */
    const t4 = this.t4;
    const slope = 0.07;
    const roofY = z => 2.95 - Math.tan(slope) * z;
    const SHEET = 0.012, PURLIN = 0.08, RAFTER = 0.16, EAVE = 0.16;
    const beamGeo = len => this.own(iBeamGeometry(len, { h: 0.16, w: 0.11 }));

    for (const [px, pz] of [[-2.95, -1.85], [2.95, -1.85], [-2.95, 1.85], [2.95, 1.85]]) {
      const top = roofY(pz) - SHEET - PURLIN - RAFTER - EAVE;
      const col = new THREE.Mesh(beamGeo(top - 0.03), this.darkSteelMat);
      col.position.set(px, 0.03 + (top - 0.03) / 2, pz);
      col.castShadow = t4;
      g.add(col);
      const plate = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.34, 0.03, 0.3)), this.darkSteelMat);
      plate.position.set(px, 0.015, pz);
      g.add(plate);
      for (const [bx, bz] of [[-0.12, -0.1], [0.12, -0.1], [-0.12, 0.1], [0.12, 0.1]]) {
        const nut = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6)), this.darkSteelMat);
        nut.position.set(px + bx, 0.04, pz + bz);
        g.add(nut);
      }
      // Knee brace from the column up to the eave beam, inboard.
      const kx = px - Math.sign(px) * 0.55;
      const brace = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.05, 0.78, 0.05)), this.darkSteelMat);
      brace.position.set((px + kx) / 2, top - 0.28, pz);
      brace.rotation.z = Math.sign(px) * Math.atan2(0.55, 0.55);
      g.add(brace);
    }

    // Eave beams across the column heads, front and back.
    for (const ez of [-1.85, 1.85]) {
      const y = roofY(ez) - SHEET - PURLIN - RAFTER - EAVE / 2;
      const eave = new THREE.Mesh(beamGeo(6.3), this.darkSteelMat);
      eave.geometry.rotateZ(Math.PI / 2);
      eave.position.set(0, y, ez);
      eave.castShadow = t4;
      g.add(eave);
    }
    // Rafters front to back, clear of the lamp that hangs at the middle.
    for (const rx of [-2.95, -1.05, 1.05, 2.95]) {
      const raf = new THREE.Mesh(beamGeo(4.3), this.darkSteelMat);
      raf.geometry.rotateX(Math.PI / 2);
      raf.geometry.rotateZ(Math.PI / 2);
      raf.position.set(rx, roofY(0) - SHEET - PURLIN - RAFTER / 2, 0);
      raf.rotation.x = slope;
      raf.castShadow = t4;
      g.add(raf);
    }
    // Purlins along the length, the sheet's fixings.
    for (const pz of [-1.95, -0.98, 0, 0.98, 1.95]) {
      const pur = new THREE.Mesh(this.own(new THREE.BoxGeometry(6.6, PURLIN, 0.05)), this.pipeMat);
      pur.position.set(0, roofY(pz) - SHEET - PURLIN / 2, pz);
      pur.rotation.x = slope;
      g.add(pur);
    }
    // The drop rod the lamp hangs on.
    const rod = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 6)), this.darkSteelMat);
    rod.position.set(0, 2.84, 0.2);
    g.add(rod);

    // The sheets. Corrugations run down the fall.
    const sheetW = 2.3;
    for (const [sx, lift, short] of [[-2.15, 0, 0], [0, 0, 0], [2.15, 1, 0.9]]) {
      const d = 4.35 - short;
      const geo = this.own(corrugatedGeometry(sheetW, d));
      if (lift) {
        // The corner that went up in the wind, and stayed up.
        const gp = geo.attributes.position;
        for (let i = 0; i < gp.count; i++) {
          const x = gp.getX(i), z = gp.getZ(i);
          const k = Math.max(0, z - (d / 2 - 1.1)) * Math.max(0, x + 0.1);
          gp.setY(i, gp.getY(i) + k * k * 0.55);
        }
        geo.computeVertexNormals();
      }
      const sheet = new THREE.Mesh(geo, this.plateMat);
      const zc = -short / 2;
      sheet.position.set(sx, roofY(zc), zc);
      sheet.rotation.x = slope;
      sheet.castShadow = sheet.receiveShadow = t4;
      g.add(sheet);
    }
    // A gutter along the low edge, sagging off one bracket.
    const gutter = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.07, 0.07, 6.6, 10, 1, true, 0, Math.PI)), this.pipeMat
    );
    gutter.rotation.z = Math.PI / 2;
    gutter.rotation.x = Math.PI;
    gutter.position.set(0, roofY(2.2) - 0.08, 2.24);
    gutter.rotation.y = 0.012;
    g.add(gutter);

    // The back wall: corrugated sheet on the rear columns, one panel sprung.
    for (const [wx, tilt] of [[-2.15, 0], [0, 0.0], [2.15, 0.05]]) {
      const geo = this.own(corrugatedGeometry(2.3, 2.5));
      geo.rotateX(Math.PI / 2);
      const wall = new THREE.Mesh(geo, this.plateMat);
      wall.position.set(wx, 1.58, -1.99 - tilt * 0.4);
      wall.rotation.x = tilt;
      wall.castShadow = wall.receiveShadow = t4;
      g.add(wall);
    }

    const bench = this.buildBench({
      width: 4.8, depth: 1.3, height: 0.95, kind: 'scope', plate: 'BN-01'
    });
    bench.group.position.set(0, 0, -0.5);
    g.add(bench.group);

    // A caged work lamp clipped to the roof frame. A lamp, so it is lit.
    const workLamp = this.buildLuminaire(0, 2.7, 0.2);
    g.add(workLamp);

    // Its feed, dropping from the roof and looped round the nearest post. A
    // lamp with no cable is a lamp that runs on nothing.
    const feed = cableRun([0, 2.68, 0.2], [-2.86, 2.4, 0.2], this.darkSteelMat,
      { sag: 0.5, radius: 0.016, segments: 14 });
    g.add(feed);
    this.own(feed.userData.ownGeometry);
    const drop = cableRun([-2.86, 2.4, 0.2], [-2.9, 1.1, -0.1], this.darkSteelMat,
      { sag: 0.14, radius: 0.016, segments: 10 });
    g.add(drop);
    this.own(drop.userData.ownGeometry);

    // Wind drift: the flat blows one way, so sand banks against the windward
    // posts and the windward side of the crates and nowhere else. Directional
    // drift is the cheapest way to say a place has weather.
    const driftMat = this.own(new THREE.MeshStandardMaterial({
      color: 0xbcb096, roughness: 1.0, metalness: 0.0
    }));
    // Each drift tails DOWNWIND of the post that made it, clear of the post
    // itself: a lee deposit, not a heap dropped on top of the thing. It also
    // keeps the rule the whole world is held to — nothing is drawn inside
    // anything else.
    for (const [dx, dz, dr] of [[-2.95, -1.85, 0.62], [2.95, -1.85, 0.5], [-2.95, 1.85, 0.36]]) {
      const drift = new THREE.Mesh(
        this.own(new THREE.SphereGeometry(dr, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.5)),
        driftMat
      );
      drift.scale.set(0.55, 0.22, 1.5);
      // The wind runs +z across the yard, so the tail lies on the far side of
      // the post from it, starting just clear of the post's 0.08 half-width.
      drift.position.set(dx, 0.0, dz + 0.12 + dr * 1.5);
      drift.receiveShadow = tierAtLeast('T4');
      g.add(drift);
    }

    // The roof leaks where a sheet has torn away, so one strip of crust under
    // it is a shade darker and a shade smoother than the rest.
    const damp = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(1.5, 0.75)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x948871, transparent: true, opacity: 0.4, roughness: 0.62,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
      }))
    );
    damp.rotation.x = -Math.PI / 2;
    damp.position.set(1.4, 0.012, 1.0);
    g.add(damp);

    // A torn corner out of the side sheet, and the flap still hanging off it.
    const flap = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.9, 0.7, 0.04)), this.plateMat
    );
    flap.position.set(2.2, 1.62, -2.09);
    flap.rotation.set(0.0, 0.0, -0.34);
    flap.castShadow = tierAtLeast('T4');
    g.add(flap);

    // A stack of empty pans against the back sheet, and a coil of hose.
    for (let i = 0; i < 4; i++) {
      const pan = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.34, 0.31, 0.09, 14)), this.darkSteelMat
      );
      pan.position.set(-2.35, 0.05 + i * 0.085, -1.62);
      pan.rotation.y = i * 0.4;
      pan.castShadow = tierAtLeast('T4');
      g.add(pan);
    }
    const hose = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.34, 0.045, 6, 22)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x3b332b, roughness: 0.95 }))
    );
    hose.rotation.x = Math.PI / 2;
    hose.position.set(2.3, 0.05, -1.66);
    g.add(hose);

    // Crates staged beside the bench, awaiting certification.
    for (const [cx, cz, cr] of [[-2.0, 1.0, 0.2], [2.0, 1.05, -0.35]]) {
      const c = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(1.0, 0.8, 1.0)),
        this.crateMats[Math.abs(Math.round(cx)) % this.crateMats.length]
      );
      c.position.set(cx, 0.4, cz);
      c.rotation.y = cr;
      c.castShadow = c.receiveShadow = tierAtLeast('T4');
      g.add(c);
    }

    g.position.set(site.pos[0], baseY, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    // The lean-to is turned to face the yard, so the bench inside it sits half a
    // metre the other side of the site marker. Recorded rather than recomputed:
    // move the bench and the instrument follows it.
    this.registerBenchAnchor(site, g, bench, [0, 0, -0.5]);
  }

  initCoreBench() {
    const site = this.data.sites.find(s => s.id === 'site-2');
    if (!site) return;
    const g = new THREE.Group();

    const bench = this.buildBench({
      width: 4.8, depth: 1.3, height: 0.95, kind: 'core', plate: 'BN-02'
    });
    g.add(bench.group);

    // The lab's own apparatus around the bench: a beam column on one side, an
    // equipment rack on the other, and a gauge board on the wall behind.
    const column = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.34, 0.4, 2.3, 18)), this.plateMat
    );
    column.position.set(-3.35, 1.15, 0);
    column.castShadow = column.receiveShadow = tierAtLeast('T4');
    g.add(column);
    const emitter = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.12, 0.2, 0.7, 14)), this.darkSteelMat
    );
    emitter.rotation.z = -Math.PI / 2;
    emitter.position.set(-2.87, 1.45, 0);
    g.add(emitter);

    const rack = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.7, 1.95, 0.85)), this.bulkMat
    );
    rack.position.set(3.45, 0.98, -0.1);
    rack.castShadow = rack.receiveShadow = tierAtLeast('T4');
    g.add(rack);
    // Rack units: nineteen-inch modules with handles.
    for (let i = 0; i < 7; i++) {
      const unit = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.62, 0.2, 0.04)), this.darkSteelMat
      );
      unit.position.set(3.45, 0.34 + i * 0.24, 0.34);
      g.add(unit);
      for (const hx of [-0.22, 0.22]) {
        const handle = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.05, 0.1, 0.03)), this.plateMat
        );
        handle.position.set(3.45 + hx, 0.34 + i * 0.24, 0.37);
        g.add(handle);
      }
    }

    // Gauge board: dial faces with needles, the lab's own instrumentation.
    const board = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.9, 0.75, 0.08)), this.plateMat
    );
    board.position.set(0, 1.85, -1.35);
    g.add(board);
    for (let i = 0; i < 4; i++) {
      const face = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 18)),
        this.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 0.75 }))
      );
      face.rotation.x = Math.PI / 2;
      face.position.set(-0.69 + i * 0.46, 1.9, -1.30);
      g.add(face);
      const needle = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.012, 0.1, 0.008)),
        this.own(new THREE.MeshStandardMaterial({ color: 0x3a332b, roughness: 0.8 }))
      );
      needle.position.set(-0.69 + i * 0.46, 1.94, -1.28);
      needle.rotation.z = -0.9 + i * 0.4;
      g.add(needle);
    }

    // Cable runs from the rack to the column, draped rather than routed.
    const cableMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x2a251f, roughness: 0.95, metalness: 0.2
    }));
    for (let i = 0; i < 3; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(3.2, 1.4 - i * 0.1, 0.3),
        new THREE.Vector3(1.4, 0.44 - i * 0.07, 0.86),
        new THREE.Vector3(-1.4, 0.4 - i * 0.05, 0.86),
        new THREE.Vector3(-3.1, 1.1 - i * 0.1, 0.2)
      ]);
      const tube = new THREE.Mesh(
        this.own(new THREE.TubeGeometry(curve, 26, 0.022, 6, false)), cableMat
      );
      g.add(tube);
    }

    g.position.set(site.pos[0], this.sub.floorY, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    this.registerBenchAnchor(site, g, bench, [0, 0, 0]);
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
   * at local -z, the lean-to's back sheet and the lab's gauge board are behind
   * it — so a site turned 180° away from its approach put its back wall between
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
  }

  /** The working surface for a quest's site, or null if it has no bench. */
  benchAnchor(questId) {
    return this.benchAnchors.get(questId) || null;
  }

  /**
   * Site 3 — the Catalogue Vault. The blockhouse in the yard's east wall, and
   * it STOOD SEALED until this quest was written. Now the blast door is racked
   * back flat against the face, the mouth stands open, and the work bench the
   * card catalogue is laid out on sits in front of the doorway. The instrument
   * itself still plays as a page — what stands here is the place.
   */
  initCatalogueVault() {
    const site = this.data.sites.find(s => s.id === 'site-3');
    if (!site) return;
    const y = this.surfaceHeight(site.pos[0], site.pos[2]);
    const g = new THREE.Group();

    // The blockhouse itself.
    /*
     * A BLOCKHOUSE IS POURED, NOT WELDED. Battered concrete walls (thicker at
     * the foot, the way a blast-rated vault is cast), a chamfered roof slab,
     * a portal standing proud of the face round the door, and a hood over it
     * so nothing falls from the roof onto whoever is in the doorway. The
     * footprint at grade is unchanged: 5.2 by 3.0.
     */
    const concrete = this.concreteMaterial();
    const t4 = this.t4;
    const bGeo = this.own(new THREE.BoxGeometry(5.2, 3.7, 3.0, 4, 3, 3));
    {
      const p = bGeo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const t = (p.getY(i) + 1.85) / 3.7;
        p.setX(i, p.getX(i) * (1 - 0.07 * t));
        p.setZ(i, p.getZ(i) * (1 - 0.12 * t));
      }
      bGeo.computeVertexNormals();
      this.boxUVs(bGeo, 0.45);
    }
    const block = new THREE.Mesh(bGeo, concrete);
    block.position.set(0, 1.85, 0);
    block.castShadow = block.receiveShadow = t4;
    g.add(block);
    const slab = new THREE.Mesh(this.boxUVs(this.own(new THREE.BoxGeometry(5.1, 0.32, 2.9)), 0.45), concrete);
    slab.position.set(0, 3.86, -0.04);
    slab.castShadow = t4;
    g.add(slab);
    const chamfer = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.16, 0.16, 5.1, 4)), concrete);
    chamfer.rotation.z = Math.PI / 2;
    chamfer.rotation.x = Math.PI / 4;
    chamfer.position.set(0, 3.7, 1.36);
    g.add(chamfer);

    // The portal: a cast surround proud of the battered face, the door let into it.
    for (const px of [-1.18, 1.18]) {
      const pier = new THREE.Mesh(this.boxUVs(this.own(new THREE.BoxGeometry(0.5, 3.0, 0.5)), 0.45), concrete);
      pier.position.set(px, 1.5, 1.42);
      pier.castShadow = t4;
      g.add(pier);
    }
    const head = new THREE.Mesh(this.boxUVs(this.own(new THREE.BoxGeometry(2.86, 0.5, 0.62)), 0.45), concrete);
    head.position.set(0, 2.95, 1.46);
    head.castShadow = t4;
    g.add(head);
    // The hood: a plate canopy on two brackets.
    const hood = new THREE.Mesh(this.own(new THREE.BoxGeometry(3.0, 0.06, 0.9)), this.darkSteelMat);
    hood.position.set(0, 3.25, 1.95);
    hood.rotation.x = -0.12;
    hood.castShadow = t4;
    g.add(hood);
    for (const hx of [-1.3, 1.3]) {
      const br = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.05, 0.45, 0.05)), this.darkSteelMat);
      br.position.set(hx, 3.05, 1.95);
      br.rotation.x = 0.9;
      g.add(br);
    }

    const mouth = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.7, 2.5, 0.14)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x0d0c0a, roughness: 1.0, metalness: 0 }))
    );
    mouth.position.set(0, 1.3, 1.47);
    g.add(mouth);

    for (const jx of [-1.0, 1.0]) {
      const jamb = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.16, 2.5, 0.16)), this.darkSteelMat
      );
      jamb.position.set(jx, 1.25, 1.62);
      g.add(jamb);
    }
    const lintel = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.2, 0.18, 0.16)), this.darkSteelMat
    );
    lintel.position.set(0, 2.58, 1.62);
    g.add(lintel);

    // On the roof: a vent cowl, a condenser box and a whip antenna.
    const cowl = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.22, 0.26, 0.9, 14)), this.pipeMat);
    cowl.position.set(1.6, 4.47, -0.6);
    g.add(cowl);
    const cowlCap = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.34, 0.22, 0.16, 14)), this.darkSteelMat);
    cowlCap.position.set(1.6, 4.98, -0.6);
    g.add(cowlCap);
    const cond = new THREE.Mesh(this.own(new THREE.BoxGeometry(1.2, 0.7, 0.8)), this.plateMat);
    cond.position.set(-1.3, 4.37, -0.5);
    cond.castShadow = t4;
    g.add(cond);
    const fan = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 18)), this.darkSteelMat);
    fan.position.set(-1.3, 4.73, -0.5);
    g.add(fan);
    const whip = new THREE.Mesh(this.own(new THREE.CylinderGeometry(0.01, 0.02, 3.2, 6)), this.darkSteelMat);
    whip.position.set(2.2, 5.6, -1.1);
    g.add(whip);
    // Rungs let into the side wall up to the roof.
    for (let i = 0; i < 9; i++) {
      const rung = new THREE.Mesh(this.own(new THREE.TorusGeometry(0.18, 0.018, 5, 10, Math.PI)), this.darkSteelMat);
      const ry = 0.5 + i * 0.38;
      const t = (ry) / 3.7;
      rung.position.set(2.6 * (1 - 0.07 * t) + 0.02, ry, -0.4);
      rung.rotation.set(0, Math.PI / 2, -Math.PI / 2);
      g.add(rung);
    }

    const leaf = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.0, 2.7, 0.14)), this.darkSteelMat
    );
    leaf.position.set(-2.48, 1.35, 1.72);
    leaf.rotation.x = -0.04;
    leaf.castShadow = tierAtLeast('T4');
    g.add(leaf);
    const wheel = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.34, 0.045, 8, 22)), this.darkSteelMat
    );
    wheel.position.set(-2.48, 1.35, 1.82);
    g.add(wheel);

    // The lamp over the doorway is lit: somebody works here now.
    const lampBar = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.5, 0.05, 0.05)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x2a251c, emissive: SODIUM, emissiveIntensity: 1.4, roughness: 0.6
      }))
    );
    lampBar.position.set(0, 2.64, 1.82);
    g.add(lampBar);

    const tag = placard('VLT-03', { w: 0.44, h: 0.17 });
    tag.position.set(1.18, 2.2, 1.68);
    g.add(tag);
    this.own(tag.geometry, tag.material, tag.material.map);

    // The bench the catalogue cards are worked on, stood out in the yard air.
    const bench = this.buildBench({
      width: 4.8, depth: 1.3, height: 0.95, kind: 'cards', plate: 'BN-03'
    });
    bench.group.position.set(0, 0, 2.2);
    g.add(bench.group);

    g.position.set(site.pos[0], y, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    this.registerBenchAnchor(site, g, bench, [0, 0, 2.2]);
  }

  /**
   * Site 4 — the Tally Floor. Sealed gantry once; now the floor itself is the
   * place: painted margin lines on the crust, a ledger board on posts behind
   * the bench, and canister crates stacked at the board's end.
   */
  initTallyFloor() {
    const site = this.data.sites.find(s => s.id === 'site-4');
    if (!site) return;
    const y = this.surfaceHeight(site.pos[0], site.pos[2]);
    const g = new THREE.Group();

    // The floor is marked, not built: paint lines on the crust, 5.6 x 3.6.
    const lineMat = this.own(new THREE.MeshStandardMaterial({ color: 0xb9ab8c, roughness: 0.95, metalness: 0 }));
    for (const [lx, lz, w, d] of [
      [0, -1.4, 5.6, 0.08], [0, 2.2, 5.6, 0.08],
      [-2.8, 0.4, 0.08, 3.6], [2.8, 0.4, 0.08, 3.6]
    ]) {
      const strip = new THREE.Mesh(this.own(new THREE.BoxGeometry(w, 0.02, d)), lineMat);
      strip.position.set(lx, 0.011, lz);
      g.add(strip);
    }

    // The ledger board: two posts, a plate, and the tally columns chalked on it.
    for (const px of [-1.6, 1.6]) {
      const post = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.1, 1.9, 0.1)), this.darkSteelMat
      );
      post.position.set(px, 0.95, -1.0);
      post.castShadow = tierAtLeast('T4');
      g.add(post);
    }
    const board = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(3.6, 1.05, 0.07)), this.plateMat
    );
    board.position.set(0, 1.42, -1.0);
    board.castShadow = tierAtLeast('T4');
    g.add(board);
    const chalkMat = this.own(new THREE.MeshStandardMaterial({ color: 0xcfc5ae, roughness: 1.0, metalness: 0 }));
    for (let c = 0; c < 7; c++) {
      const mark = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.035, 0.3, 0.012)), chalkMat);
      mark.position.set(-1.24 + c * 0.24, 1.42 + (c % 3) * 0.09, -0.955);
      mark.rotation.z = c % 2 ? 0.06 : -0.05;
      g.add(mark);
    }
    const tag = placard('TALLY-04', { w: 0.62, h: 0.2 });
    tag.position.set(0, 2.14, -0.955);
    g.add(tag);
    this.own(tag.geometry, tag.material, tag.material.map);

    // Canister crates waiting at the board's end.
    for (let i = 0; i < 2; i++) {
      const c = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.8, 0.6, 0.8)), this.crateMats[i % this.crateMats.length]
      );
      c.position.set(2.4, 0.3 + i * 0.62, -0.4);
      c.rotation.y = 0.0 + i * 0.28;
      c.castShadow = c.receiveShadow = tierAtLeast('T4');
      g.add(c);
    }

    // The bench, on the crust toward the yard.
    const bench = this.buildBench({
      width: 4.8, depth: 1.3, height: 0.95, kind: 'core', plate: 'BN-04'
    });
    bench.group.position.set(0, 0, 0.9);
    g.add(bench.group);

    g.position.set(site.pos[0], y, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    this.registerBenchAnchor(site, g, bench, [0, 0, 0.9]);
  }

  /**
   * Site 5 — the Hopper Gantry. Bulk salvage goes in the top, the chute runs
   * it over the deflector, and the catch bins underneath take one weight each.
   * The bench with the assay kit stands in front of the works.
   */
  initHopperGantry() {
    const site = this.data.sites.find(s => s.id === 'site-5');
    if (!site) return;
    const y = this.surfaceHeight(site.pos[0], site.pos[2]);
    const g = new THREE.Group();

    // Four H-section legs, braced in X on each face, carrying a tapered bin.
    // The legs run up past the neck to where the bin's wall meets them.
    const legGeo = this.own(iBeamGeometry(3.22, { h: 0.16, w: 0.12 }));
    for (const [px, pz] of [[-0.75, -2.1], [0.75, -2.1], [-0.75, -0.9], [0.75, -0.9]]) {
      const leg = new THREE.Mesh(legGeo, this.darkSteelMat);
      leg.position.set(px, 1.61, pz);
      leg.castShadow = tierAtLeast('T4');
      g.add(leg);
      const foot = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.3, 0.03, 0.3)), this.darkSteelMat);
      foot.position.set(px, 0.015, pz);
      g.add(foot);
    }
    const xLen = Math.hypot(1.5, 1.6);
    for (const pz of [-2.1, -0.9]) {
      for (const sgn of [-1, 1]) {
        const x = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.04, xLen, 0.04)), this.darkSteelMat);
        x.position.set(0, 1.05, pz);
        x.rotation.z = sgn * Math.atan2(1.5, 1.6);
        g.add(x);
      }
    }
    for (const px of [-0.75, 0.75]) {
      for (const sgn of [-1, 1]) {
        const x = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.04, Math.hypot(1.2, 1.6), 0.04)), this.darkSteelMat);
        x.position.set(px, 1.05, -1.5);
        x.rotation.x = sgn * Math.atan2(1.2, 1.6);
        g.add(x);
      }
    }
    // The bin: a square frustum, wide at the mouth, necking to the throat.
    const binGeo = this.own(new THREE.CylinderGeometry(1.3, 0.36, 1.25, 4, 1, true));
    binGeo.rotateY(Math.PI / 4);
    const body = new THREE.Mesh(binGeo, this.plateMat);
    body.material = this.plateMat;
    body.position.set(0, 2.95, -1.5);
    body.castShadow = body.receiveShadow = tierAtLeast('T4');
    g.add(body);
    const inner = new THREE.Mesh(binGeo, this.darkSteelMat.clone());
    this.own(inner.material);
    inner.material.side = THREE.BackSide;
    inner.position.copy(body.position);
    g.add(inner);
    // The ring frame the bin sits in, on the leg heads, and a stiffening band
    // round the mouth: each four members, never a slab over the opening.
    for (const [w, d, y] of [[1.66, 1.36, 3.2], [1.9, 1.9, 3.53]]) {
      for (const sgn of [-1, 1]) {
        const a = new THREE.Mesh(this.own(new THREE.BoxGeometry(w, 0.1, 0.08)), this.darkSteelMat);
        a.position.set(0, y, -1.5 + sgn * d / 2);
        g.add(a);
        const b = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.08, 0.1, d)), this.darkSteelMat);
        b.position.set(sgn * w / 2, y, -1.5);
        g.add(b);
      }
    }
    const throat = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.5, 0.5, 0.5)), this.darkSteelMat
    );
    throat.position.set(0, 2.05, -1.4);
    g.add(throat);
    const lid = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.0, 0.05, 1.8)), this.darkSteelMat
    );
    // Half the grille thrown back on its hinge.
    lid.position.set(-0.45, 3.62, -1.55);
    lid.rotation.z = 0.05;
    g.add(lid);

    const chute = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.55, 0.06, 2.4)), this.plateMat
    );
    chute.position.set(0, 1.42, -0.3);
    chute.rotation.x = 0.42;
    chute.castShadow = tierAtLeast('T4');
    g.add(chute);
    for (const rx of [-0.25, 0.25]) {
      const railChute = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.04, 0.09, 2.4)), this.darkSteelMat
      );
      railChute.position.set(rx, 1.47, -0.3);
      railChute.rotation.x = 0.42;
      g.add(railChute);
    }
    // The deflector comb across the middle of the run.
    const deflector = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.4, 0.3, 0.03)), this.darkSteelMat
    );
    deflector.position.set(0, 1.72, -0.55);
    deflector.rotation.x = 0.42;
    g.add(deflector);

    // Four catch bins in a row under the chute's mouth.
    for (let i = 0; i < 4; i++) {
      const bin = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.5, 0.42, 0.5)), this.bulkMat
      );
      bin.position.set(-1.05 + i * 0.7, 0.21, 1.05);
      bin.castShadow = bin.receiveShadow = tierAtLeast('T4');
      g.add(bin);
    }

    // The floor balance: post, dial drum, and pan.
    const post = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.12, 1.05, 0.12)), this.darkSteelMat
    );
    post.position.set(2.3, 0.53, 0.9);
    g.add(post);
    const dialDrum = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 18)), this.plateMat
    );
    dialDrum.rotation.z = Math.PI / 2;
    dialDrum.position.set(2.3, 1.18, 0.9);
    g.add(dialDrum);
    const pan = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.24, 0.2, 0.035, 18)), this.darkSteelMat
    );
    pan.position.set(2.3, 1.3, 0.9);
    g.add(pan);

    const tag = placard('GNT-05', { w: 0.5, h: 0.19 });
    tag.position.set(0, 3.05, -0.63);
    g.add(tag);
    this.own(tag.geometry, tag.material, tag.material.map);

    // The assay bench, out front where the certificates get worked.
    const bench = this.buildBench({
      width: 4.8, depth: 1.3, height: 0.95, kind: 'assay', plate: 'BN-05'
    });
    bench.group.position.set(0, 0, 2.3);
    g.add(bench.group);

    g.position.set(site.pos[0], y, site.pos[2]);
    g.rotation.y = this.siteFacing(site);
    this.scene.add(g);

    this.siteMarkers.set(site.questId, { site, group: g, indicator: bench.indicator });
    this.registerBenchAnchor(site, g, bench, [0, 0, 2.3]);
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

    // Bench furniture: you stand at a bench, you do not walk through it. A bench
    // is 4.8 m long and 1.3 m deep, so a single radius either leaves both ends
    // walk-through or seals the aisle beside it. Box colliders match the plate.
    push(-17.4, -12.6, 16.85, 18.15);   // site-1 bench (lean-to faces the yard)
    push(4.6, 9.4, -27.65, -26.35);     // site-2 bench (sub-level lab)
    // The lean-to's four posts. Thin, but a post you can walk through is worse
    // than no post at all, and they stand just clear of the bench at both ends.
    for (const px of [-17.95, -12.05]) {
      for (const pz of [15.15, 18.85]) {
        this.colliders.push({ x: px, z: pz, radius: 0.24 });
      }
    }
    this.colliders.push({ x: 3.55, z: -26.9, radius: 0.55 });  // lab equipment rack
    this.colliders.push({ x: 10.35, z: -27.0, radius: 0.48 }); // beam column
    this.colliders.push({ x: 25.0, z: 3.0, radius: 2.6 });     // vault blockhouse
    push(22.15, 23.45, 0.6, 5.4);           // site-3 bench, before the open vault
    push(-26.75, -25.45, -15.4, -10.6);     // site-4 tally bench
    push(-28.15, -27.85, -14.9, -11.1);     // site-4 ledger board
    this.colliders.push({ x: -27.2, z: -15.4, radius: 0.5 });  // tally crate stack
    push(5.25, 6.75, 27.9, 29.1);           // site-5 hopper legs
    push(4.7, 7.3, 30.8, 31.3);             // site-5 catch bins
    push(3.6, 8.4, 31.65, 32.95);           // site-5 bench
    this.colliders.push({ x: 8.3, z: 30.9, radius: 0.35 });    // site-5 balance post

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
      followTallowShadow(this.sunLight, cameraPos);
      if (this.renderer?.getDrawingBufferSize) {
        this._buf = this._buf || new THREE.Vector2();
        this.effects?.setViewportHeight(this.renderer.getDrawingBufferSize(this._buf).y);
      }
      this.effects?.update(delta, this.elapsed, cameraPos);
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
