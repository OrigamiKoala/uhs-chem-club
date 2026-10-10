/**
 * lanternfall/atmosphere.js — The sky over Lanternfall, and the light it throws.
 *
 * Lanternfall is an ice field under a permanent aurora. The sun is below the
 * horizon and stays there: what lights the ice is a deep blue polar dusk, a
 * band of teal at the edge of the world and, over the top of it, curtains of
 * green and violet light that move all the time. The aurora is the first
 * emission spectrum the player ever sees, so it is drawn as one: a few exact
 * colours, not a smear.
 *
 * ONE SKY FUNCTION. `lfSky` draws the dome, and the same shader is rendered
 * once into a cube to make the environment the ice and the metal reflect, so
 * the aurora is in the frozen lake and in every glossy plate in the world.
 *
 * THE FOG IS THE HORIZON'S COLOUR. Aerial perspective is three's own `Fog`, in
 * the colour the dome shows at the horizon, with `near` and `far` read by the
 * voyage when it closes a cloud deck over the world.
 *
 * Aesthetic contract (CLAUDE.md §1): nothing blooms. The aurora is dim and
 * layered, and it is a SKY: it is never a lamp, and it lights the ground only
 * by the faint tint the directional and hemisphere lights carry.
 */

import * as THREE from 'three';

export const LFSKY = {
  zenith: new THREE.Color('#040716'),
  mid: new THREE.Color('#0b1b3b'),
  horizon: new THREE.Color('#1c4a5e'),
  glow: new THREE.Color('#2f7f86'),
  ground: new THREE.Color('#1c2b3d')
};

/** Where the aurora's brightest curtain stands, measured from due south round to the west. */
export const AURORA_AZ = THREE.MathUtils.degToRad(190);

/** Shared by the dome and the environment cube: one clock for the aurora. */
export const lfSkyUniforms = {
  uLfTime: { value: 0 },
  uLfZenith: { value: LFSKY.zenith },
  uLfMid: { value: LFSKY.mid },
  uLfHorizon: { value: LFSKY.horizon },
  uLfGlow: { value: LFSKY.glow },
  uLfGround: { value: LFSKY.ground },
  uLfAuroraAz: { value: AURORA_AZ }
};

