// Archived from src/learn/quests/unit10/q5-load.js (stage 8: Sealed Beakers)
// Cut reason: repeated stage 5 (concentration cell) and boss phase 4 re-tests it.

const S8 = { metal: 'ag', cLeft: 0.01, cRight: 1 };

export const s8Sealed = {
  id: 's8-sealed',
  title: 'Sealed Beakers',
  prompt: 'Say which beaker of the sealed silver cell holds the more dilute solution.',
  hints: [
    'Press "Run", read both meters, then tap the dilute beaker.',
    'Compare the side the needle swings toward with the sign of the voltmeter.',
    'Find the bar the electrons leave; the dilute beaker is the one that bar stands in.'
  ]
};
