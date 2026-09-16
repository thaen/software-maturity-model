# Source S5 covers infrastructure and platform behavior.

This profile applies to the hosts, containers, storage, networks, name resolution, capacity,
regions, zones, routing topology, operating systems, and managed-platform behavior that support
the system. It covers a consumed resource that changes or fails without being called as an
application dependency. A remote service called by the system is S9.

## The profile distinguishes these infrastructure and platform change vectors.

| Vector | The vector includes these changes. |
| --- | --- |
| S5.1 | Compute capacity, placement, container runtime, or host behavior changes. |
| S5.2 | Storage availability, performance, replication, or durability behavior changes. |
| S5.3 | Network connectivity, routing, name resolution, or certificate-transport behavior changes. |
| S5.4 | Region, zone, fault-domain, or topology availability changes. |
| S5.5 | Managed-platform release, quota, scaling, or control-plane behavior changes. |

## Each change vector selects a small baseline profile.

| Vector | Baseline controls | The agent adds these controls when the path requires them. |
| --- | --- | --- |
| S5.1 | T05, T06, T07, R04, R05, V08, G03, G04, D01, D02, D03, D06, D07, A02, A03, A04, A05, O04, O06, O07, O09, O10, O11, H04, H05, H07, H08, H09, H10, H11, H15 | Add state and recovery controls when compute loss can lose persistent work. |
| S5.2 | T05, T06, T07, T08, R04, R05, V06, G03, G04, D01, D02, D03, D06, D13, A10, O03, O08, O09, O10, O11, O13, H05, H06, H14 | Add migration controls when the storage format or schema changes. |
| S5.3 | T06, T07, R05, V06, G03, G04, D01, D02, D03, D06, A08, A09, A10, O03, O08, O09, O10, O11, H05, H12, H13 | Add certificate and identity controls when the transport trust path changes. |
| S5.4 | T06, T07, T08, R04, R05, V06, G03, G04, D01, D02, D03, D06, A02, A03, A10, O03, O06, O08, O09, O10, O11, O12, H04, H05, H06, H14, H15 | Add workload-containment controls when the fault-domain event can overload survivors. |
| S5.5 | T05, T06, R04, R05, V06, V07, G03, G04, D01, D02, D03, D06, D07, D12, D16, A02, A03, A04, A05, O04, O06, O09, O10, O11, H04, H07, H08, H10, H15 | Add dependency controls when the platform is outside the support boundary. |

## The expected control profile selects controls for infrastructure and platform safety.

| Control set | The controls are selected for this reason. | Typical evidence |
| --- | --- | --- |
| T05, T06, T07, T10 | Capacity, fault, failover, and declaration paths need exercised evidence. | Test results, game-day records, and dry-run output. |
| R03, R04, R05, R08 | Support artifacts and structural changes need peer, capacity, resilience, and policy review. | Change proposals and review records. |
| V06, V07, V08 | Infrastructure declarations, plans, and readiness need validation. | Plan output, readiness checks, and release records. |
| G03, G04 | A topology or platform change needs limited exposure and measured gates when possible. | Change plans, cohorts, and gate signals. |
| D01, D02, D06, D07, D12, D16 | User outcomes, platform health, capacity, drift, and efficiency need observation. | Objectives, dashboards, declarations, and cost records. |
| A02, A03, A04, A05, A08, A09, A10 | The system should replace, scale, protect, contain, or route around unhealthy capacity without waiting for an operator. | Automation rules and response records. |
| O03, O04, O06, O07, O08, O09, O10, O11, O12 | Operators need failover, demand, capacity, quarantine, degradation, and exercised response paths. | Runbooks, owner records, and exercises. |
| H04, H05, H06, H07, H08, H09, H10, H11, H12, H13, H15 | Redundancy, fault isolation, durable state, bounded work, fairness, fallback, and cells contain infrastructure change. | Architecture, topology, resource policy, and storage records. |

The profile does not require multi-region or multi-zone deployment for every service. The
assessor records the required availability, data durability, and fault-domain coverage before it
judges these controls.
