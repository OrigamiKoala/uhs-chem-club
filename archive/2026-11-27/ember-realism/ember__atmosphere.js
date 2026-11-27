/**
 * ember/atmosphere.js — The sky over Ember Reach, and the light it throws.
 *
 * A caldera in the afternoon under its own weather. The vents and the lake put
 * up so much steam and fume that the sky is never clear: a sulphur-ochre haze
 * lies on the horizon all round, darkening upward to a smoky umber, and a
 * broken overcast of steam and ash drifts across it from the west. The sun is
 * west-south-west and twenty degrees up, a copper smoulder through the haze
 * with no hard disc. To the north the lava lake under the rim lights the
 * underside of everything that passes over it: the horizon there is orange,
 * and so are the bellies of the clouds.
 *
 * ONE SKY FUNCTION. `erSky` draws the dome, and the same shader is rendered
 * once into a cube to make the environment the water, the cladding and the
 * glass reflect, so the hot spring holds the same sky the player sees.
 *
 * THE FOG IS THE HORIZON'S COLOUR. Aerial perspective is three's own `Fog`, in
 * the colour the dome shows at the horizon, with `near` and `far` read by the
 * voyage when it closes a cloud deck over the world.
 *
 * Aesthetic contract (CLAUDE.md §1): nothing blooms. The glow from the lake is
 * light on haze, broad and dim, and it is a SKY: it lights the ground only by
 * the tint of a weak second key from the north.
 */

import * as THREE from 'three';
import { SKY_RENDER_ORDER } from '../sky-order.js';

/** Toward the sun: west-south-west, twenty-one degrees up. */
export const EMBER_SUN = new THREE.Vector3(-0.82, 0.39, 0.44).normalize();

/** Toward the lava lake and the cone, measured as atan2(x, z): due north, a little west. */
export const LAKE_AZ = THREE.MathUtils.degToRad(-176);

export const ERSKY = {
  zenith: new THREE.Color('#2e2826'),
  upper: new THREE.Color('#6a5446'),
  horizon: new THREE.Color('#a68b69'),
  haze: new THREE.Color('#b59a72'),
  ground: new THREE.Color('#3b322b'),
  sunGlow: new THREE.Color('#f0a466'),
  sun: new THREE.Color('#ffe0b8'),
  lake: new THREE.Color('#e0662a'),
  cloudLit: new THREE.Color('#e8b78a'),
  cloudBody: new THREE.Color('#5d5049'),
  cloudBelly: new THREE.Color('#c9572a')
};

/** Shared by the dome and the environment cube: one clock for the weather. */
export const erSkyUniforms = {
  uErTime: { value: 0 },
  uErSun: { value: EMBER_SUN },
  uErLakeAz: { value: LAKE_AZ },
  uErZenith: { value: ERSKY.zenith },
  uErUpper: { value: ERSKY.upper },
  uErHorizon: { value: ERSKY.horizon },
  uErHaze: { value: ERSKY.haze },
  uErGround: { value: ERSKY.ground },
  uErSunGlow: { value: ERSKY.sunGlow },
  uErSunCol: { value: ERSKY.sun },
  uErLake: { value: ERSKY.lake },
  uErCloudLit: { value: ERSKY.cloudLit },
  uErCloudBody: { value: ERSKY.cloudBody },
  uErCloudBelly: { value: ERSKY.cloudBelly }
};

