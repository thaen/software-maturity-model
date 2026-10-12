import { LEVELS, validateCatalog, children, descendants, changeCatalog, createDefinitionUI } from './catalog.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const labels = ['category', 'subcategory', 'kind of change'];
const plurals = ['Categories', 'Subcategories', 'Kinds of change'];
const phases = [
  { title: 'Sources of change', description: 'The catalog defines sources of change as categories, subcategories, and kinds of change. It is the first review surface for the generic model.', result: 'An editable tree of change definitions.', scope: 'The catalog is independent of any company.', status: 'Available' },
  { title: 'Mitigations', description: 'The mitigation hierarchy owns each protection once, with many-to-many links to changes. A fourth column in Sources of change can show the same mitigation records for the selected branch. The skill supplies 106 controls in eight families as the starting catalog.', result: 'An editor for mitigation definitions, plus a context column for linking protections to changes. Each link has a reason and any applicability condition; each control has evidence expectations and maturity descriptions.', scope: 'The definitions and generic links belong in the public core. A system assessment records implementation, coverage, and evidence separately.', status: 'Available' },
  { title: 'System assessments', description: 'The investigation Skill begins with the product surface and its unit of supportability. Its helpers prepare expected work and review targets. Each agent work item has one boundary, one change definition, and candidate mitigations with criteria. Results remain in the work repository; their interface follows the catalog editor.', result: 'The Skill records mechanisms, observations, evidence, criterion conclusions, and a separate review for every change.', scope: 'The workflow can be defined independently of company tooling.', status: 'Skill available' },
  { title: 'Approved practices', description: 'An organization can keep a catalog of its approved tools and practices for infrastructure, throttling, quality of service, metrics, monitoring, alerts, and operating information. The public core will have a place to connect such a catalog.', result: 'Organization-specific mappings from generic mitigations to approved practices.', scope: 'Airbnb-specific content belongs in a work repository.', status: 'Planned' },
  { title: 'Organization view', description: 'Completed assessments can be aggregated across products and teams. A review can then compare evidence, protections, gaps, and uncertainty for a source of change or a mitigation.', result: 'A view across individual systems and teams.', scope: 'The structure can be generic; assessment data follows its organization.', status: 'Planned' },
  { title: 'Opportunities', description: 'The final analysis will distinguish a system gap that needs a targeted repair from a pattern across teams that warrants an initiative. Examples include missing traffic protections and repeated manual release testing. The method will need experiments and review.', result: 'Opportunities supported by assessment evidence and their expected effects.', scope: 'Prioritization follows the catalog, assessments, and organization view.', status: 'Planned' }
];

let catalog;
let selection = { category: null, subcategory: null, kind: null };
let busy = false;
let undoStack = [], redoStack = [];
let dragId = null, hoverTimer, hoverTarget;
let editing = null;
let toastTimer;
let activePhase = 0;
const definitionUI = createDefinitionUI({ escape, getCatalog: () => catalog, getSelection: () => selection, getPhase: () => activePhase, apply, save, openModal, selectNode, showPhase });

