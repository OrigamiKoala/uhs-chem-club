/**
 * glossary/ligar.js — the words of Ligar (Unit 03, bonding): one term per concept, a one-clause gloss, and the stage where it is first
 * used (`quest`, `stage` 1-based), which is the stage whose briefing or reward teaches it. Prompts, hints, misses, rewards, captions, the
 * Tour and the bank use these terms and no synonym of them. `re` finds the term in play text; `BANNED` lists the stand-in words that must
 * not replace one. `recap` marks a term from an earlier world, re-glossed because nothing guarantees that world was played.
 * Written by the teaching pass of 2026-11-12 (the world had no glossary).
 */

export const QUESTS = ['q1-joins', 'q2-lattice', 'q3-distance', 'q4-dots', 'q5-resonance', 'q6-shape', 'q7-polarity', 'q8-hybrid', 'q9-orbitals', 'boss-warden'];

export const TERMS = [
  { id: 'chemical-bond', term: 'chemical bond', gloss: 'what holds two atoms together: each nucleus attracts the other atom\'s electrons, which lowers their energy', quest: 'q1-joins', stage: 2, re: /\bchemical bonds?\b|\bbond(s|ed|ing)?\b/i },
  { id: 'electronegativity', term: 'electronegativity', gloss: 'how strongly an atom pulls on electrons it shares with another atom', quest: 'q1-joins', stage: 4, re: /\belectronegativ\w*/i },
  { id: 'ionic-bond', term: 'ionic bond', gloss: 'a bond in which one atom takes electrons from the other and the two ions attract', quest: 'q1-joins', stage: 4, re: /\bionic bonds?\b/i },
  { id: 'covalent-bond', term: 'covalent bond', gloss: 'a bond in which two atoms share electrons in pairs', quest: 'q1-joins', stage: 4, re: /\bcovalent bonds?\b/i },
  { id: 'ion', term: 'ion', gloss: 'an atom that has lost or gained electrons and so carries a charge', quest: 'q1-joins', stage: 4, recap: 'Tallow', re: /\bions?\b/i },
  { id: 'multiple-bond', term: 'single, double and triple bond', gloss: 'a covalent bond of one, two or three shared pairs', quest: 'q1-joins', stage: 6, re: /\b(single|double|triple) bonds?\b/i },
  { id: 'conduct', term: 'conduct', gloss: 'let an electric current pass, which needs charged particles that are free to move', quest: 'q2-lattice', stage: 2, re: /\bconduct\w*/i },
  { id: 'melting-point', term: 'melting point', gloss: 'the temperature at which a solid\'s particles come free of their places', quest: 'q2-lattice', stage: 3, re: /\bmelting points?\b/i },
  { id: 'molecular-solid', term: 'molecular solid', gloss: 'a solid made of separate molecules', quest: 'q2-lattice', stage: 3, re: /\bmolecular solids?\b/i },
  { id: 'ionic-solid', term: 'ionic solid', gloss: 'a solid made of positive and negative ions', quest: 'q2-lattice', stage: 3, re: /\bionic solids?\b/i },
  { id: 'metal', term: 'metal', gloss: 'a solid of positive ions among loose outer electrons', quest: 'q2-lattice', stage: 3, re: /\bmetals?\b/i },
  { id: 'network-solid', term: 'covalent network solid', gloss: 'a solid whose atoms are covalently bonded throughout', quest: 'q2-lattice', stage: 3, re: /\bcovalent network solids?\b/i },
  { id: 'lattice', term: 'lattice', gloss: 'the regular arrangement of ions in an ionic solid', quest: 'q2-lattice', stage: 4, re: /\blattices?\b(?! energ)/i },
  { id: 'alloy', term: 'alloy', gloss: 'a metal with atoms of another element mixed in', quest: 'q2-lattice', stage: 6, re: /\balloys?\b/i },
  { id: 'substitutional', term: 'substitutional alloy', gloss: 'an alloy whose added atoms take the places of metal atoms', quest: 'q2-lattice', stage: 7, re: /\bsubstitutional\b/i },
  { id: 'interstitial', term: 'interstitial alloy', gloss: 'an alloy whose added atoms sit in the gaps between metal atoms', quest: 'q2-lattice', stage: 7, re: /\binterstitial\b/i },
  { id: 'bond-length', term: 'bond length', gloss: 'the distance between two bonded atoms, at the lowest point of their energy curve', quest: 'q3-distance', stage: 1, re: /\bbond lengths?\b/i },
  { id: 'bond-energy', term: 'bond energy', gloss: 'the energy needed to pull two bonded atoms fully apart, for one mole of bonds', quest: 'q3-distance', stage: 1, re: /\bbond energ(y|ies)\b/i },
  { id: 'mole', term: 'mole (mol)', gloss: 'a fixed number of particles, 6.02 × 10²³ of them', quest: 'q3-distance', stage: 1, recap: 'Tallow', re: /\bmoles?\b|\bmol\b/i },
  { id: 'bond-order', term: 'bond order', gloss: 'the number of electron pairs two atoms share', quest: 'q3-distance', stage: 3, re: /\bbond orders?\b/i },
  { id: 'lattice-energy', term: 'lattice energy', gloss: 'the energy needed to pull the ions of an ionic solid apart', quest: 'q3-distance', stage: 4, re: /\blattice energ(y|ies)\b/i },
  { id: 'coulomb', term: 'Coulomb\'s law', gloss: 'the attraction between two charges grows with their product and shrinks with their distance', quest: 'q3-distance', stage: 5, re: /\bCoulomb/i },
  { id: 'valence-electron', term: 'valence electron', gloss: 'an electron in an atom\'s outermost shell', quest: 'q4-dots', stage: 1, recap: 'Tallow', re: /\bvalence electrons?\b/i },
  { id: 'lewis-structure', term: 'Lewis structure', gloss: 'a drawing that shows every valence electron in a bond or a lone pair', quest: 'q4-dots', stage: 2, re: /\bLewis structures?\b/i },
  { id: 'lone-pair', term: 'lone pair', gloss: 'a pair of valence electrons on one atom, not shared', quest: 'q4-dots', stage: 2, re: /\blone pairs?\b/i },
  { id: 'octet', term: 'octet', gloss: 'eight electrons round an atom', quest: 'q4-dots', stage: 2, re: /\boctets?\b/i },
  { id: 'central-atom', term: 'central atom', gloss: 'an atom bonded to two or more others', quest: 'q4-dots', stage: 5, re: /\bcentral atoms?\b/i },
  { id: 'incomplete-octet', term: 'incomplete octet', gloss: 'fewer than eight electrons round a bonded atom', quest: 'q4-dots', stage: 6, re: /\bincomplete octets?\b/i },
  { id: 'expanded-octet', term: 'expanded octet', gloss: 'more than eight electrons round an atom of the third period or below', quest: 'q4-dots', stage: 7, re: /\bexpanded octets?\b/i },
  { id: 'free-radical', term: 'free radical', gloss: 'a molecule with an unpaired electron', quest: 'q4-dots', stage: 8, re: /\bfree radicals?\b/i },
  { id: 'resonance-structure', term: 'resonance structure', gloss: 'one of several valid Lewis structures that differ only in where electrons are placed', quest: 'q5-resonance', stage: 3, re: /\bresonance structures?\b/i },
  { id: 'resonance-hybrid', term: 'resonance hybrid', gloss: 'the real molecule, the average of its resonance structures', quest: 'q5-resonance', stage: 3, re: /\bresonance hybrids?\b/i },
  { id: 'formal-charge', term: 'formal charge', gloss: 'the valence electrons an atom brought minus those it has in the structure, counting a lone pair as two and a bond as one', quest: 'q5-resonance', stage: 4, re: /\bformal charges?\b/i },
  { id: 'electron-domain', term: 'electron domain', gloss: 'a bond or a lone pair on the central atom', quest: 'q6-shape', stage: 1, re: /\b(electron )?domains?\b/i },
  { id: 'linear', term: 'linear', gloss: 'the shape of atoms in a line, 180° apart', quest: 'q6-shape', stage: 1, re: /\blinear\b/i },
  { id: 'trigonal-planar', term: 'trigonal planar', gloss: 'the shape of three domains, flat and 120° apart', quest: 'q6-shape', stage: 3, re: /\btrigonal planar\b/i },
  { id: 'vsepr', term: 'VSEPR', gloss: 'the idea that electron domains settle as far apart as they can', quest: 'q6-shape', stage: 3, re: /\bVSEPR\b/ },
  { id: 'tetrahedral', term: 'tetrahedral', gloss: 'the shape of four domains, 109.5° apart', quest: 'q6-shape', stage: 3, re: /\btetrahedral\b/i },
  { id: 'trigonal-pyramidal', term: 'trigonal pyramidal', gloss: 'the shape of three bonds and one lone pair: a pyramid', quest: 'q6-shape', stage: 4, re: /\btrigonal pyramidal\b/i },
  { id: 'bent', term: 'bent', gloss: 'the shape of two bonds beside lone pairs', quest: 'q6-shape', stage: 5, re: /\bbent\b/i },
  { id: 'bond-angle', term: 'bond angle', gloss: 'the angle between two bonds on one atom', quest: 'q6-shape', stage: 5, re: /\bbond angles?\b/i },
  { id: 'octahedral', term: 'octahedral', gloss: 'the shape of six domains, 90° apart', quest: 'q6-shape', stage: 6, re: /\boctahedral\b/i },
  { id: 'square-planar', term: 'square planar', gloss: 'the shape of four bonds in a flat square, with two lone pairs opposite each other', quest: 'q6-shape', stage: 7, re: /\bsquare planar\b/i },
  { id: 'trigonal-bipyramidal', term: 'trigonal bipyramidal', gloss: 'the shape of five domains: a ring of three with one above and one below', quest: 'q6-shape', stage: 8, re: /\btrigonal bipyramidal\b/i },
  { id: 'partial-charge', term: 'partial charge (δ+, δ−)', gloss: 'the slight charge on each end of a bond whose electrons are shared unequally', quest: 'q7-polarity', stage: 2, re: /\bpartial charges?\b|δ[+−]/i },
  { id: 'polar-covalent', term: 'polar covalent bond', gloss: 'a covalent bond with partial charges on its ends', quest: 'q7-polarity', stage: 2, re: /\bpolar covalent\b/i },
  { id: 'dipole', term: 'dipole', gloss: 'a pair of opposite charges a small distance apart, such as the two ends of a polar bond', quest: 'q7-polarity', stage: 2, re: /\bdipoles?\b/i },
  { id: 'polar-molecule', term: 'polar and nonpolar molecule', gloss: 'a molecule whose bond dipoles do not balance, or do', quest: 'q7-polarity', stage: 4, re: /\b(non)?polar\b(?! covalent)/i },
  { id: 'percent-ionic', term: 'percent ionic character', gloss: 'a bond\'s measured dipole as a percent of the dipole a full transfer of an electron would give', quest: 'q7-polarity', stage: 5, re: /\bpercent ionic character\b/i },
  { id: 'hybrid-orbital', term: 'hybrid orbital', gloss: 'one of the identical orbitals an atom\'s own orbitals mix into', quest: 'q8-hybrid', stage: 3, re: /\bhybrid(s| orbitals?)?\b/i },
  { id: 'sigma-bond', term: 'sigma bond', gloss: 'a bond of two orbitals meeting end to end, along the line between the nuclei', quest: 'q8-hybrid', stage: 4, re: /\bsigma\b/i },
  { id: 'pi-bond', term: 'pi bond', gloss: 'a bond of two p orbitals meeting side by side, above and below that line', quest: 'q8-hybrid', stage: 4, re: /\bpi bonds?\b/i },
  { id: 'paramagnetic', term: 'paramagnetic', gloss: 'attracted to a magnet, because it has unpaired electrons', quest: 'q9-orbitals', stage: 2, re: /\bparamagnetic\b/i },
  { id: 'molecular-orbital', term: 'molecular orbital', gloss: 'an orbital that belongs to the whole molecule, made when atoms\' orbitals combine', quest: 'q9-orbitals', stage: 3, re: /\bmolecular orbitals?\b/i },
  { id: 'bonding-orbital', term: 'bonding orbital', gloss: 'a molecular orbital with electron density between the nuclei, lower in energy than the atoms\' own', quest: 'q9-orbitals', stage: 3, re: /\bbonding orbitals?\b/i },
  { id: 'antibonding-orbital', term: 'antibonding orbital', gloss: 'a molecular orbital with a node between the nuclei, higher in energy than the atoms\' own', quest: 'q9-orbitals', stage: 4, re: /\bantibonding\b/i },
  { id: 'node', term: 'node', gloss: 'a place where an orbital is zero, so the electron is never found there', quest: 'q9-orbitals', stage: 4, re: /\bnodes?\b/i }
];

