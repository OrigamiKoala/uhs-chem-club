/**
 * celestial.js — Physically lit planets, moons, rings and atmospheres for the canopy vista.
 *
 * Surfaces are generated per-pixel from 3D simplex fbm sampled on the object-space
 * normal, so there is no texture seam, no pole pinch and no resolution ceiling. Every
 * body is lit by one distant sun (`SUN_DIRECTION`) and ignores the cabin lights:
 * night sides are genuinely dark, terminators are soft, and atmospheres only scatter
 * on the day side. Nothing here blooms — the limb glow is a thin exponential falloff.
 */

import * as THREE from 'three';

/** World-space direction toward the system's star (upper right, slightly behind the camera). */
export const SUN_DIRECTION = new THREE.Vector3(1.0, 0.42, 0.3).normalize();
const SUN_COLOR = new THREE.Color('#fff1dc');

const NOISE_GLSL = /* glsl */ `
  // 3D simplex noise — Ashima Arts / Stefan Gustavson (MIT).
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p, int octaves) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      sum += amp * snoise(p);
      p = p * 2.03 + vec3(17.1, 9.7, 3.3);
      amp *= 0.5;
    }
    return sum;
  }

  float ridged(vec3 p, int octaves) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      sum += amp * (1.0 - abs(snoise(p)));
      p = p * 2.07 + vec3(5.3, 11.9, 7.1);
      amp *= 0.5;
    }
    return sum;
  }
`;

// Surface albedo functions. Each receives the unit object-space normal `n` and returns
// linear albedo, plus an emissive term for the rare body that has one (lava).
const SURFACES = {
  desert: /* glsl */ `
    vec3 surface(vec3 n, out vec3 emit) {
      emit = vec3(0.0);
      vec3 p = n * 2.1 + uSeed;
      float warp = fbm(p * 1.3, 4);
      float land = fbm(p + warp * 0.6, OCTAVES);
      float detail = fbm(p * 7.0, 4);
      float lat = n.y;

      // Wind-sorted sand: bands that follow latitude but are bent by the terrain.
      float dunes = 0.5 + 0.5 * sin(lat * 26.0 + warp * 7.0 + detail * 2.0);
      vec3 col = mix(uColorA, uColorB, smoothstep(-0.2, 0.5, land) * 0.7 + dunes * 0.18);

      // Exposed rock plateaus and escarpments.
      float rock = smoothstep(0.12, 0.34, land + detail * 0.12);
      float scarp = ridged(p * 3.0, 5);
      col = mix(col, uColorC * (0.75 + 0.35 * scarp), rock * 0.85);

      // Dry basins and pale salt pans.
      float basin = 1.0 - smoothstep(-0.42, -0.2, land);
      float salt = smoothstep(0.1, 0.35, detail) * basin;
      col = mix(col, uColorD, basin * 0.55);
      col = mix(col, vec3(0.62, 0.58, 0.52), salt * 0.45);

      // Thin polar frost.
      float cap = smoothstep(0.84, 0.93, abs(lat) + detail * 0.06);
      col = mix(col, vec3(0.72, 0.7, 0.68), cap * 0.75);

      return col * (0.9 + 0.2 * detail);
    }
  `,
  gas: /* glsl */ `
    vec3 surface(vec3 n, out vec3 emit) {
      emit = vec3(0.0);
      float lat = n.y;
      float lon = atan(n.z, n.x);

      // Zonal flow: noise stretched along longitude, then used to shear the bands.
      vec3 q = vec3(n.x * 2.2, n.y * 11.0, n.z * 2.2) + uSeed;
      float shear = fbm(q + fbm(q * 1.7, 3) * 1.2, OCTAVES);
      float b = lat * 13.0 + shear * 2.2;
      float bands = 0.5 + 0.5 * sin(b);
      float bands2 = 0.5 + 0.5 * sin(b * 2.3 + 1.7);

      vec3 col = mix(uColorA, uColorB, bands);
      col = mix(col, uColorC, smoothstep(0.55, 0.95, bands2) * 0.55);

      float fine = fbm(vec3(n.x * 9.0, n.y * 70.0, n.z * 9.0) + uSeed, 4);
      col *= 0.9 + 0.2 * fine;

      // One long-lived storm, elongated east-west, with a curled collar.
      float dl = mod(lon - 0.9 + 3.14159265, 6.2831853) - 3.14159265;
      vec2 sd = vec2(dl * 0.55, (lat + 0.32) * 1.6);
      float r = length(sd);
      float swirl = snoise(vec3(sd * 18.0 + r * 12.0, 1.3));
      float storm = 1.0 - smoothstep(0.05, 0.11 + swirl * 0.01, r);
      float collar = smoothstep(0.08, 0.11, r) * (1.0 - smoothstep(0.11, 0.16, r));
      col = mix(col, uColorD, storm * 0.85);
      col = mix(col, uColorA * 1.1, collar * 0.4);

      // Hazy, darker poles.
      col *= mix(1.0, 0.6, smoothstep(0.62, 0.96, abs(lat)));
      return col;
    }
  `,
  ice: /* glsl */ `
    vec3 surface(vec3 n, out vec3 emit) {
      emit = vec3(0.0);
      vec3 p = n * 2.4 + uSeed;
      float base = fbm(p, OCTAVES);
      vec3 col = mix(uColorA, uColorB, smoothstep(-0.3, 0.4, base));
      // Tidal fracture lines.
      float crack = 1.0 - smoothstep(0.0, 0.035, abs(snoise(p * 3.2 + base)));
      float crack2 = 1.0 - smoothstep(0.0, 0.02, abs(snoise(p * 7.5)));
      col = mix(col, uColorC, max(crack * 0.7, crack2 * 0.4));
      return col;
    }
  `,
  volcanic: /* glsl */ `
    vec3 surface(vec3 n, out vec3 emit) {
      vec3 p = n * 2.6 + uSeed;
      float base = fbm(p, OCTAVES);
      float ridge = ridged(p * 2.0, 5);
      vec3 col = mix(uColorA, uColorB, smoothstep(-0.3, 0.3, base));
      // Sulphur deposits.
      float sulphur = smoothstep(0.25, 0.5, fbm(p * 1.6 + 4.0, 4));
      col = mix(col, uColorC, sulphur * 0.5);
      col *= 0.75 + 0.3 * ridge;
      // Active vents: tiny, dim, only really visible on the night side.
      float vent = smoothstep(0.78, 0.9, ridge + base * 0.2);
      emit = uColorD * vent * 0.6;
      return col;
    }
  `
};

