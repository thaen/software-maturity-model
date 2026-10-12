export const LEVELS = ['category', 'subcategory', 'kind'];

export function validateCatalog(catalog) {
  if (
    !catalog ||
    ![1, 2].includes(catalog.schemaVersion) ||
    !Number.isSafeInteger(catalog.revision) ||
    catalog.revision < 0 ||
    !Array.isArray(catalog.nodes)
  ) {
    throw new Error(
      'The file must have schemaVersion 1 or 2, a revision number, and a nodes array.',
    );
  }
  if (catalog.nodes.length > 10000) throw new Error('The catalog can have at most 10,000 items.');
  if (
    catalog.description != null &&
    (typeof catalog.description !== 'string' || catalog.description.length > 10000)
  )
    throw new Error('The catalog scope must be text with at most 10,000 characters.');
  const byId = new Map();
  for (const node of catalog.nodes) {
    if (
      !node ||
      typeof node.id !== 'string' ||
      !/^[a-zA-Z0-9._-]{1,100}$/.test(node.id) ||
      byId.has(node.id)
    )
      throw new Error('Every item must have a unique ID.');
    if (!LEVELS.includes(node.level)) throw new Error('An item has an unsupported level.');
    if (typeof node.title !== 'string' || !node.title.trim() || node.title.length > 200)
      throw new Error('Each title must have between 1 and 200 characters.');
    if (typeof node.description !== 'string' || node.description.length > 10000)
      throw new Error('Descriptions must be text with at most 10,000 characters.');
    if (
      node.guidance != null &&
      (typeof node.guidance !== 'string' || node.guidance.length > 10000)
    )
      throw new Error('Scope guidance must be text with at most 10,000 characters.');
    if (!['skill', 'draft', 'user'].includes(node.origin))
      throw new Error('Each item must have a skill, draft, or user origin.');
    byId.set(node.id, node);
  }
  for (const node of catalog.nodes) {
    const level = LEVELS.indexOf(node.level);
    if (level === 0) {
      if (node.parentId !== null) throw new Error('A category cannot have a parent.');
    } else if (byId.get(node.parentId)?.level !== LEVELS[level - 1]) {
      throw new Error('Subcategories belong to categories, and kinds belong to subcategories.');
    }
  }
  if (catalog.schemaVersion === 2) validateDefinitions(catalog);
  // Older exports may have reference paths. Definitions now belong to this catalog.
  return { ...catalog, nodes: catalog.nodes.map(({ sourceRef, ...node }) => node) };
}

export function children(catalog, parentId) {
  return catalog.nodes.filter((node) => node.parentId === parentId);
}

export function descendants(catalog, id) {
  return children(catalog, id).flatMap((node) => [node, ...descendants(catalog, node.id)]);
}

export function changeCatalog(catalog, action) {
  const next = structuredClone(catalog);
  const node = next.nodes.find((item) => item.id === action.id);
  if (action.type === 'add') {
    next.nodes.push(action.node);
  } else if (action.type === 'updateCatalog') {
    if (action.field !== 'description') throw new Error('Only the catalog scope can be edited.');
    next.description = action.value;
  } else if (action.type === 'update') {
    if (!node) throw new Error('The item no longer exists.');
    if (!['title', 'description', 'guidance'].includes(action.field))
      throw new Error('Only titles, descriptions, and scope guidance can be edited.');
    node[action.field] = action.field === 'title' ? action.value.trim() : action.value;
  } else if (action.type === 'delete') {
    if (!node) throw new Error('The item no longer exists.');
    const removed = new Set([node.id, ...descendants(next, node.id).map((item) => item.id)]);
    next.nodes = next.nodes.filter((item) => !removed.has(item.id));
    if (next.applicability) {
      const removedLinks = new Set(
        next.applicability.filter((item) => removed.has(item.changeId)).map((item) => item.id),
      );
      next.applicability = next.applicability.filter(
        (item) => !removedLinks.has(item.id) && !removedLinks.has(item.inheritedFrom),
      );
    }
  } else if (action.type === 'move') {
    if (!node) throw new Error('The item no longer exists.');
    if (action.beforeId === node.id) return next;
    node.parentId = action.parentId;
    next.nodes = next.nodes.filter((item) => item.id !== node.id);
    if (action.beforeId != null) {
      const target = next.nodes.find((item) => item.id === action.beforeId);
      if (!target || target.parentId !== action.parentId || target.level !== node.level)
        throw new Error('The ordering target must be a sibling.');
      next.nodes.splice(next.nodes.indexOf(target), 0, node);
    } else {
      next.nodes.push(node);
    }
  } else if (action.type === 'record') {
    const rows = next[action.collection];
    if (!COLLECTIONS.includes(action.collection) || !rows)
      throw new Error('The collection is invalid.');
    const index = rows.findIndex((item) => item.id === action.record.id);
    if (index < 0) rows.push(action.record);
    else rows[index] = action.record;
  } else if (action.type === 'removeRecord') {
    removeRecord(next, action.collection, action.id);
  } else if (action.type === 'moveMitigation') {
    const item = next.mitigations.find((row) => row.id === action.id);
    if (!item) throw new Error('The mitigation does not exist.');
    if (action.beforeId === item.id) return next;
    item.parentId = action.parentId;
    next.mitigations = next.mitigations.filter((row) => row.id !== item.id);
    const target = next.mitigations.find((row) => row.id === action.beforeId);
    if (action.beforeId && (!target || target.parentId !== item.parentId))
      throw new Error('The ordering target must be a sibling.');
    if (target) next.mitigations.splice(next.mitigations.indexOf(target), 0, item);
    else next.mitigations.push(item);
  } else {
    throw new Error('The catalog operation is not supported.');
  }
  return validateCatalog(next);
}

