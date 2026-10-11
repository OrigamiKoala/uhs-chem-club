/**
 * foebody.js — Spoil, built.
 *
 * The bodies a fight stands on the bench at T4 (docs/plans/storyline-and-combat.md,
 * Phase 5). They are procedural, from a small kit, the way `basalt.js` builds
 * rock: a salt husk is an aggregate of fractured halite crystals (one instanced
 * body, so a husk can SPLIT, SCATTER, SETTLE INTO LAYERS or CRUMBLE without a
 * second model), and a lamp moth is a lofted metal shell — scoured wings over a
 * segmented carapace, six wire legs, two antennae, no eyes.
 *
 * THE RULES THIS FILE ANSWERS TO
 *   - NO MAGIC. A body never decides what it does. `setPose(pose, plan)` is told
 *     the pose by `Encounter`, which got it from `planFoe`, which asked the
 *     instrument's own planner. This file only knows how to MOVE into a pose.
 *   - THE IDLE BODY GIVES NOTHING AWAY. A husk's shape comes from its id and its
 *     tint from the first kind in it — exactly what the crate in the well already
 *     shows — so two husks that look alike on the bench look alike here.
 *   - DISPERSED, NEVER KILLED. A husk crumbles into loose salt and is swept off
 *     the plate; a moth goes dark, droops and drifts away. No gore, no remains.
 *   - SCOURED PLATE. Plate grey and bone white; amber only for a REAL EVENT (a
 *     blade glancing off, an electron leaving). No eyes, no glow, no bloom.
 *   - REDUCED MOTION. `setPose(..., instant)` snaps, and the idle tremor is off.
 *
 * Every body is built in the frame of the station's well: origin on the well
 * floor, +y up, +z toward the player. It is told nothing about the world.
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  makeRng, hashStr, texSize, heightField, readHeight, writeField, canvas2d,
  fbm, worley, heightToNormal, heightToAO, asColorTexture, asDataTexture,
  enableAO, cachedMaterial
} from '../../three/materials/pbr-kit.js';

const AMBER = 0xe59b24;

/** The well, in metres. A body must fit inside it. */
export const WELL_R = 0.27;

/* ------------------------------------------------------------------
   SURFACES
   One height field behind albedo, normal, roughness and AO, as everywhere
   else in this product, so the maps agree.
   ------------------------------------------------------------------ */

function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Halite: a crystal face with growth granules, cleavage hairlines and grit. */
function saltCrystalSurface(seed = 3) {
  const S = texSize(256);
  const sd = hashStr(`halite${seed}`);

  const height = heightField(S, (u, v) => {
    const g = worley(u * 12, v * 12, 12, sd);
    const fine = worley(u * 31, v * 31, 31, sd ^ 0x77);
    let h = 0.58 + Math.min(g.f1, 0.5) * -0.22 + Math.min(fine.f1, 0.5) * -0.08;
    h -= Math.max(0, 1 - g.border * 22) * 0.2;                 // cleavage hairlines
    h += (fbm(u * 70, v * 70, { octaves: 3, period: 70, seed: sd ^ 0x15 }) - 0.5) * 0.07;
    return h;
  });

  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d', { willReadFrequently: true });
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  const cold = [226, 224, 216];
  const warm = [214, 205, 188];
  const crack = [150, 146, 138];
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];
    const cell = worley(u * 12, v * 12, 12, sd);
    // Each granule its own tone: a crystal is never one flat white.
    let c = lerp3(cold, warm, cell.id * 0.8 + (fbm(u * 5, v * 5, { octaves: 3, period: 5, seed: sd }) - 0.5) * 0.5);
    c = lerp3(crack, c, Math.min(1, Math.max(0, (h - 0.3) / 0.28)));
    img.data[i * 4] = c[0]; img.data[i * 4 + 1] = c[1]; img.data[i * 4 + 2] = c[2]; img.data[i * 4 + 3] = 255;
    // Faces are smoother than the hairlines between them.
    rough[i] = Math.max(0.32, Math.min(0.9, 0.78 - (h - 0.4) * 0.9));
  }
  actx.putImageData(img, 0, 0);

  return {
    albedo: alb, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 6), strength: 1.1 }),
    normalStrength: 2.6
  };
}

/** A wing or carapace sheet: scoured metal with radial veins and concentric ribs. */
function shellSurface(seed = 5) {
  const S = texSize(256);
  const sd = hashStr(`shell${seed}`);
  const VEINS = 11;

  const height = heightField(S, (u, v) => {
    // Veins fan from the hinge at the lower left of the sheet.
    const dx = u - 0.04, dy = v - 0.5;
    const r = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    const vein = Math.max(0, 1 - Math.abs(Math.sin(a * VEINS * 0.5)) * 7) * Math.min(1, r * 3) * (1 - Math.min(1, r * 0.9) * 0.45);
    const rib = Math.max(0, 1 - Math.abs(Math.sin(r * 38)) * 6) * 0.25;
    let h = 0.5 + vein * 0.3 + rib * 0.1;
    // Rolled-sheet grain, along the veins' general direction.
    h += (fbm(u * 120, v * 8, { octaves: 2, period: 120, seed: sd }) - 0.5) * 0.06;
    // Scoured: long, shallow scratches the sand has put across it.
    h -= Math.max(0, 1 - Math.abs(Math.sin((u * 0.7 + v * 1.6) * 90 + fbm(u * 6, v * 6, { octaves: 2, period: 6, seed: sd ^ 3 }) * 9)) * 18) * 0.12;
    return h;
  });

  const hf = readHeight(height);
  const alb = canvas2d(S, S);
  const actx = alb.getContext('2d', { willReadFrequently: true });
  const img = actx.createImageData(S, S);
  const rough = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const u = x / S, v = y / S;
    const h = hf.data[i];
    // Grey-white base: the material colour is the material's `color` tint.
    const t = 0.64 + (h - 0.5) * 0.9 + (fbm(u * 9, v * 9, { octaves: 3, period: 9, seed: sd ^ 9 }) - 0.5) * 0.18;
    // Oxidised toward the rim of the sheet, where the weather got in.
    const edge = Math.min(1, Math.max(0, (Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) - 0.38) * 6));
    const k = Math.max(0.12, Math.min(1, t * (1 - edge * 0.45))) * 255;
    img.data[i * 4] = k; img.data[i * 4 + 1] = k * 0.99; img.data[i * 4 + 2] = k * 0.97; img.data[i * 4 + 3] = 255;
    rough[i] = Math.max(0.22, Math.min(0.85, 0.62 - (h - 0.5) * 0.7 + edge * 0.25));
  }
  actx.putImageData(img, 0, 0);

  return {
    albedo: alb, height,
    roughness: writeField({ data: rough, w: S, h: S }),
    ao: heightToAO(height, { radius: Math.max(3, S >> 6), strength: 0.9 }),
    normalStrength: 2.2
  };
}

/**
 * Surface maps, or none. A host with no readable 2D canvas (a stubbed DOM, a
 * locked-down webview) cannot generate a height field; the foe is then drawn in
 * flat colour rather than the bench failing to stand up at all.
 */
function mapsOf(surface) {
  try {
    const s = surface();
    return [
      asColorTexture(s.albedo, 1),
      asDataTexture(heightToNormal(s.height, s.normalStrength), 1),
      asDataTexture(s.roughness, 1),
      asDataTexture(s.ao, 1)
    ];
  } catch {
    return [null, null, null, null];
  }
}

function huskMaterial() {
  return cachedMaterial('foe:husk', () => {
    const maps = mapsOf(saltCrystalSurface);
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: maps[0], normalMap: maps[1], roughnessMap: maps[2], aoMap: maps[3],
      roughness: maps[2] ? 1 : 0.7, metalness: 0,
      // A crystal face has a thin bright skin over a dull body.
      clearcoat: 0.22, clearcoatRoughness: 0.45,
      sheen: 0.35, sheenRoughness: 0.7, sheenColor: new THREE.Color(0xd6cfbd),
      specularIntensity: 0.8
    });
    m.userData.surfaceMaps = maps.filter(Boolean);
    return m;
  });
}

