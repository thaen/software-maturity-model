# The implementation plan adds mitigation modeling and assessment views.

The workspace will have two catalogs, relationships between their records, and assessments
of those protections in systems. The implementation starts with authoring and visualization,
then adds the context and evidence needed for organization comparisons and opportunity analysis.
Each increment has a usable output before the next increment begins.

This proposal is ready for review as of 2026-10-12. It includes the model improvements from
the research and all three views in the comparison. The current change catalog remains the
starting point, and its category names are expected to change through the editor.

## The scope follows the decisions already made.

The UI is the authority for definitions, hierarchy, and relationships. The earlier skill
supplies migration material and an assessment method; it is not a second authoring surface.
Text has double-click editing, records have CRUD controls, and hierarchy membership and order
have drag-and-drop operations with keyboard equivalents. The browser page owns vertical
scrolling, and the workflow remains in the sidebar.

Reassessment and invalidation are outside this implementation. There will be no expiry rules,
stale-finding states, invalidation propagation, reminder workflow, or manual renewal process.
Future runs may be weekly or triggered by commits or deployments, depending on cost. Neither
that cadence nor its hooks are being selected now. Each run still records its input snapshot,
time, and available code or deployment reference so its findings have a stated basis.

Generic definitions, relationships, schemas, example data, and workflow code belong in this
public repository. Organization-approved practices, system descriptions, evidence, findings,
and opportunities belong in a workspace in a work repository. The public example workspace
has invented systems and contains no Airbnb material.

## The records keep different claims separate.

The first catalog extension retains the existing change IDs and `nodes` collection. It adds
mitigation groups and definitions, applicability links, conditional rules, and mitigation
relations to a versioned catalog document. Mitigation groups can have nested groups and leaves;
the change editor retains its existing three levels. A shared resolver supplies every view.

- A mitigation definition has its purpose, mechanism, scope guidance, evidence expectations,
  assessment criteria, maturity descriptions, prerequisites, and known limits or adverse effects.
- An applicability link has a change ID, mitigation ID, reason, protected outcome types,
  mechanism in this context, and any condition. A condition begins as editable prose and has
  an explicit applies, does-not-apply, or unknown determination during an assessment.
- A mitigation relation names a prerequisite, an alternative, or a shared failure dependency.
  It has a reason and scope or condition. Alternatives are equivalent only within that scope.
- An approved practice maps one or more generic mitigations to an organization implementation,
  with its operating instructions and constraints. One implementation may serve several systems.
- A mitigation use names the implementation or local mechanism used by a system, its owner,
  configuration, covered boundaries, and dependencies. A use does not itself prove effectiveness.
- A system definition has its support boundary, components and interfaces, owners, dependencies,
  assessed repositories, exclusions, workloads, and user outcomes.
- An outcome has its affected population, measurement, target or tolerance, measurement window,
  and exposure or impact context. Missing values remain unknown rather than being estimated by default.
- An assessment run has its input snapshot, work items, condition determinations, findings,
  claims, and evidence. Evidence supports or challenges a named claim and records its source,
  method, date when known, scope, assumptions, and limits.
- An organization capability finding concerns an ability such as ownership, training,
  staffing, standard adoption, or repeated execution. Its assessment scope is a team or
  organization rather than a product boundary.
- An opportunity has affected systems and outcomes, supporting findings, a proposed action,
  expected result, dependencies, effort and impact estimates with their basis, and observed results.

Stable IDs are independent of titles and paths. Renaming or moving a record preserves its
direct relationships. A move can change the inherited defaults for future work; completed
assessments retain their input snapshots without being marked stale or invalidated.

### The inheritance rules have explicit meanings.

Baseline links can explicitly apply to descendants. The initial vector baselines use this
rule, while source-level coverage sets remain guidance for cases where the vector is unknown.
They do not become requirements for every descendant.

A direct addition has its own reason. An exception identifies the baseline link it excludes
and states why; it does not remove a separate direct addition. The resolver deduplicates
mitigations while retaining the contributing links, conditions, and named ancestors. An
exception outside its referenced ancestor's branch is visible as inactive. Conflicting or
unknown conditions remain unresolved until tailoring supplies a determination.

The ten source-independent conditional rules remain editable catalog records. A matching
rule proposes candidates for tailoring; it does not declare every listed mitigation applicable.
Every resulting assessment row retains the reason for selecting its mitigation.

