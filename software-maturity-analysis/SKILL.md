---
name: software-maturity-analysis
description: Assess the maturity of an existing software system by comparing observed controls with a source-of-change and mitigation catalog. Use for service maturity reviews, operational maturity assessments, and resilience-control inventories; do not use for failure-mode or risk-priority analysis.
---

# The skill produces an evidence-based maturity analysis.

The skill evaluates how a system limits, detects, and recovers from changes that can affect its users. The unit under review is the unit of supportability, not merely one repository or one deployed process.

The skill does not create failure modes, calculate risk-priority numbers, or require a database. It compares the system that exists with a pre-written catalog of applicable controls.

## The agent establishes scope before it assesses controls.

The agent identifies the customer-facing interface or installed release, its dependent components, its control and deployment planes, its supporting infrastructure, and its manual operating procedures. The agent records boundaries, excluded systems, and sources that are not applicable before recording a control as absent.

Read [the source catalog](references/sources-of-change.md) while defining scope. Read [the applicability matrix](references/applicability-matrix.md) when selecting the controls to assess. Read only the relevant sections of [the mitigation catalog](references/mitigation-catalog.md) for the selected controls.

## The agent performs a matrix comparison.

1. The agent selects the applicable sources of change and the system components that each source can affect.
2. The agent expands the applicable matrix rows into assessment rows. Each row covers one component, one source, and one atomic mitigation.
3. The agent inspects the system and records the control status, the scope it covers, and a concise pointer to the observed evidence.
4. The agent distinguishes present, partial, absent, unknown, and not-applicable controls according to [the assessment method](references/assessment-method.md).
5. The agent reports maturity by source, names incomplete coverage and uncertainty, and proposes the next control or investigation that would reduce the gap.

The agent treats the matrix as a starting catalog, not as proof that every control belongs in every system. A control that is not applicable needs a stated reason. A control is unknown when access or evidence is insufficient, and it is absent only after an inspection with a stated search boundary.

## The report describes protection rather than failure risk.

The report shows the system boundary, applicable sources, source-by-mitigation results, coverage by user outcome, strengths, gaps, and unknowns. The report can record change frequency as an exposure field when the evidence is available.

The prototype does not calculate one maturity total. A numeric score should be introduced only after several assessments provide a calibration basis. The agent may describe a source as unprotected, partially protected, protected, or demonstrated through exercise when the recorded rows support that conclusion.

## The work can later be partitioned without changing the method.

When delegation is available and appropriate, one work item covers a defined component or boundary, one source of change, and a small related set of mitigations. The work item returns completed assessment rows and evidence pointers; it does not make the system-wide conclusion. The coordinating agent reconciles overlapping component boundaries and produces the final report.

The skill does not require delegation. A single agent can perform the same rows in sequence when the system is small or when access should remain narrow.
