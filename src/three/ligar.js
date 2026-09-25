/**
 * ligar.js — Ligar: the basalt arch field. (Learn world 02)
 *
 * The third place in this product, and the second one you walk. Erebus is an
 * amber basin at low sun; Tallow is a bleached salt pan under flat overcast;
 * Ligar is a black stone quarry at dusk, under a smoke-brown sky, with three
 * natural arches striding away to the north that should have fallen a thousand
 * years ago and have not. Same SCOURED PLATE world (CLAUDE.md §Aesthetic), a
 * different rock and a different weather.
 *
 * WHY THE GROUND LOOKS LIKE THAT. A lava sheet cooling from the top down tears
 * itself into a honeycomb of vertical prisms, and each prism grows downward as
 * a column. So everything here is hexagonal: the pavement the player walks on
 * is the sawn-off tops of a column field, the walls of the cut are the columns
 * in section, the spoil is broken column, and the arches are the same jointing
 * carried round a curve. Nothing in this world is a rounded rock, because
 * nothing on a basalt flow is.
 *
 * WHAT IS HERE, AND WHY IT IS HERE
 * Four Unit 2 sites stand on the ground as physical places, one per bench:
 *   site-1  Arch Terrace  — q1-joins.   A cut stone terrace under a stone
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
 * measuring every pair of bodies in it. The cut is a real excavation: the
 * terrain mesh has a hole in it, the pit is built as geometry, and
 * `getTerrainHeight` resolves the ramp, so the player walks down.
 *
 * INSTANCED BODIES ARE STILL BODIES. A colonnade is one `InstancedMesh` holding
 * seventy columns; its geometry box is the UNIT column, so a check that read it
 * at face value would report a metre-wide box at the patch origin and miss
 * every real collision. Each instanced field therefore records its instances in
 * `userData.partBoxes`, which is the same channel `mergeStatic` uses, so the
 * overlap checker measures a column where the column actually is.
 *
 * LIGHT: nothing here blooms. The sun is low, red with dust and about to go;
 * the only emissive surfaces in the whole world are the forge in the tube, the
 * deck luminaires, the mast lamps and one indicator per bench. That is the rule
 * in CLAUDE.md §4.2 and it is what keeps the quarry looking like hardware.
 */

import * as THREE from 'three';
import ligarData from './world-data/ligar.json' with { type: 'json' };
import { tierAtLeast } from './tier.js';
import {
  platedMetal, treadPlate,
  buildMaterial, enableAO, addDetailNormal, addMacroVariation,
  texSize, heightField, heightToNormal, asDataTexture, fbm,
  boltRing, boltLine, weldBead, cableRun, pipeFlange, placard,
  hazardStripe, mergeStatic
} from './materials/pbr-kit.js';
import {
  basaltColumn, basaltPavement, scoriaGrit, lavaTubeWall, conveyorBelt
} from './materials/ligar-textures.js';

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

/**
 * Record an instanced field's instances as part boxes.
 *
 * WHY THIS EXISTS. `InstancedMesh.geometry.boundingBox` is the box of the UNIT
 * body, so an overlap check that takes it at face value measures one column at
 * the patch origin and reports nothing about the other sixty-nine. Writing the
 * per-instance boxes into `userData.partBoxes` — the same channel `mergeStatic`
 * writes when it bakes a prop — hands the checker the real bodies, in the
 * object's own local frame, and costs nothing at run time.
 *
 * @param {THREE.InstancedMesh} mesh a field whose matrices are already set
 */
function recordInstanceBoxes(mesh) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const unit = mesh.geometry.boundingBox;
  const m = new THREE.Matrix4();
  const boxes = [];
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m);
    boxes.push(unit.clone().applyMatrix4(m));
  }
  mesh.userData.partBoxes = boxes;
}

