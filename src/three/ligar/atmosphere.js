/**
 * atmosphere.js — Ligar's sky, sun, air, and everything on the horizon.
 *
 * THE LOOK. A basalt province at dusk. The sun is eleven degrees up in the
 * west-south-west and going, dust-reddened to amber, with no hard disc — what
 * a sun this low through this much dust makes is a broad white-gold smoulder
 * with a wide skirt. The opposite sky shows what every real dusk shows and a
 * toy never does: the EARTH'S SHADOW, a slate band lying on the eastern
 * horizon, and above it the BELT OF VENUS, a band of pink back-scattered
 * light. A broken altocumulus deck is lit from UNDERNEATH — orange where it
 * faces the sun, bruise-grey in its own shade — and crepuscular rays fan out
 * of the sun across the low sky where the deck shadows the dust. A full moon
 * is rising out of the belt, as a full moon does at sunset.
 *
 * ONE SKY FUNCTION, as on Erebus and Tallow. `lgSky(dir)` draws the dome;
 * every material's fog is replaced by aerial perspective toward `lgAir` in the
 * direction it is seen, so a colonnade two hundred metres off fades into
 * exactly the sky behind it; the environment map the steel reflects is the
 * same sky. The haze still answers to `scene.fog.near/far`, because the
 * voyage closes it into a cloud deck on the way down.
 *
 * THE FAR COUNTRY LIVES IN THE SKY. Forty kilometres of flood basalt do not
 * slide against each other when a player walks a hundred metres, so the
 * horizon is part of the sky function: stepped trap escarpments whose cliffs
 * are ribbed with column jointing, and in the north-east a shield volcano
 * still breathing a plume that leans downwind and catches the last light.
 */

import * as THREE from 'three';
import { createPlanetMaterial } from '../materials/celestial.js';

const EL = THREE.MathUtils.degToRad(11);
const AZ = THREE.MathUtils.degToRad(149);
/** Toward the sun: low in the west-south-west. */
export const LIGAR_SUN = new THREE.Vector3(
  Math.cos(EL) * Math.cos(AZ), Math.sin(EL), Math.cos(EL) * Math.sin(AZ)
).normalize();

/** Where the volcano stands on the horizon (azimuth, radians, atan2(z, x)). */
const VOLCANO_AZ = THREE.MathUtils.degToRad(-58);

/** Linear colours of the sky model. Smoke and ember, never navy. */
export const LSKY = {
  zenith: new THREE.Color('#2f2c31'),
  upper: new THREE.Color('#5b4b47'),
  horizon: new THREE.Color('#9a7358'),
  haze: new THREE.Color('#86695a'),
  ground: new THREE.Color('#2a2421'),
  sunGlow: new THREE.Color('#f09a52'),
  sun: new THREE.Color('#ffe2b4'),
  belt: new THREE.Color('#b98479'),
  shadow: new THREE.Color('#4e4a52'),
  cloudLit: new THREE.Color('#ee9d5c'),
  cloudBody: new THREE.Color('#4a3d3d'),
  rock: new THREE.Color('#5c4a40'),
  rockShade: new THREE.Color('#2b2729'),
  plume: new THREE.Color('#6f5f5c')
};

/** One uniforms object, referenced by every patched material. */
export const ligarSkyUniforms = {
  uLSunDir: { value: LIGAR_SUN },
  uLZenith: { value: LSKY.zenith },
  uLUpper: { value: LSKY.upper },
  uLHorizon: { value: LSKY.horizon },
  uLHaze: { value: LSKY.haze },
  uLGround: { value: LSKY.ground },
  uLSunGlow: { value: LSKY.sunGlow },
  uLSunCol: { value: LSKY.sun },
  uLBelt: { value: LSKY.belt },
  uLShadow: { value: LSKY.shadow },
  uLCloudLit: { value: LSKY.cloudLit },
  uLCloudBody: { value: LSKY.cloudBody },
  uLRock: { value: LSKY.rock },
  uLRockShade: { value: LSKY.rockShade },
  uLPlume: { value: LSKY.plume },
  uLVolcAz: { value: VOLCANO_AZ },
  uLTime: { value: 0 },
  uLGain: { value: 1.0 }
};

