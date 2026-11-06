/**
 * kits/cell-cans.js — a prepared cell as a piece: a battery-shaped can with its letter. It is what is ranked on the rail in `q5-load` stage 7,
 * standing for the cell on the table beside it. Flat: a rounded can with a cap. At `3D On`: a short cylinder with a cap.
 */
import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { registerPiece } from './cell-registry.js';
import { put } from './cell-board.js';

const STEEL = PLATE_COLORS.steel;
const CAN = new WeakMap();
const canMaterial = mats => {
  if (!CAN.has(mats)) { const m = mats.labSteel.clone(); m.color = new THREE.Color(0x8c8376); CAN.set(mats, m); }
  return CAN.get(mats);
};

function paintCan(ctx, p, state, o) {
  const w = o.sc * 14; const h = o.sc * 7.6;
  ctx.fillStyle = '#8c8376'; ctx.fillRect(o.x - w / 2, o.y - h / 2, w, h);
  ctx.fillStyle = '#b8afa0'; ctx.fillRect(o.x + w / 2, o.y - h * 0.22, o.sc * 1.6, h * 0.44);
  ctx.strokeStyle = o.lit ? PLATE_COLORS.amber : STEEL; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(o.x - w / 2 + 0.5, o.y - h / 2 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  put(ctx, p.label, o.x, o.y, Math.max(8, Math.min(h * 0.55, w / (Math.max(2, p.label.length) * 0.7))), { color: '#16140f', weight: 700, maxW: w - 2 });
}

registerPiece('cellcan', {
  kind: { r: 9.2, rect: { hw: 7, hh: 3.8 }, nojoin: true },
  paint: paintCan,
  faceKey: p => `cellcan|${p.label}`,
  piece3d: (p, state, c) => {
    const g = new THREE.Group();
    const r = Math.min(c.hh, c.hw) * 0.95;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, c.hw * 2, 20), canMaterial(c.mats));
    body.rotation.z = Math.PI / 2; body.position.y = r; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.4, r * 0.4, c.hw * 0.25, 12), c.mats.labSteel);
    cap.rotation.z = Math.PI / 2; cap.position.set(c.hw + c.hw * 0.1, r, 0); g.add(cap);
    g.userData.height = r * 2;
    return g;
  },
  printed: p => p.label
});

/** A prepared cell's can, lettered. */
export const canPiece = (id, label, at) => ({ id, kind: 'cellcan', label, at, props: {}, caption: null });
