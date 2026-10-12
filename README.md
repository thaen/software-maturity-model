# The software maturity model connects change to protection.

The webapp is an editor for sources of software change, mitigation definitions, and the
relationships between them. Its SQLite catalog is the authority for those definitions.
The investigation Skill uses a captured catalog to examine a system, record what protects
it, and connect each conclusion to observations and evidence.

## The local application has two catalogs and three connection views.

Start the application with Node 22.22.2 or a supported newer version.

```sh
npm install
npm start
```

The application is available at [localhost:4317](http://localhost:4317/). The workflow is in
the sidebar. Sources of change has three columns: categories, subcategories, and kinds of
change. Categories remain visible, and selection opens their children. A fourth column shows
candidate mitigations for the selected change. The columns follow normal page scrolling.

Mitigations has a separate hierarchy of groups and controls. Each control has its definition,
purpose, mechanism, scope, evidence expectations, maturity descriptions, limits, adverse
effects, assessment criteria, and relations to other controls. The criteria distinguish existence, coverage, use, exercise, limits, and adverse effects.
Conditional rules propose
controls for a material path. Outcome definitions describe what a protection can preserve.

Double-click text or press F2 to edit it. Changes to catalog text have an inline editor;
mitigation and relationship text opens a field editor. The menus provide creation, editing,
moving, ordering, and deletion. Drag the handles to reorder siblings or move a record to a
parent. The move dialog provides the same operations with a keyboard. Undo and redo retain
50 edits during a session, including branch deletion and dependent links.

The connection list, hierarchy matrix, and paired outlines use the same definitions and
resolution rules. The matrix has expandable axes and counts change/control pairs in a branch.
Selecting a cell opens the contributing pairs and reasons. The axes can use catalog or name
order without changing the saved hierarchy. Paired outlines draw the selected
change's candidate paths between the trees. These are catalog views; their counts do not
measure a system's protection or maturity.

Each applicability link has a reason, condition, mechanism in context, protected outcomes,
and inheritance policy. An exception refers to one inherited baseline link. Independent
reasons to select the same mitigation remain visible. Moving a branch can leave an exception
inactive; the editor shows that state. Controls have directed prerequisites and symmetric
alternative or shared-failure relations, each with a scope and reason. Prerequisite cycles
are rejected.

## SQLite stores the live catalog.

The database is `web/data/catalog.sqlite`. It has foreign-key enforcement, transaction-based
writes, and a revision check that prevents one tab from overwriting another tab's edits.
Startup creates the database only when its catalog is absent. It preserves existing change
text from `web/data/catalog.json` and supplies the mitigation definitions and links from the
version 2 seed. Subsequent startups use the database and do not reset edits from a seed.

The initial catalog has nine change categories, 52 subcategories, 104 draft kinds, 106 controls
in eight groups, 636 criteria, 1,164 baseline links, 10 conditional rules, and six outcome
definitions. Draft kinds are examples within a parent's scope. Criteria and maturity text
are editable, and an investigation retains uncertainty when evidence cannot establish them.

Export JSON produces a transferable snapshot of both catalogs and their relationships.
Import validates the complete catalog before replacement. Version 1 change-only imports
replace the catalog with their supplied changes and empty mitigation collections; use a
version 2 export to preserve both catalogs. A command-line export is available as well.

```sh
npm run export -- /path/to/catalog.json
npm test
```

Database files are local state and are excluded from Git. JSON exports can be reviewed in
Git. Private system definitions, organization practices, evidence, and results belong in the
organization's work repository. The public catalog contains generic definitions.

## The investigation has expected work and evidence-backed conclusions.

The [investigation Skill](software-maturity-analysis/SKILL.md) uses this process.

1. The investigator defines the system's unit of supportability, boundaries, owners, dependency responsibilities, user outcomes, exclusions, input revision, and evidence limits.
2. The preparation helper captures the catalog and creates an inventory of every change within each boundary. Each change receives a selected, excluded, or unresolved disposition and a reason. The investigator also determines every conditional rule's relevance.
3. The investigator tailors candidate controls from baselines, inherited links, exceptions, conditions, prerequisites, and manual additions. Expected rows retain the reasons for selected, excluded, and unresolved candidates. Findings and criterion claims begin pending.
4. Each work item has one boundary, one change definition, its candidate mitigations, criteria, and evidence expectations. The investigator records mechanisms, observations, and evidence before drawing conclusions. Evidence has a source URI, revision when available, locator, inspected excerpt or result, method, scope, and capture time.
5. Each criterion claim refers to observations, and each observation refers to evidence through links with a relation and rationale. Findings distinguish present, partial, absent, unknown, and not-applicable protections. Absence requires a bounded search; unknown requires an evidence or access limit.
6. A separate review has targets for every change, observation/evidence link, claim/observation link, and criterion claim. The reviewer verifies the source's support for the observation and then the observation's support for the conclusion. Unsupported and unverifiable conclusions remain explicit.

For example, code that defines a limiter supports an observation that the implementation
exists. That observation alone does not establish that every request passes through it.
The evidence check can pass while the coverage inference fails.

The Skill has [record definitions and helper commands](software-maturity-analysis/references/record-format.md).
Investigation and review helpers produce portable JSON records in the work repository.
The webapp currently edits the catalog; result storage and visualization are separate from
this catalog interface. The process has no expiration, invalidation, or automatic reassessment
rules. A corrected completed investigation has a successor run and its own review.

## The ERD labels three classes of records.

The `S_` prefix labels **“things that are part of the Skill.”** These are definitions that you
populate and edit through the catalog. The `R_` prefix labels **“things that are discovered
at runtime.”** The Skill instructs the investigator to fill these records. The `O_` prefix
labels **“other.”** These records define scope, capture inputs, enumerate expected work,
and retain review state.

The first diagram describes the catalog stored in SQLite. The second diagram describes the
investigation and review record contract, whose runtime UI and SQLite persistence are not
part of the catalog editor. IDs on a captured catalog are interpreted within that snapshot.
A private workspace database will import the captured definitions locally; its foreign keys
will not cross into the public authoring database. The [data model](DATA-MODEL.md) has the
constraints and the organization and opportunity relationships.

```mermaid
erDiagram
    O_CATALOG {
        int id PK
        int schema_version
        int revision
        datetime updated_at
        text description
    }
    S_CHANGE_DEFINITION {
        string id PK
        string parent_id FK
        enum level "category, subcategory, kind"
        int position
        string title
        text description
        text guidance
        enum origin "skill, draft, user"
    }
    S_MITIGATION_DEFINITION {
        string id PK
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
    S_MITIGATION_CRITERION {
        string id PK
        string mitigation_id FK
        int position
        enum kind
        text statement
        text evidence
    }
    S_APPLICABILITY {
        string id PK
        string change_id FK
        string mitigation_id FK
        string inherited_from FK
        enum effect "include, exclude"
        boolean inherit
        int position
        text reason
        text condition
        text mechanism
    }
    S_OUTCOME_DEFINITION {
        string id PK
        int position
        string title
        text description
    }
    S_APPLICABILITY_OUTCOME {
        string applicability_id PK,FK
        string outcome_id PK,FK
        int position
    }
    S_CONDITIONAL_RULE {
        string id PK
        int position
        string title
        text condition
        text description
    }
    S_RULE_MITIGATION {
        string id PK
        string rule_id FK
        string mitigation_id FK
        int position
    }
    S_MITIGATION_RELATION {
        string id PK
        string source_id FK
        string target_id FK
        enum kind "requires, alternative, shared_failure"
        int position
        text reason
        text scope
    }
    O_CATALOG ||--o{ S_CHANGE_DEFINITION : contains
    O_CATALOG ||--o{ S_MITIGATION_DEFINITION : contains
    S_CHANGE_DEFINITION o|--o{ S_CHANGE_DEFINITION : parents
    S_MITIGATION_DEFINITION o|--o{ S_MITIGATION_DEFINITION : groups
    S_MITIGATION_DEFINITION ||--o{ S_MITIGATION_CRITERION : defines
    S_CHANGE_DEFINITION ||--o{ S_APPLICABILITY : selects
    S_MITIGATION_DEFINITION ||--o{ S_APPLICABILITY : proposes
    S_APPLICABILITY o|--o{ S_APPLICABILITY : is_excepted_by
    S_APPLICABILITY ||--o{ S_APPLICABILITY_OUTCOME : protects
    S_OUTCOME_DEFINITION ||--o{ S_APPLICABILITY_OUTCOME : identifies
    S_CONDITIONAL_RULE ||--o{ S_RULE_MITIGATION : proposes
    S_MITIGATION_DEFINITION ||--o{ S_RULE_MITIGATION : is_proposed
    S_MITIGATION_DEFINITION ||--o{ S_MITIGATION_RELATION : is_source
    S_MITIGATION_DEFINITION ||--o{ S_MITIGATION_RELATION : is_target
```

```mermaid
erDiagram
    O_CATALOG_SNAPSHOT {
        string id PK "SHA-256"
        int catalog_revision
        json definitions
    }
    O_SYSTEM {
        string id PK
        string title
        text description
        string owner
        string input_revision
        text limits
    }
    O_BOUNDARY {
        string id PK
        string system_id FK
        text description
        string owner
    }
    O_ASSESSMENT_RUN {
        string id PK
        string system_id FK
        string catalog_snapshot_id FK
        string supersedes_run_id FK
        enum state
        datetime created_at
        string input_revision
        text limits
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
    R_CONDITION_DETERMINATION {
        string id PK
        string investigation_id FK
        string rule_id FK
        enum disposition
        text reason
    }
    O_EXPECTED_CONTROL {
        string id PK
        string investigation_id FK
        string mitigation_id FK
        enum disposition
        text reason
        text manual_reason
    }
    O_CONTROL_SELECTION {
        string id PK
        string expected_control_id FK
        string applicability_id FK
        string rule_id FK
        string relation_id FK
        text manual_reason
        json excluded_by
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
    R_CLAIM {
        string id PK
        string finding_id FK
        string criterion_id FK
        enum state
        enum status
        text conclusion
        text limits
    }
    R_MECHANISM {
        string id PK
        string boundary_id FK
        string approved_implementation_id FK
        text description
        string owner
        text configuration
        text coverage
        text limits
    }
    R_MECHANISM_MITIGATION {
        string id PK
        string mechanism_id FK
        string mitigation_id FK
        text reason
    }
    R_OBSERVATION {
        string id PK
        string boundary_id FK
        string mechanism_id FK
        text statement
    }
    R_EVIDENCE {
        string id PK
        string uri
        string revision
        text locator
        text result
        enum method
        text scope
        datetime captured_at
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
    R_INVESTIGATION_OBSERVATION {
        string id PK
        string investigation_id FK
        string observation_id FK
        text reason
    }
    O_REVIEW_RUN {
        string id PK
        string assessment_id FK
        string assessment_digest
        string reviewer
        enum state
        datetime created_at
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
    O_SYSTEM ||--o{ O_BOUNDARY : has
    O_SYSTEM ||--o{ O_ASSESSMENT_RUN : is_assessed
    O_CATALOG_SNAPSHOT ||--o{ O_ASSESSMENT_RUN : supplies_definitions
    O_ASSESSMENT_RUN ||--o{ R_CHANGE_INVESTIGATION : inventories
    O_BOUNDARY ||--o{ R_CHANGE_INVESTIGATION : scopes
    S_CHANGE_DEFINITION ||--o{ R_CHANGE_INVESTIGATION : defines
    S_MITIGATION_DEFINITION ||--o{ O_EXPECTED_CONTROL : defines
    S_MITIGATION_CRITERION ||--o{ R_CLAIM : tests
    S_CONDITIONAL_RULE ||--o{ R_CONDITION_DETERMINATION : defines
    S_APPLICABILITY ||--o{ O_CONTROL_SELECTION : supplies
    S_CONDITIONAL_RULE ||--o{ O_CONTROL_SELECTION : supplies
    S_MITIGATION_DEFINITION ||--o{ R_MECHANISM_MITIGATION : classifies
    R_CHANGE_INVESTIGATION ||--o{ R_CONDITION_DETERMINATION : tailors
    R_CHANGE_INVESTIGATION ||--o{ O_EXPECTED_CONTROL : expects
    O_EXPECTED_CONTROL ||--o{ O_CONTROL_SELECTION : retains_reasons
    O_EXPECTED_CONTROL ||--|| R_CONTROL_FINDING : receives
    R_CONTROL_FINDING ||--o{ R_CLAIM : concludes
    O_BOUNDARY ||--o{ R_MECHANISM : scopes
    R_MECHANISM ||--o{ R_MECHANISM_MITIGATION : maps
    R_MECHANISM o|--o{ R_OBSERVATION : concerns
    O_BOUNDARY ||--o{ R_OBSERVATION : scopes
    R_OBSERVATION ||--o{ R_OBSERVATION_EVIDENCE : cites
    R_EVIDENCE ||--o{ R_OBSERVATION_EVIDENCE : grounds
    R_CLAIM ||--o{ R_CLAIM_OBSERVATION : explains
    R_OBSERVATION ||--o{ R_CLAIM_OBSERVATION : informs
    R_CHANGE_INVESTIGATION ||--o{ R_INVESTIGATION_OBSERVATION : explains
    R_OBSERVATION ||--o{ R_INVESTIGATION_OBSERVATION : informs
    O_ASSESSMENT_RUN ||--o{ O_REVIEW_RUN : receives
    O_REVIEW_RUN ||--o{ O_REVIEW_CHANGE : has
    O_REVIEW_RUN ||--o{ O_EVIDENCE_LINK_REVIEW : has
    O_REVIEW_RUN ||--o{ O_INFERENCE_REVIEW : has
    O_REVIEW_RUN ||--o{ O_CLAIM_REVIEW : has
    R_CHANGE_INVESTIGATION ||--o{ O_REVIEW_CHANGE : receives
    R_OBSERVATION_EVIDENCE ||--o{ O_EVIDENCE_LINK_REVIEW : receives
    R_CLAIM_OBSERVATION ||--o{ O_INFERENCE_REVIEW : receives
    R_CLAIM ||--o{ O_CLAIM_REVIEW : receives
```

The catalog foreign keys establish that definitions and relationships exist. Investigation
validation establishes expected-work coverage and reference integrity. Review establishes
whether linked content supports a conclusion.
