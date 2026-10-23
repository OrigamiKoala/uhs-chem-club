/**
 * THE CALORIMETER & THERMODYNAMIC BENCH — Ember Reach (Unit 5)
 *
 * Subclasses `PlateBench` (`./plates.js`) so its 3D twin (`Calorimeter3D` via
 * `plateBench3D` in `./plates3d.js`) shares the exact same `draw(ctx, w, h, item)`
 * and `press(item, hit)` methods.
 *
 * Seven interchangeable heads, each with big-picture physical visuals:
 *   - 'contact' : two blocks/vessels with particle-velocity vectors, thermal reservoir bars,
 *                 system/surroundings boundary frame & live T(t) equilibrium trace
 *   - 'cup'     : insulated coffee-cup calorimeter with stirrer, lid, thermometer,
 *                 specific-heat bucket comparison & q_sys + q_surr = 0 balance bar
 *   - 'diagram' : enthalpy level diagram linking bond-potential drop/climb to bath warming/cooling
 *   - 'bonds'   : bond-breaking crank OR uphill-to-free-atoms / downhill-to-products bond ledger
 *   - 'hess'    : Hess's law equation stack with a live altitude step-ladder, OR formation sea-level
 *                 chart showing why ΔH°rxn = Σ ΔH°f(products) − Σ ΔH°f(reactants)
 *   - 'box'     : partitioned microstate chamber with arrangement thumbnails & W probability ratio
 *   - 'gibbs'   : live ΔG(T) = ΔH − T·ΔS plotter paired with an Enthalpy-vs-TΔS tug-of-war bar
 */

import { PlateBench, PLATE_COLORS, raster, aperture } from './plates.js';
import {
  SPECIFIC_HEAT_WATER,
  BOND_ENTHALPIES,
  equilibriumTemp,
  bondEnthalpySum,
  hessStackEnthalpy,
  microstateWays,
  gibbsFreeEnergy,
  crossingTemperature,
} from './thermodata.js';

const INK = {
  Well: PLATE_COLORS.bg,
  Border: PLATE_COLORS.rim,
  Rule: PLATE_COLORS.dim,
  Muted: PLATE_COLORS.steel,
  Secondary: PLATE_COLORS.dust,
  Bright: PLATE_COLORS.text,
  Amber: PLATE_COLORS.amber,
  Bronze: '#b47b32',
  Danger: '#e55c24',
  Blue: '#5899d6',
  Green: PLATE_COLORS.phosphor,
  Mono: '"JetBrains Mono", "Quantico", monospace',
};

function roundRect(ctx, x, y, w, h, r = 4) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
}

