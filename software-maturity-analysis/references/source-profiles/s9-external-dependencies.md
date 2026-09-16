# Source S9 covers external dependencies.

This profile applies to remote services, data stores, identity providers, certificate authorities,
and other resources outside the unit of supportability. It covers availability, latency, contract,
credential, data, and semantic changes in those dependencies. It does not cover an in-process
library, which is S2.

## The profile distinguishes these external-dependency change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S9.1 | A dependency becomes unavailable, slow, overloaded, or intermittently reachable. |
| S9.2 | A dependency changes an API, protocol, schema, version, response, or error contract. |
| S9.3 | A dependency changes rate limits, quotas, pricing, capacity, or traffic policy. |
| S9.4 | A dependency changes credentials, permissions, certificates, identity, or trust behavior. |
| S9.5 | A dependency returns stale, incomplete, inconsistent, or semantically changed data. |
| S9.6 | A dependency migration, regional event, or recovery event changes its serving behavior. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S9.1 | T02, T03, T06, T07, R05, R06, V12, V13, V14, V15, D01, D02, D03, D05, D09, D14, A07, A08, A09, A10, O03, O08, O09, O10, O11, O12, H07, H12, H13 | Add data repair and recovery evidence when the dependency owns state that the system must recover. |
| S9.2 | T02, T03, R06, R07, V12, G01, G04, G05, D01, D02, D03, D05, D09, D10, D14, A01, A07, A08, A09, O01, O08, O09, O10, O11, H12, H13 | Add data-protection or state-migration controls when the contract carries persistent or sensitive data. |
| S9.3 | T05, T06, R04, R06, V13, G04, D01, D02, D03, D07, D09, D14, D16, A04, A05, A07, A08, A09, O04, O08, O09, O10, O11, H07, H08, H09, H10, H12, H13 | Add traffic shifting when an alternate dependency or serving path exists. |
| S9.4 | T02, R06, R09, V14, V15, G04, G06, D09, D15, A11, O08, O09, O10, O11, H20, H21 | Add fallback or escalation controls when the dependency cannot rotate without a client change. |
| S9.5 | T02, T03, T08, R05, R06, R07, V12, D01, D02, D03, D09, D10, D13, D14, O08, O09, O10, O11, O13, H12, H13, H16, H17, H18, H19 | Add retention and protection controls when returned data is sensitive or regulated. |
| S9.6 | T02, T03, T06, T07, T08, R05, R06, R07, V12, V13, G01, G04, G05, G06, G07, D01, D02, D03, D05, D09, D10, D13, D14, A07, A08, A09, A10, O03, O08, O09, O10, O11, O12, O13, H12, H13 | Add provider-guarantee evidence when the event can affect durable data or regional recovery. |

## The expected control profile selects controls for external-dependency safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T02, T03, T06, T07, T08 | Dependencies need integration, contract, fault, failover, and recovery evidence as their paths require. | Test results, contract suites, and exercise records. |
| R05, R06, R07, R08, R09 | Dependency, version, compatibility, policy, and security review apply to material external paths. | Dependency records and review history. |
| V12, V13, V14, V15, V16 | Interfaces, reachability, permission, credentials, and integration integrity need validation. | Compatibility checks, connection checks, and provenance records. |
| G01, G04, G05, G06, G07 | Releases, compatibility shifts, credential rotation, and state migration need limited exposure and safe progression. | Rollout, rotation, and migration records. |
| D01, D02, D03, D05, D09, D10, D13, D14, D15 | Outcomes, alerts, active probes, dependency behavior, integrity, diagnosis, and audit events need observation. | Objectives, dashboards, probes, traces, and audit records. |
| A07, A08, A09, A10, A11 | Retries, deadlines, circuit containment, traffic shifts, and credential renewal limit dependency harm. | Client configuration and automation records. |
| O03, O08, O09, O10, O11, O12, O13 | Operators need failover, degraded operation, documentation, ownership, escalation, exercises, and data repair. | Runbooks, owners, and incident records. |
| H06, H07, H12, H13, H14, H16, H17, H18, H19, H20, H21, H22, H23 | Durable state, isolation, fallback, recovery, correctness, and protection controls limit external dependency impact. | Architecture, storage, policy, and response records. |

## The profile distinguishes client controls from provider guarantees.

The agent assesses client-owned controls, such as deadlines, retries, circuit containment,
fallback, interface validation, dependency monitoring, and an operator response path, directly.
It treats a provider's durability, backup, repair, retention, or regional-recovery capability as
a guarantee that needs supplied contract, architecture, or exercise evidence. The agent records
such a guarantee as unknown when that evidence is unavailable; it does not claim that the client
implements the provider's control.

The agent excludes a provider control only when the support-boundary statement says that the
service does not rely on the capability for an in-scope user outcome. A dependency responsibility
record names the provider, client, needed guarantee, evidence source, owner, and escalation path.

The assessor creates separate rows for each caller when the same dependency has different
timeouts, fallbacks, credentials, data semantics, or user outcomes for different callers.
