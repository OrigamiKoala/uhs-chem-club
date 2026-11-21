/**
 * cutscene/plots-c.js — what happens after the Avalon arrives at Brinewire, Quicklight, Lodestone, Thornmere and Cinder Halo.
 *
 *   Brinewire  — the lander touches down as the marsh town's lights go out district by district; a lineworker hooks one
 *                tap off a pylon in a burst of arc light and the town comes back; pulling back, sparks wake on pylon after
 *                pylon to the horizon and the town goes dark again.
 *   Quicklight — alarms and turning beacons; the crew run past the lander away from the towers; the survey hand runs the
 *                other way and dives behind a barrier as a vent spits flame; wiping the vent grate clear of grey dust
 *                uncovers a name scratched into it.
 *   Lodestone  — down into a slot canyon; the sorting coil swings over and switches on, and every loose piece of iron
 *                leaps at it, the lander sliding on its skids; a crate of drums lifts away and drops a blinking route chip.
 *   Thornmere  — the lander cannot set down in the swamp and lowers a skiff; the survey hand poles through the mist and
 *                ducks a searchlight; at the armoured wall a pried plate shows grey metal under the plastic, and sinks.
 *   Cinder Halo— lamps out, the lander glides onto the crater rim in silence; the survey hand crawls under a sweeping
 *                searchlight as the dosimeter climbs; through the hall window, the core glows with its control rods drawn.
 */

import {
  C, W, H, TAU, win, span, lerp, clamp01, alpha, rng, person, fifthMark, held, shake, setLight, sky, stars, skyGlow,
  sunDisc, ridge, ground, haze, clouds, moon, brackets, heatLines, drift, block
} from './kit.js';
import { scape } from './scape.js';
import {
  camera, handheld, smooth, light, grade, cone, pool, halo, flash, bolt, snow, ash, embers, fog, veil, plume, ripples,
  reflect, shimmer, craft, craftLamps, craftShadow, device, glove, darkShip, burst
} from './shot.js';
import { PROPS_C } from './worlds-c.js';

const GY = 560;
const LAMP = '240, 226, 196';
const { BRINE, pylon, cable, sparks, QUICK, fuelTower, LODE, drum, CINDER, reactor, outpost } = PROPS_C;

// ================================================================= BRINEWIRE: the blackout

const MARSH_NIGHT = [[0, '#05070a'], [0.6, '#10161a'], [1, '#262a2a']];

/** The town on the horizon: a row of lit windows in districts that can go dark one at a time. `on(i)` 0..1 per district. */
function townLights(ctx, y, on) {
  const r = rng(10101);
  for (let d = 0; d < 6; d++) {
    const k = on(d);
    for (let i = 0; i < 14; i++) {
      const x = 120 + d * 180 + r() * 160;
      const yy = y - r() * 26;
      ctx.fillStyle = '#0c0e10';
      ctx.fillRect(x - 6, yy - 4, 14, y - yy + 6);
      if (r() > 0.3) { ctx.fillStyle = `rgba(229, 190, 120, ${0.85 * k})`; ctx.fillRect(x, yy, 3, 3); }
    }
    light(ctx, () => halo(ctx, 200 + d * 180, y - 6, 120, '229, 190, 120', 0.12 * k));
  }
}

/** Pylons marching off to a vanishing point at (vx, vy); `spark(i)` 0..1 lights a tap on pylon i. */
function pylonRow(ctx, vx, vy, n, clock, spark = () => 0) {
  const tops = [];
  for (let i = n - 1; i >= 0; i--) {
    const u = Math.pow(0.72, i);
    const x = lerp(vx, 1140, u);
    const y = lerp(vy, GY + 40, u);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(u, u);
    pylon(ctx, 0, 0);
    ctx.restore();
    tops.push([x, y - 220 * u, u]);
    const s = spark(i);
    if (s > 0.01) {
      sparks(ctx, x + 18 * u, y - 70 * u, clock + i, s);
      light(ctx, () => halo(ctx, x + 18 * u, y - 70 * u, 60 * u + 10, '255, 214, 150', 0.3 * s * (0.6 + 0.4 * Math.sin(clock * 30 + i))));
    }
  }
  ctx.strokeStyle = '#2a2826';
  ctx.lineWidth = 1.5;
  for (let i = 1; i < tops.length; i++) {
    const [x0, y0] = tops[i - 1];
    const [x1, y1, u] = tops[i];
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 30 * u, x1, y1); ctx.stroke();
  }
}

