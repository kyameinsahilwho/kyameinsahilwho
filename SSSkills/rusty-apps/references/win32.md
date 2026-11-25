# Win32 from Rust (windows-sys 0.59): recipes and traps

Reference code (in a Platter clone, e.g. `D:\projects\platter`): `src\` — `volumes.rs` (drives, IOCTLs, bitmap), `disks.rs` (raw-COM WMI,
PowerShell fallback), `optimize.rs` (defrag child process, Ctrl+C cancel, Event Log API, Task Scheduler COM,
OEM decoding, ISO times), `manage.rs` (labels, letters, Explorer, recycle, network letters), `util.rs`.

## FFI basics

- `HANDLE`/`HWND` are raw pointers in 0.59: check `.is_null()`; pass an HWND across threads as `usize`.
- Shared helpers: `wide(s)` = `OsStr::new(s).encode_wide().chain(once(0)).collect()`; `from_wide(buf)` stops at NUL.
- Define missing constants yourself (`IOCTL_STORAGE_QUERY_PROPERTY = 0x002D1400`, `FSCTL_GET_VOLUME_BITMAP = 0x0009006F`,
  `ERROR_MORE_DATA = 234`). For a stray function behind an awkward feature gate, declare it:
  `#[link(name = "ole32")] extern "system" { fn CoInitializeEx(r: *const c_void, c: u32) -> i32; fn CoUninitialize(); }`
  (also VariantClear/oleaut32, CoTaskMemFree/ole32, WNetGetConnectionW/mpr, SetErrorMode, AttachConsole…).
- Read `GetLastError()` immediately after the failing call — before any allocation (e.g. `from_wide`).
- Device paths as raw strings: `r"\\.\C:"`. A bare `C:` means "current dir on C:", so append `\` (also for Explorer
  and CreateFileW); `\\server\share` needs a trailing `\`; long paths get `\\?\` / `\\?\UNC\`; directories need
  `FILE_FLAG_BACKUP_SEMANTICS`.

## Drives and volumes

- `SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOOPENFILEERRORBOX)` OR-ed with the previous mode, first thing in main,
  in any app that touches removable/optical drives — or Windows pops "There is no disk in the drive".
- Never let one drive block enumeration: `GetDriveTypeW` inline (doesn't touch the device), everything else per drive
  on its own named thread, collected with `mpsc::recv_timeout` against one overall deadline (~1.5 s). An atomic busy
  bitmask per letter stops a hung drive from piling up threads; reuse a late result ≤120 s. Skip remembered-but-
  disconnected shares first via `WNetGetConnectionW` → ERROR_CONNECTION_UNAVAIL (1201), without triggering a reconnect.
- `GetVolumeInformationW` failures → states, not one "ready" bool: 21/1112 no media; 1005/1785 or FS "RAW" unformatted;
  `0x8031xxxx` (FVE_E_*) or ACCESS_DENIED on fixed/removable = BitLocker-locked. Flags: 0x00080000 read-only,
  0x10 compression supported.
- SSD/HDD, model, bus **without admin**: open `\\.\X:` with `FILE_READ_ATTRIBUTES|SYNCHRONIZE`, `IOCTL_STORAGE_QUERY_PROPERTY`:
  PropertyId 7 (seek penalty) byte@8 nonzero = HDD; PropertyId 0 descriptor: vendor/product offsets @12/@16, BusType @28
  (17 NVMe, 11 SATA, 7 USB). Products often include the vendor — don't prefix twice.
- Cluster bitmap: `FSCTL_GET_VOLUME_BITMAP` on a GENERIC_READ handle (admin), read in 4 MB chunks (32M clusters each),
  ERROR_MORE_DATA → continue at next LCN; fold into display cells with u128 math, popcount whole bytes.
- MBR disks list the extended container (types 0x05/0x0F/0x85) **and** its logical partitions — don't sum both; compute
  disk size minus the union of partition byte ranges and treat a *total* unallocated < 16 MB as 0 (alignment slack).
  Temperature 0 °C = "not reported". MSFT_StorageReliabilityCounter only when elevated; otherwise return
  `reliabilityAvailable: false` so the UI says "needs admin" instead of 0 °C. Turn bus/media/health/partition-style codes
  into words in Rust. GPT type GUIDs: `c12a7328-f81f-11d2-ba4b-00a0c93ec93b` EFI system, `e3c9e316-0b5c-4db8-817d-f92df00215ae`
  Microsoft reserved, `de94bba4-06d1-4d40-a16a-bfd50179d6ac` Recovery, `ebd0a0a2-b9e5-4433-87c0-68b6b72699c7` Basic data.
- Labels: ≤32 chars; invalid `* ? / \ | , ; : + = < > [ ] "` + control chars; error 19 write-protected, 21 not ready.
- `explorer.exe` exits 1 even on success — spawn, don't check; use `raw_arg` for `/select,"path"`.

