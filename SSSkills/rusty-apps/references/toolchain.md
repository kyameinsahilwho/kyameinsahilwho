# Toolchain, build and repo hygiene (Windows, no Visual Studio)

## Rust without MSVC

Tauri v2 builds and bundles fine on the **x86_64-pc-windows-gnu** toolchain. No Visual Studio, no admin rights.

```sh
# check first: maybe it's all there already (bash)
which cargo rustc windres gcc node npx   # Strawberry Perl ships windres+gcc in C:\Strawberry\c\bin
"/c/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe" -latest -products '*' -property installationPath 2>/dev/null
# no output / no vswhere.exe = no MSVC -> go GNU

# install (from bash, not PowerShell — see below)
rustup-init.exe -y --default-host x86_64-pc-windows-gnu --default-toolchain stable --profile minimal
# windres if Strawberry Perl isn't installed:
winget install --id BrechtSanders.WinLibs.POSIX.UCRT -e --accept-source-agreements --accept-package-agreements --disable-interactivity
```

- tauri-build (via tauri-winres) needs a MinGW **`windres`** on PATH to compile the icon/manifest resource.
- Each agent shell starts fresh: prefix every cargo call with `export PATH="$HOME/.cargo/bin:$PATH";` (bash — **not**
  `$USERPROFILE`, which is `C:\Users\<u>` in Git Bash and adds two broken PATH entries) and write the toolchain into
  CONTRACT.md/README so subagents never try MSVC.
- **Node** is needed for `npx -y @tauri-apps/cli@2 icon|build` and puppeteer (`winget install OpenJS.NodeJS.LTS`). No-Node
  alternative: `cargo install tauri-cli --version "^2" --locked`, then `cargo tauri icon` / `cargo tauri build --bundles nsis`.
  The first NSIS build downloads NSIS (needs network).
- WebView2 runtime is preinstalled on Windows 11; check its version under `HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}` if in doubt.

### windres + spaces in the path (critical)

MinGW windres passes the build-script `OUT_DIR` to its preprocessor **unquoted**. A target dir whose path
contains a space fails with:

```
cc1.exe: fatal error: projects\platter\target\debug\build\platter/…\out: No such file or directory
windres: preprocessing failed.
… tauri-winres … called `Result::unwrap()` on an `Err` value: Failed("windres failed to compile …")
```

Fix before the first build when the project path has a space — `.cargo/config.toml` (template: `assets/templates/cargo-config.toml`):

```toml
[build]
target-dir = "D:/<app>-target"   # any absolute local path without spaces, e.g. C:/cargo-target/<app>; check the drive exists
```

`CARGO_TARGET_DIR` works too. Scripts then take `-Exe <target-dir>\release\<app>.exe`.

The tauri CLI honors it; the bundle lands in `<target-dir>\release\bundle\nsis\`. Every script that looks
for the exe (benchmarks, screenshot scripts) must read the same location.

## Windows PowerShell 5.1 traps

- `$ErrorActionPreference='Stop'` + `2>&1` on a native exe turns harmless stderr (e.g. rustup's `info:` lines)
  into `NativeCommandError` and exit 1 although it succeeded. Run installers from bash, or drop both.
- `$null` passed to a `[string]` P/Invoke parameter becomes `""` — `FindWindow("Class", $null)` returned 0 (hit in
  session 2). Declare the parameter as `IntPtr` and pass `[IntPtr]::Zero`, or pass `[NullString]::Value`.
- Arithmetic inside a `New-Object` argument list is parsed as array elements:
  `New-Object Drawing.RectangleF(8, 172, $w - 16, 40)` → "op_Subtraction" error. Write `($w - 16)`.
- In 5.1, `>`/`Out-File` write **UTF-16LE** and `Set-Content` writes ANSI; pass `-Encoding utf8` (writes a BOM) whenever
  another tool will read the file. (Some agent hosts preset `$PSDefaultParameterValues` — don't rely on it.)

## Bash / agent-shell traps

- Inline `node -e '…'`, `python - <<EOF`, or `eval` with apostrophes/backticks/backslashes break quoting
  (`unexpected EOF while looking for matching '`). Write the script to a scratch file and run it.
  Rust strings like `r"\\.\C:"` got mangled into `"\\.\C:"` → rustc `unknown character escape: C`.
  For multi-line code edits use the Edit tool, not sed/heredoc substitution.
- **Even a quoted heredoc (`<<'EOF'`) loses backslashes** on the way through the agent's Bash tool, and so do `\\`
  sequences inside inline `node`/`python` replacement strings: `"\\Users"` arrived as `"\Users"`, `b'\\'` as `b'\'`,
  and a JS regex `/\//g` became `///g` (a comment, so `node --check` still passed). This happened four times on MAX.
  Anything with a backslash (Windows paths, Rust escapes, regexes) goes through the **Write/Edit tools**, scratch
  scripts included. In Rust tests prefer raw strings: `r"\Windows\System32"`, `format!(r"{letter}:\")`.