const brinewire = [
  {
    // The lander settles by the salt pools. As it touches down, the town on the horizon goes dark, district by district.
    dur: 5.2,
    paint(ctx, t, clock) {
      const hy = 430;
      sky(ctx, MARSH_NIGHT);
      stars(ctx, 10103, 120, clock, hy - 60);
      townLights(ctx, hy, d => 1 - win(t, 3.4 + d * 0.22, 3.5 + d * 0.22));
      ctx.fillStyle = '#16191a';
      ctx.fillRect(0, hy, W, H - hy);
      pylonRow(ctx, 360, hy, 7, clock, i => (i === 1 ? held(t, 3.0, 5.2, 0.1) : 0));
      const land = span(t, 0.2, 3.6);
      const ly = lerp(100, 600, land);
      craft(ctx, 520, ly, 0.85, { tilt: lerp(-0.08, 0, land), thrust: (1 - win(t, 3.6, 4.0)) * win(t, 0.4, 0.9), clock });
      grade(ctx, '3, 4, 6', 0.3);
      craftLamps(ctx, 520, ly, 0.85, lerp(-0.08, 0, land), 1);
      // The pools: black mirrors between the dikes.
      reflect(ctx, 610, 34, clock, { a: 0.5, ripple: 2 });
      fog(ctx, 10105, clock, hy + 30, 40, { color: '120, 126, 128', a: 0.2 });
    }
  },
  {
    // A lineworker on the pylon hooks the tap off with an insulated pole. A burst of arc light; across the marsh, the town relights.
    dur: 5.4,
    paint(ctx, t, clock) {
      const off = win(t, 2.2, 2.3);
      const arc = held(t, 2.2, 2.7, 0.05);
      const [qx, qy] = shake(clock, arc * 0.5);
      ctx.save();
      ctx.translate(qx, qy);
      sky(ctx, MARSH_NIGHT);
      stars(ctx, 10111, 100, clock, 300);
      townLights(ctx, 420, () => win(t, 2.9, 3.4));
      ctx.fillStyle = '#16191a';
      ctx.fillRect(0, 420, W, H);
      // The pylon, close, the tap box low on its leg and the lineworker strapped on above it.
      ctx.save();
      ctx.translate(760, GY + 40);
      ctx.scale(1.9, 1.9);
      pylon(ctx, 0, 0);
      ctx.restore();
      const tapX = 790;
      const tapY = GY - 100;
      // The clamp box: on the leg, then knocked off and falling into the pool.
      const fall = span(t, 2.3, 3.2);
      ctx.fillStyle = '#4a453e';
      ctx.fillRect(tapX - 13, lerp(tapY - 17, GY + 50, fall * fall), 26, 34);
      const worker = person(ctx, 820, GY - 210, 0.6, { kind: 'local', pose: t < 2.3 ? 'point' : 'stand', f: -1, clock });
      // The hot stick: from the worker's hands down to the box.
      ctx.strokeStyle = '#c4b44a';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(worker.hand[0], worker.hand[1]); ctx.lineTo(lerp(worker.hand[0], tapX + 4, span(t, 0.4, 1.9)), lerp(worker.hand[1], tapY, span(t, 0.4, 1.9))); ctx.stroke();
      person(ctx, 480, GY + 40, 0.74, { kind: 'hand', pose: 'stand', f: 1, clock });
      grade(ctx, '3, 4, 6', 0.4 * (1 - arc));
      if (!off) sparks(ctx, tapX, tapY, clock, 0.8);
      bolt(ctx, Math.floor(clock * 12), tapX, tapY - 40, tapY + 30, arc);
      flash(ctx, 0.55 * arc, '236, 232, 214');
      // Steam where the hot box hits the brine.
      plume(ctx, 10113, tapX, GY + 50, span(t, 3.1, 5.4), win(t, 3.0, 3.2), { color: '200, 204, 206', reach: 120, rise: 120 });
      ctx.restore();
    }
  },
  {
    // Pull back across the marsh: on pylon after pylon to the horizon, more taps spark. The town's lights die again.
    dur: 5.0,
    say: 'objective',
    paint(ctx, t, clock) {
      const z = lerp(1.6, 1.0, span(t, 0, 2.6));
      camera(ctx, lerp(820, 640, span(t, 0, 2.6)), lerp(470, 380, span(t, 0, 2.6)), z, () => {
        sky(ctx, MARSH_NIGHT);
        ctx.fillStyle = '#05070a';
        ctx.fillRect(-400, -400, W + 800, 400);
        stars(ctx, 10121, 140, clock, 340);
        townLights(ctx, 430, d => 1 - win(t, 2.6 + d * 0.25, 2.7 + d * 0.25));
        ctx.fillStyle = '#16191a';
        ctx.fillRect(-400, 430, W + 800, 600);
        pylonRow(ctx, 360, 430, 9, clock, i => win(t, 0.6 + (8 - i) * 0.2, 0.8 + (8 - i) * 0.2) * (i === 0 ? 0 : 1));
        grade(ctx, '3, 4, 6', 0.25);
      });
      brackets(ctx, 640, 360, 640, 220, win(t, 3.0, 3.8));
    }
  }
];

// ================================================================= QUICKLIGHT: running hot

/** A rotating warning beacon: a lamp housing with a beam turning round it. */
function beacon(ctx, x, y, clock, k = 1) {
  ctx.fillStyle = '#26221e';
  ctx.fillRect(x - 6, y, 12, 8);
  const a = clock * 4;
  const facing = Math.cos(a);
  ctx.fillStyle = `rgba(229, 155, 36, ${0.4 + 0.6 * Math.max(0, facing)})`;
  ctx.fillRect(x - 5, y - 8, 10, 8);
  light(ctx, () => cone(ctx, x, y - 4, a % TAU > Math.PI ? Math.PI : 0, 0.18, 260 * Math.abs(Math.sin(a)), '229, 155, 36', 0.18 * k));
}

