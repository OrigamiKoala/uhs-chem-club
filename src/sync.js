/**
 * sync.js — keeps localStorage and the Google Sheet telling the same story.
 *
 * The Sheet is the master copy of everything a player has done that is not XP
 * (story flags, the lore notebook, practice, loadout, settings...). The game
 * never waits for it: every screen plays from localStorage, which `session.js`
 * restores synchronously at boot. This module only reconciles in the
 * background:
 *
 *   - PULL. The server's copy rides on bootstrap / player/me and is merged in
 *     by `session.applyRemoteState` (a union, so local progress is never lost).
 *     Returning to a tab pulls again, so a second device's progress shows up.
 *   - PUSH. Any change marks the session dirty; two and a half seconds later
 *     the whole document goes up and the server's merged answer comes back.
 *     The server merges too, so two devices saving at once cannot overwrite
 *     each other.
 *
 * A failed push is retried with backoff and is never shown to the player and
 * never touches the session: an unreachable backend says nothing about whether
 * the token is good (see "Staying signed in" in CLAUDE.md).
 */

import { api } from './api.js';
import { session } from './session.js';
import { docsEqual } from './shared/statemerge.js';

const DEBOUNCE_MS = 2500;
const RETRY_BASE_MS = 5000;
const RETRY_MAX_MS = 60000;
const PULL_MIN_GAP_MS = 60000;

let timer = null;
let inflight = false;
let again = false;
let failures = 0;
let lastPull = 0;
let started = false;

function schedule(delay = DEBOUNCE_MS) {
  if (!session.token) return;
  clearTimeout(timer);
  timer = setTimeout(push, delay);
}

/** Send this device's state up and adopt the server's merged answer. */
export async function push() {
  if (!session.token) return;
  if (inflight) { again = true; return; }
  const doc = session.buildStateDoc();
  if (session.lastRemoteState && docsEqual(doc, session.lastRemoteState)) return;
  inflight = true;
  try {
    const res = await api.saveState(doc);
    failures = 0;
    if (res && res.state) session.applyRemoteState(res.state);
  } catch (err) {
    failures++;
    schedule(Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (failures - 1)));
  } finally {
    inflight = false;
    if (again) { again = false; schedule(); }
  }
}

/** Fetch the server's copy and merge it in. Throttled; `force` skips the gap. */
export async function pull(force = false) {
  if (!session.token) return;
  const now = Date.now();
  if (!force && now - lastPull < PULL_MIN_GAP_MS) return;
  lastPull = now;
  try {
    const res = await api.getState();
    if (res && res.state) session.applyRemoteState(res.state);
  } catch (err) {
    // Offline or busy: play on from localStorage.
  }
}

/** Leaving the page: send what is pending without waiting for the debounce. */
function flush() {
  if (!session.token) return;
  const doc = session.buildStateDoc();
  if (session.lastRemoteState && docsEqual(doc, session.lastRemoteState)) return;
  try {
    fetch('/api/state/save', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: session.token, state: doc })
    }).catch(() => {});
  } catch (e) {}
}

export const sync = {
  init() {
    if (started) return;
    started = true;
    session.stateDirtyHook = () => schedule();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush();
        else pull();
      });
      window.addEventListener('pagehide', flush);
    }
  },
  push,
  pull
};
