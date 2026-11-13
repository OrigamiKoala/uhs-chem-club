/**
 * kits/rate-collide.js — Slow-motion collision view (`collview`) for Quicklight (unit11):
 * energy threshold (`energy`), orientation (`orientation`), elementary step (`elementary`),
 * and solid surface catalysis (`surface` with `tapZones`).
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, shapesOff } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const A_COL = '#d89236';
const B_COL = '#6f8fb0';
const REACT_COL = '#8fb86e';
const CAT_SURF = '#6d7582';
const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

const playStartFlat = new WeakMap();
const playStart3d = new WeakMap();

export function collviewFixture(id, at, {
  title = 'Collision view',
  mode = 'energy', // 'energy' | 'orientation' | 'elementary' | 'surface'
  pairs = [],
  tapZones = null,
  w = 78,
  h = 42,
  runLabel = 'Play'
} = {}) {
  const dials = {};
  const hidden = [];
  if (pairs.length > 1) {
    dials.pair = {
      min: 1,
      max: pairs.length,
      step: 1,
      value: 1,
      label: 'Pair',
      labels: pairs.map(p => p.label)
    };
  }
  if (tapZones) {
    dials.zone = {
      min: 1,
      max: tapZones.length + 1,
      step: 1,
      value: tapZones.length + 1,
      label: 'Region',
      labels: [...tapZones.map(z => z.label), ' ']
    };
    hidden.push('zone');
  }
  return {
    id,
    kind: 'collview',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: false,
    runLabel,
    dials,
    props: {
      title,
      mode,
      pairs,
      tapZones,
      hidden,
      ran: false,
      runSeq: 0,
      playedPairs: []
    }
  };
}

function runCollview(state, fid) {
  const f = state.fixtures[fid];
  if (!f) return null;
  f.props.ran = true;
  f.props.runSeq = (f.props.runSeq || 0) + 1;
  const idx = Math.round(f.dials.pair?.value ?? 1) - 1;
  if (!f.props.playedPairs.includes(idx)) f.props.playedPairs.push(idx);
  return { msg: `${f.props.title} played.` };
}

function drawArrow(ctx, F, x1, y1, x2, y2, col) {
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = Math.max(1.5, F.len(0.28));
  ctx.beginPath();
  ctx.moveTo(F.x(x1), F.y(y1));
  ctx.lineTo(F.x(x2), F.y(y2));
  ctx.stroke();
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hs = 1.4;
  ctx.beginPath();
  ctx.moveTo(F.x(x2), F.y(y2));
  ctx.lineTo(F.x(x2 - hs * Math.cos(ang - 0.5)), F.y(y2 - hs * Math.sin(ang - 0.5)));
  ctx.lineTo(F.x(x2 - hs * Math.cos(ang + 0.5)), F.y(y2 - hs * Math.sin(ang + 0.5)));
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1;
}

function paintCollview(ctx0, f, state, b) {
  const ctx = b.bodies ? shapesOff(ctx0) : ctx0;
  const F = frameOf(b);
  const p = f.props;
  const hasDials = Object.keys(f.dials || {}).filter(d => !(p.hidden || []).includes(d)).length > 0;
  const topY = hasDials ? 10.5 : 5.0;

  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.1, 5.4), { color: TEXT, weight: 700, maxW: F.len(f.size.w - 4) });

  const bx = 3;
  const by = topY;
  const bw = f.size.w - 6;
  const bh = f.size.h - topY - 4;

  ctx.fillStyle = '#0e1116';
  ctx.fillRect(F.x(bx), F.y(by), F.len(bw), F.len(bh));
  ctx.strokeStyle = DUST;
  ctx.strokeRect(F.x(bx), F.y(by), F.len(bw), F.len(bh));

  let prog = 0;
  if (p.ran) {
    const key = `${f.id}:${p.runSeq}`;
    const playStart = b.scope === '3d' ? playStart3d : playStartFlat;
    if (!playStart.has(f)) playStart.set(f, { key, t0: b.clock });
    const rec = playStart.get(f);
    if (rec.key !== key) { rec.key = key; rec.t0 = b.clock; }
    const elapsed = Math.max(0, b.clock - rec.t0);
    prog = b.clock === 0 ? 1 : Math.min(1, elapsed / 1.3);
  }

  if (p.mode === 'energy') {
    const idx = Math.max(0, Math.min(p.pairs.length - 1, Math.round(f.dials.pair?.value ?? 1) - 1));
    const pair = p.pairs[idx] || { label: 'Pair', fast: true, reacts: true, locked: false };
    const midX = bx + bw / 2;
    const midY = by + bh / 2;
    const speedLen = pair.fast ? 11 : 4;
    const canPlay = !pair.locked || p.ran;
    const animProg = pair.locked ? 0 : prog;

    let lx, rx;
    let reacted = false;
    if (!p.ran || pair.locked || animProg === 0) {
      lx = midX - 16;
      rx = midX + 16;
    } else if (animProg < 0.5) {
      const k = animProg * 2;
      lx = midX - 16 + k * 13.5;
      rx = midX + 16 - k * 13.5;
    } else {
      const k = (animProg - 0.5) * 2;
      if (pair.reacts) {
        reacted = true;
        lx = midX - 2.5;
        rx = midX + 2.5;
      } else {
        lx = midX - 2.5 - k * 11;
        rx = midX + 2.5 + k * 11;
      }
    }

    // Speed arrows before collision
    if (animProg < 0.5) {
      drawArrow(ctx, F, lx + 2.5, midY, lx + 2.5 + speedLen, midY, AMBER);
      drawArrow(ctx, F, rx - 2.5, midY, rx - 2.5 - speedLen, midY, AMBER);
    }

    ctx.fillStyle = reacted ? REACT_COL : A_COL;
    ctx.beginPath();
    ctx.arc(F.x(lx), F.y(midY), Math.max(4, F.len(2.4)), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = reacted ? REACT_COL : B_COL;
    ctx.beginPath();
    ctx.arc(F.x(rx), F.y(midY), Math.max(4, F.len(2.4)), 0, Math.PI * 2);
    ctx.fill();

    const status = pair.locked
      ? 'Sort before testing'
      : !canPlay || !p.ran
        ? 'Press "Play"'
        : animProg < 0.5
          ? 'Approaching...'
          : pair.reacts
            ? 'Reacted'
            : 'Bounced apart';
    say(ctx, `${pair.label} · ${status}`, F.x(midX), F.y(by + bh - 2.2), F.size(1.8, 4.6), { align: 'center', color: reacted ? REACT_COL : DIM });
  } else if (p.mode === 'orientation') {
    const rows = [
      { label: 'Pair A', y: by + bh * 0.30, aligned: true },
      { label: 'Pair B', y: by + bh * 0.72, aligned: false }
    ];
    rows.forEach(row => {
      const midX = bx + bw / 2;
      let lx = midX - 15, rx = midX + 15, reacted = false;
      if (p.ran) {
        if (prog < 0.5) {
          const k = prog * 2;
          lx = midX - 15 + k * 12.2;
          rx = midX + 15 - k * 12.2;
        } else {
          const k = (prog - 0.5) * 2;
          if (row.aligned) {
            reacted = true;
            lx = midX - 2.8;
            rx = midX + 2.8;
          } else {
            lx = midX - 2.8 - k * 10;
            rx = midX + 2.8 + k * 10;
          }
        }
      }
      if (!p.ran || prog < 0.5) {
        drawArrow(ctx, F, lx + 3, row.y, lx + 11, row.y, AMBER);
        drawArrow(ctx, F, rx - 3, row.y, rx - 11, row.y, AMBER);
      }
      // Left molecule (tinted reactive tip on right)
      ctx.fillStyle = B_COL;
      ctx.beginPath(); ctx.arc(F.x(lx - 1.8), F.y(row.y), Math.max(3, F.len(1.8)), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = reacted ? REACT_COL : AMBER;
      ctx.beginPath(); ctx.arc(F.x(lx + 1.4), F.y(row.y), Math.max(3, F.len(1.8)), 0, Math.PI * 2); ctx.fill();

      // Right molecule (tinted reactive tip on left if aligned, right if misaligned)
      const tipX = row.aligned ? rx - 1.4 : rx + 1.8;
      const backX = row.aligned ? rx + 1.8 : rx - 1.4;
      ctx.fillStyle = B_COL;
      ctx.beginPath(); ctx.arc(F.x(backX), F.y(row.y), Math.max(3, F.len(1.8)), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = reacted ? REACT_COL : AMBER;
      ctx.beginPath(); ctx.arc(F.x(tipX), F.y(row.y), Math.max(3, F.len(1.8)), 0, Math.PI * 2); ctx.fill();

      const msg = !p.ran ? row.label : prog < 0.5 ? `${row.label}` : row.aligned ? `${row.label}: Reacted` : `${row.label}: Bounced`;
      say(ctx, msg, F.x(bx + 2), F.y(row.y + 1), F.size(1.7, 4.4), { color: reacted ? REACT_COL : DIM });
    });
  } else if (p.mode === 'elementary') {
    const midX = bx + bw / 2;
    const midY = by + bh / 2;
    let lx = midX - 16, rx = midX + 16, reacted = false;
    if (p.ran) {
      if (prog < 0.5) {
        const k = prog * 2;
        lx = midX - 16 + k * 13.5;
        rx = midX + 16 - k * 13.5;
      } else {
        reacted = true;
        lx = midX - 2.5;
        rx = midX + 2.5;
      }
    }
    ctx.fillStyle = reacted ? REACT_COL : A_COL;
    ctx.beginPath(); ctx.arc(F.x(lx), F.y(midY), Math.max(4, F.len(2.5)), 0, Math.PI * 2); ctx.fill();
    say(ctx, 'NO₂', F.x(lx), F.y(midY - 4), F.size(1.7, 4.4), { align: 'center', color: TEXT });

    ctx.fillStyle = reacted ? REACT_COL : B_COL;
    ctx.beginPath(); ctx.arc(F.x(rx), F.y(midY), Math.max(4, F.len(2.5)), 0, Math.PI * 2); ctx.fill();
    say(ctx, 'F₂', F.x(rx), F.y(midY - 4), F.size(1.7, 4.4), { align: 'center', color: TEXT });

    say(ctx, reacted ? 'NO₂F + F formed' : '1 NO₂ + 1 F₂', F.x(midX), F.y(by + bh - 2.2), F.size(1.8, 4.6), { align: 'center', color: reacted ? REACT_COL : DIM });
  } else if (p.mode === 'surface') {
    // 3 horizontal bands: Gas space above, Metal surface, Deep inside metal
    const ySurf = by + bh * 0.45;
    const yDeep = by + bh * 0.70;
    ctx.fillStyle = CAT_SURF;
    ctx.fillRect(F.x(bx), F.y(ySurf), F.len(bw), F.len(bh - (ySurf - by)));

    if (p.tapZones) {
      const chosen = Math.round(f.dials.zone?.value ?? 0);
      p.tapZones.forEach((z, idx) => {
        const zy0 = by + z.y0 * bh;
        const zy1 = by + z.y1 * bh;
        const isChosen = chosen === idx + 1;
        ctx.fillStyle = isChosen ? 'rgba(229,155,36,0.25)' : 'rgba(255,255,255,0.03)';
        ctx.fillRect(F.x(bx), F.y(zy0), F.len(bw), F.len(zy1 - zy0));
        ctx.strokeStyle = isChosen ? AMBER : DUST;
        ctx.strokeRect(F.x(bx), F.y(zy0), F.len(bw), F.len(zy1 - zy0));
        say(ctx, z.label, F.x(bx + 2), F.y(zy0 + 3), F.size(1.6, 4.2), { color: isChosen ? AMBER : TEXT });
      });
    }

    // Gas molecules landing on surface, stretching, leaving
    const t = p.ran ? prog : 0;
    const mx = bx + bw * 0.55;
    const my = t < 0.35 ? by + 4 + (t / 0.35) * (ySurf - by - 5.5) : t < 0.75 ? ySurf - 1.5 : ySurf - 1.5 - ((t - 0.75) / 0.25) * (ySurf - by - 5.5);
    const stretch = t >= 0.35 && t < 0.75 ? 2.6 : 1.4;
    ctx.fillStyle = t >= 0.75 ? REACT_COL : A_COL;
    ctx.beginPath(); ctx.arc(F.x(mx - stretch), F.y(my), Math.max(3, F.len(1.5)), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = t >= 0.75 ? REACT_COL : B_COL;
    ctx.beginPath(); ctx.arc(F.x(mx + stretch), F.y(my), Math.max(3, F.len(1.5)), 0, Math.PI * 2); ctx.fill();
    // Metal atom lattice dots
    for (let i = 0; i < 8; i++) {
      const ax = bx + 6 + i * ((bw - 12) / 7);
      ctx.fillStyle = '#9aa3b0';
      ctx.beginPath(); ctx.arc(F.x(ax), F.y(ySurf + 2.2), Math.max(2.5, F.len(1.1)), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(F.x(ax), F.y(yDeep + 3.0), Math.max(2.5, F.len(1.1)), 0, Math.PI * 2); ctx.fill();
    }
  }
}

function collviewTapZones(f) {
  const p = f.props;
  if (!p.tapZones) return [];
  const hasDials = Object.keys(f.dials || {}).filter(d => !(p.hidden || []).includes(d)).length > 0;
  const by = hasDials ? 10.5 : 5.0;
  const bh = f.size.h - by - 4;
  return p.tapZones.map((z, idx) => ({
    x0: 3,
    x1: f.size.w - 3,
    y0: by + z.y0 * bh,
    y1: by + z.y1 * bh,
    dial: 'zone',
    value: idx + 1
  }));
}

registerFixture('collview', {
  paint: paintCollview,
  run: runCollview,
  tapZones: collviewTapZones,
  live: f => Boolean(f.props.ran)
});