const PLANET_VERT = /* glsl */ `
  varying vec3 vObjNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vObjNormal = normalize(position);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

function planetFrag(kind) {
  return /* glsl */ `
    uniform vec3 uSunDir;
    uniform vec3 uSunColor;
    uniform vec3 uSeed;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    uniform vec3 uColorD;
    uniform vec3 uAtmoColor;
    uniform float uAtmoStrength;
    varying vec3 vObjNormal;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPos;

    ${NOISE_GLSL}
    ${SURFACES[kind]}

    void main() {
      vec3 n = normalize(vObjNormal);
      vec3 N = normalize(vWorldNormal);
      vec3 V = normalize(cameraPosition - vWorldPos);
      vec3 emit;
      vec3 albedo = surface(n, emit);

      float ndl = dot(N, uSunDir);
      // Lambert with a slightly softened terminator (penumbra of a real star + atmosphere).
      float diffuse = smoothstep(-0.04, 0.12, ndl) * max(ndl, 0.0) + smoothstep(-0.04, 0.12, ndl) * 0.02;
      vec3 color = albedo * uSunColor * diffuse * 1.6;

      // Limb: atmosphere thickens toward the edge of the disk, day side only.
      float ndv = max(dot(N, V), 0.0);
      float limb = pow(1.0 - ndv, 3.0);
      float dayside = smoothstep(-0.25, 0.35, ndl);
      color = mix(color, uAtmoColor * dayside * 1.4, limb * uAtmoStrength);
      // Faint twilight scatter just past the terminator.
      color += uAtmoColor * uAtmoStrength * 0.05 * (1.0 - smoothstep(0.0, 0.2, abs(ndl + 0.05)));

      // Emissive only reads where the sun isn't.
      color += emit * (1.0 - smoothstep(-0.1, 0.2, ndl));

      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;
}

const toLinear = (hex) => new THREE.Color(hex);

/**
 * @param {'desert'|'gas'|'ice'|'volcanic'} kind
 * @param {object} opts colors: [a,b,c,d] sRGB hex; atmo: sRGB hex; atmoStrength 0–1; seed; octaves
 */
export function createPlanetMaterial(kind, opts = {}) {
  const [a, b, c, d] = opts.colors;
  return new THREE.ShaderMaterial({
    defines: { OCTAVES: opts.octaves ?? 6 },
    uniforms: {
      uSunDir: { value: SUN_DIRECTION },
      uSunColor: { value: SUN_COLOR },
      uSeed: { value: new THREE.Vector3(...(opts.seed ?? [0, 0, 0])) },
      uColorA: { value: toLinear(a) },
      uColorB: { value: toLinear(b) },
      uColorC: { value: toLinear(c) },
      uColorD: { value: toLinear(d) },
      uAtmoColor: { value: toLinear(opts.atmo ?? '#000000') },
      uAtmoStrength: { value: opts.atmoStrength ?? 0 }
    },
    vertexShader: PLANET_VERT,
    fragmentShader: planetFrag(kind)
  });
}