/** The shared shell maps; each moth clones its own material over them. */
function shellMaps() {
  return cachedMaterial('foe:shell-maps', () => {
    const maps = mapsOf(shellSurface);
    // Wrapped in a throwaway material so `disposeSurfaceCache` frees the maps.
    const holder = new THREE.MeshBasicMaterial();
    holder.userData.surfaceMaps = maps.filter(Boolean);
    holder.userData.maps = maps;
    return holder;
  }).userData.maps;
}

/* ------------------------------------------------------------------
   SHARED GEOMETRY
   ------------------------------------------------------------------ */

let crystalGeo = null;
/** A chamfered unit cube: cut corners, never rounded ones (CLAUDE.md, the geometry brief). */
function crystalGeometry() {
  if (!crystalGeo) {
    crystalGeo = enableAO(new RoundedBoxGeometry(1, 1, 1, 1, 0.09));
  }
  return crystalGeo;
}

let blobTex = null;
/** A soft contact shadow, drawn once: the foe sits ON the plate, not above it. */
function contactTexture() {
  if (blobTex) return blobTex;
  const c = canvas2d(64, 64);
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  blobTex = new THREE.CanvasTexture(c);
  return blobTex;
}

function contactShadow(radius, y = 0.0165) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({
      map: contactTexture(), transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.renderOrder = 1;
  return m;
}

/** An invisible, generous press target: a finger arrives at a glancing angle. */
function hitTarget(radius, height) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
  );
  m.position.y = height / 2;
  m.userData.foeHit = true;
  return m;
}

/* ------------------------------------------------------------------
   THE SALT HUSK
   ------------------------------------------------------------------ */

const HUSK_N = 34;
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

/** A target for every crystal: position, orientation, size and tone. */
function emptyTargets(n) {
  return {
    pos: new Float32Array(n * 3), quat: new Float32Array(n * 4),
    scl: new Float32Array(n * 3), tone: new Float32Array(n)
  };
}

function setQuat(arr, i, x, y, z) {
  _e.set(x, y, z, 'YXZ');
  _q.setFromEuler(_e);
  arr[i * 4] = _q.x; arr[i * 4 + 1] = _q.y; arr[i * 4 + 2] = _q.z; arr[i * 4 + 3] = _q.w;
}

/**
 * Lay the crystals of one husk out: its idle mound, and every other pose it can
 * take, all derived from one seeded roll so a husk is itself in every pose.
 */
function huskKit(seed) {
  const rng = makeRng(hashStr(`husk:${seed}`));
  const crystals = [];
  for (let i = 0; i < HUSK_N; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * 0.118;
    const top = 0.125 * (1 - Math.pow(r / 0.15, 1.8));
    const size = [0.044 + rng() * 0.04, 0.04 + rng() * 0.042, 0.044 + rng() * 0.04];
    crystals.push({
      a, r, size,
      mound: [Math.cos(a) * r, 0.02 + size[1] * 0.35 + rng() * Math.max(0.01, top - size[1] * 0.2), Math.sin(a) * r],
      yaw: rng() * Math.PI, tilt: [(rng() - 0.5) * 0.5, (rng() - 0.5) * 0.5],
      tone: 0.8 + rng() * 0.2,
      ga: rng() * Math.PI * 2, gr: Math.sqrt(rng()) * 0.225,
      gy: rng() * Math.PI, rank: rng(),
      lx: (rng() - 0.5) * 0.3, lz: (rng() - 0.5) * 0.3,
      delay: rng() * 0.2
    });
  }
  // Which side of the fracture each crystal falls on: a plane through the mound,
  // turned a little off square so the two halves part visibly from the front.
  const phi = (rng() - 0.5) * 0.9;
  const nx = Math.cos(phi), nz = Math.sin(phi);
  crystals.forEach(c => { c.side = c.mound[0] * nx + c.mound[2] * nz >= 0 ? 1 : -1; c.nx = nx; c.nz = nz; });
  // Rank order, for assigning crystals to layers.
  const order = [...crystals].sort((a, b) => a.rank - b.rank);
  order.forEach((c, k) => { c.k = k; });
  return crystals;
}

function huskTargets(kit, pose, plan) {
  const n = kit.length;
  const t = emptyTargets(n);
  const layers = Math.max(1, Math.min(4, plan?.layers || 1));
  kit.forEach((c, i) => {
    let p = c.mound, sx = c.size[0], sy = c.size[1], sz = c.size[2];
    let rx = c.tilt[0], ry = c.yaw, rz = c.tilt[1];
    let tone = c.tone;

    if (pose === 'split') {
      // Two halves part along the fracture and each settles on its cut face.
      const gap = 0.055;
      p = [c.mound[0] + c.nx * gap * c.side, c.mound[1] - 0.004, c.mound[2] + c.nz * gap * c.side];
      rz += c.side * 0.07;
    } else if (pose === 'scattered' || pose === 'dispersed') {
      // Loose grains lying where they fell.
      const k = pose === 'dispersed' ? 0.2 : 0.36;
      sx *= k; sy *= k; sz *= k;
      p = [Math.cos(c.ga) * c.gr, 0.018 + sy * 0.5, Math.sin(c.ga) * c.gr];
      rx = 0; rz = 0; ry = c.gy;
      if (pose === 'dispersed') tone *= 0.85;
    } else if (pose === 'layered' || pose === 'even') {
      // Strata: heaviest lowest, each band one slab of crystals laid flat.
      const n2 = pose === 'even' ? 1 : layers;
      const layer = pose === 'even' ? 0 : Math.min(n2 - 1, Math.floor((c.k / n - 1e-6) * n2));
      const band = pose === 'even' ? 0.05 : 0.15 / n2;
      sx = 0.1 + (c.size[0] - 0.044) * 1.3; sz = 0.1 + (c.size[2] - 0.044) * 1.3; sy = band * 0.94;
      p = [c.lx * 0.9, 0.018 + (layer + 0.5) * band, c.lz * 0.9];
      rx = 0; rz = 0; ry = c.yaw * 0.25;
      tone = pose === 'even' ? 0.92 : 0.58 + (layer / Math.max(1, n2 - 1)) * 0.42;
    }
    // A crystal rests ON the crate: its lowest corner, tilted as it is, never
    // dips below the puck it sits on.
    const lift = 0.0125 + 0.5 * (sy + sx * Math.abs(Math.sin(rz)) + sz * Math.abs(Math.sin(rx)));
    p = [p[0], Math.max(p[1], lift), p[2]];
    t.pos[i * 3] = p[0]; t.pos[i * 3 + 1] = p[1]; t.pos[i * 3 + 2] = p[2];
    t.scl[i * 3] = sx; t.scl[i * 3 + 1] = sy; t.scl[i * 3 + 2] = sz;
    setQuat(t.quat, i, rx, ry, rz);
    t.tone[i] = tone;
  });
  return t;
}

/**
 * @param {object} foe `{ id, label, item }`
 * @param {{ tints?: object, kinds?: object }} env
 */
