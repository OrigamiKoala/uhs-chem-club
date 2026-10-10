/**
 * ctx-stub.mjs — A canvas 2D context that draws nothing and throws on nothing it
 * should know.
 *
 * The Learn benches paint their pictures with pure `draw` functions over a 2D
 * context. To prove in Node that a declaration can be DRAWN — every head, every
 * stage, at the phone size and the bench-screen size — without a browser, hand
 * them this. It records how many draw calls were made and the largest coordinate
 * written, so a picture that drew nothing, or drew off the plate, is a failure
 * rather than a blank screen in a student's hands.
 */

export function makeCtx(w, h) {
  const stats = { calls: 0, text: [], maxX: 0, maxY: 0, nan: 0 };
  const note = (x, y) => {
    if (Number.isNaN(x) || Number.isNaN(y)) stats.nan++;
    if (Number.isFinite(x)) stats.maxX = Math.max(stats.maxX, Math.abs(x));
    if (Number.isFinite(y)) stats.maxY = Math.max(stats.maxY, Math.abs(y));
  };
  const gradient = () => ({ addColorStop() {} });
  const base = {
    canvas: { width: w, height: h },
    measureText: t => ({ width: String(t).length * 6 }),
    createLinearGradient: gradient,
    createRadialGradient: gradient,
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    setLineDash() {}
  };
  const draws = new Set(['fillRect', 'strokeRect', 'clearRect', 'moveTo', 'lineTo', 'arc', 'rect', 'fillText', 'strokeText', 'ellipse', 'quadraticCurveTo', 'bezierCurveTo', 'arcTo']);
  const ctx = new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'stats') return stats;
      if (draws.has(prop)) {
        return (...args) => {
          stats.calls++;
          if (prop === 'fillText' || prop === 'strokeText') stats.text.push(String(args[0]));
          const nums = args.filter(a => typeof a === 'number');
          for (let i = 0; i + 1 < nums.length; i += 2) note(nums[i], nums[i + 1]);
          for (const n of nums) if (Number.isNaN(n)) stats.nan++;
        };
      }
      return (...args) => {
        for (const a of args) if (typeof a === 'number' && Number.isNaN(a)) stats.nan++;
      };
    },
    set(target, prop, value) { target[prop] = value; return true; }
  });
  return ctx;
}