## COM / WMI without the windows crate

PowerShell spawn = 0.3–2.3 s each. In-process WMI through raw vtables: disk info 1,357 → 557 ms.

```rust
pub unsafe fn method<F: Copy>(obj: *mut c_void, idx: usize) -> F {
    let vtbl = *(obj as *const *const *const c_void);
    std::mem::transmute_copy(&*vtbl.add(idx))
}
pub fn in_mta<R>(f: impl FnOnce() -> R) -> R {
    let hr = unsafe { CoInitializeEx(std::ptr::null(), 0 /* COINIT_MULTITHREADED */) };
    let r = f();
    if hr >= 0 { unsafe { CoUninitialize() }; }   // only if init succeeded
    r
}
pub fn on_mta_thread<R: Send + 'static>(f: impl FnOnce() -> R + Send + 'static) -> Option<R> {
    std::thread::Builder::new().spawn(move || in_mta(f)).ok()?.join().ok()   // fresh thread: own apartment
}
```

- RAII `Unk` that calls `Release` (slot 2) on drop. Slots: `IWbemLocator::ConnectServer=3`, `IWbemServices::ExecQuery=20`,
  `IEnumWbemClassObject::Next=4`, `IWbemClassObject::Get=4`. CLSID_WbemLocator `4590f811-1d3a-11d0-891f-00aa004b2e24`,
  IID_IWbemLocator `dc12a687-737f-11cf-884d-00aa004b2e24`.
- Always on a **fresh thread you created** with `CoInitializeEx(COINIT_MULTITHREADED)` — never a pooled tokio/rayon
  thread whose apartment another module set.
- `CoSetProxyBlanket(p, RPC_C_AUTHN_WINNT=10, RPC_C_AUTHZ_NONE=0, null, RPC_C_AUTHN_LEVEL_CALL=3, RPC_C_IMP_LEVEL_IMPERSONATE=3, null, 0)`
  on the IWbemServices proxy **and every enumerator** — WMI refuses the default "identify" level.
- `WBEM_FLAG_FORWARD_ONLY|WBEM_FLAG_RETURN_IMMEDIATELY`, `Next` in batches of 32; `WBEM_S_FALSE (1)` = end, not error.
- VARIANT: 24 bytes on x64 (`vt: u16, _r: [u16;3], data: [u64;2]`). uint64/sint64 arrive as **VT_BSTR strings**; arrays as
  SAFEARRAY; BSTR length is the u32 before the pointer; `VariantClear` every out-variant. `__RELPATH` (needed for
  `ASSOCIATORS OF {…} WHERE ResultClass = MSFT_StorageReliabilityCounter`) is empty unless the key (ObjectId) is selected.
- Independent provider queries (MSFT_Disk / MSFT_PhysicalDisk / MSFT_Partition in `ROOT\Microsoft\Windows\Storage`) run in
  parallel in `std::thread::scope`, each on its own MTA thread + connection; only the main query's failure is fatal.
- Fallback to PowerShell only for in-process failures. If the HRESULT says the service is unreachable (`0x8007` + 1053,
  1058, 1060, 1062, 1722; WBEM_E_INVALID_NAMESPACE 0x8004100E, INVALID_CLASS 0x80041010, PROVIDER_NOT_FOUND 0x80041011,
  PROVIDER_LOAD_FAILURE 0x80041013, INITIALIZATION_FAILURE 0x80041014, SHUTTING_DOWN 0x80041033;
  SCHED_E_SERVICE_NOT_RUNNING 0x80041315) report it — the fallback hits the same service.