export function buildHusk(foe, env = {}) {
  const kit = huskKit(foe.id);
  const group = new THREE.Group();
  group.name = `husk:${foe.id}`;

  // The same tint the crate in the well is poured in, lifted toward white: a
  // husk is salt-crusted, but it is still the sample it is made of.
  const kindId = foe.item?.particles?.[0]?.kinds?.[0];
  const tintKey = env.kinds?.[kindId]?.tint || 'pale';
  const fill = env.tints?.[tintKey]?.fill ?? 0x8f8678;
  const base = new THREE.Color(fill).lerp(new THREE.Color(0xffffff), 0.4);

  const mesh = new THREE.InstancedMesh(crystalGeometry(), huskMaterial(), HUSK_N);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(mesh);

  const shadow = contactShadow(0.2);
  group.add(shadow);
  const hit = hitTarget(0.2, 0.18);
  group.add(hit);

  // The glance of a blade that did nothing: the one amber thing on a husk, and
  // only for as long as the event lasts.
  const sparkMat = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthWrite: false });
  const spark = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.0035, 0.0035), sparkMat);
  spark.position.set(-0.075, 0.11, 0.1);
  spark.rotation.z = -0.55;
  group.add(spark);

  // Dust: when salt breaks it throws a puff of fines, which hang a moment and
  // settle. Seeded like everything else, and low enough to stay under every
  // line of sight to a screen.
  const PUFF = 26;
  const dustMat = new THREE.MeshBasicMaterial({ color: 0xd9d3c5, transparent: true, opacity: 0.55, depthWrite: false });
  const dustGeo = new THREE.IcosahedronGeometry(1, 0);
  const dust = new THREE.InstancedMesh(dustGeo, dustMat, PUFF);
  dust.frustumCulled = false;
  dust.count = 0;
  group.add(dust);
  const dustRng = makeRng(hashStr(`dust:${foe.id}`));
  const motes = Array.from({ length: PUFF }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: 0.002 }));

  const N = HUSK_N;
  const cur = emptyTargets(N);
  let tgt = huskTargets(kit, 'idle');
  cur.pos.set(tgt.pos); cur.quat.set(tgt.quat); cur.scl.set(tgt.scl); cur.tone.set(tgt.tone);
  const wait = new Float32Array(N);

  const body = {
    species: 'salt husk',
    group, hit, mesh,
    pose: 'idle', since: 0, gone: false,
    spark: 0, lunge: 0, still: false, t: 0, phase: (hashStr(foe.id) % 628) / 100,
    /** Height of the tallest thing in this body, for the glass check. */
    reach: 0.17,

    setPose(pose, plan, instant = false) {
      if (pose === body.pose && !plan?.layers) return;
      if (pose === body.pose && plan?.layers === body._layers) return;
      body._layers = plan?.layers;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      tgt = huskTargets(kit, pose, plan);
      kit.forEach((c, i) => { wait[i] = instant ? 0 : c.delay; });
      if (pose === 'unmoved' && !instant) body.spark = 1;
      if (!instant && (pose === 'split' || pose === 'scattered' || pose === 'dispersed')) body.burst();
      if (instant) body.snap();
    },

    snap() {
      cur.pos.set(tgt.pos); cur.quat.set(tgt.quat); cur.scl.set(tgt.scl); cur.tone.set(tgt.tone);
      wait.fill(0);
      body.write(0);
    },

    /** A puff of fines off the break. */
    burst() {
      body.puff = 1;
      dust.count = PUFF;
      for (const m of motes) {
        const a = dustRng() * Math.PI * 2, r = dustRng() * 0.13;
        m.p.set(Math.cos(a) * r, 0.05 + dustRng() * 0.07, Math.sin(a) * r);
        m.v.set(Math.cos(a) * (0.02 + dustRng() * 0.07), 0.2 + dustRng() * 0.3, Math.sin(a) * (0.02 + dustRng() * 0.07));
        m.r = 0.0016 + dustRng() * 0.003;
      }
    },
    puff: 0,
    look: 0,

    /** The foe answers a committed miss: it comes at the player and falls back. */
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      // It turns, a little, to keep the player in front of it.
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      // Crumbled salt is swept off the plate after it has lain a while.
      if (body.pose === 'dispersed' && body.since > 1.6 && !body.gone) {
        for (let i = 0; i < N; i++) { tgt.scl[i * 3] = tgt.scl[i * 3 + 1] = tgt.scl[i * 3 + 2] = 0.0001; }
        if (reduced || body.since > 3.4) { body.gone = true; group.visible = false; }
      }
      const rate = reduced ? 1e3 : 7.5;
      for (let i = 0; i < N; i++) {
        if (wait[i] > 0) { wait[i] -= dt; continue; }
        const k = 1 - Math.exp(-rate * dt);
        for (let a = 0; a < 3; a++) {
          cur.pos[i * 3 + a] += (tgt.pos[i * 3 + a] - cur.pos[i * 3 + a]) * k;
          cur.scl[i * 3 + a] += (tgt.scl[i * 3 + a] - cur.scl[i * 3 + a]) * k;
        }
        // Orientation: a slerp toward the target, small steps, normalised.
        _q.set(cur.quat[i * 4], cur.quat[i * 4 + 1], cur.quat[i * 4 + 2], cur.quat[i * 4 + 3]);
        const tq = new THREE.Quaternion(tgt.quat[i * 4], tgt.quat[i * 4 + 1], tgt.quat[i * 4 + 2], tgt.quat[i * 4 + 3]);
        _q.slerp(tq, k);
        cur.quat[i * 4] = _q.x; cur.quat[i * 4 + 1] = _q.y; cur.quat[i * 4 + 2] = _q.z; cur.quat[i * 4 + 3] = _q.w;
        cur.tone[i] += (tgt.tone[i] - cur.tone[i]) * k;
      }
      body.lunge = Math.max(0, body.lunge - dt * 2.6);
      body.spark = Math.max(0, body.spark - dt * 1.1);
      sparkMat.opacity = body.spark;
      if (dust.count) {
        body.puff = Math.max(0, body.puff - dt * 1.1);
        if (body.puff <= 0 || reduced) { dust.count = 0; body.puff = 0; }
        for (let i = 0; i < dust.count; i++) {
          const m = motes[i];
          m.v.y -= 2.4 * dt;                       // fines fall like anything else
          m.v.multiplyScalar(1 - 1.6 * dt);        // and the air holds them back
          m.p.addScaledVector(m.v, dt);
          if (m.p.y < 0.016) { m.p.y = 0.016; m.v.set(0, 0, 0); }
          _m.compose(m.p, _q.identity(), _s.setScalar(m.r * Math.min(1, body.puff * 2.2)));
          dust.setMatrixAt(i, _m);
        }
        dust.instanceMatrix.needsUpdate = true;
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      // Idle: the aggregate is never quite still — a tremor of a fraction of a
      // degree, as a braced thing shifts its weight.
      const idle = body.pose === 'idle' || body.pose === 'unmoved';
      const tremble = idle && !body.still ? 1 : 0;
      for (let i = 0; i < N; i++) {
        const j = t * 31 + i * 1.7 + body.phase;
        _p.set(
          cur.pos[i * 3] + tremble * Math.sin(j) * 0.0006,
          cur.pos[i * 3 + 1],
          cur.pos[i * 3 + 2] + tremble * Math.cos(j * 1.3) * 0.0006
        );
        _q.set(cur.quat[i * 4], cur.quat[i * 4 + 1], cur.quat[i * 4 + 2], cur.quat[i * 4 + 3]);
        _s.set(cur.scl[i * 3], cur.scl[i * 3 + 1], cur.scl[i * 3 + 2]);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(i, _m);
        _c.copy(base).multiplyScalar(cur.tone[i]);
        mesh.setColorAt(i, _c);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

      // The lunge: toward the player, a little up, and back.
      const l = Math.sin(Math.min(1, body.lunge) * Math.PI);
      // It rears toward the player and drops back; it never tips into the crate.
      group.position.set(body.baseX, body.baseY + l * 0.012, body.baseZ + l * 0.07);
      group.rotation.y = body.look * 0.25;
      const breathe = tremble ? 1 + Math.sin(t * 1.9 + body.phase) * 0.006 : 1;
      group.scale.set(1 + l * 0.05, breathe + l * 0.07, 1 + l * 0.09);
      shadow.scale.setScalar(1 + l * 0.12);
    },

    dispose() {
      sparkMat.dispose(); spark.geometry.dispose();
      dustMat.dispose(); dustGeo.dispose(); dust.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
      mesh.dispose();
    },

    baseX: 0,
    baseY: 0,
    baseZ: 0
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE LAMP MOTH
   ------------------------------------------------------------------ */

/** A metal's own colour, as it is in the cabinet: the shell IS the plate. */
const METAL_TONE = {
  Cs: 0xcdb98a,   // cesium: the one gold-tinged metal
  Na: 0xc9ccce,   // sodium: bright silvery grey
  Zn: 0xaab4bd    // zinc: bluish white
};

function wingGeometry(scale, reach, seed) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.008);
  s.bezierCurveTo(0.03, -0.024, 0.08, -0.02, 0.105, 0.012);
  s.bezierCurveTo(0.114, 0.03, 0.098, 0.054, 0.072, 0.06);
  s.bezierCurveTo(0.046, 0.054, 0.016, 0.042, 0, 0.03);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.0032, bevelEnabled: true, bevelThickness: 0.0009, bevelSize: 0.0012, bevelSegments: 1, curveSegments: 14
  });
  // The shape's plane becomes the wing's: shape +y runs aft, extrusion is up.
  geo.rotateX(-Math.PI / 2);
  geo.scale(scale, 1, scale * reach);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const rng = makeRng(hashStr(`wing${seed}`));
  const warp = (rng() - 0.5) * 0.02;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    // A shell, not a sheet: cambered across its width, drooping at the tip.
    pos.setY(i, pos.getY(i) - 0.9 * x * x + warp * x);
    uv.setXY(i, x / (0.12 * scale), (-z / (scale * reach) + 0.03) / 0.1);
  }
  geo.computeVertexNormals();
  enableAO(geo);
  return geo;
}

