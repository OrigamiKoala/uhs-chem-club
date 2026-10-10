const noop = () => {};
globalThis.localStorage = { getItem: () => null, setItem: noop, removeItem: noop, clear: noop };
globalThis.window = { addEventListener: noop, removeEventListener: noop, location: { hash: '' }, visualViewport: { height: 800 }, innerHeight: 800, innerWidth: 1200 };

// Minimal real element tree
class Element {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.classList = {
      _classes: new Set(),
      add: c => this.classList._classes.add(c),
      remove: c => this.classList._classes.delete(c),
      contains: c => this.classList._classes.has(c),
      toggle: (c, v) => v ? this.classList.add(c) : this.classList.remove(c)
    };
    this.style = {};
    this.dataset = {};
    this._innerHTML = '';
  }
  get className() { return Array.from(this.classList._classes).join(' '); }
  set className(v) { this.classList._classes = new Set(v.split(/\s+/).filter(Boolean)); }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener() {}
  removeEventListener() {}
  appendChild(c) { c.parentElement = this; this.children.push(c); return c; }
  removeChild(c) {
    const idx = this.children.indexOf(c);
    if (idx >= 0) this.children.splice(idx, 1);
  }
  closest(sel) {
    let p = this;
    while (p) {
      if (sel.startsWith('.') && p.classList.contains(sel.slice(1))) return p;
      p = p.parentElement;
    }
    return null;
  }
  querySelector(sel) {
    for (const c of this.children) {
      if (sel.startsWith('.') && c.classList.contains(sel.slice(1))) return c;
      if (sel.startsWith('#') && c.id === sel.slice(1)) return c;
      const found = c.querySelector(sel);
      if (found) return found;
    }
    return null;
  }
  querySelectorAll(sel) {
    const res = [];
    for (const c of this.children) {
      if (sel.startsWith('.') && c.classList.contains(sel.slice(1))) res.push(c);
      res.push(...c.querySelectorAll(sel));
    }
    return res;
  }
  set innerHTML(html) {
    this._innerHTML = html;
    // Simple parser for elements with class
    this.children = [];
    const tagRegex = /<([a-z0-9-]+)([^>]*)>([\s\S]*?)<\/\1>|<([a-z0-9-]+)([^>]*)\/>/gi;
    // Let's use a simpler DOM tree parser or jsdom if we can
  }
  get innerHTML() { return this._innerHTML; }
}
