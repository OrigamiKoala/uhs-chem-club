/**
 * drills.js — the Drill Deck: every practice question in the Learn track, in one place.
 *
 * The questions live in the question bank (`learn/bank.js`); this screen
 * pools them into rounds and keeps the score. All the choosing and counting is
 * in `learn/drills.js` (pure, verified in Node); this file is only the table
 * the player sits at.
 *
 * Modes
 *   Daily Set    five questions, the same for everyone that day; finishing one in a week keeps the streak
 *   Quick Run    ten questions from every world or one, leaning toward what is shaky
 *   Timed Round  ninety seconds on the answer clock, three misses and it is over
 *   Weak Spots   what you have missed more often than you have got right
 *
 * Rewards are stars, a week streak, mastery tiers per world and commendations —
 * all cosmetic. A drill pays no XP and never reaches Standings, and nothing
 * here may call the XP rails (`verify:learn` scans for it).
 */

import { stage } from '../three/stage.js';
import { session } from '../session.js';
import { pageHeader, statRow, esc } from '../ui/layout.js';
import { getWorld } from '../learn/curriculum.js';
import { worldWorked } from '../learn/bank.js';
import { mountWorked } from '../ui/worked-problem.js';
import { soundscape } from '../audio/soundscape.js';
import {
  RUN_LENGTH, DAILY_LENGTH, SPRINT_SECONDS, SPRINT_LIVES, TIERS,
  normalizePractice, drillWorlds, loadPool, worldMastery, overallMastery,
  weekStreakOf, doneToday, weakIds, mulberry32, pickRun, pickDaily, pickWeak,
  withShuffledOptions, shuffled, recordAnswer, recordRun, recordSprint, starsFor, localDay
} from '../learn/drills.js';

const MODE_LABEL = {
  daily: 'Daily Set',
  run: 'Quick Run',
  sprint: 'Timed Round',
  weak: 'Weak Spots'
};

function stars(n, total = 3) {
  return Array.from({ length: total }, (_, i) =>
    `<span class="drill-star${i < n ? ' lit' : ''}" aria-hidden="true">★</span>`).join('');
}

// Each render takes a number; an older screen whose number is stale shuts itself down,
// so two instances never both answer one key press (e.g. #/drills then #/drills/unit03).
let generation = 0;

