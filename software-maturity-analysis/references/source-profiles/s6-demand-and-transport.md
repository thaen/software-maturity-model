# Source S6 covers external demand and transport behavior.

This profile applies when demand changes independently of what requests mean. It includes benign
and malicious traffic. It does not cover a payload, operation, or parameter combination that
makes one request expensive or unsafe, which is S7.

## The profile distinguishes these demand and transport change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S6.1 | Sustained request-rate, concurrency, or connection-count growth occurs. |
| S6.2 | A burst, retry storm, recovery surge, or thundering herd occurs. |
| S6.3 | Traffic distribution becomes skewed across tenants, keys, regions, or serving paths. |
| S6.4 | Connection lifetime, protocol behavior, retransmission, or transport churn changes. |
| S6.5 | A client population changes retry, timeout, caching, or reconnect behavior. |
| S6.6 | Abusive or denial-of-service demand changes the load on the service. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S6.1 | T05, D01, D02, D03, D07, D14, A03, A04, A05, O04, O09, O10, O11, H04, H07, H08, H09, H10, H11, H12 | Add cost monitoring and manual traffic shifting for sustained growth that can exceed planned capacity. |
| S6.2 | T05, T06, D01, D02, D03, D07, A04, A05, O04, O09, O10, O11, O12, H07, H08, H09, H10, H12 | Add retry and idempotency controls when the surge can repeat work. |
| S6.3 | T05, D01, D02, D03, D07, D14, A03, A04, A05, O03, O04, O09, O10, O11, H04, H07, H10, H11 | Add cells or partitions when skew can produce a broad blast radius. |
| S6.4 | T05, T06, D01, D02, D03, D07, A04, A05, O04, O09, O10, O11, H08, H09, H10, H12 | Add deadline and connection-containment controls when transport waits on downstream work. |
| S6.5 | T05, T06, D01, D02, D03, D07, A04, A05, O04, O09, O10, O11, H08, H09, H10, H12, H16, H17 | Add client-specific compatibility controls when retry behavior is an interface contract. |
| S6.6 | T05, T06, D01, D02, D03, D07, D08, D14, A04, A05, O04, O09, O10, O11, H07, H08, H09, H10, H11, H12 | Add security review and audit controls when abusive traffic has a security dimension. |

## The expected control profile selects controls for demand and transport safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T05, T06 | Demand protection needs capacity and overload-fault evidence. | Load-test results and overload exercises. |
| D01, D02, D03, D05, D07, D14, D16 | Objectives, user outcomes, alerts, probes, demand, diagnosis, and efficiency need observation. | Objectives, dashboards, alerts, traces, and cost records. |
| A03, A04, A05 | The system should scale, limit admission, or shed load when demand exceeds safe bounds. | Autoscaling and overload-control configuration. |
| O03, O04, O09, O10, O11, O12 | Operators need traffic, demand, documented, owned, escalated, and exercised response paths. | Runbooks, owner records, and exercises. |
| H04, H07, H08, H09, H10, H11, H12, H16, H17, H18, H19 | Redundancy, workload isolation, bounded work, fairness, degradation, and correctness semantics contain overload. | Architecture, resource policy, queues, and request-handling code. |

The assessor records the workload class and the expected demand bound before judging a rate,
capacity, or fairness control as absent or partial.
