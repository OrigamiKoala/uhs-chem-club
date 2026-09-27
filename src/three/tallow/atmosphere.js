/**
 * atmosphere.js — Tallow's sky, sun, air and the ranges on the horizon.
 *
 * THE LOOK. A salt pan at high altitude under a thin veil of cirrostratus: the
 * sun is up at thirty-odd degrees, softened to a white-hot patch rather than a
 * disc, ringed by the 22-degree ice halo that a high veil throws, and the whole
 * sky is milky and bright. The ground bounces most of that back. It is the
 * opposite of Erebus's low red sun, and it is why a white crust reads as salt.
 *
 * ONE SKY FUNCTION, as on Erebus. `tlSky(dir)` draws the dome; every material
 * in the world has its fog replaced by aerial perspective toward `tlAir` in the
 * direction it is seen, so the refinery half a kilometre off turns into exactly
 * the sky behind it, and the environment map the metal reflects is the same
 * sky. The haze still answers to `scene.fog.near/.far`, because the voyage
 * closes it into a cloud deck on the way down.
 *
 * THE FAR RANGES LIVE IN THE SKY. Mountains forty kilometres off do not move
 * when a player walks a hundred metres; drawn as geometry inside a 1000 m far
 * plane they would slide against each other like stage flats. So they are part
 * of the sky function: ridgelines as a function of azimuth, lit by the same sun
 * (a slope that faces it is bright, one that turns away is sky-blue shadow),
 * eroded into gullies, and buried in exactly the air that buries everything
 * else. Because the environment map is rendered from this same function, the
 * mirror flats on the pan reflect them.
 */

import * as THREE from 'three';
import { createPlanetMaterial } from '../materials/celestial.js';

const EL = THREE.MathUtils.degToRad(35);
const AZ = THREE.MathUtils.degToRad(152);
/** Toward the sun, in world space: high in the west-south-west. */
export const TALLOW_SUN = new THREE.Vector3(
  Math.cos(EL) * Math.cos(AZ), Math.sin(EL), Math.cos(EL) * Math.sin(AZ)
).normalize();

/** Linear colours of the sky model. Warm-neutral: bleached, never navy. */
export const TSKY = {
  zenith: new THREE.Color('#7c7f82'),
  upper: new THREE.Color('#aeaba3'),
  horizon: new THREE.Color('#e4ddcf'),
  haze: new THREE.Color('#ddd4c3'),
  ground: new THREE.Color('#d2c8b3'),
  sunGlow: new THREE.Color('#fff0d9'),
  sun: new THREE.Color('#fffaf1'),
  veil: new THREE.Color('#efe9de'),
  rock: new THREE.Color('#a8937a'),
  rockShade: new THREE.Color('#6f7176')
};

/** One uniforms object, referenced by every patched material. */
export const tallowSkyUniforms = {
  uTSunDir: { value: TALLOW_SUN },
  uTZenith: { value: TSKY.zenith },
  uTUpper: { value: TSKY.upper },
  uTHorizon: { value: TSKY.horizon },
  uTHaze: { value: TSKY.haze },
  uTGround: { value: TSKY.ground },
  uTSunGlow: { value: TSKY.sunGlow },
  uTSunCol: { value: TSKY.sun },
  uTVeil: { value: TSKY.veil },
  uTRock: { value: TSKY.rock },
  uTRockShade: { value: TSKY.rockShade },
  uTTime: { value: 0 },
  uTGain: { value: 1.0 }
};

