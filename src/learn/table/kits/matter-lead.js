/**
 * kits/matter-lead.js — the clips that play before a Mirrowen prediction (no controls, three to ten seconds, looped).
 *
 * A clip shows a NEIGHBOURING case, never the one being predicted, so the student has a picture to guess from and the clip cannot give the
 * answer away. The heat kit's own clips (`heater`, `salt`) are used where they fit; these are the ones this world needs:
 *
 *   pull    two krypton atoms held together, pulled apart and let go: separating them takes energy
 *   sealed  ether in a sealed flask as it warms: more molecules leave the liquid and fly about above it
 *   sieve   sand in water poured through a mesh: the water goes through, the sand stays
 *
 * The painter is a pure function of the clock, drawn on the flat bench and read by the recording context for the 3D crowd.
 */

import { registerFixture } from './matter-registry.js';
import { PLATE_COLORS } from '../../engine/plates.js';
import { say, frameOf } from './matter-draw.js';
import { gasAt, slideAt, shakeAt, h01, tri } from './matter-motion.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const AMBER = PLATE_COLORS.amber;
const ease = k => { const c = Math.max(0, Math.min(1, k)); return c * c * (3 - 2 * c); };

/** A clip with no controls. `scene` is 'pull', 'sealed' or 'sieve'. */
export function mleadFixture(id, at, { scene, w = 62, h = 30, title = 'Watch first' } = {}) {
  return { id, kind: 'mlead', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { scene } };
}

const dot = (ctx, F, x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.3, F.len(r)), 0, Math.PI * 2); ctx.fill(); };

function paintLeadClip(ctx, f, state, b) {
  const F = frameOf(b);
  const t = b.clock || 0;
  const w = f.size.w; const h = f.size.h; const top = 6;
  const box = (x, y, bw, bh) => { ctx.strokeStyle = DIM; ctx.lineWidth = 1; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(bw)), Math.round(F.len(bh))); };
  const scene = f.props.scene;
  if (scene === 'pull') {
    const T = 9; const u = t % T;
    const apart = ease((u - 2) / 2.2) * (1 - ease((u - 6) / 1.6));
    const cx = w / 2; const cy = top + (h - top) / 2;
    const gap = 2.6 + apart * 14;
    const [ax, ay] = shakeAt(1, t, 0.25 * (1 - apart * 0.6));
    const [bx, by] = shakeAt(2, t, 0.25 * (1 - apart * 0.6));
    box(3, top, w - 6, h - top - 3);
    ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1, F.len(0.5 * (1 - apart * 0.7)));
    ctx.beginPath(); ctx.moveTo(F.x(cx - gap + ax), F.y(cy + ay)); ctx.lineTo(F.x(cx + gap + bx), F.y(cy + by)); ctx.stroke(); ctx.lineWidth = 1;
    if (!b.bodies) { dot(ctx, F, cx - gap + ax, cy + ay, 2.6, '#7a98b8'); dot(ctx, F, cx + gap + bx, cy + by, 2.6, '#7a98b8'); }
    return;
  }
  if (scene === 'sealed') {
    const T = 10; const u = t % T;
    const warm = ease(u / 8);
    const fx = 12; const fw = w - 24; const levelY = top + (h - top) * 0.62;
    box(fx, top, fw, h - top - 3);
    ctx.fillStyle = 'rgba(111,143,176,0.28)'; ctx.fillRect(F.x(fx) + 1, F.y(levelY), F.len(fw) - 1, F.len(h - 3 - levelY));
    if (!b.bodies) {
      for (let i = 0; i < 14; i++) {
        const [dx, dy] = slideAt(i, t, 0.6 + warm * 0.5, 0.8 + warm);
        dot(ctx, F, fx + 3 + (i % 7) * ((fw - 6) / 6) + dx, levelY + 3 + Math.floor(i / 7) * 3.2 + dy, 0.8, '#cfe2f1');
      }
      const n = Math.round(2 + warm * 14);
      for (let i = 0; i < n; i++) {
        const [pu, pv] = gasAt(i, t, 1 + warm * 1.4);
        dot(ctx, F, fx + 2 + pu * (fw - 4), top + 2 + pv * (levelY - top - 4), 0.8, DUST);
      }
    }
    return;
  }
  if (scene === 'sieve') {
    const meshY = top + (h - top) * 0.55;
    box(8, top, w - 16, h - top - 3);
    ctx.strokeStyle = DUST; ctx.setLineDash([2, 1.5]);
    ctx.beginPath(); ctx.moveTo(F.x(8), F.y(meshY)); ctx.lineTo(F.x(w - 8), F.y(meshY)); ctx.stroke(); ctx.setLineDash([]);
    if (!b.bodies) {
      for (let i = 0; i < 16; i++) {
        // Water molecules fall through the mesh and keep falling to the cup below.
        const k = (t * (0.12 + 0.08 * h01(i, 1)) + h01(i, 2)) % 1;
        dot(ctx, F, 10 + (w - 20) * h01(i, 3), top + 1.5 + k * (h - top - 5), 0.8, '#7fb2d9');
      }
      for (let i = 0; i < 6; i++) {
        // Sand grains fall onto the mesh and lie there.
        const k = Math.min(1, (t * 0.14 + h01(i, 4)) % 1.6);
        const y = Math.min(meshY - 1.2, top + 1.5 + k * (meshY - top));
        dot(ctx, F, 14 + (w - 28) * (i / 5) + Math.sin(i * 3) * 1.2, y, 1.4, '#a6896a');
      }
    }
    return;
  }
  say(ctx, '', 0, 0, 6);
  void tri;
}

registerFixture('mlead', { paint: paintLeadClip });
