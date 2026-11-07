/**
 * test-calculator.mjs — Verification test for Digital Scientific Calculator
 */

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim();

const { evaluateExpression, formatResult, CONSTANTS } = await import('../src/ui/calculator.js');

let passed = 0;
let failed = 0;

function assert(condition, desc) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${desc}`);
  }
}

function test(expr, expected, opts = {}) {
  try {
    const res = evaluateExpression(expr, opts);
    const formatted = formatResult(res.value);
    assert(Math.abs(res.value - expected) < 1e-9 || formatted === String(expected),
      `eval "${expr}" expected ${expected}, got ${res.value} (formatted: ${formatted})`);
  } catch (err) {
    failed++;
    console.error(`FAIL: "${expr}" threw error: ${err.message}`);
  }
}

function testError(expr, opts = {}) {
  try {
    evaluateExpression(expr, opts);
    failed++;
    console.error(`FAIL: "${expr}" should have failed but succeeded`);
  } catch (err) {
    passed++;
  }
}

console.log('Testing Digital Scientific Calculator Evaluation Engine...\n');

// 1. Basic Arithmetic & Precedence
test('2 + 3 * 4', 14);
test('(2 + 3) * 4', 20);
test('10 - 4 - 2', 4);
test('10 / 2 * 3', 15);
test('15 / 3 + 2 * 4', 13);
test('7 % 4', 3);

// 2. Scientific Notation & Big/Small Numbers
test('1.5e-3 * 2', 0.003);
test('6.022e23 / 2', 3.011e23);
test('1e-7 + 2e-7', 3e-7);

// 3. Chemistry Logarithms (pH, Kinetics, Arrhenius)
test('-log(1e-7)', 7);
test('-log(1e-3)', 3);
test('-log(2.5e-4)', 3.6020599913279625);
test('log(100)', 2);
test('ln(e)', 1);
test('ln(2.718281828459045)', 1);

// 4. Powers & Roots
test('2^3', 8);
test('2^10', 1024);
test('10^-3', 0.001);
test('sqrt(144)', 12);
test('sqrt(2)', Math.SQRT2);
test('cbrt(27)', 3);

// 5. Trigonometry (Degree & Radian)
test('sin(90)', 1, { isDegree: true });
test('cos(0)', 1, { isDegree: true });
test('cos(90)', 0, { isDegree: true });
test('tan(45)', 1, { isDegree: true });
test('sin(pi / 2)', 1, { isDegree: false });
test('cos(pi)', -1, { isDegree: false });

// 6. Implicit Multiplication & Parens
test('2pi', 2 * Math.PI);
test('2(3 + 4)', 14);
test('(2 + 3)(4 + 5)', 45);
test('2log(100)', 4);
test('log(100', 2); // auto-close parens

// 7. Ans Chaining (e.g. 5+3=8 then Ans*2=16)
test('5 + 3', 8);
test('Ans * 2', 16, { ans: 8 });
test('Ans + 5', 15, { ans: 10 });
test('Ans / 2', 8, { ans: 16 });

// 8. Direct Chemistry Constants in Expressions
test('R * 298.15', 2478.8191);
test('96485 * 1.1', 106133.5);
test('F * 2', 192970);
test('Na / 2', 3.011e23);
test('atm / 2', 50662.5);
test('Kw', 1e-14);

// 9. Error Handling
testError('1 / 0');
testError('log(-5)');
testError('ln(0)');
testError('sqrt(-4)');
testError('asin(2)');

// 10. Format Result tests
assert(formatResult(0.1 + 0.2) === '0.3', 'Float rounding for 0.1 + 0.2');
assert(formatResult(2478.8190999999997) === '2478.8191', 'Float jitter reduction');
assert(formatResult(0) === '0', 'Zero formatting');

// 11. Constants Registry
assert(CONSTANTS.length === 9, 'All 9 chemistry constants defined');

console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
