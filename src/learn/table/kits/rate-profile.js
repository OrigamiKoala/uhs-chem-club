/**
 * kits/rate-profile.js — Reaction energy profile (`kprofile`) supporting 1-hump, 2-hump,
 * catalysed dashed path, draggable progress ball, and `tapZones` for Quicklight (unit11).
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;
const CURVE_COL = '#6f8fb0';
const CAT_COL = '#8fb86e';

export function kprofileFixture(id, at, {
  title = 'Energy profile',
  reactants = 40,
  ts = 110,
  products = 10,
  valley = null, // if non-null, 2-hump profile
  ts2 = null,
  catTs = null, // if non-null, dashed catalysed barrier height
  showLevels = true,
  noProgress = false,
  tapZones = null,
  w = 96,
  h = 44
} = {}) {
  const dials = {};
  const hidden = [];
  if (!noProgress) {
    dials.progress = {
      min: 0,
      max: 100,
      step: 5,
      value: 0,
      label: 'Progress',
      labels: ['Start', '', '', '', '', '', '', '', '', '', 'Peak', '', '', '', '', '', '', '', '', '', 'End']
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
    kind: 'kprofile',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: true,
    dials,
    props: {
      title,
      reactants,
      ts,
      products,
      valley,
      ts2,
      catTs,
      showLevels,
      noProgress,
      tapZones,
      hidden,
      top: 8.2
    }
  };
}

function evalProfile(p, u, useCat = false) {
  // u in [0, 1]
  const peak1 = useCat && p.catTs != null ? p.catTs : p.ts;
  if (p.valley == null || p.ts2 == null) {
    // 1-hump smooth curve through (0, R), (0.45, TS), (1, P)
    if (u <= 0.45) {
      const s = u / 0.45;
      const w = 0.5 - 0.5 * Math.cos(Math.PI * s);
      return p.reactants + (peak1 - p.reactants) * w;
    }
    const s = (u - 0.45) / 0.55;
    const w = 0.5 - 0.5 * Math.cos(Math.PI * s);
    return peak1 + (p.products - peak1) * w;
  }
  // 2-hump curve: (0, R) -> (0.28, TS1) -> (0.52, valley) -> (0.76, TS2) -> (1, P)
  const segs = [
    [0, p.reactants],
    [0.28, peak1],
    [0.52, p.valley],
    [0.76, p.ts2],
    [1.0, p.products]
  ];
  for (let i = 0; i < segs.length - 1; i++) {
    const [u0, e0] = segs[i];
    const [u1, e1] = segs[i + 1];
    if (u <= u1 || i === segs.length - 2) {
      const s = Math.max(0, Math.min(1, (u - u0) / (u1 - u0)));
      const w = 0.5 - 0.5 * Math.cos(Math.PI * s);
      return e0 + (e1 - e0) * w;
    }
  }
  return p.products;
}

function profileGeom(f) {
  const p = f.props;
  const gy = p.noProgress ? 7.2 : 14.8;
  const gx = 12;
  const gw = f.size.w - 16;
  const gh = Math.max(10, f.size.h - gy - 5.2);
  return { gx, gy, gw, gh };
}

function paintKprofile(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const { gx, gy, gw, gh } = profileGeom(f);
  say(ctx, p.title, F.x(2), F.y(2.6), F.size(2.2, 5.6), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.62) });

  const hasBall = !p.noProgress && Boolean(f.dials.progress);
  const uBall = (f.dials.progress?.value ?? 0) / 100;
  const eBall = evalProfile(p, uBall, false);
  if (hasBall) {
    say(ctx, `E = ${Math.round(eBall)} kJ/mol`, F.x(f.size.w - 2), F.y(2.6), F.size(2.1, 5.4), { align: 'right', color: AMBER, weight: 700 });
  }

  const allE = [p.reactants, p.ts, p.products, ...(p.valley != null ? [p.valley, p.ts2] : []), ...(p.catTs != null ? [p.catTs] : [])];
  const eMin = Math.max(0, Math.min(...allE) - 10);
  const eMax = Math.max(...allE) + 14;
  const toX = u => gx + u * gw;
  const toY = e => gy + gh - ((e - eMin) / (eMax - eMin)) * gh;

  ctx.fillStyle = '#141922';
  ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));

  ctx.strokeStyle = '#8a96a6';
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  say(ctx, `${Math.round(eMax)}`, F.x(gx - 1.0), F.y(gy + 1.4), F.size(1.55, 4.3), { align: 'right', color: DIM });
  say(ctx, `${Math.round(eMin)}`, F.x(gx - 1.0), F.y(gy + gh), F.size(1.55, 4.3), { align: 'right', color: DIM });
  say(ctx, 'kJ/mol', F.x(gx - 1.0), F.y(gy + gh * 0.5), F.size(1.5, 4.2), { align: 'right', color: DIM });

  if (p.tapZones) {
    const chosen = Math.round(f.dials.zone?.value ?? 0);
    p.tapZones.forEach((z, idx) => {
      const zx0 = gx + z.x0 * gw;
      const zx1 = gx + z.x1 * gw;
      const isChosen = chosen === idx + 1;
      ctx.fillStyle = isChosen ? 'rgba(229,155,36,0.22)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(F.x(zx0), F.y(gy), F.len(zx1 - zx0), F.len(gh));
      if (isChosen) {
        ctx.strokeStyle = AMBER;
        ctx.lineWidth = 2;
        ctx.strokeRect(F.x(zx0), F.y(gy), F.len(zx1 - zx0), F.len(gh));
        ctx.lineWidth = 1;
      }
      say(ctx, z.label, F.x((zx0 + zx1) / 2), F.y(gy + 2.4), F.size(1.85, 4.8), { align: 'center', color: isChosen ? AMBER : TEXT, weight: 700, maxW: F.len(zx1 - zx0 - 0.8) });
    });
  }

  // Horizontal dashed reference lines for labelled energy levels
  const drawLevel = (val, label, uAlign, color, dy = -1.2) => {
    const y = toY(val);
    ctx.strokeStyle = 'rgba(200,212,226,0.26)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(F.x(gx), F.y(y));
    ctx.lineTo(F.x(gx + gw), F.y(y));
    ctx.stroke();
    ctx.setLineDash([]);
    const align = uAlign <= 0.1 ? 'left' : uAlign >= 0.9 ? 'right' : 'center';
    say(ctx, label, F.x(toX(uAlign)), F.y(y + dy), F.size(1.9, 5.0), { align, color, weight: 700 });
  };

  if (p.showLevels) {
    drawLevel(p.reactants, `R: ${p.reactants}`, 0.02, TEXT, -1.3);
    drawLevel(p.products, `P: ${p.products}`, 0.98, TEXT, -1.3);
    if (p.valley == null) {
      drawLevel(p.ts, `TS: ${p.ts}`, 0.45, AMBER, -1.4);
    } else {
      drawLevel(p.ts, `TS1: ${p.ts}`, 0.28, AMBER, -1.4);
      drawLevel(p.valley, `I: ${p.valley}`, 0.52, '#88e060', 2.4);
      drawLevel(p.ts2, `TS2: ${p.ts2}`, 0.76, AMBER, -1.4);
    }
  }

  // Main energy curve
  ctx.strokeStyle = '#5cc8f0';
  ctx.lineWidth = Math.max(2.4, F.len(0.42));
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    const x = F.x(toX(u));
    const y = F.y(toY(evalProfile(p, u, false)));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.lineWidth = 1;

  // Optional catalysed dashed curve
  if (p.catTs != null) {
    ctx.strokeStyle = '#88e060';
    ctx.lineWidth = Math.max(2.2, F.len(0.36));
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const x = F.x(toX(u));
      const y = F.y(toY(evalProfile(p, u, true)));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    say(ctx, `Catalysed (${p.catTs})`, F.x(toX(0.45)), F.y(toY(p.catTs) + 2.4), F.size(1.75, 4.6), { align: 'center', color: '#88e060', weight: 700 });
  }

  // Progress ball
  if (hasBall) {
    ctx.fillStyle = AMBER;
    ctx.beginPath();
    ctx.arc(F.x(toX(uBall)), F.y(toY(eBall)), Math.max(4.0, F.len(0.95)), 0, Math.PI * 2);
    ctx.fill();
  }

  say(ctx, 'Reaction progress', F.x(gx + gw / 2), F.y(gy + gh + 2.8), F.size(1.75, 4.6), { align: 'center', color: TEXT });
}

function kprofileTapZones(f) {
  const p = f.props;
  const { gx, gy, gw, gh } = profileGeom(f);
  if (p.tapZones) {
    return p.tapZones.map((z, idx) => ({
      x0: gx + z.x0 * gw,
      x1: gx + z.x1 * gw,
      y0: gy,
      y1: gy + gh,
      dial: 'zone',
      value: idx + 1
    }));
  }
  if (!p.noProgress && f.dials?.progress) {
    return [{ x0: gx, x1: gx + gw, y0: gy, y1: gy + gh, dial: 'progress', drag: true, axis: 'x' }];
  }
  return [];
}

registerFixture('kprofile', {
  paint: paintKprofile,
  tapZones: kprofileTapZones
});
