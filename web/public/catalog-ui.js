import { ancestry, effectiveControls, effectiveLinks } from './catalog.js';

export function createDefinitionUI(api) {
  const $ = (selector) => document.querySelector(selector);
  const e = api.escape;
  let targetId,
    groupId,
    mitigationId,
    view = 'list',
    focusGroup = null,
    focusedMitigation = null,
    showConnections = true,
    overview = false;
  let expandedChanges = new Set(),
    expandedMitigations = new Set();
  const axisOrder = { nodes: 'authored', mitigations: 'authored' };
  const c = () => api.getCatalog();
  const get = (collection, id) => c()?.[collection]?.find((row) => row.id === id);
  const uid = () => crypto.randomUUID();
  const button = (text, attrs = '') =>
    `<button type="button" class="button" ${attrs}>${text}</button>`;
  const field = (label, name, value = '', type = 'textarea') =>
    `<label>${label}${type === 'textarea' ? `<textarea name="${name}" rows="3" maxlength="10000">${e(value)}</textarea>` : `<input name="${name}" value="${e(value)}" maxlength="200" required>`}</label>`;
  const options = (rows, value) =>
    rows
      .map(
        (row) =>
          `<option value="${e(row.id)}" ${row.id === value ? 'selected' : ''}>${e(row.title || row.statement || row.id)}</option>`,
      )
      .join('');
  const editable = (collection, row, property, placeholder = 'Add text…') =>
    `<span class="definition-text editable ${row[property] ? '' : 'placeholder'}" tabindex="0" data-definition="${collection}" data-record="${e(row.id)}" data-property="${property}">${e(row[property] || placeholder)}</span>`;
  const actions = (label) =>
    `<div class="modal-actions">${button('Cancel', 'data-close')}<button type="submit" class="button primary">${label}</button></div>`;
  async function record(collection, row) {
    return api.apply({ type: 'record', collection, record: row });
  }
  function rootGroup() {
    if (get('mitigations', groupId)?.kind !== 'group')
      groupId = c().mitigations.find((row) => row.kind === 'group')?.id;
  }
  function selectedChange() {
    return get('nodes', targetId) || get('nodes', api.getSelection().kind) || c().nodes[0];
  }
  function effectiveFor(row, group) {
    const changes =
      row.level === 'kind'
        ? [row]
        : [
            row,
            ...c().nodes.filter(
              (n) => ancestry(c(), n.id).some((parent) => parent.id === row.id) && n.id !== row.id,
            ),
          ];
    const mitigations =
      group.kind === 'control'
        ? new Set([group.id])
        : new Set(
            c()
              .mitigations.filter(
                (m) => m.kind === 'control' && mitigationChain(m).some((n) => n.id === group.id),
              )
              .map((m) => m.id),
          );
    return changes.flatMap((change) =>
      effectiveControls(c(), change.id)
        .filter((item) => mitigations.has(item.mitigation.id))
        .map((item) => ({ change, item })),
    );
  }
  function mitigationChain(row) {
    const chain = [row];
    while (chain[0]?.parentId) chain.unshift(get('mitigations', chain[0].parentId));
    return chain;
  }
  function linksPanel() {
    const change = selectedChange();
    if (!change) return '<p class="empty">The catalog has no changes.</p>';
    const controls = effectiveControls(c(), change.id).filter(
      (item) => !focusGroup || mitigationChain(item.mitigation).some((n) => n.id === focusGroup),
    );
    const exceptions = c().applicability.filter(
      (row) =>
        row.effect === 'exclude' && ancestry(c(), change.id).some((n) => n.id === row.changeId),
    );
    return `<section class="connection-column"><header class="connection-header"><div><h2>Mitigations for this change</h2><p>${e(change.title)}</p></div>${button('Link a mitigation', `data-link-change="${e(change.id)}"`)}</header><details class="control-picker"><summary>Browse controls to drag onto a change.</summary>${c()
      .mitigations.filter((row) => row.kind === 'control')
      .map(
        (row) =>
          `<div class="drag-control" draggable="true" data-link-drag="${e(row.id)}">⠿ ${e(row.id)} · ${e(row.title)}</div>`,
      )
      .join(
        '',
      )}</details><p class="view-help">These links define candidate protections. Each system investigation determines their applicability and evidence.</p>${focusGroup ? button('Show all families', 'data-clear-family') : ''}<div class="legend"><span>● Direct</span><span>↳ Inherited</span><span>◇ Conditional</span><span>⊘ Exception</span></div>${controls.length ? controls.map(({ mitigation, links, active }) => `<article class="connection-card ${active ? '' : 'excluded'}" data-mitigation-id="${e(mitigation.id)}"><div class="connection-card-heading"><button draggable="true" class="drag-handle" data-link-drag="${e(mitigation.id)}" aria-label="Drag ${e(mitigation.title)} onto a change">⠿</button><button class="text-button" data-show-mitigation="${e(mitigation.id)}">${e(mitigation.id)} · ${e(mitigation.title)}</button>${button('Add another reason', `data-link-change="${e(change.id)}" data-link-mitigation="${e(mitigation.id)}"`)}</div>${links.map((link) => `<div class="link-reason"><span class="link-tag">${link.excludedBy.length ? '⊘ Exception' : link.inherited ? '↳ Inherited' : '● Direct'}${link.condition ? ' · ◇ Conditional' : ''} · ${e(get('nodes', link.changeId)?.title)}</span><p>${editable('applicability', link, 'reason')}</p>${link.condition ? `<p><strong>Condition:</strong> ${editable('applicability', link, 'condition')}</p>` : ''}${link.mechanism ? `<p><strong>Mechanism in context:</strong> ${editable('applicability', link, 'mechanism')}</p>` : ''}${link.outcomeIds.length ? `<p>Protects ${link.outcomeIds.map((id) => e(get('outcomes', id).title)).join(', ')}.</p>` : ''}${link.excludedBy.map((ex) => `<p>⊘ ${editable('applicability', ex, 'reason')} ${button('Edit exception', `data-edit-link="${e(ex.id)}"`)}</p>`).join('')}<div class="record-actions">${button('Edit link', `data-edit-link="${e(link.id)}"`)}${link.inherited && !link.excludedBy.length ? button('Exclude here', `data-exclude-link="${e(link.id)}"`) : ''}${button('Delete link', `data-remove-record="applicability" data-record-id="${e(link.id)}"`)}</div></div>`).join('')}<details><summary>The control has criteria and evidence expectations.</summary>${controlDetail(mitigation, false)}</details></article>`).join('') : '<p class="empty">This change has no linked controls. Use the link button to add one.</p>'}${exceptions
      .filter((ex) => !effectiveLinks(c(), change.id).some((link) => link.id === ex.inheritedFrom))
      .map(
        (ex) =>
          `<article class="connection-card excluded"><p>This exception is inactive because its baseline is outside the current branch.</p><p>${editable('applicability', ex, 'reason')}</p>${button('Edit exception', `data-edit-link="${e(ex.id)}"`)}${button('Delete exception', `data-remove-record="applicability" data-record-id="${e(ex.id)}"`)}</article>`,
      )
      .join('')}</section>`;
  }
  function treeRows(collection, expanded, parent = null, depth = 0) {
    const siblings = c()[collection].filter((n) => n.parentId === parent);
    if (axisOrder[collection] === 'title') siblings.sort((a, b) => a.title.localeCompare(b.title));
    return siblings.flatMap((row) => [
      { row, depth },
      ...(expanded.has(row.id) ? treeRows(collection, expanded, row.id, depth + 1) : []),
    ]);
  }
  function matrix() {
    const rows = treeRows('nodes', expandedChanges),
      cols = treeRows('mitigations', expandedMitigations);
    const axis = (collection, row, depth) =>
      `${c()[collection].some((n) => n.parentId === row.id) ? `<button class="tree-toggle" data-expand="${collection}" data-expand-id="${e(row.id)}" aria-expanded="${(collection === 'nodes' ? expandedChanges : expandedMitigations).has(row.id)}">${(collection === 'nodes' ? expandedChanges : expandedMitigations).has(row.id) ? '−' : '+'}</button>` : '<span class="tree-spacer"></span>'}<button class="text-button axis-label depth-${Math.min(depth, 10)}" data-axis="${collection}" data-axis-id="${e(row.id)}">${e(row.title)}</button>`;
    return `<div class="axis-orders">${['nodes', 'mitigations'].map((collection) => `<label>The ${collection === 'nodes' ? 'row' : 'column'} order is <select data-axis-order="${collection}"><option value="authored" ${axisOrder[collection] === 'authored' ? 'selected' : ''}>catalog order</option><option value="title" ${axisOrder[collection] === 'title' ? 'selected' : ''}>name order</option></select>.</label>`).join('')}</div><div class="legend"><span>● Direct</span><span>↳ Inherited</span><span>◇ Conditional</span><span>⊘ Excluded</span></div><div class="view-help">The matrix counts change/control pairs within each displayed branch. Expand either hierarchy to inspect its children. Each cell shows unconditional candidates, conditional candidates marked ◇, and the possible pair count after /. These are definitions, not measurements of protection. Select a cell to inspect its reasons below.</div><div class="matrix-wrap"><table class="hierarchy-matrix"><caption>Changes form rows. Mitigations form columns.</caption><thead><tr><th scope="col">Changes / mitigations</th>${cols.map(({ row, depth }) => `<th scope="col">${axis('mitigations', row, depth)}</th>`).join('')}</tr></thead><tbody>${rows
      .map(
        ({ row, depth }) =>
          `<tr><th scope="row">${axis('nodes', row, depth)}</th>${cols
            .map(({ row: mitigation }) => {
              const pairs = effectiveFor(row, mitigation),
                active = pairs.filter((pair) => pair.item.active),
                conditional = active.filter((pair) =>
                  pair.item.links.every((link) => link.excludedBy.length || link.condition),
                ),
                excluded = pairs.length - active.length;
              const changeCount = c().nodes.filter((n) =>
                ancestry(c(), n.id).some((parent) => parent.id === row.id),
              ).length;
              const controlCount =
                mitigation.kind === 'control'
                  ? 1
                  : c().mitigations.filter(
                      (n) =>
                        n.kind === 'control' &&
                        mitigationChain(n).some((parent) => parent.id === mitigation.id),
                    ).length;
              const denominator = changeCount * controlCount,
                direct = active.some((pair) => pair.item.links.some((link) => !link.inherited)),
                inherited = active.some((pair) => pair.item.links.some((link) => link.inherited));
              return `<td><button class="matrix-cell ${active.length ? 'related' : ''} ${targetId === row.id && focusGroup === mitigation.id ? 'active' : ''}" data-cell-change="${e(row.id)}" data-cell-mitigation="${e(mitigation.id)}" aria-label="${e(row.title)} and ${e(mitigation.title)}: ${active.length - conditional.length} unconditional, ${conditional.length} conditional, ${excluded} excluded of ${denominator} possible pairs"><span>${active.length ? `${active.length - conditional.length}${conditional.length ? ` + ${conditional.length}◇` : ''}` : '·'}</span><small>${denominator ? ` / ${denominator}` : ''} ${direct ? '●' : ''}${inherited ? '↳' : ''}${excluded ? ` ${excluded}⊘` : ''}</small></button></td>`;
            })
            .join('')}</tr>`,
      )
      .join('')}</tbody></table></div>${matrixDetails()}`;
  }
  function matrixDetails() {
    const change = selectedChange(),
      mitigation = get('mitigations', focusGroup);
    if (!change || !mitigation) return linksPanel();
    const pairs = effectiveFor(change, mitigation);
    return `<div class="matrix-details"><h2>${e(change.title)} → ${e(mitigation.title)}</h2><p>${pairs.length} candidate pairs are present within these branches.</p>${pairs.length ? `<div class="pair-picks">${pairs.map(({ change: row, item }) => button(`${e(row.title)} → ${e(item.mitigation.id)}`, `data-pair-change="${e(row.id)}" data-pair-mitigation="${e(item.mitigation.id)}"`)).join('')}</div>` : button('Link a mitigation', `data-link-change="${e(change.id)}"`)}${linksPanel()}</div>`;
  }
  function outlines() {
    const change = selectedChange();
    const relatedChanges = new Set(
      focusedMitigation
        ? c()
            .nodes.filter((n) =>
              effectiveControls(c(), n.id).some(
                (item) =>
                  item.active &&
                  mitigationChain(item.mitigation).some(
                    (parent) => parent.id === focusedMitigation,
                  ),
              ),
            )
            .map((n) => n.id)
        : [],
    );
    const related = new Set(
      change
        ? effectiveControls(c(), change.id)
            .filter((i) => i.active)
            .map((i) => i.mitigation.id)
        : [],
    );
    const outline = (collection) => {
      const expanded = collection === 'nodes' ? expandedChanges : expandedMitigations;
      return treeRows(collection, expanded)
        .map(
          ({ row, depth }) =>
            `<div class="outline-row depth-${Math.min(depth, 10)} ${(collection === 'nodes' && (focusedMitigation ? relatedChanges.has(row.id) : row.id === change?.id)) || (collection === 'mitigations' && (focusedMitigation === row.id || related.has(row.id))) ? 'connected' : ''}" data-outline-side="${collection}" data-outline-id="${e(row.id)}">${c()[collection].some((n) => n.parentId === row.id) ? `<button class="tree-toggle" data-expand="${collection}" data-expand-id="${e(row.id)}" aria-expanded="${expanded.has(row.id)}">${expanded.has(row.id) ? '−' : '+'}</button>` : '<span class="tree-spacer"></span>'}<button class="text-button" data-axis="${collection}" data-axis-id="${e(row.id)}">${e(row.title)}</button>${collection === 'mitigations' && related.has(row.id) ? '<span class="path-dot">●</span>' : ''}</div>`,
        )
        .join('');
    };
    return `<label class="checkbox-label view-help"><input type="checkbox" data-overview ${overview ? 'checked' : ''}>The overview shows all visible candidate paths.</label><p class="view-help">Selecting a change or mitigation reveals its candidate paths. Expand the outlines to see more detail.</p><div class="paired-outlines"><svg class="connection-paths" aria-label="Paths connect the selected change and its candidate mitigation branches."></svg><div class="outline-side"><h2>Changes</h2>${outline('nodes')}</div><div class="outline-side"><h2>Mitigations</h2>${outline('mitigations')}</div></div>${linksPanel()}`;
  }
  function drawPaths() {
    const box = $('.paired-outlines'),
      svg = $('.connection-paths');
    if (!box || !svg || !selectedChange()) return;
    const rect = box.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
    const endpoints = new Map();
    const changes = overview || focusedMitigation ? c().nodes : [selectedChange()];
    for (const change of changes) {
      const from = ancestry(c(), change.id)
        .reverse()
        .map((n) =>
          [...box.querySelectorAll('[data-outline-side="nodes"]')].find(
            (el) => el.dataset.outlineId === n.id,
          ),
        )
        .find(Boolean);
      if (!from) continue;
      for (const item of effectiveControls(c(), change.id).filter(
        (i) =>
          i.active &&
          (!focusedMitigation ||
            mitigationChain(i.mitigation).some((n) => n.id === focusedMitigation)),
      )) {
        const to = mitigationChain(item.mitigation)
          .reverse()
          .map((n) =>
            [...box.querySelectorAll('[data-outline-side="mitigations"]')].find(
              (el) => el.dataset.outlineId === n.id,
            ),
          )
          .find(Boolean);
        if (to) {
          const id = from.dataset.outlineId + '-' + to.dataset.outlineId,
            conditional = item.links.every((link) => link.condition || link.excludedBy.length),
            inherited = item.links.some((link) => link.inherited);
          const old = endpoints.get(id);
          endpoints.set(id, {
            from,
            to,
            conditional: old ? old.conditional && conditional : conditional,
            inherited,
          });
        }
      }
    }
    svg.innerHTML = [...endpoints.values()]
      .map(({ from, to, conditional, inherited }) => {
        const a = from.getBoundingClientRect(),
          b = to.getBoundingClientRect(),
          x1 = a.right - rect.left + 2,
          x2 = b.left - rect.left - 2,
          y1 = a.top + a.height / 2 - rect.top,
          y2 = b.top + b.height / 2 - rect.top;
        return `<path class="${conditional ? 'conditional-path' : ''} ${inherited ? 'inherited-path' : ''}" d="M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}"/>`;
      })
      .join('');
  }

  function controlDetail(row, withTitle = true) {
    return `${withTitle ? `<h2>${editable('mitigations', row, 'title')}</h2>` : ''}${['description', 'purpose', 'mechanism', 'scope', 'evidence', 'maturity', 'limits', 'adverseEffects'].map((property) => `<div class="definition-field"><h3>${{ description: 'Definition', purpose: 'Purpose', mechanism: 'Protection mechanism', scope: 'Scope', evidence: 'Evidence expectations', maturity: 'Maturity descriptions', limits: 'Limits', adverseEffects: 'Adverse effects' }[property]}</h3><p>${editable('mitigations', row, property)}</p></div>`).join('')}<div class="definition-field"><h3>Assessment criteria</h3>${c()
      .criteria.filter((n) => n.mitigationId === row.id)
      .map(
        (criterion) =>
          `<article class="criterion"><span class="link-tag">${e(criterion.kind)}</span><p>${editable('criteria', criterion, 'statement')}</p><p>${editable('criteria', criterion, 'evidence')}</p><div class="record-actions">${button('Edit criterion', `data-criterion="${e(criterion.id)}"`)}${button('Delete criterion', `data-remove-record="criteria" data-record-id="${e(criterion.id)}"`)}</div></article>`,
      )
      .join(
        '',
      )}${button('Add a criterion', `data-add-criterion="${e(row.id)}"`)}</div><div class="definition-field"><h3>Dependencies, alternatives, and shared failures</h3>${c()
      .relations.filter((n) => n.sourceId === row.id || n.targetId === row.id)
      .map(
        (relation) =>
          `<article class="criterion"><p>${e(relation.sourceId)} ${e(relation.kind.replace('_', ' '))} ${e(relation.targetId)}.</p><p>${editable('relations', relation, 'reason')}</p><p>${editable('relations', relation, 'scope')}</p>${button('Edit relation', `data-relation="${e(relation.id)}"`)}${button('Delete relation', `data-remove-record="relations" data-record-id="${e(relation.id)}"`)}</article>`,
      )
      .join(
        '',
      )}${button('Add a relation', `data-add-relation="${e(row.id)}"`)}</div>${withTitle ? reverseLinks(row) : ''}`;
  }
  function reverseLinks(row) {
    const links = c().applicability.filter((link) => link.mitigationId === row.id);
    return `<div class="definition-field"><h3>Links to changes</h3><p>${links.length} authored links use this definition. Inherited links also apply to their descendant changes.</p>${button('Link to a change', `data-link-change="${e(selectedChange()?.id || c().nodes[0]?.id || '')}" data-link-mitigation="${e(row.id)}"`)}<details><summary>The linked changes have reasons.</summary>${links.map((link) => `<article class="criterion"><button class="text-button" data-change-from-mitigation="${e(link.changeId)}">${e(get('nodes', link.changeId).title)}</button><p>${editable('applicability', link, 'reason')}</p>${button('Edit link', `data-edit-link="${e(link.id)}"`)}${button('Delete link', `data-remove-record="applicability" data-record-id="${e(link.id)}"`)}</article>`).join('')}</details></div>`;
  }
  function mitigationEditor(preserveGroups = false, preserveControls = false) {
    const previousPanels = [
      ...document.querySelectorAll('#definition-view .mitigation-layout > .catalog-panel'),
    ];
    rootGroup();
    const selected = get('mitigations', mitigationId);
    const groups = c().mitigations.filter((n) => n.kind === 'group');
    $('#definition-view').innerHTML =
      `<div class="definition-toolbar">${button('Add a group', 'data-add-mitigation="group"')}${button('Edit conditional rules', 'data-rules')}${button('Edit outcome definitions', 'data-outcomes')}<span>${c().mitigations.filter((n) => n.kind === 'control').length} controls are defined.</span></div><div class="mitigation-layout"><section class="catalog-panel"><h2>Mitigation groups</h2>${groups
        .map(
          (row) =>
            `<article class="mitigation-card ${groupId === row.id ? 'selected' : ''}" data-mitigation-record="${e(row.id)}"><div class="item-top"><button draggable="true" class="drag-handle" data-mitigation-drag="${e(row.id)}" aria-label="Drag ${e(row.title)}">⠿</button><span class="item-code">${e(row.id)}</span><button class="item-menu icon-button" data-mitigation-menu="${e(row.id)}" aria-label="Actions for ${e(row.title)}">···</button></div><h3><button class="text-button" data-group="${e(row.id)}">${editable('mitigations', row, 'title')}</button></h3><p>${editable('mitigations', row, 'description')}</p><small>${e(
              mitigationChain(row)
                .slice(0, -1)
                .map((n) => n.title)
                .join(' / '),
            )}</small></article>`,
        )
        .join(
          '',
        )}</section><section class="catalog-panel" data-mitigation-parent="${e(groupId || '')}"><header class="connection-header"><h2>${e(get('mitigations', groupId)?.title || 'Controls')}</h2>${button('Add a control', 'data-add-mitigation="control"')}</header>${
        c()
          .mitigations.filter((n) => n.parentId === groupId && n.kind === 'control')
          .map(
            (row) =>
              `<article class="mitigation-card ${mitigationId === row.id ? 'selected' : ''}" data-mitigation-record="${e(row.id)}"><div class="item-top"><button draggable="true" class="drag-handle" data-mitigation-drag="${e(row.id)}" aria-label="Drag ${e(row.title)}">⠿</button><span class="item-code">${e(row.id)}</span><button class="item-menu icon-button" data-mitigation-menu="${e(row.id)}" aria-label="Actions for ${e(row.title)}">···</button></div><h3><button class="text-button" data-control="${e(row.id)}">${editable('mitigations', row, 'title')}</button></h3><p>${editable('mitigations', row, 'description')}</p></article>`,
          )
          .join('') || '<p class="empty">This group has no controls.</p>'
      }</section><section class="catalog-panel control-definition">${selected?.kind === 'control' ? controlDetail(selected) : '<p class="empty">Select a control to edit its definition, criteria, and relations.</p>'}</section></div>`;
    [preserveGroups, preserveControls].forEach((keep, index) => {
      if (keep && previousPanels[index]) {
        document
          .querySelectorAll('#definition-view .mitigation-layout > .catalog-panel')
          [index].replaceWith(previousPanels[index]);
        previousPanels[index]
          .querySelectorAll('[data-mitigation-record]')
          .forEach((el) =>
            el.classList.toggle(
              'selected',
              el.dataset.mitigationRecord === (index === 0 ? groupId : mitigationId),
            ),
          );
      }
    });
  }
  function render() {
    if (!c() || c().schemaVersion !== 2) return;
    $('#view-switcher').hidden = api.getPhase() !== 0;
    $('#definition-view').hidden = api.getPhase() !== 1;
    $('#catalog-view').hidden = api.getPhase() !== 0;
    $('#roadmap-view').hidden = api.getPhase() < 2;
    if (api.getPhase() === 1) {
      mitigationEditor();
      return;
    }
    if (api.getPhase() !== 0) return;
    $('#view-switcher').innerHTML =
      ['list', 'matrix', 'outlines']
        .map(
          (name) =>
            `<button class="button ${view === name ? 'primary' : ''}" data-view="${name}" aria-pressed="${view === name}">${{ list: 'Connection list', matrix: 'Hierarchy matrix', outlines: 'Paired outlines' }[name]}</button>`,
        )
        .join('') +
      (view === 'list' ? `<label class="checkbox-label"><input type="checkbox" data-show-connections ${showConnections ? 'checked' : ''}>The connection column is visible.</label>` : '');
    $('#workspace').hidden = view !== 'list';
    $('#catalog-scope').hidden = view !== 'list';
    $('#connection-visualization').hidden = view === 'list';
    $('#selection-path').hidden = view !== 'list';
    $('#workspace').classList.toggle('with-connections', showConnections);
    $('#workspace .connection-column')?.remove();
    if (view === 'list') {
      if (showConnections) $('#workspace').insertAdjacentHTML('beforeend', linksPanel());
    } else $('#connection-visualization').innerHTML = view === 'matrix' ? matrix() : outlines();
    if (view === 'outlines') requestAnimationFrame(drawPaths);
  }
  function editRecord(collection, id, property) {
    const row = get(collection, id);
    if (!row) return;
    api.openModal(
      `<h2>Edit ${e(property)}.</h2>${field('Text', 'value', row[property] || '', property === 'title' ? 'input' : 'textarea')}${actions('Save text')}`,
      async (form) => {
        if (await record(collection, { ...row, [property]: form.get('value') }))
          $('#modal').close();
      },
    );
  }
  function createMitigation(kind, id) {
    rootGroup();
    const row = get('mitigations', id) || {
      id: uid(),
      kind,
      parentId: kind === 'group' ? null : groupId,
      title: '',
      description: '',
      origin: 'user',
    };
    api.openModal(
      `<h2>${id ? 'Edit' : 'Add'} a ${row.kind}.</h2>${field('Title', 'title', row.title, 'input')}${field('Description', 'description', row.description)}<label>Parent group<select name="parent"><option value="">At the root</option>${options(
        c().mitigations.filter((n) => n.kind === 'group' && n.id !== row.id),
        row.parentId,
      )}</select></label>${actions('Save definition')}`,
      async (form) => {
        const saved = {
          ...row,
          title: form.get('title').trim(),
          description: form.get('description'),
          parentId: form.get('parent') || null,
        };
        if (await record('mitigations', saved)) {
          if (saved.kind === 'group') groupId = saved.id;
          else mitigationId = saved.id;
          $('#modal').close();
          render();
        }
      },
    );
  }
  function linkEditor(id, changeId, mitigation, excludedFrom) {
    const row = get('applicability', id) || {
      id: uid(),
      changeId: changeId || selectedChange()?.id,
      mitigationId: mitigation || c().mitigations.find((n) => n.kind === 'control')?.id,
      effect: excludedFrom ? 'exclude' : 'include',
      inherit: true,
      inheritedFrom: excludedFrom || null,
      reason: '',
      condition: '',
      mechanism: '',
      outcomeIds: [],
    };
    api.openModal(
      `<h2>${id ? 'Edit' : 'Add'} an applicability link.</h2><label>Change<select name="changeId">${options(c().nodes, row.changeId)}</select></label><label>Mitigation<select name="mitigationId">${options(
        c().mitigations.filter((n) => n.kind === 'control'),
        row.mitigationId,
      )}</select></label><label>Effect<select name="effect"><option value="include" ${row.effect === 'include' ? 'selected' : ''}>Include a candidate</option><option value="exclude" ${row.effect === 'exclude' ? 'selected' : ''}>Exclude an inherited baseline</option></select></label><label>Baseline for an exception<select name="inheritedFrom"><option value="">No baseline</option>${c()
        .applicability.filter((n) => n.effect === 'include')
        .map(
          (n) =>
            `<option value="${e(n.id)}" ${row.inheritedFrom === n.id ? 'selected' : ''}>${e(n.changeId)} → ${e(n.mitigationId)} · ${e(n.reason.slice(0, 80))}</option>`,
        )
        .join(
          '',
        )}</select></label>${field('Reason', 'reason', row.reason)}${field('Condition', 'condition', row.condition)}${field('Mechanism in context', 'mechanism', row.mechanism)}<label class="checkbox-label"><input type="checkbox" name="inherit" ${row.inherit ? 'checked' : ''}>Descendants inherit this link.</label><fieldset><legend>Protected outcomes</legend>${c()
        .outcomes.map(
          (n) =>
            `<label class="checkbox-label"><input type="checkbox" name="outcomeIds" value="${e(n.id)}" ${row.outcomeIds.includes(n.id) ? 'checked' : ''}>${e(n.title)}</label>`,
        )
        .join('')}</fieldset>${actions('Save link')}`,
      async (form) => {
        const next = {
          ...row,
          changeId: form.get('changeId'),
          mitigationId: form.get('mitigationId'),
          effect: form.get('effect'),
          inherit: form.has('inherit'),
          inheritedFrom: form.get('effect') === 'exclude' ? form.get('inheritedFrom') : null,
          reason: form.get('reason'),
          condition: form.get('condition'),
          mechanism: form.get('mechanism'),
          outcomeIds: form.getAll('outcomeIds'),
        };
        if (await record('applicability', next)) $('#modal').close();
      },
    );
  }
  function criterionEditor(id, mitigation) {
    const row = get('criteria', id) || {
      id: uid(),
      mitigationId: mitigation,
      kind: 'existence',
      statement: '',
      evidence: '',
    };
    api.openModal(
      `<h2>${id ? 'Edit' : 'Add'} a criterion.</h2><label>Criterion type<select name="kind">${['existence', 'coverage', 'use', 'exercise', 'limits', 'adverse_effects'].map((value) => `<option ${row.kind === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>${field('Statement', 'statement', row.statement)}${field('Evidence expectations', 'evidence', row.evidence)}${actions('Save criterion')}`,
      async (form) => {
        if (
          await record('criteria', {
            ...row,
            kind: form.get('kind'),
            statement: form.get('statement'),
            evidence: form.get('evidence'),
          })
        )
          $('#modal').close();
      },
    );
  }
  function relationEditor(id, source) {
    const row = get('relations', id) || {
      id: uid(),
      sourceId: source,
      targetId: c().mitigations.find((n) => n.kind === 'control' && n.id !== source)?.id,
      kind: 'requires',
      reason: '',
      scope: '',
    };
    const controls = c().mitigations.filter((n) => n.kind === 'control');
    api.openModal(
      `<h2>${id ? 'Edit' : 'Add'} a mitigation relation.</h2><label>Source control<select name="sourceId">${options(controls, row.sourceId)}</select></label><label>Relation<select name="kind">${['requires', 'alternative', 'shared_failure'].map((value) => `<option ${row.kind === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>Target control<select name="targetId">${options(controls, row.targetId)}</select></label>${field('Reason', 'reason', row.reason)}${field('Scope or shared failure condition', 'scope', row.scope)}${actions('Save relation')}`,
      async (form) => {
        if (
          await record('relations', {
            ...row,
            sourceId: form.get('sourceId'),
            targetId: form.get('targetId'),
            kind: form.get('kind'),
            reason: form.get('reason'),
            scope: form.get('scope'),
          })
        )
          $('#modal').close();
      },
    );
  }
  function simpleEditor(collection, id) {
    const row = get(collection, id) || {
      id: uid(),
      title: '',
      description: '',
      ...(collection === 'rules' ? { condition: '' } : {}),
    };
    api.openModal(
      `<h2>${id ? 'Edit' : 'Add'} a ${collection === 'rules' ? 'conditional rule' : 'protected outcome'}.</h2>${field('Title', 'title', row.title, 'input')}${field('Description', 'description', row.description)}${
        collection === 'rules'
          ? `${field('Condition', 'condition', row.condition)}<fieldset><legend>Candidate mitigations</legend>${c()
              .mitigations.filter((n) => n.kind === 'control')
              .map(
                (n) =>
                  `<label class="checkbox-label"><input name="mitigationIds" type="checkbox" value="${e(n.id)}" ${c().ruleMitigations.some((link) => link.ruleId === row.id && link.mitigationId === n.id) ? 'checked' : ''}>${e(n.id)} · ${e(n.title)}</label>`,
              )
              .join('')}</fieldset>`
          : ''
      }${actions('Save definition')}`,
      async (form) => {
        const next = structuredClone(c());
        const index = next[collection].findIndex((n) => n.id === row.id);
        const value = {
          ...row,
          title: form.get('title'),
          description: form.get('description'),
          ...(collection === 'rules' ? { condition: form.get('condition') } : {}),
        };
        if (index < 0) next[collection].push(value);
        else next[collection][index] = value;
        if (collection === 'rules') {
          next.ruleMitigations = next.ruleMitigations.filter((n) => n.ruleId !== row.id);
          next.ruleMitigations.push(
            ...form
              .getAll('mitigationIds')
              .map((mitigationId) => ({ id: uid(), ruleId: row.id, mitigationId })),
          );
        }
        if (await api.save(next)) $('#modal').close();
      },
    );
  }
  function listDefinitions(collection) {
    api.openModal(
      `<h2>${collection === 'rules' ? 'Conditional rules' : 'Protected outcome definitions'} have editable definitions.</h2>${c()
        [collection].map(
          (row) =>
            `<article class="criterion"><h3>${editable(collection, row, 'title')}</h3><p>${editable(collection, row, 'description')}</p>${
              collection === 'rules'
                ? `<p>${editable(collection, row, 'condition')}</p><p>${c()
                    .ruleMitigations.filter((n) => n.ruleId === row.id)
                    .map((n) => e(n.mitigationId))
                    .join(', ')}</p>`
                : ''
            }${button('Edit', `data-simple-edit="${collection}" data-record-id="${e(row.id)}"`)}${button('Delete', `data-remove-record="${collection}" data-record-id="${e(row.id)}"`)}</article>`,
        )
        .join(
          '',
        )}${button('Add a definition', `data-simple-edit="${collection}"`)}${button('Close', 'data-close')}`,
    );
  }
  function moveMitigation(id) {
    const row = get('mitigations', id);
    api.openModal(
      `<h2>Move ${e(row.title)}.</h2><label>Parent group<select name="parent"><option value="">At the root</option>${options(
        c().mitigations.filter((n) => n.kind === 'group' && n.id !== id),
        row.parentId,
      )}</select></label><label>Position<select name="before" id="mitigation-position"></select></label>${actions('Move definition')}`,
      async (form) => {
        if (
          await api.apply({
            type: 'moveMitigation',
            id,
            parentId: form.get('parent') || null,
            beforeId: form.get('before') || null,
          })
        )
          $('#modal').close();
      },
    );
    const positions = () => {
      $('#mitigation-position').innerHTML =
        '<option value="">At the end</option>' +
        options(
          c().mitigations.filter(
            (n) => n.parentId === ($('#modal [name="parent"]').value || null) && n.id !== id,
          ),
          null,
        );
    };
    $('#modal [name="parent"]').addEventListener('change', positions);
    positions();
  }
  document.addEventListener('dblclick', (event) => {
    const el = event.target.closest('[data-definition]');
    if (el) editRecord(el.dataset.definition, el.dataset.record, el.dataset.property);
  });
  document.addEventListener('keydown', (event) => {
    const el = event.target.closest('[data-definition]');
    if (el && event.key === 'F2') {
      event.preventDefault();
      editRecord(el.dataset.definition, el.dataset.record, el.dataset.property);
    }
  });
  document.addEventListener('click', async (event) => {
    const el = event.target.closest('button');
    if (!el) return;
    const d = el.dataset;
    if (d.view) {
      window.scrollTo({ top: 0 });
      view = d.view;
      focusGroup = null;
      render();
    }
    if (d.expand) {
      const set = d.expand === 'nodes' ? expandedChanges : expandedMitigations;
      set.has(d.expandId) ? set.delete(d.expandId) : set.add(d.expandId);
      render();
    }
    if (d.axis) {
      if (d.axis === 'nodes') {
        focusedMitigation = null;
        targetId = d.axisId;
        api.selectNode(d.axisId);
      } else {
        focusedMitigation = d.axisId;
        focusGroup = d.axisId;
        render();
      }
    }
    if (d.cellChange) {
      targetId = d.cellChange;
      focusGroup = d.cellMitigation;
      render();
    }
    if (d.pairChange) {
      targetId = d.pairChange;
      api.selectNode(d.pairChange);
      render();
    }
    if (d.clearFamily !== undefined) {
      focusGroup = null;
      render();
    }
    if (d.linkChange) linkEditor(null, d.linkChange, d.linkMitigation);
    if (d.editLink) linkEditor(d.editLink);
    if (d.excludeLink) {
      const link = get('applicability', d.excludeLink);
      linkEditor(null, selectedChange().id, link.mitigationId, link.id);
    }
    if (d.showMitigation || d.control) {
      mitigationId = d.showMitigation || d.control;
      groupId = get('mitigations', mitigationId)?.parentId;
      if (d.control && api.getPhase() === 1) mitigationEditor(true, true);
      else api.showPhase(1);
    }
    if (d.changeFromMitigation) {
      api.showPhase(0);
      api.selectNode(d.changeFromMitigation);
    }
    if (d.group) {
      groupId = d.group;
      mitigationId = null;
      mitigationEditor(true);
    }
    if (d.addMitigation) createMitigation(d.addMitigation);
    if (d.mitigationMenu) {
      const row = get('mitigations', d.mitigationMenu);
      api.openModal(
        `<h2>${e(row.title)}</h2><div class="menu-actions">${button('Edit the definition', `data-edit-mitigation="${e(row.id)}"`)}${button('Move or reorder', `data-move-mitigation="${e(row.id)}"`)}${button('Delete the branch', `data-remove-record="mitigations" data-record-id="${e(row.id)}"`)}</div>${button('Close', 'data-close')}`,
      );
    }
    if (d.editMitigation) createMitigation(null, d.editMitigation);
    if (d.moveMitigation) moveMitigation(d.moveMitigation);
    if (d.criterion || d.addCriterion) criterionEditor(d.criterion, d.addCriterion);
    if (d.relation || d.addRelation) relationEditor(d.relation, d.addRelation);
    if (d.rules !== undefined) listDefinitions('rules');
    if (d.outcomes !== undefined) listDefinitions('outcomes');
    if (d.simpleEdit) simpleEditor(d.simpleEdit, d.recordId);
    if (d.removeRecord) {
      api.openModal(
        `<h2>Delete this record?</h2><p>The deletion includes child definitions and dependent links. Undo can restore them during this session.</p>${actions('Delete record')}`,
        async () => {
          if (await api.apply({ type: 'removeRecord', collection: d.removeRecord, id: d.recordId }))
            $('#modal').close();
        },
      );
    }
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-axis-order]')) {
      axisOrder[event.target.dataset.axisOrder] = event.target.value;
      render();
    }
    if (event.target.matches('[data-overview]')) {
      overview = event.target.checked;
      render();
    }
    if (event.target.matches('[data-show-connections]')) {
      showConnections = event.target.checked;
      render();
    }
  });
  let dragged, linkDragged;
  document.addEventListener('dragstart', (event) => {
    const link = event.target.closest('[data-link-drag]');
    if (link) {
      linkDragged = link.dataset.linkDrag;
      event.dataTransfer.setData('application/x-link-mitigation', linkDragged);
      event.dataTransfer.effectAllowed = 'link';
      return;
    }
    const el = event.target.closest('[data-mitigation-drag]');
    if (!el) return;
    dragged = el.dataset.mitigationDrag;
    event.dataTransfer.setData('application/x-mitigation', dragged);
    event.dataTransfer.effectAllowed = 'move';
  });
  function destination(event) {
    const row = get('mitigations', dragged);
    if (!row) return;
    const target = event.target.closest('[data-mitigation-record]');
    const other = get('mitigations', target?.dataset.mitigationRecord);
    if (other && row.id !== other.id) {
      if (other.kind === 'group' && row.kind === 'control')
        return { parentId: other.id, beforeId: null, element: target };
      if (other.kind === 'group' && row.kind === 'group') {
        const rect = target.getBoundingClientRect();
        if (
          event.clientY > rect.top + rect.height / 3 &&
          event.clientY < rect.bottom - rect.height / 3
        )
          return { parentId: other.id, beforeId: null, element: target };
      }
      if (other.kind === row.kind) {
        const siblings = c().mitigations.filter(
          (n) => n.parentId === other.parentId && n.id !== row.id,
        );
        return {
          parentId: other.parentId,
          beforeId:
            event.clientY <
            target.getBoundingClientRect().top + target.getBoundingClientRect().height / 2
              ? other.id
              : siblings[siblings.indexOf(other) + 1]?.id || null,
          element: target,
        };
      }
    }
    const panel = event.target.closest('[data-mitigation-parent]');
    if (!target && panel)
      return { parentId: panel.dataset.mitigationParent || null, beforeId: null, element: panel };
  }
  document.addEventListener('dragenter', (event) => {
    if (destination(event) || (linkDragged && event.target.closest('.item[data-id]')))
      event.preventDefault();
  });
  document.addEventListener('dragover', (event) => {
    if (linkDragged && event.target.closest('.item[data-id]')) {
      event.preventDefault();
      return;
    }
    const to = destination(event);
    if (to) {
      event.preventDefault();
      document.querySelectorAll('.drop-parent').forEach((el) => el.classList.remove('drop-parent'));
      to.element.classList.add('drop-parent');
    }
  });
  document.addEventListener('drop', async (event) => {
    if (linkDragged && event.target.closest('.item[data-id]')) {
      event.preventDefault();
      linkEditor(null, event.target.closest('.item[data-id]').dataset.id, linkDragged);
      linkDragged = null;
      return;
    }
    const to = destination(event);
    if (to) {
      event.preventDefault();
      await api.apply({
        type: 'moveMitigation',
        id: dragged,
        parentId: to.parentId,
        beforeId: to.beforeId,
      });
    }
    dragged = null;
    document.querySelectorAll('.drop-parent').forEach((el) => el.classList.remove('drop-parent'));
  });
  document.addEventListener('dragend', () => {
    dragged = null;
    linkDragged = null;
    document.querySelectorAll('.drop-parent').forEach((el) => el.classList.remove('drop-parent'));
  });
  window.addEventListener('resize', drawPaths);
  return {
    render,
    searchJump(id) {
      mitigationId = id;
      groupId = get('mitigations', id)?.kind === 'group' ? id : get('mitigations', id)?.parentId;
      api.showPhase(1);
      render();
    },
    selected(id) {
      targetId = id;
      focusGroup = null;
      render();
    },
  };
}
