/**
 * atmosphere.js — Erebus's sky, sun, haze and the bodies hanging in it.
 *
 * ONE SKY FUNCTION. What makes a rendered desert read as a toy is almost always
 * the air: a sky painted one colour and a fog painted another, meeting in a
 * visible line at the horizon, with distant hills greyed toward something that
 * is not the sky behind them. Here there is one GLSL function, `erebusSky(dir)`,
 * and everything that shows air uses it:
 *
 *   - the sky dome draws it directly;
 *   - every material in the world has its fog replaced by aerial perspective —
 *     the surface fades toward `erebusSky` in the direction it is seen, thinner
 *     with altitude — so a butte eight hundred metres off turns into exactly the
 *     sky behind it, brighter on the sun's side of the view than the other;
 *   - the gas giant and its moon are ADDED to the sky and dimmed by the air
 *     column in front of them, which is how a daytime moon looks: its night side
 *     is not black, it is sky.
 *
 * The haze still answers to `scene.fog.near` / `.far`, because the voyage closes
 * the fog in to a cloud deck on the way down and eases it back out on landing.
 *
 * The sun is low (17 degrees), dust-reddened, and its disc is soft-edged; the
 * sky round it carries the forward-scattering glow of a dusty atmosphere.
 */

import * as THREE from 'three';
import { createPlanetMaterial, createRingMaterial } from '../materials/celestial.js';

const EL = THREE.MathUtils.degToRad(17);
const AZ = THREE.MathUtils.degToRad(29);
/** Toward the sun, in world space. */
export const EREBUS_SUN = new THREE.Vector3(
  Math.cos(EL) * Math.cos(AZ), Math.sin(EL), Math.cos(EL) * Math.sin(AZ)
).normalize();

/** Linear colours of the sky model. Kept here so the lights can agree with the air. */
export const SKY = {
  zenith: new THREE.Color('#4a3a33'),
  upper: new THREE.Color('#9a6a47'),
  horizon: new THREE.Color('#e3b684'),
  haze: new THREE.Color('#cf9f70'),
  ground: new THREE.Color('#8f6a4b'),
  sunGlow: new THREE.Color('#ffc98a'),
  sun: new THREE.Color('#fff0d6'),
  cloud: new THREE.Color('#f2d2aa')
};

/** The shared uniforms: one object, referenced by every patched material. */
export const skyUniforms = {
  uSunDir: { value: EREBUS_SUN },
  uZenith: { value: SKY.zenith },
  uUpper: { value: SKY.upper },
  uHorizon: { value: SKY.horizon },
  uHaze: { value: SKY.haze },
  uGround: { value: SKY.ground },
  uSunGlow: { value: SKY.sunGlow },
  uSunCol: { value: SKY.sun },
  uCloudCol: { value: SKY.cloud },
  uTime: { value: 0 },
  uSkyGain: { value: 1.0 }
};

