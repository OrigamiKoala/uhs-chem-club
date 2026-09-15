# Avalon — Implementation Plan (v2)

**Project:** Avalon, a year-long RPG-style chemistry club competition
**Repo:** `uhs-chem-club`
**Author:** Carl Liu
**Written:** 2026-09-15 · **Revised:** 2026-09-15 (v2 — 3D quests, email+password auth)
**Status:** Plan — no code written yet

> **v2 changes:** email verification codes removed entirely; login is email + password. Every quest is a three.js 3D simulation and the whole site is a navigable ship. Freshman showcase and the Quest 1 drop are both **Friday 2026-09-18**. Expecting ~40 students. Leaderboards show user-chosen, changeable display names.

---

## 0. Parameters

| Parameter | Value |
|---|---|
| Frontend host | Vercel (static Vite build + one serverless function) |
| Backend | Google Apps Script Web App over one Google Sheet |
| Deploying Google account | **Personal Gmail** — consumer quotas, no Workspace |
| Auth | **Email + password.** No verification email, no reset email, no mail sent at all |
| Renderer | **three.js**, WebGL2 with a full non-WebGL fallback |
| Expected students | **~40** → `team_slot_cap = 12` (10 even + 2 slack) |
| Showcase | **Fri 2026-09-18** |
| Quest 1 drop | **Fri 2026-09-18** (same day) |
| Domain | TBD at deploy; assume `*.vercel.app` |
| Leaderboard identity | Display name, user-chosen, changeable |

### The architectural spine

```
Browser — Vite + three.js, DOM UI layered over one persistent WebGL canvas
   │  same-origin fetch, no CORS, no secrets client-side
   ▼
/api/*  — Vercel Node function: proxy, rate limit, AND password hashing (scrypt)
   │  server-to-server POST, shared secret in body
   ▼
Apps Script Web App (doPost) — routing, grading, scoring, never hashes anything
   │
   ▼
Google Sheet "Avalon DB"
```

Three reasons the Vercel function is load-bearing rather than decorative:

1. **No CORS.** Apps Script web apps 302-redirect to `*.googleusercontent.com`, which makes direct browser calls genuinely painful. Server-to-server has no CORS at all.
2. **The Apps Script URL and shared secret never reach the client.**
3. **Password hashing has to happen there.** Apps Script has no bcrypt/scrypt/argon2 and its `Utilities.computeHmacSha256Signature` is far too slow to iterate a KDF a meaningful number of times inside a request. Node's `crypto.scrypt` is native and fast. See §3.2 — this is the single most important correctness detail in v2.

---

## 1. Repository layout

```
uhs-chem-club/
├─ README.md
├─ docs/
│  ├─ plans/avalon-implementation-plan.md      ← this file
│  ├─ quests/q1-charge-gardens.md              ← quest design + answer key
│  └─ runbook.md                               ← "it's Friday and the site is down"
│
├─ apps-script/                    # clasp project — version controlled
│  ├─ .clasp.json                  # gitignored
│  ├─ appsscript.json
│  ├─ Main.gs                      # doPost router, auth gate, error envelope
│  ├─ Auth.gs                      # credential compare, HMAC session tokens
│  ├─ Players.gs                   # signup, profile, display names, teams
│  ├─ Quests.gs                    # manifest, stage serving, grading
│  ├─ Scoring.gs                   # XP, leaderboards
│  ├─ Events.gs                    # seeded weighted random events
│  ├─ Items.gs                     # inventory, effects
│  ├─ Db.gs                        # sheet DAO — ONLY file touching SpreadsheetApp
│  ├─ Cache.gs                     # CacheService wrappers
│  └─ Util.gs                      # ids, hashing, time, validation
│
├─ api/
│  └─ [...route].js                # Vercel catch-all: proxy + scrypt + rate limit
│
├─ src/
│  ├─ main.js  router.js  api.js  session.js
│  ├─ three/
│  │  ├─ stage.js                  # renderer, loop, resize, quality tier
│  │  ├─ tier.js                   # GPU probe + FPS probe + manual override
│  │  ├─ ship.js                   # the persistent ship interior
│  │  ├─ camera-rig.js             # spline dolly between location anchors
│  │  ├─ materials/                # shared shader materials (fresnel, holo, starfield)
│  │  └─ lib/                      # orbit controller, raycast picker, arrow drag
│  ├─ quest3d/
│  │  ├─ viewer.js                 # THE reusable molecular-density viewer
│  │  ├─ molecule.js               # InstancedMesh atoms + bonds
│  │  ├─ isosurface.js             # loads precomputed density shells
│  │  ├─ anchors.js                # named pick targets, shared with answer keys
│  │  └─ interactions/             # pick.js, rank.js, arrow.js, chain.js
│  ├─ fallback2d/                  # same payload contract, DOM-only inputs
│  ├─ screens/                     # landing signup login onboarding dashboard
│  │                               # starmap quest leaderboard inventory settings admin
│  ├─ ui/                          # panel, toast, modal, dice, xp-bar
│  └─ styles/
│
├─ public/
│  ├─ quests/q1/*.glb              # precomputed isosurface meshes
│  ├─ fallback/*.webp              # pre-rendered stills for the no-WebGL tier
│  ├─ art/  fonts/  favicon.svg
│
├─ tools/
│  ├─ density/                     # PySCF + marching cubes → .glb
│  │  ├─ requirements.txt  molecules.py  isosurface.py  export_glb.py
│  ├─ bake-stills.mjs              # headless renders of each location → fallback stills
│  ├─ seed.mjs                     # fake players for testing
│  └─ loadtest.mjs                 # 40 concurrent signups
│
├─ index.html  vite.config.js  vercel.json  package.json
```

**Stack:** Vite + vanilla ES modules + three.js. No UI framework — the app is ~11 screens of thin DOM over a persistent WebGL canvas, and a framework's reconciler fights a render loop more than it helps. All text and controls stay in HTML/CSS; three.js draws the world. Text in WebGL is slow, inaccessible, and a trap.

**Apps Script via `clasp`,** never the web editor. `npx clasp push` from `apps-script/`, and `clasp deploy -i <deploymentId>` so the `/exec` URL is stable.

---

## 2. Data model — the "Avalon DB" spreadsheet

One spreadsheet, 13 tabs (the v1 `AuthCodes` tab is gone). Row 1 is headers; `Db.gs` maps header names → column indices once per execution, so **you can reorder columns in the sheet without breaking code.** Do this; you will reorder columns.

### 2.1 `Config`

