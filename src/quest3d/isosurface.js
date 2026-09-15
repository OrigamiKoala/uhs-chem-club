/**
 * isosurface.js — Electrostatic charge density isosurfaces
 * Realistic continuous potential mapping:
 * - Red = most dense (high electron concentration / negative center)
 * - Green/Cyan/Yellow = neutral transition gradient
 * - Blue = least dense (electron-deficient / positive center)
 * Translucent material allows the ball-and-stick molecule underneath to be clearly visible.
 */

import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { MOLECULE_DATA } from './molecule.js';

function sampleColormap(t) {
  // t: -1 (least dense / blue) to +1 (most dense / red)
  const u = Math.max(0, Math.min(1, (t + 1) / 2));
  const color = new THREE.Color();
  if (u < 0.25) {
    // Deep blue (#0066ff) to Sky blue (#00b0ff)
    color.lerpColors(new THREE.Color(0.0, 0.4, 1.0), new THREE.Color(0.0, 0.72, 1.0), u / 0.25);
  } else if (u < 0.5) {
    // Sky blue to Green/Cyan (#10b981)
    color.lerpColors(new THREE.Color(0.0, 0.72, 1.0), new THREE.Color(0.06, 0.75, 0.52), (u - 0.25) / 0.25);
  } else if (u < 0.75) {
    // Green/Cyan to Warm Yellow (#fbbf24)
    color.lerpColors(new THREE.Color(0.06, 0.75, 0.52), new THREE.Color(1.0, 0.75, 0.14), (u - 0.5) / 0.25);
  } else {
    // Warm Yellow to Intense Red (#ff1744)
    color.lerpColors(new THREE.Color(1.0, 0.75, 0.14), new THREE.Color(1.0, 0.09, 0.27), (u - 0.75) / 0.25);
  }
  return color;
}

export class DensityIsosurface {
  constructor(moleculeKey = 'stage1_pair') {
    this.group = new THREE.Group();
    this.moleculeData = MOLECULE_DATA[moleculeKey] || MOLECULE_DATA.stage1_pair;
    this.materials = [];
    this.build();
  }

  build() {
    const { atoms = [], bonds = [], regions = [] } = this.moleculeData;
    if (atoms.length === 0) return;

    // 1. Group atoms into connected molecular clusters via bonds
    const visited = new Set();
    const clusters = [];
    for (let i = 0; i < atoms.length; i++) {
      if (visited.has(i)) continue;
      const cluster = [];
      const queue = [i];
      visited.add(i);
      while (queue.length > 0) {
        const curr = queue.shift();
        cluster.push(curr);
        for (const b of bonds) {
          if (b.from === curr && !visited.has(b.to)) {
            visited.add(b.to);
            queue.push(b.to);
          }
          if (b.to === curr && !visited.has(b.from)) {
            visited.add(b.from);
            queue.push(b.from);
          }
        }
      }
      clusters.push(cluster);
    }

    // 2. Build a smooth, continuous electrostatic charge density isosurface for each cluster
    for (let c = 0; c < clusters.length; c++) {
      const clusterIndices = clusters[c];
      const clusterAtoms = clusterIndices.map(idx => atoms[idx]);

      // Calculate cluster bounding box with comfortable padding
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const a of clusterAtoms) {
        minX = Math.min(minX, a.pos[0] - 1.25); maxX = Math.max(maxX, a.pos[0] + 1.25);
        minY = Math.min(minY, a.pos[1] - 1.25); maxY = Math.max(maxY, a.pos[1] + 1.25);
        minZ = Math.min(minZ, a.pos[2] - 1.25); maxZ = Math.max(maxZ, a.pos[2] + 1.25);
      }

      const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 2.5);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = (minZ + maxZ) / 2;

      // Realistic charge density material: slightly translucent so ball-and-stick model is visible underneath
      const surfaceMat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.36,
        roughness: 0.28,
        metalness: 0.08,
        depthWrite: false,
        side: THREE.FrontSide
      });
      this.materials.push(surfaceMat);

      const mc = new MarchingCubes(28, surfaceMat, false, true, 8000);
      mc.isolation = 80;
      mc.reset();

      // Add atomic centers to the scalar field
      for (const a of clusterAtoms) {
        const bx = (a.pos[0] - (centerX - maxDim / 2)) / maxDim;
        const by = (a.pos[1] - (centerY - maxDim / 2)) / maxDim;
        const bz = (a.pos[2] - (centerZ - maxDim / 2)) / maxDim;
        mc.addBall(bx, by, bz, 0.44, 12);
      }

      // Add bond bridge centers to ensure smooth organic continuity between bonded atoms
      for (const b of bonds) {
        if (clusterIndices.includes(b.from) && clusterIndices.includes(b.to)) {
          const a1 = atoms[b.from];
          const a2 = atoms[b.to];
          const midX = (a1.pos[0] + a2.pos[0]) / 2;
          const midY = (a1.pos[1] + a2.pos[1]) / 2;
          const midZ = (a1.pos[2] + a2.pos[2]) / 2;
          const bx = (midX - (centerX - maxDim / 2)) / maxDim;
          const by = (midY - (centerY - maxDim / 2)) / maxDim;
          const bz = (midZ - (centerZ - maxDim / 2)) / maxDim;
          mc.addBall(bx, by, bz, 0.36, 12);
        }
      }

      mc.update();

      // Color every generated vertex based on the exact electrostatic potential / charge density
      if (mc.count > 0 && mc.geometry.attributes.position && mc.geometry.attributes.color) {
        const pos = mc.geometry.attributes.position.array;
        const col = mc.geometry.attributes.color.array;
        const vertCount = mc.count * 3;

        for (let i = 0; i < vertCount; i++) {
          const wx = centerX + pos[i * 3] * (maxDim / 2);
          const wy = centerY + pos[i * 3 + 1] * (maxDim / 2);
          const wz = centerZ + pos[i * 3 + 2] * (maxDim / 2);

          let potential = 0;
          for (const reg of regions) {
            const dx = wx - reg.pos[0];
            const dy = wy - reg.pos[1];
            const dz = wz - reg.pos[2];
            const distSq = dx * dx + dy * dy + dz * dz;
            const sign = reg.type === 'red' ? 1.0 : -1.0;
            const weight = reg.intensity === 'extreme' ? 1.4 : (reg.intensity === 'moderate' ? 0.8 : 0.5);
            potential += (sign * weight) / (distSq + 0.45);
          }

          const t = Math.tanh(potential * 1.15);
          const c = sampleColormap(t);

          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
        }

        mc.geometry.attributes.color.needsUpdate = true;
        mc.scale.set(maxDim / 2, maxDim / 2, maxDim / 2);
        mc.position.set(centerX, centerY, centerZ);
        this.group.add(mc);
      }
    }
  }

  update(time) {
    // Surface is dynamically illuminated by chamber lights
  }

  dispose() {
    for (const mat of this.materials) {
      mat.dispose();
    }
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
    });
  }
}