export const LIGAR_SKY_GLSL = /* glsl */ `
  uniform vec3 uLSunDir;
  uniform vec3 uLZenith;
  uniform vec3 uLUpper;
  uniform vec3 uLHorizon;
  uniform vec3 uLHaze;
  uniform vec3 uLGround;
  uniform vec3 uLSunGlow;
  uniform vec3 uLSunCol;
  uniform vec3 uLBelt;
  uniform vec3 uLShadow;
  uniform vec3 uLCloudLit;
  uniform vec3 uLCloudBody;
  uniform vec3 uLRock;
  uniform vec3 uLRockShade;
  uniform vec3 uLPlume;
  uniform float uLVolcAz;
  uniform float uLTime;
  uniform float uLGain;

  float lHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float lNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(lHash(i), lHash(i + vec2(1.0, 0.0)), f.x),
               mix(lHash(i + vec2(0.0, 1.0)), lHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float lFbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * lNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; }
    return s;
  }
  float lFbm3(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { s += a * lNoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; }
    return s;
  }

  // The air toward d: the dusk gradient, the dust on the horizon, the sun's
  // skirt, and on the far side the earth's shadow under the belt of Venus.
  vec3 lgAir(vec3 d) {
    float h = d.y;
    float hp = max(h, 0.0);
    float mu = dot(d, uLSunDir);
    float muc = max(mu, 0.0);
    vec2 hz = normalize(d.xz + 1e-5);
    float sunward = dot(hz, normalize(uLSunDir.xz)) * 0.5 + 0.5;   // 1 toward the sun, 0 away

    vec3 col = mix(uLHorizon, uLUpper, smoothstep(0.0, 0.3, pow(hp, 0.7)));
    col = mix(col, uLZenith, smoothstep(0.22, 0.95, hp));
    // The sunward horizon burns; the far horizon is cooler and paler.
    col = mix(col, col * vec3(1.18, 0.98, 0.82), sunward * (1.0 - smoothstep(0.0, 0.5, hp)));
    // Dust lying on the horizon everywhere.
    col = mix(col, uLHaze, exp(-abs(h) * 18.0) * 0.55);

    // The sun: a white-gold smoulder with a skirt the width of the sky.
    col += uLSunGlow * (pow(muc, 3.0) * 0.55 + pow(muc, 14.0) * 0.8 + pow(muc, 90.0) * 1.1);

    // The anti-solar side: earth's shadow and the belt of Venus above it.
    float anti = 1.0 - sunward;
    float antiK = smoothstep(0.45, 1.0, anti);
    float beltB = smoothstep(0.02, 0.07, h) * (1.0 - smoothstep(0.09, 0.2, h));
    float shad = 1.0 - smoothstep(0.012, 0.045, h);
    col = mix(col, uLBelt, beltB * antiK * 0.55);
    col = mix(col, uLShadow, shad * smoothstep(-0.01, 0.01, h) * antiK * 0.6);

    if (h < 0.0) col = mix(col, uLGround, smoothstep(0.0, 0.2, -h) * 0.7);
    return col * uLGain;
  }

  // THE FAR COUNTRY. Two ridgelines as functions of azimuth, stepped into
  // flat-topped trap benches with cliff fronts, the cliffs ribbed with
  // columns; and the volcano. Coverage in .a, lit and hazed rock in .rgb.
  float lgTrap(float az, float scale, float seed) {
    // Terraced: a smooth profile quantised into benches with steep risers.
    vec2 c = vec2(cos(az), sin(az));
    float n = lFbm(c * scale + seed);
    float steps = 5.0;
    float q = n * steps;
    float fq = fract(q);
    float bench = (floor(q) + smoothstep(0.78, 0.94, fq)) / steps;
    return bench;
  }
  vec4 lgRanges(vec3 d) {
    float e = d.y;
    if (e > 0.12 || e < -0.03) return vec4(0.0);
    vec2 hz = normalize(d.xz + 1e-6);
    float az = atan(hz.y, hz.x);
    vec2 sunH = normalize(uLSunDir.xz);
    float lit = clamp(dot(-hz, sunH) * 0.5 + 0.5, 0.0, 1.0);   // a face turned to the sun
    vec4 outc = vec4(0.0);
    float aa = fwidth(e) * 1.2 + 1e-5;

    // THE VOLCANO: a broad shield with a steeper summit cone, in the north-east.
    float dv = atan(sin(az - uLVolcAz), cos(az - uLVolcAz));
    float shield = 0.042 * pow(max(1.0 - abs(dv) / 0.42, 0.0), 1.6);
    float cone = 0.03 * pow(max(1.0 - abs(dv) / 0.09, 0.0), 1.2);
    float crater = 0.005 * pow(max(1.0 - abs(dv) / 0.03, 0.0), 1.5);
    float vh = 0.004 + shield + cone - crater;

    // FAR RANGE: long, high benches, mostly air.
    {
      float h = 0.008 + 0.03 * lgTrap(az, 2.2, 7.0);
      h = max(h, vh);
      float cov = 1.0 - smoothstep(h - aa, h + aa, e);
      if (cov > 0.0) {
        float rib = lNoise(vec2(az * 900.0, 0.5)) * 0.5 + lNoise(vec2(az * 2300.0, 1.7)) * 0.5;
        float band = lNoise(vec2(az * 6.0, e * 700.0));
        vec3 rock = mix(uLRockShade, uLRock * uLSunCol, lit * (0.7 + 0.5 * rib)) * (0.78 + 0.3 * band);
        float depth = 1.0 - clamp(e / max(h, 1e-4), 0.0, 1.0);
        vec3 col = mix(rock * uLGain, lgAir(vec3(d.x, max(e, 0.004), d.z)), 0.72 + 0.2 * depth);
        outc = vec4(col, cov);
      }
    }
    // NEAR RANGE: lower, broken into separate mesas, darker and closer.
    {
      float sector = smoothstep(0.4, 0.62, lNoise(vec2(cos(az), sin(az)) * 2.4 - 3.0));
      float h = -0.006 + (0.01 + 0.028 * lgTrap(az, 4.3, -2.0)) * sector;
      float cov = (1.0 - smoothstep(h - aa, h + aa, e)) * step(0.0, h);
      if (cov > 0.0) {
        // The cliff band just under each bench top is where the columns show.
        float rib = lNoise(vec2(az * 1600.0, 0.3));
        float band = lNoise(vec2(az * 9.0, e * 1400.0));
        float cliff = smoothstep(h - 0.006, h - 0.0015, e);
        vec3 rock = mix(uLRockShade * 0.85, uLRock * uLSunCol * 1.1, lit * (0.55 + 0.6 * rib * cliff + 0.2));
        rock *= 0.75 + 0.3 * band;
        float depth = 1.0 - clamp(e / max(h, 1e-4), 0.0, 1.0);
        vec3 col = mix(rock * uLGain, lgAir(vec3(d.x, max(e, 0.003), d.z)), 0.5 + 0.3 * depth);
        outc = vec4(mix(outc.rgb, col, cov), max(outc.a, cov));
      }
    }
    return outc;
  }

  // The plume off the volcano: a column that rises, spreads and leans away
  // downwind, lit on the side the low sun can see. Coverage in .a.
  vec4 lgPlume(vec3 d) {
    float e = d.y;
    if (e < 0.0 || e > 0.42) return vec4(0.0);
    vec2 hz = normalize(d.xz + 1e-6);
    float az = atan(hz.y, hz.x);
    float dv = atan(sin(az - uLVolcAz), cos(az - uLVolcAz));
    float top = 0.068;
    float rise = max(e - top, 0.0);
    // The column leans downwind (to larger azimuth) and fans as it climbs.
    float axis = rise * 0.9 + rise * rise * 2.2;
    float width = 0.012 + rise * 0.55;
    float x = (dv - axis) / width;
    if (abs(x) > 1.6) return vec4(0.0);
    float billow = lFbm(vec2(x * 1.4 + uLTime * 0.004, rise * 26.0 - uLTime * 0.02));
    float dens = smoothstep(1.2, 0.2, abs(x) + (billow - 0.5) * 1.1);
    dens *= smoothstep(top - 0.006, top + 0.006, e) * (1.0 - smoothstep(0.22, 0.42, e));
    if (dens <= 0.001) return vec4(0.0);
    float lit = smoothstep(-0.4, 0.8, -x) * 0.6 + 0.4 * billow;
    vec3 c = mix(uLPlume * 0.55, uLPlume * uLSunCol * 1.35, lit);
    // Its root glows faintly: the vent under it is open.
    c += vec3(0.6, 0.16, 0.04) * smoothstep(top + 0.02, top, e) * smoothstep(1.0, 0.0, abs(x)) * 0.25;
    c = mix(c, lgAir(d), 0.45);
    return vec4(c * uLGain, dens * 0.85);
  }

  vec3 lgSky(vec3 d) {
    vec3 col = lgAir(d);
    float mu = dot(d, uLSunDir);
    vec2 hz = normalize(d.xz + 1e-5);
    float sunward = dot(hz, normalize(uLSunDir.xz)) * 0.5 + 0.5;

    // Crepuscular rays: the deck's shadows in the dusty low sky, radiating
    // from the sun (and, far side, converging on the anti-solar point).
    if (d.y > -0.01 && d.y < 0.45) {
      vec3 sd = uLSunDir;
      vec3 ax1 = normalize(cross(sd, vec3(0.0, 1.0, 0.0)));
      vec3 ax2 = cross(ax1, sd);
      float ang = atan(dot(d, ax2), dot(d, ax1));
      float rays = lFbm3(vec2(ang * 7.0, 0.3)) ;
      float k = (1.0 - smoothstep(0.02, 0.4, d.y)) * (0.35 + 0.65 * pow(max(mu, 0.0), 2.0));
      col *= 1.0 - k * smoothstep(0.45, 0.75, rays) * 0.28;
      col += uLSunGlow * k * smoothstep(0.5, 0.2, rays) * 0.06 * sunward;
    }

    // THE DECK: broken altocumulus, lit from beneath by a sun below it.
    if (d.y > 0.012) {
      vec2 p = d.xz / (d.y + 0.07) * 0.9;
      p = mat2(0.9, 0.44, -0.44, 0.9) * p + vec2(uLTime * 0.004, uLTime * 0.0015);
      float big = lFbm(p * 0.45);
      float cell = lFbm(p * 1.7 + big * 1.3);
      float cov = smoothstep(0.5, 0.72, big * 0.55 + cell * 0.6);
      cov *= smoothstep(0.012, 0.12, d.y) * (1.0 - smoothstep(0.55, 0.95, d.y) * 0.6);
      if (cov > 0.0) {
        float thick = smoothstep(0.55, 0.9, cell);
        float under = pow(max(mu, 0.0), 1.5) * 0.8 + sunward * 0.45;
        vec3 cc = mix(uLCloudBody, uLCloudLit, clamp(under * (1.1 - thick * 0.7), 0.0, 1.0));
        // A lining where a cloud's thin edge stands against the sun.
        cc += uLSunCol * pow(max(mu, 0.0), 12.0) * (1.0 - thick) * 1.4;
        // High cloud keeps the day longer: pinker overhead, greyer far off.
        cc = mix(cc, cc * vec3(1.05, 0.88, 0.92), smoothstep(0.3, 0.8, d.y) * 0.5);
        cc = mix(cc, lgAir(d), (1.0 - smoothstep(0.02, 0.2, d.y)) * 0.7);
        col = mix(col, cc * uLGain, cov * 0.92);
      }
      // A thin high cirrus veil in fibres, the last thing lit.
      vec2 q = d.xz / (d.y + 0.2) * 0.6;
      float fib = lFbm3(vec2(q.x * 0.3 + q.y * 0.2, q.y * 3.0 - q.x * 0.9) + uLTime * 0.002);
      float ci = smoothstep(0.58, 0.8, fib) * smoothstep(0.15, 0.5, d.y);
      col = mix(col, vec3(0.95, 0.62, 0.52) * uLGain * (0.5 + 0.5 * sunward), ci * 0.25);
    }

    // The sun itself: no disc, a white-hot smoulder behind the dust.
    col += uLSunCol * (smoothstep(0.9975, 0.99995, mu) * 2.4 + smoothstep(0.9990, 0.99995, mu) * 3.0) * uLGain;

    vec4 pl = lgPlume(d);
    col = mix(col, pl.rgb, pl.a);
    vec4 r = lgRanges(d);
    col = mix(col, r.rgb, r.a);
    return col;
  }

  // The haze a surface fades into, seen along d: the air in that azimuth.
  vec3 lgHaze(vec3 d) {
    return lgAir(normalize(vec3(d.x, clamp(d.y, -0.03, 0.06), d.z)));
  }

  vec3 lgOut(vec3 c) {
    #ifdef TONE_MAPPING
      c = toneMapping(c);
    #endif
    return linearToOutputTexel(vec4(c, 1.0)).rgb;
  }
`;

