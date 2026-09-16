# Source S2 covers changes to software the system consumes.

This profile applies to libraries, frameworks, SDKs, language runtimes, plugins, and transitive
packages that execute in the system process. It does not cover a remote service that the system
calls, which is S9, or the declaration that assembles an installed image, which is S3.

## The profile distinguishes these consumed-software change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S2.1 | A direct library, framework, SDK, or plugin version changes. |
| S2.2 | A transitive package, runtime, or generated dependency version changes. |
| S2.3 | A compatibility, behavior, performance, or resource-use change occurs in consumed code. |
| S2.4 | A consumed package changes its security, provenance, or licensing properties. |
| S2.5 | A runtime extension, agent, or in-process integration changes its behavior. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S2.1 | T02, T03, T04, R01, R06, R07, V01, V12, V16, G01, G04, D01, D02, D04, D14, A01, O01, O09, O10, O11, H01, H02 | Add dependency containment when the library calls external services or changes persistent state. |
| S2.2 | T02, T03, R06, V01, V12, V16, G01, G04, D01, D02, D04, D14, A01, O01, O09, O10, O11, H01, H02 | Add installed-release testing when transitive behavior cannot be isolated in lower-level tests. |
| S2.3 | T02, T03, T05, R04, R06, V01, V12, G01, G04, D01, D02, D04, D07, D14, D16, A01, A07, A08, A09, O01, O09, O10, O11, H07, H08, H09 | Add failover or recovery controls when behavior changes a serving or state path. |
| S2.4 | T02, R06, R09, V01, V16, G01, G04, D01, D02, D04, D15, O01, O09, O10, O11, H01, H02, H20, H21, H22 | Add privacy controls when the package can process sensitive data. |
| S2.5 | T02, T03, T04, R01, R06, V01, V12, V16, G01, G04, D01, D02, D04, D14, A01, O01, O09, O10, O11, H01, H02 | Add the controls for the interaction or workload behavior that the extension changes. |

## The expected control profile selects controls for consumed-software safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T02, T03, T04, T06 | Consumed code needs integrated, contract, installed-release, and fault-path evidence where its behavior is material. | Test results, contract suites, and release checks. |
| R01, R06, R07, R08, R09 | Version changes need peer, dependency, compatibility, policy, and security review as their scope requires. | Dependency-change records and review history. |
| V01, V02, V12, V13, V14, V15, V16 | The build, interfaces, dependency access, credentials, and package integrity need verification. | Dependency declarations, build records, compatibility checks, and provenance records. |
| G01, G04, G05 | A dependency release should receive limited exposure, measured gates, and ordered rollout when consumers differ. | Release cohorts and rollout records. |
| D01, D02, D04, D09, D10, D14, D15 | User outcomes, release effects, dependency behavior, diagnosis, and access events need detection. | Dashboards, alerts, traces, and audit records. |
| A01, A07, A08, A09, A10 | The system should reverse unsafe versions and contain or route around bad dependency behavior where possible. | Rollback records and runtime resilience configuration. |
| O01, O08, O09, O10, O11, O12 | Operators need a release rollback, dependency-failover, documented, owned, escalated, and exercised path. | Runbooks, owner records, and exercise evidence. |
| H01, H02, H07, H12, H13, H20, H21, H22 | Immutable assembly, version declaration, isolation, fallback, access, secret, and data protections can limit harm. | Artifact policy, architecture records, and access configuration. |

The assessor classifies a base image or deployment manifest under S3 when its assembled artifact,
rather than its in-process library behavior, is the changed support-boundary element.
