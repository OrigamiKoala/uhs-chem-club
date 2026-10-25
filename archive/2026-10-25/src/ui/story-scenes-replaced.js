/**
 * Painters replaced on 2026-10-25 by `src/ui/story-scenes-finales.js` (the boss finales, and the absorbance and magnet benches).
 * Kept as they were, with the helpers they used; not imported, built or verified.
 */

// from src/ui/story-scenes-lanternfall.js
/* ---- q9-absorb: a beam goes into the tank sample whole and comes out dimmer by what the reading says ---- */
function beamDim(ctx, w, h, t) {
  ground(ctx, w, h);
  const A = planAbsorb('cuso4', 630, 1, 0.005);
  const through = Math.pow(10, -A);
  const colour = css(wavelengthRgb(630));
  const cw = w * 0.2;
  const cx = w / 2;
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - cw / 2, h * 0.28, cw, h * 0.34);
  const rand = mulberry32(0x9d);
  for (let i = 0; i < 40; i++) disc(ctx, cx - cw / 2 + 8 + rand() * (cw - 16), h * 0.3 + rand() * h * 0.3, 2, '#6f8f9d');
  const run = win(t, 0.05, 0.7);
  ctx.globalAlpha = 1;
  line(ctx, w * 0.06, h * 0.45, cx - cw / 2, h * 0.45, colour, 6 * Math.min(1, run * 2));
  ctx.globalAlpha = Math.max(0.15, through);
  line(ctx, cx + cw / 2, h * 0.45, cx + cw / 2 + w * 0.34 * clamp01(run * 1.5 - 0.3), h * 0.45, colour, 6);
  ctx.globalAlpha = 1;
  if (t > 0.75) text(ctx, 'sealed tank water: 5 mmol/L of copper', w / 2, h * 0.84, { size: Math.max(11, h * 0.042), color: C.amber });
}


// from src/ui/story-scenes-lanternfall.js
/* ---- boss-eater: the Eater settles into cold ice and a ground lens is left, its focus beyond the violet end ---- */
function eaterLens(ctx, w, h, t) {
  ground(ctx, w, h);
  const fall = ease(win(t, 0.1, 0.65));
  ctx.fillStyle = C.iron;
  ctx.strokeStyle = C.steel;
  [[0.38, 0.12, 0.24, 0.12], [0.3, 0.26, 0.4, 0.18], [0.36, 0.46, 0.28, 0.12]].forEach(([bx, by, bw, bh]) => {
    const sink = fall * (h * 0.86 - (by + bh) * h);
    ctx.globalAlpha = 1 - fall * 0.5;
    ctx.fillRect(bx * w, by * h + sink, bw * w, bh * h);
    ctx.strokeRect(bx * w + 0.5, by * h + sink + 0.5, bw * w - 1, bh * h - 1);
    ctx.globalAlpha = 1;
  });
  const show = ease(win(t, 0.65, 0.95));
  ctx.globalAlpha = show;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.74, w * 0.07, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.pale;
  ctx.fill();
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 2;
  ctx.stroke();
  // the band the eye sees, and the light beyond its violet end that the lens is ground for
  const bx = w * 0.62;
  const bw = w * 0.3;
  for (let i = 0; i < 40; i++) ctx.fillStyle = css(wavelengthRgb(380 + (i / 40) * 370)), ctx.fillRect(bx + (i / 40) * bw, h * 0.7, bw / 40 + 1, h * 0.06);
  line(ctx, bx - 4, h * 0.67, bx - 4, h * 0.79, C.amber, 2, [4, 4]);
  text(ctx, 'ground for light shorter than violet', w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: C.amber });
  ctx.globalAlpha = 1;
}


// from src/ui/story-scenes-ligar.js
/* ---- q9-orbitals: a magnet draws in oxygen and leaves nitrogen alone ---- */
function magnetPull(ctx, w, h, t) {
  ground(ctx, w, h);
  const pull = ease(win(t, 0.2, 0.75));
  // The magnet: a horseshoe at the top.
  const mx = w * 0.5;
  const my = h * 0.2;
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = Math.max(6, h * 0.03);
  ctx.beginPath();
  ctx.arc(mx, my, w * 0.07, Math.PI, 0, true);
  ctx.moveTo(mx - w * 0.07, my);
  ctx.lineTo(mx - w * 0.07, my + h * 0.1);
  ctx.moveTo(mx + w * 0.07, my);
  ctx.lineTo(mx + w * 0.07, my + h * 0.1);
  ctx.stroke();
  const flask = (x, name, drawn) => {
    const y = h * 0.7 - (drawn ? pull * h * 0.28 : 0);
    ctx.fillStyle = C.iron;
    ctx.fillRect(x - w * 0.05, y, w * 0.1, h * 0.12);
    ctx.strokeStyle = drawn && pull > 0.9 ? C.amber : C.steel;
    ctx.strokeRect(x - w * 0.05 + 0.5, y + 0.5, w * 0.1 - 1, h * 0.12 - 1);
    text(ctx, name, x, y + h * 0.06, { size: label(h), color: C.text });
  };
  flask(w * 0.3, 'N₂', false);
  flask(w * 0.7, 'O₂', true);
  text(ctx, 'not pulled', w * 0.3, h * 0.93, { size: label(h) });
  if (pull > 0.9) text(ctx, 'pulled', w * 0.7, h * 0.93, { size: label(h), color: C.amber });
}


