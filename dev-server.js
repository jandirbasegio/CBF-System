/*
Dev server para rodar localmente rotas /api do estilo Vercel.
Converte automaticamente:
  [id].js   → /api/.../:id
  [name].js → /api/.../:name
Mantém index.js como /api/...
*/
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Mapeia arquivos do tipo [param].js → :param
 */
function toExpressRoute(routePath) {
  return routePath.replace(/\[(.*?)\]/g, ':$1');
}

/**
 * Faz o mount do arquivo .js
 */
function mountFile(filePath, routePath) {
  const expressRoute = toExpressRoute(routePath);

  app.all(routePath, async (req, res) => {
  try {
    const mod = await import('file://' + filePath);

    // Express v5: req.query é getter only → criamos um clone
    req._query = { ...req.query };
    Object.defineProperty(req, "query", {
      get() { return req._query; }
    });

    if (typeof mod.default === 'function') {
      return mod.default(req, res);
    } else {
      res.status(500).json({ error: 'Handler not found' });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import error', detail: String(err) });
  }
});


  console.log(`→ Mounted: ${expressRoute}`);
}

/**
 * Caminha pelas pastas e monta rotas
 */
function walk(dir, baseRoute = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, baseRoute + '/' + entry.name);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;

    const rawName = entry.name.replace('.js', '');

    // /api/users/[id].js → /api/users/:id
    const routePath = baseRoute + '/' + rawName;

    mountFile(full, '/api' + routePath);

    // index.js também registra rota sem /index
    if (rawName === 'index') {
      mountFile(full, '/api' + baseRoute);
    }
  }
}

// Monta as rotas
const apiDir = path.join(__dirname, 'api');
walk(apiDir);

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Dev server rodando em http://localhost:${port}`));