/** Stand-in words that must not replace a glossary term in Ligar's play text (the Warden and the story keep their fiction). */
export const BANNED = [
  { re: /\barms?\b/i, use: 'bond, or electron domain', why: 'stand-in word' },
  { re: /\bballoons?\b/i, use: 'lone pair', why: 'stand-in word' },
  { re: /\bhubs?\b/i, use: 'central atom', why: 'stand-in word' },
  { re: /\bslates?\b/i, use: 'structure', why: 'fiction name' },
  { re: /\bstamps?\b/i, use: 'charge reader', why: 'fiction name' },
  { re: /\bneedles?\b/i, use: 'charge meter', why: 'stand-in word' },
  { re: /\bgauges?\b/i, use: 'length meter', why: 'stand-in word' },
  { re: /\bracks?\b|\bboxes\b/i, use: 'energy levels, orbitals', why: 'stand-in word' },
  { re: /\b(mixing )?bowls?\b/i, use: 'mixer', why: 'stand-in word' },
  { re: /\bpush(es|ed|ing)?\b/i, use: 'repel, repulsion', why: 'vague word' },
  { re: /\bpulls? (harder|very differently)\b|\bstronger puller\b/i, use: 'is more electronegative', why: 'vague word' },
  { re: /\bswings? round\b|\bstays? put\b/i, use: 'turns in the field, does not turn', why: 'vague word' },
  { re: /\bmarkers?\b/i, use: 'dial', why: 'fiction name' }
];

export const STORY_ALLOW = ['arm', 'push'];

/** What each stage assumes the student can do, and the primer (`engine/primers.js`) offered by the Primer key on that stage. */
export const NEEDS = {
  'q1-joins:4': ['ions'],
  'q3-distance:1': ['amount'],
  'q7-polarity:5': ['ratio']
};