### The storage model preserves the current editing guarantees.

The first increments extend `web/data/catalog.json` with a new schema version and preserve
existing definitions, IDs, order, origins, and guidance. Migration is explicit and idempotent.
It never overwrites later UI edits or runs automatically on each startup. The server retains
atomic writes, revision conflicts, validation, import and export, and session undo and redo.
Catalog edits that affect several record types are saved as one revision.

A configured workspace directory outside the public static files holds organization records
and assessment runs. Each mutable document has its own revision, and each run contains the
catalog and system context used for that run. Active records have validated references;
completed runs remain self-contained when the current catalog changes. The application shows
the active workspace. Export destinations distinguish the generic catalog from workspace data.

The existing Node server and browser JavaScript remain the implementation base. A database,
hosted account system, background scheduler, or general graph engine is not needed for these
increments. New modules separate validation, relationship resolution, assessment preparation,
and view rendering so the views cannot develop different rules.

## The first increment adds the mitigation editor and migrates the definitions.

The Mitigations sidebar view has a hierarchy of groups and assessable leaves. It has full
definitions, double-click editing, CRUD, drag ordering and membership changes, search, import
and export, and undo and redo. An unlinked mitigation remains available for authoring.

The migration brings over all 106 atomic controls and eight initial families. It retains their
IDs and imports evidence cues and scope guidance. It also drafts criteria and maturity
descriptions for review. The content audit states which text is migrated and which is newly
proposed. Later edits can change the families and definitions without violating a seed test.

Each control's criteria distinguish existence, coverage, observed use, and exercise evidence.
A criterion says what evidence supports it and what would make it partial. A maturity
description can refer to these criteria, but there is no automatic ladder that equates
automation with maturity or requires an operator procedure to become automated.

The increment is complete when all migrated definitions can be authored and saved, their IDs
survive moves, and a version-one change catalog migrates without losing user content. Validation,
persistence, conflict, migration, and editing checks cover those behaviors.

## The second increment adds contextual links and mitigation relations.

The selected change has a relationship list in an optional fourth column. On narrower screens,
the list follows the selected branch. Selection from the mitigation view shows the linked
changes. Both views edit the same records and expose the reason, mechanism, outcomes, and
conditions of a link. Their text fields have the same editing behavior as definitions.

Dragging a mitigation onto a change creates a link. Dragging within its hierarchy changes
its order or membership. These actions have distinct drop targets and keyboard actions.
Removing a link retains its mitigation; deleting a definition states the known relationships
affected and has an undo path.

The migration adds the 52 vector baseline sets, their conditional additions, source coverage
guidance, and ten conditional rules. Reasons and evidence cues are available in the UI.
Inherited links name their origin, and direct links and exceptions have distinct labels.

Mitigation relations have an editor for prerequisites, alternatives, and shared dependencies.
A recovery chain can therefore connect detection, response, and recovery without claiming
three independent protections. The initial strict prerequisite relation rejects cycles;
alternative and shared-dependency relations are symmetric and can form groups. Relations
that need a cyclic runtime model can be described as interaction limits until that model exists.

The increment is complete when a mitigation has several change links, editing either view
updates one record, and link removal does not delete a shared definition. Checks cover
inheritance, exceptions, condition resolution, dangling references, and relation semantics.

## The third increment makes the three connection views part of the app.

The connection list, hierarchy matrix, and paired outlines use the same live catalogs and
selection. A view switch preserves the selected record, applicable filters, and expanded
branches. Each view can open the same definition and relationship editor.

The matrix has changes as rows and mitigation leaves as columns. Both hierarchies collapse
and expand. Cells distinguish direct, inherited, conditional, and excluded relationships with
text or shapes as well as color. Selecting a cell shows its contributing links and conditions.
A blank cell means that no catalog relation is assigned, not that software lacks protection.

A collapsed cell counts distinct effective descendant pairs and exposes the denominator.
Explicit unconditional coverage and conditional coverage have separate counts; unresolved
conditions are not presented as unconditional protection. The relationship details retain
excluded links. Temporary row and column ordering is for analysis and never reparents records
or changes their authored order. Search and selection can open the relevant branch.