- Keep the old PowerShell path and a test asserting native JSON == PowerShell JSON (prints both timings).

### Task Scheduler 2.0 COM (~50 ms vs ~2 s for Get-ScheduledTask)

`CLSID_TaskScheduler = 0f87369f-a4e5-4cfc-bd3e-73e6154572dd`, `IID_ITaskService = 2faba4c7-4da9-4013-9697-20cc3fd40f85`
(`CoCreateInstance(…, CLSCTX_INPROC_SERVER, …)` on a fresh MTA thread, as for WMI). `ITaskService::Connect` takes four
VARIANTs **by value** → pass a 24-byte zeroed `#[repr(C)] #[derive(Clone, Copy)] struct EmptyVariant([u64;3])`:
`type Connect = unsafe extern "system" fn(*mut c_void, EmptyVariant, EmptyVariant, EmptyVariant, EmptyVariant) -> HRESULT;`
IDispatch occupies slots 3–6, so methods start at 7: ITaskService GetFolder 7, Connect 10; ITaskFolder GetTask 13;
IRegisteredTask get_State 9, get_Enabled 10, get_LastRunTime 15, get_NextRunTime 18. Times are OLE DATE f64 in local
time; < year 2000 = never.

### Event Log API (530 ms vs 1,594 ms for Get-WinEvent)

`EvtQuery(0, "Application", "*[System[Provider[@Name='Microsoft-Windows-Defrag']]]", EvtQueryChannelPath|EvtQueryReverseDirection)`
→ `EvtNext` batches → `EvtRender(ctx, evt, EvtRenderEventValues, …)` with `EvtCreateRenderContext(0, null,
EvtRenderContextSystem)`, retrying on ERROR_INSUFFICIENT_BUFFER with the returned size → `EvtFormatMessage`.
Each EVT_VARIANT is 16 bytes: 8 value bytes, `Count: u32`, `Type: u32` (`ty = (meta >> 32) & 0x7f`). Check the type
before reading: EventID (index 2) is UInt16 (6), Level (4) is Byte (4), TimeCreated (8) is FileTime (17), Null (0) =
absent. Open publisher metadata on a parallel scoped thread (~15 ms); if the message table can't load, return events
with empty messages instead of failing. 15029/15030 (unresolved inserts) = success. A Get-WinEvent fallback throws when
nothing matches — catch `NoMatchingEventsFound` and return `[]`. Defrag: event 258 success, 264 failure; successes may be
Level 0 — never infer success from Level.

Format native timestamps exactly like the old .NET path (`DateTime.ToString("o")`, 7-digit fraction, `+hh:mm`) via
`GetDynamicTimeZoneInformation` + `SystemTimeToTzSpecificLocalTimeEx` (and `TzSpecificLocalTimeToSystemTimeEx` for
local→UTC, e.g. Task Scheduler's local OLE dates) so the UI and parity tests don't change. SYSTEMTIME keeps only
milliseconds: add the sub-millisecond 100 ns ticks back from the FILETIME or the 7-digit fraction won't match.

## Child processes from a GUI app

- Always `.stdin(Stdio::null()).creation_flags(CREATE_NO_WINDOW /*0x0800_0000*/)` — else consoles flash and prompts hang.
- Absolute paths to system tools (see elevation.md).
- PowerShell (prototype/fallback only): `%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe -NoProfile
  -NonInteractive -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue';[Console]::OutputEncoding=
  [Text.Encoding]::UTF8;<script>"`. Emit `ConvertTo-Json -Compress -Depth 6 -InputObject @(…)` (the `@()` keeps one
  result an array); parse into structs with `#[serde(default)]` + `Option` everywhere (PowerShell emits nulls; a missing
  partition letter arrives as `"\0"`). Throw sentinel tokens (`NOPARTITION`) and match them in Rust. Loading the Storage
  module alone costs ~0.8 s — query CIM classes directly if you must.
- Console tools write the **OEM code page**: decode non-ASCII with `MultiByteToWideChar(CP_OEMCP, …)` (Win32_Globalization).
- `defrag.exe` exits **0 even on failure**: find the last `(0x8…)` HRESULT in the output (0x89000024 admin, 0x89000020
  unsupported, 0x89000001 not found, 0x8900002F unsupported FS, 0x89000006 = cancelled). `/U /V` for progress; progress
  lines are rewritten with `\r` → split on `\r` and `\n`, buffer partial lines, skip repeats; lines like `Total fragmented
  space = 3%` aren't progress (exclude `=` before `%`). Args `["C:", "/L"|"/D"|"/A", "/U", "/V"]`: SSD → `/L` (retrim),
  HDD → `/D`, `/A` = analyze only (also needs admin); never defragment an SSD.
- Cancel a console child gracefully: `AttachConsole(pid)`, then `SetConsoleCtrlHandler(Some(swallow), TRUE)` (attaching
  resets handlers; one registered before AttachConsole was never called in testing), `GenerateConsoleCtrlEvent(CTRL_C_EVENT, 0)`,
  poll an AtomicBool your handler sets (10 ms steps, ≤ 3 s), *then* `FreeConsole` — if you detach first, Windows' default
  handler runs in your process and exits the GUI app. Don't use `SetConsoleCtrlHandler(None, TRUE)` (inherited by the next
  child, which then ignores Ctrl+C); clear it before spawning. windows-sys gates these behind `Win32_System_Console`, so
  declare them by hand (`#[link(name = "kernel32")]`). Only works in a release GUI build (debug has its own console).
  Then escalate: grace period (15 s) → `TerminateProcess` on **your own cloned handle**
  (`child.as_handle().try_clone_to_owned()`), never by PID (reuse).
