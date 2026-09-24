/**
 * joinbench.js — The join bench: the fifth Learn instrument, drawn on canvas.
 *
 * Ligar's bench. It answers one question at two scales, which is why it is one
 * instrument and not two:
 *
 *   - a PAIR plate clamps two atoms face to face and presses them together, so
 *     you can watch what their outer shells do and where the electrons end up;
 *   - a SLAB plate holds a block of finished material, so you can hit it, heat it
 *     and put a current through it.
 *
 * It is an INSTRUMENT, not a lesson. It knows how to press two pieces together,
 * how to strike a block, how hot a block has to get before it comes apart and
 * whether a current passes through what is in the clamp right now. It knows no
 * chemistry: what any of that means, and whether an answer is right, is the
 * quest's business.
 *
 * IT NEVER INVENTS A READING (PRODUCT.md §8). Everything the bench reports is
 * derived from the declaration by a pure function — `planJoin` decides what a
 * press does from the two pieces' shells and kinds, `planSlab` decides what the
 * picture is from the block's build, and `conductionOf` decides whether a
 * current passes from the build and the state it is in. Nothing is authored
 * twice, so the picture on the screen and the answer the quest grades against
 * cannot disagree: THE HONEST PICTURE RULE, the same one the core bench is held
 * to. The one number a block is simply told is the temperature it comes apart
 * at, because that is a measurement, and the bench reports exactly the figure it
 * was given.
 *
 * Aesthetic contract (CLAUDE.md §4, §8): a phosphor aperture on a recessed
 * plate, dust-coloured, nothing blooming. A charged piece in a block is told
 * apart by a STENCILLED plus or minus and never by colour — the same rule that
 * puts a cross on a marked grain in the core bench, and the only version of
 * either instrument that survives a colour-blind player. The reserved charge
 * hues stay in the 3D chamber.
 */

/* Dust palette. Mirrors tokens.css; canvas cannot inherit a custom property. */
export const TINTS = {
  bone: { fill: '#b8afa0', rim: '#6f685d' },
  sand: { fill: '#c39a63', rim: '#7a6039' },
  iron: { fill: '#6b625a', rim: '#3b3631' },
  rust: { fill: '#9c5423', rim: '#5c3116' },
  pale: { fill: '#8f8678', rim: '#544e46' }
};

const FIELD_BG = '#0d0c0a';
const APERTURE_RIM = '#2e2a26';
const PLATE = '#6b625a';
const PHOSPHOR = '#6f8f3f';
const AMBER = '#d99423';
const ELECTRON = { fill: '#b8afa0', rim: '#6f685d' };

function escText(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Deterministic noise, so a block is packed the same way every time. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ==================================================================
   THE PURE PART

   Everything a stage is graded on comes out of here, and so does
   everything the picture draws. One implementation, so the screen and
   the answer cannot drift apart.
   ================================================================== */

/**
 * What a piece's shells amount to.
 *
 * The innermost shell holds two and every shell after it holds eight — the same
 * capacity the core bench draws its rings to, and the same one `verify:learn`
 * holds a specimen to.
 *
 * @param {{shells: number[]}} piece
 */
export function shellPlan(piece) {
  const shells = (piece?.shells || []).slice();
  const i = Math.max(0, shells.length - 1);
  const outer = shells[i] ?? 0;
  const cap = i === 0 ? 2 : 8;
  return { shells, index: i, outer, cap, room: cap - outer, full: outer >= cap };
}

/**
 * What happens when the clamps close on a pair.
 *
 * Three outcomes and nothing else:
 *   'none'     nothing holds — at least one atom has a full outer shell
 *   'transfer' one atom hands electrons over; both end up charged (ions)
 *   'share'    neither will give one up, so pairs sit between them
 *
 * `moved` and `pairs` are counts the picture draws and the quest may grade
 * against. `ratio` is how many of each it would take to use everything up,
 * which is what fixes a compound's recipe.
 *
 * @param {{left: object, right: object}} pair
 */
export function planJoin(pair) {
  const a = pair?.left;
  const b = pair?.right;
  if (!a || !b) return { type: 'none', reason: 'empty', moved: 0, pairs: 0 };

  const pa = shellPlan(a);
  const pb = shellPlan(b);

  if (pa.full || pb.full) {
    return {
      type: 'none',
      reason: 'already-full',
      moved: 0,
      pairs: 0,
      charge: { left: 0, right: 0 }
    };
  }

  const aMetal = a.kind === 'metal';
  const bMetal = b.kind === 'metal';

  if (aMetal && bMetal) {
    // Two metals both want to hand electrons away, so neither takes. The
    // bench never claims more than that; metals holding each other up is a
    // third story and no Ligar stage tells it.
    return { type: 'none', reason: 'both-give', moved: 0, pairs: 0, charge: { left: 0, right: 0 } };
  }

  if (aMetal || bMetal) {
    const giverSide = aMetal ? 'left' : 'right';
    const gp = aMetal ? pa : pb;
    const tp = aMetal ? pb : pa;
    const moved = Math.min(gp.outer, tp.room);
    // What it would take to use everything up on both sides at once.
    const step = gcd(gp.outer, tp.room);
    return {
      type: 'transfer',
      giverSide,
      moved,
      pairs: 0,
      giveCount: gp.outer,
      takeCount: tp.room,
      ratio: [tp.room / step, gp.outer / step],
      charge: giverSide === 'left'
        ? { left: moved, right: -moved }
        : { left: -moved, right: moved }
    };
  }

  const pairs = Math.min(pa.room, pb.room);
  if (pairs <= 0) {
    return { type: 'none', reason: 'already-full', moved: 0, pairs: 0, charge: { left: 0, right: 0 } };
  }
  const step = gcd(pa.room, pb.room);
  return {
    type: 'share',
    moved: 0,
    pairs,
    ratio: [pb.room / step, pa.room / step],
    charge: { left: 0, right: 0 }
  };
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) { const t = y; y = x % y; x = t; }
  return x || 1;
}

