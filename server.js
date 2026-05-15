import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3003;

// --- OpenSee 3.0: layered static serving ---

// Root: index.html, content.html, logo.png (new 3.0 entry points)
app.use(express.static(__dirname));

// New 3.0 modules
app.use('/core',     express.static(path.join(__dirname, 'core')));
app.use('/engine',   express.static(path.join(__dirname, 'engine')));
app.use('/ui',       express.static(path.join(__dirname, 'ui')));
app.use('/s2',       express.static(path.join(__dirname, 's2')));
app.use('/decision', express.static(path.join(__dirname, 'decision')));
app.use('/css',      express.static(path.join(__dirname, 'css')));
app.use('/semantic', express.static(path.join(__dirname, 'semantic')));
app.use('/assets',   express.static(path.join(__dirname, 'assets')));

// Legacy: frontend/ pages (ask.html, opensee.html, profile.html, etc.)
app.use(express.static(path.join(__dirname, 'frontend')));

// Legacy data paths (opensee.html, opensee-me.html still reference these)
app.use('/states', express.static(path.join(__dirname, 'states')));
app.use('/data',   express.static(path.join(__dirname, 'data')));

app.listen(PORT, () => {
  console.log(`OpenSee 3.0 running at http://localhost:${PORT}`);
  console.log(`  Entry:     http://localhost:${PORT}/`);
  console.log(`  Result:    http://localhost:${PORT}/content.html`);
  console.log(`  Engine:    /engine/engine.js`);
  console.log(`  Seed:      /core/seed.js`);
  console.log(`  Semantic:  /semantic/Q{n}.json`);
  console.log(`  Decision:  /decision/decision.js`);
  console.log(`  UI:        /ui/content.js | /ui/index.js`);
  console.log(`  S2:        /s2/s2.js`);
  console.log(`  CSS:       /css/content.css`);
  console.log(`  Legacy:    /ask.html | /opensee.html | /profile.html`);
});
