/**
 * cutscene/plots-b.js — what happens after the Avalon arrives at Ember Reach, Mirrowen, Kettle, Teeter and Verdigris.
 *
 *   Ember Reach — the lander comes down through falling ash over rivers of lava, yet the colony beside it is dark;
 *                 inside a shelter the crew huddle at one small stove, breath fogging; the survey hand's heat camera
 *                 follows the warmth along the pipe to where it turns and dives into the ground.
 *   Mirrowen    — a grey dawn landing on the quay of a frozen canal town; an icebreaker tug rams the ice and rides up
 *                 onto it without a crack; a chip of that ice sits in a warm glove, solid, while snowflakes beside it melt.
 *   Kettle      — a night landing in the foundry yard; inside, the pour runs and the gate counters say more iron left
 *                 than ore came in; behind the foundry an unmarked hauler unloads crates of finished ingots in the dark.
 *   Teeter      — straight down over a chequerboard of salt ponds with no one on them; on the dike, the survey hand lays a
 *                 palm on the ground and every pond ripples to the same beat; through the "dead" pump house's grimy
 *                 window, machinery is running.
 *   Verdigris   — a storm landing lit by lightning; the fort's crew passes sandbags to wall off the water intake as the
 *                 green runoff rises; at the mast's footing the bolts fizz in the green water until a guy wire snaps.
 */

import {
  C, W, H, TAU, win, span, lerp, clamp01, alpha, rng, person, fifthMark, held, shake, setLight, sky, stars, skyGlow,
  sunDisc, ridge, ground, haze, clouds, brackets, heatLines, drift, block
} from './kit.js';
import { scape } from './scape.js';
import {
  camera, handheld, smooth, light, grade, cone, pool, halo, flash, bolt, rain, snow, ash, embers, fog, veil, plume,
  ripples, reflect, shimmer, craft, craftLamps, craftShadow, device, glove, darkShip, burst
} from './shot.js';
import { PROPS_B } from './worlds-b.js';

const GY = 560;
const LAMP = '240, 226, 196';
const { volcano, shelter, heatPipe, MIRR, town, canal, boat, KETTLE, foundry, ingots, counter, pond, fort, reeds } = PROPS_B;

// ================================================================= EMBER REACH: the cold colony

/** Rivers of lava across dark ground: bright channels with a cooled crust breaking on them. */
function lava(ctx, seed, clock, y0) {
  const r = rng(seed);
  for (let k = 0; k < 3; k++) {
    const yb = y0 + 20 + k * 40 + r() * 10;
    const w = 6 + k * 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const path = () => {
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 20) {
        const y = yb + Math.sin(x * 0.006 + k * 2) * 18 + Math.sin(x * 0.021 + k) * 6;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    };
    ctx.strokeStyle = 'rgba(200, 80, 30, 0.35)';
    ctx.lineWidth = w * 3;
    path(); ctx.stroke();
    ctx.strokeStyle = `rgba(236, ${130 + 30 * Math.sin(clock * 1.7 + k)}, 50, 0.95)`;
    ctx.lineWidth = w;
    path(); ctx.stroke();
    // Crust plates riding the flow.
    ctx.fillStyle = 'rgba(40, 24, 18, 0.8)';
    for (let i = 0; i < 12; i++) {
      const x = ((r() * W + clock * 8 * (k + 1)) % W);
      const y = yb + Math.sin(x * 0.006 + k * 2) * 18 + Math.sin(x * 0.021 + k) * 6;
      ctx.fillRect(x - 5, y - w * 0.3, 10 + r() * 8, w * 0.6);
    }
  }
}

