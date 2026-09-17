/**
 * starfield.js — Deep-space sky: stars on a distant shell plus a faint galactic band.
 *
 * Stars sit well beyond every planet so they can never draw in front of one. Sizes are
 * in screen pixels (no perspective), drawn from a steep magnitude distribution: thousands
 * of pinpricks, a handful of bright ones. Colours follow stellar temperature, muted.
 */

import * as THREE from 'three';

// Temperature classes, weighted roughly by how they appear to the eye.
const STAR_CLASSES = [
  { color: '#aebfdc', weight: 0.14 }, // hot blue-white
  { color: '#dfe4ee', weight: 0.34 }, // white
  { color: '#f3ead8', weight: 0.3 },  // yellow-white
  { color: '#ecd2a6', weight: 0.15 }, // sand-gold
  { color: '#e0b48a', weight: 0.07 }  // cool orange
];

// Tilt of the galactic plane across the sky.
const GALAXY_NORMAL = new THREE.Vector3(0.35, 0.82, 0.45).normalize();

function pickClass() {
  let r = Math.random();
  for (const c of STAR_CLASSES) {
    if ((r -= c.weight) <= 0) return c;
  }
  return STAR_CLASSES[0];
}

function gaussian() {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

export function createStarfield(count = 8000, radius = 600) {
  const group = new THREE.Group();

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const dir = new THREE.Vector3();
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    dir.randomDirection();
    // About 40% of stars crowd toward the galactic plane.
    if (Math.random() < 0.4) {
      const off = dir.dot(GALAXY_NORMAL);
      dir.addScaledVector(GALAXY_NORMAL, -off + gaussian() * 0.08).normalize();
    }
    const r = radius * (1 + Math.random() * 0.25);
    positions[i * 3] = dir.x * r;
    positions[i * 3 + 1] = dir.y * r;
    positions[i * 3 + 2] = dir.z * r;

    // Brightness ~ power law: most stars barely resolve.
    const m = Math.pow(Math.random(), 7);
    sizes[i] = 0.9 + m * 3.2;
    const intensity = 0.35 + 0.65 * Math.min(1, m * 3 + Math.random() * 0.35);

    color.set(pickClass().color).multiplyScalar(intensity);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const starMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) }
    },
    vertexShader: /* glsl */ `
      attribute float size;
      attribute vec3 color;
      uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uPixelRatio;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float r2 = dot(d, d) * 4.0;
        float a = exp(-r2 * 3.5);
        if (a < 0.02) discard;
        gl_FragColor = vec4(vColor * a, 1.0);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  group.add(new THREE.Points(geometry, starMaterial));

  // Unresolved starlight and dust lanes along the galactic plane. Very dim on purpose.
  const bandMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uNormal: { value: GALAXY_NORMAL }
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uNormal;
      varying vec3 vDir;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float vnoise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
                       mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                       mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p) {
        float s = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.1; a *= 0.5; }
        return s;
      }

      void main() {
        vec3 d = normalize(vDir);
        float lat = dot(d, uNormal);
        float cloud = fbm(d * 6.0);
        float bw = lat / (0.13 + cloud * 0.06);
        float cw = lat / 0.05;
        float band = exp(-bw * bw);
        float core = exp(-cw * cw);
        float lanes = smoothstep(0.42, 0.62, fbm(d * 11.0 + 4.0)) * core;
        float glow = band * (0.35 + 0.65 * cloud) * (1.0 - lanes * 0.85);
        vec3 col = mix(vec3(0.55, 0.58, 0.66), vec3(0.78, 0.7, 0.58), cloud);
        gl_FragColor = vec4(col * glow * 0.045, 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false
  });
  const band = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.4, 48, 24), bandMaterial);
  band.renderOrder = -1;
  group.add(band);

  return group;
}
