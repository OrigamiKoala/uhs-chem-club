/**
 * catalogue3d.js — The catalogue board, built as a card index instead of drawn
 * as one. This is `catalogue.js` in three dimensions, for Tallow at T4.
 *
 * WHY THIS ONE IS DIFFERENT FROM THE OTHER BUILT BENCHES.
 *
 * The rule the sampler scope and the core bench follow is that a built
 * instrument shows a FLAT PICTURE: both of them resolve an image of something
 * too small to see, and an image staged as solid bodies cannot be counted,
 * because pieces at the back hide behind pieces at the front. A catalogue is
 * the opposite case in every respect. It resolves nothing. It is a drawer of
 * cards and a board of slots — objects at arm's length, the size of a hand,
 * that a filing clerk picks up and puts down. There is no picture of a card;
 * there is a card. So this instrument is built the whole way: the board is a
 * raked plate bolted across the back of the bench with milled slots cut into
 * it, the drawer is a tray on the plate in front of it with the loose cards
 * lying in it, and filing one is reaching over and moving it.
 *
 * IT IS STILL TWO TAPS, NOT A DRAG. Take a card, then tap the slot — the same
 * two gestures the drawn board uses, for the same reason: a drag across a grid
 * of small targets is the one gesture a student on a phone cannot make
 * reliably, and dragging a 3D body through a 3D scene with a one-button mouse
 * is worse. A card in the hand lifts off the tray, turns face-on and lights its
 * edge, so what you are holding is never in doubt.
 *
 * THE TWO BOARDS CANNOT DISAGREE. Every decision about what is where —
 * `readEntry`, which rows carry slots, what a slot holds, what a tap does to
 * the hand — is imported from `catalogue.js` or written against the identical
 * state, and the public API is the same method for the same call. A quest
 * module changed by one import line and not one character of copy.
 *
 * It knows no chemistry. What is printed on a card, what order the cards belong
 * in and whether a layout is right are all the quest's business; the board will
 * file any card in any slot and never says a word about it.
 */

import * as THREE from 'three';
import { readEntry } from './catalogue.js';
import { BenchViewer3D, engravedPlaque, AMBER, PLATE_RIM } from './bench3d.js';
import { benchHost } from './bench-host.js';

/* ---------------------------------------------------------------- metrics */

/**
 * One card's face, in metres. A catalogue card is a CARD — the size of the
 * thing a filing clerk holds, not the size of a dinner plate. It was drawn
 * hand-sized once, and eight columns of three rows of hand-sized cards made a
 * board 1.2 m tall that leaned back through the bench's own back lip and into
 * the lean-to behind it. `verify:bench` measures every pair and found it.
 */
const CARD_W = 0.125;
const CARD_H = 0.165;
const CARD_T = 0.006;

/** The board's slot pitch. A slot is a card plus the milling round it. */
const SLOT_W = CARD_W + 0.027;
const SLOT_H = CARD_H + 0.023;

/**
 * How far the board is laid back. It is a drafting board, not a wall: a player
 * standing at a bench looks DOWN at it, so a board stood upright is read in
 * foreshortening and a board laid flat is not read at all. 35 degrees off
 * vertical puts its face square to the eye and keeps its top edge below head
 * height, which is what a board on a bench actually does.
 */
const BOARD_RAKE = -0.611;

/**
 * Where the board's bottom edge meets the plate, and how it is stood.
 *
 * It stands ON its own foot rail rather than on the bench, which is both what
 * an easel does and what keeps it off the weld bead running down the middle of
 * the plate — 30 mm of steel that `verify:bench` found the board's lower edge
 * sitting in.
 */
const BOARD_FOOT_Z = 0.17;
const BOARD_FOOT_Y = 0.034;

/** The drawer tray, out on the plate where a hand reaches. */
const DRAWER_PITCH = CARD_W + 0.022;

/** The bench's working surface in the instrument's local frame. */
const PLATE_Y = 0.895;

/* ------------------------------------------------------------------ faces */

