/**
 * voyage.js — Flying the Avalon to a world, in one unbroken shot.
 *
 * At T4 a player who launches a quest or picks a world on the star map does
 * not get teleported onto the ground, and does not get a video. They are
 * turned to face the canopy, the jump drive spools, the stars pull out into
 * streaks, the ship drops out in front of the planet, flies down to it,
 * through its cloud, onto its landing ground — the real, already-built world
 * — and sets down. Then they walk to the airlock and out onto the ground.
 * There is no cut anywhere in it.
 *
 * HOW ONE SHOT IS POSSIBLE: TWO PASSES, ONE CAMERA.
 *   The player never leaves the ship's interior scene. Every frame draws the
 *   OUTSIDE first — the space scene, or the destination world's own scene —
 *   through a second camera whose pose is (ship pose) x (the player's camera
 *   in ship coordinates), then clears depth and draws the interior over it
 *   with the player's camera as normal. The interior is opaque except where
 *   it has glass, so the outside is exactly what shows through the canopy,
 *   the shoulder ports and the portholes. The player can walk the ship the
 *   whole time it stands on the ground, and the world outside stays live.
 *
 *   Moving the ship is therefore moving one matrix. Nothing inside the ship is
 *   ever transformed, so its colliders, doors, terminals and aim targets are
 *   untouched by any of this.
 *
 * WHAT IS SKIPPED WHILE FAR AWAY. From space the destination is a sphere
 * drawn by the same celestial shaders as the canopy vista, in the world's own
 * palette; nothing on its surface is modelled. The built world is swapped in
 * as the exterior only once the ship is inside the planet's cloud — behind a
 * cloud deck that then breaks up as the ship descends out of it — so the one
 * moment the outside changes from "a planet" to "this place", there is
 * nothing to see but cloud. That cloud is the world's own fog colour, so the
 * world emerging from it is continuous with it.
 *
 * WHERE IT LANDS is decided by `solveLanding` (ship-exterior.js): the world's
 * landing pad where it has one, clear of every collider and landmark.
 *
 * THE STATES.
 *   idle      — aboard, in space; nothing of this is running.
 *   flight    — the timeline is running and owns the camera.
 *   landed    — down on a world, aboard, walking the ship. A chevron leads
 *               to the airlock; [E] at its hatch disembarks.
 *   disembark — the hatch swings open and the player is walked down the ramp.
 *   ground    — on the world's ground in ordinary world mode; the ship stands
 *               where it landed, and boarding it puts the player back aboard
 *               in `landed`.
 */

import * as THREE from "three";
import { createStarfield } from "./materials/starfield.js";
import { createPlanetMaterial, createAtmosphereShell } from "./materials/celestial.js";
import { doorways, roomAt, ROOMS, HULL, AIRLOCK_HATCH } from "./ship-rooms.js";
import { SHIP_GRAPH } from "./ship-graph.js";
import {
  buildShipExterior, solveLanding, landingPrefsFor, localToWorld,
  shipWorldColliders, RAMP_FOOT, HATCH_SILL, SHIP_FOOTPRINT
} from "./ship-exterior.js";
import { GuideArrow } from "./guide-arrow.js";
import { aimBoxFromBounds } from "./aim-target.js";
import { soundscape } from "../audio/soundscape.js";

/* ------------------------------------------------------------ destinations */

/**
 * Every place the Avalon can fly to. `planet` is how it looks from space —
 * the celestial shader kind and a four-colour palette in the world's own
 * register; `hash` is the route a player stands on once they are down.
 */
export const DESTINATIONS = {
  tallow: {
    key: 'tallow', name: 'Tallow', hash: '#/learn/unit01',
    descent: 'Descending to the pad',
    planet: {
      kind: 'ice', colors: ['#cfc6b4', '#b0a48c', '#8c806c', '#ece5d6'],
      atmo: '#ddd2bf', atmoStrength: 0.55, seed: [1.7, 4.2, 0.6]
    }
  },
  ligar: {
    key: 'ligar', name: 'Ligar', hash: '#/learn/unit02',
    descent: 'Descending to the pad',
    planet: {
      kind: 'volcanic', colors: ['#2a2622', '#4a4038', '#6b5842', '#c46a2a'],
      atmo: '#b27a4c', atmoStrength: 0.5, seed: [5.1, 0.4, 2.2]
    }
  },
  erebus: {
    key: 'erebus', name: 'Erebus', hash: '#/quest',
    descent: 'Descending into the basin',
    planet: {
      kind: 'desert', colors: ['#c8995a', '#9d6b3b', '#6f4a33', '#e1b37b'],
      atmo: '#e0a45e', atmoStrength: 0.55, seed: [2.4, 7.1, 3.3]
    }
  }
};

/* ------------------------------------------------------------------ tuning */

const PLANET_R = 1000;                                   // space units
/** Where the destination sits when the ship drops out at the origin. */
const PLANET_C = new THREE.Vector3(0, -PLANET_R * 1.02, 9200);
const ENTRY_TILT = THREE.MathUtils.degToRad(24);         // how far round the limb the ship enters
/** Where the approach brakes to a stop, straight over the landing site. */
const HOLD_ALT = 260;
/** How low the entry falls, straight down, before the cloud deck swallows it. */
const ENTRY_ALT = 18;
/**
 * Nose-down pitch while hanging over the planet. The canopy looks forward, and
 * from high up the horizon dips well below it (37 degrees at HOLD_ALT), so a
 * level ship would show the pilot sky while it came down onto a world.
 */
const HOLD_PITCH = 0.6;
const ENTRY_PITCH = 0.28;
const EYE = 1.55;
/** The pilot's standing place between the flight pods, and where they look. */
const SEAT = SHIP_GRAPH.nodes.cockpit;
const SEAT_POS = new THREE.Vector3(SEAT.pos[0], 1.47, SEAT.pos[2] - 0.1);
const SEAT_LOOK = new THREE.Vector3(0, 1.3, 14);
const BASE_FOV = 55;

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t * t;
const smooth = (a, b, t) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const clamp01 = t => Math.max(0, Math.min(1, t));

/** A quaternion whose local +z points along `fwd`, with `up` as near up as it can be. */
function lookQuat(fwd, up = _Y, out = new THREE.Quaternion()) {
  _m.lookAt(fwd, _zero, up);
  return out.setFromRotationMatrix(_m);
}
/** A camera's quaternion (it looks down its own −z) facing from `eye` to `target`. */
function cameraQuat(eye, target, out = new THREE.Quaternion()) {
  _m.lookAt(eye, target, _Y);
  return out.setFromRotationMatrix(_m);
}
const _m = new THREE.Matrix4();
const _zero = new THREE.Vector3();
const _Y = new THREE.Vector3(0, 1, 0);

/* ------------------------------------------------------------------ shaders */

const NOISE = /* glsl */ `
  float vh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(vh(i), vh(i + vec2(1.0, 0.0)), f.x), mix(vh(i + vec2(0.0, 1.0)), vh(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return s;
  }
`;

function makeVeil() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0xffffff) },
      uAlpha: { value: 0 },
      uCloud: { value: 1 },
      uTime: { value: 0 },
      uScroll: { value: 0 }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uAlpha, uCloud, uTime, uScroll;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 p = vUv * vec2(3.4, 2.1);
        // Scrolled by the distance flown through it, not time x rate, so a
        // change of rate never jumps the whole deck sideways.
        p.y += uScroll;
        float c = fbm(p + vec2(fbm(p * 0.6 + uTime * 0.05), 0.0) * 0.8);
        // Coverage: at full alpha every pixel is cloud; as it falls the deck
        // breaks into holes rather than fading like a dissolve.
        float t = uAlpha * 1.45 - 0.22;
        float a = smoothstep(1.0 - t - 0.22, 1.0 - t + 0.1, c);
        a = mix(uAlpha, a, uCloud);
        vec3 col = uColor * mix(1.0, 0.8 + 0.34 * c, uCloud);
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  return { scene, mat, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
}

