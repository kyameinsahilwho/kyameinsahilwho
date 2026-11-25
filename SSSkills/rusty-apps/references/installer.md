# Installer (NSIS via the Tauri CLI) and install verification

## Build

`npx -y @tauri-apps/cli@2 build --bundles nsis` (cargo on PATH; works on the GNU toolchain; first run downloads NSIS 3.x
and `nsis_tauri_utils.dll`). It compiles the release exe itself. Output: `<target-dir>\release\bundle\nsis\<Product>_<ver>_x64-setup.exe`
(~2.3 MB for a 7 MB app). The generated script is at `<target-dir>\release\nsis\x64\installer.nsi` — read it to check
hook placement. Bump the version in **both** `tauri.conf.json` and `Cargo.toml`.

```json
"bundle": {
  "active": true, "targets": ["nsis"], "publisher": "…", "copyright": "…",
  "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico", "icons/icon.png"],
  "windows": {
    "webviewInstallMode": { "type": "downloadBootstrapper", "silent": true },
    "allowDowngrades": false,
    "nsis": {
      "installMode": "currentUser",
      "installerHooks": "installer/hooks.nsh",
      "installerIcon": "icons/icon.ico",
      "headerImage": "installer/header.bmp",
      "sidebarImage": "installer/sidebar.bmp",
      "languages": ["English"], "displayLanguageSelector": false, "compression": "lzma"
    }
  }
}
```

(tauri.conf.json is strict JSON: no comments.) `currentUser` = per-user install to `%LOCALAPPDATA%\<Product>`, an HKCU
uninstall entry, and no UAC for the installer. `headerImage` is 150×57 and `sidebarImage` 164×314, both 24-bit BMP.
`downloadBootstrapper` fetches WebView2 if it's missing.

### Per-user vs per-machine

A per-user install puts `<app>.exe` and `WebView2Loader.dll` in a folder any medium-integrity process can write. If
the app **elevates routinely** (prompt at every start), that is an exe and DLL from a user-writable folder running as
admin. The child-tool absolute-path rule doesn't cover the app's own files. Two options:
- `"installMode": "perMachine"`: Program Files, admin-only writes, the installer itself elevates. The close hook still
  applies.
- Keep `currentUser` with on-demand or one-shot elevation only.

Platter and MAX File Recovery shipped per-user with a startup prompt. Say which one you chose, and why, in the final
report.

`"installMode": "both"` (the user chooses on a page) makes the installer itself request elevation up front, so a silent
`/S` install pops UAC. For unattended scripted installs on the user's laptop use `currentUser`.

## Branding bitmaps

Draw them reproducibly with PowerShell System.Drawing in the app's palette (`assets/templates/make-art.ps1`):
`New-Object Drawing.Bitmap(164, 314, [Drawing.Imaging.PixelFormat]::Format24bppRgb)`, `SmoothingMode AntiAlias`,
`TextRenderingHint AntiAliasGridFit`, header on a white band (`Clear(White)`), seeded `Random` for deterministic motifs,
`GraphicsPath.AddArc` for rounded tiles. GDI+ silently substitutes missing fonts — try a list and check `$font.Name -eq $f`.
Inspect by upscaling 3× nearest-neighbour (caught a tagline colliding with the graphic).

## Closing a running (elevated) app — hooks

A per-user installer/uninstaller runs unelevated: Tauri's `CheckIfAppIsRunning` can't terminate an elevated instance →
"failed to kill" abort, locked exe, or a leftover exe after uninstall. Fix (template `assets/templates/hooks.nsh`):

```nsis
!macro APP_CLOSE_RUNNING
  System::Call 'user32::RegisterWindowMessageW(w "com.example.myapp.close") i .r1'
  FindWindow $0 "MyAppMainWindow"
  ; SendMessageTimeoutW(SMTO_ABORTIFHUNG, 5 s), then poll OpenMutexW(SYNCHRONIZE) on Local\com.example.myapp.instance
  ; every 200 ms up to 10 s: handle -> still running; error 5 -> still running (elevated); other error -> gone. Sleep 500.
!macroend
!macro NSIS_HOOK_PREINSTALL
  !insertmacro APP_CLOSE_RUNNING
!macroend
!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro APP_CLOSE_RUNNING
!macroend
```

Verified in the generated `installer.nsi`: the PRE hooks run **before** `CheckIfAppIsRunning` in both sections. The app
side: `.window_classname(...)`, `ChangeWindowMessageFilterEx` for the close message, `PostMessageW(WM_CLOSE)` on receipt
(see tauri-shell.md). Test the app side from PowerShell: `FindWindowW(class, IntPtr.Zero)` (declare the window-name
parameter as IntPtr, since `$null` becomes `""`), then `SendMessageTimeoutW` with the registered message.

## Verify the install by script, then by eye

```powershell
Get-Process myapp -EA SilentlyContinue | Stop-Process -Force -EA SilentlyContinue
if (Get-Process myapp -EA SilentlyContinue) { throw "still running (elevated?) - close it or use an elevated shell" }
$p = Start-Process $setup -ArgumentList "/S" -PassThru -Wait; $p.ExitCode          # 0
Get-ChildItem "$env:LOCALAPPDATA\MyApp"                                            # exe, uninstall.exe, WebView2Loader.dll
(Get-Item "$env:LOCALAPPDATA\MyApp\myapp.exe").VersionInfo | fl ProductVersion, CompanyName, LegalCopyright
Get-ChildItem HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall | % { Get-ItemProperty $_.PSPath } | ? DisplayName -like "MyApp*"
Test-Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\MyApp.lnk"; Test-Path "$env:USERPROFILE\Desktop\MyApp.lnk"
```

**Don't verify the installed exe by hash.** The bundler patches a bundle-type marker into the exe it packages, so
`Get-FileHash` of the installed exe never equals `<target>\release\<app>.exe` (same length, different bytes). Check
the length and a string that only the new build contains instead (the name of a new command):
`Select-String -Path $installedExe -Pattern "new_command_name" -SimpleMatch -Quiet`. Hash-compare the *installer*
in `dist/` against the bundle output instead.

Launch the installed exe **with `--no-elevate`**: read the Start-menu `.lnk` target with
`(New-Object -ComObject WScript.Shell).CreateShortcut($lnk).TargetPath` and `Start-Process` it with the flag. A
plain double-click would pop UAC when the app prompts at startup. Then confirm `(Get-Process myapp).Path` is the
installed location and screenshot it. Tell the
user an unsigned installer triggers SmartScreen on other PCs. "A proper installer" for this user means branded, installed
on their laptop and verified launching — not just built. Copy the final setup.exe to `dist/` (gitignored).
