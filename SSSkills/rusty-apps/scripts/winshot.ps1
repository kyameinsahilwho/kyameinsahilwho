# Screenshot (and optionally click/type into) the REAL window of a desktop app — Tauri/WebView2 included.
#   powershell -File winshot.ps1 -Process myapp -Out C:\tmp\shot.png [-Launch -Exe C:\path\myapp.exe [-LaunchArgs "--no-elevate"]] [-Wait 6]
#                                [-Keys "{TAB}"] [-Clicks "120,240;400,90"] [-After 2]
# Clicks are "x,y" offsets from the window's top-left (DWM frame), separated by ";".
# Why it is built this way (all learned the hard way):
#   * SetProcessDPIAware first: at 125 % scaling PowerShell is DPI-virtualized, so window rects and
#     SetCursorPos use different coordinate spaces and clicks land in the wrong place.
#   * DwmGetWindowAttribute(DWMWA_EXTENDED_FRAME_BOUNDS=9) gives the true visible bounds; GetWindowRect
#     includes invisible resize borders. PrintWindow often returns black for WebView2, so CopyFromScreen.
#   * The cursor is parked outside the window before capturing so hover states / taskbar thumbnails don't pollute it.
#   * -Launch passes --no-elevate by default: an app that asks for admin at startup would otherwise pop UAC on
#     the user, and an elevated window drops these synthesized clicks (UIPI) and can't be killed from here.
#     Pass -LaunchArgs "" for apps without that flag.
#   * Only click non-destructive controls. Never click anything that triggers UAC, deletion or disk changes.
param(
  [Parameter(Mandatory)] [string]$Process,
  [Parameter(Mandatory)] [string]$Out,
  [string]$Exe = "",
  [switch]$Launch,
  [string]$LaunchArgs = "--no-elevate",
  [int]$Wait = 6,
  [string]$Keys = "",
  [string]$Clicks = "",
  [int]$After = 2
)
Add-Type -AssemblyName System.Drawing, System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public class WinShot {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int a, out RECT r, int s);
  public struct RECT { public int L, T, R, B; }
}
"@
[WinShot]::SetProcessDPIAware() | Out-Null
if ($Launch) {
  if (-not $Exe) { throw "-Launch needs -Exe" }
  # A running instance locks the exe for the next cargo build and makes single-instance apps just activate it.
  Get-Process $Process -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Milliseconds 800
  if ($LaunchArgs) { Start-Process $Exe -ArgumentList $LaunchArgs } else { Start-Process $Exe }
}
Start-Sleep -Seconds $Wait
$p = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { "no window for process '$Process'"; exit 1 }
$h = $p.MainWindowHandle
[WinShot]::ShowWindow($h, 9) | Out-Null   # SW_RESTORE
[WinShot]::SetForegroundWindow($h) | Out-Null
if ($Keys) { Start-Sleep -Milliseconds 400; [System.Windows.Forms.SendKeys]::SendWait($Keys); Start-Sleep -Seconds 2 }
Start-Sleep -Milliseconds 600
$r = New-Object WinShot+RECT
[WinShot]::DwmGetWindowAttribute($h, 9, [ref]$r, 16) | Out-Null
if ($Clicks) {
  foreach ($c in $Clicks.Split(";")) {
    $xy = $c.Split(",")
    [WinShot]::SetCursorPos($r.L + [int]$xy[0], $r.T + [int]$xy[1]) | Out-Null
    Start-Sleep -Milliseconds 150
    [WinShot]::mouse_event(2, 0, 0, 0, 0); [WinShot]::mouse_event(4, 0, 0, 0, 0)   # left down, up
    Start-Sleep -Seconds $After
  }
}
# Park the cursor outside the window (hover states, taskbar thumbnails) before every capture.
[WinShot]::SetCursorPos($r.R + 40, $r.T + 40) | Out-Null
Start-Sleep -Milliseconds 300
$w = $r.R - $r.L; $ht = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap $w, $ht
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.L, $r.T, 0, 0, $bmp.Size)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
"saved $Out ${w}x${ht} title='$($p.MainWindowTitle)' pid=$($p.Id)"
# If two captures are pixel-identical or black: check for a locked session (LogonUI.exe running),
# stray instances sharing a WebView2 data folder (black content), or a debug build with another window class.
