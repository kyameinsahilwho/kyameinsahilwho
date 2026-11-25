# Tauri v2 app shell: config, startup, window, IPC, single instance

Start from `assets/templates/main.rs`, which holds all of this file's startup, theme, window-state and command wiring,
plus `util.rs`, `perf.rs`, `cache.rs` and `other_account.rs`. Together they compile as a bare Tauri app. The full app
is `src\main.rs` / `util.rs` in a Platter clone (e.g. `D:\projects\platter`). Get a window's HWND with
`window.hwnd()?.0 as usize`.

## Minimal static-frontend project (no npm, no bundler)

```
Cargo.toml   build.rs (tauri_build::build())   tauri.conf.json   capabilities/default.json
src/main.rs + one module per feature           ui/index.html, styles.css, app.js, icons.js, mock.js, fonts/
icons/ (npx -y @tauri-apps/cli@2 icon source.png -o icons; delete android/ ios/)
```

```toml
[features]
default = ["custom-protocol"]          # embeds ui/ into the exe
custom-protocol = ["tauri/custom-protocol"]
```

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]  // release = GUI, debug keeps a console
```

tauri.conf.json essentials: `build.frontendDist: "ui"`, `app.withGlobalTauri: true` (vanilla JS uses
`window.__TAURI__.core.invoke` / `.event.listen`), `bundle.active: false` while developing, the main window
declared with `"create": false, "visible": false, "backgroundColor": "#…"`, and sensible `minWidth/minHeight`.
`capabilities/default.json` scoped to `windows: ["main"]` with only the permissions used (`core:default`,
`dialog:default`). A placeholder `ui/index.html` must exist before the first build.

## IPC conventions (put them in CONTRACT.md)

- JS passes camelCase arg keys; Tauri maps them to snake_case Rust params. All structs
  `#[serde(rename_all = "camelCase")]`. Sizes are `u64` bytes.
- Return `Result<T, String>` where the error is **one plain sentence that says what to do**
  ("Windows denied access. Restart Platter as administrator and try again."). Never raw stderr/debug output.
- Each module owns its `#[tauri::command]`s; main.rs only lists them in `generate_handler!` — so parallel
  agents never edit main.rs.
- Anything that blocks (Win32, COM, child processes, filesystem walks) is `async fn` + `tauri::async_runtime::spawn_blocking`.
  A *sync* command runs on the main thread and freezes the UI (a UAC prompt in a sync command froze the window).
  ```rust
  async fn blocking<T: Send + 'static>(f: impl FnOnce() -> Result<T, String> + Send + 'static) -> Result<T, String> {
      tauri::async_runtime::spawn_blocking(f).await.map_err(|_| "The operation stopped unexpectedly.".to_string())?
  }
  ```
- Long jobs return immediately and stream `app.emit("x-progress", …)` / `app.emit("x-done", …)` (`use tauri::Emitter`).
  Guard with a static `Mutex<Option<Running>>`; recover poisoned locks with `.lock().unwrap_or_else(|e| e.into_inner())`.
