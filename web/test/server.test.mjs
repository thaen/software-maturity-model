import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { request } from 'node:http';
import { createCatalogServer } from '../server.mjs';

const fixture = () => ({ schemaVersion: 1, revision: 0, nodes: [
  { id: 'root', parentId: null, level: 'category', title: 'Original category', description: '', origin: 'user' }
] });
async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), 'maturity-catalog-test-'));
  const dataFile = join(directory, 'catalog.json');
  await writeFile(dataFile, JSON.stringify(fixture()));
  const server = createCatalogServer({ dataFile });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true }); });
  return { url, dataFile };
}
const put = (url, body, headers = {}) => fetch(`${url}/api/catalog`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('the application serves its assets and source references without exposing project files', async t => {
  const { url } = await setup(t);
  for (const path of ['/', '/app.js', '/catalog.js', '/styles.css', '/references/software-maturity-analysis/references/source-profiles/s1-owned-software.md']) assert.equal((await fetch(url + path)).status, 200);
  const home = await fetch(url);
  assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal((await fetch(`${url}/references/PLAN.md`)).status, 404);
  assert.equal((await fetch(`${url}/%2e%2e%2fPLAN.md`)).status, 403);
});
test('saved changes are on disk and survive another server instance', async t => {
  const { url, dataFile } = await setup(t);
  const edited = fixture(); edited.nodes[0].title = 'Saved category';
  const response = await put(url, edited);
  assert.equal(response.status, 200);
  const saved = await response.json();
  assert.equal(saved.revision, 1); assert.ok(saved.updatedAt);
  assert.equal(JSON.parse(await readFile(dataFile, 'utf8')).nodes[0].title, 'Saved category');
  const second = createCatalogServer({ dataFile }); second.listen(0, '127.0.0.1'); await once(second, 'listening');
  t.after(async () => { second.closeAllConnections(); await new Promise(resolve => second.close(resolve)); });
  const loaded = await (await fetch(`http://127.0.0.1:${second.address().port}/api/catalog`)).json();
  assert.deepEqual(loaded, saved);
});
test('concurrent writers cannot silently overwrite each other', async t => {
  const { url, dataFile } = await setup(t);
  const first = fixture(), second = fixture();
  first.nodes[0].title = 'First edit'; second.nodes[0].title = 'Second edit';
  const results = await Promise.all([put(url, first), put(url, second)]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  assert.equal(JSON.parse(await readFile(dataFile, 'utf8')).revision, 1);
});
test('invalid imports preserve the previous data', async t => {
  const { url, dataFile } = await setup(t);
  const original = await readFile(dataFile, 'utf8');
  const invalid = fixture(); invalid.nodes[0].parentId = 'root';
  assert.equal((await put(url, invalid)).status, 400);
  assert.equal((await fetch(`${url}/api/catalog`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{broken' })).status, 400);
  assert.equal((await fetch(`${url}/api/catalog`, { method: 'PUT', body: JSON.stringify(fixture()) })).status, 415);
  assert.equal(await readFile(dataFile, 'utf8'), original);
});
test('foreign origins and non-loopback host headers are rejected', async t => {
  const { url, dataFile } = await setup(t);
  assert.equal((await put(url, fixture(), { Origin: 'https://foreign.example' })).status, 403);
  assert.equal((await put(url, fixture(), { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  const hostStatus = await new Promise((resolve, reject) => {
    const req = request(url, { headers: { Host: 'foreign.example' } }, response => { response.resume(); resolve(response.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(hostStatus, 403);
  assert.equal(JSON.parse(await readFile(dataFile, 'utf8')).revision, 0);
});