export function renderDrills(container, params = {}) {
  const myGeneration = ++generation;
  if (stage.cameraRig) stage.cameraRig.moveTo('starmap');

  const practice = () => {
    session.practice = normalizePractice(session.practice);
    return session.practice;
  };

  let scope = params.worldId && getWorld(params.worldId) ? params.worldId : 'all';
  let run = null;
  let disposed = false;
  let keyHandler = null;
  let timer = null;

  const stopRun = () => {
    clearInterval(timer);
    timer = null;
    if (keyHandler) window.removeEventListener('keydown', keyHandler);
    keyHandler = null;
  };

  // The router replaces `container.innerHTML` on navigation; clean up if our root vanishes.
  const guard = () => {
    if (disposed) return true;
    if (myGeneration !== generation || !container.querySelector('.m-drills')) {
      disposed = true;
      stopRun();
      return true;
    }
    return false;
  };

  /* ---------------------------------------------------------------
     HOME
     --------------------------------------------------------------- */
  function renderHome(notice = '') {
    stopRun();
    run = null;
    const p = practice();
    const worlds = drillWorlds();
    const streak = weekStreakOf(p.days);
    const overall = overallMastery(p);
    const starTotal = Object.values(p.stars).reduce((s, n) => s + n, 0);
    const weakCount = weakIds(p).length;
    const daily = doneToday(p);
    const scopeName = scope === 'all' ? 'every world' : getWorld(scope)?.world || scope;

    container.innerHTML = `
      <div class="screen-container m-screen m-drills">
        ${pageHeader({
          art: '/art/starmap.jpg',
          title: 'Drill Deck',
          actions: statRow([
            { label: 'Week Streak', value: String(streak), plain: true },
            { label: 'Mastered', value: `${overall.mastered} / ${overall.total}`, plain: true },
            { label: 'Stars', value: String(starTotal), plain: true }
          ])
        })}

        ${notice ? `<p class="drill-notice" role="status">${esc(notice)}</p>` : ''}

        <div class="drill-modes">
          <article class="plate drill-card" data-mode-card="daily">
            <div class="eyebrow ${daily ? '' : 'lit'}">Today</div>
            <h2 class="drill-card-title">Daily Set</h2>
            <p class="drill-card-line">${DAILY_LENGTH} questions, the same for every crew member today.</p>
            <div class="drill-card-foot">
              <span class="tag ${daily ? 'live' : ''}">${daily ? 'Done today' : streak ? `Streak: ${streak} week${streak === 1 ? '' : 's'}` : 'Start a streak'}</span>
              <button type="button" class="btn-primary quest-btn-sm m-tap" data-start="daily">${daily ? 'Again' : 'Start'}</button>
            </div>
          </article>

          <article class="plate drill-card" data-mode-card="run">
            <div class="eyebrow">Practice</div>
            <h2 class="drill-card-title">Quick Run</h2>
            <p class="drill-card-line">${RUN_LENGTH} questions. Earn up to three stars.</p>
            <label class="drill-scope">
              <span class="eyebrow">Questions from</span>
              <select id="drill-scope" class="form-input">
                <option value="all"${scope === 'all' ? ' selected' : ''}>Every world</option>
                ${worlds.map(w => `<option value="${esc(w.id)}"${scope === w.id ? ' selected' : ''}>${esc(w.unit)} · ${esc(w.world)}</option>`).join('')}
              </select>
            </label>
            <div class="drill-card-foot">
              <span class="drill-stars" aria-label="Best: ${p.stars[scope] || 0} of 3 stars">${stars(p.stars[scope] || 0)}</span>
              <button type="button" class="btn-primary quest-btn-sm m-tap" data-start="run">Start</button>
            </div>
          </article>

          <article class="plate drill-card" data-mode-card="sprint">
            <div class="eyebrow">Beat the clock</div>
            <h2 class="drill-card-title">Timed Round</h2>
            <p class="drill-card-line">${SPRINT_SECONDS} seconds on the answer clock. ${SPRINT_LIVES} misses ends it.</p>
            <div class="drill-card-foot">
              <span class="tag">Best: ${p.best.sprint || 0}</span>
              <button type="button" class="btn-primary quest-btn-sm m-tap" data-start="sprint">Start</button>
            </div>
          </article>

          <article class="plate drill-card" data-mode-card="weak">
            <div class="eyebrow">Review</div>
            <h2 class="drill-card-title">Weak Spots</h2>
            <p class="drill-card-line">${weakCount
              ? `${weakCount} question${weakCount === 1 ? '' : 's'} you have missed more than you have got right.`
              : 'Nothing shaky yet. Missed questions collect here.'}</p>
            <div class="drill-card-foot">
              <span class="tag ${weakCount ? 'warn' : ''}">${weakCount} waiting</span>
              <button type="button" class="btn-primary quest-btn-sm m-tap" data-start="weak"${weakCount ? '' : ' disabled'}>Start</button>
            </div>
          </article>
        </div>

        <section class="plate drill-mastery" aria-labelledby="drill-mastery-title">
          <div class="m-head drill-mastery-head">
            <h2 id="drill-mastery-title" class="section-title">Mastery</h2>
            <span class="eyebrow">A question is mastered when you have got it right twice, and right more often than wrong.</span>
          </div>
          <div class="drill-mastery-list">
            ${worlds.map(w => {
              const m = worldMastery(w, p);
              const pct = Math.round(m.fraction * 100);
              return `
                <div class="drill-world-row" data-world-row="${esc(w.id)}">
                  <div class="drill-world-name">
                    <span class="eyebrow">${esc(w.unit)}</span>
                    <strong>${esc(w.world)}</strong>
                  </div>
                  <div class="drill-meter" role="img" aria-label="${m.mastered} of ${m.total} mastered">
                    <span class="drill-meter-fill" style="width:${pct}%"></span>
                    ${TIERS.map(t => `<i class="drill-meter-tick" style="left:${t.min * 100}%" aria-hidden="true"></i>`).join('')}
                  </div>
                  <span class="drill-world-count">${m.mastered} / ${m.total}</span>
                  <span class="tag drill-tier ${m.tier ? 'live' : ''}">${m.tier ? m.tier.label : 'Unranked'}</span>
                  <button type="button" class="btn-secondary quest-btn-sm m-tap" data-drill-world="${esc(w.id)}">Drill</button>
                </div>`;
            }).join('')}
          </div>
          <p class="drill-fine">Drills pay no XP and never reach Standings. Stars, streaks and tiers are only for you.</p>
        </section>

        ${workedHtml(p)}

        <div class="drill-foot">
          <a href="#/learn" class="btn-secondary quest-btn-sm" style="text-decoration: none;">Learn Road</a>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-worked]').forEach(btn =>
      btn.addEventListener('click', () => openWorked(btn.dataset.worked)));
    container.querySelector('#drill-scope')?.addEventListener('change', e => {
      scope = e.target.value;
      renderHome();
    });
    container.querySelectorAll('[data-start]').forEach(btn =>
      btn.addEventListener('click', () => start(btn.dataset.start)));
    container.querySelectorAll('[data-drill-world]').forEach(btn =>
      btn.addEventListener('click', () => { scope = btn.dataset.drillWorld; start('run'); }));
  }

  /* ---------------------------------------------------------------
     WORKED PROBLEMS
     --------------------------------------------------------------- */
  function workedHtml(p) {
    const rows = drillWorlds().flatMap(w => worldWorked(w));
    if (!rows.length) return '';
    return `
      <section class="plate drill-mastery" aria-labelledby="drill-worked-title">
        <div class="m-head drill-mastery-head">
          <h2 id="drill-worked-title" class="section-title">Worked Problems</h2>
          <span class="eyebrow">Long problems taken one step at a time.</span>
        </div>
        <div class="drill-mastery-list">
          ${rows.map(wk => `
            <div class="drill-world-row">
              <div class="drill-world-name">
                <span class="eyebrow">${esc(wk.worldName)} · ${esc(wk.questTitle)}</span>
                <strong>${esc(wk.title)}</strong>
              </div>
              <span class="tag ${p.q[wk.id]?.c ? 'live' : ''}">${p.q[wk.id]?.c ? 'Worked' : 'Not yet'}</span>
              <button type="button" class="btn-secondary quest-btn-sm m-tap" data-worked="${esc(wk.id)}">Open</button>
            </div>`).join('')}
        </div>
      </section>`;
  }

  function openWorked(id) {
    const wk = drillWorlds().flatMap(w => worldWorked(w)).find(x => x.id === id);
    if (!wk) return;
    stopRun();
    container.innerHTML = `<div class="screen-container m-screen m-drills"><section class="plate drill-run"><div id="drill-worked-host"></div></section></div>`;
    mountWorked(container.querySelector('#drill-worked-host'), wk, {
      onDone: () => {
        recordAnswer(practice(), wk.id, true);
        session.savePractice();
        renderHome();
      },
      onLeave: () => renderHome()
    });
  }

  /* ---------------------------------------------------------------
     STARTING A ROUND
     --------------------------------------------------------------- */
  async function start(mode) {
    const p = practice();
    container.innerHTML = `<div class="screen-container m-screen m-drills"><p class="drill-notice" role="status">Pulling questions…</p></div>`;
    let pool = [];
    try {
      pool = await loadPool(mode === 'run' ? scope : 'all');
    } catch (err) {
      console.error('Drill Deck could not load questions:', err);
    }
    if (guard()) return;
    if (!pool.length) { renderHome('No questions could be loaded. Try again in a moment.'); return; }

    const rng = mulberry32((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
    let questions;
    if (mode === 'daily') questions = pickDaily(pool, localDay());
    else if (mode === 'weak') questions = pickWeak(pool, RUN_LENGTH, rng, p);
    else if (mode === 'sprint') questions = shuffled(pool, rng);
    else questions = pickRun(pool, RUN_LENGTH, rng, p);

    if (!questions.length) { renderHome('Nothing to ask right now.'); return; }

    run = {
      mode, scope: mode === 'run' ? scope : 'all', rng,
      questions: questions.map(q => withShuffledOptions(q, rng)),
      i: 0, right: 0, answered: 0, combo: 0, bestCombo: 0,
      lives: SPRINT_LIVES, timeLeft: SPRINT_SECONDS, picked: null, results: []
    };
    renderQuestion();
  }

  /* ---------------------------------------------------------------
     A QUESTION
     --------------------------------------------------------------- */
  function renderQuestion() {
    stopRun();
    const q = run.questions[run.i];
    run.picked = null;
    const sprint = run.mode === 'sprint';
    const total = run.questions.length;

    container.innerHTML = `
      <div class="screen-container m-screen m-drills">
        <section class="plate drill-run" aria-labelledby="drill-q">
          <div class="drill-run-top">
            <div>
              <div class="eyebrow lit">${esc(MODE_LABEL[run.mode])}</div>
              <div class="drill-source">${esc(q.worldName)} · ${esc(q.questTitle)}</div>
            </div>
            <div class="drill-run-keys">
              <span class="tag drill-combo${run.combo >= 3 ? ' hot' : ''}" id="drill-combo">Streak ${run.combo}</span>
              <button type="button" class="btn-secondary quest-btn-sm m-tap" data-quit>${sprint ? 'End Round' : 'Leave'}</button>
            </div>
          </div>

          ${sprint ? `
            <div class="drill-clock" aria-hidden="true"><span id="drill-clock-fill" style="width:${(run.timeLeft / SPRINT_SECONDS) * 100}%"></span></div>
            <div class="drill-sprint-row">
              <span class="drill-lives" aria-label="${run.lives} misses left">
                ${Array.from({ length: SPRINT_LIVES }, (_, i) => `<i class="drill-life${i < run.lives ? ' on' : ''}"></i>`).join('')}
              </span>
              <span class="tag" id="drill-clock-text">${Math.ceil(run.timeLeft)}s</span>
              <span class="tag">Correct: ${run.right}</span>
            </div>
          ` : `
            <ol class="drill-pips" aria-label="Question ${run.i + 1} of ${total}">
              ${run.questions.map((_, i) => {
                const r = run.results[i];
                const cls = i === run.i ? 'now' : r === true ? 'right' : r === false ? 'wrong' : '';
                return `<li class="drill-pip ${cls}"></li>`;
              }).join('')}
            </ol>
          `}

          <h2 id="drill-q" class="drill-question">${esc(q.question)}</h2>

          <div class="drill-options" role="group" aria-label="Answers">
            ${q.options.map((o, n) => `
              <button type="button" class="choice-option drill-opt" data-opt="${esc(o.id)}">
                <span class="drill-opt-key" aria-hidden="true">${n + 1}</span>${esc(o.label)}
              </button>`).join('')}
          </div>

          <div id="drill-feedback" class="drill-feedback" role="status" aria-live="polite"></div>

          <div class="drill-run-foot">
            <span class="eyebrow">${sprint ? 'The clock pauses while you read the answer.' : `Question ${run.i + 1} of ${total}`}</span>
            <button type="button" class="btn-primary" id="drill-next" disabled>Next</button>
          </div>
        </section>
      </div>
    `;

    container.querySelectorAll('.drill-opt').forEach(btn =>
      btn.addEventListener('click', () => answer(btn.dataset.opt)));
    container.querySelector('[data-quit]')?.addEventListener('click', () => {
      if (sprint) finish(); else renderHome('Round left. Your answers so far still count toward mastery.');
    });
    container.querySelector('#drill-next')?.addEventListener('click', next);

    keyHandler = e => {
      if (guard()) return;
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length && run.picked === null) {
        answer(q.options[n - 1].id);
      } else if ((e.key === 'Enter' || e.key === ' ') && run.picked !== null) {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', keyHandler);

    if (sprint) {
      // The answer clock runs only while a question is unanswered.
      let last = performance.now();
      timer = setInterval(() => {
        if (guard()) return;
        const now = performance.now();
        const dt = (now - last) / 1000;
        last = now;
        if (run.picked !== null) return;
        run.timeLeft = Math.max(0, run.timeLeft - dt);
        const fill = container.querySelector('#drill-clock-fill');
        const text = container.querySelector('#drill-clock-text');
        if (fill) fill.style.width = `${(run.timeLeft / SPRINT_SECONDS) * 100}%`;
        if (text) text.textContent = `${Math.ceil(run.timeLeft)}s`;
        if (run.timeLeft <= 0) finish();
      }, 200);
    }
  }

  function answer(optId) {
    if (!run || run.picked !== null) return;
    const q = run.questions[run.i];
    run.picked = optId;
    const correct = optId === q.answer;
    run.answered++;
    run.results[run.i] = correct;
    if (correct) { run.right++; run.combo++; run.bestCombo = Math.max(run.bestCombo, run.combo); }
    else { run.combo = 0; if (run.mode === 'sprint') run.lives--; }

    recordAnswer(practice(), q.id, correct);
    session.savePractice();

    container.querySelectorAll('.drill-opt').forEach(b => {
      if (b.dataset.opt === q.answer) b.classList.add('correct');
      else if (b.dataset.opt === optId) b.classList.add('incorrect');
      b.disabled = true;
    });
    const combo = container.querySelector('#drill-combo');
    if (combo) { combo.textContent = `Streak ${run.combo}`; combo.classList.toggle('hot', run.combo >= 3); }
    const fb = container.querySelector('#drill-feedback');
    if (fb) {
      fb.innerHTML = `
        <div class="lq-practice-verdict ${correct ? 'correct' : 'incorrect'}">
          <span class="lq-practice-mark" aria-hidden="true">${correct ? '✓' : '✗'}</span>
          <span class="lq-practice-verdict-body"><strong>${correct ? 'Correct.' : 'Not this one.'}</strong> ${esc(q.explanation)}</span>
        </div>`;
    }
    const nextBtn = container.querySelector('#drill-next');
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.textContent = run.mode !== 'sprint' && run.i >= run.questions.length - 1 ? 'Finish' : 'Next';
      nextBtn.focus({ preventScroll: true });
    }
    (correct ? soundscape.playBondSnap : soundscape.playMissBuzzer)?.call(soundscape);
  }

  function next() {
    if (!run || run.picked === null) return;
    if (run.mode === 'sprint') {
      if (run.lives <= 0 || run.timeLeft <= 0) { finish(); return; }
      run.i++;
      if (run.i >= run.questions.length) {
        // Pool exhausted: deal the same questions again in a new order.
        run.questions = shuffled(run.questions, run.rng).map(q => withShuffledOptions(q, run.rng));
        run.i = 0;
      }
      renderQuestion();
      return;
    }
    run.i++;
    if (run.i >= run.questions.length) finish();
    else renderQuestion();
  }

  /* ---------------------------------------------------------------
     THE RESULT
     --------------------------------------------------------------- */
  function finish() {
    stopRun();
    if (!run) { renderHome(); return; }
    const p = practice();
    const r = run;
    let headline;
    let detail;
    let starRow = '';

    if (r.mode === 'sprint') {
      const before = p.best.sprint || 0;
      const isBest = recordSprint(p, r.right);
      headline = `${r.right} correct`;
      detail = isBest && r.right > 0
        ? `A new best${before ? `, up from ${before}` : ''}.`
        : `Your best is ${p.best.sprint || 0}.`;
    } else {
      const scoped = r.mode === 'run' ? r.scope : null;
      const earned = recordRun(p, { scope: scoped, correct: r.right, total: r.questions.length });
      // The Daily Set and Weak Spots have no per-world best, but they still earn stars to show.
      starRow = `<div class="drill-result-stars" aria-label="${earned} of 3 stars">${stars(earned)}</div>`;
      headline = `${r.right} of ${r.questions.length} correct`;
      const missed = r.answered - r.right;
      detail = missed
        ? `${missed} missed — ${missed === 1 ? 'it' : 'they'} will come back in Weak Spots until you have them.`
        : 'No misses.';
      if (r.mode === 'run' && earned >= 3) detail = 'A clean run. ' + detail;
    }
    session.savePractice();
    session.checkCommendations();
    const streak = weekStreakOf(p.days);

    container.innerHTML = `
      <div class="screen-container m-screen m-drills">
        <section class="plate drill-result" aria-labelledby="drill-result-title">
          <div class="eyebrow lit">${esc(MODE_LABEL[r.mode])} · Complete</div>
          ${starRow}
          <h2 id="drill-result-title" class="drill-result-title">${esc(headline)}</h2>
          <p class="drill-result-line">${esc(detail)}</p>
          <div class="drill-result-stats">
            <span class="tag">Best streak in round: ${r.bestCombo}</span>
            <span class="tag ${streak ? 'live' : ''}">Week streak: ${streak}</span>
          </div>
          <div class="drill-result-keys">
            <button type="button" class="btn-primary" data-again>Again</button>
            <button type="button" class="btn-secondary" data-weak${weakIds(p).length ? '' : ' disabled'}>Weak Spots</button>
            <button type="button" class="btn-secondary" data-deck>Back to Deck</button>
          </div>
        </section>
      </div>
    `;
    const mode = r.mode;
    container.querySelector('[data-again]')?.addEventListener('click', () => start(mode));
    container.querySelector('[data-weak]')?.addEventListener('click', () => start('weak'));
    container.querySelector('[data-deck]')?.addEventListener('click', () => renderHome());
    run = null;
  }

  renderHome();
}