/**
 * A thin scattering shell outside the planet. Brightness follows the column density of
 * an exponential atmosphere along the view ray, and only where that ray grazes the day side.
 */
export function createAtmosphereShell(radius, center, { color, strength = 1, scaleHeight = 0.018 } = {}) {
  const outer = radius * 1.07;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uCenter: { value: center.clone() },
      uRadius: { value: radius },
      uScaleHeight: { value: radius * scaleHeight },
      uSunDir: { value: SUN_DIRECTION },
      uColor: { value: toLinear(color) },
      uStrength: { value: strength }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCenter;
      uniform float uRadius;
      uniform float uScaleHeight;
      uniform vec3 uSunDir;
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec3 vWorldPos;
      void main() {
        vec3 rd = normalize(vWorldPos - cameraPosition);
        float t = dot(uCenter - cameraPosition, rd);
        vec3 closest = cameraPosition + rd * t;
        float h = length(closest - uCenter);
        if (h < uRadius) discard; // the planet itself covers this pixel
        float density = exp(-(h - uRadius) / uScaleHeight);
        float sun = smoothstep(-0.35, 0.45, dot(normalize(closest - uCenter), uSunDir));
        float a = density * sun * uStrength;
        gl_FragColor = vec4(uColor * a, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(outer, 64, 32), mat);
  mesh.position.copy(center);
  return mesh;
}

/**
 * Ring system in the XY plane of the mesh. Density is built from layered 1D noise with a
 * clear main gap; the planet casts a hard-edged shadow across it.
 */
export function createRingMaterial({ inner, outer, planetCenter, planetRadius, colors }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uInner: { value: inner },
      uOuter: { value: outer },
      uPlanetCenter: { value: planetCenter.clone() },
      uPlanetRadius: { value: planetRadius },
      uSunDir: { value: SUN_DIRECTION },
      uSunColor: { value: SUN_COLOR },
      uColorA: { value: toLinear(colors[0]) },
      uColorB: { value: toLinear(colors[1]) }
    },
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vLocal = position.xy;
        vWorldNormal = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0));
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uInner;
      uniform float uOuter;
      uniform vec3 uPlanetCenter;
      uniform float uPlanetRadius;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vLocal;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      float hash(float x) { return fract(sin(x * 127.1) * 43758.5453); }
      float noise1(float x) {
        float i = floor(x);
        float f = fract(x);
        return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f));
      }

      void main() {
        float r = (length(vLocal) - uInner) / (uOuter - uInner);
        if (r < 0.0 || r > 1.0) discard;

        float d = 0.45 * noise1(r * 40.0) + 0.3 * noise1(r * 160.0) + 0.25 * noise1(r * 600.0);
        float density = smoothstep(0.2, 0.75, d);
        density *= smoothstep(0.0, 0.06, r) * (1.0 - smoothstep(0.88, 1.0, r));
        density *= 1.0 - (1.0 - smoothstep(0.0, 0.025, abs(r - 0.6))) * 0.95; // main gap
        density *= mix(0.45, 1.0, smoothstep(0.1, 0.5, r));                  // sparse inner ring

        vec3 col = mix(uColorA, uColorB, noise1(r * 25.0 + 3.0));

        // Rings are lit through as well as on: forward-scatter keeps the unlit face from going black.
        float face = abs(dot(normalize(vWorldNormal), uSunDir));
        float light = 0.25 + 0.75 * face;

        // Planet shadow.
        vec3 toC = uPlanetCenter - vWorldPos;
        float along = dot(toC, uSunDir);
        float perp = length(toC - uSunDir * along);
        float shadow = along > 0.0 ? smoothstep(uPlanetRadius * 0.97, uPlanetRadius * 1.02, perp) : 1.0;

        vec3 color = col * uSunColor * light * shadow * 1.3;
        gl_FragColor = vec4(color, density * 0.9);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false
  });
}

/**
 * Irregular rock: a subdivided icosahedron pushed around by a few random sine fields,
 * then squashed. No two are alike.
 */
export function createAsteroidGeometry(size, rand = Math.random) {
  const geo = new THREE.IcosahedronGeometry(1, 3);
  const pos = geo.attributes.position;
  const waves = Array.from({ length: 6 }, (_, k) => ({
    dir: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
    freq: 1.5 + rand() * 2.5 * (k + 1),
    amp: 0.22 / (k + 1),
    phase: rand() * Math.PI * 2
  }));
  const stretch = new THREE.Vector3(0.8 + rand() * 0.6, 0.55 + rand() * 0.35, 0.7 + rand() * 0.4);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let d = 1;
    for (const w of waves) d += w.amp * Math.sin(v.dot(w.dir) * w.freq + w.phase);
    v.multiplyScalar(d).multiply(stretch).multiplyScalar(size);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
