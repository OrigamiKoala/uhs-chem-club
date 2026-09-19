/**
 * dom-shim.mjs — Enough of a browser for a world to be BUILT in Node.
 *
 * WHY THIS EXISTS
 * "No two objects may occupy the same space" is a claim about the world that is
 * actually built, not about a table someone maintains beside it. A hand-written
 * footprint list is a second source of truth, and a second source of truth drifts
 * the first time somebody nudges a crate — which is exactly the failure the rule
 * is there to prevent.
 *
 * So `verify:tallow` and `verify:ship` construct the real `TallowWorld` and the
 * real `ShipInterior`, walk their scene graphs, and measure every pair of solids
 * with three.js's own bounding boxes. That needs a DOM, because every surface in
 * this product is drawn on a canvas at build time.
 *
 * WHAT THIS IS NOT
 * A renderer. Nothing here draws anything: the verifier never looks at a pixel,
 * only at geometry. The 2D context keeps a correctly sized pixel buffer so the
 * texture generators' read/modify/write passes run to completion, and every
 * drawing call is accepted and ignored. That is the whole contract — the
 * generators must not crash, and the geometry they feed must be real.
 */

class ImageDataShim {
  constructor(w, h) {
    this.width = w;
    this.height = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
}

class GradientShim {
  addColorStop() {}
}

/**
 * A 2D context that accounts for pixels but paints none of them.
 *
 * `getImageData` has to return the buffer that `putImageData` last wrote, or
 * every generator that derives a normal from its own height field would read
 * back zeroes and hand out a flat surface. Nothing else here has to be true.
 */
class Context2DShim {
  constructor(canvas) {
    this.canvas = canvas;
    this._buffer = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.lineWidth = 1;
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    this.font = '';
    this.textAlign = 'left';
    this.textBaseline = 'top';
  }

  createImageData(w, h) { return new ImageDataShim(w, h); }

  putImageData(img, dx = 0, dy = 0) {
    const { width: cw, height: ch } = this.canvas;
    for (let y = 0; y < img.height; y++) {
      const ty = y + dy;
      if (ty < 0 || ty >= ch) continue;
      for (let x = 0; x < img.width; x++) {
        const tx = x + dx;
        if (tx < 0 || tx >= cw) continue;
        const si = (y * img.width + x) * 4;
        const di = (ty * cw + tx) * 4;
        this._buffer[di] = img.data[si];
        this._buffer[di + 1] = img.data[si + 1];
        this._buffer[di + 2] = img.data[si + 2];
        this._buffer[di + 3] = img.data[si + 3];
      }
    }
  }

  getImageData(x = 0, y = 0, w = this.canvas.width, h = this.canvas.height) {
    const out = new ImageDataShim(w, h);
    const cw = this.canvas.width;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const si = ((y + j) * cw + (x + i)) * 4;
        const di = (j * w + i) * 4;
        out.data[di] = this._buffer[si] ?? 0;
        out.data[di + 1] = this._buffer[si + 1] ?? 0;
        out.data[di + 2] = this._buffer[si + 2] ?? 0;
        out.data[di + 3] = this._buffer[si + 3] ?? 255;
      }
    }
    return out;
  }

  createRadialGradient() { return new GradientShim(); }
  createLinearGradient() { return new GradientShim(); }
  measureText(text) { return { width: String(text).length * 8 }; }

  /* Everything below is accepted and ignored: the verifier measures geometry. */
  save() {} restore() {} beginPath() {} closePath() {}
  moveTo() {} lineTo() {} arc() {} rect() {} ellipse() {}
  quadraticCurveTo() {} bezierCurveTo() {}
  fill() {} stroke() {} clip() {}
  fillRect() {} strokeRect() {} clearRect() {}
  fillText() {} strokeText() {}
  translate() {} rotate() {} scale() {} setTransform() {} resetTransform() {}
  drawImage() {} setLineDash() {}
}

