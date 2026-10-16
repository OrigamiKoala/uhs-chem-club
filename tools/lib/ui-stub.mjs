/**
 * ui-stub.mjs — A DOM that accepts everything, for loading and driving the
 * Learn track's browser code in Node.
 *
 * Every property of a stub is another stub, `querySelectorAll` is empty,
 * `getContext` hands back the recording context from `ctx-stub.mjs`, and
 * `getBoundingClientRect` reports a phone-sized box. It proves nothing about
 * layout and everything about whether the code RUNS. `verify-quest-run.mjs`
 * has its own copy of the same idea; this one is for the tools that also want
 * to construct a view (`Table2D`) and call its methods.
 */

import { makeCtx } from './ctx-stub.mjs';

const noop = () => {};

export function stub() {
  const f = function () { return stub(); };
  return new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => '';
      if (typeof p === 'symbol') return undefined;
      if (p === 'then') return undefined;
      if (p === 'length') return 0;
      if (p === 'querySelectorAll' || p === 'getElementsByClassName' || p === 'children' || p === 'childNodes') return () => [];
      if (p === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 340, height: 204 });
      if (p === 'dataset') return {};
      if (p === 'classList') return { add: noop, remove: noop, toggle: noop, contains: () => false };
      if (p === 'style') return {};
      if (p === 'getContext') return () => makeCtx(340, 204);
      if (p === 'hasAttribute') return () => false;
      if (p === 'matches' || p === 'closest') return () => null;
      return stub();
    },
    set() { return true; },
    apply() { return stub(); }
  });
}

/** Install `window`, `document`, `localStorage` and the timing globals. */
export function installUiStub() {
  const memory = new Map();
  globalThis.localStorage = {
    getItem: k => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: k => memory.delete(k),
    clear: () => memory.clear()
  };
  globalThis.window = {
    addEventListener: noop, removeEventListener: noop,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    location: { hash: '' }, devicePixelRatio: 1, innerWidth: 1200, innerHeight: 800
  };
  globalThis.document = new Proxy({
    body: stub(), documentElement: stub(),
    createElement: () => stub(), getElementById: () => stub(),
    querySelector: () => stub(), querySelectorAll: () => [],
    addEventListener: noop, removeEventListener: noop
  }, { get: (t, p) => (p in t ? t[p] : stub()) });
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = noop;
  globalThis.performance ??= { now: () => Date.now() };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true });
}