| key | value for launch |
|---|---|
| `season_name` | `Season I: The Long Dark` |
| `active_quest` | `q1` |
| `team_slot_cap` | `12` |
| `signups_open` | `TRUE` |
| `admin_emails` | your address |
| `xp_multiplier_global` | `1.0` |
| `demo_mode_enabled` | `TRUE` |
| `min_password_len` | `8` |
| `name_change_cooldown_days` | `7` |
| `maintenance_message` | *(blank)* |

Cached 60s. This tab is the live control panel — most "emergencies" are one cell edit.

### 2.2 `Teams`

`team_id` · `name` · `corp_name` · `ship_name` · `color_hex` · `accent_hex` · `slot_cap_override` · `lore` · `emblem`

| team_id | corp_name | ship_name | element | color |
|---|---|---|---|---|
| `terra` | Terra Dominion | *TDS Lodestone* | earth | deep green |
| `zephyr` | Zephyr Aeronautics | *ZAS Windward* | air | pale cyan |
| `ignis` | Ignis Combine | *ICS Emberline* | fire | ember orange |
| `thalassa` | Thalassa Deepworks | *TDW Tideglass* | water | abyss blue |

Four rival corporations, four ships, one contested system. The elemental identity is each corp's specialty, so nobody asks why there's a fire company in space.

### 2.3 `Players`

`player_id` (ULID) · `email_lc` (unique login key) · `pw_hash` · `pw_salt` · `pw_algo` · `display_name` · `display_name_lc` (unique) · `name_changed_at` · `role` · `team_id` · `avatar_json` · `created_at` · `last_seen_at` · `status` · `gfx_tier_pref` · `notes`

**No `xp_total` column.** XP is derived from `Submissions`, never stored as a running total — §4.3.