export const TALLOW_SKY_GLSL = /* glsl */ `
  uniform vec3 uTSunDir;
  uniform vec3 uTZenith;
  uniform vec3 uTUpper;
  uniform vec3 uTHorizon;
  uniform vec3 uTHaze;
  uniform vec3 uTGround;
  uniform vec3 uTSunGlow;
  uniform vec3 uTSunCol;
  uniform vec3 uTVeil;
  uniform vec3 uTRock;
  uniform vec3 uTRockShade;
  uniform float uTTime;
  uniform float uTGain;

  float tHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float tNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(tHash(i), tHash(i + vec2(1.0, 0.0)), f.x),
               mix(tHash(i + vec2(0.0, 1.0)), tHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float tFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * tNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; }
    return s;
  }
  // Ridged fbm: sharp crests, the silhouette of eroded rock.
  float tRidge(vec2 p) {
    float s = 0.0, a = 0.55, w = 1.0;
    for (int i = 0; i < 6; i++) {
      float n = 1.0 - abs(tNoise(p) * 2.0 - 1.0);
      n *= n;
      s += a * n * w;
      w = clamp(n * 1.6, 0.0, 1.0);
      p = mat2(1.7, 1.1, -1.1, 1.7) * p + 5.3;
      a *= 0.5;
    }
    return s;
  }

  // Airlight toward d: gradient, horizon haze band, forward scatter through the veil.
  vec3 tlAir(vec3 d) {
    float h = d.y;
    float hp = max(h, 0.0);
    float mu = dot(d, uTSunDir);
    float muc = max(mu, 0.0);
    vec3 col = mix(uTHorizon, uTUpper, smoothstep(0.0, 0.35, pow(hp, 0.75)));
    col = mix(col, uTZenith, smoothstep(0.3, 1.0, hp));
    // The haze that lies on every salt pan's horizon.
    col = mix(col, uTHaze, exp(-abs(h) * 26.0) * 0.6);
    // A veiled sun lights a great patch of sky, not a point.
    col += uTSunGlow * (pow(muc, 4.0) * 0.42 + pow(muc, 24.0) * 0.7 + pow(muc, 260.0) * 1.3);
    // The 22-degree halo: ice prisms in the veil. Faintly red on its inner edge.
    float ang = acos(clamp(mu, -1.0, 1.0));
    float halo = exp(-pow((ang - 0.3840) / 0.0135, 2.0));
    float inner = exp(-pow((ang - 0.3740) / 0.008, 2.0));
    col += (uTSunGlow * halo * 0.22 + vec3(0.09, 0.03, 0.0) * inner) * smoothstep(-0.05, 0.1, h);
    // Anti-solar side a shade cooler.
    float anti = max(-dot(normalize(d.xz + 1e-5), normalize(uTSunDir.xz)), 0.0);
    col *= 1.0 - anti * 0.08 * smoothstep(-0.05, 0.5, h);
    if (h < 0.0) col = mix(col, uTGround, smoothstep(0.0, 0.18, -h) * 0.55);
    return col * uTGain;
  }

  // The ranges on the horizon: two ridgelines as functions of azimuth. Returns
  // coverage in .a and lit, hazed rock in .rgb. Only called near the horizon.
  vec4 tlRanges(vec3 d) {
    float e = d.y;
    if (e > 0.075 || e < -0.03) return vec4(0.0);
    vec2 hz = normalize(d.xz + 1e-6);
    float az = atan(hz.y, hz.x);
    vec2 c = vec2(cos(az), sin(az));
    vec2 sunH = normalize(uTSunDir.xz);
    vec4 outc = vec4(0.0);

    // FAR RANGE: long, high, sharp, and almost all air.
    {
      float sector = smoothstep(0.25, 0.7, tNoise(c * 1.7 + 11.0));
      float r0 = tRidge(c * 3.2 + 4.0);
      float h = 0.006 + (0.012 + 0.036 * sector) * pow(r0, 1.35);
      float eps = 0.004;
      float ra = tRidge(vec2(cos(az + eps), sin(az + eps)) * 3.2 + 4.0);
      float hA = 0.006 + (0.012 + 0.036 * sector) * pow(ra, 1.35);
      float slope = (hA - h) / eps;
      float aa = fwidth(e) * 1.2 + 1e-5;
      float cov = (1.0 - smoothstep(h - aa, h + aa, e));
      if (cov > 0.0) {
        // The face we see points back at us, turned by the ridge's lean.
        vec2 tang = vec2(-hz.y, hz.x);
        float gully = tFbm(vec2(az * 140.0, e * 420.0)) - 0.5;
        vec2 fn = normalize(-hz + tang * clamp(-slope * 0.9 + gully * 1.4, -2.0, 2.0));
        float lit = clamp(dot(fn, sunH) * 0.8 + 0.35, 0.0, 1.0);
        vec3 rock = mix(uTRockShade, uTRock * uTSunCol, lit) * (0.82 + 0.3 * tFbm(vec2(az * 40.0, e * 90.0)));
        float depth = 1.0 - clamp(e / max(h, 1e-4), 0.0, 1.0);
        float haze = 0.74 + 0.2 * depth;
        vec3 col = mix(rock * uTGain, tlAir(vec3(d.x, max(e, 0.004), d.z)), haze);
        outc = vec4(col, cov);
      }
    }
    // NEAR RANGE: lower, broken into separate massifs, a little less air.
    {
      float sector = smoothstep(0.45, 0.72, tNoise(c * 2.6 - 7.0));
      float r0 = tRidge(c * 6.0 - 2.0);
      float h = -0.004 + (0.006 + 0.024 * sector) * pow(r0, 1.6);
      float eps = 0.003;
      float ra = tRidge(vec2(cos(az + eps), sin(az + eps)) * 6.0 - 2.0);
      float hA = -0.004 + (0.006 + 0.024 * sector) * pow(ra, 1.6);
      float slope = (hA - h) / eps;
      float aa = fwidth(e) * 1.2 + 1e-5;
      float cov = (1.0 - smoothstep(h - aa, h + aa, e)) * step(0.0, h);
      if (cov > 0.0) {
        vec2 tang = vec2(-hz.y, hz.x);
        float gully = tFbm(vec2(az * 260.0, e * 700.0)) - 0.5;
        vec2 fn = normalize(-hz + tang * clamp(-slope * 1.2 + gully * 1.8, -2.5, 2.5));
        float lit = clamp(dot(fn, sunH) * 0.85 + 0.3, 0.0, 1.0);
        // Strata: bands of paler and darker rock at fixed elevations.
        float band = tNoise(vec2(az * 3.0, e * 900.0));
        vec3 rock = mix(uTRockShade * 0.9, uTRock * uTSunCol * 1.05, lit) * (0.78 + 0.28 * band);
        float depth = 1.0 - clamp(e / max(h, 1e-4), 0.0, 1.0);
        float haze = 0.56 + 0.3 * depth;
        vec3 col = mix(rock * uTGain, tlAir(vec3(d.x, max(e, 0.003), d.z)), haze);
        outc = vec4(mix(outc.rgb, col, cov), max(outc.a, cov));
      }
    }
    return outc;
  }

  vec3 tlSky(vec3 d) {
    vec3 col = tlAir(d);
    float mu = dot(d, uTSunDir);
    // Within a third of a degree of the horizon the veil's coverage is under a
    // thousandth: the mirror flats and the mirage look there, so skip its noise.
    if (d.y > 0.006) {
      // The veil: a milky sheet with slow structure, brighter toward the sun.
      vec2 p = d.xz / (d.y + 0.12) * 1.1;
      p = mat2(0.87, 0.49, -0.49, 0.87) * p;
      float sheet = tFbm(p * 0.7 + vec2(uTTime * 0.003, 0.0));
      float fibre = tFbm(vec2(p.x * 0.35, p.y * 3.2) + vec2(uTTime * 0.006, 1.7));
      float cov = (0.22 + 0.3 * smoothstep(0.35, 0.8, sheet) + 0.18 * smoothstep(0.55, 0.85, fibre))
                  * smoothstep(0.0, 0.18, d.y);
      float lit = 0.75 + 0.6 * pow(max(mu, 0.0), 5.0);
      col = mix(col, uTVeil * lit * uTGain, cov * 0.5);
    }
    // The sun through the veil: a white-hot core and a wide soft skirt.
    float core = smoothstep(0.99985, 0.99993, mu);
    float skirt = smoothstep(0.9990, 0.99993, mu);
    col += uTSunCol * (core * 7.0 + skirt * 1.4) * uTGain;
    vec4 r = tlRanges(d);
    col = mix(col, r.rgb, r.a);
    return col;
  }

  // The haze a surface fades into, seen along d: the air in that azimuth.
  vec3 tlHaze(vec3 d) {
    return tlAir(normalize(vec3(d.x, clamp(d.y, -0.03, 0.05), d.z)));
  }

  vec3 tlOut(vec3 c) {
    #ifdef TONE_MAPPING
      c = toneMapping(c);
    #endif
    return linearToOutputTexel(vec4(c, 1.0)).rgb;
  }
`;

