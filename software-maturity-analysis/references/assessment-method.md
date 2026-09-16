# The assessment method turns expected controls into an observed control profile.

An expected control profile is the tailored set of controls that a component, source, and change
path should have. An observed control profile records the evidence and status for those controls.
The method evaluates controls; it does not invent failure modes or assign risk-priority scores.

## The agent inventories vectors before it selects controls.

For every source that reaches a boundary, the agent records every child vector from the source
profile as selected, excluded, or awaiting discovery. An exclusion states why the vector cannot
reach the boundary. An awaiting-discovery vector states the missing fact that would classify it.

| Boundary | Source | Vector | Disposition | Basis or missing fact |
| --- | --- | --- | --- | --- |
| `example-api` | S7 | S7.2 | Awaiting discovery | The available description does not identify whether any operation has a costly query path. |

The expected control profile contains rows only for selected vectors. The inventory prevents an
agent from treating an omitted vector as an evaluated vector.

## Each assessment row has a bounded determination.

Each row contains the component or interface boundary, source ID, child change-vector ID when
known, mitigation ID, tailoring reason, control owner, user outcomes covered, status, assessment
method, objects examined, evidence pointer, evidence date when known, scope covered, and notes.
The control owner is the assessed team, an external provider, or shared. The evidence pointer can
name a repository path and line, a configuration path, a dashboard, a deployment record, a
runbook, an interview record, or a direct observation.

The expected-profile work list has this reusable shape:

| Boundary | Source and vector | Mitigation | Control owner | Selection reason | Assessment method | Evidence to seek |
| --- | --- | --- | --- | --- | --- | --- |
| `example-api` | S7.2 | A04 | Assessed team | The operation has a costly query path. | Examine, test | Boundary code, limit configuration, and a safe test result. |

The observed-profile row adds status, evidence pointer, evidence date, scope covered, and notes
to the same work-list row. The agent keeps a removed or added control in the expected profile
with its tailoring reason rather than silently changing the profile.

The row is the smallest work unit that can become a delegated task. A delegated task receives
its boundary, source, mitigation IDs, expected evidence locations, and a stopping point; it
returns row candidates without changing the system-wide conclusion.

## The agent uses three evidence-gathering methods.

| Method | The agent uses the method for this purpose. |
| --- | --- |
| Examine | The agent reads a code path, declaration, policy, dashboard, deployment record, runbook, incident record, or other durable object. |
| Interview | The agent asks an owner or operator how the control operates, where its evidence is, and what scope it covers. Interview evidence does not replace an obtainable durable object. |
| Test | The agent observes an existing test or exercise, or performs a safe and authorized check of the control. The agent does not introduce production traffic, faults, or state changes without authorization. |

The assessment method records the objects inspected and the coverage depth. A control can need
more than one method. For example, an examined runbook establishes that a response procedure is
documented, while an observed exercise establishes that the procedure was used successfully.

## The agent uses consistent control statuses.

| Status | The status applies when this statement is true. |
| --- | --- |
| Present | The control exists, is active for the assessed scope, and evidence supports the stated determination. |
| Partial | The control exists but does not cover all relevant components, outcomes, workloads, change paths, or fault domains. |
| Absent | The stated inspection scope was searched and the expected control was not found. |
| Unknown | The available access or evidence cannot establish whether the control exists or covers the need. |
| Not applicable | The source, change vector, or mitigation does not apply to this scope, and the row states why. |

The agent does not infer absence from a lack of access. The agent does not treat a documented
control as exercised merely because it exists.

## The report compares the two control profiles.

The report includes these sections:

1. The report defines the support boundary, customer-facing unit, owners, exclusions, evidence limits, and user outcomes in scope.
2. The report identifies applicable sources of change, child vectors, and the expected control profiles selected for each component or interface.
3. The report presents the observed rows grouped by source profile and mitigation family.
4. The report summarizes present, partial, absent, unknown, and not-applicable controls for each source and outcome.
5. The report identifies outcome coverage that depends on partial, absent, or unknown controls.
6. The report names the next controls and investigations, including the source, outcome, and evidence that motivated each item.
7. The report records relevant incidents, exercises, assumptions, and optional change-frequency information.

The report may characterize a source as unprotected, partially protected, protected, or
demonstrated through exercise. It does not calculate a universal maturity total in this version.

## The agent keeps work units narrow and composable.

A work unit covers one source within one named component or interface boundary, plus a small
related set of mitigation IDs. It has supplied scope, evidence locations, rows to return, and a
stopping point after those rows are complete.

The coordinating agent assigns overlapping boundaries only when the distinction is clear. For
example, an external dependency can be assessed separately for each caller, while a shared
deployment control can be assessed once and then referenced by several components.