function find(id) { return catalog?.nodes.find(node => node.id === id); }
function message(text, error = false) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 7000 : 3500);
}
function status(text, saving = false) {
  $('#save-status').textContent = text;
  $('#save-status').classList.toggle('saving', saving);
}
function normalizeSelection() {
  if (find(selection.category)?.level !== 'category') selection.category = children(catalog, null)[0]?.id || null;
  if (find(selection.subcategory)?.parentId !== selection.category || !selection.category) selection.subcategory = children(catalog, selection.category).find(node => node.level === 'subcategory')?.id || null;
  if (find(selection.kind)?.parentId !== selection.subcategory || !selection.subcategory) selection.kind = children(catalog, selection.subcategory).find(node => node.level === 'kind')?.id || null;
}
function selectNode(id, updateHash = true) {
  const node = find(id);
  if (!node) return;
  const chain = [node];
  while (chain[0].parentId) chain.unshift(find(chain[0].parentId));
  selection = { category: null, subcategory: null, kind: null };
  chain.forEach(item => { selection[item.level] = item.id; });
  normalizeSelection();
  if (updateHash) history.replaceState(null, '', `#${encodeURIComponent(id)}`);
  renderSelection();
  definitionUI.selected(id);
}
function card(node) {
  const level = LEVELS.indexOf(node.level);
  const count = children(catalog, node.id).length;
  const selected = selection[node.level] === node.id;
  return `<article class="item ${selected ? 'selected' : ''}" data-id="${escape(node.id)}" data-level="${node.level}" aria-label="${escape(node.title)}">
    <div class="item-top"><button class="drag-handle" draggable="true" data-drag="${escape(node.id)}" aria-label="Drag ${escape(node.title)} to reorder or move it" title="Drag to reorder or move">⠿</button><span class="item-code">${node.origin === 'user' ? 'CUSTOM' : escape(node.id)}</span>${node.origin === 'draft' ? '<span class="draft-label">Draft</span>' : ''}<button class="item-menu icon-button" data-action="menu" aria-label="Actions for ${escape(node.title)}" title="Edit, move, or delete">···</button></div>
    <div class="item-title-row"><h3><span class="editable" data-field="title" tabindex="0" title="Double-click to edit. Press F2 to edit with a keyboard.">${escape(node.title)}</span></h3><button class="select-item" data-action="select" aria-label="${level < 2 ? `Show ${plurals[level + 1].toLowerCase()} of` : 'Select'} ${escape(node.title)}" aria-pressed="${selected}">${level < 2 ? '›' : '✓'}</button></div>
    <p class="item-description editable ${node.description ? '' : 'placeholder'}" data-field="description" tabindex="0" title="${escape(node.description || 'Double-click to add a description.')} Press F2 to edit.">${escape(node.description || 'Add a description…')}</p>
    ${node.guidance != null || level === 0 ? `<details class="item-guidance"><summary>This source has scope guidance.</summary><p class="item-description editable ${node.guidance ? '' : 'placeholder'}" data-field="guidance" tabindex="0" title="Double-click to edit scope guidance. Press F2 to edit.">${escape(node.guidance || 'Add scope guidance…')}</p></details>` : ''}
    ${level < 2 ? `<div class="item-count">${count} ${level === 0 ? 'subcategories' : 'kinds of change'}</div>` : ''}
  </article>`;
}
function renderSelection(force = false) {
  if (!catalog) return;
  normalizeSelection();
  const parents = [null, selection.category, selection.subcategory];
  document.querySelectorAll('#workspace .column[data-column]').forEach((column, index) => {
    const list = column.querySelector('.items');
    const parentId = parents[index];
    const key = parentId ?? 'root';
    const enabled = index === 0 || Boolean(parentId);
    const nodes = enabled ? children(catalog, parentId).filter(node => node.level === LEVELS[index]) : [];
    if (force || list.dataset.parent !== key) {
      list.dataset.parent = key;
      list.innerHTML = nodes.length ? nodes.map(card).join('') : `<div class="empty"><span class="empty-mark">${index === 0 ? '＋' : '↳'}</span><h3>${enabled ? `This branch has no ${plurals[index].toLowerCase()}.` : `Select a ${labels[index - 1]} to see this level.`}</h3><p>${enabled ? 'Use the add button to define the first item.' : 'The catalog shows one branch at a time.'}</p></div>`;
    }
    list.querySelectorAll('.item').forEach(item => {
      const selected = selection[LEVELS[index]] === item.dataset.id;
      item.classList.toggle('selected', selected);
      item.querySelector('.select-item').setAttribute('aria-pressed', String(selected));
    });
    column.querySelector('.column-count').textContent = nodes.length;
    column.querySelector('.column-context').textContent = index === 0 ? 'All sources remain in view.' : find(parentId)?.title || 'A parent has not been selected.';
    column.querySelector('[data-add]').disabled = !enabled || busy;
  });
  const path = LEVELS.map(level => find(selection[level])).filter(Boolean);
  $('#selection-path').innerHTML = `<span class="path-label">CURRENT BRANCH</span>${path.map(node => `<button data-jump="${escape(node.id)}">${escape(node.title)}</button>`).join('<span class="path-separator">/</span>')}`;
}
function render() {
  $('#workspace').innerHTML = LEVELS.map((level, index) => `<section class="column" data-column="${level}" aria-label="${plurals[index]}"><header class="column-header"><div><span class="level-number">0${index + 1}</span><h2>${plurals[index]}</h2><span class="column-count"></span></div><button class="add-button" data-add="${level}" aria-label="Add a ${labels[index]}">＋</button><p class="column-context"></p></header><div class="items" data-level="${level}"></div><button class="column-add" data-add="${level}">＋ Add a ${labels[index]}</button></section>`).join('');
  $('#catalog-stats').innerHTML = LEVELS.map(level => `<strong>${catalog.nodes.filter(node => node.level === level).length}</strong> ${level === 'category' ? 'sources' : level === 'subcategory' ? 'vectors' : 'kinds'}`).join('<span>·</span>');
  $('#catalog-scope').innerHTML = `<h2>The catalog has a scope.</h2><p class="editable ${catalog.description ? '' : 'placeholder'}" data-catalog-field="description" tabindex="0" title="Double-click to edit the catalog scope. Press F2 to edit.">${escape(catalog.description || 'Add a description of the catalog scope…')}</p>`;
  $('#undo').disabled = busy || !undoStack.length;
  $('#redo').disabled = busy || !redoStack.length;
  $('#import').disabled = busy;
  renderSelection(true);
  definitionUI.render();
}

