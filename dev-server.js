/*
Small dev server to quickly test the /api files locally.
It mounts each file under /api/<path> using express for convenience.
This is OPTIONAL and only for local testing; Vercel does not need this.
*/
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Dynamically import handlers from /api for testing
import fs from 'fs';
const apiDir = path.join(__dirname, 'api');

function mountFile(filePath, routePath) {
  app.all(routePath, async (req, res) => {
    try {
      const mod = await import('file://' + filePath);
      // handler signature: default export (req,res)
      if (typeof mod.default === 'function') {
        // adapt request: add query from express
        req.query = req.query || {};
        return mod.default(req, res);
      } else {
        res.status(500).json({ error: 'Handler not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Import error', detail: String(err) });
    }
  });
}

function walk(dir, baseRoute='') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, baseRoute + '/' + entry.name);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const route = baseRoute + '/' + entry.name.replace('.js','');
      mountFile(full, '/api' + route);
      // also mount index.js as route without /index
      if (entry.name === 'index.js') {
        mountFile(full, '/api' + baseRoute);
      }
    }
  }
}

walk(apiDir);

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Dev server listening on', port));