function tube(points, radius, segments = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, segments, radius, 6, false);
}

/**
 * @param {object} foe `{ id, label, item }` — `item.metal` is Cs, Na or Zn
 */
export function buildMoth(foe) {
  const group = new THREE.Group();
  group.name = `moth:${foe.id}`;
  const rng = makeRng(hashStr(`moth:${foe.id}`));
  const [mapC, mapN, mapR, mapA] = shellMaps();

  const tone = METAL_TONE[foe.item?.metal] ?? 0xc2c4c6;
  const shell = new THREE.MeshPhysicalMaterial({
    color: tone, map: mapC, normalMap: mapN, roughnessMap: mapR, aoMap: mapA,
    metalness: 0.92, roughness: mapR ? 1 : 0.5, side: THREE.DoubleSide,
    clearcoat: 0.12, clearcoatRoughness: 0.6, transparent: false, opacity: 1
  });
  const joint = new THREE.MeshStandardMaterial({ color: 0x3a3733, roughness: 0.6, metalness: 0.85 });

  const owned = [];   // geometries this moth made, to free
  const own = g => { owned.push(g); return g; };

  // Everything is built facing +z, on the perch's origin; the body sits a leg's
  // length above it.
  const rig = new THREE.Group();
  rig.position.y = 0.03;
  group.add(rig);

  // Carapace: abdomen with ribbed segments, a domed thorax, a plain visored head.
  const prof = [];
  for (let k = 0; k <= 26; k++) {
    const u = k / 26;
    const rib = 0.0011 * Math.max(0, Math.sin(u * Math.PI * 9));
    prof.push(new THREE.Vector2(Math.max(0.0008, 0.0165 * (1 - 0.8 * Math.pow(u, 1.5)) + rib), u * 0.066));
  }
  const abdomenGeo = own(new THREE.LatheGeometry(prof, 16));
  abdomenGeo.rotateX(-Math.PI / 2);   // lathe +y -> body -z (aft)
  const abdomen = new THREE.Mesh(abdomenGeo, shell);
  abdomen.position.z = -0.012;
  rig.add(abdomen);

  const thoraxGeo = own(new THREE.SphereGeometry(0.019, 18, 12));
  thoraxGeo.scale(1, 0.92, 1.35);
  const thorax = new THREE.Mesh(thoraxGeo, shell);
  thorax.position.z = 0.012;
  rig.add(thorax);

  const headGeo = own(new THREE.SphereGeometry(0.0115, 14, 10));
  headGeo.scale(1.1, 0.9, 1);
  const head = new THREE.Mesh(headGeo, shell);
  head.position.set(0, -0.002, 0.04);
  rig.add(head);
  // A visor band where a face would be: a groove, not a feature.
  const visorGeo = own(new THREE.TorusGeometry(0.0108, 0.0016, 6, 20));
  const visor = new THREE.Mesh(visorGeo, joint);
  visor.position.copy(head.position);
  visor.position.z += 0.003;
  rig.add(visor);

  // Antennae: two long curls of wire.
  for (const sx of [-1, 1]) {
    const g = own(tube([
      [sx * 0.004, 0.003, 0.048], [sx * 0.012, 0.016, 0.066],
      [sx * 0.026, 0.026, 0.078], [sx * 0.034, 0.022, 0.09]
    ], 0.0007, 12));
    rig.add(new THREE.Mesh(g, joint));
  }

  // Six legs, folded under and gripping the glass it perches on.
  const legGeos = [];
  for (const sx of [-1, 1]) {
    [0.026, 0.01, -0.006].forEach((lz, k) => {
      const spread = 0.012 + k * 0.004;
      legGeos.push(own(tube([
        [sx * 0.008, -0.008, lz], [sx * (0.018 + spread), 0.002 + k * 0.001, lz + 0.006],
        [sx * (0.026 + spread), -0.016, lz + 0.01], [sx * (0.028 + spread), -0.03, lz + 0.008]
      ], 0.0009, 10)));
      rig.add(new THREE.Mesh(legGeos[legGeos.length - 1], joint));
    });
  }

  // Wings: forewing and hindwing on each side, hinged at the thorax.
  const fore = own(wingGeometry(1, 1, foe.id + 'f'));
  const hind = own(wingGeometry(0.72, 0.9, foe.id + 'h'));
  const wings = [];
  for (const side of [1, -1]) {
    const hinge = new THREE.Group();
    hinge.position.set(0.012 * side, 0.012, 0.012);
    hinge.scale.x = side;
    const f = new THREE.Mesh(fore, shell);
    const h = new THREE.Mesh(hind, shell);
    h.position.set(0.004, -0.0012, -0.022);
    f.castShadow = h.castShadow = true;
    hinge.add(f, h);
    rig.add(hinge);
    wings.push(hinge);
  }
  rig.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

  // Streaks of amber: the electrons that really leave. Their number and speed
  // are the planner's (`dots`, `speed`), and nothing else ever lights them.
  const STREAKS = 5;
  const streakMat = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.95, depthWrite: false });
  const streakGeo = new THREE.BoxGeometry(1, 0.0016, 0.0016);
  const streaks = new THREE.InstancedMesh(streakGeo, streakMat, STREAKS);
  streaks.frustumCulled = false;
  streaks.count = 0;
  rig.add(streaks);
  const seeds = Array.from({ length: STREAKS }, () => ({ ph: rng(), y: 0.004 + rng() * 0.03, z: (rng() - 0.5) * 0.05 }));

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const FOLDED = { roll: -0.38, sweep: 0.95, spread: 0 };
  const SPREAD = { roll: 0.1, sweep: 0.2, spread: 1 };
  const DEAD = { roll: -0.75, sweep: 1.05, spread: 0 };
  const posture = { ...FOLDED };
  let goal = FOLDED;

  const body = {
    species: 'lamp moth',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0, phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.2,
    baseX: 0,
    baseY: 0,
    baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === 'shedding') {
        streaks.count = Math.max(1, Math.min(STREAKS, plan?.dots || 1));
      } else {
        streaks.count = 0;
      }
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      goal = pose === 'shedding' ? SPREAD : pose === 'dispersed' ? DEAD : FOLDED;
      if (instant) body.snap();
    },

    snap() {
      Object.assign(posture, goal);
      body.write(0);
    },

    hitPlayer() { body.lunge = 1; },

    look: 0,

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      const k = reduced ? 1 : 1 - Math.exp(-6 * dt);
      for (const key of ['roll', 'sweep', 'spread']) posture[key] += (goal[key] - posture[key]) * k;
      body.lunge = Math.max(0, body.lunge - dt * 2.4);
      if (body.pose === 'dispersed') {
        // Goes dark, droops and drifts away: nothing is left on the plate.
        const f = Math.min(1, body.since / 2.6);
        shell.color.setHex(tone).multiplyScalar(1 - 0.7 * Math.min(1, body.since / 0.9));
        shell.metalness = 0.92 - 0.35 * f;
        shell.transparent = f > 0.35;
        shell.opacity = reduced ? (body.since > 0.6 ? 0 : 1) : Math.max(0, 1 - Math.max(0, f - 0.35) / 0.65);
        if (shell.opacity <= 0.01) { body.gone = true; group.visible = false; }
      } else if (shell.opacity !== 1 || shell.transparent) {
        shell.color.setHex(tone);
        shell.metalness = 0.92;
        shell.opacity = 1;
        shell.transparent = false;
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      // A resting moth's wings quiver; a shedding one beats them slowly.
      const beat = body.pose === 'shedding' && !body.still ? Math.sin(t * 8.5) * 0.12 : 0;
      const quiver = body.pose === 'idle' && !body.still ? Math.sin(t * 1.7 + body.phase) * 0.012 : 0;
      const lunge = Math.sin(Math.min(1, body.lunge) * Math.PI);
      const flare = lunge * 0.7;
      wings.forEach(w => {
        w.rotation.z = posture.roll + beat + quiver + flare;
        w.rotation.y = posture.sweep * (1 - lunge * 0.7);
      });
      const drift = body.pose === 'dispersed' ? Math.min(1, body.since / 2.6) : 0;
      group.position.z = body.baseZ + lunge * 0.09;
      group.position.y = body.baseY + drift * 0.07;
      group.position.x = body.baseX + drift * 0.05;
      rig.rotation.x = lunge * 0.3 - drift * 0.2;
      rig.rotation.y = body.look * 0.6;

      // The streaks leave the shell at the planner's speed, flying off along the
      // tube toward the collector. They are low and brief — a count of electrons,
      // not a firework — and they stay under the line of sight to every screen.
      if (streaks.count) {
        const speed = Math.max(1, body.plan?.speed || 3);
        const len = 0.008 + Math.min(0.03, speed * 0.0035);
        const reach = 0.06 + Math.min(0.08, speed * 0.008);
        for (let i = 0; i < streaks.count; i++) {
          const sd = seeds[i];
          const u = ((body.still ? sd.ph : t * 1.1 + sd.ph) % 1 + 1) % 1;
          _p.set(0.03 + u * reach, sd.y, sd.z);
          _s.set(len * (1 - u * 0.5), 1, 1);
          _q.identity();
          _m.compose(_p, _q, _s);
          streaks.setMatrixAt(i, _m);
        }
        streaks.instanceMatrix.needsUpdate = true;
      }
    },

    dispose() {
      for (const g of owned) g.dispose();
      shell.dispose(); joint.dispose(); streakMat.dispose(); streakGeo.dispose();
      hit.geometry.dispose(); hit.material.dispose();
      streaks.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE BASALT WARDEN
   Columnar jointed basalt prisms with horizontal cleavage planes.
   ------------------------------------------------------------------ */

function basaltMaterial() {
  return cachedMaterial('foe:basalt-warden', () => {
    return new THREE.MeshStandardMaterial({
      color: 0x222326,
      roughness: 0.88,
      metalness: 0.12
    });
  });
}

function basaltJointMaterial() {
  return cachedMaterial('foe:basalt-joint', () => {
    return new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.95,
      metalness: 0.05
    });
  });
}