async function save(next, { historyMode = 'normal', after } = {}) {
  if (busy) { message('The previous edit is still being saved.'); return false; }
  try { validateCatalog(next); } catch (error) { message(error.message, true); return false; }
  busy = true;
  status('The catalog is saving.', true);
  const previous = structuredClone(catalog);
  const previousSelection = { ...selection };
  try {
    const response = await fetch('/api/catalog', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...next, revision: catalog.revision }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The catalog could not be saved.');
    catalog = validateCatalog(result);
    if (historyMode === 'normal') {
      undoStack.push(previous); redoStack = [];
      if (undoStack.length > 50) undoStack.shift();
    } else if (historyMode === 'undo') {
      undoStack.pop(); redoStack.push(previous);
    } else if (historyMode === 'redo') {
      redoStack.pop(); undoStack.push(previous);
    }
    busy = false;
    if (after) after();
    render();
    status('All changes are saved.');
    return true;
  } catch (error) {
    busy = false;
    catalog = previous;
    selection = previousSelection;
    status('The last save was not confirmed.');
    message(error.message, true);
    $('#undo').disabled = !undoStack.length;
    $('#redo').disabled = !redoStack.length;
    return false;
  }
}
async function apply(action, options) {
  try { return await save(changeCatalog(catalog, action), options); }
  catch (error) { message(error.message, true); return false; }
}
function undo() { if (undoStack.length && !busy) return save(undoStack.at(-1), { historyMode: 'undo' }); }
function redo() { if (redoStack.length && !busy) return save(redoStack.at(-1), { historyMode: 'redo' }); }

function beginEdit(element) {
  if (element?.closest('details')) element.closest('details').open = true;
  if (editing || busy) return;
  const isCatalog = element.dataset.catalogField != null;
  const node = isCatalog ? catalog : find(element.closest('[data-id]').dataset.id);
  const field = isCatalog ? element.dataset.catalogField : element.dataset.field;
  const input = document.createElement(field === 'title' ? 'input' : 'textarea');
  input.value = node[field] || '';
  input.className = 'inline-editor';
  input.setAttribute('aria-label', isCatalog ? 'Edit the catalog scope' : `Edit the ${field} of ${node.title}`);
  input.maxLength = field === 'title' ? 200 : 10000;
  if (field !== 'title') input.rows = Math.min(12, Math.max(3, Math.ceil(input.value.length / 45)));
  const original = element.innerHTML;
  element.replaceChildren(input);
  element.classList.add('editing');
  editing = { element, input, node, field, original };
  input.focus();
  input.select();
  let ending = false;
  async function finish(cancel = false) {
    if (ending) return;
    ending = true;
    const value = input.value;
    if (!cancel && field === 'title' && !value.trim()) {
      ending = false; message('The title cannot be empty.', true); input.focus(); return;
    }
    if (cancel || value === node[field]) {
      element.innerHTML = original;
      element.classList.remove('editing');
      editing = null;
      return;
    }
    const success = await apply({ type: isCatalog ? 'updateCatalog' : 'update', id: node.id, field, value });
    if (success) editing = null;
    else { ending = false; input.focus(); }
  }
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(true); }
    if (event.key === 'Enter' && (field === 'title' || event.metaKey || event.ctrlKey)) { event.preventDefault(); finish(); }
  });
  input.addEventListener('blur', () => finish());
}

