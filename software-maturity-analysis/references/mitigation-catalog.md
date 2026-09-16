# The mitigation catalog defines atomic controls.

Each item names one independently assessable control. The family labels organize the catalog,
but they are not the unit of assessment. A source profile selects default IDs, and an assessor
tailors that selection to a defined support boundary.

## The testing family establishes whether behavior has been exercised.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| T01 | The system has focused behavior tests for owned code. |
| T02 | The system has integration tests across components that must work together. |
| T03 | The system has compatibility or contract tests for an interface it provides or consumes. |
| T04 | The system has a synthetic check against a production-deployed binary or an equivalent installed release. |
| T05 | The system has a load or capacity test that represents its demand and resource profile. |
| T06 | The system has a fault-injection exercise for a relevant dependency or infrastructure failure. |
| T07 | The system has a failover exercise for a relevant serving path. |
| T08 | The system has a restore or recovery exercise for persistent state. |
| T09 | The system has negative, boundary, or adversarial-input tests for request handling. |
| T10 | The system has a dry run or isolated test for a deployment artifact or infrastructure change. |
| T11 | The system has a rehearsal for a data migration, repair, or forward-recovery procedure. |

## The review family controls decisions before they change users' experience.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| R01 | The system has independent peer review for owned-code changes. |
| R02 | The system has independent peer review for controlled runtime-state changes. |
| R03 | The system has independent peer review for deployment or infrastructure-support artifacts. |
| R04 | The system has explicit capacity review for a structural change. |
| R05 | The system has explicit resilience or recovery review for a structural change. |
| R06 | The system has explicit review for a dependency or version change. |
| R07 | The system has compatibility review for an interface, schema, or protocol change. |
| R08 | The system enforces a policy gate before a high-impact change proceeds. |
| R09 | The system has explicit security or privacy review for a relevant design or change. |

## The validation family rejects a change or input that violates known rules.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| V01 | The system produces a reproducible build that is traceable to its declared source and inputs. |
| V02 | The system applies static analysis to owned source before release. |
| V03 | The system validates configuration syntax, types, and required fields before activation. |
| V04 | The system validates semantic relationships among configuration values before activation. |
| V05 | The system validates schema or migration compatibility before persistent-state changes take effect. |
| V06 | The system validates infrastructure declarations before applying them. |
| V07 | The system validates a deployment plan before applying it. |
| V08 | The system validates readiness and health before a release receives normal traffic. |
| V09 | The system validates request structure and size at its boundary. |
| V10 | The system validates request authorization at its boundary. |
| V11 | The system validates request constraints and semantic preconditions at its boundary. |
| V12 | The system validates interface and version compatibility between communicating components. |
| V13 | The system validates dependency reachability before a dependency is required for service. |
| V14 | The system validates required dependency permissions before a dependency is required for service. |
| V15 | The system validates credential readiness before credentials are required for service. |
| V16 | The system verifies artifact provenance and dependency integrity before deployment or execution. |

## The rollout family limits the scope of an unsafe change.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| G01 | The system stages an application or dependency release through limited exposure. |
| G02 | The system stages a runtime-configuration or feature-activation change through limited exposure. |
| G03 | The system stages an infrastructure or topology change through limited exposure. |
| G04 | The system uses a measured bake period or gate that pauses or stops an unsafe rollout. |
| G05 | The system coordinates producer and consumer changes through a compatibility window or ordered rollout. |
| G06 | The system stages credential, key, or certificate rotation without a single cutover. |
| G07 | The system stages a persistent-state migration or backfill in reversible increments. |

