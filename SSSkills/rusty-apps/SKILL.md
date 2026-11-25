---
name: rusty-apps
description: Field-tested playbook for Windows desktop GUI apps in Rust: Tauri v2 + vanilla HTML/CSS/JS, Win32 via windows-sys, the GNU toolchain without Visual Studio, UAC/admin elevation, single instance, fast filesystem scanning and safe deletion, WMI/Event Log/COM without PowerShell, NSIS installers, launch benchmarks, screenshot tests, raw volume/disk reads and safe recovery destinations (learned building the Platter disk utility and the MAX File Recovery app). Use when the user wants to create, extend, debug, speed up, package or install a Windows desktop, tray or system-utility app in Rust or Tauri (hardware, battery, disk, cleanup, drives, data recovery, imaging, system tools), or mentions Tauri, WebView2, windows-sys, windres/MinGW, NSIS, UAC/"run as admin" or single instance for such an app, including when they ask for a Windows app with an installer and name no language. Not for Rust CLIs, libraries, parsers, web servers, WASM, cross-platform or non-Windows work, or scripts in other languages.
---

# Rusty apps: Rust desktop apps on Windows that ship

This is what worked (and what broke) building **Platter**, a Tauri v2 + vanilla-JS Windows disk utility: drive
overview, NTFS cluster map, parallel space scanner + treemap, safe cleanup, trim/defrag with live progress, drive
management, an NSIS installer, and an admin prompt at every start. CPU used in the first 15 s after launch went from
20.7 s to 1.9 s. Several adversarial review rounds (35, 21 and 21 findings, then 9 confirmed issues on the
startup-elevation change) caught bugs that a single pass had missed. The working app is the best reference **when a
clone is available** (e.g. `D:\projects\platter`, from GitHub repo `kyameinsahilwho/platter`). Its `CONTRACT.md` documents every
command and event, and `README.md` has the perf table. Without a clone, rely on the templates below.

The second app, **MAX File Recovery** (e.g. `D:\projects\ReincarnateMax`, GitHub repo `kyameinsahilwho/ReincarnateMax`),
reads raw volumes, disks, shadow copies and disk images, carves files, previews them (video with seeking) and recovers
them to another drive. It shipped with 282 tests, an end-to-end test against a public forensic image's MD5 answer key,
and a 59-finding adversarial review. It is the reference for anything in `references/raw-disks.md`.

Read the reference file for the area you're touching. Each one is dense with specifics (API names, error codes, numbers):

| Area | Read |
| --- | --- |
| Toolchain without MSVC, Node/CLI, windres space bug, build loop, release profile, crates, git | `references/toolchain.md` |
| Tauri config, IPC conventions, no-flash startup, window state, single instance, cache, perf marks, tray | `references/tauri-shell.md` |
| **Choosing the elevation model**, admin-only APIs, relaunch, prompt at startup, handoff race, other account, UIPI | `references/elevation.md` |
| windows-sys FFI, drives/IOCTLs, raw-COM WMI, Event Log, Task Scheduler, child processes, defrag, hardware probing | `references/win32.md` |
| Fast directory walking, hard links/cloud/WOF sizes, rayon shape, background priority, **safe deletion** | `references/filesystem.md` |
| Vanilla JS architecture, patch/patchKeyed/restoringFocus, mock backend, theming, approved design, UI perf | `references/ui.md` |
| Rust test patterns, mock and real-window screenshots, launch benchmark methodology, real-machine checks | `references/testing.md` |
| NSIS config, per-user vs per-machine, branding bitmaps, installer close hook, scripted install verification | `references/installer.md` |
| Contract-first parallel agents, adversarial review, optimization rounds, Workflow pitfalls, this user's preferences | `references/process.md` |
| **Raw volume/disk reads**, bad sectors, never writing onto the source, `maxfile://`-style Range streaming, per-job SQLite stores, recovery-engine shape, fixtures from real images | `references/raw-disks.md` |

Bundled, ready to adapt (the templates compile together as a scratch Tauri project; 7 tests pass):
- `assets/templates/main.rs` + `util.rs` + `perf.rs` + `cache.rs` + `other_account.rs` together form a working app
  shell:
  - startup order, plus a window built hidden in theme colours with its saved geometry restored
  - `app_ready`, the theme pref, and the commands `relaunch_elevated` / `set_ask_admin`
  - single instance, an optional startup UAC prompt with a race-free handoff, and the activation and installer-close
    window messages
  - the stale-while-revalidate cache and the perf timeline

  Rename the `com.example.myapp` / `MyAppMainWindow` / `MyApp` ids. The cache folder name must equal the
  tauri.conf.json `identifier`.
- `assets/templates/hooks.nsh` (NSIS close-running-app hook), `make-art.ps1` (installer bitmaps; adapt the mark and
  motif) and `cargo-config.toml` (space-free target dir).