/**
 * A card's printed face: code, name, and the outer-shell pips under it.
 *
 * Printed, not lit. A card is card stock with ink on it, so the face is drawn
 * the way the plate shop draws a legend — dark ground, engraved mono, a shadow
 * line under each glyph — and the only thing that is ever allowed to go amber
 * is a card that has been picked up, because that is a signal (CLAUDE.md §1).
 */
function cardFace(card, opts = {}) {
  const { held = false, tag = '', fixed = false } = opts;
  const W = 320;
  const H = 408;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Card stock: a warm bone ground, sandblasted.
  ctx.fillStyle = fixed ? '#a79d8c' : '#c2b8a4';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < W * 2.2; i++) {
    const g = Math.floor(Math.random() * 255);
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;

  // The cut corner, top-left: a card is stamped from the same plate as
  // everything else on this bench, and is relieved the same way.
  ctx.fillStyle = '#16140f';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(42, 0);
  ctx.lineTo(0, 42);
  ctx.closePath();
  ctx.fill();

  // Filing edge: a printed band down the top, and a punch hole in it.
  ctx.fillStyle = 'rgba(22, 20, 15, 0.82)';
  ctx.fillRect(0, 46, W, 5);

  const ink = held ? '#d99423' : '#241f18';
  const tracked = (str, x, y, size, track) => {
    ctx.font = `${size}px "Share Tech Mono", monospace`;
    let cx = x;
    for (const ch of str) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + track;
    }
    return cx - x;
  };
  const widthOf = (str, size, track) => {
    ctx.font = `${size}px "Share Tech Mono", monospace`;
    let w = 0;
    for (const ch of str) w += ctx.measureText(ch).width + track;
    return w;
  };
  const centred = (str, y, size, track, colour) => {
    const w = widthOf(str, size, track);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    tracked(str, (W - w) / 2, y + 2, size, track);
    ctx.fillStyle = colour;
    tracked(str, (W - w) / 2, y, size, track);
  };

  ctx.textBaseline = 'top';
  centred(String(card.code || ''), 86, 46, 3, ink);

  // The name, shrunk to fit rather than clipped: BERYLLIUM is twice NEON.
  const name = String(card.name || '');
  let nameSize = 34;
  while (nameSize > 16 && widthOf(name, nameSize, 2) > W - 34) nameSize -= 2;
  centred(name, 152, nameSize, 2, ink);

  // The outer-shell pips: a row of struck marks, countable, never a number
  // dressed up as a picture.
  if (Number.isInteger(card.pips)) {
    const n = Math.max(0, Math.min(8, card.pips));
    const pitch = 26;
    const x0 = W / 2 - ((n - 1) * pitch) / 2;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
      ctx.fillRect(x0 + i * pitch - 4, 224, 8, 32);
      ctx.fillStyle = ink;
      ctx.fillRect(x0 + i * pitch - 5, 222, 8, 32);
    }
  }

  // A rule across the foot, and whatever status the quest stencilled on it.
  ctx.fillStyle = 'rgba(22, 20, 15, 0.45)';
  ctx.fillRect(28, 300, W - 56, 3);
  if (tag) centred(String(tag).toUpperCase(), 322, 26, 2, '#8a4a1e');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ------------------------------------------------------------- the board */

export class CatalogueBoard3D {
  /**
   * @param {HTMLElement} host the frame's instrument host. Kept empty: the
   *   instrument is in the scene, not in the DOM.
   * @param {{
   *   onProbe?: (cardId: string) => void,
   *   onPlace?: (slotId: string, cardId: string|null) => void,
   *   onLift?: (slotId: string, cardId: string) => void,
   *   world?: object, mountScene?: Function, unmountScene?: Function
   * }} opts
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.onProbe = opts.onProbe || null;
    this.onPlace = opts.onPlace || null;
    this.onLift = opts.onLift || null;

    // The identical state the drawn board keeps, under the identical names.
    this.cards = {};
    this.board = null;
    this.drawer = [];
    this.placed = {};
    this.held = null;
    this.tags = {};
    this.drawerLabel = 'Loose cards';
    this.disposed = false;

    /** Everything built for the current stage, torn down on the next. */
    this.rig = null;
    /** cardId -> the body that card is, wherever it is sitting. */
    this.bodies = new Map();
    /** slotId -> {group, x, y} on the board. */
    this.slots = new Map();

