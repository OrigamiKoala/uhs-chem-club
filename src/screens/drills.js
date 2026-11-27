/**
 * drills.js — the Practice / Drill Deck: every practice question in the Learn track.
 *
 * Questions are drawn only from quests and worlds the player has finished.
 * All choosing and counting lives in `learn/drills.js` (pure, verified in Node).
 *
 * NO XP, EVER. Nothing here may call the XP rails (`verify:learn` scans for it).
 */

import { stage } from '../three/stage.js';
import { session } from '../session.js';
import { pageHeader, statRow, esc } from '../ui/layout.js';
import { getWorld, getQuest } from '../learn/curriculum.js';
import { isQuestComplete, isWorldComplete } from '../learn/progress.js';
import { worldWorked, deepWorked } from '../learn/bank.js';
import { mountWorked } from '../ui/worked-problem.js';
import { toggleCalculator, closeCalculator } from '../ui/calculator.js';
import { soundscape } from '../audio/soundscape.js';
import {
  RUN_LENGTH, SPRINT_SECONDS, SPRINT_LIVES, TIERS,
  normalizePractice, drillWorlds, loadPool, worldMastery, overallMastery,
  weakIds, mulberry32, pickRun, pickWeak,
  withShuffledOptions, shuffled, recordAnswer, recordRun, recordSprint
} from '../learn/drills.js';

const MODE_LABEL = {
  run: 'Quick Run',
  sprint: 'Beat the clock',
  weak: 'Review'
};

function stars(n, total = 3) {
  return Array.from({ length: total }, (_, i) =>
    `<span class="drill-star${i < n ? ' lit' : ''}" aria-hidden="true">★</span>`).join('');
}

/** True when the player has completed the quest (or whole world) that owns this problem. */
function isProblemUnlocked(q) {
  const world = getWorld(q.worldId);
  if (!world) return false;
  if (isWorldComplete(world)) return true;
  if (q.questId) {
    const quest = getQuest(q.worldId, q.questId);
    if (quest) return isQuestComplete(quest);
  }
  return false;
}