/** Haze tuning. Dusty air, thickest in the cut and thinning with height. */
export const ligarHazeUniforms = {
  uLHazeBase: { value: -6.0 },
  uLHazeScale: { value: 70.0 },
  uLHazeHeightAmt: { value: 0.55 }
};

/** A dome always centred on the camera that draws it. */
export function createLigarSkyDome(radius = 900) {
  const mat = new THREE.ShaderMaterial({
    uniforms: ligarSkyUniforms,
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
      ${LIGAR_SKY_GLSL}
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = lgSky(d);
        c += (lHash(gl_FragCoord.xy + fract(uLTime)) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.name = 'ligar-sky';
  mesh.userData.phys = 'ambient';
  mesh.userData.noMerge = true;
  return mesh;
}

/** The fog-replacement GLSL, shared by `applyLigarAir` and the hand-written ground. */
export const LIGAR_FOG_PARS = /* glsl */ `
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;
  uniform float uLHazeBase;
  uniform float uLHazeScale;
  uniform float uLHazeHeightAmt;
  varying float vFogDepth;
  varying vec3 vFogWorld;
  ${LIGAR_SKY_GLSL}
`;
export const LIGAR_FOG_APPLY = /* glsl */ `
  {
    vec3 lV = vFogWorld - cameraPosition;
    float lDist = length(lV);
    vec3 lDir = lV / max(lDist, 1e-4);
    float lFd = max(lDist - fogNear, 0.0) / max(fogFar - fogNear, 1.0);
    float lH = 0.5 * (vFogWorld.y + cameraPosition.y);
    float lThin = exp(-max(lH - uLHazeBase, 0.0) / uLHazeScale);
    float lAmt = (1.2 * lFd + 1.1 * lFd * lFd) * mix(1.0, lThin, uLHazeHeightAmt);
    float lFog = 1.0 - exp(-lAmt);
    if (lFog > 0.002) gl_FragColor.rgb = mix(gl_FragColor.rgb, lgOut(lgHaze(lDir)), lFog);
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
        vec4 lFogP = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          lFogP = instanceMatrix * lFogP;
        #endif
        vFogWorld = (modelMatrix * lFogP).xyz;
      #endif`);
}

/** Replace a material's fog with Ligar's air. Chains an existing onBeforeCompile. */
export function applyLigarAir(mat) {
  if (!mat || mat.userData.ligarAir || mat.isShaderMaterial || mat.fog === false) return;
  mat.userData.ligarAir = true;
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey() : '';
  mat.onBeforeCompile = (shader, renderer) => {
    prev?.call(mat, shader, renderer);
    Object.assign(shader.uniforms, ligarSkyUniforms, ligarHazeUniforms);
    shader.vertexShader = patchFogVertex(shader.vertexShader);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <fog_pars_fragment>', `
        #ifdef USE_FOG
          ${LIGAR_FOG_PARS}
        #endif`)
      .replace('#include <fog_fragment>', `
        #ifdef USE_FOG
          ${LIGAR_FOG_APPLY}
        #endif`);
  };
  const key = `${prevKey}|ligar-air`;
  mat.customProgramCacheKey = () => key;
  mat.needsUpdate = true;
}

/**
 * Put a celestial body BEHIND the air: dimmed by the column in front of it,
 * reddened by the dust, and with the sky added over it, so its dark limb is
 * sky rather than black.
 */
function veil(mat) {
  Object.assign(mat.uniforms, ligarSkyUniforms);
  mat.uniforms.uSunDir = { value: LIGAR_SUN };
  mat.uniforms.uSunColor = { value: new THREE.Color('#ffd9b0') };
  const head = mat.fragmentShader.indexOf('void main()');
  let fs = mat.fragmentShader.slice(0, head) + `
    ${LIGAR_SKY_GLSL}
    ` + mat.fragmentShader.slice(head);
  fs = fs.replace(/gl_FragColor = vec4\(color, ([^;]+)\);/, (m, alpha) => `
      {
        vec3 lD = normalize(vWorldPos - cameraPosition);
        float lT = exp(-0.3 / max(lD.y + 0.02, 0.02));
        // Low in the dust, blue goes first.
        color *= lT * vec3(0.95, 0.72, 0.55);
        color += lgAir(lD);
      }
      gl_FragColor = vec4(color, ${alpha});`);
  mat.fragmentShader = fs;
  mat.fog = false;
  mat.needsUpdate = true;
  return mat;
}

/**
 * Ligar's moon: large, full, rising out of the belt of Venus in the east-
 * north-east exactly opposite the setting sun, the colour of old bone through
 * the dust. It does not move: at this distance parallax is a pixel.
 */
export function createLigarCelestials() {
  const group = new THREE.Group();
  group.name = 'ligar-celestials';
  group.userData.phys = 'ambient';
  group.userData.noMerge = true;

  // Opposite the sun in azimuth, a little north of it, eight degrees up.
  const az = AZ + Math.PI + 0.34;
  const el = THREE.MathUtils.degToRad(10.5);
  const dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(52, 64, 48),
    veil(createPlanetMaterial('volcanic', {
      colors: ['#b4a48c', '#7d7062', '#c9b89c', '#000000'],
      seed: [3.1, 7.7, 1.9], octaves: 6
    }))
  );
  moon.position.copy(dir.multiplyScalar(760));
  moon.rotation.set(0.4, 2.2, 0.1);
  moon.frustumCulled = false;
  moon.renderOrder = -5;
  group.add(moon);
  return group;
}