function openModal(html, submit) {
  if (busy) return;
  $('#modal-content').innerHTML = html;
  $('#modal-form').onsubmit = async event => {
    event.preventDefault();
    const button = $('#modal-form [type="submit"]');
    if (button) button.disabled = true;
    try { await submit?.(new FormData($('#modal-form'))); }
    catch (error) { message(error.message, true); }
    if (button?.isConnected) button.disabled = false;
  };
  $('#modal').showModal();
}
const modalActions = (submit, danger = false) => `<div class="modal-actions"><button type="button" data-close class="button">Cancel</button><button type="submit" class="button ${danger ? 'danger' : 'primary'}">${submit}</button></div>`;
function addItem(level) {
  const index = LEVELS.indexOf(level);
  const parentId = index === 0 ? null : selection[LEVELS[index - 1]];
  if (index > 0 && !parentId) return;
  openModal(`<div class="eyebrow">${index === 0 ? 'THE CATALOG' : escape(find(parentId).title)}</div><h2>Add a ${labels[index]}.</h2><p>The title names the change. The description defines its scope.</p><label>Title<input name="title" required maxlength="200" autocomplete="off" autofocus></label><label>Description<textarea name="description" rows="5" maxlength="10000" placeholder="Describe what changes and where this definition applies."></textarea></label>${modalActions('Create item')}`, async form => {
    const node = { id: crypto.randomUUID(), level, parentId, title: form.get('title').trim(), description: form.get('description'), origin: 'user' };
    if (await apply({ type: 'add', node }, { after: () => selectNode(node.id) })) { $('#modal').close(); message('The item was created.'); }
  });
}
function moveItem(id) {
  const node = find(id);
  const index = LEVELS.indexOf(node.level);
  const parents = index === 0 ? [] : catalog.nodes.filter(item => item.level === LEVELS[index - 1]);
  const parentLabel = parent => parent.level === 'subcategory' ? `${find(parent.parentId).title} / ${parent.title}` : parent.title;
  openModal(`<div class="eyebrow">MOVE AN ITEM</div><h2>${escape(node.title)}</h2><p>The item keeps its ID, description, and any children.</p>${index ? `<label>Parent<select name="parent">${parents.map(parent => `<option value="${escape(parent.id)}" ${parent.id === node.parentId ? 'selected' : ''}>${escape(parentLabel(parent))}</option>`).join('')}</select></label>` : ''}<label>Position<select name="before" id="move-position"></select></label>${modalActions('Move item')}`, async form => {
    const parentId = index === 0 ? null : form.get('parent');
    if (await apply({ type: 'move', id, parentId, beforeId: form.get('before') || null }, { after: () => selectNode(id) })) { $('#modal').close(); message('The item was moved.'); }
  });
  function positions() {
    const parentId = index === 0 ? null : $('#modal select[name="parent"]').value;
    $('#move-position').innerHTML = `<option value="">At the end</option>${children(catalog, parentId).filter(item => item.id !== id).map(item => `<option value="${escape(item.id)}">Before ${escape(item.title)}</option>`).join('')}`;
  }
  $('#modal select[name="parent"]')?.addEventListener('change', positions);
  positions();
}
function deleteItem(id) {
  const node = find(id);
  const count = descendants(catalog, id).length;
  openModal(`<div class="eyebrow">REMOVE AN ITEM</div><h2>Delete ${escape(node.title)}?</h2><p>${count ? `This branch has ${count} child items. The deletion includes all of them.` : 'This deletion removes one item.'} The undo button can restore the deletion during this session.</p>${modalActions('Delete item', true)}`, async () => {
    if (await apply({ type: 'delete', id })) { $('#modal').close(); message('The item was deleted. Undo is available.'); }
  });
}
function itemMenu(id) {
  const node = find(id);
  openModal(`<div class="eyebrow">ITEM ACTIONS</div><h2>${escape(node.title)}</h2><p>${escape(node.description || 'The item has no description.')}</p><div class="menu-actions"><button type="button" data-edit-title="${escape(id)}" class="button">Edit the title</button><button type="button" data-edit-description="${escape(id)}" class="button">Edit the description</button>${node.guidance != null || node.level === 'category' ? `<button type="button" data-edit-guidance="${escape(id)}" class="button">Edit the scope guidance</button>` : ''}<button type="button" data-move="${escape(id)}" class="button">Move or reorder the item</button><button type="button" data-delete="${escape(id)}" class="button danger-quiet">Delete the item</button></div><div class="modal-actions"><button type="button" data-close class="button">Close</button></div>`);
}

