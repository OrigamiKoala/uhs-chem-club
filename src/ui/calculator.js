/**
 * calculator.js — Digital Scientific Calculator for Avalon.
 *
 * "The Scoured Plate" — machined hardware for chemical calculations.
 * Features:
 *   - Arithmetic, logarithms (log10, ln), powers, roots, trigonometry (DEG/RAD)
 *   - Scientific notation (EE / exponential)
 *   - Quick Chemistry Constants drawer (R, N_A, F, h, c, k_B, atm, Kw)
 *   - Two-line display with formula tape and precision result formatting
 *   - Moveable (drag by header), closeable (X button, Esc, or toggle)
 *   - "Copy" to clipboard and "Use" to auto-fill stage input fields
 *   - Full physical keyboard support
 *   - Native sound effects via soundscape
 */

import { soundscape } from '../audio/soundscape.js';

/** Essential constants in chemistry */
const CONSTANTS = [
  { sym: 'R (J)', val: '8.314', desc: '8.314 J/(mol·K)' },
  { sym: 'R (atm)', val: '0.08206', desc: '0.08206 L·atm/(mol·K)' },
  { sym: 'N_A', val: '6.022e23', desc: '6.022 × 10²³ mol⁻¹' },
  { sym: 'F', val: '96485', desc: '96,485 C/mol' },
  { sym: 'h', val: '6.626e-34', desc: '6.626 × 10⁻³⁴ J·s' },
  { sym: 'c', val: '2.998e8', desc: '2.998 × 10⁸ m/s' },
  { sym: 'k_B', val: '1.381e-23', desc: '1.381 × 10⁻²³ J/K' },
  { sym: 'atm', val: '101325', desc: '101,325 Pa' },
  { sym: 'K_w', val: '1.0e-14', desc: '1.0 × 10⁻¹⁴' }
];

/** Clean number formatting removing IEEE 754 float jitter */
export function formatResult(num) {
  if (!Number.isFinite(num)) {
    if (Number.isNaN(num)) return 'Error: Undefined';
    return num > 0 ? 'Infinity' : '-Infinity';
  }
  const abs = Math.abs(num);
  if (abs === 0) return '0';
  if (abs >= 1e12 || abs < 1e-6) {
    const exp = num.toExponential(6);
    return exp.replace(/\.?0+e/, 'e').replace(/e\+/, 'e');
  }
  const rounded = parseFloat(num.toPrecision(10));
  return String(rounded);
}