/** A flame jet from a vent at (x, y), along `ang`, `len` long. */
function flare(ctx, x, y, ang, len, clock) {
  if (len <= 1) return;
  light(ctx, () => {
    cone(ctx, x, y, ang, 0.16, len, '255, 214, 150', 0.6);
    cone(ctx, x, y, ang, 0.32, len * 0.8, '236, 120, 40', 0.35);
    halo(ctx, x, y, len * 0.6, '236, 140, 60', 0.25);
  });
  for (let i = 0; i < 10; i++) {
    const u = ((clock * 3 + i / 10) % 1);
    ctx.fillStyle = `rgba(90, 80, 70, ${0.4 * u})`;
    ctx.beginPath(); ctx.arc(x + Math.cos(ang) * len * (0.6 + u * 0.6), y + Math.sin(ang) * len * (0.6 + u * 0.6) - u * 40, 10 + u * 30, 0, TAU); ctx.fill();
  }
}

const quicklight = [
  {
    // Alarms: beacons turning on the towers. The lander comes in as the crew run from the towers toward it.
    dur: 5.2,
    paint(ctx, t, clock) {
      scape(ctx, 0, QUICK, clock);
      fuelTower(ctx, 820, GY - 10, 0.92, clock);
      fuelTower(ctx, 1120, GY, 0.97, clock);
      flare(ctx, 820, GY - 330, -Math.PI / 2, 120 + 40 * Math.sin(clock * 6), clock);
      flare(ctx, 1120, GY - 320, -Math.PI / 2 - 0.2, 90 + 30 * Math.sin(clock * 7), clock);
      shimmer(ctx, 120, GY - 260, clock, 3, 700, 1250);
      const land = span(t, 0.2, 3.6);
      const ly = lerp(100, GY, land);
      craft(ctx, 300, ly, 0.85, { tilt: lerp(-0.1, 0, land), thrust: (1 - win(t, 3.6, 4.0)) * win(t, 0.4, 0.9), ramp: span(t, 4.0, 4.6), clock });
      // The crew, running from the towers toward the lander.
      for (let i = 0; i < 5; i++) {
        const x = lerp(1300 + i * 60, 520 + i * 40, span(t, 0.8 + i * 0.25, 5.2));
        person(ctx, x, GY, 0.6, { kind: 'local', pose: 'run', phase: t * 12 + i, f: -1, clock });
      }
      beacon(ctx, 820, GY - 318, clock);
      beacon(ctx, 1120, GY - 308, clock + 1.3);
    }
  },
  {
    // The survey hand runs the other way. A vent at ground level spits a jet of flame; a dive behind the barrier; then on.
    dur: 5.4,
    paint(ctx, t, clock) {
      const jet = held(t, 1.8, 3.4, 0.1);
      const [qx, qy] = shake(clock, jet * 0.6);
      ctx.save();
      ctx.translate(qx, qy);
      scape(ctx, 500, QUICK, clock);
      fuelTower(ctx, 1000, GY, 0.98, clock);
      beacon(ctx, 1000, GY - 308, clock);
      // The vent box at the foot of the tower, and the low concrete barrier in front of it.
      ctx.fillStyle = '#26221e';
      ctx.fillRect(900, GY - 50, 50, 50);
      flare(ctx, 900, GY - 30, Math.PI + 0.05, 420 * jet, clock);
      ctx.fillStyle = '#3c3833';
      ctx.fillRect(560, GY - 56, 150, 56);
      ctx.fillStyle = 'rgba(229, 155, 36, 0.6)';
      for (let i = 0; i < 5; i++) ctx.fillRect(566 + i * 30, GY - 52, 14, 6);
      // Down behind the barrier when it fires, up and running once it stops.
      let px;
      let pose;
      if (t < 1.8) { px = lerp(200, 520, span(t, 0, 1.8)); pose = 'run'; }
      else if (t < 3.6) { px = 520; pose = 'crouch'; }
      else { px = lerp(520, 860, span(t, 3.6, 5.4)); pose = 'run'; }
      person(ctx, px, GY, 0.74, { kind: 'hand', pose, phase: t * 12, f: 1, clock });
      ctx.restore();
      shimmer(ctx, GY - 120, GY + 20, clock, 3 * jet + 0.6);
    }
  },
  {
    // At the vent grate, grey dust lies in drifts. A glove wipes it away: a name has been scratched into the steel.
    dur: 5.0,
    say: 'objective',
    paint(ctx, t, clock) {
      ctx.fillStyle = '#14120f';
      ctx.fillRect(0, 0, W, H);
      // The grate: slats with heat glowing faintly through them.
      ctx.fillStyle = '#26221e';
      ctx.fillRect(240, 160, 800, 400);
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = '#0c0b09';
        ctx.fillRect(270 + i * 54, 190, 30, 340);
        ctx.fillStyle = `rgba(229, 120, 40, ${0.25 + 0.1 * Math.sin(clock * 3 + i)})`;
        ctx.fillRect(272 + i * 54, 400, 26, 130);
      }
      // The name, scratched across the plate above the slats.
      ctx.fillStyle = '#3c3833';
      ctx.fillRect(300, 196, 680, 70);
      ctx.fillStyle = '#b8afa0';
      ctx.font = '700 42px Quantico, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('— THE CATALYST', 640, 232);
      // Dust over it all, wiped away where the glove has passed.
      const wipe = lerp(260, 1000, span(t, 0.6, 2.6));
      const r = rng(11121);
      for (let i = 0; i < 900; i++) {
        const x = 240 + r() * 800;
        const y = 160 + r() * 400;
        const k = r();
        if (y < 280 && x < wipe) continue;
        ctx.fillStyle = `rgba(150, 142, 128, ${0.35 + k * 0.4})`;
        ctx.fillRect(x, y, 3 + k * 6, 2 + k * 4);
      }
      // A drift of it piled along the bottom.
      ctx.fillStyle = '#8a8274';
      ctx.beginPath(); ctx.moveTo(240, 560); ctx.quadraticCurveTo(640, 500, 1040, 560); ctx.closePath(); ctx.fill();
      glove(ctx, lerp(200, 940, span(t, 0.6, 2.6)) + 200, 760, lerp(220, 980, span(t, 0.6, 2.6)), 250 + Math.sin(t * 9) * 6, 1.2);
      brackets(ctx, 640, 232, 690, 80, win(t, 2.8, 3.6));
    }
  }
];