export class LigarWorld {
  constructor(renderer) {
    this.renderer = renderer;
    this.data = ligarData;
    this.scene = new THREE.Scene();

    this.colliders = [];
    this.siteMarkers = new Map();   // questId -> { indicator, group, site }
    // questId -> the physical frame of that site's working surface, so the
    // Learn instrument deploys onto the plate that is actually there rather
    // than onto a second bench conjured at the same coordinates.
    this.benchAnchors = new Map();
    this.dustParticles = null;
    this.disposables = [];
    this.lamps = [];
    this.elapsed = 0;

    this.sub = this.data.sublevel;
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
    this.initDust();
    this.buildColliders();
    this.enableAmbientOcclusion();
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
      enableAO(o.geometry);
    });
  }

  /** Track a texture/geometry/material so dispose() can actually free it. */
  own(...objs) {
    for (const o of objs) if (o && typeof o.dispose === 'function') this.disposables.push(o);
    return objs[0];
  }

  /* ======================================================================
     MATERIALS
     Five stone surfaces and four metals, built once for the whole world.
     ====================================================================== */

  initMaterials() {
    /* THE STONE. Resolution is spent where the player's face goes: the column
       face and the pavement are read from half a metre and get the full size;
       the tube wall and the belt are read across a room and do not. */
    const col = basaltColumn({ size: texSize(512), seed: 11 });
    this.basaltMat = this.own(buildMaterial(col, { repeat: [1, 2], roughness: 1.0 }));
    this.basaltMat.normalScale.set(1.35, 1.35);
    this.basaltMat.aoMapIntensity = 1.0;

    // A second cut of the same stone, warmer and more weathered, so an arch and
    // a colonnade are not the same object at two sizes.
    const col2 = basaltColumn({
      size: texSize(256), seed: 23, warm: '#7a6a56', cool: '#33302c'
    });
    this.archMat = this.own(buildMaterial(col2, { repeat: [2, 3], roughness: 1.0 }));
    this.archMat.normalScale.set(1.2, 1.2);

    const tube = lavaTubeWall({ size: texSize(256), seed: 14 });
    this.tubeMat = this.own(buildMaterial(tube, { repeat: [3, 2], roughness: 1.0 }));
    this.tubeMat.normalScale.set(1.3, 1.3);

    const scoria = scoriaGrit({ size: texSize(256), seed: 13 });
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

    /* ONE HEXAGON, SHARED BY EVERY COLUMN IN THE WORLD.
       A unit prism a metre tall and a metre across the flats, scaled per
       instance. Flat-shaded on purpose: a basalt prism has six faces and five
       hard edges, and smoothing them would turn the whole world into pipes. */
    this.hexGeo = this.own(new THREE.CylinderGeometry(0.5, 0.48, 1, 6, 1));
    this.hexGeo.computeBoundingBox();
  }

  /* ======================================================================
     LIGHT AND SKY
     Low sun, thick with dust, about twenty minutes from going. Long shadows
     off every column, and a ground bounce the colour of wet stone.
     ====================================================================== */

  initLighting() {
    const amb = this.data.ambience;

    // Sky fill off a dark ground: much weaker than Tallow's, because black
    // stone throws almost nothing back. The quarry is a dark place.
    const hemi = new THREE.HemisphereLight(0xa08a6e, 0x33302c, 1.15);
    this.scene.add(hemi);

    const ambient = new THREE.AmbientLight(amb.fillLight, 0.55);
    this.scene.add(ambient);

    // THE SUN, low and to the west, reddened by the dust it is shining through.
    // Low enough that every column lays a shadow the length of itself, which is
    // the single thing that makes a colonnade read as a colonnade.
    this.sunLight = new THREE.DirectionalLight(amb.keyLight, 2.5);
    this.sunLight.position.set(-96, 26, 58);
    this.sunLight.target.position.set(0, 0, 0);
    this.scene.add(this.sunLight, this.sunLight.target);

    if (tierAtLeast('T4')) {
      this.sunLight.castShadow = true;
      this.sunLight.shadow.mapSize.set(2048, 2048);
      this.sunLight.shadow.camera.near = 1;
      this.sunLight.shadow.camera.far = 260;
      const s = 76;
      this.sunLight.shadow.camera.left = -s;
      this.sunLight.shadow.camera.right = s;
      this.sunLight.shadow.camera.top = s;
      this.sunLight.shadow.camera.bottom = -s;
      // A low sun grazes every surface, which is exactly when shadow acne
      // appears. The normal bias is what keeps the column faces clean.
      this.sunLight.shadow.bias = -0.0005;
      this.sunLight.shadow.normalBias = 0.05;
    }

    // Cold counter-fill out of the dark half of the sky, kept warm-neutral so
    // the palette never drifts to the blue-black CLAUDE.md §4.1 forbids.
    const back = new THREE.DirectionalLight(0x6d6455, 0.45);
    back.position.set(70, 34, -80);
    this.scene.add(back);

    this.scene.fog = new THREE.Fog(amb.fogColor, amb.fogNear, amb.fogFar);
    this.scene.background = new THREE.Color(amb.fogColor);
  }


  initSky() {
    /*
     * Dusk over a quarry. Three bands and a plume:
     *   - a dark smoke-brown roof, because the day is nearly over;
     *   - a low band of dirty gold sitting on the horizon;
     *   - a warm flare where the sun actually is, in the west, with NO DISC.
     * A disc would be a lamp in the sky and would bloom, and nothing in this
     * product blooms (CLAUDE.md §4.2). What a dusty sunset has is a broad
     * brightening, which is what this draws.
     */
    const skyGeo = this.own(new THREE.SphereGeometry(360, 36, 26));
    const skyMat = this.own(new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        zenith: { value: new THREE.Color(0x2b2620) },
        horizon: { value: new THREE.Color(0x7d6650) },
        glare: { value: new THREE.Color(0xd8a463) },
        smoke: { value: new THREE.Color(0x1f1c19) },
        sunDir: { value: new THREE.Vector3(-96, 26, 58).normalize() }
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
        uniform vec3 smoke;
        uniform vec3 sunDir;
        varying vec3 vWorld;

        // Cheap value noise, for the smoke band only. Two octaves is plenty at
        // this scale and the sky is drawn every frame.
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }

        void main() {
          vec3 dir = normalize(vWorld);
          float h = clamp(dir.y * 1.3, -1.0, 1.0);
          vec3 col = mix(horizon, zenith, pow(max(h, 0.0), 0.5));
          col = mix(col, horizon, clamp(-h * 2.6, 0.0, 1.0));

          // The sun's quarter of the sky, broad and soft.
          float sd = max(dot(dir, normalize(sunDir)), 0.0);
          col = mix(col, glare, pow(sd, 2.2) * 0.62);

          // Stack smoke, drifting across the upper sky in one direction.
          float band = smoothstep(0.06, 0.5, dir.y) * (1.0 - smoothstep(0.5, 0.95, dir.y));
          float n = noise(dir.xz * 5.0) * 0.6 + noise(dir.xz * 13.0) * 0.4;
          col = mix(col, smoke, band * smoothstep(0.52, 0.86, n) * 0.55);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    }));
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    // The sky is not an object in the world; it is the world's backdrop, and it
    // encloses everything by design. `phys` is what tells the checker so.
    skyMesh.userData.phys = 'ambient';
    this.scene.add(skyMesh);

    /* THE HORIZON. Not mesas — this is a lava province, so what stands on the
       skyline is more colonnade: long low benches of columnar stone stepping
       away into the haze, drawn flat so they read as distance rather than as
       somewhere you could walk to. */
    const rand = mulberry32(0x7b31);
    const ridgeMat = this.own(new THREE.MeshBasicMaterial({
      color: 0x4c443a, fog: false, side: THREE.DoubleSide,
      transparent: true, opacity: 0.85
    }));
    const ridgeGroup = new THREE.Group();
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + rand() * 0.1;
      const dist = 258 + rand() * 50;
      const w = 26 + rand() * 66;
      const h = 5 + rand() * 13;
      // A stepped silhouette: three benches of column, each shorter than the
      // one below it. A smooth hill would be the wrong planet.
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2, 0);
      const steps = 3 + Math.floor(rand() * 3);
      let x = -w / 2;
      let y = 0;
      for (let s = 0; s < steps; s++) {
        y = h * (0.35 + 0.65 * (rand() * 0.4 + s / steps));
        shape.lineTo(x, y);
        x += w / steps;
        shape.lineTo(x, y);
      }
      shape.lineTo(w / 2, 0);
      shape.closePath();
      const geo = this.own(new THREE.ShapeGeometry(shape));
      const m = new THREE.Mesh(geo, ridgeMat);
      m.position.set(Math.cos(a) * dist, 0, Math.sin(a) * dist);
      m.lookAt(0, 0, 0);
      ridgeGroup.add(m);
    }
    ridgeGroup.userData.phys = 'ambient';   // horizon silhouettes, not places
    this.scene.add(ridgeGroup);
  }

  /* ======================================================================
     TERRAIN
     A worn plateau of sawn-off column tops, dished in the middle where the
     quarry is and lifting to stepped benches at the edges. The excavation is
     cut out of the mesh entirely — the cut below is built as geometry, so its
     walls are stone in section rather than a funnel of stretched triangles.
     ====================================================================== */

  /** The open flat, before the excavation is considered. */
  surfaceHeight(x, z) {
    const max = this.data.terrain.maxHeight;
    // A quarried plateau is close to level where the work is; what relief there
    // is comes from a long swell across the flow and from the spoil that has
    // been pushed to the edges over forty years.
    const swell =
      Math.sin(x * 0.0112) * Math.cos(z * 0.0131) * 0.5 +
      Math.sin(x * 0.027 + 1.1) * 0.22 +
      Math.cos(z * 0.023 - 0.4) * 0.2;
    const shelf = Math.max(0, Math.sin(x * 0.007 + z * 0.005)) * 0.3;
    // The ground lifts away toward the horizon benches, quadratically, so the
    // working floor stays flat and the rise happens out where nothing stands.
    const out = Math.max(0, (Math.hypot(x, z) - 58) / 42);
    const rise = Math.min(1, out) * Math.min(1, out);
    // Column tops: a very shallow polygonal tooth, so even the bare ground has
    // the hexagonal grain the rest of the world is made of.
    const grain = Math.sin(x * 1.9) * Math.cos(z * 1.7) * 0.022;
    return (swell + shelf) * (max * 0.2) + rise * max * 0.78 + grain;
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
      // head takes the crust's own height at the mouth, so there is no step
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
   * deck sank sixteen centimetres into the plate — two objects in one place,
   * one of them the player.
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

  initTerrain() {
    const [sx, sz] = this.data.terrain.size;
    // T4 draws the pavement at full resolution; T3 halves it. Same shape, same
    // heights, fewer triangles — a fidelity difference, never a place one.
    const seg = tierAtLeast('T4') ? 200 : 100;

    const geo = new THREE.PlaneGeometry(sx, sz, seg, seg);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, this.surfaceHeight(pos.getX(i), pos.getZ(i)));
    }
    pos.needsUpdate = true;

    // Cut the excavation out of the mesh. A triangle is dropped when its centre
    // falls inside the cut, which leaves a clean rectangular hole for the pit
    // geometry to fill rather than a funnel of stretched polygons.
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

    /* THE PAVEMENT, IN THREE LAYERS.
     *
     * The tile is `basaltPavement` — a Worley cell field whose joints are the
     * polygon walls of the column tops, with the dust that has blown into them
     * making the joints LIGHTER than the stone. Every map comes off the same
     * height field, so the shadow in a joint belongs to that joint.
     *
     * One tile of anything repeats every eight metres across 240 m of ground,
     * and from standing height a repeat reads as printed paper no matter how
     * good the tile is. Two more layers fix it and neither costs a draw call:
     * a DETAIL normal sampled far below the repeat, which is the grit under the
     * player's boots, and a MACRO variation sampled across the whole mesh with
     * no repeat at all, which is the slow drift of dust and damp that makes one
     * end of the quarry a different colour from the other.
     */
    const pave = basaltPavement({ size: texSize(512), seed: 12 });
    const mat = this.own(buildMaterial(pave, { repeat: 28, roughness: 1.0, metalness: 0.0 }));
    mat.normalScale.set(1.35, 1.35);
    mat.aoMapIntensity = 1.0;

    const gritHeight = heightField(texSize(256), (u, v) =>
      0.5 + (fbm(u * 38, v * 38, { octaves: 4, period: 38, seed: 0xb17 }) - 0.5) * 0.95
    );
    this.gritNormal = asDataTexture(heightToNormal(gritHeight, 1.6), 1);
    this.own(this.gritNormal);
    addDetailNormal(mat, this.gritNormal, { scale: 8.5, strength: 0.46 });

    const macro = heightField(texSize(256), (u, v) =>
      fbm(u * 3, v * 3, { octaves: 5, period: 3, seed: 0x5ac })
    );
    this.macroMap = asDataTexture(macro, 1);
    this.macroMap.wrapS = this.macroMap.wrapT = THREE.ClampToEdgeWrapping;
    this.own(this.macroMap);
    addMacroVariation(mat, this.macroMap, { strength: 0.16, roughShift: 0.1 });

    enableAO(geo);
    this.terrainMesh = new THREE.Mesh(geo, mat);
    // The ground everything else stands on and is bedded into.
    this.terrainMesh.userData.phys = 'ground';
    this.terrainMesh.receiveShadow = tierAtLeast('T4');
    this.scene.add(this.terrainMesh);

    // THE WORKING FLOOR. A scoria apron laid over the pavement where the plant
    // is, so the yard reads as trafficked ground rather than as bare rock. It
    // is a SURFACE, not a body — `phys: 'ground'`, the same as the pavement it
    // is spread on, or every prop standing on it would report a collision.
    //
    // IT CARRIES THE SAME HOLE THE PAVEMENT DOES. The apron is wide enough to
    // reach the cut, and an apron drawn straight across it would be a sheet of
    // grit hanging over a five-metre drop — the excavation would still be there
    // underneath and the player would walk out over nothing.
    const AP = { cx: 10, cz: 2, w: 66, d: 70 };
    const apronGeo = new THREE.PlaneGeometry(AP.w, AP.d, 40, 42);
    apronGeo.rotateX(-Math.PI / 2);
    const ap = apronGeo.attributes.position;
    for (let i = 0; i < ap.count; i++) {
      const wx = ap.getX(i) + AP.cx;
      const wz = ap.getZ(i) + AP.cz;
      ap.setY(i, this.surfaceHeight(wx, wz) + 0.03);
    }
    ap.needsUpdate = true;
    {
      const idx = apronGeo.index;
      const keep = [];
      const pad = 0.4;
      const r = this.sub.room;
      const st = this.sub.stair;
      for (let i = 0; i < idx.count; i += 3) {
        const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
        const x = (ap.getX(a) + ap.getX(b) + ap.getX(c)) / 3 + AP.cx;
        const z = (ap.getZ(a) + ap.getZ(b) + ap.getZ(c)) / 3 + AP.cz;
        const inR = x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;
        const inS = x > st.minX - pad && x < st.maxX + pad && z > st.minZ - pad && z < st.maxZ + pad;
        if (inR || inS) continue;
        keep.push(a, b, c);
      }
      apronGeo.setIndex(keep);
    }
    apronGeo.computeVertexNormals();
    this.own(apronGeo);
    enableAO(apronGeo);
    const apron = new THREE.Mesh(apronGeo, this.scoriaMat);
    apron.position.set(AP.cx, 0, AP.cz);
    apron.userData.phys = 'ground';
    apron.receiveShadow = tierAtLeast('T4');
    this.scene.add(apron);
  }

  /* ======================================================================
     THE CUT
     An open excavation down into the flow. Its walls are the thing that makes
     Ligar Ligar: the quarry has cut THROUGH the colonnade, so what is exposed
     on all four sides is column in section, standing shoulder to shoulder from
     the floor to the lip, broken off at different heights where the face has
     spalled. At the far end the cut has opened a lava tube, and the forge is
     inside it.
     ====================================================================== */

  /**
   * One wall of the cut, built as a rank of hexagonal prisms.
   *
   * `dir` is which way the wall faces into the pit, as a unit vector: the
   * columns are packed along the wall's run and pushed a little way back into
   * the rock so the face is ragged rather than ruled.
   */
  buildCutFace(ax, az, bx, bz, dirX, dirZ, floorY, seedKey) {
    const rand = mulberry32(seedKey >>> 0);
    const run = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / run;
    const uz = (bz - az) / run;

    // Columns are packed across the flats, in two ranks — a face of basalt is
    // not one row of prisms, it is a mass of them, and the second rank is what
    // shows through the gaps the first one leaves.
    const cols = [];
    for (let rank = 0; rank < 2; rank++) {
      const pitch = 0.92;
      const n = Math.max(2, Math.floor(run / pitch));
      for (let i = 0; i <= n; i++) {
        const t = (i + (rank === 1 ? 0.5 : 0)) / n;
        if (t > 1.001) continue;
        const along = t * run;
        // The rock behind the face: rank 1 stands back, so the wall has depth.
        const back = (rank === 0 ? 0.0 : 0.62) + rand() * 0.22;
        const jitterAlong = (rand() - 0.5) * 0.24;
        const r = 0.42 + rand() * 0.16;
        // Height: the wall is cut to the lip, but the top has spalled, so each
        // column ends somewhere between two thirds and a little proud of it.
        const lipY = this.surfaceHeight(ax + ux * along, az + uz * along);
        const full = lipY - floorY;
        const h = full * (rank === 0 ? 0.72 + rand() * 0.34 : 0.86 + rand() * 0.26);
        cols.push({
          x: ax + ux * (along + jitterAlong) - dirX * back,
          z: az + uz * (along + jitterAlong) - dirZ * back,
          y: floorY + h / 2,
          r, h,
          // A column in a cooling sheet is not perfectly vertical; it follows
          // the cooling front, which curves. A degree or two of lean is the
          // difference between stone and a bundle of pipes.
          tilt: (rand() - 0.5) * 0.07,
          spin: rand() * Math.PI
        });
      }
    }

    const mesh = new THREE.InstancedMesh(this.hexGeo, this.basaltMat, cols.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    cols.forEach((c, i) => {
      e.set(c.tilt, c.spin, c.tilt * 0.6);
      q.setFromEuler(e);
      pos.set(c.x, c.y, c.z);
      scale.set(c.r * 2, c.h, c.r * 2);
      m.compose(pos, q, scale);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = mesh.receiveShadow = tierAtLeast('T4');
    mesh.frustumCulled = false;
    recordInstanceBoxes(mesh);
    return mesh;
  }

  initCut() {
    const r = this.sub.room;
    const st = this.sub.stair;
    const fy = this.sub.floorY;

    const cut = new THREE.Group();
    cut.name = 'the-cut';
    // The excavation is a PLACE, not a prop: its walls and floor are the ground
    // down here, and everything standing in the pit is bedded into them.
    cut.userData.phys = 'ground';
    this.scene.add(cut);

    /* THE FLOOR. Crushed column, driven over until it is level, with the drill
       pattern of the last bench still faintly in it. */
    const floorGeo = this.own(new THREE.PlaneGeometry(
      r.maxX - r.minX, r.maxZ - r.minZ, 26, 20
    ));
    floorGeo.rotateX(-Math.PI / 2);
    const fp = floorGeo.attributes.position;
    const frand = mulberry32(0x40c1);
    for (let i = 0; i < fp.count; i++) {
      fp.setY(i, (frand() - 0.5) * 0.05);
    }
    fp.needsUpdate = true;
    floorGeo.computeVertexNormals();
    enableAO(floorGeo);
    const floor = new THREE.Mesh(floorGeo, this.scoriaMat);
    floor.position.set((r.minX + r.maxX) / 2, fy, (r.minZ + r.maxZ) / 2);
    floor.receiveShadow = tierAtLeast('T4');
    cut.add(floor);

    /* THE FOUR WALLS, in section. The near wall is split around the ramp mouth,
       which is what makes the ramp the only way down. */
    /* THE TUBE IS INSIDE THE CUT, NOT BEHIND IT.
       The quarry opened a lava tube at this end, and the forge is in it — but a
       chamber built the far side of the far wall would be outside the
       excavation rectangle, where `getTerrainHeight` answers with the surface
       five metres overhead. The player would walk at the wall and be lifted
       through it. So the tube is roofed over the FAR PORTION OF THE FLOOR: the
       floor under it is the floor, the wall behind it is the wall, and its
       mouth is an arch you duck through, standing in the pit. */
    this.tube = { minX: -11.0, maxX: -1.0, minZ: r.minZ, maxZ: -21.5 };
    cut.add(this.buildCutFace(r.minX, r.minZ, r.maxX, r.minZ, 0, 1, fy, 0x11a1));   // far
    cut.add(this.buildCutFace(r.minX, r.minZ, r.minX, r.maxZ, 1, 0, fy, 0x22b2));   // west
    cut.add(this.buildCutFace(r.maxX, r.minZ, r.maxX, r.maxZ, -1, 0, fy, 0x33c3));  // east
    cut.add(this.buildCutFace(r.minX, r.maxZ, st.minX, r.maxZ, 0, -1, fy, 0x44d4)); // near, west of ramp
    cut.add(this.buildCutFace(st.maxX, r.maxZ, r.maxX, r.maxZ, 0, -1, fy, 0x55e5)); // near, east of ramp

    /* THE RAMP. A cut in the rock with a plated running surface laid in it, a
       handrail down the drop side, and the rock face on the other. */
    // Part of the cut, not a thing standing in it: the ramp is how the ground
    // gets from up there to down here, so it belongs to the same body.
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
    deck.receiveShadow = tierAtLeast('T4');
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

    // Handrail down the open side, stanchions bolted through the deck.
    const railX = st.maxX - 0.14;
    for (let i = 0; i <= steps; i += 2) {
      const t = i / steps;
      const post = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.035, 0.035, 1.05, 8)), this.pipeMat
      );
      post.position.set(railX, headY - drop * t + 0.52, st.maxZ - runZ * t);
      post.castShadow = tierAtLeast('T4');
      ramp.add(post);
    }
    for (const railY of [1.02, 0.56]) {
      const rail = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.028, 0.028, deckLen, 8)), this.pipeMat
      );
      rail.rotation.set(Math.PI / 2 - pitch, 0, 0);
      rail.position.set(
        railX, (headY + fy) / 2 + railY, (st.minZ + st.maxZ) / 2
      );
      ramp.add(rail);
    }

    // The rock the ramp is cut into, on its other side.
    ramp.add(this.buildCutFace(st.minX, st.minZ, st.minX, st.maxZ, 1, 0, fy - 0.4, 0x66f6));

    // Hazard striping across the head of the ramp, painted on the pavement.
    const stripe = hazardStripe(deckW, 0.5, { pitch: 0.2 });
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set((st.minX + st.maxX) / 2, headY + 0.03, st.maxZ + 0.34);
    ramp.add(stripe);
    this.own(stripe.geometry, stripe.material, stripe.material.map);

    /* THE LIP. A rolled kerb round the open edges of the cut, so the drop has
       an edge you can see from twenty metres rather than a line in the ground.
       Split round the ramp mouth, exactly as the wall is. */
    const kerb = new THREE.Group();
    kerb.name = 'cut-kerb';
    const kerbAt = (cx, cz, w, d) => {
      const k = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(w, 0.26, d)), this.pipeMat
      );
      k.position.set(cx, this.surfaceHeight(cx, cz) + 0.1, cz);
      k.castShadow = k.receiveShadow = tierAtLeast('T4');
      kerb.add(k);
    };
    const KW = 0.3;
    kerbAt((r.minX + r.maxX) / 2, r.minZ - KW / 2, r.maxX - r.minX + KW * 2, KW);
    kerbAt(r.minX - KW / 2, (r.minZ + r.maxZ) / 2, KW, r.maxZ - r.minZ);
    kerbAt(r.maxX + KW / 2, (r.minZ + r.maxZ) / 2, KW, r.maxZ - r.minZ);
    kerbAt((r.minX + st.minX) / 2, r.maxZ + KW / 2, st.minX - r.minX, KW);
    kerbAt((st.maxX + r.maxX) / 2, r.maxZ + KW / 2, r.maxX - st.maxX, KW);
    cut.add(kerb);                   // a kerb is the edge of the ground

    /* SPOIL ON THE FLOOR. Broken column lying where the face dropped it, in one
       instanced field so seventy pieces cost one draw call. */
    // Kept out of everything that already stands on the floor: the forge
    // chamber (its hearth and bench are down here), the foot of the ramp, and
    // the conveyor trestles. A field scattered across the whole rectangle
    // strewed broken column through the forge and under its bench.
    const t = this.tube;
    const avoid = [
      { minX: t.minX - 0.8, maxX: t.maxX + 0.8, minZ: t.minZ, maxZ: t.maxZ + 1.6 },
      { minX: st.minX - 1.2, maxX: st.maxX + 1.2, minZ: r.maxZ - 4.0, maxZ: r.maxZ }
    ];
    // Each belt's whole run, not only its legs: the tail pulley and its skirt
    // sit on the floor at the low end, and rubble dropped there lay in them.
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
      count: tierAtLeast('T4') ? 90 : 44,
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
   * A field of broken column lying on a surface: one instanced mesh, each piece
   * a hexagonal section at a random lie. Used on the quarry floor, in the spoil
   * heaps and along the conveyor discharge.
   */
  buildRubbleField({ count, minX, maxX, minZ, maxZ, y, seed, scale = 1, mound = 0, avoid = [], ground = null }) {
    const rand = mulberry32(seed >>> 0);
    const mesh = new THREE.InstancedMesh(this.hexGeo, this.basaltMat, count);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const rx = (maxX - minX) / 2;
    const rz = (maxZ - minZ) / 2;
    // A piece reaches as far as it is long when it lies on its side, so an
    // exclusion zone is kept clear by that reach and not just by the centre.
    const clearOf = (px, pz, reach) => avoid.every(a =>
      px < a.minX - reach || px > a.maxX + reach || pz < a.minZ - reach || pz > a.maxZ + reach);
    for (let i = 0; i < count; i++) {
      const r = (0.18 + rand() * 0.3) * scale;
      const h = (0.5 + rand() * 1.9) * scale;
      // Square root of a uniform: an even area fill rather than a clump in the
      // middle, which is what a tipped load actually makes. Re-drawn when it
      // lands in something that is already standing there; a field that still
      // cannot place a piece after a dozen tries simply has one piece fewer.
      let rr = 0, px = 0, pz = 0, placed = false;
      for (let tries = 0; tries < 12 && !placed; tries++) {
        const a = rand() * Math.PI * 2;
        rr = Math.sqrt(rand());
        px = cx + Math.cos(a) * rr * rx;
        pz = cz + Math.sin(a) * rr * rz;
        placed = clearOf(px, pz, h / 2 + r);
      }
      if (!placed) { px = cx; pz = cz; }
      // A heap is highest in the middle and tails off, which is the angle of
      // repose doing its job.
      const lift = mound * (1 - rr) * (1 - rr);
      e.set(
        Math.PI / 2 + (rand() - 0.5) * 1.5,
        rand() * Math.PI * 2,
        (rand() - 0.5) * 1.1
      );
      q.setFromEuler(e);
      // `y` is the surface the field lies on; `ground`, where given, is how
      // far the real ground under each piece stands above or below it.
      const base = y + (ground ? ground(px, pz) : 0);
      pos.set(px, base + lift + r * 0.9, pz);
      if (placed) sc.set(r * 2, h, r * 2);
      else sc.set(0, 0, 0);
      m.compose(pos, q, sc);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = mesh.receiveShadow = tierAtLeast('T4');
    mesh.frustumCulled = false;
    recordInstanceBoxes(mesh);
    return mesh;
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
      if (lm.minTier === 'T4' && !tierAtLeast('T4')) continue;
      const y = this.surfaceHeight(lm.pos[0], lm.pos[2]);
      let node = null;
      const ground = this.localGround(lm);
      switch (lm.asset) {
        case 'arch': node = this.buildArch(lm.scale, lm.pos[0], lm.pos[2], lm.rotY, ground); break;
        case 'colonnade': node = this.buildColonnade(lm.scale, lm.pos[0], lm.pos[2], ground); break;
        case 'spoil-heap': node = this.buildSpoilHeap(lm.scale, lm.pos[0], lm.pos[2], ground); break;
        case 'broken-column': node = this.buildBrokenColumn(lm.scale, lm.pos[0], lm.pos[2], ground); break;
        case 'conveyor': node = this.buildConveyor(this.localWalk(lm)); break;
        case 'ore-cart': node = this.buildOreCart(lm.pos[0]); break;
        case 'drum-stack': node = this.buildDrumStack(lm.pos[0], lm.pos[2]); break;
        case 'guard-hut': node = this.buildGuardHut(); break;
        case 'hauler': node = this.buildHauler(); break;
        case 'shed': node = this.buildShed(lm.scale); break;
        case 'stack': node = this.buildStack(lm.scale); break;
        case 'water-tower': node = this.buildWaterTower(); break;
        case 'cable-mast': node = this.buildCableMast(); break;
        case 'landing-pad': node = this.buildLandingPad(); break;
        case 'stake-marker': node = this.buildStakeMarker(lm.pos[0], ground); break;
        default: node = null;
      }
      if (!node) continue;

      /* BAKE, EXCEPT WHERE BAKING WOULD BE A LIE.
         `mergeStatic` collapses a dressed prop into one mesh per material and
         records each part's box, which is what keeps sixty-mesh props
         affordable. It refuses anything under `noMerge`, so a lamp that lights
         and an instanced field that carries its own part boxes both survive. */
      mergeStatic(node);
      node.position.set(lm.pos[0], y, lm.pos[2]);
      if (lm.asset === 'landing-pad') {
        this.raised.push({ kind: 'circle', cx: lm.pos[0], cz: lm.pos[2], radius: 7.3, y: y + 0.22 });
      }
      node.rotation.y = lm.rotY;
      // Named so the physics check can say WHICH arch is in the way.
      node.name = `${lm.asset}@${lm.pos[0]},${lm.pos[2]}`;
      this.scene.add(node);
    }
  }

  /**
   * A great stone arch.
   *
   * THE JOINTING FOLLOWS THE CURVE. What makes the arches in the reference art
   * read as basalt rather than as a masonry bridge is that the columns are
   * perpendicular to the arch's surface all the way round: vertical in the
   * legs, leaning inward on the haunches, horizontal across the crown. That is
   * what a flow cooling around a void actually does, and it is the single
   * detail that carries the whole silhouette.
   *
   * So the arch is swept as a semicircle, and at each station a ring of prisms
   * is laid radially around the section, over a solid core that fills it.
   */
  buildArch(scale = 1, sx = 0, sz = 0, rotY = 0, ground = null) {
    const g = new THREE.Group();
    const rand = mulberry32(((sx * 73856093) ^ (sz * 19349663)) >>> 0);

    const R = 14 * scale;          // half-span, and therefore the crown height
    const T = 2.3 * scale;         // half-thickness of the arch section

    /* THE GROUND IS NOT LEVEL UNDER AN ARCH. The span is thirty metres and
       the plateau lifts toward the horizon, so each foot stands on ground at
       its own height relative to the arch's centre. The legs are founded deep
       enough to reach the lower one, and the scree round each foot is laid on
       the ground actually under it — laid at the centre's height, it was
       buried a metre and a half deep under the higher foot. */
    const centreY = this.surfaceHeight(sx, sz);
    const footRise = [-R, R].map(fx => this.surfaceHeight(
      sx + fx * Math.cos(rotY), sz - fx * Math.sin(rotY)
    ) - centreY);
    const legDrop = 2.2 * scale + Math.max(0, -Math.min(...footRise));
    const STATIONS = tierAtLeast('T4') ? 30 : 18;

    // THE CORE. A tube swept along the arch's centre line, so the arch is solid
    // rock and not a cage of prisms with sky behind it.
    const pts = [];
    for (let i = 0; i <= STATIONS * 2; i++) {
      const t = i / (STATIONS * 2);
      // The curve runs from the foot of one leg, up and over, down the other.
      // A pure semicircle would spring straight out of the ground; a real arch
      // has vertical legs that bend into the curve, so the legs are a straight
      // run below the springing line.
      if (t < 0.12) {
        const k = t / 0.12;
        pts.push(new THREE.Vector3(-R, -legDrop + k * legDrop, 0));
      } else if (t > 0.88) {
        const k = (1 - t) / 0.12;
        pts.push(new THREE.Vector3(R, -legDrop + k * legDrop, 0));
      } else {
        const a = Math.PI * (1 - (t - 0.12) / 0.76);
        pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0));
      }
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const coreGeo = this.own(new THREE.TubeGeometry(curve, STATIONS * 2, T * 0.78, 9, false));
    const core = new THREE.Mesh(coreGeo, this.archMat);
    core.castShadow = core.receiveShadow = tierAtLeast('T4');
    g.add(core);

    // THE JOINTING. Prisms laid radially round the section at every station.
    const cols = [];
    const up = new THREE.Vector3(0, 1, 0);
    const tangent = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const binormal = new THREE.Vector3();
    const at = new THREE.Vector3();
    const PER_RING = tierAtLeast('T4') ? 11 : 7;
    for (let i = 0; i <= STATIONS; i++) {
      const t = i / STATIONS;
      curve.getPointAt(t, at);
      // The legs are founded two metres into the pavement. Jointing laid round
      // them down there is geometry nobody will ever see, so none is built —
      // measured against the ground under THIS station, since one foot of the
      // arch stands a metre higher than the other.
      const groundHere = ground ? ground(at.x, at.z) : 0;
      if (at.y < groundHere - 0.2) continue;
      curve.getTangentAt(t, tangent);
      // A stable frame round the curve: the arch lies in the xy plane, so its
      // binormal is z and the normal is whatever is left.
      binormal.set(0, 0, 1);
      normal.crossVectors(tangent, binormal).normalize();
      for (let k = 0; k < PER_RING; k++) {
        const a = (k / PER_RING) * Math.PI * 2 + t * 1.7;
        const r = 0.24 + rand() * 0.2;
        // Each prism stands proud of the core by a varying amount, so the
        // surface is ragged the way forty thousand years of spalling leaves it.
        const out = T * (0.66 + rand() * 0.3);
        const len = T * (0.5 + rand() * 0.55);
        const px = at.x + (normal.x * Math.cos(a) + binormal.x * Math.sin(a)) * out;
        const py = at.y + (normal.y * Math.cos(a) + binormal.y * Math.sin(a)) * out;
        const pz = at.z + (normal.z * Math.cos(a) + binormal.z * Math.sin(a)) * out;
        // A prism on the underside of a station near the foot can still be
        // below the ground even when its station is not.
        if (py + len / 2 < (ground ? ground(px, pz) : 0)) continue;
        cols.push({
          pos: new THREE.Vector3(px, py, pz),
          // The prism's own axis points OUT of the section — radially — which
          // is what puts the flat hexagon faces on the outside of the arch.
          dir: new THREE.Vector3(
            normal.x * Math.cos(a) + binormal.x * Math.sin(a),
            normal.y * Math.cos(a) + binormal.y * Math.sin(a),
            normal.z * Math.cos(a) + binormal.z * Math.sin(a)
          ),
          r, len, spin: rand() * Math.PI
        });
      }
    }

    const mesh = new THREE.InstancedMesh(this.hexGeo, this.archMat, cols.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    cols.forEach((c, i) => {
      q.setFromUnitVectors(up, c.dir);
      const spin = new THREE.Quaternion().setFromAxisAngle(c.dir, c.spin);
      q.premultiply(spin);
      scl.set(c.r * 2, c.len, c.r * 2);
      m.compose(c.pos, q, scl);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = mesh.receiveShadow = tierAtLeast('T4');
    mesh.frustumCulled = false;
    // Held out of the bake: an instanced field is already one draw call, and
    // its part boxes are the thing the physics check has to read.
    mesh.userData.noMerge = true;
    recordInstanceBoxes(mesh);
    g.add(mesh);

    // Talus: the stone the arch has shed, heaped round both feet. An arch with
    // clean ground under it is an arch nothing has ever fallen off.
    for (const [f, footX] of [-R, R].entries()) {
      const talus = this.buildRubbleField({
        count: tierAtLeast('T4') ? 34 : 16,
        minX: footX - T * 2.4, maxX: footX + T * 2.4,
        minZ: -T * 2.4, maxZ: T * 2.4,
        // On the ground, not at the depth the legs are founded at: the legs run
        // two metres down into the pavement, and scree dropped there was buried.
        y: -0.15, seed: 0x3311 + Math.round(footX * 10),
        scale: 0.9 * scale, mound: 0.7 * scale, ground
      });
      talus.userData.noMerge = true;
      g.add(talus);
    }

    return g;
  }

  /**
   * A patch of standing colonnade: a raft of hexagonal columns broken off at
   * different heights, tallest in the middle where the face has not yet worked
   * its way in. One instanced mesh for the whole patch.
   */
  buildColonnade(scale = 1, sx = 0, sz = 0, ground = null) {
    const g = new THREE.Group();
    const rand = mulberry32(((sx * 83492791) ^ (sz * 29835607)) >>> 0);

    const R = 7.4 * scale;
    const PITCH = 0.94;
    const cols = [];
    // A hexagonal lattice, because that is how the prisms actually pack. Rows
    // offset by half a pitch and spaced by the hexagon's own row height.
    const rowH = PITCH * 0.866;
    for (let row = -Math.ceil(R / rowH); row <= Math.ceil(R / rowH); row++) {
      const cz = row * rowH;
      const off = (row & 1) ? PITCH / 2 : 0;
      for (let col = -Math.ceil(R / PITCH) - 1; col <= Math.ceil(R / PITCH) + 1; col++) {
        const cx = col * PITCH + off;
        const d = Math.hypot(cx, cz) / R;
        if (d > 1) continue;
        // The edge of a patch is broken and gappy; the middle is solid.
        if (rand() < d * d * 0.85) continue;
        const r = (PITCH / 2) * (0.82 + rand() * 0.16);
        // A dome of height: the raft stands tallest at its centre and steps
        // down to the flat, which is what a weathered colonnade looks like.
        const h = (1.4 + (1 - d * d) * 6.2) * scale * (0.7 + rand() * 0.6);
        cols.push({
          x: cx + (rand() - 0.5) * 0.1,
          z: cz + (rand() - 0.5) * 0.1,
          h, r,
          tilt: (rand() - 0.5) * 0.06,
          spin: rand() * Math.PI,
          // Bedded a little into the ground, so no column is balanced on the
          // surface like a dropped pencil.
          sink: 0.25 + rand() * 0.3
        });
      }
    }

    const mesh = new THREE.InstancedMesh(this.hexGeo, this.basaltMat, cols.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    cols.forEach((c, i) => {
      e.set(c.tilt, c.spin, c.tilt * 0.7);
      q.setFromEuler(e);
      // Seated on the ground under THIS column: a raft sixteen metres across on
      // a slope would otherwise float its downhill columns clear of the rock.
      pos.set(c.x, (ground ? ground(c.x, c.z) : 0) + c.h / 2 - c.sink, c.z);
      scl.set(c.r * 2, c.h, c.r * 2);
      m.compose(pos, q, scl);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = mesh.receiveShadow = tierAtLeast('T4');
    mesh.frustumCulled = false;
    mesh.userData.noMerge = true;
    recordInstanceBoxes(mesh);
    g.add(mesh);

    // Scree round the foot of the raft, where the outer columns have toppled.
    const scree = this.buildRubbleField({
      count: tierAtLeast('T4') ? 30 : 14,
      minX: -R * 1.05, maxX: R * 1.05,
      minZ: -R * 1.05, maxZ: R * 1.05,
      y: -0.1, seed: 0x6a41 + Math.round(sx), scale: 0.75 * scale, ground
    });
    scree.userData.noMerge = true;
    g.add(scree);

    return g;
  }

  /** A tipped heap of broken column, pushed up by a loader. */
  buildSpoilHeap(scale = 1, sx = 0, sz = 0, ground = null) {
    const g = new THREE.Group();
    // The heap is spread over less than its declared footprint on purpose: a
    // piece at the rim lies on its side, and a prism up to a metre and a half
    // long reaches past where its centre is. Spread to the full radius and the
    // heap's edge would stand in whatever is next to it.
    const R = 3.0 * scale;
    const heap = this.buildRubbleField({
      count: tierAtLeast('T4') ? 76 : 36,
      minX: -R, maxX: R, minZ: -R, maxZ: R,
      y: -0.15, seed: ((sx * 19349663) ^ (sz * 83492791)) >>> 0,
      scale: 0.85 * scale, mound: 2.1 * scale, ground
    });
    heap.userData.noMerge = true;
    g.add(heap);
    return g;
  }

  /**
   * One toppled column, lying where it fell and broken into sections.
   *
   * A fallen prism does not land in one piece: it snaps at its joints, and the
   * sections roll apart a little and stay in line. Drawing it as a single long
   * cylinder is the thing that makes a rock field look like scattered pipe.
   */
  buildBrokenColumn(scale = 1, sx = 0, sz = 0, ground = null) {
    const g = new THREE.Group();
    const rand = mulberry32(((sx * 2654435761) ^ (sz * 40503)) >>> 0);
    const r = (0.44 + rand() * 0.2) * scale;
    // Five sections whose lengths and gaps are drawn first and then scaled to
    // fit 4.4 m, centred on the landmark. Drawn one after another with no total
    // in mind, a column could run to nine metres — three times its footprint,
    // lying across whatever stood next to it.
    const lens = [];
    const gaps = [];
    for (let i = 0; i < 5; i++) {
      lens.push(0.7 + rand() * 1.5);
      gaps.push(i < 4 ? 0.04 + rand() * 0.18 : 0);
    }
    const raw = lens.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
    const fit = (4.4 * scale) / raw;
    let along = -2.2 * scale;
    for (let i = 0; i < 5; i++) {
      const len = lens[i] * fit;
      const seg = new THREE.Mesh(this.hexGeo, this.basaltMat);
      seg.scale.set(r * 2, len, r * 2);
      // Lying down: the prism's axis is along the ground, with a little roll
      // and a little yaw off the line so the sections are not a ruled row.
      seg.rotation.set(
        Math.PI / 2 + (rand() - 0.5) * 0.12,
        (rand() - 0.5) * 0.14,
        Math.PI / 2 + (rand() - 0.5) * 0.3
      );
      const segX = along + len / 2;
      const segZ = (rand() - 0.5) * 0.3;
      seg.position.set(segX, (ground ? ground(segX, segZ) : 0) + r * 0.82 - 0.12, segZ);
      seg.castShadow = seg.receiveShadow = tierAtLeast('T4');
      g.add(seg);
      along += len + gaps[i] * fit;
    }
    // Chips off the breaks.
    const chips = this.buildRubbleField({
      count: tierAtLeast('T4') ? 14 : 7,
      minX: -2.6 * scale, maxX: 2.6 * scale,
      minZ: -1.0 * scale, maxZ: 1.0 * scale,
      y: -0.06, seed: 0x1de1 + Math.round(sx * 7), scale: 0.3 * scale, ground
    });
    chips.userData.noMerge = true;
    g.add(chips);
    return g;
  }

  /**
   * A belt conveyor climbing out of the cut.
   *
   * Built so that the TAIL is down in the pit and the HEAD is up on the flat,
   * because that is the direction stone travels: the loader fills it on the
   * quarry floor and it discharges onto the spoil outside. Placed with
   * `rotY: -PI/2` in the JSON, which swings local +z (the head) to world -x,
   * away from the excavation.
   */
  buildConveyor(walk = null) {
    const g = new THREE.Group();
    const rand = mulberry32(0x51c0);

    const LEN = 22;          // along local z
    // The tail sits on the quarry floor, wherever the floor actually is.
    const TAIL_Y = (walk ? walk(0, -LEN / 2) : -5.0) - 0.1;
    const HEAD_Y = 6.2;      // clear of the lip, over the spoil
    const rise = HEAD_Y - TAIL_Y;
    const pitch = Math.atan2(rise, LEN);
    const span = Math.hypot(LEN, rise);
    const midY = (TAIL_Y + HEAD_Y) / 2;

    /* THE TRUSS. Two chords with a zig-zag web between them, which is what a
       conveyor gantry is, and what reads at two hundred metres as a conveyor. */
    const chordGeo = this.own(new THREE.BoxGeometry(0.1, 0.1, span));
    for (const [cx, cy] of [[-0.62, -0.42], [0.62, -0.42], [-0.62, 0.34], [0.62, 0.34]]) {
      const chord = new THREE.Mesh(chordGeo, this.darkSteelMat);
      chord.position.set(cx, midY + cy, 0);
      chord.rotation.x = -pitch;
      chord.castShadow = tierAtLeast('T4');
      g.add(chord);
    }
    const webGeo = this.own(new THREE.BoxGeometry(0.06, 0.06, 1.05));
    const bays = Math.round(span / 1.4);
    for (let i = 0; i < bays; i++) {
      const t = (i + 0.5) / bays;
      const z = -LEN / 2 + LEN * t;
      const y = TAIL_Y + rise * t;
      for (const sx of [-0.62, 0.62]) {
        const web = new THREE.Mesh(webGeo, this.darkSteelMat);
        web.position.set(sx, y - 0.04, z);
        web.rotation.set(-pitch, 0, 0);
        web.rotateX(i % 2 ? 0.86 : -0.86);
        g.add(web);
      }
      // Cross bracing under the belt line.
      const cross = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(1.24, 0.06, 0.06)), this.darkSteelMat
      );
      cross.position.set(0, y - 0.42, z);
      g.add(cross);
    }

    /* THE BELT, and the stone on it. The belt is a plane, not a box: it is
       three millimetres of rubber and drawing it thick makes it read as a
       conveyor of solid steel. */
    const beltGeo = this.own(new THREE.PlaneGeometry(1.1, span));
    const belt = new THREE.Mesh(beltGeo, this.beltMat);
    belt.rotation.set(-Math.PI / 2 - pitch, 0, 0);
    belt.position.set(0, midY + 0.03, 0);
    belt.receiveShadow = tierAtLeast('T4');
    g.add(belt);

    // A return strand under it, slack between the rollers.
    const ret = new THREE.Mesh(beltGeo, this.beltMat);
    ret.rotation.set(-Math.PI / 2 - pitch, 0, 0);
    ret.position.set(0, midY - 0.46, 0);
    g.add(ret);

    // Troughing idlers: three rollers per set, the outer two canted up, which
    // is what gives a loaded belt its U.
    const rollGeo = this.own(new THREE.CylinderGeometry(0.075, 0.075, 0.46, 10));
    const sets = Math.round(span / 2.2);
    for (let i = 0; i <= sets; i++) {
      const t = i / sets;
      const z = -LEN / 2 + LEN * t;
      const y = TAIL_Y + rise * t;
      for (const [rx, rr, ry] of [[-0.36, 0.5, 0.06], [0, 0, 0], [0.36, -0.5, 0.06]]) {
        const roll = new THREE.Mesh(rollGeo, this.pipeMat);
        roll.rotation.set(-pitch, 0, Math.PI / 2 + rr);
        roll.position.set(rx, y + ry, z);
        g.add(roll);
      }
    }

    // Head and tail pulleys, with a drive motor and a guard at the head.
    for (const [pz, py, pr] of [[-LEN / 2, TAIL_Y, 0.24], [LEN / 2, HEAD_Y, 0.3]]) {
      const pulley = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(pr, pr, 1.18, 16)), this.pipeMat
      );
      pulley.rotation.z = Math.PI / 2;
      pulley.position.set(0, py, pz);
      pulley.castShadow = tierAtLeast('T4');
      g.add(pulley);
      // The bolts through the pulley's end disc, on the face you can see.
      const ring = boltRing(pr * 0.7, 6, this.darkSteelMat, { size: 0.03, axis: 'x' });
      ring.position.set(0.6, py, pz);
      g.add(ring);
    }
    const motor = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.22, 0.22, 0.58, 14)), this.darkSteelMat
    );
    motor.rotation.z = Math.PI / 2;
    motor.position.set(0.95, HEAD_Y - 0.3, LEN / 2 - 0.3);
    motor.castShadow = tierAtLeast('T4');
    g.add(motor);
    const gearbox = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.4, 0.42, 0.44)), this.darkSteelMat
    );
    gearbox.position.set(0.62, HEAD_Y - 0.3, LEN / 2 - 0.3);
    g.add(gearbox);

    /* THE LOAD. Stone riding up the belt, sitting in the trough. Instanced, and
       kept to the middle third of the belt's width so it reads as a load rather
       than as gravel glued to a plank. */
    const load = [];
    const n = tierAtLeast('T4') ? 60 : 28;
    for (let i = 0; i < n; i++) {
      const t = rand();
      const z = -LEN / 2 + LEN * t;
      const y = TAIL_Y + rise * t;
      load.push({
        x: (rand() - 0.5) * 0.66, y: y + 0.1 + rand() * 0.06, z,
        r: 0.07 + rand() * 0.1, h: 0.12 + rand() * 0.16,
        rx: rand() * Math.PI, ry: rand() * Math.PI, rz: rand() * Math.PI
      });
    }
    const loadMesh = new THREE.InstancedMesh(this.hexGeo, this.basaltMat, load.length);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const pos = new THREE.Vector3();
      const scl = new THREE.Vector3();
      load.forEach((c, i) => {
        e.set(c.rx, c.ry, c.rz);
        q.setFromEuler(e);
        pos.set(c.x, c.y, c.z);
        scl.set(c.r * 2, c.h, c.r * 2);
        m.compose(pos, q, scl);
        loadMesh.setMatrixAt(i, m);
      });
    }
    loadMesh.instanceMatrix.needsUpdate = true;
    loadMesh.castShadow = tierAtLeast('T4');
    loadMesh.frustumCulled = false;
    loadMesh.userData.noMerge = true;
    recordInstanceBoxes(loadMesh);
    g.add(loadMesh);

    /* THE LEGS. Three trestles, at the same local coordinates `supportPoints`
       collides — one implementation of where the feet are, in two places that
       must agree, and the verifier drives the same function. */
    for (const lz of [-LEN * 0.38, 0, LEN * 0.38]) {
      const t = (lz + LEN / 2) / LEN;
      const topY = TAIL_Y + rise * t - 0.5;
      // Founded on the ground actually under this trestle — the quarry floor or
      // the flat. Guessed from which end of the belt it was, the middle leg
      // stood on the flat's height in mid-air over the cut.
      const footY = (walk ? walk(0, lz) : (lz < -LEN * 0.1 ? TAIL_Y : 0)) - 0.1;
      const h = topY - footY;
      if (h <= 0.4) continue;
      for (const lx of [-0.7, 0.7]) {
        const leg = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.16, h, 0.16)), this.darkSteelMat
        );
        leg.position.set(lx, footY + h / 2, lz);
        leg.castShadow = tierAtLeast('T4');
        g.add(leg);
        const foot = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.44, 0.08, 0.44)), this.plateMat
        );
        foot.position.set(lx, footY + 0.04, lz);
        g.add(foot);
      }
      // A braced A-frame, not two sticks.
      const brace = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(1.5, 0.08, 0.08)), this.darkSteelMat
      );
      brace.position.set(0, footY + h * 0.55, lz);
      g.add(brace);
    }

    // The discharge chute at the head, and a skirt round the tail feed.
    const chute = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.1, 0.9, 0.12)), this.plateMat
    );
    chute.position.set(0, HEAD_Y - 0.62, LEN / 2 + 0.42);
    chute.rotation.x = 0.42;
    g.add(chute);
    const skirt = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.34, 0.44, 2.2)), this.plateMat
    );
    skirt.position.set(0, TAIL_Y + 0.38, -LEN / 2 + 1.4);
    skirt.rotation.x = -pitch;
    g.add(skirt);

    return g;
  }

  /**
   * A hopper cart on a length of raised rail. Three of them stand in a line
   * north of the cut, on the same trestle road, with the couplings between them
   * — which is why each cart carries its own section of track.
   */
  buildOreCart(sx = 0) {
    const g = new THREE.Group();
    const rand = mulberry32((0x2c17 ^ Math.round(sx * 97)) >>> 0);

    // The trestle road: two rails on sleepers, on short piers.
    const RAIL_Y = 1.15;
    for (const rx of [-0.46, 0.46]) {
      const rail = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.08, 0.1, 6.6)), this.pipeMat
      );
      rail.position.set(rx, RAIL_Y, 0);
      g.add(rail);
    }
    for (let i = -3; i <= 3; i++) {
      const sleeper = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(1.4, 0.1, 0.22)), this.timberMat
      );
      sleeper.position.set(0, RAIL_Y - 0.1, i * 1.0);
      g.add(sleeper);
      if (i % 2 === 0) {
        for (const px of [-0.55, 0.55]) {
          const pier = new THREE.Mesh(
            this.own(new THREE.BoxGeometry(0.16, RAIL_Y - 0.15, 0.16)), this.darkSteelMat
          );
          pier.position.set(px, (RAIL_Y - 0.15) / 2, i * 1.0);
          pier.castShadow = tierAtLeast('T4');
          g.add(pier);
        }
      }
    }

    /* THE CART. A riveted steel hopper on a four-wheel underframe, tipped a
       few degrees on its trunnions because it has been emptied and not righted
       — which is exactly what the reference art has. */
    const body = new THREE.Group();
    const W = 1.26, H = 1.0, D = 1.5;
    const shell = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(W, H, D)), this.drumMat
    );
    shell.castShadow = shell.receiveShadow = tierAtLeast('T4');
    body.add(shell);
    // The flared lip round the mouth, and the stiffening bands down the sides.
    const lip = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(W + 0.14, 0.1, D + 0.14)), this.darkSteelMat
    );
    lip.position.y = H / 2 + 0.04;
    body.add(lip);
    for (const bz of [-D / 2 + 0.22, D / 2 - 0.22]) {
      const band = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(W + 0.06, 0.12, 0.08)), this.darkSteelMat
      );
      band.position.set(0, 0.06, bz);
      body.add(band);
      body.add(boltLine(
        [-W / 2, 0.06, bz + 0.05], [W / 2, 0.06, bz + 0.05], 5,
        this.darkSteelMat, { size: 0.018, normalAxis: 'z' }
      ));
    }
    // What is left in the bottom of it.
    const dregs = this.buildRubbleField({
      count: tierAtLeast('T4') ? 12 : 6,
      minX: -W / 2 + 0.2, maxX: W / 2 - 0.2,
      minZ: -D / 2 + 0.2, maxZ: D / 2 - 0.2,
      y: -H / 2 + 0.08, seed: 0x77c1 + Math.round(sx), scale: 0.36
    });
    dregs.userData.noMerge = true;
    body.add(dregs);

    body.position.set(0, RAIL_Y + 0.42 + H / 2, 0);
    body.rotation.z = (rand() - 0.5) * 0.22;
    g.add(body);

    // Underframe and wheels.
    const frame = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(W + 0.1, 0.14, D + 0.2)), this.darkSteelMat
    );
    frame.position.set(0, RAIL_Y + 0.4, 0);
    g.add(frame);
    const wheelGeo = this.own(new THREE.CylinderGeometry(0.24, 0.24, 0.09, 14));
    for (const wx of [-0.46, 0.46]) {
      for (const wz of [-0.55, 0.55]) {
        const wheel = new THREE.Mesh(wheelGeo, this.pipeMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, RAIL_Y + 0.22, wz);
        wheel.castShadow = tierAtLeast('T4');
        g.add(wheel);
      }
    }
    // Couplings, so the three read as a rake rather than as three carts.
    for (const cz of [-D / 2 - 0.34, D / 2 + 0.34]) {
      const hook = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.12, 0.12, 0.34)), this.pipeMat
      );
      hook.position.set(0, RAIL_Y + 0.4, cz);
      g.add(hook);
    }

    return g;
  }

  /** A stack of drums on a pallet, lidded and dented. */
  buildDrumStack(sx = 0, sz = 0) {
    const g = new THREE.Group();
    const rand = mulberry32(((sx * 374761393) ^ (sz * 668265263)) >>> 0);

    const pallet = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.0, 0.12, 1.5)), this.timberMat
    );
    pallet.position.y = 0.06;
    pallet.receiveShadow = tierAtLeast('T4');
    g.add(pallet);
    for (const bz of [-0.55, 0, 0.55]) {
      const bearer = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(2.0, 0.08, 0.14)), this.timberMat
      );
      bearer.position.set(0, 0.04, bz);
      g.add(bearer);
    }

    const drumGeo = this.own(new THREE.CylinderGeometry(0.29, 0.29, 0.88, 18));
    const rollGeo = this.own(new THREE.TorusGeometry(0.295, 0.025, 6, 20));
    const layout = [[-0.62, -0.38], [0.0, -0.38], [0.62, -0.38],
                    [-0.62, 0.38], [0.0, 0.38], [0.62, 0.38]];
    layout.forEach(([dx, dz], i) => {
      const tiers = i === 4 ? 2 : 1;      // one drum stood on another, as they are
      for (let t = 0; t < tiers; t++) {
        const drum = new THREE.Mesh(drumGeo, this.drumMat);
        drum.position.set(dx, 0.12 + 0.44 + t * 0.9, dz);
        drum.rotation.y = rand() * Math.PI;
        drum.castShadow = drum.receiveShadow = tierAtLeast('T4');
        g.add(drum);
        // The two rolling hoops every drum has, which is what stops a cylinder
        // reading as a can.
        for (const hy of [-0.22, 0.22]) {
          const hoop = new THREE.Mesh(rollGeo, this.darkSteelMat);
          hoop.rotation.x = Math.PI / 2;
          hoop.position.set(dx, 0.12 + 0.44 + t * 0.9 + hy, dz);
          g.add(hoop);
        }
        // Bung and lid ring on the top head.
        const bung = new THREE.Mesh(
          this.own(new THREE.CylinderGeometry(0.045, 0.045, 0.035, 8)), this.pipeMat
        );
        bung.position.set(dx + 0.14, 0.12 + 0.89 + t * 0.9, dz - 0.08);
        g.add(bung);
      }
    });

    // One drum on its side on the ground beside the pallet, leaking a stain.
    const tipped = new THREE.Mesh(drumGeo, this.drumMat);
    tipped.rotation.z = Math.PI / 2;
    tipped.rotation.y = 0.4;
    tipped.position.set(-1.35, 0.29, 0.62);
    tipped.castShadow = tierAtLeast('T4');
    g.add(tipped);
    const stain = new THREE.Mesh(
      this.own(new THREE.CircleGeometry(0.52, 18)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x241c14, transparent: true, opacity: 0.55, roughness: 0.55,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
      }))
    );
    stain.rotation.x = -Math.PI / 2;
    stain.position.set(-1.5, 0.012, 0.9);
    stain.scale.set(1, 1.4, 1);
    g.add(stain);

    return g;
  }

  /**
   * The gate hut: a riveted steel box on a plinth with one window, the thing
   * standing on the deck in the reference art. Small, and built like a safe.
   */
  buildGuardHut() {
    const g = new THREE.Group();

    const plinth = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.5, 0.22, 2.2)), this.plateMat
    );
    plinth.position.y = 0.11;
    plinth.receiveShadow = tierAtLeast('T4');
    g.add(plinth);

    const body = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.2, 2.0, 1.9)), this.drumMat
    );
    body.position.y = 1.22;
    body.castShadow = body.receiveShadow = tierAtLeast('T4');
    g.add(body);

    // A shallow-pitched hipped roof with an overhang, as in the art.
    const roof = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.02, 1.62, 0.52, 4)), this.darkSteelMat
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 2.46;
    roof.castShadow = tierAtLeast('T4');
    g.add(roof);
    const eave = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.5, 0.08, 2.2)), this.darkSteelMat
    );
    eave.position.y = 2.22;
    g.add(eave);

    // The window: a recessed dark pane with a steel surround and a sill.
    const pane = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.9, 0.62, 0.05)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x14120f, roughness: 0.3, metalness: 0.15
      }))
    );
    pane.position.set(0, 1.5, 0.96);
    g.add(pane);
    const surround = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.04, 0.76, 0.05)), this.darkSteelMat
    );
    surround.position.set(0, 1.5, 0.94);
    g.add(surround);
    const sill = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.1, 0.06, 0.16)), this.pipeMat
    );
    sill.position.set(0, 1.1, 1.0);
    g.add(sill);

    // Riveted corner posts and a bolt line along the plinth.
    for (const [px, pz] of [[-1.06, -0.9], [1.06, -0.9], [-1.06, 0.9], [1.06, 0.9]]) {
      const postAngle = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.12, 2.0, 0.12)), this.darkSteelMat
      );
      postAngle.position.set(px, 1.22, pz);
      g.add(postAngle);
    }
    g.add(boltLine([-1.1, 0.22, 0.96], [1.1, 0.22, 0.96], 7, this.darkSteelMat, { size: 0.02 }));

    // A door on the back, with a handle and a hasp.
    const door = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.8, 1.7, 0.06)), this.plateMat
    );
    door.position.set(0.5, 1.07, -0.97);
    g.add(door);
    const handle = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8)), this.pipeMat
    );
    handle.position.set(0.16, 1.02, -1.02);
    g.add(handle);

    return g;
  }

  /**
   * The site hauler: a six-wheel flatbed with a bar grille and a dusty cab, the
   * truck parked on the deck in the reference art. It is decoration, so it
   * builds as one body with no moving parts — but a truck that is four boxes
   * reads as four boxes, so it gets its wheels, its steps and its mirrors.
   */
  buildHauler() {
    const g = new THREE.Group();

    const chassis = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.3, 0.34, 6.4)), this.darkSteelMat
    );
    chassis.position.y = 0.86;
    chassis.castShadow = tierAtLeast('T4');
    g.add(chassis);

    const cab = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.36, 1.55, 2.1)), this.plateMat
    );
    cab.position.set(0, 1.82, 1.75);
    cab.castShadow = cab.receiveShadow = tierAtLeast('T4');
    g.add(cab);

    // Windscreen and side glass, raked back and filthy.
    const glassMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x1a1814, roughness: 0.42, metalness: 0.1
    }));
    const screen = new THREE.Mesh(this.own(new THREE.BoxGeometry(1.96, 0.8, 0.06)), glassMat);
    screen.position.set(0, 2.16, 2.78);
    screen.rotation.x = 0.2;
    g.add(screen);
    for (const sx of [-1.2, 1.2]) {
      const side = new THREE.Mesh(this.own(new THREE.BoxGeometry(0.06, 0.6, 0.9)), glassMat);
      side.position.set(sx, 2.06, 1.9);
      g.add(side);
    }

    // The bar grille and lamp guards on the nose.
    const nose = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.3, 1.0, 0.5)), this.drumMat
    );
    nose.position.set(0, 1.5, 2.98);
    g.add(nose);
    for (let i = 0; i < 5; i++) {
      const bar = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.08, 0.9, 0.08)), this.pipeMat
      );
      bar.position.set(-0.8 + i * 0.4, 1.5, 3.26);
      g.add(bar);
    }
    for (const lx of [-0.86, 0.86]) {
      const lamp = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 12)),
        this.own(new THREE.MeshStandardMaterial({ color: 0x8b8272, roughness: 0.5 }))
      );
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(lx, 2.02, 3.24);
      g.add(lamp);
      const guard = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(0.16, 0.018, 5, 14)), this.darkSteelMat
      );
      guard.position.set(lx, 2.02, 3.3);
      g.add(guard);
    }

    // Flatbed with dropped sides and a load of column offcuts.
    const bed = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.36, 0.12, 3.6)), this.treadMat
    );
    bed.position.set(0, 1.09, -0.9);
    bed.receiveShadow = tierAtLeast('T4');
    g.add(bed);
    for (const bx of [-1.15, 1.15]) {
      const side = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.08, 0.5, 3.6)), this.plateMat
      );
      side.position.set(bx, 1.4, -0.9);
      g.add(side);
    }
    const headboard = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.36, 0.9, 0.08)), this.plateMat
    );
    headboard.position.set(0, 1.6, 0.66);
    g.add(headboard);
    const cargo = this.buildRubbleField({
      count: tierAtLeast('T4') ? 20 : 10,
      minX: -0.9, maxX: 0.9, minZ: -2.2, maxZ: 0.3,
      y: 1.15, seed: 0x88e2, scale: 0.55
    });
    cargo.userData.noMerge = true;
    g.add(cargo);

    // Six wheels on three axles, with hubs.
    const tyreGeo = this.own(new THREE.CylinderGeometry(0.62, 0.62, 0.42, 18));
    const hubGeo = this.own(new THREE.CylinderGeometry(0.24, 0.24, 0.44, 12));
    const tyreMat = this.own(new THREE.MeshStandardMaterial({
      color: 0x211e1b, roughness: 0.98, metalness: 0.0
    }));
    for (const wz of [2.0, -1.0, -2.1]) {
      for (const wx of [-1.12, 1.12]) {
        const tyre = new THREE.Mesh(tyreGeo, tyreMat);
        tyre.rotation.z = Math.PI / 2;
        tyre.position.set(wx, 0.62, wz);
        tyre.castShadow = tierAtLeast('T4');
        g.add(tyre);
        const hub = new THREE.Mesh(hubGeo, this.pipeMat);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(wx * 1.02, 0.62, wz);
        g.add(hub);
      }
      const axle = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.1, 0.1, 2.2, 10)), this.darkSteelMat
      );
      axle.rotation.z = Math.PI / 2;
      axle.position.set(0, 0.62, wz);
      g.add(axle);
    }

    // Cab step, exhaust stack and mirrors — the parts you only miss if they
    // are not there.
    const step = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.5, 0.06, 0.3)), this.treadMat
    );
    step.position.set(-1.24, 0.9, 1.7);
    g.add(step);
    const exhaust = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.09, 0.09, 2.2, 10)), this.pipeMat
    );
    exhaust.position.set(-1.28, 2.2, 0.85);
    g.add(exhaust);
    const cap = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.11, 0.09, 0.1, 10)), this.darkSteelMat
    );
    cap.position.set(-1.28, 3.34, 0.85);
    g.add(cap);
    for (const mx of [-1.34, 1.34]) {
      const arm = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6)), this.darkSteelMat
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(mx, 2.3, 2.6);
      g.add(arm);
      const mirror = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.05, 0.4, 0.2)), this.darkSteelMat
      );
      mirror.position.set(mx * 1.16, 2.16, 2.6);
      g.add(mirror);
    }

    return g;
  }

  /**
   * A corrugated shed: timber frame, ribbed sheet walls, gable roof, open on
   * one end — the buildings standing behind the arches in the reference art.
   */
  buildShed(scale = 1) {
    const g = new THREE.Group();
    const W = 7.0 * scale, D = 5.2 * scale, H = 3.0 * scale;

    // Frame: corner posts and a ridge beam on two kingposts.
    for (const [px, pz] of [[-W / 2, -D / 2], [W / 2, -D / 2], [-W / 2, D / 2], [W / 2, D / 2]]) {
      const post = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.18, H, 0.18)), this.timberMat
      );
      post.position.set(px, H / 2, pz);
      post.castShadow = tierAtLeast('T4');
      g.add(post);
    }
    const ridge = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(0.2, 0.24, D)), this.timberMat
    );
    ridge.position.set(0, H + 0.82, 0);
    g.add(ridge);

    // Two roof planes, ribbed. The ribs are what make it sheet rather than slab.
    const slope = Math.atan2(0.9, W / 2);
    for (const side of [-1, 1]) {
      const plane = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(Math.hypot(W / 2, 0.9) + 0.3, 0.07, D + 0.4)),
        this.plateMat
      );
      plane.position.set(side * W / 4, H + 0.42, 0);
      plane.rotation.z = -side * slope;
      plane.castShadow = plane.receiveShadow = tierAtLeast('T4');
      g.add(plane);
      const ribs = Math.round(W / 2 / 0.32);
      for (let i = 0; i < ribs; i++) {
        const t = (i + 0.5) / ribs;
        const rib = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.06, 0.05, D + 0.4)), this.darkSteelMat
        );
        const along = (t - 0.5) * (Math.hypot(W / 2, 0.9) + 0.3);
        rib.position.set(
          side * W / 4 + along * Math.cos(slope),
          H + 0.47 - side * along * Math.sin(-side * slope) * side,
          0
        );
        rib.rotation.z = -side * slope;
        g.add(rib);
      }
    }

    // Walls: three sides sheeted, the fourth open. One sheet has come adrift.
    const wallMk = (w, h, x, y, z, ry) => {
      const wall = new THREE.Mesh(this.own(new THREE.BoxGeometry(w, h, 0.07)), this.plateMat);
      wall.position.set(x, y, z);
      wall.rotation.y = ry;
      wall.castShadow = wall.receiveShadow = tierAtLeast('T4');
      g.add(wall);
      // Vertical corrugation ribs.
      const n = Math.round(w / 0.42);
      for (let i = 0; i < n; i++) {
        const rib = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(0.05, h, 0.05)), this.darkSteelMat
        );
        const off = -w / 2 + (i + 0.5) * (w / n);
        rib.position.set(
          x + Math.cos(ry) * off, y, z - Math.sin(ry) * off
        );
        rib.rotation.y = ry;
        g.add(rib);
      }
    };
    wallMk(W, H, 0, H / 2, -D / 2, 0);
    wallMk(D, H, -W / 2, H / 2, 0, Math.PI / 2);
    wallMk(D, H, W / 2, H / 2, 0, Math.PI / 2);
    // Half a sheet across the open end, so it is a doorway rather than a hole.
    wallMk(W * 0.34, H, -W * 0.33, H / 2, D / 2, 0);

    // The loose sheet, hanging by one fixing.
    const loose = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(1.1 * scale, 1.6 * scale, 0.06)), this.plateMat
    );
    loose.position.set(W / 2 + 0.16, H * 0.62, D * 0.18);
    loose.rotation.set(0, 0.22, -0.3);
    loose.castShadow = tierAtLeast('T4');
    g.add(loose);

    // What is kept in it: a bench and a stack of timber, seen through the door.
    const inner = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.4, 0.1, 0.8)), this.timberMat
    );
    inner.position.set(W * 0.16, 0.9, -D * 0.3);
    g.add(inner);
    for (let i = 0; i < 4; i++) {
      const plank = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(3.2, 0.12, 0.3)), this.timberMat
      );
      plank.position.set(-W * 0.12, 0.08 + i * 0.13, -D * 0.34 + (i % 2) * 0.05);
      g.add(plank);
    }

    return g;
  }

  /** A flue stack: a tapered steel chimney on a plinth, guyed at three points. */
  buildStack(scale = 1) {
    const g = new THREE.Group();
    const H = 16 * scale;

    const plinth = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.6, 0.6, 2.6)), this.plateMat
    );
    plinth.position.y = 0.3;
    plinth.receiveShadow = tierAtLeast('T4');
    g.add(plinth);

    const flue = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.46, 0.84, H, 18)), this.drumMat
    );
    flue.position.y = 0.6 + H / 2;
    flue.castShadow = flue.receiveShadow = tierAtLeast('T4');
    g.add(flue);

    // Flanged joints up the stack, every four metres, the way it was erected.
    for (let y = 4; y < H; y += 4) {
      const t = y / H;
      const r = 0.84 + (0.46 - 0.84) * t;
      const flange = pipeFlange(r + 0.06, this.darkSteelMat, this.pipeMat);
      flange.position.y = 0.6 + y;
      g.add(flange);
    }

    // A cowl at the top, and a ladder with a cage up one side.
    const cowl = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.58, 0.46, 0.4, 16)), this.darkSteelMat
    );
    cowl.position.y = 0.6 + H + 0.18;
    g.add(cowl);
    for (let y = 1.2; y < H; y += 0.42) {
      const rung = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.42, 0.04, 0.04)), this.pipeMat
      );
      const t = y / H;
      rung.position.set(0.84 + (0.46 - 0.84) * t + 0.12, 0.6 + y, 0);
      g.add(rung);
    }

    // Guy wires to three anchors, sagging under their own weight.
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const ax = Math.cos(a) * 5.2;
      const az = Math.sin(a) * 5.2;
      const guy = cableRun(
        [Math.cos(a) * 0.5, 0.6 + H * 0.82, Math.sin(a) * 0.5],
        [ax, 0.1, az], this.darkSteelMat,
        { sag: 0.6, radius: 0.026, segments: 14 }
      );
      g.add(guy);
      this.own(guy.userData.ownGeometry);
      const anchor = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.4, 0.3, 0.4)), this.darkSteelMat
      );
      anchor.position.set(ax, 0.15, az);
      g.add(anchor);
    }

    return g;
  }

  /** A riveted water tank on a lattice tower, with a catwalk and a downpipe. */
  buildWaterTower() {
    const g = new THREE.Group();
    const H = 8.4;
    const R = 2.0;

    // Four raked legs with cross bracing: a tower, not four posts.
    const legs = [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]];
    for (const [lx, lz] of legs) {
      const leg = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.2, H, 0.2)), this.darkSteelMat
      );
      leg.position.set(lx * 1.18, H / 2, lz * 1.18);
      leg.rotation.set(lz * 0.03, 0, -lx * 0.03);
      leg.castShadow = tierAtLeast('T4');
      g.add(leg);
      const foot = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.52, 0.12, 0.52)), this.plateMat
      );
      foot.position.set(lx * 1.26, 0.06, lz * 1.26);
      g.add(foot);
    }
    for (let y = 1.6; y < H - 0.6; y += 2.2) {
      for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const brace = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(3.4, 0.09, 0.09)), this.darkSteelMat
        );
        brace.position.set(dx * 1.72, y, dz * 1.72);
        brace.rotation.y = dx ? Math.PI / 2 : 0;
        g.add(brace);
        const diag = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(4.0, 0.07, 0.07)), this.darkSteelMat
        );
        diag.position.set(dx * 1.72, y + 1.1, dz * 1.72);
        diag.rotation.set(0, dx ? Math.PI / 2 : 0, 0.55);
        g.add(diag);
      }
    }

    // The tank: a riveted shell with a conical roof and a hoop at every course.
    const tank = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(R, R, 3.0, 22)), this.drumMat
    );
    tank.position.y = H + 1.5;
    tank.castShadow = tank.receiveShadow = tierAtLeast('T4');
    g.add(tank);
    for (const hy of [-1.0, 0, 1.0]) {
      const hoop = new THREE.Mesh(
        this.own(new THREE.TorusGeometry(R + 0.03, 0.035, 6, 24)), this.darkSteelMat
      );
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = H + 1.5 + hy;
      g.add(hoop);
      const ring = boltRing(R + 0.03, 16, this.darkSteelMat, { size: 0.022, axis: 'y' });
      ring.position.y = H + 1.5 + hy;
      g.add(ring);
    }
    const roof = new THREE.Mesh(
      this.own(new THREE.ConeGeometry(R + 0.12, 0.7, 22)), this.plateMat
    );
    roof.position.y = H + 3.35;
    roof.castShadow = tierAtLeast('T4');
    g.add(roof);

    // Catwalk round the tank, with a handrail and a ladder up to it.
    const walk = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(R + 0.44, 0.06, 5, 26)), this.treadMat
    );
    walk.rotation.x = Math.PI / 2;
    walk.position.y = H + 0.1;
    g.add(walk);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const stanch = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6)), this.pipeMat
      );
      stanch.position.set(Math.cos(a) * (R + 0.44), H + 0.6, Math.sin(a) * (R + 0.44));
      g.add(stanch);
    }
    const rail = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(R + 0.44, 0.028, 5, 26)), this.pipeMat
    );
    rail.rotation.x = Math.PI / 2;
    rail.position.y = H + 1.08;
    g.add(rail);

    // The downpipe, elbowed at the bottom.
    const down = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.13, 0.13, H + 0.6, 12)), this.pipeMat
    );
    down.position.set(R + 0.6, (H + 0.6) / 2, 0);
    g.add(down);
    const elbow = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.13, 0.13, 1.1, 12)), this.pipeMat
    );
    elbow.rotation.z = Math.PI / 2;
    elbow.position.set(R + 1.1, 0.3, 0);
    g.add(elbow);

    return g;
  }

  /** A lattice mast carrying a feeder and one obstruction lamp. */
  buildCableMast() {
    const g = new THREE.Group();
    const H = 9.0;

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(0.1, H, 0.1)), this.darkSteelMat
      );
      leg.position.set(Math.cos(a) * 0.42, H / 2, Math.sin(a) * 0.42);
      leg.castShadow = tierAtLeast('T4');
      g.add(leg);
    }
    for (let y = 0.8; y < H; y += 1.2) {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        const b = ((i + 1) / 3) * Math.PI * 2;
        const ax = Math.cos(a) * 0.42, az = Math.sin(a) * 0.42;
        const bx = Math.cos(b) * 0.42, bz = Math.sin(b) * 0.42;
        const len = Math.hypot(bx - ax, bz - az);
        const bar = new THREE.Mesh(
          this.own(new THREE.BoxGeometry(len, 0.05, 0.05)), this.darkSteelMat
        );
        bar.position.set((ax + bx) / 2, y, (az + bz) / 2);
        bar.rotation.y = -Math.atan2(bz - az, bx - ax);
        g.add(bar);
      }
    }

    // The crossarm and its insulators.
    const arm = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(2.4, 0.09, 0.09)), this.darkSteelMat
    );
    arm.position.y = H - 0.8;
    g.add(arm);
    for (const ix of [-1.0, -0.4, 0.4, 1.0]) {
      const ins = new THREE.Mesh(
        this.own(new THREE.CylinderGeometry(0.06, 0.07, 0.18, 8)),
        this.own(new THREE.MeshStandardMaterial({ color: 0x6b5f4e, roughness: 0.55 }))
      );
      ins.position.set(ix, H - 0.68, 0);
      g.add(ins);
    }

    // THE LAMP. A lamp, so it is lit — the one thing on this mast that glows.
    const lamp = new THREE.Mesh(
      this.own(new THREE.SphereGeometry(0.14, 12, 10)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0x6b3a20, emissive: SODIUM, emissiveIntensity: 1.3, roughness: 0.5
      }))
    );
    lamp.position.y = H + 0.2;
    lamp.userData.noMerge = true;   // its emissive flickers in update()
    g.add(lamp);
    this.lamps.push(lamp);

    const cage = new THREE.Mesh(
      this.own(new THREE.TorusGeometry(0.2, 0.018, 5, 12)), this.darkSteelMat
    );
    cage.position.y = H + 0.2;
    g.add(cage);

    return g;
  }

  /**
   * The landing apron: where the shuttle sets down, and the way off Ligar.
   * A surface, not a body — everything on it stands ON it.
   */
  buildLandingPad() {
    const g = new THREE.Group();
    g.userData.phys = 'ground';

    const pad = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(7.4, 7.6, 0.24, 28)), this.plateMat
    );
    pad.position.y = 0.1;
    pad.receiveShadow = tierAtLeast('T4');
    g.add(pad);

    // The circle painted on it, and the four blast deflectors round the rim.
    const ring = new THREE.Mesh(
      this.own(new THREE.RingGeometry(4.4, 5.1, 40)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0xb08a2c, transparent: true, opacity: 0.55, roughness: 0.85,
        side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3
      }))
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.23;
    g.add(ring);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const fin = new THREE.Mesh(
        this.own(new THREE.BoxGeometry(2.4, 1.2, 0.16)), this.darkSteelMat
      );
      fin.position.set(Math.cos(a) * 6.5, 0.8, Math.sin(a) * 6.5);
      fin.rotation.y = -a + Math.PI / 2;
      fin.castShadow = tierAtLeast('T4');
      g.add(fin);
      // A lamp on each deflector, because a pad you land on at dusk is lit.
      const lamp = new THREE.Mesh(
        this.own(new THREE.SphereGeometry(0.1, 10, 8)),
        this.own(new THREE.MeshStandardMaterial({
          color: 0x5c3a22, emissive: SODIUM, emissiveIntensity: 1.1, roughness: 0.5
        }))
      );
      lamp.position.set(Math.cos(a) * 6.5, 1.52, Math.sin(a) * 6.5);
      lamp.userData.noMerge = true;
      g.add(lamp);
    }

    return g;
  }

  /** T4 decoration: a survey stake with a wind-shredded flag. */
  buildStakeMarker(sx = 0, ground = null) {
    const g = new THREE.Group();
    const stake = new THREE.Mesh(
      this.own(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6)), this.darkSteelMat
    );
    stake.position.y = 0.8;
    stake.castShadow = tierAtLeast('T4');
    g.add(stake);
    const flag = new THREE.Mesh(
      this.own(new THREE.PlaneGeometry(0.32, 0.22)),
      this.own(new THREE.MeshStandardMaterial({
        color: 0xa8342a, roughness: 0.98, side: THREE.DoubleSide
      }))
    );
    flag.position.set(0.17, 1.44, 0);
    flag.rotation.y = 0.4 + (sx % 3) * 0.2;
    g.add(flag);
    // A heap of stones holding the stake up, the way a survey mark is set on
    // rock you cannot drive anything into.
    const cairn = this.buildRubbleField({
      count: 9, minX: -0.32, maxX: 0.32, minZ: -0.32, maxZ: 0.32,
      y: -0.02, seed: 0x4c21 + Math.round(sx * 11), scale: 0.3, mound: 0.16, ground
    });
    cairn.userData.noMerge = true;
    g.add(cairn);
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

    /* THE TERRACE. A slab of cut pavement, kerbed, standing a step proud of
       the ground so the bench is not working in the dust. */
    const terrace = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(9.0, 0.3, 6.4)), this.basaltMat
    );
    this.raised.push({
      kind: 'rect', cx: site.pos[0], cz: site.pos[2], rot: this.siteFacing(site),
      hx: 4.5, hz: 3.2, y: baseY + 0.3
    });
    terrace.position.y = 0.15;
    terrace.receiveShadow = terrace.castShadow = tierAtLeast('T4');
    g.add(terrace);
    // The step up onto it, on the approach side only.
    const step = new THREE.Mesh(
      this.own(new THREE.BoxGeometry(3.2, 0.15, 0.6)), this.basaltMat
    );
    step.position.set(0, 0.075, 3.5);
    g.add(step);

    /* THE PORTAL. Two piers of stacked prism carrying a lintel, five metres
       clear. Built from the same hexagons as everything else, so it reads as
       quarried out of the colonnade rather than imported from a temple. */
    const PIER_X = 3.5;
    const CLEAR = 4.6;
    for (const px of [-PIER_X, PIER_X]) {
      const pierCols = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const rr = i === 8 ? 0 : 0.5;
        pierCols.push({
          x: px + Math.cos(a) * rr, z: Math.sin(a) * rr,
          r: 0.32 + rand() * 0.12,
          h: CLEAR * (0.92 + rand() * 0.14)
        });
      }
      const mesh = new THREE.InstancedMesh(this.hexGeo, this.basaltMat, pierCols.length);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const pos = new THREE.Vector3();
      const scl = new THREE.Vector3();
      pierCols.forEach((c, i) => {
        q.setFromEuler(new THREE.Euler(0, rand() * Math.PI, 0));
        pos.set(c.x, 0.3 + c.h / 2, c.z);
        scl.set(c.r * 2, c.h, c.r * 2);
        m.compose(pos, q, scl);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = mesh.receiveShadow = tierAtLeast('T4');
      mesh.frustumCulled = false;
      mesh.userData.noMerge = true;
      recordInstanceBoxes(mesh);
      g.add(mesh);
    }
    // The lintel: prisms laid on their sides across the gap, which is what the
    // jointing does when a flow cools over a void.
    const lintelCount = 9;
    const lintel = new THREE.InstancedMesh(this.hexGeo, this.basaltMat, lintelCount);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const pos = new THREE.Vector3();
      const scl = new THREE.Vector3();
      for (let i = 0; i < lintelCount; i++) {
        const t = (i + 0.5) / lintelCount;
        const r = 0.28 + rand() * 0.08;
        q.setFromEuler(new THREE.Euler(0, 0, Math.PI / 2 + (rand() - 0.5) * 0.04));
        pos.set(0, 0.3 + CLEAR + 0.34 + (rand() - 0.5) * 0.06, (t - 0.5) * 1.5);
        scl.set(r * 2, PIER_X * 2 + 0.9, r * 2);
        m.compose(pos, q, scl);
        lintel.setMatrixAt(i, m);
      }
    }
    lintel.instanceMatrix.needsUpdate = true;
    lintel.castShadow = lintel.receiveShadow = tierAtLeast('T4');
    lintel.frustumCulled = false;
    lintel.userData.noMerge = true;
    recordInstanceBoxes(lintel);
    g.add(lintel);

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

    /* THE MOUTH. A ragged arch of prisms across the front, so walking in is
       walking under something. The middle is left clear — a doorway you cannot
       use is worse than no doorway at all. */
    const mouthCols = [];
    for (let i = 0; i < 30; i++) {
      const a = Math.PI * (i / 29);
      const px = Math.cos(a) * (R + 0.3);
      const py = Math.sin(a) * (R + 0.3) + SPRING;
      if (py < 2.5 && Math.abs(px) < 2.4) continue;   // keep the doorway open
      mouthCols.push({
        x: ox + px, y: py, r: 0.24 + rand() * 0.14,
        len: 0.7 + rand() * 0.9, dir: a
      });
    }
    const mouth = new THREE.InstancedMesh(this.hexGeo, this.basaltMat, mouthCols.length);
    {
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const pos = new THREE.Vector3();
      const scl = new THREE.Vector3();
      mouthCols.forEach((c, i) => {
        // The prism's axis points radially out of the arch, which is what the
        // jointing does round a void, and what the great arches do too.
        q.setFromEuler(new THREE.Euler(0, 0, c.dir - Math.PI / 2));
        pos.set(c.x, c.y, MOUTH_Z - 0.3);
        scl.set(c.r * 2, c.len, c.r * 2);
        m.compose(pos, q, scl);
        mouth.setMatrixAt(i, m);
      });
    }
    mouth.instanceMatrix.needsUpdate = true;
    mouth.castShadow = mouth.receiveShadow = tierAtLeast('T4');
    mouth.frustumCulled = false;
    recordInstanceBoxes(mouth);
    g.add(mouth);

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
   * A caged sodium luminaire: a lamp, so it is lit. The diffuser glows and a
   * point light hangs under it. Returned as a group with `noMerge`, because the
   * lamp flickers and a baked lamp could not.
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
    const light = new THREE.PointLight(0xffc98a, 6.5, 11, 1.4);
    light.position.y = -0.3;
    g.add(light);
    g.position.set(x, y, z);
    return g;
  }

  /* ======================================================================
     DUST
     Grit carried on the wind across the quarry, and finer motes hanging in
     the low sun. The only things in the world that move by themselves besides
     the fire and the lamps.
     ====================================================================== */

  initDust() {
    const density = this.data.ambience.dustDensity ?? 0.25;
    const make = (count, spread, lift, size, color, opacity) => {
      const geo = this.own(new THREE.BufferGeometry());
      const pos = new Float32Array(count * 3);
      const speeds = new Float32Array(count);
      const rand = mulberry32(0xd057 + count);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (rand() - 0.5) * spread;
        pos[i * 3 + 1] = rand() * lift;
        pos[i * 3 + 2] = (rand() - 0.5) * spread;
        speeds[i] = 0.4 + rand() * 1.4;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = this.own(new THREE.PointsMaterial({
        color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true
      }));
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      points.userData.phys = 'ambient';
      this.scene.add(points);
      return { points, speeds, lift };
    };
    const n = tierAtLeast('T4') ? 1400 : 600;
    this.dustParticles = make(Math.round(n * density * 4), 170, 14, 0.09, 0x8a7560, 0.34);
    this.groundGrit = make(Math.round(n * density * 3), 170, 1.2, 0.05, 0x5a4c3e, 0.5);
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
        this.colliders.push({ x: wx, z: wz, radius: 0.85 });
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
      const R = 14 * (lm.scale || 1);
      local = [[-R, 0], [R, 0]];
      radius = 2.3 * (lm.scale || 1) * 1.2;
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

    // Dust drifts downwind and recycles at the far edge.
    for (const l of [this.dustParticles, this.groundGrit]) {
      if (!l) continue;
      const p = l.points.geometry.attributes.position;
      const arr = p.array;
      for (let i = 0; i < l.speeds.length; i++) {
        arr[i * 3] += l.speeds[i] * delta * 1.4;
        arr[i * 3 + 2] -= l.speeds[i] * delta * 0.5;
        arr[i * 3 + 1] -= l.speeds[i] * delta * 0.1;
        if (arr[i * 3] > 85) arr[i * 3] = -85;
        if (arr[i * 3 + 2] < -85) arr[i * 3 + 2] = 85;
        if (arr[i * 3 + 1] < 0.04) arr[i * 3 + 1] = l.lift;
      }
      p.needsUpdate = true;
    }

    // The fire breathes. Two sines at unrelated rates, so it never loops
    // visibly; the coals follow the light at a lag, the way embers do.
    if (this.forgeLight) {
      const f = 1 + Math.sin(this.elapsed * 7.3) * 0.08 + Math.sin(this.elapsed * 2.9 + 1.3) * 0.12;
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
    for (const d of this.disposables) {
      try { d.dispose(); } catch (e) {}
    }
    this.disposables = [];
    this.scene.clear();
    this.siteMarkers.clear();
    this.benchAnchors.clear();
    this.colliders = [];
    this.lamps = [];
  }
}
