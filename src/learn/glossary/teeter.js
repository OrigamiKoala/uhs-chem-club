/**
 * glossary/teeter.js — the words of Teeter (Unit 08, equilibrium): one term per concept, a one-clause gloss, and the stage where it is
 * first used (`quest`, `stage` 1-based). Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no synonym
 * of them. `re` finds the term in play text; `BANNED` lists the vague words and fiction names that must not stand in for one
 * (`verify:teaching:teeter`). `recap` marks a term from an earlier world, re-glossed because nothing guarantees that world was played.
 */

export const QUESTS = ['q1-both', 'q2-k', 'q3-q', 'q4-properties', 'q5-ice', 'q6-lean', 'q7-dissolve', 'q8-free', 'boss-tipper'];

export const TERMS = [
  { id: 'reaction', term: 'reaction', gloss: 'particles of one kind turning into particles of another kind', quest: 'q1-both', stage: 1, re: /\breactions?\b/i },
  { id: 'reactant-product', term: 'reactant and product', gloss: 'a reactant is what a reaction starts with, a product is what it makes', quest: 'q1-both', stage: 1, re: /\b(reactants?|products?)\b/i },
  { id: 'equilibrium', term: 'equilibrium', gloss: 'the state in which the amounts of every substance have stopped changing', quest: 'q1-both', stage: 3, re: /\bequilibrium\b/i },
  { id: 'dynamic-equilibrium', term: 'dynamic equilibrium', gloss: 'equilibrium in which the forward and reverse changes both carry on at the same rate', quest: 'q1-both', stage: 3, re: /\bdynamic equilibrium\b/i },
  { id: 'reversible', term: 'reversible reaction', gloss: 'a reaction that runs both ways, drawn with a double arrow', quest: 'q1-both', stage: 7, re: /\breversible reaction\b/i },
  { id: 'concentration', term: 'concentration', gloss: 'moles of a substance in each litre, in mol/L', quest: 'q2-k', stage: 2, recap: 'Tallow', re: /\bconcentrations?\b/i },
  { id: 'k', term: 'equilibrium constant, K', gloss: 'a ratio of product amounts to reactant amounts that is the same for every vessel of one reaction at one temperature', quest: 'q2-k', stage: 2, re: /\bK\b|\bequilibrium constant\b/ },
  { id: 'q', term: 'reaction quotient, Q', gloss: 'the same ratio as K, worked out with the amounts present right now', quest: 'q3-q', stage: 1, re: /\bQ\b|\breaction quotient\b/ },
  { id: 'kp', term: 'Kp', gloss: 'K written with partial pressures of gases in place of concentrations', quest: 'q4-properties', stage: 7, re: /\bKp\b/ },
  { id: 'ice', term: 'ICE table', gloss: 'a table of Initial amounts, Change and Equilibrium amounts for each substance', quest: 'q5-ice', stage: 1, re: /\bICE table\b|\bICE board\b/i },
  { id: 'le-chatelier', term: 'Le Chatelier\'s principle', gloss: 'a vessel at equilibrium that is disturbed moves to undo the disturbance', quest: 'q6-lean', stage: 7, re: /\bLe Chatelier/i },
  { id: 'catalyst', term: 'catalyst', gloss: 'a substance that speeds a reaction up and is not used up', quest: 'q6-lean', stage: 6, re: /\bcatalysts?\b/i },
  { id: 'ksp', term: 'solubility product, Ksp', gloss: 'K for a solid dissolving: the product of the dissolved ion concentrations at equilibrium', quest: 'q7-dissolve', stage: 2, re: /\bKsp\b|\bsolubility product\b/ },
  { id: 'solubility', term: 'molar solubility', gloss: 'moles of a solid that dissolve in one litre of water', quest: 'q7-dissolve', stage: 3, re: /\bmolar solubility\b|\bsolubility\b/i },
  { id: 'precipitate', term: 'precipitate', gloss: 'a solid that forms out of a solution', quest: 'q7-dissolve', stage: 6, re: /\bprecipitate\b/i },
  { id: 'common-ion', term: 'common-ion effect', gloss: 'a salt dissolves less in water that already holds one of its ions', quest: 'q7-dissolve', stage: 6, re: /\bcommon.ion\b/i },
  { id: 'delta-g', term: 'ΔG°', gloss: 'the standard free energy change: negative means the reaction runs forward by itself', quest: 'q8-free', stage: 1, re: /ΔG/ },
  { id: 'coupled', term: 'coupled reaction', gloss: 'two reactions added together so that one drives the other', quest: 'q8-free', stage: 7, re: /\bcoupled reaction\b/i }
];

/** Words that are not glossary terms and must not stand in for one inside Teeter's play text (the boss keeps its fiction). */
export const BANNED = [
  { re: /\b(push|pushes|pushed)\b/i, use: 'a change / disturbance, or "lowers Q"', why: 'vague word' },
  { re: /\bsqueez(e|es|ed|ing)\b/i, use: 'compress', why: 'vague word' },
  { re: /\broom\b/i, use: 'volume', why: 'vague word' },
  { re: /\bpans?\b/i, use: 'vessel', why: 'fiction name' },
  { re: /\brigs?\b/i, use: 'ratio board', why: 'fiction name' },
  { re: /\bchips?\b|\btiles?\b/i, use: 'card', why: 'fiction name' },
  { re: /\bcrates?\b|\bdrums?\b|\bholders?\b|\bslates?\b/i, use: 'a real lab name', why: 'fiction name' }
];

export const STORY_ALLOW = ['pan', 'rig', 'squeeze'];

/** What each stage assumes the student can do, and the primer (`engine/primers.js`) offered by the Primer key on that stage. */
export const NEEDS = {
  'q2-k:5': ['ratio'],
  'q3-q:1': ['ratio'],
  'q5-ice:2': ['amount'],
  'q7-dissolve:3': ['amount'],
  'q8-free:3': ['log']
};
