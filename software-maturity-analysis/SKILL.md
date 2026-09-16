---
name: software-maturity-analysis
description: Assess an existing software system by comparing evidence of its controls with tailored expected control profiles for sources of change. Use for service maturity reviews, operational maturity assessments, and resilience-control inventories; do not use for failure-mode or risk-priority analysis.
---

# The skill produces an evidence-based maturity analysis.

The skill assesses how a system limits, detects, and recovers from changes that can affect its
users. The unit under review is the unit of supportability, not merely one repository or one
deployed process.

The skill does not create failure modes, calculate risk-priority numbers, or require a
database. It compares the observed control profile of a system with an expected control profile
that is tailored to its support boundary.

## The assessment has six defined phases.

The agent may return to an earlier phase when new evidence changes the support boundary, a
source classification, or a control's applicability. The phase outputs make that iteration
visible rather than treating it as an error.

### Phase 1 frames the assessment.

The agent identifies the customer-facing interface or installed release, dependent components,
control and deployment planes, supporting infrastructure, manual operating procedures, owners,
and exclusions. It records the user outcomes in scope: correctness and data integrity,
availability and durability, latency and capacity, security and privacy, compatibility, and
resource efficiency.

The phase input is the available system description and evidence access. Its output is a scoped
support-boundary statement, a list of components and interfaces, known change history or
incidents, and stated evidence limits. The phase ends when the agent can name the boundary that
each later row will assess; a missing boundary remains an explicit uncertainty.

The agent resolves queue ownership, shared-platform ownership, and the client or provider role
for each dependency before it selects a source profile. It distinguishes deployment artifacts
from platform behavior, configuration propagation from the configuration state it changes, and
demand behavior from request meaning. An unresolved boundary becomes an explicit classification
question rather than an assumed source.

### Phase 2 builds the expected control profile.

The agent classifies applicable sources of change and reads the corresponding files in
[the source profiles](references/source-profiles/). A source profile supplies child change
vectors, default mitigation IDs, selection reasons, and evidence cues. The agent tailors each
default set to the component or interface in scope, adds controls for a material path that the
profile does not cover, and records a reason for every removed control.

When the child vector is known, the agent starts with that vector's baseline and conditional
controls rather than the full source-level coverage set. It uses the source-level set only when
the vector remains unknown or when it needs to identify a missed conditional control.

For every applicable source, the agent makes a vector inventory that marks each child vector as
selected, excluded with a reason, or awaiting discovery. It reads [the conditional-control
rules](references/conditional-control-rules.md) when a baseline or vector description identifies
a material state, capacity, recovery, request, dependency, identity, compatibility,
configuration, tenant-isolation, or data-protection path.

The output is an expected control profile for each component-or-boundary and source pair. The
phase ends when every applicable source has a tailored control set and every omission has a
reason. The agent reads definitions for the selected IDs in
[the mitigation catalog](references/mitigation-catalog.md).

### Phase 3 prepares assessment rows.

The agent expands each expected control profile into one row per component or boundary, source,
change vector when known, and atomic mitigation. It selects one or more assessment methods for
each row—examine, interview, or test—using [the assessment method](references/assessment-method.md).

The output is a work list with evidence locations or evidence requests. The phase ends when each
row has a clear determination to make and a bounded evidence search.

### Phase 4 gathers evidence.

The agent examines source, configuration, artifacts, dashboards, records, and runbooks; it
interviews knowledgeable people when access permits; and it uses test evidence only when the
test is safe and authorized. It records direct evidence pointers and the scope that each item
covers. Recent incidents, reversals, and exercises can demonstrate response controls when they
match the assessed path.

The phase ends when each row has sufficient evidence for a status or a recorded evidence limit.
The agent does not infer absence from a lack of access.

### Phase 5 makes control judgments.

The agent records present, partial, absent, unknown, or not-applicable according to [the
assessment method](references/assessment-method.md). An absence needs a stated inspection
boundary. A documented control is not demonstrated through exercise unless evidence shows that
it ran or was observed in use.

The output is the observed control profile: the expected rows plus their statuses, evidence,
scope, and outcome coverage. The phase ends when all selected rows have a status and the
remaining uncertainty is explicit.

### Phase 6 reports and improves the system.

The agent reports the support boundary, expected and observed control profiles, maturity by
source and user outcome, strengths, gaps, uncertainty, and the next control or investigation
that would reduce a stated gap. It may describe a source as unprotected, partially protected,
protected, or demonstrated through exercise when the rows support that conclusion.

The skill does not calculate a universal maturity total. A numeric score needs calibration from
several completed assessments before it can have a stable meaning.

## The work can be partitioned without changing the method.

When delegation is available and appropriate, one work item covers a defined component or
interface boundary, one source profile, and a small related set of mitigation rows. The work item
returns evidence-backed row candidates; it does not make the system-wide conclusion. The
coordinating agent reconciles shared controls and overlapping boundaries before reporting.

The skill does not require delegation. A single agent can complete the same rows in sequence
when the system is small or when evidence access should remain narrow.