class CanvasShim {
  constructor(w = 300, h = 150) {
    this.width = w;
    this.height = h;
    this.style = {};
  }
  getContext(kind) {
    if (kind !== '2d') return null;
    if (!this._ctx || this._ctx.canvas.width !== this.width || this._ctx.canvas.height !== this.height) {
      this._ctx = new Context2DShim(this);
    }
    return this._ctx;
  }
  toDataURL() { return 'data:,'; }
  addEventListener() {}
  removeEventListener() {}
}

class ElementShim {
  constructor(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.style = {};
    this.children = [];
    this.dataset = {};
    this.classList = {
      _set: new Set(),
      add: function (...c) { c.forEach(x => this._set.add(x)); },
      remove: function (...c) { c.forEach(x => this._set.delete(x)); },
      toggle: function (c, on) { on ? this._set.add(c) : this._set.delete(c); },
      contains: function (c) { return this._set.has(c); }
    };
  }
  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); return c; }
  remove() {}
  setAttribute() {}
  getAttribute() { return null; }
  addEventListener() {}
  removeEventListener() {}
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720 }; }
}

/**
 * Install the shim onto globalThis. Safe to call more than once.
 *
 * @param {{tier?: string}} opts which quality tier the world should build at.
 *   T4 is the default because T4 is the tier that draws every prop — verifying
 *   a reduced world would be verifying something nobody plays.
 */
export function installDomShim({ tier = 'T4' } = {}) {
  const memory = new Map();
  if (!globalThis.localStorage) {
    globalThis.localStorage = {
      getItem: k => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, String(v)),
      removeItem: k => memory.delete(k),
      clear: () => memory.clear()
    };
  }
  // The tier module reads a stored preference at load. Saying T4 here is how
  // the verifier gets the world every T4 player actually walks.
  globalThis.localStorage.setItem('avalon_gfx_tier_pref', tier);
  globalThis.localStorage.setItem('avalon_gfx_rev', '3');

  const noop = () => {};
  globalThis.document = globalThis.document || {
    createElement: tag => (String(tag).toLowerCase() === 'canvas'
      ? new CanvasShim(300, 150)
      : new ElementShim(tag)),
    createElementNS: () => new ElementShim('svg'),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: noop,
    removeEventListener: noop,
    body: new ElementShim('body'),
    documentElement: new ElementShim('html')
  };
  // A canvas made through the shim has to answer `width = N` by resizing.
  const origCreate = globalThis.document.createElement;
  globalThis.document.createElement = tag => origCreate(tag);

  const navShim = { userAgent: 'node', hardwareConcurrency: 8, maxTouchPoints: 0 };
  globalThis.window = globalThis.window || {
    innerWidth: 1280,
    innerHeight: 720,
    devicePixelRatio: 1,
    addEventListener: noop,
    removeEventListener: noop,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    location: { hash: '', href: 'http://localhost/' },
    requestAnimationFrame: noop,
    cancelAnimationFrame: noop,
    sessionStorage: globalThis.localStorage,
    navigator: navShim
  };
  globalThis.sessionStorage = globalThis.sessionStorage || globalThis.localStorage;
  // Node 21+ defines `navigator` as a getter-only global, so it is extended
  // rather than replaced — the tier probe reads hardwareConcurrency off it.
  if (!globalThis.navigator) {
    try { globalThis.navigator = navShim; } catch (e) { /* read-only: fine */ }
  } else {
    for (const [k, v] of Object.entries(navShim)) {
      if (globalThis.navigator[k] === undefined) {
        try { globalThis.navigator[k] = v; } catch (e) { /* read-only: fine */ }
      }
    }
  }
  if (!globalThis.self) {
    try { globalThis.self = globalThis; } catch (e) { /* fine */ }
  }
  globalThis.HTMLCanvasElement = CanvasShim;
  globalThis.Image = CanvasShim;
  globalThis.ImageData = ImageDataShim;
}

export { CanvasShim, ElementShim };
