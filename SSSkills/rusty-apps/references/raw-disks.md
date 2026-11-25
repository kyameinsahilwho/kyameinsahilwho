# Raw disks, write-destination safety, streaming big files, per-job stores

Learned building **MAX File Recovery** (2026-11-24/25, e.g. `D:\projects\ReincarnateMax`, GitHub repo
`kyameinsahilwho/ReincarnateMax`): it reads raw volumes, physical disks, shadow copies and disk images, carves files,
previews them, and copies them to another drive. Read this for any app that reads sectors, scans a whole drive, writes
results somewhere that must not be the source, or shows large files (video, images) in the WebView.

## Reading raw volumes and disks (read-only by construction)

- `\\.\C:` (volume) and `\\.\PhysicalDriveN` (disk) are different sources: different offsets, sizes and partition
  context. Keep them separate kinds in the model (`Volume` / `Disk` / `Image` / `Snapshot`), never "a path".
- Open with `GENERIC_READ`, share `READ|WRITE` (Windows has the volume open for writing), `FILE_FLAG_NO_BUFFERING`.
  Put a `debug_assert!` in the one open function that the access mask is only `GENERIC_READ | FILE_READ_ATTRIBUTES |
  SYNCHRONIZE`; read-only then holds by construction, not by review.
- On a volume handle, send `FSCTL_ALLOW_EXTENDED_DASD_IO` (0x00090083) before reading: without it reads near the end
  of the volume fail. It changes nothing on disk.
- Size: `IOCTL_DISK_GET_LENGTH_INFO`, falling back to the drive geometry; sector size from
  `IOCTL_STORAGE_QUERY_PROPERTY` (access alignment). Opening needs admin: error 5 → "needs administrator" sentence;
  2/3/15/1167 gone; 21/1112 not ready; 32/33 locked by another program.
- `FILE_FLAG_NO_BUFFERING` needs sector-aligned offsets, lengths **and buffer addresses**. Read through a 4096-aligned
  bounce buffer (`std::alloc::Layout::from_size_align`), cap a single `ReadFile` at 8 MiB, and copy the wanted slice
  out. Test the alignment code with a regular temp file opened with `FILE_FLAG_NO_BUFFERING`, which has the same rules
  and needs no admin.
- **Bad sectors:** a tolerant read tries the whole chunk; on failure it re-reads sector by sector (2 tries each),
  zero-fills the unreadable ones and returns their ranges, so the caller marks them (MAX shows them red on its map). A
  whole-drive sweep in 4 MiB chunks then never stops on one bad sector.
- **Shadow copies** (`\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopyN`) are read-only snapshots of a volume, which makes
  them a good source. Listing them needs admin.
- Health without third-party tools: NVMe health log via `IOCTL_STORAGE_QUERY_PROPERTY` (protocol-specific property);
  ATA SMART via WMI (`MSStorageDriver_FailurePredictData`, admin).

## Never write onto the source (destination checks)

The adversarial review found three ways recovered files could land back on the drive being recovered, each through a
path that *looked* like another drive. Resolve the destination before comparing, and fail closed:

- **Final path:** open the nearest existing ancestor with `FILE_FLAG_BACKUP_SEMANTICS` and `FILE_READ_ATTRIBUTES`,
  then call `GetFinalPathNameByHandleW` twice: `VOLUME_NAME_DOS` (`D:\Docs`) and `VOLUME_NAME_GUID`
  (`\\?\Volume{…}\Docs`). This follows junctions, symlinks, `subst` and mapped drives.
- **Volume identity:** compare `\\?\Volume{GUID}\` prefixes, not drive letters. A volume mounted into a folder of
  another drive has a DOS path naming the *other* drive.
- **Loopback shares:** `\\localhost\C$`, `\\127.x.x.x\`, `\\[::1]\`, `\\0--1.ipv6-literal.net\`, `\\.\`, the PC's own
  name, its own IP addresses (`UdpSocket::bind((ip, 0)).is_ok()` tells "this is mine"), and `\\?\UNC\…` forms all point
  at a local disk. Resolve them to the local drive.
- **WSL shares** (`\\wsl$\…`, `\\wsl.localhost\…`) live in a VHDX on a local drive.
- **Virtual disks:** a mounted VHD/VHDX volume is backed by a file on another volume. Ask
  `GetStorageDependencyInformation` (virtdisk.dll, load dynamically) for the host volumes and treat them as the
  destination too.
- **Unknown = refuse.** If a snapshot's or virtual disk's physical disk can't be identified, refuse with a sentence that
  says what to pick instead. Compare **physical disks** (a different partition of the same failing disk is still the
  source), except for an image source, where only the image file itself is off-limits.
- The app's own growing files count too. A scan's session database on the drive being scanned overwrites the very free
  space it's searching. Move it to another fixed drive automatically and warn *before* the scan when that's impossible.

## Streaming big files to the WebView (custom protocol with Range)

- `register_asynchronous_uri_scheme_protocol("maxfile", handler)`: on Windows WebView2 serves it as
  `http://maxfile.localhost/<session>/<id>[?thumb=N]`. Build URLs in one JS helper, `encodeURIComponent` the parts.