// from src/ui/story-scenes-ligar.js
/* ---- boss-warden: the warden settles into quarry stone and the slab behind it has been cut clean through ---- */
function wardenCut(ctx, w, h, t) {
  ground(ctx, w, h);
  const rand = mulberry32(0x77);
  const fall = ease(win(t, 0.1, 0.55));
  for (let i = 0; i < 7; i++) {
    const bx = w * (0.1 + i * 0.055);
    const bh = h * (0.22 + rand() * 0.2);
    const sink = fall * (h * 0.86 - h * 0.35 - bh);
    ctx.fillStyle = C.iron;
    ctx.fillRect(bx, h * 0.35 + sink, w * 0.045, bh);
    ctx.strokeStyle = C.steel;
    ctx.strokeRect(bx + 0.5, h * 0.35 + sink + 0.5, w * 0.045 - 1, bh - 1);
  }
  // The slab behind it, and the cut: a straight line that runs through it without a ragged edge.
  const sx = w * 0.55;
  const sw = w * 0.34;
  const sy = h * 0.22;
  const sh = h * 0.56;
  ctx.fillStyle = C.dim;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.strokeStyle = C.steel;
  ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);
  const cut = ease(win(t, 0.5, 0.85));
  line(ctx, sx - w * 0.02, sy + sh * 0.2, sx - w * 0.02 + (sw + w * 0.04) * cut, sy + sh * 0.2 + (sh * 0.6) * cut, C.amber, 3);
  if (t > 0.88) text(ctx, 'cut clean through', sx + sw / 2, sy - h * 0.05, { size: label(h), color: C.amber });
}


// from src/ui/story-scenes-bellows.js
/* ---- boss-compressor: a sealed cylinder holds its pressure for twelve days while the deck cools around it ---- */
function warmCylinder(ctx, w, h, t) {
  ground(ctx, w, h);
  const days = Math.round(12 * ease(win(t, 0.1, 0.9)));
  const deck = 20 - 50 * ease(win(t, 0.1, 0.9));
  ctx.fillStyle = C.iron;
  ctx.fillRect(w * 0.3, h * 0.34, w * 0.3, h * 0.36);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.3, h * 0.34, w * 0.3, h * 0.36);
  // The gauge does not move; the heat source inside is the one amber mark.
  dial(ctx, w * 0.45, h * 0.2, h * 0.08, 0.62, 'gauge', 'unchanged');
  disc(ctx, w * 0.45, h * 0.52, h * 0.035, C.amber);
  const tx = w * 0.78;
  ctx.fillStyle = C.rim;
  ctx.fillRect(tx - 3, h * 0.2, 6, h * 0.55);
  ctx.fillStyle = C.dust;
  const colH = h * 0.55 * ((deck + 50) / 90);
  ctx.fillRect(tx - 3, h * 0.2 + h * 0.55 - colH, 6, colH);
  text(ctx, `deck ${Math.round(deck)} °C`, tx, h * 0.82, { size: Math.max(12, h * 0.046), color: C.text, weight: 700 });
  text(ctx, `day ${days}`, w * 0.45, h * 0.83, { size: Math.max(12, h * 0.05), color: C.text, weight: 700 });
}


// from src/ui/story-scenes-ember.js
/* ---- boss-crucible: the casing splits along its seams, and a pipe runs down from the exchanger into the crust ---- */
function crucibleOpen(ctx, w, h, t) {
  ground(ctx, w, h);
  const open = ease(win(t, 0.12, 0.65));
  const cx = w / 2; const top = h * 0.14; const cH = h * 0.5; const cW = w * 0.2;
  // The exchanger plates between the halves.
  const plates = 7;
  for (let i = 0; i < plates; i++) {
    const x = cx - cW * 0.7 + (i / (plates - 1)) * cW * 1.4;
    line(ctx, x, top + cH * 0.12, x, top + cH * 0.88, C.steel, 3);
  }
  // The two halves of the casing, drawn apart.
  const gap = open * w * 0.16;
  box(ctx, cx - cW - gap, top, cW, cH, C.iron, C.steel, 2);
  box(ctx, cx + gap, top, cW, cH, C.iron, C.steel, 2);
  text(ctx, 'exchanger', cx, top - h * 0.04, { size: fs(h), color: C.dust });
  // The pipe from the exchanger down into the crust, drawn on as time runs.
  const draw = ease(win(t, 0.5, 0.9));
  const pipeTop = top + cH;
  line(ctx, cx, pipeTop, cx, pipeTop + (h * 0.88 - pipeTop) * draw, C.amber, 5);
  if (draw > 0.6) text(ctx, 'down into the crust', cx + w * 0.12, pipeTop + (h * 0.88 - pipeTop) * 0.6, { size: fs(h), color: C.dust, align: 'left' });
}

