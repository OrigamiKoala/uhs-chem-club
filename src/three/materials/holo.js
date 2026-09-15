/**
 * holo.js — Holographic shader material for tactical tables and alien consoles
 */

import * as THREE from 'three';

export function createHoloMaterial(colorHex = '#00e5ff', scanDensity = 40.0) {
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

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
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

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - abs(dot(vNormal, viewDir));
        float scanline = sin(vUv.y * uDensity - uTime * 3.0) * 0.5 + 0.5;
        float alpha = (0.2 + 0.6 * pow(rim, 2.0)) * (0.6 + 0.4 * scanline);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
}
