// Screenshot a mock-backed app UI (ui/index.html + mock.js) in headless Chrome, reliably.
//   Copy this file into a scratch dir, `npm i puppeteer-core@23` there (NOT in the project), and run it
//   from there: ESM resolves the bare "puppeteer-core" import from the script's own folder, not the cwd.
//   node shoot.mjs <out.png> <path/to/ui/index.html> ["#hash=flags"] [width=1320] [height=860] [waitSelector="main > *"] [extraMs=700] [scheme=light|dark]
// Prints "no console errors" or the collected console errors / page errors / timeout.
//
// Why not `chrome --headless --screenshot --virtual-time-budget`? With ES modules and a top-level
// `await import("./mock.js")` it fires before the app renders (9 KB blank shells), and parallel runs
// sharing --user-data-dir collide. Waiting for a real selector is what makes captures deterministic.
// --allow-file-access-from-files is required for ES modules over file://. Pick a selector that only the
// RENDERED app produces (e.g. "#map canvas", "#treemap .tile") — a static <main> in index.html matches
// before the app has booted and brings back the blank-shell problem.
import puppeteer from "puppeteer-core";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const [out, page_, hash = "", w = "1320", h = "860", sel = "main > *", extra = "700", scheme = "light"] = process.argv.slice(2);
if (!out || !page_) { console.error("usage: node shoot.mjs out.png path/to/index.html [#hash] [w] [h] [selector] [extraMs] [light|dark]"); process.exit(2); }
const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const browser = await puppeteer.launch({ executablePath: chrome, headless: "new", args: ["--allow-file-access-from-files", "--hide-scrollbars"] });
const page = await browser.newPage();
const logs = [];
page.on("console", (m) => { if (["error", "warn", "warning"].includes(m.type())) logs.push(m.text()); });
page.on("pageerror", (e) => logs.push("PAGEERROR " + e.message));
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
await page.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(page_).href + hash);
try { await page.waitForSelector(sel, { timeout: 15000 }); } catch { logs.push("TIMEOUT waiting for " + sel); }
await new Promise((r) => setTimeout(r, +extra));
await page.screenshot({ path: out });
console.log(out, logs.join("\n") || "no console errors");
await browser.close();
// Run several in parallel from bash with absolute cds — backgrounded jobs don't inherit a previous cd:
//   S=/abs/scratch; (cd "$S" && node shoot.mjs a.png ...) & (cd "$S" && node shoot.mjs b.png ...) & wait