export const LF_SKY_GLSL = /* glsl */ `
  uniform float uLfTime;
  uniform vec3 uLfZenith;
  uniform vec3 uLfMid;
  uniform vec3 uLfHorizon;
  uniform vec3 uLfGlow;
  uniform vec3 uLfGround;
  uniform float uLfAuroraAz;

  float lfHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float lfNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(lfHash(i), lfHash(i + vec2(1, 0)), u.x),
               mix(lfHash(i + vec2(0, 1)), lfHash(i + vec2(1, 1)), u.x), u.y);
  }
  float lfFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * lfNoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return s;
  }

  /* One curtain: a ribbon that hangs from a ragged lower edge, brightest just
     above it and fading upward, rippling along its length. */
  vec3 lfCurtain(float az, float el, float seed, float baseEl, float height, float speed) {
    float ripple = lfFbm(vec2(az * 2.6 + seed * 7.0 + uLfTime * speed, seed * 3.1));
    float fold = lfFbm(vec2(az * 6.0 - uLfTime * speed * 1.7, seed + 9.0));
    float lower = baseEl + (ripple - 0.5) * 0.18;
    float t = (el - lower) / height;
    float body = smoothstep(0.0, 0.07, t) * (1.0 - smoothstep(0.35, 1.0, t));
    float ray = 0.55 + 0.45 * lfNoise(vec2(az * 38.0 + seed * 20.0, uLfTime * 0.4));
    float vis = smoothstep(0.25, 0.8, fold + (ripple - 0.5) * 0.6);
    vec3 low = vec3(0.12, 1.0, 0.52);
    vec3 high = vec3(0.55, 0.22, 0.95);
    vec3 c = mix(low, high, smoothstep(0.1, 0.95, t));
    return c * body * ray * vis;
  }

  vec3 lfSky(vec3 d) {
    float h = d.y;
    float az = atan(d.x, d.z);
    float el = asin(clamp(h, -1.0, 1.0));

    vec3 col = mix(uLfHorizon, uLfMid, smoothstep(0.0, 0.32, h));
    col = mix(col, uLfZenith, smoothstep(0.28, 0.92, h));
    // The polar dusk: a teal band along the horizon, brightest toward the aurora's side.
    float side = 0.5 + 0.5 * cos(az - uLfAuroraAz);
    col += uLfGlow * exp(-pow(max(h, 0.0) * 5.5, 1.2)) * (0.35 + 0.65 * side);

    // Stars: a few exact points, brighter and rarer than a dust of them.
    vec2 sp = vec2(az * 62.0, el * 62.0);
    float s = lfHash(floor(sp));
    float star = step(0.9965, s) * smoothstep(0.1, 0.5, h);
    star *= 0.55 + 0.45 * sin(uLfTime * (1.0 + s * 3.0) + s * 40.0);
    col += vec3(0.75, 0.85, 1.0) * star * (1.0 - smoothstep(0.0, 0.9, length(fract(sp) - 0.5) * 2.0));

    // The aurora: three curtains at different heights, thickest on its own side of the sky.
    float aur = smoothstep(-0.2, 0.9, cos(az - uLfAuroraAz)) * 0.8 + 0.2;
    vec3 a = lfCurtain(az, el, 1.0, 0.30, 0.55, 0.05)
           + lfCurtain(az + 1.7, el, 2.0, 0.40, 0.50, 0.04) * 0.7
           + lfCurtain(az - 2.3, el, 3.0, 0.22, 0.60, 0.06) * 0.5;
    col += a * aur * 0.62 * smoothstep(0.02, 0.2, el);

    // Below the horizon the ice itself: a dark, faintly lit field.
    col = mix(col, uLfGround, 1.0 - smoothstep(-0.12, 0.0, h));
    return col;
  }
`;

export function createLfSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: lfSkyUniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = position;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * p;
        gl_Position.z = gl_Position.w;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vDir;
      ${LF_SKY_GLSL}
      void main() {
        vec3 c = lfSky(normalize(vDir));
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  dome.name = 'lanternfall-sky';
  dome.frustumCulled = false;
  dome.renderOrder = -10;
  dome.userData.phys = 'ambient';
  dome.userData.noWeather = true;
  return dome;
}

/**
 * A dome that follows whatever camera draws it, so the sky never parallaxes.
 * Takes the eye's position (what `update(delta, cameraPos)` is handed by the
 * stage and the voyage), or a camera.
 */
export function followCamera(dome, eye) {
  const pos = eye?.isVector3 ? eye : eye?.position;
  if (pos) dome.position.copy(pos);
}

/**
 * The light on the ice. A cool directional light from high in the aurora's part
 * of the sky, tinted green by it, and a hemisphere fill that is the polar dusk
 * above and a pale blue bounce off the ice below. Nothing here is a sun.
 */
export function createLfLights({ shadows }) {
  const key = new THREE.DirectionalLight(new THREE.Color('#8fe8c0'), 1.35);
  key.position.set(-40, 120, -90);
  key.castShadow = Boolean(shadows);
  if (shadows) {
    key.shadow.mapSize.set(2048, 2048);
    const s = 60;
    Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 10, far: 420 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#4a6fb0'), new THREE.Color('#9dc2d6'), 1.35);
  return { key, hemi };
}

const _dir = new THREE.Vector3();
const _snap = new THREE.Vector3();

/**
 * The key light's shadow box follows the player in whole texels, so nothing
 * swims, and reports whether it moved (so the shadow is only re-drawn then).
 */
export function followLfShadow(key, focus, step = 0) {
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

/** The sky rendered into a cube and filtered, for the ice and the metal to reflect. */
export function createLfEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createLfSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#7fa6bb').multiplyScalar(0.55) })
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
