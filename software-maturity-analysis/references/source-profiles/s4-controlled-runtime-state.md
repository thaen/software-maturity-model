# Source S4 covers controlled runtime state.

This profile applies to state that changes the behavior or protection of the support boundary
without changing its executable code. It includes configuration, flags, data, schemas, access
policy, partition maps, and credential configuration. It does not include a code change that
reads that state, which is S1.

## The profile distinguishes these controlled-state change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S4.1 | Feature flags, dynamic configuration, limits, quotas, or routing rules change. |
| S4.2 | Schemas, indexes, records, migrations, backfills, or data repairs change. |
| S4.3 | Partition maps, shard assignments, replication settings, or retention rules change. |
| S4.4 | Access policy, authorization mappings, secret references, or credential configuration changes. |
| S4.5 | Certificates, keys, or identity-configuration state changes. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S4.1 | T02, T04, R02, R08, V03, V04, G02, G04, D01, D02, D03, D05, D11, A01, O02, O05, O09, O10, O11, H03 | Add demand, tenant-isolation, or access controls when the state changes them. |
| S4.2 | T02, T08, T11, R02, R05, R07, V05, G04, G05, G07, D01, D02, D03, D12, D13, D14, O02, O09, O10, O11, O13, H06, H14, H16, H17, H18, H19 | Add data-protection and retention controls for sensitive or regulated records. |
| S4.3 | T02, T07, T08, T11, R02, R04, R05, V04, V05, G04, G07, D06, D11, D12, D13, O02, O03, O09, O10, O11, O13, H03, H06, H14, H15 | Add compatibility controls when clients observe the partitioning change. |
| S4.4 | T02, R02, R09, V03, V04, V10, V15, G02, G04, D11, D15, A01, O02, O09, O10, O11, H20, H21, H22, H23 | Add staged rotation controls when an identity or credential changes. |
| S4.5 | T02, R02, R09, V15, G04, G06, D11, D15, A11, O02, O09, O10, O11, H20, H21 | Add provider dependency controls when a certificate or identity authority is external. |

## The expected control profile selects controls for controlled-state safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T02, T04, T08, T11 | Controlled state needs integrated, installed-release, restore, and migration evidence as its vector requires. | Test results, exercises, and migration records. |
| R02, R07, R08, R09 | State changes need peer, compatibility, policy, and security review when they affect users or protection. | Change records and review history. |
| V03, V04, V05, V15 | Configuration syntax, configuration semantics, state compatibility, and credential readiness need validation. | Validators, migration checks, and credential records. |
| G02, G04, G06, G07 | State should move through limited activation, gates, staged rotation, and reversible migration increments. | Flag history, cohort records, and migration plans. |
| D01, D02, D05, D11, D12, D13, D14, D15 | User outcomes, active checks, effective state, drift, integrity, diagnosis, and security actions need observation. | Dashboards, audit records, reconciliation, and traces. |
| A01, A11 | The system should reverse an unsafe state change or renew credentials before it causes service loss where possible. | Revert automation and credential rotation records. |
| O02, O05, O09, O10, O11, O12, O13 | Operators need a state-revert, disable, owned, escalated, exercised, and data-repair path. | Runbooks, owners, incident records, and exercises. |
| H03, H06, H14, H16, H17, H18, H19, H20, H21, H22, H23 | State needs safe stale behavior, durable recovery, correctness semantics, and protection controls by design. | Architecture, storage configuration, access policy, and retention records. |

The assessor may split one source S4 row into separate rows for flags, data, access policy, and
credentials when those classes have different owners or change paths.
