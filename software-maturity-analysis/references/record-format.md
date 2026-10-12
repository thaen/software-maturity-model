# Investigation records connect definitions to evidence.

The input catalog is the webapp's version 2 export. The system description and run are JSON
files in the assessed system's repository. The run has a captured catalog and SHA-256 snapshot
ID, system, input revision, workflow state, and arrays of records. Every ID is stable within
the run. Links refer to those IDs, and records from other runs cannot be substituted.

## The system description has boundaries and user outcomes.

A system input can have this shape. Extend the descriptions with the interfaces, ownership,
dependencies, operating paths, and exclusions needed for the system under review.

```json
{
  "id": "example-service",
  "title": "Example service",
  "description": "The support unit includes its public API, workers, deployment, and operator procedures.",
  "owner": "Example team",
  "inputRevision": "repository commit or deployment revision",
  "repositories": ["https://example.com/repository"],
  "boundaries": [{"id": "public-api", "description": "The request path includes admission, handlers, and outbound calls.", "owner": "Example team"}],
  "outcomes": [{"id": "api-latency", "definitionId": "latency", "target": "The system-defined latency objective", "consequence": "Users cannot complete the operation within the required time."}],
  "limits": "Production configuration is unavailable."
}
```

## The helper prepares and checks the records.

Run commands from the software-maturity-model checkout. Use paths into the work repository
for the system, run, and review. The preparation command creates draft work rather than
performing the investigation.

```sh
npm run export -- /path/to/work/catalog.json
node software-maturity-analysis/scripts/investigation.mjs prepare /path/to/work/catalog.json /path/to/work/system.json /path/to/work/run.json
node software-maturity-analysis/scripts/investigation.mjs scaffold /path/to/work/run.json /path/to/work/scaffolded-run.json
node software-maturity-analysis/scripts/investigation.mjs work-item /path/to/work/run.json public-api S6.1
node software-maturity-analysis/scripts/investigation.mjs validate /path/to/work/run.json --complete
node software-maturity-analysis/scripts/investigation.mjs review /path/to/work/run.json /path/to/work/review.json
node software-maturity-analysis/scripts/investigation.mjs validate-review /path/to/work/review.json /path/to/work/run.json --complete
```

Preparation inventories every boundary/change pair, every conditional rule, and every applicable link condition. Baseline,
conditional, prerequisite, and manual candidates have expected-control rows. Conditional
candidates have rows when their rule is selected or unresolved. Pending rules remain work
targets; excluded rules retain their reason and candidate definitions in the snapshot. The scaffold command
retains IDs and completed text while updating the candidate set after condition tailoring.
Use draft validation without `--complete` while work remains. Set `run.state` to `complete`
when its records are complete and validated; review preparation requires that state.

## The runtime records have these fields.

| Collection | The records have these fields. |
| --- | --- |
| `investigations` | Each record has `id`, `boundaryId`, `changeId`, `disposition`, `reason`, and `searchScope`. |
| `conditions` | Each record has `id`, `investigationId`, optional `ruleId` or `applicabilityId`, `disposition`, and `reason`. |
| `expectedControls` | Each record has `id`, `investigationId`, `mitigationId`, `disposition`, `reason`, and optional `manualReason`. |
| `controlSelections` | Each generated record has `id`, `expectedControlId`, and exactly one origin among `applicabilityId`, `ruleId`, `relationId`, or `manualReason`. Its `excludedBy` lists the catalog exceptions to that baseline. |
| `findings` | Each record has `id`, `expectedControlId`, `state`, `status`, `conclusion`, `searchScope`, and `limits`. |
| `claims` | Each record has `id`, `findingId`, `criterionId`, `state`, `status`, `conclusion`, and `limits`. |
| `mechanisms` | Each record has `id`, `boundaryId`, `description`, `owner`, `configuration`, `coverage`, and `limits`. Optional `approvedImplementationId` names an organization practice in the work repository. |
| `mechanismMitigations` | Each record has `id`, `mechanismId`, `mitigationId`, and `reason`. |
| `mechanismRelations` | Each record has `id`, `sourceId`, `targetId`, `kind`, `condition`, and `reason`. Its endpoints belong to the same boundary. |
| `controlOutcomes` | Each record has `id`, `expectedControlId`, `systemOutcomeId`, and `reason`. |
| `observations` | Each record has `id`, `boundaryId`, optional `mechanismId`, and `statement`. |
| `evidence` | Each record has `id`, `uri`, optional `revision`, `locator`, `result`, `method`, `scope`, and `capturedAt`. |
| `observationEvidence` | Each record has `id`, `observationId`, `evidenceId`, `relation`, and `reason`. |
| `claimObservations` | Each record has `id`, `claimId`, `observationId`, `relation`, and `reason`. |
| `investigationObservations` | Each record has `id`, `investigationId`, `observationId`, and `reason`. This includes support for exclusions and applicability decisions. |

Dispositions are `pending`, `selected`, `excluded`, and `unresolved`. Findings and claims have
`pending` or `complete` states; their statuses are `present`, `partial`, `absent`, `unknown`,
and `not_applicable`. Pending records have no status. Evidence methods are `examine`, `interview`,
and `test`. Evidence and inference relations are `supports`, `challenges`, and `context`.

A claim's criterion must belong to its expected mitigation. Its observations must belong to
the same boundary. A substantive claim needs observations with evidence; absence also needs
a bounded search, and unknown needs a limit. An unknown does not require fabricated evidence.

The system can supply `approvedImplementations` with `id`, `title`, `description`,
`documentationUri`, and `mitigationIds`. These private records describe approved practices.
A mechanism can reference an imported practice, but it still needs observations and evidence
to establish use and coverage.
Exclusion and applicability observations provide the evidence path for reviewing those decisions.

## The review has an immutable assessment target.

The review stores its assessment ID and digest, reviewer, creation time, and workflow state.
Its `changes`, `evidenceLinks`, `inferences`, and `claims` arrays contain targets with `id`,
`targetId`, `state`, `verdict`, and `reason`. Targets have `pending` or `complete` states.
Verdicts are `supported`, `unsupported`, `partially_supported`, and `unable_to_verify`.
Validation rejects changed assessments, omitted targets, duplicate targets, missing verdicts,
and missing explanations. A completed review can retain unsupported conclusions.

The helpers establish record integrity and coverage. The investigator and reviewer establish
whether evidence and inference support the conclusions.
