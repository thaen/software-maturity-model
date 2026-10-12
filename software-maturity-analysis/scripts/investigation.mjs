import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCatalog, effectiveLinks } from './catalog.mjs';

const collections = [
  'conditions',
  'investigations',
  'expectedControls',
  'controlSelections',
  'findings',
  'claims',
  'mechanisms',
  'mechanismMitigations',
  'mechanismRelations',
  'controlOutcomes',
  'observations',
  'evidence',
  'observationEvidence',
  'claimObservations',
  'investigationObservations',
];
const key = (...values) =>
  createHash('sha256').update(JSON.stringify(values)).digest('hex').slice(0, 24);
const snapshotId = (catalog) => createHash('sha256').update(JSON.stringify(catalog)).digest('hex');
const fail = (message) => {
  throw new Error(message);
};
const statuses = ['present', 'partial', 'absent', 'unknown', 'not_applicable'];
const dispositions = ['pending', 'selected', 'excluded', 'unresolved'];
export function prepare(catalog, system) {
  catalog = validateCatalog(catalog);
  if (catalog.schemaVersion !== 2) fail('An investigation needs a version 2 catalog export.');
  if (
    !system?.id ||
    !system.title ||
    !system.description ||
    !Array.isArray(system.boundaries) ||
    !system.boundaries.length
  )
    fail('The system needs an ID, title, description, and at least one defined boundary.');
  const ids = new Set();
  for (const boundary of system.boundaries) {
    if (!boundary.id || ids.has(boundary.id) || !boundary.description)
      fail('Each boundary needs a unique ID and description.');
    ids.add(boundary.id);
  }
  const bundle = {
    schemaVersion: 1,
    run: {
      id: randomUUID(),
      catalogSnapshotId: snapshotId(catalog),
      createdAt: new Date().toISOString(),
      state: 'draft',
      systemId: system.id,
      inputRevision: system.inputRevision || '',
      limits: '',
    },
    catalog,
    system,
    ...Object.fromEntries(collections.map((name) => [name, []])),
  };
  for (const boundary of system.boundaries)
    for (const change of catalog.nodes) {
      const investigation = {
        id: key(boundary.id, change.id),
        boundaryId: boundary.id,
        changeId: change.id,
        disposition: 'pending',
        reason: '',
        searchScope: '',
      };
      bundle.investigations.push(investigation);
      for (const link of effectiveLinks(catalog, change.id).filter((row) => row.condition))
        bundle.conditions.push({
          id: key(investigation.id, link.id),
          investigationId: investigation.id,
          ruleId: null,
          applicabilityId: link.id,
          disposition: 'pending',
          reason: '',
        });
      for (const rule of catalog.rules)
        bundle.conditions.push({
          id: key(investigation.id, rule.id),
          investigationId: investigation.id,
          ruleId: rule.id,
          applicabilityId: null,
          disposition: 'pending',
          reason: '',
        });
    }
  return scaffold(bundle);
}
export function scaffold(bundle) {
  const c = bundle.catalog,
    oldExpected = new Map(bundle.expectedControls.map((row) => [row.id, row]));
  const oldFindings = new Map(bundle.findings.map((row) => [row.id, row])),
    oldClaims = new Map(bundle.claims.map((row) => [row.id, row]));
  bundle.expectedControls = [];
  bundle.controlSelections = [];
  bundle.findings = [];
  bundle.claims = [];
  for (const investigation of bundle.investigations) {
    const candidates = new Map();
    const add = (mitigationId, selection) => {
      if (!candidates.has(mitigationId)) candidates.set(mitigationId, []);
      candidates.get(mitigationId).push(selection);
    };
    for (const link of effectiveLinks(c, investigation.changeId))
      add(link.mitigationId, {
        applicabilityId: link.id,
        ruleId: null,
        relationId: null,
        manualReason: null,
        excludedBy: link.excludedBy.map((row) => row.id),
      });
    for (const condition of bundle.conditions.filter(
      (row) =>
        row.investigationId === investigation.id &&
        row.ruleId &&
        ['selected', 'unresolved'].includes(row.disposition),
    ))
      for (const link of c.ruleMitigations.filter((row) => row.ruleId === condition.ruleId))
        add(link.mitigationId, {
          applicabilityId: null,
          ruleId: condition.ruleId,
          relationId: null,
          manualReason: null,
          excludedBy: [],
        });
    // Prerequisites remain candidate rows. They require scope-specific tailoring rather than automatic claims of applicability.
    let size;
    do {
      size = candidates.size;
      for (const relation of c.relations.filter(
        (row) => row.kind === 'requires' && candidates.has(row.sourceId),
      )) {
        if (!candidates.has(relation.targetId))
          add(relation.targetId, {
            applicabilityId: null,
            ruleId: null,
            relationId: relation.id,
            manualReason: null,
            excludedBy: [],
          });
      }
    } while (size !== candidates.size);
    for (const old of oldExpected.values())
      if (old.investigationId === investigation.id && old.manualReason)
        add(old.mitigationId, {
          applicabilityId: null,
          ruleId: null,
          relationId: null,
          manualReason: old.manualReason,
          excludedBy: [],
        });
    for (const [mitigationId, selections] of candidates) {
      const id = key(investigation.id, mitigationId),
        row = oldExpected.get(id) || {
          id,
          investigationId: investigation.id,
          mitigationId,
          disposition: 'pending',
          reason: '',
          manualReason: null,
        };
      bundle.expectedControls.push(row);
      selections.forEach((selection, index) =>
        bundle.controlSelections.push({
          id: key(id, index, selection),
          expectedControlId: id,
          ...selection,
        }),
      );
      const findingId = key(id, 'finding');
      bundle.findings.push(
        oldFindings.get(findingId) || {
          id: findingId,
          expectedControlId: id,
          state: 'pending',
          status: null,
          conclusion: '',
          searchScope: '',
          limits: '',
        },
      );
      for (const criterion of c.criteria.filter((row) => row.mitigationId === mitigationId)) {
        const claimId = key(findingId, criterion.id);
        bundle.claims.push(
          oldClaims.get(claimId) || {
            id: claimId,
            findingId,
            criterionId: criterion.id,
            state: 'pending',
            status: null,
            conclusion: '',
            limits: '',
          },
        );
      }
    }
  }
  return bundle;
}
export function validateInvestigation(bundle, { complete = false } = {}) {
  if (bundle.schemaVersion !== 1 || !bundle.run || !bundle.system)
    fail('The investigation format is invalid.');
  const c = validateCatalog(bundle.catalog);
  if (snapshotId(c) !== bundle.run.catalogSnapshotId)
    fail('The captured catalog changed. Prepare a run from the intended export.');
  if (bundle.run.systemId !== bundle.system.id) fail('The run must reference its system.');
  const maps = {};
  for (const name of collections) {
    if (!Array.isArray(bundle[name])) fail(`${name} must be an array.`);
    maps[name] = new Map();
    for (const row of bundle[name]) {
      if (!row.id || maps[name].has(row.id)) fail(`${name} has a missing or duplicate ID.`);
      maps[name].set(row.id, row);
    }
  }
  const boundaries = new Set(bundle.system.boundaries.map((row) => row.id)),
    changes = new Set(c.nodes.map((row) => row.id)),
    controls = new Map(
      c.mitigations.filter((row) => row.kind === 'control').map((row) => [row.id, row]),
    ),
    criteria = new Map(c.criteria.map((row) => [row.id, row]));
  const requireRef = (name, id) => {
    if (!maps[name]?.has(id)) fail(`Missing ${name} reference ${id}.`);
    return maps[name].get(id);
  };
  const inventory = new Set();
  for (const row of bundle.investigations) {
    if (
      !boundaries.has(row.boundaryId) ||
      !changes.has(row.changeId) ||
      !dispositions.includes(row.disposition)
    )
      fail('An investigation has an invalid boundary, change, or disposition.');
    const pair = key(row.boundaryId, row.changeId);
    if (inventory.has(pair)) fail('The change inventory has a duplicate pair.');
    inventory.add(pair);
    if (complete && (row.disposition === 'pending' || !row.reason?.trim()))
      fail('Every change needs a determination and reason.');
  }
  for (const boundary of boundaries)
    for (const change of changes)
      if (!inventory.has(key(boundary, change))) fail('The inventory omits a catalog change.');
  const conditions = new Set();
  for (const row of bundle.conditions) {
    requireRef('investigations', row.investigationId);
    if (
      Boolean(row.ruleId) === Boolean(row.applicabilityId) ||
      (row.ruleId
        ? !c.rules.some((rule) => rule.id === row.ruleId)
        : !effectiveLinks(c, maps.investigations.get(row.investigationId).changeId).some(
            (link) => link.id === row.applicabilityId && link.condition,
          )) ||
      !dispositions.includes(row.disposition)
    )
      fail('A condition has an invalid rule or disposition.');
    const pair = key(row.investigationId, row.ruleId || row.applicabilityId);
    if (conditions.has(pair)) fail('A condition determination is duplicated.');
    conditions.add(pair);
    if (complete && (row.disposition === 'pending' || !row.reason?.trim()))
      fail('Every condition needs a determination and reason.');
  }
  for (const investigation of bundle.investigations)
    for (const rule of c.rules)
      if (!conditions.has(key(investigation.id, rule.id)))
        fail('A condition determination is missing.');
  for (const investigation of bundle.investigations)
    for (const link of effectiveLinks(c, investigation.changeId).filter((row) => row.condition))
      if (!conditions.has(key(investigation.id, link.id)))
        fail('An applicability condition determination is missing.');
  const rebuilt = scaffold(structuredClone(bundle));
  if (
    JSON.stringify(rebuilt.controlSelections) !== JSON.stringify(bundle.controlSelections) ||
    rebuilt.expectedControls.length !== bundle.expectedControls.length
  )
    fail(
      'The expected work differs from its definitions. Run scaffold after tailoring conditions.',
    );
  const expectedPairs = new Set();
  for (const row of bundle.expectedControls) {
    requireRef('investigations', row.investigationId);
    if (!controls.has(row.mitigationId) || !dispositions.includes(row.disposition))
      fail('An expected control has an invalid definition or disposition.');
    const pair = key(row.investigationId, row.mitigationId);
    if (expectedPairs.has(pair)) fail('An expected control is duplicated.');
    expectedPairs.add(pair);
    if (complete && (row.disposition === 'pending' || !row.reason?.trim()))
      fail('Every candidate control needs a determination and reason.');
  }
  if (
    JSON.stringify(bundle.findings.map((row) => [row.id, row.expectedControlId]).sort()) !==
      JSON.stringify(rebuilt.findings.map((row) => [row.id, row.expectedControlId]).sort()) ||
    JSON.stringify(bundle.claims.map((row) => [row.id, row.findingId, row.criterionId]).sort()) !==
      JSON.stringify(rebuilt.claims.map((row) => [row.id, row.findingId, row.criterionId]).sort())
  )
    fail('The expected finding or criterion claim set is incomplete.');
  const findingOwners = new Set();
  for (const finding of bundle.findings) {
    const expected = requireRef('expectedControls', finding.expectedControlId);
    if (findingOwners.has(expected.id)) fail('An expected control has multiple findings.');
    findingOwners.add(expected.id);
    if (!['pending', 'complete'].includes(finding.state))
      fail('A finding has an invalid workflow state.');
    if (
      complete &&
      (finding.state !== 'complete' ||
        !statuses.includes(finding.status) ||
        !finding.conclusion?.trim())
    )
      fail('A finding is unfinished.');
    if (finding.status === 'absent' && !finding.searchScope?.trim())
      fail('Absence requires a bounded search scope.');
    if (finding.status === 'unknown' && !finding.limits?.trim())
      fail('Unknown requires an evidence or access limit.');
    if (complete && expected.disposition === 'unresolved' && finding.status !== 'unknown')
      fail('An unresolved control needs an unknown finding.');
    if (
      complete &&
      ['present', 'partial', 'absent'].includes(finding.status) &&
      !c.criteria.some((row) => row.mitigationId === expected.mitigationId)
    )
      fail('A substantive finding needs a defined assessment criterion.');
    if (complete && expected.disposition === 'excluded' && finding.status !== 'not_applicable')
      fail('An excluded control needs a not-applicable finding.');
  }
  const claimPairs = new Set();
  for (const claim of bundle.claims) {
    const finding = requireRef('findings', claim.findingId),
      expected = requireRef('expectedControls', finding.expectedControlId),
      criterion = criteria.get(claim.criterionId);
    if (criterion?.mitigationId !== expected.mitigationId)
      fail('A claim criterion belongs to another mitigation.');
    const pair = key(claim.findingId, claim.criterionId);
    if (claimPairs.has(pair)) fail('A criterion claim is duplicated.');
    claimPairs.add(pair);
    if (!['pending', 'complete'].includes(claim.state))
      fail('A claim has an invalid workflow state.');
    if (
      complete &&
      (claim.state !== 'complete' || !statuses.includes(claim.status) || !claim.conclusion?.trim())
    )
      fail('A criterion claim is unfinished.');
    if (claim.status === 'unknown' && !claim.limits?.trim())
      fail('An unknown claim needs an evidence limit.');
  }
  const approved = new Map(
    (bundle.system.approvedImplementations || []).map((row) => [row.id, row]),
  );
  for (const row of approved.values())
    if (
      !row.id ||
      !row.title ||
      !Array.isArray(row.mitigationIds) ||
      row.mitigationIds.some((id) => !controls.has(id))
    )
      fail('An approved practice needs an ID, title, and known mitigation definitions.');
  for (const row of bundle.mechanisms) {
    if(complete && ['owner','configuration','coverage'].some(field=>!row[field]?.trim()))fail('A mechanism needs its owner, configuration, and coverage, with unknowns stated.');
    if (row.approvedImplementationId && !approved.has(row.approvedImplementationId))
      fail('A mechanism refers to an unknown approved implementation.');
    if (!boundaries.has(row.boundaryId) || !row.description?.trim())
      fail('A mechanism needs a boundary and description.');
  }
  for (const row of bundle.mechanismMitigations) {
    if(complete&&!row.reason?.trim())fail('A mechanism classification needs a reason.');
    requireRef('mechanisms', row.mechanismId);
    if (!controls.has(row.mitigationId)) fail('A mechanism maps to a missing control.');
  }
  for (const row of bundle.mechanismRelations) {
    const source = requireRef('mechanisms', row.sourceId),
      target = requireRef('mechanisms', row.targetId);
    if (
      source.id === target.id ||
      source.boundaryId !== target.boundaryId ||
      !['requires', 'alternative', 'shared_failure'].includes(row.kind) ||
      !row.reason?.trim()
    )
      fail(
        'A mechanism relation needs distinct endpoints in the same boundary, a type, and reason.',
      );
  }
  const outcomes = new Set((bundle.system.outcomes || []).map((row) => row.id));
  for (const row of bundle.system.outcomes || [])
    if (!row.id || !c.outcomes.some((outcome) => outcome.id === row.definitionId))
      fail('A system outcome refers to an unknown outcome definition.');
  for (const row of bundle.controlOutcomes) {
    requireRef('expectedControls', row.expectedControlId);
    if (!outcomes.has(row.systemOutcomeId) || !row.reason?.trim())
      fail('A control outcome needs an existing system outcome and reason.');
  }
  for (const row of bundle.observations) {
    if (!boundaries.has(row.boundaryId) || !row.statement?.trim())
      fail('An observation needs a boundary and statement.');
    if (row.mechanismId && requireRef('mechanisms', row.mechanismId).boundaryId !== row.boundaryId)
      fail('The observation and mechanism have different boundaries.');
  }
  for (const row of bundle.evidence) {
    if(complete&&!row.scope?.trim())fail('Evidence needs its inspected scope.');
    if (
      !row.uri ||
      !row.locator ||
      !row.result ||
      !row.capturedAt ||
      !['examine', 'interview', 'test'].includes(row.method)
    )
      fail('Evidence needs a URI, locator, inspected result or excerpt, method, and capture time.');
  }
  for (const row of bundle.observationEvidence) {
    requireRef('observations', row.observationId);
    requireRef('evidence', row.evidenceId);
    if (!['supports', 'challenges', 'context'].includes(row.relation) || !row.reason?.trim())
      fail('An evidence link needs a relation and rationale.');
  }
  for (const row of bundle.claimObservations) {
    const claim = requireRef('claims', row.claimId),
      finding = requireRef('findings', claim.findingId),
      expected = requireRef('expectedControls', finding.expectedControlId),
      investigation = requireRef('investigations', expected.investigationId),
      observation = requireRef('observations', row.observationId);
    if (investigation.boundaryId !== observation.boundaryId)
      fail('A claim and its observation have different boundaries.');
    if (!['supports', 'challenges', 'context'].includes(row.relation) || !row.reason?.trim())
      fail('An inference needs a relation and rationale.');
  }
  for (const row of bundle.investigationObservations) {
    const investigation = requireRef('investigations', row.investigationId),
      observation = requireRef('observations', row.observationId);
    if (investigation.boundaryId !== observation.boundaryId || !row.reason?.trim())
      fail('An applicability observation needs the same boundary and a rationale.');
  }
  if (complete)
    for (const claim of bundle.claims.filter((row) =>
      ['present', 'partial', 'absent'].includes(row.status),
    )) {
      const links = bundle.claimObservations.filter((row) => row.claimId === claim.id);
      if (
        !links.length ||
        !links.some((link) =>
          bundle.observationEvidence.some((row) => row.observationId === link.observationId),
        )
      )
        fail('A substantive claim needs an observation grounded in evidence.');
    }
  return {
    changes: bundle.investigations.length,
    expectedControls: bundle.expectedControls.length,
    claims: bundle.claims.length,
    pendingClaims: bundle.claims.filter((row) => row.state === 'pending').length,
  };
}
export function prepareReview(bundle) {
  validateInvestigation(bundle, { complete: true });
  if (bundle.run.state !== 'complete') fail('The review requires a completed assessment run.');
  const review = {
    schemaVersion: 1,
    id: randomUUID(),
    assessmentId: bundle.run.id,
    assessmentDigest: snapshotId(bundle),
    state: 'draft',
    createdAt: new Date().toISOString(),
    reviewer: '',
    changes: [],
    evidenceLinks: [],
    inferences: [],
    claims: [],
  };
  for (const [name, source] of [
    ['changes', 'investigations'],
    ['evidenceLinks', 'observationEvidence'],
    ['inferences', 'claimObservations'],
    ['claims', 'claims'],
  ])
    review[name] = bundle[source].map((row) => ({
      id: key(review.id, name, row.id),
      targetId: row.id,
      state: 'pending',
      verdict: null,
      reason: '',
    }));
  return review;
}
export function validateReview(review, bundle, { complete = false } = {}) {
  if (review.assessmentId !== bundle.run.id || review.assessmentDigest !== snapshotId(bundle))
    fail('The review targets a different or changed assessment.');
  for (const [name, source] of [
    ['changes', 'investigations'],
    ['evidenceLinks', 'observationEvidence'],
    ['inferences', 'claimObservations'],
    ['claims', 'claims'],
  ]) {
    const ids = new Set(bundle[source].map((row) => row.id));
    if (!Array.isArray(review[name]) || review[name].length !== ids.size)
      fail(`The review omits ${name} targets.`);
    for (const row of review[name]) {
      if (!ids.delete(row.targetId)) fail(`The review has an invalid or duplicate ${name} target.`);
      if (
        complete &&
        (row.state !== 'complete' ||
          !['supported', 'unsupported', 'partially_supported', 'unable_to_verify'].includes(
            row.verdict,
          ) ||
          !row.reason?.trim())
      )
        fail('Every review target needs a verdict and explanation.');
    }
  }
  if (complete && !review.reviewer?.trim()) fail('The review needs a reviewer.');
  return true;
}
export function workItem(bundle, boundaryId, changeId) {
  const investigation = bundle.investigations.find(
    (row) => row.boundaryId === boundaryId && row.changeId === changeId,
  );
  if (!investigation) fail('That boundary/change work item does not exist.');
  const expectedControls = bundle.expectedControls.filter(
      (row) => row.investigationId === investigation.id,
    ),
    ids = new Set(expectedControls.map((row) => row.id)),
    findings = bundle.findings.filter((row) => ids.has(row.expectedControlId)),
    findingIds = new Set(findings.map((row) => row.id));
  return {
    run: bundle.run,
    system: bundle.system,
    boundary: bundle.system.boundaries.find((row) => row.id === boundaryId),
    change: bundle.catalog.nodes.find((row) => row.id === changeId),
    conditions: bundle.conditions
      .filter((row) => row.investigationId === investigation.id)
      .map((row) => ({
        ...row,
        definition: row.ruleId
          ? bundle.catalog.rules.find((rule) => rule.id === row.ruleId)
          : bundle.catalog.applicability.find((link) => link.id === row.applicabilityId),
      })),
    investigation,
    expectedControls,
    controlSelections: bundle.controlSelections.filter((row) => ids.has(row.expectedControlId)),
    mitigations: bundle.catalog.mitigations.filter((row) =>
      expectedControls.some((expected) => expected.mitigationId === row.id),
    ),
    criteria: bundle.catalog.criteria.filter((row) =>
      expectedControls.some((expected) => expected.mitigationId === row.mitigationId),
    ),
    findings,
    claims: bundle.claims.filter((row) => findingIds.has(row.findingId)),
  };
}
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const write = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, a, b, out] = process.argv.slice(2);
    if (command === 'prepare') write(out, prepare(read(a), read(b)));
    else if (command === 'scaffold') write(b, scaffold(read(a)));
    else if (command === 'validate')
      console.log(validateInvestigation(read(a), { complete: b === '--complete' }));
    else if (command === 'work-item')
      console.log(JSON.stringify(workItem(read(a), b, out), null, 2));
    else if (command === 'review') write(b, prepareReview(read(a)));
    else if (command === 'validate-review')
      console.log(validateReview(read(a), read(b), { complete: out === '--complete' }));
    else
      fail(
        'Commands are prepare, scaffold, validate, work-item, review, and validate-review. See the Skill record format.',
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