- Report a cancel's outcome honestly: record the stop state (`Asked` after Ctrl+C, `Killed` after TerminateProcess) under
  the same mutex the worker reads when building the final summary. Three summaries: cancel confirmed (defrag printed
  0x89000006), killed after 15 s, finished anyway (a run that completed before the cancel keeps its real result). Killing
  defrag.exe doesn't stop defragsvc — say Windows may finish the pass in the background.

## Hardware and vendor-specific features: probe, never assume

Generic Windows APIs cover only part of the hardware surface. Before designing a feature, write a read-only spike test
on the real machine. Examples: battery health is generic (`IOCTL_BATTERY_QUERY_INFORMATION` via
`SetupDiGetClassDevs(GUID_DEVCLASS_BATTERY)` for DesignedCapacity / FullChargedCapacity / CycleCount; `root\WMI`
BatteryStaticData / BatteryFullChargedCapacity; `GetSystemPowerStatus`; `RegisterPowerSettingNotification` instead of
polling), but a **charge limit has no Windows API** — it is OEM firmware/WMI (Lenovo, ASUS, Dell, HP, Surface) or must be
enforced by a background agent. Detect support per machine and give the UI an "unsupported on this PC" state distinct
from the admin ghost state. (These battery specifics are pointers from review, not tested on Platter.)

## Shell APIs

- Recycle: `SHFileOperationW` with `FOF_ALLOWUNDO | FOF_NOCONFIRMATION | FOF_SILENT | FOF_NOERRORUI | FOF_WANTNUKEWARNING`
  (asks before permanently deleting items that can't go to the bin, e.g. USB), `pFrom` NUL-separated + double NUL,
  check `fAnyOperationsAborted` even when it returns 0. Normalize/guard paths first (filesystem.md).
- Recycle Bin size: `SHQueryRecycleBinW(null, &mut SHQUERYRBINFO{cbSize…})`; empty: `SHEmptyRecycleBinW(null, null, 0x7)`.
  Its HRESULT is unreliable → report before−after; error only if hr<0, bin non-empty and nothing freed.
- Known folders: `SHGetKnownFolderPath` (+ `CoTaskMemFree`) — OneDrive relocates Desktop/Documents/Downloads.
- `hiberfil.sys` is locked: get its size from the parent dir listing; `powercfg /hibernate off` via System32 path.

## Error messages

One plain sentence that says what to do; end unknowns with "Windows couldn't X (error N)." PowerShell: first non-empty line
not starting with `At line`/`+`, strip `powershell.exe : `, map `Access denied`/`Access is denied`/`0x80070005` to the
restart-as-admin sentence. Win32: map codes (5 admin, 19 write-protected, 21 not ready, 123/154 bad name, 1/50 unsupported).
From `io::Error`: lowercase first letter, strip ` (os error N)` and the trailing period when embedding.
