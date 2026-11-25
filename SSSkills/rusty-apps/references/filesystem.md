# Filesystem: fast scanning and safe deletion

Reference (in a Platter clone, e.g. `D:\projects\platter`): `src\scan.rs` (parallel scanner, ~1.8M files / 450k dirs in 8.5–9 s warm, peak ~205 MB)
and `src\cleanup.rs` (measure + handle-based delete; its first ~20 lines list the safety rules).

## Fast directory walk

- Per folder: one `CreateFileW(FILE_LIST_DIRECTORY, share R|W|D, FILE_FLAG_BACKUP_SEMANTICS)` handle, then loop
  `GetFileInformationByHandleEx(FileIdBothDirectoryInfo)` into a reusable, 8-byte-aligned, thread-local 64 KB buffer
  (`Vec<u64>`). Same query as FindFirstFileExW, but each entry carries EndOfFile, AllocationSize, attributes, the reparse
  tag (in `EaSize` when attrs & 0x400) and a 64-bit FileId → zero per-file syscalls. Walk `NextEntryOffset` with
  `ptr::read_unaligned` + `offset_of!(FILE_ID_BOTH_DIR_INFO, FileName)`. Stop on 18/2; a failure on the first call =
  denied, mid-way = keep what was read.
- Skip only **name-surrogate** reparse points (`tag & 0x2000_0000`: junctions, symlinks, mount points). Other tags
  (dedup, WOF, OneDrive folders) are real local data — skipping all reparse points loses synced data.
- Cloud placeholders: `FILE_ATTRIBUTE_OFFLINE 0x1000 | RECALL_ON_OPEN 0x40000 | RECALL_ON_DATA_ACCESS 0x400000` → count 0
  bytes and don't descend (opening can trigger downloads).
- On-disk size: sparse (0x200)/compressed (0x800) → `min(EndOfFile, AllocationSize)`. CompactOS/WOF hide their reparse
  point and report ~0 allocated: when `allocation + 4096 <= end_of_file` on a plain file, call `GetCompressedFileSizeW`
  (only for those — 569 lookups on a full C:).
- Hard links: only if the volume reports `FILE_SUPPORTS_HARD_LINKS (0x00400000)`; dedupe FileIds in 64 shards of
  `Mutex<HashSet<u64, BuildHasherDefault<IdHasher>>>` — shard = `(k.wrapping_mul(0x9E37_79B9_7F4A_7C15) >> 58) % 64`;
  `IdHasher::write_u64`: `let m = x.wrapping_mul(0x9E37_79B9_7F4A_7C15); self.0 = m ^ (m >> 29);` — non-zero sizes only,
  ids 0/-1 always unique. Walk WinSxS last (deferred queue, second scope) so shared bytes land in System32 — matches DISM's
  "shared with Windows". Windows folder 28.2 GB → 19.2 GB after dedupe.
- Parallelism without recursion: each folder is a `rayon::Scope::spawn` job; reserve a contiguous id range for children
  with `next_id.fetch_add(n)` (children ids > parent); one reverse pass `for id in (1..n).rev()` folds totals into
  parents. Flat stack at any depth (tested 3000 nested dirs). Recursive walks overflowed the rayon stack.
- **Threads ≠ CPUs** for filesystem work (kernel time, FS contends with itself): 16-thread PC, full C: 8 threads ~11 s /
  75 s CPU vs 16–32 threads ~14 s / 90–120 s CPU. Use `(cpus/2).clamp(4,8)` in a dedicated named pool (4 MB stacks).
- Memory: store only folders. Per folder keep the top 24 files + an "other" aggregate; when the list hits 2N,
  `select_nth_unstable_by` back to N and fold smaller files straight into "other" without copying names. `Box<str>` names,
  global top-200 `BinaryHeap<Reverse<…>>` with an atomic `top_min` fast path, chunked node storage moved out chunk by chunk.
  Free the previous scan's result when a new scan **starts** (saves ~150 MB), outside the lock.