const ember = [
  {
    // Down through the ash, the lander's belly lit orange from the lava below it. Beside the pad, every window is dark.
    dur: 5.2,
    paint(ctx, t, clock) {
      setLight({ x: 640, y: 700, color: '236, 110, 46', power: 1 });
      sky(ctx, [[0, '#0a0606'], [0.6, '#2a1410'], [1, '#5a2414']]);
      skyGlow(ctx, 470);
      volcano(ctx, 980, 470, clock);
      ridge(ctx, { y: 470, amp: 24, seed: 6101, color: '#140e0b', top: '#3a1e14', par: 0, rim: 0.8 });
      ctx.fillStyle = '#120c0a';
      ctx.fillRect(0, 470, W, H - 470);
      lava(ctx, 6103, clock, 480);
      for (let i = 0; i < 3; i++) shelter(ctx, 840 + i * 150, 600, 0);
      const land = span(t, 0.2, 4.4);
      const ly = lerp(80, 600, land);
      // The lava's light on the hull's underside.
      light(ctx, () => halo(ctx, 420, ly - 20, 120 * land + 30, '236, 110, 46', 0.25 * land));
      craft(ctx, 420, ly, 0.9, { tilt: lerp(-0.08, 0, land), thrust: (1 - win(t, 4.4, 4.9)) * win(t, 0.6, 1.2), clock });
      plume(ctx, 6105, 420, 600, span(t, 4.1, 5.2), win(t, 4.0, 4.3), { color: '70, 56, 50', reach: 340 });
      shimmer(ctx, 470, 620, clock, 2.2);
      embers(ctx, 6107, clock, { n: 60, y0: 640, rise: 400 });
      ash(ctx, 6109, clock, { n: 160 });
    }
  },
  {
    // Inside a shelter: the crew in blankets round one small stove, their breath showing. One points out at the pipe.
    dur: 5.4,
    paint(ctx, t, clock) {
      ctx.fillStyle = '#100c0a';
      ctx.fillRect(0, 0, W, H);
      // The curved inner wall and a frosted porthole that shows the lava's glow outside.
      ctx.fillStyle = '#1d1714';
      ctx.beginPath(); ctx.ellipse(640, GY + 40, 700, 520, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = '#3a1a10';
      ctx.beginPath(); ctx.arc(980, 260, 54, 0, TAU); ctx.fill();
      light(ctx, () => halo(ctx, 980, 260, 70, '236, 110, 46', 0.25));
      ctx.strokeStyle = '#3c3833'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(980, 260, 54, 0, TAU); ctx.stroke();
      // Frost on the inside of the glass.
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        ctx.save(); ctx.translate(980 + Math.cos(a) * 50, 260 + Math.sin(a) * 50); ctx.rotate(a + Math.PI / 2);
        ctx.strokeStyle = 'rgba(214, 224, 230, 0.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); for (let j = 0; j < 4; j++) { ctx.moveTo(0, 0); ctx.lineTo(-10 + j * 7, 16 + j * 3); } ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = '#15100d';
      ctx.fillRect(0, GY, W, H - GY);
      // The stove: a small box with a weak glow.
      ctx.fillStyle = '#2a2420';
      ctx.fillRect(610, GY - 50, 60, 50);
      const flick = 0.75 + 0.25 * Math.sin(clock * 9) * Math.sin(clock * 5.3);
      ctx.fillStyle = `rgba(229, 140, 60, ${flick})`;
      ctx.fillRect(624, GY - 34, 32, 14);
      const crew = [[480, 1], [560, 1], [740, -1], [820, -1]];
      const heads = crew.map(([x, f], i) => {
        const stand = i === 3 ? win(t, 2.6, 2.9) : 0;
        return person(ctx, x, GY, 0.66, { kind: 'cloak', pose: stand > 0.5 ? (t > 3.2 ? 'point' : 'stand') : 'crouch', f: stand > 0.5 ? 1 : f, clock }).head;
      });
      const who = person(ctx, lerp(1300, 1100, span(t, 0, 1.4)), GY, 0.72, { kind: 'hand', pose: t < 1.4 ? 'walk' : 'stand', phase: t * 7.5, f: -1, clock });
      heads.push(who.head);
      grade(ctx, '6, 4, 3', 0.45);
      light(ctx, () => pool(ctx, 640, GY - 20, 260, '229, 140, 60', 0.4 * flick, 0.6));
      // Breath in the cold air, each in its own rhythm.
      heads.forEach(([hx, hy], i) => {
        const life = (clock * 0.5 + i * 0.27) % 1;
        alpha(ctx, 0.3 * (1 - life), () => {
          ctx.fillStyle = '#d6d0c8';
          ctx.beginPath(); ctx.ellipse(hx + (i < 2 ? 14 : -14) + life * 10, hy - life * 24, 4 + life * 14, 3 + life * 8, 0, 0, TAU); ctx.fill();
        });
      });
    }
  },
  {
    // The survey hand's heat camera: warmth runs along the pipe toward the colony, and at the tap it turns down into the ground.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      ctx.fillStyle = '#060506';
      ctx.fillRect(0, 0, W, H);
      device(ctx, 140, 100, 1000, 500, 1, () => {
        // Cold ground in false colour: near black, the shelters a dull cold shape.
        const g = ctx.createLinearGradient(0, 0, 0, 500);
        g.addColorStop(0, '#0e0a14');
        g.addColorStop(1, '#1a1220');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 1000, 500);
        ctx.fillStyle = '#20182a';
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(720 + i * 110, 300, 52, 44, 0, Math.PI, TAU); ctx.fill(); }
        // The pipe: hot from the left, cold past the tap.
        const hot = ctx.createLinearGradient(0, 0, 1000, 0);
        hot.addColorStop(0, '#f0d090');
        hot.addColorStop(0.42, '#e59b24');
        hot.addColorStop(0.46, '#3a2440');
        hot.addColorStop(1, '#241a2c');
        ctx.fillStyle = hot;
        ctx.fillRect(0, 300, 1000, 14);
        // The tap, and the heat diving down from it, pulse after pulse.
        ctx.fillStyle = '#e59b24';
        ctx.fillRect(432, 306, 16, 194);
        for (let i = 0; i < 6; i++) {
          const y = 320 + ((clock * 140 + i * 40) % 200);
          ctx.fillStyle = `rgba(255, 228, 170, ${0.8 * (1 - (y - 320) / 200)})`;
          ctx.fillRect(434, y, 12, 16);
        }
        for (let i = 0; i < 8; i++) {
          const x = (clock * 160 + i * 60) % 440;
          ctx.fillStyle = 'rgba(255, 236, 196, 0.8)';
          ctx.fillRect(x, 302, 22, 10);
        }
        // Crosshair settling on the tap.
        const cx = lerp(800, 440, span(t, 0.3, 1.8));
        const cy = lerp(160, 306, span(t, 0.3, 1.8));
        ctx.strokeStyle = C.text;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy); ctx.lineTo(cx - 10, cy); ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 30, cy);
        ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 10); ctx.moveTo(cx, cy + 10); ctx.lineTo(cx, cy + 30);
        ctx.stroke();
        // The scale bar: cold to hot.
        const sc = ctx.createLinearGradient(940, 460, 940, 40);
        sc.addColorStop(0, '#1a1220'); sc.addColorStop(0.5, '#9a4a2e'); sc.addColorStop(0.8, '#e59b24'); sc.addColorStop(1, '#f0d090');
        ctx.fillStyle = sc;
        ctx.fillRect(960, 40, 14, 420);
      });
      brackets(ctx, 580, 520, 60, 150, win(t, 2.0, 2.8));
    }
  }
];