The paired outlines show a selection's paths by default. An optional overview shows all paths.
Conditional and inherited relationships remain distinguishable, and the lines follow the
positions of their actual records after expansion, movement, and resizing.

The increment is complete when the real catalogs support all three views and a link edited
in one view appears correctly in the others. Browser checks cover selection from either side,
aggregation denominators, definitions with long text, narrow widths, keyboard use, and native
dragging. A representative catalog also verifies that collapse and selection keep review usable.

## The fourth increment adds systems and approved implementations.

The System assessments area begins with a system-definition editor. It records the whole unit
of supportability, including dependent components, deployment and control planes, infrastructure,
and operator work. It has component and interface boundaries, workload context, owners, and
outcomes, with missing facts visible as unknown.

The Approved practices area has an organization implementation catalog. Its records map to
generic mitigations and have instructions, constraints, and supported mechanisms. The system
editor can attach one implementation to several boundaries and state configuration and coverage
for each use. Local mechanisms and provider guarantees can also have uses without an approved
practice. Evidence of a guarantee is still required in an assessment.

The outcome editor supports correctness, availability, latency, security, privacy, and resource
or cost outcomes without requiring this list to be exhaustive. It has user scope, targets,
measurement windows, exposure, and impact magnitude and duration when known. Quantities have
units and a source. They can later support SLOs and error-budget decisions.

The increment is complete when an invented workspace has two systems using one shared
implementation with different coverage. Generic catalog export excludes their system data,
and workspace validation detects a use that refers to a missing system or implementation.
No Airbnb implementation catalog is populated in this public repository.

## The fifth increment adds the assessment workflow and evidence views.

A preparation command creates work items from a selected system and catalog snapshot. Each
item has one component or interface boundary, one defined source of change, its selected
vectors or kinds, and a small related set of mitigation rows. The item includes applicable
conditions, criteria, outcome context, dependencies, known uses, and evidence locations.

The existing assessment skill is revised to consume these work items instead of rereading
the profile files as catalog authority. The first agent workflow reads the supplied system
material and returns structured findings for import. Preparing an input and importing a result
are repeatable commands; neither requires a scheduler, CI hook, or hosted model gateway.

The workflow inventories selected, excluded, and unresolved changes before inspecting controls.
It records examine, interview, and test evidence with the objects and scope inspected. Existing
test and exercise results can be examined; running production exercises requires authorization
outside the ordinary read-only assessment workflow.

Each criterion has a claim, a determination, and supporting or challenging evidence. The
mitigation summary has present, partial, absent, unknown, or not applicable status with its
reason. Absence requires a stated search boundary. A procedure without exercise evidence is
not described as exercised, and a configured use is not evidence that every workload is covered.

The assessment also examines conditions in which a mitigation is inadequate or harmful. It
records capacity limits, timing and duration requirements, configuration limits, and interactions,
such as retries increasing overload or rollback conflicting with a schema migration. Composition
summaries identify unmet prerequisites, scoped alternatives, and shared failure dependencies.
They preserve each control's observed status and do not inflate coverage by counting linked controls.

The workflow view shows work items, progress, condition determinations, criteria, evidence, and
findings. It supports correction of imported results and records the basis of an override.
Automated runs do not require a human approval step for each finding. Workflow completion is a
count of completed work items, not a protection score.

The increment is complete when one exported work item can produce a validated finding and
the UI can trace its outcome claim back to evidence. Example assessments cover documented but
unexercised recovery, partial workload coverage, unknown access, an unmet prerequisite, a scoped
alternative, and a mitigation with an adverse effect. The checks exercise actual determination
rules and reject results that refer to records outside the supplied work item.

## The sixth increment adds organization capabilities and comparisons.

The organization view compares findings across systems, teams, changes, mitigations, outcomes,
and approved implementations. It can show reuse and coverage of shared infrastructure while
retaining each consumer's configuration and evidence.

Product protection and organization capability have separate views. Capability criteria cover
ownership, training, staffing, standard adoption, execution, and learning from incidents. A
capability finding has its own evidence and scope; it is not inferred from a product's control count.
Capability gaps can explain difficulty sustaining a protection without replacing product findings.

