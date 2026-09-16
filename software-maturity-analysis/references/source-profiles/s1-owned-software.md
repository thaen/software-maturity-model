# Source S1 covers changes to software the team owns.

This profile applies to code and executable behavior that the assessed team builds or maintains.
It includes a release whose behavior changes when code behind an existing control is enabled. It
does not include a change to the control's value, which is S4, or a change to deployment assembly,
which is S3.

## The profile distinguishes these owned-software change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S1.1 | Request, API, business-rule, or algorithm behavior changes. |
| S1.2 | Background-job, worker, scheduler, or batch-processing code changes. |
| S1.3 | Data-access, caching, serialization, or persistent-state handling code changes. |
| S1.4 | Error handling, retry, recovery, or degradation behavior changes. |
| S1.5 | Performance, concurrency, queueing, memory, or resource-use behavior changes. |
| S1.6 | Authorization, secret handling, sensitive-data handling, or audit behavior changes. |
| S1.7 | Generated code, owned models, rulesets, or other executable behavior owned by the team. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S1.1 | T01, T02, T04, R01, V01, V02, V08, G01, G04, D01, D02, D03, D04, D14, A01, O01, O09, O10, O11, H01, H02, H15 | Add capacity, request-boundary, persistent-state, security, or correctness controls for the changed behavior. |
| S1.2 | T01, T02, R01, V01, V02, V08, G01, G04, D01, D02, D03, D04, D14, A01, A07, A08, A09, O01, O09, O10, O11, H01, H15, H16, H17, H18, H19 | Add recovery controls when the worker changes persistent state or failover behavior. |
| S1.3 | T01, T02, T08, T11, R01, R05, R07, V01, V02, V05, G01, G04, G05, G07, D01, D02, D03, D04, D13, D14, A01, O01, O09, O10, O11, O13, H06, H14, H15, H16, H17, H18, H19 | Add access and data-protection controls for sensitive or regulated state. |
| S1.4 | T01, T02, T06, T07, R01, R05, V01, V02, G01, G04, D01, D02, D03, D04, D14, A01, A07, A08, A09, A10, O01, O03, O08, O09, O10, O11, O12, H12, H13 | Add persistent-state recovery controls when the error path can corrupt or lose state. |
| S1.5 | T01, T02, T05, R01, R04, V01, V02, G01, G04, D01, D02, D03, D04, D07, D14, D16, A01, A03, A04, A05, O01, O04, O09, O10, O11, H07, H08, H09, H10, H11, H15 | Add correctness controls when overload can repeat, reorder, or race work. |
| S1.6 | T01, T02, T09, R01, R09, V01, V02, G01, G04, D01, D02, D03, D04, D14, D15, A01, O01, O05, O09, O10, O11, H20, H21, H22, H23 | Add request-boundary controls when the changed code receives untrusted requests. |
| S1.7 | T01, T02, T04, R01, V01, V08, V16, G01, G04, D01, D02, D03, D04, D14, A01, O01, O05, O09, O10, O11, H01, H02, H15 | Add the controls for the behavior class that generated code or a model changes. |

## The expected control profile selects controls for code-change safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T01, T02, T04, T05, T09 | Owned behavior needs focused, integrated, installed-release, capacity, and boundary testing as the path requires. | Test definitions, results, and release checks. |
| R01, R04, R05, R08, R09 | Code changes need peer review, and structural, policy, or security review when their vector makes it relevant. | Review records and change proposals. |
| V01, V02, V08, V16 | A releasable build needs traceability, static checks, readiness validation, and verified inputs. | Build records, analysis output, and readiness gates. |
| G01, G04 | A new executable should receive limited exposure and measured gating when its user impact is material. | Release plans, cohort records, and gate signals. |
| D01, D02, D03, D04, D05, D14, D16 | User outcomes, release regressions, active checks, diagnostic context, and efficiency need detection. | Objectives, dashboards, alerts, traces, and cost records. |
| A01, A04, A05, A07, A08, A09 | The service should contain unsafe code behavior through reversal, load protection, and dependency containment where relevant. | Rollback rules and runtime configuration. |
| O01, O04, O05, O09, O10, O11, O12 | Operators need a rollback, demand-control, disable, ownership, escalation, and exercised response path. | Runbooks, ownership records, exercises, and incident records. |
| H01, H02, H12, H15, H16, H17, H18, H19, H20, H21, H22 | Code paths can need artifact control, isolation, safe degradation, correctness semantics, and data protection by design. | Architecture records, source, policies, and system configuration. |

The assessor removes controls that do not fit the changed code path and records the reason. For
example, a pure formatting change may not need capacity testing, while a payment mutation needs
the persistent-state and correctness controls in this profile.