- Answer `Range` with **206**, `Content-Range` and `Accept-Ranges: bytes`, capped at 8 MiB per response (the media stack
  simply asks again). That gives `<video>`/`<audio>` seeking over multi-GB files with flat memory. No Range → full body,
  capped (512 MiB). Do the work off the IPC thread (the async variant + a worker).
- Thumbnails: same URL with `?thumb=256`, decoded and scaled in Rust (`image` crate), cached by (session, id, size).
- Never base64 big data through `invoke`. Keep `invoke` for small JSON (≤64 KiB sector dumps are fine as base64).

## One SQLite file per long job (sessions)

- rusqlite with `bundled`. One `.db` per scan: results, map ranges, log, checkpoints. Copying it to another PC *is* the
  save/export feature.
- **One writer thread** fed by an mpsc channel. It batches inserts in a transaction per 2,000 rows or 300 ms, whichever
  comes first, and holds the only write connection. Readers open their own connections (WAL).
- Create the secondary indexes **after** the bulk insert: 1 M files inserted in 11.2 s, indexes built in 8.5 s, then the
  first page loads in 0.7–43 ms and a name search takes 235 ms (measured 2026-11-24).
- **Checkpoint positions** (sweep offset, the last fully collected segment) every 2 s and the map every 5 s, only for
  the sets that changed. Resume deletes the partial results of unfinished stages (each row stores its stage and segment)
  and continues from the checkpoint.
- **Crash detection:** store the pid *and* the process start time (`GetProcessTimes`). On launch, a "running" job whose
  pid is gone, or alive with a different start time (pid reuse), becomes "interrupted, can resume". `OpenProcess`
  failing with ACCESS_DENIED means alive: an elevated copy of the app owns it.

## Engine shape that kept features cheap

- **One choke point for results.** Every engine reports through `ctx.found(file)` (and `ctx.mark(kind, start, len)` for
  the map). Dedup, counters, map marks and scoping live there. The folder scan was a 6-line filter in `found()`, not a
  change to four engines.
- **One sweep, many visitors.** A deep scan reads each sector once and hands each 4 MiB chunk to several visitors
  (carver, loose MFT records, orphaned FAT directories). Adding an engine doesn't add a pass over the disk.
- **Measure speculative parallelism.** Parallel speculative parsing re-read dense MPEG-PS/TS streams about 13 times over.
  Turn it off per format where the profile says so, and leave a comment with the number.
- **Honest results:** confidence words (Excellent/Good/Partial/Unknown) each with a one-sentence reason, never a
  percentage. Re-read every recovered file and hash it (BLAKE3). A repair is written as a separate "(repaired)" copy.

## Testing without real hardware

- Build fixtures with real libraries: FAT images via the `fatfs` crate as a dev-dependency; exFAT hand-built; NTFS from
  public forensic images (DFTT, the `ntfs` crate's testfs1) downloaded by the tests into a gitignored folder and
  **skipped with a message when absent**.
- End-to-end against a published answer key: DFTT #7 deep-scanned through the real pipeline and recovered, all 9
  files' MD5s checked (0.23 s). This catches what unit tests can't: wrong extents, names, folders, timestamps.
- Fixtures must be *valid* (CRCs, header sizes, backup LBAs): a GPT fixture that passed against a stub parser failed
  once the real parser checked CRC32s. Compute checksums in the fixture builder (`crc32fast`).
- Keep non-ASCII bytes in Rust test sources as escapes (`b"\x84\x8E…"`), never literal characters: an agent edit
  re-encoded literal OEM-codepage bytes and broke four tests.
- Tests that need a real path (junctions, `C:\Documents and Settings` → `C:\Users`) are fine on the dev machine; guard
  the parts that may not exist (`if std::fs::metadata(p).is_ok()`).