function makeTunnel() {
  const geo = new THREE.CylinderGeometry(160, 160, 14000, 48, 1, true);
  geo.rotateX(Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uWarp: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vZ;
      void main() { vUv = uv; vZ = position.z; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uWarp;
      varying vec2 vUv; varying float vZ;
      ${NOISE}
      void main() {
        float along = vZ * 0.0011 + uTime * 5.5;
        float lines = pow(vn(vec2(vUv.x * 190.0, along)), 6.0) * 1.6;
        float haze = fbm(vec2(vUv.x * 9.0, along * 0.18));
        vec3 cold = vec3(0.42, 0.5, 0.62), warm = vec3(0.86, 0.6, 0.28);
        vec3 col = mix(cold, warm, smoothstep(0.35, 0.75, haze));
        float fade = smoothstep(-7000.0, -2500.0, vZ) * (1.0 - smoothstep(3000.0, 7000.0, vZ));
        gl_FragColor = vec4(col * (lines + haze * 0.16) * uWarp * fade, 1.0);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return { mesh, mat };
}

/** Star streaks around the ship's line of travel, in ship coordinates. */
function makeStreaks(count = 1600) {
  const pos = new Float32Array(count * 6);
  const col = new Float32Array(count * 6);
  const base = new Float32Array(count * 3);
  const xy = new Float32Array(count * 2);
  const z = new Float32Array(count);
  const tints = [[0.68, 0.75, 0.86], [0.87, 0.89, 0.93], [0.95, 0.92, 0.85], [0.93, 0.82, 0.65]];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 14 + Math.pow(Math.random(), 1.7) * 520;
    xy[i * 2] = Math.cos(a) * r;
    xy[i * 2 + 1] = Math.sin(a) * r;
    z[i] = -3000 + Math.random() * 9000;
    const t = tints[(Math.random() * tints.length) | 0];
    const k = 0.45 + Math.random() * 0.55;
    base[i * 3] = t[0] * k; base[i * 3 + 1] = t[1] * k; base[i * 3 + 2] = t[2] * k;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  return {
    lines,
    update(dt, warp) {
      const speed = 60 + Math.pow(warp, 3) * 16000;
      const len = 0.6 + warp * warp * 2400;
      const bright = Math.min(1, 0.25 + warp * 1.6);
      for (let i = 0; i < count; i++) {
        let zi = z[i] - speed * dt;
        if (zi + len < -3000) zi += 9000;
        z[i] = zi;
        const x = xy[i * 2], y = xy[i * 2 + 1];
        const o = i * 6;
        pos[o] = x; pos[o + 1] = y; pos[o + 2] = zi;
        pos[o + 3] = x; pos[o + 4] = y; pos[o + 5] = zi + len;
        const b = bright * (warp > 0.001 ? 1 : 0);
        col[o] = base[i * 3] * b; col[o + 1] = base[i * 3 + 1] * b; col[o + 2] = base[i * 3 + 2] * b;
        col[o + 3] = 0; col[o + 4] = 0; col[o + 5] = 0;
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      lines.visible = warp > 0.001;
    }
  };
}

/** A starfield whose brightness can be faded (the stock one is always full). */
function fadingStarfield(count, radius) {
  const group = createStarfield(count, radius);
  const pts = group.children.find(c => c.isPoints);
  let uniform = null;
  if (pts && pts.material?.isShaderMaterial) {
    const m = pts.material;
    m.uniforms.uFade = { value: 1 };
    m.fragmentShader = m.fragmentShader
      .replace('varying vec3 vColor;', 'varying vec3 vColor;\n      uniform float uFade;')
      .replace('gl_FragColor = vec4(vColor * a, 1.0);', 'gl_FragColor = vec4(vColor * a * uFade, 1.0);');
    uniform = m.uniforms.uFade;
  }
  // The galactic band carries on regardless; it is a whisper.
  return { group, setFade(v) { if (uniform) uniform.value = v; } };
}

/**
 * The ground past the edge of a built world, for the descent only.
 *
 * A world is a 200–240 m square. From a hundred metres up, its edge would be
 * a cliff into nothing. This lays a ring of ground round it — the terrain's
 * own material, its UVs continuing the terrain's, its height continuing the
 * terrain's edge and relaxing to the edge's mean — so the square reads as
 * part of a planet. Inside the square it sits just under the terrain.
 */
function buildFarGround(world) {
  const size = world.data?.terrain?.size?.[0] || 240;
  const half = size / 2;
  const edge = half - 0.5;
  const H = (x, z) => world.getTerrainHeight(
    Math.max(-edge, Math.min(edge, x)), Math.max(-edge, Math.min(edge, z)));
  let sum = 0, n = 0;
  for (let i = 0; i < 64; i++) {
    const t = -edge + (2 * edge * i) / 63;
    sum += H(t, -edge) + H(t, edge) + H(-edge, t) + H(edge, t);
    n += 4;
  }
  const mean = sum / n;
  const radii = [half * 0.9, half * 0.96, half + 1.5, half + 8, half + 20, half + 40,
    half + 70, half + 110, half + 160, half + 230, half + 330, 900];
  const seg = 128;
  const pos = [], uv = [], idx = [];
  for (let ri = 0; ri < radii.length; ri++) {
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const x = Math.cos(a) * radii[ri], z = Math.sin(a) * radii[ri];
      const inside = Math.abs(x) < edge && Math.abs(z) < edge;
      const out = Math.max(Math.abs(x) - half, Math.abs(z) - half, 0);
      const y = inside
        ? H(x, z) - 0.7
        : THREE.MathUtils.lerp(H(x, z), mean, smooth(0, 160, out)) - 0.08;
      pos.push(x, y, z);
      uv.push((x + half) / size, (half - z) / size);
    }
  }
  for (let ri = 0; ri < radii.length - 1; ri++) {
    for (let s = 0; s < seg; s++) {
      const a = ri * (seg + 1) + s, b = a + 1, c = a + seg + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('uv1', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = world.terrainMesh?.material || new THREE.MeshStandardMaterial({ color: 0x888078, roughness: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'voyage-far-ground';
  mesh.userData.phys = 'ground';
  mesh.frustumCulled = false;
  return mesh;
}

/* ------------------------------------------------------------------- class */

export class Voyage {
  constructor(stage) {
    this.stage = stage;
    this.state = 'idle';
    this.phases = [];
    this.phaseIdx = 0;
    this.phaseT = 0;
    this.timeScale = 1;
    this.clock = 0;
    this.cloudScroll = 0;

    this.exterior = 'space';        // 'space' | 'world'
    this.extWorld = null;           // the world scene drawn outside, when exterior is 'world'
    this.extExposure = 1.2;
    this.interiorVisible = true;

    this.shipPos = new THREE.Vector3();
    this.shipQuat = new THREE.Quaternion();
    this.shipMatrix = new THREE.Matrix4();
    this.extCam = new THREE.PerspectiveCamera(BASE_FOV, 1, 0.5, 60000);

    this.camPos = new THREE.Vector3();
    this.camQuat = new THREE.Quaternion();
    this.scripted = false;
    this.shake = 0;
    this.fov = BASE_FOV;

    this.dest = null;               // { key, def, world, landing, hash, waypoint }
    this.parked = null;             // { key, world, landing } while the ship stands on a world
    this.queued = null;

    this.guide = new GuideArrow();
    this.groundGuide = new GuideArrow();
    this._planets = {};
    this._farGround = new Map();
    this._fogSaved = new Map();
    this.exteriorModel = null;
  }

  /* --------------------------------------------------------------- queries */

  /** True while the voyage is drawing the outside of the ship. */
  get aboard() { return this.state === 'flight' || this.state === 'landed' || this.state === 'disembark'; }
  /** True while the timeline, not the player, is holding the camera. */
  holdsCamera() { return this.state === 'flight' || this.state === 'disembark'; }
  canDisembark() { return this.state === 'landed' && Boolean(this.parked); }
  get phaseName() { return this.phases[this.phaseIdx]?.name || this.state; }

  /** The ship's colliders on `world`, when it is standing there. */
  parkedColliders(world) {
    return this.parked && this.parked.world === world ? shipWorldColliders(this.parked.landing) : [];
  }

  /** A target [E] can board by, on the world the ship stands on. */
  parkedAimTarget(world) {
    if (!this.parked || this.parked.world !== world) return null;
    const L = this.parked.landing;
    const box = (r, y0, y1) => {
      const pts = [[r.minX, r.minZ], [r.maxX, r.maxZ]].map(([x, z]) => localToWorld(L, x, 0, z));
      return aimBoxFromBounds(
        Math.min(pts[0].x, pts[1].x), Math.max(pts[0].x, pts[1].x),
        L.deckY + y0, L.deckY + y1,
        Math.min(pts[0].z, pts[1].z), Math.max(pts[0].z, pts[1].z));
    };
    return {
      kind: 'avalon', reach: 7,
      boxes: [
        box(SHIP_FOOTPRINT.ramp, -3, 2.4),
        box({ minX: HULL.maxX, maxX: HULL.maxX + 1, minZ: AIRLOCK_HATCH.z - 1, maxZ: AIRLOCK_HATCH.z + 1 }, 0, 2.4)
      ]
    };
  }

  /* ----------------------------------------------------------------- setup */

  _ensureSpace() {
    if (this.space) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const stars = fadingStarfield(8000, 24000);
    scene.add(stars.group);

    // Everything that travels WITH the ship lives in its frame.
    const frame = new THREE.Group();
    scene.add(frame);
    const streaks = makeStreaks();
    const tunnel = makeTunnel();
    frame.add(streaks.lines, tunnel.mesh);
    tunnel.mesh.position.z = 2500;

    // The sky the player was looking at aboard: the ship's own starfield and
    // vista are carried out here for the first seconds, so the stars do not
    // change under them when the voyage starts drawing the outside.
    const home = new THREE.Group();
    scene.add(home);

    const sunLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    sunLight.position.set(0.4, 0.7, -0.6);
    scene.add(sunLight, new THREE.AmbientLight(0x2a2622, 0.4));

    this.space = { scene, stars, frame, streaks, tunnel, home };
    this.veil = makeVeil();
  }

  _planetFor(key) {
    if (this._planets[key]) return this._planets[key];
    const def = DESTINATIONS[key].planet;
    const group = new THREE.Group();
    const mat = createPlanetMaterial(def.kind, {
      colors: def.colors, atmo: def.atmo, atmoStrength: def.atmoStrength, seed: def.seed, octaves: 6
    });
    // Lit from over the ship's shoulder, so the side it flies down to is day.
    const sun = new THREE.Vector3(0.35, 0.62, -0.7).normalize();
    mat.uniforms.uSunDir.value = sun;
    const body = new THREE.Mesh(new THREE.SphereGeometry(PLANET_R, 128, 96), mat);
    group.add(body);
    const atmo = createAtmosphereShell(PLANET_R, new THREE.Vector3(), { color: def.atmo, strength: 1.4, scaleHeight: 0.02 });
    atmo.material.uniforms.uSunDir.value = sun;
    group.add(atmo);
    group.visible = false;
    this._ensureSpace();
    this.space.scene.add(group);
    this._planets[key] = { group, body, atmo };
    return this._planets[key];
  }

  /** Move a planet group (and its atmosphere's centre uniform) to `c`. */
  _placePlanet(p, c) {
    p.group.position.copy(c);
    p.atmo.material.uniforms.uCenter.value.copy(c);
    p.atmo.position.set(0, 0, 0);
  }

  _exteriorModel() {
    if (!this.exteriorModel && this.stage.shipInterior) {
      this.exteriorModel = buildShipExterior(this.stage.shipInterior);
      this.exteriorModel.group.visible = false;
    }
    return this.exteriorModel;
  }

  /** Everything a destination needs before the ship can fly to it. */
  _prepare(target) {
    const def = DESTINATIONS[target.key];
    const world = this.stage.worldFor(target.key);
    if (!def || !world) return null;
    const landing = solveLanding(world, landingPrefsFor(world));
    this._planetFor(target.key);
    return {
      key: target.key, def, world, landing,
      hash: target.hash || def.hash,
      waypoint: target.waypoint || null
    };
  }

  /* -------------------------------------------------------------- requests */

  /**
   * The player asked to go to `target` ({ key, hash, waypoint }) while aboard.
   * Returns 'started' (a flight is under way), 'waiting' (already down there:
   * disembark when ready) or null (the voyage cannot take it).
   */
  request(target) {
    if (!DESTINATIONS[target?.key]) return null;
    if (this.state === 'flight') {
      // Still in the jump: turn for the new destination. Past it, finish
      // landing and go on from there.
      const idx = this.phases.findIndex(p => p.name === 'dropout');
      if (idx > this.phaseIdx) {
        if (target.key !== this.dest?.key) {
          const d = this._prepare(target);
          if (d) this.dest = d;
        } else {
          this.dest.hash = target.hash || this.dest.hash;
          this.dest.waypoint = target.waypoint || null;
        }
      } else if (target.key === this.dest?.key) {
        this.dest.hash = target.hash || this.dest.hash;
        this.dest.waypoint = target.waypoint || null;
      } else {
        this.queued = target;
      }
      this._emit();
      return 'started';
    }
    if (this.state === 'landed' && this.parked) {
      if (target.key === this.parked.key) {
        this.dest = this.dest && this.dest.key === target.key ? this.dest : { ...this.parked, def: DESTINATIONS[target.key] };
        this.dest.hash = target.hash || DESTINATIONS[target.key].hash;
        this.dest.waypoint = target.waypoint || null;
        this._showAirlockGuide();
        this._emit();
        return 'waiting';
      }
      return this._startDeparture(target) ? 'started' : null;
    }
    if (this.state === 'idle') {
      return this._startArrival(target) ? 'started' : null;
    }
    return null;
  }

  /** Fast-forward the rest of the flight. */
  hurry() { if (this.state === 'flight') this.timeScale = 6; }

  _startArrival(target) {
    const dest = this._prepare(target);
    if (!dest) return false;
    this._ensureSpace();
    this.dest = dest;
    this._beginFlight();
    this.exterior = 'space';
    this.extWorld = null;
    this.shipPos.set(0, 0, 0);
    this.shipQuat.identity();
    this._adoptHomeSky();
    this.phases = [
      this._phaseAlign(),
      this._phaseSpool(),
      this._phaseWarp(),
      this._phaseDropout(),
      this._phaseApproach(),
      this._phaseEntry(),
      this._phaseDescent(),
      this._phaseSettle()
    ];
    this._enterPhase(0);
    return true;
  }

  _startDeparture(target) {
    const from = this.parked;
    const dest = this._prepare(target);
    if (!dest || !from) return false;
    this._ensureSpace();
    this.dest = dest;
    this.leaving = from;
    // Leaving a world, the sky outside is that world's, never the home vista.
    this._adoptHomeSky();
    this._releaseHomeSky();
    this._beginFlight();
    this.phases = [
      this._phaseAlign(),
      this._phaseLiftoff(),
      this._phaseClimb(),
      this._phaseEscape(),
      this._phaseSpool(),
      this._phaseWarp(),
      this._phaseDropout(),
      this._phaseApproach(),
      this._phaseEntry(),
      this._phaseDescent(),
      this._phaseSettle()
    ];
    this._enterPhase(0);
    return true;
  }

  _beginFlight() {
    const st = this.stage;
    this.state = 'flight';
    this.timeScale = 1;
    this.scripted = true;
    this.interiorVisible = true;
    this.guide.hide();
    this.groundGuide.hide();
    st.fpsControls?.releaseKeys?.();
    st.fpsControls?.hidePrompt?.();
    if (st.cameraRig) st.cameraRig.isTransitioning = false;
    st.shipInterior?.setAirlockOpen(0);
    this.camPos.copy(st.camera.position);
    this.camQuat.copy(st.camera.quaternion);
    soundscape.startEngine?.();
  }

  /* ---------------------------------------------------------------- phases */

  _enterPhase(i) {
    this.phaseIdx = i;
    this.phaseT = 0;
    const p = this.phases[i];
    if (p?.enter) p.enter();
    this._emit();
  }

  _emit() {
    const p = this.phases[this.phaseIdx];
    const total = this.phases.reduce((s, q) => s + q.dur, 0) || 1;
    const done = this.phases.slice(0, this.phaseIdx).reduce((s, q) => s + q.dur, 0) + this.phaseT;
    const detail = {
      state: this.state,
      phase: this.state === 'flight' ? p?.name : this.state,
      label: this.state === 'flight' ? p?.label?.() : this._stateLabel(),
      dest: this.dest?.def?.name || this.parked?.world && DESTINATIONS[this.parked.key]?.name || '',
      progress: this.state === 'flight' ? clamp01(done / total) : 1,
      hurrying: this.timeScale > 1
    };
    this.lastPhase = detail;
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('voyage:phase', { detail }));
  }

  _stateLabel() {
    const name = DESTINATIONS[this.parked?.key]?.name || '';
    if (this.state === 'landed') return `Down on ${name}. Disembark through the airlock.`;
    if (this.state === 'disembark') return `Disembarking onto ${name}`;
    return '';
  }

  /** Walk the player to the pilot's place and turn them to the canopy. */
  _phaseAlign() {
    const self = this;
    const ph = { name: 'align', dur: 2.4, label: () => 'Taking the helm' };
    let curve = null, q0 = new THREE.Quaternion(), qSeat = new THREE.Quaternion();
    ph.enter = () => {
      const from = self.camPos.clone();
      const pts = pathToSeat(from);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += pts[i].distanceTo(pts[i - 1]);
      curve = pts.length > 1 && len > 0.05 ? new THREE.CatmullRomCurve3(pts, false, 'centripetal') : null;
      ph.dur = Math.max(2.4, Math.min(8, len / 2.6 + 1.2));
      q0.copy(self.camQuat);
      cameraQuat(SEAT_POS, SEAT_LOOK, qSeat);
    };
    ph.tick = (u) => {
      const k = ease(u);
      if (curve) self.camPos.copy(curve.getPointAt(k));
      else self.camPos.lerp(SEAT_POS, 0.2);
      // Look where you are walking, then round to the canopy.
      let qWalk = q0;
      if (curve && u < 0.85) {
        const tan = curve.getTangentAt(Math.min(0.999, k + 0.02));
        tan.y = 0;
        if (tan.lengthSq() > 1e-4) {
          const ahead = self.camPos.clone().add(tan.normalize());
          ahead.y = self.camPos.y - 0.05;
          qWalk = cameraQuat(self.camPos, ahead);
        }
      }
      const early = smooth(0, 0.3, u);
      const late = smooth(0.35, 1, u);
      self.camQuat.copy(q0).slerp(qWalk, early).slerp(qSeat, late);
      self.fov = BASE_FOV;
    };
    ph.exit = () => { self.camPos.copy(SEAT_POS); self.camQuat.copy(qSeat); };
    return ph;
  }

  _phaseSpool() {
    const self = this;
    return {
      name: 'spool', dur: 2.6, label: () => 'Jump drive spooling',
      enter() { soundscape.setEngine?.(0.45, 1.1); },
      tick(u) {
        self.warp = 0.22 * easeIn(u);
        self.shake = 0.002 + 0.008 * u;
        self.fov = BASE_FOV + 4 * ease(u);
        self.space.stars.setFade(1 - 0.3 * u);
        // The ship eases forward as the drive takes up.
        self.shipPos.addScaledVector(_fwd(self.shipQuat), (2 + u * 40) * self._dt);
        if (u > 0.82 && !self._jumpCued) { self._jumpCued = true; soundscape.playJump?.(); }
      }
    };
  }

  _phaseWarp() {
    const self = this;
    return {
      name: 'warp', dur: 4.8, label: () => `In the jump to ${self.dest.def.name}`,
      enter() {
        self._jumpCued = false;
        soundscape.setEngine?.(1, 1.9);
      },
      tick(u) {
        self.warp = 0.22 + 0.78 * easeOut(clamp01(u / 0.18));
        self.shake = 0.012 * (1 - u * 0.3);
        self.fov = BASE_FOV + 4 + 17 * easeOut(clamp01(u / 0.2));
        // The jump flash: under it the sky the player left is taken away.
        const f = clamp01(u / 0.12);
        self.flash = Math.sin(f * Math.PI) * 0.75;
        if (u > 0.05) self._releaseHomeSky();
        self.space.stars.setFade(Math.max(0, 0.7 - u * 6));
        if (self.leaving && self._planets[self.leaving.key]) self._planets[self.leaving.key].group.visible = u < 0.06;
        self.space.tunnel.mat.uniforms.uWarp.value = smooth(0.05, 0.3, u) * (1 - smooth(0.9, 1, u) * 0.4);
      }
    };
  }

  _phaseDropout() {
    const self = this;
    return {
      name: 'dropout', dur: 1.8, label: () => 'Dropping out',
      enter() {
        // Re-seat the ship in front of the destination. Nothing that would show
        // the move is visible: the stars are out and the tunnel is up.
        self.shipPos.set(0, 0, 0);
        self.shipQuat.identity();
        for (const p of Object.values(self._planets)) p.group.visible = false;
        const planet = self._planets[self.dest.key];
        self._placePlanet(planet, PLANET_C);
        planet.group.visible = true;
        soundscape.playDropout?.();
        soundscape.setEngine?.(0.5, 1.0);
      },
      tick(u) {
        self.warp = 1 - easeOut(clamp01(u / 0.35));
        self.space.tunnel.mat.uniforms.uWarp.value = 0.6 * (1 - clamp01(u / 0.25));
        self.flash = Math.max(0, 0.6 * (1 - u / 0.3));
        self.fov = THREE.MathUtils.lerp(BASE_FOV + 21, BASE_FOV, easeOut(clamp01(u / 0.6)));
        self.shake = 0.012 * (1 - u) + 0.002;
        self.space.stars.setFade(smooth(0.1, 0.8, u));
        self.shipPos.addScaledVector(_fwd(self.shipQuat), 60 * self._dt);
      }
    };
  }

  /*
   * ONCE THE SHIP REACHES THE PLANET IT COMES DOWN, NOT ACROSS. The approach
   * brakes to a stop high over the landing site with the nose tipped down at
   * the world; the entry then falls straight down the local vertical, the
   * surface swelling in the canopy, until the cloud deck closes; and under the
   * cloud the descent drops onto the pad from overhead. The old path skimmed
   * the limb, ploughed forward through the air and then flew a long forward
   * glide over the built world, which read as flying OVER the planet twice
   * with a jump between.
   */
  _phaseApproach() {
    const self = this;
    let curve = null;
    const upE = new THREE.Vector3(0, Math.cos(ENTRY_TILT), -Math.sin(ENTRY_TILT));
    const tanE = new THREE.Vector3(0, Math.sin(ENTRY_TILT), Math.cos(ENTRY_TILT));
    const tan = new THREE.Vector3(), up = new THREE.Vector3();
    return {
      name: 'approach', dur: 8.5, label: () => `Approaching ${self.dest.def.name}`,
      enter() {
        const H = PLANET_C.clone().addScaledVector(upE, PLANET_R + HOLD_ALT);
        const start = self.shipPos.clone();
        // In from above and behind, slowing onto the hold point rather than
        // arriving along the ground.
        curve = new THREE.CubicBezierCurve3(
          start,
          start.clone().add(new THREE.Vector3(0, 0, 3200)),
          H.clone().addScaledVector(tanE, -1400).addScaledVector(upE, 320),
          H
        );
        self.entryPoint = H;
        self.entryUp = upE;
        self.entryTan = tanE;
      },
      tick(u) {
        const k = 1 - Math.pow(1 - u, 2.2);
        self.shipPos.copy(curve.getPointAt(k));
        // Heading along the path, but the attitude settles level to the local
        // ground and then tips the nose down at it as the ship brakes.
        tan.copy(curve.getTangentAt(Math.min(0.999, k + 0.001)));
        const settle = smooth(0.45, 1, u);
        tan.lerp(tanE, settle).normalize();
        up.set(0, 1, 0).lerp(upE, smooth(0.3, 1, u)).normalize();
        lookQuat(tan, up, self.shipQuat);
        self.shipQuat.multiply(_q.setFromEuler(_e.set(HOLD_PITCH * smooth(0.55, 1, u), 0, 0)));
        self.warp = 0;
        self.flash = 0;
        self.shake = 0.002 + 0.002 * smooth(0.7, 1, u);
        self.fov = BASE_FOV;
      }
    };
  }

  _phaseEntry() {
    const self = this;
    let upE, tanE, base;
    return {
      name: 'entry', dur: 5.2, label: () => 'Atmospheric entry',
      enter() {
        upE = self.entryUp;
        tanE = self.entryTan;
        base = new THREE.Quaternion();
        lookQuat(tanE, upE, base);
        const world = self.dest.world;
        const fog = world.scene.fog;
        self.veilColor = new THREE.Color(fog ? fog.color : 0xb0a490);
        soundscape.playEntry?.();
        soundscape.setEngine?.(0.8, 0.8);
      },
      tick(u) {
        // Straight down the local vertical, gathering speed.
        const alt = THREE.MathUtils.lerp(HOLD_ALT, ENTRY_ALT, u * u * (1.6 - 0.6 * u));
        self.shipPos.copy(PLANET_C).addScaledVector(upE, PLANET_R + alt);
        const pitch = THREE.MathUtils.lerp(HOLD_PITCH, ENTRY_PITCH, smooth(0, 0.8, u));
        const roll = Math.sin(self.clock * 1.9) * 0.01 * Math.sin(u * Math.PI);
        self.shipQuat.copy(base).multiply(_q.setFromEuler(_e.set(pitch, 0, roll)));
        // No plasma shell on the glass. It was a sphere of streaks scrolling
        // past the canopy, and inside an atmosphere it read as a SECOND jump —
        // the player felt teleported away from the planet they had just
        // reached. The entry is a fall, a buffet and the cloud closing in.
        self.shake = 0.004 + 0.009 * Math.sin(u * Math.PI);
        self.cloud = smooth(0.5, 0.97, u);
        // Falling through it, the cloud streams UP past the glass.
        self.cloudFlow = -1.1;
      },
      exit() { self._swapToWorld(self.dest); }
    };
  }

  /** Behind a full cloud deck, the outside becomes the world itself. */
  _swapToWorld(dest) {
    const world = dest.world;
    this.exterior = 'world';
    this.extWorld = world;
    this.extExposure = this.stage.exposureFor(dest.key);
    this._saveFog(world);
    if (world.scene.fog) { world.scene.fog.near = 0; world.scene.fog.far = 22; }
    this._addFarGround(world);
    for (const p of Object.values(this._planets)) p.group.visible = false;
    this.cloud = 1;
  }

  /**
   * Out of the bottom of the cloud and straight down onto the ground the ship
   * will stand on. The ship falls from overhead, turning onto its landing
   * heading as it drops and bringing its nose up from the ground to the
   * horizon; the only sideways motion is a short slide into line with the pad.
   */
  _phaseDescent() {
    const self = this;
    let yaw0 = 0, yaw1 = 0;
    const start = new THREE.Vector3(), hover = new THREE.Vector3(), fwd = new THREE.Vector3();
    return {
      name: 'descent', dur: 13, label: () => self.dest.def.descent,
      enter() {
        const L = self.dest.landing;
        fwd.set(Math.sin(L.yaw), 0, Math.cos(L.yaw));
        yaw1 = L.yaw;
        yaw0 = L.yaw + 0.55;
        hover.set(L.x, L.deckY + 16, L.z);
        start.copy(hover).addScaledVector(fwd, -28).add(new THREE.Vector3(0, 175, 0));
        self.hoverPos = hover.clone();
        self.shipPos.copy(start);
        self.cloudFlow = -0.7;
        soundscape.setEngine?.(0.55, 0.75);
      },
      tick(u) {
        // Fast out of the cloud, braking all the way onto the hover.
        const k = 1 - Math.pow(1 - u, 2.4);
        const side = smooth(0.1, 0.75, u);
        self.shipPos.set(
          THREE.MathUtils.lerp(start.x, hover.x, side),
          THREE.MathUtils.lerp(start.y, hover.y, k),
          THREE.MathUtils.lerp(start.z, hover.z, side)
        );
        const yaw = THREE.MathUtils.lerp(yaw0, yaw1, ease(smooth(0.05, 0.85, u)));
        const pitch = 0.32 * (1 - smooth(0.1, 0.85, u));
        const roll = Math.sin(self.clock * 0.7) * 0.012 * (1 - u);
        _q2.setFromAxisAngle(_Y, yaw);
        self.shipQuat.copy(_q2).multiply(_q.setFromEuler(_e.set(pitch, 0, roll)));
        // The deck breaks up and the haze draws back as the ship comes out under it.
        self.cloud = 1 - smooth(0.02, 0.26, u);
        const fs = self._fogSaved.get(self.dest.world);
        const fog = self.dest.world.scene.fog;
        if (fog && fs) {
          const f = smooth(0.0, 0.62, u);
          fog.near = THREE.MathUtils.lerp(0, fs.near, f);
          fog.far = THREE.MathUtils.lerp(22, fs.far, f);
        }
        self.shake = 0.004 * (1 - u) + 0.0015;
      },
      exit() { self._restoreFog(self.dest.world); self.cloud = 0; }
    };
  }

  _phaseSettle() {
    const self = this;
    let yawQ = new THREE.Quaternion(), from = new THREE.Vector3(), landedY = 0, thud = false;
    return {
      name: 'settle', dur: 5.2, label: () => 'Touchdown',
      enter() {
        const L = self.dest.landing;
        yawQ.setFromAxisAngle(_Y, L.yaw);
        from.copy(self.shipPos);
        landedY = L.deckY;
        thud = false;
        // The ship stands on the ground it lands on: legs and ramp reach it.
        self._park(self.dest);
      },
      tick(u) {
        const bob = Math.sin(self.clock * 2.1) * 0.08 * (1 - smooth(0.2, 0.5, u));
        const drop = ease(smooth(0.14, 0.86, u));
        let y = THREE.MathUtils.lerp(from.y, landedY, drop) + bob;
        if (u > 0.86) {
          const b = (u - 0.86) / 0.14;
          y = landedY - 0.1 * Math.sin(b * Math.PI) * (1 - b);
          if (!thud) { thud = true; soundscape.playTouchdown?.(); soundscape.setEngine?.(0.15, 0.5); }
        }
        self.shipPos.set(from.x, y, from.z);
        self.shipQuat.copy(yawQ);
        self.shake = u > 0.86 ? 0.02 * (1 - (u - 0.86) / 0.14) : 0.0015 * (1 - u);
      },
      exit() { self.shipPos.y = landedY; self._landed(); }
    };
  }

  _phaseLiftoff() {
    const self = this;
    let base = new THREE.Vector3(), yawQ = new THREE.Quaternion();
    return {
      name: 'liftoff', dur: 4, label: () => `Lifting off ${DESTINATIONS[self.leaving.key].name}`,
      enter() {
        const L = self.leaving.landing;
        base.set(L.x, L.deckY, L.z);
        yawQ.setFromAxisAngle(_Y, L.yaw);
        // The ship is no longer standing there.
        self._unpark(self.leaving, { keepExterior: true });
        soundscape.setEngine?.(0.6, 0.8);
      },
      tick(u) {
        const h = 22 * ease(u);
        self.shipPos.copy(base).add(new THREE.Vector3(0, h, 0));
        const roll = Math.sin(self.clock * 1.3) * 0.01 * u;
        self.shipQuat.copy(yawQ).multiply(_q.setFromEuler(_e.set(-0.03 * u, 0, roll)));
        self.shake = 0.004 + 0.006 * Math.sin(u * Math.PI);
      }
    };
  }

  _phaseClimb() {
    const self = this;
    let curve = null, yawQ = new THREE.Quaternion(), fwd = new THREE.Vector3();
    return {
      name: 'climb', dur: 9, label: () => 'Climbing out',
      enter() {
        const L = self.leaving.landing;
        fwd.set(Math.sin(L.yaw), 0, Math.cos(L.yaw));
        yawQ.setFromAxisAngle(_Y, L.yaw);
        const s = self.shipPos.clone();
        curve = new THREE.CubicBezierCurve3(
          s, s.clone().addScaledVector(fwd, 50).add(new THREE.Vector3(0, 6, 0)),
          s.clone().addScaledVector(fwd, 180).add(new THREE.Vector3(0, 70, 0)),
          s.clone().addScaledVector(fwd, 280).add(new THREE.Vector3(0, 190, 0))
        );
        const fog = self.leaving.world.scene.fog;
        self.veilColor = new THREE.Color(fog ? fog.color : 0xb0a490);
        self._saveFog(self.leaving.world);
        self.cloudFlow = 0.6;   // climbing: the cloud streams down the glass
        soundscape.setEngine?.(0.9, 1.1);
      },
      tick(u) {
        const k = easeIn(u) * 0.35 + u * 0.65;
        self.shipPos.copy(curve.getPointAt(k));
        const pitch = -0.32 * smooth(0, 0.5, u);
        self.shipQuat.copy(yawQ).multiply(_q.setFromEuler(_e.set(pitch, 0, 0)));
        self.cloud = smooth(0.55, 0.97, u);
        const fs = self._fogSaved.get(self.leaving.world);
        const fog = self.leaving.world.scene.fog;
        if (fog && fs) {
          const f = smooth(0.5, 0.95, u);
          fog.near = THREE.MathUtils.lerp(fs.near, 0, f);
          fog.far = THREE.MathUtils.lerp(fs.far, 22, f);
        }
        self.shake = 0.006;
      },
      exit() {
        // Out of the top of the cloud, into space above the world just left.
        const from = self.leaving;
        self._restoreFog(from.world);
        self._removeFarGround(from.world);
        self.exterior = 'space';
        self.extWorld = null;
        self.extExposure = 1.2;
        // The world just left lies ahead and below, so its horizon is in the
        // canopy and curves away as the ship climbs over it.
        self.shipPos.set(0, 0, 0);
        _e.set(-0.08, 0, 0);
        self.shipQuat.setFromEuler(_e);
        const p = self._planetFor(from.key);
        self._placePlanet(p, new THREE.Vector3(0, -PLANET_R - 35, 650));
        p.group.visible = true;
        self.space.stars.setFade(1);
      }
    };
  }

  _phaseEscape() {
    const self = this;
    let curve = null;
    return {
      name: 'escape', dur: 5.5, label: () => `Clearing ${DESTINATIONS[self.leaving.key].name}`,
      enter() {
        curve = new THREE.CubicBezierCurve3(
          new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 40, 900),
          new THREE.Vector3(0, 380, 2500), new THREE.Vector3(0, 900, 3800)
        );
        self.cloudFlow = 0.8;
      },
      tick(u) {
        self.shipPos.copy(curve.getPointAt(easeOut(u) * 0.8 + u * 0.2));
        const tan = curve.getTangentAt(Math.min(0.999, u));
        lookQuat(tan, _Y, self.shipQuat);
        self.cloud = 1 - smooth(0.0, 0.3, u);
        self.shake = 0.005 * (1 - u) + 0.002;
      },
      exit() { self.cloud = 0; }
    };
  }

  /* ----------------------------------------------------------- the ground */

  /** Stand the exterior model and the ship's colliders on `dest`'s world. */
  _park(dest) {
    const model = this._exteriorModel();
    const L = dest.landing;
    const world = dest.world;
    this.parked = { key: dest.key, world, landing: L };
    if (model) {
      world.scene.add(model.group);
      model.group.position.set(L.x, L.deckY, L.z);
      model.group.rotation.set(0, L.yaw, 0);
      model.fitToGround((x, z) => {
        const w = localToWorld(L, x, 0, z);
        return world.getTerrainHeight(w.x, w.z) - L.deckY;
      });
      // The hatch lamp joins the world's lamp pool, whose light count never
      // changes (a world without one simply has no light off the hatch).
      if (model.hatchLamp && world.lampPool) {
        const lp = model.hatchLamp;
        const w = localToWorld(L, lp.local.x, lp.local.y, lp.local.z);
        this._hatchSource = { pool: world.lampPool, src: world.lampPool.add({
          position: new THREE.Vector3(w.x, w.y, w.z),
          color: lp.color, intensity: lp.intensity, distance: lp.distance, decay: lp.decay
        }) };
      }
      // Compile the shell's materials against this world's lights now, off the
      // main thread where the driver allows, so its first frame in view — the
      // player turning round at the foot of the ramp — costs nothing.
      const r = this.stage.renderer;
      if (r?.compileAsync) {
        model.group.visible = true;
        r.compileAsync(model.group, this.stage.camera, world.scene).catch(() => {});
      }
      // Never drawn while the player is inside it.
      model.group.visible = false;
    }
  }

  _unpark(p, { keepExterior = false } = {}) {
    if (!p) return;
    const model = this.exteriorModel;
    if (model && model.group.parent === p.world.scene) {
      p.world.scene.remove(model.group);
      model.group.visible = false;
    }
    const hs = this._hatchSource;
    if (hs && hs.pool === p.world.lampPool) {
      const i = hs.pool.sources.indexOf(hs.src);
      if (i >= 0) hs.pool.sources.splice(i, 1);
      this._hatchSource = null;
    }
    if (!keepExterior) this._removeFarGround(p.world);
    if (this.parked === p) this.parked = null;
  }

  _landed() {
    const st = this.stage;
    this.state = 'landed';
    this.scripted = false;
    this.timeScale = 1;
    this.leaving = null;
    this.shake = 0;
    this.warp = 0;
    this.fov = BASE_FOV;
    this._applyCamera(0);
    st.camera.fov = BASE_FOV;
    st.camera.updateProjectionMatrix();
    if (st.fpsControls) {
      st.fpsControls.euler.setFromQuaternion(st.camera.quaternion);
      st.fpsControls.euler.z = 0;
      st.fpsControls.velocity.set(0, 0, 0);
    }
    this._showAirlockGuide();
    this._emit();
    const q = this.queued;
    this.queued = null;
    if (q && q.key !== this.parked?.key) this.request(q);
  }

  _showAirlockGuide() {
    const st = this.stage;
    if (!st.shipScene) return;
    const name = DESTINATIONS[this.parked?.key]?.name || '';
    this.guide.show(st.shipScene, AIRLOCK_ROUTE, {
      label: name ? `AIRLOCK // ${name.toUpperCase()}` : 'AIRLOCK',
      hover: 1.2
    });
  }

  /** [E] at the airlock hatch, once the ship is down. */
  disembark() {
    if (!this.canDisembark()) return false;
    const st = this.stage;
    this.state = 'disembark';
    this.scripted = true;
    this.guide.hide();
    st.fpsControls?.releaseKeys?.();
    st.fpsControls?.hidePrompt?.();
    this.camPos.copy(st.camera.position);
    this.camQuat.copy(st.camera.quaternion);
    const L = this.parked.landing;
    const world = this.parked.world;
    const groundLocal = (x, z) => {
      const w = localToWorld(L, x, 0, z);
      return world.getTerrainHeight(w.x, w.z) - L.deckY;
    };
    const hz = AIRLOCK_HATCH.z;
    const sillEye = HATCH_SILL.y + EYE + 0.05;
    const footG = groundLocal(RAMP_FOOT.x, hz);
    const pts = [
      this.camPos.clone(),
      new THREE.Vector3(3.9, EYE, hz),
      new THREE.Vector3(HULL.maxX - 0.1, sillEye, hz),
      new THREE.Vector3(HATCH_SILL.x + 0.5, sillEye, hz),
      new THREE.Vector3(RAMP_FOOT.x - 0.6, footG + 1.62, hz),
      new THREE.Vector3(RAMP_FOOT.x, footG + 1.6, hz)
    ];
    // Drop points that sit on top of each other (a player already at the hatch).
    const path = [pts[0]];
    for (const p of pts.slice(1)) if (p.distanceTo(path[path.length - 1]) > 0.25) path.push(p);
    const curve = new THREE.CatmullRomCurve3(path, false, 'centripetal');
    const len = curve.getLength();
    const q0 = this.camQuat.clone();
    const self = this;
    this.phases = [{
      name: 'disembark', dur: 1.6 + len / 1.7,
      label: () => self._stateLabel(),
      enter() { soundscape.playHatch?.(); },
      tick(u, t) {
        const open = smooth(0, 1.4, t);
        st.shipInterior?.setAirlockOpen(open);
        const walk = clamp01((t - 0.9) / Math.max(0.1, this.dur - 0.9));
        const k = ease(walk);
        self.camPos.copy(curve.getPointAt(k));
        const ahead = curve.getPointAt(Math.min(1, k + 0.06)).clone();
        const dir = ahead.sub(self.camPos);
        dir.y *= 0.4;
        if (dir.lengthSq() < 1e-6) dir.set(1, 0, 0);
        const look = self.camPos.clone().add(dir.normalize()).add(new THREE.Vector3(0, -0.12 * smooth(0.4, 0.8, walk), 0));
        const qLook = cameraQuat(self.camPos, look);
        self.camQuat.copy(q0).slerp(qLook, smooth(0, 0.25, t / this.dur + walk));
        // Once through the hull the outside of the ship is what is behind the
        // player, and the interior is no longer drawn.
        const outside = self.camPos.x > HATCH_SILL.x + 0.35;
        if (outside && self.interiorVisible) {
          self.interiorVisible = false;
          if (self.exteriorModel) self.exteriorModel.group.visible = true;
        }
        self.shake = 0;
      },
      exit() { self._finishDisembark(); }
    }];
    this._enterPhase(0);
    return true;
  }

  _finishDisembark() {
    const st = this.stage;
    const p = this.parked;
    this._applyCamera(0);
    st.camera.updateMatrixWorld(true);
    this.shipMatrix.compose(this.shipPos, this.shipQuat, _one);
    const m = new THREE.Matrix4().multiplyMatrices(this.shipMatrix, st.camera.matrixWorld);
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    m.decompose(pos, quat, scl);
    st.shipInterior?.setAirlockOpen(0);
    if (this.exteriorModel) this.exteriorModel.group.visible = true;
    this.state = 'ground';
    this.scripted = false;
    this.interiorVisible = true;
    this._restoreHomeSky();
    st.finishDisembark(p.world, p.key, pos, quat);
    const hash = this.dest?.hash || DESTINATIONS[p.key].hash;
    const waypoint = this.dest?.waypoint || null;
    if (waypoint) this.setGroundWaypoint(waypoint);
    this._emit();
    soundscape.stopEngine?.();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voyage:arrived', { detail: { hash, key: p.key } }));
    }
  }

  /** Lead the player on the ground to `wp` ({ x, z, label }). */
  setGroundWaypoint(wp) {
    const st = this.stage;
    const world = st.activeWorld;
    if (!wp || !world) { this.groundGuide.hide(); return; }
    const from = st.camera.position;
    this.groundGuide.show(world.scene, [[from.x, from.z], [wp.x, wp.z]], {
      label: (wp.label || '').toUpperCase(),
      heightFn: (x, z) => world.getTerrainHeight(x, z),
      hover: 1.25,
      onArrive: () => setTimeout(() => this.groundGuide.hide(), 1200)
    });
  }

  /**
   * The player is going back aboard from the world the ship stands on.
   * They come in through the airlock and the ship is still down.
   */
  board(world) {
    if (!this.parked || this.parked.world !== world) return false;
    const st = this.stage;
    this._ensureSpace();
    this.state = 'landed';
    this.scripted = false;
    this.interiorVisible = true;
    this.exterior = 'world';
    this.extWorld = world;
    this.extExposure = st.exposureFor(this.parked.key);
    this.shipPos.set(this.parked.landing.x, this.parked.landing.deckY, this.parked.landing.z);
    this.shipQuat.setFromAxisAngle(_Y, this.parked.landing.yaw);
    if (this.exteriorModel) this.exteriorModel.group.visible = false;
    // The canopy's own sky (starfield and gas giant) went back into the ship
    // when the player walked off. Standing on a world, the world is the sky:
    // left in, the gas giant hung over the world and rode the whole voyage out.
    this._adoptHomeSky();
    this._releaseHomeSky();
    this.groundGuide.hide();
    this.guide.hide();
    this.dest = { ...this.parked, def: DESTINATIONS[this.parked.key], hash: DESTINATIONS[this.parked.key].hash, waypoint: null };
    // Just inside the hatch, facing into the ship.
    st.camera.position.set(3.3, EYE, AIRLOCK_HATCH.z);
    st.camera.quaternion.copy(cameraQuat(st.camera.position, new THREE.Vector3(0, EYE, AIRLOCK_HATCH.z)));
    if (st.fpsControls) {
      st.fpsControls.euler.setFromQuaternion(st.camera.quaternion);
      st.fpsControls.euler.z = 0;
      st.fpsControls.velocity.set(0, 0, 0);
    }
    st.camera.fov = BASE_FOV;
    st.camera.updateProjectionMatrix();
    this._emit();
    return true;
  }

  /** Back to space, instantly: the player left the world some other way. */
  reset() {
    const st = this.stage;
    if (this.parked) this._unpark(this.parked);
    if (this.leaving) this._unpark(this.leaving);
    for (const w of [...this._farGround.keys()]) this._removeFarGround(w);
    for (const w of [...this._fogSaved.keys()]) this._restoreFog(w);
    this._restoreHomeSky();
    for (const p of Object.values(this._planets)) p.group.visible = false;
    this.guide.hide();
    this.groundGuide.hide();
    this.state = 'idle';
    this.phases = [];
    this.scripted = false;
    this.dest = null;
    this.queued = null;
    this.leaving = null;
    this.interiorVisible = true;
    this.exterior = 'space';
    this.extWorld = null;
    this.cloud = 0; this.flash = 0; this.warp = 0; this.shake = 0;
    st.shipInterior?.setAirlockOpen(0);
    if (st.camera) { st.camera.fov = BASE_FOV; st.camera.updateProjectionMatrix(); }
    soundscape.stopEngine?.();
    this._emit();
  }

  /* ----------------------------------------------------------- the sky */

  _adoptHomeSky() {
    const st = this.stage;
    const home = this.space.home;
    home.visible = true;
    if (this._home) return;
    const vista = st.shipInterior?.group.getObjectByName('vista');
    this._home = { starfield: st.starfield, vista, starParent: st.starfield?.parent, vistaParent: vista?.parent };
    if (st.starfield) home.add(st.starfield);
    if (vista) home.add(vista);
    home.visible = true;
  }

  _releaseHomeSky() {
    if (this.space?.home) this.space.home.visible = false;
  }

  _restoreHomeSky() {
    const h = this._home;
    if (!h) return;
    if (h.starfield && h.starParent) h.starParent.add(h.starfield);
    if (h.vista && h.vistaParent) h.vistaParent.add(h.vista);
    this._home = null;
    if (this.space?.home) this.space.home.visible = true;
  }

  _saveFog(world) {
    const f = world.scene.fog;
    if (f && !this._fogSaved.has(world)) this._fogSaved.set(world, { near: f.near, far: f.far });
  }

  _restoreFog(world) {
    const s = this._fogSaved.get(world);
    const f = world.scene.fog;
    if (s && f) { f.near = s.near; f.far = s.far; }
    this._fogSaved.delete(world);
  }

  _addFarGround(world) {
    // A world whose own ground already runs to the horizon (Erebus) needs no ring.
    if (world.hasFarTerrain || this._farGround.has(world)) return;
    const mesh = buildFarGround(world);
    world.scene.add(mesh);
    this._farGround.set(world, mesh);
  }

  _removeFarGround(world) {
    const mesh = this._farGround.get(world);
    if (!mesh) return;
    world.scene.remove(mesh);
    mesh.geometry.dispose();
    this._farGround.delete(world);
  }

  /* ----------------------------------------------------------- per frame */

  _applyCamera(time) {
    const cam = this.stage.camera;
    cam.position.copy(this.camPos);
    cam.quaternion.copy(this.camQuat);
    if (this.shake > 0) {
      const s = this.shake;
      cam.position.x += (Math.sin(time * 47.3) + Math.sin(time * 91.7) * 0.5) * s;
      cam.position.y += (Math.sin(time * 53.1 + 1.3) + Math.sin(time * 77.9) * 0.5) * s;
      _e.set((Math.sin(time * 61.7) * s) * 0.6, (Math.sin(time * 43.9 + 2.1) * s) * 0.6, 0, 'YXZ');
      cam.quaternion.multiply(_q.setFromEuler(_e));
      _e.order = 'XYZ';
    }
    if (Math.abs(cam.fov - this.fov) > 0.01) {
      cam.fov = this.fov;
      cam.updateProjectionMatrix();
    }
  }

  update(delta, time) {
    this.clock = time;
    if (!this.aboard) return;
    const dt = Math.min(delta, 0.05) * this.timeScale;
    this._dt = dt;
    this.cloudScroll = (this.cloudScroll + dt * (this.cloudFlow ?? 0.4)) % 1000;

    if (this.phases.length && (this.state === 'flight' || this.state === 'disembark')) {
      const p = this.phases[this.phaseIdx];
      this.phaseT += dt;
      const u = clamp01(this.phaseT / p.dur);
      p.tick?.(u, this.phaseT);
      if (this.phaseT >= p.dur) {
        p.exit?.();
        if (this.state === 'flight' && this.phaseIdx + 1 < this.phases.length) {
          this._enterPhase(this.phaseIdx + 1);
        }
      } else if (Math.floor(this.phaseT * 4) !== Math.floor((this.phaseT - dt) * 4)) {
        this._emit();
      }
    }

    if (this.scripted) this._applyCamera(time);

    if (this.state === 'landed' && this.guide.active) this.guide.update(this.stage.camera, time);

    // The space scene's moving parts.
    if (this.space && this.exterior === 'space') {
      const s = this.space;
      s.streaks.update(dt, this.warp || 0);
      s.tunnel.mat.uniforms.uTime.value = time;
      s.tunnel.mesh.visible = s.tunnel.mat.uniforms.uWarp.value > 0.001;
    }
    if (this.exterior === 'world' && this.extWorld) {
      this.extWorld.update?.(delta, this.extCam.position);
    }
  }

  /** Draw the outside, the cloud over it, then the ship over both. */
  render(renderer) {
    const st = this.stage;
    const cam = st.camera;
    cam.updateMatrixWorld(true);
    this.shipMatrix.compose(this.shipPos, this.shipQuat, _one);
    _mw.multiplyMatrices(this.shipMatrix, cam.matrixWorld);
    _mw.decompose(this.extCam.position, this.extCam.quaternion, _s);
    const ext = this.extCam;
    const far = this.exterior === 'space' ? 60000 : 2400;
    const near = this.exterior === 'space' ? 0.5 : 0.1;
    if (ext.fov !== cam.fov || ext.aspect !== cam.aspect || ext.far !== far || ext.near !== near) {
      ext.fov = cam.fov; ext.aspect = cam.aspect; ext.far = far; ext.near = near;
      ext.updateProjectionMatrix();
    }
    ext.updateMatrixWorld(true);

    if (this.space) {
      this.space.frame.position.copy(this.shipPos);
      this.space.frame.quaternion.copy(this.shipQuat);
      this.space.stars.group.position.copy(this.shipPos);
      this.space.home.position.copy(this.shipPos);
    }

    const scene = this.exterior === 'world' && this.extWorld ? this.extWorld.scene : this.space?.scene;
    const baseExposure = renderer.toneMappingExposure;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clear();
    if (scene) {
      renderer.toneMappingExposure = this.exterior === 'world' ? this.extExposure : 1.2;
      renderer.render(scene, ext);
    }

    // Cloud, or the flash of the jump, laid over the outside only.
    const cloud = this.cloud || 0, flash = this.flash || 0;
    if (this.veil && (cloud > 0.002 || flash > 0.002)) {
      const u = this.veil.mat.uniforms;
      u.uTime.value = this.clock;
      if (flash > cloud) {
        u.uColor.value.setRGB(0.95, 0.9, 0.8);
        u.uAlpha.value = flash;
        u.uCloud.value = 0;
      } else {
        u.uColor.value.copy(this.veilColor || _grey);
        u.uAlpha.value = cloud;
        u.uCloud.value = 1;
        u.uScroll.value = this.cloudScroll;
      }
      renderer.render(this.veil.scene, this.veil.camera);
    }

    renderer.clearDepth();
    if (this.interiorVisible) {
      const bg = st.shipScene.background;
      st.shipScene.background = null;
      renderer.toneMappingExposure = baseExposure;
      renderer.render(st.shipScene, cam);
      st.shipScene.background = bg;
    }
    renderer.toneMappingExposure = baseExposure;
    renderer.autoClear = autoClear;
  }

  /** On the ground: keep the waypoint chevron ahead of the player. */
  updateGround(time) {
    if (this.groundGuide.active && this.stage.mode === 'world') {
      this.groundGuide.group.visible = true;
      this.groundGuide.update(this.stage.camera, time);
      if (this.groundGuide.chip) this.groundGuide.chip.hidden = false;
    } else if (this.groundGuide.active) {
      this.groundGuide.group.visible = false;
      if (this.groundGuide.chip) this.groundGuide.chip.hidden = true;
    }
  }
}

const _one = new THREE.Vector3(1, 1, 1);
const _s = new THREE.Vector3();
const _mw = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _grey = new THREE.Color(0xb0a490);
const _fwdV = new THREE.Vector3();
function _fwd(q) { return _fwdV.set(0, 0, 1).applyQuaternion(q); }

/* ----------------------------------------------------------- the route aboard */

/**
 * From the pilot's place to the outer hatch: aft through the bridge, down the
 * spine, in at the airlock's door and up to the hatch. Deck-plan coordinates,
 * so it follows the corridor and never a bulkhead.
 */
const AIRLOCK_DOOR = doorways().find(d => d.wall === 'spine-stbd' &&
  d.pos[1] > ROOMS.airlock.minZ && d.pos[1] < ROOMS.airlock.maxZ);
export const AIRLOCK_ROUTE = [
  [0, 4.4], [0, 1.4], [0, 0.5],
  [0, AIRLOCK_DOOR ? AIRLOCK_DOOR.pos[1] : -6.38],
  [AIRLOCK_DOOR ? AIRLOCK_DOOR.pos[0] + 0.6 : 1.75, AIRLOCK_DOOR ? AIRLOCK_DOOR.pos[1] : -6.38],
  [4.3, AIRLOCK_HATCH.z]
];

/**
 * From wherever the player stands aboard to the pilot's place, by the
 * corridor: out of a side room through its door, along the spine, into the
 * bridge and forward between the flight pods.
 */
function pathToSeat(from) {
  const room = roomAt(from.x, from.z);
  const pts = [from.clone()];
  const add = (x, z, y = EYE) => pts.push(new THREE.Vector3(x, y, z));
  if (room && room !== 'bridge') {
    if (room === 'furnace') {
      add(0, -8.7); add(0, -7.8);
    } else if (room !== 'corridor') {
      const r = ROOMS[room];
      const d = doorways().find(o => (o.wall === 'spine-port' || o.wall === 'spine-stbd') &&
        o.pos[1] > r.minZ && o.pos[1] < r.maxZ &&
        Math.sign(o.pos[0]) === Math.sign((r.minX + r.maxX) / 2));
      if (d) {
        const side = Math.sign(d.pos[0]);
        add(d.pos[0] + side * 0.7, d.pos[1]);
        add(d.pos[0], d.pos[1]);
        add(0, d.pos[1]);
      }
    }
    add(0, -0.3);
    add(0, 0.6);
  }
  add(pts[pts.length - 1].x * 0.4, 2.9);
  pts.push(SEAT_POS.clone());
  // Drop points on top of one another.
  const out = [pts[0]];
  for (const p of pts.slice(1)) if (p.distanceTo(out[out.length - 1]) > 0.3) out.push(p);
  if (out.length === 1) out.push(SEAT_POS.clone());
  return out;
}