- `scripts/shoot.mjs`: screenshots the mock-backed UI in headless Chrome. Copy it into a scratch dir that has
  puppeteer-core.
- `scripts/winshot.ps1`: screenshots the real window and clicks inside it. DPI-aware, launches with `--no-elevate` by
  default.
- `scripts/launch-bench.ps1`: launch benchmark over the app + WebView2 process tree, reporting medians.

## The playbook

1. **Toolchain check.** Check `cargo`, `windres`, MSVC (vswhere) and `node`/`npx` (the tauri CLI for icons and the
   installer, and puppeteer). Without MSVC, use rustup's `x86_64-pc-windows-gnu` plus a MinGW windres (Strawberry Perl
   or WinLibs). **If the project path contains a space, set a space-free `target-dir` in `.cargo/config.toml` before
   the first build.** windres fails with `cc1.exe: fatal error: projects\…: No such file`.
2. **Scaffold** a static-frontend Tauri app with no npm or bundler: the `custom-protocol` feature, `withGlobalTauri`, a
   window declared `create:false, visible:false` and built in `setup()` (start from `assets/templates/main.rs`), and a
   placeholder `ui/index.html`. For icons, draw a 1024² `source.png` (System.Drawing works) and run
   `npx -y @tauri-apps/cli@2 icon`. Then **start the first `cargo build` in the background**, which pays the dependency
   compile once (~4 min).
3. **Feasibility spike.** For every system feature, write a throwaway read-only `#[test]` that calls the real API on
   this machine. Record what works unelevated, what needs elevation, and what doesn't exist at all (vendor- or
   firmware-specific features). Do this before designing the UI or the contract. It decides the elevation model
   (`references/elevation.md`) and which "unsupported here" states the UI needs.
4. **Design pass.** Use the frontend-design skill. Pick one memorable, truthful visual and keep the rest quiet; avoid
   KPI-card rows and donuts. Admin-only features get a ghost state; unsupported features get their own state.
5. **CONTRACT.md + compile-ready stubs, then fan out** to parallel subagents with strict file ownership (and no
   crate-wide `cargo fmt`). Keep the UI yourself and give the mock backend to a cheaper model. The user explicitly wants
   subagents on multi-part builds.
6. **Build the UI against `mock.js`.** Add URL-hash state hooks that only work under the mock, and screenshot every
   view in light and dark with `shoot.mjs`. Critique the screenshots and fix what you see.
7. **Real build on the real machine,** as a standard user. Launch with `--no-elevate` (or with the startup prompt
   turned off) so no UAC prompt pops up on the user, and screenshot with `winshot.ps1` against real data. This always
   finds bugs the mock hides. Never run destructive admin actions or change system settings unattended.
8. **Adversarial multi-agent review** of anything that deletes, changes disks or system settings, elevates, or races.
   Use reviewers by lens with 2–3 refuting verifiers per finding, fix by file group, then verify each fix for
   regressions.
9. **Measure, then optimize.** Instrument with `perf.rs` and keep a baseline exe. The wins:
   - Don't do heavy work at launch (stale-while-revalidate cache).
   - Replace PowerShell on hot paths with native APIs.
   - Build the window hidden in theme colours and show it right after build.

   Compare builds back to back in the same session.
10. **Ship.** Build the NSIS installer: per-user or per-machine (`references/installer.md`), branded bitmaps, and the
    close-running-app hook. Run a scripted silent install and verify the files, registry and shortcuts, then launch the
    installed exe with `--no-elevate` and screenshot it. Update the README perf table and CONTRACT.md.
11. **Report** in plain language: before/after numbers, what was verified, and an explicit list of what wasn't
    exercised (e.g. admin paths, the UAC accept and decline paths).

## Gotchas that cost real time (check these before you hit them)