// ================================================================= MIRROWEN: the ice that holds

const DAWN = [[0, '#1a1d22'], [0.55, '#4a4e56'], [1, '#8a8a88']];

const mirrowen = [
  {
    // Grey dawn over a frozen canal town. The lander settles on the quay; the ice holds its reflection like dull glass.
    dur: 5.0,
    say: 'The Avalon settles onto the quay beside the locked supply boats.',
    paint(ctx, t, clock) {
      setLight({ x: 380, y: 210, color: '222, 222, 226', power: 0.55 });
      sky(ctx, DAWN);
      skyGlow(ctx, 470);
      sunDisc(ctx, 22);
      clouds(ctx, 7101, 9, 0, 400, clock, '40, 44, 50');
      town(ctx, -40, 400);
      fog(ctx, 7103, clock, 380, 50, { color: '170, 176, 182', a: 0.35 });
      // The canal, frozen: pale grey ice with boats stuck in it at odd angles.
      ctx.fillStyle = '#9aa2a8';
      ctx.fillRect(0, 404, W, 110);
      const land = span(t, 0.2, 4.2);
      const ly = lerp(120, 600, land);
      boat(ctx, 300, 440, false, clock);
      boat(ctx, 860, 452, false, clock);
      reflect(ctx, 404, 110, clock, { a: 0.3, tint: '120, 128, 134', ripple: 0 });
      // Cracks and scratches in the ice.
      ctx.strokeStyle = 'rgba(60, 66, 72, 0.4)'; ctx.lineWidth = 1;
      const r = rng(7105);
      ctx.beginPath(); for (let i = 0; i < 24; i++) { const x = r() * W; const y = 410 + r() * 100; ctx.moveTo(x, y); ctx.lineTo(x + 30 - r() * 60, y + r() * 8); } ctx.stroke();
      // The quay in front.
      ctx.fillStyle = '#3a3631';
      ctx.fillRect(0, 514, W, 8);
      ctx.fillStyle = '#2a2622';
      ctx.fillRect(0, 522, W, H - 522);
      craft(ctx, 640, ly, 1.0, { tilt: lerp(0.1, 0, land), thrust: (1 - win(t, 4.2, 4.7)) * win(t, 0.4, 1.0), clock });
      plume(ctx, 7107, 640, 600, span(t, 3.9, 5.0), win(t, 3.8, 4.1), { color: '214, 220, 226', reach: 420 });
      snow(ctx, 7109, clock, { n: 80, wind: -20, fall: 30, a: 0.5 });
    }
  },
  {
    // An icebreaker tug charges the ice at full steam. Its bow rides up and the ice does not crack. Picks bounce off it.
    dur: 5.6,
    say: 'Even the icebreaker tug rides up onto the barrier without leaving a crack.',
    paint(ctx, t, clock) {
      const hit = win(t, 2.3, 2.4);
      const [sx, sy] = shake(clock, held(t, 2.3, 2.8, 0.1));
      ctx.save();
      ctx.translate(sx, sy);
      scape(ctx, 0, { ...MIRR, gy: 470 }, clock);
      town(ctx, 400, 380);
      // Open black water on the right, where the tug has come from; ice from the middle leftward.
      ctx.fillStyle = '#1a2024';
      ctx.fillRect(0, 470, W, 120);
      ctx.fillStyle = '#a4acb2';
      ctx.fillRect(0, 470, 740, 120);
      ctx.strokeStyle = '#e6eaee'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(740, 470); ctx.lineTo(736, 590); ctx.stroke();
      // The tug: charges in, rides up the ice edge, hangs, slides back.
      const charge = span(t, 0, 2.3);
      const back = span(t, 3.0, 4.6);
      const tx = lerp(1300, 760, charge) + back * 120;
      const ride = hit * (1 - back);
      ctx.save();
      ctx.translate(tx, 500 - ride * 18);
      ctx.rotate(-0.12 * ride);
      ctx.fillStyle = '#2a2420';
      ctx.beginPath(); ctx.moveTo(-40, -10); ctx.lineTo(200, -10); ctx.lineTo(220, 26); ctx.lineTo(-20, 26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(40, -60, 90, 50);
      ctx.fillStyle = '#26221e'; ctx.fillRect(80, -110, 22, 50);
      ctx.fillStyle = 'rgba(229, 190, 120, 0.6)'; ctx.fillRect(50, -48, 14, 10);
      ctx.restore();
      // Black smoke from its stack, thick while it pushes.
      plume(ctx, 7111, tx + 90, 390 - ride * 18, clamp01(0.3 + t * 0.15), 0.8 - 0.4 * back, { color: '30, 28, 26', reach: 200, rise: 160 });
      // Spray of powder where the bow hits, and nothing more.
      plume(ctx, 7113, 740, 480, span(t, 2.3, 3.3), hit * (1 - win(t, 3.3, 4.0)), { color: '230, 234, 238', reach: 120, rise: 60 });
      reflect(ctx, 590, 54, clock, { a: 0.4, ripple: 3 });
      // A crew member out on the ice swings a pick; it bounces back with a chip of light.
      const swing = (clock * 1.4) % 1;
      const who = person(ctx, 420, 530, 0.62, { kind: 'local', pose: swing < 0.5 ? 'wave' : 'crouch', f: 1, clock });
      if (swing > 0.5 && swing < 0.6) burst(ctx, Math.floor(clock * 20), who.hand[0] + 10, 530, 0.8, 5);
      person(ctx, 200, 600, 0.72, { kind: 'hand', pose: 'stand', f: 1, clock });
      ctx.restore();
      snow(ctx, 7115, clock, { n: 60, wind: -20, fall: 30, a: 0.4 });
    }
  },
  {
    // A chip of the canal ice in a heated glove. Snowflakes land beside it and melt to beads. The chip stays solid.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      ctx.fillStyle = '#2a2e34';
      ctx.fillRect(0, 0, W, H);
      fog(ctx, 7121, clock, 300, 300, { color: '120, 126, 132', a: 0.5, n: 6 });
      // The glove, palm up, with its heating wires faintly warm.
      ctx.fillStyle = '#2e2a26';
      ctx.beginPath(); ctx.ellipse(640, 470, 260, 120, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(229, 140, 60, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(460, 430 + i * 22); ctx.bezierCurveTo(560, 410 + i * 22, 720, 450 + i * 22, 820, 430 + i * 22); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#26221e'; ctx.fillRect(400 + i * 110, 330 - Math.abs(i - 1.5) * 20, 70, 110); }
      // The chip: faceted, grey-white, unmelted.
      ctx.fillStyle = '#c8d0d6';
      ctx.beginPath(); ctx.moveTo(580, 470); ctx.lineTo(610, 390); ctx.lineTo(690, 380); ctx.lineTo(720, 450); ctx.lineTo(680, 488); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#9aa4ac';
      ctx.beginPath(); ctx.moveTo(690, 380); ctx.lineTo(720, 450); ctx.lineTo(680, 488); ctx.lineTo(660, 420); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(612, 396, 50, 2);
      // Snowflakes falling onto the palm turn into wet beads where they land.
      const r = rng(7123);
      for (let i = 0; i < 14; i++) {
        const x = 440 + r() * 400;
        const land = 430 + r() * 70;
        if (x > 570 && x < 730) continue;
        const start = r() * 3;
        const fall = win(t, start, start + 1.2);
        if (fall < 1) {
          ctx.fillStyle = '#e6eaee';
          ctx.fillRect(x + Math.sin(t * 3 + i) * 6, lerp(80, land, fall), 3, 3);
        } else {
          ctx.fillStyle = 'rgba(140, 150, 160, 0.8)';
          ctx.beginPath(); ctx.ellipse(x, land, 4, 2.5, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(x - 1, land - 1, 1.5, 1.5);
        }
      }
      // The wrist readout: the glove well above freezing.
      device(ctx, 960, 140, 150, 210, win(t, 1.4, 2.0), () => {
        ctx.fillStyle = '#26221e';
        ctx.fillRect(65, 20, 20, 170);
        const k = 0.72;
        ctx.fillStyle = C.amber;
        ctx.fillRect(68, 187 - 164 * k, 14, 164 * k);
        ctx.fillStyle = C.dust;
        ctx.fillRect(56, 130, 38, 2);
        ctx.font = '400 13px Quantico, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('0°', 50, 135);
      });
      brackets(ctx, 650, 434, 170, 130, win(t, 2.6, 3.4));
    }
  }
];

// ================================================================= KETTLE: the back door

const kettle = [
  {
    // Night at the foundry. The lander sets down in the yard among the ore heaps, lit by the furnace doors.
    dur: 5.0,
    paint(ctx, t, clock) {
      scape(ctx, 0, KETTLE, clock);
      foundry(ctx, 640, GY - 10, clock);
      const r = rng(8101);
      for (let i = 0; i < 30; i++) block(ctx, 120 + r() * 300, GY + 10 - r() * 6, 14 + r() * 14, '#5a4a3a', '#2a2018', '#4a3a2c');
      const land = span(t, 0.2, 4.2);
      const ly = lerp(120, GY + 30, land);
      craft(ctx, 330, ly, 0.85, { tilt: lerp(-0.1, 0, land), thrust: (1 - win(t, 4.2, 4.6)) * win(t, 0.3, 0.8), clock });
      grade(ctx, '6, 4, 3', 0.35);
      light(ctx, () => {
        pool(ctx, 820, GY + 10, 260, '229, 140, 60', 0.45);
        cone(ctx, 820, GY - 60, Math.PI * 0.55, 0.5, 260, '229, 140, 60', 0.18);
      });
      craftLamps(ctx, 330, ly, 0.85, lerp(-0.1, 0, land), 0.8);
      // Sparks spilling out of the furnace door.
      for (let i = 0; i < 18; i++) {
        const life = (clock * 1.3 + i / 18) % 1;
        const x = 820 + (i % 2 ? 1 : -1) * life * (40 + (i * 13) % 60);
        const y = GY - 40 - Math.sin(life * Math.PI) * 50 + life * 40;
        ctx.fillStyle = `rgba(255, 200, 120, ${1 - life})`;
        ctx.fillRect(x, y, 2, 2);
      }
      plume(ctx, 8103, 330, GY + 30, span(t, 3.9, 5.0), win(t, 3.8, 4.1), { color: '90, 74, 60', reach: 300 });
    }
  },
  {
    // Inside: the ladle pours. On the wall the gate counters run: forty tons of ore in, and still counting iron out.
    dur: 5.6,
    paint(ctx, t, clock) {
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, W, H);
      // The hall: columns, a gantry beam, the ladle on its hook.
      ctx.fillStyle = '#17130f';
      for (let i = 0; i < 6; i++) ctx.fillRect(60 + i * 240, 80, 30, GY - 80);
      ctx.fillStyle = '#1d1916';
      ctx.fillRect(0, 120, W, 22);
      const tilt = 0.5 + 0.1 * Math.sin(clock * 0.4);
      ctx.strokeStyle = '#3c3833'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(380, 142); ctx.lineTo(380, 240); ctx.stroke();
      ctx.save();
      ctx.translate(380, 280);
      ctx.rotate(tilt);
      ctx.fillStyle = '#2e2a26';
      ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(60, -40); ctx.lineTo(44, 50); ctx.lineTo(-44, 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f0b060';
      ctx.fillRect(-56, -42, 112, 6);
      ctx.restore();
      // The stream of iron into the moulds, and its light on everything.
      ctx.strokeStyle = '#ffd890';
      ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(430, 262); ctx.quadraticCurveTo(452, 330, 450, GY - 30); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i === 2 ? '#e5902a' : '#2a2420';
        ctx.fillRect(300 + i * 60, GY - 30, 50, 30);
      }
      light(ctx, () => {
        halo(ctx, 450, GY - 40, 260, '236, 150, 60', 0.4);
        halo(ctx, 450, 300, 120, '255, 216, 144', 0.25);
      });
      for (let i = 0; i < 30; i++) {
        const life = (clock * 1.6 + i / 30) % 1;
        const dir = (i % 7) / 3.5 - 1;
        ctx.fillStyle = `rgba(255, 220, 150, ${1 - life})`;
        ctx.fillRect(450 + dir * life * 160, GY - 30 - Math.sin(life * Math.PI) * 90 * (0.5 + (i % 3) * 0.3), 2, 2);
      }
      ctx.fillStyle = '#100d0b';
      ctx.fillRect(0, GY, W, H - GY);
      // Workers in silhouette; the survey hand looking up at the board.
      person(ctx, 250, GY, 0.66, { kind: 'local', pose: 'point', f: 1, clock });
      person(ctx, 640, GY, 0.66, { kind: 'local', pose: 'stand', f: -1, clock });
      person(ctx, lerp(1300, 940, span(t, 0, 1.6)), GY, 0.72, { kind: 'hand', pose: t < 1.6 ? 'walk' : 'stand', phase: t * 7.5, f: -1, clock });
      counter(ctx, 880, 250, 'ORE IN', '40 t', win(t, 1.4, 1.8));
      const out = Math.round(lerp(28, 50, span(t, 2.0, 4.6)));
      counter(ctx, 1060, 250, 'IRON OUT', `${out} t`, win(t, 1.7, 2.1));
      alpha(ctx, win(t, 4.6, 4.9) * (0.6 + 0.4 * Math.sin(clock * 8)), () => { ctx.strokeStyle = C.danger; ctx.lineWidth = 3; ctx.strokeRect(986, 216, 148, 68); });
      shimmer(ctx, 140, 380, clock, 2.5, 300, 600);
    }
  },
  {
    // Behind the foundry, in the dark: an unmarked hauler unloading crates of finished ingots down a back chute.
    dur: 5.0,
    say: 'objective',
    paint(ctx, t, clock) {
      scape(ctx, 0, { ...KETTLE, light: { x: 1080, y: 150, color: '196, 200, 212', power: 0.4 }, moon: [1080, 150, 28, '#8f887b', '#15130f'] }, clock);
      // The foundry's blind back wall and its chute.
      ctx.fillStyle = '#17130f';
      ctx.fillRect(0, 200, 520, GY - 200);
      ctx.fillStyle = '#26221e';
      ctx.beginPath(); ctx.moveTo(420, GY - 120); ctx.lineTo(520, GY - 160); ctx.lineTo(560, GY - 120); ctx.lineTo(460, GY - 80); ctx.closePath(); ctx.fill();
      // The hauler, no markings, low on its skids.
      ctx.fillStyle = '#0c0b0a';
      ctx.fillRect(760, GY - 110, 360, 100);
      ctx.fillRect(1060, GY - 150, 120, 140);
      ctx.fillStyle = '#26221e';
      ctx.fillRect(780, GY - 10, 320, 10);
      // Two hooded figures carry a crate from the hauler to the chute, over and over.
      const cyc = (t * 0.5) % 1;
      const cx = lerp(760, 560, cyc < 0.5 ? cyc * 2 : 2 - cyc * 2);
      const f = cyc < 0.5 ? -1 : 1;
      person(ctx, cx, GY, 0.6, { kind: 'hood', pose: 'walk', phase: t * 7, f, clock });
      person(ctx, cx + 70, GY, 0.6, { kind: 'hood', pose: 'walk', phase: t * 7 + 1.4, f, clock });
      if (cyc < 0.5) { ctx.fillStyle = '#3a3128'; ctx.fillRect(cx - 4, GY - 82, 78, 26); }
      // One crate dropped by the hauler's ramp, split open: bars with a mark on them.
      ctx.fillStyle = '#3a3128';
      ctx.fillRect(700, GY - 24, 70, 24);
      ingots(ctx, 680, GY - 4, 5);
      alpha(ctx, win(t, 2.4, 3.0), () => fifthMark(ctx, 660, GY - 34, 7, C.rust, 2));
      // The survey hand, low behind an ore heap in the foreground.
      const r = rng(8121);
      for (let i = 0; i < 20; i++) block(ctx, 240 + r() * 200, GY + 70 - r() * 14, 22 + r() * 18, '#5a4a3a', '#2a2018', '#4a3a2c');
      person(ctx, 360, GY + 70, 0.86, { kind: 'hand', pose: 'crouch', f: 1, clock });
      grade(ctx, '4, 5, 9', 0.4);
      light(ctx, () => pool(ctx, 980, GY, 200, '229, 190, 120', 0.12));
      brackets(ctx, 700, GY - 20, 120, 60, win(t, 2.8, 3.6));
    }
  }
];

// ================================================================= TEETER: the beat under the ponds

const PONDS = ['#7a9488', '#a2ae9c', '#b49c96', '#d6d0c0', '#8aa094', '#c6b8b0', '#94a29a'];

const teeter = [
  {
    // Straight down over the ponds: a chequerboard of brines, from green to rose to white crust. The lander's shadow crosses it.
    dur: 5.0,
    paint(ctx, t, clock) {
      const pan = lerp(0, 260, t / 5);
      camera(ctx, 640 + pan, 360, 1.05, () => {
        ctx.fillStyle = '#b4ab97';
        ctx.fillRect(-200, -200, W + 800, H + 400);
        const r = rng(9101);
        for (let gx = 0; gx < 9; gx++) {
          for (let gy = 0; gy < 5; gy++) {
            const x = -100 + gx * 190;
            const y = -40 + gy * 170;
            const c = PONDS[Math.floor(r() * PONDS.length)];
            ctx.fillStyle = c;
            ctx.fillRect(x, y, 176, 156);
            // Wind ripples catching the overcast light.
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let k = 0; k < 6; k++) { const yy = y + 12 + ((k * 26 + clock * 6) % 140); ctx.moveTo(x + 10, yy); ctx.lineTo(x + 166, yy); }
            ctx.stroke();
          }
        }
        // The lander from above, and its shadow offset by the soft light.
        const lx = lerp(-200, 1000, span(t, 0, 4.6));
        const ly = lerp(80, 300, span(t, 0, 4.6));
        const alt = 1 - span(t, 3.0, 4.6);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.save(); ctx.translate(lx + 40 + alt * 60, ly + 30 + alt * 40); ctx.rotate(0.35);
        ctx.fillRect(-60, -24, 120, 48); ctx.restore();
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(0.35);
        ctx.fillStyle = '#4a453e'; ctx.fillRect(-60, -24, 120, 48);
        ctx.fillStyle = '#6b625a'; ctx.fillRect(-60, -24, 120, 8);
        ctx.fillStyle = '#26221e'; ctx.fillRect(30, -10, 20, 20);
        ctx.restore();
      });
      veil(ctx, 60, 200, '230, 226, 216', 0.25);
    }
  },
  {
    // On the dike. Not a sound, nothing moving. The survey hand kneels and lays a palm on the ground: every pond ripples at once.
    dur: 5.6,
    paint(ctx, t, clock) {
      const hy = 360;
      setLight({ x: 640, y: 120, color: '236, 232, 220', power: 0.5 });
      sky(ctx, [[0, '#6a6a66'], [1, '#c8c4ba']]);
      ctx.fillStyle = '#8a8478';
      ctx.fillRect(0, hy - 6, W, 8);
      ctx.fillStyle = '#4a4e50';
      ctx.fillRect(0, hy, W, H - hy);
      // The pump house, far off down the dike.
      ctx.fillStyle = '#3a3631';
      ctx.fillRect(1010, hy - 40, 60, 40);
      ctx.fillRect(1030, hy - 64, 10, 24);
      reflect(ctx, hy + 2, 300, clock, { a: 0.75, tint: '70, 78, 80', ripple: 1 });
      // The dike runs from the viewer to the horizon.
      ctx.fillStyle = '#9a9384';
      ctx.beginPath(); ctx.moveTo(560, H); ctx.lineTo(630, hy); ctx.lineTo(650, hy); ctx.lineTo(820, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(236, 230, 216, 0.5)';
      ctx.beginPath(); ctx.moveTo(560, H); ctx.lineTo(630, hy); ctx.lineTo(634, hy); ctx.lineTo(574, H); ctx.closePath(); ctx.fill();
      // The beat: from the moment the palm goes down, rings rise on every pond together.
      const on = win(t, 2.4, 2.8);
      if (on > 0) {
        const pts = [[300, 420], [180, 560], [420, 600], [960, 430], [1100, 560], [880, 610], [520, 390], [760, 395]];
        pts.forEach(([x, y]) => ripples(ctx, x, y, clock, { n: 2, period: 0.9, r: 30 + (y - hy) * 0.4, a: 0.4 * on, flat: 0.18 }));
      }
      const kneel = span(t, 1.8, 2.4);
      person(ctx, 690, 640, 0.95, { kind: 'hand', pose: t < 1.6 ? 'walk' : 'stand', phase: t * 7.5, f: -1, clock, crouch: kneel });
    }
  },
  {
    // The "abandoned" pump house: boarded up, rusted. Through the grime on its one window, machinery turns under a lamp.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      const [qx, qy] = shake(clock, 0.12);
      ctx.save();
      ctx.translate(qx, qy);
      ctx.fillStyle = '#3a3631';
      ctx.fillRect(-20, -20, W + 40, H + 40);
      // Corrugated wall, streaked with rust.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      for (let x = 0; x < W; x += 18) ctx.fillRect(x, 0, 6, H);
      ctx.fillStyle = 'rgba(154, 74, 46, 0.25)';
      for (let i = 0; i < 12; i++) ctx.fillRect(80 + i * 100, 80 + (i % 3) * 40, 6, 200 + (i % 4) * 60);
      // The window, and inside it: a lamp, a flywheel, a piston, all running.
      ctx.save();
      ctx.beginPath(); ctx.rect(420, 180, 440, 280); ctx.clip();
      ctx.fillStyle = '#1a140e';
      ctx.fillRect(420, 180, 440, 280);
      light(ctx, () => halo(ctx, 640, 220, 260, '229, 170, 90', 0.4));
      ctx.fillStyle = '#e5b060';
      ctx.fillRect(630, 196, 20, 10);
      const a = clock * 2.6;
      ctx.strokeStyle = '#5b554c'; ctx.lineWidth = 10;
      ctx.beginPath(); ctx.arc(560, 360, 70, 0, TAU); ctx.stroke();
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(560, 360); ctx.lineTo(560 + Math.cos(a) * 66, 360 + Math.sin(a) * 66); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(560 + Math.cos(a) * 66, 360 + Math.sin(a) * 66); ctx.lineTo(760, 360 + Math.sin(a) * 20); ctx.stroke();
      ctx.fillStyle = '#6b625a';
      ctx.fillRect(740, 330 + Math.sin(a) * 20, 70, 60);
      // A hooded figure crosses behind the glass.
      const fx = lerp(380, 920, span(t, 1.6, 3.6));
      person(ctx, fx, 480, 1.0, { kind: 'hood', pose: 'walk', phase: t * 7, f: 1, clock });
      // Grime on the glass.
      const r = rng(9121);
      for (let i = 0; i < 80; i++) { ctx.fillStyle = `rgba(90, 84, 70, ${0.2 + r() * 0.3})`; ctx.fillRect(420 + r() * 440, 180 + r() * 280, 6 + r() * 30, 3 + r() * 14); }
      ctx.restore();
      ctx.strokeStyle = '#26221e'; ctx.lineWidth = 10;
      ctx.strokeRect(420, 180, 440, 280);
      ctx.beginPath(); ctx.moveTo(640, 180); ctx.lineTo(640, 460); ctx.moveTo(420, 320); ctx.lineTo(860, 320); ctx.stroke();
      // A board nailed half across it.
      ctx.save(); ctx.translate(640, 440); ctx.rotate(-0.12);
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(-300, -20, 600, 34); ctx.restore();
      ctx.restore();
      brackets(ctx, 640, 320, 440, 280, win(t, 3.2, 4.0));
    }
  }
];

// ================================================================= VERDIGRIS: the fort in the storm

const STORM = { sky: [[0, '#06080a'], [0.5, '#14181a'], [1, '#2a3024']], far: '#101410', mid: '#161a12', ground: ['#22281c', '#0c0e0a'], gy: GY, seed: 1001, farAmp: 18, midAmp: 10, light: { x: 900, y: 120, color: '180, 190, 170', power: 0.25 }, clouds: 14 };

const verdigris = [
  {
    // Rain and dark. Lightning shows the radio fort for an instant; the lander comes down through the rain, lamps cutting it.
    dur: 5.0,
    paint(ctx, t, clock) {
      const f1 = held(t, 0.7, 1.0, 0.05) * (Math.sin(t * 90) > -0.4 ? 1 : 0.3);
      const f2 = held(t, 3.7, 3.95, 0.05);
      scape(ctx, 0, STORM, clock);
      fort(ctx, 900, GY - 10, clock);
      reeds(ctx, 0, W, GY + 4, 1011, clock);
      const land = span(t, 0.3, 4.4);
      const ly = lerp(80, GY, land);
      craft(ctx, 420, ly, 0.9, { tilt: lerp(0.08, 0, land) + Math.sin(clock * 3) * 0.02, thrust: (1 - win(t, 4.4, 4.8)) * win(t, 0.5, 1.0), clock });
      grade(ctx, '3, 4, 5', 0.5 * (1 - Math.max(f1, f2)));
      craftLamps(ctx, 420, ly, 0.9, lerp(0.08, 0, land), 1);
      light(ctx, () => pool(ctx, 420, GY, 160 + 200 * land, LAMP, 0.25 * land));
      bolt(ctx, 1003, 1060, 60, GY - 300, f1);
      bolt(ctx, 1007, 180, 60, GY - 200, f2);
      flash(ctx, 0.35 * Math.max(f1, f2));
      rain(ctx, 1009, clock, { n: 320, a: 0.32, ground: GY });
    }
  },
  {
    // The fort's crew passes sandbags hand to hand to wall off the water intake. The green water climbs toward it.
    dur: 5.6,
    paint(ctx, t, clock) {
      scape(ctx, 0, STORM, clock);
      // The fort wall and the intake grate at its foot.
      ctx.fillStyle = '#1d201a';
      ctx.fillRect(0, 160, 300, GY - 160);
      ctx.fillStyle = '#0c0e0a';
      ctx.fillRect(220, GY - 60, 60, 60);
      ctx.strokeStyle = '#3c3833'; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(224 + i * 16, GY - 60); ctx.lineTo(224 + i * 16, GY); ctx.stroke(); }
      // The runoff: a green sheet coming in from the right, rain pocking it.
      const reach = lerp(1300, 520, span(t, 0, 5.6));
      const g = ctx.createLinearGradient(reach, 0, W, 0);
      g.addColorStop(0, 'rgba(120, 161, 66, 0.25)');
      g.addColorStop(0.3, 'rgba(94, 122, 58, 0.6)');
      g.addColorStop(1, 'rgba(70, 96, 44, 0.7)');
      ctx.fillStyle = g;
      ctx.fillRect(reach, GY - 4, W - reach + 20, 60);
      // The wall of sandbags, growing.
      const bags = Math.floor(lerp(2, 14, span(t, 0.4, 5.2)));
      for (let i = 0; i < bags; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        ctx.fillStyle = '#6a5a40';
        ctx.beginPath(); ctx.ellipse(330 + col * 36 + (row % 2) * 18, GY - 10 - row * 20, 20, 11, 0, 0, TAU); ctx.fill();
      }
      // The chain of crew: a bag passes from hand to hand.
      const xs = [1000, 870, 740, 610];
      const pass = (t * 1.6) % 1;
      const k = Math.floor(t * 1.6) % 3;
      xs.forEach((x, i) => person(ctx, x, GY, 0.64, { kind: i === 0 ? 'hand' : 'local', pose: i === k || i === k + 1 ? 'point' : 'stand', f: -1, clock }));
      const bx = lerp(xs[k] - 30, xs[k + 1] - 30, pass);
      ctx.fillStyle = '#6a5a40';
      ctx.beginPath(); ctx.ellipse(bx, GY - 80 - Math.sin(pass * Math.PI) * 14, 20, 11, 0, 0, TAU); ctx.fill();
      grade(ctx, '3, 4, 5', 0.35);
      const f = held(t, 2.8, 3.05, 0.04);
      flash(ctx, 0.3 * f);
      rain(ctx, 1011, clock, { n: 300, a: 0.3, ground: GY });
    }
  },
  {
    // At the mast's footing, the anchor bolts stand in green water and fizz. One gives; a guy wire whips away.
    dur: 4.8,
    say: 'objective',
    paint(ctx, t, clock) {
      const snap = win(t, 2.6, 2.7);
      const [qx, qy] = shake(clock, held(t, 2.6, 3.0, 0.05) * 0.6);
      ctx.save();
      ctx.translate(qx, qy);
      ctx.fillStyle = '#0e100c';
      ctx.fillRect(-20, -20, W + 40, H + 40);
      // The concrete footing and the pool over it.
      ctx.fillStyle = '#3a3a34';
      ctx.fillRect(260, 430, 760, 220);
      ctx.fillStyle = 'rgba(94, 122, 58, 0.75)';
      ctx.fillRect(260, 470, 760, 60);
      // Four bolts; the second thins and goes.
      for (let i = 0; i < 4; i++) {
        const x = 380 + i * 170;
        const thin = i === 1 ? lerp(1, 0.35, span(t, 0, 2.6)) : 0.75;
        const gone = i === 1 && snap > 0.5;
        ctx.fillStyle = '#5b554c';
        if (!gone) ctx.fillRect(x - 11 * thin, 380, 22 * thin, 120);
        else ctx.fillRect(x - 4, 470, 8, 30);
        ctx.fillStyle = '#6b625a';
        if (!gone) ctx.fillRect(x - 22, 380, 44, 14);
        ctx.fillStyle = 'rgba(120, 161, 66, 0.8)';
        ctx.fillRect(x - 14, 466, 28, 6);
        // Bubbles rising off the metal.
        for (let b = 0; b < 6; b++) {
          const life = (clock * 1.2 + b / 6 + i * 0.2) % 1;
          ctx.strokeStyle = `rgba(214, 226, 190, ${0.7 * (1 - life)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x + Math.sin(b * 2.3 + i) * 10, 520 - life * 50, 2 + b % 2, 0, TAU); ctx.stroke();
        }
      }
      // The guy wire: taut to the bolt, then loose and whipping up out of frame.
      ctx.strokeStyle = '#8a8274';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (snap < 0.5) { ctx.moveTo(550, 385); ctx.lineTo(1100, -40); }
      else {
        const u = span(t, 2.6, 3.4);
        ctx.moveTo(lerp(550, 900, u), lerp(385, -100, u));
        ctx.quadraticCurveTo(lerp(700, 1000, u) + Math.sin(clock * 30) * 30 * (1 - u), lerp(200, -60, u), 1100, -40);
      }
      ctx.stroke();
      burst(ctx, 1021, 550, 400, held(t, 2.6, 2.9, 0.05), 10);
      rain(ctx, 1023, clock, { n: 220, a: 0.28 });
      ctx.restore();
      brackets(ctx, 550, 450, 90, 150, win(t, 3.4, 4.1));
    }
  }
];

export const PLOTS_B = { unit05: ember, unit06: mirrowen, unit07: kettle, unit08: teeter, unit09: verdigris };
