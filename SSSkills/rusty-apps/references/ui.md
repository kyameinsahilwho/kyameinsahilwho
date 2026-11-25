# UI: vanilla HTML/CSS/JS inside Tauri, design that users approved

Reference (in a Platter clone, e.g. `D:\projects\platter`): `ui\` — `app.js` (state, render helpers, actions, caching, polling), `styles.css`
(tokens, themes, components), `mock.js` (fake backend), `icons.js` (Lucide subset), `index.html`.
Load the `frontend-design` skill for aesthetic direction; this file is the Tauri/WebView2-specific and proven part.

## Architecture (no framework, no bundler)

- One ES module, one state object `S`, string-template views, plain `render()` / `renderPanel()` / `renderRail()`.
- One document-level click handler: `const el = e.target.closest("[data-action]"); if (!el || el.disabled) return;
  e.stopPropagation(); actions[el.dataset.action]?.(el, e);` — the innermost action wins for buttons inside clickable rows.
- `esc()` every interpolated value (`& < > " '`), including paths in `data-*`/`title` attributes. With `csp: null`,
  escaping is the only XSS barrier. High-frequency text (scan progress) → `textContent` on fixed ids, not re-rendering.
- Diff-free rendering that keeps hover, transitions, scroll and focus:
  ```js
  function patch(el, html) { if (!el || el._h === html) return false; el.innerHTML = html; el._h = html; return true; }
  ```
  `patchKeyed(parent, [[key, html], …])` (~20 lines): keep unchanged nodes, replace changed ones, reorder with
  `insertBefore` — replaces a virtual DOM for live lists. When a control already shows the new state (a toggled
  checkbox), set `row._h = newHtml` so it isn't rebuilt.
  **Caveat**: reverting a control after a failed invoke may produce HTML equal to `_h` → `patch` won't redraw; set
  `checkbox.checked` directly.
- `restoringFocus(fn)`: before rendering, derive a stable selector for `document.activeElement` (`#id`, else
  `[data-action=X][data-<first identifying attr>=Y]` trying id/tab/letter/view/path/mode…, else `[data-action=X]`) and save
  the caret; after, refocus the replacement with `preventScroll` and restore the
  selection. Wrap **every** patch of a region with focusable controls — polling ticks call render helpers outside
  `render()`. Keep typed drafts in state so a re-render keeps them.
- Every async flow guards against stale results (`const gen = ++G; await …; if (gen !== G) return;`, per-request seq,
  object identity). Backend job events carry the job id; events arriving before the start command returned are queued
  and replayed.
- Native `<dialog>` + `<form method="dialog">` (buttons `value="cancel"`/`"ok"`), Promise resolving on `close`; reset
  `d.returnValue = ""` before each `showModal()` (Esc keeps the old value → a stale "ok" counts). A global `submit` handler
  calling `preventDefault` swallows dialog forms — scope it to `[data-form]`.