/** The sky, as a function of direction. Linear HDR out. */
export const SKY_GLSL = /* glsl */ `
  uniform vec3 uSunDir;
  uniform vec3 uZenith;
  uniform vec3 uUpper;
  uniform vec3 uHorizon;
  uniform vec3 uHaze;
  uniform vec3 uGround;
  uniform vec3 uSunGlow;
  uniform vec3 uSunCol;
  uniform vec3 uCloudCol;
  uniform float uTime;
  uniform float uSkyGain;

  float eHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float eNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(eHash(i), eHash(i + vec2(1.0, 0.0)), f.x),
               mix(eHash(i + vec2(0.0, 1.0)), eHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float eFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * eNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; }
    return s;
  }

  // Airlight toward direction d, without the sun's disc or the clouds.
  vec3 erebusAir(vec3 d) {
    float h = d.y;
    float mu = max(dot(d, uSunDir), 0.0);
    float hp = max(h, 0.0);
    vec3 col = mix(uHorizon, uUpper, smoothstep(0.0, 0.32, pow(hp, 0.8)));
    col = mix(col, uZenith, smoothstep(0.25, 1.0, hp));
    // The dust band that sits on every desert horizon.
    col = mix(col, uHaze, exp(-abs(h) * 22.0) * 0.55);
    // Forward scattering off dust: a broad warm glow round the sun, and a tighter aureole.
    col += uSunGlow * (pow(mu, 5.0) * 0.55 + pow(mu, 28.0) * 0.9 + pow(mu, 400.0) * 1.6);
    // Opposite the sun the air is a shade cooler and darker.
    float anti = max(-dot(d.xz, normalize(uSunDir.xz)), 0.0);
    col *= 1.0 - anti * 0.12 * smoothstep(-0.05, 0.4, h);
    // Below the horizon: the lit dust over ground too far off to resolve.
    if (h < 0.0) col = mix(col, uGround, smoothstep(0.0, 0.2, -h) * 0.6);
    return col * uSkyGain;
  }

  vec3 erebusSky(vec3 d) {
    vec3 col = erebusAir(d);
    float mu = dot(d, uSunDir);
    // High cirrus, combed out by the upper wind, lit through from the sun's side.
    // Below 0.02 its coverage is exactly zero, so the noise is not evaluated.
    if (d.y > 0.02) {
      vec2 p = d.xz / (d.y + 0.08) * 1.4;
      p = mat2(0.91, 0.41, -0.41, 0.91) * p;
      float streak = eFbm(vec2(p.x * 0.45, p.y * 2.6) + vec2(uTime * 0.004, 0.0));
      float cov = smoothstep(0.52, 0.82, streak) * smoothstep(0.02, 0.2, d.y) * (1.0 - smoothstep(0.55, 0.9, d.y));
      float lit = 0.6 + 0.8 * pow(max(mu, 0.0), 6.0);
      col = mix(col, uCloudCol * lit * uSkyGain, cov * 0.45);
    }
    // The disc: soft-limbed, and reddened toward the horizon.
    float disc = smoothstep(0.99988, 0.99994, mu);
    float limb = smoothstep(0.99975, 0.99994, mu);
    vec3 sunC = uSunCol * mix(vec3(1.0, 0.72, 0.45), vec3(1.0), smoothstep(0.05, 0.4, uSunDir.y));
    col += sunC * (disc * 14.0 + limb * 2.0) * uSkyGain;
    return col;
  }

  // What haze a surface fades into, seen along d: the air at the horizon in that azimuth.
  vec3 erebusHaze(vec3 d) {
    return erebusAir(normalize(vec3(d.x, clamp(d.y, -0.03, 0.05), d.z)));
  }

  vec3 erebusOut(vec3 c) {
    #ifdef TONE_MAPPING
      c = toneMapping(c);
    #endif
    return linearToOutputTexel(vec4(c, 1.0)).rgb;
  }
`;

/** Haze tuning, shared by every patched material. */
export const hazeUniforms = {
  uHazeBase: { value: -2.0 },       // air thins upward from here
  uHazeScale: { value: 70.0 },       // metres per e-fold
  uHazeHeightAmt: { value: 0.7 }
};

/**
 * A sky dome that is always centred on whatever camera draws it, so its
 * horizon is at the true horizon from anywhere — the walk, the bench or the
 * voyage coming down through the cloud.
 */
export function createSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
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
      ${SKY_GLSL}
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = erebusSky(d);
        // Dither: a sky gradient in eight bits bands without it.
        c += (eHash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = 'erebus-sky';
  // A sky is the world's backdrop, not an object standing in it.
  mesh.userData.phys = 'ambient';
  mesh.userData.noMerge = true;
  return mesh;
}

/**
 * Replace a material's fog with Erebus's aerial perspective. Safe to call on
 * any built-in material (standard, basic, lambert, points); chains with an
 * existing `onBeforeCompile`.
 */