## The detection family observes user outcomes and control health.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| D01 | The system defines service objectives for its user outcomes. |
| D02 | The system measures user-visible correctness, availability, and latency outcomes. |
| D03 | The system alerts when an observed outcome risks its stated objective. |
| D04 | The system detects release regressions through deploy-aware monitors or comparable signals. |
| D05 | The system monitors synthetic user journeys or equivalent active probes. |
| D06 | The system monitors infrastructure, platform, and topology health. |
| D07 | The system monitors demand, saturation, queueing, and traffic distribution. |
| D08 | The system monitors invalid requests, hot keys, costly operations, or input-abuse patterns. |
| D09 | The system monitors dependency availability and latency. |
| D10 | The system detects dependency contract or semantic changes that affect its behavior. |
| D11 | The system records and monitors effective configuration and configuration propagation. |
| D12 | The system detects divergence between intended and deployed artifacts or infrastructure state. |
| D13 | The system detects data-integrity drift through reconciliation, invariants, or comparable checks. |
| D14 | The system has correlated logs, traces, or diagnostic context for a user operation across its support boundary. |
| D15 | The system records security-relevant access and change actions. |
| D16 | The system detects material resource-efficiency or cost regressions where that outcome is in scope. |

## The automatic-mitigation family reduces harm without waiting for an operator.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| A01 | The system automatically reverts an unsafe release or configuration change from a trusted signal. |
| A02 | The system automatically replaces unhealthy serving capacity. |
| A03 | The system automatically scales healthy serving capacity. |
| A04 | The system automatically limits admission when demand exceeds a defined safe bound. |
| A05 | The system automatically sheds load or enters a defined degraded mode when capacity is unsafe. |
| A06 | The system automatically rejects an invalid or dangerous request at a boundary. |
| A07 | The system bounds retries for an operation that can call a dependency. |
| A08 | The system enforces a deadline for an operation that can wait on other work. |
| A09 | The system opens a circuit or comparable containment mechanism for an unhealthy dependency path. |
| A10 | The system automatically shifts traffic away from an unhealthy serving or dependency path. |
| A11 | The system automatically renews or rotates credentials before service loss. |

## The operational-control family gives operators a safe response path.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| O01 | The system has a fast manual application-release rollback path. |
| O02 | The system has a fast manual configuration or controlled-state revert path. |
| O03 | The system has an operator-controlled traffic-shift or failover path. |
| O04 | The system has an operator-controlled path to limit or stop a named class of demand. |
| O05 | The system has a kill switch or feature-disable path for harmful behavior. |
| O06 | The system has an operator path to add serving capacity. |
| O07 | The system has an operator path to quarantine an unhealthy resource. |
| O08 | The system has an operator path to enter a defined degraded or dependency-failover mode. |
| O09 | The system has a current runbook for the response path. |
| O10 | The system has a named owner for the response path. |
| O11 | The system has an escalation route for the response path. |
| O12 | The system has evidence that the response path has been exercised. |
| O13 | The system has an operator path to restore or repair persistent state. |

## The architectural family contains a change before it becomes a broad user failure.

| ID | The mitigation is present when the system has this control. |
| --- | --- |
| H01 | The system deploys reproducible, immutable artifacts. |
| H02 | The system declares and pins dependency versions. |
| H03 | The system remains safe when controlled configuration is stale or temporarily unavailable. |
| H04 | The system has redundant serving capacity for its required availability. |
| H05 | The system separates serving capacity across relevant fault domains. |
| H06 | The system keeps required persistent state in redundant or durable storage. |
| H07 | The system isolates workloads or tenants from one another. |
| H08 | The system bounds queue growth. |
| H09 | The system propagates backpressure when downstream work cannot keep up. |
| H10 | The system enforces per-workload resource limits. |
| H11 | The system allocates shared resources fairly among workloads that need isolation. |
| H12 | The system provides a safe degraded response when required work cannot complete. |
| H13 | The system provides a safe alternate or cached response when a dependency cannot complete work. |
| H14 | The system creates recoverable backups or snapshots of persistent state. |
| H15 | The system limits deployment blast radius through cells, partitions, or independent scopes. |
| H16 | The system enforces idempotent processing where an operation can repeat. |
| H17 | The system detects and suppresses duplicate processing where a message or request can repeat. |
| H18 | The system preserves or explicitly rejects unsupported ordering where operations can arrive out of order. |
| H19 | The system prevents unsafe concurrent updates to shared state. |
| H20 | The system enforces least-privilege access for people and workloads. |
| H21 | The system protects secret material from unintended disclosure. |
| H22 | The system protects sensitive data across identified storage and transmission boundaries. |
| H23 | The system applies required retention and deletion controls to persistent data. |
