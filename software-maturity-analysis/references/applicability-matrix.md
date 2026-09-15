# The applicability matrix selects the controls that normally matter.

The matrix is a default work list, not a claim that every control applies to every system. The agent starts with the listed controls, adds a control when the system has a material path that the matrix does not cover, and gives a reason for each not-applicable result.

## Source S1 has controls for owned software changes.

The agent assesses T01, T02, T04, T05, T08, R01, R05, V01, V06, G01, G04, D01, D02, D03, A01, O01, O04, O07, O08, H01, and H08.

## Source S2 has controls for consumed software changes.

The agent assesses T02, T03, R01, R03, V01, V07, G01, G04, D01, D02, A01, O01, O07, O08, H01, H04, and H06.

## Source S3 has controls for deployed support-artifact changes.

The agent assesses T08, R01, R05, V04, V06, G03, G04, D02, D04, A01, A02, O01, O05, O07, O08, H01, and H08.

## Source S4 has controls for controlled runtime-state changes.

The agent assesses T02, T04, R01, R05, V02, V03, G02, G04, G06, D01, D03, D08, D09, A01, A07, O01, O04, O07, O08, H02, and H07.

## Source S5 has controls for infrastructure and platform changes.

The agent assesses T05, T06, R02, V04, V06, G03, G04, D04, D05, A02, A03, A06, O02, O05, O07, O08, H03, H04, H05, H06, and H08.

## Source S6 has controls for external demand and transport changes.

The agent assesses T05, T06, D01, D05, A03, O02, O03, O07, O08, H03, H04, and H05.

## Source S7 has controls for external request-meaning changes.

The agent assesses T07, V05, D01, D06, A04, O03, O04, O07, O08, H04, and H05.

## Source S8 has controls for internal component interactions.

The agent assesses T02, T03, T05, T06, R04, V07, G04, G05, D01, D03, D07, A05, A06, O02, O06, O07, O08, H04, H05, and H06.

## Source S9 has controls for external dependency changes.

The agent assesses T02, T03, T06, R03, R04, V07, V08, G01, G06, D07, A05, A07, O06, O07, O08, H04, H06, and H07.

## The agent accounts for user outcomes within each selected row.

The agent marks the outcome dimensions that a control covers: correctness and data integrity, availability and durability, latency and capacity, security and privacy, compatibility, or resource efficiency. The agent records a control as partial when it covers only some required components, workloads, failure domains, or outcome dimensions.
