# Source S3 covers deployed support artifacts.

This profile applies to declarations and automation that assemble, deploy, start, schedule, or
health-check the system without being its application logic. It does not cover effective runtime
configuration or data values, which are S4, or underlying platform behavior, which is S5.

## The profile distinguishes these deployed-artifact change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S3.1 | Build, package, image, or artifact-assembly definitions change. |
| S3.2 | Deployment manifests, release workflows, startup scripts, or initialization automation change. |
| S3.3 | Scheduling, scaling, health-check, or service-discovery declarations change. |
| S3.4 | Infrastructure-as-code, topology declarations, or bootstrap automation change. |
| S3.5 | Build or deployment identity, permission, or artifact-provenance configuration changes. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S3.1 | T10, R03, V01, V16, G01, G04, D04, D12, O01, O09, O10, O11, H01, H15 | Add capacity or topology controls when assembly changes resource placement or scale. |
| S3.2 | T10, R03, V07, V08, G01, G04, D04, D12, D14, A01, O01, O09, O10, O11, O12, H01, H15 | Add failover and degradation controls when startup or release automation controls a serving path. |
| S3.3 | T07, T10, R03, R04, R05, V06, V08, G03, G04, D04, D06, D12, A02, A03, O06, O07, O09, O10, O11, H04, H05, H15 | Add workload isolation and overload controls when health or scaling changes shared capacity. |
| S3.4 | T10, R03, R04, R05, V06, V07, G03, G04, D06, D12, A01, A10, O01, O03, O09, O10, O11, H04, H05, H15 | Add durable-state controls when the declaration changes storage or replication. |
| S3.5 | T10, R03, R08, R09, V16, G01, G04, D04, D12, D15, O01, O09, O10, O11, H01, H20, H21 | Add credential rotation controls when deployment identity changes. |

## The expected control profile selects controls for deployed-artifact safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T07, T10 | A support artifact needs failover evidence when it controls serving paths and dry-run evidence before it changes an environment. | Exercise records, plans, and dry-run output. |
| R03, R04, R05, R08 | Deployment and infrastructure artifacts need peer, capacity, resilience, and policy review as their scope requires. | Change reviews and infrastructure proposals. |
| V06, V07, V08, V16 | Declarations, plans, readiness, and input integrity need validation before deployment. | Validation output, release records, and provenance data. |
| G03, G04 | Infrastructure or topology changes need limited exposure and measured gates when their blast radius is material. | Cohort records, change windows, and gate signals. |
| D04, D06, D12, D14 | Release effects, platform health, deployment drift, and diagnostic context need observation. | Deployment-aware dashboards, configuration records, and traces. |
| A01, A02, A03, A10 | The system should reverse unsafe artifacts, restore capacity, or route away from an unsafe path where possible. | Automation rules and response history. |
| O01, O06, O07, O09, O10, O11, O12 | Operators need rollback, capacity, quarantine, documented, owned, escalated, and exercised paths. | Runbooks, records, and exercise evidence. |
| H01, H04, H05, H15 | Immutable artifacts, redundant capacity, fault-domain separation, and bounded deployment scope contain an artifact change. | Artifact policy, topology records, and deployment configuration. |

The assessor places a managed-platform outage under S5 even when an S3 artifact selected the
platform resource that later failed.