- Treemap data: serve one level at a time (depth ≤ 4); children = subfolders + top files + one synthetic "N smaller files"
  node so children always sum to the parent; 8-bucket category bytes per node; classify extensions from the raw UTF-16
  name in a stack buffer; node_modules/target/.git → "developer".
- Cheap per-file metadata without opening: `NtQueryInformationByName(FileStatInformation)` relative to the parent handle
  (Win10 1709+) gives NumberOfLinks. Per-file opens are expensive because every filter driver (AV) sees them — they were
  ~1/3 of a measure's CPU. Sample (first 32 files, then every 64th); switch an item to exact mode once any sample has
  links > 1 (pnpm store). Exact mode opens each hard-linked file for `FileIdInfo` (volume serial + 128-bit id) and
  dedupes on that; a hard-linked file's bytes count as reclaimable only when every link is inside the item. The delete
  pass always reads the exact count and reports freed = 0 for a file with NumberOfLinks > 1 (deleting one link frees
  nothing). Measured over ~550k files: no link check ~23 s, opening every file ~70 s; sampling stays near the former.
- Rayon by shape: many independent uneven items → `par_iter().with_max_len(1)`; one huge tree → spawn per sub-folder
  sharing `Arc<SharedDir>` (NtCreateFile relative to a RootDirectory is thread-safe → justified `unsafe impl Sync`).
- Background measures: dedicated 2-thread pool with `start_handler(|_| SetThreadPriority(GetCurrentThread(),
  THREAD_MODE_BACKGROUND_BEGIN))` (lowers CPU, I/O and memory priority). On threads you don't own (tokio blocking pool),
  an RAII guard that calls `THREAD_MODE_BACKGROUND_END` on drop, even on panic. User-requested work runs at full speed and
  supersedes the throttled job instead of waiting on it. Measured (clean-up measure): before 9.63 s wall / 18.5 s CPU;
  background 2 low-prio threads 7.77 s / 11.6 s CPU; user-requested 4 threads 4.11 s / 16.1 s CPU (8 threads bought
  little: ~5 s / 35 s CPU vs 4 threads ~7 s / 23 s on another item). A single-threaded walk per item uses less total CPU,
  so background measures run one thread per item and only foreground measures split big trees; keep a test asserting the
  parallel and one-thread measures agree.

## Safe deletion (anything that may run elevated)

A path-based recursive delete is a TOCTOU hole: a folder swapped for a junction after the check redirects an elevated
delete anywhere on disk (critical review finding). Required layers:

1. **Handle-based walk.** Open the root once (`CreateFileW(…, FILE_FLAG_BACKUP_SEMANTICS|FILE_FLAG_OPEN_REPARSE_POINT)`);
   open children *relative to the parent handle* with `NtCreateFile` (`OBJECT_ATTRIBUTES.RootDirectory = parent`,
   `FILE_OPEN_REPARSE_POINT (0x0020_0000) | FILE_SYNCHRONOUS_IO_NONALERT (0x20) |` *either* `FILE_DIRECTORY_FILE (0x1)` *or*
   `FILE_NON_DIRECTORY_FILE (0x40)` — never both (STATUS_INVALID_PARAMETER) — `FILE_OPEN = 1`, access `| SYNCHRONIZE`,
   Attributes 0);
   list through the handle (`FileIdBothDirectoryRestartInfo` then `FileIdBothDirectoryInfo`). After each open re-check on
   the handle: `FileAttributeTagInfo` has no reparse bit, `GetFinalPathNameByHandleW` still under the canonical root. Works
   past MAX_PATH. Needs `Wdk_Foundation`, `Wdk_Storage_FileSystem`.
