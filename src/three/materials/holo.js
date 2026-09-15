/**
 * holo.js — Dune spice / Star Wars tactical particulate holographic shader
 */

import * as THREE from 'three';

export function createHoloMaterial(colorHex = '#ff9f1c', scanDensity = 45.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uTime: { value: 0 },
      uDensity: { value: scanDensity }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uDensity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      // Pseudo-random noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - abs(dot(vNormal, viewDir));
        float scanline = sin(vUv.y * uDensity - uTime * 2.5) * 0.5 + 0.5;
        float grain = hash(vUv * 120.0 + uTime * 0.1) * 0.35;
        
        // Warm spice particulate shimmer
        float alpha = (0.25 + 0.75 * pow(rim, 2.2)) * (0.55 + 0.45 * scanline + grain);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
}
