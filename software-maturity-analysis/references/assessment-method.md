# The assessment method turns the catalog into a maturity report.

The assessment asks which applicable controls the support boundary has, how far those controls reach, and whether they have been exercised. It does not ask an agent to invent failure modes or assign risk-priority scores.

## The agent creates an assessment row for each control under review.

Each row contains the component or boundary, source ID, mitigation ID, status, user outcomes covered, scope covered, evidence pointer, evidence date when known, and notes. The evidence pointer can name a repository path and line, a configuration path, a dashboard, a deployment record, a runbook, or a direct observation.

The row is the unit that can later become a delegated task. A delegated task receives its system boundary, source, mitigation IDs, and evidence locations; it returns row candidates without changing the system-wide conclusion.

## The agent uses consistent control statuses.

| Status | The status applies when this statement is true. |
| --- | --- |
| Present | The control exists, is active for the assessed scope, and has evidence that it covers the stated need. |
| Partial | The control exists but does not cover all relevant components, outcomes, workloads, or change paths. |
| Absent | The stated inspection scope was searched and the expected control was not found. |
| Unknown | The available access or evidence cannot establish whether the control exists or covers the need. |
| Not applicable | The source or mitigation does not apply to this system, and the row states why. |

The agent does not infer absence from a lack of access. The agent does not treat a documented control as demonstrated unless evidence shows that it has been exercised or that its behavior has been observed in use.

## The agent reports maturity by source and by outcome.

The report includes these sections:

1. The report defines the support boundary, the customer-facing unit, and exclusions.
2. The report lists applicable sources of change and the components that each source reaches.
3. The report presents the assessment rows grouped by source and mitigation family.
4. The report summarizes present, partial, absent, unknown, and not-applicable rows for each source.
5. The report states which user outcomes have broad coverage and which outcomes depend on partial, absent, or unknown controls.
6. The report names the most useful next controls and investigations, including the source and outcome each item addresses.
7. The report records assumptions, evidence limits, and optional change-frequency information.

The report may characterize a source as unprotected, partially protected, protected, or demonstrated through exercise. It does not calculate a universal maturity total in this prototype.

## The agent keeps future work units narrow and composable.

A work unit covers one source within one named component or interface boundary, plus a small related set of mitigation IDs. It has a supplied scope, evidence locations, a list of rows to return, and a stopping point after those rows are complete.

The coordinating agent assigns overlapping boundaries only when the distinction is clear. For example, an external dependency can be assessed separately for each caller, while a shared deployment control can be assessed once and then referenced by several components.