function searchCatalog() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  const panel = $('#search-results');
  if (!query || !catalog) { panel.hidden = true; return; }
  const results = [...catalog.nodes.map(node => ({...node, collection:'nodes'})), ...(catalog.mitigations || []).map(node => ({...node, collection:'mitigations'}))].filter(node => `${node.id} ${node.title} ${node.description} ${node.guidance || ''} ${node.evidence || ''} ${node.maturity || ''} ${(catalog.criteria || []).filter(row => row.mitigationId === node.id).map(row => row.statement).join(' ')}`.toLocaleLowerCase().includes(query));
  panel.innerHTML = `<div class="search-summary">${results.length} matching items. All categories remain in the catalog.</div>${results.slice(0, 50).map(node => {
    const parent = find(node.parentId);
    return `<button class="search-result" data-result="${escape(node.id)}" data-result-collection="${node.collection}"><span>${escape(node.title)}</span><small>${escape(node.level === 'category' ? 'Category' : parent?.title || '')} · ${escape(node.origin === 'user' ? 'Custom item' : node.id)}</small></button>`;
  }).join('')}${results.length > 50 ? '<p class="search-summary">Use more words to narrow the results.</p>' : ''}`;
  panel.hidden = false;
}
function showPhase(index) {
  activePhase = index;
  window.scrollTo({top:0});
  const phase = phases[index];
  document.querySelectorAll('[data-phase]').forEach(button => button.classList.toggle('active', Number(button.dataset.phase) === index));
  $('#catalog-view').hidden = index !== 0;
  $('#roadmap-view').hidden = index === 0;
  $('.header-actions').hidden = false;
  $('#page-label').textContent = phase.title;
  $('.catalog-toolbar').hidden = index > 1;
  definitionUI.render();
  if (index > 1) $('#roadmap-view').innerHTML = `<div class="roadmap-card"><span class="roadmap-status">${phase.status}</span><h2>This phase follows the change catalog.</h2><p>${phase.description}</p><div class="roadmap-detail"><h3>The intended output is defined.</h3><p>${phase.result}</p><h3>The content has a repository boundary.</h3><p>${phase.scope}</p></div><button class="button primary" data-phase="0">Return to the change catalog</button></div><div class="roadmap-sequence">${phases.map((item, i) => `<button data-phase="${i}" class="${i === index ? 'current' : ''}"><span>0${i + 1}</span><strong>${item.title}</strong><small>${item.status}</small></button>`).join('')}</div>`;
}

