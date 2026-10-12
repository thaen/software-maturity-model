import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { JSDOM } from 'jsdom';
import * as model from '../public/catalog.js';
import { createCatalogServer } from '../server.mjs';

const [html, app, seedText] = await Promise.all([
  readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
  readFile(new URL('./fixtures/catalog.json', import.meta.url), 'utf8')
]);
async function eventually(condition) {
  for (let attempts = 0; attempts < 100; attempts++) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('The expected interface state did not appear.');
}
async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), 'maturity-interface-test-'));
  const dataFile = join(directory, 'catalog.json');
  await writeFile(dataFile, seedText);
  const server = createCatalogServer({ dataFile });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  const { window } = dom;
  window.testModule = model;
  window.structuredClone = structuredClone;
  window.fetch = (path, options) => fetch(new URL(path, url), options);
  window.CSS = { escape: value => value };
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  const errors = [];
  window.addEventListener('error', event => { errors.push(event.error); });
  // jsdom does not load ES modules. The test injects the real model exports and executes
  // the unchanged application body inside its own DOM, against the real temporary API.
  const source = app.replace(/^import .*;\n/, 'const { LEVELS, validateCatalog, children, descendants, changeCatalog } = window.testModule;\n');
  await window.eval(`(async () => {${source}\n})()`);
  t.after(async () => {
    dom.window.close(); server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true });
    assert.deepEqual(errors, []);
  });
  const $ = selector => window.document.querySelector(selector);
  const all = selector => [...window.document.querySelectorAll(selector)];
  const click = selector => { const element = $(selector); assert.ok(element, selector); element.click(); };
  const saved = () => eventually(() => $('#save-status').textContent === 'All changes are saved.');
  const submit = () => $('#modal-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  const disk = async () => JSON.parse(await readFile(dataFile, 'utf8'));
  return { window, $, all, click, saved, submit, disk };
}

test('selection opens only the chosen branch and leaves every category in the DOM', async t => {
  const { $, all, click } = await setup(t);
  assert.equal(all('[data-column="category"] .item').length, 9);
  assert.equal(all('[data-column="subcategory"] .item').length, 7);
  assert.equal(all('[data-column="kind"] .item').length, 2);
  const categoryElement = $('[data-id="S6"]');
  click('[data-id="S6"] [data-action="select"]');
  assert.equal(all('[data-column="category"] .item').length, 9);
  assert.equal(all('[data-column="subcategory"] .item').length, 6);
  assert.equal($('[data-id="S6"]'), categoryElement);
  click('[data-id="S6.2"] [data-action="select"]');
  assert.ok($('[data-id="S6.2.1"]'));
  assert.equal($('[data-id="S6.1.1"]'), null);
});
test('double-click editing saves a title and description, and Escape cancels', async t => {
  const { window, $, click, saved, disk } = await setup(t);
  const title = $('[data-id="S3"] [data-field="title"]');
  title.click();
  title.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  const editor = $('[data-id="S3"] input'); assert.ok(editor);
  editor.value = 'Deployment definitions';
  editor.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await saved();
  assert.equal((await disk()).nodes.find(node => node.id === 'S3').title, 'Deployment definitions');
  const description = $('[data-id="S3"] [data-field="description"]');
  description.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  const text = $('[data-id="S3"] textarea'); text.value = 'A declaration changes how the system is assembled.';
  text.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
  await saved();
  assert.equal((await disk()).nodes.find(node => node.id === 'S3').description, text.value);
  const newTitle = $('[data-id="S3"] [data-field="title"]');
  newTitle.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  const cancelled = $('[data-id="S3"] input'); cancelled.value = 'Discard this edit';
  cancelled.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal($('[data-id="S3"] [data-field="title"]').textContent, 'Deployment definitions');
  click('#undo'); await saved();
  assert.notEqual((await disk()).nodes.find(node => node.id === 'S3').description, text.value);
  click('#redo'); await saved();
  assert.equal((await disk()).nodes.find(node => node.id === 'S3').description, text.value);
});
test('scope and guidance are complete editable catalog content, with search and undo', async t => {
  const { window, $, click, saved, disk } = await setup(t);
  const initial = await disk();
  assert.equal($('[data-id="S3"] [data-field="guidance"]').textContent, initial.nodes.find(node => node.id === 'S3').guidance);
  click('[data-id="S3"] [data-action="menu"]');
  assert.equal($('#modal a'), null);
  click('[data-edit-guidance]');
  const guidance = $('[data-id="S3"] textarea');
  guidance.value = 'This source has a boundary rule.\n\n<em>A platform outage belongs to S5.</em>';
  guidance.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
  await saved();
  assert.equal((await disk()).nodes.find(node => node.id === 'S3').guidance, guidance.value);
  assert.equal($('[data-id="S3"] .item-guidance em'), null);
  $('#search').value = 'boundary rule';
  $('#search').dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal($('#search-results [data-result="S3"]').textContent.includes('Deployment artifacts'), true);
  const scope = $('[data-catalog-field="description"]');
  scope.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  const editor = $('#catalog-scope textarea'); editor.value = 'The scope includes the installed release.\n\nOwners have boundaries.';
  editor.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }));
  await saved();
  assert.equal((await disk()).description, editor.value);
  assert.equal($('[data-catalog-field="description"]').textContent, editor.value);
  click('#undo'); await saved();
  assert.equal((await disk()).description, initial.description);
  assert.equal((await disk()).nodes.find(node => node.id === 'S3').guidance, guidance.value);
  click('#redo'); await saved();
  assert.equal((await disk()).description, editor.value);
});
test('the interface creates all levels, moves an item, deletes a branch, and restores it', async t => {
  const { window, $, click, submit, disk, saved } = await setup(t);
  for (const [level, title] of [['category', 'Review category'], ['subcategory', 'Review branch'], ['kind', 'Review change']]) {
    click(`.column-header [data-add="${level}"]`);
    $('#modal input[name="title"]').value = title;
    $('#modal textarea[name="description"]').value = `The ${title.toLowerCase()} has a definition.`;
    submit(); await saved();
    assert.equal($('#modal').open, false);
  }
  const created = (await disk()).nodes.filter(node => node.origin === 'user');
  assert.equal(created.length, 3);
  const leaf = created.find(node => node.level === 'kind');
  click(`[data-id="${leaf.id}"] [data-action="menu"]`);
  click('[data-move]');
  $('#modal select[name="parent"]').value = 'S1.1';
  $('#modal select[name="parent"]').dispatchEvent(new window.Event('change'));
  submit(); await saved();
  assert.equal((await disk()).nodes.find(node => node.id === leaf.id).parentId, 'S1.1');
  click('#undo'); await saved();
  const category = created.find(node => node.level === 'category');
  click(`[data-id="${category.id}"] [data-action="select"]`);
  click(`[data-id="${category.id}"] [data-action="menu"]`); click('[data-delete]');
  assert.match($('#modal p').textContent, /2 child items/);
  submit(); await saved();
  assert.equal((await disk()).nodes.filter(node => node.origin === 'user').length, 0);
  click('#undo'); await saved();
  assert.equal((await disk()).nodes.filter(node => node.origin === 'user').length, 3);
});
test('search opens a result without filtering categories, and plan views identify their scope', async t => {
  const { window, $, all, click } = await setup(t);
  $('#search').value = 'Provider pricing revision';
  $('#search').dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(all('.search-result').length, 1);
  click('.search-result');
  assert.ok($('[data-id="S9.3.2"]'));
  assert.equal(all('[data-column="category"] .item').length, 9);
  click('#navigation [data-phase="3"]');
  assert.equal($('#catalog-view').hidden, true);
  assert.match($('#roadmap-view').textContent, /work repository/);
  click('#roadmap-view [data-phase="0"]');
  assert.equal($('#catalog-view').hidden, false);
});