/** Haze tuning. Salt-pan air is clear; the distance does the work. */
export const tallowHazeUniforms = {
  uTHazeBase: { value: -4.0 },
  uTHazeScale: { value: 90.0 },
  uTHazeHeightAmt: { value: 0.6 }
};

/** A dome always centred on the camera that draws it. */
export function createTallowSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    uniforms: tallowSkyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 wp = vec4(cameraPosition + position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * wp;
        gl_Position.z = gl_Position.w * 0.99999;
      }
    `,
    fragmentShader: /* glsl */ `
      ${TALLOW_SKY_GLSL}
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = tlSky(d);
        c += (tHash(gl_FragCoord.xy + fract(uTTime)) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = 'tallow-sky';
  mesh.userData.phys = 'ambient';
  mesh.userData.noMerge = true;
  return mesh;
}

/**
 * The fog-replacement GLSL, shared by `applyTallowAir` and by any hand-written
 * material (the terrain) that wants to finish itself the same way.
 */
export const TALLOW_FOG_PARS = /* glsl */ `
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  uniform float uTHazeBase;
  uniform float uTHazeScale;
  uniform float uTHazeHeightAmt;
  varying float vFogDepth;
  varying vec3 vFogWorld;
  ${TALLOW_SKY_GLSL}
`;
export const TALLOW_FOG_APPLY = /* glsl */ `
  {
    vec3 tV = vFogWorld - cameraPosition;
    float tDist = length(tV);
    vec3 tDir = tV / max(tDist, 1e-4);
    float tFd = max(tDist - fogNear, 0.0) / max(fogFar - fogNear, 1.0);
    float tH = 0.5 * (vFogWorld.y + cameraPosition.y);
    float tThin = exp(-max(tH - uTHazeBase, 0.0) / uTHazeScale);
    float tAmt = (1.15 * tFd + 1.25 * tFd * tFd) * mix(1.0, tThin, uTHazeHeightAmt);
    float tFog = 1.0 - exp(-tAmt);
    // The first dozen metres carry under half a code value of air: skip the
    // sky evaluation for them, which is most of the ground at the feet.
    if (tFog > 0.002) gl_FragColor.rgb = mix(gl_FragColor.rgb, tlOut(tlHaze(tDir)), tFog);
  }
`;

