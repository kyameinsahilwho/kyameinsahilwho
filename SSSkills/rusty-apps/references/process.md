# How to run a multi-part Rust desktop build (agents, contract, reviews, reporting)

## Contract-first parallel build (the pattern that made subagents work)

1. Toolchain check + scaffold + a first clean `cargo build` yourself (pays the dependency compile once).
2. Write **CONTRACT.md**: every command (name, args, return JSON), every event and payload, conventions (camelCase JSON,
   `Err(String)` = one user-facing sentence, sizes in u64 bytes, async + spawn_blocking, CREATE_NO_WINDOW), shared helpers
   in util.rs, the toolchain ("GNU, no MSVC, PATH prefix"), per-module status. Keep it in sync with every change — reviewers
   repeatedly caught contract drift.
3. Compile-ready **stubs** for each module returning `Err("Not implemented yet")`, commands registered in main.rs. Build once.
4. Delegate with **strict file ownership**: each agent edits only its files, never main.rs/CONTRACT.md; contract changes are
   additive (`Option<T>` args) and reported in the summary instead of edited; if the shared build breaks in someone else's
   file, wait ~60 s and retry; debug builds only. Forbid crate-wide `cargo fmt` — it rewrote another agent's files
   mid-edit on Platter; format only your own files (`rustfmt src/<own>.rs`) or leave it to the orchestrator. Module state in statics (`OnceLock<Mutex<…>>`, `AtomicBool` cancel).
5. Build shared infrastructure (cache, perf marks, new Cargo features) **before** fanning out a second round.
6. Keep the design-critical UI yourself; give the mock backend to a cheaper model. Spot-check delivered shapes against
   the contract (grep the structs) and run the real app when agents finish.
7. Agent briefs must forbid real system-mutating commands during exploration (partition/letter/label changes, defrag,
   deletion, writing system settings) — one agent "probed" `Set-Partition` moving D: to Q: unelevated (Windows refused).
   Flag such incidents to the user.

## Adversarial review (do it for anything that deletes files, changes disks, or touches elevation/IPC races)

- Reviewers by area/lens (deletion safety first; races; UAC edge cases; UI ↔ contract; system tools), read-only, no builds.
  Each finding needs file:line and a concrete failure scenario.
- 2–3 skeptical verifiers per finding, prompted to refute (default refuted if the scenario can't happen or is pre-existing).
- Fix by file group (one agent per file set → no conflicts), then verifiers per fix: "fixed?" and "regression?", then one
  integration build/test pass. The orchestrator takes cross-cutting leftovers.
- Track record on Platter: round 1 → 35 findings, all real (incl. the critical junction-swap delete) — cost 75 agents,
  ~4.2M tokens, 464 tool calls, then a 41-agent fix workflow over 5 file groups (all 35 verified fixed, 38 tests passing);
  round 2 / optimization round → 21; the startup-elevation change (session 2) → 9 confirmed of 11 (2 important: the
  installer couldn't close the elevated app; a setting was saved to the wrong account), none of which the author's own
  pass had caught. Budget for it on anything that deletes or elevates; use smaller reviewer sets for UI-only changes.
- Re-review your own fix for regressions (a reorder that closed one race broke the other-account path).
- MAX File Recovery: 8 lens reviewers, 2 refuting verifiers per finding → 59 confirmed (3 critical, all "recovered
  files can be written back onto the source" through junctions, loopback shares and unidentifiable snapshot disks; see
  raw-disks.md), fixed in three rounds with a verifier per fix. One fix made things worse: to keep an
  elevated-as-another-account instance on the original user's data, it read that user's profile from an admin process,
  a privilege risk. It was reverted to the elevated account's own profile plus a note in the UI. Verifiers must ask
  "does this fix widen what an elevated process trusts?", not only "is the bug gone?".

## Running these as Workflow scripts (ultracode)

- A `pipeline()` stage that returns `null` (or throws) drops that item's **remaining** stages. A fix workflow whose
  "fix" stage returned null for verify-only groups silently skipped their verification. Give verify-only groups their
  own pipeline, and `log()` every dropped item.
- Long fix rounds can hit the 5-hour usage limit mid-run. Keep each round resumable (`resumeFromRunId`; unchanged
  prefixes come from cache) and record which groups finished, so the next round only re-runs the rest.
- Fix agents that edit files with non-ASCII bytes (FAT/OEM test names) can re-encode them. Re-run that file's tests
  right after the fix stage, not only at the end.

## After a context compaction

The summary keeps decisions but drops *how* things were done (which script, which flag). Before redoing a step this
playbook covers (screenshots, install verification, benchmarks), re-read the matching reference instead of improvising.

## Optimization round

Split into areas (startup, backend data sources, scanner, UI), one implementing agent each, adversarial reviewers per area,
area agents fix findings, orchestrator handles leftovers, then **re-measure end to end yourself** with the benchmark and
update CONTRACT.md with every new command/cache key.

## Waiting and background work

Long builds/benchmarks in the background; end the turn with a status line rather than polling. Background-wait tools take
background-command IDs, not subagent/delegate IDs (those notify on completion by themselves).

## This user (from both threads)

- Wants **parallel subagents** on multi-part builds ("use subagents too bro"); likes the frontend-design skill; wants
  features that matter to real users.
- Wants finished, verified results: built, installed on the laptop, launched, screenshot-checked. Report in plain language,
  with a before/after table for perf, an explicit "not tested / not done" list, and own measurement mistakes named.
- Errors as one plain sentence that says what to do. Comments that explain *why* a measured choice was made (numbers, date).
- Admin by default (prompt at startup, graceful decline, opt-out checkbox + `--no-elevate`), "Restart as administrator"
  where needed; show the window rather than force it to the front.
- Never run destructive admin actions on the user's machine; never pop UAC on them during automated tests.
- Platter's repo was created private (and later made public after a secrets scan); ask before making anything public. Commit/push only when asked.
- Admin prompt at every start was chosen for an admin-heavy tool; for apps where one feature needs admin, ask first
  (see elevation.md "Choose the elevation model").
