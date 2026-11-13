/**
 * glossary/quicklight.js — the words of Quicklight (Unit 11, kinetics): one term per concept, a one-clause gloss, and the stage where
 * it is first used (`quest`, `stage` 1-based). Prompts, hints, misses, rewards, captions, the Tour and the bank use these terms and no
 * banned synonym of them.
 */

export const QUESTS = ['q1-watch', 'q2-law', 'q3-time', 'q4-collide', 'q5-steps', 'q6-shortcut', 'boss-flare'];

export const TERMS = [
  { id: 'reaction-rate', term: 'reaction rate', gloss: 'how fast the concentration of a reactant or product changes each second', quest: 'q1-watch', stage: 2, re: /\breaction rates?\b/i },
  { id: 'rate-law', term: 'rate law', gloss: 'an equation that writes the rate as a constant k times each reactant concentration raised to its order', quest: 'q2-law', stage: 3, re: /\brate laws?\b/i },
  { id: 'order', term: 'order', gloss: 'the power on a reactant concentration in the rate law, measured by experiment', quest: 'q2-law', stage: 3, re: /\borders?\b/i },
  { id: 'rate-constant', term: 'rate constant', gloss: 'the proportionality constant k in a rate law at a given temperature', quest: 'q2-law', stage: 3, re: /\brate constants?\b/i },
  { id: 'half-life', term: 'half-life', gloss: 'the time it takes for half of the remaining reactant to be used up', quest: 'q3-time', stage: 1, re: /\bhalf-li(fe|ves)\b/i },
  { id: 'first-order', term: 'first order', gloss: 'a reaction whose rate is proportional to one concentration and whose ln[A] vs time plot is straight', quest: 'q3-time', stage: 3, re: /\bfirst[- ]order\b/i },
  { id: 'zero-order', term: 'zero order', gloss: 'a reaction whose rate stays constant as reactant is used and whose [A] vs time plot is straight', quest: 'q3-time', stage: 4, re: /\bzero[- ]order\b/i },
  { id: 'second-order', term: 'second order', gloss: 'a reaction whose rate goes as [A]² and whose 1/[A] vs time plot is straight', quest: 'q3-time', stage: 4, re: /\bsecond[- ]order\b/i },
  { id: 'collision-model', term: 'collision model', gloss: 'the idea that particles react only when they collide with enough energy and the right orientation', quest: 'q4-collide', stage: 3, re: /\bcollision model\b/i },
  { id: 'activation-energy', term: 'activation energy', gloss: 'the minimum energy colliding particles must bring to rearrange bonds and react', quest: 'q4-collide', stage: 4, re: /\bactivation energ(y|ies)\b/i },
  { id: 'energy-profile', term: 'energy profile', gloss: 'a plot of energy along the reaction from reactants, over the barrier, to products', quest: 'q4-collide', stage: 5, re: /\benergy profiles?\b/i },
  { id: 'transition-state', term: 'transition state', gloss: 'the high-energy arrangement at the top of the energy profile between reactants and products', quest: 'q4-collide', stage: 5, re: /\btransition states?\b/i },
  { id: 'elementary-step', term: 'elementary step', gloss: 'a single collision event in a reaction mechanism', quest: 'q5-steps', stage: 1, re: /\belementary steps?\b/i },
  { id: 'mechanism', term: 'mechanism', gloss: 'the series of elementary steps that add up to the overall reaction', quest: 'q5-steps', stage: 1, re: /\bmechanisms?\b/i },
  { id: 'intermediate', term: 'intermediate', gloss: 'a substance made in one elementary step and used up in a later one', quest: 'q5-steps', stage: 2, re: /\bintermediates?\b/i },
  { id: 'rate-determining-step', term: 'rate-determining step', gloss: 'the slowest elementary step, which sets the pace of the overall reaction', quest: 'q5-steps', stage: 3, re: /\brate-determining steps?\b/i },
  { id: 'catalyst', term: 'catalyst', gloss: 'a substance that speeds up a reaction by offering a lower-energy path and is regenerated unchanged', quest: 'q6-shortcut', stage: 2, re: /\bcatalysts?\b/i },
  { id: 'heterogeneous-catalyst', term: 'heterogeneous catalyst', gloss: 'a catalyst in a different phase from the reactants, such as a solid metal surface with gas', quest: 'q6-shortcut', stage: 5, re: /\bheterogeneous catalysts?\b/i },
  { id: 'enzyme', term: 'enzyme', gloss: 'a biological catalyst, usually a protein, that binds reactants at an active site', quest: 'q6-shortcut', stage: 5, re: /\benzymes?\b/i },
  { id: 'active-site', term: 'active site', gloss: 'the pocket on an enzyme where the reacting molecule binds and reacts', quest: 'q6-shortcut', stage: 5, re: /\bactive sites?\b/i }
];

export const BANNED = [
  { re: /\bknock(s|ed)?\b/i, use: 'collision', why: 'vague word' },
  { re: /\bpush(es|ed)?\b/i, use: 'energy / concentration', why: 'vague word' },
  { re: /\broom\b/i, use: 'volume', why: 'vague word' },
  { re: /\bwants to react\b/i, use: 'has enough energy to react', why: 'anthropomorphic motive' }
];

export const STORY_ALLOW = ['tower', 'manifold', 'flare'];

export const NEEDS = {
  'q1-watch:2': ['amount'],
  'q3-time:3': ['log']
};
