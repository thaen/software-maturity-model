# The assessment method compares expected and observed protection.

The expected profile contains controls tailored to a boundary and change. The observed profile
contains criterion conclusions, observations, and evidence for those controls. Candidate counts
are not a maturity score. Each conclusion has the scope it establishes and the limits it retains.

## The status has a meaning within the stated criterion.

| Status | The status applies when this statement is true. |
| --- | --- |
| Present | The evidence supports the criterion throughout the claimed scope and condition. |
| Partial | The evidence supports part of the criterion or scope, and the uncovered part is stated. |
| Absent | A bounded inspection did not find the expected protection or criterion behavior. |
| Unknown | Access, evidence, or a missing boundary fact prevents a determination, and the limit is stated. |
| Not applicable | The criterion or control does not apply to this boundary and change, and the reason is stated. |

A pending record has not been investigated. Unknown is a completed determination about an
evidence limit. A criterion about existence can be present while coverage is partial and
exercise is unknown. The finding describes the control's protection as a whole and must not
claim coverage beyond its supporting criteria.

## The evidence method has a stated inspection scope.

Examination reads implementation paths, configuration, artifacts, dashboards, deployment
records, runbooks, incidents, and other records. Interviews can explain ownership and locate
evidence when access permits. Test evidence includes an existing execution or exercise, or a
check authorized by the system owner. Interview statements do not replace obtainable records.

Record the evidence source and locator, revision when available, inspected excerpt or result,
method, capture time, and scope. A documentation statement does not establish execution.
A configuration entry does not establish that every path uses it. A shared implementation
can protect several paths, but common dependencies can defeat those protections together.

Absence requires a search boundary and the objects examined. Lack of access supports unknown
rather than absent. Provider-owned guarantees need supplied contract, architecture, or exercise
evidence; a client call does not establish the provider's backup, durability, or recovery control.

## Review checks the claimed support relation.

The source review checks the evidence against the observation. The inference review checks the
observation against the criterion conclusion, including conditions, scope, and contrary evidence.
The claim review has a verdict on the complete conclusion. Exclusions and tailoring reasons
receive review as well. The [record format](record-format.md) defines the target collections.

Supported means the stated relationship or conclusion is justified within its scope.
Partially-supported means some of it is justified and the remainder is stated. Unsupported
means the cited content does not justify it. Unable-to-verify means the reviewer cannot establish
support with available access. An unsupported verdict can finish a review target.
