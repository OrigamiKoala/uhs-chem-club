/**
 * kits/rate-collide.js — Slow-motion collision view (`collview`) for Quicklight (unit11):
 * energy threshold (`energy`), orientation (`orientation`), elementary step (`elementary`),
 * and solid surface catalysis (`surface` with `tapZones`).
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture, shapesOff } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const A_COL = '#f0a030';
const B_COL = '#5cc8f0';
const REACT_COL = '#88e060';
const CAT_SURF = '#596370';
const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

const playStartFlat = new Map();
const playStart3d = new Map();

export function collviewFixture(id, at, {
  title = 'Collision view',
  mode = 'energy', // 'energy' | 'orientation' | 'elementary' | 'surface'
  pairs = [],
  tapZones = null,
  w = 78,
  h = 44,
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
      top: 8.2,
      tickLabels: true,
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

function collGeom(f) {
  const p = f.props;
  const hasDials = Object.keys(f.dials || {}).filter(d => !(p.hidden || []).includes(d)).length > 0;
  const topY = hasDials ? 15.0 : 5.4;
  const bx = 3;
  const by = topY;
  const bw = f.size.w - 6;
  const bh = Math.max(12, f.size.h - topY - 8.6);
  return { bx, by, bw, bh };
}

function paintCollview(ctx0, f, state, b) {
  const ctx = b.bodies ? shapesOff(ctx0) : ctx0;
  const F = frameOf(b);
  const p = f.props;
  const { bx, by, bw, bh } = collGeom(f);

  say(ctx, p.title, F.x(2), F.y(2.6), F.size(2.2, 5.6), { color: TEXT, weight: 700, maxW: F.len(f.size.w - 4) });

  ctx.fillStyle = '#11161e';
  ctx.fillRect(F.x(bx), F.y(by), F.len(bw), F.len(bh));
  ctx.strokeStyle = '#7e8c9e';
  ctx.strokeRect(F.x(bx), F.y(by), F.len(bw), F.len(bh));

  let prog = 0;
  const playStart = b.scope === '3d' ? playStart3d : playStartFlat;
  const dur = p.mode === 'surface' ? 2.4 : 1.8;
  if (p.ran) {
    const key = `${f.id}:${p.runSeq}`;
    let rec = playStart.get(f.id);
    if (!rec || rec.key !== key || b.clock < rec.t0) {
      rec = { key, t0: b.clock };
      playStart.set(f.id, rec);
    }
    const elapsed = Math.max(0, b.clock - rec.t0);
    prog = b.clock === 0 ? 1 : Math.min(1, elapsed / dur);
  } else {
    playStart.delete(f.id);
  }

  if (p.mode === 'energy') {
    const idx = Math.max(0, Math.min(p.pairs.length - 1, Math.round(f.dials.pair?.value ?? 1) - 1));
    const pair = p.pairs[idx] || { label: 'Pair', speed: 1, reacts: true, locked: false };
    const isFast = pair.fast ?? (pair.speed >= 0.8);
    const trackW = bw - 14;
    const midX = bx + trackW / 2;
    const midY = by + bh * 0.48;
    const speedLen = isFast ? 11 : 4.5;
    const animProg = pair.locked ? 0 : prog;

    let lx, rx;
    let reacted = false;
    if (!p.ran || pair.locked || animProg === 0) {
      lx = midX - 15;
      rx = midX + 15;
    } else if (animProg < 0.5) {
      const k = animProg * 2;
      lx = midX - 15 + k * 12.2;
      rx = midX + 15 - k * 12.2;
    } else {
      const k = (animProg - 0.5) * 2;
      if (pair.reacts) {
        reacted = true;
        lx = midX - 2.6;
        rx = midX + 2.6;
      } else {
        lx = midX - 2.6 - k * 11.5;
        rx = midX + 2.6 + k * 11.5;
      }
    }

    // Speed arrows before collision (or bounce arrows after)
    if (!p.ran || animProg < 0.5) {
      drawArrow(ctx, F, lx + 3.0, midY, lx + 3.0 + speedLen, midY, AMBER);
      drawArrow(ctx, F, rx - 3.0, midY, rx - 3.0 - speedLen, midY, AMBER);
    } else if (!pair.reacts) {
      drawArrow(ctx, F, lx - 3.0, midY, lx - 7.0, midY, '#8a96a6');
      drawArrow(ctx, F, rx + 3.0, midY, rx + 7.0, midY, '#8a96a6');
    }

    ctx.fillStyle = reacted ? REACT_COL : A_COL;
    ctx.beginPath();
    ctx.arc(F.x(lx), F.y(midY), Math.max(4.5, F.len(2.6)), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = reacted ? REACT_COL : B_COL;
    ctx.beginPath();
    ctx.arc(F.x(rx), F.y(midY), Math.max(4.5, F.len(2.6)), 0, Math.PI * 2);
    ctx.fill();

    // Ea energy bar on the right side of the chamber
    const gx = bx + bw - 10;
    const gy = by + 3;
    const gh = bh - 7;
    ctx.fillStyle = '#1b222c';
    ctx.fillRect(F.x(gx), F.y(gy), F.len(5.5), F.len(gh));
    const fillH = gh * (isFast ? 0.85 : 0.35);
    ctx.fillStyle = isFast ? REACT_COL : A_COL;
    ctx.fillRect(F.x(gx), F.y(gy + gh - fillH), F.len(5.5), F.len(fillH));
    const eaY = gy + gh * 0.35;
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(F.x(gx - 1.5), F.y(eaY));
    ctx.lineTo(F.x(gx + 7.0), F.y(eaY));
    ctx.stroke();
    ctx.lineWidth = 1;
    say(ctx, 'Ea', F.x(gx + 2.8), F.y(eaY - 1.4), F.size(1.6, 4.4), { align: 'center', color: AMBER, weight: 700 });

    const status = pair.locked
      ? 'Sort before testing'
      : !p.ran
        ? 'Press "Play"'
        : animProg < 0.5
          ? 'Approaching...'
          : pair.reacts
            ? 'Above Ea · Reacted'
            : 'Below Ea · Bounced apart';
    say(ctx, `${pair.label} · ${status}`, F.x(midX), F.y(by + bh - 2.0), F.size(1.9, 5.0), { align: 'center', color: reacted ? REACT_COL : TEXT, weight: 700 });
  } else if (p.mode === 'orientation') {
    const idx = Math.max(0, Math.min(p.pairs.length - 1, Math.round(f.dials.pair?.value ?? 1) - 1));
    const pair = p.pairs[idx] || { label: 'Head-on', angle: 0, reacts: true };
    const aligned = Boolean(pair.reacts);
    const midX = bx + bw / 2;
    const midY = by + bh * 0.48;
    let lx = midX - 15, rx = midX + 15, reacted = false;
    if (p.ran) {
      if (prog < 0.5) {
        const k = prog * 2;
        lx = midX - 15 + k * 11.5;
        rx = midX + 15 - k * 11.5;
      } else {
        const k = (prog - 0.5) * 2;
        if (aligned) {
          reacted = true;
          lx = midX - 3.2;
          rx = midX + 3.2;
        } else {
          lx = midX - 3.2 - k * 11;
          rx = midX + 3.2 + k * 11;
        }
      }
    }
    if (!p.ran || prog < 0.5) {
      drawArrow(ctx, F, lx + 4.5, midY, lx + 12.5, midY, AMBER);
      drawArrow(ctx, F, rx - 4.5, midY, rx - 12.5, midY, AMBER);
    }

    // Left molecule: blue body + bright ringed amber reactive end on the right
    ctx.fillStyle = B_COL;
    ctx.beginPath(); ctx.arc(F.x(lx - 2.2), F.y(midY), Math.max(3.6, F.len(2.2)), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = reacted ? REACT_COL : AMBER;
    ctx.beginPath(); ctx.arc(F.x(lx + 1.8), F.y(midY), Math.max(3.6, F.len(2.2)), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(F.x(lx + 1.8), F.y(midY), Math.max(4.6, F.len(2.8)), 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;

    // Right molecule: if aligned, reactive end faces left; if sideways/misaligned, reactive end faces away/up
    const tipX = aligned ? rx - 1.8 : rx + 2.2;
    const tipY = aligned ? midY : midY - 2.4;
    const backX = aligned ? rx + 2.2 : rx - 1.8;
    ctx.fillStyle = B_COL;
    ctx.beginPath(); ctx.arc(F.x(backX), F.y(midY), Math.max(3.6, F.len(2.2)), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = reacted ? REACT_COL : AMBER;
    ctx.beginPath(); ctx.arc(F.x(tipX), F.y(tipY), Math.max(3.6, F.len(2.2)), 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(F.x(tipX), F.y(tipY), Math.max(4.6, F.len(2.8)), 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;

    say(ctx, 'Ring = reactive end', F.x(bx + 2), F.y(by + 2.4), F.size(1.6, 4.4), { color: '#ffe066' });
    const msg = !p.ran ? `${pair.label} · Press "Play"` : prog < 0.5 ? `${pair.label} · Approaching...` : aligned ? `${pair.label} · Reactive ends met — Reacted` : `${pair.label} · Reactive ends missed — Bounced`;
    say(ctx, msg, F.x(midX), F.y(by + bh - 2.0), F.size(1.85, 4.8), { align: 'center', color: reacted ? REACT_COL : TEXT, weight: 700 });
  } else if (p.mode === 'elementary') {
    const pair = p.pairs[0] || {};
    const aLbl = pair.aLabel || 'A';
    const bLbl = pair.bLabel || 'A';
    const prodLbl = pair.prodLabel || 'B formed';
    const preLbl = pair.preLabel || `1 ${aLbl} + 1 ${bLbl}`;
    const midX = bx + bw / 2;
    const midY = by + bh * 0.5;
    let lx = midX - 15, rx = midX + 15, reacted = false;
    if (p.ran) {
      if (prog < 0.5) {
        const k = prog * 2;
        lx = midX - 15 + k * 12.2;
        rx = midX + 15 - k * 12.2;
      } else {
        reacted = true;
        lx = midX - 2.6;
        rx = midX + 2.6;
      }
    }
    if (!p.ran || prog < 0.5) {
      drawArrow(ctx, F, lx + 3.2, midY, lx + 10.5, midY, AMBER);
      drawArrow(ctx, F, rx - 3.2, midY, rx - 10.5, midY, AMBER);
    }
    ctx.fillStyle = reacted ? REACT_COL : A_COL;
    ctx.beginPath(); ctx.arc(F.x(lx), F.y(midY), Math.max(4.5, F.len(2.6)), 0, Math.PI * 2); ctx.fill();
    say(ctx, aLbl, F.x(lx), F.y(midY - 4.2), F.size(1.9, 5.0), { align: 'center', color: TEXT, weight: 700 });

    ctx.fillStyle = reacted ? REACT_COL : (aLbl === bLbl ? A_COL : B_COL);
    ctx.beginPath(); ctx.arc(F.x(rx), F.y(midY), Math.max(4.5, F.len(2.6)), 0, Math.PI * 2); ctx.fill();
    say(ctx, bLbl, F.x(rx), F.y(midY - 4.2), F.size(1.9, 5.0), { align: 'center', color: TEXT, weight: 700 });

    say(ctx, reacted ? prodLbl : preLbl, F.x(midX), F.y(by + bh - 2.0), F.size(1.9, 5.0), { align: 'center', color: reacted ? REACT_COL : TEXT, weight: 700 });
  } else if (p.mode === 'surface') {
    const ySurf = by + bh * 0.44;
    ctx.fillStyle = CAT_SURF;
    ctx.fillRect(F.x(bx), F.y(ySurf), F.len(bw), F.len(bh - (ySurf - by)));

    if (p.tapZones) {
      const chosen = Math.round(f.dials.zone?.value ?? 0);
      p.tapZones.forEach((z, idx) => {
        const zy0 = by + z.y0 * bh;
        const zy1 = by + z.y1 * bh;
        const isChosen = chosen === idx + 1;
        ctx.fillStyle = isChosen ? 'rgba(229,155,36,0.28)' : 'rgba(255,255,255,0.03)';
        ctx.fillRect(F.x(bx), F.y(zy0), F.len(bw), F.len(zy1 - zy0));
        ctx.strokeStyle = isChosen ? AMBER : '#7e8c9e';
        ctx.lineWidth = isChosen ? 2 : 1;
        ctx.strokeRect(F.x(bx), F.y(zy0), F.len(bw), F.len(zy1 - zy0));
        ctx.lineWidth = 1;
        say(ctx, z.label, F.x(bx + 2.5), F.y(zy0 + 3.2), F.size(1.95, 5.0), { color: isChosen ? AMBER : TEXT, weight: 700 });
      });
    }

    // 3-row metal atom lattice
    const rowYs = [ySurf + 2.4, ySurf + (bh - (ySurf - by)) * 0.48, ySurf + (bh - (ySurf - by)) * 0.80];
    rowYs.forEach((ry, rIdx) => {
      for (let i = 0; i < 9; i++) {
        const ax = bx + 6 + (rIdx % 2 ? 2.5 : 0) + i * ((bw - 14) / 8);
        ctx.fillStyle = rIdx === 0 ? '#c4ceda' : '#8c96a4';
        ctx.beginPath(); ctx.arc(F.x(ax), F.y(ry), Math.max(2.6, F.len(1.15)), 0, Math.PI * 2); ctx.fill();
      }
    });

    // Gas molecule landing on surface, stretching its bond, splitting into product atoms leaving
    const t = p.ran ? prog : 0;
    const mx = bx + bw * 0.58;
    const landY = ySurf - 2.0;
    const startY = by + 4.2;
    let my = startY;
    let stretch = 1.6;
    let stateMsg = p.ran ? 'Landing...' : 'Press "Play"';
    if (t > 0 && t < 0.30) {
      my = startY + (t / 0.30) * (landY - startY);
    } else if (t >= 0.30 && t < 0.72) {
      my = landY;
      const k = (t - 0.30) / 0.42;
      stretch = 1.6 + k * 3.4;
      stateMsg = 'Bond stretches on surface';
    } else if (t >= 0.72) {
      const k = (t - 0.72) / 0.28;
      my = landY - k * (landY - startY);
      stretch = 5.0 + k * 2.5;
      stateMsg = 'Products leave';
    }
    // Bond rod (solid before stretch, dashed while stretching, gone after split)
    if (t < 0.72) {
      ctx.strokeStyle = t >= 0.30 ? AMBER : TEXT;
      ctx.lineWidth = Math.max(2.0, F.len(0.35));
      if (t >= 0.30) ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(F.x(mx - stretch), F.y(my));
      ctx.lineTo(F.x(mx + stretch), F.y(my));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = t >= 0.72 ? REACT_COL : A_COL;
    ctx.beginPath(); ctx.arc(F.x(mx - stretch), F.y(my), Math.max(3.5, F.len(1.7)), 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = t >= 0.72 ? REACT_COL : B_COL;
    ctx.beginPath(); ctx.arc(F.x(mx + stretch), F.y(my), Math.max(3.5, F.len(1.7)), 0, Math.PI * 2); ctx.fill();

    say(ctx, stateMsg, F.x(bx + bw - 2), F.y(by + 3.2), F.size(1.75, 4.6), { align: 'right', color: t >= 0.30 ? AMBER : DIM, weight: 700 });
  }
}

function collviewTapZones(f) {
  const p = f.props;
  if (!p.tapZones) return [];
  const { bx, by, bw, bh } = collGeom(f);
  return p.tapZones.map((z, idx) => ({
    x0: bx,
    x1: bx + bw,
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
