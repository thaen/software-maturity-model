# The conditional-control rules add controls for a material path.

A vector baseline is the smallest starting set for the stated change. The assessor adds a rule's
controls when the condition is material to the boundary under review and avoids duplicating IDs
already selected by the baseline. The rule does not make every listed control applicable; the
assessor records the path that makes each retained control necessary.

| Condition | The assessor adds these controls when the condition applies. |
| --- | --- |
| Persistent state can change, be lost, or be corrupted. | T08, T11, R05, V05, G05, G07, D13, O13, H06, H14, H16, H17, H18, H19. |
| Capacity or overload can affect the path. | T05, R04, D07, D16, A03, A04, A05, O04, O06, H04, H07, H08, H09, H10, H11, H15. |
| The path needs failover, recovery, or a safe degraded response. | T06, T07, R05, D06, D09, A10, O03, O08, O12, H04, H05, H12, H13. |
| An untrusted request can reach the path. | T09, R09, V09, V10, V11, D08, D15, A06, O05, H20, H21, H22, H23. |
| The path calls or depends on an outside service or resource. | T02, T03, R06, R07, V12, V13, V14, V15, D09, D10, A07, A08, A09, A10, O08, H12, H13. |
| Credentials, identity, certificates, or authorization can change. | R09, V10, V14, V15, G06, D15, A11, H20, H21. |
| Producers and consumers can coexist at different versions. | T03, R07, V12, G05, D10. |
| Configuration state or its propagation can affect behavior. | R02, V03, V04, G02, D11, D12, A01, O02, H03. |
| One tenant or workload can consume shared resources. | T05, D07, A04, A05, O04, H07, H10, H11, H15. |
| The path handles sensitive or regulated data. | R09, D15, H20, H21, H22, H23. |

The rules are a source-independent supplement. A source profile can name a control that is not in
a matching rule, and an assessor can add a control outside these rules with a stated reason.