export function applyAerialPerspective(mat) {
  if (!mat || mat.userData.erebusAir || mat.isShaderMaterial || mat.fog === false) return;
  mat.userData.erebusAir = true;
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, skyUniforms, hazeUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <fog_pars_vertex>', `
        #ifdef USE_FOG
          varying float vFogDepth;
          varying vec3 vFogWorld;
        #endif`)
      .replace('#include <fog_vertex>', `
        #ifdef USE_FOG
          vFogDepth = - mvPosition.z;
          vec4 eFogP = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            eFogP = instanceMatrix * eFogP;
          #endif
          vFogWorld = (modelMatrix * eFogP).xyz;
        #endif`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <fog_pars_fragment>', `
        #ifdef USE_FOG
          uniform vec3 fogColor;
          uniform float fogNear;
          uniform float fogFar;
          uniform float uHazeBase;
          uniform float uHazeScale;
          uniform float uHazeHeightAmt;
          varying float vFogDepth;
          varying vec3 vFogWorld;
          ${SKY_GLSL}
        #endif`)
      .replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          vec3 eV = vFogWorld - cameraPosition;
          float eDist = length(eV);
          vec3 eDir = eV / max(eDist, 1e-4);
          float eFd = max(eDist - fogNear, 0.0) / max(fogFar - fogNear, 1.0);
          float eH = 0.5 * (vFogWorld.y + cameraPosition.y);
          float eThin = exp(-max(eH - uHazeBase, 0.0) / uHazeScale);
          float eAmt = (1.3 * eFd + 1.1 * eFd * eFd) * mix(1.0, eThin, uHazeHeightAmt);
          float eFog = 1.0 - exp(-eAmt);
          // The first few metres carry no air worth a sky evaluation (under
          // half a code value): skip it for them, which is most of the ground
          // at the player's feet.
          if (eFog > 0.002) gl_FragColor.rgb = mix(gl_FragColor.rgb, erebusOut(erebusHaze(eDir)), eFog);
        #endif`);
  };
  const key = `${prevKey}|erebus-air`;
  mat.customProgramCacheKey = () => key;
  mat.needsUpdate = true;
}

/** Walk a scene and give every material in it the air. */
export function applyAtmosphereToScene(root) {
  root.traverse(o => {
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) applyAerialPerspective(m);
  });
}

/**
 * Add the sky to a celestial body's shader and dim the body by the air in
 * front of it. The body is drawn over the dome, so this is what makes it sit
 * BEHIND the atmosphere rather than on top of it.
 */
function veilCelestial(mat, { additive = true } = {}) {
  Object.assign(mat.uniforms, skyUniforms);
  mat.uniforms.uSunDir = skyUniforms.uSunDir;
  mat.uniforms.uSunColor = { value: new THREE.Color('#ffe2bd') };
  const head = mat.fragmentShader.indexOf('void main()');
  let fs = mat.fragmentShader.slice(0, head)
    .replace(/uniform vec3 uSunDir;\s*/g, '') + `
    ${SKY_GLSL}
    ` + mat.fragmentShader.slice(head);
  fs = fs.replace(/gl_FragColor = vec4\(color, ([^;]+)\);/, (m, alpha) => `
      {
        vec3 eD = normalize(vWorldPos - cameraPosition);
        float eT = exp(-0.13 / max(eD.y + 0.02, 0.02));
        color *= eT * vec3(1.0, 0.86, 0.7);
        ${additive ? 'color += erebusAir(eD);' : ''}
      }
      gl_FragColor = vec4(color, ${alpha});`);
  mat.fragmentShader = fs;
  mat.fog = false;
  mat.needsUpdate = true;
  return mat;
}

/**
 * The gas giant, its rings and one moon, set in the sky at distances the
 * camera's far plane can hold. They never move with the player — they are far
 * enough that parallax would be a few pixels — but they are dimmed by the air.
 */