export function buildBasaltWarden(foe) {
  const group = new THREE.Group();
  group.name = `warden:${foe.id}`;
  const rng = makeRng(hashStr(`warden:${foe.id}`));

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };

  const rig = new THREE.Group();
  group.add(rig);

  const mat = basaltMaterial();
  const jointMat = basaltJointMaterial();

  const columns = [];
  const COLS = 7;
  for (let c = 0; c < COLS; c++) {
    const isCenter = c === 0;
    const angle = isCenter ? 0 : ((c - 1) * Math.PI) / 3 + (rng() - 0.5) * 0.15;
    const dist = isCenter ? 0 : 0.052 + (rng() - 0.5) * 0.01;
    const rHex = 0.026 + (rng() - 0.5) * 0.006;
    const colH = isCenter ? 0.16 : 0.11 + rng() * 0.04;
    const jointsCount = 2;
    const segH = colH / jointsCount;

    const colGroup = new THREE.Group();
    colGroup.position.set(Math.cos(angle) * dist, 0.01, Math.sin(angle) * dist);
    colGroup.rotation.y = rng() * Math.PI;

    const segments = [];
    for (let s = 0; s < jointsCount; s++) {
      const geo = own(new THREE.CylinderGeometry(rHex * 0.95, rHex, segH * 0.97, 6));
      enableAO(geo);
      const mesh = new THREE.Mesh(geo, s === 0 ? mat : jointMat);
      mesh.position.y = (s + 0.5) * segH;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      colGroup.add(mesh);
      segments.push(mesh);
    }

    rig.add(colGroup);
    columns.push({ colGroup, segments, angle, dist, segH });
  }

  const hit = hitTarget(0.18, 0.18);
  hit.position.y = 0.09;
  group.add(hit);

  const body = {
    species: 'basalt warden',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.18,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() {
      body.write(0);
    },

    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);

      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        group.position.y = body.baseY - f * 0.01;
        rig.scale.set(1 + f * 0.35, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.35);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      const l = body.lunge;
      group.position.z = body.baseZ + l * 0.08;
      group.rotation.y = body.look * 0.3;

      const tremor = !body.still && body.pose === 'idle' ? Math.sin(t * 2.2 + body.phase) * 0.003 : 0;
      const cleaved = body.pose === 'cleaved' ? 0.022 : 0;
      // The rig benches: columns spread to the arms the hub holds, the whole body
      // swings round in a field, and the upper blocks turn or will not.
      const splay = body.pose === 'splayed' ? 0.4 + 0.12 * Math.min(6, (body.plan && body.plan.arms) || 2) : 0;
      const swing = body.pose === 'turned' ? Math.min(1, body.since / 0.9) * (Math.PI / 2) : 0;
      const shiver = body.pose === 'still' && !body.still ? Math.sin(t * 38) * 0.0025 : 0;
      group.rotation.y = body.look * 0.3 + swing;
      group.position.x = body.baseX + shiver;

      const grip = body.pose === 'gripped' ? 0.45 * Math.min(1, (body.plan && body.plan.grip) || 0) : 0;
      columns.forEach((col, i) => {
        col.colGroup.position.y = 0.01 + tremor * ((i % 2 === 0) ? 1 : -1);
        const reach = col.dist * (1 + splay - grip);
        col.colGroup.position.x = Math.cos(col.angle) * reach;
        col.colGroup.position.z = Math.sin(col.angle) * reach;
        if (col.segments[1]) {
          col.segments[1].position.x = cleaved;
          col.segments[1].position.z = cleaved * 0.5;
          if (body.pose === 'free') col.segments[1].rotation.y = body.still ? 0.6 : t * 2.2;
          else if (body.pose === 'locked') {
            col.segments[1].rotation.y = 0;
            col.segments[1].position.x = body.still ? 0 : Math.sin(t * 45) * 0.002;
          } else col.segments[1].rotation.y = 0;
        }
      });
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE SLAG CRAWLER
   A line of chamfered slag plates on short legs, with a lid over each plate.
   It is as long as the bench says: drawn out when a pair is stretched, crushed
   short when it is squeezed, in two when the pair is parted or the molecule has
   no bond to hold it. Its lids close as the pair board's lamps do.
   ------------------------------------------------------------------ */

function slagMaterial() {
  return cachedMaterial('foe:slag', () => new THREE.MeshStandardMaterial({ color: 0x25252a, roughness: 0.9, metalness: 0.15 }));
}

function slagLidMaterial() {
  return cachedMaterial('foe:slag-lid', () => new THREE.MeshStandardMaterial({ color: 0x4a4854, roughness: 0.7, metalness: 0.3 }));
}

