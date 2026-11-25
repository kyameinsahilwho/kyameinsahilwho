# Launch benchmark for a Tauri/WebView2 app (generalized from Platter bench/launch.ps1).
#   powershell -File launch-bench.ps1 -Exe D:\app-target\release\myapp.exe -Identifier com.example.myapp [-AppName myapp]
#              [-Runs 5] [-Window 15] [-PerfVar APP_PERF] [-NoCache] [-CacheDir path] [-KeepCache "window.json,theme.json,askAdmin.json"]
#              [-LaunchArgs "--no-elevate"] [-Out results.json]
# Each run: kill the app AND its WebView2 processes, check nothing survived, optionally clear the data
# cache, launch with the timeline env var set, watch a FIXED window, then report the timeline marks plus
# CPU and working set summed over the whole process tree (app + msedgewebview2.exe). Prints medians.
#
# Hard-won rules baked in:
#  * msedgewebview2.exe outlives a killed parent and gets reused -> match it by the app identifier in its
#    CommandLine (its user-data folder), or the "tree" looks like 1 process / 38 MB.
#  * Kill by the exe's OWN name too: a renamed baseline copy (app-baseline.exe) isn't "myapp". Five stray
#    copies once skewed every number and turned the window black (shared WebView2 data folder).
#  * An elevated instance can't be killed from an unelevated shell and a new launch would just activate it:
#    fail loudly. Launch with a no-elevate flag if the app prompts for admin at startup.
#  * Don't wait for a mark an optimization might remove; watch a fixed window instead.
#  * Compare builds back to back in the SAME session (keep the old exe as bench\app-baseline.exe);
#    machine speed drifts 2-3x within a day. Run warm and -NoCache separately.
param(
  [Parameter(Mandatory)] [string]$Exe,
  [Parameter(Mandatory)] [string]$Identifier,
  [string]$AppName = "",
  [int]$Runs = 5, [int]$Window = 15, [string]$PerfVar = "APP_PERF",
  [switch]$NoCache, [string]$CacheDir = "", [string[]]$KeepCache = @("window.json", "theme.json", "askAdmin.json"),
  [string]$LaunchArgs = "--no-elevate", [string]$Out = ""
)
$ErrorActionPreference = "Stop"
if (-not $CacheDir) { $CacheDir = Join-Path $env:LOCALAPPDATA "$Identifier\cache" }
$name = [IO.Path]::GetFileNameWithoutExtension($Exe)
if (-not $AppName) { $AppName = $name }   # canonical process name; differs from $name for a renamed baseline copy
# powershell -File passes "a,b" as ONE string: split it. User settings kept in the cache dir (askAdmin) must survive -NoCache.
$KeepCache = @($KeepCache | ForEach-Object { $_ -split "," } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

function Get-Tree([int]$rootPid) {
  $all = Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId, Name, WorkingSetSize, CommandLine, KernelModeTime, UserModeTime
  $ids = @($rootPid); $frontier = @($rootPid)
  while ($frontier.Count) {
    $kids = @($all | Where-Object { $frontier -contains $_.ParentProcessId } | ForEach-Object { [int]$_.ProcessId })
    $ids += $kids; $frontier = $kids
  }
  $all | Where-Object { ($ids -contains $_.ProcessId) -or ($_.Name -eq "msedgewebview2.exe" -and $_.CommandLine -match [regex]::Escape($Identifier)) }
}
function Stop-App {
  Get-Process $AppName, $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -match [regex]::Escape($Identifier) } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Milliseconds 300
  if (Get-Process $AppName, $name -ErrorAction SilentlyContinue) {
    throw "$AppName/$name is still running (probably elevated). Close it, or run this script from an elevated PowerShell."
  }
}

$results = @()
for ($i = 1; $i -le $Runs; $i++) {
  Stop-App
  Start-Sleep -Milliseconds 2000
  if ($NoCache -and (Test-Path $CacheDir)) {
    Get-ChildItem $CacheDir -Filter *.json | Where-Object { $_.Name -notin $KeepCache } | Remove-Item -Force
  }
  $log = Join-Path $env:TEMP "$name-perf-$i.log"
  Remove-Item $log -ErrorAction SilentlyContinue
  Set-Item -Path "Env:$PerfVar" -Value $log
  $p = if ($LaunchArgs) { Start-Process $Exe -ArgumentList $LaunchArgs -PassThru } else { Start-Process $Exe -PassThru }
  Start-Sleep -Seconds $Window
  $tree = @(Get-Tree $p.Id)
  $wsMB = [math]::Round((($tree | Measure-Object WorkingSetSize -Sum).Sum) / 1MB, 1)
  $cpuMs = [math]::Round((($tree | ForEach-Object { [double]$_.KernelModeTime + [double]$_.UserModeTime } | Measure-Object -Sum).Sum) / 10000) # 100 ns units
  $p.Refresh()
  $appCpu = [math]::Round($p.TotalProcessorTime.TotalMilliseconds)
  $marks = [ordered]@{}
  if (Test-Path $log) { Get-Content $log | ForEach-Object { $t, $n = $_ -split "`t"; if ($n -and -not $marks.Contains($n)) { $marks[$n] = [double]$t } } }
  $row = [ordered]@{ run = $i; workingSetMB = $wsMB; processes = $tree.Count; treeCpuMs = $cpuMs; appCpuMs = $appCpu }
  foreach ($k in $marks.Keys) { $row[$k] = $marks[$k] }
  $results += [pscustomobject]$row
  Write-Host ("run {0}: first-paint {1} | tree cpu {2} ms (app {3}) | {4} MB / {5} procs | {6} marks" -f $i, $marks["js:first-paint"], $cpuMs, $appCpu, $wsMB, $tree.Count, $marks.Count)
}
Stop-App
Remove-Item "Env:$PerfVar" -ErrorAction SilentlyContinue
$keys = @($results | ForEach-Object { $_.PSObject.Properties.Name } | Where-Object { $_ -ne "run" } | Select-Object -Unique)
Write-Host "`nmedian over $Runs runs (window $Window s, $(if ($NoCache) { 'empty cache' } else { 'cache as-is' })):"
$summary = [ordered]@{}
foreach ($k in $keys) {
  $vals = @($results | ForEach-Object { $_.$k } | Where-Object { $_ -ne $null } | Sort-Object)
  if ($vals.Count) { $m = $vals[[math]::Floor($vals.Count / 2)]; $summary[$k] = $m; Write-Host ("  {0,-28} {1}" -f $k, $m) }
}
if ($Out) { @{ runs = $results; median = $summary; noCache = [bool]$NoCache; window = $Window } | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 $Out }