- Backgrounded jobs (`&`) don't inherit an earlier `cd`; use `(cd "$ABS" && cmd) &`.
- Make doc-editing scripts idempotent (`if (!text.includes(marker))`).

## Build loop

- **A running instance locks the exe**: `error: failed to remove file …\target\release\app.exe`. Kill it first:
  `Get-Process app -EA SilentlyContinue | Stop-Process -Force; Start-Sleep -Milliseconds 800` (an elevated instance
  can't be killed from an unelevated shell). Before benchmark/screenshot loops, copy the exe out of `target\release`
  (to `bench\` or %TEMP%) and run the copy so a running instance never blocks the next build.
- Start a background warm-up build (`cargo build --tests`) as soon as the scaffold exists — a fresh or moved checkout
  rebuilds all deps (~4 min debug; fat-LTO release ~8 min cold, ~3 min for the final crate). Several projects can share
  one space-free target dir (`CARGO_TARGET_DIR`) to reuse compiled deps.
- Long builds go in the background (`run_in_background`): foreground commands time out at ~10 min.
  Filter output at the end: `cargo build 2>&1 | grep -E "^(warning|error)|-->|test result|FAILED"`.
- Parallel agents sharing one target dir: give them **debug** builds only, reserve `--release` for the
  orchestrator; if the build breaks in a file they don't own, wait ~60 s and retry. Cargo's lock queues them.
- Moving a project: copy sources, **not** `target/` (9 GB, fingerprints are path-based so it rebuilds anyway).
  `robocopy $src $dst /E /XD "$src\target" /R:1 /W:1 /NFL /NDL /NJH /NP` (exit code 1 = success), hash-verify,
  and copy the agent memory folder keyed by project path (`~/.claude/projects/<mangled-path>/memory`).
  You can't delete a folder the agent shell is using as its cwd.

## Release profile (measured, not guessed)

```toml
[profile.release]
# Measured (2026-11-23): fat LTO + 1 codegen unit makes the exe 7.11 MB instead of 8.95 MB (thin, 4 units) with the
# same startup (first paint 514 vs 515 ms, median of 7 interleaved launches); a cold release build takes 7m51s vs 5m41s.
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "unwind"
strip = true
```

While iterating on release builds use `lto = "thin"`, `codegen-units = 4`; switch to fat/1 for the shipped build.

WebView2 init dominates startup, so profile tuning only buys size. WebView2 browser args
(`--disable-background-networking`, `--disable-gpu`…) gave no measurable gain. Leave a comment with the
numbers and the date next to any measured choice.

## Crates

- `windows-sys` 0.59 over the `windows` crate: plain C signatures with raw pointers, predictable without IDE
  help. Enable only the features you use. Platter's list: `Win32_Foundation, Win32_Globalization,
  Win32_Storage_FileSystem, Win32_System_IO, Win32_System_Ioctl, Win32_UI_Shell, Win32_UI_WindowsAndMessaging,
  Win32_Security, Win32_System_Threading, Win32_System_Com, Win32_System_EventLog, Win32_System_Registry,
  Win32_System_SystemInformation, Wdk_Foundation, Wdk_Storage_FileSystem` (Wdk_* for NtCreateFile etc.).
- `serde_json` with `features = ["preserve_order"]` if the UI ever compares cached JSON with fresh JSON
  (otherwise `Value` re-sorts keys and every comparison fails → needless redraws).
- `rayon` for parallel filesystem work. `tauri-plugin-dialog` for folder pickers. That's all Platter needed.

## Git / GitHub

- Before the first commit: grep for secrets, keep rebuildable binaries out (`/target/`, `/dist/`,
  `/bench/*.exe`, `/gen/schemas/`, downloaded test data such as `/testdata/downloads/` — tests must skip with a
  message when it's absent).
- With `core.autocrlf=true` (the Git for Windows default), `git add` warns "LF will be replaced by CRLF" on every file and a fresh
  checkout rewrites them all. Add a `.gitattributes` before the first commit and renormalize:
  `* text=auto eol=lf`, `*.ps1 text eol=crlf`, `*.nsh text eol=crlf`, and `binary` for png/ico/icns/bmp/woff2; then
  `git add --renormalize .`.
- New repo (Platter's was created private and later made public after a secrets scan; ask before making anything public):
  `gh repo create <name> --private --source . --remote origin --push --description "…"`.
- Commit/push only when asked.