/** Patch the vertex side of a material so the fog knows where the surface is. */
export function patchFogVertex(vs) {
  return vs
    .replace('#include <fog_pars_vertex>', `
      #ifdef USE_FOG
        varying float vFogDepth;
        varying vec3 vFogWorld;
      #endif`)
    .replace('#include <fog_vertex>', `
      #ifdef USE_FOG
        vFogDepth = - mvPosition.z;
        vec4 tFogP = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          tFogP = instanceMatrix * tFogP;
        #endif
        vFogWorld = (modelMatrix * tFogP).xyz;
      #endif`);
}

/** Replace a material's fog with Tallow's air. Chains an existing onBeforeCompile. */
export function applyTallowAir(mat) {
  if (!mat || mat.userData.tallowAir || mat.isShaderMaterial || mat.fog === false) return;
  mat.userData.tallowAir = true;
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, tallowSkyUniforms, tallowHazeUniforms);
    shader.vertexShader = patchFogVertex(shader.vertexShader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <fog_pars_fragment>', `
        #ifdef USE_FOG
          ${TALLOW_FOG_PARS}
        #endif`)
      .replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          ${TALLOW_FOG_APPLY}
        #endif`);
  };
  const key = `${prevKey}|tallow-air`;
  mat.customProgramCacheKey = () => key;
  mat.needsUpdate = true;
}

/**
 * Put a celestial body BEHIND the air: dim it by the column in front of it and
 * add the sky over it, so its night side is sky rather than black.
 */
function veil(mat) {
  Object.assign(mat.uniforms, tallowSkyUniforms);
  mat.uniforms.uSunDir = tallowSkyUniforms.uTSunDir;
  mat.uniforms.uSunColor = { value: new THREE.Color('#fff4e2') };
  const head = mat.fragmentShader.indexOf('void main()');
  let fs = mat.fragmentShader.slice(0, head) + `
    ${TALLOW_SKY_GLSL}
    ` + mat.fragmentShader.slice(head);
  fs = fs.replace(/gl_FragColor = vec4\(color, ([^;]+)\);/, (m, alpha) => `
      {
        vec3 tD = normalize(vWorldPos - cameraPosition);
        float tT = exp(-0.22 / max(tD.y + 0.02, 0.02));
        color *= tT * 0.62;
        color += tlAir(tD);
      }
      gl_FragColor = vec4(color, ${alpha});`);
  mat.fragmentShader = fs;
  mat.fog = false;
  mat.needsUpdate = true;
  return mat;
}