/** What a piece's shells look like after the press. */
export function shellsAfter(pair, side) {
  const piece = side === 'left' ? pair.left : pair.right;
  const plan = planJoin(pair);
  const shells = (piece.shells || []).slice();
  if (plan.type === 'share') {
    // A shared pair belongs to BOTH atoms: each one contributes one
    // electron to it and then counts the whole pair. So an outer shell of six
    // holding two pairs counts eight, which is what makes "it ended up full"
    // something the player can read off the instrument rather than be told.
    shells[shells.length - 1] += plan.pairs;
    return shells;
  }
  if (plan.type !== 'transfer') return shells;
  if (plan.giverSide === side) {
    shells[shells.length - 1] -= plan.moved;
    // A shell emptied right out stops being a shell. This is what makes "the
    // outer shell ended up full" something a player can SEE rather than be told.
    if (shells[shells.length - 1] <= 0) shells.pop();
  } else {
    shells[shells.length - 1] += plan.moved;
  }
  return shells;
}

/* ------------------------------------------------------------------
   THE PAIR PICTURE
   ------------------------------------------------------------------ */

/** Unit radii for a piece: nucleus 1, then one shell per ring. */
function unitRadius(shells) {
  return 1.55 + Math.max(0, shells.length - 1) * 1.0;
}

/**
 * Where the two pieces and their shells sit in a w x h picture.
 *
 * Solved in unit space and then scaled to fit, so a three-shell piece beside a
 * one-shell piece is drawn to the same scale as two of either — a picture whose
 * scale moved with its contents would make "bigger" mean nothing.
 *
 * @param {number} w
 * @param {number} h
 * @param {{left: object, right: object}} pair
 * @param {number} t 0 apart, 1 fully pressed
 */
export function joinGeometry(w, h, pair, t = 0) {
  const plan = planJoin(pair);
  const shellsL = t >= 1 ? shellsAfter(pair, 'left') : (pair.left.shells || []);
  const shellsR = t >= 1 ? shellsAfter(pair, 'right') : (pair.right.shells || []);
  const Ra = unitRadius(shellsL);
  const Rb = unitRadius(shellsR);

  const apartD = (Ra + Rb) * 1.20;
  let closeD = apartD;
  if (plan.type === 'share') closeD = (Ra + Rb) * 0.78;
  else if (plan.type === 'transfer') closeD = (Ra + Rb) * 1.02;

  // A pair that will not hold is pushed together and springs back, so the press
  // is something you SEE fail rather than something you are told failed.
  const ease = plan.type === 'none'
    ? Math.sin(Math.min(1, t) * Math.PI) * 0.18
    : Math.min(1, t);
  const d = plan.type === 'none'
    ? apartD * (1 - ease)
    : apartD + (closeD - apartD) * ease;

  const spanX = d + Ra + Rb;
  const spanY = Math.max(Ra, Rb) * 2;

  const pad = Math.max(8, Math.min(w, h) * 0.05);
  const availW = w - pad * 2;
  const availH = h - pad * 2 - Math.max(12, h * 0.09); // room for the code plates
  const unit = Math.max(2, Math.min(availW / spanX, availH / spanY));

  const cx = w / 2;
  const cy = h / 2 - Math.max(4, h * 0.03);
  // Keep the pair centred on the picture whatever the two radii are.
  const mid = (Ra - Rb) / 2;
  return {
    w, h, cx, cy, unit, plan,
    shells: { left: shellsL, right: shellsR },
    left: { x: cx - (d / 2 + mid) * unit, y: cy, R: Ra * unit, shells: shellsL, piece: pair.left },
    right: { x: cx + (d / 2 - mid) * unit, y: cy, R: Rb * unit, shells: shellsR, piece: pair.right },
    nucleusR: unit * 0.62,
    shellStep: unit * 1.0,
    dotR: Math.max(1.8, unit * 0.30)
  };
}

