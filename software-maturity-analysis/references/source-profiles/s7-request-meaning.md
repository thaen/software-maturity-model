# Source S7 covers external request meaning.

This profile applies when a request's content, operation, or semantic combination changes the
work that the system performs. It differs from S6, which concerns rate and transport behavior
without regard to request meaning.

## The profile distinguishes these request-meaning change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S7.1 | A request has an invalid, malformed, oversized, deeply nested, or unsupported structure. |
| S7.2 | A parameter, query shape, filter, aggregation, or operation has an unsafe cost. |
| S7.3 | A request targets a hot key, tenant, partition, or other skewed resource. |
| S7.4 | A request presents an unsupported version, combination of fields, or compatibility state. |
| S7.5 | A request repeats, reorders, races, or replays an operation with persistent effects. |
| S7.6 | A request crosses an authorization, privacy, retention, or policy boundary. |
| S7.7 | A new client usage pattern changes semantic assumptions without changing aggregate demand. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S7.1 | T09, V09, V11, D01, D02, D03, D08, D14, A06, O05, O09, O10, O11, H12 | Add authorization and audit controls when malformed requests can cross a protection boundary. |
| S7.2 | T05, T09, V11, D01, D02, D03, D08, D14, D16, A04, A05, O04, O09, O10, O11, H07, H08, H09, H10, H11, H12 | Add tenant isolation when a costly operation can consume shared capacity. |
| S7.3 | T05, T09, V11, D01, D02, D03, D08, D14, A04, A05, O04, O09, O10, O11, H07, H10, H11, H15 | Add partition and cell controls when a hot target has a broad blast radius. |
| S7.4 | T03, T09, R07, V09, V11, D01, D02, D03, D08, D14, A06, O05, O09, O10, O11, H12 | Add ordered rollout controls when versions must coexist. |
| S7.5 | T02, T09, D01, D02, D03, D14, A06, O09, O10, O11, H16, H17, H18, H19 | Add persistent-state recovery controls when repeated work can cause data loss or corruption. |
| S7.6 | T09, R09, V09, V10, V11, D01, D02, D03, D14, D15, A06, O05, O09, O10, O11, H20, H21, H22, H23 | Add compatibility controls when protection policy changes affect existing clients. |
| S7.7 | T02, T09, R07, V09, V11, D01, D02, D03, D08, D14, D16, A04, A05, O04, O05, O09, O10, O11, H07, H12 | Add the controls for each concrete request behavior the new usage exposes. |

## The expected control profile selects controls for request-meaning safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T02, T09 | Request behavior needs integrated and negative-path evidence where it can reach state or dependencies. | Integration suites, boundary tests, and results. |
| R07, R09 | Interface and protection changes need compatibility and security or privacy review. | Interface proposals and review records. |
| V09, V10, V11 | The boundary needs structural, authorization, and semantic validation. | Boundary code, schemas, policies, and test results. |
| D01, D02, D03, D08, D14, D15, D16 | User outcomes, alerts, abusive patterns, diagnosis, audit activity, and efficiency need observation. | Dashboards, traces, audit records, and cost signals. |
| A04, A05, A06 | The system should limit admission, shed unsafe work, or reject dangerous requests. | Admission policy and request-handling configuration. |
| O04, O05, O09, O10, O11, O12 | Operators need demand, disable, documented, owned, escalated, and exercised response paths. | Runbooks, ownership records, and exercises. |
| H07, H08, H09, H10, H11, H12, H16, H17, H18, H19, H20, H21, H22, H23 | Isolation, bounded work, safe behavior, correctness semantics, access, data, and retention controls limit request harm. | Architecture, source, policies, and data-handling records. |

The assessor treats a request as both S6 and S7 when its arrival rate and its meaning each need
different controls.