const CRAWLER_SEGS = 6;

export function buildSlagCrawler(foe) {
  const group = new THREE.Group();
  group.name = `crawler:${foe.id}`;

  const shadow = contactShadow(0.2);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);

  const mat = slagMaterial();
  const lidMat = slagLidMaterial();
  const segGeo = own(new RoundedBoxGeometry(0.05, 0.034, 0.06, 2, 0.006));
  enableAO(segGeo);
  const lidGeo = own(new THREE.BoxGeometry(0.044, 0.006, 0.052));
  const legGeo = own(new THREE.CylinderGeometry(0.004, 0.004, 0.026, 6));

  const segs = [];
  for (let k = 0; k < CRAWLER_SEGS; k++) {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(segGeo, mat);
    plate.position.y = 0.03;
    plate.castShadow = true;
    g.add(plate);
    // The lid hinges on its rear edge.
    const hinge = new THREE.Group();
    hinge.position.set(-0.022, 0.049, 0);
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.x = 0.022;
    hinge.add(lid);
    g.add(hinge);
    for (const sz of [-0.03, 0.03]) {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(0, 0.013, sz);
      g.add(leg);
    }
    rig.add(g);
    segs.push({ g, hinge });
  }

  const hit = hitTarget(0.2, 0.1);
  hit.position.y = 0.05;
  group.add(hit);

  const body = {
    species: 'slag crawler',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.2,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,
    spacing: 0.066, gap: 0, closed: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose && !(plan && (plan.stretch || plan.sealed != null))) { return; }
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    goals() {
      const p = body.pose;
      const stretch = Math.max(0.55, Math.min(2.4, (body.plan && body.plan.stretch) || 1));
      if (p === 'stretched') return { spacing: 0.066 * (0.8 + 0.3 * stretch), gap: 0, closed: 0 };
      if (p === 'squeezed') return { spacing: 0.066 * (0.45 + 0.35 * stretch), gap: 0, closed: 0 };
      if (p === 'parted' || p === 'lost') return { spacing: 0.062, gap: 0.12, closed: 0 };
      if (p === 'plated') return { spacing: 0.066, gap: 0, closed: (body.plan.sealed || 0) / Math.max(1, body.plan.of || 1) };
      return { spacing: 0.066, gap: 0, closed: 0 };
    },

    snap() {
      const g = body.goals();
      body.spacing = g.spacing; body.gap = g.gap; body.closed = g.closed;
      body.write(0);
    },

    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      const g = body.goals();
      const k = reduced ? 1 : 1 - Math.exp(-6 * dt);
      body.spacing += (g.spacing - body.spacing) * k;
      body.gap += (g.gap - body.gap) * k;
      body.closed += (g.closed - body.closed) * k;

      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.2);
        group.position.y = body.baseY - f * 0.01;
        rig.scale.set(1 + f * 0.3, Math.max(0.001, 1 - f * 0.95), 1 + f * 0.3);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.08;
      group.rotation.y = body.look * 0.3;
      const half = (CRAWLER_SEGS - 1) / 2;
      const crawl = !body.still && body.pose === 'idle' ? Math.sin(t * 2 + body.phase) * 0.002 : 0;
      segs.forEach((s, i) => {
        const side = i < CRAWLER_SEGS / 2 ? -1 : 1;
        s.g.position.x = (i - half) * body.spacing + side * body.gap / 2;
        s.g.position.y = crawl * (i % 2 ? 1 : -1);
        // A lid lies flat when closed and stands up on its hinge when open.
        const open = body.pose === 'plated' ? (i < Math.round(body.closed * CRAWLER_SEGS) ? 0 : 1.15) : (body.pose === 'idle' || body.pose === 'unmoved' ? 1.15 : 0.55);
        s.hinge.rotation.z = open;
      });
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}


/* ------------------------------------------------------------------
   THE RECIPE GOLEM
   A riveted cylindrical reaction boiler with pressure gauges.
   ------------------------------------------------------------------ */

function boilerMaterial() {
  return cachedMaterial('foe:golem-boiler', () => {
    return new THREE.MeshStandardMaterial({
      color: 0x33363a,
      roughness: 0.6,
      metalness: 0.8
    });
  });
}

function brassMaterial() {
  return cachedMaterial('foe:golem-brass', () => {
    return new THREE.MeshStandardMaterial({
      color: 0xba944c,
      roughness: 0.35,
      metalness: 0.9
    });
  });
}

