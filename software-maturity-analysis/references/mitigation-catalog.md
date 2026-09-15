# The mitigation catalog defines atomic controls.

Each item describes one kind of control that an agent can assess independently. The family labels organize the catalog, but they are not the assessment unit.

## The testing family establishes whether behavior has been exercised.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| T01 | The system has focused behavior tests for owned code. |
| T02 | The system has integration tests across the components that must work together. |
| T03 | The system has compatibility or contract tests for an interface it provides or consumes. |
| T04 | The system has synthetic checks against a production-deployed binary or an equivalent installed release. |
| T05 | The system has load or capacity tests that represent its demand and resource profile. |
| T06 | The system has fault-injection or recovery exercises for its infrastructure and dependencies. |
| T07 | The system has negative, boundary, or adversarial-input tests for request handling. |
| T08 | The system has dry runs or isolated tests for deployment artifacts and infrastructure changes. |

## The review family controls decisions before they change users' experience.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| R01 | The system has peer review for code, configuration, and deployment artifacts. |
| R02 | The system has a capacity, resilience, or operational review for structural changes. |
| R03 | The system has explicit review for dependency and version changes. |
| R04 | The system has compatibility review for interfaces, schemas, and protocols. |
| R05 | The system has automated or human policy gates for high-impact changes. |

## The validation family rejects a change or input that violates known rules.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| V01 | The system has build, static-analysis, or reproducibility validation for code and artifacts. |
| V02 | The system validates configuration values, ranges, and semantic relationships before activation. |
| V03 | The system validates data, schema, or migration compatibility before state changes take effect. |
| V04 | The system validates infrastructure declarations and deployment plans before applying them. |
| V05 | The system validates request structure, authorization, limits, and input constraints at its boundary. |
| V06 | The system validates readiness and health before a release receives normal traffic. |
| V07 | The system validates interface and version compatibility between communicating components. |
| V08 | The system validates dependency reachability, required permissions, and credential readiness. |

## The rollout family limits the scope of an unsafe change.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| G01 | The system stages application and dependency releases through limited exposure. |
| G02 | The system stages runtime configuration and feature activation through limited exposure. |
| G03 | The system stages infrastructure and topology changes through limited exposure. |
| G04 | The system has bake periods and measured gates that pause or stop an unsafe rollout. |
| G05 | The system coordinates producer and consumer changes through compatibility windows or ordered rollout. |
| G06 | The system stages credential, key, or certificate rotation without a single cutover. |

## The detection family observes user outcomes and control health.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| D01 | The system monitors user-visible correctness, availability, and latency outcomes. |
| D02 | The system detects release regressions through deploy-aware monitors or comparable signals. |
| D03 | The system monitors synthetic user journeys or equivalent active probes. |
| D04 | The system monitors infrastructure, platform, and topology health. |
| D05 | The system monitors demand, saturation, queueing, and traffic distribution. |
| D06 | The system monitors invalid requests, hot keys, costly operations, or input-abuse patterns. |
| D07 | The system monitors dependency availability, latency, error rates, and contract behavior. |
| D08 | The system records and monitors effective configuration and configuration propagation. |
| D09 | The system detects data-integrity drift through reconciliation, invariants, or comparable checks. |

## The automatic-mitigation family reduces harm without waiting for an operator.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| A01 | The system automatically reverts an unsafe release or configuration change from a trusted signal. |
| A02 | The system automatically replaces unhealthy capacity or scales a healthy pool. |
| A03 | The system automatically admits, sheds, or throttles demand to protect its capacity. |
| A04 | The system automatically rejects invalid or dangerous requests at a boundary. |
| A05 | The system uses bounded retries, deadlines, circuit breaking, or equivalent dependency containment. |
| A06 | The system automatically shifts away from unhealthy infrastructure or a failed dependency path. |
| A07 | The system automatically renews or rotates credentials before service loss. |

## The operational-control family gives operators a safe response path.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| O01 | The system has a fast manual rollback or state-revert path. |
| O02 | The system has an operator-controlled traffic shift or failover path. |
| O03 | The system has an operator-controlled throttle, block, or demand-shedding path. |
| O04 | The system has a kill switch or feature-disable path for harmful behavior. |
| O05 | The system has an operator path to add capacity or quarantine unhealthy resources. |
| O06 | The system has a documented degraded-mode or dependency-failover path. |
| O07 | The system has a current runbook, escalation path, and owner for the response. |
| O08 | The system has evidence that the response path has been exercised. |

## The architectural family contains a change before it becomes a broad user failure.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| H01 | The system uses reproducible, immutable artifacts and pinned dependency versions. |
| H02 | The system remains safe when controlled configuration is stale or temporarily unavailable. |
| H03 | The system uses redundancy and fault-domain separation for needed capacity and data. |
| H04 | The system isolates tenants, workloads, or dependencies with bulkheads or separate resource pools. |
| H05 | The system uses bounded queues, backpressure, deadlines, or load isolation to limit propagation. |
| H06 | The system provides a safe degraded response, fallback, or cached result when work cannot complete. |
| H07 | The system protects persistent-state integrity through backups, reconciliation, recovery, or equivalent design. |
| H08 | The system limits change blast radius through cells, partitions, or other independent deployment scopes. |