export const ER_SKY_GLSL = /* glsl */ `
  uniform float uErTime;
  uniform vec3 uErSun;
  uniform float uErLakeAz;
  uniform vec3 uErZenith;
  uniform vec3 uErUpper;
  uniform vec3 uErHorizon;
  uniform vec3 uErHaze;
  uniform vec3 uErGround;
  uniform vec3 uErSunGlow;
  uniform vec3 uErSunCol;
  uniform vec3 uErLake;
  uniform vec3 uErCloudLit;
  uniform vec3 uErCloudBody;
  uniform vec3 uErCloudBelly;

  float erHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float erNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(erHash(i), erHash(i + vec2(1, 0)), u.x),
               mix(erHash(i + vec2(0, 1)), erHash(i + vec2(1, 1)), u.x), u.y);
  }
  float erFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * erNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; }
    return s;
  }

  /* The air toward d: the haze on the horizon, the smoulder of the sun and, to
     the north, the lake's glow on the haze. No cloud: this is also the fog. */
  vec3 erAir(vec3 d) {
    float h = d.y;
    float hp = max(h, 0.0);
    float az = atan(d.x, d.z);
    float mu = max(dot(d, uErSun), 0.0);
    vec3 col = mix(uErHorizon, uErUpper, smoothstep(0.0, 0.34, pow(hp, 0.75)));
    col = mix(col, uErZenith, smoothstep(0.3, 0.98, hp));
    col = mix(col, uErHaze, exp(-abs(h) * 14.0) * 0.6);
    // The sun: a copper smoulder with a skirt a third of the sky wide.
    col += uErSunGlow * (pow(mu, 4.0) * 0.42 + pow(mu, 18.0) * 0.6 + pow(mu, 120.0) * 0.9);
    col += uErSunCol * pow(mu, 900.0) * 0.6;
    // The lake under the rim lights the haze over it, broad and low.
    float lake = pow(max(cos(az - uErLakeAz), 0.0), 3.0);
    col += uErLake * lake * exp(-hp * 9.0) * 0.32;
    return col;
  }

  vec3 erSky(vec3 d) {
    float h = d.y;
    vec3 col = erAir(d);
    if (h > 0.0) {
      // The overcast: steam and ash in a broken deck, drifting from the west.
      vec2 p = d.xz / (h + 0.08) * 1.35;
      p += vec2(uErTime * 0.011, -uErTime * 0.004);
      float base = erFbm(p * 0.9);
      float detail = erFbm(p * 2.7 + 13.1);
      float cover = smoothstep(0.42, 0.78, base * 0.75 + detail * 0.35);
      // Thin at the zenith, thick toward the horizon, where the eye looks through more of it.
      cover *= smoothstep(0.0, 0.08, h) * (0.55 + 0.45 * smoothstep(0.9, 0.2, h));
      float mu = dot(d, uErSun);
      float az = atan(d.x, d.z);
      float lake = pow(max(cos(az - uErLakeAz), 0.0), 2.0) * (1.0 - smoothstep(0.05, 0.55, h));
      vec3 cloud = mix(uErCloudBody, uErCloudLit, smoothstep(-0.2, 0.9, mu) * (0.4 + 0.6 * detail));
      cloud = mix(cloud, uErCloudBelly, lake * (1.0 - detail) * 0.75);
      // Edges toward the sun burn through.
      cloud += uErSunGlow * pow(max(mu, 0.0), 10.0) * (1.0 - cover) * 0.5;
      col = mix(col, cloud, cover * 0.85);
      // The haze sits in front of the deck at the horizon.
      col = mix(col, erAir(d), exp(-h * 10.0) * 0.55);
    }
    // Below the horizon: the caldera's own floor, faintly lit.
    col = mix(col, uErGround, 1.0 - smoothstep(-0.1, 0.0, h));
    return col;
  }
`;

export function createErSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: erSkyUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_Position.z = gl_Position.w * 0.999999;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      ${ER_SKY_GLSL}
      void main() {
        vec3 c = erSky(normalize(vDir));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'ember-sky';
  dome.frustumCulled = false;
  // Drawn last of the opaques, as every world's sky is (sky-order.js).
  dome.renderOrder = SKY_RENDER_ORDER;
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/** A dome that follows the eye, so the sky never parallaxes. Takes a position or a camera. */
export function followCamera(dome, eye) {
  const pos = eye?.isVector3 ? eye : eye?.position;
  if (pos) dome.position.copy(pos);
}

/**
 * The light on the shelf. A copper sun from the west-south-west that casts the
 * shadows; a hemisphere fill that is the ochre haze above and the warm bounce
 * off pale sinter below; and a weak orange key from the north, low, with no
 * shadow: the lake's glow on the underside of the world.
 */
export function createErLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#ffd0a0'), 2.15);
  key.position.copy(EMBER_SUN).multiplyScalar(240);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    const s = 60;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 10, far: 480 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#c7aa84'), new THREE.Color('#77624e'), 1.1);
  const glow = new THREE.DirectionalLight(new THREE.Color('#ff8a4c'), 0.32);
  glow.position.set(-8, 26, -120);
  glow.castShadow = false;
  return { key, hemi, glow };
}

const _dir = new THREE.Vector3();
const _snap = new THREE.Vector3();

/**
 * The sun's shadow box follows the player in whole texels, so nothing swims,
 * and reports whether it moved (so the shadow is only re-drawn then).
 */
export function followErShadow(key, focus, step = 0) {
  if (!key.castShadow) return false;
  const cam = key.shadow.camera;
  const texel = (cam.right - cam.left) / key.shadow.mapSize.x;
  const q = Math.max(1, Math.round(step / texel)) * texel;
  _dir.copy(key.position).sub(key.target.position).normalize();
  const right = _snap.set(0, 1, 0).cross(_dir).normalize().clone();
  const up = new THREE.Vector3().copy(_dir).cross(right).normalize();
  const a = Math.round(focus.dot(right) / q) * q;
  const b = Math.round(focus.dot(up) / q) * q;
  const c = Math.round(focus.dot(_dir) / 0.5) * 0.5;
  const target = new THREE.Vector3().copy(right).multiplyScalar(a).addScaledVector(up, b).addScaledVector(_dir, c);
  if (target.equals(key.target.position)) return false;
  key.target.position.copy(target);
  key.position.copy(target).addScaledVector(_dir, 240);
  key.target.updateMatrixWorld();
  return true;
}

/** The sky rendered into a cube and filtered, for the water, the cladding and the glass to reflect. */
export function createErEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createErSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#b9ab94').multiplyScalar(0.5) })
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