Assessment matrices show statuses with their unknown and not-applicable meanings preserved.
An omitted row is not an evaluated row. The default comparison uses the most recent complete
run selected for each system and identifies its input snapshot. Draft runs and incompatible
criteria remain visible and distinguishable; no freshness or invalidation policy is applied.
Different definitions or criteria are not silently treated as an equivalent determination.

The increment is complete when the example workspace distinguishes a product protection gap,
an evidence gap, and an organization capability gap. A shared implementation with incomplete
consumer coverage is visible without marking every consumer protected. Comparisons link to
the individual findings and avoid a universal maturity total.

## The seventh increment adds opportunities and an improvement feedback loop.

Opportunity analysis has two outputs: a repair for a specific system and an initiative that
addresses a pattern across systems or teams. Candidates name the affected outcomes, findings,
conditions, prerequisites, and common causes. They can group repeated uses of one implementation
without pretending that those uses are independent problems.

Priority has an explanation based on consequence, exposure, outcome targets, dependency position,
and the reach and effort of a proposed fix. Impact estimates and uncertainty have separate fields.
Unknown exposure does not become a low risk by default. Numeric estimates require a stated basis;
the first implementation has no synthetic FMEA score or universal maturity ranking.

The first agent analysis receives bounded finding groups and proposes candidates with evidence
links. Deterministic checks establish that the cited findings exist and have the stated statuses.
You can edit, merge, dismiss, or select a candidate. There is no requirement that every assessment
receive human review before a candidate can be generated.

An opportunity records the expected result, implemented action, and observed result. Measurements
can include the affected user outcome, delivery measures such as failure or recovery rates, and
effort or cost. The comparison states its time window and system context; a change in the measure
alone is not proof that the action caused it. This is an improvement record, not an assessment
expiry or renewal mechanism.

The example workspace includes a customer-facing system with missing traffic protection and
several teams with repeated manual release work. The analysis must distinguish a targeted repair
from a shared initiative and state the evidence for each. It also includes a capability gap and
a case with insufficient evidence, so the model cannot treat every unknown as a confirmed defect.

An intersection view, following UpSet, shows combinations of gaps across systems once these
findings exist. It links counts to the participating systems. A bounded edge-bundling experiment
then tests whether an overview helps with a larger catalog; the existing list and matrix remain
the means of checking individual associations. This experiment is not a prerequisite for the
catalog, assessment workflow, or opportunity analysis.

The increment is complete when candidate generation has a reviewed example set covering these
cases, candidate evidence is traceable, and an implemented opportunity can record its observed
result. Research into ranking can continue without delaying the preceding increments.

## The review can focus on three proposed choices.

The first choice is to make all three connection views available while retaining the optional
fourth column as an editing surface. The second is to keep catalog storage in versioned JSON
and put organization data in a separately configured workspace. The third is to implement
criterion-level evidence and typed mitigation relations before organization-wide ranking.
These choices affect the product and implementation scope; routine module names and layout
details remain implementation decisions.

## The precedents explain the proposed rules.

[Bertifier](https://charlesperin.net/publications/bertifier),
[TreeMatrix](https://profs.etsmtl.ca/mmcguffin/research/2012-rufiange-TreeMatrix/rufiange-cgf2012-TreeMatrix.pdf),
and [Juniper](https://www.visdesignlab.net/publications/2018_infovis_juniper/) inform the
hierarchy matrix and selection views.
[Bowtie recovery controls](https://www.caa.co.uk/safety-initiatives/working-with-industry/bowtie/bowtie-elements/recovery-controls/)
inform the distinction between a recovery chain and independent protections.
[SAMM assessment criteria](https://owaspsamm.org/assessment/) inform determinations,
while [STPA](https://psas.scripts.mit.edu/home/get_file.php?name=STPA_Handbook.pdf) informs
interaction and timing limits.

[Google's production-readiness work](https://sre.google/sre-book/evolving-sre-engagement-model/)
informs shared implementations, and [SLO guidance](https://sre.google/workbook/implementing-slos/)
informs outcome context. [CMMI](https://cmmiinstitute.com/learning/appraisals/levels) informs
the separation of product findings and organization capability.
[SACM](https://www.omg.org/spec/SACM/2.3/PDF) informs claim-specific evidence, and
[DORA](https://dora.dev/guides/dora-metrics/) informs improvement measurements.

The three catalog views describe expected relationships; an assessment supplies the evidence
of protection in a system.
