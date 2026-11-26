/**
 * kits/rate-log.js — Initial-rates log (`rateslog`) and power-dial rate-law board (`rateboard`)
 * for Quicklight (unit11).
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

export function rateslogFixture(id, at, {
  title = 'Initial-rates log',
  species = ['A', 'B', 'C'],
  initialRows = [],
  rateLawText = '',
  w = 68,
  h = 40
} = {}) {
  return {
    id,
    kind: 'rateslog',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: true,
    dials: {},
    props: {
      title,
      species,
      rows: initialRows.map(r => ({ ...r })),
      rateLawText
    }
  };
}

function formatRate(val) {
  if (val == null) return '?';
  const n = Number(val);
  if (n === 0) return '0.000';
  if (Math.abs(n) < 0.01) return n.toFixed(4).replace(/0$/, '');
  return n.toFixed(3);
}

function paintRatesLog(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  say(ctx, p.title, F.x(2), F.y(2.6), F.size(2.2, 5.8), { color: TEXT, weight: 700, maxW: F.len(f.size.w - 4) });
  const hasLaw = Boolean(p.rateLawText);
  if (hasLaw) {
    say(ctx, p.rateLawText, F.x(f.size.w / 2), F.y(6.2), F.size(2.3, 6.0), { align: 'center', color: AMBER, weight: 700, maxW: F.len(f.size.w - 4) });
  }
  const unitY = hasLaw ? 9.4 : 6.0;
  say(ctx, 'Conc: mol/L · Rate: mol/(L·s)', F.x(f.size.w - 2), F.y(unitY), F.size(1.45, 4.2), { align: 'right', color: DIM });

  const cols = ['#', ...p.species.map(s => `[${s}]`), 'Rate'];
  const numW = 6;
  const rateW = Math.max(15, (f.size.w - 4 - numW) * 0.36);
  const spW = (f.size.w - 4 - numW - rateW) / Math.max(1, p.species.length);
  const colCenter = i => {
    if (i === 0) return 2 + numW * 0.5;
    if (i <= p.species.length) return 2 + numW + (i - 0.5) * spW;
    return 2 + numW + p.species.length * spW + rateW * 0.5;
  };
  const hy = hasLaw ? 12.6 : 9.4;

  cols.forEach((c, i) => {
    say(ctx, c, F.x(colCenter(i)), F.y(hy), F.size(1.85, 5.0), { align: 'center', color: TEXT, weight: 700 });
  });
  ctx.strokeStyle = DUST;
  ctx.beginPath();
  ctx.moveTo(F.x(2), F.y(hy + 2.2));
  ctx.lineTo(F.x(f.size.w - 2), F.y(hy + 2.2));
  ctx.stroke();

  const rows = p.rows || [];
  if (rows.length === 0) {
    say(ctx, 'Press "Run" to log runs', F.x(f.size.w / 2), F.y(f.size.h / 2 + 4), F.size(1.9, 5.0), { align: 'center', color: DIM });
    return;
  }

  const rowH = Math.min(5.6, (f.size.h - hy - 4.5) / Math.max(1, rows.length));
  rows.forEach((row, rIdx) => {
    const ry = hy + 5.2 + rIdx * rowH;
    say(ctx, `${rIdx + 1}`, F.x(colCenter(0)), F.y(ry), F.size(1.8, 4.8), { align: 'center', color: DIM });
    p.species.forEach((sp, cIdx) => {
      const val = row[sp];
      const str = val == null ? '?' : Number(val).toFixed(2);
      say(ctx, str, F.x(colCenter(cIdx + 1)), F.y(ry), F.size(1.9, 5.0), { align: 'center', color: TEXT });
    });
    const rStr = formatRate(row.rate);
    const rCol = B_COLOR_OR_AMBER(row.rate == null);
    say(ctx, rStr, F.x(colCenter(p.species.length + 1)), F.y(ry), F.size(1.95, 5.2), { align: 'center', color: rCol, weight: 700 });
  });
}

function B_COLOR_OR_AMBER(missing) {
  return missing ? AMBER : '#7ec8f0';
}

registerFixture('rateslog', { paint: paintRatesLog });

export function rateboardFixture(id, at, {
  title = 'Rate law',
  species = ['A', 'B', 'C'],
  maxOrder = 2,
  w = 66,
  h = null
} = {}) {
  const dials = {};
  const labels = Array.from({ length: maxOrder + 1 }, (_, i) => `${i}`);
  species.forEach((sp, idx) => {
    dials[`o${idx}`] = {
      min: 0,
      max: maxOrder,
      step: 1,
      value: 0,
      label: `Order [${sp}]`,
      labels
    };
  });
  const height = h ?? Math.max(28, 15 + species.length * 9.5);
  return {
    id,
    kind: 'rateboard',
    label: title,
    at: { ...at },
    size: { w, h: height },
    noRun: true,
    dials,
    props: { title, species, maxOrder, top: 9.0, rowPitch: 9.2, tickLabels: true }
  };
}

function paintRateBoard(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.1, 5.4), { color: DIM, weight: 700 });
  const parts = p.species.map((sp, idx) => {
    const ord = Math.round(f.dials[`o${idx}`]?.value ?? 0);
    return `[${sp}]^${ord}`;
  });
  const expr = `rate = k ${parts.join(' ')}`;
  say(ctx, expr, F.x(f.size.w / 2), F.y(f.size.h - 4.5), F.size(2.4, 6.2), { align: 'center', color: AMBER, weight: 700, maxW: F.len(f.size.w - 4) });
}

registerFixture('rateboard', { paint: paintRateBoard });