    this.viewer = new BenchViewer3D(document.body, {
      backdrop: opts.backdrop || 'awning',
      world: opts.world || null
    });
    this.viewer.handleClick = e => this.onPointer(e);

    if (this.host) this.host.innerHTML = '';

    const renderHost = benchHost();
    this.mountScene = opts.mountScene || (v => renderHost.mount(v));
    this.unmountScene = opts.unmountScene || (v => renderHost.unmount(v));
    this.mountScene(this.viewer);

    /* Shared plate materials, made once and owned by the viewer. Built in
       `build()` they would be freed by the first `releaseGroup` and handed on
       to the next stage already disposed. */
    this.steel = this.viewer.own(new THREE.MeshStandardMaterial({
      color: 0x6f6657, roughness: 0.86, metalness: 0.44
    }));
    this.dark = this.viewer.own(new THREE.MeshStandardMaterial({
      color: 0x3d3730, roughness: 0.92, metalness: 0.5
    }));

    this.onResize = () => this.viewer.onResize();
    window.addEventListener('resize', this.onResize);
  }

  /* ---------------- contents (the drawn board's API, method for method) --- */

  setStage(spec) {
    this.cards = spec.cards || {};
    this.board = spec.board || null;
    this.drawer = (spec.drawer || []).slice();
    this.drawerLabel = spec.drawerLabel || 'Loose cards';
    this.placed = {};
    this.held = null;
    this.tags = {};
    this.build();
  }

  slotIds() {
    const out = [];
    for (const row of this.board?.rows || []) {
      for (const entry of row) {
        const e = readEntry(entry);
        if (e.kind === 'slot') out.push(e.id);
      }
    }
    return out;
  }

  placements() {
    return { ...this.placed };
  }

  clearBoard() {
    for (const [, cardId] of Object.entries(this.placed)) {
      if (cardId && !this.drawer.includes(cardId)) this.drawer.push(cardId);
    }
    this.placed = {};
    this.held = null;
    this.layout();
  }

  setTag(id, text) {
    if (text) this.tags[id] = text;
    else delete this.tags[id];
    this.repaintCards();
  }

  heldCard() {
    return this.held;
  }

  /* ---------------- building the rig ---------------- */

  build() {
    this.teardown();

    const rig = new THREE.Group();
    rig.position.y = PLATE_Y;
    this.viewer.root.add(rig);
    this.rig = rig;

    this.buildBoard(rig);
    this.buildDrawer(rig);
    this.layout();
    this.frame();
  }

  /**
   * The board: a raked plate standing across the back of the bench with a slot
   * milled for every place a card can go, and the column heads engraved along
   * its top edge.
   */
  buildBoard(rig) {
    const rows = this.board?.rows || [];
    if (!rows.length) { this.boardGroup = null; return; }

    const cols = rows.reduce((n, r) => Math.max(n, r.length), 1);
    const heads = this.board.columns || null;

    const boardW = cols * SLOT_W + 0.08;
    const headH = heads ? 0.052 : 0;
    const boardH = rows.length * SLOT_H + 0.062 + headH + 0.056;

    const g = new THREE.Group();
    // Stood behind the drawer and laid back, so a player looking DOWN at a
    // bench reads the faces square on rather than in foreshortening — and so
    // that the top of it stays forward of the bench's back lip and the tool
    // rail hanging off it.
    g.position.set(0, BOARD_FOOT_Y, BOARD_FOOT_Z);
    g.rotation.x = BOARD_RAKE;
    rig.add(g);
    this.boardGroup = g;

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(boardW, boardH, 0.026), this.steel
    );
    plate.position.set(0, boardH / 2, -0.015);
    plate.castShadow = plate.receiveShadow = true;
    g.add(plate);

    // The easel behind it: a foot rail along the bottom edge and a raking stay
    // at each end, which is what is holding it at this angle.
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(boardW, 0.030, 0.030), this.dark
    );
    rail.position.set(0, 0.012, -0.024);
    g.add(rail);
    for (const sx of [-boardW / 2 + 0.11, boardW / 2 - 0.11]) {
      const stay = new THREE.Mesh(new THREE.BoxGeometry(0.026, boardH * 0.62, 0.022), this.dark);
      stay.position.set(sx, boardH * 0.31, -0.031);
      g.add(stay);
    }

    // The slots: each one a milled recess, dark at the bottom, with a hairline
    // along its relieved top-left edge.
    const originX = -((cols - 1) * SLOT_W) / 2;
    const topY = boardH - 0.034 - headH;

    if (heads) {
      for (let c = 0; c < Math.min(heads.length, cols); c++) {
        const tex = engravedPlaque(String(heads[c]), {
          w: 192, h: 72, size: 40, align: 'center', lit: false
        });
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(SLOT_W * 0.8, 0.040),
          new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.2 })
        );
        m.position.set(originX + c * SLOT_W, boardH - 0.030, 0.014);
        g.add(m);
      }
    }

    rows.forEach((row, r) => {
      const y = topY - r * SLOT_H - SLOT_H / 2;
      row.forEach((entry, c) => {
        const e = readEntry(entry);
        if (e.kind === 'gap') return;
        const x = originX + c * SLOT_W;

        const recess = new THREE.Mesh(
          new THREE.BoxGeometry(CARD_W + 0.012, CARD_H + 0.012, 0.010),
          new THREE.MeshStandardMaterial({
            color: 0x1a1713, roughness: 0.72, metalness: 0.12
          })
        );
        recess.position.set(x, y, 0.006);
        g.add(recess);

        if (e.kind === 'slot') {
          // An empty slot carries a struck cross so it reads as a PLACE rather
          // than as a hole in the plate, and a lip along the bottom the card
          // will come to rest on.
          const lip = new THREE.Mesh(
            new THREE.BoxGeometry(CARD_W + 0.012, 0.008, 0.018), this.dark
          );
          lip.position.set(x, y - CARD_H / 2 - 0.004, 0.017);
          g.add(lip);

          const markTex = engravedPlaque('+', {
            w: 128, h: 128, size: 72, align: 'middle', bg: '#1a1713'
          });
          const mark = new THREE.Mesh(
            new THREE.PlaneGeometry(0.034, 0.034),
            new THREE.MeshStandardMaterial({
              map: markTex, roughness: 0.9, transparent: true, opacity: 0.55
            })
          );
          mark.position.set(x, y, 0.012);
          g.add(mark);

          // The pick target: generous, and invisible. A card-sized slot at a
          // glancing angle is a small thing to hit with a fingertip.
          const hit = new THREE.Mesh(
            new THREE.BoxGeometry(SLOT_W, SLOT_H, 0.045),
            new THREE.MeshBasicMaterial({ visible: false })
          );
          hit.position.set(x, y, 0.028);
          hit.userData.slotId = e.id;
          g.add(hit);

          this.slots.set(e.id, { group: g, x, y, mark, hit });
        } else {
          // A card that is already filed: pinned, readable, not movable.
          const body = this.makeCard(e.id, { fixed: true });
          body.position.set(x, y, 0.014);
          body.rotation.z = 0;
          g.add(body);
          this.bodies.set(e.id, body);
        }
      });
    });

    if (this.board.label) {
      const tex = engravedPlaque(String(this.board.label), {
        w: 768, h: 96, size: 40, align: 'center'
      });
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(boardW * 0.62, 0.9), 0.040),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.2 })
      );
      strip.position.set(0, 0.038, 0.014);
      g.add(strip);
    }

    // What the camera fit has to keep clear of the frame's chrome: the top of
    // the board. A marker, not a mesh. `plate` is the readable face — the thing
    // that has to be WHOLLY in the glass, not merely centred in it.
    const top = new THREE.Object3D();
    top.position.set(0, boardH, 0);
    g.add(top);
    this.viewer.addFitNode(g, top, plate);
    this.boardTop = top;
    this.boardW = boardW;
  }

  /**
   * The drawer: a shallow tray bolted to the plate in front of the board, with
   * the loose cards lying face up in it.
   */
  buildDrawer(rig) {
    const g = new THREE.Group();
    // Out in front of the board, where a hand reaches without leaning over it.
    g.position.set(0, 0.002, 0.42);
    rig.add(g);
    this.drawerGroup = g;

    this.drawerTray = new THREE.Group();
    g.add(this.drawerTray);

    // Rebuilt in `layout` to match however many cards are loose, because a tray
    // sized for eight with two in it reads as six missing cards.
    this.viewer.addFitNode(g, g);
  }

  /** One card as a body: a stamped plate with its printed face on the front. */
  makeCard(cardId, opts = {}) {
    const card = this.cards[cardId] || {};
    const tex = cardFace(
      { code: card.code, name: card.name, pips: card.pips },
      { held: Boolean(opts.held), fixed: Boolean(opts.fixed), tag: this.tags[cardId] || opts.tag || '' }
    );

    const g = new THREE.Group();
    const edgeMat = new THREE.MeshStandardMaterial({
      color: opts.fixed ? 0x6e6555 : 0x8b8170, roughness: 0.94, metalness: 0.05
    });
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(CARD_W, CARD_H, CARD_T), edgeMat
    );
    g.add(stock);

    const faceMat = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.9, metalness: 0.02
    });
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(CARD_W * 0.995, CARD_H * 0.995), faceMat
    );
    face.position.z = CARD_T / 2 + 0.0006;
    g.add(face);

    g.userData.cardId = cardId;
    g.userData.faceMat = faceMat;
    g.userData.faceTex = tex;
    g.userData.fixed = Boolean(opts.fixed);
    g.castShadow = true;
    return g;
  }

  /**
   * Put every card where the state says it is: filed in a slot, lying in the
   * drawer, or up in the hand.
   */
  layout() {
    if (!this.rig) return;

    // Slots first: a filed card stands in its recess, and an empty slot shows
    // its struck cross — lit while a card is in the hand, because an open slot
    // waiting for the card you are holding is a live thing, and that is the one
    // job amber has (CLAUDE.md §1).
    for (const [slotId, slot] of this.slots) {
      const cardId = this.placed[slotId];
      slot.mark.visible = !cardId;
      slot.mark.material.color.set(this.held ? AMBER : 0xffffff);
      slot.mark.material.opacity = this.held ? 0.9 : 0.5;
      const prev = slot.card;
      if (prev && prev.userData.cardId !== cardId) {
        this.releaseCard(prev);
        slot.card = null;
      }
      if (cardId && (!slot.card || slot.card.userData.cardId !== cardId)) {
        const body = this.makeCard(cardId);
        body.position.set(slot.x, slot.y, 0.016);
        this.boardGroup.add(body);
        slot.card = body;
        this.bodies.set(cardId, body);
      }
    }

    // Then the drawer, rebuilt for however many cards are loose.
    for (const child of this.drawerTray.children.slice()) this.releaseCard(child);
    this.drawerTray.clear();

    const loose = this.drawer.slice();
    const n = loose.length;
    const perRow = Math.min(n, 8);
    const rows = Math.max(1, Math.ceil(n / 8));

    loose.forEach((cardId, i) => {
      const row = Math.floor(i / 8);
      const col = i % 8;
      const inRow = Math.min(8, n - row * 8);
      const x = -((inRow - 1) * DRAWER_PITCH) / 2 + col * DRAWER_PITCH;
      const z = row * (CARD_H * 0.40);

      const body = this.makeCard(cardId, { held: this.held === cardId });
      const isHeld = this.held === cardId;

      if (isHeld) {
        // IN THE HAND: lifted off the tray, stood up and turned face-on, with
        // its ink gone amber. Whatever you are holding is never in doubt.
        body.position.set(x, 0.155, z + 0.03);
        body.rotation.x = -0.34;
      } else {
        // LYING IN THE TRAY: flat, face up, at a slight angle, the way a card
        // dropped into a tray actually lies.
        body.position.set(x, 0.012 + row * 0.002, z);
        body.rotation.x = -Math.PI / 2;
        body.rotation.z = ((i * 37) % 11 - 5) * 0.004;
      }
      this.drawerTray.add(body);
      this.bodies.set(cardId, body);
    });

    // The tray itself, cut to the cards in it.
    const trayW = Math.max(0.42, perRow * DRAWER_PITCH + 0.05);
    const trayD = Math.max(CARD_H + 0.05, (rows - 1) * CARD_H * 0.40 + CARD_H + 0.05);
    if (this.tray) this.viewer.releaseGroup(this.tray);
    const tray = new THREE.Group();
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(trayW, 0.010, trayD), this.dark
    );
    floor.position.set(0, 0.004, (rows - 1) * CARD_H * 0.20);
    floor.receiveShadow = true;
    tray.add(floor);
    for (const [dx, dz, w, d] of [
      [0, -trayD / 2 + (rows - 1) * CARD_H * 0.20, trayW, 0.014],
      [0, trayD / 2 + (rows - 1) * CARD_H * 0.20, trayW, 0.014],
      [-trayW / 2, (rows - 1) * CARD_H * 0.20, 0.014, trayD],
      [trayW / 2, (rows - 1) * CARD_H * 0.20, 0.014, trayD]
    ]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 0.026, d), this.steel);
      wall.position.set(dx, 0.013, dz);
      tray.add(wall);
    }
    const labelTex = engravedPlaque(
      n ? this.drawerLabel : `${this.drawerLabel} — empty`,
      { w: 640, h: 96, size: 40, align: 'center' }
    );
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.min(trayW * 0.82, 0.8), 0.046),
      new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.94, metalness: 0.15 })
    );
    label.rotation.x = -Math.PI / 2;
    label.position.set(0, 0.011, trayD / 2 + (rows - 1) * CARD_H * 0.20 + 0.046);
    tray.add(label);
    this.drawerGroup.add(tray);
    this.tray = tray;
  }

  /** Repaint every card face, so a tag lands without rebuilding the rig. */
  repaintCards() {
    for (const [cardId, body] of this.bodies) {
      if (!body.parent) continue;
      const card = this.cards[cardId] || {};
      const tex = cardFace(
        { code: card.code, name: card.name, pips: card.pips },
        { held: this.held === cardId, fixed: body.userData.fixed, tag: this.tags[cardId] || '' }
      );
      body.userData.faceTex?.dispose();
      body.userData.faceTex = tex;
      body.userData.faceMat.map = tex;
      body.userData.faceMat.needsUpdate = true;
    }
  }

  /** Stand the camera so the whole board and the drawer are in the glass. */
  frame() {
    const span = Math.max(1.0, this.boardW || 1.0);
    this.viewer.camDist = 1.02 + span * 0.42;
    this.viewer.camHeight = 1.62;
    this.viewer.camTarget = new THREE.Vector3(0, PLATE_Y + 0.24, 0.06);
    this.viewer.applyCamera();
  }

  /* ---------------- input ---------------- */

  /**
   * One press. The rules are the drawn board's, line for line: a loose card
   * goes into the hand and reads itself, the card already in the hand goes back
   * down, an empty slot takes whatever is held, and a filed card lifts back
   * into the drawer and reads itself on the way.
   *
   * A FILED SLOT IS RESOLVED BY THE STATE, NEVER BY THE RAY. The slot's pick
   * target is a generous box that a fingertip can hit at a glancing angle, and
   * it is deep enough to swallow the card standing in it — so the ray reports
   * the slot whether or not the slot is full, and a `pick` that trusted the
   * ray's own order left every filed card unliftable and quietly overwrote it
   * with the next card placed, which is a card the player watched vanish.
   */
  onPointer(e) {
    if (this.disposed || !this.rig) return;
    this.viewer.setPointer(e);

    const hit = this.pick();
    if (!hit) return;

    if (hit.kind === 'card') {
      const body = hit.body;
      const cardId = body.userData.cardId;

      if (body.userData.fixed) { this.onProbe?.(cardId); return; }

      // A card sitting in a slot: lift it out.
      const slotId = this.slotHolding(cardId);
      if (slotId) { this.liftFrom(slotId, cardId); return; }

      // A loose card: into the hand, or back down if it was already there.
      this.held = this.held === cardId ? null : cardId;
      this.layout();
      this.onProbe?.(cardId);
      return;
    }

    // A slot. If it is holding a card, the press is a press on that card
    // however the ray resolved it, so it lifts out exactly as tapping its face
    // does — the one place the built board could disagree with the drawn one.
    const slotId = hit.slotId;
    const sitting = this.placed[slotId];
    if (sitting) { this.liftFrom(slotId, sitting); return; }

    if (!this.held) { this.onPlace?.(slotId, null); return; }
    const cardId = this.held;
    this.placed[slotId] = cardId;
    this.drawer = this.drawer.filter(x => x !== cardId);
    this.held = null;
    this.layout();
    this.onPlace?.(slotId, cardId);
  }

  /**
   * Take the card out of a slot and put it back in the drawer, reading it on
   * the way. NOTHING MAY CONSUME A CARD: a card leaves a slot only through
   * here, so it is always in the drawer or in a slot and never nowhere.
   */
  liftFrom(slotId, cardId) {
    delete this.placed[slotId];
    if (!this.drawer.includes(cardId)) this.drawer.push(cardId);
    this.held = null;
    this.layout();
    this.onLift?.(slotId, cardId);
    this.onProbe?.(cardId);
  }

  /** Which slot a card is filed in, or null. */
  slotHolding(cardId) {
    for (const [slotId, held] of Object.entries(this.placed)) {
      if (held === cardId) return slotId;
    }
    return null;
  }

  /**
   * What is under the pointer: a card body, or an empty slot's pick target.
   *
   * A card that is standing IN a slot wins over the slot behind it, which is
   * what makes "tap a filed card to lift it out" work at a glancing angle.
   */
  pick() {
    const ray = this.viewer.raycaster;
    ray.setFromCamera(this.viewer.pointer, this.viewer.camera);
    const hits = ray.intersectObject(this.rig, true);
    for (const h of hits) {
      let node = h.object;
      while (node && node !== this.rig) {
        if (node.userData?.cardId) return { kind: 'card', body: node };
        if (node.userData?.slotId) return { kind: 'slot', slotId: node.userData.slotId };
        node = node.parent;
      }
    }
    return null;
  }

  /* ---------------- teardown ---------------- */

  releaseCard(body) {
    if (!body) return;
    const id = body.userData?.cardId;
    if (id && this.bodies.get(id) === body) this.bodies.delete(id);
    this.viewer.releaseGroup(body);
  }

  teardown() {
    if (this.rig) this.viewer.releaseGroup(this.rig);
    this.viewer.clearFitNodes();
    this.rig = null;
    this.tray = null;
    this.boardGroup = null;
    this.drawerGroup = null;
    this.drawerTray = null;
    this.bodies.clear();
    this.slots.clear();
    // The plate materials are the viewer's and outlive the stage.
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.teardown();
    this.unmountScene(this.viewer);
    this.viewer.dispose();
    if (this.host) this.host.innerHTML = '';
  }
}

/* Kept beside the drawn board's export so a caller that reaches for the rim
   colour does not have to know which instrument it got. */
export { PLATE_RIM };