/**
 * The lights. The sun is low, amber and hard; the sky fill is dim and warm,
 * and the ground term is nearly black, because black stone throws almost
 * nothing back.
 */
export function createLigarLights({ shadows }) {
  const sun = new THREE.DirectionalLight(new THREE.Color('#ffc08a'), 3.3);
  sun.position.copy(LIGAR_SUN).multiplyScalar(200);
  sun.castShadow = Boolean(shadows);
  if (shadows) {
    sun.shadow.mapSize.set(2048, 2048);
    const s = 62;
    Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 10, far: 480 });
    sun.shadow.camera.updateProjectionMatrix();
    // A sun this low grazes every flat surface, which is exactly when acne
    // appears; the normal bias is what keeps the pavement clean.
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.06;
    sun.shadow.radius = 2;
  }
  const hemi = new THREE.HemisphereLight(new THREE.Color('#8f7f7c'), new THREE.Color('#2b2522'), 0.95);
  return { sun, hemi };
}

const _right = new THREE.Vector3(0, 1, 0).cross(LIGAR_SUN).normalize();
const _up = LIGAR_SUN.clone().cross(_right).normalize();
const _snapped = new THREE.Vector3();

/**
 * Keep the sun's shadow box on the player, snapped to whole texels. Returns
 * true when the box actually moved, i.e. when the map is out of date for
 * everything that stands still.
 *
 * `step` is how far (metres) the player walks before the box follows. At one
 * texel (6 cm) the box moved on every frame of a walk, and every move is a
 * full re-draw of every caster into a 2048 map. The box is 124 m across, so
 * re-centring it every couple of metres is invisible; the step is still a
 * whole number of texels, so shadows never swim when it does.
 */
