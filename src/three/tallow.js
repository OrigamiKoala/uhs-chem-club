/**
 * tallow.js — Tallow: the abandoned salt-flat refinery. (Learn world 01)
 *
 * The companion to `world.js`. Erebus is an amber basin at low sun; Tallow is a
 * bleached salt pan under flat overcast, packed with sealed Imperial salvage and
 * an orbital buyer inbound. Same SCOURED PLATE world (CLAUDE.md §Aesthetic), a
 * different light and a different crust.
 *
 * WHAT IS HERE, AND WHY IT IS HERE
 * Four charted Unit 1 sites stand on the flat as physical places:
 *   site-1  Salvage Bench   — q1-grain, built. Under the lean-to in the yard.
 *   site-2  Core Bench      — q2-core, built. Down the stairwell, in the lab.
 *   site-3  Catalogue Vault — q3-catalogue, charted. A door that is dogged shut.
 *   site-4  Tally Floor     — q4-counting, charted. A gantry with its stair pulled.
 * The two unbuilt sites are walkable and readable and open nothing: this file
 * invents no content for quests that have not been written.
 *
 * PHYSICS: every prop declares a footprint in `tallow.json` and every footprint is
 * disjoint — no two objects occupy the same space, which `verify:tallow` proves by
 * computing the distances rather than trusting the layout. The sub-level is a real
 * excavation: the terrain mesh has a hole cut in it, the pit is built as geometry,
 * and `getTerrainHeight` resolves the ramp, so the player walks down instead of
 * being teleported under the ground.
 *
 * LIGHT: nothing here blooms. The sun is a broad overcast key with no disc; the
 * only emissive surfaces in the whole scene are sodium luminaires in the lab, the
 * mast's obstruction lamp, and one indicator per built site. That is the rule in
 * CLAUDE.md §4.2 and it is what keeps the flat looking like hardware rather than
 * like a screensaver.
 */

import * as THREE from 'three';
import tallowData from './world-data/tallow.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  saltHardpan, platedMetal, treadPlate, sedimentaryRock,
  buildMaterial, enableAO, addDetailNormal, addMacroVariation,
  texSize, heightField, heightToNormal, asDataTexture, fbm,
  boltRing, boltLine, weldBead, cableRun, pipeFlange, placard,
  hazardStripe, mergeStatic
} from './materials/pbr-kit.js';
import {
  createBleachedPlateTexture,
  createSalvageCrateTexture,
  createSealedDoorTexture
} from './materials/tallow-textures.js';