/**
 * Tallow's primary: a great pale world low in the north-east, a quarter lit by
 * the sun and washed almost to the sky by the air in front of it — the thing a
 * player looks up at and remembers they are not on Earth. A small moon rides
 * higher. Neither moves: at these distances parallax is a pixel.
 */
export function createTallowCelestials() {
  const group = new THREE.Group();
  group.name = 'tallow-celestials';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;

  const dir = new THREE.Vector3(0.62, 0.3, -0.72).normalize();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(118, 64, 48),   // a limb error under half a pixel
    veil(createPlanetMaterial('ice', {
      colors: ['#c9c1b2', '#a39a8a', '#8a8479', '#e4ddd0'],
      seed: [2.2, 9.1, 4.4], octaves: 6
    }))
  );
  body.position.copy(dir.multiplyScalar(780));
  body.rotation.set(0.3, 1.1, 0.2);
  body.frustumCulled = false;
  group.add(body);

  const mDir = new THREE.Vector3(-0.18, 0.52, -0.84).normalize();
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(10, 48, 32),
    veil(createPlanetMaterial('desert', {
      colors: ['#b8ab96', '#8f8574', '#6f675c', '#d6cab5'],
      seed: [5.5, 1.2, 8.8], octaves: 5
    }))
  );
  moon.position.copy(mDir.multiplyScalar(740));
  moon.frustumCulled = false;
  group.add(moon);

  for (const m of [body, moon]) m.renderOrder = -5;
  return group;
}

/**
 * The lights. The sun is high and white, softened by the veil; the second
 * light is the crust itself, throwing most of it back up under everything.
 */
export function createTallowLights({ shadows }) {
  const sun = new THREE.DirectionalLight(new THREE.Color('#fff1dc'), 2.7);
  sun.position.copy(TALLOW_SUN).multiplyScalar(160);
  sun.castShadow = Boolean(shadows);
  if (shadows) {
    sun.shadow.mapSize.set(2048, 2048);
    const s = 58;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 10, far: 420 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    // A veiled sun casts a soft-edged shadow; PCFSoft takes the hint.
    sun.shadow.radius = 3;
  }
  // Sky above, lit salt below. The ground term is the brighter of the two
  // near the pan, which is exactly what makes the undersides of things glow.
  const hemi = new THREE.HemisphereLight(new THREE.Color('#bfc0bd'), new THREE.Color('#dcd0b9'), 1.15);
  return { sun, hemi };
}

const _right = new THREE.Vector3(0, 1, 0).cross(TALLOW_SUN).normalize();
const _up = TALLOW_SUN.clone().cross(_right).normalize();
const _snapped = new THREE.Vector3();

/**
 * Keep the sun's shadow box on the player, snapped to whole texels. Returns
 * true when the box actually moved, i.e. when the shadow map is out of date
 * for everything that stands still.
 */
export function followTallowShadow(sun, focus) {
  if (!sun.castShadow) return false;
  const cam = sun.shadow.camera;
  const texel = (cam.right - cam.left) / sun.shadow.mapSize.x;
  const L = TALLOW_SUN;
  const a = Math.round(focus.dot(_right) / texel) * texel;
  const b = Math.round(focus.dot(_up) / texel) * texel;
  // Along the light the box only needs to follow coarsely: the camera's
  // near/far span covers metres of slack, and a re-render per centimetre of
  // height would defeat the point of snapping at all.
  const c = Math.round(focus.dot(L) / 0.5) * 0.5;
  _snapped.copy(_right).multiplyScalar(a).addScaledVector(_up, b).addScaledVector(L, c);
  if (_snapped.equals(sun.target.position)) return false;
  sun.target.position.copy(_snapped);
  sun.position.copy(_snapped).addScaledVector(L, 200);
  sun.target.updateMatrixWorld();
  return true;
}


/**
 * An environment map of this sky over a salt floor, so metal and brine reflect
 * the air they stand in — and the mirror flats reflect the ranges. Needs a
 * renderer; in Node there is none.
 */
export function createTallowEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createTallowSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: TSKY.ground.clone().multiplyScalar(0.95) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.01);
  pmrem.dispose();
  dome.geometry.dispose();
  dome.material.dispose();
  floor.geometry.dispose();
  floor.material.dispose();
  return rt;
}
