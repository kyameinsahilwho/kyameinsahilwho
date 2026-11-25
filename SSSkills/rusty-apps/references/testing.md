# Testing, screenshots and performance measurement

## Rust tests

- Pull platform-independent decisions into pure functions and unit-test them: arg parsing (`--wait-for-pid` missing or
  non-numeric), multi-monitor rect validation, theme mapping and the exact initialization-script string, cache round-trip
  + rejecting `../evil` keys, error-mode flags actually set, HRESULT classification, progress-line parsing (feed 7-byte chunks).
- Filesystem tests on real temp trees under `%TEMP%` (unique per pid+time, Drop removes them, assert the path starts with
  temp). Junctions via `cmd /c mklink /J`, hard links via `std::fs::hard_link`, read-only files, deep trees, age filters.
  An invariant checker (`parent id < child id`, folder size = own files + subfolders, category sums = size).
- System-touching code without side effects: run guards/preflight on dangerous inputs, never the action. A harmless
  stand-in child (`ping.exe -n 60 127.0.0.1`) to test cancel/kill instead of defrag.
- Parity tests when replacing a shell-out with a native API: run both, `assert_eq!` their pretty JSON, print timings.
- Slow/real-machine benchmarks as `#[ignore = "how to run: cargo test --release name -- --ignored --nocapture"]` tests that
  print timings (thread CPU via `GetThreadTimes`, env vars select inputs). Tests that detach the console must run alone
  (`--test-threads=1`).
- Platter had 52 tests; `cargo test` takes ~30 s after the build.

## Screenshots

- **Mock UI**: copy `scripts/shoot.mjs` into a scratch dir with `npm i puppeteer-core@23`, then
  `node shoot.mjs out.png <abs>/ui/index.html "#theme=dark&view=x" 1320 860 "#map canvas"` — puppeteer-core driving
  installed Chrome, waits for a selector only the rendered app produces, prints console/page errors. Chrome's own
  `--headless --screenshot --virtual-time-budget` fired before top-level-await modules rendered (9 KB blank shells);
  `--dump-dom` tells "didn't render" from "fired too early". Critique every view in light **and** dark.
  (After a context compaction this was forgotten and relearned on MAX: 4 identical 5,756-byte blank PNGs. Reach for
  `shoot.mjs` first.)
- **Mock click-through flows**: the same puppeteer setup can drive a whole feature (`page.click('[data-action=…]')`,
  `waitForSelector` on the element the next step renders, `page.evaluate` to read labels and disabled states, a
  screenshot per step). Make the mock's dialogs return inputs that match its own fixtures (a folder on a drive the mock
  actually lists). This runs headless, so it's safe while the user is at the PC.
- **Real window**: `scripts/winshot.ps1 -Process myapp -Out shot.png [-Launch -Exe …] [-Clicks "x,y"]` (launches with
  `--no-elevate` by default so an admin-at-startup app doesn't pop UAC; pass `-LaunchArgs ""` for apps without the flag). Needs
  `SetProcessDPIAware` (125 % scaling breaks clicks otherwise), `DwmGetWindowAttribute(…, 9)` bounds and `CopyFromScreen`
  (PrintWindow is black for WebView2). Only click non-destructive controls; press Cancel, never trigger UAC or deletion.
- **Real-window clicks hit whatever is on top.** On MAX the user started a video mid-session and a scripted "Recover"
  click landed in their player. Before every click batch, check the user is away (`GetLastInputInfo`: no input for
  ≥ 60 s) and that the app's window is the foreground window (`GetForegroundWindow` = its handle); otherwise stop and
  switch to headless mock flows. Once the user is seen at the PC, do no more real-window automation that turn.
- When captures look wrong, rule out the environment first: pixel-identical repeats → hash two full-screen captures
  (frozen display?), `LogonUI.exe` running → locked session, debug build → different window class, black WebView → stray
  instances sharing a data folder. Move the cursor away first (taskbar thumbnails).
- Read the PNGs (the Read tool shows images) and fix what you see; upscale small bitmaps 3× nearest-neighbour to inspect.

## Launch performance methodology

1. Instrument first (`perf.rs` timeline + JS marks), then optimize.
2. Copy the pre-optimization exe aside (`bench/<app>-baseline.exe`) so before/after run **back to back in one session** —
   machine speed drifted 2–3× within a day (`window-built` 164 ms vs 477 ms). Never compare with numbers from hours ago.
3. `scripts/launch-bench.ps1 -Exe … -Identifier <tauri identifier> -Runs 5`: kills the app *and* its
   `msedgewebview2.exe` (matched by identifier in CommandLine — they outlive the parent and get reused), kills by the
   exe's own name too (`-AppName`; a renamed baseline isn't "myapp" — 5 stray copies once invalidated a whole run and
   blacked the window), asserts the app process is gone (an elevated copy can't be killed → fails loudly), keeps user
   settings stored in the cache dir (`askAdmin.json`) on `-NoCache`, fixed 15 s window, CPU (`KernelModeTime + UserModeTime`, 100 ns units) and working set summed
   over the tree, medians. Warm and `-NoCache` runs separately; first run after a build is an outlier.
4. `Process.MainWindowHandle` timing is meaningless with a hidden-at-start window — use in-app marks.
5. Don't make the harness wait for a mark an optimization removes.
6. Report a before/after table (README) with medians and how it was measured; name your own measurement mistakes.

What moved the needle on Platter (median of 5): CPU in first 15 s 20.7 s → 1.9 s (don't measure at launch; cache);
disk info 1,357 → 557 ms (WMI COM instead of PowerShell); history 1,594 → 530 ms (Event Log API); clean-up sizes
9.8 s → 0.48 s (cache, background re-measure > 12 h); window visible ~421 → ~357 ms in theme colours; memory 477 → 398 MB;
full C: scan 11.8 → 8.5–9 s (FileIdBothDirectoryInfo, fewer threads). Release-profile tuning: size only.

## Verifying on the real machine (standard user)

Build, launch (with `--no-elevate` if the app prompts at startup), screenshot every view against real data, scan a real
drive, open dialogs and Cancel. Test the non-admin path of every admin command returns its sentence before spawning
anything. Never run trim/defrag/letter change/real deletion on the user's machine. **Reversible system settings** (charge
limit, power plan, registry policy): never write them unattended — ask first, read and save the original value, apply,
read back, restore, and report. List what wasn't exercised in the final report.
