/**
 * predict.js — carrying a prediction from the stage that asks for it to the stage that tests it.
 *
 * A PREDICTION IS ITS OWN PART OF THE BENCH. A predict stage shows only the question and the guesses, never the
 * instrument; the next stage brings the instrument and the player's locked guess back (in its prompt and its reward).
 * So the guess is made before the experiment is even on the table, and nothing can be changed after seeing the result.
 *
 * The guess is a session flag (`predict:<world>/<quest>`), so it survives a reload between the two stages and syncs with the
 * rest of the player's state. It is never graded and never read by a `check`; it only comes back on screen.
 */

import { session } from '../../session.js';

/** Remember the player's guess (a short id) for a quest. */
export function remember(key, value) {
  try { session.setFlag(`predict:${key}`, value); } catch (err) { /* a guess is never worth a failed stage */ }
}

/** The player's guess for a quest, or null. */
export function recall(key) {
  try { return session.getFlag(`predict:${key}`) ?? null; } catch (err) { return null; }
}