- New args must be `Option<T>` so old callers keep working; contract changes are additive.
- Cap client-controlled sizes (`depth.min(4)`), normalize input (`"c:"` → `C:\`, strip quotes).

### Generation-guarded jobs (scans, measures)

`start` takes `GEN.fetch_add(1)+1` **inside the same lock** that records the running job, sets the previous
job's cancel `AtomicBool`, returns the id. Every event carries the id; only the newest generation may publish
results/emit done (checked under the result lock); query commands take an optional id and refuse stale ones.
Throttle progress with a ~120 ms ticker thread reading atomics; update "current path" strings with `try_lock`
every ~64 dirs so workers never block. **Tauri doesn't order events vs. command replies**: the UI must buffer a
`done` event that arrives before `start` returned its id (tiny folders finish first).

## No-flash, fast-feeling startup (order matters)

1. `main()`: `perf::init()`, `SetErrorMode` (if you poll drives), single-instance check (and startup elevation)
   — all **before** `tauri::Builder`, so a second launch exits before any WebView2 work.
2. In `.setup()`, build the window from config so runtime choices are possible:
   ```rust
   let cfg = app.config().app.windows.iter().find(|w| w.label == "main").cloned().ok_or("no main window")?;
   let mut b = tauri::WebviewWindowBuilder::from_config(app.handle(), &cfg)?
       .title(if elevated { "MyApp (Administrator)" } else { "MyApp" })
       .visible(false)
       .window_classname(MAIN_WINDOW_CLASS)          // so other processes / the installer can FindWindowW it
       .background_color(if dark { BG_DARK } else { BG_LIGHT })   // native + WebView background
       .theme(window_theme(&pref))                   // title bar: Some(Dark|Light) or None = follow Windows
       .on_page_load(|_, p| match p.event() { PageLoadEvent::Started => perf::mark("rust:page-load-started"),
                                              PageLoadEvent::Finished => perf::mark("rust:page-load-finished") });
   if let Some(p) = &saved_pref { b = b.initialization_script(theme_seed_script(p)); }
   if elevated { b = b.data_directory(app.path().app_local_data_dir()?.join("elevated")); }
   let w = b.build()?;
   restore_window_state(&w);                                  // while hidden
   if let Ok(h) = w.hwnd() { util::install_activation_handler(h.0 as usize); } // single instance + installer close
   show_main(app.handle(), "rust:window-shown");              // show right after build, not after first paint
   ```
3. `ui/index.html` `<head>` inline script applies the saved theme before CSS paints:
   `try{const t=localStorage.getItem("app.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}`
4. UI calls `app_ready` after a double `requestAnimationFrame` (or immediately if `document.visibilityState==="hidden"`,
   else also after a 400 ms timeout). `app_ready` shows the window if it isn't shown yet (an idempotent
   `AtomicBool`, as a safety net, since setup already showed it) and starts deferred background work (watchers,
   pollers) through a run-once gate. If JS never calls (a script error), a ~1.5 s Rust fallback thread starts that
   deferred work.
5. Show, don't force to front: `w.show()` only. Windows activates it when the launch may take the foreground and
   flashes the taskbar otherwise. `set_focus` on a delayed show makes tao inject an Alt keypress and can steal focus.

Measured: ~330 ms of a ~450 ms launch is `WebviewWindowBuilder::build` (WebView2 environment). Showing the themed
window right after build put it on screen ~110 ms sooner than showing it after first paint, with no white flash. That
was a deliberate trade-off: Tauri's default visible window shows an *empty white* frame at ~141 ms, while hidden +
show-after-build puts the first pixels on screen at ~345–470 ms, already in theme colours. The real wins come from
not doing heavy work at launch (see the cache section).

### Theme

Keep the theme preference in a **backend file** (cache key `theme`), not only localStorage: an elevated instance
has its own WebView2 profile, hence an empty localStorage. Seed both keys the UI reads via `initialization_script`
so the page doesn't push a stale default back. "System" = read `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize\AppsUseLightTheme`.
Apply changes live with `w.set_theme()` + `w.set_background_color()`.

## Window state persistence (tao gotchas)

- `set_position`/`set_size` clear tao's maximized flag → call `maximize()` **last**, while hidden.
- tao's maximized flag lags (updated on WM_SIZE, after the Moved event) → read `IsZoomed`/`IsIconic` on the HWND.
- Save only the **normal** rect: skip while minimized, keep the old rect while maximized.
- Debounce writes ~500 ms on a dedicated thread (`while rx.recv_timeout(500ms).is_ok() {}` then save); also save
  synchronously on `CloseRequested` and before `app.exit()`.
- Restore only if the title-bar midpoint `(x + w/2, y + 24)` is on a monitor connected *now*; clamp to its work area;
  keep `maximized` even if the rect is dropped. A 1320×860 default is taller than a 1080p@125 % work area → fit it.
  Store outer position + inner size in physical pixels. Unit-test the rect validation (monitor gone, junk size).

## Single instance without a plugin

(Full code: `assets/templates/util.rs` — `claim_single_instance`, `defer_to_existing_instance`, `activate_window`,
`install_activation_handler`.)

- `CreateMutexW(null, 0, r"Local\<id>.instance")` before Tauri starts. Use **different names for debug and release**
  (`cfg!(debug_assertions)`) so a dev build never collides with the installed app — same for the window class.
- An elevated owner's mutex has an admin-only DACL: a normal launch gets a **null handle + ERROR_ACCESS_DENIED**
  instead of ERROR_ALREADY_EXISTS. Both mean "already running".
- Second launch: `FindWindowW(MAIN_WINDOW_CLASS)`, `AllowSetForegroundWindow(target_pid)` (you hold the foreground
  right — pass it on), `SendMessageTimeoutW(hwnd, RegisterWindowMessageW("<id>.activate"), …, SMTO_ABORTIFHUNG, 3000)`.
  The target answers a magic ACK, or a CLOSING value while it shuts down (then wait for its mutex). Poll ≤10 s for a
  window that answers or a free mutex; if neither, start anyway — nothing on screen is worse than two windows.
- In the running app: `SetWindowSubclass` on the main HWND (from the window's thread, i.e. in setup), restore with
  `SW_RESTORE` if iconic, `SetForegroundWindow`. If it can run elevated, `ChangeWindowMessageFilterEx(hwnd, msg,
  MSGFLT_ALLOW, null)` for every registered message or UIPI silently drops them.
- A registered **close** message (`PostMessageW(hwnd, WM_CLOSE)` on receipt) lets an unelevated installer close an
  elevated app. WM_CLOSE goes through tao's CloseRequested to a normal shutdown with state saved (86 ms to exit when
  tested with SendMessageTimeout from PowerShell).
- Call `util::note_main_window_closing()` on CloseRequested and before any `app.exit()`. A second launch then gets
  "closing" and waits, instead of being "activated" by a dying window.

## Tray, autostart, close-to-tray (not in Platter; read before building a background utility)

Monitors (battery, sensors) usually live in the tray and start at logon. Use Tauri's `tray-icon` feature +
`TrayIconBuilder`. For autostart, use `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`, or a logon scheduled task
(with highest privileges if it must be elevated; never a UAC prompt at boot). If you prevent CloseRequested to hide to
the tray, the installer close message must call `app.exit(0)` directly instead of posting WM_CLOSE. Otherwise
hooks.nsh waits 10 s, the exe stays locked, and the install fails. Pass a `--hidden`/`--tray` flag from autostart so
the window isn't shown at logon.

## Stale-while-revalidate cache = the biggest launch win

Template: `assets/templates/cache.rs`. `%LOCALAPPDATA%\<identifier>\cache\<key>.json` = `{savedAt, version, data}`.

- Validate keys (`[A-Za-z0-9_-]{1,48}`) so they can't be paths. Write atomically: `{key}.{pid}.{seq}.tmp` then
  rename (standard and elevated instances may write at once); remove the temp on failure. Drop wrong-version entries.
- One `cache_get_many(keys)` IPC serves the first paint, in parallel with cheap live calls. Writers update after each
  successful fresh result. **Delete the entry before a destructive operation** so freed space is never shown as current.
- Expensive measurements never run at launch: paint cached ("Measured 3 h ago"), re-measure in the background only when
  stale (Platter: 12 h, at idle, 2 low-priority threads), full speed when the user asks.
- Measured on Platter: CPU in first 15 s 20.7 s → 1.9 s; clean-up sizes 9.8 s → 0.48 s; memory 477 → 398 MB.

## Perf instrumentation (build before optimizing)

Template: `assets/templates/perf.rs`. Off unless `APP_PERF=<logfile>`; lines `"<ms since main>\t<mark>"`; a negative
first line `rust:process-created` from `GetProcessTimes` vs `GetSystemTimePreciseAsFileTime` shows loader time.
`perf_mark(name)` command lets JS (`js:script-start`, `js:fonts-ready`, `js:first-render`, `js:first-paint` via double
rAF, data-loaded marks) share the clock; the JS wrapper swallows all errors. Mark the first IPC by wrapping the handler:

```rust
fn with_first_ipc_mark<F>(h: F) -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync + 'static
where F: Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync + 'static {
    static FIRST: AtomicBool = AtomicBool::new(false);
    move |inv| { perf::mark_once(&FIRST, "rust:first-ipc"); h(inv) }
}
// .invoke_handler(with_first_ipc_mark(tauri::generate_handler![...]))
```

Benchmark with `scripts/launch-bench.ps1` (see testing.md for the methodology).

## Device / drive change detection

Poll on a named thread every 2 s, started after `app_ready`: `GetLogicalDrives` mask **plus** a per-drive media
signature for removable/optical drives (the letter mask doesn't change when a card is inserted). Emit one event
(`drives-changed`) on change.