export function createCelestials() {
  const group = new THREE.Group();
  group.name = 'erebus-celestials';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;

  // Up and to the north-east, 20 degrees above the horizon, ~9 degrees across.
  const dir = new THREE.Vector3(0.52, 0.34, -0.78).normalize();
  const dist = 760;
  const R = 112;
  const center = dir.clone().multiplyScalar(dist);

  const giant = new THREE.Group();
  giant.position.copy(center);
  giant.rotation.set(0.25, 0.4, 0.42);
  group.add(giant);

  const bodyMat = veilCelestial(createPlanetMaterial('gas', {
    colors: ['#c79a66', '#8b5e3b', '#e4c79a', '#a0492c'],
    seed: [3.1, 1.7, 5.9], octaves: 6
  }));
  // 64 x 48: at seventeen degrees across, the limb stays within half a pixel of round.
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), bodyMat);
  body.frustumCulled = false;
  giant.add(body);

  // The planet's own centre in world space is where `center` is; the ring
  // shader needs it to cast the planet's shadow across the ring plane.
  const ringMat = veilCelestial(createRingMaterial({
    inner: R * 1.32, outer: R * 2.25, planetCenter: center, planetRadius: R,
    colors: ['#b89872', '#6f5a45']
  }), { additive: false });
  // In a daylit sky a ring can only ADD light — it is ice in sunlight behind
  // the air — so it blends additively, like the day side of a moon.
  ringMat.blending = THREE.AdditiveBlending;
  const ring = new THREE.Mesh(new THREE.RingGeometry(R * 1.32, R * 2.25, 160, 1), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.frustumCulled = false;
  giant.add(ring);

  // A small pale moon, lower and further round toward the sun.
  const mDir = new THREE.Vector3(0.1, 0.22, -0.97).normalize();
  const moonMat = veilCelestial(createPlanetMaterial('ice', {
    colors: ['#b7ab98', '#8e8272', '#6a6056', '#d8cdb9'],
    seed: [7.3, 0.4, 2.8], octaves: 5
  }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(13, 48, 32), moonMat);
  moon.position.copy(mDir.multiplyScalar(730));
  moon.frustumCulled = false;
  group.add(moon);

  for (const m of [body, ring, moon]) m.renderOrder = -5;
  return group;
}

/**
 * The lights: a dust-reddened low sun that casts, a hemisphere of sky above and
 * sunlit sand below, and nothing else. On a desert the ground is the second
 * light source, and it is warm.
 */
export function createLights({ shadows }) {
  const sun = new THREE.DirectionalLight(new THREE.Color('#ffd3a1'), 3.4);
  sun.position.copy(EREBUS_SUN).multiplyScalar(150);
  sun.castShadow = Boolean(shadows);
  if (shadows) {
    sun.shadow.mapSize.set(2048, 2048);
    const s = 55;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 10, far: 400 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#b99a7c'), new THREE.Color('#8a5f3c'), 1.25);
  return { sun, hemi };
}

/**
 * Keep the sun's shadow box on the player: a 110 m box that travels with them
 * is five times sharper than one stretched over the whole basin. It moves in
 * whole shadow texels, or every step would make the shadows crawl.
 */
const _right = new THREE.Vector3(0, 1, 0).cross(EREBUS_SUN).normalize();
const _up = EREBUS_SUN.clone().cross(_right).normalize();
const _snapped = new THREE.Vector3();

export function followShadow(sun, focus) {
  if (!sun.castShadow) return false;
  const cam = sun.shadow.camera;
  const texel = (cam.right - cam.left) / sun.shadow.mapSize.x;
  // Snap in the light's own frame; along the light, coarsely (the camera's
  // near/far span has metres of slack). Returns true when the box moved.
  const L = EREBUS_SUN;
  const a = Math.round(focus.dot(_right) / texel) * texel;
  const b = Math.round(focus.dot(_up) / texel) * texel;
  const c = Math.round(focus.dot(L) / 0.5) * 0.5;
  _snapped.copy(_right).multiplyScalar(a).addScaledVector(_up, b).addScaledVector(L, c);
  if (_snapped.equals(sun.target.position)) return false;
  sun.target.position.copy(_snapped);
  sun.position.copy(_snapped).addScaledVector(L, 180);
  sun.target.updateMatrixWorld();
  return true;
}

/**
 * An environment map of this sky, so metal and painted plate reflect the air
 * they stand in rather than nothing. Needs a renderer; in Node there is none
 * and the world simply has no reflections to check.
 */
export function createSkyEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createSkyDome(100);
  envScene.add(dome);
  // Sand below the horizon, so a hull's underside reflects warm ground, not sky.
  const floor = new THREE.Mesh(new THREE.CircleGeometry(95, 32), new THREE.MeshBasicMaterial({ color: SKY.ground.clone().multiplyScalar(0.8) }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2;
  envScene.add(floor);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0.02);
  pmrem.dispose();
  dome.geometry.dispose();
  floor.geometry.dispose();
  return rt;
}
