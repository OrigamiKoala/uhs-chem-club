/**
 * calculator.js — Digital Scientific Entry Calculator for Avalon.
 *
 * "The Scoured Plate" — machined hardware for chemical calculations.
 * Features:
 *   - Command/entry-line interface: type math expressions and press Enter to evaluate
 *   - Chaining with Ans: typing e.g. "5+3 [enter]" then "*2" displays "Ans * 2 = 16"
 *   - Direct support for chemistry constants in expressions and quick constant chips:
 *     R, N_A, F, h, c, k_B, atm, K_w, pi, e
 *   - Full scientific math: arithmetic, logs (log10, ln), powers, roots, trig (DEG/RAD)
 *   - History tape of recent calculations (with Up/Down arrow recall)
 *   - Moveable (drag by header), closeable (X button, Esc, or toggle)
 *   - "Copy" to clipboard and "Use Value" to auto-fill stage input fields
 *   - Native sound effects via soundscape
 */

import { soundscape } from '../audio/soundscape.js';

/** Essential constants in chemistry */
export const CONSTANTS = [
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
      } else if (lower === 'ans') {
        tokens.push({ type: 'NUM', value: ans });
      } else if (lower === 'r') {
        tokens.push({ type: 'NUM', value: 8.314 });
      } else if (lower === 'na' || lower === 'n_a') {
        tokens.push({ type: 'NUM', value: 6.022e23 });
      } else if (lower === 'f') {
        tokens.push({ type: 'NUM', value: 96485 });
      } else if (lower === 'h') {
        tokens.push({ type: 'NUM', value: 6.626e-34 });
      } else if (lower === 'c') {
        tokens.push({ type: 'NUM', value: 2.998e8 });
      } else if (lower === 'kb' || lower === 'k_b') {
        tokens.push({ type: 'NUM', value: 1.381e-23 });
      } else if (lower === 'atm') {
        tokens.push({ type: 'NUM', value: 101325 });
      } else if (lower === 'kw' || lower === 'k_w') {
        tokens.push({ type: 'NUM', value: 1.0e-14 });
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
    this.inputEl = null;
    this.tapeEl = null;
    this.isOpen = false;
    this.history = []; // Array of { expr, result }
    this.historyIdx = -1;
    this.ans = 0;
    this.justEvaluated = false;
    this.isDegree = true;
    this.targetInput = null;

    // Dragging state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    this.hasMoved = false;

    this.onInputKeyDown = this.onInputKeyDown.bind(this);
    this.onGlobalKeyDown = this.onGlobalKeyDown.bind(this);
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
          <button type="button" class="scoured-calc-close-btn" data-act="close" title="Close Calculator (Esc)" aria-label="Close Calculator">
            ✕
          </button>
        </div>
      </div>

      <!-- Chemistry Constants Strip -->
      <div class="scoured-calc-const-bar" role="toolbar" aria-label="Chemistry Constants">
        <span class="scoured-calc-const-tag">CONST</span>
        <div class="scoured-calc-const-scroll">
          ${CONSTANTS.map(c => `
            <button type="button" class="scoured-const-chip" data-const-val="${c.val}" data-const-sym="${c.sym}" title="${c.desc}">
              <span class="scoured-const-sym">${c.sym}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- History Tape -->
      <div class="scoured-calc-screen">
        <div class="scoured-calc-tape" id="calc-tape" role="log" aria-live="polite">
          <div class="scoured-calc-tape-empty">Ready. Type an expression and press Enter.</div>
        </div>

        <!-- Entry Line -->
        <div class="scoured-calc-entry-row">
          <span class="scoured-calc-prompt" aria-hidden="true">&gt;</span>
          <input
            type="text"
            id="calc-input"
            class="scoured-calc-input"
            placeholder="Type expression… (e.g. 5+3, -log(1e-7), R*298)"
            autocomplete="off"
            spellcheck="false"
            aria-label="Calculator expression input"
          />
        </div>

        <!-- Status & Utility Bar -->
        <div class="scoured-calc-screen-bar">
          <span class="scoured-calc-screen-status" id="calc-status">Ans = 0</span>
          <div class="scoured-calc-screen-actions">
            <button type="button" class="scoured-calc-util-btn" data-act="clear" title="Clear history">Clear</button>
            <button type="button" class="scoured-calc-util-btn" data-act="copy" title="Copy last result">Copy</button>
            <button type="button" class="scoured-calc-util-btn" data-act="use" title="Insert into stage input">Use Value</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);
    this.inputEl = this.el.querySelector('#calc-input');
    this.tapeEl = this.el.querySelector('#calc-tape');
    this.bindEvents();
  }

  bindEvents() {
    this.inputEl.addEventListener('keydown', this.onInputKeyDown);

    this.el.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const act = btn.dataset.act;
      const constVal = btn.dataset.constVal;

      if (constVal) {
        soundscape?.playKeyCapThunk?.();
        this.insertConstant(constVal);
      } else if (act === 'clear') {
        soundscape?.playKeyCapThunk?.();
        this.clearAll();
      } else if (act === 'toggle-mode') {
        soundscape?.playCrtTick?.();
        this.toggleAngleMode();
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
    if (e.target.closest('button') || e.target.closest('input')) return;
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
    const w = this.el.offsetWidth || 380;
    const h = this.el.offsetHeight || 220;
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

  onInputKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      this.evaluateCurrentInput();
      return;
    }

    // Up / Down arrow history navigation
    if (e.key === 'ArrowUp') {
      if (this.history.length > 0) {
        e.preventDefault();
        if (this.historyIdx < this.history.length - 1) {
          this.historyIdx++;
        }
        const item = this.history[this.history.length - 1 - this.historyIdx];
        if (item) {
          this.inputEl.value = item.expr;
          this.justEvaluated = false;
        }
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      if (this.history.length > 0) {
        e.preventDefault();
        if (this.historyIdx > 0) {
          this.historyIdx--;
          const item = this.history[this.history.length - 1 - this.historyIdx];
          this.inputEl.value = item.expr;
        } else {
          this.historyIdx = -1;
          this.inputEl.value = '';
        }
        this.justEvaluated = false;
      }
      return;
    }

    // Chaining: if an evaluation just completed, typing an operator starts "Ans <op>"
    if (this.justEvaluated) {
      const isOperator = ['*', '/', '+', '-', '^', '%', 'x'].includes(e.key);
      if (isOperator) {
        e.preventDefault();
        const op = (e.key === 'x') ? '*' : e.key;
        this.inputEl.value = `Ans ${op} `;
        this.justEvaluated = false;
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Typing a digit or letter starts fresh
        this.inputEl.value = '';
        this.justEvaluated = false;
      }
    }
  }

  onGlobalKeyDown(e) {
    if (!this.isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  evaluateCurrentInput() {
    const raw = this.inputEl.value.trim();
    if (!raw) return;

    soundscape?.playToggleClack?.();

    try {
      const res = evaluateExpression(raw, {
        isDegree: this.isDegree,
        ans: this.ans
      });

      if (res.ok) {
        const formatted = formatResult(res.value);
        this.ans = res.value;
        this.justEvaluated = true;
        this.history.push({ expr: raw, result: formatted });
        this.historyIdx = -1;

        this.addTapeLine(raw, formatted);
        this.updateStatus();

        // Clear input for next entry while showing placeholder of result
        this.inputEl.value = '';
        this.inputEl.placeholder = `Ans = ${formatted}`;
      }
    } catch (err) {
      soundscape?.playMissBuzzer?.();
      this.addTapeError(raw, err.message || 'Error');
    }
  }

  addTapeLine(expr, result) {
    if (!this.tapeEl) return;
    // Remove initial empty placeholder if present
    this.tapeEl.querySelector('.scoured-calc-tape-empty')?.remove();

    const line = document.createElement('div');
    line.className = 'scoured-calc-tape-row';
    line.innerHTML = `
      <span class="scoured-calc-tape-expr">${this.escapeHtml(expr)}</span>
      <span class="scoured-calc-tape-eq">=</span>
      <span class="scoured-calc-tape-res">${this.escapeHtml(result)}</span>
    `;
    this.tapeEl.appendChild(line);
    this.tapeEl.scrollTop = this.tapeEl.scrollHeight;
  }

  addTapeError(expr, msg) {
    if (!this.tapeEl) return;
    this.tapeEl.querySelector('.scoured-calc-tape-empty')?.remove();

    const line = document.createElement('div');
    line.className = 'scoured-calc-tape-row error';
    line.innerHTML = `
      <span class="scoured-calc-tape-expr">${this.escapeHtml(expr)}</span>
      <span class="scoured-calc-tape-eq">=</span>
      <span class="scoured-calc-tape-res">${this.escapeHtml(msg)}</span>
    `;
    this.tapeEl.appendChild(line);
    this.tapeEl.scrollTop = this.tapeEl.scrollHeight;
  }

  updateStatus() {
    const status = this.el.querySelector('#calc-status');
    if (status) {
      status.textContent = `Ans = ${formatResult(this.ans)}`;
    }
  }

  insertConstant(val) {
    if (this.justEvaluated) {
      this.inputEl.value = val;
      this.justEvaluated = false;
    } else {
      const start = this.inputEl.selectionStart || this.inputEl.value.length;
      const end = this.inputEl.selectionEnd || this.inputEl.value.length;
      const text = this.inputEl.value;
      this.inputEl.value = text.slice(0, start) + val + text.slice(end);
      const nextPos = start + val.length;
      this.inputEl.setSelectionRange(nextPos, nextPos);
    }
    this.inputEl.focus();
  }

  clearAll() {
    this.history = [];
    this.historyIdx = -1;
    this.ans = 0;
    this.justEvaluated = false;
    this.inputEl.value = '';
    this.inputEl.placeholder = 'Type expression… (e.g. 5+3, -log(1e-7), R*298)';
    if (this.tapeEl) {
      this.tapeEl.innerHTML = '<div class="scoured-calc-tape-empty">Ready. Type an expression and press Enter.</div>';
    }
    this.updateStatus();
    this.inputEl.focus();
  }

  toggleAngleMode() {
    this.isDegree = !this.isDegree;
    const btn = this.el.querySelector('[data-act="toggle-mode"]');
    if (btn) {
      btn.textContent = this.isDegree ? 'DEG' : 'RAD';
      btn.classList.toggle('active', this.isDegree);
    }
    this.inputEl.focus();
  }

  copyResult(btn) {
    const val = formatResult(this.ans);
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
    this.inputEl.focus();
  }

  useResult(btn) {
    const val = formatResult(this.ans);
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
      this.copyResult(btn);
    }
  }

  applyBottomLeftPosition() {
    if (!this.el) return;
    if (this.hasMoved) return;

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

    window.addEventListener('keydown', this.onGlobalKeyDown);
    soundscape?.playNavRelayClick?.();

    // Auto-focus input entry line
    setTimeout(() => {
      this.inputEl?.focus();
    }, 50);
  }

  close() {
    if (!this.el || !this.isOpen) return;
    this.isOpen = false;
    this.el.classList.add('hidden');
    window.removeEventListener('keydown', this.onGlobalKeyDown);
    soundscape?.playNavRelayClick?.();
  }

  toggle(options = {}) {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(options);
    }
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
