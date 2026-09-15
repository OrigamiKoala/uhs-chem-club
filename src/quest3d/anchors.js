/**
 * anchors.js — Named interactive pick targets and visual proxy markers
 */

import * as THREE from 'three';

export const ANCHOR_DEFINITIONS = {
  // Water
  lp_o: { label: 'Oxygen Lone Pair (High Density)', pos: [0, 0.9, 0.45], color: 0xffea46 },
  h1: { label: 'Hydrogen 1', pos: [-0.85, -0.55, 0], color: 0x00e5ff },
  h2: { label: 'Hydrogen 2', pos: [0.85, -0.55, 0], color: 0x00e5ff },

  // Nucleophile-Electrophile pair
  c1: { label: 'Carbon Electrophile (Starved Core)', pos: [0.6, 0, 0], color: 0x00e5ff },
  cl1: { label: 'Chloride Halogen', pos: [2.1, 0, 0], color: 0x22c55e },
  c_cl: { label: 'C-Cl Sigma Bond', pos: [1.35, 0, 0], color: 0xffb300 },
  cl: { label: 'Chloride Leaving Group', pos: [2.1, 0, 0], color: 0x22c55e },

  // Bonus
  lp_nu: { label: 'Nucleophile Lone Pair', pos: [-1.6, 0.7, 0], color: 0xffea46 },
  c_sub: { label: 'Substrate Carbon Center', pos: [0.4, 0, 0], color: 0x00e5ff },
  c_br: { label: 'C-Br Sigma Bond', pos: [1.3, 0, 0], color: 0xffb300 },
  br: { label: 'Bromide Leaving Group', pos: [2.2, 0, 0], color: 0xef4444 },

  // Molecular Beacons (HF, LiH, H2)
  hf: { label: 'HF Beacon', pos: [-2.0, 0, 0], color: 0x00e5ff },
  lih: { label: 'LiH Beacon', pos: [0, 0, 0], color: 0x00e5ff },
  h2_beacon: { label: 'H2 Beacon', pos: [2.0, 0, 0], color: 0x00e5ff }
};

export class AnchorManager {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.anchors = []; // array of { id, position, label, mesh }
    this.scene.add(this.group);
  }

  loadAnchors(anchorIds = []) {
    this.clear();

    for (const id of anchorIds) {
      const def = ANCHOR_DEFINITIONS[id];
      if (!def) continue;

      const pos = new THREE.Vector3(...def.pos);
      const markerGeo = new THREE.RingGeometry(0.18, 0.22, 24);
      const markerMat = new THREE.MeshBasicMaterial({
        color: def.color || 0x00e5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pos);

      // Invisible larger hit proxy sphere
      const proxyGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
      const proxy = new THREE.Mesh(proxyGeo, proxyMat);
      marker.add(proxy);

      this.group.add(marker);

      this.anchors.push({
        id,
        position: pos,
        label: def.label,
        mesh: marker
      });
    }

    return this.anchors;
  }

  highlight(anchorId, active = true) {
    for (const a of this.anchors) {
      if (a.id === anchorId) {
        a.mesh.material.color.setHex(active ? 0x00e676 : (ANCHOR_DEFINITIONS[a.id]?.color || 0x00e5ff));
        a.mesh.scale.setScalar(active ? 1.4 : 1.0);
      }
    }
  }

  update(camera, time) {
    for (const a of this.anchors) {
      // Billboarding: make rings face camera
      a.mesh.lookAt(camera.position);
      // Gentle pulse
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
