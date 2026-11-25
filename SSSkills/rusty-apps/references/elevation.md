# Admin rights, UAC and integrity levels

Templates: `assets/templates/util.rs` (relaunch, startup prompt, handoff, single instance, UIPI messages),
`assets/templates/other_account.rs` (elevated-as-another-account detection), `assets/templates/hooks.nsh`.
Reference (in a Platter clone, e.g. `D:\projects\platter`): `src\util.rs`, `main.rs` (`relaunch_elevated`, `set_ask_admin`, main()).

## Choose the elevation model first (smallest thing that works)

| Situation | Model | Why |
| --- | --- | --- |
| One or a few privileged *actions* in an otherwise read-only app ("set charge limit", "apply setting") | **One-shot elevated helper**: `ShellExecuteExW("runas", self, "--apply-x 80")` as a windowless child (the exe checks the flag in main() before any Tauri/WebView work, does the one thing, exits with a code); the UI stays unelevated and waits on the process handle | No handoff race, no second WebView2 profile, no UIPI filters, no other-account settings problem; one prompt per action |
| Privileged work that must run **unattended** (re-apply at logon, periodic maintenance) | **Scheduled task** with "Run with highest privileges", registered once from an elevated action (Task Scheduler COM, or `schtasks` by absolute path) | No UAC at every boot; a tray/startup app must never prompt at logon |
| **Most features** need admin (Platter: trim/defrag, letters, error checks, system cleanup, bitmap) | **Whole-app relaunch**: "Restart as administrator" on demand, optionally a prompt at every start (below) | Avoids a prompt per click; costs everything in the sections below |

The prompt-at-every-start default is this user's choice for Platter, an admin-heavy tool. Confirm it before using
it for an app where admin is needed for only one feature. If the app relaunches routinely, also reconsider a per-user
install (installer.md).

## Find admin-only APIs early and design the standard-mode state

Admin-only things on Windows that look like they should work: `FSCTL_GET_VOLUME_BITMAP` (needs a GENERIC_READ
volume handle — and fails with **ERROR_INVALID_FUNCTION (1)**, not access denied, so it masquerades as "not NTFS"),
`MSFT_StorageReliabilityCounter` (temperature/wear), defrag/trim, `Set-Partition -NewDriveLetter`, `Repair-Volume`,
Windows Update / system temp cleanup. When a call fails mysteriously, write a throwaway `#[test]` that tries each
access mask and prints `GetLastError`.

UX that worked: don't hide admin features. Show a **ghost** of the real visual (empty grid at ~0.55 opacity) with an
overlay explaining why + a "Restart as administrator" button; lock chips + disabled checkboxes on admin-only rows;
"Unknown"/"can't measure without admin" — never "Empty" or 0. Build callout text from the actual locked items, not
hard-coded examples. The UI decides "this failure needs admin" by testing the backend sentence
(`/administrator/.test(err) && !S.sys.elevated`), so every admin error sentence contains the word "administrator".
"Restart as administrator" first opens a confirm dialog saying Windows will ask for permission.
`relaunch_elevated` returns `false` when UAC is declined, and the UI shows a toast rather than failing silently.
Locked amounts are lower bounds ("at least 3.2 GB").

Every admin-only command checks `is_elevated()` **before** spawning anything and returns the admin sentence. Put the
privileged checks in a `preflight()` function that tests can call unelevated, which proves nothing runs. Platter's
drive-letter preflight runs in Rust before `Set-Partition` and checks:
- the letter is valid and the source exists
- the source isn't the system drive
- the target is in D..Z, free in `GetLogicalDrives` *and* not a network mapping (see UIPI below)
- the process is elevated

Repair-Volume's many RepairStatus strings map to a small fixed set of states with one sentence each. An agent once ran
a real unelevated `Set-Partition` moving D: to Q:; Windows refused it with 42012.

## "Restart as administrator" (on demand)

- `ShellExecuteExW` verb `"runas"`, `SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NOASYNC`, params `--wait-for-pid <our pid>`,
  owner HWND for parenting. `CoInitializeEx(APARTMENTTHREADED | DISABLE_OLE1DDE)` first (shell extensions expect COM).
  Declined = returns FALSE (ERROR_CANCELLED).
- It blocks until answered → `async` command + `spawn_blocking`. Guard with a static `AtomicBool` so only one prompt
  can be open (with the secure desktop off the window stays clickable → double prompts).
- Accepted: mark closing, save window state, `app.exit(0)`. Add " (Administrator)" to the title.
- The elevated copy needs its **own WebView2 user-data folder** (`.data_directory(app_local_data_dir/elevated)`):
  WebView2 can't share one between integrity levels. Consequence: localStorage isn't shared — keep shared prefs in a
  backend file and seed them with `initialization_script`; distrust localStorage entries written by the other level.

## Ask for admin at every start (default) with graceful decline

Don't use a `requireAdministrator` manifest. The reasoning (not measured on Platter): declining means the app never
opens; CreateProcess on such an exe returns ERROR_ELEVATION_REQUIRED (740), which breaks launchers such as an
installer's "Run app"; and dev runs need an elevated terminal. Self-elevate at runtime **before any window or WebView
exists**. The full wiring is in `assets/templates/main.rs`:

```rust
// main(), after perf::init / SetErrorMode
let relaunched = util::wait_for_pid_arg(std::env::args().skip(1)).is_some();
if !util::claim_single_instance(relaunched) && util::defer_to_existing_instance() { return; } // 2nd launch: activate, no prompt
if relaunched {                       // elevated copy: own the mutex NOW (old instance still holds it), tell it,
    util::note_taken_over();          // then wait for it (and its WebView2) to exit before starting ours
    util::wait_for_parent_from_args();
    util::hold_instance_mutex();      // couldn't open the old mutex (other account)? create ours now
}
if util::should_elevate_at_start(relaunched) && util::elevate_at_start() { return; } // accepted: copy took over
tauri::Builder::default()…
```

`should_elevate_at_start` skips when: already elevated (`IsUserAnAdmin`), relaunched (`--wait-for-pid` → no loop),
`--no-elevate` flag (benchmarks), user setting off (cache key `askAdmin`), **UAC disabled** (`HKLM\SOFTWARE\Microsoft\
Windows\CurrentVersion\Policies\System\EnableLUA = 0` — "runas" then silently starts a non-elevated copy), and in
**debug builds** unless `APP_ASK_ADMIN=1`. The expected reason: the parent exits, which ends the `cargo run` /
`tauri dev` session, and the elevated debug copy opens its own console.

Call `util::note_main_window_closing()` in `WindowEvent::CloseRequested` and before `app.exit(0)` in
`relaunch_elevated`. Otherwise a second launch during shutdown gets ACK from a dying window, exits, and nothing ends up
on screen.

### The handoff race (found by adversarial review — get it right first time)

- If the elevated child claims the mutex only *after* the parent exits, the mutex is free during the child's whole
  loader time → a quick re-launch becomes a second instance and shows a second prompt. So: child claims (takeover)
  **first**, sets a named event, then waits for the parent; the parent waits `WaitForMultipleObjects([event,
  child_process], 10 s)` before exiting.
- Create that named event (`Local\<id>.elevating`, manual reset) with a **NULL-DACL** security descriptor
  (`InitializeSecurityDescriptor` + `SetSecurityDescriptorDacl(psd, TRUE, null, FALSE)`) so an elevated copy running
  as another account can open/set it.
- While the prompt is up there's no window: a concurrent second launch must keep waiting while the event exists (reset
  its 10 s deadline) and must never prompt itself (it saw the prompt).
- Over-the-shoulder: a child elevated as a different account gets ACCESS_DENIED opening the standard user's mutex →
  track "holds mutex" and create its own after the parent exits.
- Re-check your own fix for regressions: the claim-before-wait reorder broke the other-account case until patched.

## Elevated as a different account (over-the-shoulder, Windows 11 Administrator protection)

The elevated token may belong to the admin's account → `%LOCALAPPDATA%`, `%TEMP%`, `%USERPROFILE%`, HKCU are the
admin's. Detect: `GetShellWindow` → `GetWindowThreadProcessId` → `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)` →
token `TokenUser` SID vs ours (`EqualSid`). **Fail closed**: if it can't be confirmed while elevated, treat as other
account. Then: refuse/hide per-user settings (return `null` from `system_info` so the UI hides the control; the command
returns "Change this setting in standard mode."), block per-user cleanup items (keep an explicit machine-wide allow-list).

## UIPI and the other integrity level

- Normal launch vs elevated owner: mutex → ACCESS_DENIED (= running). Window messages from lower integrity are dropped
  unless `ChangeWindowMessageFilterEx(hwnd, msg, MSGFLT_ALLOW, null)` for each registered message (activate, close).
- An elevated process has its own DOS-device map: user-mapped network drives are invisible to `GetLogicalDrives`.
  Impersonate the shell's token (`OpenProcessToken(TOKEN_QUERY|TOKEN_DUPLICATE)` + `ImpersonateLoggedOnUser`, revert in
  a Drop guard calling `RevertToSelf`) and probe `QueryDosDeviceW("X:")` (error 122 also = exists), plus saved mappings
  under `HKCU\Network`, before offering "free" drive letters.
- When elevated, spawn system tools by **absolute path** (`%SystemRoot%\System32\…`, or `GetSystemDirectoryW`): the
  app's own folder is searched first → binary planting (powershell.exe, powercfg.exe, taskkill.exe, reg.exe, defrag.exe).
- A per-user (unelevated) installer can't terminate an elevated app → installer close hook (installer.md).
- Benchmark/kill scripts can't kill an elevated instance from an unelevated shell → detect and fail loudly.

## Testing elevation

You can't click a UAC prompt (secure desktop) and must not pop one on the user unattended. Test everything around it:
- a `--no-elevate` launch
- a setting-off launch: back up the cache key, write `false`, launch plainly, assert no `consent.exe` is running,
  then restore it
- a second launch activates the first
- the close message: `FindWindowW(class, IntPtr.Zero)`, declaring the window-name parameter as IntPtr because
  PowerShell turns `$null` into `""`, then `SendMessageTimeoutW(hwnd, RegisterWindowMessageW("<id>.close"), 0, 0, 2,
  5000, out r)`. Expect the ACK value back and the process gone (Platter exited in 86 ms in that test).

Then list exactly what the user must verify (the accept path and the decline path) in the final report. Never run destructive admin
actions (trim, defrag, letter change, real deletion) on the user's machine; say which paths weren't exercised.