function drawTraceBox(ctx, ink, x, y, w, h, TStart, TEnd, label = 'T(t)', T2Start = null) {
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.strokeStyle = ink.Rule;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 3);
  ctx.fill();
  ctx.stroke();

  ctx.font = `600 10px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 6, y + 13);

  const allT = T2Start != null ? [TStart, TEnd, T2Start] : [TStart, TEnd];
  const minT = Math.min(...allT) - 4;
  const maxT = Math.max(...allT) + 4;
  const mapY = (T) => {
    const frac = (T - minT) / Math.max(1, maxT - minT);
    return y + h - 10 - frac * (h - 28);
  };

  ctx.strokeStyle = ink.Rule;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x + 8, mapY(TEnd));
  ctx.lineTo(x + w - 8, mapY(TEnd));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = TEnd > TStart + 0.05 ? ink.Danger : TEnd < TStart - 0.05 ? ink.Blue : ink.Amber;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const T = u < 0.12 ? TStart : TEnd + (TStart - TEnd) * Math.exp(-(u - 0.12) * 5.2);
    const px = x + 8 + u * (w - 16);
    const py = mapY(T);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  if (T2Start != null) {
    ctx.strokeStyle = T2Start < TEnd ? ink.Blue : ink.Danger;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const T = u < 0.12 ? T2Start : TEnd + (T2Start - TEnd) * Math.exp(-(u - 0.12) * 5.2);
      const px = x + 8 + u * (w - 16);
      const py = mapY(T);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  ctx.font = `600 10px ${ink.Mono}`;
  ctx.fillStyle = ink.Bright;
  ctx.textAlign = 'right';
  ctx.fillText(`→ ${TEnd.toFixed(1)} °C`, x + w - 6, y + 13);
}

function drawParticleJiggle(ctx, ink, x, y, w, h, tempC, count = 6) {
  const speedLen = Math.max(2, Math.min(11, (tempC + 20) / 14));
  const cols = Math.min(3, count);
  const rows = Math.ceil(count / cols);
  ctx.strokeStyle = tempC > 45 ? ink.Danger : tempC < 30 ? ink.Blue : ink.Amber;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const px = x + (c + 0.5) * (w / cols);
    const py = y + (r + 0.5) * (h / rows);
    const ang = (i * 2.1 + 0.4);
    ctx.beginPath();
    ctx.arc(px, py, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(ang) * speedLen, py + Math.sin(ang) * speedLen);
    ctx.stroke();
  }
}

function drawContactHead(ctx, w, h, rig, cfg, ink, hits) {
  const left = rig.left || { label: 'Block A', T: 80, m: 100, c: 0.45 };
  const right = rig.right || { label: 'Block B', T: 20, m: 100, c: 0.45 };
  const joined = rig.joined !== undefined ? rig.joined : Boolean(cfg.toggled);
  const Tf = equilibriumTemp(left.m || 100, left.c || 1, left.T, right.m || 100, right.c || 1, right.T);
  const TLeft = joined ? Tf : left.T;
  const TRight = joined ? Tf : right.T;

  const cy = h * 0.48;
  const bw = Math.min(w * 0.25, 108);
  const bh = Math.min(h * 0.38, 82);
  const gap = joined ? 2 : Math.max(18, w * 0.07);
  const lx = w * 0.33 - bw - gap * 0.5;
  const rx = w * 0.33 + gap * 0.5;
  const by = cy - bh / 2;

  if (rig.showBoundary) {
    ctx.strokeStyle = ink.Amber;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    roundRect(ctx, lx - 10, by - 16, bw * 2 + gap + 20, bh + 32, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `600 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Amber;
    ctx.textAlign = 'left';
    ctx.fillText('SYSTEM (INSIDE BOUNDARY)', lx - 6, by - 20);
    ctx.fillStyle = ink.Secondary;
    ctx.fillText('SURROUNDINGS (BATH & AIR OUTSIDE)', lx - 6, by + bh + 28);
  }

  ctx.fillStyle = TLeft > 45 ? 'rgba(229, 92, 36, 0.26)' : 'rgba(217, 155, 38, 0.18)';
  ctx.strokeStyle = TLeft > 45 ? ink.Danger : ink.Amber;
  ctx.lineWidth = 2;
  roundRect(ctx, lx, by, bw, bh, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = TRight < 35 ? 'rgba(88, 153, 214, 0.22)' : 'rgba(217, 155, 38, 0.18)';
  ctx.strokeStyle = TRight < 35 ? ink.Blue : ink.Amber;
  roundRect(ctx, rx, by, bw, bh, 4);
  ctx.fill();
  ctx.stroke();

  drawParticleJiggle(ctx, ink, lx + 8, by + 22, bw - 16, 20, TLeft, left.m && left.m < 10 ? 2 : 6);
  drawParticleJiggle(ctx, ink, rx + 8, by + 22, bw - 16, 20, TRight, right.m && right.m < 10 ? 2 : 6);

  ctx.font = `700 10px ${ink.Mono}`;
  ctx.fillStyle = ink.Bright;
  ctx.textAlign = 'center';
  ctx.fillText(left.label, lx + bw / 2, by + 15);
  ctx.fillText(right.label, rx + bw / 2, by + 15);

  ctx.font = `700 13px ${ink.Mono}`;
  ctx.fillStyle = TLeft > 45 ? ink.Danger : ink.Amber;
  ctx.fillText(`${TLeft.toFixed(1)} °C`, lx + bw / 2, by + bh - 18);
  ctx.fillStyle = TRight < 35 ? ink.Blue : ink.Amber;
  ctx.fillText(`${TRight.toFixed(1)} °C`, rx + bw / 2, by + bh - 18);

  if (left.massLabel || right.massLabel) {
    ctx.font = `500 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Secondary;
    if (left.massLabel) ctx.fillText(left.massLabel, lx + bw / 2, by + bh - 5);
    if (right.massLabel) ctx.fillText(right.massLabel, rx + bw / 2, by + bh - 5);
  }

  if (joined || rig.showArrow) {
    const ax0 = lx + bw - 6;
    const ax1 = rx + 6;
    const ay = by - 6;
    ctx.strokeStyle = ink.Amber;
    ctx.fillStyle = ink.Amber;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax0, ay);
    ctx.lineTo(ax1, ay);
    ctx.stroke();
    const dir = left.T >= right.T ? 1 : -1;
    const tipX = dir > 0 ? ax1 : ax0;
    ctx.beginPath();
    ctx.moveTo(tipX, ay);
    ctx.lineTo(tipX - dir * 7, ay - 4);
    ctx.lineTo(tipX - dir * 7, ay + 4);
    ctx.closePath();
    ctx.fill();
    ctx.font = `700 9px ${ink.Mono}`;
    ctx.fillText('q (fast collisions → slow)', (ax0 + ax1) / 2, ay - 6);
  }

  const tx = w * 0.63;
  const tw = w * 0.33;
  const th = h * 0.56;
  const ty = h * 0.18;
  drawTraceBox(ctx, ink, tx, ty, tw, th, left.T, Tf, 'Both converge to T_eq', right.T);

  hits.push({
    x0: lx, y0: by, x1: tx + tw, y1: by + bh,
    key: 'contact-blocks',
    plateId: rig.id,
    text: `${left.label} (${TLeft.toFixed(1)} °C) and ${right.label} (${TRight.toFixed(1)} °C) settle at ${Tf.toFixed(1)} °C.`,
  });
}

function drawCupHead(ctx, w, h, rig, cfg, ink, hits) {
  const dialVal = cfg.dialValue;
  const dialKey = cfg.dialKey;
  const mWater = (dialKey === 'mass' && dialVal != null) ? dialVal : (rig.waterMass ?? 100);
  const cFluid = rig.cFluid ?? SPECIFIC_HEAT_WATER;
  const TInit = rig.waterTInit ?? 22.0;
  const joules = (dialKey === 'joules' && dialVal != null) ? dialVal : (rig.joules ?? 0);
  const lidOff = rig.lidOff !== undefined ? rig.lidOff : (cfg.toggled && rig.allowLidToggle);
  const lossFactor = lidOff ? 0.72 : 1.0;

  let TFinal = TInit;
  let qSoln = 0;
  let detailLine = `${mWater} g bath`;

  if (rig.block) {
    const b = rig.block;
    const mBlock = (dialKey === 'blockMass' && dialVal != null) ? dialVal : (b.mass ?? 50);
    const dropped = rig.dropped !== undefined ? rig.dropped : true;
    const rawTf = equilibriumTemp(mWater, cFluid, TInit, mBlock, b.c, b.TInit);
    TFinal = dropped ? (TInit + (rawTf - TInit) * lossFactor) : TInit;
    qSoln = mWater * cFluid * (TFinal - TInit);
    detailLine = `${b.label} (${mBlock} g @ ${b.TInit} °C) in ${mWater} g H₂O`;
  } else if (rig.reaction) {
    const rxn = rig.reaction;
    const scale = (dialKey === 'moles' && dialVal != null && rxn.moles) ? (dialVal / rxn.moles) : 1;
    const moles = (rxn.moles ?? 0.05) * scale;
    const qRxnJ = rxn.q != null ? rxn.q * scale : -(moles * (rxn.dH ?? -50) * 1000);
    qSoln = qRxnJ * lossFactor;
    TFinal = TInit + qSoln / (mWater * cFluid);
    detailLine = `${rxn.label || rxn.formula || 'Sample'} (${moles.toFixed(3)} mol)`;
  } else if (joules !== 0) {
    qSoln = joules * lossFactor;
    TFinal = TInit + qSoln / (mWater * cFluid);
    detailLine = `${mWater} g ${rig.fluidName || 'H₂O'} + ${joules} J`;
  } else if (rig.TFinal != null) {
    TFinal = rig.TFinal;
    qSoln = mWater * cFluid * (TFinal - TInit);
    detailLine = rig.sublabel || `${mWater} g bath`;
  }

  const cx = w * 0.28;
  const cupW = Math.min(w * 0.35, 124);
  const cupH = Math.min(h * 0.52, 108);
  const cupX = cx - cupW / 2;
  const cupY = h * 0.22;

  ctx.fillStyle = 'rgba(28, 25, 22, 0.88)';
  ctx.strokeStyle = ink.Bronze;
  ctx.lineWidth = 2;
  roundRect(ctx, cupX - 6, cupY, cupW + 12, cupH + 6, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(12, 14, 18, 0.92)';
  ctx.strokeStyle = ink.Rule;
  ctx.lineWidth = 1;
  roundRect(ctx, cupX, cupY + 4, cupW, cupH - 2, 3);
  ctx.fill();
  ctx.stroke();

  const massFrac = Math.max(0.42, Math.min(0.82, mWater / 240));
  const fillH = cupH * massFrac;
  const fillY = cupY + cupH - fillH;
  const dT = TFinal - TInit;
  ctx.fillStyle = dT > 0.2
    ? 'rgba(229, 108, 42, 0.32)'
    : dT < -0.2
      ? 'rgba(88, 153, 214, 0.32)'
      : 'rgba(180, 155, 110, 0.22)';
  ctx.fillRect(cupX + 2, fillY, cupW - 4, fillH - 2);

  if (!lidOff) {
    ctx.fillStyle = ink.Bronze;
    ctx.fillRect(cupX - 10, cupY - 7, cupW + 20, 8);
  } else {
    ctx.fillStyle = ink.Muted;
    ctx.fillRect(cupX + cupW * 0.35, cupY - 22, cupW * 0.65, 6);
    ctx.strokeStyle = ink.Danger;
    ctx.lineWidth = 1.5;
    for (let k = -1; k <= 1; k++) {
      const hx = cx + k * 18;
      ctx.beginPath();
      ctx.moveTo(hx, cupY + 6);
      ctx.lineTo(hx - 4, cupY - 6);
      ctx.lineTo(hx + 4, cupY - 16);
      ctx.stroke();
    }
  }

  const thX = cx - cupW * 0.22;
  ctx.strokeStyle = ink.Bright;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thX, cupY - 16);
  ctx.lineTo(thX, cupY + cupH - 12);
  ctx.stroke();
  ctx.fillStyle = dT >= 0 ? ink.Danger : ink.Blue;
  ctx.beginPath();
  ctx.arc(thX, cupY + cupH - 10, 4.5, 0, Math.PI * 2);
  ctx.fill();

  if (rig.block) {
    ctx.fillStyle = 'rgba(217, 155, 38, 0.45)';
    ctx.strokeStyle = ink.Amber;
    ctx.lineWidth = 1.5;
    ctx.fillRect(cx + 2, cupY + cupH - 30, 28, 22);
    ctx.strokeRect(cx + 2, cupY + cupH - 30, 28, 22);
    ctx.font = `700 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Bright;
    ctx.textAlign = 'center';
    ctx.fillText(rig.block.symbol || 'M', cx + 16, cupY + cupH - 16);
    ctx.fillStyle = ink.Amber;
    ctx.fillText('−q_metal = +q_H₂O', cx + 8, fillY + 13);
  } else if (rig.reaction) {
    const exo = dT >= 0;
    if (!rig.hideVerdict) {
      ctx.fillStyle = exo ? ink.Danger : ink.Blue;
      ctx.font = `700 9px ${ink.Mono}`;
      ctx.textAlign = 'center';
      ctx.fillText(exo ? 'sys → bath (exo)' : 'bath → sys (endo)', cx + 10, fillY + fillH * 0.48);
    }
  } else {
    ctx.font = `600 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Secondary;
    ctx.textAlign = 'center';
    ctx.fillText(`c = ${cFluid.toFixed(2)} J/g°C`, cx + 8, fillY + fillH * 0.52);
  }

  ctx.font = `600 10px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  ctx.textAlign = 'center';
  ctx.fillText(detailLine, cx, cupY + cupH + 18);

  const tx = w * 0.53;
  const tw = w * 0.42;
  const th = h * 0.46;
  const ty = h * 0.16;
  drawTraceBox(ctx, ink, tx, ty, tw, th, TInit, TFinal, 'Bath thermometer');

  ctx.font = `700 10px ${ink.Mono}`;
  ctx.fillStyle = ink.Amber;
  ctx.textAlign = 'left';
  const dTStr = `${dT >= 0 ? '+' : ''}${dT.toFixed(2)} °C`;
  ctx.fillText(rig.hideHeat ? `ΔT_bath = ${dTStr}` : `ΔT_bath = ${dTStr}  |  |q| = ${Math.round(Math.abs(qSoln))} J`, tx, ty + th + 16);
  ctx.font = `500 9px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  if (!rig.hideVerdict) {
    ctx.fillText(dT >= 0 ? 'Bath warmed ← system released heat' : 'Bath cooled → system absorbed heat', tx, ty + th + 29);
  }

  hits.push({
    x0: cupX - 8, y0: cupY - 12, x1: tx + tw, y1: cupY + cupH + 16,
    key: 'calorimeter-cup',
    plateId: rig.id,
    text: `${rig.label}: bath moves from ${TInit.toFixed(1)} °C to ${TFinal.toFixed(2)} °C (ΔT = ${dTStr}${rig.hideHeat ? '' : `, |q| = ${Math.round(Math.abs(qSoln))} J`}).`,
  });
}

function drawDiagramHead(ctx, w, h, rig, cfg, ink, hits) {
  const rev = Boolean(rig.reversed) ^ Boolean(cfg.toggled && rig.allowReverse);
  const rawDH = rig.dH ?? -285.8;
  const dH = rev ? -rawDH : rawDH;
  const rLabel = rev ? (rig.productsLabel || 'Products') : (rig.reactantsLabel || 'Reactants');
  const pLabel = rev ? (rig.reactantsLabel || 'Reactants') : (rig.productsLabel || 'Products');

  const padL = w * 0.13;
  const padR = w * 0.08;
  const topY = h * 0.18;
  const botY = h * 0.72;

  ctx.strokeStyle = ink.Secondary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, topY - 8);
  ctx.lineTo(padL, botY + 8);
  ctx.stroke();

  ctx.font = `700 9px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  ctx.textAlign = 'right';
  ctx.fillText('H', padL - 5, topY + 4);

  const rY = dH < 0 ? topY + 14 : botY - 14;
  const pY = dH < 0 ? botY - 14 : topY + 14;
  const shelfW = (w - padL - padR) * 0.34;
  const rX = padL + 12;
  const pX = w - padR - shelfW;

  ctx.strokeStyle = ink.Bright;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(rX, rY);
  ctx.lineTo(rX + shelfW, rY);
  ctx.stroke();

  ctx.strokeStyle = dH < 0 ? ink.Amber : ink.Blue;
  ctx.beginPath();
  ctx.moveTo(pX, pY);
  ctx.lineTo(pX + shelfW, pY);
  ctx.stroke();

  const midX = (rX + shelfW + pX) / 2;
  const peakY = Math.min(rY, pY) - 20;
  ctx.strokeStyle = ink.Rule;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(rX + shelfW, rY);
  ctx.quadraticCurveTo(midX, peakY, pX, pY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = dH < 0 ? ink.Danger : ink.Blue;
  ctx.fillStyle = dH < 0 ? ink.Danger : ink.Blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(midX, rY);
  ctx.lineTo(midX, pY);
  ctx.stroke();
  const dir = pY > rY ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(midX, pY);
  ctx.lineTo(midX - 5, pY - dir * 8);
  ctx.lineTo(midX + 5, pY - dir * 8);
  ctx.closePath();
  ctx.fill();

  ctx.font = `700 10px ${ink.Mono}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = ink.Bright;
  ctx.fillText(rLabel, rX + shelfW / 2, rY - 7);
  ctx.fillText(pLabel, pX + shelfW / 2, pY - 7);

  ctx.fillStyle = dH < 0 ? ink.Danger : ink.Blue;
  const signStr = `${dH >= 0 ? '+' : ''}${dH.toFixed(1)} kJ/mol`;
  ctx.fillText(rig.hideValue ? (rig.hideVerdict ? 'ΔH' : (dH < 0 ? 'ΔH < 0 (drops)' : 'ΔH > 0 (climbs)')) : `ΔH = ${signStr}`, midX, (rY + pY) / 2 - 4);

  ctx.font = `600 9px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  const flowNote = rig.sublabel || (rig.hideVerdict ? '' : dH < 0
    ? 'System drops in H → released energy warms surroundings'
    : 'System climbs in H ← absorbed energy cools surroundings');
  if (flowNote) ctx.fillText(flowNote, w / 2, h - 10);

  hits.push({
    x0: padL, y0: topY - 10, x1: w - padR, y1: botY + 10,
    key: 'enthalpy-diagram',
    plateId: rig.id,
    text: `${rig.label}: ${rLabel} → ${pLabel}${rig.hideValue && rig.hideVerdict ? '.' : ` (${rig.hideValue ? (dH < 0 ? 'exothermic drop' : 'endothermic climb') : `ΔH = ${signStr}`}).`}`,
  });
}

function drawBondsHead(ctx, w, h, rig, cfg, ink, hits) {
  if (rig.submode === 'crank') {
    const bondKey = rig.bond || 'H-H';
    const entry = BOND_ENTHALPIES[bondKey] || { bond: bondKey, order: 1, dH: 436 };
    const dialVal = cfg.dialKey === 'pull' ? (cfg.dialValue ?? 0) : null;
    const pulled = dialVal != null ? dialVal > 0.5 : (rig.pulled !== undefined ? rig.pulled : Boolean(cfg.toggled));
    const forming = Boolean(rig.forming);

    const cy = h * 0.42;
    const sep = pulled ? w * 0.42 : w * 0.16;
    const ax = w * 0.5 - sep / 2;
    const bx = w * 0.5 + sep / 2;
    const r = 19;

    if (!pulled) {
      ctx.strokeStyle = ink.Amber;
      ctx.lineWidth = 3;
      const offsets = entry.order === 3 ? [-6, 0, 6] : entry.order === 2 ? [-4, 4] : [0];
      for (const dy of offsets) {
        ctx.beginPath();
        ctx.moveTo(ax + r, cy + dy);
        ctx.lineTo(bx - r, cy + dy);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = forming ? ink.Danger : ink.Blue;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ax + r, cy);
      ctx.lineTo(bx - r, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const parts = entry.bond.split(/[–=≡-]/);
    for (const [idx, x] of [[0, ax], [1, bx]]) {
      ctx.fillStyle = 'rgba(217, 155, 38, 0.25)';
      ctx.strokeStyle = ink.Amber;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = `700 13px ${ink.Mono}`;
      ctx.fillStyle = ink.Bright;
      ctx.textAlign = 'center';
      ctx.fillText(parts[idx] || 'A', x, cy + 4);
    }

    ctx.font = `700 10.5px ${ink.Mono}`;
    ctx.textAlign = 'center';
    const costStr = forming
      ? `Forming ${entry.bond}: releases −${entry.dH} kJ/mol as atoms snap into well`
      : `Breaking ${entry.bond}: costs +${entry.dH} kJ/mol to pull atoms out of well`;
    ctx.fillStyle = forming ? ink.Danger : ink.Amber;
    if (!rig.hideCost) ctx.fillText(costStr, w * 0.5, h * 0.78);

    hits.push({
      x0: ax - r - 10, y0: cy - r - 10, x1: bx + r + 10, y1: cy + r + 28,
      key: 'bond-crank',
      plateId: rig.id,
      text: rig.hideCost ? `${rig.label}: ${forming ? 'forming' : 'breaking'} ${entry.bond}.` : costStr,
    });
    return;
  }

  const broken = rig.broken || [];
  const formed = rig.formed || [];
  const sums = bondEnthalpySum(broken, formed);

  const colW = w * 0.34;
  const lx = w * 0.04;
  const rx = w * 0.40;
  const topY = h * 0.16;

  ctx.font = `700 9px ${ink.Mono}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = ink.Blue;
  ctx.fillText('1. BREAK BONDS (UP +)', lx, topY);
  ctx.fillStyle = ink.Danger;
  ctx.fillText('2. FORM BONDS (DOWN −)', rx, topY);

  ctx.font = `600 9px ${ink.Mono}`;
  broken.forEach((b, idx) => {
    const entry = BOND_ENTHALPIES[b.bond];
    const dH = b.dH ?? entry?.dH ?? 0;
    const lineY = topY + 16 + idx * 16;
    ctx.fillStyle = ink.Bright;
    ctx.fillText(`${b.count}×${entry?.bond || b.bond} (${dH})`, lx, lineY);
    ctx.fillStyle = ink.Blue;
    ctx.fillText(`+${b.count * dH}`, lx + colW - 38, lineY);
  });

  formed.forEach((f, idx) => {
    const entry = BOND_ENTHALPIES[f.bond];
    const dH = f.dH ?? entry?.dH ?? 0;
    const lineY = topY + 16 + idx * 16;
    ctx.fillStyle = ink.Bright;
    ctx.fillText(`${f.count}×${entry?.bond || f.bond} (${dH})`, rx, lineY);
    ctx.fillStyle = ink.Danger;
    ctx.fillText(`−${f.count * dH}`, rx + colW - 38, lineY);
  });

  // Mini Up-Then-Down Pathway Diagram on right
  const diagX = w * 0.76;
  const diagW = w * 0.20;
  const summitY = topY + 8;
  const maxStep = Math.max(100, sums.broken, sums.formed);
  const scaleH = (h * 0.46) / maxStep;
  const rShelfY = summitY + sums.broken * scaleH;
  const pShelfY = summitY + sums.formed * scaleH;

  ctx.strokeStyle = ink.Secondary;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(diagX, summitY);
  ctx.lineTo(diagX + diagW, summitY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `600 8px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  ctx.textAlign = 'center';
  ctx.fillText('Free atoms', diagX + diagW / 2, summitY - 3);

  ctx.strokeStyle = ink.Blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(diagX + diagW * 0.25, rShelfY);
  ctx.lineTo(diagX + diagW * 0.25, summitY + 2);
  ctx.stroke();

  ctx.strokeStyle = ink.Danger;
  ctx.beginPath();
  ctx.moveTo(diagX + diagW * 0.75, summitY + 2);
  ctx.lineTo(diagX + diagW * 0.75, pShelfY);
  ctx.stroke();

  const barY = h * 0.72;
  ctx.strokeStyle = ink.Rule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lx, barY);
  ctx.lineTo(w - lx, barY);
  ctx.stroke();

  ctx.font = `700 10px ${ink.Mono}`;
  ctx.fillStyle = ink.Amber;
  ctx.textAlign = 'center';
  const netSign = sums.net >= 0 ? `+${sums.net}` : `${sums.net}`;
  const summary = rig.hideNet
    ? `Up to atoms: +${sums.broken} kJ   |   Down to products: −${sums.formed} kJ`
    : `Up (+${sums.broken}) − Down (${sums.formed}) = ${netSign} kJ/mol`;
  ctx.fillText(summary, w * 0.5, barY + 16);

  if (rig.calorimeterDH != null) {
    ctx.font = `600 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Secondary;
    ctx.fillText(`Calorimeter measured ΔH° = ${rig.calorimeterDH} kJ/mol`, w * 0.5, barY + 30);
  }

  hits.push({
    x0: lx, y0: topY - 8, x1: w - lx, y1: barY + 34,
    key: 'bond-ledger',
    plateId: rig.id,
    text: `${rig.label}: breaking bonds costs +${sums.broken} kJ/mol; forming product bonds releases −${sums.formed} kJ/mol.`,
  });
}

function drawHessHead(ctx, w, h, rig, cfg, ink, hits) {
  if (rig.submode === 'formation') {
    const reactants = rig.reactants || [];
    const products = rig.products || [];
    const topY = h * 0.14;
    ctx.font = `700 10px ${ink.Mono}`;
    ctx.fillStyle = ink.Amber;
    ctx.textAlign = 'left';
    ctx.fillText(`TARGET: ${rig.targetEq || ''}`, w * 0.05, topY);

    ctx.font = `600 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Secondary;
    if (!rig.hideSeaLevel) ctx.fillText('Reference sea-level: Elements in standard state = 0 kJ/mol', w * 0.05, topY + 14);

    const colW = w * 0.42;
    const lx = w * 0.05;
    const rx = w * 0.52;
    const colLabel = rig.columnLabel || 'ΔH°f (kJ/mol)';
    ctx.fillText(`REACTANTS ${colLabel}`, lx, topY + 30);
    ctx.fillText(`PRODUCTS ${colLabel}`, rx, topY + 30);

    ctx.font = `600 10px ${ink.Mono}`;
    reactants.forEach((r, i) => {
      const y = topY + 46 + i * 17;
      ctx.fillStyle = ink.Bright;
      ctx.fillText(`${r.n || 1} ${r.formula}`, lx, y);
      ctx.fillStyle = ink.Secondary;
      ctx.fillText(`${r.dHf >= 0 ? '+' : ''}${r.dHf}`, lx + colW - 44, y);
    });
    products.forEach((p, i) => {
      const y = topY + 46 + i * 17;
      ctx.fillStyle = ink.Bright;
      ctx.fillText(`${p.n || 1} ${p.formula}`, rx, y);
      ctx.fillStyle = ink.Amber;
      ctx.fillText(`${p.dHf >= 0 ? '+' : ''}${p.dHf}`, rx + colW - 44, y);
    });

    if (rig.note) {
      ctx.font = `600 9px ${ink.Mono}`;
      ctx.fillStyle = ink.Amber;
      ctx.textAlign = 'center';
      ctx.fillText(rig.note, w * 0.5, h * 0.86);
    }

    hits.push({
      x0: lx, y0: topY, x1: w - lx, y1: h * 0.88,
      key: 'hess-formation',
      plateId: rig.id,
      text: `${rig.label}: ${rig.targetEq || 'Formation table'} relative to elemental standard states (0 kJ/mol).`,
    });
    return;
  }

  const cards = rig.cards || [];
  const cardState = cfg.cardState || {};
  const padX = w * 0.04;
  let curY = h * 0.14;

  if (rig.targetEq) {
    ctx.font = `700 10px ${ink.Mono}`;
    ctx.fillStyle = ink.Amber;
    ctx.textAlign = 'left';
    ctx.fillText(`TARGET: ${rig.targetEq}`, padX, curY);
    curY += 8;
  }

  const cardH = Math.min(35, (h - curY - 38) / Math.max(1, cards.length));
  const cw = w * 0.72;
  const resolvedSteps = [];

  cards.forEach((c, idx) => {
    const st = cardState[c.id] || {};
    const flip = st.flip !== undefined ? st.flip : Boolean(c.flip);
    const mult = st.mult !== undefined ? st.mult : (c.mult ?? 1);
    const stepDH = (flip ? -1 : 1) * mult * c.dH;
    resolvedSteps.push({ dH: c.dH, flip, mult });

    const cy = curY + idx * (cardH + 5);
    ctx.fillStyle = flip || mult !== 1 ? 'rgba(217, 155, 38, 0.14)' : 'rgba(0, 0, 0, 0.34)';
    ctx.strokeStyle = flip || mult !== 1 ? ink.Amber : ink.Rule;
    ctx.lineWidth = 1.2;
    roundRect(ctx, padX, cy, cw, cardH, 3);
    ctx.fill();
    ctx.stroke();

    const eqText = flip ? (c.revEq || `Rev: ${c.eq}`) : c.eq;
    const prefix = mult !== 1 ? `${mult}×[` : '';
    const suffix = mult !== 1 ? ']' : '';
    ctx.font = `600 9.5px ${ink.Mono}`;
    ctx.fillStyle = ink.Bright;
    ctx.textAlign = 'left';
    ctx.fillText(`${prefix}${eqText}${suffix}`, padX + 6, cy + cardH * 0.62);

    const dHStr = `${stepDH >= 0 ? '+' : ''}${stepDH.toFixed(1)}`;
    ctx.font = `700 9.5px ${ink.Mono}`;
    ctx.fillStyle = stepDH < 0 ? ink.Danger : ink.Blue;
    ctx.textAlign = 'right';
    ctx.fillText(dHStr, padX + cw - 6, cy + cardH * 0.62);

    hits.push({
      x0: padX, y0: cy, x1: padX + cw, y1: cy + cardH,
      key: `hess-card-${c.id}`,
      cardId: c.id,
      plateId: rig.id,
      text: `Step ${idx + 1}: ${prefix}${eqText}${suffix} (ΔH = ${dHStr} kJ/mol).`,
    });
  });

  const ladX = w * 0.80;
  const ladW = w * 0.15;
  let alt = 0;
  const altitudes = [0];
  for (const s of resolvedSteps) {
    alt += (s.flip ? -1 : 1) * (s.mult ?? 1) * s.dH;
    altitudes.push(alt);
  }
  const minA = Math.min(...altitudes, -50);
  const maxA = Math.max(...altitudes, 50);
  const mapA = (a) => curY + 8 + (1 - (a - minA) / Math.max(1, maxA - minA)) * (h * 0.50);

  ctx.strokeStyle = ink.Rule;
  ctx.strokeRect(ladX, curY + 2, ladW, h * 0.56);
  for (let i = 0; i < resolvedSteps.length; i++) {
    const y0 = mapA(altitudes[i]);
    const y1 = mapA(altitudes[i + 1]);
    const xStep = ladX + 10 + i * 14;
    ctx.strokeStyle = y1 > y0 ? ink.Danger : ink.Blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xStep, y0);
    ctx.lineTo(xStep, y1);
    ctx.stroke();
  }

  const totalDH = hessStackEnthalpy(resolvedSteps);
  const sumY = h - 12;
  ctx.font = `700 10.5px ${ink.Mono}`;
  ctx.fillStyle = ink.Amber;
  ctx.textAlign = 'center';
  const sumText = rig.hideSum
    ? 'Path-independent sum: ΔH_net = Σ ΔH_steps'
    : `Net altitude change ΔH = ${totalDH >= 0 ? '+' : ''}${totalDH.toFixed(1)} kJ/mol`;
  ctx.fillText(sumText, w * 0.5, sumY);
}

function drawBoxHead(ctx, w, h, rig, cfg, ink, hits) {
  if (rig.submode === 'phases') {
    const phase = rig.phaseState || 'solid';
    const cx = w * 0.5;
    const cy = h * 0.44;
    const boxW = Math.min(w * 0.68, 160);
    const boxH = Math.min(h * 0.52, 92);
    const bx = cx - boxW / 2;
    const by = cy - boxH / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.36)';
    ctx.strokeStyle = ink.Bronze;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    const coords = [];
    if (phase === 'solid') {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          coords.push([bx + 26 + c * 18, by + boxH - 16 - r * 16]);
        }
      }
    } else if (phase === 'liquid') {
      const pts = [
        [0.18, 0.82], [0.32, 0.85], [0.48, 0.80], [0.64, 0.84], [0.80, 0.82],
        [0.24, 0.66], [0.41, 0.68], [0.58, 0.64], [0.74, 0.69],
        [0.30, 0.52], [0.52, 0.54], [0.68, 0.51],
      ];
      pts.forEach(([u, v]) => coords.push([bx + u * boxW, by + v * boxH]));
    } else {
      const pts = [
        [0.16, 0.22], [0.42, 0.18], [0.78, 0.26], [0.28, 0.48],
        [0.64, 0.44], [0.84, 0.62], [0.18, 0.76], [0.52, 0.72],
        [0.36, 0.84], [0.74, 0.82], [0.48, 0.34], [0.86, 0.38],
      ];
      pts.forEach(([u, v]) => coords.push([bx + u * boxW, by + v * boxH]));
    }

    ctx.fillStyle = phase === 'gas' ? ink.Amber : phase === 'liquid' ? ink.Blue : ink.Bright;
    for (const [px, py] of coords) {
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = `700 10px ${ink.Mono}`;
    ctx.fillStyle = ink.Secondary;
    ctx.textAlign = 'center';
    ctx.fillText(rig.sublabel || phase.toUpperCase(), cx, by + boxH + 16);

    hits.push({
      x0: bx, y0: by, x1: bx + boxW, y1: by + boxH,
      key: 'phase-box',
      plateId: rig.id,
      text: `${rig.label}: ${rig.sublabel || phase}.`,
    });
    return;
  }

  const dialVal = cfg.dialKey === 'cells' ? cfg.dialValue : null;
  const open = rig.open !== undefined ? rig.open : Boolean(cfg.toggled);
  const totalCells = dialVal != null ? dialVal : (rig.cells ?? (open ? 8 : 4));
  const activeCells = open ? totalCells : (rig.leftCells ?? Math.min(4, totalCells));
  const particles = rig.particles ?? 2;
  const ways = microstateWays(activeCells, particles, Boolean(rig.distinguishable));

  const chW = w * 0.78;
  const chH = h * 0.44;
  const chX = (w - chW) / 2;
  const chY = h * 0.16;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeStyle = ink.Bronze;
  ctx.lineWidth = 2;
  roundRect(ctx, chX, chY, chW, chH, 5);
  ctx.fill();
  ctx.stroke();

  const cols = Math.max(2, Math.ceil(totalCells / 2));
  const rows = 2;
  const cellW = chW / cols;
  const cellH = chH / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = c * rows + r;
      const cx = chX + c * cellW;
      const cy = chY + r * cellH;
      const locked = idx >= activeCells;
      ctx.fillStyle = locked ? 'rgba(255,255,255,0.03)' : 'rgba(217, 155, 38, 0.08)';
      ctx.strokeStyle = ink.Rule;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx, cy, cellW, cellH);
      if (idx < particles) {
        ctx.fillStyle = idx === 0 ? ink.Amber : ink.Blue;
        ctx.beginPath();
        ctx.arc(cx + cellW / 2, cy + cellH / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `700 9px ${ink.Mono}`;
        ctx.fillStyle = '#080708';
        ctx.textAlign = 'center';
        ctx.fillText(String(idx + 1), cx + cellW / 2, cy + cellH / 2 + 3);
      }
    }
  }

  if (!open && activeCells < totalCells) {
    const partX = chX + (activeCells / rows) * cellW;
    ctx.strokeStyle = ink.Danger;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(partX, chY - 4);
    ctx.lineTo(partX, chY + chH + 4);
    ctx.stroke();
  }

  ctx.font = `700 10.5px ${ink.Mono}`;
  ctx.fillStyle = ink.Amber;
  ctx.textAlign = 'center';
  const msg = rig.sublabel || (rig.hideWays
    ? `${particles} particles across ${activeCells} cells`
    : `${particles} particles across ${activeCells} cells  →  W = ${ways} microstates`);
  ctx.fillText(msg, w * 0.5, chY + chH + 18);

  ctx.font = `500 9px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  if (!rig.hideLaw) ctx.fillText('S = k_B ln W (more ways to spread out → higher entropy)', w * 0.5, chY + chH + 31);

  hits.push({
    x0: chX, y0: chY, x1: chX + chW, y1: chY + chH + 30,
    key: 'microstate-box',
    plateId: rig.id,
    text: rig.hideWays
      ? `${rig.label}: ${particles} particles across ${activeCells} open cells.`
      : `${rig.label}: ${particles} particles across ${activeCells} open cells give W = ${ways} arrangements.`,
  });
}

function drawGibbsHead(ctx, w, h, rig, cfg, ink, hits) {
  const dH = rig.dH ?? 6.01;
  const dS = rig.dS ?? 22.0;
  const TMin = rig.TMin ?? 200;
  const TMax = rig.TMax ?? 400;
  const dialT = cfg.dialKey === 'temp' ? cfg.dialValue : null;
  const T = dialT != null ? dialT : (rig.T ?? 298);
  const coupledOn = rig.coupled && (rig.coupled.active || cfg.toggled);
  const dGCoupled = coupledOn ? (rig.coupled.dG2 ?? 0) : 0;
  const tdsTerm = -(T * dS) / 1000;
  const dG = gibbsFreeEnergy(dH, dS, T) + dGCoupled;
  const TStar = crossingTemperature(dH, dS);

  const px = w * 0.08;
  const py = h * 0.16;
  const pw = w * 0.58;
  const ph = h * 0.48;

  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.strokeStyle = ink.Rule;
  ctx.lineWidth = 1;
  roundRect(ctx, px, py, pw, ph, 4);
  ctx.fill();
  ctx.stroke();

  const gMinT = gibbsFreeEnergy(dH, dS, TMin) + dGCoupled;
  const gMaxT = gibbsFreeEnergy(dH, dS, TMax) + dGCoupled;
  const span = Math.max(20, Math.abs(gMinT), Math.abs(gMaxT)) * 1.25;
  const mapX = (temp) => px + ((temp - TMin) / Math.max(1, TMax - TMin)) * pw;
  const mapY = (g) => py + ph / 2 - (g / span) * (ph * 0.44);

  const zeroY = mapY(0);
  ctx.fillStyle = 'rgba(111, 143, 63, 0.14)';
  ctx.fillRect(px + 1, zeroY, pw - 2, py + ph - zeroY - 1);
  ctx.strokeStyle = ink.Rule;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(px, zeroY);
  ctx.lineTo(px + pw, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `600 8.5px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  ctx.textAlign = 'left';
  ctx.fillText('ΔG = 0 (equilibrium)', px + 4, zeroY - 4);
  ctx.fillText('DOWNHILL / FAVORABLE (ΔG < 0)', px + 4, py + ph - 5);

  ctx.strokeStyle = dG < 0 ? ink.Amber : ink.Blue;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(mapX(TMin), mapY(gMinT));
  ctx.lineTo(mapX(TMax), mapY(gMaxT));
  ctx.stroke();

  if (TStar != null && TStar >= TMin && TStar <= TMax && !coupledOn && !rig.hideCrossing) {
    const sx = mapX(TStar);
    ctx.fillStyle = ink.Bright;
    ctx.beginPath();
    ctx.arc(sx, zeroY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `700 8.5px ${ink.Mono}`;
    ctx.textAlign = 'center';
    ctx.fillText(`T*=${Math.round(TStar)}K`, sx, zeroY - 7);
  }

  const curX = mapX(Math.max(TMin, Math.min(TMax, T)));
  const curY = mapY(dG);
  ctx.fillStyle = dG < 0 ? ink.Amber : ink.Danger;
  ctx.beginPath();
  ctx.arc(curX, curY, 5.5, 0, Math.PI * 2);
  ctx.fill();

  const bx = w * 0.70;
  const bw = w * 0.25;
  ctx.font = `700 8.5px ${ink.Mono}`;
  ctx.fillStyle = ink.Secondary;
  ctx.textAlign = 'center';
  ctx.fillText('TUG OF WAR (kJ)', bx + bw / 2, py + 10);

  const items = [
    ['ΔH', dH],
    ['−TΔS', tdsTerm],
  ];
  items.forEach(([lbl, val], idx) => {
    const ry = py + 26 + idx * 34;
    ctx.font = `600 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Bright;
    ctx.textAlign = 'left';
    ctx.fillText(lbl, bx, ry);
    ctx.fillStyle = val <= 0 ? ink.Amber : ink.Blue;
    ctx.textAlign = 'right';
    if (!rig.hideTug) ctx.fillText(`${val >= 0 ? '+' : ''}${val.toFixed(1)}`, bx + bw, ry);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(bx, ry + 4, bw, 6);
    const barFrac = Math.min(1, Math.abs(val) / Math.max(20, Math.abs(dH) + Math.abs(tdsTerm)));
    ctx.fillStyle = val <= 0 ? ink.Amber : ink.Blue;
    ctx.fillRect(bx, ry + 4, bw * barFrac, 6);
  });

  ctx.font = `700 10px ${ink.Mono}`;
  ctx.fillStyle = ink.Bright;
  ctx.textAlign = 'center';
  const eqPrefix = rig.eq ? `${rig.eq}  |  ` : '';
  const verdict = rig.hideDG
    ? `ΔH = ${dH >= 0 ? '+' : ''}${dH} kJ/mol, ΔS = ${dS >= 0 ? '+' : ''}${dS} J/(mol·K) @ ${T} K`
    : `${eqPrefix}T = ${T} K  →  ΔG = ${dG >= 0 ? '+' : ''}${dG.toFixed(1)} kJ/mol`;
  ctx.fillText(verdict, w * 0.5, py + ph + 18);

  if (rig.barrierNote) {
    ctx.font = `600 9px ${ink.Mono}`;
    ctx.fillStyle = ink.Secondary;
    ctx.fillText(rig.barrierNote, w * 0.5, py + ph + 32);
  }

  hits.push({
    x0: px, y0: py, x1: bx + bw, y1: py + ph + 24,
    key: 'gibbs-plotter',
    plateId: rig.id,
    text: verdict,
  });
}

export function drawCalorimeterPlate(ctx, w, h, rig, cfg = {}, sweep = 0) {
  const hits = [];

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = INK.Well;
  ctx.fillRect(0, 0, w, h);

  const head = rig.head || 'cup';
  if (head === 'contact') drawContactHead(ctx, w, h, rig, cfg, INK, hits);
  else if (head === 'diagram') drawDiagramHead(ctx, w, h, rig, cfg, INK, hits);
  else if (head === 'bonds') drawBondsHead(ctx, w, h, rig, cfg, INK, hits);
  else if (head === 'hess') drawHessHead(ctx, w, h, rig, cfg, INK, hits);
  else if (head === 'box') drawBoxHead(ctx, w, h, rig, cfg, INK, hits);
  else if (head === 'gibbs') drawGibbsHead(ctx, w, h, rig, cfg, INK, hits);
  else drawCupHead(ctx, w, h, rig, cfg, INK, hits);

  raster(ctx, w, h, sweep);
  aperture(ctx, w, h);

  return hits;
}

export const drawRigPlate = drawCalorimeterPlate;

/** 2D PlateBench Calorimeter instrument. */
export class Calorimeter extends PlateBench {
  constructor(host, opts = {}) {
    super(host, opts);
    this.onDial = opts.onDial || null;
    this.onCardAct = opts.onCardAct || null;
    this.cfg = Calorimeter.blankCfg();
  }

  static blankCfg() {
    return {
      dialValues: [],
      dial: 1,
      dialKey: null,
      dialLabel: 'SETTING',
      dialUnit: '',
      dialValue: null,
      toggled: false,
      cardState: {},
    };
  }

  apertureClass() {
    return 'calorimeter-aperture';
  }

  gridClass() {
    return 'calorimeter-grid';
  }

  setRigs(rigs, cfg = {}) {
    const dialValues = cfg.dialValues || cfg.dialSpec?.values || [];
    const dial = cfg.dial ?? ((cfg.dialIdx ?? 0) + 1);
    const dialKey = cfg.dialKey || cfg.dialSpec?.key || null;
    const dialValue = dialValues.length ? dialValues[Math.max(0, Math.min(dialValues.length - 1, dial - 1))] : (cfg.dialValue ?? null);
    this.cfg = {
      ...Calorimeter.blankCfg(),
      ...cfg,
      dialValues,
      dial,
      dialKey,
      dialValue,
    };
    this.setPlates(rigs || []);
  }

  setDial(i) {
    this.cfg.dial = i;
    const vals = this.cfg.dialValues || [];
    this.cfg.dialValue = vals.length ? vals[Math.max(0, Math.min(vals.length - 1, i - 1))] : null;
    this.setDialValue?.('dial', i);
    this.drawAll();
  }

  draw(ctx, w, h, item, extra = {}) {
    return drawCalorimeterPlate(ctx, w, h, item, this.cfg, extra.sweep || 0);
  }

  press(item, hit) {
    if (!hit) return null;
    if (hit.cardId && this.onCardAct) {
      this.onCardAct(hit.cardId, item.id);
    }
    return {
      mark: { key: hit.key },
      read: { key: hit.key, text: hit.text || hit.label || `${item.label} inspected.`, cardId: hit.cardId || null },
    };
  }
}