/** True when at least one quest in `world` has been completed. */
function hasFinishedInWorld(world) {
  if (!world) return false;
  if (isWorldComplete(world)) return true;
  return (world.quests || []).some(q => q.status === 'live' && isQuestComplete(q));
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
  let workedTier = 'all';
  let run = null;
  let disposed = false;
  let keyHandler = null;
  let timer = null;

  const stopRun = () => {
    clearInterval(timer);
    timer = null;
    if (keyHandler) window.removeEventListener('keydown', keyHandler);
    keyHandler = null;
    closeCalculator();
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
    const finishedWorlds = worlds.filter(hasFinishedInWorld);
    if (scope !== 'all' && !finishedWorlds.some(w => w.id === scope)) scope = 'all';
    const overall = overallMastery(p);
    const starTotal = Object.values(p.stars).reduce((s, n) => s + n, 0);
    const weakCount = weakIds(p).length;

    container.innerHTML = `
      <div class="screen-container m-screen m-drills">
        ${pageHeader({
          art: '/art/starmap.jpg',
          title: 'Practice',
          actions: statRow([
            { label: 'Mastered', value: `${overall.mastered} / ${overall.total}`, plain: true },
            { label: 'Stars', value: String(starTotal), plain: true }
          ])
        })}

        ${notice ? `<p class="drill-notice" role="status">${esc(notice)}</p>` : ''}
        ${finishedWorlds.length ? '' : '<p class="drill-notice">Finish any Learn quest to open these rounds.</p>'}

        <div class="drill-modes">
          <article class="plate drill-card" data-mode-card="run">
            <h2 class="drill-card-title">Quick Run</h2>
            <p class="drill-card-line">${RUN_LENGTH} questions. Earn up to three stars.</p>
            <label class="drill-scope">
              <span class="eyebrow">Questions from</span>
              <select id="drill-scope" class="form-input">
                <option value="all"${scope === 'all' ? ' selected' : ''}>Every finished world</option>
                ${finishedWorlds.map(w => `<option value="${esc(w.id)}"${scope === w.id ? ' selected' : ''}>${esc(w.unit)} · ${esc(w.world)}</option>`).join('')}
              </select>
            </label>
            <div class="drill-card-foot">
              <span class="drill-stars" aria-label="Best: ${p.stars[scope] || 0} of 3 stars">${stars(p.stars[scope] || 0)}</span>
              <button type="button" class="btn-primary quest-btn-sm m-tap" data-start="run"${finishedWorlds.length ? '' : ' disabled'}>Start</button>
            </div>
          </article>

          <article class="plate drill-card" data-mode-card="sprint">
            <h2 class="drill-card-title">Beat the clock</h2>
            <p class="drill-card-line">${SPRINT_SECONDS} seconds per question.</p>
            <div class="drill-card-foot">
              <span class="tag">Best: ${p.best.sprint || 0}</span>
              <button type="button" class="btn-primary quest-btn-sm m-tap" data-start="sprint"${finishedWorlds.length ? '' : ' disabled'}>Start</button>
            </div>
          </article>

          <article class="plate drill-card" data-mode-card="weak">
            <h2 class="drill-card-title">Review</h2>
            <p class="drill-card-line">Questions you missed come back here.</p>
            <div class="drill-card-foot">
              <span class="tag ${weakCount ? 'warn' : ''}">${weakCount} waiting</span>
              <button type="button" class="btn-primary quest-btn-sm m-tap" data-start="weak"${weakCount && finishedWorlds.length ? '' : ' disabled'}>Start</button>
            </div>
          </article>
        </div>

        <section class="plate drill-mastery" aria-labelledby="drill-mastery-title">
          <div class="m-head drill-mastery-head">
            <h2 id="drill-mastery-title" class="section-title">Mastery</h2>
          </div>
          <div class="drill-mastery-list">
            ${worlds.map(w => {
              const m = worldMastery(w, p);
              const pct = Math.round(m.fraction * 100);
              const unlocked = hasFinishedInWorld(w);
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
                  <button type="button" class="btn-secondary quest-btn-sm m-tap" data-drill-world="${esc(w.id)}"${unlocked ? '' : ' disabled'}>Drill</button>
                </div>`;
            }).join('')}
          </div>
        </section>

        ${workedHtml(p)}
      </div>
    `;

    container.querySelectorAll('[data-worked]').forEach(btn =>
      btn.addEventListener('click', () => openWorked(btn.dataset.worked)));
    container.querySelectorAll('[data-worked-tier]').forEach(btn =>
      btn.addEventListener('click', () => {
        workedTier = btn.dataset.workedTier;
        renderHome();
      }));
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
  function allWorkedRows() {
    const worlds = drillWorlds();
    const deep = deepWorked(worlds, 'all');
    const bench = worlds.flatMap(w => worldWorked(w));
    return [...deep, ...bench];
  }

  function workedHtml(p) {
    const worlds = drillWorlds();
    const deep = deepWorked(worlds, 'all');
    const apRows = deep.filter(w => w.tier === 'ap');
    const olyRows = deep.filter(w => w.tier === 'olympiad');
    const benchRows = worlds.flatMap(w => worldWorked(w));
    const allRows = [...apRows, ...olyRows, ...benchRows];
    if (!allRows.length) return '';

    const rows = workedTier === 'ap' ? apRows
      : workedTier === 'olympiad' ? olyRows
      : workedTier === 'bench' ? benchRows
      : allRows;

    const tabs = [
      { id: 'all', label: `All (${allRows.length})` },
      { id: 'ap', label: `AP (${apRows.length})` },
      { id: 'olympiad', label: `Olympiad (${olyRows.length})` },
      { id: 'bench', label: `Bench (${benchRows.length})` }
    ];

    return `
      <section class="plate drill-mastery" aria-labelledby="drill-worked-title">
        <div class="m-head drill-mastery-head">
          <h2 id="drill-worked-title" class="section-title">Worked Problems</h2>
          <div class="drill-worked-filters" role="group" aria-label="Filter worked problems">
            ${tabs.map(t => `<button type="button" class="btn-secondary quest-btn-sm drill-filter-btn${workedTier === t.id ? ' active' : ''}" data-worked-tier="${t.id}" aria-pressed="${workedTier === t.id}">${esc(t.label)}</button>`).join('')}
          </div>
        </div>
        <div class="drill-mastery-list">
          ${rows.map(wk => `
            <div class="drill-world-row drill-worked-row">
              <div class="drill-world-name">
                <span class="eyebrow">${esc(wk.worldName)} · ${esc(wk.questTitle)}${wk.beyondAp ? ' · Beyond AP' : ''}</span>
                <strong>${esc(wk.title)}</strong>
              </div>
              <span class="tag ${p.q[wk.id]?.c ? 'live' : ''}">${p.q[wk.id]?.c ? '100%' : '0%'}</span>
              <button type="button" class="btn-secondary quest-btn-sm m-tap" data-worked="${esc(wk.id)}">Open</button>
            </div>`).join('')}
        </div>
      </section>`;
  }

  function openWorked(id) {
    const wk = allWorkedRows().find(x => x.id === id);
    if (!wk) return;
    stopRun();
    container.innerHTML = `<div class="screen-container m-screen m-drills is-active"><section class="plate drill-run drill-run-full"><div id="drill-worked-host"></div></section></div>`;
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
    container.innerHTML = `<div class="screen-container m-screen m-drills is-active"><p class="drill-notice" role="status">Pulling questions…</p></div>`;
    let pool = [];
    try {
      const raw = await loadPool(mode === 'run' ? scope : 'all');
      pool = raw.filter(isProblemUnlocked);
    } catch (err) {
      console.error('Practice could not load questions:', err);
    }
    if (guard()) return;
    if (!pool.length) {
      renderHome('Finish a quest in Learn first to unlock practice questions from it.');
      return;
    }

    const rng = mulberry32((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
    let questions;
    if (mode === 'weak') questions = pickWeak(pool, RUN_LENGTH, rng, p);
    else if (mode === 'sprint') questions = shuffled(pool, rng);
    else questions = pickRun(pool, RUN_LENGTH, rng, p);

    if (!questions.length) { renderHome('Nothing to ask right now.'); return; }

    run = {
      mode, scope: mode === 'run' ? scope : 'all', rng,
      questions: questions.map(q => withShuffledOptions(q, rng)),
      i: 0, right: 0, answered: 0,
      lives: SPRINT_LIVES, timeLeft: SPRINT_SECONDS, picked: null, results: []
    };
    renderQuestion();
  }

  /* ---------------------------------------------------------------
     A QUESTION
     --------------------------------------------------------------- */
  function renderQuestion() {
    clearInterval(timer);
    timer = null;
    if (keyHandler) window.removeEventListener('keydown', keyHandler);
    keyHandler = null;

    const q = run.questions[run.i];
    run.picked = null;
    const sprint = run.mode === 'sprint';
    if (sprint) run.timeLeft = SPRINT_SECONDS;
    const total = run.questions.length;

    container.innerHTML = `
      <div class="screen-container m-screen m-drills is-active">
        <section class="plate drill-run drill-run-full" aria-labelledby="drill-q">
          <div class="drill-run-top">
            <div>
              <div class="eyebrow lit">${esc(MODE_LABEL[run.mode])}</div>
              <div class="drill-source">${esc(q.worldName)} · ${esc(q.questTitle)}</div>
            </div>
            <div class="drill-run-keys">
              <button type="button" class="btn-secondary quest-btn-sm m-tap" id="drill-calc-btn" title="Open scientific calculator" aria-label="Open scientific calculator">Calculator</button>
              <button type="button" class="btn-secondary quest-btn-sm m-tap" data-quit>${sprint ? 'End Round' : 'Leave'}</button>
            </div>
          </div>

          ${sprint ? `
            <div class="drill-clock" aria-hidden="true"><span id="drill-clock-fill" style="width:100%"></span></div>
            <div class="drill-sprint-row">
              <span class="drill-lives" aria-label="${run.lives} misses left">
                ${Array.from({ length: SPRINT_LIVES }, (_, i) => `<i class="drill-life${i < run.lives ? ' on' : ''}"></i>`).join('')}
              </span>
              <span class="tag" id="drill-clock-text">${SPRINT_SECONDS}s</span>
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

          <div class="drill-stage-body">
            <h2 id="drill-q" class="drill-question">${esc(q.question)}</h2>

            <div class="drill-options" role="group" aria-label="Answers">
              ${q.options.map((o, n) => `
                <button type="button" class="choice-option drill-opt" data-opt="${esc(o.id)}">
                  <span class="drill-opt-key" aria-hidden="true">${n + 1}</span>${esc(o.label)}
                </button>`).join('')}
            </div>

            <div id="drill-feedback" class="drill-feedback" role="status" aria-live="polite"></div>
          </div>

          <div class="drill-run-foot">
            <span class="eyebrow">${sprint ? '90 seconds per question.' : `Question ${run.i + 1} of ${total}`}</span>
            <button type="button" class="btn-primary" id="drill-next" disabled>Next</button>
          </div>
        </section>
      </div>
    `;

    container.querySelector('#drill-calc-btn')?.addEventListener('click', () => toggleCalculator());
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
    if (correct) { run.right++; }
    else if (run.mode === 'sprint') { run.lives--; }

    recordAnswer(practice(), q.id, correct);
    session.savePractice();

    container.querySelectorAll('.drill-opt').forEach(b => {
      if (b.dataset.opt === q.answer) b.classList.add('correct');
      else if (b.dataset.opt === optId) b.classList.add('incorrect');
      b.disabled = true;
    });
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
      starRow = `<div class="drill-result-stars" aria-label="${earned} of 3 stars">${stars(earned)}</div>`;
      headline = `${r.right} of ${r.questions.length} correct`;
      const missed = r.answered - r.right;
      detail = missed
        ? `${missed} missed — ${missed === 1 ? 'it' : 'they'} will come back in Review until you have them.`
        : 'No misses.';
      if (r.mode === 'run' && earned >= 3) detail = 'A clean run. ' + detail;
    }
    session.savePractice();
    session.checkCommendations();

    container.innerHTML = `
      <div class="screen-container m-screen m-drills is-active">
        <section class="plate drill-result" aria-labelledby="drill-result-title">
          <div class="eyebrow lit">${esc(MODE_LABEL[r.mode])} · Complete</div>
          ${starRow}
          <h2 id="drill-result-title" class="drill-result-title">${esc(headline)}</h2>
          <p class="drill-result-line">${esc(detail)}</p>
          <div class="drill-result-keys">
            <button type="button" class="btn-primary" data-again>Again</button>
            <button type="button" class="btn-secondary" data-weak${weakIds(p).length ? '' : ' disabled'}>Review</button>
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
