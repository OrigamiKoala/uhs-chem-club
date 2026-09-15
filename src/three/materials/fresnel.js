/**
 * fresnel.js — Custom Fresnel rim shader for molecular density clouds
 * Uses perceptually uniform Cividis colormap: yellow-gold (crowded) to deep blue-indigo (starved)
 */

import * as THREE from 'three';

export function createDensityFresnelMaterial(options = {}) {
  const {
    innerColor = new THREE.Color('#ffea46'), // high density core (yellow)
    outerColor = new THREE.Color('#00204d'), // low density fringe (dark blue)
    fresnelPower = 2.5,
    opacity = 0.65
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uInnerColor: { value: innerColor },
      uOuterColor: { value: outerColor },
      uFresnelPower: { value: fresnelPower },
      uOpacity: { value: opacity },
      uTime: { value: 0 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uInnerColor;
      uniform vec3 uOuterColor;
      uniform float uFresnelPower;
      uniform float uOpacity;
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), uFresnelPower);
        vec3 color = mix(uInnerColor, uOuterColor, fresnel * 0.7);
        float alpha = uOpacity * (0.35 + 0.65 * fresnel);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });
}