export function buildRecipeGolem(foe) {
  const group = new THREE.Group();
  group.name = `golem:${foe.id}`;

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };

  const rig = new THREE.Group();
  group.add(rig);

  const bMat = boilerMaterial();
  const brassMat = brassMaterial();

  const bodyH = 0.12;
  const bodyR = 0.06;
  const boilerGeo = own(new THREE.CylinderGeometry(bodyR, bodyR * 1.05, bodyH, 16));
  enableAO(boilerGeo);
  const boilerMesh = new THREE.Mesh(boilerGeo, bMat);
  boilerMesh.position.y = bodyH * 0.5 + 0.02;
  boilerMesh.castShadow = true;
  rig.add(boilerMesh);

  const capGeo = own(new THREE.SphereGeometry(bodyR, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2));
  enableAO(capGeo);
  const capMesh = new THREE.Mesh(capGeo, bMat);
  capMesh.position.y = bodyH + 0.02;
  rig.add(capMesh);

  const band1Geo = own(new THREE.TorusGeometry(bodyR + 0.002, 0.004, 6, 20));
  const band1 = new THREE.Mesh(band1Geo, brassMat);
  band1.rotation.x = Math.PI / 2;
  band1.position.y = 0.045;
  rig.add(band1);

  const band2Geo = own(new THREE.TorusGeometry(bodyR + 0.002, 0.004, 6, 20));
  const band2 = new THREE.Mesh(band2Geo, brassMat);
  band2.rotation.x = Math.PI / 2;
  band2.position.y = 0.095;
  rig.add(band2);

  const gaugeGeo = own(new THREE.CylinderGeometry(0.018, 0.018, 0.008, 12));
  const gaugeMesh = new THREE.Mesh(gaugeGeo, brassMat);
  gaugeMesh.rotation.x = Math.PI / 2;
  gaugeMesh.position.set(0, 0.08, bodyR + 0.005);
  rig.add(gaugeMesh);

  const needleGeo = own(new THREE.BoxGeometry(0.002, 0.016, 0.002));
  const needleMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const needleMesh = new THREE.Mesh(needleGeo, needleMat);
  needleMesh.position.set(0, 0.08, bodyR + 0.01);
  rig.add(needleMesh);

  const ventGeo = own(new THREE.CylinderGeometry(0.012, 0.015, 0.025, 10));
  const ventMesh = new THREE.Mesh(ventGeo, brassMat);
  ventMesh.position.set(0, bodyH + bodyR + 0.02, 0);
  rig.add(ventMesh);

  const hit = hitTarget(0.18, 0.18);
  hit.position.y = 0.09;
  group.add(hit);

  const body = {
    species: 'recipe golem',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.18,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() {
      body.write(0);
    },

    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);

      if (body.pose === 'dispersed') {
        const f = Math.min(1, body.since / 2.4);
        group.position.y = body.baseY - f * 0.03;
        rig.scale.set(1 + f * 0.25, Math.max(0.001, 1 - f * 0.96), 1 + f * 0.25);
        if (f >= 0.99) { body.gone = true; group.visible = false; }
      }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      const l = body.lunge;
      group.position.z = body.baseZ + l * 0.08;
      group.rotation.y = body.look * 0.3;

      const pressurePulse = !body.still ? Math.sin(t * 3.5 + body.phase) * 0.004 : 0;
      rig.scale.set(1 + pressurePulse, 1 - pressurePulse * 0.5, 1 + pressurePulse);

      const needleAngle = body.pose === 'starved' ? -0.8 : body.pose === 'balanced' ? 0.3 : Math.sin(t * 4.0) * 0.25;
      needleMesh.rotation.z = needleAngle;
    },

    dispose() {
      for (const g of owned) g.dispose();
      needleMat.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE PRESSURE BLADDER
   A skinned bag on a brass valve. It sags, holds, swells or strains with the
   push the plate reads, and the pose is whatever `planFoe` returned; the body
   only knows how to MOVE into it. The only amber is a seam near to giving way.
   ------------------------------------------------------------------ */

function bladderSkin() {
  return cachedMaterial('foe:bladder-skin', () => new THREE.MeshStandardMaterial({ color: 0x3b3b41, roughness: 0.82, metalness: 0.05 }));
}
function bladderSeam() {
  return cachedMaterial('foe:bladder-seam', () => new THREE.MeshStandardMaterial({ color: 0x55525b, roughness: 0.6, metalness: 0.35 }));
}
function bladderBrass() {
  return cachedMaterial('foe:bladder-brass', () => new THREE.MeshStandardMaterial({ color: 0xba944c, roughness: 0.35, metalness: 0.9 }));
}

/** The bag's size in each pose: a height scale and a width scale. */
const BLADDER_POSE = {
  idle: [1, 1], rest: [1, 1], slack: [0.45, 1.12], swollen: [1.3, 1.12], straining: [1.62, 1.28],
  flat: [0.16, 1.2], shaken: [1, 1], dispersed: [0.05, 1.3]
};

export function buildPressureBladder(foe) {
  const group = new THREE.Group();
  group.name = `bladder:${foe.id}`;

  const shadow = contactShadow(0.1);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);

  const skin = bladderSkin();
  const seamMat = bladderSeam();
  const brass = bladderBrass();
  // A bag is a squashed sphere, with a slightly different lump on every one, from its id.
  const rng = makeRng(hashStr(`bladder${foe.id}`));
  const bagGeo = own(new THREE.SphereGeometry(0.05, 22, 16));
  const pos = bagGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 1 + (rng() - 0.5) * 0.06;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * (1 + (rng() - 0.5) * 0.04), pos.getZ(i) * k);
  }
  bagGeo.computeVertexNormals();
  enableAO(bagGeo);
  const bag = new THREE.Mesh(bagGeo, skin);
  bag.castShadow = true;
  rig.add(bag);

  // Two seam belts round the skin.
  const belts = [];
  const beltGeo = own(new THREE.TorusGeometry(0.0505, 0.0028, 6, 28));
  for (const dy of [-0.018, 0.018]) {
    const belt = new THREE.Mesh(beltGeo, seamMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = dy;
    belt.scale.set(Math.sqrt(1 - (dy / 0.05) ** 2), Math.sqrt(1 - (dy / 0.05) ** 2), 1);
    rig.add(belt);
    belts.push(belt);
  }
  const neckGeo = own(new THREE.CylinderGeometry(0.009, 0.013, 0.02, 10));
  const neck = new THREE.Mesh(neckGeo, brass);
  rig.add(neck);
  const valveGeo = own(new THREE.CylinderGeometry(0.007, 0.007, 0.016, 8));
  const valve = new THREE.Mesh(valveGeo, brass);
  rig.add(valve);
  const strainMat = new THREE.MeshStandardMaterial({ color: 0x55525b, emissive: AMBER, emissiveIntensity: 0, roughness: 0.6, metalness: 0.35 });
  const strapGeo = own(new THREE.BoxGeometry(0.0035, 0.034, 0.0035));
  const straps = [];
  for (const a of [0.6, 2.2, 3.9, 5.4]) {
    const st = new THREE.Mesh(strapGeo, strainMat);
    st.userData.angle = a;
    rig.add(st);
    straps.push(st);
  }

  const hit = hitTarget(0.1, 0.12);
  hit.position.y = 0.06;
  group.add(hit);

  const body = {
    species: 'gas bladder',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.1,
    look: 0,
    baseX: 0, baseY: 0, baseZ: 0,
    h: 1, wd: 1,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    goals() {
      const [h, wd] = BLADDER_POSE[body.pose] || BLADDER_POSE.idle;
      return { h, wd };
    },

    snap() {
      const g = body.goals();
      body.h = g.h; body.wd = g.wd;
      body.write(0);
    },

    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      const g = body.goals();
      const k = reduced ? 1 : 1 - Math.exp(-5 * dt);
      body.h += (g.h - body.h) * k;
      body.wd += (g.wd - body.wd) * k;
      if (body.pose === 'dispersed' && body.since > 2.4) { body.gone = true; group.visible = false; }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.07;
      group.rotation.y = body.look * 0.3;
      // A bag at rest breathes a hair; a shaken one shivers.
      const breathe = !body.still && body.pose !== 'dispersed' ? Math.sin(t * 2.2 + body.phase) * 0.012 : 0;
      const shiver = !body.still && body.pose === 'shaken' ? Math.sin(t * 38) * 0.006 : 0;
      const hs = body.h + breathe;
      const ws = body.wd + breathe * 0.5 + shiver;
      // The bag sits on the plate, so its centre rises with its height.
      rig.position.y = 0.05 * hs + 0.002;
      bag.scale.set(ws, hs, ws);
      belts.forEach((b, i) => {
        const dy = (i ? 0.018 : -0.018) * hs;
        const r = Math.sqrt(Math.max(0.0001, 1 - ((i ? 0.018 : -0.018) / 0.05) ** 2));
        b.position.y = dy;
        b.scale.set(r * ws, r * ws, 1);
      });
      neck.position.y = 0.05 * hs + 0.006;
      valve.position.y = 0.05 * hs + 0.02;
      const strained = body.pose === 'straining';
      strainMat.emissiveIntensity = strained ? 0.7 : 0;
      for (const st of straps) {
        const a = st.userData.angle;
        const rr = 0.05 * ws * 0.97;
        st.visible = body.pose === 'swollen' || strained;
        st.position.set(Math.cos(a) * rr, 0.05 * hs * 0.1, Math.sin(a) * rr);
        st.rotation.y = -a;
        st.scale.y = Math.max(0.2, hs * 0.9);
      }
    },

    dispose() {
      for (const g of owned) g.dispose();
      strainMat.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

/* ------------------------------------------------------------------
   THE COMPRESSOR
   A cylinder block with a head, a piston rod and a flywheel. It is a boss, so
   it is built only at the scale the well allows: a stroke you can count.
   ------------------------------------------------------------------ */

export function buildCompressor(foe) {
  const group = new THREE.Group();
  group.name = `compressor:${foe.id}`;

  const shadow = contactShadow(0.15);
  group.add(shadow);

  const owned = [];
  const own = g => { owned.push(g); return g; };
  const rig = new THREE.Group();
  group.add(rig);

  const iron = boilerMaterial();
  const brass = brassMaterial();

  const blockGeo = own(new RoundedBoxGeometry(0.11, 0.07, 0.06, 2, 0.006));
  enableAO(blockGeo);
  const block = new THREE.Mesh(blockGeo, iron);
  block.position.set(-0.02, 0.06, 0);
  block.castShadow = true;
  rig.add(block);
  const finGeo = own(new THREE.BoxGeometry(0.004, 0.02, 0.064));
  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(finGeo, iron);
    fin.position.set(-0.06 + i * 0.014, 0.105, 0);
    rig.add(fin);
  }
  const headGeo = own(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 14));
  const head = new THREE.Mesh(headGeo, brass);
  head.position.set(-0.05, 0.12, 0);
  rig.add(head);
  const wheelGeo = own(new THREE.TorusGeometry(0.036, 0.007, 8, 24));
  const wheel = new THREE.Mesh(wheelGeo, iron);
  wheel.position.set(0.065, 0.06, 0.036);
  rig.add(wheel);
  const spokeGeo = own(new THREE.BoxGeometry(0.07, 0.004, 0.004));
  const spoke = new THREE.Mesh(spokeGeo, brass);
  wheel.add(spoke);
  const spoke2 = new THREE.Mesh(spokeGeo, brass);
  spoke2.rotation.z = Math.PI / 2;
  wheel.add(spoke2);
  const rodGeo = own(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 8));
  const rod = new THREE.Mesh(rodGeo, brass);
  rod.rotation.z = Math.PI / 2;
  rig.add(rod);
  for (const lx of [-0.06, 0.03]) {
    const leg = new THREE.Mesh(own(new THREE.BoxGeometry(0.012, 0.03, 0.05)), iron);
    leg.position.set(lx, 0.015, 0);
    rig.add(leg);
  }
  const plumeMat = new THREE.MeshBasicMaterial({ color: 0xcfcfd2, transparent: true, opacity: 0.0, depthWrite: false });
  const plumeGeo = own(new THREE.ConeGeometry(0.014, 0.05, 10, 1, true));
  const plume = new THREE.Mesh(plumeGeo, plumeMat);
  plume.position.set(0.0, 0.14, 0.03);
  rig.add(plume);

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const body = {
    species: 'the compressor',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    phase: (hashStr(foe.id) % 628) / 100,
    reach: 0.16,
    look: 0, spin: 0,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced, bearing = 0) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.look += ((reduced ? 0 : Math.max(-0.5, Math.min(0.5, bearing))) - body.look) * (1 - Math.exp(-3 * dt));
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      // The flywheel turns at the stroke the pose names: brisk, slow under load, stopped when dispersed.
      const rate = body.still ? 0 : body.pose === 'dispersed' ? 0 : body.pose === 'laboured' ? 1.1 : body.pose === 'easy' ? 5 : 3;
      body.spin += rate * dt;
      if (body.pose === 'dispersed' && body.since > 2.2) { body.gone = true; group.visible = false; }
      body.write(reduced ? 0 : body.t);
    },

    write() {
      group.position.z = body.baseZ + body.lunge * 0.05;
      group.rotation.y = body.look * 0.3;
      wheel.rotation.z = body.spin;
      // The rod follows the crank: it reaches into the head and back out.
      const reach = Math.cos(body.spin) * 0.012;
      rod.position.set(-0.01 + reach, 0.06, 0.0);
      plumeMat.opacity = body.pose === 'venting' ? 0.35 : 0;
      head.position.y = 0.12 + (body.pose === 'laboured' ? -0.002 : 0);
    },

    dispose() {
      for (const g of owned) g.dispose();
      plumeMat.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

export function buildHopper(foe) {
  const group = new THREE.Group();
  group.name = `hopper:${foe.id}`;
  const owned = [];
  const own = g => { owned.push(g); return g; };

  const chitin = boilerMaterial();
  const blade = brassMaterial();

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const rig = new THREE.Group();
  group.add(rig);

  const thoraxGeo = own(new THREE.ConeGeometry(0.04, 0.09, 6));
  thoraxGeo.rotateX(0.4);
  const thorax = new THREE.Mesh(thoraxGeo, chitin);
  thorax.position.set(0, 0.05, 0);
  rig.add(thorax);

  const headGeo = own(new THREE.SphereGeometry(0.02, 8, 8));
  headGeo.scale(1, 1.2, 1.4);
  const head = new THREE.Mesh(headGeo, chitin);
  head.position.set(0, 0.09, 0.03);
  rig.add(head);

  // Scythe blades
  const scythes = [];
  for (const sx of [-1, 1]) {
    const bladeGeo = own(new THREE.ConeGeometry(0.012, 0.11, 4));
    bladeGeo.rotateX(-0.8);
    const bladeMesh = new THREE.Mesh(bladeGeo, blade);
    bladeMesh.position.set(sx * 0.04, 0.07, 0.03);
    bladeMesh.rotation.z = -sx * 0.3;
    rig.add(bladeMesh);
    scythes.push(bladeMesh);
  }

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const body = {
    species: 'the hopper',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    reach: 0.16,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed' && body.since > 2.0) { body.gone = true; group.visible = false; }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      if (!body.still) {
        thorax.position.y = 0.05 + Math.sin(t * 3.5) * 0.004;
        for (let i = 0; i < scythes.length; i++) {
          const sx = i === 0 ? -1 : 1;
          scythes[i].rotation.z = -sx * (0.3 + Math.sin(t * 4.0) * 0.06);
        }
      }
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
    }
  };
  body.snap();
  return body;
}

