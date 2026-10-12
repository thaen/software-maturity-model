import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CatalogStore } from '../store.mjs';
import {
  validateCatalog,
  changeCatalog,
  effectiveControls,
  effectiveLinks,
} from '../public/catalog.js';
const seed = JSON.parse(
  readFileSync(new URL('../data/catalog.seed.json', import.meta.url), 'utf8'),
);
import { fixture } from './fixtures/definitions.mjs';

test('the seed represents every control, baseline, rule, and criterion dimension', () => {
  validateCatalog(seed);
  assert.equal(seed.mitigations.filter((row) => row.kind === 'control').length, 106);
  assert.equal(seed.nodes.filter((row) => row.level === 'subcategory').length, 52);
  assert.equal(seed.rules.length, 10);
  const definitions = readFileSync(
    new URL('../../software-maturity-analysis/references/mitigation-catalog.md', import.meta.url),
    'utf8',
  );
  for (const [, id, text] of definitions.matchAll(/^\| ([TRVGDAOH]\d\d) \| (.*?) \|$/gm))
    assert.equal(seed.mitigations.find((row) => row.id === id).description, text);
  for (const control of seed.mitigations.filter((row) => row.kind === 'control'))
    assert.deepEqual(
      new Set(
        seed.criteria.filter((row) => row.mitigationId === control.id).map((row) => row.kind),
      ),
      new Set(['existence', 'coverage', 'use', 'exercise', 'limits', 'adverse_effects']),
    );
  assert.equal(new Set(seed.applicability.map((row) => row.changeId)).size, 52);
});
test('exceptions suppress a named inherited reason while independent reasons survive', () => {
  const c = fixture();
  c.applicability.push({
    id: 'exception',
    changeId: 'kind',
    mitigationId: 'a',
    effect: 'exclude',
    inherit: true,
    inheritedFrom: 'baseline',
    reason: 'This child path is excluded.',
    condition: '',
    outcomeIds: [],
  });
  assert.equal(effectiveControls(c, 'kind')[0].active, false);
  c.applicability.push({
    ...c.applicability[0],
    id: 'direct',
    changeId: 'kind',
    reason: 'This path needs independent protection.',
  });
  const item = effectiveControls(validateCatalog(c), 'kind')[0];
  assert.equal(item.active, true);
  assert.equal(item.links.length, 2);
  assert.equal(item.links[0].excludedBy[0].id, 'exception');
  const moved = changeCatalog(c, { type: 'move', id: 'kind', parentId: 'other' });
  assert.deepEqual(
    effectiveLinks(moved, 'kind').map((row) => row.id),
    ['direct'],
  );
  assert.ok(moved.applicability.some((row) => row.id === 'exception'));
});
test('definition deletion removes dependent links while removing a link retains the control', () => {
  const c = fixture();
  c.applicability.push({
    ...c.applicability[0],
    id: 'exception',
    changeId: 'kind',
    effect: 'exclude',
    inheritedFrom: 'baseline',
  });
  const removed = changeCatalog(c, {
    type: 'removeRecord',
    collection: 'applicability',
    id: 'baseline',
  });
  assert.equal(removed.applicability.length, 0);
  assert.equal(removed.mitigations.length, 3);
  const branch = changeCatalog(c, { type: 'removeRecord', collection: 'mitigations', id: 'group' });
  assert.equal(branch.mitigations.length, 0);
  assert.equal(branch.criteria.length, 0);
  assert.equal(branch.applicability.length, 0);
});
test('nested mitigation groups and prerequisites reject cycles and missing foreign keys', () => {
  const c = fixture();
  c.mitigations.push({
    id: 'nested',
    parentId: 'group',
    kind: 'group',
    title: 'Nested',
    description: '',
    origin: 'user',
  });
  assert.throws(
    () => changeCatalog(c, { type: 'moveMitigation', id: 'group', parentId: 'nested' }),
    /cycles/,
  );
  c.relations.push({
    id: 'ab',
    sourceId: 'a',
    targetId: 'b',
    kind: 'requires',
    reason: 'The response needs a signal.',
    scope: 'Example path',
  });
  assert.throws(
    () =>
      changeCatalog(c, {
        type: 'record',
        collection: 'relations',
        record: {
          id: 'ba',
          sourceId: 'b',
          targetId: 'a',
          kind: 'requires',
          reason: 'Reverse',
          scope: '',
        },
      }),
    /cycles/,
  );
  assert.throws(() =>
    changeCatalog(c, {
      type: 'record',
      collection: 'criteria',
      record: { id: 'bad', mitigationId: 'missing', kind: 'coverage', statement: 'Missing.' },
    }),
  );
  assert.doesNotThrow(() =>
    changeCatalog(c, {
      type: 'record',
      collection: 'relations',
      record: {
        id: 'symmetric',
        sourceId: 'b',
        targetId: 'a',
        kind: 'shared_failure',
        reason: 'Both use one signal.',
        scope: 'Signal unavailable',
      },
    }),
  );
});
test('SQLite preserves migration inputs, survives restart, rejects stale writes, and rolls back a late failure', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'maturity-sqlite-'));
  t.after(() => rm(directory, { recursive: true }));
  const databaseFile = join(directory, 'catalog.sqlite'),
    dataFile = join(directory, 'catalog.json');
  const c = fixture();
  c.nodes[0].title = 'Saved user title';
  await writeFile(dataFile, JSON.stringify(c));
  let s = new CatalogStore({ databaseFile, dataFile });
  assert.equal(s.db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.equal(s.load().nodes[0].title, 'Saved user title');
  const edited = s.load();
  edited.mitigations[1].title = 'Edited protection';
  s.replace(edited);
  assert.throws(() => s.replace(edited), /another tab/);
  s.close();
  await writeFile(dataFile, JSON.stringify({ ...c, nodes: [] }));
  s = new CatalogStore({ databaseFile, dataFile });
  t.after(() => s.close());
  const before = s.load();
  assert.equal(before.mitigations[1].title, 'Edited protection');
  assert.equal(before.nodes.length, 4);
  assert.throws(
    () =>
      s.db
        .prepare(
          'INSERT INTO criteria(id,position,mitigationId,kind,statement) VALUES (?,0,?, ?,?)',
        )
        .run('bad', 'missing', 'existence', 'A statement.'),
    /FOREIGN KEY/,
  );
  s.db.exec(
    "CREATE TRIGGER reject_criterion BEFORE INSERT ON criteria BEGIN SELECT RAISE(ABORT, 'test failure'); END;",
  );
  assert.throws(
    () => s.replace({ ...before, description: 'An interrupted save.' }),
    /test failure/,
  );
  assert.deepEqual(s.load(), before);
});
