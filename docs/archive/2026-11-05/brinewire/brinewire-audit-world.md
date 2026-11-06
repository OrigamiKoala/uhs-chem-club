# Brinewire world audit (the place, not the benches)

Evidence labels: `Code` (read in the source), `Scripted` (a Node script run in this tree), `Bench` (`verify:bench` driving the real tabletop on the real host). Nothing here was played or seen: no browser was used.

| Property | Result | Evidence |
| --- | --- | --- |
| Six hosts, one per quest id of the plan, built whether or not the quest exists | Holds; `siteForQuest` resolves every id and returns null for the boss | Scripted (`verify:brinewire`) |
| Site `built` flags agree with `src/learn/quests/unit10/` | Holds at the time of the run; goes stale as quests land and needs the generator rerun | Scripted |
| Every footprint disjoint; hosts and lanes clear of pools and props; pools at least 1 m apart | Holds | Scripted |
| No two built bodies share space (about 560 meshes) | Holds | Scripted |
| Nothing buried; pylons, tanks, piers and the switch house stand on their pool floor | Holds | Scripted |
| Only the work lamps are lit; 47 lamps share 3 real lights | Holds | Scripted |
| The walk: spawn reaches every approach, the pad and the Clamp's court; no ledge; no reachable cell under water; every near pool fenced | Holds | Scripted |
| Each host stands inside its declared extent; ground under each host and lane is level | Holds | Scripted |
| Bay volumes clear, nothing between the leaned-in camera and the plate, host or ground behind it, at seven viewports (1632 rays) | Holds for all six hosts | Scripted, Bench |
| Every unit10 quest that exists mounts on its host and solves by drag and by two taps | Holds for q1, q4, q5, q6; six q2-activity lines (pieces 25.9 to 27.9 px at the two phone-landscape views) fail the 28 px floor and belong to that bench | Bench |
| Cables: five spans, ambient, ends at pylons, 7.5 m or more clear, no host under one | Holds | Scripted |
| Rotor wheels turn flat about their masts, one turn in 40 s; nothing else animates | Holds | Scripted |
| The Clamp's ground in `boss-arena.js` equals the world's open court; 7 m round it open; court level; on the lagoon's shore | Holds | Scripted |
| The Clamp's body: rig, finite geometry, 9.7 m at scale 1.4, stands on the ground, muzzle, four plates that strike off, all poses finite, comes apart | Holds | Scripted (`verify:arena`) |
| Other worlds unchanged: tallow, lanternfall, ligar, bellows, ember, verdigris, teeter, kettle, mirrowen, voyage, arena | All pass after the shared edits | Scripted |
| Shared-engine changes are opt-in | One species entry in `BOSS_LOOK`, `BOSS_ARENA_SPOTS` and `BUILDERS`; no existing path altered | Code |
| Look of the ground, sky, hosts and the Clamp; walk feel; cable sag in the sky | Not judged | none: needs a hand |