function dropDestination(event) {
  const dragged = find(dragId);
  if (!dragged) return null;
  const item = event.target.closest('.item');
  const target = find(item?.dataset.id);
  const index = LEVELS.indexOf(dragged.level);
  if (target && target.id !== dragged.id) {
    if (target.level === dragged.level) {
      const rect = item.getBoundingClientRect();
      const before = event.clientY < rect.top + rect.height / 2;
      const siblings = children(catalog, target.parentId).filter(node => node.id !== dragged.id);
      return { parentId: target.parentId, beforeId: before ? target.id : siblings[siblings.indexOf(target) + 1]?.id || null, element: item, className: before ? 'drop-before' : 'drop-after' };
    }
    if (index > 0 && target.level === LEVELS[index - 1]) return { parentId: target.id, beforeId: null, element: item, className: 'drop-parent' };
  }
  const column = event.target.closest('.column');
  if (!item && column?.dataset.column === dragged.level) {
    const parentId = index === 0 ? null : selection[LEVELS[index - 1]];
    if (index === 0 || parentId) return { parentId, beforeId: null, element: column, className: 'drop-parent' };
  }
  return null;
}
function clearDropMarks() {
  document.querySelectorAll('.drop-before,.drop-after,.drop-parent').forEach(element => element.classList.remove('drop-before', 'drop-after', 'drop-parent'));
}
$('#workspace').addEventListener('dragstart', event => {
  const handle = event.target.closest('[data-drag]');
  if (!handle) return;
  if (busy || editing) { event.preventDefault(); return; }
  dragId = handle.dataset.drag;
  event.dataTransfer.setData('text/plain', dragId);
  event.dataTransfer.effectAllowed = 'move';
  handle.closest('.item').classList.add('dragging');
  $('#selection-path').classList.add('drag-active');
});
$('#workspace').addEventListener('dragover', event => {
  const destination = dropDestination(event);
  clearDropMarks();
  if (destination) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    destination.element.classList.add(destination.className);
  }
  const target = find(event.target.closest('.item')?.dataset.id);
  const dragged = find(dragId);
  const shouldPreview = target && dragged && LEVELS.indexOf(target.level) < LEVELS.indexOf(dragged.level) && selection[target.level] !== target.id;
  if (hoverTarget !== (shouldPreview ? target.id : null)) {
    clearTimeout(hoverTimer);
    hoverTarget = shouldPreview ? target.id : null;
    if (hoverTarget) hoverTimer = setTimeout(() => { selectNode(target.id); }, 500);
  }
});
$('#workspace').addEventListener('drop', async event => {
  const destination = dropDestination(event);
  if (!destination) return;
  event.preventDefault();
  const id = dragId;
  clearTimeout(hoverTimer);
  clearDropMarks();
  dragId = null;
  $('#selection-path').classList.remove('drag-active');
  if (await apply({ type: 'move', id, parentId: destination.parentId, beforeId: destination.beforeId }, { after: () => selectNode(id) })) message('The item was moved.');
});
$('#workspace').addEventListener('dragend', () => {
  clearTimeout(hoverTimer); hoverTarget = null; dragId = null; clearDropMarks();
  document.querySelector('.dragging')?.classList.remove('dragging');
  $('#selection-path').classList.remove('drag-active');
});
$('#catalog-view').addEventListener('dblclick', event => {
  const element = event.target.closest('.editable');
  if (element && !element.dataset.definition && !event.target.closest('.inline-editor')) beginEdit(element);
});
$('#catalog-view').addEventListener('keydown', event => {
  const element = event.target.closest('.editable');
  if (!element || element.dataset.definition || event.target.closest('.inline-editor')) return;
  if (event.key === 'F2') { event.preventDefault(); beginEdit(element); }
  if ((event.key === 'Enter' || event.key === ' ') && element.closest('.item')) { event.preventDefault(); selectNode(element.closest('.item').dataset.id); }
});
document.addEventListener('click', event => {
  const target = event.target.closest('button,[data-field],.item');
  if (!target) { if (!event.target.closest('.search-wrap')) $('#search-results').hidden = true; return; }
  if (target.dataset.close !== undefined) { $('#modal').close(); return; }
  if (target.dataset.phase !== undefined) { showPhase(Number(target.dataset.phase)); return; }
  if (target.dataset.add) { addItem(target.dataset.add); return; }
  if (target.dataset.jump) { selectNode(target.dataset.jump); return; }
  if (target.dataset.result) {
    if (target.dataset.resultCollection === 'mitigations') definitionUI.searchJump(target.dataset.result);
    else { showPhase(0); selectNode(target.dataset.result); } $('#search-results').hidden = true; $('#search').value = '';
    document.querySelector(`[data-id="${CSS.escape(target.dataset.result)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return;
  }
  if (target.dataset.move) { $('#modal').close(); moveItem(target.dataset.move); return; }
  if (target.dataset.delete) { $('#modal').close(); deleteItem(target.dataset.delete); return; }
  const editId = target.dataset.editTitle || target.dataset.editDescription || target.dataset.editGuidance;
  if (editId) {
    $('#modal').close();
    beginEdit(document.querySelector(`[data-id="${CSS.escape(editId)}"] [data-field="${target.dataset.editTitle ? 'title' : target.dataset.editGuidance ? 'guidance' : 'description'}"]`));
    return;
  }
  const item = target.closest('.item');
  if (target.dataset.action === 'menu') { itemMenu(item.dataset.id); return; }
  if (item && !event.target.closest('input,textarea,button,.editing')) selectNode(item.dataset.id);
  if (target.dataset.action === 'select') selectNode(item.dataset.id);
});

$('#undo').addEventListener('click', undo);
$('#redo').addEventListener('click', redo);
$('#help').addEventListener('click', () => openModal(`<div class="eyebrow">CATALOG CONTROLS</div><h2>The catalogs have definitions and connections.</h2><div class="help-content"><p><strong>Selection reveals a branch.</strong> All categories stay in the first column. Selecting a category shows its subcategories; selecting a subcategory shows its kinds of change.</p><p><strong>Text is editable.</strong> Double-click a title, description, scope guidance, or the catalog scope below the columns. Enter saves a title. Other fields use ⌘/Ctrl+Enter, or a click outside the field. Escape cancels. The actions menu and F2 also open the editor.</p><p><strong>Dragging changes the tree.</strong> Drag the dotted handle before or after a sibling to reorder it. Drop a subcategory onto a category, or a kind onto a subcategory, to move it. Hover over a parent to open another branch while dragging.</p><p><strong>Every item has an actions menu.</strong> The menu has editing, moving, ordering, and deletion. The move dialog is a keyboard alternative to dragging.</p><p><strong>The catalog owns its definitions.</strong> The displayed fields are the complete saved text. Edits change the catalog in SQLite. Investigations use a captured export of these definitions.</p><p><strong>Edits are saved in SQLite.</strong> Undo and redo have up to 50 edits during this session. Export saves a JSON copy. Import validates a catalog before replacing the tree.</p><p><strong>Draft examples are proposals.</strong> The third level has proposed examples for review. Their descriptions do not exhaust the scope of their parent vectors.</p></div><div class="modal-actions"><button type="button" data-close class="button primary">Return to the catalog</button></div>`));
$('#search').addEventListener('input', searchCatalog);
$('#search').addEventListener('focus', searchCatalog);
$('#search').addEventListener('keydown', event => {
  if (event.key === 'Escape') $('#search-results').hidden = true;
  if (event.key === 'ArrowDown') { event.preventDefault(); $('#search-results button')?.focus(); }
  if (event.key === 'Enter' && !$('#search-results').hidden) { event.preventDefault(); $('#search-results button')?.click(); }
});
$('#export').addEventListener('click', () => {
  if (!catalog) return;
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(catalog, null, 2)}\n`], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `software-maturity-catalog-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#import').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('The catalog must be smaller than 5 MB.');
    const imported = validateCatalog(JSON.parse(await file.text()));
    openModal(`<div class="eyebrow">IMPORT A CATALOG</div><h2>Replace the catalog with this file?</h2><p>${escape(file.name)} has ${imported.nodes.length} items. The current catalog has ${catalog.nodes.length} items. Import replaces both catalogs and their links, and undo can restore it during this session.</p>${modalActions('Import catalog')}`, async () => {
      if (await save(imported)) { $('#modal').close(); message('The catalog was imported.'); }
    });
  } catch (error) { message(error.message, true); }
});
document.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,[contenteditable]') || $('#modal').open) return;
  if (event.key === '/' && activePhase === 0) { event.preventDefault(); $('#search').focus(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
});
window.addEventListener('hashchange', () => selectNode(decodeURIComponent(location.hash.slice(1)), false));
$('#navigation').innerHTML = phases.map((phase, index) => `<button data-phase="${index}" class="nav-item ${index === 0 ? 'active' : ''}"><span class="nav-number">0${index + 1}</span><span>${phase.title}${index === 2 ? '<small>Skill available</small>' : index > 2 ? '<small>Planned</small>' : ''}</span>${index === 0 ? '<span class="nav-active-dot"></span>' : ''}</button>`).join('');

try {
  const response = await fetch('/api/catalog');
  if (!response.ok) throw new Error('The catalog could not be loaded. Check that the local server is running.');
  catalog = validateCatalog(await response.json());
  normalizeSelection();
  render();
  const hash = decodeURIComponent(location.hash.slice(1));
  if (find(hash)) selectNode(hash, false);
  status('All changes are saved.');
} catch (error) {
  status('The catalog is unavailable.');
  $('#workspace').innerHTML = `<div class="load-error"><h2>The catalog could not be loaded.</h2><p>${escape(error.message)}</p><button class="button primary" id="retry">Reload the application</button></div>`;
  $('#retry').addEventListener('click', () => location.reload());
  $('#export').disabled = true; $('#import').disabled = true; $('#undo').disabled = true; $('#redo').disabled = true;
}
