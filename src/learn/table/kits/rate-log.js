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

function paintRatesLog(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.2, 5.6), { color: TEXT, weight: 700, maxW: F.len(f.size.w - 4) });
  if (p.rateLawText) {
    say(ctx, p.rateLawText, F.x(f.size.w - 2), F.y(2.5), F.size(1.9, 5.0), { align: 'right', color: AMBER, weight: 700 });
  }

  const cols = [...p.species.map(s => `[${s}]`), 'Rate'];
  const cw = (f.size.w - 4) / cols.length;
  const hy = 7.2;

  cols.forEach((c, i) => {
    say(ctx, c, F.x(2 + (i + 0.5) * cw), F.y(hy), F.size(1.8, 4.8), { align: 'center', color: DIM, weight: 700 });
  });
  ctx.strokeStyle = DUST;
  ctx.beginPath();
  ctx.moveTo(F.x(2), F.y(hy + 2.2));
  ctx.lineTo(F.x(f.size.w - 2), F.y(hy + 2.2));
  ctx.stroke();

  const rows = p.rows || [];
  if (rows.length === 0) {
    say(ctx, 'Press "Run" to log runs', F.x(f.size.w / 2), F.y(f.size.h / 2 + 2), F.size(1.9, 4.8), { align: 'center', color: DIM });
    return;
  }

  const rowH = Math.min(5.2, (f.size.h - hy - 4) / Math.max(1, rows.length));
  rows.forEach((row, rIdx) => {
    const ry = hy + 5.0 + rIdx * rowH;
    p.species.forEach((sp, cIdx) => {
      const val = row[sp];
      const str = val == null ? '?' : Number(val).toFixed(2);
      say(ctx, str, F.x(2 + (cIdx + 0.5) * cw), F.y(ry), F.size(1.8, 4.8), { align: 'center', color: TEXT });
    });
    const rStr = row.rate == null ? '?' : Number(row.rate).toFixed(4).replace(/0+$/, '').replace(/\.$/, '.0');
    const rCol = row.rate == null ? AMBER : B_COLOR_OR_AMBER(row.rate == null);
    say(ctx, rStr, F.x(2 + (p.species.length + 0.5) * cw), F.y(ry), F.size(1.8, 4.8), { align: 'center', color: rCol, weight: 700 });
  });
}

function B_COLOR_OR_AMBER(missing) {
  return missing ? AMBER : '#8fb0c8';
}

registerFixture('rateslog', { paint: paintRatesLog });

export function rateboardFixture(id, at, {
  title = 'Rate law',
  species = ['A', 'B', 'C'],
  maxOrder = 3,
  w = 66,
  h = 26
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
  return {
    id,
    kind: 'rateboard',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: true,
    dials,
    props: { title, species, maxOrder }
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