- **windres + spaces** in the target path break the build (step 1).
- **A running app locks its exe**, so `cargo build` fails with "failed to remove file". Kill it first (an elevated
  instance can't be killed from an unelevated shell).
- **Synchronous Tauri commands run on the main thread.** Anything blocking (Win32, COM, processes, UAC prompts) must be
  `async` + `spawn_blocking`.
- **Tauri doesn't order events vs. command replies.** Buffer a `done` event that arrives before `start` returns its
  id, and put a generation id on every job.
- **PowerShell costs 0.3–2 s per spawn.** Fine as a prototype or fallback. On hot paths use WMI over raw COM, the
  Event Log API and the Task Scheduler COM API, with a parity test against the old path.
- **WMI over raw COM** needs a fresh MTA thread, `CoSetProxyBlanket(IMPERSONATE)` on the service *and* every
  enumerator, and parsing of uint64 values that arrive as BSTR strings.
- **Every child process** needs `CREATE_NO_WINDOW` + `stdin(null)`. System tools need absolute System32 paths, because
  an elevated app searches its own folder first. `defrag.exe` exits 0 on failure. Console tools write the OEM code
  page.
- **`FSCTL_GET_VOLUME_BITMAP` needs admin** and fails with ERROR_INVALID_FUNCTION, which looks like "not NTFS".
- **Polling drives** needs `SetErrorMode(SEM_FAILCRITICALERRORS|SEM_NOOPENFILEERRORBOX)` and per-drive threads with a
  timeout. A disconnected share blocks for tens of seconds.
- **Elevated deletes must be handle-based and reparse-safe** (NtCreateFile relative to the parent handle, final path
  re-checked, delete via FileDispositionInfoEx). Otherwise a junction swap redirects the delete anywhere. Refuse roots
  that *contain* protected folders, and normalize `..`, 8.3 names and trailing dots.
- **Pick the smallest elevation model that works.** A one-shot elevated helper for one privileged action; a scheduled
  task for unattended privileged work; whole-app relaunch only when most features need admin. Self-elevate at runtime,
  never with a `requireAdministrator` manifest.
- **The elevated instance has its own WebView2 data folder**, so localStorage isn't shared. Keep prefs in a backend
  file and seed them with `initialization_script`.
- **Elevation and integrity levels:** a mutex owned by an elevated instance gives ACCESS_DENIED (which still means
  "running"); UIPI drops messages unless `ChangeWindowMessageFilterEx` allows them; an unelevated per-user installer
  can't kill an elevated app (use the close hook); elevated-as-another-account means %LOCALAPPDATA% is someone else's.
  A routinely elevated app installed per-user runs an exe from a user-writable folder.
- **Startup UAC prompt:** do the single-instance check first, and skip the prompt when already elevated, relaunched,
  `--no-elevate`, the setting is off, UAC is off, or it's a debug build. The child claims the mutex before the parent
  exits.
- **tao window state:** `set_position`/`set_size` clear the maximized flag, so call `maximize()` last. The maximized
  flag lags, so read `IsZoomed`. Save only the normal rect.
- **Benchmark harnesses** must kill the WebView2 children (matched by identifier) and renamed baseline copies, keep
  user settings when clearing caches, and fail if an elevated instance survives.
- **Real-window screenshots** need `SetProcessDPIAware`, DWM frame bounds and `CopyFromScreen`. PrintWindow is black
  for WebView2. Wait for a selector only the rendered app produces in mock screenshots.
- **PowerShell 5.1:** `$null` becomes `""` in `[string]` P/Invoke parameters (use IntPtr or `[NullString]::Value`).
  `Stop` + `2>&1` on native exes fakes failures. Arithmetic in `New-Object` arguments needs parentheses. Out-File writes
  UTF-16.
- **In Git Bash, use `$HOME`, not `$USERPROFILE`, in PATH.** Backslashes get lost on the way through the Bash tool,
  even inside a quoted `<<'EOF'` heredoc or an inline `node` script, and a broken JS regex can still pass
  `node --check`. Anything with a backslash goes through the Write/Edit tools; use raw strings in Rust tests.
- **Before any real-window click, check the user isn't at the PC** (`GetLastInputInfo`, foreground window). A scripted
  click once landed in the user's video player. Headless mock flows are always safe.
- **A destination path that looks like another drive may not be one:** junctions, `subst`, mapped drives,
  `\\localhost\C$`, WSL shares and VHDs. Resolve with `GetFinalPathNameByHandleW` + volume GUIDs and refuse when unsure
  (`references/raw-disks.md`).
- **NSIS `installMode: "both"` elevates the installer**, so a silent install pops UAC. An installed exe never
  hash-matches the built one (the bundler patches it); verify it by length plus a string only the new build contains.
- **`core.autocrlf=true` (the Git for Windows default):** add `.gitattributes` (`* text=auto eol=lf`) before the first commit.
- **After a context compaction, re-read the reference for a step before redoing it.** The summary drops the "how".
- **`patch()`-style render caches won't redraw a reverted control.** Set `.checked` directly. Wrap every region repaint
  in `restoringFocus`.
- **F5 / Ctrl+R reload the whole WebView2 SPA** unless intercepted.
- **A global `submit` handler with `preventDefault` breaks `<dialog>` forms.** Reset `dialog.returnValue` before
  `showModal`.

## Defaults this user expects

- Parallel subagents on multi-part work.
- Errors as one plain sentence that says what to do.
- A verified install on their laptop.
- A README with a measured before/after table.
- Comments that explain measured choices, with numbers and dates.
- Honest "not tested" lists.
- For admin-heavy apps: an admin prompt at startup with an opt-out (checkbox + `--no-elevate`). Ask first when only one
  feature needs admin.
- The Platter and MAX repos were created private (`gh repo create --private` when asked for "git repo and push") and
  later made public after a secrets scan. Ask before making anything public, and commit or push only when asked.
- Scope calls are theirs: they said "build all features" but "leave RAID recovery". Build the full list unless they
  cut something, and record the cut in README and memory.