test('drag event handlers reorder categories and move a branch with its descendants', async t => {
  const { window, $, click, saved, disk } = await setup(t);
  function drag(source, target) {
    const transfer = { setData() {}, effectAllowed: '', dropEffect: '' };
    for (const [type, element] of [['dragstart', $(source)], ['dragover', $(target)], ['drop', $(target)]]) {
      const event = new window.MouseEvent(type, { bubbles: true, cancelable: true, clientY: -1 });
      Object.defineProperty(event, 'dataTransfer', { value: transfer });
      element.dispatchEvent(event);
    }
  }
  drag('[data-id="S2"] [data-drag]', '[data-id="S1"]'); await saved();
  assert.equal(model.children(await disk(), null)[0].id, 'S2');
  click('[data-id="S1"] [data-action="select"]');
  const originalKinds = model.children(await disk(), 'S1.1').map(node => node.id);
  drag('[data-id="S1.1"] [data-drag]', '[data-id="S2"]'); await saved();
  const result = await disk();
  assert.equal(result.nodes.find(node => node.id === 'S1.1').parentId, 'S2');
  assert.deepEqual(model.children(result, 'S1.1').map(node => node.id), originalKinds);
  assert.ok($('[data-id="S1.1"]'));
});

test('a rejected save leaves the editor text available for correction', async t => {
  const { window, $, disk } = await setup(t);
  window.fetch = async () => new Response(JSON.stringify({ error: 'The catalog changed in another tab.' }), { status: 409 });
  $('[data-id="S1"] [data-field="title"]').dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  const editor = $('[data-id="S1"] input'); editor.value = 'An unsaved revision';
  editor.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await eventually(() => $('#save-status').textContent === 'The last save was not confirmed.');
  assert.equal($('[data-id="S1"] input').value, 'An unsaved revision');
  assert.equal((await disk()).nodes.find(node => node.id === 'S1').title, 'Owned software');
  assert.match($('#toast').textContent, /changed in another tab/);
});
