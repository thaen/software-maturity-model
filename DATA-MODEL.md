# The proposed data model connects definitions to observations and evidence.

The model has a catalog of expected protections and a record of investigations into actual
systems. A finding refers to a built-in definition and its assessment criteria. Its claims
refer to observations, and each observation refers to the evidence that establishes it.
A review checks both the evidence and the inference from the observation to the claim.

The catalog editor uses SQLite for authored definitions. Investigation and review records have
a JSON contract and validation helpers. Their SQLite persistence and result interface follow
the same relationships when implemented. The [README](README.md) has ERDs with record fields,
including change level, parent, order, title, description, guidance, and origin.

The diagrams use these labels: `S_` identifies “things that are part of the Skill,” `R_`
identifies “things that are discovered at runtime,” and `O_` identifies “other.” The authored
records are populated through the catalog, while the Skill instructs the agent to produce the
runtime records. Scope, expected work, snapshots, and reviews belong to the other group.

## The storage boundary separates the public catalog from work data.

The catalog authoring database contains generic definitions, criteria, applicability, and
relations. The workspace SQLite contract contains systems,
investigations, observations, evidence, reviews, and opportunities. Workspace persistence imports
its catalog snapshot into that database so its foreign keys have local targets.
Foreign keys do not cross SQLite schema boundaries.
[SQLite documents this limit](https://www.sqlite.org/foreignkeys.html).

JSON remains an import and deterministic export format for Git review and catalog transfer.
SQLite is the live catalog persistence layer. Startup does not overwrite the database
from a seed export. Catalog edits, reparenting, and changes to related records have database
transactions and revision checks. Every database connection enables foreign-key enforcement.
[SQLite describes foreign-key enforcement](https://www.sqlite.org/foreignkeys.html) and
[transaction behavior](https://www.sqlite.org/transactional.html).

The diagrams describe the catalog and the investigation, organization, and opportunity contracts. A crow's foot means several rows; a circle
means that the relationship is optional. Tables with two parents are explicit join tables.
Captured workspace catalog records use the composite identity `(catalog_snapshot_id, id)`, and all references
to them include the snapshot. The authoring database has a working catalog; a workspace has
captured catalogs for its runs. This preserves stable definition IDs without invalidation rules.

## The catalog defines what the agent should investigate.

```mermaid
erDiagram
    O_CATALOG_SNAPSHOT {
        string id PK
        int revision
        datetime captured_at
    }
    S_CHANGE_DEFINITION {
        string id PK
        string catalog_snapshot_id PK,FK
        string parent_id FK
        enum level "category, subcategory, kind"
        int position
        string title
        text description
        text guidance
        enum origin
    }
    S_MITIGATION_DEFINITION {
        string id PK
        string catalog_snapshot_id PK,FK
        string parent_id FK
        enum kind "group, control"
        int position
        string title
        text description
        text purpose
        text mechanism
        text scope
        text evidence
        text maturity
        text limits
        text adverse_effects
        enum origin
    }
    S_CONDITIONAL_RULE {
        string catalog_snapshot_id PK,FK
        string id PK
        string title
        text condition
        text description
    }
    S_APPLICABILITY {
        string catalog_snapshot_id PK,FK
        string id PK
        string change_id FK
        string mitigation_id FK
        string inherited_from FK
        enum effect
        boolean inherit
        text reason
        text condition
        text mechanism
    }
    S_OUTCOME_DEFINITION {
        string catalog_snapshot_id PK,FK
        string id PK
        string title
        text description
    }
    S_CAPABILITY_DEFINITION {
        string catalog_snapshot_id PK,FK
        string id PK
        string title
        text description
        text maturity
    }
    S_MITIGATION_CRITERION {
        string id PK
        string mitigation_id FK
        string catalog_snapshot_id PK,FK
        enum kind
        text statement
        text evidence
    }
    S_MITIGATION_RELATION {
        string catalog_snapshot_id PK,FK
        string id PK
        string source_id FK
        string target_id FK
        enum kind
        text scope
        text reason
    }
    S_RULE_MITIGATION {
        string catalog_snapshot_id PK,FK
        string id PK
        string rule_id FK
        string mitigation_id FK
    }
    S_APPLICABILITY_OUTCOME {
        string catalog_snapshot_id PK,FK
        string applicability_id PK,FK
        string outcome_id PK,FK
    }
    S_CAPABILITY_CRITERION {
        string catalog_snapshot_id PK,FK
        string id PK
        string capability_id FK
        text statement
        text evidence
    }
    O_CATALOG_SNAPSHOT ||--o{ S_CHANGE_DEFINITION : contains
    O_CATALOG_SNAPSHOT ||--o{ S_MITIGATION_DEFINITION : contains
    S_CHANGE_DEFINITION o|--o{ S_CHANGE_DEFINITION : parents
    S_MITIGATION_DEFINITION o|--o{ S_MITIGATION_DEFINITION : groups
    S_CHANGE_DEFINITION ||--o{ S_APPLICABILITY : has
    S_MITIGATION_DEFINITION ||--o{ S_APPLICABILITY : selects
    S_MITIGATION_DEFINITION ||--o{ S_MITIGATION_CRITERION : defines
    S_MITIGATION_DEFINITION ||--o{ S_MITIGATION_RELATION : is_source
    S_MITIGATION_DEFINITION ||--o{ S_MITIGATION_RELATION : is_target
    S_CONDITIONAL_RULE ||--o{ S_RULE_MITIGATION : proposes
    S_MITIGATION_DEFINITION ||--o{ S_RULE_MITIGATION : is_proposed
    S_APPLICABILITY ||--o{ S_APPLICABILITY_OUTCOME : protects
    S_OUTCOME_DEFINITION ||--o{ S_APPLICABILITY_OUTCOME : is_protected
    S_CAPABILITY_DEFINITION ||--o{ S_CAPABILITY_CRITERION : defines
    O_CATALOG_SNAPSHOT ||--o{ S_CONDITIONAL_RULE : contains
    O_CATALOG_SNAPSHOT ||--o{ S_OUTCOME_DEFINITION : contains
    O_CATALOG_SNAPSHOT ||--o{ S_CAPABILITY_DEFINITION : contains
```

A change definition has its hierarchy level, parent, order, title, description, and guidance.
A mitigation definition is a group or an assessable leaf. A criterion states the claim to
test, the relevant coverage, and evidence expectations. Criteria can concern existence,
coverage, use, exercise, limits, and adverse effects.

Applicability has its reason, mechanism in context, condition, inheritance policy, and any
explicit baseline exception. A mitigation relation has two endpoints, a prerequisite,
alternative, or shared-dependency type, and its scope and reason. Conditional rules propose
mitigations for tailoring. Neither applicability nor an approved implementation proves that
a system has a protection.

## Systems have implementations and mechanisms with stated scope.

```mermaid
erDiagram
    O_ORGANIZATION {
        string id PK
        string name
    }
    O_TEAM {
        string id PK
        string organization_id FK
        string name
    }
    O_SYSTEM {
        string id PK
        string team_id FK
        string title
        text description
        string owner
    }
    O_BOUNDARY {
        string id PK
        string system_id FK
        string parent_id FK
        text description
        text exclusions
        string owner
    }
    S_OUTCOME_DEFINITION {
        string catalog_snapshot_id PK,FK
        string id PK
        string title
        text description
    }
    O_APPROVED_IMPLEMENTATION {
        string id PK
        string organization_id FK
        string title
        text description
        string documentation_uri
    }
    S_MITIGATION_DEFINITION {
        string id PK
        string catalog_snapshot_id PK,FK
        string parent_id FK
        enum kind "group, control"
        int position
        string title
        text description
        text purpose
        text mechanism
        text scope
        text evidence
        text maturity
        text limits
        text adverse_effects
        enum origin
    }
    O_CATALOG_SNAPSHOT {
        string id PK
        int revision
        datetime captured_at
    }
    O_ASSESSMENT_RUN {
        string id PK
        string system_id FK
        string team_id FK
        string catalog_snapshot_id FK
        string supersedes_run_id FK
        enum state
        string input_revision
        datetime created_at
        text limits
    }
    R_MECHANISM {
        string id PK
        string run_id FK
        string boundary_id FK
        string approved_implementation_id FK
        text description
        string owner
        text configuration
        text coverage
        text limits
    }
    O_SYSTEM_OUTCOME {
        string id PK
        string system_id FK
        string outcome_definition_id FK
        text users
        text target
        text measurement_window
        text exposure
        text consequences
    }
    O_IMPLEMENTATION_MITIGATION {
        string implementation_id PK,FK
        string mitigation_id PK,FK
        text scope
    }
    R_MECHANISM_MITIGATION {
        string id PK
        string mechanism_id FK
        string mitigation_id FK
        text reason
    }
    R_MECHANISM_RELATION {
        string id PK
        string source_id FK
        string target_id FK
        enum kind
        text condition
        text reason
    }
    O_ORGANIZATION ||--o{ O_TEAM : has
    O_TEAM o|--o{ O_SYSTEM : owns
    O_SYSTEM ||--o{ O_BOUNDARY : has
    O_BOUNDARY o|--o{ O_BOUNDARY : contains
    O_SYSTEM ||--o{ O_SYSTEM_OUTCOME : has
    S_OUTCOME_DEFINITION ||--o{ O_SYSTEM_OUTCOME : defines
    O_ORGANIZATION ||--o{ O_APPROVED_IMPLEMENTATION : maintains
    O_APPROVED_IMPLEMENTATION ||--o{ O_IMPLEMENTATION_MITIGATION : implements
    S_MITIGATION_DEFINITION ||--o{ O_IMPLEMENTATION_MITIGATION : is_implemented
    O_SYSTEM o|--o{ O_ASSESSMENT_RUN : is_assessed
    O_TEAM o|--o{ O_ASSESSMENT_RUN : is_assessed
    O_CATALOG_SNAPSHOT ||--o{ O_ASSESSMENT_RUN : supplies_definitions
    O_ASSESSMENT_RUN ||--o{ R_MECHANISM : records
    O_BOUNDARY ||--o{ R_MECHANISM : scopes
    O_APPROVED_IMPLEMENTATION o|--o{ R_MECHANISM : supplies
    R_MECHANISM ||--o{ R_MECHANISM_MITIGATION : maps_to
    S_MITIGATION_DEFINITION ||--o{ R_MECHANISM_MITIGATION : classifies
    R_MECHANISM ||--o{ R_MECHANISM_RELATION : is_source
    R_MECHANISM ||--o{ R_MECHANISM_RELATION : is_target
```

A run has either a system or a team as its subject. Product investigations have system runs;
organization capability investigations can have team runs. A boundary names the component,
interface, or support unit in scope. A system outcome has its users, target, measurement
window, exposure, and consequences when known.

An approved implementation is an organization's accepted way of providing one or more
mitigations. A mechanism is the actual configured instance described during a run, such as
a limiter in a request path or an operator procedure used for recovery. It has its owner,
configuration, coverage, and optional approved implementation. One mechanism can provide
several mitigation types, and one mitigation can have several mechanisms. Its mapping is a
classification; effectiveness is established through findings and evidence.

Mechanism relations record actual dependencies and shared failure conditions. A run captures
its system, boundary, and implementation context, and its mechanism records retain the
configuration described in that run. Later edits do not rewrite those observations.

## The investigation records expected work before it records findings.

```mermaid
erDiagram
    O_ASSESSMENT_RUN {
        string id PK
        string system_id FK
        string team_id FK
        string catalog_snapshot_id FK
        string supersedes_run_id FK
        enum state
        string input_revision
        datetime created_at
        text limits
    }
    O_BOUNDARY {
        string id PK
        string system_id FK
        string parent_id FK
        text description
        text exclusions
        string owner
    }
    S_CHANGE_DEFINITION {
        string id PK
        string catalog_snapshot_id PK,FK
        string parent_id FK
        enum level "category, subcategory, kind"
        int position
        string title
        text description
        text guidance
        enum origin
    }
    R_CHANGE_INVESTIGATION {
        string id PK
        string run_id FK
        string boundary_id FK
        string change_id FK
        enum disposition
        text reason
        text search_scope
    }
    R_OBSERVATION {
        string id PK
        string run_id FK
        string boundary_id FK
        string mechanism_id FK
        text statement
    }
    S_MITIGATION_DEFINITION {
        string id PK
        string catalog_snapshot_id PK,FK
        string parent_id FK
        enum kind "group, control"
        int position
        string title
        text description
        text purpose
        text mechanism
        text scope
        text evidence
        text maturity
        text limits
        text adverse_effects
        enum origin
    }
    O_EXPECTED_CONTROL {
        string id PK
        string investigation_id FK
        string mitigation_id FK
        enum disposition
        text reason
    }
    S_APPLICABILITY {
        string catalog_snapshot_id PK,FK
        string id PK
        string change_id FK
        string mitigation_id FK
        string inherited_from FK
        enum effect
        boolean inherit
        text reason
        text condition
        text mechanism
    }
    S_CONDITIONAL_RULE {
        string catalog_snapshot_id PK,FK
        string id PK
        string title
        text condition
        text description
    }
    O_SYSTEM_OUTCOME {
        string id PK
        string system_id FK
        string outcome_definition_id FK
        text users
        text target
        text measurement_window
        text exposure
        text consequences
    }
    R_CONTROL_FINDING {
        string id PK
        string expected_control_id FK
        enum state
        enum status
        text conclusion
        text search_scope
        text limits
    }
    S_MITIGATION_CRITERION {
        string id PK
        string mitigation_id FK
        string catalog_snapshot_id PK,FK
        enum kind
        text statement
        text evidence
    }
    R_CLAIM {
        string id PK
        string finding_id FK
        string criterion_id FK
        string capability_finding_id FK
        string capability_criterion_id FK
        enum state
        enum status
        text conclusion
        text limits
    }
    R_MECHANISM {
        string id PK
        string run_id FK
        string boundary_id FK
        string approved_implementation_id FK
        text description
        string owner
        text configuration
        text coverage
        text limits
    }
    R_EVIDENCE {
        string id PK
        string run_id FK
        string uri
        string revision
        text locator
        text result
        enum method
        text scope
        datetime captured_at
    }
    R_INVESTIGATION_OBSERVATION {
        string id PK
        string investigation_id FK
        string observation_id FK
        text reason
    }
    O_CONTROL_SELECTION {
        string id PK
        string expected_control_id FK
        string applicability_id FK
        string rule_id FK
        string relation_id FK
        text manual_reason
    }
    O_CONTROL_OUTCOME {
        string expected_control_id PK,FK
        string system_outcome_id PK,FK
        text reason
    }
    R_CLAIM_OBSERVATION {
        string id PK
        string claim_id FK
        string observation_id FK
        enum relation
        text reason
    }
    R_OBSERVATION_EVIDENCE {
        string id PK
        string observation_id FK
        string evidence_id FK
        enum relation
        text reason
    }
    O_ASSESSMENT_RUN ||--o{ R_CHANGE_INVESTIGATION : inventories
    O_BOUNDARY ||--o{ R_CHANGE_INVESTIGATION : scopes
    S_CHANGE_DEFINITION ||--o{ R_CHANGE_INVESTIGATION : defines
    R_CONDITION_DETERMINATION {
        string id PK
        string investigation_id FK
        string applicability_id FK
        string rule_id FK
        enum disposition
        text reason
    }
    R_CHANGE_INVESTIGATION ||--o{ R_CONDITION_DETERMINATION : tailors
    S_CONDITIONAL_RULE o|--o{ R_CONDITION_DETERMINATION : defines
    S_APPLICABILITY o|--o{ R_CONDITION_DETERMINATION : defines
    R_CHANGE_INVESTIGATION ||--o{ R_INVESTIGATION_OBSERVATION : explains
    R_OBSERVATION ||--o{ R_INVESTIGATION_OBSERVATION : informs
    R_CHANGE_INVESTIGATION ||--o{ O_EXPECTED_CONTROL : expects
    S_MITIGATION_DEFINITION ||--o{ O_EXPECTED_CONTROL : defines
    O_EXPECTED_CONTROL ||--o{ O_CONTROL_SELECTION : explains
    S_APPLICABILITY o|--o{ O_CONTROL_SELECTION : supplies
    S_CONDITIONAL_RULE o|--o{ O_CONTROL_SELECTION : supplies
    O_EXPECTED_CONTROL ||--o| R_CONTROL_FINDING : receives
    O_EXPECTED_CONTROL ||--o{ O_CONTROL_OUTCOME : addresses
    O_SYSTEM_OUTCOME ||--o{ O_CONTROL_OUTCOME : is_addressed
    R_CONTROL_FINDING o|--o{ R_CLAIM : concludes
    S_MITIGATION_CRITERION o|--o{ R_CLAIM : tests
    R_CLAIM ||--o{ R_CLAIM_OBSERVATION : explains
    R_OBSERVATION ||--o{ R_CLAIM_OBSERVATION : informs
    O_ASSESSMENT_RUN ||--o{ R_OBSERVATION : records
    O_BOUNDARY o|--o{ R_OBSERVATION : scopes
    R_MECHANISM o|--o{ R_OBSERVATION : concerns
    R_OBSERVATION ||--o{ R_OBSERVATION_EVIDENCE : cites
    R_EVIDENCE ||--o{ R_OBSERVATION_EVIDENCE : grounds
    O_ASSESSMENT_RUN ||--o{ R_EVIDENCE : captures
```

The investigation inventory has a row for every catalog change within each assessed boundary.
A row has a selected, excluded, or unresolved disposition and a reason. Excluding a branch produces
explicit inherited exclusions for its descendants. An omitted row is therefore distinguishable
from an excluded or evaluated row.

Exclusion and applicability reasons can cite observations through investigation-observation
links. Their evidence uses the same records as criterion claims, so exclusions can be reviewed.

An expected control has its applicability determination and tailoring reason. The expected
rows retain candidate controls that tailoring excludes or leaves unresolved, with their reasons.
Control selection rows retain all contributing baselines and rules, or a manual addition with
its reason. Each
selection has either an applicability reference, a rule reference, or a manual reason. A finding
has its present, partial, absent, unknown, or not-applicable status, conclusion, and search scope.

Preparation creates a draft finding and a draft claim for each applicable criterion before
investigation begins. Their workflow state starts pending, and their determination is empty
until the agent addresses it. A claim has its criterion ID, determination, conclusion text,
and any evidence or access limit. Pending work differs from an investigated unknown. Absence
needs a bounded search record; lack of access or evidence can remain unknown with a reason.

An observation is a statement about what the investigation found. For example, it can state
that a limiter is registered in one request path. Observations can also concern test execution,
interviews, searches, and inspected scope; a missing control does not require an invented mechanism.

Evidence has a repository or document URI, revision when available, line or section locator,
excerpt or inspection result, acquisition method, and captured time. Observation-evidence links
state whether the evidence supports, challenges, or provides context for the observation, with
an explanation. Claim-observation links state how the observed fact supports or challenges the
criterion's conclusion. A source can support several observations, and an observation can inform
several claims without having its text copied into each finding.

The runtime contract requires the claim's criterion to belong to the finding's mitigation and snapshot.
It also requires an expected control, finding, claim, observation, and evidence link to remain
within their stated run and permitted boundary. Team observations can have no product boundary.
The JSON validator checks the product investigation references. Workspace SQLite persistence requires composite foreign keys and checked transactions for these constraints.

## Review checks the links and the conclusion as separate determinations.

```mermaid
erDiagram
    O_ASSESSMENT_RUN {
        string id PK
        string system_id FK
        string team_id FK
        string catalog_snapshot_id FK
        string supersedes_run_id FK
        enum state
        string input_revision
        datetime created_at
        text limits
    }
    O_REVIEW_RUN {
        string id PK
        string assessment_id FK
        string reviewer
        string assessment_digest
        enum state
        datetime created_at
    }
    R_CHANGE_INVESTIGATION {
        string id PK
        string run_id FK
        string boundary_id FK
        string change_id FK
        enum disposition
        text reason
        text search_scope
    }
    R_OBSERVATION_EVIDENCE {
        string id PK
        string observation_id FK
        string evidence_id FK
        enum relation
        text reason
    }
    R_CLAIM_OBSERVATION {
        string id PK
        string claim_id FK
        string observation_id FK
        enum relation
        text reason
    }
    R_CLAIM {
        string id PK
        string finding_id FK
        string criterion_id FK
        string capability_finding_id FK
        string capability_criterion_id FK
        enum state
        enum status
        text conclusion
        text limits
    }
    O_REVIEW_CHANGE {
        string id PK
        string review_id FK
        string investigation_id FK
        enum state
        enum verdict
        text reason
    }
    O_EVIDENCE_LINK_REVIEW {
        string id PK
        string review_id FK
        string observation_evidence_id FK
        enum state
        enum verdict
        text reason
    }
    O_INFERENCE_REVIEW {
        string id PK
        string review_id FK
        string claim_observation_id FK
        enum state
        enum verdict
        text reason
    }
    O_CLAIM_REVIEW {
        string id PK
        string review_id FK
        string claim_id FK
        enum state
        enum verdict
        text reason
    }
    O_ASSESSMENT_RUN o|--o{ O_ASSESSMENT_RUN : is_corrected_by
    O_ASSESSMENT_RUN ||--o{ O_REVIEW_RUN : receives
    O_REVIEW_RUN ||--o{ O_REVIEW_CHANGE : targets
    R_CHANGE_INVESTIGATION ||--o{ O_REVIEW_CHANGE : receives
    O_REVIEW_RUN ||--o{ O_EVIDENCE_LINK_REVIEW : records
    R_OBSERVATION_EVIDENCE ||--o{ O_EVIDENCE_LINK_REVIEW : receives
    O_REVIEW_RUN ||--o{ O_INFERENCE_REVIEW : records
    R_CLAIM_OBSERVATION ||--o{ O_INFERENCE_REVIEW : receives
    O_REVIEW_RUN ||--o{ O_CLAIM_REVIEW : records
    R_CLAIM ||--o{ O_CLAIM_REVIEW : receives
```

A review run records its assessment and reviewer. Review-change rows capture the selected
investigations and check their disposition, exclusions, and tailoring against the catalog.
Preparing the pass also creates pending rows for each link and claim check. These rows are
the target set, with foreign keys rather than a list of unvalidated IDs.
For a review of all changes, that set includes every claim, every claim-observation link, and
every observation-evidence link reachable from those claims. Reused links are checked once
within the pass, and their review results remain visible from every affected change.

An evidence-link review checks that the source is accessible and that its content supports,
challenges, or provides context for the observation as the link claims, within the stated scope.
An inference review checks that the observation justifies the claim against its built-in
criterion, including conditions, coverage, and contrary evidence.
A claim review records the conclusion-level verdict and explanation. Each check starts pending
and can finish as supported, unsupported, partially supported, or unable to verify.

The review can finish with unsupported or unverifiable conclusions. Completion means every
target was addressed, not that every conclusion passed. Claims marked unknown still receive
a review of whether their limits and recorded search justify that determination. Changes with
unresolved applicability or omitted expected findings remain visible as coverage gaps.

A review targets a completed assessment run whose result records are fixed. Drafts remain
editable. A correction to a completed result creates a successor run with a `supersedes_run_id`
reference and retains the earlier result. This is review provenance, not an expiry or invalidation
system. It introduces no stale states or automatic reruns.

For example, code that defines a limiter supports the observation that the implementation
exists. It does not establish that every request passes through it. The evidence-link check
can pass while the inference supporting full coverage fails.

## Organization findings and opportunities retain the same evidence path.

```mermaid
erDiagram
    O_ASSESSMENT_RUN {
        string id PK
        string system_id FK
        string team_id FK
        string catalog_snapshot_id FK
        string supersedes_run_id FK
        enum state
        string input_revision
        datetime created_at
        text limits
    }
    O_TEAM {
        string id PK
        string organization_id FK
        string name
    }
    S_CAPABILITY_DEFINITION {
        string catalog_snapshot_id PK,FK
        string id PK
        string title
        text description
        text maturity
    }
    R_CAPABILITY_FINDING {
        string id PK
        string run_id FK
        string team_id FK
        string capability_id FK
        enum status
        text conclusion
    }
    S_CAPABILITY_CRITERION {
        string catalog_snapshot_id PK,FK
        string id PK
        string capability_id FK
        text statement
        text evidence
    }
    O_ORGANIZATION {
        string id PK
        string name
    }
    O_OPPORTUNITY {
        string id PK
        string organization_id FK
        text action
        text expected_result
        text priority_rationale
        text uncertainty
        text effort
        text implementation_result
    }
    R_CONTROL_FINDING {
        string id PK
        string expected_control_id FK
        enum state
        enum status
        text conclusion
        text search_scope
        text limits
    }
    O_SYSTEM {
        string id PK
        string team_id FK
        string title
        text description
        string owner
    }
    O_SYSTEM_OUTCOME {
        string id PK
        string system_id FK
        string outcome_definition_id FK
        text users
        text target
        text measurement_window
        text exposure
        text consequences
    }
    R_CLAIM {
        string id PK
        string finding_id FK
        string criterion_id FK
        string capability_finding_id FK
        string capability_criterion_id FK
        enum state
        enum status
        text conclusion
        text limits
    }
    O_OPPORTUNITY_FINDING {
        string id PK
        string opportunity_id FK
        string control_finding_id FK
        string capability_finding_id FK
        text reason
    }
    O_OPPORTUNITY_SYSTEM {
        string opportunity_id PK,FK
        string system_id PK,FK
    }
    O_OPPORTUNITY_OUTCOME {
        string opportunity_id PK,FK
        string system_outcome_id PK,FK
    }
    O_OPPORTUNITY_MEASUREMENT {
        string id PK
        string opportunity_id FK
        string system_outcome_id FK
        text expected_value
        text observed_value
        string units
        text window
        string source_uri
    }
    O_ASSESSMENT_RUN ||--o{ R_CAPABILITY_FINDING : records
    O_TEAM ||--o{ R_CAPABILITY_FINDING : scopes
    S_CAPABILITY_DEFINITION ||--o{ R_CAPABILITY_FINDING : defines
    R_CAPABILITY_FINDING o|--o{ R_CLAIM : concludes
    S_CAPABILITY_CRITERION o|--o{ R_CLAIM : tests
    O_ORGANIZATION ||--o{ O_OPPORTUNITY : has
    O_OPPORTUNITY ||--o{ O_OPPORTUNITY_FINDING : cites
    R_CONTROL_FINDING o|--o{ O_OPPORTUNITY_FINDING : motivates
    R_CAPABILITY_FINDING o|--o{ O_OPPORTUNITY_FINDING : motivates
    O_OPPORTUNITY ||--o{ O_OPPORTUNITY_SYSTEM : affects
    O_SYSTEM ||--o{ O_OPPORTUNITY_SYSTEM : is_affected
    O_OPPORTUNITY ||--o{ O_OPPORTUNITY_OUTCOME : targets
    O_SYSTEM_OUTCOME ||--o{ O_OPPORTUNITY_OUTCOME : is_targeted
    O_OPPORTUNITY ||--o{ O_OPPORTUNITY_MEASUREMENT : measures
    O_SYSTEM_OUTCOME o|--o{ O_OPPORTUNITY_MEASUREMENT : informs
```

A claim has either a control finding and mitigation criterion or a capability finding and
capability criterion. Paired nullable foreign keys and a check constraint require exactly
one of these forms. There is no unvalidated generic target ID. Both forms use the same
observation, evidence, and review tables.

An opportunity-finding link similarly has exactly one control or capability finding and
states the reason for citing it. Opportunities name their action, expected result, scope,
priority rationale, uncertainty, implementation result, and effort. Measurements record
expected and observed values with units, windows, and their source. Product protection and
organization capability remain separate even when they motivate the same initiative.

## The visualization changes follow the record meanings.

The catalog mode retains the connection list, hierarchy matrix, and paired outlines from
the comparison. They use the live definitions and applicability links. Cells and paths gain
labels for inheritance, conditions, and exceptions. Selecting a link opens its reason and
criteria; selecting a mitigation can also open its dependency relations.

Assessment mode uses a selected system, boundary, and run. The same connections show finding
statuses and investigation coverage. Selecting a cell opens the definition, criterion,
conclusion, observations, mechanisms, evidence excerpts and source links, and review results.
Catalog applicability and observed protection have different legends and remain distinguishable.

A review view can proceed change by change. It shows the expected and completed work, pending
checks, unsupported inferences, contradictory evidence, and unknowns. Selecting an observation
shows every claim that uses it, while selecting a mechanism shows the mitigations and outcomes
it is believed to protect. A later organization matrix shows findings across systems and can
open the same evidence path.

These records make coverage and review targets queryable. Their foreign keys establish that
the references exist; the review establishes whether their content supports the conclusion.