/* Deterministic layout noise: the refinery is the same refinery every visit. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A bare canvas, for the one texture this file draws itself. */
function canvas2dLocal(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** Sodium filament, from inside a thing. The one warm colour on the flat. */
const SODIUM = 0xd99423;

export class TallowWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = tallowData;
    this.scene = new THREE.Scene();

    this.colliders = [];
    this.siteMarkers = new Map();   // questId -> { indicator, group, site }
    // questId -> the physical frame of that site's working surface, so the
    // Learn instrument can be deployed onto the plate that is actually there
    // rather than onto a second bench conjured at the same coordinates.
    this.benchAnchors = new Map();
    this.nearbySite = null;
    this.dustParticles = null;
    this.disposables = [];
    this.lamps = [];
    this.elapsed = 0;

    this.sub = this.data.sublevel;

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
    this.initSealedSites();
    this.initDust();
    this.buildColliders();
    this.enableAmbientOcclusion();
  }

  /**
   * Turn on ambient occlusion everywhere it was generated.
   *
   * `aoMap` samples the SECOND uv set, which a primitive geometry does not have
   * — so a generated AO map is a silent no-op until the mesh is told to reuse
   * its own UVs for it. Rather than remember that at every one of the hundred
   * call sites below, it is done once, here, for anything whose material
   * actually carries one.
   *
   * Cavity occlusion is the cheapest realism in the whole world: it is what
   * makes a panel gap read as a gap rather than a dark line painted on a sheet.
   */
  enableAmbientOcclusion() {
    const done = new Set();
    this.scene.traverse(o => {
      if (!o.geometry || !o.material) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (!mats.some(m => m && m.aoMap)) return;
      if (done.has(o.geometry)) return;
      done.add(o.geometry);
      enableAO(o.geometry);
    });
  }

  /** Track a texture/geometry/material so dispose() can actually free it. */
  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /* ======================================================================
     LIGHT AND SKY
     Flat overcast. A salt pan under cloud has almost no directional shadow
     and a very bright ground bounce, which is the opposite of Erebus.
     ====================================================================== */

  initLighting() {
    const amb = this.data.ambience;

    // Ground bounce is the dominant light here: white crust throwing the sky
    // back up under everything. That upward fill is what makes salt read as salt.
    const hemi = new THREE.HemisphereLight(0xe8dcc2, 0xa89b82, 2.1);
    this.scene.add(hemi);

    const ambient = new THREE.AmbientLight(amb.fillLight, 0.9);
    this.scene.add(ambient);

    // The sun, diffused through overcast: broad, weak, barely a direction.
    this.sunLight = new THREE.DirectionalLight(amb.keyLight, 2.0);
    this.sunLight.position.set(-70, 58, 40);
    this.sunLight.target.position.set(0, 0, 0);
    this.scene.add(this.sunLight, this.sunLight.target);

    if (tierAtLeast('T4')) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(2048, 2048);
      this.sunLight.shadow.camera.near = 1;
      this.sunLight.shadow.camera.far = 220;
      const s = 70;
      this.sunLight.shadow.camera.left = -s;
      this.sunLight.shadow.camera.right = s;
      this.sunLight.shadow.camera.top = s;
      this.sunLight.shadow.camera.bottom = -s;
      this.sunLight.shadow.bias = -0.0006;
      this.sunLight.shadow.normalBias = 0.035;
    }

    // Cold back-fill from the open sky behind, kept warm-neutral so the palette
    // never drifts to the blue-black that CLAUDE.md §4.1 forbids.
    const back = new THREE.DirectionalLight(0x9a917e, 0.55);
    back.position.set(60, 26, -70);
    this.scene.add(back);

    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = new THREE.Color(amb.fogColor);
  }

  initSky() {
    // A haze dome, not a starfield: on Tallow the sky is the weather.
    const skyGeo = this.own(new THREE.SphereGeometry(340, 32, 24));
    const skyMat = this.own(new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        zenith: { value: new THREE.Color(0x8c8370) },
        horizon: { value: new THREE.Color(0xd3c8b0) },
        glare: { value: new THREE.Color(0xe9dcc0) },
        sunDir: { value: new THREE.Vector3(-70, 58, 40).normalize() }
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 zenith;
        uniform vec3 horizon;
        uniform vec3 glare;
        uniform vec3 sunDir;
        varying vec3 vWorld;
        void main() {
          vec3 dir = normalize(vWorld);
          float h = clamp(dir.y * 1.25, -1.0, 1.0);
          vec3 col = mix(horizon, zenith, pow(max(h, 0.0), 0.62));
          // Below the horizon the dome is simply the haze the terrain sits in.
          col = mix(col, horizon, clamp(-h * 2.4, 0.0, 1.0));
          // A broad, soft brightening where the sun is behind the cloud. No disc,
          // no bloom: overcast has a bright patch, not a lamp.
          float sd = max(dot(dir, normalize(sunDir)), 0.0);
          col = mix(col, glare, pow(sd, 3.5) * 0.55);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    }));
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    // `phys` tells the physics verifier what kind of thing this is. The sky is
    // not an object in the world; it is the world's backdrop, and it encloses
    // everything by design.
    skyMesh.userData.phys = 'ambient';
    this.scene.add(skyMesh);

    // Distant mesa silhouettes along the horizon, flattened into the haze so they
    // read as depth rather than as scenery you could ever walk to.
    const rand = mulberry32(0x3e11);
    const mesaMat = this.own(new THREE.MeshBasicMaterial({
      color: 0xb3a892, fog: false, side: THREE.DoubleSide, transparent: true, opacity: 0.75
    }));
    const mesaGroup = new THREE.Group();
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + rand() * 0.12;
      const dist = 250 + rand() * 45;
      const w = 22 + rand() * 60;
      const h = 4 + rand() * 11;
      const geo = this.own(new THREE.PlaneGeometry(w, h));
      const m = new THREE.Mesh(geo, mesaMat);
      m.position.set(Math.cos(a) * dist, h * 0.45, Math.sin(a) * dist);
      m.lookAt(0, h * 0.45, 0);
      mesaGroup.add(m);
    }
    mesaGroup.userData.phys = 'ambient';   // horizon silhouettes, not places
    this.scene.add(mesaGroup);
  }

  /* ======================================================================
     TERRAIN
     Cracked hardpan with a long shallow swell. The excavation footprint is
     cut out of the mesh entirely — the pit below is built as geometry, so
     its edges are machined and square rather than a stretched triangle.
     ====================================================================== */

  /** The open flat, before the excavation is considered. */
  surfaceHeight(x, z) {
    const max = this.data.terrain.maxHeight;
    // A salt pan is close to dead level; what relief there is comes from the
    // spoil ridges around the old pans and a very long swell across the flat.
    const swell =
      Math.sin(x * 0.0135) * Math.cos(z * 0.0119) * 0.42 +
      Math.sin(x * 0.031 + 1.7) * 0.2 +
      Math.cos(z * 0.027 - 0.6) * 0.18;
    const ridge = Math.max(0, Math.sin(x * 0.009 + z * 0.006)) * 0.34;
    const grain = Math.sin(x * 0.42) * Math.cos(z * 0.39) * 0.035;
    return (swell + ridge) * (max * 0.33) + grain;
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
    const [sx, sz] = this.data.terrain.size;
    // T4 draws the crust at full resolution; T3 halves it. Same shape, same
    // heights, fewer triangles — a fidelity difference, never a place difference.
    const seg = tierAtLeast('T4') ? 200 : 100;

    const geo = new THREE.PlaneGeometry(sx, sz, seg, seg);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.surfaceHeight(x, z));
    }
    pos.needsUpdate = true;

    // Cut the excavation out of the mesh. A triangle is dropped when its centre
    // falls inside the pit, which leaves a clean rectangular hole for the pit
    // geometry to fill instead of a funnel of stretched polygons.
    const index = geo.index;
    const kept = [];
    const rimPad = 0.02;
    const holeTest = (x, z) => {
      const r = this.sub.room;
      const s = this.sub.stair;
      const inR = x > r.minX - rimPad && x < r.maxX + rimPad && z > r.minZ - rimPad && z < r.maxZ + rimPad;
      const inS = x > s.minX - rimPad && x < s.maxX + rimPad && z > s.minZ - rimPad && z < s.maxZ + rimPad;
      return inR || inS;
    };
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
      const cx = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3;
      const cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
      if (holeTest(cx, cz)) continue;
      kept.push(a, b, c);
    }
    geo.setIndex(kept);
    geo.computeVertexNormals();
    this.own(geo);

    // THE CRUST, IN THREE LAYERS.
    //
    // A dry lakebed is a Worley cell field: the pan dries, shrinks, and tears
    // along the cell walls, and each plate between the tears curls up at its
    // rim. `saltHardpan` draws that once at 512 and every map — colour, normal,
    // roughness, ambient occlusion — comes off the same height field, so the
    // shadow in a crack belongs to that crack.
    //
    // One tile of anything repeats every eight metres across 240 m of ground,
    // and from standing height a repeat reads as printed paper no matter how
    // good the tile is. Two layers fix that and neither costs a draw call:
    // a DETAIL normal sampled far below the repeat, which is the grit a player
    // sees at their feet, and a MACRO variation sampled across the whole mesh
    // with no repeat at all, which is the slow drift of damp and dust that
    // makes one end of the pan a different colour from the other.
    const crust = saltHardpan({ size: texSize(512), seed: 4 });
    const mat = this.own(buildMaterial(crust, { repeat: 30, roughness: 1.0, metalness: 0.0 }));
    mat.normalScale.set(1.3, 1.3);
    mat.aoMapIntensity = 0.9;

    const gritHeight = heightField(texSize(256), (u, v) =>
      0.5 + (fbm(u * 34, v * 34, { octaves: 4, period: 34, seed: 0x9f1 }) - 0.5) * 0.9
    );
    this.gritNormal = asDataTexture(heightToNormal(gritHeight, 1.5), 1);
    this.own(this.gritNormal);
    addDetailNormal(mat, this.gritNormal, { scale: 7.5, strength: 0.42 });

    const macro = heightField(texSize(256), (u, v) =>
      fbm(u * 3, v * 3, { octaves: 5, period: 3, seed: 0x2ee })
    );
    this.macroMap = asDataTexture(macro, 1);
    this.macroMap.wrapS = this.macroMap.wrapT = THREE.ClampToEdgeWrapping;
    this.own(this.macroMap);
    addMacroVariation(mat, this.macroMap, { strength: 0.13, roughShift: 0.14 });

    enableAO(geo);
    this.terrainMesh = new THREE.Mesh(geo, mat);
    // The ground everything else stands on and is bedded into.
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.receiveShadow = tierAtLeast('T4');
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
    /*
     * FOUR METALS, ONE GENERATOR, FOUR AMOUNTS OF WEATHER.
     *
     * Every surface here comes out of `platedMetal`, which builds a plate the
     * way the real object acquired it: rolled steel, a pressed panel grid,
     * rivet lines along the seams, paint, paint worn off the high edges, and
     * rust blooming out of the bare metal and streaking downward with gravity.
     * The four differ almost entirely in the `weather` number — which is the
     * difference between a drum that has stood in the wind for forty years and
     * a handrail that people still hold.
     *
     * They are cached by key, so the four generators run once for the whole
     * world no matter how many props ask for them.
     */
    // RESOLUTION IS SPENT WHERE THE PLAYER'S FACE GOES.
    // `pale` is the bench top, the lean-to and the site plate — surfaces read
    // from half a metre — so it is drawn at full size. The drums, the columns
    // and the pipe runs are read from ten metres and across four repeats, and
    //256 there is indistinguishable from 512 while costing a quarter as much.
    // Generating everything at 512 is most of what a world costs to build.
    const pale = platedMetal({
      paint: '#9a9081', metal: '#6d6559', rust: '#7c4826',
      panels: 2, seed: 31, weather: 0.78, size: texSize(512)
    });
    const drum = platedMetal({
      paint: '#8e8371', metal: '#6a6153', rust: '#84492a',
      panels: 1, seed: 47, weather: 0.92, grain: 1.1, size: texSize(256)
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

    for (const lm of this.data.landmarks) {
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      const y = this.surfaceHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      switch (lm.asset) {
        case 'evaporator': node = this.buildEvaporator(lm.scale); break;
        case 'cracking-tower': node = this.buildCrackingTower(lm.scale); break;
        case 'pipe-bridge': node = this.buildPipeBridge(); break;
        case 'conveyor': node = this.buildConveyor(); break;
        case 'comms-mast': node = this.buildCommsMast(); break;
        case 'debris-field': node = this.buildDebrisField(lm.scale, lm.pos[0], lm.pos[2]); break;
        case 'stake-marker': node = this.buildStakeMarker(); break;
        default: node = null;
      }
      if (!node) continue;
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

  /** A brine evaporator: squat drum, skirt, cooling fins, service ladder. */
  buildEvaporator(scale = 1) {
    const g = new THREE.Group();
    const R = 3.4 * scale;
    const H = 7.2 * scale;

    const shell = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(R, R * 1.06, H, 28, 1, true)), this.drumMat
    );
    shell.position.y = H / 2;
    shell.castShadow = shell.receiveShadow = tierAtLeast('T4');
    g.add(shell);

    // Domed head, in section a proper torispherical cap rather than a ball.
    const cap = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(R, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.38)),
      this.drumMat
    );
    cap.position.y = H;
    cap.castShadow = tierAtLeast('T4');
    g.add(cap);

    // Skirt: the drum stands on a plated base ring, not on the crust.
    const skirt = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(R * 1.1, R * 1.16, 0.9 * scale, 28)), this.darkSteelMat
    );
    skirt.position.y = 0.45 * scale;
    skirt.castShadow = skirt.receiveShadow = tierAtLeast('T4');
    g.add(skirt);

    // Stiffener hoops.
    for (let i = 1; i <= 3; i++) {
      const hoop = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(R * 1.01, 0.09 * scale, 6, 28)), this.darkSteelMat
      );
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = (H / 4) * i;
      g.add(hoop);
    }

    // Cooling fins around the collar at two thirds height.
    const finGeo = this.own(new THREE.BoxGeometry(0.1 * scale, 0.7 * scale, 0.95 * scale));
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const fin = new THREE.Mesh(finGeo, this.darkSteelMat);
      fin.position.set(Math.cos(a) * R * 1.12, H * 0.66, Math.sin(a) * R * 1.12);
      fin.rotation.y = -a;
      fin.castShadow = tierAtLeast('T4');
      g.add(fin);
    }

    // Service ladder with real rungs and a back hoop: small detail, but it is
    // what gives the drum its scale when you stand at the foot of it.
    const ladder = new THREE.Group();
    const railGeo = this.own(new THREE.CylinderGeometry(0.045, 0.045, H * 0.92, 6));
    for (const dx of [-0.24, 0.24]) {
      const rail = new THREE.Mesh(railGeo, this.darkSteelMat);
      rail.position.set(dx, H * 0.46, 0);
      ladder.add(rail);
    }
    const rungGeo = this.own(new THREE.CylinderGeometry(0.028, 0.028, 0.48, 6));
    const rungs = Math.floor(H * 2.6);
    for (let i = 0; i < rungs; i++) {
      const rung = new THREE.Mesh(rungGeo, this.darkSteelMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, 0.35 + i * 0.36, 0);
      ladder.add(rung);
    }
    ladder.position.set(0, 0, R * 1.04);
    g.add(ladder);

    // Nozzle stubs with bolted flanges — vessels are nothing but penetrations.
    for (const [a, h] of [[0.6, 0.3], [2.4, 0.55], [4.1, 0.75]]) {
      const stub = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.22 * scale, 0.22 * scale, 0.8 * scale, 12)),
        this.pipeMat
      );
      stub.rotation.z = Math.PI / 2;
      stub.position.set(Math.cos(a) * R * 1.2, H * h, Math.sin(a) * R * 1.2);
      stub.rotation.y = -a;
      g.add(stub);

      // A flange is a bolted joint, and the bolts are the thing that says so.
      const flange = pipeFlange(0.22 * scale, this.darkSteelMat, this.darkSteelMat);
      flange.rotation.z = Math.PI / 2;
      flange.position.set(Math.cos(a) * R * 1.55, H * h, Math.sin(a) * R * 1.55);
      flange.rotation.y = -a;
      g.add(flange);
    }

    /* ---- the small parts ---- */

    // Weld beads where the shell courses meet. A pressure vessel is rolled in
    // courses and welded round, and the bead stands proud of the plate — a
    // circumferential seam is the clearest read of how a big drum was made.
    for (let i = 1; i <= 2; i++) {
      const ring = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(R * 1.004, 0.026 * scale, 5, 40)), this.pipeMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = (H / 3) * i + 0.1;
      g.add(ring);
    }

    // The ring of bolts holding the cap down onto the shell flange.
    const capRing = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(R * 1.05, R * 1.05, 0.14 * scale, 28)),
      this.darkSteelMat
    );
    capRing.position.y = H - 0.02;
    g.add(capRing);
    const capBolts = boltRing(R * 1.02, 24, this.darkSteelMat, { size: 0.05 * scale });
    capBolts.position.y = H + 0.06 * scale;
    g.add(capBolts);

    // Hazard striping round the skirt: the paint everyone walks into.
    const stripe = hazardStripe(R * 1.9, 0.28 * scale);
    stripe.position.set(0, 0.62 * scale, R * 1.172);
    g.add(stripe);
    this.own(stripe.geometry, stripe.material, stripe.material.map);

    // The vessel's number plate, at chest height beside the ladder.
    const tag = placard(`EV-${(Math.round(scale * 100) % 9) + 1}7`, { w: 0.46, h: 0.17 });
    tag.position.set(0.52, 1.5, R * 1.062);
    g.add(tag);
    this.own(tag.geometry, tag.material, tag.material.map);

    // A cable dropping from the instrument stub to a junction box on the skirt.
    const junction = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.26, 0.34, 0.18)), this.darkSteelMat
    );
    junction.position.set(-1.1, 1.2, R * 1.04);
    g.add(junction);
    const cable = cableRun(
      [Math.cos(2.4) * R * 1.5, H * 0.55, Math.sin(2.4) * R * 1.5],
      [-1.1, 1.36, R * 1.04],
      this.darkSteelMat,
      { sag: 0.9, radius: 0.022, segments: 16 }
    );
    g.add(cable);
    this.own(cable.userData.ownGeometry);

    return g;
  }

  /** A fractionating column: tall, banded, guyed, with a platform near the top. */
  buildCrackingTower(scale = 1) {
    const g = new THREE.Group();
    const R = 1.9 * scale;
    const H = 21 * scale;

    const col = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(R * 0.82, R, H, 20)), this.drumMat
    );
    col.position.y = H / 2;
    col.castShadow = col.receiveShadow = tierAtLeast('T4');
    g.add(col);

    const cap = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(R * 0.82, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.4)),
      this.drumMat
    );
    cap.position.y = H;
    g.add(cap);

    // Tray-level bands, the giveaway that it is a column and not a chimney.
    for (let i = 1; i < 9; i++) {
      const band = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(R * 0.93, 0.07 * scale, 6, 20)), this.darkSteelMat
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = (H / 9) * i;
      g.add(band);
    }

    // Access platform with a toe board and stanchion rail.
    const plat = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(R * 2.0, R * 2.0, 0.12, 20)), this.darkSteelMat
    );
    plat.position.y = H * 0.78;
    plat.castShadow = plat.receiveShadow = tierAtLeast('T4');
    g.add(plat);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const post = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6)), this.darkSteelMat
      );
      post.position.set(Math.cos(a) * R * 1.92, H * 0.78 + 0.5, Math.sin(a) * R * 1.92);
      g.add(post);
    }
    const ring = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(R * 1.92, 0.035, 6, 20)), this.darkSteelMat
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = H * 0.78 + 1.0;
    g.add(ring);

    // Guy wires, anchored out on the crust. Thin, dark, no shine.
    const wireMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x3a342c, roughness: 0.95, metalness: 0.4
    }));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const anchor = new THREE.Vector3(Math.cos(a) * 9 * scale, 0, Math.sin(a) * 9 * scale);
      const top = new THREE.Vector3(Math.cos(a) * R, H * 0.86, Math.sin(a) * R);
      const len = anchor.distanceTo(top);
      const wire = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.022, 0.022, len, 5)), wireMat
      );
      wire.position.copy(anchor.clone().add(top).multiplyScalar(0.5));
      wire.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        top.clone().sub(anchor).normalize()
      );
      g.add(wire);

      // A turnbuckle two thirds of the way up each guy: the part that tells you
      // the wire was tensioned by hand, by someone, once.
      const buckle = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 6)), this.darkSteelMat
      );
      const at = anchor.clone().lerp(top, 0.26);
      buckle.position.copy(at);
      buckle.quaternion.copy(wire.quaternion);
      g.add(buckle);
    }

    /* ---- the small parts ---- */

    // Every tray band is a bolted flange joint, not a painted stripe.
    for (let i = 1; i < 9; i += 2) {
      const bolts = boltRing(R * 0.95, 18, this.darkSteelMat, { size: 0.045 * scale });
      bolts.position.y = (H / 9) * i;
      g.add(bolts);
    }

    // A caged ladder the full height. The hoops are what stop a tall cylinder
    // reading as a chimney and start it reading as something people climbed.
    const ladder = new THREE.Group();
    const railGeo = this.own(new THREE.CylinderGeometry(0.04, 0.04, H * 0.8, 6));
    for (const dx of [-0.22, 0.22]) {
      const rail = new THREE.Mesh(railGeo, this.darkSteelMat);
      rail.position.set(dx, H * 0.4, 0);
      ladder.add(rail);
    }
    const rungGeo = this.own(new THREE.CylinderGeometry(0.024, 0.024, 0.44, 5));
    for (let i = 0; i < Math.floor(H * 2.2); i++) {
      const rung = new THREE.Mesh(rungGeo, this.darkSteelMat);
      rung.rotation.z = Math.PI / 2;
      rung.position.set(0, 0.4 + i * 0.36, 0);
      ladder.add(rung);
    }
    const hoopGeo = this.own(new THREE.TorusGeometry(0.38, 0.018, 5, 14, Math.PI * 1.35));
    for (let i = 0; i < Math.floor(H / 1.1); i++) {
      const hoop = new THREE.Mesh(hoopGeo, this.darkSteelMat);
      hoop.rotation.y = Math.PI / 2;
      hoop.rotation.z = -Math.PI * 0.17;
      hoop.position.set(0, 2.4 + i * 1.1, 0.16);
      ladder.add(hoop);
    }
    ladder.position.set(0, 0, R * 1.02);
    g.add(ladder);

    // The manway: a bolted oval door at working height, with a swing handle.
    const manway = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.46, 0.46, 0.1, 18)), this.darkSteelMat
    );
    manway.rotation.x = Math.PI / 2;
    manway.position.set(-R * 0.95, 1.85, 0.2);
    manway.rotation.z = Math.PI / 2;
    g.add(manway);
    const manBolts = boltRing(0.4, 12, this.darkSteelMat, { size: 0.035, axis: 'x' });
    manBolts.rotation.z = Math.PI / 2;
    manBolts.position.set(-R * 1.0, 1.85, 0.2);
    g.add(manBolts);

    const tag = placard('FR-04', { w: 0.5, h: 0.19 });
    tag.position.set(0.62, 2.4, R * 1.01);
    g.add(tag);
    this.own(tag.geometry, tag.material, tag.material.map);

    return g;
  }

  /** A pipe rack on piers: four runs, cable tray, and a sagged lagging wrap. */
  buildPipeBridge() {
    const g = new THREE.Group();
    const span = 26;
    const deckY = 5.2;

    for (const pz of [-span / 2 + 1, 0, span / 2 - 1]) {
      for (const px of [-1.5, 1.5]) {
        const pier = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.55, deckY, 0.55)), this.plateMat
        );
        pier.position.set(px, deckY / 2, pz);
        pier.castShadow = pier.receiveShadow = tierAtLeast('T4');
        g.add(pier);
        // Bolted base plate.
        const base = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.95, 0.12, 0.95)), this.darkSteelMat
        );
        base.position.set(px, 0.06, pz);
        g.add(base);
      }
      const brace = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(3.6, 0.22, 0.22)), this.darkSteelMat
      );
      brace.position.set(0, deckY - 0.4, pz);
      g.add(brace);
    }

    const pipeGeo = this.own(new THREE.CylinderGeometry(0.3, 0.3, span, 14));
    const lagGeo = this.own(new THREE.CylinderGeometry(0.38, 0.38, span * 0.34, 14));
    const offsets = [[-1.1, 0], [-0.35, 0.12], [0.4, 0], [1.15, 0.1]];
    offsets.forEach(([ox, oy], i) => {
      const pipe = new THREE.Mesh(pipeGeo, this.pipeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(ox, deckY + 0.4 + oy, 0);
      pipe.castShadow = tierAtLeast('T4');
      g.add(pipe);

      // One run still carries its lagging; the rest have lost theirs to the wind.
      if (i === 1) {
        const lag = new THREE.Mesh(lagGeo, this.own(new THREE.MeshStandardMaterial({
          color: 0xa89c86, roughness: 1.0, metalness: 0.0
        })));
        lag.rotation.x = Math.PI / 2;
        lag.position.set(ox, deckY + 0.4 + oy, -span * 0.22);
        g.add(lag);
      }
    });

    // Cable tray slung under the rack.
    const tray = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.7, 0.1, span)), this.darkSteelMat
    );
    tray.position.set(0, deckY - 0.15, 0);
    g.add(tray);

    return g;
  }

  /** A feed conveyor: trussed frame, head pulley, and a torn belt. */
  buildConveyor() {
    const g = new THREE.Group();
    const len = 22;
    const rise = 6.5;

    const frame = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.5, 0.45, len)), this.plateMat
    );
    frame.position.set(0, rise / 2 + 1.2, 0);
    frame.rotation.x = -Math.atan2(rise, len);
    frame.castShadow = frame.receiveShadow = tierAtLeast('T4');
    g.add(frame);

    // Truss diagonals along the underside.
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      const z = -len / 2 + t * len;
      const y = 1.2 + t * rise;
      const d = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.1, 0.1, 1.9)), this.darkSteelMat
      );
      d.position.set(0.6, y - 0.42, z);
      d.rotation.x = (i % 2 ? 0.7 : -0.7);
      g.add(d);
    }

    // Support legs, each on its own footing.
    for (const t of [0.12, 0.5, 0.88]) {
      const z = -len / 2 + t * len;
      const y = 1.2 + t * rise;
      for (const dx of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.22, y, 0.22)), this.darkSteelMat
        );
        leg.position.set(dx, y / 2, z);
        leg.castShadow = tierAtLeast('T4');
        g.add(leg);
      }
    }

    // Head pulley and its drive housing.
    const pulley = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.62, 0.62, 1.4, 16)), this.darkSteelMat
    );
    pulley.rotation.z = Math.PI / 2;
    pulley.position.set(0, 1.2 + rise, len / 2);
    g.add(pulley);
    const drive = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.8, 0.8, 0.7)), this.plateMat
    );
    drive.position.set(1.1, 1.2 + rise, len / 2);
    g.add(drive);

    return g;
  }

  /** The mast: lattice, dish, and a single obstruction lamp. */
  buildCommsMast() {
    const g = new THREE.Group();
    const H = 17;

    // Three-leg lattice with horizontal and diagonal bracing.
    const legMat = this.darkSteelMat;
    const legGeo = this.own(new THREE.CylinderGeometry(0.07, 0.09, H, 6));
    const legs = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const x = Math.cos(a) * 0.62;
      const z = Math.sin(a) * 0.62;
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, H / 2, z);
      leg.rotation.z = -x * 0.012;
      leg.rotation.x = z * 0.012;
      leg.castShadow = tierAtLeast('T4');
      g.add(leg);
      legs.push([x, z]);
    }
    const braceGeo = this.own(new THREE.CylinderGeometry(0.028, 0.028, 1.12, 5));
    for (let lvl = 1; lvl < 17; lvl++) {
      const y = lvl * (H / 17);
      for (let i = 0; i < 3; i++) {
        const [x1, z1] = legs[i];
        const [x2, z2] = legs[(i + 1) % 3];
        const b = new THREE.Mesh(braceGeo, legMat);
        b.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
        b.rotation.z = Math.PI / 2;
        b.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
        g.add(b);
      }
    }

    // Dish, canted off true — nobody has aligned it in decades.
    const dish = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(1.5, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.32)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x8b8171, roughness: 0.93, metalness: 0.3, side: THREE.DoubleSide
      }))
    );
    dish.position.set(0, H * 0.82, 0.9);
    dish.rotation.set(Math.PI * 0.62, 0, 0.22);
    dish.castShadow = tierAtLeast('T4');
    g.add(dish);

    const feed = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8)), legMat
    );
    feed.position.set(0, H * 0.82 + 0.5, 1.5);
    feed.rotation.x = Math.PI * 0.42;
    g.add(feed);

    // The obstruction lamp. It is a lamp, so it may be lit.
    const lampBody = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.15, 10, 8)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0xd99423, emissive: SODIUM, emissiveIntensity: 1.6, roughness: 0.55
      }))
    );
    lampBody.position.y = H + 0.2;
    // Kept out of the static bake: the obstruction lamp flickers, and a baked
    // one would be a painted dot.
    lampBody.userData.noMerge = true;
    g.add(lampBody);
    this.mastLamp = lampBody;

    return g;
  }

  /** T4 decoration: scattered plate offcuts and a tipped drum. Never blocks a route. */
  buildDebrisField(scale = 1, sx = 0, sz = 0) {
    const g = new THREE.Group();
    const rand = mulberry32(((sx * 73856093) ^ (sz * 19349663)) >>> 0);
    for (let i = 0; i < 7; i++) {
      const w = (0.5 + rand() * 1.5) * scale;
      const d = (0.4 + rand() * 1.2) * scale;
      const piece = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(w, 0.07, d)), this.plateMat
      );
      piece.position.set((rand() - 0.5) * 3.4, 0.04 + rand() * 0.05, (rand() - 0.5) * 3.4);
      piece.rotation.set((rand() - 0.5) * 0.3, rand() * Math.PI, (rand() - 0.5) * 0.3);
      piece.castShadow = piece.receiveShadow = true;
      g.add(piece);
    }
    const tipped = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.42 * scale, 0.42 * scale, 1.1 * scale, 14)),
      this.drumMat
    );
    tipped.rotation.z = Math.PI / 2;
    tipped.rotation.y = rand() * Math.PI;
    tipped.position.set(0.7, 0.42 * scale, -0.5);
    tipped.castShadow = true;
    g.add(tipped);
    return g;
  }

  /** T4 decoration: a survey stake with a wind-shredded flag. */
  buildStakeMarker() {
    const g = new THREE.Group();
    const stake = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6)), this.darkSteelMat
    );
    stake.position.y = 0.75;
    g.add(stake);
    const flag = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(0.34, 0.2)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x9a6a2a, roughness: 1.0, side: THREE.DoubleSide
      }))
    );
    flag.position.set(0.17, 1.38, 0);
    g.add(flag);
    return g;
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

  initSaltHeaps() {
    const heapMat = this.own(new THREE.MeshStandardMaterial({
      color: 0xd6cdb6, roughness: 1.0, metalness: 0.0, flatShading: true
    }));

    for (const lm of this.data.landmarks) {
      if (lm.asset !== 'salt-heap') continue;
      const s = lm.scale;
      // A dredged heap is a cone that has slumped: irregular, not a party hat.
      const geo = new THREE.ConeGeometry(4.6 * s, 3.1 * s, 13, 3);
      const pos = geo.attributes.position;
      const rand = mulberry32(((lm.pos[0] * 2654435761) ^ (lm.pos[2] * 40503)) >>> 0);
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + (rand() - 0.5) * 0.7 * s);
        pos.setY(i, pos.getY(i) + (rand() - 0.5) * 0.28 * s);
        pos.setZ(i, pos.getZ(i) + (rand() - 0.5) * 0.7 * s);
      }
      geo.computeVertexNormals();
      this.own(geo);

      const m = new THREE.Mesh(geo, heapMat);
      m.position.set(lm.pos[0], this.surfaceHeight(lm.pos[0], lm.pos[2]) + 1.5 * s, lm.pos[2]);
      m.rotation.y = lm.rotY;
      m.castShadow = m.receiveShadow = tierAtLeast('T4');
      this.scene.add(m);
    }
  }

  initPanRims() {
    // The old evaporation pans: a low bund wall and a floor of brighter crust.
    const bundMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x9b917c, roughness: 1.0, metalness: 0.0
    }));
    const panMat = this.own(new THREE.MeshStandardMaterial({
      color: 0xdcd4bf, roughness: 1.0, metalness: 0.0
    }));

    for (const lm of this.data.landmarks) {
      if (lm.asset !== 'pan-rim') continue;
      const s = lm.scale;
      const y = this.surfaceHeight(lm.pos[0], lm.pos[2]);
      const g = new THREE.Group();

      const bund = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(8.2 * s, 0.55 * s, 6, 26)), bundMat
      );
      bund.rotation.x = Math.PI / 2;
      bund.position.y = 0.2 * s;
      bund.receiveShadow = tierAtLeast('T4');
      g.add(bund);

      const floor = new THREE.Mesh(
        this.own(new THREE.CircleGeometry(8.0 * s, 26)), panMat
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0.035;
      floor.receiveShadow = tierAtLeast('T4');
      g.add(floor);

      g.position.set(lm.pos[0], y, lm.pos[2]);
      // An evaporation pan is a surface, not an obstacle: the crust runs under
      // it and props stand on it, exactly as they stand on the terrain.
      g.userData.phys = 'ground';
      this.scene.add(g);
    }
  }

  /** The derelict ore hauler, sunk to its axles in the crust. */
  initHauler() {
    const lm = this.data.landmarks.find(l => l.asset === 'hauler');
    if (!lm) return;
    const g = new THREE.Group();

    const hullPlate = createBleachedPlateTexture(512, '#8a7f6c', 'MM', 1);
    this.own(hullPlate.map, hullPlate.normalMap, hullPlate.roughnessMap);
    const hullMat = this.own(new THREE.MeshStandardMaterial({
      map: hullPlate.map, normalMap: hullPlate.normalMap, roughnessMap: hullPlate.roughnessMap,
      roughness: 0.96, metalness: 0.4
    }));

    // Wedge hull: wide flatbed forward, tapered nose, a cab set back.
    const bed = new THREE.Mesh(this.own(new THREE.BoxGeometry(5.6, 1.5, 12.5)), hullMat);
    bed.position.y = 1.5;
    bed.castShadow = bed.receiveShadow = tierAtLeast('T4');
    g.add(bed);

    const nose = new THREE.Mesh(this.own(new THREE.BoxGeometry(4.2, 1.1, 3.2)), hullMat);
    nose.position.set(0, 1.35, 7.4);
    nose.rotation.x = -0.14;
    nose.castShadow = tierAtLeast('T4');
    g.add(nose);

    const cab = new THREE.Mesh(this.own(new THREE.BoxGeometry(3.4, 2.1, 3.0)), hullMat);
    cab.position.set(0, 3.2, 4.2);
    cab.castShadow = tierAtLeast('T4');
    g.add(cab);

    // Cab glazing: dark, dusted over, no reflection worth the name.
    const glass = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.9, 1.0, 0.1)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x2b2822, roughness: 0.62, metalness: 0.2 }))
    );
    glass.position.set(0, 3.5, 2.72);
    g.add(glass);

    // Running gear: six wheels, the rear pair buried past the hub.
    const wheelGeo = this.own(new THREE.CylinderGeometry(1.15, 1.15, 0.95, 16));
    const wheelMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x312c26, roughness: 1.0, metalness: 0.1
    }));
    for (const [wz, sink] of [[4.6, 0], [0.4, 0.35], [-4.2, 0.8]]) {
      for (const wx of [-2.6, 2.6]) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 1.0 - sink, wz);
        w.castShadow = tierAtLeast('T4');
        g.add(w);
      }
    }

    // Bed cradles and a torn tarpaulin over the last load that never shipped.
    for (const cz of [-3.4, 0, 3.4]) {
      const cr = new THREE.Mesh(this.own(new THREE.BoxGeometry(5.0, 0.55, 0.28)), this.darkSteelMat);
      cr.position.set(0, 2.5, cz);
      g.add(cr);
    }
    const tarp = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(4.4, 0.12, 5.4)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x6d6250, roughness: 1.0 }))
    );
    tarp.position.set(0.2, 2.86, -1.4);
    tarp.rotation.z = 0.05;
    tarp.castShadow = tierAtLeast('T4');
    g.add(tarp);

    // Salt drifted against the windward flank.
    const drift = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(6.4, 0.9, 9.0)),
      this.own(new THREE.MeshStandardMaterial({ color: 0xd2c9b3, roughness: 1.0 }))
    );
    drift.position.set(-1.6, 0.3, -1.0);
    drift.rotation.z = 0.07;
    drift.receiveShadow = tierAtLeast('T4');
    g.add(drift);

    g.position.set(lm.pos[0], this.surfaceHeight(lm.pos[0], lm.pos[2]) - 0.55, lm.pos[2]);
    g.rotation.y = lm.rotY;
    g.rotation.z = 0.04;
    this.scene.add(g);
  }

  /** The buyer's pad: a plated apron, blast berms, markers and a windsock. */
  initLandingPad() {
    const lm = this.data.landmarks.find(l => l.asset === 'landing-pad');
    if (!lm) return;
    const g = new THREE.Group();

    const apron = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(8.0, 8.2, 0.3, 32)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x6a6153, roughness: 0.96, metalness: 0.35 }))
    );
    apron.position.y = 0.15;
    apron.receiveShadow = tierAtLeast('T4');
    g.add(apron);

    // Scorching at the centre where thrust has repeatedly hit the plate.
    const scorch = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(4.2, 32)),
      this.own(new THREE.MeshStandardMaterial({ color: 0x35302a, roughness: 1.0 }))
    );
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.y = 0.31;
    g.add(scorch);

    // Perimeter markers. Unlit: the pad is cold until the buyer is on final.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const mk = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.26, 0.4, 0.26)), this.darkSteelMat
      );
      mk.position.set(Math.cos(a) * 7.4, 0.5, Math.sin(a) * 7.4);
      mk.castShadow = tierAtLeast('T4');
      g.add(mk);
    }

    // Blast berms on two sides, built from the spoil.
    for (const a of [Math.PI * 0.25, Math.PI * 1.25]) {
      const berm = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(9.0, 1.5, 1.6)),
        this.own(new THREE.MeshStandardMaterial({ color: 0xb3aa93, roughness: 1.0 }))
      );
      berm.position.set(Math.cos(a) * 9.4, 0.75, Math.sin(a) * 9.4);
      berm.rotation.y = -a;
      berm.castShadow = berm.receiveShadow = tierAtLeast('T4');
      g.add(berm);
    }

    // Windsock: the one thing on Tallow that still moves on its own.
    const mast = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8)), this.darkSteelMat
    );
    mast.position.set(6.6, 2.2, -5.4);
    g.add(mast);
    const sock = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(0.28, 1.5, 10, 1, true)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x9c6a28, roughness: 1.0, side: THREE.DoubleSide
      }))
    );
    sock.rotation.z = Math.PI / 2;
    sock.position.set(7.4, 4.2, -5.4);
    g.add(sock);
    sock.userData.noMerge = true;   // it turns in the wind
    this.windsock = sock;

    g.position.set(lm.pos[0], this.surfaceHeight(lm.pos[0], lm.pos[2]), lm.pos[2]);
    this.scene.add(g);
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
    const { width = 4.8, depth = 1.3, height = 0.95 } = opts;
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
      this.own(new THREE.BoxGeometry(1.15, 0.78, 0.52)), this.plateMat
    );
    housing.position.set(0, height + 0.43, -0.16);
    housing.castShadow = housing.receiveShadow = tierAtLeast('T4');
    dormant.add(housing);

    const bezel = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.26, 0.035, 8, 26)), this.darkSteelMat
    );
    bezel.position.set(0, height + 0.5, 0.11);
    dormant.add(bezel);

    // The aperture face. Dark phosphor glass, not a screen: what it shows is the
    // instrument, and the instrument lives in its own scene (see scope3d.js).
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
    const tag = placard('BN-01', { w: 0.28, h: 0.11 });
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

    // The lean-to: four posts, a sagging roof plate, and a torn side sheet that
    // takes the worst of the wind off the bench.
    const postGeo = this.own(new THREE.BoxGeometry(0.16, 2.9, 0.16));
    for (const [px, pz] of [[-2.95, -1.85], [2.95, -1.85], [-2.95, 1.85], [2.95, 1.85]]) {
      const p = new THREE.Mesh(postGeo, this.darkSteelMat);
      p.position.set(px, 1.45, pz);
      p.castShadow = tierAtLeast('T4');
      g.add(p);
      const foot = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.34, 0.06, 0.34)), this.darkSteelMat
      );
      foot.position.set(px, 0.03, pz);
      g.add(foot);
    }

    const roof = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(6.5, 0.08, 4.1)), this.plateMat
    );
    roof.position.set(0, 2.95, 0);
    roof.rotation.x = 0.07;
    roof.castShadow = roof.receiveShadow = tierAtLeast('T4');
    g.add(roof);

    // Corrugation on the roof: ribs, so it is sheet and not a slab.
    for (let i = 0; i < 12; i++) {
      const rib = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.07, 0.05, 4.1)), this.darkSteelMat
      );
      rib.position.set(-3.03 + i * 0.55, 3.025, 0);
      rib.rotation.x = 0.07;
      g.add(rib);
    }

    const sheet = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(6.5, 1.9, 0.06)), this.plateMat
    );
    sheet.position.set(0, 1.9, -1.99);
    sheet.castShadow = sheet.receiveShadow = tierAtLeast('T4');
    g.add(sheet);

    // Bench under the lean-to, facing the yard.
    const bench = this.buildBench({ width: 4.8, depth: 1.3, height: 0.95 });
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

    const bench = this.buildBench({ width: 4.8, depth: 1.3, height: 0.95 });
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
   * The two charted-but-unbuilt sites. They are real places you can stand in
   * front of, and they open nothing — this file does not invent a quest that
   * has not been written.
   */
  initSealedSites() {
    const specs = [
      { id: 'site-3', code: '03', kind: 'vault' },
      { id: 'site-4', code: '04', kind: 'gantry' }
    ];

    for (const spec of specs) {
      const site = this.data.sites.find(s => s.id === spec.id);
      if (!site) continue;
      const y = this.surfaceHeight(site.pos[0], site.pos[2]);
      const g = new THREE.Group();

      const doorTex = createSealedDoorTexture(256, spec.code);
      this.own(doorTex.map, doorTex.normalMap, doorTex.roughnessMap);
      const doorMat = this.own(new THREE.MeshStandardMaterial({
        map: doorTex.map, normalMap: doorTex.normalMap, roughnessMap: doorTex.roughnessMap,
        roughness: 0.93, metalness: 0.42
      }));

      if (spec.kind === 'vault') {
        // A blockhouse cut into the yard's east wall, with a dogged blast door.
        const block = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(5.2, 4.0, 3.0)), this.plateMat
        );
        block.position.y = 2.0;
        block.castShadow = block.receiveShadow = tierAtLeast('T4');
        g.add(block);

        const door = new THREE.Mesh(this.own(new THREE.BoxGeometry(2.3, 2.7, 0.22)), doorMat);
        door.position.set(0, 1.35, 1.55);
        door.castShadow = tierAtLeast('T4');
        g.add(door);

        // The dogging wheel, and the frame it is set in.
        const wheel = new THREE.Mesh(
          this.own(new THREE.TorusGeometry(0.34, 0.045, 8, 22)), this.darkSteelMat
        );
        wheel.position.set(0, 1.35, 1.72);
        g.add(wheel);
        for (let i = 0; i < 4; i++) {
          const spoke = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.66, 0.04, 0.04)), this.darkSteelMat
          );
          spoke.position.set(0, 1.35, 1.72);
          spoke.rotation.z = (i / 4) * Math.PI;
          g.add(spoke);
        }
        const frame = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(2.7, 3.1, 0.14)), this.darkSteelMat
        );
        frame.position.set(0, 1.5, 1.48);
        g.add(frame);

        // Salt has grown across the sill. Nobody has opened this in a long time.
        const sill = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(2.6, 0.18, 0.7)),
          this.own(new THREE.MeshStandardMaterial({ color: 0xd4cbb5, roughness: 1.0 }))
        );
        sill.position.set(0, 0.09, 1.85);
        g.add(sill);
      } else {
        // A raised gantry platform whose access stair has been pulled and stacked
        // underneath it — the reason it cannot be reached.
        for (const [px, pz] of [[-2.2, -1.4], [2.2, -1.4], [-2.2, 1.4], [2.2, 1.4]]) {
          const leg = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.22, 4.2, 0.22)), this.darkSteelMat
          );
          leg.position.set(px, 2.1, pz);
          leg.castShadow = tierAtLeast('T4');
          g.add(leg);
        }
        const deckPlate = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(5.2, 0.16, 3.4)), this.plateMat
        );
        deckPlate.position.y = 4.28;
        deckPlate.castShadow = deckPlate.receiveShadow = tierAtLeast('T4');
        g.add(deckPlate);
        for (let i = 0; i < 12; i++) {
          const post = new THREE.Mesh(
            this.own(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 6)), this.darkSteelMat
          );
          const t = i / 12;
          post.position.set(-2.5 + t * 5.0, 4.86, i % 2 ? 1.6 : -1.6);
          g.add(post);
        }
        // The pulled stair, stacked on the crust.
        const stair = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(1.1, 0.4, 4.0)), this.darkSteelMat
        );
        stair.position.set(2.9, 0.2, 0.4);
        stair.rotation.y = 0.35;
        stair.castShadow = tierAtLeast('T4');
        g.add(stair);

        const plaque = new THREE.Mesh(this.own(new THREE.BoxGeometry(1.1, 1.4, 0.1)), doorMat);
        plaque.position.set(0, 1.5, 1.5);
        g.add(plaque);
      }

      g.position.set(site.pos[0], y, site.pos[2]);
      g.rotation.y = site.pos[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.scene.add(g);

      this.siteMarkers.set(site.questId, { site, group: g, indicator: null, sealed: true });
    }
  }

  /* ======================================================================
     ATMOSPHERE
     ====================================================================== */

  /**
   * Airborne dust, in two layers.
   *
   * ONE layer of particles always looks like particles. A real flat under wind
   * has motes hanging in the column, which drift slowly and are lit from every
   * side, and grit running along the surface, which moves several times faster
   * and stays inside the first metre. Separating the two is what makes the wind
   * legible: the player sees the ground moving past their boots while the haze
   * above barely shifts.
   *
   * The sprite is a soft round grain, not the square a default point draws.
   * A square particle is the single most recognisable "this is a game engine"
   * artefact there is.
   */
  initDust() {
    if (!tierAtLeast('T4')) return;   // T3 renders the same flat without particles.

    const grain = canvas2dLocal(64, 64);
    const gctx = grain.getContext('2d', { willReadFrequently: true });
    const grad = gctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    const sprite = this.own(new THREE.CanvasTexture(grain));
    sprite.colorSpace = THREE.SRGBColorSpace;

    const rand = mulberry32(0xd057);
    const density = this.data.ambience.dustDensity / 0.2;

    /** One drifting layer. `lift` is how high it hangs, `rate` how fast it runs. */
    const layer = (count, lift, rate, size, opacity, color) => {
      const positions = new Float32Array(count * 3);
      const speeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (rand() - 0.5) * 170;
        positions[i * 3 + 1] = rand() * lift;
        positions[i * 3 + 2] = (rand() - 0.5) * 170;
        speeds[i] = rate * (0.5 + rand());
      }
      const geo = this.own(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = this.own(new THREE.PointsMaterial({
        color, size, map: sprite, sizeAttenuation: true,
        transparent: true, opacity, depthWrite: false,
        blending: THREE.NormalBlending
      }));
      const pts = new THREE.Points(geo, mat);
      this.scene.add(pts);
      return { points: pts, speeds, lift };
    };

    // The hanging column: slow, pale, high.
    this.dustParticles = layer(Math.round(1100 * density), 16, 1.0, 0.075, 0.34, 0xd8cfb8);
    // The running surface: fast, warmer, and never more than a metre up.
    this.groundGrit = layer(Math.round(900 * density), 1.1, 3.4, 0.045, 0.3, 0xc8b894);
    this.dustSpeeds = this.dustParticles.speeds;
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
    this.colliders.push({ x: -27.0, z: -13.0, radius: 2.6 });  // gantry legs

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
   * The local coordinates below are the same ones the builders place their
   * piers and legs at — `buildPipeBridge` uses span 26 with piers a metre in
   * from each end, `buildConveyor` uses length 22 with legs at 0.12, 0.5 and
   * 0.88 of it.
   */
  supportPoints(lm) {
    const local = {
      'pipe-bridge': [[-1.5, -12], [1.5, -12], [-1.5, 0], [1.5, 0], [-1.5, 12], [1.5, 12]],
      'conveyor': [[-0.7, -8.36], [0.7, -8.36], [-0.7, 0], [0.7, 0], [-0.7, 8.36], [0.7, 8.36]]
    }[lm.asset];
    if (!local) return null;

    const cos = Math.cos(lm.rotY || 0);
    const sin = Math.sin(lm.rotY || 0);
    return local.map(([lx, lz]) => ({
      x: lm.pos[0] + lx * cos + lz * sin,
      z: lm.pos[2] - lx * sin + lz * cos,
      radius: 0.55
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

  /** The site the player is standing close enough to work at, or null. */
  findNearbySite(pos) {
    let best = null;
    let bestD = Infinity;
    for (const site of this.data.sites) {
      const d = Math.hypot(pos.x - site.pos[0], pos.z - site.pos[2]);
      // The bench has to be within arm's reach, and on the same floor: the lab
      // bench sits directly below part of the yard and must not be reachable
      // from up there.
      const sameLevel = Math.abs(pos.y - (site.pos[1] + 1.6)) < 2.6;
      if (d < 3.4 && sameLevel && d < bestD) {
        bestD = d;
        best = site;
      }
    }
    return best;
  }

  update(delta, cameraPos) {
    this.elapsed += delta;

    if (cameraPos) this.nearbySite = this.findNearbySite(cameraPos);

    // Dust drifts downwind and recycles at the far edge. The flat has a steady
    // wind; this is the only thing in the scene that moves on its own besides
    // the sock.
    for (const l of [this.dustParticles, this.groundGrit]) {
      if (!l) continue;
      const p = l.points.geometry.attributes.position;
      const arr = p.array;
      for (let i = 0; i < l.speeds.length; i++) {
        arr[i * 3] += l.speeds[i] * delta * 1.6;
        // Settling is proportional to speed, so the fast grit skips along the
        // surface and the slow motes hang; both recycle at the upwind edge.
        arr[i * 3 + 1] -= l.speeds[i] * delta * 0.12;
        if (arr[i * 3] > 85) arr[i * 3] = -85;
        if (arr[i * 3 + 1] < 0.04) arr[i * 3 + 1] = l.lift;
      }
      p.needsUpdate = true;
    }

    if (this.windsock) {
      this.windsock.rotation.y = Math.sin(this.elapsed * 0.6) * 0.18;
    }
    if (this.mastLamp) {
      // A slow filament flicker, not a strobe: the lamp is old, not alarming.
      this.mastLamp.material.emissiveIntensity =
        1.4 + Math.sin(this.elapsed * 1.7) * 0.18;
    }
  }

  dispose() {
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
