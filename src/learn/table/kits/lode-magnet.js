/**
 * kits/lode-magnet.js — Lodestone's magnetic balance (`magnet`) for q6-spin and boss-coil.
 *
 *   magnet  two pole pieces, a hanging sample tube, and a pull bar. "Switch On" measures the pull on the seated vial (proportional to
 *           n(n + 2), never printing the unpaired count) and stamps `vial.props.pull` so the vial keeps its reading.
 */

import { COMPLEXES, pull as spinPull } from '../../engine/lodedata.js';
import { registerFixture } from './lode-registry.js';
import { C, frameOf, say, title, glide } from './lode-draw.js';

const seated = (state, slotId) => (slotId ? Object.values(state.pieces).find(p => p.zone === `slot:${slotId}`) || null : null);

function gateOpen(state, gate) {
  if (!gate) return true;
  if (gate.kind === 'slot') return Boolean(seated(state, gate.id));
  if (gate.kind === 'rail') {
    const order = state.zones?.rail?.order || [];
    if (order.length < 2) return false;
    return order.some((id, i) => id !== gate.initial[i]);
  }
  return true;
}

/**
 * `gate` (optional): `{ kind: 'rail', id, initial, msg }` or `{ kind: 'slot', id, msg }` keeps Switch On locked until committed.
 */
export function magnetFixture(id, at, { w = 74, h = 44, gate = null, title: ttl = 'Magnet balance' } = {}) {
  const slotId = `${id}.holder`;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  return {
    fixture: {
      id, kind: 'magnet', label: ttl, at: { ...at }, size: { w, h }, dials: {}, runLabel: 'Switch On',
      props: { slot: slotId, gate, last: null }
    },
    slot: { id: slotId, label: 'Sample', at: { x: x0 - 9, y: y0 + h / 2 }, size: { w: 13, h: 18 } }
  };
}

/** What the balance holds: the seated vial, its complex id, its stamped pull, and the last Switch On reading. */
export function magnetRead(state, id) {
  const f = state.fixtures[id];
  const v = seated(state, f.props.slot);
  return { vial: v, cx: v ? v.props.cx : null, pull: v ? (v.props.pull ?? null) : null, last: f.props.last };
}

function paintMagnet(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = magnetRead(state, f.id);
  const open = gateOpen(state, p.gate);
  title(ctx, f, F, b);

  const cx = f.size.w * 0.42; const cy = f.size.h * 0.56;
  // Two pole pieces framing the hanging tube.
  const poleW = 9; const poleH = 12; const poleGap = 15;
  ctx.fillStyle = '#534f49'; ctx.strokeStyle = C.steel; ctx.lineWidth = 1.4;
  ctx.fillRect(F.x(cx - poleGap / 2 - poleW), F.y(cy - poleH / 2), F.len(poleW), F.len(poleH));
  ctx.strokeRect(F.x(cx - poleGap / 2 - poleW), F.y(cy - poleH / 2), F.len(poleW), F.len(poleH));
  ctx.fillRect(F.x(cx + poleGap / 2), F.y(cy - poleH / 2), F.len(poleW), F.len(poleH));
  ctx.strokeRect(F.x(cx + poleGap / 2), F.y(cy - poleH / 2), F.len(poleW), F.len(poleH));
  ctx.lineWidth = 1;
  say(ctx, 'N', F.x(cx - poleGap / 2 - poleW / 2), F.y(cy), F.size(1.9, 6.2), { align: 'center', color: C.text, weight: 700 });
  say(ctx, 'S', F.x(cx + poleGap / 2 + poleW / 2), F.y(cy), F.size(1.9, 6.2), { align: 'center', color: C.text, weight: 700 });

  // Balance beam and hanging sample tube.
  const measured = r.vial && r.pull != null;
  const frac = measured ? Math.min(1, r.pull / 35) : 0;
  const shownFrac = glide(`${f.id}:pull`, b, frac, frac, 0.85);
  const drop = shownFrac * 5.2;
  const pivotX = cx; const pivotY = 11.5;
  ctx.strokeStyle = C.dust; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(F.x(pivotX - 10), F.y(pivotY)); ctx.lineTo(F.x(pivotX + 10), F.y(pivotY)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(F.x(pivotX), F.y(pivotY)); ctx.lineTo(F.x(pivotX), F.y(cy - 6 + drop)); ctx.stroke();
  ctx.lineWidth = 1;

  if (r.vial) {
    const c = COMPLEXES[r.cx];
    const tint = r.vial.props.sealedTint ? '#7a7466' : c.tint;
    const tw = 4.2; const th = 11; const ty = cy - 6 + drop;
    ctx.fillStyle = tint; ctx.globalAlpha = 0.9;
    ctx.fillRect(F.x(cx - tw / 2), F.y(ty + th * 0.28), F.len(tw), F.len(th * 0.68));
    ctx.globalAlpha = 1;
    ctx.strokeStyle = measured && r.pull > 0 ? C.amber : '#cfd8de';
    ctx.lineWidth = measured && r.pull > 0 ? 2 : 1.3;
    ctx.strokeRect(F.x(cx - tw / 2), F.y(ty), F.len(tw), F.len(th));
    ctx.lineWidth = 1;
    say(ctx, r.vial.props.name || c.formula, F.x(cx), F.y(ty + th + 3.2), F.size(1.7, 6), { align: 'center', color: C.text, weight: 600, sans: true, maxW: F.len(26) });
  } else {
    say(ctx, 'Load a vial', F.x(cx), F.y(cy + 10), F.size(1.8, 6), { align: 'center', color: C.dim });
  }

  // Pull bar on the right.
  const bx = f.size.w - 16; const byTop = 12; const byBot = f.size.h - 10; const bh = byBot - byTop;
  ctx.strokeStyle = C.steel; ctx.strokeRect(F.x(bx), F.y(byTop), F.len(6), F.len(bh));
  if (measured) {
    const fillH = bh * shownFrac;
    ctx.fillStyle = r.pull > 0 ? C.amber : C.dim;
    ctx.fillRect(F.x(bx), F.y(byBot - fillH), F.len(6), F.len(fillH));
    say(ctx, `pull ${r.pull}`, F.x(bx + 3), F.y(byTop - 2), F.size(1.9, 6.2), { align: 'center', color: r.pull > 0 ? C.amber : C.text, weight: 700 });
  } else {
    say(ctx, 'Pull', F.x(bx + 3), F.y(byTop - 2), F.size(1.75, 6), { align: 'center', color: C.dust });
  }

  const foot = f.size.h - 3.4;
  if (!open) say(ctx, p.gate.msg || 'Complete the step first', F.x(2.2), F.y(foot), F.size(1.8, 6), { color: C.dim, maxW: F.len(f.size.w - 4) });
  else if (measured) say(ctx, r.pull > 0 ? 'Pulled toward the poles' : 'No pull', F.x(2.2), F.y(foot), F.size(1.9, 6.2), { color: r.pull > 0 ? C.amber : C.phosphor, weight: 600 });
  else if (r.vial) say(ctx, 'Press "Switch On"', F.x(2.2), F.y(foot), F.size(1.85, 6), { color: C.dim });
}

function runMagnet(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  if (!gateOpen(state, p.gate)) return { noop: p.gate.msg || 'Complete the step first.' };
  const v = seated(state, p.slot);
  if (!v) return { noop: 'There is no sample in the holder.' };
  const val = spinPull(COMPLEXES[v.props.cx].unpaired);
  v.props.pull = val;
  p.last = { id: v.id, pull: val };
  return { stamp: {} };
}

registerFixture('magnet', { paint: paintMagnet, run: runMagnet, live: () => true });
