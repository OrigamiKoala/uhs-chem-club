/**
 * kits/pans-puck.js — pieces that ARE particles. A substance to place in a ratio, or a change to lay on an ICE board, is drawn as the
 * particle itself: a sphere on a base in the colour of its substance, one sphere for each time it is counted (HI² is two spheres), with
 * its name under it. The hit area of the piece is the rectangle it always had, so the layout, the slots and the scripted solutions are
 * unchanged; only what the student picks up and puts down is a particle rather than a card. `3D Off` draws the same sphere flat.
 */

import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { say } from './matter-draw.js';

const INKS = ['#c0652b', '#6f8fb0', '#8a9a5b', '#b88a3a'];
export const inkOfIndex = i => INKS[((i % INKS.length) + INKS.length) % INKS.length];

/** A sphere of `ink` with a highlight, centred (cx, cy), radius r, on the flat plate. */
export function sphere2d(ctx, cx, cy, r, ink, lit = false) {
  ctx.fillStyle = '#100f0c';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.78, r * 0.95, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ink;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.arc(cx - r * 0.32, cy - r * 0.34, r * 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = lit ? PLATE_COLORS.amber : 'rgba(0,0,0,0.5)'; ctx.lineWidth = lit ? 2 : 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
}

/** `count` spheres in a row with the name under them. */
export function paintPuck(ctx, o, { hw, hh }, label, ink, count = 1) {
  const sc = o.sc;
  const r = Math.min(hh * 0.62, (hw * 2 - 1.4) / (count * 2.15)) * sc;
  const gap = r * 2.15;
  const x0 = o.x - ((count - 1) * gap) / 2;
  for (let i = 0; i < count; i++) sphere2d(ctx, x0 + i * gap, o.y - hh * sc * 0.22, r, ink, Boolean(o.lit));
  say(ctx, label, o.x, o.y + hh * sc * 0.72, Math.max(7, 2.6 * sc), { align: 'center', weight: 700, maxW: hw * 2 * sc - 1 });
}

/** The same spheres in space: a low base, then one sphere for each count. */
export function buildPuck(c, ink, count = 1, label = '') {
  const g = new THREE.Group();
  const r = Math.min(c.hw, c.hh) * 0.42;
  const mat = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.4, metalness: 0.15 });
  const base = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.7 });
  const gap = r * 2.1;
  for (let i = 0; i < count; i++) {
    const x = (i - (count - 1) / 2) * gap;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.15, r * 0.25, 20), c.own ? c.own(base) : base);
    disc.position.set(x, r * 0.125, 0);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), c.own ? c.own(mat) : mat);
    ball.position.set(x, r * 0.25 + r, 0);
    ball.castShadow = true;
    g.add(disc, ball);
  }
  if (label && c.label) {
    const name = c.label(label, c.hw * 2 * 0.9, c.hh * 2 * 0.3);
    name.position.set(0, 0.0006, c.hh * 0.8);
    g.add(name);
  }
  g.userData.height = r * 2.25;
  return g;
}
