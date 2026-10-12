---
name: software-maturity-analysis
description: Investigate a software system against an exported change and mitigation catalog, with mechanisms, observations, evidence, criterion conclusions, and a separate review of their support. Use for software maturity and resilience-control investigations; do not use for failure-mode scoring or risk-priority numbers.
---

# The Skill investigates protection against software change.

The investigation compares a system's protections with definitions supplied by the catalog.
The webapp owns those definitions. A run uses a frozen version 2 JSON export, including change
categories, subcategories, kinds, mitigation criteria, applicability reasons, conditions,
outcomes, and mitigation dependencies. Do not substitute the catalog's initial reference
files or recollection for that export. Missing definitions are questions for the catalog
owner; an investigation does not silently rewrite them.

The unit of supportability includes the customer interface or installed release, components,
deployment and control planes, infrastructure, dependencies, and operator procedures. Product
protection differs from organization capability. A practice being approved by an organization
is not evidence that the assessed system uses it.

## The system description defines the investigation boundary.

Read the system description and available evidence before selecting work. Record owners,
components, interfaces, repositories and revisions, operating paths, dependency responsibilities,
exclusions, evidence access, and user outcomes with targets and consequences when known.
Distinguish client-owned controls from provider guarantees, configuration values from their
propagation, deployment artifacts from platform behavior, and demand from request meaning.
An unresolved responsibility or boundary remains an explicit question.

Read [the record format](references/record-format.md) to prepare the run and use its helper.
Keep private system information, evidence, and results in the system's work repository.
The public catalog contains generic definitions. A run captures its input revision and
catalog snapshot; later authoring edits do not alter that snapshot.

## The expected work exists before conclusions are written.

Prepare a row for every catalog change within each boundary. Determine whether each is
selected, excluded, or unresolved, with a reason. A parent exclusion requires an explicit
reason on every descendant; a missing child row is an omission. Investigate parent categories
as scope and classification decisions as well as assessing their child paths. Avoid claiming
that draft example kinds exhaust the scope of their parent.

For each boundary/change pair, evaluate every conditional rule. Tailor inherited and direct
baseline candidates, conditional candidates, and prerequisites. Retain excluded and unresolved
candidates with reasons, along with every contributing applicability link, rule, or manual
addition. An inherited exception suppresses its named baseline, not independent reasons to
select the same mitigation. A condition is a hypothesis to examine, not a claim that a control
exists. Scope-specific alternatives and shared failure dependencies prevent counting protections
as independent merely because they have different IDs.

The helper scaffolds pending findings and one pending claim for every criterion of every
candidate mitigation. Pending differs from investigated unknown. Use `scaffold` after tailoring
conditions to align the expected rows. Do not delete difficult work or invent evidence to
satisfy a field. Excluded rows receive not-applicable conclusions with their reasons; unresolved
rows receive unknown conclusions and the missing facts.

## Each work item has one boundary and one change definition.

Use the helper's `work-item` command to obtain the boundary, change definition and guidance,
conditions, candidate mitigations, selection reasons, criteria, maturity descriptions, and
pending rows. Follow the relevant paths rather than handing the whole catalog to one unbounded
prompt. Record findings in the run, preserving IDs and the captured definitions.

Use examination, interviews when available, and existing test or exercise records. Checks
that introduce traffic, faults, or state changes require the system owner's authorization.
Record where the search started and stopped, what was inspected, and access limits.
The Skill grants no permission to contact people or operate production systems.

## Observations and evidence have different meanings.

A mechanism is the configured implementation or operating procedure found in the system.
Record its owner, configuration, coverage, limits, and dependencies. Map it to one or more
mitigation definitions; that mapping is classification rather than proof of effectiveness.
A shared mechanism can inform several change investigations within its boundary.

An observation states what was found. Evidence records its code or document URI, revision,
line or section locator, inspected excerpt or result, method, scope, and capture time.
Link observations to evidence with a supports, challenges, or context relation and a reason.
Then link criterion claims to observations with a separate relation and explanation.
Preserve contrary evidence. A search for a missing control can be an observation without
an invented mechanism.

Read [the assessment method](references/assessment-method.md) for status meanings and evidence
limits. For each criterion, distinguish existence, activation, coverage, exercise, limits,
and adverse effects according to its definition. A limiter implementation can establish
existence while leaving route coverage unknown. A runbook establishes documentation; a matching
exercise record is needed to establish exercised response behavior.

## Conclusions retain uncertainty and their scope.

Complete each finding and criterion claim as present, partial, absent, unknown, or not-applicable.
A present conclusion must match the coverage and condition it claims. Absence needs a bounded
search. Unknown needs the missing evidence or access limit. A control can exist while a coverage
or exercise criterion remains partial or unknown. Maturity descriptions guide interpretation;
they are not a universal numeric score.

Validate the run with `validate --complete` before declaring the investigation complete.
The validator checks references and expected work; it cannot judge semantic support.
Report the boundary, expected and observed protections by change, outcome coverage, gaps,
uncertainty, evidence, and the next targeted action. Do not claim an outcome is protected merely
because candidate controls are numerous. Keep product gaps separate from opportunities that
require comparing practices across teams.

## Review verifies evidence and inference for every change.

Use the helper's `review` command on the completed investigation. The separate review has
pending targets for every change, every observation/evidence link, every claim/observation
link, and every criterion claim. Reused evidence links have one target and remain attributable
to every change that uses them. The review includes exclusions, unresolved applicability,
contrary evidence, and unknown conclusions.

Open each cited source and verify its content, locator, revision when available, and scope
against the observation's stated relation. Then check whether the observation supports the
criterion conclusion, including conditions, coverage, dependencies, limits, and contradictions.
Finally record a verdict on the whole claim and the change's tailoring. These are separate
checks. Source code that defines a limiter can pass evidence review while a claim that every
request is throttled fails inference review.

Each target ends supported, unsupported, partially-supported, or unable-to-verify, with an
explanation. Review completion means every target was addressed; it does not mean every
conclusion passed. Use `validate-review --complete` and report unresolved support explicitly.
Keep the assessed result fixed during review. A corrected result has a successor run that
references the prior run and receives its own review.
