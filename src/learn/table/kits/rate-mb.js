/**
 * kits/rate-mb.js — Maxwell-Boltzmann kinetic energy histogram (`mbhist`) with Ea threshold bar
 * for Quicklight (unit11, q4-collide).
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { planMB } from '../../engine/ratedata.js';
import { registerFixture } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;
const BELOW_COL = '#48586b';
const ABOVE_COL = '#d89236';

export function mbhistFixture(id, at, {
  title = 'Particle energy spread',
  Ts = [300, 330, 360],
  Ea = 12,
  eMax = 24,
  w = 84,
  h = 42
} = {}) {
  return {
    id,
    kind: 'mbhist',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: true,
    dials: {
      T: {
        min: 1,
        max: Ts.length,
        step: 1,
        value: 1,
        label: 'Temperature',
        labels: Ts.map(t => `${t} K`)
      }
    },
    props: { title, Ts, Ea, eMax }
  };
}

function paintMB(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const idx = Math.max(0, Math.min(p.Ts.length - 1, Math.round(f.dials.T?.value ?? 1) - 1));
  const T = p.Ts[idx];
  const mb = planMB({ T, Ea: p.Ea, eMax: p.eMax, nBins: 36 });

  say(ctx, `${p.title} · T = ${T} K`, F.x(2), F.y(2.5), F.size(2.1, 5.4), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.65) });
  say(ctx, `≥ Ea: ${mb.percentAbove.toFixed(2)}%`, F.x(f.size.w - 2), F.y(2.5), F.size(2.0, 5.2), { align: 'right', color: AMBER, weight: 700 });

  const gx = 5;
  const gy = 11.5;
  const gw = f.size.w - 9;
  const gh = f.size.h - 16.5;

  const maxD = Math.max(...mb.bins.map(bin => bin.density), 0.1);
  const bw = gw / mb.bins.length;

  mb.bins.forEach((bin, i) => {
    const bh = (bin.density / maxD) * gh * 0.9;
    const x = gx + i * bw;
    const y = gy + gh - bh;
    ctx.fillStyle = bin.above ? ABOVE_COL : BELOW_COL;
    ctx.fillRect(F.x(x), F.y(y), Math.max(1, F.len(bw - 0.3)), F.len(bh));
  });

  // Ea threshold line
  const eaX = gx + (p.Ea / p.eMax) * gw;
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = Math.max(1.8, F.len(0.32));
  ctx.beginPath();
  ctx.moveTo(F.x(eaX), F.y(gy));
  ctx.lineTo(F.x(eaX), F.y(gy + gh));
  ctx.stroke();
  ctx.lineWidth = 1;
  say(ctx, `Ea = ${p.Ea} kJ/mol`, F.x(eaX + 1), F.y(gy + 2), F.size(1.6, 4.2), { color: AMBER, weight: 700 });

  ctx.strokeStyle = DUST;
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  say(ctx, 'Kinetic energy (kJ/mol)', F.x(gx + gw / 2), F.y(gy + gh + 2.5), F.size(1.6, 4.2), { align: 'center', color: DIM });
}

registerFixture('mbhist', { paint: paintMB });
