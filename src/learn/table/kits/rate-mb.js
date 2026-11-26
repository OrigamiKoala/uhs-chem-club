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
  showParticles = true,
  showGhost = false,
  w = 84,
  h = 44
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
    props: { title, Ts, Ea, eMax, showParticles, showGhost, top: 8.2, tickLabels: true }
  };
}

function paintMB(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const idx = Math.max(0, Math.min(p.Ts.length - 1, Math.round(f.dials.T?.value ?? 1) - 1));
  const T = p.Ts[idx];
  const mb = planMB({ T, Ea: p.Ea, eMax: p.eMax, nBins: 36 });

  say(ctx, `${p.title} · ${T} K`, F.x(2), F.y(2.6), F.size(2.1, 5.6), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.56) });
  say(ctx, `≥ Ea: ${mb.percentAbove.toFixed(2)}%`, F.x(f.size.w - 2), F.y(2.6), F.size(2.3, 6.0), { align: 'right', color: AMBER, weight: 700 });

  const gy = 16.2;
  const gh = f.size.h - gy - 5.2;

  // Small particle speed box on the left so students see bars represent moving particles
  let gx = 6;
  if (p.showParticles) {
    const px0 = 2.5;
    const pw = 16;
    ctx.fillStyle = '#121720';
    ctx.fillRect(F.x(px0), F.y(gy), F.len(pw), F.len(gh));
    ctx.strokeStyle = DUST;
    ctx.strokeRect(F.x(px0), F.y(gy), F.len(pw), F.len(gh));
    const speed = 1.0 + (T - 270) / 55;
    const nFast = Math.max(1, Math.round((mb.percentAbove / 100) * 18));
    for (let i = 0; i < 14; i++) {
      const s1 = Math.sin((i + 1) * 91.7) * 43758.5453;
      const s2 = Math.sin((i + 1) * 213.3) * 43758.5453;
      const r1 = s1 - Math.floor(s1);
      const r2 = s2 - Math.floor(s2);
      const dx = ((r1 * (pw - 3) + b.clock * speed * (r2 - 0.5) * 6) % (pw - 3) + (pw - 3)) % (pw - 3);
      const dy = ((r2 * (gh - 3) + b.clock * speed * (r1 - 0.5) * 6) % (gh - 3) + (gh - 3)) % (gh - 3);
      ctx.fillStyle = i < nFast ? ABOVE_COL : '#7898b8';
      ctx.beginPath();
      ctx.arc(F.x(px0 + 1.5 + dx), F.y(gy + 1.5 + dy), Math.max(2.2, F.len(0.65)), 0, Math.PI * 2);
      ctx.fill();
    }
    say(ctx, 'Particles', F.x(px0 + pw / 2), F.y(gy + gh + 2.8), F.size(1.6, 4.4), { align: 'center', color: TEXT });
    gx = px0 + pw + 4.5;
  }

  const gw = f.size.w - gx - 3;

  // Graph backdrop
  ctx.fillStyle = '#141922';
  ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));

  const baseMb = planMB({ T: p.Ts[0], Ea: p.Ea, eMax: p.eMax, nBins: 36 });
  const maxD = Math.max(...baseMb.bins.map(bin => bin.density), ...mb.bins.map(bin => bin.density), 0.1);
  const bw = gw / mb.bins.length;

  // Optional 300 K ghost bars when comparing two temperatures
  if (p.showGhost && idx > 0) {
    ctx.fillStyle = 'rgba(130, 155, 185, 0.22)';
    baseMb.bins.forEach((bin, i) => {
      const bh = (bin.density / maxD) * gh * 0.88;
      ctx.fillRect(F.x(gx + i * bw), F.y(gy + gh - bh), Math.max(1, F.len(bw - 0.3)), F.len(bh));
    });
    say(ctx, `${p.Ts[0]} K: ${baseMb.percentAbove.toFixed(2)}%`, F.x(gx + gw - 1), F.y(gy + 5.6), F.size(1.7, 4.6), { align: 'right', color: DIM });
  }

  mb.bins.forEach((bin, i) => {
    const bh = (bin.density / maxD) * gh * 0.88;
    const x = gx + i * bw;
    const y = gy + gh - bh;
    ctx.fillStyle = bin.above ? ABOVE_COL : BELOW_COL;
    ctx.fillRect(F.x(x), F.y(y), Math.max(1, F.len(bw - 0.3)), F.len(bh));
  });

  // Ea threshold line — label clearly inside right top of plot, well below Temperature dial
  const eaX = gx + (p.Ea / p.eMax) * gw;
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = Math.max(2, F.len(0.35));
  ctx.beginPath();
  ctx.moveTo(F.x(eaX), F.y(gy));
  ctx.lineTo(F.x(eaX), F.y(gy + gh));
  ctx.stroke();
  ctx.lineWidth = 1;
  say(ctx, `Ea = ${p.Ea} kJ/mol`, F.x(eaX + 1.2), F.y(gy + 2.6), F.size(1.85, 4.8), { color: AMBER, weight: 700 });

  ctx.strokeStyle = '#8a96a6';
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  say(ctx, '0', F.x(gx), F.y(gy + gh + 2.8), F.size(1.6, 4.4), { color: DIM });
  say(ctx, 'Kinetic energy (kJ/mol)', F.x(gx + gw / 2), F.y(gy + gh + 2.8), F.size(1.75, 4.6), { align: 'center', color: TEXT });
  say(ctx, `${p.eMax}`, F.x(gx + gw), F.y(gy + gh + 2.8), F.size(1.6, 4.4), { align: 'right', color: DIM });
}

registerFixture('mbhist', { paint: paintMB, live: f => Boolean(f.props.showParticles) });
