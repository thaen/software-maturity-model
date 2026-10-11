import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateCatalog } from './public/catalog.js';

const root = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(root, 'public');
const projectRoot = resolve(root, '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml' };

export function createCatalogServer({ dataFile = resolve(root, 'data/catalog.json') } = {}) {
  let writeQueue = Promise.resolve();
  function json(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(body));
  }
  async function load() { return validateCatalog(JSON.parse(await readFile(dataFile, 'utf8'))); }
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try {
      // The editor is a loopback application. Reject DNS rebinding and foreign-page writes.
      if (!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host || '')) return json(res, 403, { error: 'The catalog is available through localhost only.' });
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return json(res, 403, { error: 'The request must come from the catalog application.' });
      if (req.headers['sec-fetch-site'] === 'cross-site') return json(res, 403, { error: 'Cross-site requests are not supported.' });
      const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
      if (pathname === '/api/catalog' && req.method === 'GET') return json(res, 200, await load());
      if (pathname === '/api/catalog' && req.method === 'PUT') {
        if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'The request must contain JSON.' });
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 5 * 1024 * 1024) return json(res, 413, { error: 'The catalog must be smaller than 5 MB.' });
        }
        let incoming;
        try { incoming = validateCatalog(JSON.parse(raw)); } catch (error) { return json(res, 400, { error: error.message }); }
        const write = writeQueue.then(async () => {
          const current = await load();
          if (incoming.revision !== current.revision) return json(res, 409, { error: 'The catalog changed in another tab or on disk. Reload before making more changes.' });
          const saved = { schemaVersion: 1, revision: current.revision + 1, updatedAt: new Date().toISOString(), nodes: incoming.nodes };
          const temporary = `${dataFile}.${randomUUID()}.tmp`;
          await mkdir(dirname(dataFile), { recursive: true });
          await writeFile(temporary, `${JSON.stringify(saved, null, 2)}\n`, 'utf8');
          await rename(temporary, dataFile);
          return json(res, 200, saved);
        });
        writeQueue = write.catch(() => {});
        return await write;
      }
      if (pathname.startsWith('/api/')) return json(res, 405, { error: 'The API operation is not supported.' });
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Only GET and HEAD are supported here.' });
      const isReference = pathname.startsWith('/references/');
      const base = isReference ? projectRoot : publicRoot;
      const relative = isReference ? pathname.slice('/references/'.length) : pathname === '/' ? 'index.html' : pathname.slice(1);
      if (isReference && !/^software-maturity-analysis\/references\/source-profiles\/s[1-9]-[a-z-]+\.md$/.test(relative)) return json(res, 404, { error: 'The reference does not exist.' });
      const path = resolve(base, relative);
      if (!path.startsWith(`${base}${sep}`)) return json(res, 403, { error: 'The path is outside the application.' });
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (error) {
      if (error.code === 'ENOENT') return json(res, 404, { error: 'The file does not exist.' });
      if (error instanceof URIError) return json(res, 400, { error: 'The URL is invalid.' });
      console.error(error.message);
      if (!res.headersSent) json(res, 500, { error: 'The catalog could not be read or saved. Check the server terminal.' });
      else res.end();
    }
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4317);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a port number between 1 and 65535.');
  const server = createCatalogServer();
  server.on('error', error => { console.error(`The catalog could not start: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`The software change catalog is available at http://127.0.0.1:${port}`));
}
