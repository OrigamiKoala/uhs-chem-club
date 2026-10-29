{world} = Ligar

# Goal

You're improving the world of {world} in Avalon (repo: ~/chem-3d), a browser chemistry game for middle and high school students. When you're done, every bench, stage, and quest in {world} should teach its concept well enough that a student who finishes it could handle the AP Chemistry questions on that topic. Getting there should also be fun.

Read PRODUCT.md first. Its invariants are hard constraints. If anything below conflicts with it, flag the conflict and ask me. Keep in mind there are parallel subagents working on the other worlds.

# What's wrong now

Many {world} benches:

- Have visual problems: overlap, clipping, unreadable text, or unclear what's interactive.
- Aren't intuitive: a first-time player can't tell what to do or why.
- Overwhelm: too many new ideas, controls, or numbers at once.
- Assume background knowledge the student doesn't have.
- Make the player infer things from experiments that took humanity centuries to work out.
- Cover the qualitative side of a topic but not the quantitative side AP requires.
- Skip some concepts entirely.

# How to teach

The discovery path does not need to follow the historical path. Give students facts they couldn't reasonably infer: show them, state them, or have a character tell them. Then let them discover the consequences by manipulating the system. Build chemical intuition, not recall.

For quantitative content, follow Brilliant's approach, not plug-and-chug:

- Start from a concrete, visual situation. Ask for a prediction before any calculation.
- Build each relationship through proportional reasoning ("if I double this, what happens to that?") before naming a formula.
- Introduce a formula only as shorthand for something the player already understands.
- Ramp the numbers: friendly numbers and estimation first, realistic values later.
- Make units and sanity checks part of the gameplay.
- Give wrong answers visible, informative consequences, not just a "wrong."

# Process

1. Read PRODUCT.md and docs/Avalon problems and clashing rules.md.
2. Launch the game in the browser (you are allowed to), sign in with guest mode, and enter {world}. Don’t bother trying to navigate the 3D world, just switch the URL - for example, going to /#/learn/unit02/q1-wave gets you to the first Ligar quest immediately.
3. Audit: play every bench in order as a first-time student would. For each bench, record:
    - its problems against the list above;
    - the AP Chemistry learning objectives (Course and Exam Description, units [X–Y]) it covers;
    - the objectives it misses.
    Save this to docs/{world}-audit.md.
4. Fix one bench at a time, in priority order: broken or confusing first, then missing quantitative depth, then new concepts. After each fix:
    - replay the bench in the browser to confirm it works and looks right;
    - check the console for errors;
    - run [TESTS / BUILD];
    - commit with a message describing the teaching change.
5. Stop when every bench passes the checklist. End with a summary: what changed, what's still weak, and which concepts you added or recommend adding.

# Constraints

- Chemistry must be accurate. Simplifying is fine; saying something false is not.
- Keep the existing storyline, characters, and voice. Dialogue text may be rewritten.
- Don't break other worlds. Reuse existing components where possible.
- For missing concepts, build new benches.
- If something blocks you (sign-in fails, a bench crashes), log it and move on rather than stalling.