/** Robust mathematical parser and evaluator */
export function evaluateExpression(rawExpr, { isDegree = true, ans = 0 } = {}) {
  if (!rawExpr || !rawExpr.trim()) return { ok: true, value: 0 };

  const str = rawExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/Ans/gi, String(ans))
    .trim();

  // Tokenize
  const tokens = [];
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number (including scientific e.g. 1.5e-3)
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(str[i + 1]))) {
      let numStr = '';
      while (i < str.length && /[\d.]/.test(str[i])) {
        numStr += str[i++];
      }
      if (i < str.length && (str[i] === 'e' || str[i] === 'E') && /[\d+-]/.test(str[i + 1])) {
        numStr += str[i++];
        if (str[i] === '+' || str[i] === '-') {
          numStr += str[i++];
        }
        while (i < str.length && /\d/.test(str[i])) {
          numStr += str[i++];
        }
      }
      tokens.push({ type: 'NUM', value: parseFloat(numStr) });
      continue;
    }

    // Identifiers: functions or constants
    if (/[a-zA-Z]/.test(ch)) {
      let id = '';
      while (i < str.length && /[a-zA-Z0-9_]/.test(str[i])) {
        id += str[i++];
      }
      const lower = id.toLowerCase();
      if (lower === 'pi') {
        tokens.push({ type: 'NUM', value: Math.PI });
      } else if (lower === 'e') {
        tokens.push({ type: 'NUM', value: Math.E });
      } else {
        tokens.push({ type: 'FUNC', value: lower });
      }
      continue;
    }

    // Single-char symbols
    if ('+-*/^%(),'.includes(ch)) {
      tokens.push({ type: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  // Insert implicit multiplication tokens
  const expanded = [];
  for (let k = 0; k < tokens.length; k++) {
    const curr = tokens[k];
    const prev = expanded[expanded.length - 1];
    if (prev) {
      const prevCanEnd = prev.type === 'NUM' || prev.type === ')';
      const currCanStart = curr.type === 'NUM' || curr.type === '(' || curr.type === 'FUNC';
      if (prevCanEnd && currCanStart) {
        expanded.push({ type: '*' });
      }
    }
    expanded.push(curr);
  }

  // Parser
  let pos = 0;
  function peek() { return expanded[pos]; }
  function consume(expected) {
    const t = expanded[pos++];
    if (expected && (!t || t.type !== expected)) {
      if (expected === ')' && !t) return { type: ')' };
      throw new Error(`Expected ${expected}, got ${t?.type || 'EOF'}`);
    }
    return t;
  }

  function parseExpression() {
    let left = parseTerm();
    while (pos < expanded.length && (peek().type === '+' || peek().type === '-')) {
      const op = consume().type;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm() {
    let left = parsePower();
    while (pos < expanded.length && (peek().type === '*' || peek().type === '/' || peek().type === '%')) {
      const op = consume().type;
      const right = parsePower();
      if (op === '*') left = left * right;
      else if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left = left / right;
      } else {
        left = left % right;
      }
    }
    return left;
  }

  function parsePower() {
    let left = parseUnary();
    if (pos < expanded.length && peek().type === '^') {
      consume('^');
      const right = parsePower();
      left = Math.pow(left, right);
    }
    return left;
  }

  function parseUnary() {
    if (pos < expanded.length && peek().type === '-') {
      consume('-');
      return -parseUnary();
    }
    if (pos < expanded.length && peek().type === '+') {
      consume('+');
      return parseUnary();
    }
    return parseFactor();
  }

  function parseFactor() {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');

    if (t.type === 'NUM') {
      consume();
      return t.value;
    }

    if (t.type === '(') {
      consume('(');
      const val = parseExpression();
      if (pos < expanded.length && peek().type === ')') consume(')');
      return val;
    }

    if (t.type === 'FUNC') {
      const fn = consume().value;
      let arg = 0;
      if (pos < expanded.length && peek().type === '(') {
        consume('(');
        arg = parseExpression();
        if (pos < expanded.length && peek().type === ')') consume(')');
      } else {
        arg = parseFactor();
      }

      switch (fn) {
        case 'log':
        case 'log10':
          if (arg <= 0) throw new Error('Invalid log domain (x <= 0)');
          return Math.log10(arg);
        case 'ln':
          if (arg <= 0) throw new Error('Invalid ln domain (x <= 0)');
          return Math.log(arg);
        case 'sqrt':
          if (arg < 0) throw new Error('Invalid sqrt domain (x < 0)');
          return Math.sqrt(arg);
        case 'cbrt':
          return Math.cbrt(arg);
        case 'sin': {
          const rad = isDegree ? (arg * Math.PI) / 180 : arg;
          return Math.sin(rad);
        }
        case 'cos': {
          const rad = isDegree ? (arg * Math.PI) / 180 : arg;
          return Math.cos(rad);
        }
        case 'tan': {
          const rad = isDegree ? (arg * Math.PI) / 180 : arg;
          return Math.tan(rad);
        }
        case 'asin': {
          if (arg < -1 || arg > 1) throw new Error('Invalid asin domain');
          const res = Math.asin(arg);
          return isDegree ? (res * 180) / Math.PI : res;
        }
        case 'acos': {
          if (arg < -1 || arg > 1) throw new Error('Invalid acos domain');
          const res = Math.acos(arg);
          return isDegree ? (res * 180) / Math.PI : res;
        }
        case 'atan': {
          const res = Math.atan(arg);
          return isDegree ? (res * 180) / Math.PI : res;
        }
        case 'abs':
          return Math.abs(arg);
        case 'exp':
          return Math.exp(arg);
        default:
          throw new Error(`Unknown function: ${fn}`);
      }
    }

    throw new Error(`Unexpected token: ${t.type}`);
  }

  const val = parseExpression();
  return { ok: true, value: val };
}

class DigitalCalculator {
  constructor() {
    this.el = null;
    this.isOpen = false;
    this.expression = '';
    this.tape = '';
    this.displayValue = '0';
    this.isDegree = true;
    this.showConstants = false;
    this.ans = 0;
    this.justEvaluated = false;
    this.targetInput = null;

    // Dragging state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    this.hasMoved = false;

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  build() {
    if (this.el) return;

    this.el = document.createElement('div');
    this.el.id = 'scoured-calc';
    this.el.className = 'scoured-calc-panel hidden';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'Scientific Calculator');

    this.el.innerHTML = `
      <div class="scoured-calc-header" data-calc-drag="true">
        <div class="scoured-calc-title-group" data-calc-drag="true">
          <span class="scoured-calc-lamp lit" aria-hidden="true"></span>
          <span class="scoured-calc-title" data-calc-drag="true">Scientific Calculator</span>
        </div>
        <div class="scoured-calc-header-actions">
          <button type="button" class="scoured-calc-mode-btn ${this.isDegree ? 'active' : ''}" data-act="toggle-mode" title="Toggle Degrees / Radians">
            ${this.isDegree ? 'DEG' : 'RAD'}
          </button>
          <button type="button" class="scoured-calc-const-btn ${this.showConstants ? 'active' : ''}" data-act="toggle-const" title="Chemistry Constants">
            CONST
          </button>
          <button type="button" class="scoured-calc-close-btn" data-act="close" title="Close Calculator (Esc)" aria-label="Close Calculator">
            ✕
          </button>
        </div>
      </div>

      <div class="scoured-calc-screen">
        <div class="scoured-calc-tape" id="calc-tape">&nbsp;</div>
        <div class="scoured-calc-main-line" id="calc-display">0</div>
        <div class="scoured-calc-screen-bar">
          <span class="scoured-calc-screen-status" id="calc-status">RAD: OFF · DEG: ON</span>
          <div class="scoured-calc-screen-actions">
            <button type="button" class="scoured-calc-util-btn" data-act="copy" title="Copy to clipboard">Copy</button>
            <button type="button" class="scoured-calc-util-btn" data-act="use" title="Insert into stage input">Use Value</button>
          </div>
        </div>
      </div>

      <div class="scoured-calc-constants ${this.showConstants ? '' : 'hidden'}" id="calc-const-panel">
        ${CONSTANTS.map(c => `
          <button type="button" class="scoured-const-chip" data-const-val="${c.val}" title="${c.desc}">
            <span class="scoured-const-sym">${c.sym}</span>
            <span class="scoured-const-val">${c.val}</span>
          </button>
        `).join('')}
      </div>

      <div class="scoured-calc-body">
        <div class="scoured-calc-grid">
          <!-- Row 1: Primary powers & logs -->
          <button type="button" class="scoured-calc-btn k-fn" data-token="log(">log</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="ln(">ln</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="sqrt(">√</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="^2">x²</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="^">xʸ</button>

          <!-- Row 2: Trig & constants -->
          <button type="button" class="scoured-calc-btn k-fn" data-token="sin(">sin</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="cos(">cos</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="tan(">tan</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="π">π</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="e">e</button>

          <!-- Row 3: Utility & Parentheses -->
          <button type="button" class="scoured-calc-btn k-fn" data-token="1/(">1/x</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="e">EE</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="(">(</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token=")">)</button>
          <button type="button" class="scoured-calc-btn k-danger" data-act="clear">AC</button>

          <!-- Row 4: 7, 8, 9, backspace, divide -->
          <button type="button" class="scoured-calc-btn k-num" data-token="7">7</button>
          <button type="button" class="scoured-calc-btn k-num" data-token="8">8</button>
          <button type="button" class="scoured-calc-btn k-num" data-token="9">9</button>
          <button type="button" class="scoured-calc-btn k-danger" data-act="backspace" title="Backspace">⌫</button>
          <button type="button" class="scoured-calc-btn k-op" data-token=" ÷ ">÷</button>

          <!-- Row 5: 4, 5, 6, negate, multiply -->
          <button type="button" class="scoured-calc-btn k-num" data-token="4">4</button>
          <button type="button" class="scoured-calc-btn k-num" data-token="5">5</button>
          <button type="button" class="scoured-calc-btn k-num" data-token="6">6</button>
          <button type="button" class="scoured-calc-btn k-fn" data-act="negate">±</button>
          <button type="button" class="scoured-calc-btn k-op" data-token=" × ">×</button>

          <!-- Row 6: 1, 2, 3, Ans, subtract -->
          <button type="button" class="scoured-calc-btn k-num" data-token="1">1</button>
          <button type="button" class="scoured-calc-btn k-num" data-token="2">2</button>
          <button type="button" class="scoured-calc-btn k-num" data-token="3">3</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="Ans">Ans</button>
          <button type="button" class="scoured-calc-btn k-op" data-token=" - ">-</button>

          <!-- Row 7: 0, decimal, percent, add, equals -->
          <button type="button" class="scoured-calc-btn k-num" data-token="0">0</button>
          <button type="button" class="scoured-calc-btn k-num" data-token=".">.</button>
          <button type="button" class="scoured-calc-btn k-fn" data-token="%">%</button>
          <button type="button" class="scoured-calc-btn k-op" data-token=" + ">+</button>
          <button type="button" class="scoured-calc-btn k-eq" data-act="equals" title="Calculate (=)">=</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);
    this.bindEvents();
  }

  bindEvents() {
    this.el.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const act = btn.dataset.act;
      const token = btn.dataset.token;
      const constVal = btn.dataset.constVal;

      if (token) {
        soundscape?.playKeyCapThunk?.();
        this.appendToken(token);
      } else if (constVal) {
        soundscape?.playKeyCapThunk?.();
        this.appendToken(constVal);
      } else if (act === 'clear') {
        soundscape?.playKeyCapThunk?.();
        this.clearAll();
      } else if (act === 'backspace') {
        soundscape?.playKeyCapThunk?.();
        this.backspace();
      } else if (act === 'negate') {
        soundscape?.playKeyCapThunk?.();
        this.toggleNegate();
      } else if (act === 'equals') {
        soundscape?.playToggleClack?.();
        this.compute();
      } else if (act === 'toggle-mode') {
        soundscape?.playCrtTick?.();
        this.toggleAngleMode();
      } else if (act === 'toggle-const') {
        soundscape?.playCrtTick?.();
        this.toggleConstants();
      } else if (act === 'copy') {
        this.copyResult(btn);
      } else if (act === 'use') {
        this.useResult(btn);
      } else if (act === 'close') {
        this.close();
      }
    });

    // Drag handling on header
    const header = this.el.querySelector('.scoured-calc-header');
    header.addEventListener('mousedown', e => this.startDrag(e));
    header.addEventListener('touchstart', e => this.startDrag(e), { passive: false });
  }

  startDrag(e) {
    if (e.target.closest('button')) return;
    e.preventDefault();

    this.isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = this.el.getBoundingClientRect();
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.initialLeft = rect.left;
    this.initialTop = rect.top;

    window.addEventListener('mousemove', this.onPointerMove);
    window.addEventListener('mouseup', this.onPointerUp);
    window.addEventListener('touchmove', this.onPointerMove, { passive: false });
    window.addEventListener('touchend', this.onPointerUp);
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    if (e.cancelable) e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - this.dragStartX;
    const dy = clientY - this.dragStartY;

    let newLeft = this.initialLeft + dx;
    let newTop = this.initialTop + dy;

    // Viewport clamping
    const w = this.el.offsetWidth || 360;
    const h = this.el.offsetHeight || 440;
    const maxLeft = Math.max(10, window.innerWidth - w - 10);
    const maxTop = Math.max(10, window.innerHeight - h - 10);

    newLeft = Math.max(10, Math.min(maxLeft, newLeft));
    newTop = Math.max(10, Math.min(maxTop, newTop));

    this.el.style.left = `${newLeft}px`;
    this.el.style.top = `${newTop}px`;
    this.el.style.bottom = 'auto';
    this.el.style.right = 'auto';
    this.hasMoved = true;
  }

  onPointerUp() {
    this.isDragging = false;
    window.removeEventListener('mousemove', this.onPointerMove);
    window.removeEventListener('mouseup', this.onPointerUp);
    window.removeEventListener('touchmove', this.onPointerMove);
    window.removeEventListener('touchend', this.onPointerUp);
  }

  onKeyDown(e) {
    if (!this.isOpen) return;

    // If typing in another input element outside calculator, only handle Escape
    const activeEl = document.activeElement;
    const isExternalInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && !this.el.contains(activeEl);

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (isExternalInput) return;

    // Numbers & Basic Keys
    if (/\d/.test(e.key)) {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken(e.key);
    } else if (e.key === '.') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken('.');
    } else if (e.key === '+') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken(' + ');
    } else if (e.key === '-') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken(' - ');
    } else if (e.key === '*' || e.key === 'x') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken(' × ');
    } else if (e.key === '/') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken(' ÷ ');
    } else if (e.key === '^') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken('^');
    } else if (e.key === '(' || e.key === ')') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken(e.key);
    } else if (e.key === '%') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken('%');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      soundscape?.playToggleClack?.();
      this.compute();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.backspace();
    } else if (e.key.toLowerCase() === 'c') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.clearAll();
    } else if (e.key.toLowerCase() === 'l') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken('log(');
    } else if (e.key.toLowerCase() === 'n') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken('ln(');
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      soundscape?.playKeyCapThunk?.();
      this.appendToken('π');
    }
  }

  appendToken(token) {
    if (this.justEvaluated) {
      // If operator follows evaluated answer, chain with Ans
      if (/^[+\-×÷^%]/.test(token.trim())) {
        this.expression = `Ans${token}`;
      } else {
        this.expression = token;
      }
      this.justEvaluated = false;
    } else {
      this.expression += token;
    }
    this.renderDisplay();
  }

  backspace() {
    if (this.justEvaluated) {
      this.clearAll();
      return;
    }
    if (!this.expression) return;

    // Check for multi-character tokens at the end
    const multiTokens = ['log(', 'ln(', 'sin(', 'cos(', 'tan(', 'sqrt(', '1/(', 'Ans', ' + ', ' - ', ' × ', ' ÷ '];
    for (const mt of multiTokens) {
      if (this.expression.endsWith(mt)) {
        this.expression = this.expression.slice(0, -mt.length);
        this.renderDisplay();
        return;
      }
    }

    this.expression = this.expression.slice(0, -1);
    this.renderDisplay();
  }

  clearAll() {
    this.expression = '';
    this.displayValue = '0';
    this.justEvaluated = false;
    this.renderDisplay();
  }

  toggleNegate() {
    if (!this.expression) {
      this.expression = '-';
      this.renderDisplay();
      return;
    }

    // If ends in a number, toggle negative sign
    const match = this.expression.match(/(-?\d+(\.\d+)?([eE][+-]?\d+)?)$/);
    if (match) {
      const numStr = match[1];
      const startIdx = match.index;
      if (numStr.startsWith('-')) {
        this.expression = this.expression.slice(0, startIdx) + numStr.slice(1);
      } else {
        this.expression = this.expression.slice(0, startIdx) + '-' + numStr;
      }
    } else {
      this.expression += '-';
    }
    this.renderDisplay();
  }

  toggleAngleMode() {
    this.isDegree = !this.isDegree;
    const btn = this.el.querySelector('[data-act="toggle-mode"]');
    if (btn) {
      btn.textContent = this.isDegree ? 'DEG' : 'RAD';
      btn.classList.toggle('active', this.isDegree);
    }
    const status = this.el.querySelector('#calc-status');
    if (status) {
      status.textContent = this.isDegree ? 'RAD: OFF · DEG: ON' : 'RAD: ON · DEG: OFF';
    }
  }

  toggleConstants() {
    this.showConstants = !this.showConstants;
    const panel = this.el.querySelector('#calc-const-panel');
    const btn = this.el.querySelector('[data-act="toggle-const"]');
    if (panel) panel.classList.toggle('hidden', !this.showConstants);
    if (btn) btn.classList.toggle('active', this.showConstants);
  }

  compute() {
    if (!this.expression.trim()) return;

    try {
      const res = evaluateExpression(this.expression, {
        isDegree: this.isDegree,
        ans: this.ans
      });

      if (res.ok) {
        this.tape = `${this.expression} =`;
        this.ans = res.value;
        this.displayValue = formatResult(res.value);
        this.expression = this.displayValue;
        this.justEvaluated = true;
        this.renderDisplay();
      }
    } catch (err) {
      this.displayValue = err.message || 'Error';
      const dispEl = this.el.querySelector('#calc-display');
      if (dispEl) {
        dispEl.textContent = this.displayValue;
        dispEl.classList.add('error');
      }
      soundscape?.playMissBuzzer?.();
    }
  }

  renderDisplay() {
    if (!this.el) return;
    const dispEl = this.el.querySelector('#calc-display');
    const tapeEl = this.el.querySelector('#calc-tape');

    if (tapeEl) {
      tapeEl.textContent = this.tape || (this.ans ? `Ans = ${formatResult(this.ans)}` : ' ');
    }

    if (dispEl) {
      dispEl.classList.remove('error');
      dispEl.textContent = this.expression || this.displayValue || '0';
    }
  }

  copyResult(btn) {
    const val = this.displayValue || this.expression || '0';
    try {
      navigator.clipboard.writeText(val);
      const prevText = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('applied');
      soundscape?.playBondSnap?.();
      setTimeout(() => {
        btn.textContent = prevText;
        btn.classList.remove('applied');
      }, 1200);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  }

  useResult(btn) {
    const val = this.displayValue || this.expression || '0';
    // Find target input on stage:
    // 1. Explicitly provided target
    // 2. .lq-entry-input (LearnFrame numeric stage entry)
    // 3. #bp-num (worked problem practice input)
    // 4. Any input inside interactive stage area
    let target = this.targetInput;
    if (!target || !target.isConnected) {
      target = document.querySelector('.lq-entry-input') ||
               document.querySelector('#bp-num') ||
               document.querySelector('#stage-interactive-area input');
    }

    if (target) {
      target.value = val;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.focus();

      const prevText = btn.textContent;
      btn.textContent = 'Applied';
      btn.classList.add('applied');
      soundscape?.playBondSnap?.();
      setTimeout(() => {
        btn.textContent = prevText;
        btn.classList.remove('applied');
      }, 1200);
    } else {
      // Fallback: copy to clipboard
      this.copyResult(btn);
    }
  }

  /**
   * Set bottom-left default position.
   * If the user hasn't dragged it manually, always pop up on the bottom left side of the screen.
   */
  applyBottomLeftPosition() {
    if (!this.el) return;
    if (this.hasMoved) return; // Keep user's custom dragged position

    this.el.style.left = '20px';
    this.el.style.bottom = '20px';
    this.el.style.top = 'auto';
    this.el.style.right = 'auto';
  }

  open({ targetInput = null } = {}) {
    this.build();
    this.targetInput = targetInput;
    this.isOpen = true;

    this.applyBottomLeftPosition();
    this.el.classList.remove('hidden');
    this.renderDisplay();

    window.addEventListener('keydown', this.onKeyDown);
    soundscape?.playNavRelayClick?.();
  }

  close() {
    if (!this.el || !this.isOpen) return;
    this.isOpen = false;
    this.el.classList.add('hidden');
    window.removeEventListener('keydown', this.onKeyDown);
    soundscape?.playNavRelayClick?.();
  }

  toggle(options = {}) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(options);
    }
  }
}

// Global singleton instance
const calc = new DigitalCalculator();

export function openCalculator(options) {
  calc.open(options);
}

export function closeCalculator() {
  calc.close();
}

export function toggleCalculator(options) {
  calc.toggle(options);
}

export function isCalculatorOpen() {
  return calc.isOpen;
}