2. **Delete through the handle**: `SetFileInformationByHandle(FileDispositionInfoEx, DELETE|POSIX_SEMANTICS|IGNORE_READONLY
   = 0x1|0x2|0x10)`; fall back to Ex without POSIX only on 1/50/87; last resort clear READONLY via FileBasicInfo then
   `FileDispositionInfo` (clearing READONLY needs a handle opened with WRITE_ATTRIBUTES; write 0x80 NORMAL if the result
   would be 0, since 0 means "don't change"). Any other error (in use, denied, not empty) → skip, never force. Folders: attempt delete after
   emptying (succeeds only if empty). Reparse children are deleted as links, never followed.
3. **Share modes**: hold folders you delete from with READ|WRITE (no FILE_SHARE_DELETE) so nobody renames them under you;
   if that open fails fall back to share-all; DELETE access on sub-folders only when old enough (fall back to no-DELETE
   access); files `DELETE|READ_ATTRIBUTES` (+WRITE_ATTRIBUTES for read-only).
4. **Refuse dangerous roots** — reject a root that *equals or contains* a protected folder (not just exact matches):
   drive roots / < 2 normal components, USERPROFILE, LOCALAPPDATA, APPDATA, ProgramData, SystemRoot, System32/SysWOW64,
   Program Files*, PUBLIC, OneDrive*, Users, and real Known Folder locations via `SHGetKnownFolderPath`. Env-derived
   roots are untrusted: a TEMP root must be a folder named Temp/Tmp (or a numeric session subfolder) — people set
   `TEMP=%USERPROFILE%\AppData`. Compare per component, lowercased. Report refused roots in **both** analyze and run
   ("Left X alone…", size 0) — never silently free 0 bytes.
5. **Normalize user-given paths** (recycle/open) to exactly what Windows will act on, then check that same string and pass
   it on: `GetFullPathNameW` (collapses `..` — `C:\Windows\Temp\..` once recycled C:\Windows in review), `GetLongPathNameW`
   (expands `PROGRA~1`), refuse trailing `.`/space (Win32 strips them), refuse `\\?\`/`\\.\` and relative paths,
   canonicalize only the parent so a link is judged as itself.
6. **Rules**: keep the cleanup root, only empty it; skip files newer than the cutoff by the newer of created/modified
   (≥ 24 h); "review" items (Downloads) are measured, never deleted; protected-path checks at delete time; measure and
   delete share one rule engine (analyze runs the same strict checks with `delete=false`, so shown size = what a run frees).
7. **Races**: a global `MEASURE_GEN` taken at invoke time. A superseded measure emits nothing, never writes the cache and
   returns a SUPERSEDED sentinel error the UI drops silently; background measures also stop walking (one atomic load per
   entry), foreground ones finish and are discarded. The delete run bumps the generation under the cache lock before and after and removes cached sizes first. Deletes
   ignore cancel (nothing half-done). `AtomicBool` swap prevents concurrent runs.
8. Explicit-stack DFS (frames hold open dir handles), not recursion — tested 1200 levels on a 256 KB-stack thread.
9. Glob expansion of cache paths (`User Data\*\Cache`): real non-reparse directories only, dedupe, drop roots nested in
   another root, missing env var → no roots. Chromium-family cache dirs: Cache, Code Cache, GPUCache,
   Service Worker\CacheStorage|ScriptCache, GrShaderCache, ShaderCache, GraphiteDawnCache.

### Testing deletion

Only against throwaway trees under `%TEMP%`: name them with pid + `SystemTime::now().duration_since(UNIX_EPOCH)` nanos
(`Instant::now().elapsed()` is ~0 — not unique) and remove them on Drop with `assert!(path.starts_with(std::env::temp_dir()))`. Cover: real junctions (`cmd /c mklink /J` pointing at a sibling — assert the outside file survives, plus a handle
that resolves outside the root is refused), hard links (`std::fs::hard_link`), read-only files, very deep trees, age filter,
root survives, refused roots in analyze and run, cancel stops a measure but never a delete. Guard tests call the refusal
functions on dangerous inputs and **never** the action itself. Get an adversarial multi-agent review before shipping.
