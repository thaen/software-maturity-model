# The source-profile index classifies changes before controls are assessed.

Each source profile defines one high-level source of change, its child change vectors, and a
default expected control profile. The default is tailored to a component or interface before it
becomes assessment rows. One event can belong to more than one profile when it changes more than
one part of the support boundary.

| Source | The agent uses this profile when the material change is in this area. |
| --- | --- |
| [S1](s1-owned-software.md) | The team-owned code or executable behavior changes. |
| [S2](s2-consumed-software.md) | In-process software that the system adopts changes. |
| [S3](s3-deployed-support-artifacts.md) | The artifacts that assemble, deploy, or start the system change. |
| [S4](s4-controlled-runtime-state.md) | Controlled configuration, data, policy, or credential state changes. |
| [S5](s5-infrastructure-and-platform.md) | The infrastructure or platform that runs the system changes. |
| [S6](s6-demand-and-transport.md) | External demand or transport behavior changes. |
| [S7](s7-request-meaning.md) | The meaning, shape, or cost of an external request changes. |
| [S8](s8-internal-component-interactions.md) | Components inside the support boundary interact differently. |
| [S9](s9-external-dependencies.md) | A service or resource outside the support boundary changes. |

The profiles are a bounded taxonomy, not a claim that the listed examples exhaust every event.
The agent adds a child vector when needed, retains the parent source ID, and records why the new
vector has a distinct control path.