// ================================================================= LODESTONE: the coil

/** One side of a slot canyon: a wall of red strata, leaning in toward the top. */
function canyonWall(ctx, side, y0, y1, clock) {
  const r = rng(side > 0 ? 12101 : 12103);
  const edge = y => (side < 0 ? lerp(140, 460, (y - y0) / (y1 - y0)) : lerp(1140, 820, (y - y0) / (y1 - y0)));
  ctx.fillStyle = side < 0 ? '#3a1e12' : '#2a160e';
  ctx.beginPath();
  ctx.moveTo(side < 0 ? -400 : W + 400, y0);
  for (let y = y0; y <= y1; y += 20) ctx.lineTo(edge(y) + Math.sin(y * 0.03) * 16 + (r() - 0.5) * 10, y);
  ctx.lineTo(side < 0 ? -400 : W + 400, y1);
  ctx.closePath();
  ctx.fill();
  // Strata.
  for (let y = y0; y < y1; y += 26 + r() * 20) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(178, 88, 42, 0.25)' : 'rgba(0, 0, 0, 0.2)';
    const e = edge(y);
    ctx.fillRect(side < 0 ? -400 : e, y, side < 0 ? e + 400 : W + 400 - e, 4 + r() * 6);
  }
}

/** The sorting coil: a heavy ring magnet hanging on a cable, its lamp lit while it is on. */
function coil(ctx, x, y, on, clock) {
  ctx.strokeStyle = '#3c3833'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, y - 40); ctx.stroke();
  ctx.fillStyle = '#2e2a26';
  ctx.beginPath(); ctx.ellipse(x, y, 110, 34, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4a3a2a';
  ctx.beginPath(); ctx.ellipse(x, y - 6, 100, 26, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#a0603a'; ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(x, y - 6, 96 - i * 2, 24 - i * 0.5, 0, 0, TAU); ctx.stroke(); }
  ctx.fillStyle = on > 0.5 ? C.amber : '#3c3833';
  ctx.fillRect(x - 5, y - 46, 10, 8);
  // The hum of the field, as faint arcs under it.
  if (on > 0.01) {
    ctx.strokeStyle = `rgba(229, 190, 120, ${0.2 * on})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const k = ((clock * 2 + i / 3) % 1);
      ctx.beginPath(); ctx.ellipse(x, y + 20 + k * 120, 120 + k * 80, 20 + k * 20, 0, 0, Math.PI); ctx.stroke();
    }
  }
}

const lodestone = [
  {
    // Down into the slot canyon, walls of red rock rising past the canopy, a thin strip of sky above.
    dur: 5.2,
    paint(ctx, t, clock) {
      const cy = lerp(-420, 360, span(t, 0.2, 4.6));
      camera(ctx, 640, cy, 1, () => {
        const g = ctx.createLinearGradient(0, -900, 0, GY);
        g.addColorStop(0, '#d6844a');
        g.addColorStop(0.4, '#7a3a1e');
        g.addColorStop(1, '#1a0e08');
        ctx.fillStyle = g;
        ctx.fillRect(-400, -1000, W + 800, 1700);
        light(ctx, () => cone(ctx, 700, -900, Math.PI * 0.5 + 0.1, 0.12, 1500, '244, 140, 76', 0.12));
        canyonWall(ctx, -1, -900, GY, clock);
        canyonWall(ctx, 1, -900, GY, clock);
        ctx.fillStyle = '#1a100a';
        ctx.fillRect(-400, GY, W + 800, 400);
        ctx.fillStyle = '#3c3833';
        ctx.fillRect(-400, GY + 30, W + 800, 6);
        for (let i = 0; i < 4; i++) drum(ctx, 820 + i * 40, GY, i % 2);
        const ly = lerp(-700, GY, span(t, 0, 4.8));
        craft(ctx, 600, ly, 0.85, { tilt: Math.sin(t * 2) * 0.04, thrust: (1 - win(t, 4.7, 5.1)) * 0.8, clock });
        drift(ctx, 12105, 40, clock, { color: '200, 140, 100', a: 0.2, vx: 10, vy: -8, y0: -900, y1: GY });
      });
    }
  },
  {
    // The coil swings overhead and switches on. Every loose bit of iron leaps up at it; the lander slides on its skids.
    dur: 5.6,
    paint(ctx, t, clock) {
      const on = held(t, 1.4, 4.2, 0.15);
      const [qx, qy] = shake(clock, on * 0.35);
      ctx.save();
      ctx.translate(qx, qy);
      scape(ctx, 0, { ...LODE, farAmp: 220, midAmp: 90 }, clock);
      ctx.fillStyle = '#1a100a';
      ctx.fillRect(0, GY, W, H);
      const cx = lerp(1400, 760, span(t, 0, 1.4));
      const cyy = 230;
      // The lander dragged toward it a little, rocking.
      const pull = span(t, 1.6, 3.6) * (1 - span(t, 4.2, 4.6) * 0.3);
      craft(ctx, 260 + pull * 70, GY, 0.85, { tilt: on * 0.05 * Math.sin(clock * 14), ramp: 1, clock });
      // Scrap on the ground: bolts and plates that fly up into the coil while it is on and fall when it is off.
      const r = rng(12111);
      for (let i = 0; i < 40; i++) {
        const x0 = 400 + r() * 760;
        const delay = r() * 0.6;
        const up = span(t, 1.5 + delay, 2.2 + delay) * (1 - span(t, 4.2, 4.6));
        const tx = cx + (r() - 0.5) * 160;
        const x = lerp(x0, tx, up);
        const y = lerp(GY - 4, cyy + 30 + r() * 10, up * up);
        ctx.fillStyle = r() > 0.5 ? '#5b554c' : '#3c3833';
        ctx.fillRect(x, y, 5 + r() * 8, 3 + r() * 4);
      }
      coil(ctx, cx, cyy, on, clock);
      // The survey hand, down on one knee, holding the rail as the tools tear off the belt.
      person(ctx, 640, GY, 0.74, { kind: 'hand', pose: on > 0.5 ? 'crouch' : 'stand', f: 1, clock });
      const w = span(t, 1.8, 2.6) * (1 - span(t, 4.2, 4.6));
      ctx.fillStyle = '#8f887b';
      ctx.fillRect(lerp(650, cx - 30, w), lerp(GY - 50, cyy + 34, w * w), 18, 5);
      ctx.restore();
    }
  },
  {
    // A crate of sorted drums lifts out of the canyon on its sled. Something falls from it: a chip, blinking a route.
    dur: 5.0,
    say: 'objective',
    paint(ctx, t, clock) {
      scape(ctx, 0, { ...LODE, farAmp: 220, midAmp: 90 }, clock);
      ctx.fillStyle = '#1a100a';
      ctx.fillRect(0, GY, W, H);
      // The sled climbing away with its crate, burners under it.
      const up = span(t, 0, 3.4);
      const sx = lerp(760, 980, up);
      const sy = lerp(GY - 20, 60, up);
      ctx.fillStyle = '#3a2e22';
      ctx.fillRect(sx - 70, sy - 70, 140, 70);
      ctx.fillStyle = '#26221e';
      ctx.fillRect(sx - 90, sy, 180, 12);
      light(ctx, () => { cone(ctx, sx - 50, sy + 12, Math.PI / 2, 0.1, 80, '255, 214, 150', 0.5); cone(ctx, sx + 50, sy + 12, Math.PI / 2, 0.1, 80, '255, 214, 150', 0.5); });
      // The chip: drops, bounces once, lies blinking.
      const fall = win(t, 0.6, 1.4);
      const cx = lerp(800, 700, fall);
      const cy = fall < 1 ? lerp(GY - 140, GY - 6, fall * fall) : GY - 6 - Math.abs(Math.sin(win(t, 1.4, 1.8) * Math.PI)) * 16;
      ctx.fillStyle = '#26221e';
      ctx.fillRect(cx - 12, cy - 6, 24, 8);
      ctx.fillStyle = Math.sin(clock * 6) > 0 ? C.amber : '#5b554c';
      ctx.fillRect(cx + 4, cy - 5, 4, 3);
      person(ctx, lerp(500, 640, span(t, 1.2, 2.4)), GY, 0.74, { kind: 'hand', pose: t < 2.4 ? 'walk' : 'crouch', phase: t * 7.5, f: 1, clock });
      // Its route, read on the wrist: this canyon, a string of jumps, and an end point off the charts we carry.
      device(ctx, 860, 120, 300, 180, win(t, 2.6, 3.2), () => {
        const r = rng(12121);
        for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(220, 214, 204, 0.4)'; ctx.fillRect(r() * 300, r() * 180, 1.5, 1.5); }
        const pts = [[30, 150], [90, 110], [150, 120], [210, 70], [268, 34]];
        const k = span(t, 3.0, 4.4);
        ctx.strokeStyle = C.amber;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        pts.forEach(([x, y], i) => { if (i / (pts.length - 1) <= k + 0.01) { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.amber;
        ctx.fillRect(26, 146, 8, 8);
        if (k > 0.98) { ctx.strokeStyle = C.amber; ctx.beginPath(); ctx.arc(268, 34, 9, 0, TAU); ctx.stroke(); }
      });
    }
  }
];

// ================================================================= THORNMERE: under the plastic

/** A dead tree standing in the water, moss hanging off its branches. */
function deadTree(ctx, x, y, s, seed) {
  const r = rng(seed);
  ctx.strokeStyle = '#141612';
  ctx.lineWidth = 10 * s;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6 * s, y - 300 * s); ctx.stroke();
  ctx.lineWidth = 4 * s;
  for (let i = 0; i < 5; i++) {
    const by = y - (120 + i * 40) * s;
    const dir = i % 2 ? 1 : -1;
    const ex = x + dir * (60 + r() * 50) * s;
    const ey = by - (20 + r() * 40) * s;
    ctx.beginPath(); ctx.moveTo(x + 3 * s, by); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = 'rgba(60, 66, 50, 0.7)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const mx = lerp(x, ex, k / 6); const my = lerp(by, ey, k / 6); ctx.moveTo(mx, my); ctx.lineTo(mx + 2, my + (20 + r() * 40) * s); }
    ctx.stroke();
    ctx.strokeStyle = '#141612';
    ctx.lineWidth = 4 * s;
  }
}

/** The skiff: a flat boat at (x, y). */
function skiff(ctx, x, y) {
  ctx.fillStyle = '#2a2420';
  ctx.beginPath(); ctx.moveTo(x - 90, y - 10); ctx.lineTo(x + 100, y - 10); ctx.lineTo(x + 80, y + 4); ctx.lineTo(x - 80, y + 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(214, 196, 168, 0.15)';
  ctx.fillRect(x - 90, y - 10, 190, 2);
}

const SWAMP = [[0, '#0a0c0a'], [0.6, '#1e241c'], [1, '#3a4236']];

const thornmere = [
  {
    // No ground firm enough to land on. The lander hangs over the black water and lowers a skiff on a line; the survey hand climbs down.
    dur: 5.2,
    paint(ctx, t, clock) {
      const wy = 470;
      sky(ctx, SWAMP);
      fog(ctx, 13101, clock, 380, 80, { color: '150, 160, 140', a: 0.35 });
      deadTree(ctx, 160, wy, 1.1, 13103);
      deadTree(ctx, 1100, wy, 0.9, 13105);
      deadTree(ctx, 880, wy, 0.6, 13107);
      const ly = 230 + Math.sin(clock * 1.1) * 5;
      craft(ctx, 560, ly, 0.85, { thrust: 0.5, clock });
      // The skiff on its line, lowered to the water, then the survey hand down the line onto it.
      const lower = span(t, 0.4, 2.4);
      const by = lerp(ly + 20, wy, lower);
      ctx.strokeStyle = '#8f887b'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(530, ly); ctx.lineTo(530, by - 10); ctx.moveTo(600, ly); ctx.lineTo(600, by - 10); ctx.stroke();
      skiff(ctx, 565, by);
      const climb = span(t, 2.6, 4.6);
      person(ctx, 580, lerp(ly + 40, wy - 10, climb), 0.6, { kind: 'hand', pose: climb < 1 ? 'stand' : 'crouch', f: 1, clock });
      ctx.fillStyle = '#0c0f0c';
      ctx.fillRect(0, wy, W, H - wy);
      reflect(ctx, wy, 180, clock, { a: 0.6, tint: '10, 14, 10', ripple: 2 });
      // The burners' downdraft roughening the water under it.
      ripples(ctx, 565, wy + 10, clock, { n: 4, period: 1.0, r: 200, a: 0.3 });
      fog(ctx, 13109, clock, wy, 60, { color: '150, 160, 140', a: 0.3, speed: 14 });
    }
  },
  {
    // Poling through the mist. The armoured outpost looms; its searchlight crosses the water and the survey hand drops flat.
    dur: 5.6,
    paint(ctx, t, clock) {
      const wy = 470;
      sky(ctx, SWAMP);
      alpha(ctx, 0.6, () => outpost(ctx, 760, wy, 12));
      person(ctx, 820, wy - 200, 0.4, { kind: 'hood', pose: 'stand', f: -1, clock });
      person(ctx, 1040, wy - 200, 0.4, { kind: 'hood', pose: 'stand', f: -1, clock });
      fog(ctx, 13111, clock, 400, 70, { color: '150, 160, 140', a: 0.4 });
      deadTree(ctx, 300, wy, 1.0, 13113);
      ctx.fillStyle = '#0c0f0c';
      ctx.fillRect(0, wy, W, H - wy);
      reflect(ctx, wy, 180, clock, { a: 0.55, tint: '10, 14, 10', ripple: 2 });
      const bx = lerp(80, 420, span(t, 0, 5.6));
      ripples(ctx, bx - 80, wy + 34, clock, { n: 3, period: 1.4, r: 90, a: 0.25 });
      skiff(ctx, bx, wy + 30);
      const duck = held(t, 2.2, 4.0, 0.25);
      const who = person(ctx, bx + 10, wy + 20, 0.66, { kind: 'hand', pose: duck > 0.5 ? 'kneel' : 'stand', f: 1, clock, crouch: duck });
      // The pole.
      if (duck < 0.5) {
        ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(who.hand[0] - 20, who.hand[1] - 60); ctx.lineTo(who.hand[0] - 70, wy + 60); ctx.stroke();
      }
      grade(ctx, '3, 5, 3', 0.35);
      // The searchlight from the wall: it crosses the water, passes over the skiff, and moves on.
      const ang = lerp(Math.PI * 0.62, Math.PI * 0.95, span(t, 1.6, 4.6));
      light(ctx, () => {
        cone(ctx, 1000, wy - 240, ang, 0.06, 1100, LAMP, 0.22);
        const hx = 1000 + Math.cos(ang) / Math.sin(ang) * 250;
        pool(ctx, hx, wy + 30, 120, LAMP, 0.3);
      });
      fog(ctx, 13115, clock, wy + 10, 50, { color: '150, 160, 140', a: 0.3, speed: 16 });
    }
  },
  {
    // At the wall's waterline, a pry bar under a plate's edge. Behind the plastic: dull grey metal. The piece drops and sinks like a stone.
    dur: 5.0,
    say: 'objective',
    paint(ctx, t, clock) {
      const wy = 500;
      ctx.fillStyle = '#121410';
      ctx.fillRect(0, 0, W, H);
      // The plated wall, close.
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
          const x = 120 + i * 210;
          const y = 90 + j * 140;
          ctx.fillStyle = '#4a4a40';
          ctx.fillRect(x, y, 200, 132);
          ctx.fillStyle = 'rgba(255, 250, 240, 0.08)';
          ctx.fillRect(x, y, 200, 4);
          ctx.fillStyle = '#2a2a24';
          [[10, 10], [184, 10], [10, 116], [184, 116]].forEach(([bx, by]) => ctx.fillRect(x + bx, y + by, 6, 6));
        }
      }
      // One plate peeling back from the bottom: plastic outside, grey metal sheet behind it.
      const peel = span(t, 0.4, 2.2);
      ctx.fillStyle = '#5e6064';
      ctx.fillRect(540, 370, 200, 132);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(540, 370, 200, 6);
      ctx.save();
      ctx.translate(540, 370);
      ctx.transform(1, 0, 0, 1 - peel * 0.8, 0, 0);
      ctx.fillStyle = '#4a4a40';
      ctx.fillRect(0, 0, 200, 132);
      ctx.restore();
      // The pry bar, and the glove on it.
      ctx.strokeStyle = '#8f887b'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(660, 370 + 132 * (1 - peel * 0.8)); ctx.lineTo(800, 620); ctx.stroke();
      glove(ctx, 1000, 760, 800, 610, 1.1);
      // A broken corner of the metal sheet falls into the water and is gone at once.
      const drop = win(t, 2.6, 3.0);
      if (t > 2.6) {
        ctx.fillStyle = '#5e6064';
        const y = lerp(470, wy + 160, drop * drop);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, wy + (drop < 1 ? 200 : 0)); ctx.clip();
        if (drop < 1) ctx.fillRect(700, y, 30, 22);
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(12, 15, 12, 0.92)';
      ctx.fillRect(0, wy, W, H - wy);
      reflect(ctx, wy, 140, clock, { a: 0.35, tint: '10, 14, 10', ripple: 3 });
      ripples(ctx, 715, wy + 6, clock - 2.9, { n: 3, period: 1.2, r: 140, a: 0.45 * win(t, 2.8, 3.0) });
      for (let b = 0; b < 6 && t > 2.8; b++) {
        const life = ((t - 2.8) * 0.8 + b / 6) % 1;
        ctx.strokeStyle = `rgba(200, 210, 190, ${0.5 * (1 - life)})`;
        ctx.beginPath(); ctx.arc(715 + Math.sin(b * 2) * 8, wy + 120 - life * 110, 2, 0, TAU); ctx.stroke();
      }
      brackets(ctx, 640, 436, 200, 132, win(t, 2.0, 2.8));
    }
  }
];

// ================================================================= CINDER HALO: the core

const CRATER = [[0, '#030306'], [0.6, '#0c0b10'], [1, '#1e1a1c']];

/** The crater below the rim: the reactor across it, its work lamps, and haulers coming in to land with drums. */
function crater(ctx, clock, t) {
  setLight({ x: 1000, y: 140, color: '196, 200, 212', power: 0.4 });
  sky(ctx, CRATER);
  stars(ctx, 14101, 200, clock, 380);
  moon(ctx, 1000, 140, 30, '#8f887b', '#15130f');
  ridge(ctx, { y: 380, amp: 40, seed: 14103, color: '#0e0c0c', top: '#2a2624', par: 0, rim: 0.6 });
  ctx.fillStyle = '#0e0c0c';
  ctx.fillRect(0, 380, W, H);
  ctx.save();
  ctx.translate(520, 470);
  ctx.scale(0.6, 0.6);
  reactor(ctx, 0, 0, clock, 1);
  ctx.restore();
  light(ctx, () => { pool(ctx, 720, 474, 260, '229, 190, 120', 0.2); halo(ctx, 700, 450, 80, '229, 190, 120', 0.1); });
  // Haulers dropping in over the hall, one after another.
  for (let i = 0; i < 2; i++) {
    const u = ((t * 0.18 + i * 0.5) % 1);
    const hx = lerp(1300, 800, u);
    const hy = lerp(200, 440, u);
    ctx.fillStyle = '#0a0909';
    ctx.fillRect(hx - 40, hy - 12, 80, 20);
    ctx.fillStyle = 'rgba(229, 155, 36, 0.8)';
    ctx.fillRect(hx - 38, hy + 8, 3, 3);
  }
}

/** The wrist dosimeter: bars that fill as the dose rate climbs. */
function dosimeter(ctx, x, y, k, a) {
  device(ctx, x, y, 140, 60, a, () => {
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = i / 10 < k ? (i > 6 ? C.danger : C.amber) : '#26221e';
      ctx.fillRect(10 + i * 12, 50 - i * 4, 8, 4 + i * 4);
    }
  });
}

const cinderhalo = [
  {
    // Lamps out, burners cold, the lander glides onto the crater rim under the moon. Across the crater, the reactor is awake.
    dur: 5.4,
    paint(ctx, t, clock) {
      crater(ctx, clock, t);
      // The rim in the foreground.
      ctx.fillStyle = '#1a1716';
      ctx.beginPath(); ctx.moveTo(0, 560); ctx.quadraticCurveTo(640, 520, W, 580); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(196, 200, 212, 0.25)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 560); ctx.quadraticCurveTo(640, 520, W, 580); ctx.stroke();
      const u = span(t, 0, 4.6);
      const lx = lerp(-200, 300, u);
      const ly = lerp(260, 552, Math.pow(u, 1.3));
      // One short breath of thrust at touchdown; nothing else lights it.
      craft(ctx, lx, ly, 0.75, { tilt: lerp(0.06, 0, u), thrust: held(t, 4.2, 4.7, 0.1) * 0.4, clock });
      plume(ctx, 14105, 300, 552, span(t, 4.4, 5.4), win(t, 4.3, 4.6) * 0.6, { color: '90, 84, 80', reach: 200 });
      ash(ctx, 14107, clock, { n: 60, a: 0.25, color: '150, 146, 140' });
    }
  },
  {
    // Crawling along the rim. A searchlight from the hall sweeps up the slope; the survey hand lies still as it passes. The dosimeter climbs.
    dur: 5.6,
    paint(ctx, t, clock) {
      camera(ctx, 640, 380, 1.25, () => {
        crater(ctx, clock, t);
        ctx.fillStyle = '#1a1716';
        ctx.beginPath(); ctx.moveTo(0, 540); ctx.quadraticCurveTo(640, 500, W, 520); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        const flat = held(t, 1.8, 3.8, 0.3);
        const px = lerp(260, 560, span(t, 0, 1.8)) + span(t, 3.8, 5.6) * 220;
        person(ctx, px, 524, 0.5, { kind: 'hand', pose: flat > 0.5 ? 'kneel' : 'walk', phase: t * 5, f: 1, clock, crouch: 0.6 + 0.4 * flat });
        grade(ctx, '3, 3, 6', 0.3);
        const ang = lerp(-Math.PI * 0.95, -Math.PI * 0.55, span(t, 1.2, 4.6));
        light(ctx, () => cone(ctx, 700, 450, ang, 0.05, 700, LAMP, 0.22));
      });
      dosimeter(ctx, 1060, 120, lerp(0.2, 0.7, span(t, 0.5, 5.4)), 1);
    }
  },
  {
    // Through the hall's window: the core under water, glowing; its control rods pulled all the way up. A hooded figure logs it.
    dur: 5.0,
    say: 'objective',
    paint(ctx, t, clock) {
      ctx.fillStyle = '#0a0909';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath(); ctx.rect(200, 120, 880, 440); ctx.clip();
      ctx.fillStyle = '#121014';
      ctx.fillRect(200, 120, 880, 440);
      // The pool, and the core's pale glow through the water.
      ctx.fillStyle = '#16182a';
      ctx.fillRect(360, 360, 560, 200);
      light(ctx, () => { halo(ctx, 640, 470, 240, '150, 160, 220', 0.35 + 0.05 * Math.sin(clock * 2)); pool(ctx, 640, 360, 300, '150, 160, 220', 0.25, 0.2); });
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(560, 430, 160, 100);
      ctx.strokeStyle = 'rgba(190, 200, 236, 0.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(380 + i * 4, 364 + i * 6 + Math.sin(clock + i) * 2); ctx.lineTo(900 - i * 4, 364 + i * 6 + Math.sin(clock * 1.3 + i) * 2); ctx.stroke(); }
      // The control rods, drawn up out of the core on their drives, almost to the ceiling.
      for (let i = 0; i < 5; i++) {
        const x = 580 + i * 30;
        ctx.fillStyle = '#5b554c';
        ctx.fillRect(x - 5, 160, 10, 240 - i % 2 * 10);
        ctx.fillStyle = '#26221e';
        ctx.fillRect(x - 9, 140, 18, 24);
      }
      ctx.fillStyle = '#1d1b18';
      ctx.fillRect(520, 130, 240, 14);
      // At the desk on the right, a hooded figure writes in a log under a lamp.
      ctx.fillStyle = '#26221e';
      ctx.fillRect(900, 470, 150, 16);
      light(ctx, () => halo(ctx, 980, 460, 70, '229, 190, 120', 0.3));
      person(ctx, 1000, 560, 0.7, { kind: 'hood', pose: Math.sin(clock * 2) > 0 ? 'point' : 'stand', f: -1, clock });
      ctx.fillStyle = '#cfc8b8';
      ctx.fillRect(930, 462, 40, 8);
      ctx.restore();
      // Window frame and grime.
      ctx.strokeStyle = '#26221e'; ctx.lineWidth = 14;
      ctx.strokeRect(200, 120, 880, 440);
      ctx.beginPath(); ctx.moveTo(640, 120); ctx.lineTo(640, 560); ctx.stroke();
      dosimeter(ctx, 1104, 470, lerp(0.7, 0.95, span(t, 0, 3)), 1);
      brackets(ctx, 640, 280, 200, 280, win(t, 2.2, 3.0));
    }
  }
];

export const PLOTS_C = { unit10: brinewire, unit11: quicklight, unit12: lodestone, unit13: thornmere, unit14: cinderhalo };
