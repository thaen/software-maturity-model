export const LEVELS = ['category', 'subcategory', 'kind'];

export function validateCatalog(catalog) {
  if (!catalog || catalog.schemaVersion !== 1 || !Number.isSafeInteger(catalog.revision) || catalog.revision < 0 || !Array.isArray(catalog.nodes)) {
    throw new Error('The file must have schemaVersion 1, a revision number, and a nodes array.');
  }
  if (catalog.nodes.length > 10000) throw new Error('The catalog can have at most 10,000 items.');
  const byId = new Map();
  for (const node of catalog.nodes) {
    if (!node || typeof node.id !== 'string' || !/^[a-zA-Z0-9._-]{1,100}$/.test(node.id) || byId.has(node.id)) throw new Error('Every item must have a unique ID.');
    if (!LEVELS.includes(node.level)) throw new Error('An item has an unsupported level.');
    if (typeof node.title !== 'string' || !node.title.trim() || node.title.length > 200) throw new Error('Each title must have between 1 and 200 characters.');
    if (typeof node.description !== 'string' || node.description.length > 10000) throw new Error('Descriptions must be text with at most 10,000 characters.');
    if (node.sourceRef != null && (typeof node.sourceRef !== 'string' || !/^software-maturity-analysis\/references\/source-profiles\/s[1-9]-[a-z-]+\.md$/.test(node.sourceRef))) throw new Error('The skill reference is not a source-profile path.');
    if (!['skill', 'draft', 'user'].includes(node.origin)) throw new Error('Each item must have a skill, draft, or user origin.');
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
  return catalog;
}

export function children(catalog, parentId) {
  return catalog.nodes.filter(node => node.parentId === parentId);
}

export function descendants(catalog, id) {
  return children(catalog, id).flatMap(node => [node, ...descendants(catalog, node.id)]);
}

export function changeCatalog(catalog, action) {
  const next = structuredClone(catalog);
  const node = next.nodes.find(item => item.id === action.id);
  if (action.type === 'add') {
    next.nodes.push(action.node);
  } else if (action.type === 'update') {
    if (!node) throw new Error('The item no longer exists.');
    if (!['title', 'description'].includes(action.field)) throw new Error('Only titles and descriptions can be edited.');
    node[action.field] = action.field === 'title' ? action.value.trim() : action.value;
  } else if (action.type === 'delete') {
    if (!node) throw new Error('The item no longer exists.');
    const removed = new Set([node.id, ...descendants(next, node.id).map(item => item.id)]);
    next.nodes = next.nodes.filter(item => !removed.has(item.id));
  } else if (action.type === 'move') {
    if (!node) throw new Error('The item no longer exists.');
    if (action.beforeId === node.id) return next;
    node.parentId = action.parentId;
    next.nodes = next.nodes.filter(item => item.id !== node.id);
    if (action.beforeId != null) {
      const target = next.nodes.find(item => item.id === action.beforeId);
      if (!target || target.parentId !== action.parentId || target.level !== node.level) throw new Error('The ordering target must be a sibling.');
      next.nodes.splice(next.nodes.indexOf(target), 0, node);
    } else {
      next.nodes.push(node);
    }
  } else {
    throw new Error('The catalog operation is not supported.');
  }
  return validateCatalog(next);
}
