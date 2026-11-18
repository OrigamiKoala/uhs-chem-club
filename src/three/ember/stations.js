/**
 * ember/stations.js — Phase 2 placeholder hosts (replaced in Phases 3 & 4).
 */

import * as THREE from 'three';
import { BENCH_BAY, buildBayBench, ctxMats } from '../bench-bay.js';
import { HOST_PLAN } from './host-plan.js';

export const BENCH_Z = BENCH_BAY.benchZ;

export function buildErBench(ctx, { kind = 'cup', plate = 'CAL-01', skin = 'shelf' } = {}) {
  const M = ctx.M;
  const mesh = (geo, mat, x = 0, y = 0, z = 0, rot = null) => {
    const m = new THREE.Mesh(ctx.own(geo), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
    return m;
  };
  return buildBayBench(ctx, {
    skin,
    plate,
    mats: ctxMats(ctx),
    tagStyle: { fg: '#1e1a14', bg: '#d8c9a2' },
    dormant(dormant, { height }) {
      const housing = mesh(new THREE.BoxGeometry(1.2, 0.62, 0.46), M.case, -0.35, height + 0.355, -0.2);
      housing.castShadow = housing.receiveShadow = ctx.t4;
      dormant.add(housing);
    }
  });
}

function placeholderHost(siteId) {
  return w => {
    const plan = HOST_PLAN[siteId];
    const g = new THREE.Group();
    g.name = plan.structure;
    const bench = buildErBench(w.ctx, plan);
    g.add(bench.group);

    // Overhead lamp over the plate.
    const lamp = new THREE.Mesh(w.own(new THREE.CylinderGeometry(0.08, 0.08, 0.24, 8)), w.M.lantern);
    lamp.position.set(0, 3.6, -0.3);
    g.add(lamp);
    const mark = new THREE.Object3D();
    mark.position.set(0, 3.5, -0.3);
    mark.userData.lamp = { color: 0xe6a443, intensity: 7, distance: 15, decay: 1.5 };
    g.add(mark);
    w.lamps.push(mark);

    // Placeholder machinery block behind the plate (z = -2.6, clear of bay).
    const blk = new THREE.Mesh(w.own(new THREE.BoxGeometry(4.0, 2.2, 1.0)), w.M.steel);
    blk.position.set(0, 1.1, -2.7);
    g.add(blk);

    return {
      group: g,
      bench,
      benchLocal: [0, 0, 0],
      colliders: [
        { lx: 0, lz: 0, hw: 2.5, hd: 0.7 },
        { lx: 0, lz: -2.7, hw: 2.0, hd: 0.5 }
      ],
      vents: []
    };
  };
}

export const HOST_BUILDERS = Object.fromEntries(
  ['site-1', 'site-2', 'site-3', 'site-4', 'site-5', 'site-6', 'site-7'].map(id => [id, placeholderHost(id)])
);
