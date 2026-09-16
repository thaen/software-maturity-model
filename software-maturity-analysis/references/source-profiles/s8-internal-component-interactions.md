# Source S8 covers internal component interactions.

This profile applies to calls, messages, replication, coordination, control-plane commands, and
health checks among components inside the unit of supportability. It does not cover a call to a
service outside that boundary, which is S9.

## The profile distinguishes these internal-interaction change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S8.1 | A synchronous call, fanout, or service-to-service request path changes behavior. |
| S8.2 | A queue, stream, event, or scheduled asynchronous path changes timing or delivery behavior. |
| S8.3 | Replication, caching, consistency, ordering, duplication, or replay behavior changes. |
| S8.4 | Producer and consumer versions become incompatible or roll out in a different order. |
| S8.5 | Health checks, leader election, coordination, or control-plane commands behave differently. |
| S8.6 | An internal workload becomes saturated and propagates delay or failure to another component. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S8.1 | T02, T03, T06, R05, R07, V12, G04, G05, D01, D02, D03, D09, D10, D14, A07, A08, A09, A10, O03, O08, O09, O10, O11, H12, H13 | Add recovery and durable-state controls when the call performs a state mutation. |
| S8.2 | T02, T03, T05, T06, R04, R05, R07, V12, G04, G05, D01, D02, D03, D07, D09, D14, A07, A08, A09, O08, O09, O10, O11, H07, H08, H09, H10, H16, H17, H18, H19 | Add a replay and data-repair path when messages have persistent effects. |
| S8.3 | T02, T03, T07, T08, R05, R07, V12, G04, G05, D01, D02, D03, D10, D13, D14, O03, O09, O10, O11, O13, H06, H14, H16, H17, H18, H19 | Add data-protection controls when replication or caching handles sensitive data. |
| S8.4 | T03, R07, V12, G04, G05, D01, D02, D03, D10, D14, O08, O09, O10, O11, H12, H13 | Add a compatibility test across every producer and consumer version in scope. |
| S8.5 | T06, T07, R05, V08, G04, D01, D02, D03, D06, D14, A10, O03, O08, O09, O10, O11, O12, H04, H05, H12 | Add durable-state recovery when the coordination path protects persistent assignments or state. |
| S8.6 | T05, T06, R04, V08, D01, D02, D03, D07, D14, A03, A04, A05, A07, A08, A09, O04, O08, O09, O10, O11, H07, H08, H09, H10, H11, H12 | Add traffic shifting when the saturated path has independent serving alternatives. |

## The expected control profile selects controls for internal-interaction safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T02, T03, T05, T06, T07, T08 | Internal paths need integration, contract, load, fault, failover, and recovery evidence as their vector requires. | Test results and exercise records. |
| R04, R05, R07, R08 | Capacity, resilience, compatibility, and high-impact change review apply to material interaction paths. | Architecture proposals and review records. |
| V08, V12 | Serving readiness and interface compatibility need validation before normal traffic. | Readiness gates and compatibility checks. |
| G04, G05 | Measured gates and ordered producer-consumer rollout contain compatibility changes. | Rollout plans and gate records. |
| D01, D02, D03, D05, D09, D10, D13, D14 | Outcomes, alerts, probes, dependency behavior, integrity, and request diagnosis need observation. | Objectives, dashboards, traces, and reconciliation records. |
| A07, A08, A09, A10 | Retries, deadlines, circuit containment, and traffic shifts protect interaction paths. | Client configuration and automation records. |
| O03, O08, O09, O10, O11, O12, O13 | Operators need failover, degraded operation, documentation, ownership, escalation, exercises, and data repair. | Runbooks, owners, and exercise records. |
| H06, H07, H08, H09, H10, H11, H12, H13, H16, H17, H18, H19 | Durable state, isolation, bounded work, fallback, and correctness semantics contain internal propagation. | Architecture records, queues, and state-handling code. |

The assessor separates caller and callee rows when they have different owners, evidence, or
control paths, even when they participate in the same interaction.
