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
  tapZones = null,
  w = 96,
  h = 42
} = {}) {
  const dials = {
    progress: {
      min: 0,
      max: 100,
      step: 5,
      value: 0,
      label: 'Progress',
      labels: ['Start', '', '', '', '', '', '', '', '', '', 'Mid', '', '', '', '', '', '', '', '', '', 'End']
    }
  };
  const hidden = [];
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
      tapZones,
      hidden
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

function paintKprofile(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.1, 5.4), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.6) });

  const uBall = (f.dials.progress?.value ?? 0) / 100;
  const eBall = evalProfile(p, uBall, false);
  say(ctx, `E = ${Math.round(eBall)} kJ/mol`, F.x(f.size.w - 2), F.y(2.5), F.size(1.9, 5.0), { align: 'right', color: AMBER, weight: 700 });

  const gx = 9;
  const gy = 11.5;
  const gw = f.size.w - 14;
  const gh = f.size.h - 16.5;

  const allE = [p.reactants, p.ts, p.products, ...(p.valley != null ? [p.valley, p.ts2] : []), ...(p.catTs != null ? [p.catTs] : [])];
  const eMin = Math.min(...allE) - 10;
  const eMax = Math.max(...allE) + 12;
  const toX = u => gx + u * gw;
  const toY = e => gy + gh - ((e - eMin) / (eMax - eMin)) * gh;

  ctx.strokeStyle = DUST;
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  if (p.tapZones) {
    const chosen = Math.round(f.dials.zone?.value ?? 0);
    p.tapZones.forEach((z, idx) => {
      const zx0 = gx + z.x0 * gw;
      const zx1 = gx + z.x1 * gw;
      const isChosen = chosen === idx + 1;
      ctx.fillStyle = isChosen ? 'rgba(229,155,36,0.22)' : 'rgba(255,255,255,0.03)';
      ctx.fillRect(F.x(zx0), F.y(gy), F.len(zx1 - zx0), F.len(gh));
      ctx.strokeStyle = isChosen ? AMBER : DUST;
      ctx.setLineDash(isChosen ? [] : [2, 2]);
      ctx.strokeRect(F.x(zx0), F.y(gy), F.len(zx1 - zx0), F.len(gh));
      ctx.setLineDash([]);
      say(ctx, z.label, F.x((zx0 + zx1) / 2), F.y(gy + gh - 1.5), F.size(1.5, 4.0), { align: 'center', color: isChosen ? AMBER : DIM, maxW: F.len(zx1 - zx0 - 1) });
    });
  }

  // Main energy curve
  ctx.strokeStyle = CURVE_COL;
  ctx.lineWidth = Math.max(2, F.len(0.35));
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
    ctx.strokeStyle = CAT_COL;
    ctx.lineWidth = Math.max(1.8, F.len(0.3));
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
    say(ctx, 'Catalysed', F.x(toX(0.45)), F.y(toY(p.catTs) - 1.5), F.size(1.5, 4.0), { align: 'center', color: CAT_COL });
  }

  // Level readouts
  if (p.showLevels) {
    say(ctx, `R: ${p.reactants}`, F.x(toX(0.02)), F.y(toY(p.reactants) - 1.5), F.size(1.6, 4.2), { color: TEXT });
    say(ctx, `P: ${p.products}`, F.x(toX(0.98)), F.y(toY(p.products) - 1.5), F.size(1.6, 4.2), { align: 'right', color: TEXT });
    if (p.valley == null) {
      say(ctx, `TS: ${p.ts}`, F.x(toX(0.45)), F.y(toY(p.ts) - 1.5), F.size(1.6, 4.2), { align: 'center', color: AMBER });
    } else {
      say(ctx, `TS1: ${p.ts}`, F.x(toX(0.28)), F.y(toY(p.ts) - 1.5), F.size(1.5, 4.0), { align: 'center', color: AMBER });
      say(ctx, `I: ${p.valley}`, F.x(toX(0.52)), F.y(toY(p.valley) + 2.8), F.size(1.5, 4.0), { align: 'center', color: DIM });
      say(ctx, `TS2: ${p.ts2}`, F.x(toX(0.76)), F.y(toY(p.ts2) - 1.5), F.size(1.5, 4.0), { align: 'center', color: AMBER });
    }
  }

  // Progress ball
  ctx.fillStyle = AMBER;
  ctx.beginPath();
  ctx.arc(F.x(toX(uBall)), F.y(toY(eBall)), Math.max(3.5, F.len(0.8)), 0, Math.PI * 2);
  ctx.fill();

  say(ctx, 'Reaction progress', F.x(gx + gw / 2), F.y(gy + gh + 2.5), F.size(1.6, 4.2), { align: 'center', color: DIM });
}

function kprofileTapZones(f) {
  const p = f.props;
  if (!p.tapZones) return [];
  const gx = 9;
  const gy = 11.5;
  const gw = f.size.w - 14;
  const gh = f.size.h - 16.5;
  return p.tapZones.map((z, idx) => ({
    x0: gx + z.x0 * gw,
    x1: gx + z.x1 * gw,
    y0: gy,
    y1: gy + gh,
    dial: 'zone',
    value: idx + 1
  }));
}

registerFixture('kprofile', {
  paint: paintKprofile,
  tapZones: kprofileTapZones
});
