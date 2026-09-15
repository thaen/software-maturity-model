# The source catalog defines how a running system can change.

The catalog separates sources when they call for different controls. A single event can belong to more than one source when it changes more than one part of the support boundary.

## The agent assesses software the team owns under source S1.

Source S1 includes application code, services, jobs, command-line programs, and feature code that the team builds or maintains. It includes a release whose behavior changes when code behind an existing flag is enabled.

## The agent assesses software the team consumes under source S2.

Source S2 includes libraries, frameworks, SDKs, third-party packages, and transitive dependencies that execute in the system process. It does not include a remote service that the system calls, because that is source S9.

## The agent assesses deployed support artifacts under source S3.

Source S3 includes infrastructure declarations, deployment definitions, startup and initialization scripts, scheduled automation, health-check definitions, and build configuration. These artifacts change the assembled running environment without being the application logic.

## The agent assesses controlled runtime state under source S4.

Source S4 includes feature flags, service configuration, data records, schemas, indexes, partition maps, access policies, and credential configuration that the support boundary can change. The agent separates individual state classes when they have different change paths or controls.

## The agent assesses infrastructure and platform behavior under source S5.

Source S5 includes hosts, containers, storage, networks, name resolution, capacity, operating systems, regions, zones, routing topology, and managed platform behavior. It covers a change or failure in a resource that the system consumes without directly invoking it as an application dependency.

## The agent assesses external demand and transport behavior under source S6.

Source S6 includes request rate, connection behavior, traffic distribution, retries, recovery surges, and client behavior that changes demand independently of request meaning. It includes malicious and benign demand.

## The agent assesses external request meaning under source S7.

Source S7 includes payload shape and size, parameter combinations, hot keys, malformed input, expensive operations, and new usage patterns. It concerns what callers ask the system to do at a given volume.

## The agent assesses internal component interactions under source S8.

Source S8 includes calls, queues, replication, control-plane commands, health checks, and coordination among components inside the unit of supportability. It includes timing, duplication, ordering, and compatibility problems that differ from external client traffic.

## The agent assesses external dependencies under source S9.

Source S9 includes remote services, data stores, identity providers, certificate authorities, and external resources outside the support boundary. It covers latency, availability, contract, credential, and semantic changes in those dependencies.

## The agent records the user outcomes that each source can affect.

The agent considers correctness and data integrity, availability and durability, latency and capacity, security and privacy, compatibility, and resource efficiency. Blast radius, reversibility, and change frequency are properties of the change or control coverage rather than user outcomes.
