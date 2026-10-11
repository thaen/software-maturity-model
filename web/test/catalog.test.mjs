import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalog, changeCatalog, children, descendants } from '../public/catalog.js';

const seed = JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url), 'utf8'));
const fixture = () => ({ schemaVersion: 1, revision: 0, nodes: [
  { id: 'c1', parentId: null, level: 'category', title: 'First category', description: '', origin: 'user' },
  { id: 'c2', parentId: null, level: 'category', title: 'Second category', description: '', origin: 'user' },
  { id: 's1', parentId: 'c1', level: 'subcategory', title: 'First branch', description: '', origin: 'user' },
  { id: 's2', parentId: 'c1', level: 'subcategory', title: 'Second branch', description: '', origin: 'user' },
  { id: 's3', parentId: 'c2', level: 'subcategory', title: 'Other branch', description: '', origin: 'user' },
  { id: 'k1', parentId: 's1', level: 'kind', title: 'First kind', description: '', origin: 'user' },
  { id: 'k2', parentId: 's1', level: 'kind', title: 'Second kind', description: '', origin: 'user' }
] });

test('the catalog has valid parent relationships and resolvable skill provenance', async () => {
  validateCatalog(seed);
  for (const node of seed.nodes) {
    if (node.sourceRef) await readFile(new URL(`../../${node.sourceRef}`, import.meta.url));
    if (node.origin === 'draft') assert.equal(node.level, 'kind');
  }
});
test('reordering works at every level without changing IDs or children', () => {
  for (const [id, parentId, beforeId] of [['c2', null, 'c1'], ['s2', 'c1', 's1'], ['k2', 's1', 'k1']]) {
    const original = fixture();
    const result = changeCatalog(original, { type: 'move', id, parentId, beforeId });
    assert.equal(children(result, parentId)[0].id, id);
    assert.deepEqual(descendants(result, id), descendants(original, id));
    assert.deepEqual(original, fixture());
  }
});
test('moving a subcategory keeps its kinds, and a kind can move to another branch', () => {
  const moved = changeCatalog(fixture(), { type: 'move', id: 's1', parentId: 'c2' });
  assert.deepEqual(children(moved, 'c2').map(node => node.id), ['s3', 's1']);
  assert.deepEqual(children(moved, 's1').map(node => node.id), ['k1', 'k2']);
  const leaf = changeCatalog(moved, { type: 'move', id: 'k1', parentId: 's3' });
  assert.equal(children(leaf, 's3')[0].id, 'k1');
  assert.deepEqual(children(leaf, 's1').map(node => node.id), ['k2']);
});
test('invalid parent levels, cycles, missing parents, and foreign ordering targets are rejected', () => {
  for (const action of [
    { id: 'c1', parentId: 's1' }, { id: 's1', parentId: 's1' },
    { id: 'k1', parentId: 'c1' }, { id: 'k1', parentId: 'missing' },
    { id: 'k1', parentId: 's3', beforeId: 'k2' }
  ]) assert.throws(() => changeCatalog(fixture(), { type: 'move', ...action }));
});
test('deleting a branch removes its descendants while preserving other branches', () => {
  const original = fixture();
  const deleted = changeCatalog(original, { type: 'delete', id: 'c1' });
  assert.deepEqual(deleted.nodes.map(node => node.id), ['c2', 's3']);
  assert.equal(original.nodes.length, 7);
  assert.deepEqual(validateCatalog(structuredClone(original)), fixture());
});
test('new items and text edits accept Unicode and preserve markup as text', () => {
  const created = changeCatalog(fixture(), { type: 'add', node: { id: 'new', parentId: 's1', level: 'kind', title: 'Certificate rotation', description: '', origin: 'user' } });
  const updated = changeCatalog(created, { type: 'update', id: 'new', field: 'description', value: 'A key changes. λ <script> has no executable meaning here.' });
  assert.equal(updated.nodes.at(-1).description, 'A key changes. λ <script> has no executable meaning here.');
  assert.throws(() => changeCatalog(created, { type: 'update', id: 'new', field: 'title', value: '  ' }));
});
test('imports reject duplicate IDs, unknown formats, oversized text, and unexpected references', () => {
  assert.throws(() => validateCatalog({ ...fixture(), schemaVersion: 2 }));
  assert.throws(() => validateCatalog({ ...fixture(), revision: -1 }));
  const duplicate = fixture(); duplicate.nodes.push(duplicate.nodes[0]);
  assert.throws(() => validateCatalog(duplicate));
  const oversized = fixture(); oversized.nodes[0].title = 'x'.repeat(201);
  assert.throws(() => validateCatalog(oversized));
  const path = fixture(); path.nodes[0].sourceRef = '../secret';
  assert.throws(() => validateCatalog(path));
});