export const COLLECTIONS = [
  'mitigations',
  'criteria',
  'applicability',
  'rules',
  'ruleMitigations',
  'relations',
  'outcomes',
];
const textFields = [
  'title',
  'description',
  'guidance',
  'purpose',
  'mechanism',
  'scope',
  'evidence',
  'maturity',
  'limits',
  'adverseEffects',
  'reason',
  'condition',
  'statement',
  'kind',
];
function validateDefinitions(catalog) {
  const maps = {};
  for (const name of COLLECTIONS) {
    const rows = catalog[name];
    if (!Array.isArray(rows) || rows.length > 50000)
      throw new Error(`${name} must be an array with at most 50,000 records.`);
    maps[name] = new Map();
    for (const row of rows) {
      if (
        !row ||
        typeof row.id !== 'string' ||
        !/^[a-zA-Z0-9._-]{1,100}$/.test(row.id) ||
        maps[name].has(row.id)
      )
        throw new Error(`${name} has an invalid or duplicate ID.`);
      for (const field of textFields)
        if (
          row[field] != null &&
          (typeof row[field] !== 'string' || row[field].length > (field === 'title' ? 200 : 10000))
        )
          throw new Error(`${field} must be text within its length limit.`);
      if (['mitigations', 'outcomes', 'rules'].includes(name) && !row.title?.trim())
        throw new Error('A definition needs a title.');
      maps[name].set(row.id, row);
    }
  }
  for (const row of catalog.mitigations) {
    if (
      !['group', 'control'].includes(row.kind) ||
      !['skill', 'draft', 'user'].includes(row.origin)
    )
      throw new Error('A mitigation needs a kind and origin.');
    if (row.kind === 'control' && row.parentId === null)
      throw new Error('A control must belong to a mitigation group.');
    if (row.parentId !== null && maps.mitigations.get(row.parentId)?.kind !== 'group')
      throw new Error('A mitigation parent must be a group.');
    const seen = new Set([row.id]);
    let parent = row.parentId;
    while (parent) {
      if (seen.has(parent)) throw new Error('Mitigation groups cannot have cycles.');
      seen.add(parent);
      parent = maps.mitigations.get(parent)?.parentId;
    }
  }
  const control = (id) => maps.mitigations.get(id)?.kind === 'control';
  for (const row of catalog.criteria) {
    if (
      !control(row.mitigationId) ||
      !row.statement?.trim() ||
      !['existence', 'coverage', 'use', 'exercise', 'limits', 'adverse_effects'].includes(row.kind)
    )
      throw new Error('A criterion needs a control, a kind, and a statement.');
  }
  const changes = new Map(catalog.nodes.map((row) => [row.id, row]));
  for (const row of catalog.applicability) {
    if (
      !changes.has(row.changeId) ||
      !control(row.mitigationId) ||
      !['include', 'exclude'].includes(row.effect) ||
      typeof row.inherit !== 'boolean' ||
      !row.reason?.trim()
    )
      throw new Error(
        'An applicability link needs existing endpoints, a reason, effect, and inheritance policy.',
      );
    if (
      !Array.isArray(row.outcomeIds) ||
      row.outcomeIds.some((id) => !maps.outcomes.has(id)) ||
      new Set(row.outcomeIds).size !== row.outcomeIds.length
    )
      throw new Error('Protected outcomes must be unique existing definitions.');
    if (row.effect === 'exclude') {
      const baseline = maps.applicability.get(row.inheritedFrom);
      if (
        !baseline ||
        baseline.effect !== 'include' ||
        baseline.mitigationId !== row.mitigationId ||
        baseline.id === row.id
      )
        throw new Error('An exception must reference an inclusion for the same mitigation.');
    } else if (row.inheritedFrom != null)
      throw new Error('An inclusion cannot reference an exception baseline.');
  }
  for (const row of catalog.ruleMitigations)
    if (!maps.rules.has(row.ruleId) || !control(row.mitigationId))
      throw new Error('A conditional rule link needs existing endpoints.');
  for (const row of catalog.relations) {
    if (
      !control(row.sourceId) ||
      !control(row.targetId) ||
      row.sourceId === row.targetId ||
      !['requires', 'alternative', 'shared_failure'].includes(row.kind) ||
      !row.reason?.trim()
    )
      throw new Error('A mitigation relation needs distinct controls, a type, and a reason.');
  }
  const visiting = new Set(),
    visited = new Set();
  function visit(id) {
    if (visiting.has(id)) throw new Error('Prerequisite relations cannot have cycles.');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const edge of catalog.relations.filter(
      (row) => row.kind === 'requires' && row.sourceId === id,
    ))
      visit(edge.targetId);
    visiting.delete(id);
    visited.add(id);
  }
  catalog.mitigations.forEach((row) => visit(row.id));
}
function removeRecord(catalog, collection, id) {
  if (!COLLECTIONS.includes(collection)) throw new Error('The collection is invalid.');
  const removed = new Set([id]);
  if (collection === 'mitigations') {
    let size;
    do {
      size = removed.size;
      catalog.mitigations
        .filter((row) => removed.has(row.parentId))
        .forEach((row) => removed.add(row.id));
    } while (size !== removed.size);
    catalog.criteria = catalog.criteria.filter((row) => !removed.has(row.mitigationId));
    catalog.ruleMitigations = catalog.ruleMitigations.filter(
      (row) => !removed.has(row.mitigationId),
    );
    catalog.relations = catalog.relations.filter(
      (row) => !removed.has(row.sourceId) && !removed.has(row.targetId),
    );
    const links = new Set(
      catalog.applicability.filter((row) => removed.has(row.mitigationId)).map((row) => row.id),
    );
    catalog.applicability = catalog.applicability.filter(
      (row) => !links.has(row.id) && !links.has(row.inheritedFrom),
    );
  }
  if (collection === 'rules')
    catalog.ruleMitigations = catalog.ruleMitigations.filter((row) => !removed.has(row.ruleId));
  if (collection === 'outcomes')
    catalog.applicability.forEach((row) => {
      row.outcomeIds = row.outcomeIds.filter((value) => value !== id);
    });
  if (collection === 'applicability')
    catalog.applicability = catalog.applicability.filter((row) => row.inheritedFrom !== id);
  catalog[collection] = catalog[collection].filter((row) => !removed.has(row.id));
}
export function ancestry(catalog, id) {
  const chain = [];
  let row = catalog.nodes.find((node) => node.id === id);
  while (row) {
    chain.unshift(row);
    row = catalog.nodes.find((node) => node.id === row.parentId);
  }
  return chain;
}
export function effectiveLinks(catalog, changeId) {
  const chain = ancestry(catalog, changeId),
    ids = new Set(chain.map((row) => row.id));
  const applicable = (catalog.applicability || []).filter(
    (row) => ids.has(row.changeId) && (row.changeId === changeId || row.inherit),
  );
  const exceptions = applicable.filter((row) => row.effect === 'exclude');
  return applicable
    .filter((row) => row.effect === 'include')
    .map((row) => ({
      ...row,
      inherited: row.changeId !== changeId,
      excludedBy: exceptions.filter(
        (exception) =>
          exception.inheritedFrom === row.id &&
          chain.findIndex((n) => n.id === exception.changeId) >
            chain.findIndex((n) => n.id === row.changeId),
      ),
    }));
}
export function effectiveControls(catalog, changeId) {
  const grouped = new Map();
  for (const link of effectiveLinks(catalog, changeId)) {
    if (!grouped.has(link.mitigationId))
      grouped.set(link.mitigationId, {
        mitigation: catalog.mitigations.find((row) => row.id === link.mitigationId),
        links: [],
        active: false,
      });
    const item = grouped.get(link.mitigationId);
    item.links.push(link);
    item.active ||= !link.excludedBy.length;
  }
  return [...grouped.values()];
}