**Roles** (each gets one small perk so the choice isn't hollow):

| role | perk |
|---|---|
| Navigator | one extra stage preview before starting |
| Engineer | one free hint per quest |
| Xenobiologist | +10% XP on bonus stages |
| Quartermaster | +1 item slot, 25% better drop odds |
| Comms Officer | sees teammates' live stage progress |

### 2.4 `Quests`

`quest_id` · `title` · `world` · `blurb` · `scene_id` · `cover_image` · `release_at` · `close_at` · `status` (`draft`/`live`/`closed`) · `base_xp` · `stage_count` · `item_pool`

### 2.5 `QuestStages` — answer keys live here and never leave the server

`quest_id` · `stage_index` · `kind` · `xp` · `max_attempts` · `hint_text` · `hint_cost` · `answer_json` · `tolerance` · `reveal_text` · `scene_config`

`answer_json` by `kind` — note every shape is **anchor-name based, never coordinate based**, which is what lets the 3D and DOM-fallback inputs share one grading path (§6.5):

- `pick` → `{"anchors":["lp_o"]}`
- `pick_multi` → `{"anchors":["lp_o","c1"],"ordered":false}`
- `choice` → `{"correct":["b"]}`
- `rank` → `{"order":["hf","lih","h2"]}`
- `arrow` → `{"from":"lp_o","to":"c1"}`
- `chain` → `{"steps":[{"from":"lp_o","to":"c1"},{"from":"c_cl","to":"cl"}]}`

`scene_config` is a JSON blob naming which molecules to load, which anchors are live, camera framing, and whether hints highlight anchors.

### 2.6 `Submissions` — append-only, the source of truth

`submission_id` · `ts` · `player_id` · `quest_id` · `stage_index` · `attempt_no` · `payload_json` · `correct` · `xp_awarded` · `elapsed_ms` · `hint_used` · `gfx_tier` · `ip_hash`

Append-only means `appendRow` only — no read-modify-write, so concurrent writers can't clobber each other. Logging `gfx_tier` tells you whether the fallback path is actually solvable, which you will want to know by Saturday.

### 2.7 `Progress` — a cache, not truth

`player_id` · `quest_id` · `stage_reached` · `completed_at` · `xp_earned` · `hints_used` · `items_awarded` · `updated_at`

Rebuildable from `Submissions` by an admin action at any time.

### 2.8 `Items` / `Inventory`

`Items`: `item_id` · `name` · `flavor` · `model_id` · `rarity` · `effect_code` · `consumable` · `max_stack`
`Inventory`: `inv_id` · `player_id` · `item_id` · `qty` · `acquired_at` · `source`

`model_id` points at a procedural mesh recipe so items are physical objects on the cargo-hold shelves rather than icons.

### 2.9 `Events` / `EventLog`

`Events`: `event_id` · `name` · `description` · `weight` · `effect_code` · `duration_quests` · `polarity` · `art`
`EventLog`: `roll_id` · `quest_id` · `team_id` · `roll_value` · `event_id` · `seed` · `rolled_at`

### 2.10 `Sessions`

Tokens are stateless HMACs (§3.3). This tab exists only for **revocation** — a list of `jti` values to reject, so you can kick someone without rotating the global secret.

### 2.11 `NameHistory`

`ts` · `player_id` · `old_name` · `new_name` · `changed_by` (`self`/`admin`) · `reason`

Display names are public and changeable, which means someone will eventually pick something you have to undo. Keeping history means you can see who did it rather than guessing.

### 2.12 `AuditLog`

`ts` · `actor` · `action` · `target` · `detail_json`. Every admin action, every XP override, every password reset.

---

## 3. Authentication — email + password, zero email sent

No verification codes, no reset links, no mail from the club address. Ever. The email field is an **unverified identifier**, nothing more.

### 3.1 Flow

```
Sign up:   POST /api/auth/register { email, password, displayName }
             → validate, check both uniqueness constraints, create player
             → return { token, player, next: "onboarding" }

Log in:    POST /api/auth/login    { identifier, password }
             → identifier matches email_lc OR display_name_lc
             → return { token, player }

Reset:     admin-only. There is no self-service path (see §3.5).
```

**Login accepts email *or* display name.** Costs one extra index lookup and eliminates most of the "I don't remember which email I used" support load — which matters a lot when there's no reset email to fall back on.

### 3.2 Password hashing — in the Vercel function, never in Apps Script

This is the detail that will quietly wreck the build if it's got wrong.

Apps Script has no bcrypt, scrypt, or argon2. The only primitive is `Utilities.computeDigest` / `computeHmacSha256Signature`, each of which carries real per-call overhead — iterating it enough times to be a legitimate KDF would take seconds per login and eat the daily runtime quota. A single unsalted SHA-256, the usual workaround, is not password storage.

Node on Vercel has `crypto.scrypt` natively. So:

```js
// api/[...route].js
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';

const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };  // ~100ms, tune to taste

async function derive(password, saltB64) {
  const salt = Buffer.concat([Buffer.from(saltB64,'base64'), Buffer.from(process.env.PEPPER)]);
  return new Promise((res, rej) =>
    scrypt(password.normalize('NFKC'), salt, PARAMS.keylen, PARAMS,
      (e, dk) => e ? rej(e) : res(dk.toString('base64'))));
}
```

**Login is two internal hops, both server-side:**

```
1. Vercel → Apps Script  { route:'auth/salt', identifier }
              ← { salt }         // for an UNKNOWN identifier, return a deterministic
                                 // dummy salt = HMAC(PEPPER, identifier). Same shape,
                                 // same timing, so the response never reveals whether
                                 // an account exists.
2. Vercel computes derive(password, salt)
3. Vercel → Apps Script  { route:'auth/login', identifier, dk }
              ← Apps Script does a constant-time compare against pw_hash → token
```

Total ~600–800ms. Fine for a login.

- **Passwords never touch Apps Script, never touch the sheet, never touch the client beyond the input box.** `PEPPER` and `SESSION_SECRET` are Vercel env vars; `pw_hash` and `pw_salt` in the sheet are useless without the pepper.
- Salt: 16 random bytes per user, generated in the Vercel function at registration.
- `pw_algo` column stores `scrypt-16384-8-1-64` so you can migrate parameters later without guessing.
- Store no password hints, no security questions.

### 3.3 Session tokens

Stateless HMAC, no session lookup on the hot path:

```
payload = base64url(JSON.stringify({ jti, pid, exp, v:1 }))
sig     = base64url(HmacSHA256(payload, SESSION_SECRET))
token   = payload + "." + sig
```

Expiry **90 days** — these are teenagers on shared Chromebooks; long enough to be painless, short enough to matter. `jti` is checked against `Sessions` only for admin-revoked tokens. Store in `localStorage`; on a shared showcase laptop, offer an explicit "Not you? Log out" on the dashboard.

### 3.4 Password policy

Follow current NIST guidance rather than folklore:

- **Minimum 8 characters. No composition rules.** No forced symbol/number/capital — those produce `Password1!` and nothing else.
- Reject a small embedded list of ~200 common passwords plus anything containing the display name or `avalon`.
- No forced rotation.
- No maximum length below 64, and don't strip characters.
- Normalize with NFKC before hashing (so an emoji or accented character doesn't break login on a different keyboard).

One thing worth saying out loud to the club, once, at the meeting: **don't reuse your school password here.** You're a teacher standing up an auth system for minors on a personal Gmail-owned script; a ten-second sentence meaningfully reduces what a breach would cost them. Put it next to the password field too.

### 3.5 Reset is admin-only — build it before Friday, not after

With no outbound email there is no self-service reset. That's a real consequence, not a footnote: some students *will* be locked out, probably in week one.

- Admin panel action: **Reset password** → generates a random readable temporary password (`ember-42-drift`), writes it to the screen once, forces a change on next login, logs to `AuditLog`.
- Never email it, never store it in plaintext — Vercel hashes it on the way in like any other.
- Expect roughly **5 resets in the first month at 40 students**. That's a two-minute task each, but only if the tool exists. If it doesn't, it's a locked-out kid who stops playing.
- Because login also accepts display name, most "lockouts" are really "wrong email" and resolve without a reset.

### 3.6 Apps Script gotchas that each cost an hour if nobody warns you

- **`doPost(e)` cannot read custom HTTP headers.** There is no `e.headers`. The shared proxy secret must travel in the **body or query string**, not an `Authorization` header. This surprises everyone.
- Deploy as **Execute as: Me**, **Who has access: Anyone**. "Anyone with a Google account" breaks the server-to-server call.
- Every `clasp push` needs a **new deployment version** to take effect at `/exec`. Use `clasp deploy -i <deploymentId>` to update in place, or the URL changes and your Vercel env var goes stale. Script it as `npm run deploy:backend`.
- Always return `ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON)` and wrap the whole router in try/catch. An uncaught exception renders an HTML error page and your JSON parser dies with a useless message.
- Consumer-account limits that now apply: **90 min/day total script runtime**, 6 min per execution, 20,000 `UrlFetch` calls/day. Runtime is the one to watch — aggressive `CacheService` use is what keeps you under it ([current quotas](https://developers.google.com/apps-script/guides/services/quotas)).

---

## 4. Scoring

### 4.1 Per stage

```
stage_xp = base_stage_xp
         × (attempt 1 ? 1.25 : attempt 2 ? 1.0 : 0.75)
         − (hint_used ? hint_cost : 0)
```

Floored at 25% of base. A student who brute-forces still earns something, because a zero makes people quit.

### 4.2 Per quest

```
quest_xp = Σ stage_xp + completion_bonus(40) + on_time_bonus(25)
         × role_mult × item_mult × event_mult × Config.xp_multiplier_global
```

Quest 1 target: **~200 XP** clean first-try run, ~120 for struggling-but-finished.

### 4.3 Why totals are derived, not stored

Two students submit in the same instant. Both read `xp_total = 340`, both write `360`. The sheet now says 360 instead of 380, silently, and you find out in October with no way to reconstruct the truth. At a showcase with 40 kids on one quest, this is not hypothetical.

So: `Submissions` is append-only and authoritative; totals are aggregated and cached 60s; `Progress` is a convenience cache; reconciliation is a one-click admin replay. The only paths that genuinely need read-modify-write — team slot claiming and item consumption — take `LockService.getScriptLock()`. Everything else sidesteps locking by being append-only.

### 4.4 Team score — do not use the sum

Sum-of-member-XP means the team that recruits hardest wins regardless of play, and one quiet team is dead by October.

```
team_score = mean(xp of members with ≥1 quest attempted) × participation_mult
participation_mult = 0.75 + 0.5 × (active_members / roster_size)
```

Everyone playing → ×1.25; half playing → ×1.0. This rewards *getting your teammates to show up*, which is the actual behavior you want, and keeps the four-way race close enough to still be worth watching in April.

### 4.5 Levels

`level = floor(sqrt(total_xp / 45)) + 1`, capped at 12. Square-root curve: early levels arrive fast (retention), later ones take real work.

| level | title |
|---|---|
| 1–2 | Cadet |
| 3–4 | Scout |
| 5–6 | Navigator |
| 7–8 | Voyager |
| 9–10 | Pathfinder |
| 11–12 | Starmarshal |

---

## 5. API contract

All requests `POST /api/<route>`, JSON body, shared envelope:

```json
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": { "code": "TEAM_FULL", "message": "Windward is full." } }
```

| Route | Auth | Body | Returns |
|---|---|---|---|
| `auth/register` | — | `{ email, password, displayName }` | `{ token, player }` |
| `auth/login` | — | `{ identifier, password }` | `{ token, player }` |
| `auth/change-password` | ✓ | `{ oldPassword, newPassword }` | `{ ok }` |
| `bootstrap` | opt | `{ token? }` | config, teams + live slot counts, active quest, player |
| `player/create` | ✓ | `{ role, teamId, avatar }` | `{ player }` |
| `player/me` | ✓ | `{}` | player + progress + inventory |
| `player/rename` | ✓ | `{ displayName }` | `{ player }` — cooldown + filter enforced |
| `player/update` | ✓ | `{ avatar?, gfxTierPref? }` | `{ player }` — role/team locked after creation |
| `quest/manifest` | ✓ | `{ questId }` | stage metadata + `scene_config`, **no answers** |
| `quest/start` | ✓ | `{ questId }` | `{ runId, startedAt, eventModifiers }` |
| `quest/grade` | ✓ | `{ questId, stageIndex, payload, elapsedMs, hintUsed, gfxTier }` | `{ correct, xpAwarded, revealText?, nextStage }` |
| `quest/hint` | ✓ | `{ questId, stageIndex }` | `{ hintText, cost, highlightAnchors? }` |
| `quest/complete` | ✓ | `{ questId }` | `{ totalXp, items, newLevel, teamDelta }` |
| `demo/grade` | — | `{ stageIndex, payload }` | showcase play without an account (§6.6) |
| `leaderboard` | opt | `{ scope, limit }` | ranked rows, display names only |
| `inventory/use` | ✓ | `{ itemId, context }` | `{ inventory, effect }` |
| `events/current` | opt | `{}` | active event per team |
| `admin/*` | ✓ admin | — | reset password, rename player, publish quest, grant XP, reroll event, rebuild progress, export CSV |

### Router sketch

```js
// Main.gs
function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    if (req.k !== props('PROXY_SECRET')) return json({ok:false, error:{code:'FORBIDDEN'}});
    var h = ROUTES[req.route];
    if (!h) return json({ok:false, error:{code:'NO_ROUTE'}});
    var ctx = h.auth ? requireSession(req.body.token) : null;
    if (h.admin) requireAdmin(ctx);
    return json({ ok:true, data: h.fn(req.body, ctx) });
  } catch (err) {
    log_(err);
    return json({ ok:false, error:{ code: err.code || 'INTERNAL', message: String(err.message || err) } });
  }
}
```

### Caching and performance

| key | TTL |
|---|---|
| `config` | 60s |
| `teams:slots` | 15s |
| `quest:<id>:manifest` | 600s |
| `lb:individual` / `lb:team` | 60s |
| `player:<id>` | 120s |

Cache limits: 100KB/key, 10MB total, 6h max TTL. Truncate leaderboards to top 50 and return the requesting player's own rank separately.

Budget: a `getDataRange().getValues()` on a 5k-row tab costs ~400–800ms. Never read a whole tab inside a loop — read once, index in memory. `quest/grade` should touch exactly two tabs (`QuestStages` cached, `Submissions` one `appendRow`) and finish under 900ms. Rebuild-from-submissions is an **admin batch job**, never on the request path; chunk it with a continuation token if it nears the 6-minute limit.

---

## 6. Signup, display names, teams

### 6.1 Flow — mobile-first, because the showcase is phones

```
#/              landing — the pitch, over a live 3D shot of the ship
#/register      email · password · display name   (one screen, 3 fields)
#/onboarding    1. Role (5 cards, perk on each)
                2. Team (4 ship cards, LIVE remaining slots)
#/bridge        your ship — XP, active quest, team event
```

Target **under 60 seconds** from landing to bridge. Every extra field costs signups at a noisy table. Avatar customization comes *after* (`#/quarters`) — it's fun, but it must not be a gate.

### 6.2 Display names — public, changeable, and therefore a moderation surface

Requirements: user-chosen, unique, changeable later, shown on leaderboards.

- 3–20 characters, letters/digits/spaces/`_`/`-`, no leading or trailing space, no double space.
- Unique on `display_name_lc`. Also reject **confusable collisions** — strip diacritics and map `0/O`, `1/l/I`, `5/S` before the uniqueness check, or you get three players rendering as `Nova` on the leaderboard and an argument about who's actually rank 2.
- Profanity + slur list checked against a **de-leetspeaked, space-stripped** form. A naive word list catches nothing; `n_o_t_h_i_n_g` gets through every time. Keep the list in `Config` so you can extend it without a deploy.
- Reserved prefixes: `admin`, `mod`, `avalon`, `staff`, team names.
- **Rename cooldown of 7 days** (`Config.name_change_cooldown_days`) so the leaderboard stays legible and nobody name-hops to dodge a reputation.
- Every rename writes `NameHistory`. Admin can force a rename and lock it.
- Real names are never displayed anywhere — leaderboards, team rosters, and the comms screen all use display names only. Email is never shown to another player.

That list looks fussy, but display names are the one piece of player-authored content that's visible to the whole club, on a projector, at a school. It's worth 40 minutes.

### 6.3 Team balancing — a real concurrency bug lives here

Forty students, cap 12 per team. Naive "read count, compare, write" is textbook TOCTOU: twenty phones submit in the same second and you end up with 14 on Ignis.

```js
function claimTeamSlot(teamId, playerRow) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw err('BUSY', 'Try that again in a moment.');
  try {
    var cap = teamCap(teamId);                 // slot_cap_override || Config.team_slot_cap
    if (countActiveMembers(teamId) >= cap) throw err('TEAM_FULL', teamName(teamId)+' is full.');
    Db.append('Players', playerRow);
    Cache.drop('teams:slots');
    return { ok:true };
  } finally { lock.releaseLock(); }
}
```

Client side: `bootstrap` returns live slot counts, cards show "4 berths left" and grey out at zero, and the team screen re-polls every 10s. On `TEAM_FULL`, don't dump them to the start — show *"Windward filled up while you were deciding. Pick another ship, or let us assign you where you're needed most,"* with a one-tap auto-assign to the smallest team. Many will take it.

**Sizing at 40:** cap 12 gives 48 berths — enough slack for friend groups without letting one team run away. If a team fills and there's a genuine clamor, raise the cap in `Config`, but raise **all four**, or §4.4's normalization starts working hard to compensate.

### 6.4 Avatar

Layered SVG in the DOM for the profile card, and a matching low-poly suit material on the 3D crew model. Slots: skin tone, suit color (defaults to team), helmet, visor, insignia. Stored as `avatar_json`. ~30 small files, ~15,000 combinations, no uploads and therefore no image moderation problem.

### 6.5 The payload contract — what makes the no-WebGL fallback nearly free

Every stage's answer is expressed in **named anchors**, never screen or world coordinates:

```json
{ "from": "lp_o", "to": "c1" }
```

The 3D input produces that by raycasting onto invisible proxy spheres. The DOM fallback produces the identical object from two `<select>` elements. `quest/grade` cannot tell them apart and doesn't care.

This is the single decision that makes "every quest is a 3D simulation" safe rather than reckless: the 3D layer is an *input method* over a shared contract, not the game itself. Build the contract first, the DOM inputs second (they're an hour), the 3D third.

### 6.6 Demo mode — build this for Friday specifically

`Config.demo_mode_enabled` exposes Quest 1 stage 1 with **no account**: a freshman walking past the table touches a glowing density cloud, orbits it with a finger, solves one puzzle in 20 seconds, and *then* sees "Sign up to keep your XP."

At a showcase table this roughly doubles conversion versus a signup form, because the thing that sells Avalon is the thing on screen, not the description of it. `demo/grade` is unauthenticated, hardcoded to stage 1, rate-limited by IP, and writes nothing.

Pair it with a kiosk laptop looping a 20-second attract sequence (camera drifting through the ship, molecule blooming) and a QR code to the site.

---

## 7. The 3D layer

The whole site is the inside of your ship. Screens are **places**, not pages.

### 7.1 One canvas, one scene, camera anchors

A single `<canvas>` persists for the entire session behind the DOM. The ship interior is **one scene** with named camera anchors, not six scenes — that's cheaper, loads once, and makes navigation feel continuous instead of like page loads with a coat of paint.

| Location | Screen | What you see |
|---|---|---|
| **Bridge** | dashboard | viewport onto the current world, your XP readout, quest briefing |
| **Star Map** | quest select | holo table; quests as worlds, team standings as orbiting markers |
| **Crew Quarters** | avatar | your explorer standing in the suit you built |
| **Cargo Hold** | inventory | items as physical objects on shelves |
| **Comms Array** | leaderboard | signal board, four ship telemetry feeds |
| **Airlock** | quest launch | transition out into the quest scene |

Navigation dollies the camera along a spline between anchors, ~700ms ease-in-out, with the DOM panel for the destination fading in on arrival. A conventional nav bar sits on top for keyboard users, for the fallback tier, and for anyone who just wants to get to the leaderboard.

Quest scenes are **separate** scenes loaded on demand and disposed after — that's where the geometry budget goes.

### 7.2 DOM over WebGL, always

All text, buttons, forms, and panels are HTML/CSS positioned over the canvas. Nothing readable is drawn in WebGL.

Text in WebGL means bitmap fonts or SDF atlases, no text selection, no screen readers, no browser zoom, bad kerning, and a pile of draw calls. The look you want — holographic panels with scanlines and glow — is achievable in CSS with `backdrop-filter`, gradients, and a noise overlay, and it stays selectable and accessible. Anchor panels to 3D positions by projecting a `Vector3` to screen space each frame if you want them to feel attached to the world.

### 7.3 Quality tiers — the thing that decides whether this works in your classroom

Forty students, mostly on school Chromebooks with integrated GPUs, some on 4-year-old phones, on school wifi. This is the single biggest technical risk in v2 and it needs to be designed for on day one, not patched on day six.

**Detection on boot:** `WEBGL_debug_renderer_info` for the GPU string, `devicePixelRatio`, `navigator.hardwareConcurrency`, then a **90-frame FPS probe** on the boot scene. The probe is what actually decides — vendor strings lie, frame times don't. Re-probe if the frame rate collapses mid-session and downgrade live.

| Tier | Target | Settings |
|---|---|---|
| **T3** desktop / discrete GPU | 60fps | pixelRatio ≤2, bloom, soft shadows, 20k starfield, full post |
| **T2** Chromebook / mid phone | 30fps | pixelRatio 1, **no post-processing**, no shadows (baked ambient + emissive), 5k starfield, half-res isosurfaces |
| **T1** no WebGL2 / probe fails / user opt-out | — | **no three.js at all** — pre-rendered stills as backdrops, identical DOM UI, full functionality |

Notes that matter:

- **Skip `EffectComposer` entirely on T2.** A composer doubles fill-rate cost before a single effect runs. On T2, fake bloom with additive glow sprites on emissive objects — visually 80% there for ~2% of the cost.
- Cap `pixelRatio` at 1 on T2. A Chromebook at DPR 2 is rendering 4× the pixels for no visible gain on that panel.
- Manual **"Low graphics"** toggle reachable from the first screen and from the quest HUD, persisted to `gfx_tier_pref`. A student whose laptop is struggling should not have to find settings to fix it.
- `tools/bake-stills.mjs` renders each location headlessly at build time to `public/fallback/*.webp`, so T1 gets real art rather than a blank page.

**Everything must be completable on T1.** Not "mostly." A quest that requires WebGL means a student with a broken laptop cannot compete in a competition you're grading their club participation on. §6.5's shared payload contract is what makes this cheap — the DOM inputs are roughly an hour of work and they're also your development harness when the 3D is half-built.

### 7.4 Performance budget

- **≤ 60 draw calls/frame on T2.** Atoms are one `InstancedMesh`, bonds are one `InstancedMesh`, stars are one `Points`. Ship interior shares 2–3 materials across ~20 primitives.
- **≤ 3MB total assets**, ≤ 500KB critical-path JS. Import three.js addons individually (`three/examples/jsm/...`) so Vite tree-shakes; don't pull the whole examples bundle.
- Reuse geometries and materials; `dispose()` quest scenes on exit or you'll leak GPU memory across a session and the third quest attempt will stutter.
- `renderer.setAnimationLoop`, and **stop the loop when the tab is hidden** (`visibilitychange`) — otherwise 40 backgrounded tabs cook 40 Chromebook batteries during class.
- Render on demand for static screens (Cargo Hold, Comms): only re-render when something changed. Most screens don't need 60fps.

### 7.5 Look and feel, cheaply

Procedural over downloaded, everywhere. No Blender pipeline, no GLTF hunting, no texture painting — you don't have the hours and procedural is smaller anyway.

- **Planets:** sphere + fbm-noise fragment shader. One material, infinite worlds, ~0 bytes.
- **Starfield / nebula:** `Points` with a shader; parallax by depth.
- **Ship interior:** ~20 box/cylinder primitives, one dark metal material, emissive trim strips doing all the work. Convincing sci-fi interiors are mostly *lighting and emissive edges*, not geometry.
- **Holograms:** additive material, Fresnel rim, scanline via `fract(uv.y * n - time)`, slight vertex jitter.
- **Color management:** `renderer.outputColorSpace = SRGBColorSpace`, `ACESFilmicToneMapping`, `toneMappingExposure ≈ 1.1`. Without this, emissive sci-fi looks blown-out and muddy and you'll spend an evening wondering why it doesn't look like the references.

Pin whatever version `npm i three` gives you and don't upgrade mid-week; the addon import paths move between releases.

### 7.6 Accessibility and comfort

The quest is built on reading a *glowing cloud*, so this is not decoration.

- **Colormap:** perceptually uniform and colorblind-safe (cividis/viridis ramp as the emissive gradient). Never red→green. Roughly 1 in 12 boys in that room has a red-green deficiency, and a red-green density map makes the puzzle unsolvable for them.
- **Redundant encoding:** brightness *and* isosurface contour rings *and* a numeric readout on hover/tap. Never color alone.
- **`prefers-reduced-motion`** → no camera swoops (instant cuts), no idle drift, no screen shake. Plus a manual "Reduce motion" toggle: bloom and swooping cameras make some people genuinely nauseous, and you have 40 students.
- **Hit targets ≥ 44px** at 375px width. Anchor proxy spheres are sized in *screen* space, not world space, so they stay pickable when zoomed out.
- **Full keyboard path** through every stage: Tab cycles anchors, Enter picks, arrow keys orbit.
- Pointer Events throughout (never mouse events), and every drag has a **tap-source-then-tap-target** alternative. Dragging a 3D arrow on a phone in a crowded room is miserable; tap-tap is not.

---

## 8. Quest 1 — *The Charge Gardens of Vareth-9*

### 8.1 The teaching problem

Students should leave able to predict **electron flow** — the engine of essentially all of organic and acid–base chemistry — without being assumed to know what an electron, atom, or molecule is. Half the room is freshmen who have never taken chemistry.

The method: **never define the vocabulary until after they've used the idea.** They learn a visual rule, apply it six times, and only then get told the words. This is the reverse of a textbook and much better for a club.

### 8.2 Why 3D is actually the right call here

This is the rare case where the 3D isn't decoration. A lone pair is a *spatial* thing — a lobe sticking out into empty space in a particular direction. A 2D slice through a density map hides exactly the feature the whole puzzle turns on. Letting a student orbit a molecule with their finger and watch a bright lobe swing into view is a better explanation than any diagram, and it's the explanation the medium is uniquely good at.

### 8.3 The frame that makes density maps make sense

Vareth-9 is wrapped in luminous fog. Your ship's scanner can't render solid matter — it renders **charge**. Everything you see is a false-color charge map, because that's the only instrument you have. Bright = crowded. Dark = starved. The alien machinery — a derelict terraforming lattice, the "charge gardens" — runs on charge flowing from crowded places to empty ones. To open a lock, you route the flow.

That conceit means a glowing density isosurface needs no apology: it's just what the scanner shows.

### 8.4 One scene, seven stages

**All seven stages run inside the same `quest3d/viewer.js`** — a containment chamber in the facility, with different molecules loaded and different anchors made live per stage via `scene_config`. You build one scene and configure it seven times. This is what makes the scope survivable, and it's also better design: the student learns one interaction language instead of seven.

**Stage 0 — Arrival** (no XP). The ship descends; the facility is dark; a door with three unlit rings. Sets the loop: read the fog, route the flow, open the lock.

**Stage 1 — Calibrate the scanner** · `pick` · 10 XP
One abstract charge cloud floating in the chamber. Orbit it, click the brightest lobe. Teaches the orbit control and the colormap simultaneously, with no chemistry at all. Everyone wins in the first 30 seconds — this stage exists for that reason and is also the **demo-mode stage** (§6.6).

**Stage 2 — Read the lean** · `rank` · 15 XP
Three two-atom beacons on a rail (H₂, LiH, HF — never named). Orbit each; drag to order by how lopsided the cloud is.
*Reveal:* "Some pairs share evenly. Some don't. The lopsided ones are where things happen."

**Stage 3 — Giver and taker** · `pick_multi` · 20 XP
Two structures in the field. Click the most crowded spot on one, the most starved on the other. In 3D the lone pair genuinely protrudes — this is where the medium earns its keep.
*Reveal:* "Crowded places give. Starved places take. That's the whole game."

**Stage 4 — Route the current** · `arrow` · 25 XP
Drag a glowing arrow through 3D space from giver to taker; it snaps to anchors within threshold. First real arrow-pushing, and they already located both ends in stage 3 — one new idea, not three.

**Stage 5 — The aftermath** · `choice` · 25 XP
The simulation **plays**: the bond forms, the leaving group drifts away, the clouds redistribute. Then: which of three end states matches? Bond making and breaking as a visible consequence of the arrow they drew.

**Stage 6 — The lock** · `chain` · 40 XP
Three arrows in sequence to open the door. Order matters; each step animates. Everything from 1–5, composed.

**Stage 7 — Bonus: the unlit garden** · `chain`, no highlighted anchors, no hints · 30 XP + guaranteed item
A fresh case with the scaffolds removed. Optional. This is what the competitive students will fight over, and where the item drops.

**Epilogue — the reveal.** Now, and only now, name it:

> *The crowded places you've been clicking are called* **lone pairs** *and* **π clouds**. *The starved places are* **electrophiles**. *The arrow you drew has a name —* **curved-arrow notation** *— and chemists use exactly the same one. You just did nucleophilic substitution. Real one. Today.*

Total **165 base XP**, ~200 with bonuses. Target 25–35 minutes.

### 8.5 Rendering molecules

- **Atoms:** one `InstancedMesh` of an icosahedron, per-instance color and scale. One draw call for every atom in the scene.
- **Bonds:** one `InstancedMesh` of a cylinder, per-instance matrix.
- **Density:** precomputed isosurface meshes, **two nested shells** — a wide diffuse shell at low isovalue and a tight bright core at high isovalue. Two shells read as "density" far better than one, which just reads as "a blob."
- **Material:** additive/transmissive with a **Fresnel rim** (`pow(1.0 - dot(normal, viewDir), 3.0)`), emissive ramped along the cividis gradient, `depthWrite: false`, sorted back-to-front. Cheap, and it looks like energy rather than plastic.
- **Do not write a volumetric raymarcher.** Precomputed shells look nearly as good, cost a fraction of the fill rate, and run on a Chromebook. Raymarching a volume is a beautiful two-day detour that ends with T2 at 8fps.

### 8.6 Asset pipeline

`tools/density/`:

1. `molecules.py` — geometries for H₂, LiH, HF, and the quest-6 reaction pair.
2. `isosurface.py` — PySCF RHF, evaluate density on a 3D grid, `skimage.measure.marching_cubes` at two isovalues.
3. `export_glb.py` — decimate to ≤ 8k triangles per shell, weld, export `.glb` into `public/quests/q1/`.

Deterministic and regenerable, which matters because you'll want to tweak isovalues at 11pm on Thursday.

**Time-box to 2 hours.** If PySCF fights you, the fallback is **analytic pseudo-density**: superpose Slater-type exponentials at each nucleus with hand-tuned weights and march *that*. It is not a real wavefunction and it does not need to be — the lesson is "crowded vs. starved," and a hand-tuned field is arguably *clearer* because you control exactly what's salient. Nobody in the club can tell the difference, and the pedagogy is identical. Ship it if the clock runs out.

### 8.7 3D interactions

- **Orbit:** `OrbitControls` with damping, clamped polar angle, pinch-zoom via Pointer Events. Auto-frame the subject on stage load so nobody starts lost.
- **Picking:** `Raycaster` against **invisible proxy spheres** at named anchors, sized in screen space so they stay ≥44px when zoomed out. The proxy names are the same strings in `answer_json` (§2.5).
- **Arrow drag:** pointerdown on a source anchor → `QuadraticBezierCurve3` → `TubeGeometry` follows the pointer projected onto a camera-facing plane → pointerup snaps to the nearest anchor within threshold. Tap-source-then-tap-target is the required alternative path.
- **Hover feedback:** anchors pulse gently on proximity. Without it, students don't know the molecule is clickable and just orbit it for a minute.

### 8.8 Grading

Answer keys never ship to the browser. Every stage submits its anchor-name payload to `quest/grade`.

The ~600ms round trip is hidden diegetically: on submit, the chamber runs a **"SCANNING…"** sweep for ~700ms. Correct → the cloud blooms and the ring lights. Wrong → scanner-error shudder, attempt 2. The latency becomes a feature rather than a wait.

**Anti-cheat, proportionate:** keys server-side, attempts logged, XP decay on retries, 1 grade / 2s / player, and `AuditLog`. Stop there. This is a club, and a leaderboard that shows attempt counts deters more than any check you could write.

---

## 9. Random events

At quest release each team rolls once, **deterministically seeded**:

```js
seed  = SHA256(quest_id + "|" + team_id + "|" + SEASON_SALT)
roll  = first 4 bytes mod 110
event = weighted pick over Events
```

Same inputs, same result, seed logged in `EventLog`. When someone insists you rigged it against Ignis, you show them the arithmetic. Costs nothing; prevents a genuinely annoying conversation.

| event | weight | polarity | effect |
|---|---:|---|---|
| Quiet Space | 30 | neutral | nothing |
| Slipstream Current | 12 | good | +15% XP this quest |
| Derelict Cache | 10 | good | +1 random common item to every member |
| Stellar Wind | 8 | good | hints free this quest |
| Salvage Rights | 6 | good | first 3 finishers +25 XP |
| Solar Flare | 12 | bad | −10% XP this quest |
| Ion Storm | 10 | bad | hint cost doubled |
| Hull Breach | 7 | bad | −1 random item from each member |
| Comms Blackout | 5 | bad | no live leaderboard until they finish |
| Rival Signal | 5 | chaotic | swap one random item with a rival team |
| Anomaly | 3 | chaotic | XP doubled *or* halved, coin flip at close |
| Derelict Beacon | 2 | epic | team gets an epic item |

Keep ~30% "nothing" — constant events stop feeling like events.

Effects are `effect_code` strings interpreted in `Scoring.gs` at grading time, never baked into stored XP, so a misfiring event is voided by flipping one cell.

**Presentation:** quest release triggers a d20 roll on the team's ship card on the Bridge, then the event card flips in with art and flavor. Ten seconds of theater people will look forward to every other Friday.

### Items

| item | rarity | effect |
|---|---|---|
| Hint Chip | common | one free hint |
| Spare Coolant | common | restore one lost attempt |
| Overclock Module | rare | ×1.25 XP on one quest |
| Deflector Plate | rare | negate one bad event |
| Scanner Upgrade | rare | reveal the colormap legend + numeric readouts |
| Star Chart | epic | skip one stage at half XP |
| Resonance Key | epic | +50 XP, single use |

Seven is enough for v1. Player-to-player **trading** is a good Season-II feature and a scope trap today.

---

## 10. Admin

`#/admin`, gated on `Config.admin_emails`:

- **Reset a password** (§3.5) — mandatory now that there's no email path
- **Rename a player**, force + lock a display name
- Publish / close a quest (triggers event rolls)
- Grant / revoke XP with a mandatory reason → `AuditLog`
- Rebuild `Progress` from `Submissions`
- Reroll a team's event (logged; use sparingly)
- Export players and submissions as CSV
- Live counters: signups per team, completion %, **submissions by `gfx_tier`** (tells you Saturday whether the fallback is actually solvable)

Everything else you do by editing the sheet directly, which is the whole reason to pick this backend. Fixing a typo in a quest blurb should be a cell edit, not a deploy.

---

## 11. Build order

Tue 9/15 → Fri 9/18. Estimates assume focused hours and familiarity with the stack.

Each phase ends at a **cut line**: a point where what exists is a coherent, shippable product rather than a half-finished one. That's not a suggestion to stop — it's insurance, so that whatever the clock does on Thursday night, Friday morning has something real to show. Build in this order and the decision never has to be made under pressure.

### Phase 0 — Backend spine · Tue, ~4h
1. Create "Avalon DB", 13 tabs with headers; seed `Config`, `Teams`, `Items`, `Events`. *(45m)*
2. clasp project; `Db.gs` header-mapped DAO, `Util.gs`, `Main.gs` router + error envelope. *(90m)*
3. `Auth.gs`: salt lookup with dummy-salt path, constant-time compare, HMAC tokens. *(60m)*
4. Deploy web app, set script properties, `curl` end-to-end. *(30m)*

> **Cut line 0:** a fake registration `curl` puts a row in the sheet.

### Phase 1 — Accounts and shell · Tue night / Wed, ~6h
5. Vite scaffold, hash router, `api.js`, `session.js`, design tokens. *(75m)*
6. Vercel project, `api/[...route].js` with **scrypt** + rate limiting, env vars, first deploy. *(90m)*
7. Landing, register, login screens. *(75m)*
8. Display-name validation: uniqueness, confusables, de-leetspeak filter, `NameHistory`. *(60m)*
9. Onboarding: role → team, live slot counts, `TEAM_FULL` recovery. *(90m)*
10. `claimTeamSlot` with `LockService`; run `tools/loadtest.mjs` at 40 concurrent. *(45m)*
11. Admin: password reset + rename. *(45m)*

> **Cut line 1 — this is what Wednesday's meeting needs.** Working signups, teams filling live, a countdown to Friday. Announce on the strength of the countdown.

### Phase 2 — 3D foundation · Wed night, ~7h
12. `three/stage.js`: renderer, loop, resize, color management, visibility pause. *(60m)*
13. `three/tier.js`: GPU probe + 90-frame FPS probe + manual override + `gfx_tier_pref`. *(75m)*
14. `three/ship.js`: interior from ~20 primitives, emissive trim, one lighting rig. *(150m)*
15. `camera-rig.js`: spline dolly between six anchors; DOM panels projecting to screen space. *(90m)*
16. `fallback2d/` shell + `tools/bake-stills.mjs`. *(45m)*

> **Cut line 2:** the site *is* a ship. Bridge, Star Map, Comms navigable on all three tiers.

### Phase 3 — Quest engine + Quest 1 · Thu, ~11h
17. Density assets — PySCF → marching cubes → `.glb`. **Hard 2h box**, analytic fallback after. *(120m)*
18. `quest3d/viewer.js` + `molecule.js` + `isosurface.js`: the one reusable chamber. *(150m)*
19. `anchors.js` + `interactions/`: raycast pick, rank rail, 3D arrow drag, chain. *(180m)*
20. `fallback2d/` inputs for all four kinds against the same payload contract. *(60m)*
21. Stage machine, `quest/manifest|start|grade|complete`, scoring, hints. *(120m)*
22. Author all 7 stages: `scene_config`, copy, answer keys, reveal text. *(120m)*
23. Completion sequence: XP, item drop, level-up, epilogue reveal. *(60m)*

> **Cut line 3:** Quest 1 playable end to end on T2 and T1.

### Phase 4 — Ship it · Thu night / Fri morning, ~4h
24. Demo mode + kiosk attract loop + QR poster. *(60m)*
25. Leaderboard (display names, §4.4 team normalization) and event roll theater. *(90m)*
26. **Playtest with someone who has never taken chemistry, on a Chromebook.** *(60m)*
27. Flip `q1` to `live`, roll events, verify all four teams got one. *(30m)*

> **Step 26 is not optional.** If your test subject needs you to explain anything, the quest is broken, not them. And test on the worst hardware in the building, not your laptop — the whole tier system is guesswork until a real Chromebook has run it.

### Phase 5 — After the drop
Inventory screen and item consumption · avatar builder · Crew Quarters and Cargo Hold scenes · Quest 2 authored against where students actually got stuck in Q1.

---

## 12. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Scope vs. 3 days** | High | Ships rough or late | Phase cut lines (§11) so every stopping point is coherent; one reusable quest scene; procedural assets; DOM fallback doubles as the dev harness |
| **WebGL performance on school Chromebooks** | High | Quest unplayable for many | Three-tier system with live FPS re-probe, no post-processing on T2, full non-WebGL T1, `gfx_tier` logged on every submission (§7.3) |
| Motion sickness from camera swoops + bloom | Medium | A few students can't use it | `prefers-reduced-motion` honored, manual reduce-motion toggle, instant cuts (§7.6) |
| Colorblind students can't read density | Medium | Excludes students | cividis ramp, contour rings, numeric readout — never color alone (§7.6) |
| **No password reset path** | High | Locked-out students quit | Admin reset tool built in Phase 1, not later; login accepts display name too (§3.5) |
| Password hashing attempted in Apps Script | Medium | Slow logins, weak hashes, quota burn | scrypt in the Vercel function; Apps Script only compares (§3.2) |
| Concurrent writes corrupt XP | Medium | Silent, unfixable later | Append-only submissions, derived totals, `LockService` on the two RMW paths (§4.3) |
| Team fills, students upset | High | Social | Live berth counts, graceful `TEAM_FULL` copy, one-tap auto-assign, cap raisable in `Config` |
| Display name abuse on a projected leaderboard | Medium | Embarrassing, in public | De-leetspeaked filter, confusable-collision check, 7-day cooldown, `NameHistory`, admin force-rename (§6.2) |
| Apps Script 90 min/day runtime (consumer) | Medium | Hard stop mid-day | Aggressive `CacheService`; leaderboard is the only expensive read; batch jobs admin-triggered only |
| Deployment URL changes on push | High | "It just stopped working" | `clasp deploy -i <id>` in an npm script; never create a fresh deployment |
| School network blocks `script.google.com` | Medium | Total outage | The proxy already fixes it — the browser never talks to Google. Verify on school wifi Wednesday anyway |
| Asset size on school wifi | Medium | Slow first load at the table | ≤3MB budget, stream non-critical scenes, kiosk laptop preloads |
| PySCF pipeline eats Thursday | Medium | Delays the quest | Hard 2h box, analytic pseudo-density fallback pre-agreed (§8.6) |
| **Interest dies by November** | High | The project fails | Every-other-week cadence, visible team race, events as recurring theater, quests finishable in one sitting |

That last row is the one that actually decides whether this works. The technical risks all have fixes; sustaining a year-long competition doesn't. Draft Quests 2 and 3 now, while you're excited, so late October has a stocked shelf.

---

## 13. Resolved parameters and what's still open

**Settled:** personal Gmail deploying account (consumer quotas, no mail sent anyway) · email + password auth, no verification · showcase and Quest 1 drop both Fri 9/18 · ~40 students, cap 12/team · every quest a three.js simulation, whole site a ship · leaderboards show user-chosen changeable display names · domain decided at deploy, assume `*.vercel.app`.

**Still open:**

1. **Quest content authoring — sheet or repo?** This plan assumes prose, answer keys and `scene_config` in `QuestStages` (editable without a deploy), with interaction *code* in the repo. Confirm before you author stage 2, because moving it later is annoying.
2. **Do you want a club-wide join gate?** Right now anyone with the URL can register. At 40 students on a `*.vercel.app` URL nobody will find it — but a single shared code in `Config` is ~15 minutes if you'd rather not rely on that.
3. **What's the worst laptop a student will realistically bring?** Everything in §7.3 is calibrated guesswork until you run the FPS probe on one. If you can borrow a school Chromebook before Thursday, that's the highest-value hour in the whole build.
4. Anything else that must stay off a public-ish site? Default here: display names only, real names and emails never shown to other players.

---

## 14. First commands

```bash
cd ~/uhs-chem-club
git init && npm create vite@latest . -- --template vanilla
npm i three && npm i -D @google/clasp
mkdir -p apps-script api docs/quests \
         src/{three/{materials,lib},quest3d/interactions,fallback2d,screens,ui,styles} \
         public/{quests/q1,fallback,art} tools/density
cd apps-script && npx clasp login && npx clasp create --type standalone --title "Avalon Backend"
```

Then Phase 0, step 1: build the spreadsheet. Everything else hangs off that schema.
