import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from './fixtures/definitions.mjs';
import {
  prepare,
  scaffold,
  validateInvestigation,
  prepareReview,
  validateReview,
  workItem,
} from '../../software-maturity-analysis/scripts/investigation.mjs';
const system = () => ({
  id: 'system',
  title: 'Example API',
  description: 'The API and its operator support path.',
  inputRevision: 'abc',
  boundaries: [{ id: 'api', description: 'The request path.' }],
});
function completeRun() {
  const run = prepare(fixture(), system());
  run.investigations.forEach((row) => {
    row.disposition = 'selected';
    row.reason = 'The path is within this boundary.';
  });
  run.expectedControls.forEach((row) => {
    row.disposition = 'selected';
    row.reason = 'This path needs the control.';
  });
  run.findings.forEach((row) => {
    row.state = 'complete';
    row.status = 'present';
    row.conclusion = 'The implementation is present in the inspected path.';
  });
  run.claims.forEach((row) => {
    row.state = 'complete';
    row.status = 'present';
    row.conclusion = 'The control implementation exists.';
  });
  run.observations.push({
    id: 'observation',
    boundaryId: 'api',
    statement: 'The limiter is defined in this source file.',
  });
  run.evidence.push({
    id: 'evidence',
    uri: 'https://example.com/code',
    revision: 'abc',
    locator: 'limiter.js:12',
    result: 'The source defines a limiter function.',
    method: 'examine',
    scope: 'The definition, without route coverage.',
    capturedAt: '2026-10-12T00:00:00Z',
  });
  run.observationEvidence.push({
    id: 'oe',
    observationId: 'observation',
    evidenceId: 'evidence',
    relation: 'supports',
    reason: 'The source defines the function.',
  });
  run.claims.forEach((row, i) =>
    run.claimObservations.push({
      id: 'co-' + i,
      claimId: row.id,
      observationId: 'observation',
      relation: 'supports',
      reason: 'The definition establishes implementation existence.',
    }),
  );
  run.run.state = 'complete';
  return run;
}
test('preparation inventories every change, retains criteria, and returns a narrow work item', () => {
  const c = fixture();
  c.rules.push({
    id: 'rule',
    title: 'Persistent state changes',
    condition: 'State changes.',
    description: '',
  });
  c.ruleMitigations.push({ id: 'rule-b', ruleId: 'rule', mitigationId: 'b' });
  c.applicability[0].condition = 'The path changes behavior.';
  const run = prepare(c, system());
  assert.equal(run.investigations.length, c.nodes.length);
  assert.equal(run.conditions.length, c.nodes.length + 2);
  assert.ok(run.claims.every((row) => row.state === 'pending' && row.status === null));
  assert.equal(validateInvestigation(run).changes, 4);
  const selectedCondition = run.conditions.find(
    (row) =>
      row.ruleId === 'rule' &&
      row.investigationId === run.investigations.find((i) => i.changeId === 'kind').id,
  );
  selectedCondition.disposition = 'selected';
  selectedCondition.reason = 'The state condition is material.';
  scaffold(run);
  const item = workItem(run, 'api', 'kind');
  assert.equal(item.change.id, 'kind');
  assert.ok(item.mitigations.some((row) => row.id === 'b'));
  assert.equal(item.investigation.boundaryId, 'api');
  const condition = run.conditions.find(
    (row) => row.ruleId === 'rule' && row.investigationId === item.investigation.id,
  );
  condition.disposition = 'excluded';
  condition.reason = 'No persistent state is on this path.';
  scaffold(run);
  assert.ok(!workItem(run, 'api', 'kind').mitigations.some((row) => row.id === 'b'));
  assert.equal(validateInvestigation(run).pendingClaims, run.claims.length);
});
test('validation rejects omitted work, altered definitions, foreign criteria, cross-boundary observations, and unsupported structural claims', () => {
  const run = completeRun();
  assert.doesNotThrow(() => validateInvestigation(run, { complete: true }));
  let changed = structuredClone(run);
  changed.investigations.pop();
  assert.throws(() => validateInvestigation(changed), /omits/);
  changed = structuredClone(run);
  changed.catalog.nodes[0].description = 'A rewritten definition.';
  assert.throws(() => validateInvestigation(changed), /captured catalog/);
  changed = structuredClone(run);
  changed.claims.pop();
  assert.throws(() => validateInvestigation(changed), /incomplete/);
  changed = structuredClone(run);
  changed.claims[0].criterionId = 'other';
  assert.throws(() => validateInvestigation(changed), /incomplete|another mitigation/);
  changed = structuredClone(run);
  changed.system.boundaries.push({ id: 'worker', description: 'Worker' });
  changed.observations[0].boundaryId = 'worker';
  assert.throws(() => validateInvestigation(changed), /omits|different boundaries/);
  changed = structuredClone(run);
  changed.observationEvidence = [];
  assert.throws(() => validateInvestigation(changed, { complete: true }), /grounded in evidence/);
});
test('unknown can finish with a stated limit, while absence requires a bounded search', () => {
  const run = completeRun();
  run.claims[0].status = 'unknown';
  run.claims[0].limits = 'Configuration access is unavailable.';
  run.findings[0].status = 'unknown';
  run.findings[0].limits = 'Configuration access is unavailable.';
  assert.doesNotThrow(() => validateInvestigation(run, { complete: true }));
  run.findings[0].status = 'absent';
  assert.throws(() => validateInvestigation(run, { complete: true }), /bounded search/);
});
test('review covers all changes and checks evidence and inference separately, allowing failed conclusions', () => {
  const run = completeRun(),
    review = prepareReview(run);
  assert.equal(review.changes.length, run.investigations.length);
  assert.equal(review.evidenceLinks.length, 1);
  assert.equal(review.inferences.length, run.claims.length);
  review.reviewer = 'Example reviewer';
  for (const name of ['changes', 'evidenceLinks', 'inferences', 'claims'])
    for (const row of review[name]) {
      row.state = 'complete';
      row.verdict = name === 'inferences' ? 'unsupported' : 'supported';
      row.reason =
        name === 'inferences'
          ? 'The definition does not establish coverage.'
          : 'The source supports the stated observation.';
    }
  assert.doesNotThrow(() => validateReview(review, run, { complete: true }));
  review.inferences.pop();
  assert.throws(() => validateReview(review, run, { complete: true }), /omits/);
  const changed = structuredClone(run);
  changed.findings[0].conclusion = 'A changed result.';
  assert.throws(() => validateReview(review, changed), /changed assessment/);
});
