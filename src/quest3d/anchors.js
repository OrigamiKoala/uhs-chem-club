/**
 * anchors.js — Named interactive pick targets and visual proxy markers
 * NEVER reveals "electron density" or "steric hindrance" in user-facing labels
 */

import * as THREE from 'three';

export const ANCHOR_DEFINITIONS = {
  // Stage 1
  red_lp1: { label: 'Red Region', pos: [-1.4, 0.2, 0], color: 0xff1744, type: 'red' },
  blue_c1: { label: 'Blue Region', pos: [1.8, 0, 0], color: 0x00b0ff, type: 'blue' },

  // Stage 2 (matches stage2_pair coordinates)
  // Reuses red_lp1 and blue_c1 (with positions adjusted dynamically or stage 2 coords)
  stage2_red: { label: 'Red Region', pos: [-1.5, 0.3, 0], color: 0xff1744, type: 'red' },
  stage2_blue: { label: 'Blue Region', pos: [1.1, 0, 0], color: 0x00b0ff, type: 'blue' },

  // Stage 3 (Multiple regions)
  red_weak: { label: 'Red Region 1', pos: [-1.3, 1.5, 0], color: 0xc2185b, type: 'red', intensity: 'moderate' },
  red_extreme: { label: 'Red Region 2', pos: [-0.8, -1.2, 0], color: 0xff1744, type: 'red', intensity: 'extreme' },
  blue_extreme: { label: 'Blue Region 1', pos: [1.3, -0.3, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme' },
  blue_weak: { label: 'Blue Region 2', pos: [3.2, -0.7, 0], color: 0x0288d1, type: 'blue', intensity: 'moderate' },

  // Stage 4 (Competing sites)
  stage4_red_weak: { label: 'Red Region 1', pos: [-3.7, 1.2, 0], color: 0xc2185b, type: 'red', intensity: 'moderate' },
  stage4_red_extreme: { label: 'Red Region 2', pos: [-0.4, -0.4, 0], color: 0xff1744, type: 'red', intensity: 'extreme' },
  stage4_blue_extreme: { label: 'Blue Region 1', pos: [1.8, -0.5, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme' },
  stage4_blue_weak: { label: 'Blue Region 2', pos: [2.6, 0.8, 0], color: 0x0288d1, type: 'blue', intensity: 'moderate' },

  // Stage 5 (Steric Hindrance 1)
  red_nu: { label: 'Red Region', pos: [-1.4, 0.2, 0], color: 0xff1744, type: 'red', intensity: 'extreme' },
  blue_open: { label: 'Blue Region (Open)', pos: [1.0, -1.0, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme' },
  blue_blocked: { label: 'Blue Region (Crowded)', pos: [2.0, 1.1, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme', hindered: true },

  // Stage 6 (Steric Hindrance 2)
  stage6_red_nu: { label: 'Red Region', pos: [-1.5, 0.2, 0], color: 0xff1744, type: 'red', intensity: 'extreme' },
  stage6_blue_open: { label: 'Blue Region (Open)', pos: [1.6, -0.9, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme' },
  stage6_blue_blocked: { label: 'Blue Region (Crowded)', pos: [1.8, 1.2, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme', hindered: true },

  // Stage 7 (Master Challenge)
  red_weak1: { label: 'Red Region 1', pos: [-3.7, 1.4, 0], color: 0xc2185b, type: 'red', intensity: 'moderate' },
  red_weak2: { label: 'Red Region 2', pos: [-2.4, -1.8, 0], color: 0xc2185b, type: 'red', intensity: 'moderate' },
  red_supreme: { label: 'Red Region 3', pos: [-0.4, 0, 0], color: 0xff1744, type: 'red', intensity: 'extreme' },
  blue_accessible: { label: 'Blue Region 1', pos: [1.6, -0.8, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme' },
  blue_caged: { label: 'Blue Region 2', pos: [2.0, 1.2, 0], color: 0x00b0ff, type: 'blue', intensity: 'extreme', hindered: true },
  stage7_blue_weak: { label: 'Blue Region 3', pos: [3.4, -1.1, 0], color: 0x0288d1, type: 'blue', intensity: 'moderate' }
};

export class AnchorManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.anchors = [];
    this.scene.add(this.group);
  }

  loadAnchors(anchorIds = [], regions = []) {
    this.clear();

    for (const id of anchorIds) {
      const def = ANCHOR_DEFINITIONS[id];
      const reg = regions.find(r => r.id === id);
      if (!def && !reg) continue;

      const rawPos = reg ? reg.pos : def.pos;
      const pos = new THREE.Vector3(...rawPos);
      const type = reg ? reg.type : (def?.type || 'blue');
      const isExtreme = reg ? reg.intensity === 'extreme' : def?.intensity === 'extreme';
      const color = reg
        ? (type === 'red' ? (isExtreme ? 0xff1744 : 0xc2185b) : (isExtreme ? 0x00b0ff : 0x0288d1))
        : (def?.color || 0x00e5ff);
      const isHindered = reg ? !!reg.hindered : !!def?.hindered;
      const label = def?.label || (type === 'red' ? 'Red Region' : (isHindered ? 'Blue Region (Crowded)' : 'Blue Region'));

      const markerGeo = new THREE.RingGeometry(0.24, 0.34, 32);
      const markerMat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        depthTest: false
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.renderOrder = 900;
      marker.position.copy(pos);

      // Inner glowing core dot
      const coreDotGeo = new THREE.CircleGeometry(0.09, 16);
      const coreDotMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthTest: false
      });
      const coreDot = new THREE.Mesh(coreDotGeo, coreDotMat);
      coreDot.renderOrder = 901;
      marker.add(coreDot);

      // Invisible hit proxy sphere
      const proxyGeo = new THREE.SphereGeometry(0.55, 8, 8);
      const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      marker.add(proxy);

      this.group.add(marker);

      this.anchors.push({
        id,
        position: pos,
        label: def.label,
        color: def.color,
        type: def.type,
        hindered: !!def.hindered,
        mesh: marker
      });
    }

    return this.anchors;
  }

  highlight(anchorId, active = true) {
    for (const a of this.anchors) {
      if (a.id === anchorId) {
        a.mesh.material.color.setHex(active ? 0x00e676 : (a.color || 0x00e5ff));
        a.mesh.scale.setScalar(active ? 1.4 : 1.0);
      }
    }
  }

  update(camera, time) {
    for (const a of this.anchors) {
      a.mesh.lookAt(camera.position);
      const pulse = 1.0 + 0.12 * Math.sin(time * 4.0);
      a.mesh.scale.set(pulse, pulse, pulse);
    }
  }

  clear() {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      child.geometry?.dispose();
      child.material?.dispose();
    }
    this.anchors = [];
  }
}