export function followLigarShadow(sun, focus, step = 0) {
  if (!sun.castShadow) return false;
  const cam = sun.shadow.camera;
  const texel = (cam.right - cam.left) / sun.shadow.mapSize.x;
  const q = Math.max(1, Math.round(step / texel)) * texel;
  const L = LIGAR_SUN;
  const a = Math.round(focus.dot(_right) / q) * q;
  const b = Math.round(focus.dot(_up) / q) * q;
  const c = Math.round(focus.dot(L) / 0.5) * 0.5;
  _snapped.copy(_right).multiplyScalar(a).addScaledVector(_up, b).addScaledVector(L, c);
  if (_snapped.equals(sun.target.position)) return false;
  sun.target.position.copy(_snapped);
  sun.position.copy(_snapped).addScaledVector(L, 240);
  sun.target.updateMatrixWorld();
  return true;
}

/**
 * An environment map of this sky over black stone, so steel and water
 * reflect the dusk they stand in. Needs a renderer; in Node there is none.
 */
export function createLigarEnvironment(renderer) {
  if (!renderer || !renderer.isWebGLRenderer) return null;
  const envScene = new THREE.Scene();
  const dome = createLigarSkyDome(100);
  envScene.add(dome);
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(95, 32),
    new THREE.MeshBasicMaterial({ color: LSKY.ground.clone().multiplyScalar(0.8) })
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