- Toasts in a `role="status" aria-live="polite"` container, ~5.2 s, optional single action; errors show the backend's
  sentence verbatim (that's why backend errors are written as user-facing sentences).
- Keyboard: intercept **F5 / Ctrl+R** (`preventDefault`, map to the app's refresh — otherwise WebView2 reloads the SPA and
  loses state; ignore `e.repeat` and open dialogs); number keys for tabs (`aria-keyshortcuts`), Backspace = up a level
  (not in inputs), Enter/Space activate clickable rows.
- Persist last location (view/item/tab) in localStorage (every access in try/catch) and validate against current data on
  restore; after identity changes (drive letter change) clear per-key caches for old and new keys.
- Polling: cheap live data every 15 s, skip while `document.hidden`, catch up on `visibilitychange`; compare a compact key
  of relevant fields before re-rendering; refresh relative-time labels from the same tick.

## First paint from cache

```js
const [sys, , cache] = await Promise.all([
  invoke("system_info").catch(() => null),            // each call has its own fallback: one rejection must not
  loadVolumes(),                                        // block first paint (older backend, empty cache…)
  invoke("cache_get_many", { keys: ["disks", "history", "schedule", "cleanup"] }).catch(() => ({})),
]);
```
→ `applyCache()` → `render()` → then refresh slow data in the background. Each loader returns whether anything changed; re-render only then; keep cached
data on screen when a refresh fails. Expensive measures run on demand or at idle (`requestIdleCallback`) with a freshness
window, labelled "Measured X ago" — Platter: a clean-up result counts as fresh for 30 min when the user opens Clean up,
and the idle background re-measure runs only when the cache is older than 12 h. Compare old/new with
`JSON.stringify(a) === JSON.stringify(b)` and keep the old object when equal so identity-based change detection works.
The backend cache dir is shared by the standard and elevated instances, but localStorage isn't: store this profile's
own "done at" in localStorage and mark a cached measurement stale unless its `savedAt` matches it within 15 s — the other
level measured with different rights (or as another account). Write a "cleaned at" timestamp **before** a destructive command starts (closing mid-run
must not show freed space as reclaimable); any measurement started before it is stale; a clock set backwards (age < −60 s)
is stale.

## Browser mock backend (build the UI before Rust exists)

```js
if (!window.__TAURI__) { const m = await import("./mock.js"); m.installMock(); }   // top of app.js
```

`mock.js` installs `window.__TAURI__ = { core: { invoke }, event: { listen }, dialog: { open } }` following CONTRACT.md
exactly: rejects with **plain strings** (like Tauri's `Err(String)`), listener callbacks get `{event, id, payload}`,
realistic per-command delays, seeded PRNG data (FNV hash + mulberry32) so screenshots are stable, `mockState` toggles
(elevated, noCache, device present…) and `mockEmit` on a global such as `window.__APP_MOCK__` (Platter:
`__PLATTER_MOCK__`) — the hash hooks must check exactly that name or they silently do nothing. URL-hash hooks honored **only under the
mock** put the UI into any state with one URL: `#theme=dark&view=cleanup&tab=space&scan=1&admin=1&nocache=1`. Open with
Chrome `--allow-file-access-from-files` (ES modules over file://). Screenshot with `scripts/shoot.mjs`. A cheaper model
can write the mock. It also catches inconsistent example numbers (partitions overshooting the disk).

Use the mock for layout iteration; use the **real exe on the real machine** for truth — the real run exposed an
allocation-map bug, "Empty" shown for admin-locked rows, a hard-coded callout example and "1 file" for the Recycle Bin.

## Theming tokens

- Light on `:root`; dark under `@media (prefers-color-scheme: dark) { :root:not([data-theme=light]) {…} }` **and** repeated
  under `:root[data-theme=dark]`; `color-scheme` in each block; "system" deletes `dataset.theme`. Design dark as its own
  palette (brighter accents, low-lightness tints), not an inversion.
- Canvas reads colours via `getComputedStyle` → redraw on theme change and on `matchMedia(...).addEventListener("change")`.
- Categorical data colours in OKLCH with fixed L/C, stepping only hue; swap L/C vars in dark mode; `color-mix(in oklch, …)`
  for darker container shades.
- `@media (prefers-reduced-motion: reduce) { * { animation-duration:.01ms!important; transition-duration:.01ms!important } }`.

## Design choices the user approved (Platter)

- Lead with **one memorable, truthful data visual** (a real NTFS cluster map) and keep everything else quiet. No KPI-card
  rows, no donuts. Reclaimable space as diagonal hatching rather than another hue.
- One self-hosted variable font (Archivo, wght 100–900, wdth 62–125 %) as two woff2 files split by unicode-range,
  `<link rel=preload as=font crossorigin>` + `font-display: block`; fallback `"Segoe UI Variable Text", "Segoe UI", system-ui`.
  Fonts from `@fontsource-variable/<font>` (copy latin + latin-ext woff2). Bundle everything locally, no CDN.
- Neutrals tinted toward the brand hue; colour only for action/selection (pine `#14624f`, dark `#5fc0a0`), warning
  (saffron `#a96d14` / dark `#e2b04c`), destructive, data. Type scale ratio 1.2 on 14 px. `tabular-nums` on every number.
- Lucide subset as an ES module map name → inner SVG (keep the ISC header; watch the camelCase `viewBox` attribute when
  stripping wrappers); one `icon(name)` helper; CSS `stroke: currentColor; fill: none; stroke-width: 1.75`; spinner =
  `loader-circle` + spin class.
- Details found by screenshot critique: tiny partitions → fixed 12 px blocks with screen-reader text (not "E.. / 2…");
  date + relative time needs parentheses ("Nov 19 (5 days ago)").
- Formatters: bytes base 1024 (`bytes/KB/MB/GB/TB`, 0 decimals ≥ 100, singular "byte"); `toLocaleString("en-US")` ints;
  relative time "just now" < 90 s → min → h → days (< 14 d) → weeks (< 70 d) → months, with a future form; short dates drop
  the current year; lists "A, B and N more".
- Responsive even on desktop: grid shell `252px minmax(0,1fr)`, window `minWidth/minHeight` (Platter 980×640), collapse
  two-column bodies at 1180 px, `min-width: 0` everywhere so long paths ellipsize. A breakpoint below the window's
  minWidth (Platter's 760 px rail strip) only ever fires in the browser preview.

## Performance in WebView2

- Re-render only the affected element (full `innerHTML` re-renders dropped focus/input and cost 2–4×).
- Canvas grids: one `Path2D` per colour bucket (4 fills instead of 2048), backing store `clientWidth × devicePixelRatio`
  with `setTransform`, hover coalesced into one rAF repainting only the old and new cell (≥1.5 px gaps let you clearRect
  0.5 px around one cell). Hover 200 cells: 1121 ms → 266 ms; 30 resizes 457 → 23.5 ms.
- One deliberate entrance animation per screen, only the first time a dataset is drawn, skipped when `document.hidden` or
  reduced motion; abort the rAF loop if the canvas was replaced.
- Squarified treemap (Bruls et al.) in ~35 lines; render as absolutely positioned DOM tiles with `contain: strict` (native
  hover, tooltips, delegation, labels); nest one level only when a tile > ~150×96 px, label only > ~64×34 px.
- Long lists without virtualization: `.row { content-visibility: auto; contain-intrinsic-size: auto 50px }`,
  `contain: content` / `layout paint` on scroll containers and rails.
- Measure UI changes with Puppeteer on the mock at 4× CPU throttling, alternating old/new builds.