/** Radius of shell `i` around a piece drawn at scale `unit`. */
function shellRadius(g, i) {
  return g.unit * (1.55 + i * 1.0);
}

function disc(ctx, x, y, r, tint) {
  ctx.fillStyle = tint.fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = tint.rim;
  ctx.lineWidth = Math.max(0.6, r * 0.22);
  ctx.stroke();
}

/**
 * Draw one pair plate and return the hit list.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{w:number,h:number,pair:object,t:number,probe:string|null,sweep:number}} o
 * @returns {Array<{key:string,side:string,x:number,y:number,r:number}>}
 */
export function drawJoinField(ctx, o) {
  const { w, h, pair } = o;
  const t = o.t ?? 0;
  const g = joinGeometry(w, h, pair, t);
  const plan = g.plan;
  const hits = [];

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD_BG;
  ctx.fillRect(0, 0, w, h);

  /* ---- the clamps: two jaws the pieces are held in ---- */
  const jawW = Math.max(3, g.unit * 0.5);
  ctx.fillStyle = PLATE;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(2, g.cy - g.left.R * 0.55, jawW, g.left.R * 1.1);
  ctx.fillRect(w - 2 - jawW, g.cy - g.right.R * 0.55, jawW, g.right.R * 1.1);
  ctx.globalAlpha = 1;

  const joined = t >= 1 && plan.type !== 'none';

  /* ---- the join mark: two ticks closing on the contact point ---- */
  if (joined) {
    const mx = (g.left.x + g.right.x) / 2;
    const reach = Math.max(4, g.unit * 0.55);
    ctx.strokeStyle = PLATE;
    ctx.lineWidth = Math.max(1.2, g.unit * 0.16);
    ctx.beginPath();
    ctx.moveTo(mx, g.cy - reach * 2.1);
    ctx.lineTo(mx, g.cy - reach * 1.1);
    ctx.moveTo(mx, g.cy + reach * 1.1);
    ctx.lineTo(mx, g.cy + reach * 2.1);
    ctx.stroke();
  }

  const sharedPts = [];
  if (joined && plan.type === 'share') {
    // The shared pairs sit in the lens where the two outer shells cross, drawn
    // once and counted by both pieces — which is exactly the claim a covalent
    // join makes, so drawing them twice would be the instrument lying.
    const mx = (g.left.x + g.right.x) / 2;
    const colGap = g.dotR * 1.35;
    const rowGap = g.dotR * 2.5;
    const rows = plan.pairs;
    for (let r = 0; r < rows; r++) {
      const y = g.cy + (r - (rows - 1) / 2) * rowGap;
      sharedPts.push([mx - colGap, y], [mx + colGap, y]);
    }
  }

  /* ---- each atom: nucleus, shells, electrons ---- */
  for (const side of ['left', 'right']) {
    const s = g[side];
    const shells = s.shells;
    // `shellsAfter` has already counted the whole shared pairs into this
    // shell, so the dots drawn ON the ring are the ones that are not in the
    // lens: outer + pairs, minus the 2 x pairs sitting between the pieces.
    const contributed = joined && plan.type === 'share' ? plan.pairs * 2 : 0;

    // Shell circles, outermost last so it reads as the one in front.
    shells.forEach((n, i) => {
      const r = shellRadius(g, i);
      ctx.strokeStyle = i === shells.length - 1
        ? 'rgba(184, 175, 160, 0.42)'
        : 'rgba(184, 175, 160, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // The nucleus. It is drawn as a body, not as a huddle of grains: at this
    // scale the core bench already showed the player it is a speck, and this
    // bench is about what is on the OUTSIDE.
    disc(ctx, s.x, s.y, g.nucleusR, TINTS[s.piece.tint] || TINTS.bone);

    shells.forEach((n, i) => {
      const r = shellRadius(g, i);
      const own = i === shells.length - 1 ? Math.max(0, n - contributed) : n;
      for (let k = 0; k < own; k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / Math.max(1, own);
        disc(ctx, s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, g.dotR, ELECTRON);
      }
    });

    hits.push({ key: side, side, x: s.x, y: s.y, r: Math.max(s.R, g.nucleusR * 2) });

    // The code plate, stencilled under the piece. A bench that made you guess
    // which clamp held which kind would be unreadable at 375 px.
    ctx.fillStyle = o.probe === side ? AMBER : 'rgba(184, 175, 160, 0.55)';
    ctx.font = `${Math.max(8, Math.round(Math.min(w, h) * 0.055))}px "Share Tech Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(String(s.piece.code || ''), s.x, h - Math.max(5, h * 0.035));

    if (o.probe === side) {
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.R + Math.max(3, g.unit * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* ---- the shared pairs, drawn last so they sit over both shells ---- */
  for (const [x, y] of sharedPts) disc(ctx, x, y, g.dotR, ELECTRON);

  /* ---- an electron in flight, while the transfer is happening ---- */
  if (plan.type === 'transfer' && t > 0 && t < 1) {
    const from = plan.giverSide === 'left' ? g.left : g.right;
    const to = plan.giverSide === 'left' ? g.right : g.left;
    const fr = shellRadius(g, Math.max(0, (pair[plan.giverSide].shells || []).length - 1));
    const tr = shellRadius(g, Math.max(0, to.shells.length - 1));
    const x0 = from.x + (plan.giverSide === 'left' ? fr : -fr);
    const x1 = to.x + (plan.giverSide === 'left' ? -tr : tr);
    for (let k = 0; k < plan.moved; k++) {
      const off = (k - (plan.moved - 1) / 2) * g.dotR * 2.6;
      disc(ctx, x0 + (x1 - x0) * t, g.cy + off, g.dotR, ELECTRON);
    }
  }

  raster(ctx, w, h, o.sweep, g.cy - Math.max(g.left.R, g.right.R), g.cy + Math.max(g.left.R, g.right.R));

  ctx.strokeStyle = APERTURE_RIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  return hits;
}

/** Which piece a press at (px, py) landed on, or null. */
export function hitTestJoin(hits, px, py) {
  let best = null;
  let bestD = Infinity;
  for (const hit of hits || []) {
    const d = Math.hypot(px - hit.x, py - hit.y);
    if (d < Math.max(hit.r, 16) && d < bestD) { bestD = d; best = hit; }
  }
  return best;
}

/* ------------------------------------------------------------------
   THE SLAB PICTURE
   ------------------------------------------------------------------ */

/**
 * Lay out a block of finished material.
 *
 * Three builds, and the picture is the whole argument of the quest that uses
 * them, so it is computed rather than authored:
 *   'grid'     alternating charged pieces in a repeating pattern, every one
 *              joined to its neighbours
 *   'clusters' separate groups with gaps between them
 *   'web'      every piece joined on to the next, all the way across
 *
 * @param {{id: string, build: string, cols?: number, rows?: number, cluster?: number}} slab
 * @param {'intact'|'struck'|'molten'} state
 */
export function planSlab(slab, state = 'intact') {
  const rand = mulberry32(hashId(slab.id) ^ 0x704e);
  const build = slab.build;

  // A block the bench cannot see into. The stage that uses this is asking the
  // player to identify a material from how it BEHAVES, so the instrument says
  // honestly that it has resolved nothing rather than drawing a guess.
  if (slab.sealed) return { cells: [], links: [], cols: 0, rows: 0, sealed: true };
  const cols = slab.cols || (build === 'grid' ? 7 : 6);
  const rows = slab.rows || 5;
  const cells = [];
  const links = [];

  if (build === 'grid') {
    // A split runs down ONE plane, and the halves slide by one cell — which is
    // what puts like charges against like and is the whole of the stage that
    // uses it.
    const cut = Math.floor(cols / 2);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let px = (x + 0.5) / cols;
        let py = (y + 0.5) / rows;
        if (state === 'struck' && x >= cut) { px += 0.055; py += 1 / rows; }
        if (state === 'molten') {
          px = 0.08 + rand() * 0.84;
          py = 0.10 + rand() * 0.80;
        }
        cells.push({ x: px, y: py, sign: (x + y) % 2 === 0 ? 1 : -1, group: 0 });
      }
    }
    if (state === 'intact' || state === 'struck') {
      const at = (x, y) => y * cols + x;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const sameSide = (a, b) => (a < cut) === (b < cut);
          if (x + 1 < cols && (state === 'intact' || sameSide(x, x + 1))) links.push([at(x, y), at(x + 1, y)]);
          if (y + 1 < rows) links.push([at(x, y), at(x, y + 1)]);
        }
      }
    }
    return { cells, links, cols, rows };
  }

  if (build === 'clusters') {
    const per = slab.cluster || 3;
    const n = slab.groups || 8;
    for (let gi = 0; gi < n; gi++) {
      const spread = state === 'intact' ? 0.0 : (state === 'struck' ? 0.05 : 0.14);
      const gx = 0.14 + ((gi % 4) + 0.5) * 0.18 + (rand() - 0.5) * (0.04 + spread);
      const gy = 0.20 + (Math.floor(gi / 4) + 0.5) * 0.30 + (rand() - 0.5) * (0.05 + spread);
      const base = cells.length;
      for (let k = 0; k < per; k++) {
        const a = (k * 2 * Math.PI) / per + gi * 0.7;
        cells.push({
          x: gx + Math.cos(a) * 0.035,
          y: gy + Math.sin(a) * 0.055,
          sign: 0,
          group: gi
        });
        // Inside a group the joins NEVER break, on any of the three tests. That
        // is the finding the molecular block exists to make.
        if (k > 0) links.push([base, base + k]);
      }
    }
    return { cells, links, cols, rows };
  }

  // 'web': one connected piece, all the way through.
  const across = slab.cols || 7;
  const down = slab.rows || 5;
  for (let y = 0; y < down; y++) {
    for (let x = 0; x < across; x++) {
      let px = (x + 0.5) / across + (rand() - 0.5) * 0.035;
      let py = (y + 0.5) / down + (rand() - 0.5) * 0.045;
      if (state === 'molten') { px = 0.08 + rand() * 0.84; py = 0.10 + rand() * 0.80; }
      cells.push({ x: px, y: py, sign: 0, group: 0 });
    }
  }
  if (state !== 'molten') {
    const at = (x, y) => y * across + x;
    for (let y = 0; y < down; y++) {
      for (let x = 0; x < across; x++) {
        if (x + 1 < across) links.push([at(x, y), at(x + 1, y)]);
        if (y + 1 < down) links.push([at(x, y), at(x, y + 1)]);
        if (x + 1 < across && y + 1 < down && (x + y) % 2 === 0) links.push([at(x, y), at(x + 1, y + 1)]);
      }
    }
  }
  return { cells, links, cols: across, rows: down };
}

/**
 * Whether a current passes through a block in the state it is in now.
 *
 * Derived, never declared: a current needs charged pieces that are free to
 * move, so only a block built of charges conducts, and only once it is molten.
 */
export function conductionOf(slab, molten) {
  return slab.build === 'grid' && Boolean(molten);
}

/** Where the block sits in a w x h picture. */
export function slabGeometry(w, h) {
  const pad = Math.max(6, Math.min(w, h) * 0.06);
  return {
    w, h,
    x: pad, y: pad,
    bw: w - pad * 2,
    bh: h - pad * 2 - Math.max(10, h * 0.09),
    r: Math.max(2.4, Math.min(w, h) * 0.035)
  };
}

/**
 * Draw one slab plate and return the hit list.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{w:number,h:number,slab:object,state:string,current:boolean|null,
 *          temp:number|null,sweep:number}} o
 */
export function drawSlabField(ctx, o) {
  const { w, h, slab } = o;
  const g = slabGeometry(w, h);
  const layout = planSlab(slab, o.state || 'intact');
  const tint = TINTS[slab.tint] || TINTS.bone;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = FIELD_BG;
  ctx.fillRect(0, 0, w, h);

  const px = c => g.x + c.x * g.bw;
  const py = c => g.y + c.y * g.bh;

  if (layout.sealed) {
    // A cased block: a hatched mass and nothing else. The readings below it are
    // still real, because hitting it and heating it do not need a window.
    ctx.save();
    ctx.beginPath();
    ctx.rect(g.x, g.y, g.bw, g.bh);
    ctx.clip();
    ctx.fillStyle = 'rgba(107, 98, 90, 0.34)';
    ctx.fillRect(g.x, g.y, g.bw, g.bh);
    ctx.strokeStyle = 'rgba(184, 175, 160, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -g.bh; x < g.bw; x += Math.max(7, g.r * 2.4)) {
      ctx.moveTo(g.x + x, g.y + g.bh);
      ctx.lineTo(g.x + x + g.bh, g.y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = PLATE;
    ctx.lineWidth = 2;
    ctx.strokeRect(g.x, g.y, g.bw, g.bh);
  }

  /* ---- the joins between pieces ---- */
  ctx.strokeStyle = 'rgba(184, 175, 160, 0.26)';
  ctx.lineWidth = Math.max(0.8, g.r * 0.28);
  ctx.beginPath();
  for (const [i, j] of layout.links) {
    const a = layout.cells[i];
    const b = layout.cells[j];
    if (!a || !b) continue;
    ctx.moveTo(px(a), py(a));
    ctx.lineTo(px(b), py(b));
  }
  ctx.stroke();

  /* ---- the pieces ---- */
  for (const c of layout.cells) {
    const x = px(c);
    const y = py(c);
    disc(ctx, x, y, g.r, tint);
    if (c.sign !== 0) {
      // A STENCIL, NOT A COLOUR. The only version of this picture that survives
      // a colour-blind player (DESIGN.md, the Stencil Not Colour Rule).
      ctx.strokeStyle = '#0d0c0a';
      ctx.lineWidth = Math.max(1, g.r * 0.26);
      ctx.beginPath();
      ctx.moveTo(x - g.r * 0.48, y);
      ctx.lineTo(x + g.r * 0.48, y);
      if (c.sign > 0) {
        ctx.moveTo(x, y - g.r * 0.48);
        ctx.lineTo(x, y + g.r * 0.48);
      }
      ctx.stroke();
    }
  }

  /* ---- the readings the bench is showing right now ---- */
  ctx.font = `${Math.max(8, Math.round(Math.min(w, h) * 0.07))}px "Share Tech Mono", monospace`;
  ctx.textAlign = 'left';
  ctx.fillStyle = o.temp != null ? AMBER : 'rgba(184, 175, 160, 0.45)';
  ctx.fillText(o.temp != null ? `${o.temp} C` : '-- C', g.x, h - Math.max(4, h * 0.028));

  if (o.current != null) {
    ctx.textAlign = 'right';
    ctx.fillStyle = o.current ? PHOSPHOR : 'rgba(184, 175, 160, 0.45)';
    ctx.fillText(o.current ? 'CURRENT' : 'NO CURRENT', g.x + g.bw, h - Math.max(4, h * 0.028));
  }

  raster(ctx, w, h, o.sweep, g.y, g.y + g.bh);

  ctx.strokeStyle = APERTURE_RIM;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);

  return [{ key: 'slab', side: 'slab', x: g.x + g.bw / 2, y: g.y + g.bh / 2, r: Math.min(g.bw, g.bh) / 2 }];
}

/** Raster lines and the read sweep. This is a cathode instrument, not a window. */
function raster(ctx, w, h, sweep, top, bottom) {
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;

  if (sweep > 0) {
    const y = top + (1 - sweep) * (bottom - top);
    ctx.globalAlpha = 0.5 * sweep;
    ctx.fillStyle = PHOSPHOR;
    ctx.fillRect(0, y, w, 2);
    ctx.globalAlpha = 1;
  }
}

/* ==================================================================
   THE INSTRUMENT
   ================================================================== */

export class JoinBench {
  /**
   * @param {HTMLElement} host element the plates are rendered into
   * @param {{onProbe?: Function, onSelect?: Function}} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onSelect = opts.onSelect || null;

    this.plates = [];
    this.items = [];
    this.selectable = false;
    this.selected = null;
    this.probe = null;      // {plateId, side}
    this.sweep = 0;
    this.raf = null;
    this.disposed = false;

    this.onResize = () => this.layoutAll();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------------- contents ---------------- */

  /**
   * @param {Array<object>} items pair plates ({left, right}) or slab plates ({build})
   */
  setPlates(items) {
    this.items = (items || []).map(it => ({
      ...it,
      type: it.build ? 'slab' : 'pair',
      t: 0,              // how far the clamps have closed
      pressed: false,
      state: 'intact',   // slabs: intact | struck | molten
      struck: false,
      temp: null,
      current: null
    }));
    this.probe = null;
    this.selected = null;
    this.build();
  }

  itemFor(id) { return this.items.find(it => it.id === id) || null; }

  pressed(id) { return Boolean(this.itemFor(id)?.pressed); }
  struck(id) { return Boolean(this.itemFor(id)?.struck); }
  molten(id) { return this.itemFor(id)?.state === 'molten'; }
  heated(id) { return this.itemFor(id)?.temp != null; }
  tested(id) { return this.itemFor(id)?.current != null; }

  setSelectable(on) {
    this.selectable = Boolean(on);
    this.plates.forEach(pl => pl.root.classList.toggle('selectable', this.selectable));
  }

  setSelected(id) {
    this.selected = id;
    this.plates.forEach(pl => pl.root.classList.toggle('selected', pl.item.id === id));
  }

  setPlateTag(id, text) {
    const pl = this.plates.find(p => p.item.id === id);
    if (pl && pl.tagEl) {
      pl.tagEl.textContent = text || '';
      pl.tagEl.classList.toggle('lit', Boolean(text));
    }
  }

  /* ---------------- DOM ---------------- */

  build() {
    this.host.innerHTML = '';
    this.plates = [];

    // A pair plate is two pieces side by side, so it is read ACROSS and gets
    // its own column rules: three of them in a row would make the very dots a
    // stage asks you to count too small to see at 375 px.
    const anyPair = this.items.some(it => it.type === 'pair');
    const grid = document.createElement('div');
    grid.className = `scope-grid ${anyPair ? 'join-grid' : 'slab-grid'} scope-n${Math.min(this.items.length, 4)}`;
    this.host.appendChild(grid);

    this.items.forEach(item => {
      const root = document.createElement('div');
      root.className = 'scope-plate';
      root.innerHTML = `
        <div class="scope-plate-head">
          <span class="scope-plate-label">${escText(item.label)}</span>
          <span class="scope-plate-tag"></span>
        </div>
        <div class="scope-aperture ${item.type === 'slab' ? 'slab-aperture' : 'join-aperture'}"><canvas></canvas></div>
        <div class="scope-plate-note">${escText(item.note || '')}</div>
      `;
      grid.appendChild(root);

      const canvas = root.querySelector('canvas');
      const plate = {
        item, root, canvas,
        ctx: canvas.getContext('2d'),
        tagEl: root.querySelector('.scope-plate-tag'),
        hits: [],
        w: 0, h: 0
      };
      this.plates.push(plate);

      // Cleared at the START of every press (capture runs outside-in, so this
      // fires before the canvas handler below), then set by a probe that hits.
      root.addEventListener('pointerdown', () => { plate.pieceTaken = false; }, true);
      canvas.addEventListener('pointerdown', e => this.onPointer(plate, e));
      root.addEventListener('click', () => {
        /* A PRESS ON A PIECE IS NOT A PRESS ON THE PLATE.
           `pointerdown` on the canvas runs first and reports the piece; the same
           press then bubbles here as a `click` on the plate. A quest that tracks
           WHICH PIECE is selected as well as which plate had the piece wiped out
           from under it by the plate selection a few milliseconds later, every
           time — which is why "Read Atom" answered "No atom selected" on a
           piece the player had just tapped. A press that resolved to a piece is
           spent; only a press on the plate around it selects the plate. */
        if (plate.pieceTaken) { plate.pieceTaken = false; return; }
        if (this.selectable && this.onSelect) this.onSelect(item.id);
      });
    });

    this.layoutAll();
  }

  layoutAll() {
    if (this.disposed) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.plates.forEach(pl => {
      const box = pl.canvas.parentElement.getBoundingClientRect();
      pl.w = Math.max(1, Math.round(box.width));
      pl.h = Math.max(1, Math.round(box.height));
      pl.canvas.width = Math.round(pl.w * dpr);
      pl.canvas.height = Math.round(pl.h * dpr);
      pl.canvas.style.width = `${pl.w}px`;
      pl.canvas.style.height = `${pl.h}px`;
      pl.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    this.drawAll();
  }

  /* ---------------- input ---------------- */

  onPointer(plate, e) {
    const rect = plate.canvas.getBoundingClientRect();
    const hit = hitTestJoin(plate.hits, e.clientX - rect.left, e.clientY - rect.top);
    if (!hit || !this.onProbe) return;

    // Claim the click this press is about to become, so the plate handler above
    // does not undo the selection this one is making.
    plate.pieceTaken = true;

    this.probe = { plateId: plate.item.id, side: hit.side };
    this.sweep = 1;
    this.startAnim();

    const item = plate.item;
    if (item.type === 'slab') {
      this.onProbe({ plateId: item.id, plateLabel: item.label, side: 'slab', slab: item });
      return;
    }
    const piece = hit.side === 'left' ? item.left : item.right;
    this.onProbe({
      plateId: item.id,
      plateLabel: item.label,
      side: hit.side,
      piece,
      shells: item.pressed ? shellsAfter(item, hit.side) : (piece.shells || []).slice(),
      charge: item.pressed ? (planJoin(item).charge?.[hit.side] ?? 0) : 0,
      pressed: item.pressed
    });
  }

  /* ---------------- drawing ---------------- */

  drawAll() { this.plates.forEach(pl => this.draw(pl)); }

  draw(plate) {
    const { ctx, w, h, item } = plate;
    if (!w || !h) return;
    const sweep = this.probe && this.probe.plateId === item.id ? this.sweep : 0;
    plate.hits = item.type === 'slab'
      ? drawSlabField(ctx, {
        w, h, slab: item, state: item.state,
        current: item.current, temp: item.temp, sweep
      })
      : drawJoinField(ctx, {
        w, h, pair: item, t: item.t,
        probe: this.probe && this.probe.plateId === item.id ? this.probe.side : null,
        sweep
      });
  }

  /* ---------------- tools ---------------- */

  /**
   * Close the clamps on a pair.
   * @returns {Promise<object>} what `planJoin` says happened
   */
  press(id) {
    const item = this.itemFor(id);
    if (!item || item.type !== 'pair') return Promise.resolve(null);
    const plan = planJoin(item);
    if (item.pressed) return Promise.resolve(plan);

    return this.run(item, 620, () => {
      item.pressed = plan.type !== 'none';
      // A pair that would not hold ends up where it started, which is the
      // honest picture of nothing having happened.
      item.t = plan.type === 'none' ? 0 : 1;
      return plan;
    });
  }

  /** Hit a block with the hammer. */
  strike(id) {
    const item = this.itemFor(id);
    if (!item || item.type !== 'slab') return Promise.resolve(null);
    if (item.state === 'molten') {
      return Promise.resolve({ result: 'molten', build: item.build });
    }
    return this.run(item, 480, () => {
      item.struck = true;
      // A web does not break: there is no plane through it that does not cut
      // joins, so the blade stops. Nothing moves, and that is the reading.
      if (item.build !== 'web') item.state = 'struck';
      return { result: item.build === 'web' ? 'held' : item.build === 'grid' ? 'cleaved' : 'crumbled', build: item.build };
    });
  }

  /** Raise the heat until the block comes apart, and report the temperature. */
  heat(id) {
    const item = this.itemFor(id);
    if (!item || item.type !== 'slab') return Promise.resolve(null);
    if (item.state === 'molten') return Promise.resolve({ temp: item.temp, already: true });
    return this.run(item, 900, () => {
      item.state = 'molten';
      item.temp = item.melt;
      item.current = null;
      return { temp: item.melt, build: item.build };
    });
  }

  /**
   * Let a melted block set again.
   *
   * Without this the furnace is a one-way door: a player who heats a block
   * before testing it cold can never get back to the cold reading, and a stage
   * that asks for both is then unfinishable. A block that had already been
   * struck goes back to being a struck block, not a pristine one.
   */
  cool(id) {
    const item = this.itemFor(id);
    if (!item || item.type !== 'slab') return Promise.resolve(null);
    if (item.state !== 'molten') return Promise.resolve({ already: true, build: item.build });
    return this.run(item, 520, () => {
      item.state = item.struck ? 'struck' : 'intact';
      item.current = null;
      return { cooled: true, temp: item.melt, build: item.build };
    });
  }

  /** Put a current through the block as it is right now. */
  test(id) {
    const item = this.itemFor(id);
    if (!item || item.type !== 'slab') return Promise.resolve(null);
    return this.run(item, 420, () => {
      const flows = conductionOf(item, item.state === 'molten');
      item.current = flows;
      return { flows, molten: item.state === 'molten', build: item.build };
    });
  }

  /** Run a tool for `ms`, animating the clamps, and settle on what it found. */
  run(item, ms, settle) {
    const from = item.t;
    const to = item.type === 'pair' ? 1 : from;
    if (item.type === 'slab') {
      // A slab has nothing to close, so the beam sweep is the only sign the
      // instrument is working. A key that looks dead is a key nobody presses.
      this.probe = { plateId: item.id, side: 'slab' };
      this.sweep = 1;
    }
    const start = performance.now();
    item.anim = { from, to, start, ms };
    this.startAnim();
    return new Promise(resolve => {
      setTimeout(() => {
        item.anim = null;
        const out = settle();
        this.drawAll();
        resolve(out);
      }, ms);
    });
  }

  startAnim() {
    if (this.raf || this.disposed) return;
    let last = performance.now();
    const step = now => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let live = false;

      if (this.sweep > 0) { this.sweep = Math.max(0, this.sweep - dt * 1.6); live = this.sweep > 0; }

      this.items.forEach(item => {
        if (!item.anim) return;
        const p = Math.max(0, Math.min(1, (now - item.anim.start) / item.anim.ms));
        item.t = item.anim.from + (item.anim.to - item.anim.from) * p;
        live = true;
      });

      this.drawAll();
      this.raf = live ? requestAnimationFrame(step) : null;
    };
    this.raf = requestAnimationFrame(step);
  }

  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    window.removeEventListener('resize', this.onResize);
    this.host.innerHTML = '';
    this.plates = [];
  }
}
