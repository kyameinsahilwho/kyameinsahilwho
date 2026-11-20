// Batch verification stills from a Remotion project (bundle ONCE, render many).
//   node helpers/remotion_stills.cjs <remotion_project_dir> <compositionId> <out_dir> '[["name",frame],...]'
// Renders JPEG stills at 0.5 scale, 6 at a time (34 in parallel timed out). Tile them with PIL
// (ffmpeg drawtext on Windows needs fontfile='C\:/Windows/Fonts/arial.ttf' escaping — PIL is simpler).
const {createRequire} = require('module');
const path = require('path');
const [proj, compId, outDir, json] = process.argv.slice(2);
const req = createRequire(path.join(proj, 'package.json'));
const {bundle} = req('@remotion/bundler');
const {renderStill, selectComposition} = req('@remotion/renderer');
const shots = JSON.parse(json);
(async () => {
  const serveUrl = await bundle({entryPoint: path.join(proj, 'src/index.ts'), publicDir: path.join(proj, 'public')});
  const composition = await selectComposition({serveUrl, id: compId});
  for (let i = 0; i < shots.length; i += 6) {
    await Promise.all(
      shots.slice(i, i + 6).map(async ([name, frame]) => {
        await renderStill({composition, serveUrl, frame, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5, output: path.join(outDir, name + '.jpg')});
        console.log('ok', name, frame);
      }),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