export function buildLanternEater(foe) {
  const group = new THREE.Group();
  group.name = `lantern-eater:${foe.id}`;
  const owned = [];
  const own = g => { owned.push(g); return g; };

  const shadowMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.7, metalness: 0.2 });
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.5, metalness: 0.4, side: THREE.DoubleSide });

  const shadow = contactShadow(0.18);
  group.add(shadow);

  const rig = new THREE.Group();
  group.add(rig);

  const bodyMesh = new THREE.Mesh(own(new THREE.DodecahedronGeometry(0.04, 0)), shadowMat);
  bodyMesh.position.set(0, 0.06, 0);
  rig.add(bodyMesh);

  const wings = [];
  for (const sx of [-1, 1]) {
    const wingGeo = own(new THREE.PlaneGeometry(0.09, 0.06));
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(sx * 0.06, 0.07, 0);
    wing.rotation.y = sx * 0.4;
    rig.add(wing);
    wings.push({ mesh: wing, side: sx });
  }

  const hit = hitTarget(0.16, 0.16);
  hit.position.y = 0.08;
  group.add(hit);

  const body = {
    species: 'the lantern-eater',
    group, hit,
    pose: 'idle', since: 0, gone: false,
    plan: null, lunge: 0, still: false, t: 0,
    reach: 0.16,
    baseX: 0, baseY: 0, baseZ: 0,

    setPose(pose, plan, instant = false) {
      body.plan = plan || null;
      if (pose === body.pose) return;
      body.pose = pose;
      body.since = 0;
      body.gone = false;
      group.visible = true;
      if (instant) body.snap();
    },

    snap() { body.write(0); },
    hitPlayer() { body.lunge = 1; },

    update(dt, reduced) {
      body.t += dt;
      body.since += dt;
      body.still = reduced;
      body.lunge = Math.max(0, body.lunge - dt * 2.5);
      if (body.pose === 'dispersed' && body.since > 2.0) { body.gone = true; group.visible = false; }
      body.write(reduced ? 0 : body.t);
    },

    write(t) {
      group.position.z = body.baseZ + body.lunge * 0.05;
      if (!body.still) {
        bodyMesh.position.y = 0.06 + Math.sin(t * 2.8) * 0.005;
        const flap = Math.sin(t * 8.0) * 0.35;
        for (const w of wings) {
          w.mesh.rotation.y = w.side * (0.4 + flap);
        }
      }
    },

    dispose() {
      for (const g of owned) g.dispose();
      shadow.geometry.dispose(); shadow.material.dispose();
      hit.geometry.dispose(); hit.material.dispose();
      shadowMat.dispose(); wingMat.dispose();
    }
  };
  body.snap();
  return body;
}

/** The species this kit builds a body for. */
export const BODY_SPECIES = ['salt husk', 'lamp moth', 'basalt warden', 'recipe golem', 'slag crawler', 'gas bladder', 'the compressor', 'the hopper', 'the lantern-eater'];

/**
 * Species that fight on the PLATE only at T4, and why.
 */
export const PLATE_ONLY = {};

/** The body for a species, or null for one that has none. */
export function buildFoeBody(species, foe, env) {
  if (species === 'salt husk') return buildHusk(foe, env);
  if (species === 'lamp moth') return buildMoth(foe);
  if (species === 'basalt warden') return buildBasaltWarden(foe);
  if (species === 'recipe golem') return buildRecipeGolem(foe);
  if (species === 'slag crawler') return buildSlagCrawler(foe);
  if (species === 'gas bladder') return buildPressureBladder(foe);
  if (species === 'the compressor') return buildCompressor(foe);
  if (species === 'the hopper') return buildHopper(foe);
  if (species === 'the lantern-eater') return buildLanternEater(foe);
  return null;
}

